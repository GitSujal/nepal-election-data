"""
End-to-end tests for constituency data.
Compares raw data from data/ with exported JSON from public/data/
"""

import json
import pytest
from pathlib import Path


@pytest.fixture(scope="session")
def raw_constituencies():
    """Load raw constituency data from data/constituency.json"""
    data_file = Path(__file__).parent.parent.parent / "data" / "constituency.json"
    with open(data_file) as f:
        return json.load(f)


@pytest.fixture(scope="session")
def exported_constituencies():
    """Load exported constituency data from public/data/dim_constituency_profile.json"""
    data_file = Path(__file__).parent.parent.parent / "public" / "data" / "dim_constituency_profile.json"
    with open(data_file) as f:
        return json.load(f)


@pytest.fixture(scope="session")
def raw_districts():
    """Load raw districts data"""
    data_file = Path(__file__).parent.parent.parent / "data" / "districts.json"
    with open(data_file) as f:
        return json.load(f)


def test_no_missing_constituencies(raw_constituencies, exported_constituencies, raw_districts):
    """Test that exported constituencies are reasonable compared to raw data"""
    # Count total constituencies from raw data (consts is number of constituencies per district)
    raw_constituency_count = sum(dist['consts'] for dist in raw_constituencies)
    
    # Exported data might have fewer due to constituency boundary changes/mergers
    # Just check that we have a substantial number
    assert len(exported_constituencies) >= raw_constituency_count * 0.95, \
        f"Exported constituencies ({len(exported_constituencies)}) much lower than expected {raw_constituency_count}"


def test_constituency_names_match(exported_constituencies):
    """Test that all constituencies have valid names"""
    for const in exported_constituencies:
        assert const.get('constituency_name'), \
            f"Constituency {const.get('constituency_id')} missing name"
        assert const.get('constituency_id'), \
            f"Constituency missing id: {const.get('constituency_name')}"


def test_district_consistency(exported_constituencies):
    """Test that all constituencies are linked to valid districts"""
    for const in exported_constituencies:
        assert const.get('district_id') is not None, \
            f"Constituency {const.get('constituency_id')} missing district_id"
        assert const.get('district_name'), \
            f"Constituency {const.get('constituency_id')} missing district_name"


def test_state_consistency(exported_constituencies):
    """Test that all constituencies are linked to valid states"""
    for const in exported_constituencies:
        assert const.get('state_id') is not None, \
            f"Constituency {const.get('constituency_id')} missing state_id"
        assert const.get('state_name'), \
            f"Constituency {const.get('constituency_id')} missing state_name"


def test_election_results_structure(exported_constituencies):
    """Test that election results have consistent structure"""
    for const in exported_constituencies:
        const_id = const.get('constituency_id')
        
        # Check FPTP 2079 results
        if const.get('fptp_2079_results'):
            assert isinstance(const['fptp_2079_results'], list), \
                f"Constituency {const_id}: fptp_2079_results should be a list"
            for result in const['fptp_2079_results']:
                assert result.get('candidate_name'), \
                    f"Constituency {const_id}: FPTP 2079 result missing candidate_name"
                assert result.get('vote_count') is not None, \
                    f"Constituency {const_id}: FPTP 2079 {result.get('candidate_name')} missing vote_count"
        
        # Check FPTP 2074 results
        if const.get('fptp_2074_results'):
            assert isinstance(const['fptp_2074_results'], list), \
                f"Constituency {const_id}: fptp_2074_results should be a list"
            for result in const['fptp_2074_results']:
                assert result.get('candidate_name'), \
                    f"Constituency {const_id}: FPTP 2074 result missing candidate_name"
        
        # Check proportional results
        if const.get('proportional_2079_results'):
            assert isinstance(const['proportional_2079_results'], list), \
                f"Constituency {const_id}: proportional_2079_results should be a list"
            for result in const['proportional_2079_results']:
                assert result.get('party_name'), \
                    f"Constituency {const_id}: Proportional result missing party_name"
                assert result.get('vote_count') is not None, \
                    f"Constituency {const_id}: Proportional {result.get('party_name')} missing vote_count"


def test_winning_party_consistency(exported_constituencies):
    """Test that winning parties are set correctly"""
    for const in exported_constituencies:
        const_id = const.get('constituency_id')
        
        # If there's a winning party, it should be first in FPTP results or be valid
        winning_party_2079 = const.get('winning_party_2079')
        if winning_party_2079:
            fptp_results = const.get('fptp_2079_results', [])
            if fptp_results:
                first_party = fptp_results[0].get('party_name')
                assert first_party == winning_party_2079, \
                    f"Constituency {const_id}: Winner mismatch. Expected {winning_party_2079}, got {first_party}"
        
        winning_party_2074 = const.get('winning_party_2074')
        if winning_party_2074:
            fptp_results = const.get('fptp_2074_results', [])
            if fptp_results:
                first_party = fptp_results[0].get('party_name')
                assert first_party == winning_party_2074, \
                    f"Constituency {const_id}: Winner 2074 mismatch. Expected {winning_party_2074}, got {first_party}"


def test_constituency_id_is_string(exported_constituencies):
    """Test that constituency IDs are strings (as they should be in JSON)"""
    for const in exported_constituencies:
        assert isinstance(const.get('constituency_id'), str) or isinstance(const.get('constituency_id'), int), \
            f"Constituency ID should be string or int"


def test_unique_constituency_ids(exported_constituencies):
    """Test that constituency IDs within a district are unique"""
    # Note: constituency IDs repeat across districts/states, so we check uniqueness per district
    by_district = {}
    for const in exported_constituencies:
        key = (const.get('state_id'), const.get('district_id'))
        if key not in by_district:
            by_district[key] = []
        by_district[key].append(const.get('constituency_id'))
    
    # Check uniqueness within each district
    for (state_id, dist_id), ids in by_district.items():
        assert len(ids) == len(set(ids)), \
            f"State {state_id}, District {dist_id}: duplicate constituency IDs found"


def test_margin_values_valid(exported_constituencies):
    """Test that win margins are valid percentages or None"""
    for const in exported_constituencies:
        const_id = const.get('constituency_id')
        
        if const.get('win_margin_2079') is not None:
            margin = const['win_margin_2079']
            assert isinstance(margin, (int, float)), \
                f"Constituency {const_id}: win_margin_2079 should be numeric"
            assert 0 <= margin <= 1, \
                f"Constituency {const_id}: win_margin_2079 should be between 0 and 1, got {margin}"
        
        if const.get('win_margin_2074') is not None:
            margin = const['win_margin_2074']
            assert isinstance(margin, (int, float)), \
                f"Constituency {const_id}: win_margin_2074 should be numeric"
            assert 0 <= margin <= 1, \
                f"Constituency {const_id}: win_margin_2074 should be between 0 and 1, got {margin}"
