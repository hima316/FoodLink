const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');

router.get('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM Cities ORDER BY city_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching cities.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
