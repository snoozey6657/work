// db/init.js - Auto-creates the table and seeds data on first startup
const pool = require('./pool');

async function initDb() {
  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id              SERIAL PRIMARY KEY,
        title           TEXT NOT NULL,
        type            TEXT NOT NULL,
        trade_category  TEXT NOT NULL,
        location        TEXT NOT NULL,
        filing_date     DATE,
        deadline        DATE,
        estimated_value NUMERIC(15,2),
        contact_name    TEXT,
        contact_email   TEXT,
        contact_phone   TEXT,
        source_url      TEXT UNIQUE,
        description     TEXT,
        status          TEXT DEFAULT 'active',
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_trade_category ON projects(trade_category);
      CREATE INDEX IF NOT EXISTS idx_location       ON projects(location);
      CREATE INDEX IF NOT EXISTS idx_deadline       ON projects(deadline);
      CREATE INDEX IF NOT EXISTS idx_status         ON projects(status);
    `);

    // Only seed if table is empty
    const { rows } = await pool.query('SELECT COUNT(*) FROM projects');
    if (parseInt(rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO projects (title, type, trade_category, location, filing_date, deadline, estimated_value, contact_name, contact_email, contact_phone, source_url, description) VALUES
        ('Rockford City Hall HVAC Replacement','Bid','HVAC','Rockford, IL','2025-01-10','2025-02-15',450000,'Mike Torres','mtorres@rockfordil.gov','815-987-5432','https://www.rockfordil.gov/bids/2025-001','Full replacement of aging HVAC systems in the City Hall annex building. Includes ductwork, controls, and commissioning.'),
        ('Winnebago County Courthouse Roof Repair','Bid','Roofing','Rockford, IL','2025-01-15','2025-02-28',185000,'Sarah Chen','schen@wincoil.us','815-319-4200','https://www.wincoil.us/purchasing/bids','Partial roof replacement on the north wing of the county courthouse. TPO membrane system preferred.'),
        ('Harlem Unified School District Electrical Upgrade','RFP','Electrical','Loves Park, IL','2025-01-20','2025-03-05',720000,'David Park','dpark@harlemschools.org','815-654-4500','https://www.harlemschools.org/rfp/2025-e1','Panel upgrades, LED lighting retrofit, and EV charging station installation across three school buildings.'),
        ('Machesney Park Riverwalk Concrete Repair','Bid','Concrete','Machesney Park, IL','2025-01-22','2025-02-20',95000,'Lisa Navarro','lnavarro@machesneypark.org','815-877-5432','https://www.machesneypark.org/bids','Concrete sidewalk and retaining wall repairs along the Riverwalk trail system. ADA compliance required.'),
        ('Rockford Water Reclamation District Pump Station','Bid','Plumbing','Rockford, IL','2025-01-25','2025-03-10',1200000,'James Reed','jreed@rwrd.org','815-387-7400','https://www.rwrd.org/procurement','New submersible pump station with telemetry and backup power. Includes force main piping to existing infrastructure.'),
        ('Cherry Valley Library Addition - Framing','Permit','General Construction','Cherry Valley, IL','2025-01-28','2025-04-01',340000,'Tom Bauer','tbauer@cherryvalleyil.org','815-332-3441','https://www.cherryvalleyil.org/permits','Structural framing for 4,200 sq ft library addition. Steel and wood hybrid construction.'),
        ('Winnebago County Highway Dept - Bridge Painting','Bid','Painting','Winnebago County, IL','2025-02-01','2025-03-15',75000,'Paul Kimura','pkimura@wincoilhwy.us','815-319-4300','https://www.wincoilhwy.us/bids/2025-bridge','Sandblasting and repainting of three county highway bridges. Lead paint abatement protocols required.'),
        ('Rockford Park District Field House Flooring','Bid','Flooring','Rockford, IL','2025-02-03','2025-03-20',128000,'Angela Morris','amorris@rockfordparkdistrict.org','815-987-8800','https://www.rockfordparkdistrict.org/contracts','Removal and replacement of gymnasium hardwood floor and rubberized track surface in the Beyer Field House.'),
        ('Roscoe Water Main Replacement - Phase 2','Bid','Plumbing','Roscoe, IL','2025-02-05','2025-03-25',890000,'Nancy Fitch','nfitch@villageofroscoe.com','815-623-2700','https://www.villageofroscoe.com/bids','Replacement of 3,200 LF of aging 6-inch cast iron water main with 8-inch ductile iron. Includes service reconnections.'),
        ('Rockford Public Schools - Masonry Tuckpointing','RFP','Masonry','Rockford, IL','2025-02-08','2025-04-10',215000,'Greg Olson','golson@rps205.net','815-966-3000','https://www.rps205.net/purchasing','Tuckpointing and masonry repairs at multiple school buildings. Prevailing wage project. Submit qualifications and references.'),
        ('Loves Park Street Resurfacing - Zone 4','Bid','Paving','Loves Park, IL','2025-02-10','2025-03-30',530000,'Dan Stokes','dstokes@lovespark.us','815-654-5033','https://www.lovespark.us/public-works/bids','Hot mix asphalt resurfacing of 18 residential streets in Zone 4. Includes crack sealing and curb repair.'),
        ('Winnebago County Animal Services Facility - HVAC','Bid','HVAC','Rockford, IL','2025-02-12','2025-04-05',165000,'Karen Wu','kwu@wincoil.us','815-319-4250','https://www.wincoil.us/purchasing/bids2','Design-build HVAC replacement for the county animal services facility. Odor control and high-volume ventilation required.')
        ON CONFLICT (source_url) DO NOTHING;
      `);
      console.log('🌱  Database seeded with 12 sample projects');
    }

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // User-lead pipeline tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_leads (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        status     TEXT NOT NULL DEFAULT 'saved',
        saved_at   TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, project_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_leads_user_id    ON user_leads(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_leads_project_id ON user_leads(project_id);
    `);

    // Alert preferences (one row per user)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_alert_preferences (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trade_categories TEXT[] NOT NULL DEFAULT '{}',
        locations        TEXT[] NOT NULL DEFAULT '{}'
      );
    `);

    // Password reset tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token      TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
    `);

    // Fix source URLs — drop UNIQUE constraint then point to real government pages
    await pool.query(`
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_source_url_key;
    `);
    await pool.query(`
      UPDATE projects SET source_url = CASE
        WHEN source_url LIKE '%rockfordil.gov%'       THEN 'https://www.rockfordil.gov/Bids.aspx'
        WHEN source_url LIKE '%rockfordparkdistrict%' THEN 'https://www.rockfordparkdistrict.org/contracts'
        WHEN source_url LIKE '%rps205%'               THEN 'https://www.rps205.net/purchasing'
        WHEN source_url LIKE '%wincoil%'              THEN 'https://www.wincoil.gov/departments/purchasing-department/open-bids-quotes-rfps'
        WHEN source_url LIKE '%wincoilhwy%'           THEN 'https://www.wincoil.gov/departments/purchasing-department/open-bids-quotes-rfps'
        WHEN source_url LIKE '%harlemschools%'        THEN 'https://www.harlemschools.org/district/departments/business/bid-notices'
        WHEN source_url LIKE '%machesneypark%'        THEN 'https://www.machesneypark.org/government/purchasing'
        WHEN source_url LIKE '%rwrd.org%'             THEN 'https://www.rwrd.org/procurement'
        WHEN source_url LIKE '%cherryvalleyil%'       THEN 'https://www.cherryvalleyil.org/permits'
        WHEN source_url LIKE '%lovespark%'            THEN 'https://www.lovespark.us/public-works/bids'
        WHEN source_url LIKE '%villageofroscoe%'      THEN 'https://www.villageofroscoe.com/bids'
        ELSE source_url
      END
      WHERE source_url IS NOT NULL;
    `);

    console.log('✅  Database schema ready');
  } catch (err) {
    console.error('❌  Database init failed:', err.message);
    process.exit(1);
  }
}

module.exports = initDb;
