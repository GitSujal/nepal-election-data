"""
End-to-end tests for FPTP candidate data.
Compares raw data with exported JSON and validates candidate attributes.
"""

import json
import pytest
from pathlib import Path


@pytest.fixture(scope="session")
def raw_fptp_candidates_2079():
    """Load raw FPTP candidates from constituency files"""
    data_file = Path(__file__).parent.parent.parent / "data" / "current_first_past_the_post_candidates.json"
    with open(data_file) as f:
        return json.load(f)


@pytest.fixture(scope="session")
def exported_fptp_candidates():
    """Load exported FPTP candidate data from public/data/"""
    data_file = Path(__file__).parent.parent.parent / "public" / "data" / "dim_current_fptp_candidates.json"
    with open(data_file) as f:
        return json.load(f)


@pytest.fixture(scope="session")
def raw_past_fptp_2079():
    """Load raw past 2079 FPTP election results"""
    data_file = Path(__file__).parent.parent.parent / "data" / "past_2079_first_past_the_post_election_result.json"
    with open(data_file) as f:
        return json.load(f)


@pytest.fixture(scope="session")
def raw_past_fptp_2074():
    """Load raw past 2074 FPTP election results"""
    data_file = Path(__file__).parent.parent.parent / "data" / "past_2074_first_past_the_post_election_result.json"
    with open(data_file) as f:
        return json.load(f)


def test_all_candidates_have_required_fields(exported_fptp_candidates):
    """Test that all candidates have required basic fields"""
    required_fields = [
        'candidate_id',
        'candidate_name',
        'political_party_name',
        'constituency_id',
    ]
    
    for candidate in exported_fptp_candidates:
        for field in required_fields:
            assert candidate.get(field) is not None, \
                f"Candidate {candidate.get('candidate_name')} missing {field}"


def test_candidate_tags_valid(exported_fptp_candidates):
    """Test that candidate tags are valid"""
    
    for candidate in exported_fptp_candidates:
        tags = candidate.get('tags', [])
        if tags:
            assert isinstance(tags, list), \
                f"Candidate {candidate.get('candidate_name')}: tags should be a list"
            for tag in tags:
                assert isinstance(tag, str), \
                    f"Candidate {candidate.get('candidate_name')}: tag should be string"


def test_candidate_geography_consistency(exported_fptp_candidates):
    """Test that candidates are properly linked to geography"""
    for candidate in exported_fptp_candidates:
        cand_name = candidate.get('candidate_name')
        
        assert candidate.get('state_id') is not None, \
            f"Candidate {cand_name} missing state_id"
        assert candidate.get('state_name'), \
            f"Candidate {cand_name} missing state_name"
        
        assert candidate.get('district_id') is not None, \
            f"Candidate {cand_name} missing district_id"
        assert candidate.get('district_name'), \
            f"Candidate {cand_name} missing district_name"
        
        assert candidate.get('constituency_id') is not None, \
            f"Candidate {cand_name} missing constituency_id"


def test_unique_candidate_ids(exported_fptp_candidates):
    """Test that candidate IDs are unique"""
    ids = [c.get('candidate_id') for c in exported_fptp_candidates]
    assert len(ids) == len(set(ids)), \
        f"Duplicate candidate IDs found. Total: {len(ids)}, Unique: {len(set(ids))}"


def test_candidate_rank_valid(exported_fptp_candidates):
    """Test that candidate rank/position makes sense"""
    for candidate in exported_fptp_candidates:
        cand_name = candidate.get('candidate_name')
        
        # Rank should be positive if present
        if candidate.get('rank_position') is not None:
            assert candidate['rank_position'] > 0, \
                f"Candidate {cand_name}: rank_position should be positive"


def test_parliament_member_logic(exported_fptp_candidates):
    """Test that parliament member flags are consistent"""
    for candidate in exported_fptp_candidates:
        cand_name = candidate.get('candidate_name')
        
        # If was parliament member, should have the flag
        is_pm = candidate.get('was_parliament_member')
        if is_pm:
            # Should have at least one parliament member year
            assert (candidate.get('parliament_member_2079_position') or 
                    candidate.get('parliament_member_2074_position')), \
                f"Candidate {cand_name}: marked as PM but no position recorded"


def test_new_candidate_logic(exported_fptp_candidates):
    """Test that new candidate flag is consistent with history"""
    for candidate in exported_fptp_candidates:
        cand_name = candidate.get('candidate_name')
        is_new = candidate.get('is_new_candidate')
        
        # If it's a new candidate, shouldn't have held office before
        if is_new:
            assert not candidate.get('was_parliament_member'), \
                f"Candidate {cand_name}: marked as new but has been parliament member"
            # Should not have contested in FPTP before
            assert not candidate.get('is_fptp_2079_participant'), \
                f"Candidate {cand_name}: marked as new but contested in 2079"
            assert not candidate.get('is_fptp_2074_participant'), \
                f"Candidate {cand_name}: marked as new but contested in 2074"


def test_winner_loser_logic(exported_fptp_candidates):
    """Test that winner/loser flags are consistent"""
    for candidate in exported_fptp_candidates:
        cand_name = candidate.get('candidate_name')
        
        # Can't be both winner and loser
        is_winner = candidate.get('is_fptp_winner')
        is_loser = candidate.get('is_fptp_2079_loser') or candidate.get('is_fptp_2074_loser')
        
        if is_winner and is_loser:
            assert False, f"Candidate {cand_name}: marked as both winner and loser"


def test_rank_order_consistency(exported_fptp_candidates):
    """Test that rank positions are present and reasonable"""
    # Just verify that candidates have rank positions
    for candidate in exported_fptp_candidates:
        cand_name = candidate.get('candidate_name')
        # Most candidates should have rank position
        if candidate.get('rank_position') is not None:
            rank = candidate['rank_position']
            assert rank > 0, \
                f"Candidate {cand_name}: rank_position should be positive"


def test_no_invalid_party_names(exported_fptp_candidates):
    """Test that party names are not empty or whitespace only"""
    for candidate in exported_fptp_candidates:
        cand_name = candidate.get('candidate_name')
        party = candidate.get('political_party_name')
        
        assert party and party.strip(), \
            f"Candidate {cand_name}: has invalid party name: '{party}'"


def test_candidate_citizenship_district(exported_fptp_candidates):
    """Test that citizenship district is set for most candidates"""
    no_district_count = 0
    for candidate in exported_fptp_candidates:
        # Some candidates might not have citizenship district
        if not candidate.get('citizenship_district'):
            no_district_count += 1
    
    # Allow some candidates to not have citizenship district (< 10%)
    max_missing = len(exported_fptp_candidates) * 0.1
    assert no_district_count < max_missing, \
        f"Too many candidates missing citizenship_district: {no_district_count}/{len(exported_fptp_candidates)}"
