// routes/users.js — User profile, saved leads, alert preferences
const express        = require('express');
const pool           = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware); // All user routes require auth

const VALID_STATUSES = ['saved', 'interested', 'bid_submitted', 'won', 'lost'];

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/saved-leads
router.get('/saved-leads', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, ul.status AS save_status, ul.saved_at
      FROM user_leads ul
      JOIN projects p ON p.id = ul.project_id
      WHERE ul.user_id = $1
      ORDER BY ul.saved_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/saved-leads
router.post('/saved-leads', async (req, res) => {
  const { project_id, status = 'saved' } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id is required.' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  try {
    const { rows } = await pool.query(`
      INSERT INTO user_leads (user_id, project_id, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, project_id) DO UPDATE SET status = EXCLUDED.status
      RETURNING *
    `, [req.user.id, project_id, status]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/saved-leads/:projectId
router.put('/saved-leads/:projectId', async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  try {
    const { rows } = await pool.query(`
      UPDATE user_leads SET status = $1
      WHERE user_id = $2 AND project_id = $3
      RETURNING *
    `, [status, req.user.id, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ error: 'Saved lead not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/saved-leads/:projectId
router.delete('/saved-leads/:projectId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM user_leads WHERE user_id = $1 AND project_id = $2',
      [req.user.id, req.params.projectId]
    );
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/alert-preferences
router.get('/alert-preferences', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT trade_categories, locations FROM user_alert_preferences WHERE user_id = $1',
      [req.user.id]
    );
    res.json(rows[0] || { trade_categories: [], locations: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/alert-preferences
router.post('/alert-preferences', async (req, res) => {
  const { trade_categories = [], locations = [] } = req.body;
  try {
    const { rows } = await pool.query(`
      INSERT INTO user_alert_preferences (user_id, trade_categories, locations)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE
        SET trade_categories = EXCLUDED.trade_categories,
            locations        = EXCLUDED.locations
      RETURNING trade_categories, locations
    `, [req.user.id, trade_categories, locations]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
