"""
Cross-model consistency tests.
Validates that FPTP candidates, PR candidates, constituency profiles,
and party dimensions are internally consistent with each other.
"""

import json
import pytest
from pathlib import Path


DATA_DIR = Path(__file__).parent.parent.parent / "public" / "data"


@pytest.fixture(scope="session")
def exported_fptp_candidates():
    with open(DATA_DIR / "dim_current_fptp_candidates.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def exported_pr_candidates():
    with open(DATA_DIR / "dim_current_proportional_candidates.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def exported_constituencies():
    with open(DATA_DIR / "dim_constituency_profile.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def exported_parties():
    with open(DATA_DIR / "dim_parties.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def exported_parties_profile():
    with open(DATA_DIR / "dim_parties_profile.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def constituency_lookup(exported_constituencies):
    """Build a lookup set of (state_id, district_id, constituency_id) tuples.
    Normalizes constituency_id to str since types differ across models."""
    return {
        (c['state_id'], c['district_id'], str(c['constituency_id']))
        for c in exported_constituencies
    }


@pytest.fixture(scope="session")
def party_id_set(exported_parties):
    """Build a set of all party_ids"""
    return {p['party_id'] for p in exported_parties}


@pytest.fixture(scope="session")
def party_by_id(exported_parties):
    """Build a lookup dict by party_id"""
    return {p['party_id']: p for p in exported_parties}


# ============================================================
# Geography Consistency
# ============================================================


class TestGeographyConsistency:
    """Every FPTP candidate's geography must exist in constituency profiles."""

    def test_fptp_candidates_geography_in_constituencies(
        self, exported_fptp_candidates, constituency_lookup
    ):
        """Every FPTP candidate's (state_id, district_id, constituency_id) exists in constituency profiles"""
        missing = []
        for c in exported_fptp_candidates:
            key = (c['state_id'], c['district_id'], str(c['constituency_id']))
            if key not in constituency_lookup:
                missing.append((c['candidate_id'], c['candidate_name'], key))
        assert not missing, \
            f"{len(missing)} FPTP candidates reference non-existent constituencies: {missing[:5]}"

    def test_every_constituency_has_fptp_candidates(
        self, exported_fptp_candidates, exported_constituencies
    ):
        """Every constituency profile has at least one 2082 FPTP candidate"""
        constituency_keys_with_candidates = {
            (c['state_id'], c['district_id'], str(c['constituency_id']))
            for c in exported_fptp_candidates
        }
        missing = []
        for c in exported_constituencies:
            key = (c['state_id'], c['district_id'], str(c['constituency_id']))
            if key not in constituency_keys_with_candidates:
                missing.append(key)
        assert not missing, \
            f"{len(missing)} constituencies have no FPTP candidates: {missing[:5]}"


# ============================================================
# Party Reference Consistency
# ============================================================


class TestPartyReferenceConsistency:
    """Validate party references across models."""

    def test_fptp_candidates_party_id_coverage(self, exported_fptp_candidates):
        """At least 60% of FPTP candidates have a non-null party_id.
        Many small/independent parties don't have a dim_parties entry."""
        with_party = sum(1 for c in exported_fptp_candidates if c.get('party_id') is not None)
        total = len(exported_fptp_candidates)
        ratio = with_party / total
        assert ratio >= 0.60, \
            f"Only {ratio:.1%} of FPTP candidates have party_id (expected >= 60%)"

    def test_pr_candidates_party_id_coverage(self, exported_pr_candidates):
        """At least 95% of PR candidates have a non-null party_id.
        PR candidates are from established parties, so coverage should be high."""
        with_party = sum(1 for c in exported_pr_candidates if c.get('party_id') is not None)
        total = len(exported_pr_candidates)
        ratio = with_party / total
        assert ratio >= 0.95, \
            f"Only {ratio:.1%} of PR candidates have party_id (expected >= 95%)"

    def test_fptp_party_ids_exist_in_dim_parties(
        self, exported_fptp_candidates, party_id_set
    ):
        """All party_ids referenced by FPTP candidates exist in dim_parties"""
        missing = set()
        for c in exported_fptp_candidates:
            pid = c.get('party_id')
            if pid is not None and pid not in party_id_set:
                missing.add(pid)
        assert not missing, \
            f"FPTP candidates reference {len(missing)} unknown party_ids: {missing}"

    def test_pr_party_ids_exist_in_dim_parties(
        self, exported_pr_candidates, party_id_set
    ):
        """All party_ids referenced by PR candidates exist in dim_parties"""
        missing = set()
        for c in exported_pr_candidates:
            pid = c.get('party_id')
            if pid is not None and pid not in party_id_set:
                missing.add(pid)
        assert not missing, \
            f"PR candidates reference {len(missing)} unknown party_ids: {missing}"


# ============================================================
# Winner Consistency Across Models
# ============================================================


class TestWinnerConsistency:
    """Validate that previous winners in FPTP data match constituency profiles."""

    def test_prev_2079_winners_match_constituency_winning_party(
        self, exported_fptp_candidates, exported_constituencies, party_by_id
    ):
        """FPTP candidates with prev_election_result=='Winner' should match
        their constituency's winning_party_2079 (merger-aware)."""
        constituency_map = {
            (c['state_id'], c['district_id'], c['constituency_id']): c
            for c in exported_constituencies
        }
        mismatches = []
        for c in exported_fptp_candidates:
            if c.get('prev_election_result') != 'Winner':
                continue
            # The candidate won in 2079 — but they may have moved constituency since then
            prev_const_id = c.get('prev_election_constituency_id')
            prev_district = c.get('prev_election_district')
            if prev_const_id is None or prev_district is None:
                continue

            # Find the constituency the candidate won from in 2079
            # We need to search by district name and constituency id
            match = None
            for const in exported_constituencies:
                if (str(const['constituency_id']) == str(prev_const_id)
                        and const.get('district_name') == prev_district):
                    match = const
                    break
            if match is None:
                continue

            winning_party = match.get('winning_party_2079')
            if winning_party is None:
                continue

            candidate_party = c.get('prev_election_party')
            if candidate_party is None:
                continue

            # Direct match
            if candidate_party == winning_party:
                continue

            # Merger-aware: check if candidate's party is in winning party's previous_names
            party_id = c.get('party_id')
            if party_id and party_id in party_by_id:
                party = party_by_id[party_id]
                prev_names = party.get('previous_names', [])
                if winning_party in prev_names or candidate_party in prev_names:
                    continue

            mismatches.append(
                f"{c['candidate_name']} (ID {c['candidate_id']}): "
                f"won with '{candidate_party}' but constituency shows '{winning_party}'"
            )

        assert not mismatches, \
            f"{len(mismatches)} winner/constituency mismatches:\n" + "\n".join(mismatches[:5])


# ============================================================
# Pakad Margin Consistency
# ============================================================


class TestPakadConsistency:
    """Validate that pakad flag is consistent with win margins."""

    def test_pakad_implies_large_margin(self, exported_constituencies):
        """is_pakad → win_margin_2079 > 0.15 or win_margin_2074 > 0.15"""
        for c in exported_constituencies:
            if c.get('is_pakad'):
                margin_2079 = c.get('win_margin_2079') or 0
                margin_2074 = c.get('win_margin_2074') or 0
                assert margin_2079 > 0.15 or margin_2074 > 0.15, \
                    f"Constituency {c['constituency_id']}: pakad but margins={margin_2079:.3f}/{margin_2074:.3f}"

    def test_margin_approximately_recomputable_from_results(self, exported_constituencies):
        """Win margin can be approximately recomputed from fptp_2079_results vote counts"""
        for c in exported_constituencies:
            margin = c.get('win_margin_2079')
            results = c.get('fptp_2079_results', [])
            if margin is None or len(results) < 2:
                continue

            total_votes = sum(r['vote_count'] for r in results)
            if total_votes == 0:
                continue

            winner_votes = results[0]['vote_count']
            second_votes = results[1]['vote_count']
            computed_margin = (winner_votes - second_votes) / total_votes

            assert abs(computed_margin - margin) < 0.01, \
                f"Constituency {c['constituency_id']}: reported margin={margin:.4f}, computed={computed_margin:.4f}"
