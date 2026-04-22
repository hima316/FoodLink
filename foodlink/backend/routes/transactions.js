const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { authenticate } = require('../middleware/auth');

// GET /api/transactions - get transactions for logged in user
router.get('/', authenticate, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    let query, params;
    if (req.user.role === 'donor') {
      query = `SELECT t.*, f.food_name, f.is_veg, f.unit, u.name AS ngo_name, u.contact AS ngo_contact
               FROM Transactions t
               JOIN Food_Listings f ON t.food_id = f.food_id
               JOIN Users u ON t.ngo_id = u.user_id
               WHERE t.donor_id = ? ORDER BY t.completed_at DESC`;
      params = [req.user.user_id];
    } else {
      query = `SELECT t.*, f.food_name, f.is_veg, f.unit, u.name AS donor_name, u.contact AS donor_contact
               FROM Transactions t
               JOIN Food_Listings f ON t.food_id = f.food_id
               JOIN Users u ON t.donor_id = u.user_id
               WHERE t.ngo_id = ? ORDER BY t.completed_at DESC`;
      params = [req.user.user_id];
    }
    const [rows] = await conn.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching transactions.' });
  } finally {
    conn.release();
  }
});

// GET /api/transactions/stats - dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    if (req.user.role === 'donor') {
      const [[listingStats]] = await conn.query(
        `SELECT COUNT(*) AS total_listings,
                SUM(total_quantity) AS total_donated,
                SUM(total_quantity - remaining_quantity) AS total_allocated,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS active_listings
         FROM Food_Listings WHERE donor_id = ?`,
        [req.user.user_id]
      );
      const [[txStats]] = await conn.query(
        `SELECT COUNT(DISTINCT ngo_id) AS ngos_served, COUNT(*) AS total_transactions
         FROM Transactions WHERE donor_id = ?`,
        [req.user.user_id]
      );
      res.json({ ...listingStats, ...txStats });
    } else {
      const [[reqStats]] = await conn.query(
        `SELECT COUNT(*) AS total_requests,
                SUM(allocated_quantity) AS total_received,
                SUM(CASE WHEN status IN ('approved','partially_approved') THEN 1 ELSE 0 END) AS fulfilled_requests
         FROM Requests WHERE ngo_id = ?`,
        [req.user.user_id]
      );
      const [[availStats]] = await conn.query(
        `SELECT COUNT(*) AS available_listings FROM Food_Listings WHERE status IN ('available','partially_allocated') AND expiry_time > NOW()`
      );
      res.json({ ...reqStats, ...availStats });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error fetching stats.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
