const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
  try {
    // simple query to test DB connectivity
    const [rows] = await db.query('SELECT 1 as ok');
    res.json({ ok: true, db: rows && rows.length ? 'connected' : 'no rows' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
