# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nepal election data pipeline: scrapes election data from Nepal's Election Commission (result.election.gov.np), stores as JSON, loads into DuckDB, and transforms with dbt. Covers 2079 BS parliamentary results and 2082 BS candidate data.

## Tech Stack

- **Python 3.12** with `uv` package manager
- **DuckDB** as the analytical database
- **dbt-duckdb** for data transformation
- **Playwright/BeautifulSoup4** for web scraping

Always navigate to election folder before running dbt commands.

## Key Commands

```bash
# Load raw JSON data into DuckDB
uv run python load_raw_data.py

# Run all dbt models (from election/ directory)
cd election && uv run dbt build

# Run a specific model
cd election && uv run dbt run --select dim_candidates

# Run dbt tests
cd election && uv run dbt test

# Verify dim_candidates output
uv run python election/verify_dim_candidates.py
```

Environment variables (set automatically by VS Code, needed for CLI):
```bash
export DBT_PROJECT_DIR=election
export DBT_PROFILES_DIR=election
```

## Data Pipeline Architecture

```
Scrapers (Python) → JSON files (data/) → load_raw_data.py → DuckDB (election/election.db) → dbt models
```

**Scrapers**: `fetch_current_candidates.py`, `prataksya_election_result.py`, `samanupatik_election_result.py`

**dbt layers**:
- `models/staging/` — Views that clean raw DuckDB tables. Source definitions in `sources.yml`.
- `models/marts/` — Tables with business logic. `dim_candidates` joins current candidates with 2079 results, adding derived fields like `is_tourist_candidate`, `is_party_switcher`, and a 4-type candidate classification (Chheparo/Vaguwa/Same Location/New Candidate).

## Key Design Decisions

- `stg_samanupatik_election_results` uses `CROSS JOIN UNNEST` to flatten deeply nested JSON (state→district→constituency→results)
- All staging models use `{{ adapter.quote() }}` for column quoting (DuckDB compatibility)
- Geographic names are in Nepali (Devanagari script)
- `dim_candidates` LEFT JOINs to previous election results to track candidate movement between parties, locations, and elections
