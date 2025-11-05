const express = require('express');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { authMiddleware, roleGuard } = require('../middlewares/auth.middleware');

const router = express.Router();

// Marca last_seen del usuario autenticado
router.post('/ping', authMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE Usuarios SET last_seen = NOW() WHERE id_usuario = ?', [req.user.id_usuario]);
    res.json({ ok: true, at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista usuarios con estado online/offline (solo ADMIN)
router.get('/online', authMiddleware, roleGuard('ADMIN'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id_usuario, u.nombre, u.email, r.nombre_rol AS rol,
              u.last_seen,
              (u.last_seen IS NOT NULL AND TIMESTAMPDIFF(SECOND, u.last_seen, NOW()) < 120) AS online
         FROM Usuarios u
         JOIN Roles r ON r.id_rol = u.id_rol
         ORDER BY online DESC, r.nombre_rol, u.nombre`
    );
    const empleados = rows.filter(r => ['ADMIN','CAJERO','COCINERO'].includes(r.rol));
    const clientes  = rows.filter(r => r.rol === 'CLIENTE');
    res.json({ empleados, clientes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// Listar todos los usuarios con su rol
router.get('/', authMiddleware, roleGuard('ADMIN'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id_usuario, u.nombre, u.email, u.activo, u.last_seen,
              r.nombre_rol AS rol
         FROM Usuarios u
         JOIN Roles r ON r.id_rol = u.id_rol
         ORDER BY r.nombre_rol, u.nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear usuario (ADMIN)
router.post('/', authMiddleware, roleGuard('ADMIN'), async (req, res) => {
  try {
    const { nombre, email, password, contrasena, rol } = req.body;
    const pass = password || contrasena;
    if (!nombre || !email || !pass || !rol) {
      return res.status(400).json({ error: 'nombre, email, rol y contraseña son requeridos' });
    }
    const allowed = ['ADMIN', 'CAJERO', 'COCINERO'];
    const wanted = String(rol).toUpperCase();
    if (!allowed.includes(wanted)) {
      return res.status(400).json({ error: 'Rol no permitido' });
    }
    const [exists] = await db.query('SELECT 1 FROM Usuarios WHERE email = ? LIMIT 1', [email]);
    if (exists.length > 0) {
      return res.status(409).json({ error: 'El correo ya está en uso' });
    }
    const [[roleRow]] = await db.query('SELECT id_rol FROM Roles WHERE nombre_rol = ? LIMIT 1', [wanted]);
    if (!roleRow) return res.status(400).json({ error: 'Rol no configurado en BD' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pass, salt);
    const [result] = await db.query(
      'INSERT INTO Usuarios (id_rol, nombre, email, contrasena_hash, activo) VALUES (?, ?, ?, ?, 1)',
      [roleRow.id_rol, nombre, email, hash]
    );
    res.status(201).json({ id_usuario: result.insertId, nombre, email, rol: wanted, activo: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar usuario (ADMIN)
router.put('/:id', authMiddleware, roleGuard('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, password, contrasena, activo } = req.body;
    // obtener usuario
    const [[current]] = await db.query('SELECT * FROM Usuarios WHERE id_usuario = ? LIMIT 1', [id]);
    if (!current) return res.status(404).json({ error: 'Usuario no encontrado' });

    const updates = [];
    const params = [];

    if (nombre) { updates.push('nombre = ?'); params.push(nombre); }
    if (email) {
      // verificar duplicado
      const [dupes] = await db.query('SELECT 1 FROM Usuarios WHERE email = ? AND id_usuario <> ? LIMIT 1', [email, id]);
      if (dupes.length > 0) return res.status(409).json({ error: 'El correo ya está en uso' });
      updates.push('email = ?'); params.push(email);
    }
    if (typeof activo !== 'undefined') { updates.push('activo = ?'); params.push(!!activo ? 1 : 0); }
    if (rol) {
      const allowed = ['ADMIN', 'CAJERO', 'COCINERO'];
      const wanted = String(rol).toUpperCase();
      if (!allowed.includes(wanted)) return res.status(400).json({ error: 'Rol no permitido' });
      const [[roleRow]] = await db.query('SELECT id_rol FROM Roles WHERE nombre_rol = ? LIMIT 1', [wanted]);
      if (!roleRow) return res.status(400).json({ error: 'Rol no configurado en BD' });
      updates.push('id_rol = ?'); params.push(roleRow.id_rol);
    }
    const pass = password || contrasena;
    if (pass) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(pass, salt);
      updates.push('contrasena_hash = ?'); params.push(hash);
    }

    if (updates.length === 0) return res.json({ ok: true });
    const sql = `UPDATE Usuarios SET ${updates.join(', ')} WHERE id_usuario = ?`;
    params.push(id);
    await db.query(sql, params);

    // devolver usuario actualizado con rol por nombre
    const [[row]] = await db.query(
      `SELECT u.id_usuario, u.nombre, u.email, u.activo, r.nombre_rol AS rol
         FROM Usuarios u JOIN Roles r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = ?`,
      [id]
    );
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Desactivar usuario (ADMIN) -> soft delete
router.delete('/:id', authMiddleware, roleGuard('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    // no permitir que un admin se desactive a sí mismo
    if (Number(id) === Number(req.user.id_usuario)) {
      return res.status(400).json({ error: 'No puedes desactivar tu propio usuario' });
    }
    await db.query('UPDATE Usuarios SET activo = 0 WHERE id_usuario = ?', [id]);
    res.json({ ok: true, message: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar usuario permanentemente (ADMIN) -> hard delete con reorganización completa de IDs
router.delete('/:id/permanent', authMiddleware, roleGuard('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    // no permitir que un admin se elimine a sí mismo
    if (Number(id) === Number(req.user.id_usuario)) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }
    
    // Verificar que el usuario existe
    const [[user]] = await db.query('SELECT nombre FROM Usuarios WHERE id_usuario = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Iniciar transacción para mantener integridad de datos
    await db.query('START TRANSACTION');
    
    try {
      // Eliminar el usuario
      await db.query('DELETE FROM Usuarios WHERE id_usuario = ?', [id]);
      
      // Reorganizar todos los IDs empezando desde 1
      // Primero obtener todos los usuarios ordenados
      const [usuarios] = await db.query('SELECT id_usuario FROM Usuarios ORDER BY id_usuario ASC');
      
      // Renumerar todos los usuarios secuencialmente desde 1
      for (let i = 0; i < usuarios.length; i++) {
        const nuevoId = i + 1;
        const viejoId = usuarios[i].id_usuario;
        if (nuevoId !== viejoId) {
          // Usar un ID temporal negativo para evitar conflictos de clave primaria
          await db.query('UPDATE Usuarios SET id_usuario = ? WHERE id_usuario = ?', [-viejoId, viejoId]);
        }
      }
      
      // Ahora actualizar los IDs temporales a los finales
      for (let i = 0; i < usuarios.length; i++) {
        const nuevoId = i + 1;
        const viejoId = usuarios[i].id_usuario;
        if (nuevoId !== viejoId) {
          await db.query('UPDATE Usuarios SET id_usuario = ? WHERE id_usuario = ?', [nuevoId, -viejoId]);
        }
      }
      
      // Resetear el auto_increment al siguiente valor
      const nextId = usuarios.length + 1;
      await db.query(`ALTER TABLE Usuarios AUTO_INCREMENT = ?`, [nextId]);
      
      await db.query('COMMIT');
      
      res.json({ 
        ok: true, 
        message: `Usuario ${user.nombre} eliminado. IDs reorganizados del 1 al ${usuarios.length}` 
      });
    } catch (txErr) {
      // Si hay error, revertir cambios
      await db.query('ROLLBACK');
      throw txErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
