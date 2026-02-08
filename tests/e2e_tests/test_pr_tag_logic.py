"""
Logical end-to-end tests for PR (Proportional Representation) candidate tag calculations.
Validates tag implications, mutual exclusivity rules, and tag validity.
"""

import json
import pytest
from pathlib import Path


VALID_PR_TAGS = {
    'chheparo',
    'new-candidate',
    'party-loyal',
    'top-rank',
    'high-rank',
    'women',
    'inclusive-group',
    'disability',
    'backward-area',
    'new-party',
    'fptp-veteran',
    'proportional-veteran',
    'opportunist',
    'improving-party',
    'declining-party',
    'pani-maruwa',
    'gati-xada',
    'hutihara',
    'budi-bokuwa',
    'budo-bokuwa',
}


@pytest.fixture(scope="session")
def exported_pr_candidates():
    """Load exported PR candidate data from public/data/"""
    data_file = Path(__file__).parent.parent.parent / "public" / "data" / "dim_current_proportional_candidates.json"
    with open(data_file) as f:
        return json.load(f)


# ============================================================
# Tag Implication Tests
# ============================================================


class TestPRTagImplications:
    """Verify that boolean flags and tags are consistent for every PR candidate."""

    def test_chheparo_implies_was_parliament_member(self, exported_pr_candidates):
        """is_chheparo → was parliament member in 2079 or 2074"""
        for c in exported_pr_candidates:
            if c.get('is_chheparo'):
                was_pm = c.get('was_parliament_member_2079') or c.get('was_parliament_member_2074')
                assert was_pm, \
                    f"{c['candidate_name']}: chheparo but not a previous parliament member"

    def test_party_loyal_implies_was_parliament_member(self, exported_pr_candidates):
        """is_party_loyal → was parliament member"""
        for c in exported_pr_candidates:
            if c.get('is_party_loyal'):
                was_pm = c.get('was_parliament_member_2079') or c.get('was_parliament_member_2074')
                assert was_pm, \
                    f"{c['candidate_name']}: party-loyal but not a previous parliament member"

    def test_gati_xada_implies_proportional_veteran(self, exported_pr_candidates):
        """is_gati_xada → is_proportional_veteran"""
        for c in exported_pr_candidates:
            if c.get('is_gati_xada'):
                assert c.get('is_proportional_veteran'), \
                    f"{c['candidate_name']}: gati-xada but not proportional veteran"

    def test_hutihara_implies_fptp_veteran(self, exported_pr_candidates):
        """is_hutihara → is_fptp_veteran"""
        for c in exported_pr_candidates:
            if c.get('is_hutihara'):
                assert c.get('is_fptp_veteran'), \
                    f"{c['candidate_name']}: hutihara but not fptp veteran"

    def test_new_candidate_implies_no_history(self, exported_pr_candidates):
        """is_new_candidate → no PM history, no FPTP results"""
        for c in exported_pr_candidates:
            if c.get('is_new_candidate'):
                assert not c.get('was_parliament_member_2079'), \
                    f"{c['candidate_name']}: new but was PM 2079"
                assert not c.get('was_parliament_member_2074'), \
                    f"{c['candidate_name']}: new but was PM 2074"
                assert c.get('prev_2079_fptp_result') is None, \
                    f"{c['candidate_name']}: new but has 2079 FPTP result"
                assert c.get('prev_2074_fptp_result') is None, \
                    f"{c['candidate_name']}: new but has 2074 FPTP result"

    def test_top_rank_implies_rank_within_group_lte_5(self, exported_pr_candidates):
        """is_top_rank → rank_within_group <= 5"""
        for c in exported_pr_candidates:
            if c.get('is_top_rank'):
                assert c.get('rank_within_group') is not None and c['rank_within_group'] <= 5, \
                    f"{c['candidate_name']}: top-rank but rank_within_group={c.get('rank_within_group')}"

    def test_high_rank_implies_rank_within_group_lte_10(self, exported_pr_candidates):
        """is_high_rank → rank_within_group <= 10"""
        for c in exported_pr_candidates:
            if c.get('is_high_rank'):
                assert c.get('rank_within_group') is not None and c['rank_within_group'] <= 10, \
                    f"{c['candidate_name']}: high-rank but rank_within_group={c.get('rank_within_group')}"

    def test_varaute_implies_fptp_history(self, exported_pr_candidates):
        """is_varaute → has some FPTP history data"""
        for c in exported_pr_candidates:
            if c.get('is_varaute'):
                has_fptp = (
                    c.get('prev_2079_fptp_result') is not None
                    or c.get('prev_2079_fptp_votes') is not None
                    or c.get('prev_2074_fptp_result') is not None
                    or c.get('prev_2074_fptp_votes') is not None
                )
                assert has_fptp, \
                    f"{c['candidate_name']}: varaute but no FPTP history"

    def test_chheparo_flag_matches_tag(self, exported_pr_candidates):
        """is_chheparo ↔ 'chheparo' in tags (bidirectional)"""
        for c in exported_pr_candidates:
            has_tag = 'chheparo' in c.get('tags', [])
            has_flag = c.get('is_chheparo', False)
            assert has_tag == has_flag, \
                f"{c['candidate_name']}: chheparo tag={has_tag}, flag={has_flag}"

    def test_new_candidate_flag_matches_tag(self, exported_pr_candidates):
        """is_new_candidate ↔ 'new-candidate' in tags"""
        for c in exported_pr_candidates:
            has_tag = 'new-candidate' in c.get('tags', [])
            has_flag = c.get('is_new_candidate', False)
            assert has_tag == has_flag, \
                f"{c['candidate_name']}: new-candidate tag={has_tag}, flag={has_flag}"


# ============================================================
# Tag Mutual Exclusivity Tests
# ============================================================


class TestPRTagMutualExclusivity:
    """Tags that should never co-occur on the same PR candidate."""

    def test_chheparo_and_party_loyal_never_cooccur(self, exported_pr_candidates):
        for c in exported_pr_candidates:
            tags = set(c.get('tags', []))
            assert not ({'chheparo', 'party-loyal'}.issubset(tags)), \
                f"{c['candidate_name']}: both chheparo and party-loyal"

    def test_top_rank_and_high_rank_never_cooccur(self, exported_pr_candidates):
        """top-rank replaces high-rank (top 5 vs rank 6-10)"""
        for c in exported_pr_candidates:
            tags = set(c.get('tags', []))
            assert not ({'top-rank', 'high-rank'}.issubset(tags)), \
                f"{c['candidate_name']}: both top-rank and high-rank"

    def test_improving_and_declining_party_never_cooccur(self, exported_pr_candidates):
        for c in exported_pr_candidates:
            tags = set(c.get('tags', []))
            assert not ({'improving-party', 'declining-party'}.issubset(tags)), \
                f"{c['candidate_name']}: both improving-party and declining-party"

    def test_new_candidate_and_chheparo_never_cooccur(self, exported_pr_candidates):
        for c in exported_pr_candidates:
            tags = set(c.get('tags', []))
            assert not ({'new-candidate', 'chheparo'}.issubset(tags)), \
                f"{c['candidate_name']}: both new-candidate and chheparo"


# ============================================================
# Tag Validity Test
# ============================================================


class TestPRTagValidity:
    """Every tag in every PR candidate's tags array must belong to the known valid set."""

    def test_all_tags_are_valid(self, exported_pr_candidates):
        invalid = []
        for c in exported_pr_candidates:
            for tag in c.get('tags', []):
                if tag not in VALID_PR_TAGS:
                    invalid.append((c.get('serial_no'), c['candidate_name'], tag))
        assert not invalid, \
            f"Found {len(invalid)} invalid tags: {invalid[:10]}"
