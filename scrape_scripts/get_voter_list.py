"""
Async voter list stats scraper for voterlist.election.gov.np.

Scrapes aggregated voter statistics (counts by gender and age bucket) per polling
center across Nepal. Uses async aiohttp for concurrent requests with semaphore
throttling. Outputs a single JSONL file with one line per polling center.

The site uses cascading dropdowns: State → District → Municipality → Ward → Polling Center.
Each dropdown is populated via POST to index_process.php.
The voter table is returned by POST to view_ward.php with all selected values.

Usage:
    uv run python scrape_scripts/get_voter_list.py                    # all Nepal
    uv run python scrape_scripts/get_voter_list.py --state 3          # one state
    uv run python scrape_scripts/get_voter_list.py --state 3 --district 26  # one district
    uv run python scrape_scripts/get_voter_list.py --concurrency 20   # tune parallelism
"""

import argparse
import asyncio
import json
import re
import sys
from collections import Counter
from pathlib import Path

import aiohttp
from bs4 import BeautifulSoup

BASE_URL = "https://voterlist.election.gov.np"
PROCESS_URL = f"{BASE_URL}/index_process.php"
VIEW_WARD_URL = f"{BASE_URL}/view_ward.php"

OUTPUT_DIR = Path("data")
OUTPUT_FILE = OUTPUT_DIR / "voter_list_stats.jsonl"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Referer": BASE_URL,
    "Origin": BASE_URL,
}

STATES = [
    {"id": "1", "name": "कोशी प्रदेश"},
    {"id": "2", "name": "मधेश प्रदेश"},
    {"id": "3", "name": "बागमती प्रदेश"},
    {"id": "4", "name": "गण्डकी प्रदेश"},
    {"id": "5", "name": "लुम्बिनी प्रदेश"},
    {"id": "6", "name": "कर्णाली प्रदेश"},
    {"id": "7", "name": "सुदूरपश्चिम प्रदेश"},
]


def parse_options_html(html_str: str) -> list[dict]:
    """Parse HTML option tags returned by index_process.php into [{id, name}]."""
    soup = BeautifulSoup(html_str, "html.parser")
    return [
        {"id": opt.get("value", ""), "name": opt.get_text(strip=True)}
        for opt in soup.find_all("option")
        if opt.get("value", "")
    ]


def make_center_key(state_id, district_id, mun_id, ward, center_id) -> str:
    return f"{state_id}_{district_id}_{mun_id}_{ward}_{center_id}"


def load_done_keys(output_file: Path) -> set[str]:
    """Load set of already-scraped polling center keys from existing JSONL."""
    done = set()
    if not output_file.exists():
        return done
    with open(output_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
                key = make_center_key(
                    row["state_id"], row["district_id"],
                    row["municipality_id"], row["ward"],
                    row["polling_center_id"],
                )
                done.add(key)
            except (json.JSONDecodeError, KeyError):
                continue
    return done


class VoterListScraper:
    def __init__(self, concurrency: int = 10):
        self.semaphore = asyncio.Semaphore(concurrency)
        self.session: aiohttp.ClientSession | None = None
        self.write_lock = asyncio.Lock()
        self.stats = {"centers_done": 0, "centers_skipped": 0, "total_voters": 0}

    async def create_session(self):
        connector = aiohttp.TCPConnector(limit=30, ttl_dns_cache=300)
        jar = aiohttp.CookieJar()
        self.session = aiohttp.ClientSession(
            headers=HEADERS, connector=connector, cookie_jar=jar,
        )
        # Initialize cookies
        async with self.session.get(BASE_URL, timeout=aiohttp.ClientTimeout(total=30)):
            pass

    async def close_session(self):
        if self.session:
            await self.session.close()
            self.session = None

    async def async_post(
        self, url: str, data: dict, timeout: int = 30, max_retries: int = 5,
    ) -> str:
        """POST with exponential backoff retry, under semaphore."""
        async with self.semaphore:
            for attempt in range(max_retries):
                try:
                    ct = aiohttp.ClientTimeout(total=timeout)
                    async with self.session.post(url, data=data, timeout=ct) as resp:
                        resp.raise_for_status()
                        return await resp.text()
                except (
                    aiohttp.ClientError, asyncio.TimeoutError, OSError,
                ) as e:
                    wait = 1.5 * (2 ** attempt)
                    if attempt < max_retries - 1:
                        print(f"      Retry {attempt+1}/{max_retries} after {wait:.0f}s: {e}")
                        await asyncio.sleep(wait)
                        # Re-init cookies on connection errors
                        try:
                            async with self.session.get(
                                BASE_URL, timeout=aiohttp.ClientTimeout(total=30),
                            ):
                                pass
                        except Exception:
                            pass
                    else:
                        raise

    async def fetch_options(self, data: dict) -> list[dict]:
        """Fetch dropdown options from index_process.php."""
        text = await self.async_post(PROCESS_URL, data)
        result = json.loads(text)
        return parse_options_html(result["result"])

    async def get_districts(self, state_id: str) -> list[dict]:
        return await self.fetch_options({"state": state_id, "list_type": "district"})

    async def get_municipalities(self, district_id: str) -> list[dict]:
        return await self.fetch_options({"district": district_id, "list_type": "vdc"})

    async def get_wards(self, vdc_id: str) -> list[dict]:
        return await self.fetch_options({"vdc": vdc_id, "list_type": "ward"})

    async def get_polling_centers(self, vdc_id: str, ward: str) -> list[dict]:
        return await self.fetch_options(
            {"vdc": vdc_id, "ward": ward, "list_type": "reg_centre"},
        )

    def parse_voter_stats(self, html: str) -> dict | None:
        """Parse voter table HTML and return aggregated stats (no individual voter data)."""
        soup = BeautifulSoup(html, "html.parser")

        metadata = {}
        for card in soup.select(".card-title"):
            text = card.get_text(strip=True)
            if "प्रतिनिधि सभा" in text:
                match = re.search(r"(\d+)", text)
                if match:
                    metadata["fptp_constituency"] = match.group(1)
            elif "प्रदेश सभा" in text:
                match = re.search(r"(\d+)", text)
                if match:
                    metadata["province_constituency"] = match.group(1)

        center_card = soup.find("h5", string=re.compile("मतदान केन्द्र"))
        if center_card:
            span = center_card.find("span")
            if span:
                metadata["polling_center_name"] = span.get_text(strip=True)

        table = soup.find("table", id="tbl_data")
        if not table:
            return None

        tbody = table.find("tbody")
        if not tbody:
            return metadata | {
                "total_voters": 0, "male": 0, "female": 0, "other_gender": 0,
                "age_18_29": 0, "age_30_44": 0, "age_45_59": 0, "age_60_plus": 0,
            }

        # Aggregate in-place — never build a list of voter dicts
        total = 0
        male = 0
        female = 0
        age_18_29 = 0
        age_30_44 = 0
        age_45_59 = 0
        age_60_plus = 0

        for row in tbody.find_all("tr"):
            cells = row.find_all("td")
            if len(cells) < 7:
                continue
            total += 1

            gender = cells[4].get_text(strip=True)
            if gender == "पुरुष":
                male += 1
            elif gender == "महिला":
                female += 1

            age_text = cells[3].get_text(strip=True)
            if age_text.isdigit():
                age = int(age_text)
                if age <= 29:
                    age_18_29 += 1
                elif age <= 44:
                    age_30_44 += 1
                elif age <= 59:
                    age_45_59 += 1
                else:
                    age_60_plus += 1

        other_gender = total - male - female

        return metadata | {
            "total_voters": total,
            "male": male,
            "female": female,
            "other_gender": other_gender,
            "age_18_29": age_18_29,
            "age_30_44": age_30_44,
            "age_45_59": age_45_59,
            "age_60_plus": age_60_plus,
        }

    async def scrape_center(
        self,
        out_f,
        done_keys: set[str],
        state_id: str, state_name: str,
        district_id: str, district_name: str,
        mun_id: str, mun_name: str,
        ward: str,
        center_id: str, center_name: str,
    ):
        """Scrape a single polling center and append stats to JSONL."""
        key = make_center_key(state_id, district_id, mun_id, ward, center_id)
        if key in done_keys:
            self.stats["centers_skipped"] += 1
            return

        try:
            html = await self.async_post(
                VIEW_WARD_URL,
                {
                    "state": state_id,
                    "district": district_id,
                    "vdc_mun": mun_id,
                    "ward": ward,
                    "reg_centre": center_id,
                },
                timeout=90,
            )

            stats = self.parse_voter_stats(html)
            if stats is None:
                print(f"    WARNING: No voter table for center {center_name}")
                return

            row = {
                "state_id": state_id,
                "state_name": state_name,
                "district_id": district_id,
                "district_name": district_name,
                "municipality_id": mun_id,
                "municipality_name": mun_name,
                "ward": ward,
                "polling_center_id": center_id,
                **stats,
            }

            async with self.write_lock:
                out_f.write(json.dumps(row, ensure_ascii=False) + "\n")
                out_f.flush()
                done_keys.add(key)
                self.stats["centers_done"] += 1
                self.stats["total_voters"] += stats["total_voters"]

            print(
                f"    {district_name} | Ward {ward:>2} | "
                f"{(stats.get('polling_center_name', center_name))[:40]:<40} | "
                f"{stats['total_voters']:>5} voters | "
                f"Done: {self.stats['centers_done']}"
            )
        except Exception as e:
            print(f"    FAILED: {district_name} Ward {ward} center {center_name}: {e}")

    async def discover_polling_centers(
        self,
        state_filter: str | None = None,
        district_filter: str | None = None,
    ) -> list[dict]:
        """Build flat list of all polling centers to scrape."""
        print("Discovering polling centers...")
        states = STATES
        if state_filter:
            states = [s for s in states if s["id"] == state_filter]
            if not states:
                print(f"ERROR: State {state_filter} not found")
                return []

        all_centers = []

        # Fetch districts for all states concurrently
        async def discover_state(state):
            districts = await self.get_districts(state["id"])
            if district_filter:
                districts = [d for d in districts if d["id"] == district_filter]
            return state, districts

        state_results = await asyncio.gather(
            *[discover_state(s) for s in states],
        )

        # Fetch municipalities for all districts concurrently
        district_tasks = []
        for state, districts in state_results:
            for district in districts:
                district_tasks.append((state, district))

        print(f"  Found {len(district_tasks)} district(s) to scrape")

        async def discover_district(state, district):
            municipalities = await self.get_municipalities(district["id"])
            return state, district, municipalities

        mun_results = await asyncio.gather(
            *[discover_district(s, d) for s, d in district_tasks],
        )

        # Fetch wards for all municipalities concurrently
        async def discover_municipality(state, district, mun):
            wards = await self.get_wards(mun["id"])
            return state, district, mun, wards

        ward_tasks = []
        for state, district, municipalities in mun_results:
            for mun in municipalities:
                ward_tasks.append((state, district, mun))

        print(f"  Found {len(ward_tasks)} municipality/ies to scrape")

        ward_results = await asyncio.gather(
            *[discover_municipality(s, d, m) for s, d, m in ward_tasks],
        )

        # Fetch polling centers for all wards concurrently
        async def discover_ward(state, district, mun, ward):
            centers = await self.get_polling_centers(mun["id"], ward["id"])
            return state, district, mun, ward, centers

        center_tasks = []
        for state, district, mun, wards in ward_results:
            for ward in wards:
                center_tasks.append((state, district, mun, ward))

        print(f"  Found {sum(len(w) for _, _, _, w in ward_results)} ward(s)")

        center_results = await asyncio.gather(
            *[discover_ward(s, d, m, w) for s, d, m, w in center_tasks],
        )

        for state, district, mun, ward, centers in center_results:
            for center in centers:
                all_centers.append({
                    "state_id": state["id"],
                    "state_name": state["name"],
                    "district_id": district["id"],
                    "district_name": district["name"],
                    "municipality_id": mun["id"],
                    "municipality_name": mun["name"],
                    "ward": ward["id"],
                    "center_id": center["id"],
                    "center_name": center["name"],
                })

        print(f"  Found {len(all_centers)} polling center(s) total")
        return all_centers

    async def run(
        self,
        state_filter: str | None = None,
        district_filter: str | None = None,
        concurrency: int = 10,
    ):
        self.semaphore = asyncio.Semaphore(concurrency)
        await self.create_session()

        try:
            # Discovery phase
            centers = await self.discover_polling_centers(state_filter, district_filter)
            if not centers:
                print("No polling centers found.")
                return

            # Resume support
            done_keys = load_done_keys(OUTPUT_FILE)
            to_scrape = [
                c for c in centers
                if make_center_key(
                    c["state_id"], c["district_id"],
                    c["municipality_id"], c["ward"], c["center_id"],
                ) not in done_keys
            ]

            if done_keys:
                print(f"\nResuming: {len(done_keys)} centers already done, {len(to_scrape)} remaining")
            else:
                print(f"\nScraping {len(to_scrape)} polling centers")

            if not to_scrape:
                print("All centers already scraped!")
                print_summary(OUTPUT_FILE)
                return

            # Scraping phase
            with open(OUTPUT_FILE, "a", encoding="utf-8") as out_f:
                tasks = [
                    self.scrape_center(
                        out_f, done_keys,
                        c["state_id"], c["state_name"],
                        c["district_id"], c["district_name"],
                        c["municipality_id"], c["municipality_name"],
                        c["ward"],
                        c["center_id"], c["center_name"],
                    )
                    for c in to_scrape
                ]
                await asyncio.gather(*tasks)

            print(f"\n{'='*60}")
            print(f"Scraping complete!")
            print(f"  Centers scraped: {self.stats['centers_done']}")
            print(f"  Centers skipped (already done): {self.stats['centers_skipped']}")
            print(f"  Total voters (this run): {self.stats['total_voters']:,}")
            print(f"  Output: {OUTPUT_FILE}")
            print(f"{'='*60}")

            print_summary(OUTPUT_FILE)

        finally:
            await self.close_session()


def print_summary(output_file: Path):
    """Read JSONL and print constituency-level summary."""
    if not output_file.exists():
        return

    by_constituency: dict[str, Counter] = {}
    total_centers = 0

    with open(output_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            total_centers += 1
            fptp = row.get("fptp_constituency", "unknown")
            district = row.get("district_name", "")
            key = f"{district} - क्षेत्र {fptp}"

            if key not in by_constituency:
                by_constituency[key] = Counter()

            c = by_constituency[key]
            c["total_voters"] += row.get("total_voters", 0)
            c["male"] += row.get("male", 0)
            c["female"] += row.get("female", 0)
            c["other_gender"] += row.get("other_gender", 0)
            c["age_18_29"] += row.get("age_18_29", 0)
            c["age_30_44"] += row.get("age_30_44", 0)
            c["age_45_59"] += row.get("age_45_59", 0)
            c["age_60_plus"] += row.get("age_60_plus", 0)
            c["centers"] += 1

    grand_total = sum(c["total_voters"] for c in by_constituency.values())

    print(f"\n{'='*80}")
    print(f"  VOTER SUMMARY — {total_centers} polling centers")
    print(f"{'='*80}")
    print(f"  Grand total voters: {grand_total:,}")
    print(f"  Constituencies: {len(by_constituency)}")

    for key in sorted(by_constituency.keys()):
        c = by_constituency[key]
        total = c["total_voters"]
        if total == 0:
            continue
        male_pct = c["male"] / total * 100
        female_pct = c["female"] / total * 100

        print(f"\n  ┌─ {key}")
        print(f"  │  Total voters:     {total:>8,}")
        print(f"  │  Male / Female:    {c['male']:>8,} ({male_pct:.1f}%) / {c['female']:>8,} ({female_pct:.1f}%)")
        if c["other_gender"]:
            print(f"  │  Other gender:     {c['other_gender']:>8,}")
        print(f"  │  Age 18-29:        {c['age_18_29']:>8,}  ({c['age_18_29']/total*100:.1f}%)")
        print(f"  │  Age 30-44:        {c['age_30_44']:>8,}  ({c['age_30_44']/total*100:.1f}%)")
        print(f"  │  Age 45-59:        {c['age_45_59']:>8,}  ({c['age_45_59']/total*100:.1f}%)")
        print(f"  │  Age 60+:          {c['age_60_plus']:>8,}  ({c['age_60_plus']/total*100:.1f}%)")
        print(f"  └─ Polling centers:  {c['centers']}")


def main():
    parser = argparse.ArgumentParser(
        description="Scrape voter list stats from voterlist.election.gov.np",
    )
    parser.add_argument("--state", type=str, help="State ID to scrape (e.g. 3)")
    parser.add_argument("--district", type=str, help="District ID to scrape (e.g. 26)")
    parser.add_argument(
        "--concurrency", type=int, default=10,
        help="Max concurrent requests (default: 10)",
    )
    args = parser.parse_args()

    if args.district and not args.state:
        print("ERROR: --district requires --state")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    scraper = VoterListScraper(concurrency=args.concurrency)
    asyncio.run(scraper.run(
        state_filter=args.state,
        district_filter=args.district,
        concurrency=args.concurrency,
    ))


if __name__ == "__main__":
    main()
