/**
 * backend/jobs/scheduler.js
 * ─────────────────────────────────────────────────────────────────────────
 * Schedules automatic scraping and cleanup using node-cron.
 *
 * Schedule (all times UTC, Railway runs UTC):
 *   Scrape  → 06:00 and 18:00 daily  (catches morning + afternoon postings)
 *   Cleanup → 01:00 daily            (mark expired bids as 'closed')
 *
 * Also runs cleanup + scrape once on startup (after a 30s delay so the DB
 * has time to finish initialising).
 * ─────────────────────────────────────────────────────────────────────────
 */

const cron                          = require('node-cron');
const { runScraper, closeExpiredBids } = require('../scraper');

function startScheduler() {
  // ── 1. Cleanup expired bids — 1 AM UTC daily ────────────────────────────
  cron.schedule('0 1 * * *', async () => {
    console.log('⏰  [Scheduler] Running cleanup...');
    await closeExpiredBids();
  }, { timezone: 'UTC' });

  // ── 2. Scrape new bids — 6 AM and 6 PM UTC daily ────────────────────────
  cron.schedule('0 6,18 * * *', async () => {
    console.log('⏰  [Scheduler] Running scraper...');
    await closeExpiredBids();   // clean first, then add fresh data
    await runScraper();
  }, { timezone: 'UTC' });

  console.log('📅  Scheduler started — scraping at 06:00 & 18:00 UTC, cleanup at 01:00 UTC');

  // ── 3. Run once on startup after a short delay ───────────────────────────
  setTimeout(async () => {
    console.log('🚀  [Scheduler] Running startup scrape...');
    await closeExpiredBids();
    await runScraper();
  }, 30 * 1000); // 30 seconds after server starts
}

module.exports = { startScheduler };
