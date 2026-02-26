// routes/projects.js
// All project-related API endpoints
const express        = require('express');
const router         = express.Router();
const pool           = require('../db/pool');
const { Parser }     = require('json2csv');
const authMiddleware = require('../middleware/auth');

// Import endpoint is public (called by scraper — no user token)
// All other project routes require authentication (applied per-route below)
// We apply authMiddleware after registering /import

// ─────────────────────────────────────────────────────────────────────
// Helper: Build WHERE clause from query params
// Returns { whereClause, values } for parameterized queries
// ─────────────────────────────────────────────────────────────────────
function buildFilters(query) {
  const conditions = ["status = 'active'"];
  const values = [];
  let idx = 1;

  if (query.trade_category) {
    conditions.push(`trade_category ILIKE $${idx++}`);
    values.push(`%${query.trade_category}%`);
  }
  if (query.location) {
    conditions.push(`location ILIKE $${idx++}`);
    values.push(`%${query.location}%`);
  }
  if (query.type) {
    conditions.push(`type ILIKE $${idx++}`);
    values.push(`%${query.type}%`);
  }
  if (query.deadline_before) {
    conditions.push(`deadline <= $${idx++}`);
    values.push(query.deadline_before);
  }
  if (query.deadline_after) {
    conditions.push(`deadline >= $${idx++}`);
    values.push(query.deadline_after);
  }
  if (query.search) {
    conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
    values.push(`%${query.search}%`);
    idx++;
  }

  return {
    whereClause: 'WHERE ' + conditions.join(' AND '),
    values,
  };
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/projects/import  (PUBLIC — called by scraper, no user token)
// Accepts array of project objects and upserts them
// Body: [{ title, type, trade_category, location, ... source_url }, ...]
// ─────────────────────────────────────────────────────────────────────
router.post('/import', async (req, res) => {
  const projects = req.body;

  if (!Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({ error: 'Body must be a non-empty array of projects' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let inserted = 0;
    let updated  = 0;

    for (const p of projects) {
      if (!p.source_url) continue;
      const existing = await client.query(
        'SELECT id FROM projects WHERE source_url = $1',
        [p.source_url]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE projects SET
             title = $1, type = $2, trade_category = $3, location = $4,
             filing_date = $5, deadline = $6, estimated_value = $7,
             contact_name = $8, contact_email = $9, contact_phone = $10,
             description = $11, status = 'active', updated_at = NOW()
           WHERE source_url = $12`,
          [p.title, p.type, p.trade_category, p.location,
           p.filing_date || null, p.deadline || null, p.estimated_value || null,
           p.contact_name, p.contact_email, p.contact_phone,
           p.description, p.source_url]
        );
        updated++;
      } else {
        await client.query(
          `INSERT INTO projects
             (title, type, trade_category, location, filing_date, deadline,
              estimated_value, contact_name, contact_email, contact_phone,
              source_url, description, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'active')`,
          [p.title, p.type, p.trade_category, p.location,
           p.filing_date || null, p.deadline || null, p.estimated_value || null,
           p.contact_name, p.contact_email, p.contact_phone,
           p.source_url, p.description]
        );
        inserted++;
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, inserted, updated });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/projects/import error:', err);
    res.status(500).json({ error: 'Import failed', detail: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────
// All routes below this line require authentication
// ─────────────────────────────────────────────────────────────────────
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────────────
// GET /api/projects
// Query params: trade_category, location, type, deadline_before,
//               deadline_after, search, page (default 1), limit (default 20)
// ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { whereClause, values } = buildFilters(req.query);

    // Count total matching rows (for pagination UI)
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM projects ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Fetch page of results
    const dataResult = await pool.query(
      `SELECT id, title, type, trade_category, location, filing_date,
              deadline, estimated_value, contact_name, contact_email,
              contact_phone, source_url, status, created_at
       FROM projects
       ${whereClause}
       ORDER BY deadline ASC NULLS LAST, created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    res.json({
      data:       dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET /api/projects error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/projects/export  (MUST be before /:id route)
// Returns filtered results as a CSV file download
// ─────────────────────────────────────────────────────────────────────
router.get('/export', async (req, res) => {
  try {
    const { whereClause, values } = buildFilters(req.query);

    const result = await pool.query(
      `SELECT id, title, type, trade_category, location, filing_date,
              deadline, estimated_value, contact_name, contact_email,
              contact_phone, source_url, description, status
       FROM projects
       ${whereClause}
       ORDER BY deadline ASC NULLS LAST`,
      values
    );

    const fields = [
      { label: 'ID',              value: 'id' },
      { label: 'Title',           value: 'title' },
      { label: 'Type',            value: 'type' },
      { label: 'Trade Category',  value: 'trade_category' },
      { label: 'Location',        value: 'location' },
      { label: 'Filing Date',     value: 'filing_date' },
      { label: 'Deadline',        value: 'deadline' },
      { label: 'Estimated Value', value: 'estimated_value' },
      { label: 'Contact Name',    value: 'contact_name' },
      { label: 'Contact Email',   value: 'contact_email' },
      { label: 'Contact Phone',   value: 'contact_phone' },
      { label: 'Source URL',      value: 'source_url' },
      { label: 'Description',     value: 'description' },
      { label: 'Status',          value: 'status' },
    ];

    const parser = new Parser({ fields });
    const csv    = parser.parse(result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads-export.csv"');
    res.send(csv);
  } catch (err) {
    console.error('GET /api/projects/export error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/projects/:id  - Single project detail
// ─────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/projects/:id error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/projects/meta/filters
// Returns distinct values for filter dropdowns
// ─────────────────────────────────────────────────────────────────────
router.get('/meta/filters', async (req, res) => {
  try {
    const [cats, locs, types] = await Promise.all([
      pool.query("SELECT DISTINCT trade_category FROM projects WHERE status = 'active' ORDER BY trade_category"),
      pool.query("SELECT DISTINCT location FROM projects WHERE status = 'active' ORDER BY location"),
      pool.query("SELECT DISTINCT type FROM projects WHERE status = 'active' ORDER BY type"),
    ]);
    res.json({
      trade_categories: cats.rows.map(r => r.trade_category),
      locations:        locs.rows.map(r => r.location),
      types:            types.rows.map(r => r.type),
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
