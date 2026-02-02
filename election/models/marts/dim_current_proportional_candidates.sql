{{ config(materialized='table') }}

with current as (
    select * from {{ ref('stg_current_proportional_candidates') }}
),

previous_2079 as (
    select * from {{ ref('stg_past_2079_proportional_election_result') }}
),

previous_2074 as (
    select * from {{ ref('stg_past_2074_proportional_election_result') }}
),

parties as (
    select * from {{ ref('dim_parties') }}
),

parliament_members as (
    select * from {{ ref('dim_parliament_members') }}
),

proportional_mapping as (
    select
        {{ adapter.quote("proportional_party_name") }} as proportional_party_name,
        {{ adapter.quote("mapped_party_name") }} as mapped_party_name
    from {{ ref('proportional_to_fptp_party_name_mapping') }}
    where {{ adapter.quote("mapped_party_name") }} is not null
      and trim({{ adapter.quote("mapped_party_name") }}) != ''
),

fptp_2079_losers as (
    select distinct
        candidate_name_normalized
    from {{ ref('stg_past_2079_fptp_election_result') }}
    where ({{ adapter.quote("Remarks") }} != 'Elected' or {{ adapter.quote("Remarks") }} is null)
),

fptp_2074_losers as (
    select distinct
        candidate_name_normalized
    from {{ ref('stg_past_2074_fptp_election_result') }}
    where ({{ adapter.quote("Remarks") }} != 'Elected' or {{ adapter.quote("Remarks") }} is null)
),

pr_stats as (
    select
        name_normalized,
        times_elected,
        len(list_filter(election_types, x -> x = 'Proportional')) as pr_times_elected,
        election_type_2079
    from {{ ref('dim_parliament_members') }}
),

-- Aggregate 2079 proportional results by party for comparison
prev_2079_party_summary as (
    select
        political_party_name,
        sum(total_vote_received) as total_votes,
        count(distinct district_id) as districts_contested,
        count(distinct state_id) as states_contested
    from previous_2079
    group by political_party_name
),

-- Get 2074 proportional results (already at party level)
prev_2074_party_summary as (
    select
        {{ adapter.quote("PoliticalPartyName") }} as political_party_name,
        {{ adapter.quote("TotalVoteReceived") }} as total_votes,
        {{ adapter.quote("Rank") }} as party_rank
    from previous_2074
),

current_normalized as (
    select
        cc.*,
        cc.candidate_name_normalized
    from current cc
),

joined as (
    select
        cc.serial_no,
        cc.full_name as candidate_name,
        cc.voter_id_number,
        cc.gender,
        cc.inclusive_group,
        cc.citizenship_district,
        cc.backward_area,
        cc.disability,
        cc.associated_party,
        cc.remarks,

        -- Current political affiliation
        cc.political_party_name,

        -- Rank is CRITICAL for proportional candidates
        cast(cc.serial_no as integer) as rank_position,

        -- Party matching logic: direct match, then seed mapping, then associated_party
        coalesce(p_direct.party_id, p_mapped.party_id, p_assoc.party_id) as party_id,
        coalesce(p_direct.current_party_name, p_mapped.current_party_name, p_assoc.current_party_name) as matched_party_name,
        coalesce(p_direct.previous_names, p_mapped.previous_names, p_assoc.previous_names) as party_previous_names,
        coalesce(p_direct.party_display_order, p_mapped.party_display_order, p_assoc.party_display_order) as party_display_order,

        -- Previous 2079 party performance
        pr79.total_votes as prev_2079_party_votes,
        pr79.districts_contested as prev_2079_districts_contested,
        pr79.states_contested as prev_2079_states_contested,

        -- Previous 2074 party performance
        pr74.total_votes as prev_2074_party_votes,
        pr74.party_rank as prev_2074_party_rank,

        -- Check if party existed in previous elections
        case
            when pr79.political_party_name is not null then true
            else false
        end as party_existed_2079,

        case
            when pr74.political_party_name is not null then true
            else false
        end as party_existed_2074,

        -- Elections contested by party
        case
            when pr79.political_party_name is not null and pr74.political_party_name is not null then 2
            when pr79.political_party_name is not null or pr74.political_party_name is not null then 1
            else 0
        end as party_elections_contested,

        -- Is new party: party has no previous names (formed after last election)
        case
            when coalesce(p_direct.party_id, p_mapped.party_id, p_assoc.party_id) is not null 
                then coalesce(p_direct.is_new_party, p_mapped.is_new_party, p_assoc.is_new_party)
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

        -- New Stats for Varaute and Gati Chhada
        ps.times_elected,
        ps.pr_times_elected,
        ps.election_type_2079 as parliament_member_2079_election_type_normalized,
        case when lost79.candidate_name_normalized is not null then true else false end as is_fptp_2079_loser,
        case when lost74.candidate_name_normalized is not null then true else false end as is_fptp_2074_loser,

        -- FPTP veteran: was FPTP parliament member in any past election
        case
            when pm.election_type_2074 = 'FPTP' or pm.election_type_2079 = 'FPTP' then true
            else false
        end as is_fptp_veteran,

        -- Proportional veteran: was proportional parliament member in any past election
        case
            when pm.election_type_2074 = 'Proportional' or pm.election_type_2079 = 'Proportional' then true
            else false
        end as is_proportional_veteran,
        
        -- Check if current party is a merger/rename of previous 2079 party
        case
            when pr79.political_party_name is null then null
            when cc.political_party_name = pr79.political_party_name then true
            when coalesce(p_direct.party_id, p_mapped.party_id, p_assoc.party_id) is not null
                and list_contains(coalesce(p_direct.previous_names, p_mapped.previous_names, p_assoc.previous_names), pr79.political_party_name) then true
            else false
        end as is_same_party_2079_after_merger_check,

        -- Check if current party is same as 2074 party (after merger check)
        case
            when pr74.political_party_name is null then null
            when cc.political_party_name = pr74.political_party_name then true
            when coalesce(p_direct.party_id, p_mapped.party_id, p_assoc.party_id) is not null
                and list_contains(coalesce(p_direct.previous_names, p_mapped.previous_names, p_assoc.previous_names), pr74.political_party_name) then true
            else false
        end as is_same_party_2074_after_merger_check

    from current_normalized cc
    -- 1. Direct match on political_party_name
    left join parties p_direct
        on cc.political_party_name = p_direct.current_party_name
    -- 2. Seed mapping: proportional party name → mapped party name → dim_parties
    left join proportional_mapping pm_mapping
        on cc.political_party_name = pm_mapping.proportional_party_name
        and p_direct.party_id is null
    left join parties p_mapped
        on pm_mapping.mapped_party_name = p_mapped.current_party_name
    -- 3. Fallback: associated_party
    left join parties p_assoc
        on cc.associated_party = p_assoc.current_party_name
        and p_direct.party_id is null
        and p_mapped.party_id is null
    -- Join previous election results at party level
    left join prev_2079_party_summary pr79
        on cc.political_party_name = pr79.political_party_name
    left join prev_2074_party_summary pr74
        on cc.political_party_name = pr74.political_party_name
    -- Join parliament members
    left join parliament_members pm
        on cc.candidate_name_normalized = pm.name_normalized
    -- Join new stats and losers
    left join pr_stats ps
        on cc.candidate_name_normalized = ps.name_normalized
    left join fptp_2079_losers lost79
        on cc.candidate_name_normalized = lost79.candidate_name_normalized
    left join fptp_2074_losers lost74
        on cc.candidate_name_normalized = lost74.candidate_name_normalized
),

with_tags as (
    select
        *,

        -- Chheparo: party switcher at the candidate level
        -- For proportional, this means their previous parliament membership was with a different party
        case
            when (was_parliament_member_2079 or was_parliament_member_2074)
                and political_party_name != 'स्वतन्त्र'
                and parliament_member_2079_party is not null
                and political_party_name != parliament_member_2079_party
                and not list_contains(party_previous_names, parliament_member_2079_party)
                then true
            when (was_parliament_member_2079 or was_parliament_member_2074)
                and parliament_member_2079_party is null
                and parliament_member_2074_party is not null
                and political_party_name != parliament_member_2074_party
                and not list_contains(party_previous_names, parliament_member_2074_party)
                then true
            else false
        end as is_chheparo,

        -- New candidate: did not serve as parliament member in previous elections
        case
            when not was_parliament_member_2079 and not was_parliament_member_2074 then true
            else false
        end as is_new_candidate,

        -- Party loyal: served in parliament before and stayed with the same party (accounting for mergers)
        case
            when (was_parliament_member_2079 or was_parliament_member_2074)
                and parliament_member_2079_party is not null
                and (political_party_name = parliament_member_2079_party
                     or list_contains(party_previous_names, parliament_member_2079_party))
                then true
            when was_parliament_member_2074 and parliament_member_2079_party is null
                and parliament_member_2074_party is not null
                and (political_party_name = parliament_member_2074_party
                     or list_contains(party_previous_names, parliament_member_2074_party))
                then true
            else false
        end as is_party_loyal,

        -- High rank: top 10 in party list (critical for proportional system)
        case
            when rank_position <= 10 then true
            else false
        end as is_high_rank,

        -- Top rank: top 5 in party list (very likely to win)
        case
            when rank_position <= 5 then true
            else false
        end as is_top_rank,

        -- Low rank: rank > 50 (unlikely to win)
        case
            when rank_position > 50 then true
            else false
        end as is_low_rank,

        -- Women candidate
        case
            when gender = 'F' then true
            else false
        end as is_women,

        -- Inclusive group representation
        case
            when inclusive_group is not null and trim(inclusive_group) != '' then true
            else false
        end as is_inclusive_group,

        -- Disability representation
        case
            when disability is not null and trim(disability) != '' and disability != 'No' then true
            else false
        end as has_disability,

        -- Backward area representation
        case
            when backward_area is not null and trim(backward_area) != '' and backward_area != 'No' then true
            else false
        end as is_from_backward_area,

        -- Opportunist: switched from Independent to an existing (non-new) party
        case
            when parliament_member_2079_party = 'स्वतन्त्र'
                and political_party_name != 'स्वतन्त्र'
                and is_new_party = false then true
            when parliament_member_2079_party is null
                and parliament_member_2074_party = 'स्वतन्त्र'
                and political_party_name != 'स्वतन्त्र'
                and is_new_party = false then true
            else false
        end as is_opportunist,

        -- Candidate from party that improved performance
        case
            when prev_2079_party_votes is not null and prev_2074_party_votes is not null
                and prev_2079_party_votes > prev_2074_party_votes then true
            else false
        end as is_from_improving_party,

        -- Candidate from party that declined in performance
        case
            when prev_2079_party_votes is not null and prev_2074_party_votes is not null
                and prev_2079_party_votes < prev_2074_party_votes then true
            else false
        end as is_from_declining_party,

        -- Varaute: lost 2079 FPTP and now in PR candidate list
        -- OR lost 2074 FPTP and was a PR parliament member in 2079
        case
            when is_fptp_2079_loser then true
            when is_fptp_2074_loser and parliament_member_2079_election_type_normalized = 'Proportional' then true
            else false
        end as is_varaute,

        -- Gati chhada: PR member more than once
        -- OR was a parliament member at least once and is currently in the PR candidate list
        case
            when pr_times_elected > 1 then true
            when times_elected >= 1 then true
            else false
        end as is_gati_chhada

    from joined
)

select
    *,
    list_filter(
        [
            case when is_chheparo then 'Chheparo' end,
            case when is_new_candidate then 'New Candidate' end,
            case when is_party_loyal then 'Party Loyal' end,
            case when is_top_rank then 'Top Rank (1-5)' end,
            case when is_high_rank and not is_top_rank then 'High Rank (6-10)' end,
            case when is_low_rank then 'Low Rank (50+)' end,
            case when is_women then 'Women' end,
            case when is_inclusive_group then 'Inclusive Group' end,
            case when has_disability then 'Disability' end,
            case when is_from_backward_area then 'Backward Area' end,
            case when is_new_party then 'New Party' end,
            case when is_fptp_veteran then 'FPTP Veteran' end,
            case when is_proportional_veteran then 'Proportional Veteran' end,
            case when is_opportunist then 'Opportunist' end,
            case when is_from_improving_party then 'Improving Party' end,
            case when is_from_declining_party then 'Declining Party' end,
            case when is_varaute then 'Varaute' end,
            case when is_gati_chhada then 'Gati Chhada' end
        ],
        x -> x is not null
    ) as tags
from with_tags
