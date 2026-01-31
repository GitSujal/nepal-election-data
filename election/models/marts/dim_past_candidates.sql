{{ config(materialized='table') }}

with previous as (
    select * from {{ ref('stg_past_fptp_election_result') }}
),

districts as (
    select * from {{ ref('stg_districts') }}
),

qualification_levels as (
    select
        {{ adapter.quote("QUALIFICATION") }} as qualification_raw,
        {{ adapter.quote("Category") }} as qualification_level
    from {{ ref('qualification_level_mapping') }}
    where {{ adapter.quote("QUALIFICATION") }} is not null
      and trim({{ adapter.quote("QUALIFICATION") }}) != ''
)

select
    pr.{{ adapter.quote("CandidateID") }} as candidate_id,
    pr.{{ adapter.quote("CandidateName") }} as candidate_name,
    pr.{{ adapter.quote("Gender") }} as gender,
    pr.{{ adapter.quote("Age") }} as age,
    case
        when pr.{{ adapter.quote("Age") }} < 30 then 'Below 30'
        when pr.{{ adapter.quote("Age") }} between 30 and 49 then '30-50'
        when pr.{{ adapter.quote("Age") }} between 50 and 59 then '50-60'
        else '60+'
    end as age_group,
    pr.{{ adapter.quote("DOB") }} as date_of_birth,
    pr.{{ adapter.quote("FATHER_NAME") }} as father_name,
    pr.{{ adapter.quote("SPOUCE_NAME") }} as spouse_name,
    pr.{{ adapter.quote("QUALIFICATION") }} as qualification,
    ql.qualification_level,
    pr.{{ adapter.quote("NAMEOFINST") }} as institution_name,
    pr.{{ adapter.quote("ADDRESS") }} as address,
    pr.{{ adapter.quote("EXPERIENCE") }} as experience,
    pr.{{ adapter.quote("OTHERDETAILS") }} as other_details,

    -- Political affiliation
    pr.{{ adapter.quote("PartyID") }} as party_id,
    pr.{{ adapter.quote("SymbolID") }} as symbol_id,
    pr.{{ adapter.quote("SymbolName") }} as symbol_name,
    pr.{{ adapter.quote("PoliticalPartyName") }} as political_party_name,
    pr.{{ adapter.quote("ElectionPost") }} as election_post,

    -- Geography
    pr.{{ adapter.quote("State") }} as state_id,
    pr.{{ adapter.quote("StateName") }} as state_name,
    d.{{ adapter.quote("id") }} as district_id,
    pr.{{ adapter.quote("DistrictName") }} as district_name,
    pr.{{ adapter.quote("DistrictCd") }} as district_cd,
    pr.{{ adapter.quote("SCConstID") }} as constituency_id,
    pr.{{ adapter.quote("CenterConstID") }} as center_constituency_id,
    pr.{{ adapter.quote("CTZDIST") }} as citizenship_district,

    -- Tourist candidate flag
    case
        when pr.{{ adapter.quote("CTZDIST") }} != pr.{{ adapter.quote("DistrictName") }} then true
        else false
    end as is_tourist_candidate,

    -- Election results
    pr.{{ adapter.quote("SerialNo") }} as serial_no,
    pr.{{ adapter.quote("TotalVoteReceived") }} as total_votes_received,
    pr.{{ adapter.quote("CastedVote") }} as casted_vote,
    pr.{{ adapter.quote("TotalVoters") }} as total_voters,
    pr.{{ adapter.quote("Rank") }} as rank_position,
    pr.{{ adapter.quote("Remarks") }} as remarks,
    case
        when pr.{{ adapter.quote("Remarks") }} = 'Elected' then 'Winner'
        when pr.{{ adapter.quote("TotalVoteReceived") }} is not null then 'Loser'
        else null
    end as election_result,
    pr.{{ adapter.quote("Samudaya") }} as samudaya

from previous pr
left join districts d
    on pr.{{ adapter.quote("DistrictName") }} = d.{{ adapter.quote("name") }}
left join qualification_levels ql
    on pr.{{ adapter.quote("QUALIFICATION") }} = ql.qualification_raw
