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

-- Party dimension for merger checking and symbols
parties as (
    select * from {{ ref('dim_parties') }}
),

-- FPTP 2079 results
fptp_2079_raw as (
    select
        {{ adapter.quote("State") }} as state_id,
        {{ adapter.quote("StateName") }} as state_name,
        {{ adapter.quote("DistrictCd") }} as district_cd,
        {{ adapter.quote("DistrictName") }} as district_name,
        {{ adapter.quote("SCConstID") }} as constituency_id,
        {{ adapter.quote("CandidateID") }} as candidate_id,
        {{ adapter.quote("CandidateName") }} as candidate_name,
        {{ adapter.quote("PoliticalPartyName") }} as party_name,
        {{ adapter.quote("SymbolName") }} as symbol_name,
        {{ adapter.quote("TotalVoteReceived") }} as vote_count,
        {{ adapter.quote("Remarks") }} as remarks
    from {{ ref('stg_past_2079_fptp_election_result') }}
),

fptp_2079 as (
    select
        *,
        row_number() over (
            partition by state_id, district_cd, constituency_id 
            order by vote_count desc
        ) as rank
    from fptp_2079_raw
),

-- FPTP 2079 results with URLs
fptp_2079_enriched as (
    select
        f.*,
        c.candidate_profile_url,
        coalesce(c.party_symbol_url, p.symbol_url) as party_symbol_url
    from fptp_2079 f
    left join (
        -- Join on candidate name, district, and constituency for better matching
        -- This helps disambiguate candidates with the same name
        select distinct
            candidate_name,
            district_name,
            constituency_id,
            candidate_profile_url,
            party_symbol_url
        from {{ ref('dim_current_fptp_candidates') }}
    ) c
        on f.candidate_name = c.candidate_name
        and f.district_name = c.district_name
        and cast(f.constituency_id as varchar) = cast(c.constituency_id as varchar)
    left join parties p
        on f.party_name = p.current_party_name
        or list_contains(p.previous_names, f.party_name)
        or p.norm_name = regexp_replace(lower(trim(replace(replace(replace(replace(replace(replace(f.party_name, ' ', ''), '-', ''), '(', ''), ')', ''), 'काङ्ग्रेस', 'काँग्रेस'), 'माक्र्सवादी', 'मार्क्सवादी'))), '[ािीुूेैोौ्ंँ़]','','g')
        or list_contains(p.norm_previous_names, regexp_replace(lower(trim(replace(replace(replace(replace(replace(replace(f.party_name, ' ', ''), '-', ''), '(', ''), ')', ''), 'काङ्ग्रेस', 'काँग्रेस'), 'माक्र्सवादी', 'मार्क्सवादी'))), '[ािीुूेैोौ्ंँ़]','','g'))
),

-- FPTP 2074 results
fptp_2074_raw as (
    select
        {{ adapter.quote("State") }} as state_id,
        {{ adapter.quote("DistrictName") }} as district_name,
        d.district_id,
        {{ adapter.quote("SCConstID") }} as constituency_id,
        {{ adapter.quote("CandidateName") }} as candidate_name,
        {{ adapter.quote("PoliticalPartyName") }} as party_name,
        {{ adapter.quote("SymbolName") }} as symbol_name,
        {{ adapter.quote("TotalVoteReceived") }} as vote_count,
        {{ adapter.quote("Remarks") }} as remarks
    from {{ ref('stg_past_2074_fptp_election_result') }}
    left join districts d
        on {{ adapter.quote("DistrictName") }} = d.district_name
),

fptp_2074 as (
    select
        *,
        row_number() over (
            partition by state_id, district_id, constituency_id
            order by vote_count desc
        ) as rank
    from fptp_2074_raw
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
            'remarks': remarks,
            'candidate_profile_url': candidate_profile_url,
            'party_symbol_url': party_symbol_url
        } order by rank) as fptp_2079_results
    from fptp_2079_enriched
    group by state_id, district_cd, constituency_id
),

-- Aggregate FPTP 2074 results as JSON per constituency
fptp_2074_json as (
    select
        state_id,
        district_id,
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
    group by state_id, district_id, constituency_id
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

-- Get winning parties and margins for each constituency and year
fptp_2079_stats as (
    select
        state_id,
        district_cd,
        constituency_id,
        max(case when rank = 1 then party_name end) as winning_party_2079,
        max(case when rank = 1 then vote_count end) as winner_votes_2079,
        max(case when rank = 2 then vote_count end) as second_votes_2079,
        sum(vote_count) as total_votes_2079
    from fptp_2079
    group by state_id, district_cd, constituency_id
),

fptp_2074_stats as (
    select
        state_id,
        district_id,
        constituency_id,
        max(case when rank = 1 then party_name end) as winning_party_2074,
        max(case when rank = 1 then vote_count end) as winner_votes_2074,
        max(case when rank = 2 then vote_count end) as second_votes_2074,
        sum(vote_count) as total_votes_2074
    from fptp_2074
    group by state_id, district_id, constituency_id
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
        s79.winning_party_2079,
        s74.winning_party_2074,

        -- Margins
        cast(s79.winner_votes_2079 - coalesce(s79.second_votes_2079, 0) as double) / nullif(s79.total_votes_2079, 0) as win_margin_2079,
        cast(s74.winner_votes_2074 - coalesce(s74.second_votes_2074, 0) as double) / nullif(s74.total_votes_2074, 0) as win_margin_2074,

        -- Check if same party won both elections (accounting for mergers)
        case
            when s79.winning_party_2079 is not null and s74.winning_party_2074 is not null
                and (
                    s79.winning_party_2079 = s74.winning_party_2074
                    or (
                        p.party_id is not null
                        and list_contains(p.previous_names, s74.winning_party_2074)
                    )
                )
                then true
            else false
        end as is_gadh,

        -- Store the gadh party name
        case
            when s79.winning_party_2079 is not null and s74.winning_party_2074 is not null
                and (
                    s79.winning_party_2079 = s74.winning_party_2074
                    or (
                        p.party_id is not null
                        and list_contains(p.previous_names, s74.winning_party_2074)
                    )
                )
                then s79.winning_party_2079
            else null
        end as gadh_party_name,

        -- Swing State: Different parties won (given both years have results)
        case 
            when s79.winning_party_2079 is not null and s74.winning_party_2074 is not null 
                and not (
                    s79.winning_party_2079 = s74.winning_party_2074
                    or (
                        p.party_id is not null
                        and list_contains(p.previous_names, s74.winning_party_2074)
                    )
                )
                then true
            else false
        end as is_swing_state,

        -- Pakad: Margin > 15% in either election (same winning party as 2079)
        case
            when (cast(s79.winner_votes_2079 - coalesce(s79.second_votes_2079, 0) as double) / nullif(s79.total_votes_2079, 0)) > 0.15
                or (cast(s74.winner_votes_2074 - coalesce(s74.second_votes_2074, 0) as double) / nullif(s74.total_votes_2074, 0)) > 0.15
                then true
            else false
        end as is_pakad,

        p.symbol_url as winning_party_symbol_url

    from unique_constituencies uc
    left join fptp_2079_json f79
        on uc.constituency_id = f79.constituency_id
        and uc.state_id = f79.state_id
        and uc.district_id = f79.district_cd
    left join fptp_2074_json f74
        on uc.constituency_id = f74.constituency_id
        and uc.state_id = f74.state_id
        and uc.district_id = f74.district_id
    left join proportional_2079_json p79
        on uc.constituency_id = p79.constituency_id
        and uc.district_id = p79.district_id
        and uc.state_id = p79.state_id
    left join fptp_2079_stats s79
        on uc.constituency_id = s79.constituency_id
        and uc.state_id = s79.state_id
        and uc.district_id = s79.district_cd
    left join fptp_2074_stats s74
        on uc.constituency_id = s74.constituency_id
        and uc.state_id = s74.state_id
        and uc.district_id = s74.district_id
    left join parties p
        on s79.winning_party_2079 = p.current_party_name
        or list_contains(p.previous_names, s79.winning_party_2079)
        or p.norm_name = regexp_replace(lower(trim(replace(replace(replace(replace(replace(replace(s79.winning_party_2079, ' ', ''), '-', ''), '(', ''), ')', ''), 'काङ्ग्रेस', 'काँग्रेस'), 'माक्र्सवादी', 'मार्क्सवादी'))), '[ािीुूेैोौ्ंँ़]','','g')
        or list_contains(p.norm_previous_names, regexp_replace(lower(trim(replace(replace(replace(replace(replace(replace(s79.winning_party_2079, ' ', ''), '-', ''), '(', ''), ')', ''), 'काङ्ग्रेस', 'काँग्रेस'), 'माक्र्सवादी', 'मार्क्सवादी'))), '[ािीुूेैोौ्ंँ़]','','g'))
),


with_tags as (
    select
        *,
        
        -- Create tags array
        list_filter(
            [
                case when is_gadh then 'Gadh: ' || gadh_party_name end,
                case when is_swing_state then 'Swing State' end,
                case when is_pakad then 'Pakad: ' || winning_party_2079 end
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
    winning_party_symbol_url,

    -- Margins
    win_margin_2079,
    win_margin_2074,
    
    -- Flags
    is_gadh,
    gadh_party_name,
    is_swing_state,
    is_pakad,
    
    -- Tags
    tags
    
from with_tags
order by state_id, district_id, constituency_id
