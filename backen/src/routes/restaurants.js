const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleGuard } = require('../middlewares/auth.middleware');

const router = express.Router();

// Este router usa la tabla Productos del esquema nuevo
// Campos: id_producto, id_categoria, nombre, descripcion, precio_venta, es_vendible, imagen_url

// GET /api/restaurants - listar productos (mantengo la ruta para no romper el frontend)
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Productos');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/restaurants/:id - obtener un producto por id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Productos WHERE id_producto = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/restaurants - crear producto
router.post('/', authMiddleware, roleGuard('ADMIN'), async (req, res) => {
  try {
    const { id_categoria, nombre, descripcion, precio_venta, es_vendible = 1, imagen_url = null } = req.body;
    if (!id_categoria || !nombre || precio_venta == null) {
      return res.status(400).json({ error: 'id_categoria, nombre y precio_venta son requeridos' });
    }
    const [result] = await db.query(
      'INSERT INTO Productos (id_categoria, nombre, descripcion, precio_venta, es_vendible, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
      [id_categoria, nombre, descripcion || null, precio_venta, es_vendible ? 1 : 0, imagen_url]
    );
    res.status(201).json({ id_producto: result.insertId, id_categoria, nombre, descripcion, precio_venta, es_vendible: !!es_vendible, imagen_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/restaurants/:id - actualizar producto
router.put('/:id', authMiddleware, roleGuard('ADMIN'), async (req, res) => {
  try {
    const { id_categoria, nombre, descripcion, precio_venta, es_vendible, imagen_url } = req.body;
    const [result] = await db.query(
      'UPDATE Productos SET id_categoria = COALESCE(?, id_categoria), nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion), precio_venta = COALESCE(?, precio_venta), es_vendible = COALESCE(?, es_vendible), imagen_url = COALESCE(?, imagen_url) WHERE id_producto = ?',
      [id_categoria, nombre, descripcion, precio_venta, typeof es_vendible === 'undefined' ? null : (es_vendible ? 1 : 0), imagen_url, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id_producto: Number(req.params.id), id_categoria, nombre, descripcion, precio_venta, es_vendible, imagen_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/restaurants/:id - eliminar producto
router.delete('/:id', authMiddleware, roleGuard('ADMIN'), async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Productos WHERE id_producto = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
