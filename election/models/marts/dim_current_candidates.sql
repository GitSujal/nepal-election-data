{{ config(materialized='table') }}

with current as (
    select * from {{ ref('stg_current_fptp_candidates') }}
),

previous as (
    select * from {{ ref('stg_past_fptp_election_result') }}
),

districts as (
    select * from {{ ref('stg_districts') }}
),

parties as (
    select * from {{ ref('dim_parties') }}
),

qualification_levels as (
    select
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

-- Map previous candidate's qualification to a level
previous_with_qual as (
    select
        pr.*,
        ql.qualification_level as prev_qualification_level
    from previous pr
    left join qualification_levels ql
        on pr.{{ adapter.quote("QUALIFICATION") }} = ql.qualification_raw
),

-- Check if the current party was a result of merger/rename of the previous party
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

        -- Previous election performance
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
        pr.{{ adapter.quote("CastedVote") }} as prev_election_casted_vote,
        pr.{{ adapter.quote("TotalVoters") }} as prev_election_total_voters,

        -- Previous qualification
        pr.{{ adapter.quote("QUALIFICATION") }} as prev_qualification,
        pr.prev_qualification_level,

        -- Check if current party is a merger/rename of previous party
        case
            when pr.{{ adapter.quote("PoliticalPartyName") }} is null then null
            when cc.{{ adapter.quote("PoliticalPartyName") }} = pr.{{ adapter.quote("PoliticalPartyName") }} then true
            when p.party_id is not null
                and list_contains(p.previous_names, pr.{{ adapter.quote("PoliticalPartyName") }}) then true
            else false
        end as is_same_party_after_merger_check,

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
        end as is_education_changed

    from current_with_qual cc
    left join districts d
        on cc.{{ adapter.quote("DistrictName") }} = d.{{ adapter.quote("name") }}
    left join previous_with_qual pr
        on cc.{{ adapter.quote("CandidateName") }} = pr.{{ adapter.quote("CandidateName") }}
    left join parties p
        on cc.{{ adapter.quote("PoliticalPartyName") }} = p.current_party_name
)

select
    *,

    -- Chheparo: party is genuinely different (not just merger/rename)
    case
        when is_same_party_after_merger_check is not null
            and is_same_party_after_merger_check = false then true
        else false
    end as is_chheparo,

    -- Vaguwa: previous candidacy was from a different district/constituency
    case
        when prev_election_district is not null
            and (
                district_name != prev_election_district
                or cast(constituency_id as varchar) != cast(prev_election_constituency_id as varchar)
            ) then true
        else false
    end as is_vaguwa,

    -- Candidate type classification
    case
        when is_same_party_after_merger_check is not null
            and is_same_party_after_merger_check = false then 'Chheparo'
        when prev_election_district is not null
            and (
                district_name != prev_election_district
                or cast(constituency_id as varchar) != cast(prev_election_constituency_id as varchar)
            ) then 'Vaguwa'
        when prev_election_district is not null
            and district_name = prev_election_district
            and cast(constituency_id as varchar) = cast(prev_election_constituency_id as varchar)
            then 'Same Location'
        else 'New Candidate'
    end as candidate_type

from joined
