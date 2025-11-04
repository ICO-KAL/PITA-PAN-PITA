const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'verysecret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

class AuthService {
  async ensureDefaultRole() {
    // Asegurar que exista un rol por defecto para clientes
    const [rows] = await db.query("SELECT id_rol FROM Roles WHERE nombre_rol = 'CLIENTE' LIMIT 1");
    if (rows.length === 0) {
      const [res] = await db.query('INSERT INTO Roles (nombre_rol) VALUES (?)', ['CLIENTE']);
      return res.insertId;
    }
    return rows[0].id_rol;
  }

  async register({ nombre, email, contrasena }) {
    if (!nombre || !email || !contrasena) {
      throw new Error('Nombre, email y contraseña son requeridos');
    }

    // verificar si email existe
    const [existing] = await db.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new Error('El correo ya está en uso');
    }

    const id_rol = await this.ensureDefaultRole();
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contrasena, salt);

    const [result] = await db.query(
      'INSERT INTO Usuarios (id_rol, nombre, email, contrasena_hash, activo) VALUES (?, ?, ?, ?, ?)',
      [id_rol, nombre, email, hash, 1]
    );

    // Obtener nombre del rol para el token
    const [[roleRow]] = await db.query('SELECT nombre_rol FROM Roles WHERE id_rol = ?', [id_rol]);
    const rolNombre = roleRow?.nombre_rol || 'CLIENTE';

    const user = { id_usuario: result.insertId, id_rol, nombre, email, rol: rolNombre };
    const token = jwt.sign({ id_usuario: user.id_usuario, rol: rolNombre, nombre: user.nombre }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return { user, token };
  }

  async registerWithRole({ nombre, email, contrasena, roleName }) {
    if (!nombre || !email || !contrasena) {
      throw new Error('Nombre, email y contraseña son requeridos');
    }
  const allowed = ['ADMIN', 'CAJERO', 'COCINERO'];
  const wanted = (roleName || 'CAJERO').toUpperCase();
    if (!allowed.includes(wanted)) {
      throw new Error('Rol no permitido');
    }
    const [existing] = await db.query('SELECT 1 FROM Usuarios WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new Error('El correo ya está en uso');
    }
    const [[roleRow]] = await db.query('SELECT id_rol FROM Roles WHERE nombre_rol = ? LIMIT 1', [wanted]);
    if (!roleRow) throw new Error('Rol no configurado en la base de datos');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contrasena, salt);
    const [result] = await db.query(
      'INSERT INTO Usuarios (id_rol, nombre, email, contrasena_hash, activo) VALUES (?, ?, ?, ?, 1)',
      [roleRow.id_rol, nombre, email, hash]
    );
    const token = jwt.sign({ id_usuario: result.insertId, rol: wanted, nombre }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return { user: { id_usuario: result.insertId, nombre, email, id_rol: roleRow.id_rol, rol: wanted }, token };
  }

  async login({ email, contrasena }) {
    if (!email || !contrasena) throw new Error('Email y contraseña son requeridos');

    const [rows] = await db.query('SELECT u.*, r.nombre_rol FROM Usuarios u JOIN Roles r ON r.id_rol = u.id_rol WHERE u.email = ?', [email]);
    if (rows.length === 0) throw new Error('Usuario no encontrado');

    const user = rows[0];
    const match = await bcrypt.compare(contrasena, user.contrasena_hash);
    if (!match) throw new Error('Contraseña incorrecta');

    const rolNombre = user.nombre_rol || 'CLIENTE';
    const token = jwt.sign({ id_usuario: user.id_usuario, rol: rolNombre, nombre: user.nombre }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return { user: { id_usuario: user.id_usuario, nombre: user.nombre, email: user.email, id_rol: user.id_rol, rol: rolNombre }, token };
  }
}

module.exports = new AuthService();
