# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nepal election data pipeline and dashboard: scrapes election data from Nepal's Election Commission (result.election.gov.np), stores as JSON/CSV, loads into DuckDB, transforms with dbt, and visualizes via Streamlit. Covers 2079 BS parliamentary results (past) and 2082 BS candidate data (current), for both FPTP and proportional elections.

## Tech Stack

- **Python 3.13** with `uv` package manager
- **DuckDB** as the analytical database
- **dbt-duckdb** for data transformation (staging views + mart tables)
- **Playwright/BeautifulSoup4** for web scraping
- **Streamlit** + **Plotly** for the interactive dashboard

## Key Commands

```bash
# Load raw JSON/CSV data into DuckDB
uv run python load_raw_data.py

# Run all dbt models (from election/ directory)
cd election && uv run dbt build

# Run a specific model
cd election && uv run dbt run --select dim_current_candidates

# Run dbt tests
cd election && uv run dbt test

# Run dbt seeds (mapping tables)
cd election && uv run dbt seed

# Launch Streamlit dashboard
uv run streamlit run app.py
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
        → dbt Staging Models (stg_*) — views
          → dbt Mart Models (dim_*) — tables
            → Streamlit Dashboard (app.py + pages/)
```

### Scrapers

| Script | Output | Description |
|--------|--------|-------------|
| `get_current_first_past_the_post_candidates.py` | `data/current_first_past_the_post_candidates.json` | 2082 BS FPTP candidates |
| `get_first_past_the_post_election_result.py` | `data/past_first_past_the_post_election_result.json` | 2079 BS FPTP results |
| `get_past_proportional_election_result.py` | `data/past_proportional_election_result.json` | 2079 BS proportional results (nested JSON) |

Additional raw data: `data/states.json`, `data/districts.json`, `data/constituency.json`, `data/current_proportional_election_candidates.csv`.

### dbt Layers

**Staging** (`election/models/staging/`) — 7 views that clean raw DuckDB tables:
- `stg_current_fptp_candidates`, `stg_current_proportional_candidates`
- `stg_past_fptp_election_result`, `stg_past_proportional_election_result`
- `stg_states`, `stg_districts`, `stg_constituency`
- Source definitions in `sources.yml`; column docs in `stg_staging.yml`

**Marts** (`election/models/marts/`) — 4 dimension tables:
- `dim_current_candidates` — Enriched FPTP dimension (52 columns). Joins current candidates with 2079 results. Derived fields: `is_tourist_candidate`, `is_chheparo` (party switcher), `is_vaguwa` (geographic mover), `candidate_type` (Chheparo/Vaguwa/Same Location/New Candidate), age groups, qualification levels.
- `dim_past_candidates` — 2079 BS FPTP candidates (34 columns). Includes winner/loser derivation.
- `dim_current_proportional_candidates` — 2082 BS proportional candidates (16 columns). Uses 3-tier party matching: direct → seed mapping → associated_party fallback.
- `dim_parties` — Master party dimension aggregated from FPTP and proportional data. Tracks party name changes/mergers via seed.
- Column docs in `marts.yml`

**Seeds** (`election/seeds/`) — 3 mapping CSVs:
- `party_current_new_name_mapping.csv` — Party rename/merger history
- `proportional_to_fptp_party_name_mapping.csv` — Maps proportional party names to FPTP equivalents
- `qualification_level_mapping.csv` — Standardizes qualification text

### Streamlit Dashboard

- `app.py` — Home page with cascading filters (State→District→Constituency), metrics, and charts
- `pages/1_Party_Overview.py` — Party-specific deep dive (gender, age, candidate types, constituencies)
- `pages/2_Candidate_Explorer.py` — Searchable/filterable candidate browser for FPTP and proportional
- `db.py` — Shared DuckDB read-only connection helper with `st.cache_resource`

## Key Design Decisions

- `stg_past_proportional_election_result` uses `CROSS JOIN UNNEST` to flatten deeply nested JSON (state→district→constituency→results)
- All staging models use `{{ adapter.quote() }}` for column quoting (DuckDB compatibility)
- Geographic names are in Nepali (Devanagari script)
- `dim_current_candidates` LEFT JOINs to previous election results to track candidate movement between parties, locations, and elections
- 3-tier party matching in `dim_current_proportional_candidates`: direct name match → seed mapping → associated_party fallback
- Dashboard uses read-only DuckDB connection via `st.cache_resource` in `db.py`
- Boolean flags follow `is_*` naming convention
