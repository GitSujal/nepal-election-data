{{ config(materialized='table') }}

with states as (
    select
        {{ adapter.quote("id") }} as state_id,
        {{ adapter.quote("name") }} as state_name
    from {{ source('raw', 'states') }}
),

districts as (
    select
        {{ adapter.quote("id") }} as district_id,
        {{ adapter.quote("name") }} as district_name,
        {{ adapter.quote("parentId") }} as state_id
    from {{ ref('stg_districts') }}
),

-- FPTP 2079 results
fptp_2079 as (
    select
        {{ adapter.quote("State") }} as state_id,
        {{ adapter.quote("StateName") }} as state_name,
        {{ adapter.quote("DistrictCd") }} as district_cd,
        {{ adapter.quote("DistrictName") }} as district_name,
        {{ adapter.quote("SCConstID") }} as constituency_id,
        {{ adapter.quote("CandidateName") }} as candidate_name,
        {{ adapter.quote("PoliticalPartyName") }} as party_name,
        {{ adapter.quote("SymbolName") }} as symbol_name,
        {{ adapter.quote("TotalVoteReceived") }} as vote_count,
        {{ adapter.quote("Rank") }} as rank,
        {{ adapter.quote("Remarks") }} as remarks
    from {{ ref('stg_past_2079_fptp_election_result') }}
),

-- FPTP 2074 results
fptp_2074 as (
    select
        {{ adapter.quote("State") }} as state_id,
        {{ adapter.quote("DistrictName") }} as district_name,
        {{ adapter.quote("SCConstID") }} as constituency_id,
        {{ adapter.quote("CandidateName") }} as candidate_name,
        {{ adapter.quote("PoliticalPartyName") }} as party_name,
        {{ adapter.quote("SymbolName") }} as symbol_name,
        {{ adapter.quote("TotalVoteReceived") }} as vote_count,
        {{ adapter.quote("Rank") }} as rank,
        {{ adapter.quote("Remarks") }} as remarks
    from {{ ref('stg_past_2074_fptp_election_result') }}
),

-- Get unique constituencies from FPTP results
unique_constituencies as (
    select distinct
        state_id,
        state_name,
        district_cd as district_id,
        district_name,
        constituency_id
    from fptp_2079
),

-- Proportional 2079 results (constituency level)
proportional_2079 as (
    select
        state_id,
        district_id,
        constituency_id,
        political_party_name as party_name,
        total_vote_received as vote_count,
        -- Rank parties by votes within each constituency
        row_number() over (
            partition by state_id, district_id, constituency_id 
            order by total_vote_received desc
        ) as rank
    from {{ ref('stg_past_2079_proportional_election_result') }}
),

-- Aggregate FPTP 2079 results as JSON per constituency
fptp_2079_json as (
    select
        state_id,
        district_cd,
        constituency_id,
        list({
            'candidate_name': candidate_name,
            'party_name': party_name,
            'symbol_name': symbol_name,
            'vote_count': vote_count,
            'rank': rank,
            'remarks': remarks
        } order by rank) as fptp_2079_results
    from fptp_2079
    group by state_id, district_cd, constituency_id
),

-- Aggregate FPTP 2074 results as JSON per constituency
fptp_2074_json as (
    select
        state_id,
        constituency_id,
        list({
            'candidate_name': candidate_name,
            'party_name': party_name,
            'symbol_name': symbol_name,
            'vote_count': vote_count,
            'rank': rank,
            'remarks': remarks
        } order by rank) as fptp_2074_results
    from fptp_2074
    group by state_id, constituency_id
),

-- Aggregate Proportional 2079 results as JSON per constituency
proportional_2079_json as (
    select
        state_id,
        district_id,
        constituency_id,
        list({
            'party_name': party_name,
            'vote_count': vote_count,
            'rank': rank
        } order by rank) as proportional_2079_results
    from proportional_2079
    group by state_id, district_id, constituency_id
),

-- Get winning parties for each constituency and year
fptp_2079_winners as (
    select
        state_id,
        district_cd,
        constituency_id,
        party_name as winning_party_2079
    from fptp_2079
    where rank = 1
),

fptp_2074_winners as (
    select
        state_id,
        constituency_id,
        party_name as winning_party_2074
    from fptp_2074
    where rank = 1
),

-- Party dimension for merger checking
parties as (
    select * from {{ ref('dim_parties') }}
),

-- Join all data together
joined as (
    select
        uc.state_id,
        uc.state_name,
        uc.district_id,
        uc.district_name,
        uc.constituency_id,
        -- For constituency name, we'll construct it from district name + constituency number
        uc.district_name || '-' || uc.constituency_id as constituency_name,

        -- FPTP 2079 results
        f79.fptp_2079_results,
        
        -- FPTP 2074 results
        f74.fptp_2074_results,
        
        -- Proportional 2079 results
        p79.proportional_2079_results,

        -- Winning parties
        w79.winning_party_2079,
        w74.winning_party_2074,

        -- Check if same party won both elections (accounting for mergers)
        case
            when w79.winning_party_2079 is not null and w74.winning_party_2074 is not null
                and (
                    w79.winning_party_2079 = w74.winning_party_2074
                    or (
                        p.party_id is not null
                        and list_contains(p.previous_names, w74.winning_party_2074)
                    )
                )
                then true
            else false
        end as is_gadh,

        -- Store the gadh party name
        case
            when w79.winning_party_2079 is not null and w74.winning_party_2074 is not null
                and (
                    w79.winning_party_2079 = w74.winning_party_2074
                    or (
                        p.party_id is not null
                        and list_contains(p.previous_names, w74.winning_party_2074)
                    )
                )
                then w79.winning_party_2079
            else null
        end as gadh_party_name

    from unique_constituencies uc
    left join fptp_2079_json f79
        on uc.constituency_id = f79.constituency_id
        and uc.state_id = f79.state_id
        and uc.district_id = f79.district_cd
    left join fptp_2074_json f74
        on uc.constituency_id = f74.constituency_id
        and uc.state_id = f74.state_id
    left join proportional_2079_json p79
        on uc.constituency_id = p79.constituency_id
        and uc.district_id = p79.district_id
        and uc.state_id = p79.state_id
    left join fptp_2079_winners w79
        on uc.constituency_id = w79.constituency_id
        and uc.state_id = w79.state_id
        and uc.district_id = w79.district_cd
    left join fptp_2074_winners w74
        on uc.constituency_id = w74.constituency_id
        and uc.state_id = w74.state_id
    left join parties p
        on w79.winning_party_2079 = p.current_party_name
),

with_tags as (
    select
        *,
        
        -- Create tags array
        list_filter(
            [
                case 
                    when is_gadh then 'Gadh: ' || gadh_party_name 
                    end
            ],
            x -> x is not null
        ) as tags

    from joined
)

select
    state_id,
    state_name,
    district_id,
    district_name,
    constituency_id,
    constituency_name,
    
    -- Election results as JSON
    fptp_2079_results,
    fptp_2074_results,
    proportional_2079_results,
    
    -- Winning parties
    winning_party_2079,
    winning_party_2074,
    
    -- Flags
    is_gadh,
    gadh_party_name,
    
    -- Tags
    tags
    
from with_tags
order by state_id, district_id, constituency_id
