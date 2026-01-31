# Streamlit Election Dashboard Plan

## Overview
Multi-page Streamlit app connecting to `election/election.db` (DuckDB read-only).

## Dependencies
Add `streamlit` and `plotly` to `pyproject.toml`.

## File Structure
```
db.py                           # Shared DB connection helper
app.py                          # Home: Election Overview
pages/
  1_Party_Overview.py           # Party-level deep dive
  2_Candidate_Explorer.py       # Searchable candidate table
```

## Page Details

### Home — Election Overview (`app.py`)
- **Sidebar filters** (cascading): State → District → Constituency. Apply to FPTP data only (proportional lacks geography).
- **Top metrics**: Total parties, FPTP candidates, Proportional candidates, Total candidates
- **Charts**:
  - Top 15 parties by candidate count (horizontal bar) — FPTP
  - Gender distribution — FPTP & proportional side by side (pie charts)
  - Age group distribution (bar) — FPTP only
  - Candidate type breakdown: Chheparo/Vaguwa/Same Location/New (bar) — FPTP only
  - Candidates by state (bar) — FPTP
  - Inclusive group distribution (bar) — proportional

### Party Overview (`pages/1_Party_Overview.py`)
- **Sidebar**: Party selector dropdown
- Party detail card: FPTP count, proportional count, previous names
- Gender split, age group split, candidate type breakdown for selected party
- Tourist candidate count
- Constituencies contested (FPTP)
- Inclusive group distribution (proportional)

### Candidate Explorer (`pages/2_Candidate_Explorer.py`)
- **Sidebar filters**: Election type (FPTP/Proportional), State, District, Constituency, Party, Gender, Candidate type
- Searchable/filterable data table with key columns
- Expandable candidate detail rows

## Shared DB Helper (`db.py`)
- `get_connection()`: `@st.cache_resource` returning read-only DuckDB connection
- `query(sql, params)`: convenience wrapper returning pandas DataFrame

## Charts
Use `plotly.express` for pie charts and grouped bars. Use `st.metric` for KPIs.

## Data Models Used

### `dim_current_candidates` (52 columns) — FPTP
Key columns: candidate_id, candidate_name, gender, age, age_group, political_party_name, state_name, district_name, constituency_name, candidate_type, is_tourist_candidate, is_chheparo, is_vaguwa, current_vote_received, rank_position, prev_election_party, qualification_level

### `dim_current_proportional_candidates` (16 columns) — Proportional
Key columns: serial_no, full_name, gender, inclusive_group, political_party_name, citizenship_district, backward_area, disability, party_previous_names

### `dim_parties` (3 columns)
Key columns: party_id, current_party_name, previous_names

### `dim_past_candidates` (34 columns) — For reference/comparison
Key columns: candidate_name, gender, age_group, political_party_name, state_name, district_name, constituency_id, total_votes_received, election_result

## Files to Create
- `db.py`, `app.py`, `pages/1_Party_Overview.py`, `pages/2_Candidate_Explorer.py`

## Files to Modify
- `pyproject.toml` (add streamlit, plotly)

## Verification
```bash
uv add streamlit plotly
uv run streamlit run app.py
```
