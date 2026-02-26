/**
 * backend/scraper/index.js
 * ─────────────────────────────────────────────────────────────────────────
 * Node.js scrapers for:
 *   1. City of Rockford   → rockfordil.gov/Bids.aspx (CivicEngage portal)
 *   2. Winnebago County   → wincoil.us purchasing page (Joomla CMS, PDF links)
 *
 * Each scraper returns an array of project objects ready for DB upsert.
 * ─────────────────────────────────────────────────────────────────────────
 */

const axios   = require('axios');
const cheerio = require('cheerio');
const pool    = require('../db/pool');

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; BidFrontBot/1.0)' };

// ── Trade keyword detection ─────────────────────────────────────────────────
const TRADE_MAP = [
  [['hvac','heat','cooling','boiler','mechanical','ventilat','air conditioning'], 'HVAC'],
  [['electric','lighting','panel','wiring','ev charger','power'],                'Electrical'],
  [['plumb','water main','sewer','pump','pipe','drain','well'],                  'Plumbing'],
  [['roof','membrane','tpo','shingle','reroof'],                                 'Roofing'],
  [['pav','asphalt','road','street','resurface','milling'],                      'Paving'],
  [['concrete','sidewalk','curb','flatwork','ada ramp'],                         'Concrete'],
  [['paint','coating','blast','seal coat','pressure wash'],                      'Painting'],
  [['floor','hardwood','carpet','tile','gym floor'],                             'Flooring'],
  [['mason','tuckpoint','brick','block','precast'],                              'Masonry'],
  [['demo','abate','remov','tear'],                                              'Demo/Abatement'],
  [['it ','network','server','software','computer','security camera'],           'IT/Technology'],
  [['landscape','mow','tree','lawn'],                                            'Landscaping'],
  [['fence','gate'],                                                             'Fencing'],
  [['window','door','glazing'],                                                  'Windows/Doors'],
];

function detectTrade(text) {
  const t = text.toLowerCase();
  for (const [keywords, category] of TRADE_MAP) {
    if (keywords.some(k => t.includes(k))) return category;
  }
  return 'General Construction';
}

function determineType(text) {
  const t = text.toUpperCase();
  if (['RFP','PROPOSAL','RFQ','QUALIFICATION','QUOTE'].some(x => t.includes(x))) return 'RFP';
  if (t.includes('PERMIT')) return 'Permit';
  return 'Bid';
}

function parseDate(str) {
  if (!str) return null;
  // Handles M/D/YYYY and YYYY-MM-DD
  const clean = str.trim().replace(/\s+\d{1,2}:\d{2}\s*(AM|PM)?/i, '');
  for (const fmt of [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // M/D/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/,         // YYYY-MM-DD
  ]) {
    const m = clean.match(fmt);
    if (m) {
      try {
        const d = fmt === fmt ? new Date(clean) : null;
        if (d && !isNaN(d)) return d.toISOString().split('T')[0];
      } catch { /* */ }
    }
  }
  // Fallback: let JS parse it
  try {
    const d = new Date(clean);
    if (!isNaN(d)) return d.toISOString().split('T')[0];
  } catch { /* */ }
  return null;
}


// ── 1. City of Rockford ──────────────────────────────────────────────────────
// CivicEngage ASP.NET portal — bid titles are <a href="Bids.aspx?bidID=NNN">
async function scrapeRockford() {
  const BASE = 'https://rockfordil.gov';
  const URL  = `${BASE}/Bids.aspx`;
  console.log(`  [Rockford] Fetching ${URL}...`);

  try {
    const { data } = await axios.get(URL, { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(data);
    const projects = [];

    $('a').filter((_, el) => {
      const href = $(el).attr('href') || '';
      return /[Bb]ids\.aspx\?[Bb]id[Ii][Dd]=/i.test(href);
    }).each((_, el) => {
      const title = $(el).text().trim();
      if (!title || title.length < 4) return;

      const href = $(el).attr('href');
      const sourceUrl = href.startsWith('http') ? href : `${BASE}/${href.replace(/^\//, '')}`;

      // Walk up to the nearest block container to grab surrounding text for dates
      const container  = $(el).closest('div, tr, li, section, article');
      const allText    = container.length ? container.text() : '';

      // Extract first M/D/YYYY date as deadline
      const dateMatch  = allText.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
      const deadline   = dateMatch ? parseDate(dateMatch[1]) : null;

      // Extract bid number like 226-CD-020
      const numMatch   = allText.match(/(?:RFP|RFQ|BID|IFB|NO\.?\s*)?(\d{2,4}-[A-Z]{1,3}-\d{2,4})/i);
      const bidNumber  = numMatch ? numMatch[0].trim() : '';

      projects.push({
        title,
        type:            determineType(title + ' ' + bidNumber),
        trade_category:  detectTrade(title),
        location:        'Rockford, IL',
        filing_date:     null,
        deadline,
        estimated_value: null,
        contact_name:    'City of Rockford Purchasing',
        contact_email:   'purchasing2@rockfordil.gov',
        contact_phone:   '779-348-7000',
        source_url:      sourceUrl,
        description:     (bidNumber ? `${bidNumber} — ` : '') + title,
      });
    });

    console.log(`  [Rockford] ✓ Found ${projects.length} bids`);
    return projects;
  } catch (err) {
    console.error(`  [Rockford] ✗ Failed: ${err.message}`);
    return [];
  }
}


// ── 2. Winnebago County ──────────────────────────────────────────────────────
// Joomla CMS — bids are <a> links with bid number at start of text
// Bid number format: 26B-2464 / 25P-2450 / 25Q-2445
async function scrapeWinnebago() {
  const BASE = 'https://www.wincoil.us';
  const URL  = `${BASE}/Government/Purchasing-Department/Open-Bids-Quotes-RFPs/`;
  console.log(`  [Winnebago] Fetching ${URL}...`);

  try {
    const { data } = await axios.get(URL, {
      headers: HEADERS,
      timeout: 20000,
      // Some county servers have SSL issues
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
    });
    const $ = cheerio.load(data);
    const projects = [];
    const seen = new Set();

    $('a[href]').each((_, el) => {
      const text  = $(el).text().trim();
      const match = text.match(/^(\d+[A-Z]+-\d+)\s*[-–]?\s*(.*)$/i);
      if (!match || text.length < 8) return;

      const bidNum   = match[1].trim();
      const titleStr = match[2].trim() || bidNum;
      const href     = $(el).attr('href');

      let sourceUrl;
      if (href.startsWith('/'))    sourceUrl = `${BASE}${href}`;
      else if (href.startsWith('http')) sourceUrl = href;
      else                         sourceUrl = `${BASE}/${href}`;

      if (seen.has(sourceUrl)) return;
      seen.add(sourceUrl);

      projects.push({
        title:           `${bidNum} - ${titleStr}`,
        type:            determineType(`${bidNum} ${titleStr}`),
        trade_category:  detectTrade(titleStr),
        location:        'Winnebago County, IL',
        filing_date:     null,
        deadline:        null,
        estimated_value: null,
        contact_name:    'Winnebago County Purchasing',
        contact_email:   'purchasing@wincoil.us',
        contact_phone:   '815-319-4215',
        source_url:      sourceUrl,
        description:     `Winnebago County Bid #${bidNum}. See attached document for full specifications.`,
      });
    });

    console.log(`  [Winnebago] ✓ Found ${projects.length} bids`);
    return projects;
  } catch (err) {
    console.error(`  [Winnebago] ✗ Failed: ${err.message}`);
    return [];
  }
}


// ── Upsert scraped projects into DB ─────────────────────────────────────────
async function upsertProjects(projects) {
  if (!projects.length) return { inserted: 0, updated: 0 };

  const client = await pool.connect();
  let inserted = 0, updated = 0;

  try {
    await client.query('BEGIN');

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
    return { inserted, updated };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


// ── Main run function ────────────────────────────────────────────────────────
async function runScraper() {
  console.log(`\n🕷️  Scraper started at ${new Date().toISOString()}`);
  const all = [];

  const [rockford, winnebago] = await Promise.allSettled([
    scrapeRockford(),
    scrapeWinnebago(),
  ]);

  if (rockford.status === 'fulfilled')  all.push(...rockford.value);
  if (winnebago.status === 'fulfilled') all.push(...winnebago.value);

  console.log(`  Total collected: ${all.length}`);

  if (all.length > 0) {
    const result = await upsertProjects(all);
    console.log(`  ✅ Scraper done — inserted: ${result.inserted}, updated: ${result.updated}`);
    return result;
  }

  console.log('  ⚠️  No bids scraped (sites may be down or have no open bids)');
  return { inserted: 0, updated: 0 };
}


// ── Cleanup: close expired bids ──────────────────────────────────────────────
async function closeExpiredBids() {
  try {
    // Mark bids closed if deadline was more than 1 day ago and they're still active
    const result = await pool.query(`
      UPDATE projects
      SET    status = 'closed', updated_at = NOW()
      WHERE  deadline < NOW() - INTERVAL '1 day'
      AND    status   = 'active'
    `);
    if (result.rowCount > 0) {
      console.log(`🗑️  Closed ${result.rowCount} expired bid(s)`);
    }
    return result.rowCount;
  } catch (err) {
    console.error('Cleanup error:', err.message);
    return 0;
  }
}


module.exports = { runScraper, closeExpiredBids, upsertProjects };
