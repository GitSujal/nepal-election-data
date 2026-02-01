# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nepal election data pipeline and dashboard: scrapes election data from Nepal's Election Commission (result.election.gov.np), stores as JSON/CSV, loads into DuckDB, transforms with dbt, and visualizes via a Next.js static site (deployed to Cloudflare Pages) and a Streamlit dashboard. Covers 2074 BS, 2079 BS parliamentary results (past) and 2082 BS candidate data (current), for both FPTP and proportional elections.

## Tech Stack

- **Python 3.13** with `uv` package manager
- **DuckDB** as the analytical database
- **dbt-duckdb** for data transformation (staging views + mart tables)
- **Playwright/BeautifulSoup4** for web scraping
- **Next.js 16** + **React 19** + **Tailwind CSS 4** for the static web dashboard
- **DuckDB-WASM** for in-browser querying on the Next.js site
- **Streamlit** + **Plotly** for the interactive Python dashboard
- **Cloudflare Pages** for deployment (via Wrangler CLI or GitHub Actions)

## Key Commands

```bash
# Load raw JSON/CSV data into DuckDB
uv run python load_raw_data.py

# Run all dbt models (from election/ directory)
cd election && uv run dbt build

# Run a specific model
cd election && uv run dbt run --select dim_current_fptp_candidates

# Run dbt tests
cd election && uv run dbt test

# Run dbt seeds (mapping tables)
cd election && uv run dbt seed

# Launch Streamlit dashboard
uv run streamlit run app.py

# Next.js development server
npm run dev

# Build and deploy to Cloudflare Pages
npm run deploy
```

Environment variables (set automatically by VS Code, needed for CLI):
```bash
export DBT_PROJECT_DIR=election
export DBT_PROFILES_DIR=election
```

Always navigate to the `election/` folder before running dbt commands.

## Data Pipeline Architecture

```
Web Scrapers (Python)
  → Raw Data Files (data/*.json, data/*.csv)
    → load_raw_data.py (DuckDB ingestion)
      → DuckDB (election/election.db) raw tables
        → dbt Staging Models (stg_*) — 11 views
          → dbt Mart Models (dim_*) — 7 tables
            → Streamlit Dashboard (app.py + pages/)
            → Next.js Dashboard (app/ + public/data/)
```

### Scrapers

| Script | Output | Description |
|--------|--------|-------------|
| `get_current_first_past_the_post_candidates.py` | `data/current_first_past_the_post_candidates.json` | 2082 BS FPTP candidates |
| `get_first_past_the_post_election_result.py` | `data/past_first_past_the_post_election_result.json` | 2079 BS FPTP results |
| `get_past_proportional_election_result.py` | `data/past_proportional_election_result.json` | 2079 BS proportional results (nested JSON) |

Additional raw data: `data/states.json`, `data/districts.json`, `data/constituency.json`, `data/current_proportional_election_candidates.csv`, plus 2074 BS election data and parliament members data.

### dbt Layers

**Staging** (`election/models/staging/`) — 11 views that clean raw DuckDB tables:
- Reference: `stg_states`, `stg_districts`, `stg_constituency`
- 2082 candidates: `stg_current_fptp_candidates`, `stg_current_proportional_candidates`
- 2079 results: `stg_past_2079_fptp_election_result`, `stg_past_2079_proportional_election_result`
- 2074 results: `stg_past_2074_fptp_election_result`, `stg_past_2074_proportional_election_result`
- Parliament/party: `stg_parliament_members`, `stg_political_party_symbols`
- Source definitions in `sources.yml`; column docs in `stg_staging.yml`

**Marts** (`election/models/marts/`) — 7 dimension tables:
- `dim_parties` — Master party dimension with merger/rename tracking via seed. Includes Wikipedia metadata (symbol, leader, founding year).
- `dim_parliament_members` — Parliament member history across 2074 & 2079 terms. 3-tier name matching: exact → normalized → manual seed mapping.
- `dim_current_fptp_candidates` — Enriched 2082 FPTP candidates (60+ columns). Joins with 2079 and 2074 results. 18+ boolean flags: `is_tourist_candidate`, `is_chheparo` (party switcher), `is_vaguwa` (geographic mover), `is_new_candidate`, `is_loyal`, `is_opportunist`, etc. Tags array generated from flags.
- `dim_fptp_2079_candidates` — Same structure as above but for 2079 election cycle (2074 as previous).
- `dim_current_proportional_candidates` — 2082 PR candidates. 3-tier party matching: direct → seed mapping → associated_party fallback. 17+ boolean flags.
- `dim_constituency_profile` — Constituency analytics with JSON election results, stronghold/swing/pakad detection.
- `dim_parties_profile` — Party-level analytics with historical performance and current candidate composition as JSON.
- Column docs in `marts.yml`

**Seeds** (`election/seeds/`) — 4 mapping CSVs:
- `party_current_new_name_mapping.csv` — Party rename/merger history (~124 entries)
- `proportional_to_fptp_party_name_mapping.csv` — Maps proportional party names to FPTP equivalents
- `qualification_level_mapping.csv` — Standardizes 950+ qualification text variations to 6 levels
- `parliament_member_name_mapping.csv` — Manual name corrections for cross-term spelling inconsistencies

### Next.js Dashboard

- `app/page.tsx` — Home page
- `app/constituency/page.tsx` — Constituency detail page
- `app/layout.tsx` — Root layout
- `public/data/` — Pre-built JSON data files and DuckDB WASM database
- Deployed to Cloudflare Pages as a static export (`output: 'export'` in next.config.mjs)
- Build output directory: `out/`

### Streamlit Dashboard

- `app.py` — Home page with cascading filters (State→District→Constituency), metrics, and charts
- `pages/1_Party_Overview.py` — Party-specific deep dive (gender, age, candidate types, constituencies)
- `pages/2_Candidate_Explorer.py` — Searchable/filterable candidate browser for FPTP and proportional
- `db.py` — Shared DuckDB read-only connection helper with `st.cache_resource`

## Key Design Decisions

- `stg_past_2079_proportional_election_result` uses `CROSS JOIN UNNEST` to flatten deeply nested JSON (state→district→constituency→results)
- `stg_parliament_members` uses complex regex + Unicode replacement pipeline to normalize Devanagari names for cross-term matching (strips ZWJ/ZWNJ, titles, normalizes vowels, conjuncts, व↔ब variations)
- All staging models use `{{ adapter.quote() }}` for column quoting (DuckDB compatibility)
- Geographic names are in Nepali (Devanagari script)
- `dim_current_fptp_candidates` LEFT JOINs to 2079 and 2074 election results and `dim_parliament_members` to build 3-election history
- 3-tier party matching in `dim_current_proportional_candidates`: direct name match → seed mapping → associated_party fallback
- 3-tier name matching in `dim_parliament_members`: exact → normalized → manual seed mapping
- Merger-aware party comparison uses `list_contains(dim_parties.previous_names, ...)`
- Boolean flags follow `is_*` naming convention; `tags` arrays generated from flags via `list_filter()` for frontend consumption
- `dim_constituency_profile` stores complete election results as JSON arrays per constituency
- `dim_parties_profile` returns complex nested JSON for historical and current stats
- Dashboard uses read-only DuckDB connection via `st.cache_resource` in `db.py`
- Next.js site uses static export to `out/` for Cloudflare Pages deployment
