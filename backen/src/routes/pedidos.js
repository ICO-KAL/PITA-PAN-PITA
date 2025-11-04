const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/pedidos?estado=PENDIENTE
router.get('/', async (req, res) => {
  const { estado } = req.query;
  try {
    let sql = `SELECT p.id_pedido, p.fecha_hora, p.estado, p.notas_pedido, u.nombre AS nombre_mesero
               FROM Pedidos p
               JOIN Usuarios u ON u.id_usuario = p.id_usuario_mesero`;
    const params = [];
    if (estado) {
      sql += ' WHERE p.estado = ?';
      params.push(estado);
    }
    sql += ' ORDER BY p.id_pedido DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pedidos/mis-pedidos - pedidos del usuario autenticado
router.get('/mis-pedidos', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id_pedido, p.fecha_hora, p.estado, p.notas_pedido
       FROM Pedidos p
       WHERE p.id_usuario_mesero = ?
       ORDER BY p.id_pedido DESC`,
      [req.user.id_usuario]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pedidos/:id - obtener un pedido con sus detalles y mensajes de seguimiento
router.get('/:id', async (req, res) => {
  try {
    const [pedidoRows] = await db.query(
      'SELECT p.*, u.nombre AS nombre_mesero FROM Pedidos p JOIN Usuarios u ON u.id_usuario = p.id_usuario_mesero WHERE p.id_pedido = ?',
      [req.params.id]
    );
    if (pedidoRows.length === 0) return res.status(404).json({ message: 'Pedido no encontrado' });

    const [detalleRows] = await db.query(
      'SELECT d.*, pr.nombre FROM DetallePedido d JOIN Productos pr ON pr.id_producto = d.id_producto WHERE d.id_pedido = ?',
      [req.params.id]
    );

    const [mensajesRows] = await db.query(
      'SELECT * FROM SeguimientoPedido WHERE id_pedido = ? ORDER BY fecha_hora ASC',
      [req.params.id]
    );

    res.json({ pedido: pedidoRows[0], detalles: detalleRows, mensajes: mensajesRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pedidos  { items: [{ id_producto, cantidad, precio_unitario }], notas_pedido }
router.post('/', authMiddleware, async (req, res) => {
  const { items = [], notas_pedido = null } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'El pedido debe contener items' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [pedidoRes] = await conn.query(
      'INSERT INTO Pedidos (id_usuario_mesero, estado, notas_pedido) VALUES (?, ?, ?)',
      [req.user.id_usuario, 'PENDIENTE', notas_pedido]
    );
    const id_pedido = pedidoRes.insertId;

    for (const item of items) {
      if (!item.id_producto || !item.cantidad || !item.precio_unitario) {
        throw new Error('Cada item debe tener id_producto, cantidad y precio_unitario');
      }
      await conn.query(
        'INSERT INTO DetallePedido (id_pedido, id_producto, cantidad, precio_unitario, notas_personalizacion) VALUES (?, ?, ?, ?, ?)',
        [id_pedido, item.id_producto, item.cantidad, item.precio_unitario, item.notas_personalizacion || null]
      );
    }

    await conn.commit();
    res.status(201).json({ id_pedido, estado: 'PENDIENTE' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// PATCH /api/pedidos/:id/estado { estado }
router.patch('/:id/estado', async (req, res) => {
  const { estado } = req.body;
  if (!estado) return res.status(400).json({ message: 'estado es requerido' });
  try {
    const [result] = await db.query('UPDATE Pedidos SET estado = ? WHERE id_pedido = ?', [estado, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json({ id_pedido: Number(req.params.id), estado });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/pedidos/:id/confirmar - cliente confirma recepción del pedido
router.patch('/:id/confirmar', async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE Pedidos SET confirmado_cliente = 1 WHERE id_pedido = ? AND estado = ?',
      [req.params.id, 'ENTREGADO']
    );
    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'El pedido debe estar en estado ENTREGADO para confirmar' });
    }
    res.json({ id_pedido: Number(req.params.id), confirmado: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/pedidos/:id/cancelar - cliente solicita cancelar el pedido
router.patch('/:id/cancelar', authMiddleware, async (req, res) => {
  const idPedido = req.params.id;
  const idUsuario = req.user.id_usuario;
  try {
    // Solo permitir cancelar si no está ya ENTREGADO o CANCELADO
    const [rows] = await db.query('SELECT estado FROM Pedidos WHERE id_pedido = ?', [idPedido]);
    if (rows.length === 0) return res.status(404).json({ message: 'Pedido no encontrado' });
    const estadoActual = rows[0].estado;
    if (estadoActual === 'ENTREGADO' || estadoActual === 'CANCELADO') {
      return res.status(400).json({ message: 'El pedido no puede ser cancelado en este estado' });
    }

    await db.query('UPDATE Pedidos SET estado = ? WHERE id_pedido = ?', ['CANCELADO', idPedido]);
    // Registrar en seguimiento para que el empleado vea la notificación
    await db.query(
      'INSERT INTO SeguimientoPedido (id_pedido, id_usuario, mensaje) VALUES (?, ?, ?)',
      [idPedido, idUsuario, 'El cliente canceló el pedido']
    );

    res.json({ id_pedido: Number(idPedido), estado: 'CANCELADO' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
 
// PATCH /api/pedidos/:id (cliente) - editar items/notas si está PENDIENTE y es su pedido
router.patch('/:id', authMiddleware, async (req, res) => {
  const idPedido = Number(req.params.id);
  const { items = null, notas_pedido = undefined } = req.body;
  const conn = await db.getConnection();
  try {
    const [[pedido]] = await conn.query('SELECT id_usuario_mesero, estado FROM Pedidos WHERE id_pedido = ?', [idPedido]);
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });
    if (pedido.id_usuario_mesero !== req.user.id_usuario) return res.status(403).json({ message: 'No autorizado' });
    if (pedido.estado !== 'PENDIENTE') return res.status(400).json({ message: 'Solo se puede editar un pedido PENDIENTE' });

    await conn.beginTransaction();
    if (Array.isArray(items)) {
      // Reemplazar los detalles
      await conn.query('DELETE FROM DetallePedido WHERE id_pedido = ?', [idPedido]);
      for (const it of items) {
        if (!it.id_producto || !it.cantidad || !it.precio_unitario) {
          throw new Error('Cada item requiere id_producto, cantidad y precio_unitario');
        }
        await conn.query(
          'INSERT INTO DetallePedido (id_pedido, id_producto, cantidad, precio_unitario, notas_personalizacion) VALUES (?, ?, ?, ?, ?)',
          [idPedido, it.id_producto, it.cantidad, it.precio_unitario, it.notas_personalizacion || null]
        );
      }
    }
    if (typeof notas_pedido !== 'undefined') {
      await conn.query('UPDATE Pedidos SET notas_pedido = ? WHERE id_pedido = ?', [notas_pedido, idPedido]);
    }
    await conn.commit();
    res.json({ id_pedido: idPedido, edited: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/pedidos/:id (cliente) - elimina totalmente si está PENDIENTE y es su pedido
router.delete('/:id', authMiddleware, async (req, res) => {
  const idPedido = Number(req.params.id);
  try {
    const [[pedido]] = await db.query('SELECT id_usuario_mesero, estado FROM Pedidos WHERE id_pedido = ?', [idPedido]);
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });
    if (pedido.id_usuario_mesero !== req.user.id_usuario) return res.status(403).json({ message: 'No autorizado' });
    if (pedido.estado !== 'PENDIENTE') return res.status(400).json({ message: 'Solo se puede eliminar un pedido PENDIENTE' });

    await db.query('DELETE FROM DetallePedido WHERE id_pedido = ?', [idPedido]);
    await db.query('DELETE FROM SeguimientoPedido WHERE id_pedido = ?', [idPedido]);
    await db.query('DELETE FROM Pagos WHERE id_pedido = ?', [idPedido]);
    await db.query('DELETE FROM Pedidos WHERE id_pedido = ?', [idPedido]);
    res.json({ id_pedido: idPedido, deleted: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
