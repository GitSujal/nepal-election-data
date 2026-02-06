# End-to-End Data Sanity Tests

This directory contains pytest-based tests for validating data integrity across all exported JSON datasets used by the frontend.

## Running Tests

### Run all tests
```bash
uv run pytest tests/e2e_tests/ -v
```

### Run specific test file
```bash
uv run pytest tests/e2e_tests/test_dim_fptp_candidates.py -v
```

### Run specific test
```bash
uv run pytest tests/e2e_tests/test_dim_fptp_candidates.py::test_unique_candidate_ids -v
```

### Run with output
```bash
uv run pytest tests/e2e_tests/ -v -s
```

## Test Coverage

### 1. **test_dim_constiuencies.py** - Constituency Data Validation
Compares raw constituency data with exported JSON to ensure:
- All constituencies are represented in exports
- Constituency names and IDs are valid
- Districts and states are properly linked
- Election results have consistent structure
- Winning parties are correctly identified
- Vote margins are valid percentages

**Key Checks:**
- Constituency completeness
- Geographic consistency (state→district→constituency)
- Election result structure (FPTP 2074/2079, proportional)
- Winner consistency with result rankings

### 2. **test_dim_fptp_candidates.py** - FPTP Candidate Data Validation
Validates current FPTP candidate data for:
- Required fields present (name, party, constituency)
- Valid tags and attributes
- Geographic linking consistency
- Unique candidate IDs
- Parliament member flags consistency
- New candidate logic (no prior office or FPTP history)
- Winner/loser flag consistency
- Rank ordering within constituencies

**Key Checks:**
- Field completeness
- Geographic consistency
- Candidate history logic
- Badge/tag validity
- Ranking consistency

### 3. **test_dim_pr_candidates.py** - PR Candidate Data Validation
Validates current proportional representation candidate data including:
- Required fields (name, party, rank)
- Inclusive group validity
- New candidate logic with FPTP/PM history
- FPTP history consistency (votes, margins, results)
- Parliament member history consistency
- Varaute (previous FPTP loser) logic validation
- Gati Xada (continuing PR member) logic
- Badge/tag validity

**Key Checks:**
- Rank position validity
- FPTP history field consistency
- Parliament member info completeness
- Special category logic (Varaute, Gati Xada)
- Vote/margin numeric validity
- Party history tracking

### 4. **test_dim_parties.py** - Political Party Data Validation
Validates party data and party symbol coverage:
- Required party fields present
- Unique party IDs and names
- Display order validity
- Party-candidate cross-reference validation
- Party symbol coverage for major parties
- Party symbol structure validity

**Key Checks:**
- Party completeness
- Uniqueness constraints
- Symbol coverage for major parties
- Party name consistency

## Data Workflow

The tests validate the complete data export pipeline:

```
Raw Data (data/) 
    ↓
dbt Models (election/models/)
    ↓
DuckDB Transformation
    ↓
Python Export (export_to_json.py)
    ↓
JSON Files (public/data/)
    ↓✓ [TESTS RUN HERE]
    ↓
Frontend Display
```

## Common Issues & Fixes

### Importing Tests Fail
- Ensure `uv run pytest` is used with proper Python environment
- Check that JSON files exist in `public/data/`

### Data Validation Fails
- Run dbt models: `cd election && dbt run`
- Re-export JSON: `uv run python export_to_json.py`
- Check for upstream data issues in `data/` folder

### Test Modifications
When modifying tests:
1. Update test logic to match actual data structure
2. Document breaking changes
3. Re-run all tests before committing
4. Keep tests focused on data sanity, not business logic

## Integration with CI/CD

To add these tests to your CI/CD pipeline:

```yaml
# Example: .github/workflows/test.yml
- name: Run Data Sanity Tests
  run: uv run pytest tests/e2e_tests/ -v --tb=short
```

## Notes

- Tests use fixtures to load JSON data, reducing startup time
- Session-scoped fixtures cache data across multiple tests
- Tests focus on data validity, not business logic
- Some tests have warnings rather than failures for non-critical issues
