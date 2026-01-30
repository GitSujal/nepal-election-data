{{ config(materialized='table') }}

select
    -- Primary identifiers
    cc.CandidateID as candidate_id,
    cc.CandidateName as candidate_name,
    
    -- Demographics
    cc.Gender as gender,
    cc.AGE_YR as age,
    cc.DOB as date_of_birth,
    cc.FATHER_NAME as father_name,
    cc.SPOUCE_NAME as spouse_name,
    cc.QUALIFICATION as qualification,
    cc.NAMEOFINST as institution_name,
    cc.ADDRESS as address,
    
    -- Political affiliation
    cc.SYMBOLCODE as symbol_code,
    cc.SymbolName as symbol_name,
    cc.PoliticalPartyName as political_party_name,
    
    -- Geographic information
    cc.STATE_ID as state_id,
    cc.StateName as state_name,
    d.id as district_id,
    cc.DistrictName as district_name,
    cc.SCConstID as constituency_id,
    cc.ConstName as constituency_name,
    cc.CTZDIST as citizenship_district,
    
    -- Tourist candidate flag
    case
        when cc.CTZDIST != cc.DistrictName then true
        else false
    end as is_tourist_candidate,
    
    -- Party switcher flag
    case
        when pr.PoliticalPartyName is not null 
            and cc.PoliticalPartyName != pr.PoliticalPartyName then true
        else false
    end as is_party_switcher,
    
    -- Candidate type categorization
    case
        -- Party switcher (Chheparo)
        when pr.PoliticalPartyName is not null 
            and cc.PoliticalPartyName != pr.PoliticalPartyName then 'Chheparo'
        -- Location changed (Vaguwa)
        when pr.State is not null
            and (
                cast(cc.STATE_ID as varchar) != cast(pr.State as varchar)
                or cc.DistrictName != pr.DistrictName
                or cast(cc.SCConstID as varchar) != cast(pr.SCConstID as varchar)
            ) then 'Vaguwa'
        -- Same location
        when pr.State is not null
            and cast(cc.STATE_ID as varchar) = cast(pr.State as varchar)
            and cc.DistrictName = pr.DistrictName
            and cast(cc.SCConstID as varchar) = cast(pr.SCConstID as varchar)
            then 'Same Location'
        -- New candidate
        else 'New Candidate'
    end as candidate_type,
    
    -- Previous election performance
    pr.TotalVoteReceived as last_election_vote_count,
    case
        when pr.Remarks = 'Elected' then 'Winner'
        when pr.Remarks is null and pr.TotalVoteReceived is not null then 'Loser'
        else null
    end as last_election_result,
    pr.State as last_election_state,
    pr.DistrictName as last_election_district,
    pr.SCConstID as last_election_constituency,
    pr.PoliticalPartyName as last_election_party,
    
    -- Additional fields
    cc.EXPERIENCE as experience,
    cc.OTHERDETAILS as other_details,
    cc.E_STATUS as election_status,
    cc.TotalVoteReceived as current_vote_received,
    cc.R as rank_position

from {{ ref('stg_current_candidates') }} cc
left join {{ ref('stg_districts') }} d
    on cc.DistrictName = d.name
left join {{ ref('stg_pratakhya_election_result') }} pr
    on cc.CandidateName = pr.CandidateName
