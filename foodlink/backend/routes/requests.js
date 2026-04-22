const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/requests - NGO submits food request (with transaction + row-level locking)
router.post('/', authenticate, requireRole('ngo'), async (req, res) => {
  const { food_id, requested_quantity } = req.body;
  if (!food_id || !requested_quantity || requested_quantity <= 0) {
    return res.status(400).json({ error: 'food_id and a positive requested_quantity are required.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Row-level lock on the food listing to prevent race conditions
    const [listings] = await conn.query(
      `SELECT * FROM Food_Listings WHERE food_id = ? FOR UPDATE`,
      [food_id]
    );

    if (listings.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Food listing not found.' });
    }

    const listing = listings[0];

    if (!['available', 'partially_allocated'].includes(listing.status)) {
      await conn.rollback();
      return res.status(400).json({ error: 'Food listing is not available for requests.' });
    }

    if (new Date(listing.expiry_time) <= new Date()) {
      await conn.query('UPDATE Food_Listings SET status = "expired" WHERE food_id = ?', [food_id]);
      await conn.commit();
      return res.status(400).json({ error: 'Food listing has expired.' });
    }

    if (listing.remaining_quantity <= 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'No remaining quantity available.' });
    }

    // Check if this NGO already has a pending request for this food
    const [existing] = await conn.query(
      `SELECT request_id FROM Requests WHERE food_id = ? AND ngo_id = ? AND status IN ('pending','approved','partially_approved')`,
      [food_id, req.user.user_id]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'You already have an active request for this listing.' });
    }

    // Allocate what is available (partial allocation support)
    const allocated = Math.min(parseFloat(requested_quantity), parseFloat(listing.remaining_quantity));
    const newRemaining = parseFloat(listing.remaining_quantity) - allocated;

    let reqStatus = 'approved';
    if (parseFloat(requested_quantity) > allocated) reqStatus = 'partially_approved';

    // Insert request
    const [reqResult] = await conn.query(
      `INSERT INTO Requests (food_id, ngo_id, requested_quantity, allocated_quantity, status) VALUES (?,?,?,?,?)`,
      [food_id, req.user.user_id, requested_quantity, allocated, reqStatus]
    );

    // Update food listing
    let newStatus = 'partially_allocated';
    if (newRemaining <= 0) newStatus = 'fully_allocated';

    await conn.query(
      `UPDATE Food_Listings SET remaining_quantity = ?, status = ? WHERE food_id = ?`,
      [newRemaining, newStatus, food_id]
    );

    // Insert transaction record
    await conn.query(
      `INSERT INTO Transactions (food_id, donor_id, ngo_id, allocated_quantity) VALUES (?,?,?,?)`,
      [food_id, listing.donor_id, req.user.user_id, allocated]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Request processed successfully.',
      request_id: reqResult.insertId,
      requested_quantity: parseFloat(requested_quantity),
      allocated_quantity: allocated,
      status: reqStatus,
      remaining_in_listing: newRemaining
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error processing request. Please try again.' });
  } finally {
    conn.release();
  }
});

// GET /api/requests/my - NGO views their requests
router.get('/my', authenticate, requireRole('ngo'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT r.*, f.food_name, f.is_veg, f.food_type, f.expiry_time, f.unit, c.city_name, f.state, f.pincode,
              u.name AS donor_name, u.contact AS donor_contact
       FROM Requests r
       JOIN Food_Listings f ON r.food_id = f.food_id
       LEFT JOIN Cities c ON f.city_id = c.city_id
       LEFT JOIN Users u ON f.donor_id = u.user_id
       WHERE r.ngo_id = ?
       ORDER BY r.request_time DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching requests.' });
  } finally {
    conn.release();
  }
});

// GET /api/requests/food/:food_id - Donor views requests for their listing
router.get('/food/:food_id', authenticate, requireRole('donor'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [listing] = await conn.query(
      'SELECT food_id FROM Food_Listings WHERE food_id = ? AND donor_id = ?',
      [req.params.food_id, req.user.user_id]
    );
    if (listing.length === 0) return res.status(403).json({ error: 'Access denied.' });

    const [rows] = await conn.query(
      `SELECT r.*, u.name AS ngo_name, u.contact AS ngo_contact, u.email AS ngo_email
       FROM Requests r
       JOIN Users u ON r.ngo_id = u.user_id
       WHERE r.food_id = ?
       ORDER BY r.request_time ASC`,
      [req.params.food_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching requests.' });
  } finally {
    conn.release();
  }
});

// GET /api/requests/donor-requests - Donor sees all requests on their listings
router.get('/donor-requests', authenticate, requireRole('donor'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT r.*, f.food_name, f.is_veg, f.unit, f.expiry_time,
              u.name AS ngo_name, u.contact AS ngo_contact, u.email AS ngo_email
       FROM Requests r
       JOIN Food_Listings f ON r.food_id = f.food_id
       JOIN Users u ON r.ngo_id = u.user_id
       WHERE f.donor_id = ?
       ORDER BY r.request_time DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching requests.' });
  } finally {
    conn.release();
  }
});

// PATCH /api/requests/:id/cancel - NGO cancels their request
router.patch('/:id/cancel', authenticate, requireRole('ngo'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT * FROM Requests WHERE request_id = ? AND ngo_id = ? FOR UPDATE',
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Request not found.' });
    }
    const request = rows[0];
    if (!['pending', 'approved', 'partially_approved'].includes(request.status)) {
      await conn.rollback();
      return res.status(400).json({ error: 'Cannot cancel this request.' });
    }

    // Restore quantity
    await conn.query(
      `UPDATE Food_Listings SET remaining_quantity = remaining_quantity + ?,
        status = CASE WHEN status = 'fully_allocated' THEN 'partially_allocated'
                      WHEN remaining_quantity + ? >= total_quantity THEN 'available'
                      ELSE status END
       WHERE food_id = ?`,
      [request.allocated_quantity, request.allocated_quantity, request.food_id]
    );

    await conn.query('UPDATE Requests SET status = "cancelled" WHERE request_id = ?', [req.params.id]);
    await conn.commit();
    res.json({ message: 'Request cancelled and quantity restored.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Error cancelling request.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
