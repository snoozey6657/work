#!/usr/bin/env python3
"""
scraper/scrape_winnebago.py
────────────────────────────────────────────────────────────────────────────
Scraper for Winnebago County and City of Rockford public bid pages.
Extracts project data and imports it into the lead aggregator API.

INSTALL DEPENDENCIES:
  pip install requests beautifulsoup4

RUN:
  python scrape_winnebago.py

HOW IT WORKS:
  1. Fetches HTML from government bid listing pages
  2. Parses project info using BeautifulSoup
  3. POSTs extracted data to the local API (/api/import)

NOTE: Government websites change their HTML frequently.
You'll need to inspect the target site and adjust the CSS selectors below.
This script includes example selectors AND a mock/demo mode so you can
test the import pipeline without a live site.
────────────────────────────────────────────────────────────────────────────
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, date
import re
import time

# ── Config ──────────────────────────────────────────────────────────────
API_BASE    = "http://localhost:4000/api"
DEMO_MODE   = True   # Set to False to scrape real sites

# Target pages (add more as needed)
SOURCES = [
    {
        "name":     "Winnebago County Purchasing",
        "url":      "https://www.wincoil.us/purchasing/bids",
        "type":     "Bid",
        "location": "Rockford, IL",
    },
    {
        "name":     "City of Rockford Bids",
        "url":      "https://www.rockfordil.gov/bids",
        "type":     "Bid",
        "location": "Rockford, IL",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; LeadAggregatorBot/1.0; +https://wincoleads.com)"
}

# ── Trade keyword mapping ─────────────────────────────────────────────────
# Maps keywords in project titles to trade categories
TRADE_MAP = [
    (["hvac", "heat", "cooling", "boiler", "mechanical"], "HVAC"),
    (["electric", "lighting", "panel", "wiring", "ev charger"], "Electrical"),
    (["plumb", "water main", "sewer", "pump", "pipe"], "Plumbing"),
    (["roof", "membrane", "tpo", "shingle"], "Roofing"),
    (["pav", "asphalt", "road", "street", "resurface"], "Paving"),
    (["concrete", "sidewalk", "curb", "flatwork"], "Concrete"),
    (["paint", "coating", "blast"], "Painting"),
    (["floor", "hardwood", "carpet", "tile"], "Flooring"),
    (["mason", "tuckpoint", "brick", "block"], "Masonry"),
    (["demo", "abate", "remov"], "Demo/Abatement"),
    (["it ", "network", "server", "software"], "IT/Technology"),
    (["landscape", "mow", "tree"], "Landscaping"),
]

def detect_trade(title: str) -> str:
    """Guess trade category from title keywords."""
    title_lower = title.lower()
    for keywords, category in TRADE_MAP:
        if any(k in title_lower for k in keywords):
            return category
    return "General Construction"


def parse_value(text: str) -> float | None:
    """Extract a dollar value from strings like '$450,000' or 'Est. $1.2M'."""
    if not text:
        return None
    text = text.replace(',', '').replace('$', '')
    # Handle shorthand like "1.2M" or "450K"
    m = re.search(r'(\d+(?:\.\d+)?)\s*([MmKk]?)', text)
    if not m:
        return None
    num = float(m.group(1))
    suffix = m.group(2).upper()
    if suffix == 'M':
        num *= 1_000_000
    elif suffix == 'K':
        num *= 1_000
    return round(num, 2)


def parse_date(text: str) -> str | None:
    """Try to parse various date formats, return ISO string or None."""
    if not text:
        return None
    text = text.strip()
    for fmt in ("%m/%d/%Y", "%B %d, %Y", "%b %d, %Y", "%Y-%m-%d", "%m/%d/%y"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return None


# ── Real scraper function ─────────────────────────────────────────────────
def scrape_source(source: dict) -> list[dict]:
    """
    Fetch and parse a single bid listing page.
    ⚠️  Selectors below are EXAMPLES — you must inspect the real site and adjust.
    """
    try:
        print(f"  Fetching {source['url']}...")
        resp = requests.get(source["url"], headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"  ✗ Failed to fetch {source['url']}: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    projects = []

    # ── ADJUST THESE SELECTORS to match the real page structure ──────────
    # Example: table rows in a bid listing table
    rows = soup.select("table.bids-table tbody tr")

    if not rows:
        # Fallback: try common div-based listing patterns
        rows = soup.select(".bid-item, .project-listing, article.bid")

    for row in rows:
        try:
            # These selectors are illustrative — inspect the real HTML
            title_el    = row.select_one(".bid-title, td:nth-child(1), h3")
            date_el     = row.select_one(".bid-date, .filing-date, td:nth-child(2)")
            deadline_el = row.select_one(".bid-deadline, .due-date, td:nth-child(3)")
            value_el    = row.select_one(".bid-value, .estimate, td:nth-child(4)")
            contact_el  = row.select_one(".bid-contact, .contact-name")
            email_el    = row.select_one("a[href^='mailto:']")
            link_el     = row.select_one("a[href]")

            if not title_el:
                continue

            title = title_el.get_text(strip=True)
            if len(title) < 5:
                continue

            project = {
                "title":           title,
                "type":            source.get("type", "Bid"),
                "trade_category":  detect_trade(title),
                "location":        source.get("location", "Winnebago County, IL"),
                "filing_date":     parse_date(date_el.get_text() if date_el else ""),
                "deadline":        parse_date(deadline_el.get_text() if deadline_el else ""),
                "estimated_value": parse_value(value_el.get_text() if value_el else ""),
                "contact_name":    contact_el.get_text(strip=True) if contact_el else None,
                "contact_email":   email_el["href"].replace("mailto:", "") if email_el else None,
                "contact_phone":   None,
                "source_url":      link_el["href"] if link_el and link_el.get("href") else source["url"],
                "description":     f"Sourced from {source['name']}. {title}",
            }
            projects.append(project)
        except Exception as e:
            print(f"    Skipped row due to error: {e}")
            continue

    print(f"  ✓ Found {len(projects)} projects from {source['name']}")
    return projects


# ── Demo / test data ──────────────────────────────────────────────────────
def get_demo_projects() -> list[dict]:
    """
    Returns fake scraped data to test the import pipeline.
    Useful when you don't have internet access or want to test the DB import.
    """
    today = date.today().isoformat()
    return [
        {
            "title": "Scraper Test: Boiler Replacement - North Fire Station",
            "type": "Bid",
            "trade_category": "HVAC",
            "location": "Rockford, IL",
            "filing_date": today,
            "deadline": "2025-04-30",
            "estimated_value": 88000.00,
            "contact_name": "Demo Contact",
            "contact_email": "demo@rockfordil.gov",
            "contact_phone": "815-555-0100",
            "source_url": f"https://www.rockfordil.gov/bids/demo-boiler-{today}",
            "description": "Test import from scraper. Boiler replacement at North Fire Station. Two-stage natural gas boiler, 400 MBH input."
        },
        {
            "title": "Scraper Test: Parking Lot Resurfacing - County Admin Building",
            "type": "Bid",
            "trade_category": "Paving",
            "location": "Rockford, IL",
            "filing_date": today,
            "deadline": "2025-05-15",
            "estimated_value": 62000.00,
            "contact_name": "Demo Paving Contact",
            "contact_email": "paving@wincoil.us",
            "contact_phone": "815-319-4200",
            "source_url": f"https://www.wincoil.us/bids/paving-demo-{today}",
            "description": "Test import. Parking lot mill and overlay at County Admin Building. Approx 18,000 sq ft."
        }
    ]


# ── Import to API ─────────────────────────────────────────────────────────
def import_to_api(projects: list[dict]) -> None:
    """POST the project list to the local API."""
    if not projects:
        print("No projects to import.")
        return

    try:
        print(f"\nImporting {len(projects)} projects to API...")
        resp = requests.post(
            f"{API_BASE}/projects/import",
            json=projects,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        resp.raise_for_status()
        result = resp.json()
        print(f"✅  Import complete: {result.get('inserted', 0)} inserted, {result.get('updated', 0)} updated")
    except Exception as e:
        print(f"❌  Import failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print("   API response:", e.response.text[:500])


# ── Main ──────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("WinCo Leads Scraper")
    print(f"Mode: {'DEMO' if DEMO_MODE else 'LIVE'}")
    print("=" * 60)

    all_projects = []

    if DEMO_MODE:
        print("\n[DEMO MODE] Using test data instead of live scraping.")
        all_projects = get_demo_projects()
    else:
        for source in SOURCES:
            print(f"\nScraping: {source['name']}")
            projects = scrape_source(source)
            all_projects.extend(projects)
            time.sleep(2)  # Be polite — don't hammer servers

    print(f"\nTotal projects collected: {len(all_projects)}")

    if all_projects:
        # Save a local JSON backup before importing
        backup_file = f"scraped_{date.today().isoformat()}.json"
        with open(backup_file, "w") as f:
            json.dump(all_projects, f, indent=2)
        print(f"Saved backup to: {backup_file}")

        import_to_api(all_projects)


if __name__ == "__main__":
    main()
