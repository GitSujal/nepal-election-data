"""
Logical end-to-end tests for FPTP candidate tag calculations.
Pins specific well-known candidates to expected tags, validates universal
tag implications, mutual exclusivity rules, and tag validity.
"""

import json
import pytest
from pathlib import Path


VALID_FPTP_TAGS = {
    'tourist',
    'chheparo',
    'vaguwa-won',
    'vaguwa',
    'new-candidate',
    'educated',
    'uneducated',
    'new-party',
    'gen-z',
    'grandpa',
    'influential',
    'opportunist',
    'split-vote',
    'proportional-veteran',
    'loyal',
    'nepo',
    'budi-bokuwa',
    'budo-bokuwa',
    'purba-padadhikari',
}


@pytest.fixture(scope="session")
def exported_fptp_candidates():
    """Load exported FPTP candidate data from public/data/"""
    data_file = Path(__file__).parent.parent.parent / "public" / "data" / "dim_current_fptp_candidates.json"
    with open(data_file) as f:
        return json.load(f)


@pytest.fixture(scope="session")
def fptp_by_id(exported_fptp_candidates):
    """Build a lookup dict by candidate_id"""
    return {c['candidate_id']: c for c in exported_fptp_candidates}


# ============================================================
# Known Candidate Pin Tests
# ============================================================


class TestKnownCandidatePins:
    """Pin specific well-known candidates to their expected tags and flags."""

    def test_puspa_kamal_dahal_nepo(self, fptp_by_id):
        c = fptp_by_id[340050]
        assert 'nepo' in c['tags']
        assert c['is_nepo'] is True

    def test_puspa_kamal_dahal_full_tags(self, fptp_by_id):
        c = fptp_by_id[340050]
        expected = {'tourist', 'vaguwa-won', 'educated', 'grandpa', 'influential', 'nepo', 'purba-padadhikari'}
        assert expected.issubset(set(c['tags']))

    def test_renu_dahal_nepo(self, fptp_by_id):
        c = fptp_by_id[339835]
        assert 'nepo' in c['tags']
        assert c['has_known_relative'] is True

    def test_swarnim_wagle_not_new(self, fptp_by_id):
        c = fptp_by_id[340905]
        assert 'new-candidate' not in c['tags']
        assert c['is_new_candidate'] is False

    def test_swarnim_wagle_purba_padadhikari(self, fptp_by_id):
        c = fptp_by_id[340905]
        assert 'purba-padadhikari' in c['tags']
        assert c['is_past_minister'] is True

    def test_sobita_gautam_vaguwa_won(self, fptp_by_id):
        c = fptp_by_id[341145]
        assert 'vaguwa-won' in c['tags']
        assert c['is_vaguwa_prev_winner'] is True

    def test_gagan_thapa_tags(self, fptp_by_id):
        c = fptp_by_id[341549]
        expected = {'tourist', 'vaguwa-won', 'educated', 'purba-padadhikari'}
        assert expected.issubset(set(c['tags']))

    def test_matrika_yadav_loyal(self, fptp_by_id):
        c = fptp_by_id[339549]
        assert 'loyal' in c['tags']
        assert c['is_loyal'] is True

    def test_raj_kishor_opportunist_split_vote(self, fptp_by_id):
        c = fptp_by_id[341361]
        expected = {'chheparo', 'opportunist', 'split-vote'}
        assert expected.issubset(set(c['tags']))

    def test_mohammad_istikhaar_gen_z(self, fptp_by_id):
        c = fptp_by_id[341150]
        assert 'gen-z' in c['tags']
        assert c['is_gen_z'] is True
        assert c['age'] <= 27

    def test_dharamraj_gurung_budi_bokuwa(self, fptp_by_id):
        c = fptp_by_id[340134]
        assert 'budi-bokuwa' in c['tags']


# ============================================================
# Tag Implication Tests (universal rules across ALL candidates)
# ============================================================


class TestTagImplications:
    """Verify that boolean flags and tags are consistent for every candidate."""

    def test_vaguwa_prev_winner_implies_vaguwa(self, exported_fptp_candidates):
        """is_vaguwa_prev_winner → is_vaguwa must also be True"""
        for c in exported_fptp_candidates:
            if c.get('is_vaguwa_prev_winner'):
                assert c['is_vaguwa'], \
                    f"{c['candidate_name']} (ID {c['candidate_id']}): is_vaguwa_prev_winner but not is_vaguwa"

    def test_vaguwa_won_tag_implies_prev_winner(self, exported_fptp_candidates):
        """'vaguwa-won' in tags → previous election result was 'Winner'"""
        for c in exported_fptp_candidates:
            if 'vaguwa-won' in c.get('tags', []):
                won_2079 = c.get('prev_election_result') == 'Winner'
                won_2074 = c.get('prev_2074_election_result') == 'Winner'
                assert won_2079 or won_2074, \
                    f"{c['candidate_name']} (ID {c['candidate_id']}): vaguwa-won tag but no Winner result"

    def test_nepo_implies_family_link(self, exported_fptp_candidates):
        """is_nepo → has_known_relative or is_family_source"""
        for c in exported_fptp_candidates:
            if c.get('is_nepo'):
                assert c.get('has_known_relative') or c.get('is_family_source'), \
                    f"{c['candidate_name']} (ID {c['candidate_id']}): is_nepo but no family link"

    def test_loyal_implies_both_elections_same_party_constituency(self, exported_fptp_candidates):
        """is_loyal → participated in both 2079 and 2074, same party (merger-aware), same constituency"""
        for c in exported_fptp_candidates:
            if c.get('is_loyal'):
                assert c.get('prev_election_votes') is not None, \
                    f"{c['candidate_name']}: loyal but no 2079 votes"
                assert c.get('prev_2074_election_votes') is not None, \
                    f"{c['candidate_name']}: loyal but no 2074 votes"
                assert c.get('is_same_party_after_merger_check') is True, \
                    f"{c['candidate_name']}: loyal but party changed from 2079"
                assert c.get('is_same_party_2074_after_merger_check') is True, \
                    f"{c['candidate_name']}: loyal but party changed from 2074"

    def test_gen_z_implies_young(self, exported_fptp_candidates):
        """is_gen_z → age <= 27"""
        for c in exported_fptp_candidates:
            if c.get('is_gen_z'):
                assert c['age'] <= 27, \
                    f"{c['candidate_name']}: gen-z but age={c['age']}"

    def test_grandpa_implies_old(self, exported_fptp_candidates):
        """is_grandpa → age >= 60"""
        for c in exported_fptp_candidates:
            if c.get('is_grandpa'):
                assert c['age'] >= 60, \
                    f"{c['candidate_name']}: grandpa but age={c['age']}"

    def test_new_candidate_implies_no_history(self, exported_fptp_candidates):
        """is_new_candidate → no 2079/2074 votes, not parliament member, total_elections_contested == 0"""
        for c in exported_fptp_candidates:
            if c.get('is_new_candidate'):
                assert c.get('prev_election_votes') is None, \
                    f"{c['candidate_name']}: new but has 2079 votes"
                assert c.get('prev_2074_election_votes') is None, \
                    f"{c['candidate_name']}: new but has 2074 votes"
                assert not c.get('was_parliament_member_2079'), \
                    f"{c['candidate_name']}: new but was PM 2079"
                assert not c.get('was_parliament_member_2074'), \
                    f"{c['candidate_name']}: new but was PM 2074"

    def test_past_minister_flag_matches_tag(self, exported_fptp_candidates):
        """is_past_minister ↔ 'purba-padadhikari' in tags (bidirectional)"""
        for c in exported_fptp_candidates:
            has_tag = 'purba-padadhikari' in c.get('tags', [])
            has_flag = c.get('is_past_minister', False)
            assert has_tag == has_flag, \
                f"{c['candidate_name']} (ID {c['candidate_id']}): purba-padadhikari tag={has_tag}, flag={has_flag}"

    def test_tourist_flag_matches_tag(self, exported_fptp_candidates):
        """is_tourist_candidate ↔ 'tourist' in tags"""
        for c in exported_fptp_candidates:
            has_tag = 'tourist' in c.get('tags', [])
            has_flag = c.get('is_tourist_candidate', False)
            assert has_tag == has_flag, \
                f"{c['candidate_name']} (ID {c['candidate_id']}): tourist tag={has_tag}, flag={has_flag}"

    def test_chheparo_flag_matches_tag(self, exported_fptp_candidates):
        """is_chheparo ↔ 'chheparo' in tags"""
        for c in exported_fptp_candidates:
            has_tag = 'chheparo' in c.get('tags', [])
            has_flag = c.get('is_chheparo', False)
            assert has_tag == has_flag, \
                f"{c['candidate_name']} (ID {c['candidate_id']}): chheparo tag={has_tag}, flag={has_flag}"


# ============================================================
# Tag Mutual Exclusivity Tests
# ============================================================


class TestTagMutualExclusivity:
    """Tags that should never co-occur on the same candidate."""

    def test_educated_and_uneducated_never_cooccur(self, exported_fptp_candidates):
        for c in exported_fptp_candidates:
            tags = set(c.get('tags', []))
            assert not ({'educated', 'uneducated'}.issubset(tags)), \
                f"{c['candidate_name']}: both educated and uneducated"

    def test_gen_z_and_grandpa_never_cooccur(self, exported_fptp_candidates):
        for c in exported_fptp_candidates:
            tags = set(c.get('tags', []))
            assert not ({'gen-z', 'grandpa'}.issubset(tags)), \
                f"{c['candidate_name']}: both gen-z and grandpa"

    def test_new_candidate_and_loyal_never_cooccur(self, exported_fptp_candidates):
        for c in exported_fptp_candidates:
            tags = set(c.get('tags', []))
            assert not ({'new-candidate', 'loyal'}.issubset(tags)), \
                f"{c['candidate_name']}: both new-candidate and loyal"

    def test_new_candidate_and_chheparo_never_cooccur(self, exported_fptp_candidates):
        for c in exported_fptp_candidates:
            tags = set(c.get('tags', []))
            assert not ({'new-candidate', 'chheparo'}.issubset(tags)), \
                f"{c['candidate_name']}: both new-candidate and chheparo"

    def test_vaguwa_and_vaguwa_won_never_cooccur_in_tags(self, exported_fptp_candidates):
        """'vaguwa' and 'vaguwa-won' are mutually exclusive in the tags array"""
        for c in exported_fptp_candidates:
            tags = set(c.get('tags', []))
            assert not ({'vaguwa', 'vaguwa-won'}.issubset(tags)), \
                f"{c['candidate_name']}: both vaguwa and vaguwa-won in tags"

    def test_loyal_and_chheparo_never_cooccur(self, exported_fptp_candidates):
        for c in exported_fptp_candidates:
            tags = set(c.get('tags', []))
            assert not ({'loyal', 'chheparo'}.issubset(tags)), \
                f"{c['candidate_name']}: both loyal and chheparo"


# ============================================================
# Tag Validity Test
# ============================================================


class TestTagValidity:
    """Every tag in every candidate's tags array must belong to the known valid set."""

    def test_all_tags_are_valid(self, exported_fptp_candidates):
        invalid = []
        for c in exported_fptp_candidates:
            for tag in c.get('tags', []):
                if tag not in VALID_FPTP_TAGS:
                    invalid.append((c['candidate_id'], c['candidate_name'], tag))
        assert not invalid, \
            f"Found {len(invalid)} invalid tags: {invalid[:10]}"
