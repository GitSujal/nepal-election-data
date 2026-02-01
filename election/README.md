# Nepal Election Data — dbt Project

This dbt project transforms raw Nepal election data (loaded into DuckDB) into analytical dimension tables used by the Next.js dashboard and Streamlit app.

## Quick Start

```bash
# From the election/ directory
export DBT_PROJECT_DIR=election
export DBT_PROFILES_DIR=election

# Load raw data into DuckDB first (from project root)
cd .. && uv run python load_raw_data.py && cd election

# Run seeds, then all models and tests
uv run dbt seed
uv run dbt build

# Run a specific model
uv run dbt run --select dim_current_fptp_candidates

# Run tests only
uv run dbt test
```

## Project Structure

```
election/
├── dbt_project.yml              # Project config (materialization settings)
├── profiles.yml                 # DuckDB connection (dev: election.db, prod: prod.duckdb)
├── election.db                  # Dev DuckDB database (generated)
├── models/
│   ├── staging/                 # Views — clean and rename raw columns
│   │   ├── sources.yml          # Raw table source definitions (11 tables)
│   │   ├── stg_staging.yml      # Column documentation for staging models
│   │   ├── stg_states.sql
│   │   ├── stg_districts.sql
│   │   ├── stg_constituency.sql
│   │   ├── stg_current_fptp_candidates.sql
│   │   ├── stg_current_proportional_candidates.sql
│   │   ├── stg_past_2079_fptp_election_result.sql
│   │   ├── stg_past_2079_proportional_election_result.sql
│   │   ├── stg_past_2074_fptp_election_result.sql
│   │   ├── stg_past_2074_proportional_election_result.sql
│   │   ├── stg_parliament_members.sql
│   │   └── stg_political_party_symbols.sql
│   └── marts/                   # Tables — enriched analytical dimensions
│       ├── marts.yml            # Column documentation for mart models
│       ├── dim_parties.sql
│       ├── dim_parliament_members.sql
│       ├── dim_current_fptp_candidates.sql
│       ├── dim_fptp_2079_candidates.sql
│       ├── dim_current_proportional_candidates.sql
│       ├── dim_constituency_profile.sql
│       └── dim_parties_profile.sql
└── seeds/                       # Static mapping CSVs
    ├── party_current_new_name_mapping.csv
    ├── proportional_to_fptp_party_name_mapping.csv
    ├── qualification_level_mapping.csv
    └── parliament_member_name_mapping.csv
```

## Data Flow

```
Raw tables (loaded by load_raw_data.py)
  │
  ├─ Reference data ──────────────────────── stg_states, stg_districts, stg_constituency
  ├─ 2082 FPTP candidates ────────────────── stg_current_fptp_candidates
  ├─ 2082 PR candidates ──────────────────── stg_current_proportional_candidates
  ├─ 2079 FPTP results ───────────────────── stg_past_2079_fptp_election_result
  ├─ 2079 PR results (nested JSON) ───────── stg_past_2079_proportional_election_result
  ├─ 2074 FPTP results ───────────────────── stg_past_2074_fptp_election_result
  ├─ 2074 PR results (aggregate) ─────────── stg_past_2074_proportional_election_result
  ├─ Parliament members (API) ────────────── stg_parliament_members
  └─ Party symbols (Wikipedia) ───────────── stg_political_party_symbols
        │
        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  Mart Models (materialized as tables)                       │
  │                                                             │
  │  dim_parties ──────────── Master party dimension            │
  │  dim_parliament_members ─ Parliament member history         │
  │  dim_current_fptp_candidates ─ 2082 FPTP (60+ columns)     │
  │  dim_fptp_2079_candidates ──── 2079 FPTP (45+ columns)     │
  │  dim_current_proportional_candidates ─ 2082 PR             │
  │  dim_constituency_profile ──── Constituency analytics       │
  │  dim_parties_profile ────────── Party-level analytics       │
  └─────────────────────────────────────────────────────────────┘
```

## Staging Models — Logic Summary

All staging models are materialized as **views** and perform column selection/renaming on raw tables.

| Model | Source | Key Logic |
|-------|--------|-----------|
| `stg_states` | states JSON | Pass-through: id, name |
| `stg_districts` | districts JSON | Pass-through: id, name, parentId |
| `stg_constituency` | constituency JSON | Pass-through: distId, consts (nested array) |
| `stg_current_fptp_candidates` | 2082 FPTP JSON | 23 columns, raw column names preserved |
| `stg_current_proportional_candidates` | 2082 PR CSV | 11 columns from CSV source |
| `stg_past_2079_fptp_election_result` | 2079 FPTP JSON | 30 columns including vote counts, rank, remarks |
| `stg_past_2079_proportional_election_result` | 2079 PR JSON | **CROSS JOIN UNNEST** to flatten 3-level nesting: state → district → constituency → results |
| `stg_past_2074_fptp_election_result` | 2074 FPTP JSON | 17 columns, similar structure to 2079 |
| `stg_past_2074_proportional_election_result` | 2074 PR JSON | Party-level aggregate only (no candidate/constituency breakdown) |
| `stg_parliament_members` | Parliament API | **Complex name normalization**: removes ZWJ/ZWNJ, strips titles (डा, कु, श्री), normalizes vowels (ी→ि, ू→ु), anusvara (ँ→ं), conjuncts (ङ्ग→ङ), handles व↔ब variations. Decodes gender (0=Male, 1=Female), converts election_type (Direct→FPTP, Indirect→Proportional) |
| `stg_political_party_symbols` | Wikipedia scrape | Party symbols, leaders, founding years |

## Mart Models — Logic Summary

All mart models are materialized as **tables**.

### dim_parties

Master party dimension with merger/rename tracking.

- Aggregates previous party names from `party_current_new_name_mapping` seed into a list
- Adds proportional-only parties not mapped to any FPTP party
- Joins `stg_political_party_symbols` for symbol URLs, leaders, founding years
- Assigns `party_id` via `row_number()`

### dim_parliament_members

Aggregated parliament member history across 2074 and 2079 terms.

- Applies 3-tier name matching: exact match → normalized name → manual seed mapping (`parliament_member_name_mapping`)
- Groups by `unified_name_normalized` to consolidate same person across terms
- Tracks: party switching, election types (FPTP vs Proportional), districts, constituencies
- Flags: `is_party_switcher`, `was_member_2074`, `was_member_2079`

### dim_current_fptp_candidates

Enriched 2082 BS FPTP candidates with 3-election history (60+ columns).

- LEFT JOINs to 2079 and 2074 FPTP results on candidate name
- LEFT JOINs to `dim_parliament_members` for HoR service history
- Maps qualifications via `qualification_level_mapping` seed
- Checks party mergers using `dim_parties.previous_names` with `list_contains()`
- Calculates runner-up votes and casted vote totals per constituency

**Boolean flags generated:**

| Flag | Logic |
|------|-------|
| `is_tourist_candidate` | Citizenship district ≠ candidacy district |
| `is_chheparo` | Switched to a genuinely different party (after merger check) |
| `is_vaguwa` | Moved to a different district or constituency |
| `is_new_candidate` | Did not contest any previous FPTP election |
| `is_educated` | Qualification level is Bachelor or above |
| `is_uneducated` | Qualification level is Under SLC |
| `is_new_party` | Party did not exist in 2079 or 2074 |
| `is_gen_z` | Age < 30 |
| `is_grandpa` | Age > 60 |
| `is_influential` | Was a parliament member in 2074 or 2079 |
| `is_opportunist` | Changed party AND location between elections |
| `is_split_vote_candidate` | Multiple candidates from same party in same constituency |
| `is_loyal` | Same party and constituency across all elections contested |
| `is_proportional_veteran` | Was a proportional parliament member in a past term |

- `candidate_type`: Classified as Chheparo / Vaguwa / Same Location / New Candidate
- `tags`: Array of string labels generated from boolean flags via `list_filter()`

### dim_fptp_2079_candidates

Same structure as `dim_current_fptp_candidates` but for the 2079 election cycle, where 2074 is the "previous" election. ~45 columns with identical flag/tag logic.

### dim_current_proportional_candidates

2082 BS proportional candidates with party matching and parliament history.

**3-tier party matching:**
1. Direct match: `political_party_name = dim_parties.current_party_name`
2. Seed mapping: `political_party_name → proportional_to_fptp_party_name_mapping → dim_parties`
3. Fallback: `associated_party = dim_parties.current_party_name`

**Additional logic:**
- Name normalization (same regex pipeline as parliament members)
- Checks if candidate was an FPTP loser in 2079 or 2074
- Joins parliament member data and PR election statistics
- Flags: `is_chheparo`, `is_new_candidate`, `is_party_loyal`, `is_high_rank`, `is_top_rank`, `is_low_rank`, `is_women`, `is_inclusive_group`, `has_disability`, `is_from_backward_area`, `is_opportunist`, `is_from_improving_party`, `is_from_declining_party`, `is_varaute`, `is_gati_chhada`, `is_fptp_veteran`, `is_proportional_veteran`

### dim_constituency_profile

Constituency profiles with multi-year election results stored as JSON.

- Aggregates FPTP 2079, FPTP 2074, and PR 2079 results per constituency as JSON arrays
- Ranks candidates/parties by votes within each constituency
- Calculates win margins for FPTP elections
- `is_gadh` (stronghold): Same party won 2079 and 2074 (merger-aware)
- `is_swing_state`: Different winning parties between 2079 and 2074
- `is_pakad`: Win margin > 15% in both years
- `tags`: Array including "Gadh: {party}", "Swing State", "Pakad: {party}"
- Enriched with candidate image URLs and party symbol URLs

### dim_parties_profile

Party-level profile with historical performance and current candidate composition.

- Aggregates parliament membership counts (2079 and 2074, split by FPTP/PR)
- Aggregates FPTP stats: candidate count, seats won, total votes per election year
- Aggregates PR stats: total votes per election year
- Current 2082 FPTP candidate composition: avg age, new vs returning, qualification/gender/district/age group breakdowns
- Current 2082 PR candidate composition: count, gender, inclusive group, district, disability breakdowns
- Returns complex JSON structures for `history_json` and `current_stats_json`
- Party-level tags: "Budo Party 👴" (avg age > 55), "Same Same 👯" (>50% returning), "Naya Anuhar 🧒" (>50% new)

## Seeds

| Seed | Purpose | Rows |
|------|---------|------|
| `party_current_new_name_mapping.csv` | Maps party mergers/renames from 2074/2079 to current 2082 names. Columns: PoliticalPartyName_current, SymbolName, PoliticalPartyName_previous, Status (Merged/Renamed/Lapsed/Discontinued) | ~124 |
| `proportional_to_fptp_party_name_mapping.csv` | Maps proportional party names to their FPTP equivalents (2nd tier of party matching) | Variable |
| `qualification_level_mapping.csv` | Standardizes 950+ qualification text variations to 6 levels: Under SLC, SLC, 2 (Intermediate/+2), Bachelor, Masters, PHD | ~950 |
| `parliament_member_name_mapping.csv` | Manual name corrections for cross-term spelling inconsistencies (3rd tier of parliament member matching) | Variable |

## Key Design Patterns

1. **Nested JSON flattening**: `stg_past_2079_proportional_election_result` uses `CROSS JOIN UNNEST` across 3 nesting levels
2. **Multi-tier matching**: Both party matching (3-tier) and parliament member matching (3-tier) use progressively fuzzier strategies
3. **Devanagari name normalization**: Complex regex + Unicode replacement pipeline to handle spelling variations across election terms
4. **Merger-aware party comparison**: Uses `list_contains(dim_parties.previous_names, ...)` to check if parties are the same after mergers
5. **Tag generation**: Boolean flags are converted to human-readable string arrays via `list_filter()` for easy frontend consumption
6. **JSON result storage**: Constituency profiles store full election results as JSON arrays for rich querying without extra joins
7. **Column quoting**: All staging models use `{{ adapter.quote() }}` for DuckDB compatibility
8. **Geographic names**: All geographic names are in Nepali (Devanagari script)
