const express = require('express');
const db = require('../config/database');

const router = express.Router();

// GET /api/categorias - listar todas las categorías
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Categorias');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/categorias/:id - obtener una categoría
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Categorias WHERE id_categoria = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categorias - crear categoría
router.post('/', async (req, res) => {
  try {
    const { nombre_categoria } = req.body;
    if (!nombre_categoria) {
      return res.status(400).json({ error: 'nombre_categoria es requerido' });
    }
    const [result] = await db.query(
      'INSERT INTO Categorias (nombre_categoria) VALUES (?)',
      [nombre_categoria]
    );
    res.status(201).json({ id_categoria: result.insertId, nombre_categoria });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/categorias/:id - actualizar categoría
router.put('/:id', async (req, res) => {
  try {
    const { nombre_categoria } = req.body;
    const [result] = await db.query(
      'UPDATE Categorias SET nombre_categoria = ? WHERE id_categoria = ?',
      [nombre_categoria, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id_categoria: Number(req.params.id), nombre_categoria });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categorias/:id - eliminar categoría
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Categorias WHERE id_categoria = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
