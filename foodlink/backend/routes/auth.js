const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, role, city_name, state, pincode, contact } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }
  if (!['donor', 'ngo'].includes(role)) {
    return res.status(400).json({ error: 'Role must be donor or ngo.' });
  }
  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query('SELECT user_id FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    let city_id = null;
    if (city_name) {
      const [cityRows] = await conn.query(
        'INSERT INTO Cities (city_name) VALUES (?) ON DUPLICATE KEY UPDATE city_id=LAST_INSERT_ID(city_id)',
        [city_name]
      );
      city_id = cityRows.insertId;
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      'INSERT INTO Users (name, email, password, role, city_id, state, pincode, contact) VALUES (?,?,?,?,?,?,?,?)',
      [name, email, hashed, role, city_id, state || null, pincode || null, contact || null]
    );

    const token = jwt.sign(
      { user_id: result.insertId, name, email, role, city_id, state, pincode },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { user_id: result.insertId, name, email, role, city_id, state, pincode, contact } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during signup.' });
  } finally {
    conn.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT u.*, c.city_name FROM Users u LEFT JOIN Cities c ON u.city_id = c.city_id WHERE u.email = ?`,
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign(
      { user_id: user.user_id, name: user.name, email: user.email, role: user.role, city_id: user.city_id, state: user.state, pincode: user.pincode },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { password: _, ...userSafe } = user;
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
