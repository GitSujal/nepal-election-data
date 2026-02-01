{{ config(materialized='table') }}

with current as (
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
    select
        {{ adapter.quote("QUALIFICATION") }} as qualification_raw,
        {{ adapter.quote("Category") }} as qualification_level
    from {{ ref('qualification_level_mapping') }}
    where {{ adapter.quote("QUALIFICATION") }} is not null
      and trim({{ adapter.quote("QUALIFICATION") }}) != ''
),

-- Map 2079 candidate's qualification to a level
current_with_qual as (
    select
        cc.*,
        ql.qualification_level as current_qualification_level
    from current cc
    left join qualification_levels ql
        on cc.{{ adapter.quote("QUALIFICATION") }} = ql.qualification_raw
),

-- Rank candidates per constituency by votes for 2079 (this election)
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
    from current
),

-- Get runner-up votes and computed casted_vote per constituency for 2079
runner_up_2079 as (
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
        from current
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

joined as (
    select
        cc.{{ adapter.quote("CandidateID") }} as candidate_id,
        cc.{{ adapter.quote("CandidateName") }} as candidate_name,
        cc.{{ adapter.quote("Gender") }} as gender,
        cc.{{ adapter.quote("Age") }} as age,
        case
            when cc.{{ adapter.quote("Age") }} < 30 then 'Below 30'
            when cc.{{ adapter.quote("Age") }} between 30 and 49 then '30-50'
            when cc.{{ adapter.quote("Age") }} between 50 and 59 then '50-60'
            else '60+'
        end as age_group,
        cc.{{ adapter.quote("DOB") }} as date_of_birth,
        cc.{{ adapter.quote("FATHER_NAME") }} as father_name,
        cc.{{ adapter.quote("SPOUCE_NAME") }} as spouse_name,
        cc.{{ adapter.quote("QUALIFICATION") }} as qualification,
        cc.current_qualification_level as qualification_level,
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

        -- Political affiliation
        cc.{{ adapter.quote("PartyID") }} as party_id,
        cc.{{ adapter.quote("SymbolID") }} as symbol_id,
        cc.{{ adapter.quote("SymbolName") }} as symbol_name,
        cc.{{ adapter.quote("PoliticalPartyName") }} as political_party_name,
        cc.{{ adapter.quote("ElectionPost") }} as election_post,

        -- Geography
        cc.{{ adapter.quote("State") }} as state_id,
        cc.{{ adapter.quote("StateName") }} as state_name,
        d.{{ adapter.quote("id") }} as district_id,
        cc.{{ adapter.quote("DistrictName") }} as district_name,
        cc.{{ adapter.quote("DistrictCd") }} as district_cd,
        cc.{{ adapter.quote("SCConstID") }} as constituency_id,
        cc.{{ adapter.quote("CenterConstID") }} as center_constituency_id,
        cc.{{ adapter.quote("CTZDIST") }} as citizenship_district,

        -- Election results (2079 — this election)
        cc.{{ adapter.quote("SerialNo") }} as serial_no,
        cc.{{ adapter.quote("TotalVoteReceived") }} as total_votes_received,
        ru.casted_vote,
        cc.{{ adapter.quote("TotalVoters") }} as total_voters,
        cc.{{ adapter.quote("Rank") }} as rank_position,
        cc.{{ adapter.quote("Remarks") }} as remarks,
        case
            when cc.{{ adapter.quote("Remarks") }} = 'Elected' then 'Winner'
            when cc.{{ adapter.quote("TotalVoteReceived") }} is not null then 'Loser'
            else null
        end as election_result,
        cc.{{ adapter.quote("Samudaya") }} as samudaya,

        -- Runner-up votes for this election (influential in this election)
        ru.runner_up_votes,

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

        -- Elections contested count (only 2074 is previous)
        case
            when pr74.{{ adapter.quote("TotalVoteReceived") }} is not null then 1
            else 0
        end as elections_contested,

        -- Party info
        p.previous_names as party_previous_names,

        -- Check if 2079 party is same as 2074 party (after merger check)
        case
            when pr74.{{ adapter.quote("PoliticalPartyName") }} is null then null
            when cc.{{ adapter.quote("PoliticalPartyName") }} = pr74.{{ adapter.quote("PoliticalPartyName") }} then true
            when p.party_id is not null
                and list_contains(p.previous_names, pr74.{{ adapter.quote("PoliticalPartyName") }}) then true
            else false
        end as is_same_party_2074_after_merger_check,

        -- Tourist candidate: citizenship district differs from candidacy district
        case
            when cc.{{ adapter.quote("CTZDIST") }} != cc.{{ adapter.quote("DistrictName") }} then true
            else false
        end as is_tourist_candidate,

        -- Is new party: party has no previous names (formed after 2074 election)
        case
            when p.party_id is not null and len(p.previous_names) = 0 then true
            else false
        end as is_new_party,

        -- Parliament member details for 2074
        coalesce(pm.was_member_2074, false) as was_parliament_member_2074,
        pm.election_type_2074 as parliament_member_2074_election_type,
        pm.party_2074_np as parliament_member_2074_party,
        pm.district_2074_np as parliament_member_2074_district,
        pm.election_area_2074 as parliament_member_2074_constituency,

        -- Parliament member details for 2079 (this election's term)
        coalesce(pm.was_member_2079, false) as was_parliament_member_2079,
        pm.election_type_2079 as parliament_member_2079_election_type,
        pm.party_2079_np as parliament_member_2079_party,
        pm.district_2079_np as parliament_member_2079_district,
        pm.election_area_2079 as parliament_member_2079_constituency,

        -- Proportional veteran: was proportional parliament member in 2074
        case
            when pm.election_type_2074 = 'Proportional' then true
            else false
        end as is_proportional_veteran

    from current_with_qual cc
    left join districts d
        on cc.{{ adapter.quote("DistrictName") }} = d.{{ adapter.quote("name") }}
    left join previous_2074 pr74
        on cc.{{ adapter.quote("CandidateName") }} = pr74.{{ adapter.quote("CandidateName") }}
    left join parties p
        on cc.{{ adapter.quote("PoliticalPartyName") }} = p.current_party_name
    left join runner_up_2079 ru
        on cc.{{ adapter.quote("State") }} = ru.{{ adapter.quote("State") }}
        and cc.{{ adapter.quote("DistrictCd") }} = ru.{{ adapter.quote("DistrictCd") }}
        and cc.{{ adapter.quote("SCConstID") }} = ru.{{ adapter.quote("SCConstID") }}
    left join prev_runner_up_2074 ru74
        on pr74.{{ adapter.quote("State") }} = ru74.{{ adapter.quote("State") }}
        and pr74.{{ adapter.quote("SCConstID") }} = ru74.{{ adapter.quote("SCConstID") }}
    left join parliament_members pm
        on cc.{{ adapter.quote("CandidateName") }} = pm.name_np
),

with_tags as (
    select
        *,

        -- Chheparo: party switcher compared to 2074
        case
            when is_same_party_2074_after_merger_check is not null
                and is_same_party_2074_after_merger_check = false
                and political_party_name != 'स्वतन्त्र'
                and not (prev_2074_election_party = 'स्वतन्त्र' and is_new_party = true)
                then true
            else false
        end as is_chheparo,

        -- Vaguwa: changed candidacy location compared to 2074
        case
            when prev_2074_election_district is not null
                and (
                    district_name != prev_2074_election_district
                    or cast(constituency_id as varchar) != cast(prev_2074_election_constituency_id as varchar)
                ) then true
            else false
        end as is_vaguwa,

        -- Vaguwa who won from previous constituency (green border variant)
        case
            when prev_2074_election_district is not null
                and (
                    district_name != prev_2074_election_district
                    or cast(constituency_id as varchar) != cast(prev_2074_election_constituency_id as varchar)
                )
                and prev_2074_election_result = 'Winner' then true
            else false
        end as is_vaguwa_prev_winner,

        -- New candidate: did not contest in 2074
        case
            when prev_2074_election_votes is null then true
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
            when age < 30 then true
            else false
        end as is_gen_z,

        -- Grandpa: age over 60
        case
            when age > 60 then true
            else false
        end as is_grandpa,

        -- Influential: won this (2079) election with >20% margin over runner-up
        case
            when election_result = 'Winner'
                and runner_up_votes is not null
                and casted_vote > 0
                and (total_votes_received - runner_up_votes)::float / casted_vote > 0.20 then true
            else false
        end as is_influential,

        -- Opportunist: switched from Independent in 2074 to a non-new party in 2079
        case
            when prev_2074_election_party = 'स्वतन्त्र'
                and political_party_name != 'स्वतन्त्र'
                and is_new_party = false then true
            else false
        end as is_opportunist,

        -- Split vote candidate: got less than 3% of total votes in 2074
        case
            when prev_2074_election_votes is not null
                and prev_2074_election_casted_vote > 0
                and prev_2074_election_votes::float / prev_2074_election_casted_vote < 0.03 then true
            else false
        end as is_split_vote_candidate,

        -- Loyal: same party AND same constituency between 2074 and 2079
        -- (only one previous election, so loyal = same party + same location in 2074)
        case
            when prev_2074_election_votes is not null
                and is_same_party_2074_after_merger_check = true
                and district_name = prev_2074_election_district
                and cast(constituency_id as varchar) = cast(prev_2074_election_constituency_id as varchar)
                then true
            else false
        end as is_loyal,

        -- Candidate type classification based on 2074
        case
            when is_same_party_2074_after_merger_check is not null
                and is_same_party_2074_after_merger_check = false
                and political_party_name != 'स्वतन्त्र'
                and not (prev_2074_election_party = 'स्वतन्त्र' and is_new_party = true)
                then 'Chheparo'
            when prev_2074_election_district is not null
                and (
                    district_name != prev_2074_election_district
                    or cast(constituency_id as varchar) != cast(prev_2074_election_constituency_id as varchar)
                ) then 'Vaguwa'
            when prev_2074_election_district is not null
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
            case when is_tourist_candidate then 'Tourist' end,
            case when is_chheparo then 'Chheparo' end,
            case when is_vaguwa and is_vaguwa_prev_winner then 'Vaguwa (Won Prev)' end,
            case when is_vaguwa and not is_vaguwa_prev_winner then 'Vaguwa' end,
            case when is_new_candidate then 'New Candidate' end,
            case when is_educated then 'Educated' end,
            case when is_uneducated then 'Uneducated' end,
            case when is_new_party then 'New Party' end,
            case when is_gen_z then 'Gen-z' end,
            case when is_grandpa then 'Grandpa' end,
            case when is_influential then 'Influential' end,
            case when is_opportunist then 'Opportunist' end,
            case when is_split_vote_candidate then 'Split Vote' end,
            case when is_proportional_veteran then 'Proportional Veteran' end,
            case when is_loyal then 'Loyal' end
        ],
        x -> x is not null
    ) as tags
from with_tags
