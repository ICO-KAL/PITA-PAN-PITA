const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleGuard } = require('../middlewares/auth.middleware');
const router = express.Router();

// GET /api/notificaciones - lista de notificaciones para clientes
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id_notificacion, titulo, descripcion, imagen_url, fecha FROM Notificaciones ORDER BY fecha DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
 
// Crear notificación (solo ADMIN)
router.post('/', authMiddleware, roleGuard('ADMIN'), async (req, res) => {
  try {
    const { titulo, descripcion = null, imagen_url = null } = req.body;
    if (!titulo || titulo.trim() === '') {
      return res.status(400).json({ message: 'El título es requerido' });
    }
    const [r] = await db.query(
      'INSERT INTO Notificaciones (titulo, descripcion, imagen_url) VALUES (?, ?, ?)',
      [titulo, descripcion, imagen_url]
    );
    const [row] = await db.query('SELECT * FROM Notificaciones WHERE id_notificacion = ?', [r.insertId]);
    res.status(201).json(row[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
