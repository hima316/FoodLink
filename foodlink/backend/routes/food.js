const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/food - Donor adds food listing
router.post('/', authenticate, requireRole('donor'), async (req, res) => {
  const { food_name, food_type, is_veg, total_quantity, unit, expiry_time, city_name, state, pincode, description } = req.body;
  if (!food_name || !total_quantity || !expiry_time) {
    return res.status(400).json({ error: 'food_name, total_quantity, and expiry_time are required.' });
  }
  const conn = await pool.getConnection();
  try {
    let city_id = null;
    if (city_name) {
      const [cityRows] = await conn.query(
        'INSERT INTO Cities (city_name) VALUES (?) ON DUPLICATE KEY UPDATE city_id=LAST_INSERT_ID(city_id)',
        [city_name]
      );
      city_id = cityRows.insertId;
    }
    const [result] = await conn.query(
      `INSERT INTO Food_Listings (donor_id, food_name, food_type, is_veg, total_quantity, remaining_quantity, unit, expiry_time, city_id, state, pincode, description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.user_id, food_name, food_type || null, is_veg ? 1 : 0, total_quantity, total_quantity, unit || 'kg', expiry_time, city_id, state || null, pincode || null, description || null]
    );
    res.status(201).json({ message: 'Food listing created.', food_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating food listing.' });
  } finally {
    conn.release();
  }
});

// GET /api/food - NGO views food listings with priority filtering
router.get('/', authenticate, async (req, res) => {
  const { is_veg, pincode, city_id, state } = req.query;
  const conn = await pool.getConnection();
  try {
    // Priority scoring:
    // 4 = expiry within 5 hours
    // 3 = same pincode
    // 2 = same city
    // 1 = same state
    let query = `
      SELECT f.*, c.city_name, u.name AS donor_name, u.contact AS donor_contact,
        CASE
          WHEN f.expiry_time <= DATE_ADD(NOW(), INTERVAL 5 HOUR) THEN 4
          WHEN f.pincode = ? THEN 3
          WHEN f.city_id = ? THEN 2
          WHEN f.state = ? THEN 1
          ELSE 0
        END AS priority_score
      FROM Food_Listings f
      LEFT JOIN Cities c ON f.city_id = c.city_id
      LEFT JOIN Users u ON f.donor_id = u.user_id
      WHERE f.status IN ('available','partially_allocated')
        AND f.expiry_time > NOW()
    `;
    const params = [pincode || '', city_id || 0, state || ''];

    if (is_veg !== undefined && is_veg !== '') {
      query += ' AND f.is_veg = ?';
      params.push(parseInt(is_veg));
    }

    query += ' ORDER BY priority_score DESC, f.expiry_time ASC, f.created_at DESC';

    const [rows] = await conn.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching food listings.' });
  } finally {
    conn.release();
  }
});

// GET /api/food/my - Donor views their own listings
router.get('/my', authenticate, requireRole('donor'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT f.*, c.city_name FROM Food_Listings f LEFT JOIN Cities c ON f.city_id = c.city_id
       WHERE f.donor_id = ? ORDER BY f.created_at DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching your listings.' });
  } finally {
    conn.release();
  }
});

// GET /api/food/:id - Get single listing detail
router.get('/:id', authenticate, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT f.*, c.city_name, u.name AS donor_name, u.contact AS donor_contact
       FROM Food_Listings f
       LEFT JOIN Cities c ON f.city_id = c.city_id
       LEFT JOIN Users u ON f.donor_id = u.user_id
       WHERE f.food_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Listing not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching listing.' });
  } finally {
    conn.release();
  }
});

// PATCH /api/food/:id/status - Donor updates listing status
router.patch('/:id/status', authenticate, requireRole('donor'), async (req, res) => {
  const { status } = req.body;
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM Food_Listings WHERE food_id = ? AND donor_id = ?', [req.params.id, req.user.user_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Listing not found.' });
    await conn.query('UPDATE Food_Listings SET status = ? WHERE food_id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating status.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
