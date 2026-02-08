"""
Logical end-to-end tests for constituency profile tag calculations.
Validates gadh/swing/pakad tag rules, result ordering, and ranking consistency.
"""

import json
import pytest
from pathlib import Path


@pytest.fixture(scope="session")
def exported_constituencies():
    """Load exported constituency data from public/data/"""
    data_file = Path(__file__).parent.parent.parent / "public" / "data" / "dim_constituency_profile.json"
    with open(data_file) as f:
        return json.load(f)


# ============================================================
# Tag Rule Tests
# ============================================================


class TestConstituencyTagRules:
    """Validate constituency tag logic: gadh, swing, pakad."""

    def test_tags_match_expected_patterns(self, exported_constituencies):
        """All tags must be 'Gadh: ...', 'Swing State', or 'Pakad: ...'"""
        for c in exported_constituencies:
            for tag in c.get('tags', []):
                is_valid = (
                    tag.startswith('Gadh: ')
                    or tag == 'Swing State'
                    or tag.startswith('Pakad: ')
                )
                assert is_valid, \
                    f"Constituency {c['constituency_id']} ({c.get('district_name')}): invalid tag '{tag}'"

    def test_gadh_flag_matches_tag(self, exported_constituencies):
        """is_gadh ↔ a 'Gadh:' tag is present, and party matches gadh_party_name"""
        for c in exported_constituencies:
            tags = c.get('tags', [])
            gadh_tags = [t for t in tags if t.startswith('Gadh: ')]
            has_gadh_tag = len(gadh_tags) > 0
            is_gadh = c.get('is_gadh', False)

            assert has_gadh_tag == is_gadh, \
                f"Constituency {c['constituency_id']}: is_gadh={is_gadh} but gadh tags={gadh_tags}"

            if is_gadh and gadh_tags:
                gadh_party_in_tag = gadh_tags[0].replace('Gadh: ', '')
                assert c.get('gadh_party_name') is not None, \
                    f"Constituency {c['constituency_id']}: is_gadh but no gadh_party_name"
                assert gadh_party_in_tag == c['gadh_party_name'], \
                    f"Constituency {c['constituency_id']}: tag party '{gadh_party_in_tag}' != gadh_party_name '{c['gadh_party_name']}'"

    def test_swing_state_flag_matches_tag(self, exported_constituencies):
        """is_swing_state ↔ 'Swing State' tag present"""
        for c in exported_constituencies:
            has_tag = 'Swing State' in c.get('tags', [])
            is_swing = c.get('is_swing_state', False)
            assert has_tag == is_swing, \
                f"Constituency {c['constituency_id']}: is_swing_state={is_swing} but tag={has_tag}"

    def test_gadh_and_swing_never_cooccur(self, exported_constituencies):
        """A constituency cannot be both gadh and swing state"""
        for c in exported_constituencies:
            assert not (c.get('is_gadh') and c.get('is_swing_state')), \
                f"Constituency {c['constituency_id']}: both gadh and swing state"

    def test_gadh_implies_both_winners_set(self, exported_constituencies):
        """is_gadh → both winning_party_2079 and winning_party_2074 are set"""
        for c in exported_constituencies:
            if c.get('is_gadh'):
                assert c.get('winning_party_2079'), \
                    f"Constituency {c['constituency_id']}: gadh but no 2079 winner"
                assert c.get('winning_party_2074'), \
                    f"Constituency {c['constituency_id']}: gadh but no 2074 winner"

    def test_swing_implies_different_winners(self, exported_constituencies):
        """is_swing_state → both winners set and they differ (not merger-matched)"""
        for c in exported_constituencies:
            if c.get('is_swing_state'):
                assert c.get('winning_party_2079'), \
                    f"Constituency {c['constituency_id']}: swing but no 2079 winner"
                assert c.get('winning_party_2074'), \
                    f"Constituency {c['constituency_id']}: swing but no 2074 winner"
                # They should differ (at least by direct name comparison)
                assert c['winning_party_2079'] != c['winning_party_2074'], \
                    f"Constituency {c['constituency_id']}: swing but same winner: {c['winning_party_2079']}"


# ============================================================
# Ranking & Results Ordering Tests
# ============================================================


class TestConstituencyResultsOrdering:
    """Validate that election results are properly sorted and ranked."""

    def test_fptp_2079_results_sorted_by_votes(self, exported_constituencies):
        """FPTP 2079 results should be sorted descending by vote_count"""
        for c in exported_constituencies:
            results = c.get('fptp_2079_results', [])
            if len(results) >= 2:
                votes = [r['vote_count'] for r in results]
                assert votes == sorted(votes, reverse=True), \
                    f"Constituency {c['constituency_id']}: 2079 results not sorted by votes"

    def test_fptp_2074_results_sorted_by_votes(self, exported_constituencies):
        """FPTP 2074 results should be sorted descending by vote_count"""
        for c in exported_constituencies:
            results = c.get('fptp_2074_results', [])
            if len(results) >= 2:
                votes = [r['vote_count'] for r in results]
                assert votes == sorted(votes, reverse=True), \
                    f"Constituency {c['constituency_id']}: 2074 results not sorted by votes"

    def test_fptp_2079_ranks_non_decreasing_and_start_at_1(self, exported_constituencies):
        """Ranks in 2079 results should start at 1 and be non-decreasing (ties allowed)"""
        for c in exported_constituencies:
            results = c.get('fptp_2079_results', [])
            if results:
                ranks = [r['rank'] for r in results]
                assert ranks[0] == 1, \
                    f"Constituency {c['constituency_id']}: 2079 ranks don't start at 1: {ranks[:5]}"
                for i in range(1, len(ranks)):
                    assert ranks[i] >= ranks[i - 1], \
                        f"Constituency {c['constituency_id']}: 2079 ranks not non-decreasing at position {i}: {ranks[:10]}"

    def test_winning_party_2079_matches_first_result(self, exported_constituencies):
        """winning_party_2079 should match the first result's party_name"""
        for c in exported_constituencies:
            winner = c.get('winning_party_2079')
            results = c.get('fptp_2079_results', [])
            if winner and results:
                first_party = results[0].get('party_name')
                assert first_party == winner, \
                    f"Constituency {c['constituency_id']}: winner={winner} but first result party={first_party}"
