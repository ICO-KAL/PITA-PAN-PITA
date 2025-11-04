const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/seguimiento/:id_pedido - obtener mensajes de seguimiento
router.get('/:id_pedido', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM SeguimientoPedido WHERE id_pedido = ? ORDER BY fecha_hora ASC',
      [req.params.id_pedido]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seguimiento - agregar mensaje de seguimiento (empleado)
router.post('/', authMiddleware, async (req, res) => {
  const { id_pedido, mensaje } = req.body;
  if (!id_pedido || !mensaje) {
    return res.status(400).json({ message: 'id_pedido y mensaje son requeridos' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO SeguimientoPedido (id_pedido, id_usuario, mensaje) VALUES (?, ?, ?)',
      [id_pedido, req.user.id_usuario, mensaje]
    );
    res.status(201).json({ id_seguimiento: result.insertId, id_pedido, mensaje });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
