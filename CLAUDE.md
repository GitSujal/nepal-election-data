# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nepal election data pipeline and dashboard: scrapes election data from Nepal's Election Commission (result.election.gov.np), stores as JSON/CSV, loads into DuckDB, transforms with dbt, and visualizes via a Next.js static site deployed to Cloudflare Pages. Covers 2074 BS, 2079 BS parliamentary results (past) and 2082 BS candidate data (current), for both FPTP and proportional elections.

## Tech Stack

- **Python 3.13** (`.python-version`) with `uv` package manager — requires-python >=3.12
- **DuckDB** as the analytical database
- **dbt-duckdb** for data transformation (staging views + mart tables)
- **Playwright/BeautifulSoup4** for web scraping
- **Google Gemini API** (`google-genai`) for AI-powered candidate profile enrichment (dev dependency)
- **Next.js 16** + **React 19** + **Tailwind CSS 4** for the static web dashboard
- **Radix UI** + **Recharts** + **Lucide React** for UI components and charts
- **Cloudflare Pages** for deployment (via Wrangler CLI or GitHub Actions)

## Important Rules

- **Always use `uv` to run Python commands** (e.g. `uv run python script.py`, `uv run dbt build`).
- **Always `cd election/` before running dbt commands.**
- **Never commit or push changes** — leave that for the user.
- **Always test your changes.** For data changes, take at least a few samples and verify the data matches expectations.
- **When any dbt model changes, run `uv run dbt build` (all models)** — don't only run the changed model. This ensures no breakage in dependent models.
- **Run `uv run export_to_json.py` after data model changes** to regenerate frontend JSON in `public/data/`. Do not use a browser to check things — check using JSON files or commands.
- **Raw data loading** (`uv run load_raw_data.py`) is only needed if the DuckDB file was deleted or new raw data was added.

## Key Commands

```bash
# Load raw JSON/CSV data into DuckDB (only when needed)
uv run load_raw_data.py

# Run all dbt models (MUST be from election/ directory)
cd election && uv run dbt build

# Run a specific model
cd election && uv run dbt run --select dim_current_fptp_candidates

# Run dbt tests
cd election && uv run dbt test

# Run dbt seeds (mapping tables)
cd election && uv run dbt seed

# Export dim tables to JSON for frontend
uv run export_to_json.py

# Run e2e tests
uv run pytest

# Next.js development server (runs full pipeline first)
npm run dev

# Build and deploy to Cloudflare Pages
npm run deploy
```

**npm scripts** (in `package.json`):
```bash
npm run load-raw-data       # uv run load_raw_data.py
npm run run-dbt-models      # cd election && uv run dbt build
npm run prepare-data        # uv run export_to_json.py
npm run all-data-works      # load-raw-data → run-dbt-models → prepare-data
npm run build               # all-data-works → next build
npm run dev                 # all-data-works → next dev
npm run deploy              # build → wrangler pages deploy out
```

Environment variables (set automatically by VS Code, needed for CLI):
```bash
export DBT_PROJECT_DIR=election
export DBT_PROFILES_DIR=election
```

## Data Pipeline Architecture

```
Web Scrapers (scrape_scripts/*.py)
  → Raw Data Files (data/*.json, data/*.csv)
    → load_raw_data.py (DuckDB ingestion)
      → DuckDB (election/election.db) raw tables
        → dbt Staging Models (stg_*) — 13 views
          → dbt Mart Models (dim_*) — 7 tables
            → export_to_json.py → public/data/*.json
              → Next.js Dashboard (app/ + components/)
```

### Scrapers (`scrape_scripts/`)

| Script | Description |
|--------|-------------|
| `get_current_first_past_the_post_candidates.py` | 2082 BS FPTP candidates from result.election.gov.np |
| `get_2079_first_past_the_post_election_result.py` | 2079 BS FPTP results |
| `get_2079_proportional_election_result.py` | 2079 BS proportional results (nested JSON) |
| `get_2074_first_past_the_post_election_result.py` | 2074 BS FPTP results |
| `get_2074_proportional_election_result.py` | 2074 BS proportional results |
| `get_parliament_members.py` | Parliament members from hr.parliament.gov.np |
| `scrape_party_symbols.py` | Party metadata from Wikipedia |

### Raw Data Files (`data/`)

- `current_first_past_the_post_candidates.json` — 2082 FPTP candidates
- `current_proportional_election_candidates.csv` — 2082 PR candidates
- `past_2079_first_past_the_post_election_result.json`, `past_2079_proportional_election_result.json` — 2079 results
- `2074_first_past_the_post_election_result.json`, `2074_proportional_election_result.json` — 2074 results
- `states.json`, `districts.json`, `constituency.json` — Geographic reference
- `parliament_members.json` — Parliament member data (2074/2079 terms)
- `political_party_symbols.json` — Party metadata from Wikipedia
- `candidate_addresses.json`, `local_bodies.json`, `candidate_address_to_district_mapping.json`
- `candidates_history/` — 3K+ individual JSON files (Gemini-generated candidate profiles)

### Root-level Python Files

| File | Purpose |
|------|---------|
| `load_raw_data.py` | Loads JSON/CSV from `data/` into DuckDB `election/election.db` |
| `export_to_json.py` | Exports 7 tables from DuckDB to `public/data/*.json` for frontend |
| `candidate_profile_fetcher.py` | Async Gemini API candidate profile enrichment with grounding metadata |
| `test_grounding_metadata.py` | Tests for grounding metadata enrichment |

### dbt Project (`election/`)

**Staging** (`models/staging/`) — 13 views that clean raw DuckDB tables:
- Reference: `stg_states`, `stg_districts`, `stg_constituency`
- 2082 candidates: `stg_current_fptp_candidates`, `stg_current_proportional_candidates`
- 2079 results: `stg_past_2079_fptp_election_result`, `stg_past_2079_proportional_election_result`
- 2074 results: `stg_past_2074_fptp_election_result`, `stg_past_2074_proportional_election_result`
- Parliament/party: `stg_parliament_members`, `stg_political_party_symbols`
- Candidate enrichment: `stg_candidates_political_history`, `stg_candidate_address_to_district_mapping`
- Source definitions in `sources.yml`; column docs in `stg_staging.yml`

**Marts** (`models/marts/`) — 7 dimension tables:
- `dim_parties` — Master party dimension with merger/rename tracking via seed. Includes Wikipedia metadata (symbol, leader, founding year).
- `dim_parliament_members` — Parliament member history across 2074 & 2079 terms. 3-tier name matching: exact → normalized → manual seed mapping.
- `dim_current_fptp_candidates` — Enriched 2082 FPTP candidates (60+ columns). Joins with 2079 and 2074 results. 18+ boolean flags: `is_tourist_candidate`, `is_chheparo` (party switcher), `is_vaguwa` (geographic mover), `is_new_candidate`, `is_loyal`, `is_opportunist`, etc. Tags array generated from flags.
- `dim_fptp_2079_candidates` — Same structure as above but for 2079 election cycle (2074 as previous).
- `dim_current_proportional_candidates` — 2082 PR candidates. 3-tier party matching: direct → seed mapping → associated_party fallback. 17+ boolean flags.
- `dim_constituency_profile` — Constituency analytics with JSON election results, stronghold/swing/pakad detection.
- `dim_parties_profile` — Party-level analytics with historical performance and current candidate composition as JSON.
- Column docs in `marts.yml`

**Seeds** (`seeds/`) — 7 mapping CSVs:
- `party_current_new_name_mapping.csv` — Party rename/merger history (~124 entries)
- `proportional_to_fptp_party_name_mapping.csv` — Maps proportional party names to FPTP equivalents
- `qualification_level_mapping.csv` — Standardizes 950+ qualification text variations to 6 levels
- `parliament_member_name_mapping.csv` — Manual name corrections for cross-term spelling inconsistencies
- `candidate_name_mapping.csv` — Manual candidate name corrections
- `district_name_mapping.csv` — District name standardization
- `fptp_candidate_match_override.csv` — Manual overrides for FPTP candidate matching across elections

**Macros** (`macros/`) — 4 SQL macros:
- `sanitize_candidate_name.sql` — Devanagari name normalization (strips ZWJ/ZWNJ, titles, normalizes vowels/conjuncts)
- `sanitize_party_name.sql` — Party name normalization
- `sanitize_inclusive_group.sql` — Inclusive group name normalization
- `is_same_party.sql` — Merger-aware party comparison

### Next.js Dashboard

**Pages** (`app/`):
- `page.tsx` — Home: Tabbed FPTP/PR candidate browser with cascading filters and detail views
- `constituency/page.tsx` — Constituency profiles with election comparison (2079/2074)
- `party/page.tsx` — Party deep dive with stats and historical performance
- `party-comparison/page.tsx` — Side-by-side party comparison
- `layout.tsx` — Root layout with ThemeProvider, NavHeader, Footer, Vercel Analytics
- `not-found.tsx` — 404 page

**Components** (`components/`):
- `candidate/` — 16 components (filter, grid, details, timelines, badges, profile headers)
- `constituency/` — 5 components (filter, header, results, comparison)
- `party/` — 5 components (filter, header, stats, history)
- `ui/` — 57 Radix UI + custom components (shadcn/ui pattern)
- Root: `nav-header.tsx`, `footer.tsx`, `theme-provider.tsx`, `theme-toggle.tsx`

**Hooks** (`hooks/`):
- `use-json-data.ts` — Fetch and cache JSON from `/public/data/`
- `use-url-state.ts` — URL-based filter state with search params
- `use-party-symbols.ts` — Party symbol lookups
- `use-political-history.ts` — Political history timeline data
- `use-mobile.ts` — Mobile detection
- `use-toast.ts` — Toast notifications

**Lib** (`lib/`):
- `candidates-data.ts` — Candidate type definitions
- `constituency-data.ts` — Constituency data structures
- `filter-types.ts` — FPTPFilterState, PRFilterState, UrlFilterState interfaces
- `utils.ts` — Utility functions (cn, etc.)

**Generated Frontend Data** (`public/data/` — gitignored, built by `export_to_json.py`):
- `dim_current_fptp_candidates.json`, `dim_current_proportional_candidates.json`
- `dim_parties.json`, `dim_constituency_profile.json`, `dim_parties_profile.json`
- `political_party_symbols.json`, `candidates_political_history.json`

**Config**: Static export (`output: 'export'` in `next.config.mjs`), build output: `out/`

### Tests (`tests/e2e_tests/`)

- `conftest.py` — Pytest configuration with DuckDB fixture
- `test_dim_fptp_candidates.py` — FPTP candidate field validation
- `test_dim_pr_candidates.py` — PR candidate tests
- `test_dim_parties.py` — Party dimension tests
- `test_dim_constiuencies.py` — Constituency tests

Tests validate required fields, tag arrays, geography consistency, and data types.

### CI/CD (`.github/workflows/deploy.yml`)

Triggers on push/PR to main. Steps: checkout → setup Node 24 → setup UV → `uv sync` → `uv run load_raw_data.py` → `cd election && uv run dbt build` → `uv run export_to_json.py` → `uv run pytest` → `npm ci` → `npm run build` → deploy to Cloudflare Pages.

Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Key Design Decisions

- `stg_past_2079_proportional_election_result` uses `CROSS JOIN UNNEST` to flatten deeply nested JSON (state→district→constituency→results)
- `stg_parliament_members` uses complex regex + Unicode replacement pipeline to normalize Devanagari names for cross-term matching (strips ZWJ/ZWNJ, titles, normalizes vowels, conjuncts, व↔ब variations)
- `stg_candidates_political_history` unnests JSON arrays from the Gemini-generated `candidates_history/` files
- All staging models use `{{ adapter.quote() }}` for column quoting (DuckDB compatibility)
- Geographic names are in Nepali (Devanagari script)
- `dim_current_fptp_candidates` LEFT JOINs to 2079 and 2074 election results and `dim_parliament_members` to build 3-election history
- 3-tier party matching in `dim_current_proportional_candidates`: direct name match → seed mapping → associated_party fallback
- 3-tier name matching in `dim_parliament_members`: exact → normalized → manual seed mapping
- Merger-aware party comparison uses `list_contains(dim_parties.previous_names, ...)`
- Boolean flags follow `is_*` naming convention; `tags` arrays generated from flags via `list_filter()` for frontend consumption
- `dim_constituency_profile` stores complete election results as JSON arrays per constituency
- `dim_parties_profile` returns complex nested JSON for historical and current stats
- Next.js site uses static export to `out/` for Cloudflare Pages deployment
- Frontend data is pre-built JSON (no runtime database queries) — `export_to_json.py` extracts from DuckDB
- URL-based filter state via `use-url-state.ts` for shareable/bookmarkable filter views
