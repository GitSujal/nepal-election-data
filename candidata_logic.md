## Dim Current Candidates

For each 2082 BS FPTP candidate we calculate characteristics based on their current data, their past FPTP performance (2079 and 2074), and their parliament membership history (from `dim_parliament_members`).

We then calculate **tags** for the candidates which are displayed in their candidate profile as badges (like game profile badges). These tags help voters quickly understand key aspects of each candidate's background and history at a glance. Tags are displayed prominently in the candidate profiles on the dashboard, and users can filter candidates by tag.

### Data Sources

- **Current candidates**: `stg_current_fptp_candidates` (2082 BS)
- **Past FPTP results**: `stg_past_fptp_election_result` (2079 BS), `stg_past_2074_fptp_election_result` (2074 BS)
- **Parliament members**: `dim_parliament_members` — covers both 2074 and 2079 terms, includes election type (FPTP/Proportional), party, district, and constituency per term
- **Party mapping**: `dim_parties` — tracks party renames/mergers via `previous_names` list
- **Qualification mapping**: `qualification_level_mapping` seed

### Election History Priority

For tags that compare against "previous election", the model uses **2079 first, then falls back to 2074** if the candidate did not contest in 2079. This applies to: Chheparo, Vaguwa, Influential, Opportunist, Split Vote, and candidate_type.

### Candidate Timeline

The model provides full timeline data so the frontend can construct a candidate's complete history:

**2074 layer** (two possible events per candidate):
- FPTP candidacy: `prev_2074_election_party`, `prev_2074_election_district`, `prev_2074_election_constituency_id`, `prev_2074_election_votes`, `prev_2074_election_rank`, `prev_2074_election_result`, `prev_2074_election_casted_vote`, `prev_2074_election_total_voters`
- Parliament membership: `was_parliament_member_2074`, `parliament_member_2074_election_type` (FPTP/Proportional), `parliament_member_2074_party`, `parliament_member_2074_district`, `parliament_member_2074_constituency`

**2079 layer** (two possible events per candidate):
- FPTP candidacy: `prev_election_party`, `prev_election_district`, `prev_election_constituency_id`, `prev_election_votes`, `prev_election_rank`, `prev_election_result`, `prev_election_casted_vote`, `prev_election_total_voters`
- Parliament membership: `was_parliament_member_2079`, `parliament_member_2079_election_type`, `parliament_member_2079_party`, `parliament_member_2079_district`, `parliament_member_2079_constituency`

**2082 layer** (current candidacy):
- `political_party_name`, `district_name`, `constituency_id`, `constituency_name`, `current_vote_received`, `rank_position`, `election_status`

**Meta**: `elections_contested` (0, 1, or 2) counts how many past FPTP elections the candidate appeared in.

### Tags

1. **Tourist** — Tag: `Tourist` Icon :airplane:
   - A candidate whose candidacy district differs from their citizenship district.
   - Column: `is_tourist_candidate`
   - Calculation: `citizenship_district != district_name`

2. **Chheparo (Lizard)** — Tag: `Chheparo` - Icon :lizard:
   - A candidate who switched parties since their last election. Checks 2079 first; if the candidate was not in 2079, checks 2074.
   - Column: `is_chheparo`
   - Calculation: Current party differs from previous election party (after accounting for party mergers/renames via `dim_parties.previous_names`).
   - Exceptions:
     - Not tagged if the candidate's current party is "Independent" (स्वतन्त्र).
     - Not tagged if the candidate's previous party was "Independent" and their current party is a new party (no previous names in party mapping).

3. **Vaguwa (Wanderer)** — Tag: `Vaguwa` or `Vaguwa (Won Prev)` Icon :running_man:
   - A candidate who changed their candidacy district or constituency since their last election. Checks 2079 first; falls back to 2074.
   - Column: `is_vaguwa`, `is_vaguwa_prev_winner`
   - Calculation: Current district+constituency differs from previous election district+constituency.
   - Special: If they won from their previous constituency, the tag shows as `Vaguwa (Won Prev)` (displayed with a green border on the badge).

4. **New Candidate** — Tag: `New Candidate` Icon :baby:
   - A candidate who did not contest FPTP in any previous election (neither 2079 nor 2074).
   - Column: `is_new_candidate`
   - Calculation: `prev_election_votes IS NULL AND prev_2074_election_votes IS NULL`

5. **Educated** — Tag: `Educated` :Degree Hat and Certificate:
   - A candidate with qualification level of High School (+2) or above.
   - Column: `is_educated`
   - Calculation: `qualification_level IN ('2', 'Bachelor', 'Masters', 'PHD')`

6. **Uneducated** — Tag: `Uneducated` :thumbprint:
   - A candidate with qualification level below High School.
   - Column: `is_uneducated`
   - Calculation: `qualification_level = 'Under SLC'`, or qualification text exists but doesn't map to any recognized level.

7. **New Party** — Tag: `New Party` :party_popper:
   - A candidate whose current party has no previous names in the party rename/merger mapping (i.e., the party was formed after the last elections).
   - Column: `is_new_party`
   - Calculation: Party exists in `dim_parties` but `previous_names` list is empty.

8. **Gen-z** — Tag: `Gen-z` :young_person:
   - A candidate under 30 years old.
   - Column: `is_gen_z`
   - Calculation: `age < 30`

9. **Grandpa** — Tag: `Grandpa` :older_adult:
   - A candidate over 60 years old.
   - Column: `is_grandpa`
   - Calculation: `age > 60`

10. **Influential** — Tag: `Influential` :star:
    - A candidate who won their previous election with more than 20% vote margin over the runner-up. Checks 2079 first; falls back to 2074.
    - Column: `is_influential`
    - Calculation: `(winner_votes - runner_up_votes) / casted_vote > 0.20` in the relevant previous election.

11. **Opportunist** — Tag: `Opportunist` :money_mouth_face:
    - A candidate who was "Independent" (स्वतन्त्र) in their last election but now represents a non-new party. Checks 2079 first; falls back to 2074.
    - Column: `is_opportunist`
    - Calculation: Previous party was "Independent" AND current party is not tagged as new.

12. **Split Vote Candidate** — Tag: `Split Vote` :scissors:
    - A candidate who got less than 3% of total casted votes in their last election. Checks 2079 first; falls back to 2074.
    - Column: `is_split_vote_candidate`
    - Calculation: `prev_election_votes / prev_election_casted_vote < 0.03`

13. **Proportional Veteran** — Tag: `Proportional Veteran` :Medal:
    - A candidate who was a parliament member via the proportional list in either 2074 or 2079.
    - Column: `is_proportional_veteran`
    - Calculation: Joined to `dim_parliament_members` on candidate name; checks `election_type_2074 = 'Proportional' OR election_type_2079 = 'Proportional'`.

14. **Loyal** — Tag: `Loyal` :shield:
    - A candidate who contested FPTP in both 2074 and 2079, stayed with the same party across all three elections (2074, 2079, 2082), and stayed in the same constituency across all three elections.
    - Column: `is_loyal`
    - Calculation: Must have contested in both past elections (`elections_contested = 2`), AND current party matches 2079 party (after merger check), AND current party matches 2074 party (after merger check), AND 2079 party matches 2074 party (after merger check), AND district+constituency is the same across all three elections.

### Candidate Type Classification

In addition to tags, each candidate gets a single `candidate_type` value for primary classification. Uses 2079-based comparison first; falls back to 2074 if the candidate was not in 2079:

- **Chheparo** — switched parties (same logic as the tag)
- **Vaguwa** — changed district/constituency (same logic as the tag)
- **Same Location** — contested previously in the same district+constituency with the same party
- **New Candidate** — not found in either 2079 or 2074 FPTP data

### Additional Computed Columns (not tags)

- `is_education_changed` — qualification level changed between 2079 and current (NULL if not in 2079)
- `is_same_party_after_merger_check` — current party matches 2079 party after accounting for mergers
- `is_same_party_2074_after_merger_check` — current party matches 2074 party after accounting for mergers
- `is_same_party_2074_2079` — 2079 party matches 2074 party after accounting for mergers
- `elections_contested` — count of past FPTP elections contested (0, 1, or 2)
