#!/usr/bin/env python3
"""
scraper/scrape_winnebago.py
────────────────────────────────────────────────────────────────────────────
Real scrapers for:
  1. Winnebago County open bids  → wincoil.gov
  2. City of Rockford open bids  → rockfordil.gov/Bids.aspx

INSTALL:
  pip install requests beautifulsoup4

RUN (live mode):
  python scrape_winnebago.py

RUN against Railway instead of localhost:
  API_BASE=https://your-app.up.railway.app/api python scrape_winnebago.py
────────────────────────────────────────────────────────────────────────────
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, date
import re
import time
import os
import urllib3

# Suppress SSL warnings — wincoil.gov has a self-signed cert issue
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ── Config ───────────────────────────────────────────────────────────────
DEMO_MODE = False   # True = use fake test data, False = scrape live sites

# Override with env var to point at Railway: API_BASE=https://work.up.railway.app/api
API_BASE = os.environ.get("API_BASE", "http://localhost:4000/api")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; WinCoLeadsBot/1.0)"
}

# ── Trade keyword map ─────────────────────────────────────────────────────
TRADE_MAP = [
    (["hvac", "heat", "cooling", "boiler", "mechanical", "ventilat", "air"],    "HVAC"),
    (["electric", "lighting", "panel", "wiring", "ev charger", "power"],         "Electrical"),
    (["plumb", "water main", "sewer", "pump", "pipe", "drain", "well"],          "Plumbing"),
    (["roof", "membrane", "tpo", "shingle", "reroof"],                           "Roofing"),
    (["pav", "asphalt", "road", "street", "resurface", "milling"],               "Paving"),
    (["concrete", "sidewalk", "curb", "flatwork", "ada"],                        "Concrete"),
    (["paint", "coating", "blast", "seal", "wash"],                              "Painting"),
    (["floor", "hardwood", "carpet", "tile"],                                    "Flooring"),
    (["mason", "tuckpoint", "brick", "block", "precast"],                        "Masonry"),
    (["demo", "abate", "remov", "tear"],                                         "Demo/Abatement"),
    (["it ", "network", "server", "software", "computer", "x-ray", "security"], "IT/Technology"),
    (["landscape", "mow", "tree"],                                               "Landscaping"),
]

def detect_trade(title: str) -> str:
    t = title.lower()
    for keywords, category in TRADE_MAP:
        if any(k in t for k in keywords):
            return category
    return "General Construction"

def parse_date(text: str) -> str | None:
    if not text:
        return None
    text = re.sub(r'\s+\d{1,2}:\d{2}\s*(AM|PM)?', '', text.strip(), flags=re.I).strip()
    for fmt in ("%m/%d/%Y", "%B %d, %Y", "%b %d, %Y", "%Y-%m-%d", "%m/%d/%y"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    return None

def determine_type(text: str) -> str:
    t = text.upper()
    if any(x in t for x in ['RFP', 'PROPOSAL']):
        return 'RFP'
    if any(x in t for x in ['RFQ', 'QUALIFICATION', 'QUOTE']):
        return 'RFP'
    if 'PERMIT' in t:
        return 'Permit'
    return 'Bid'


# ── Winnebago County Scraper ──────────────────────────────────────────────
# Source: wincoil.gov/departments/purchasing-department/open-bids-quotes-rfps
# Structure: Joomla CMS, bids listed as <ul> links to PDFs
# Bid number format: 26B-2464, 25P-2450, 25Q-2445
#   B = Bid, P = Proposal/RFP, Q = Quote/RFQ
def scrape_winnebago_county() -> list[dict]:
    url = 'https://wincoil.gov/departments/purchasing-department/open-bids-quotes-rfps'
    print(f"  Fetching {url}...")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20, verify=False)
        resp.raise_for_status()
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        return []

    soup = BeautifulSoup(resp.text, 'html.parser')

    # Try to find the main article content area (Joomla standard)
    content = (
        soup.find('div', class_='item-page') or
        soup.find('div', class_='article-content') or
        soup.find('div', id=re.compile(r'content', re.I)) or
        soup.find('main') or
        soup.find('article') or
        soup.body
    )

    projects = []
    seen_urls = set()

    for link in (content or soup).find_all('a', href=True):
        text = link.get_text(strip=True)
        href = link['href']

        # Match bid number pattern at start: 26B-2464 or 26B-2464 - TITLE
        bid_match = re.match(r'^(\d+[A-Z]+-\d+)\s*[-–]?\s*(.*)$', text, re.IGNORECASE)
        if not bid_match or len(text) < 8:
            continue

        bid_num   = bid_match.group(1).strip()
        title_str = bid_match.group(2).strip() or bid_num

        # Build absolute URL
        if href.startswith('/'):
            source_url = f'https://wincoil.gov{href}'
        elif href.startswith('http'):
            source_url = href
        else:
            source_url = f'https://wincoil.gov/{href}'

        if source_url in seen_urls:
            continue
        seen_urls.add(source_url)

        full_title = f'{bid_num} - {title_str}'

        projects.append({
            'title':           full_title,
            'type':            determine_type(bid_num + ' ' + title_str),
            'trade_category':  detect_trade(title_str),
            'location':        'Winnebago County, IL',
            'filing_date':     None,
            'deadline':        None,
            'estimated_value': None,
            'contact_name':    'Winnebago County Purchasing',
            'contact_email':   'purchasing@wincoil.gov',
            'contact_phone':   '815-319-4215',
            'source_url':      source_url,
            'description':     f'Winnebago County Bid #{bid_num}. See attached PDF for full specifications.',
        })

    print(f"  ✓ Found {len(projects)} bids from Winnebago County")
    return projects


# ── City of Rockford Scraper ──────────────────────────────────────────────
# Source: rockfordil.gov/Bids.aspx  (CivicEngage ASP.NET platform)
# Structure: bid titles are <a href="bids.aspx?bidID=NNN"> links
#   Each bid container has span.BidDetail elements with closing date & bid number
def scrape_rockford() -> list[dict]:
    url = 'https://rockfordil.gov/Bids.aspx'
    print(f"  Fetching {url}...")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        return []

    soup = BeautifulSoup(resp.text, 'html.parser')
    projects = []

    # Find all bid title links (CivicEngage format)
    bid_links = soup.find_all('a', href=re.compile(r'[Bb]ids\.aspx\?[Bb]id[Ii][Dd]=', re.I))

    for link in bid_links:
        title = link.get_text(strip=True)
        if not title or len(title) < 4:
            continue

        href = link.get('href', '')
        source_url = (
            href if href.startswith('http')
            else f'https://rockfordil.gov/{href.lstrip("/")}'
        )

        # Climb up to the nearest block container to find details
        container = link.find_parent(['div', 'tr', 'li', 'section'])
        all_text  = container.get_text(' ', strip=True) if container else ''

        # Extract closing/deadline date (M/D/YYYY format on this site)
        deadline   = None
        dates_found = re.findall(r'\b(\d{1,2}/\d{1,2}/\d{4})\b', all_text)
        if dates_found:
            deadline = parse_date(dates_found[0])

        # Extract bid number (e.g. 226-CD-020, 1125-HS-124)
        bid_number = ''
        num_match  = re.search(
            r'(?:RFP|RFQ|BID|IFB|NO\.?\s*)?(\d{2,4}-[A-Z]{1,3}-\d{2,4})',
            all_text, re.I
        )
        if num_match:
            bid_number = num_match.group(0).strip()

        projects.append({
            'title':           title,
            'type':            determine_type(title + ' ' + bid_number),
            'trade_category':  detect_trade(title),
            'location':        'Rockford, IL',
            'filing_date':     None,
            'deadline':        deadline,
            'estimated_value': None,
            'contact_name':    'City of Rockford Purchasing',
            'contact_email':   'purchasing2@rockfordil.gov',
            'contact_phone':   '779-348-7000',
            'source_url':      source_url,
            'description':     (f'{bid_number} — ' if bid_number else '') + title,
        })

    print(f"  ✓ Found {len(projects)} bids from City of Rockford")
    return projects


# ── Demo data ─────────────────────────────────────────────────────────────
def get_demo_projects() -> list[dict]:
    today = date.today().isoformat()
    return [
        {
            "title":           "Scraper Test: Boiler Replacement - North Fire Station",
            "type":            "Bid",
            "trade_category":  "HVAC",
            "location":        "Rockford, IL",
            "filing_date":     today,
            "deadline":        "2026-04-30",
            "estimated_value": 88000.00,
            "contact_name":    "Demo Contact",
            "contact_email":   "demo@rockfordil.gov",
            "contact_phone":   "815-555-0100",
            "source_url":      f"https://www.rockfordil.gov/bids/demo-boiler-{today}",
            "description":     "Test import. Boiler replacement at North Fire Station.",
        }
    ]


# ── Import to API ─────────────────────────────────────────────────────────
def import_to_api(projects: list[dict]) -> None:
    if not projects:
        print("No projects to import.")
        return
    try:
        print(f"\nImporting {len(projects)} projects to {API_BASE}...")
        resp = requests.post(
            f"{API_BASE}/projects/import",
            json=projects,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        resp.raise_for_status()
        result = resp.json()
        print(f"✅  Import complete: {result.get('inserted', 0)} inserted, "
              f"{result.get('updated', 0)} updated")
    except Exception as e:
        print(f"❌  Import failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print("   Response:", e.response.text[:500])


# ── Main ──────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("WinCo Leads Scraper")
    print(f"Mode : {'DEMO' if DEMO_MODE else 'LIVE'}")
    print(f"API  : {API_BASE}")
    print("=" * 60)

    all_projects = []

    if DEMO_MODE:
        print("\n[DEMO MODE] Using test data.")
        all_projects = get_demo_projects()
    else:
        print("\nScraping Winnebago County...")
        all_projects.extend(scrape_winnebago_county())
        time.sleep(2)   # Be polite — don't hammer servers

        print("\nScraping City of Rockford...")
        all_projects.extend(scrape_rockford())

    print(f"\nTotal collected: {len(all_projects)}")

    if all_projects:
        backup = f"scraped_{date.today().isoformat()}.json"
        with open(backup, "w") as f:
            json.dump(all_projects, f, indent=2, default=str)
        print(f"Saved backup : {backup}")
        import_to_api(all_projects)
    else:
        print("Nothing to import.")


if __name__ == "__main__":
    main()
