-- ============================================================
-- Winnebago County Lead Aggregator - PostgreSQL Schema
-- Run this file first: psql -U postgres -d leadagg -f schema.sql
-- ============================================================

-- Drop tables if re-running
DROP TABLE IF EXISTS projects CASCADE;

-- Main projects table
CREATE TABLE projects (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL,                     -- e.g. "Bid", "Permit", "RFP"
  trade_category TEXT NOT NULL,                    -- e.g. "Electrical", "Plumbing", "General"
  location      TEXT NOT NULL,                     -- city/address
  filing_date   DATE,
  deadline      DATE,
  estimated_value NUMERIC(15,2),
  contact_name  TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  source_url    TEXT,
  description   TEXT,
  status        TEXT DEFAULT 'active',             -- active | closed | awarded
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast filtering
CREATE INDEX idx_trade_category ON projects(trade_category);
CREATE INDEX idx_location       ON projects(location);
CREATE INDEX idx_deadline       ON projects(deadline);
CREATE INDEX idx_status         ON projects(status);

-- ============================================================
-- Seed data: realistic Winnebago County sample projects
-- ============================================================
INSERT INTO projects (title, type, trade_category, location, filing_date, deadline, estimated_value, contact_name, contact_email, contact_phone, source_url, description) VALUES

('Rockford City Hall HVAC Replacement',
 'Bid', 'HVAC',
 'Rockford, IL',
 '2025-01-10', '2025-02-15', 450000.00,
 'Mike Torres', 'mtorres@rockfordil.gov', '815-987-5432',
 'https://www.rockfordil.gov/bids/2025-001',
 'Full replacement of aging HVAC systems in the City Hall annex building. Includes ductwork, controls, and commissioning.'),

('Winnebago County Courthouse Roof Repair',
 'Bid', 'Roofing',
 'Rockford, IL',
 '2025-01-15', '2025-02-28', 185000.00,
 'Sarah Chen', 'schen@wincoil.us', '815-319-4200',
 'https://www.wincoil.us/purchasing/bids',
 'Partial roof replacement on the north wing of the county courthouse. TPO membrane system preferred.'),

('Harlem Unified School District Electrical Upgrade',
 'RFP', 'Electrical',
 'Loves Park, IL',
 '2025-01-20', '2025-03-05', 720000.00,
 'David Park', 'dpark@harlemschools.org', '815-654-4500',
 'https://www.harlemschools.org/rfp/2025-e1',
 'Panel upgrades, LED lighting retrofit, and EV charging station installation across three school buildings.'),

('Machesney Park Riverwalk Concrete Repair',
 'Bid', 'Concrete',
 'Machesney Park, IL',
 '2025-01-22', '2025-02-20', 95000.00,
 'Lisa Navarro', 'lnavarro@machesneypark.org', '815-877-5432',
 'https://www.machesneypark.org/bids',
 'Concrete sidewalk and retaining wall repairs along the Riverwalk trail system. ADA compliance required.'),

('Rockford Water Reclamation District Pump Station',
 'Bid', 'Plumbing',
 'Rockford, IL',
 '2025-01-25', '2025-03-10', 1200000.00,
 'James Reed', 'jreed@rwrd.org', '815-387-7400',
 'https://www.rwrd.org/procurement',
 'New submersible pump station with telemetry and backup power. Includes force main piping to existing infrastructure.'),

('Cherry Valley Library Addition - Framing',
 'Permit', 'General Construction',
 'Cherry Valley, IL',
 '2025-01-28', '2025-04-01', 340000.00,
 'Tom Bauer', 'tbauer@cherryvalleyil.org', '815-332-3441',
 'https://www.cherryvalleyil.org/permits',
 'Structural framing for 4,200 sq ft library addition. Steel and wood hybrid construction.'),

('Winnebago County Highway Dept - Bridge Painting',
 'Bid', 'Painting',
 'Winnebago County, IL',
 '2025-02-01', '2025-03-15', 75000.00,
 'Paul Kimura', 'pkimura@wincoilhwy.us', '815-319-4300',
 'https://www.wincoilhwy.us/bids/2025-bridge',
 'Sandblasting and repainting of three county highway bridges. Lead paint abatement protocols required.'),

('Rockford Park District Field House Flooring',
 'Bid', 'Flooring',
 'Rockford, IL',
 '2025-02-03', '2025-03-20', 128000.00,
 'Angela Morris', 'amorris@rockfordparkdistrict.org', '815-987-8800',
 'https://www.rockfordparkdistrict.org/contracts',
 'Removal and replacement of gymnasium hardwood floor and rubberized track surface in the Beyer Field House.'),

('Roscoe Water Main Replacement - Phase 2',
 'Bid', 'Plumbing',
 'Roscoe, IL',
 '2025-02-05', '2025-03-25', 890000.00,
 'Nancy Fitch', 'nfitch@villageofroscoe.com', '815-623-2700',
 'https://www.villageofroscoe.com/bids',
 'Replacement of 3,200 LF of aging 6-inch cast iron water main with 8-inch ductile iron. Includes service reconnections.'),

('Rockford Public Schools - Masonry Tuckpointing',
 'RFP', 'Masonry',
 'Rockford, IL',
 '2025-02-08', '2025-04-10', 215000.00,
 'Greg Olson', 'golson@rps205.net', '815-966-3000',
 'https://www.rps205.net/purchasing',
 'Tuckpointing and masonry repairs at multiple school buildings. Prevailing wage project. Submit qualifications and references.'),

('Loves Park Street Resurfacing - Zone 4',
 'Bid', 'Paving',
 'Loves Park, IL',
 '2025-02-10', '2025-03-30', 530000.00,
 'Dan Stokes', 'dstokes@lovespark.us', '815-654-5033',
 'https://www.lovespark.us/public-works/bids',
 'Hot mix asphalt resurfacing of 18 residential streets in Zone 4. Includes crack sealing and curb repair.'),

('Winnebago County Animal Services Facility - HVAC',
 'Bid', 'HVAC',
 'Rockford, IL',
 '2025-02-12', '2025-04-05', 165000.00,
 'Karen Wu', 'kwu@wincoil.us', '815-319-4250',
 'https://www.wincoil.us/purchasing/bids',
 'Design-build HVAC replacement for the county animal services facility. Odor control and high-volume ventilation required.');
