const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleGuard } = require('../middlewares/auth.middleware');

const router = express.Router();

// Crear pago (cliente) - queda en estado PENDIENTE hasta que el cajero lo confirme
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id_pedido, metodo = 'ONLINE', monto, referencia = null } = req.body;
    if (!id_pedido || !monto) return res.status(400).json({ message: 'id_pedido y monto son requeridos' });

    // validar que el pedido existe
    const [ped] = await db.query('SELECT id_pedido FROM Pedidos WHERE id_pedido = ? LIMIT 1', [id_pedido]);
    if (ped.length === 0) return res.status(404).json({ message: 'Pedido no encontrado' });

    const [r] = await db.query(
      'INSERT INTO Pagos (id_pedido, id_usuario, metodo, monto, referencia, estado) VALUES (?, ?, ?, ?, ?, \"PENDIENTE\")',
      [id_pedido, req.user.id_usuario, metodo, monto, referencia]
    );
    const [row] = await db.query('SELECT * FROM Pagos WHERE id_pago = ?', [r.insertId]);

    // agregar seguimiento para el pedido
    await db.query(
      'INSERT INTO SeguimientoPedido (id_pedido, id_usuario, mensaje) VALUES (?, ?, ?)',
      [id_pedido, req.user.id_usuario, 'El cliente envió comprobante de pago. En espera de confirmación del cajero.']
    );

    res.status(201).json(row[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar pagos pendientes (solo CAJERO)
router.get('/pendientes', authMiddleware, roleGuard('CAJERO'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.* FROM Pagos p WHERE p.estado = \"PENDIENTE\" ORDER BY p.fecha DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirmar pago (CAJERO)
router.patch('/:id/confirmar', authMiddleware, roleGuard('CAJERO'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Pagos WHERE id_pago = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Pago no encontrado' });
    const pago = rows[0];
    if (pago.estado !== 'PENDIENTE') return res.status(400).json({ message: 'Pago no está pendiente' });

    await db.query('UPDATE Pagos SET estado = \"CONFIRMADO\" WHERE id_pago = ?', [id]);
    // al confirmar el pago, mover el pedido a EN PROCESO si sigue pendiente
    const [[pedido]] = await db.query('SELECT estado FROM Pedidos WHERE id_pedido = ?', [pago.id_pedido]);
    if (pedido && pedido.estado === 'PENDIENTE') {
      await db.query('UPDATE Pedidos SET estado = \"EN PROCESO\" WHERE id_pedido = ?', [pago.id_pedido]);
    }
    await db.query(
      'INSERT INTO SeguimientoPedido (id_pedido, id_usuario, mensaje) VALUES (?, ?, ?)',
      [pago.id_pedido, req.user.id_usuario, 'Pago confirmado por caja. ¡Estamos preparando tu pedido!']
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rechazar pago (CAJERO)
router.patch('/:id/rechazar', authMiddleware, roleGuard('CAJERO'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Pagos WHERE id_pago = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Pago no encontrado' });
    const pago = rows[0];
    if (pago.estado !== 'PENDIENTE') return res.status(400).json({ message: 'Pago no está pendiente' });

    await db.query('UPDATE Pagos SET estado = \"RECHAZADO\" WHERE id_pago = ?', [id]);
    await db.query(
      'INSERT INTO SeguimientoPedido (id_pedido, id_usuario, mensaje) VALUES (?, ?, ?)',
      [pago.id_pedido, req.user.id_usuario, 'El pago fue rechazado por caja. Revisa los datos o intenta nuevamente.']
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
