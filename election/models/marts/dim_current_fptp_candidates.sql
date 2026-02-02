{{ config(materialized='table') }}

with current as (
    select * from {{ ref('stg_current_fptp_candidates') }}
),

previous_2079 as (
    select * from {{ ref('stg_past_2079_fptp_election_result') }}
),

previous_2074 as (
    select * from {{ ref('stg_past_2074_fptp_election_result') }}
),

districts as (
    select * from {{ ref('stg_districts') }}
),

parties as (
    select * from {{ ref('dim_parties') }}
),

parliament_members as (
    select * from {{ ref('dim_parliament_members') }}
),

qualification_levels as (
    select distinct
        {{ adapter.quote("QUALIFICATION") }} as qualification_raw,
        {{ adapter.quote("Category") }} as qualification_level
    from {{ ref('qualification_level_mapping') }}
    where {{ adapter.quote("QUALIFICATION") }} is not null
      and trim({{ adapter.quote("QUALIFICATION") }}) != ''
),

-- Map current candidate's qualification to a level
current_with_qual as (
    select
        cc.*,
        ql.qualification_level as current_qualification_level
    from current cc
    left join qualification_levels ql
        on cc.{{ adapter.quote("QUALIFICATION") }} = ql.qualification_raw
),

-- Map previous 2079 candidate's qualification to a level
previous_2079_with_qual as (
    select
        pr.*,
        ql.qualification_level as prev_qualification_level
    from previous_2079 pr
    left join qualification_levels ql
        on pr.{{ adapter.quote("QUALIFICATION") }} = ql.qualification_raw
),

-- Rank candidates per constituency by votes for 2079
ranked_2079 as (
    select
        {{ adapter.quote("State") }},
        {{ adapter.quote("DistrictCd") }},
        {{ adapter.quote("SCConstID") }},
        {{ adapter.quote("TotalVoteReceived") }},
        row_number() over (
            partition by {{ adapter.quote("State") }}, {{ adapter.quote("DistrictCd") }}, {{ adapter.quote("SCConstID") }}
            order by {{ adapter.quote("TotalVoteReceived") }} desc
        ) as vote_rank
    from previous_2079
),

-- Get runner-up votes and computed casted_vote per constituency for 2079
prev_runner_up_2079 as (
    select
        r.{{ adapter.quote("State") }},
        r.{{ adapter.quote("DistrictCd") }},
        r.{{ adapter.quote("SCConstID") }},
        max(case when r.vote_rank = 2 then r.{{ adapter.quote("TotalVoteReceived") }} end) as runner_up_votes,
        s.casted_vote
    from ranked_2079 r
    inner join (
        select
            {{ adapter.quote("State") }},
            {{ adapter.quote("DistrictCd") }},
            {{ adapter.quote("SCConstID") }},
            sum({{ adapter.quote("TotalVoteReceived") }}) as casted_vote
        from previous_2079
        group by {{ adapter.quote("State") }}, {{ adapter.quote("DistrictCd") }}, {{ adapter.quote("SCConstID") }}
    ) s
        on r.{{ adapter.quote("State") }} = s.{{ adapter.quote("State") }}
        and r.{{ adapter.quote("DistrictCd") }} = s.{{ adapter.quote("DistrictCd") }}
        and r.{{ adapter.quote("SCConstID") }} = s.{{ adapter.quote("SCConstID") }}
    group by r.{{ adapter.quote("State") }}, r.{{ adapter.quote("DistrictCd") }}, r.{{ adapter.quote("SCConstID") }}, s.casted_vote
),

-- Get runner-up votes per constituency for 2074
prev_runner_up_2074 as (
    select
        {{ adapter.quote("State") }},
        {{ adapter.quote("SCConstID") }},
        max(case when {{ adapter.quote("Rank") }} = 2 then {{ adapter.quote("TotalVoteReceived") }} end) as runner_up_votes
    from previous_2074
    group by {{ adapter.quote("State") }}, {{ adapter.quote("SCConstID") }}
),

-- Pool of all known politicians with normalized names and party names
known_politicians as (
    -- Current FPTP candidates
    select distinct
        candidate_name_normalized as name_normalized,
        {{ adapter.quote("PoliticalPartyName") }} as party_name
    from {{ ref('stg_current_fptp_candidates') }}
    union all
    -- 2079 FPTP candidates
    select distinct
        candidate_name_normalized,
        {{ adapter.quote("PoliticalPartyName") }}
    from {{ ref('stg_past_2079_fptp_election_result') }}
    union all
    -- 2074 FPTP candidates
    select distinct
        candidate_name_normalized,
        {{ adapter.quote("PoliticalPartyName") }}
    from {{ ref('stg_past_2074_fptp_election_result') }}
    union all
    -- Parliament members
    select distinct
        name_normalized,
        coalesce(party_2079_np, party_2074_np) as party_name
    from {{ ref('dim_parliament_members') }}
    where coalesce(party_2079_np, party_2074_np) is not null
    union all
    -- Current PR candidates
    select distinct
        candidate_name_normalized,
        political_party_name
    from {{ ref('stg_current_proportional_candidates') }}
),

-- Normalize spouse and father names for current FPTP candidates
fptp_with_family_norms as (
    select
        {{ adapter.quote("CandidateID") }},
        {{ adapter.quote("PoliticalPartyName") }},
        -- Candidate's own normalized name for reverse matching
        replace(replace(replace(replace(replace(replace(replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(
                            replace(replace({{ adapter.quote("CandidateName") }}, chr(8205), ''), chr(8204), ''),
                            '\{[^}]*\}|\([^)]*\)|\[[^\]]*\]', '', 'g'
                        ),
                        '[\s\.\x{00a0}]+', '', 'g'
                    ),
                    '^(डा॰?|डा०?|कु\.|श्री\.?)', ''
                ),
                '[०-९।]+', '', 'g'
            ),
        'ी', 'ि'), 'ू', 'ु'), 'ँ', 'ं'), 'ङ्ग', 'ङ'), 'ट्ट', 'ट'), 'व', 'ब'), 'ण', 'न')
        as candidate_name_normalized,
        -- Normalized spouse name
        replace(replace(replace(replace(replace(replace(replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(
                            replace(replace({{ adapter.quote("SPOUCE_NAME") }}, chr(8205), ''), chr(8204), ''),
                            '\{[^}]*\}|\([^)]*\)|\[[^\]]*\]', '', 'g'
                        ),
                        '[\s\.\x{00a0}]+', '', 'g'
                    ),
                    '^(डा॰?|डा०?|कु\.|श्री\.?)', ''
                ),
                '[०-९।]+', '', 'g'
            ),
        'ी', 'ि'), 'ू', 'ु'), 'ँ', 'ं'), 'ङ्ग', 'ङ'), 'ट्ट', 'ट'), 'व', 'ब'), 'ण', 'न')
        as spouse_name_normalized,
        -- Normalized father name
        replace(replace(replace(replace(replace(replace(replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(
                            replace(replace({{ adapter.quote("FATHER_NAME") }}, chr(8205), ''), chr(8204), ''),
                            '\{[^}]*\}|\([^)]*\)|\[[^\]]*\]', '', 'g'
                        ),
                        '[\s\.\x{00a0}]+', '', 'g'
                    ),
                    '^(डा॰?|डा०?|कु\.|श्री\.?)', ''
                ),
                '[०-९।]+', '', 'g'
            ),
        'ी', 'ि'), 'ू', 'ु'), 'ँ', 'ं'), 'ङ्ग', 'ङ'), 'ट्ट', 'ट'), 'व', 'ब'), 'ण', 'न')
        as father_name_normalized
    from {{ ref('stg_current_fptp_candidates') }}
),

-- PR candidate pool with normalized names, gender, and party for Bokuwa matching
pr_candidate_pool as (
    select distinct
        candidate_name_normalized as name_normalized,
        gender as pr_gender,
        political_party_name as pr_party_name,
        associated_party as pr_associated_party
    from {{ ref('stg_current_proportional_candidates') }}
    where candidate_name_normalized is not null and candidate_name_normalized != ''
),

proportional_mapping as (
    select
        {{ adapter.quote("proportional_party_name") }} as proportional_party_name,
        {{ adapter.quote("mapped_party_name") }} as mapped_party_name
    from {{ ref('proportional_to_fptp_party_name_mapping') }}
    where {{ adapter.quote("mapped_party_name") }} is not null
      and trim({{ adapter.quote("mapped_party_name") }}) != ''
),

-- Bokuwa flags: FPTP candidate whose spouse is a PR candidate in same party
bokuwa_flags as (
    select
        f.{{ adapter.quote("CandidateID") }},
        bool_or(
            pr.pr_gender = 'महिला'
            and cc_gender.{{ adapter.quote("Gender") }} = 'पुरुष'
        ) as is_budi_bokuwa,
        bool_or(
            pr.pr_gender = 'पुरुष'
            and cc_gender.{{ adapter.quote("Gender") }} = 'महिला'
        ) as is_budo_bokuwa
    from fptp_with_family_norms f
    inner join {{ ref('stg_current_fptp_candidates') }} cc_gender
        on f.{{ adapter.quote("CandidateID") }} = cc_gender.{{ adapter.quote("CandidateID") }}
    inner join pr_candidate_pool pr
        on pr.name_normalized = f.spouse_name_normalized
        and f.spouse_name_normalized is not null
        and f.spouse_name_normalized != ''
    left join parties pp on pr.pr_party_name = pp.current_party_name
    left join proportional_mapping pmm on pr.pr_party_name = pmm.proportional_party_name
    where (
        pr.pr_party_name = f.{{ adapter.quote("PoliticalPartyName") }}
        or pmm.mapped_party_name = f.{{ adapter.quote("PoliticalPartyName") }}
        or pr.pr_associated_party = f.{{ adapter.quote("PoliticalPartyName") }}
        or (pp.party_id is not null and list_contains(pp.previous_names, f.{{ adapter.quote("PoliticalPartyName") }}))
        or exists (
            select 1 from parties pp2
            where pp2.current_party_name = f.{{ adapter.quote("PoliticalPartyName") }}
              and list_contains(pp2.previous_names, pr.pr_party_name)
        )
    )
    group by f.{{ adapter.quote("CandidateID") }}
),

-- Enrich candidates with their party's previous names for merger-aware matching
fptp_with_party_history as (
    select
        f1.*,
        p.previous_names as candidate_party_previous_names
    from fptp_with_family_norms f1
    left join parties p on p.current_party_name = f1.{{ adapter.quote("PoliticalPartyName") }}
),

-- Nepo flags: check if any family member (spouse/parent/child) is involved in politics (past or current)
-- Only flags as nepo if the matched politician's party is the same as the candidate's party
-- (using merger-aware comparison via dim_parties.previous_names)
nepo_flags as (
    select
        f1.{{ adapter.quote("CandidateID") }},
        -- Case 1: Candidate has a known politician as spouse or parent (with party match)
        exists (
            select 1 from known_politicians kp
            where (kp.name_normalized = f1.spouse_name_normalized or kp.name_normalized = f1.father_name_normalized)
              and (
                  (f1.spouse_name_normalized is not null and f1.spouse_name_normalized != '')
                  or (f1.father_name_normalized is not null and f1.father_name_normalized != '')
              )
              and (
                  -- Direct party match
                  kp.party_name = f1.{{ adapter.quote("PoliticalPartyName") }}
                  -- Politician's party is a previous name of candidate's current party
                  or (f1.candidate_party_previous_names is not null and list_contains(f1.candidate_party_previous_names, kp.party_name))
                  -- Candidate's party is a previous name of politician's party
                  or exists (
                      select 1 from parties p2
                      where p2.current_party_name = kp.party_name
                        and list_contains(p2.previous_names, f1.{{ adapter.quote("PoliticalPartyName") }})
                  )
              )
        ) as has_known_relative,
        -- Case 2: Candidate's name is mentioned as spouse or father by another candidate (with party match)
        exists (
            select 1 from fptp_with_party_history f2
            where (f2.spouse_name_normalized = f1.candidate_name_normalized or f2.father_name_normalized = f1.candidate_name_normalized)
              and f1.candidate_name_normalized is not null
              and f1.candidate_name_normalized != ''
              and (
                  -- Direct party match
                  f2.{{ adapter.quote("PoliticalPartyName") }} = f1.{{ adapter.quote("PoliticalPartyName") }}
                  -- f2's party is a previous name of f1's current party
                  or (f1.candidate_party_previous_names is not null and list_contains(f1.candidate_party_previous_names, f2.{{ adapter.quote("PoliticalPartyName") }}))
                  -- f1's party is a previous name of f2's party
                  or (f2.candidate_party_previous_names is not null and list_contains(f2.candidate_party_previous_names, f1.{{ adapter.quote("PoliticalPartyName") }}))
              )
        ) as is_family_source
    from fptp_with_party_history f1
),

joined as (
    select
        cc.{{ adapter.quote("CandidateID") }} as candidate_id,
        cc.{{ adapter.quote("CandidateName") }} as candidate_name,
        cc.{{ adapter.quote("Gender") }} as gender,
        cc.{{ adapter.quote("AGE_YR") }} as age,
        case
            when cc.{{ adapter.quote("AGE_YR") }} < 30 then 'Below 30'
            when cc.{{ adapter.quote("AGE_YR") }} between 30 and 49 then '30-50'
            when cc.{{ adapter.quote("AGE_YR") }} between 50 and 59 then '50-60'
            else '60+'
        end as age_group,
        cc.{{ adapter.quote("DOB") }} as date_of_birth,
        cc.{{ adapter.quote("FATHER_NAME") }} as father_name,
        cc.{{ adapter.quote("SPOUCE_NAME") }} as spouse_name,
        cc.{{ adapter.quote("QUALIFICATION") }} as qualification,
        cc.current_qualification_level as qualification_level,
        -- Numeric scale: 0=null/undefined, 1=Under SLC, 2=SLC, 3=+2, 4=Bachelor, 5=Masters, 6=PHD
        case
            when cc.current_qualification_level = 'Under SLC' then 1
            when cc.current_qualification_level = 'SLC' then 2
            when cc.current_qualification_level = '2' then 3
            when cc.current_qualification_level = 'Bachelor' then 4
            when cc.current_qualification_level = 'Masters' then 5
            when cc.current_qualification_level = 'PHD' then 6
            else 0
        end as qualification_level_scale,
        cc.{{ adapter.quote("NAMEOFINST") }} as institution_name,
        cc.{{ adapter.quote("ADDRESS") }} as address,
        cc.{{ adapter.quote("EXPERIENCE") }} as experience,
        cc.{{ adapter.quote("OTHERDETAILS") }} as other_details,

        -- Current political affiliation
        cc.{{ adapter.quote("SYMBOLCODE") }} as symbol_code,
        cc.{{ adapter.quote("SymbolName") }} as symbol_name,
        cc.{{ adapter.quote("PoliticalPartyName") }} as political_party_name,

        -- Current geography
        cc.{{ adapter.quote("STATE_ID") }} as state_id,
        cc.{{ adapter.quote("StateName") }} as state_name,
        d.{{ adapter.quote("id") }} as district_id,
        cc.{{ adapter.quote("DistrictName") }} as district_name,
        cc.{{ adapter.quote("SCConstID") }} as constituency_id,
        cc.{{ adapter.quote("ConstName") }} as constituency_name,
        cc.{{ adapter.quote("CTZDIST") }} as citizenship_district,

        -- Current election info
        cc.{{ adapter.quote("E_STATUS") }} as election_status,
        cc.{{ adapter.quote("TotalVoteReceived") }} as current_vote_received,
        cc.{{ adapter.quote("R") }} as rank_position,

        -- Previous 2079 election performance
        pr.{{ adapter.quote("TotalVoteReceived") }} as prev_election_votes,
        pr.{{ adapter.quote("Rank") }} as prev_election_rank,
        pr.{{ adapter.quote("Remarks") }} as prev_election_remarks,
        case
            when pr.{{ adapter.quote("Remarks") }} = 'Elected' then 'Winner'
            when pr.{{ adapter.quote("Remarks") }} is null and pr.{{ adapter.quote("TotalVoteReceived") }} is not null then 'Loser'
            else null
        end as prev_election_result,
        pr.{{ adapter.quote("PoliticalPartyName") }} as prev_election_party,
        pr.{{ adapter.quote("State") }} as prev_election_state,
        pr.{{ adapter.quote("DistrictName") }} as prev_election_district,
        pr.{{ adapter.quote("DistrictCd") }} as prev_election_district_cd,
        pr.{{ adapter.quote("SCConstID") }} as prev_election_constituency_id,
        ru.casted_vote as prev_election_casted_vote,
        pr.{{ adapter.quote("TotalVoters") }} as prev_election_total_voters,

        -- Previous 2079 qualification
        pr.{{ adapter.quote("QUALIFICATION") }} as prev_qualification,
        pr.prev_qualification_level,

        -- Runner-up votes from previous 2079 election
        ru.runner_up_votes as prev_runner_up_votes,

        -- Previous 2074 election performance
        pr74.{{ adapter.quote("TotalVoteReceived") }} as prev_2074_election_votes,
        pr74.{{ adapter.quote("Rank") }} as prev_2074_election_rank,
        pr74.{{ adapter.quote("Remarks") }} as prev_2074_election_remarks,
        case
            when pr74.{{ adapter.quote("Remarks") }} = 'Elected' then 'Winner'
            when pr74.{{ adapter.quote("Remarks") }} is null and pr74.{{ adapter.quote("TotalVoteReceived") }} is not null then 'Loser'
            else null
        end as prev_2074_election_result,
        pr74.{{ adapter.quote("PoliticalPartyName") }} as prev_2074_election_party,
        pr74.{{ adapter.quote("State") }} as prev_2074_election_state,
        pr74.{{ adapter.quote("DistrictName") }} as prev_2074_election_district,
        pr74.{{ adapter.quote("SCConstID") }} as prev_2074_election_constituency_id,
        pr74.{{ adapter.quote("CastedVote") }} as prev_2074_election_casted_vote,
        pr74.{{ adapter.quote("TotalVoters") }} as prev_2074_election_total_voters,

        -- Runner-up votes from 2074 election
        ru74.runner_up_votes as prev_2074_runner_up_votes,

        -- Elections contested count
        case
            when pr.{{ adapter.quote("TotalVoteReceived") }} is not null and pr74.{{ adapter.quote("TotalVoteReceived") }} is not null then 2
            when pr.{{ adapter.quote("TotalVoteReceived") }} is not null or pr74.{{ adapter.quote("TotalVoteReceived") }} is not null then 1
            else 0
        end as elections_contested,

        -- Party info
        p.previous_names as party_previous_names,

        -- Check if current party is a merger/rename of previous 2079 party
        case
            when pr.{{ adapter.quote("PoliticalPartyName") }} is null then null
            when cc.{{ adapter.quote("PoliticalPartyName") }} = pr.{{ adapter.quote("PoliticalPartyName") }} then true
            when p.party_id is not null
                and list_contains(p.previous_names, pr.{{ adapter.quote("PoliticalPartyName") }}) then true
            else false
        end as is_same_party_after_merger_check,

        -- Check if current party is same as 2074 party (after merger check)
        case
            when pr74.{{ adapter.quote("PoliticalPartyName") }} is null then null
            when cc.{{ adapter.quote("PoliticalPartyName") }} = pr74.{{ adapter.quote("PoliticalPartyName") }} then true
            when p.party_id is not null
                and list_contains(p.previous_names, pr74.{{ adapter.quote("PoliticalPartyName") }}) then true
            else false
        end as is_same_party_2074_after_merger_check,

        -- Check if 2079 party is same as 2074 party (for loyal check)
        case
            when pr.{{ adapter.quote("PoliticalPartyName") }} is null or pr74.{{ adapter.quote("PoliticalPartyName") }} is null then null
            when pr.{{ adapter.quote("PoliticalPartyName") }} = pr74.{{ adapter.quote("PoliticalPartyName") }} then true
            when p.party_id is not null
                and list_contains(p.previous_names, pr74.{{ adapter.quote("PoliticalPartyName") }})
                and list_contains(p.previous_names, pr.{{ adapter.quote("PoliticalPartyName") }}) then true
            when p.party_id is not null
                and cc.{{ adapter.quote("PoliticalPartyName") }} = pr.{{ adapter.quote("PoliticalPartyName") }}
                and list_contains(p.previous_names, pr74.{{ adapter.quote("PoliticalPartyName") }}) then true
            else false
        end as is_same_party_2074_2079,

        -- Tourist candidate: citizenship district differs from candidacy district
        case
            when cc.{{ adapter.quote("CTZDIST") }} != cc.{{ adapter.quote("DistrictName") }} then true
            else false
        end as is_tourist_candidate,

        -- Education changed flag
        case
            when pr.{{ adapter.quote("QUALIFICATION") }} is null then null
            when cc.current_qualification_level is null and pr.prev_qualification_level is not null then true
            when cc.current_qualification_level is not null and pr.prev_qualification_level is not null
                and cc.current_qualification_level != pr.prev_qualification_level then true
            else false
        end as is_education_changed,

        -- Is new party: party has no previous names (formed after last election)
        case
            when p.party_id is not null then p.is_new_party
            else true  -- If party not found in dim_parties, consider it new
        end as is_new_party,

        -- Parliament member details for 2074
        coalesce(pm.was_member_2074, false) as was_parliament_member_2074,
        pm.election_type_2074 as parliament_member_2074_election_type,
        pm.party_2074_np as parliament_member_2074_party,
        pm.district_2074_np as parliament_member_2074_district,
        pm.election_area_2074 as parliament_member_2074_constituency,

        -- Parliament member details for 2079
        coalesce(pm.was_member_2079, false) as was_parliament_member_2079,
        pm.election_type_2079 as parliament_member_2079_election_type,
        pm.party_2079_np as parliament_member_2079_party,
        pm.district_2079_np as parliament_member_2079_district,
        pm.election_area_2079 as parliament_member_2079_constituency,

        -- Proportional veteran: was proportional parliament member in any past election
        case
            when pm.election_type_2074 = 'Proportional' or pm.election_type_2079 = 'Proportional' then true
            else false
        end as is_proportional_veteran,

        -- Nepo: involved in family politics
        coalesce(nf.has_known_relative, false) as has_known_relative,
        coalesce(nf.is_family_source, false) as is_family_source,

        -- Bokuwa: spouse is a PR candidate in same party
        coalesce(bk.is_budi_bokuwa, false) as is_budi_bokuwa,
        coalesce(bk.is_budo_bokuwa, false) as is_budo_bokuwa

    from current_with_qual cc
    left join districts d
        on cc.{{ adapter.quote("DistrictName") }} = d.{{ adapter.quote("name") }}
    left join lateral (
        select *
        from previous_2079_with_qual p
        where p.candidate_name_normalized = cc.candidate_name_normalized
        order by
            -- Prefer same constituency match
            case when p.{{ adapter.quote("SCConstID") }} = cc.{{ adapter.quote("SCConstID") }}
                  and p.{{ adapter.quote("DistrictCd") }} = d.{{ adapter.quote("id") }} then 0 else 1 end
        limit 1
    ) pr on true
    left join lateral (
        select *
        from previous_2074 p
        where p.candidate_name_normalized = cc.candidate_name_normalized
        order by
            -- Prefer same constituency match
            case when p.{{ adapter.quote("SCConstID") }} = cc.{{ adapter.quote("SCConstID") }}
                  and p.{{ adapter.quote("State") }} = cc.{{ adapter.quote("STATE_ID") }} then 0 else 1 end
        limit 1
    ) pr74 on true
    left join parties p
        on cc.{{ adapter.quote("PoliticalPartyName") }} = p.current_party_name
    left join prev_runner_up_2079 ru
        on pr.{{ adapter.quote("State") }} = ru.{{ adapter.quote("State") }}
        and pr.{{ adapter.quote("DistrictCd") }} = ru.{{ adapter.quote("DistrictCd") }}
        and pr.{{ adapter.quote("SCConstID") }} = ru.{{ adapter.quote("SCConstID") }}
    left join prev_runner_up_2074 ru74
        on pr74.{{ adapter.quote("State") }} = ru74.{{ adapter.quote("State") }}
        and pr74.{{ adapter.quote("SCConstID") }} = ru74.{{ adapter.quote("SCConstID") }}
    left join parliament_members pm
        on cc.candidate_name_normalized = pm.name_normalized
    left join nepo_flags nf
        on cc.{{ adapter.quote("CandidateID") }} = nf.{{ adapter.quote("CandidateID") }}
    left join bokuwa_flags bk
        on cc.{{ adapter.quote("CandidateID") }} = bk.{{ adapter.quote("CandidateID") }}
),

with_tags as (
    select
        *,

        -- Chheparo: party switcher (with exceptions for Independent)
        -- Check against 2079 first, then 2074
        case
            when is_same_party_after_merger_check is not null and is_same_party_after_merger_check = false
                and political_party_name != 'स्वतन्त्र'
                and not (prev_election_party = 'स्वतन्त्र' and is_new_party = true)
                then true
            when is_same_party_after_merger_check is null
                and is_same_party_2074_after_merger_check is not null
                and is_same_party_2074_after_merger_check = false
                and political_party_name != 'स्वतन्त्र'
                and not (prev_2074_election_party = 'स्वतन्त्र' and is_new_party = true)
                then true
            else false
        end as is_chheparo,

        -- Vaguwa: changed candidacy location (prefer 2079 comparison)
        case
            when prev_election_district is not null
                and (
                    district_name != prev_election_district
                    or cast(constituency_id as varchar) != cast(prev_election_constituency_id as varchar)
                ) then true
            when prev_election_district is null and prev_2074_election_district is not null
                and (
                    district_name != prev_2074_election_district
                    or cast(constituency_id as varchar) != cast(prev_2074_election_constituency_id as varchar)
                ) then true
            else false
        end as is_vaguwa,

        -- Vaguwa who won from previous constituency (green border variant)
        case
            when prev_election_district is not null
                and (
                    district_name != prev_election_district
                    or cast(constituency_id as varchar) != cast(prev_election_constituency_id as varchar)
                )
                and prev_election_result = 'Winner' then true
            when prev_election_district is null and prev_2074_election_district is not null
                and (
                    district_name != prev_2074_election_district
                    or cast(constituency_id as varchar) != cast(prev_2074_election_constituency_id as varchar)
                )
                and prev_2074_election_result = 'Winner' then true
            else false
        end as is_vaguwa_prev_winner,

        -- New candidate: did not contest in any previous election
        case
            when prev_election_votes is null and prev_2074_election_votes is null then true
            else false
        end as is_new_candidate,

        -- Educated: High School (+2) or higher
        case
            when qualification_level in ('2', 'Bachelor', 'Masters', 'PHD') then true
            else false
        end as is_educated,

        -- Uneducated: below High School
        case
            when qualification_level = 'Under SLC' then true
            when qualification_level is null and qualification is not null
                and trim(qualification) != '' then true
            else false
        end as is_uneducated,

        -- Gen-z: age under 30
        case
            when age <= 27 then true
            else false
        end as is_gen_z,

        -- Grandpa: age over 60
        case
            when age >= 60 then true
            else false
        end as is_grandpa,

        -- Influential: won previous election with >20% margin over runner-up
        -- Check 2079 first, fall back to 2074
        case
            when prev_election_result = 'Winner'
                and prev_runner_up_votes is not null
                and prev_election_casted_vote > 0
                and (prev_election_votes - prev_runner_up_votes)::float / prev_election_casted_vote > 0.20 then true
            when prev_election_votes is null
                and prev_2074_election_result = 'Winner'
                and prev_2074_runner_up_votes is not null
                and prev_2074_election_casted_vote > 0
                and (prev_2074_election_votes - prev_2074_runner_up_votes)::float / prev_2074_election_casted_vote > 0.20 then true
            else false
        end as is_influential,

        -- Opportunist: switched from Independent to an existing (non-new) party
        -- Check 2079 first, fall back to 2074
        case
            when prev_election_party = 'स्वतन्त्र'
                and political_party_name != 'स्वतन्त्र'
                and is_new_party = false then true
            when prev_election_party is null
                and prev_2074_election_party = 'स्वतन्त्र'
                and political_party_name != 'स्वतन्त्र'
                and is_new_party = false then true
            else false
        end as is_opportunist,

        -- Split vote candidate: got less than 3% of total votes in last election
        -- Check 2079 first, fall back to 2074
        case
            when prev_election_votes is not null
                and prev_election_casted_vote > 0
                and prev_election_votes::float / prev_election_casted_vote < 0.03 then true
            when prev_election_votes is null
                and prev_2074_election_votes is not null
                and prev_2074_election_casted_vote > 0
                and prev_2074_election_votes::float / prev_2074_election_casted_vote < 0.03 then true
            else false
        end as is_split_vote_candidate,

        -- Loyal: same party AND same constituency across ALL previous elections
        -- Must have contested in both 2074 and 2079
        case
            when prev_election_votes is not null and prev_2074_election_votes is not null
                and is_same_party_after_merger_check = true
                and is_same_party_2074_after_merger_check = true
                and is_same_party_2074_2079 = true
                and prev_election_district = prev_2074_election_district
                and cast(prev_election_constituency_id as varchar) = cast(prev_2074_election_constituency_id as varchar)
                and district_name = prev_election_district
                and cast(constituency_id as varchar) = cast(prev_election_constituency_id as varchar)
                then true
            else false
        end as is_loyal,

        -- Nepo: involved in family politics
        case
            when has_known_relative or is_family_source then true
            else false
        end as is_nepo,

        -- Candidate type classification (prefer 2079 comparison, fallback to 2074)
        case
            -- 2079-based classification
            when is_same_party_after_merger_check is not null
                and is_same_party_after_merger_check = false
                and political_party_name != 'स्वतन्त्र'
                and not (prev_election_party = 'स्वतन्त्र' and is_new_party = true)
                then 'Chheparo'
            when prev_election_district is not null
                and (
                    district_name != prev_election_district
                    or cast(constituency_id as varchar) != cast(prev_election_constituency_id as varchar)
                ) then 'Vaguwa'
            when prev_election_district is not null
                and district_name = prev_election_district
                and cast(constituency_id as varchar) = cast(prev_election_constituency_id as varchar)
                then 'Same Location'
            -- 2074-based classification (only if not in 2079)
            when prev_election_votes is null and is_same_party_2074_after_merger_check is not null
                and is_same_party_2074_after_merger_check = false
                and political_party_name != 'स्वतन्त्र'
                and not (prev_2074_election_party = 'स्वतन्त्र' and is_new_party = true)
                then 'Chheparo'
            when prev_election_votes is null and prev_2074_election_district is not null
                and (
                    district_name != prev_2074_election_district
                    or cast(constituency_id as varchar) != cast(prev_2074_election_constituency_id as varchar)
                ) then 'Vaguwa'
            when prev_election_votes is null and prev_2074_election_district is not null
                and district_name = prev_2074_election_district
                and cast(constituency_id as varchar) = cast(prev_2074_election_constituency_id as varchar)
                then 'Same Location'
            else 'New Candidate'
        end as candidate_type

    from joined
)

select
    *,
    list_filter(
        [
            case when is_tourist_candidate then 'पर्यटक' end,
            case when is_chheparo then 'छेपारो' end,
            case when is_vaguwa and is_vaguwa_prev_winner then 'भगुवा (विजेता)' end,
            case when is_vaguwa and not is_vaguwa_prev_winner then 'भगुवा' end,
            case when is_new_candidate then 'नयाँ अनुहार' end,
            case when is_educated then 'शिक्षित' end,
            case when is_uneducated then 'अशिक्षित' end,
            case when with_tags.is_new_party then 'नयाँ पार्टी' end,
            case when is_gen_z then 'जेन जी' end,
            case when is_grandpa then 'हजुरबा' end,
            case when is_influential then 'प्रभावशाली' end,
            case when is_opportunist then 'अवसरवादी' end,
            case when is_split_vote_candidate then 'भोट कटुवा' end,
            case when is_proportional_veteran then 'समानुपातिक अनुभवी' end,
            case when is_loyal then 'बफादार' end,
            case when is_nepo then 'नातावाद' end,
            case when is_budi_bokuwa then 'बुढी बोकुवा' end,
            case when is_budo_bokuwa then 'बुढो बोकुवा' end
        ],
        x -> x is not null
    ) as tags,
    concat('https://result.election.gov.np/Images/Candidate/', cast(candidate_id as varchar), '.jpg') as candidate_image_url,
    concat('https://result.election.gov.np/CandidateDetail.aspx?id=', cast(candidate_id as varchar)) as candidate_profile_url,
    dp.symbol_url as party_symbol_url,
    dp.party_display_order
from with_tags
left join lateral (
    select *
    from dim_parties p
    where p.current_party_name = political_party_name
       or list_contains(p.previous_names, political_party_name)
       or p.norm_name = regexp_replace(lower(trim(replace(replace(replace(replace(replace(replace(political_party_name, ' ', ''), '-', ''), '(', ''), ')', ''), 'काङ्ग्रेस', 'काँग्रेस'), 'माक्र्सवादी', 'मार्क्सवादी'))), '[ािीुूेैोौ्ंँ़]','','g')
       or list_contains(p.norm_previous_names, regexp_replace(lower(trim(replace(replace(replace(replace(replace(replace(political_party_name, ' ', ''), '-', ''), '(', ''), ')', ''), 'काङ्ग्रेस', 'काँग्रेस'), 'माक्र्सवादी', 'मार्क्सवादी'))), '[ािीुूेैोौ्ंँ़]','','g'))
    order by
        -- Prefer exact current_party_name match over previous_names match, then robust match
        case 
            when p.current_party_name = political_party_name then 0 
            when p.norm_name = regexp_replace(lower(trim(replace(replace(replace(replace(replace(replace(political_party_name, ' ', ''), '-', ''), '(', ''), ')', ''), 'काङ्ग्रेस', 'काँग्रेस'), 'माक्र्सवादी', 'मार्क्सवादी'))), '[ािीुूेैोौ्ंँ़]','','g') then 1
            else 2 
        end
    limit 1
) dp on true
