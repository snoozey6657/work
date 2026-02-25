# WinCo Leads — Winnebago County Contractor Lead Aggregator

A full-stack MVP for browsing, filtering, and exporting construction bids,
permits, and RFPs from Winnebago County, IL.

---

## 🗂 Project Structure

```
lead-aggregator/
├── backend/              ← Node.js + Express API server
│   ├── server.js         ← Main entry point
│   ├── routes/
│   │   └── projects.js   ← All API routes
│   ├── db/
│   │   ├── pool.js       ← PostgreSQL connection
│   │   └── schema.sql    ← Database table + seed data
│   ├── .env.example      ← Copy to .env and fill in your DB password
│   └── package.json
├── frontend/             ← React app
│   ├── src/
│   │   ├── App.js
│   │   ├── index.css     ← All styles
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Footer.js
│   │   │   ├── ProjectCard.js
│   │   │   ├── FilterBar.js
│   │   │   └── Pagination.js
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── ListingPage.js
│   │   │   └── DetailPage.js
│   │   └── hooks/
│   │       └── useProjects.js
│   └── package.json
└── scraper/
    └── scrape_winnebago.py  ← Python scraper / import script
```

---

## ✅ Prerequisites — Install These First

Before you start, you need:

1. **Node.js** (v18+) — https://nodejs.org (download the LTS version)
   - After installing, open a terminal and confirm: `node --version`

2. **PostgreSQL** (v14+) — https://www.postgresql.org/download/
   - Windows: use the installer, remember your password!
   - Mac: use Homebrew `brew install postgresql@16` or Postgres.app

3. **Python 3** (for the scraper) — https://www.python.org/downloads/
   - Usually already installed on Mac/Linux

4. **A terminal** — On Windows use "Command Prompt" or "PowerShell"

---

## 🚀 Step-by-Step Setup

### Step 1 — Set Up PostgreSQL Database

Open your terminal and run:

```bash
# Connect to PostgreSQL (Windows: search "psql" in Start menu)
psql -U postgres

# Inside psql, create the database:
CREATE DATABASE leadagg;
\q
```

Now load the schema and seed data:

```bash
# Navigate to the backend/db folder
cd lead-aggregator/backend/db

# Run the schema (creates table + 12 sample projects)
psql -U postgres -d leadagg -f schema.sql
```

You should see:
```
CREATE TABLE
INSERT 0 12
```

---

### Step 2 — Configure the Backend

```bash
# Go to the backend folder
cd lead-aggregator/backend

# Copy the example env file
# On Mac/Linux:
cp .env.example .env
# On Windows:
copy .env.example .env
```

Open `.env` in any text editor (Notepad works) and fill in your password:

```
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leadagg
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
```

---

### Step 3 — Install Backend Dependencies & Start the API

```bash
# Make sure you're in the backend folder
cd lead-aggregator/backend

# Install Node packages (only needed once)
npm install

# Start the server
npm start
```

You should see:
```
✅  Connected to PostgreSQL
🚀  API server running at http://localhost:4000
```

**Test it:** Open http://localhost:4000/api/projects in your browser.
You should see JSON with the 12 sample projects.

---

### Step 4 — Start the React Frontend

Open a **second terminal window** (keep the first one running the API):

```bash
# Go to the frontend folder
cd lead-aggregator/frontend

# Install React packages (only needed once — may take 2-3 minutes)
npm install

# Start the frontend
npm start
```

Your browser will open automatically at http://localhost:3000 🎉

---

### Step 5 — (Optional) Run the Scraper

The scraper runs in demo mode by default (no real web scraping, just tests the import pipeline):

```bash
# Install Python dependencies
pip install requests beautifulsoup4

# Run the scraper (demo mode)
cd lead-aggregator/scraper
python scrape_winnebago.py
```

To scrape real sites, open `scrape_winnebago.py` and:
1. Set `DEMO_MODE = False`
2. Update the CSS selectors in `scrape_source()` to match the real HTML

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects (filterable, paginated) |
| GET | `/api/projects/:id` | Single project detail |
| GET | `/api/projects/export` | Download filtered results as CSV |
| GET | `/api/projects/meta/filters` | Get filter dropdown options |
| POST | `/api/projects/import` | Import scraped JSON |

### Filter Parameters (GET /api/projects)

| Param | Example | Description |
|-------|---------|-------------|
| `search` | `?search=roofing` | Keyword search in title/description |
| `trade_category` | `?trade_category=Electrical` | Filter by trade |
| `location` | `?location=Rockford` | Filter by city |
| `deadline_before` | `?deadline_before=2025-04-01` | Show only before this date |
| `page` | `?page=2` | Page number (default: 1) |
| `limit` | `?limit=20` | Results per page (max 100) |

---

## 📥 CSV Export

On the listing page, click **"Export CSV"** to download all filtered results.
The download includes all fields: title, type, trade, location, dates, value, contact info, source URL.

---

## 🔧 Adding More Data

**Via the API (JSON import):**
```bash
curl -X POST http://localhost:4000/api/projects/import \
  -H "Content-Type: application/json" \
  -d '[{
    "title": "New Bid Title",
    "type": "Bid",
    "trade_category": "Electrical",
    "location": "Rockford, IL",
    "filing_date": "2025-02-01",
    "deadline": "2025-03-15",
    "estimated_value": 95000,
    "contact_name": "Jane Smith",
    "contact_email": "jsmith@city.gov",
    "contact_phone": "815-555-1234",
    "source_url": "https://example.gov/bids/123",
    "description": "Project description here."
  }]'
```

**Via SQL:**
```sql
INSERT INTO projects (title, type, trade_category, location, ...) VALUES (...);
```

---

## 🛑 Stopping the Servers

- Press **Ctrl+C** in each terminal window to stop the API and frontend.

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot connect to database" | Make sure PostgreSQL is running and your `.env` password is correct |
| "npm not found" | Install Node.js from nodejs.org |
| Frontend shows "Could not load projects" | Make sure the backend is running on port 4000 |
| Port 4000 already in use | Change `PORT=4001` in `.env` and update the proxy in `frontend/package.json` |
| White page in browser | Open browser DevTools (F12) → Console tab to see errors |

---

## 🚀 Deploying to Production (Optional)

- **Backend:** Deploy to Railway, Render, or Fly.io (all have free tiers)
- **Frontend:** `npm run build` then deploy to Vercel or Netlify
- **Database:** Use Railway Postgres, Supabase, or Neon (all have free tiers)

---

## 📋 Next Steps / Roadmap

- [ ] Add user authentication (contractors log in to save searches)
- [ ] Email alerts when new matching leads are posted
- [ ] Automated daily scraper via cron job
- [ ] Award tracking (mark bids as won/lost/awarded)
- [ ] Map view of project locations
- [ ] Mobile app wrapper
