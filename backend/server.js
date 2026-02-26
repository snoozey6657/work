// server.js - Main Express entry point
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const projectsRouter             = require('./routes/projects');
const authRouter                 = require('./routes/auth');
const usersRouter                = require('./routes/users');
const pool                       = require('./db/pool');
const initDb                     = require('./db/init');
const { startScheduler }         = require('./jobs/scheduler');
const { runScraper, closeExpiredBids } = require('./scraper');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Public API Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// Public meta/filters endpoint (used by HomePage before login)
app.get('/api/meta/filters', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        array_agg(DISTINCT trade_category ORDER BY trade_category) AS trade_categories,
        array_agg(DISTINCT location       ORDER BY location)       AS locations,
        array_agg(DISTINCT type           ORDER BY type)           AS types
      FROM projects WHERE status = 'active'
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check (public)
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Manual scrape trigger — protected by SCRAPER_SECRET env var
app.post('/api/admin/scrape', async (req, res) => {
  const secret = process.env.SCRAPER_SECRET;
  if (secret && req.headers['x-scraper-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    res.json({ message: 'Scrape started' });   // respond immediately
    await closeExpiredBids();
    await runScraper();
  } catch (err) {
    console.error('Manual scrape error:', err.message);
  }
});

// ── Protected API Routes ───────────────────────────────────────────────────
app.use('/api/projects', projectsRouter); // auth enforced inside router
app.use('/api/users',    usersRouter);    // auth enforced inside router

// ── Serve React frontend in production ────────────────────────────────────
const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// ── Start ──────────────────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  API server running at http://localhost:${PORT}`);
    startScheduler();
  });
});
