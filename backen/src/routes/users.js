const express = require('express');
const db = require('../config/database');
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
