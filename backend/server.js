// server.js - Main Express entry point
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const projectsRouter = require('./routes/projects');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());                        // Allow requests from React frontend / scraper
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (for /api/import)

// ── API Routes ───────────────────────────────────────────────
app.use('/api/projects', projectsRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Serve React frontend in production ───────────────────────
// In development the CRA dev server handles the frontend.
// In production (Railway), we serve the built static files.
const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath));

// All non-API routes fall through to the React app (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  API server running at http://localhost:${PORT}`);
});
