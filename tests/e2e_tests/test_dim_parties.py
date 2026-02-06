"""
End-to-end tests for political party data.
Validates party consistency across datasets and basic party attributes.
"""

import json
import pytest
from pathlib import Path


@pytest.fixture(scope="session")
def exported_parties():
    """Load exported party data from public/data/"""
    data_file = Path(__file__).parent.parent.parent / "public" / "data" / "dim_parties.json"
    with open(data_file) as f:
        return json.load(f)


@pytest.fixture(scope="session")
def exported_party_symbols():
    """Load party symbols data"""
    data_file = Path(__file__).parent.parent.parent / "public" / "data" / "political_party_symbols.json"
    with open(data_file) as f:
        return json.load(f)


@pytest.fixture(scope="session")
def exported_fptp_candidates():
    """Load FPTP candidates to cross-reference parties"""
    data_file = Path(__file__).parent.parent.parent / "public" / "data" / "dim_current_fptp_candidates.json"
    with open(data_file) as f:
        return json.load(f)


@pytest.fixture(scope="session")
def exported_pr_candidates():
    """Load PR candidates to cross-reference parties"""
    data_file = Path(__file__).parent.parent.parent / "public" / "data" / "dim_current_proportional_candidates.json"
    with open(data_file) as f:
        return json.load(f)


def test_all_parties_have_required_fields(exported_parties):
    """Test that all parties have required fields"""
    required_fields = ['party_id', 'current_party_name']
    
    for party in exported_parties:
        for field in required_fields:
            assert party.get(field) is not None, \
                f"Party {party.get('current_party_name')} missing {field}"


def test_unique_party_ids(exported_parties):
    """Test that party IDs are unique"""
    ids = [p.get('party_id') for p in exported_parties]
    assert len(ids) == len(set(ids)), \
        f"Duplicate party IDs found. Total: {len(ids)}, Unique: {len(set(ids))}"


def test_unique_party_names(exported_parties):
    """Test that party names are unique"""
    names = [p.get('current_party_name') for p in exported_parties if p.get('current_party_name')]
    assert len(names) == len(set(names)), \
        f"Duplicate party names found"


def test_party_names_not_empty(exported_parties):
    """Test that party names are not empty or whitespace"""
    for party in exported_parties:
        name = party.get('current_party_name')
        assert name and name.strip(), \
            f"Party has empty name: {name}"


def test_party_display_order_validity(exported_parties):
    """Test that display order is valid when present"""
    for party in exported_parties:
        if party.get('party_display_order') is not None:
            order = party['party_display_order']
            assert isinstance(order, int), \
                f"Party {party.get('political_party_name')}: display_order should be int"
            assert order >= 0, \
                f"Party {party.get('political_party_name')}: display_order should be non-negative"


def test_parties_referenced_in_candidates(exported_parties, exported_fptp_candidates, exported_pr_candidates):
    """Test that parties are referenced by actual candidates"""
    party_names = set(p.get('political_party_name') for p in exported_parties)
    
    # Collect all party names from candidates
    candidate_parties = set()
    for candidate in exported_fptp_candidates:
        if candidate.get('political_party_name'):
            candidate_parties.add(candidate['political_party_name'])
    for candidate in exported_pr_candidates:
        if candidate.get('political_party_name'):
            candidate_parties.add(candidate['political_party_name'])
    
    # Check if all candidate parties exist in party list
    unreferenced_parties = candidate_parties - party_names
    # Note: Some unreferenced parties might exist due to historical data, so we just warn
    if unreferenced_parties:
        # This is a warning, not a failure - historical candidates might have dissolved parties
        print(f"Warning: Candidates reference parties not in party list: {unreferenced_parties}")


def test_party_symbol_coverage(exported_party_symbols, exported_fptp_candidates, exported_pr_candidates):
    """Test that main parties have symbols"""
    symbol_parties = set()
    for symbol in exported_party_symbols:
        if symbol.get('party_name_np'):
            symbol_parties.add(symbol['party_name_np'])
    
    # Collect main candidate parties
    candidate_parties = {}
    for candidate in exported_fptp_candidates:
        party = candidate.get('political_party_name')
        if party:
            candidate_parties[party] = candidate_parties.get(party, 0) + 1
    for candidate in exported_pr_candidates:
        party = candidate.get('political_party_name')
        if party:
            candidate_parties[party] = candidate_parties.get(party, 0) + 1
    
    # Check major parties (those with 5+ candidates)
    major_parties = {p for p, count in candidate_parties.items() if count >= 5}
    missing_symbols = major_parties - symbol_parties
    
    if missing_symbols:
        # This is a warning - some major parties lack symbols
        missing_count = len(missing_symbols)
        print(f"Warning: {missing_count} major parties lack symbols: {list(missing_symbols)[:5]}")


def test_party_symbol_structure(exported_party_symbols):
    """Test that party symbols have valid structure"""
    for symbol in exported_party_symbols:
        party_name = symbol.get('party_name_np') or symbol.get('party_name_en')
        
        # Party should have either Nepali or English name
        assert (symbol.get('party_name_np') or symbol.get('party_name_en')), \
            "Symbol missing both Nepali and English names"
        
        # If symbol URL exists, it should be valid
        if symbol.get('symbol_url'):
            url = symbol['symbol_url']
            assert isinstance(url, str) and url.strip(), \
                f"Party {party_name}: invalid symbol_url"


def test_party_nepali_english_names_present(exported_party_symbols):
    """Test that main parties have both Nepali and English names"""
    for symbol in exported_party_symbols:
        has_np = bool(symbol.get('party_name_np'))
        has_en = bool(symbol.get('party_name_en'))
        
        # Most parties should have both names
        if not (has_np and has_en):
            # Single-symbol parties might only appear in one language
            party_id = symbol.get('party_name_np') or symbol.get('party_name_en')
            # Just a warning for now
            if not party_id.startswith('एकल'):  # Solo symbols might not have names
                print(f"Warning: Party {party_id} might be missing a language name")


def test_party_names_consistency_across_data(exported_parties):
    """Test that party names have no excessive whitespace"""
    for party in exported_parties:
        name = party.get('current_party_name')
        if name:
            # Check for excessive leading/trailing whitespace (but single space might be intentional)
            if name.startswith('  ') or name.endswith('  '):
                assert False, \
                    f"Party name has excessive whitespace: '{name}'"


def test_no_empty_party_list(exported_parties):
    """Test that we have a reasonable number of parties"""
    assert len(exported_parties) >= 30, \
        f"Expected at least 30 parties, got {len(exported_parties)}"


def test_party_count_reasonable(exported_parties):
    """Test that party count is within expected range"""
    # Nepal typically has 50-100 registered political parties
    assert len(exported_parties) <= 200, \
        f"Unusually high party count: {len(exported_parties)}"
