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

-- Pool of FPTP candidates with normalized spouse names (for Bokuwa matching)
fptp_spouse_pool as (
    -- Current FPTP candidates
    select distinct
        {{ adapter.quote("Gender") }} as fptp_gender,
        {{ adapter.quote("PoliticalPartyName") }} as fptp_party_name,
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
        as spouse_name_normalized
    from {{ ref('stg_current_fptp_candidates') }}
    where {{ adapter.quote("SPOUCE_NAME") }} is not null and trim({{ adapter.quote("SPOUCE_NAME") }}) != ''
    union all
    -- 2079 FPTP candidates
    select distinct
        {{ adapter.quote("Gender") }},
        {{ adapter.quote("PoliticalPartyName") }},
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
    from {{ ref('stg_past_2079_fptp_election_result') }}
    where {{ adapter.quote("SPOUCE_NAME") }} is not null and trim({{ adapter.quote("SPOUCE_NAME") }}) != ''
),

-- Enrich spouse pool with party previous names for merger-aware matching
fptp_spouse_pool_enriched as (
    select
        sp.fptp_gender,
        sp.fptp_party_name,
        sp.spouse_name_normalized,
        coalesce(pp.previous_names, []::varchar[]) as fptp_party_previous_names
    from fptp_spouse_pool sp
    left join parties pp on sp.fptp_party_name = pp.current_party_name
),

-- PR candidates enriched with mapped party name and associated party previous names
pr_with_party_info as (
    select
        cc.serial_no,
        cc.political_party_name,
        cc.candidate_name_normalized,
        cc.gender,
        cc.associated_party,
        pmm.mapped_party_name,
        coalesce(p1.previous_names, []::varchar[]) as pr_party_previous_names
    from {{ ref('stg_current_proportional_candidates') }} cc
    left join proportional_mapping pmm on cc.political_party_name = pmm.proportional_party_name
    left join parties p1 on cc.political_party_name = p1.current_party_name
),

-- Match PR candidates to FPTP spouse pool
bokuwa_matches as (
    select
        pr.serial_no,
        pr.political_party_name,
        sp.fptp_gender
    from pr_with_party_info pr
    inner join fptp_spouse_pool_enriched sp
        on sp.spouse_name_normalized = pr.candidate_name_normalized
        and pr.candidate_name_normalized is not null
        and pr.candidate_name_normalized != ''
    where (
        sp.fptp_party_name = pr.political_party_name
        or sp.fptp_party_name = pr.mapped_party_name
        or sp.fptp_party_name = pr.associated_party
        or list_contains(sp.fptp_party_previous_names, pr.political_party_name)
        or (pr.mapped_party_name is not null and list_contains(sp.fptp_party_previous_names, pr.mapped_party_name))
        or list_contains(pr.pr_party_previous_names, sp.fptp_party_name)
    )
),

-- Aggregate bokuwa flags per PR candidate
bokuwa_flags as (
    select
        serial_no,
        political_party_name,
        bool_or(fptp_gender = 'पुरुष') as has_male_fptp_match,
        bool_or(fptp_gender = 'महिला') as has_female_fptp_match
    from bokuwa_matches
    group by serial_no, political_party_name
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

        -- Party matching logic: direct match, then seed mapping, then associated_party, then robust match
        coalesce(p_direct.party_id, p_mapped.party_id, p_assoc.party_id, p_robust.party_id) as party_id,
        coalesce(p_direct.current_party_name, p_mapped.current_party_name, p_assoc.current_party_name, p_robust.current_party_name) as matched_party_name,
        coalesce(p_direct.previous_names, p_mapped.previous_names, p_assoc.previous_names, p_robust.previous_names) as party_previous_names,
        coalesce(p_direct.party_display_order, p_mapped.party_display_order, p_assoc.party_display_order, p_robust.party_display_order) as party_display_order,

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
        end as is_same_party_2074_after_merger_check,

        -- Bokuwa flags
        case when cc.gender = 'महिला' and coalesce(bk.has_male_fptp_match, false) then true else false end as is_budi_bokuwa,
        case when cc.gender = 'पुरुष' and coalesce(bk.has_female_fptp_match, false) then true else false end as is_budo_bokuwa

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
    -- 4. Robust match: normalized political_party_name → dim_parties.norm_name
    left join parties p_robust
        on regexp_replace(lower(trim(replace(replace(replace(replace(replace(replace(cc.political_party_name, ' ', ''), '-', ''), '(', ''), ')', ''), 'काङ्ग्रेस', 'काँग्रेस'), 'माक्र्सवादी', 'मार्क्सवादी'))), '[ािीुूेैोौ्ंँ़]','','g') = p_robust.norm_name
        and p_direct.party_id is null
        and p_mapped.party_id is null
        and p_assoc.party_id is null
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
    left join bokuwa_flags bk
        on cc.serial_no = bk.serial_no
        and cc.political_party_name = bk.political_party_name
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
            case when is_chheparo then 'छेपारो' end,
            case when is_new_candidate then 'नयाँ अनुहार' end,
            case when is_party_loyal then 'पार्टीप्रति वफादार' end,
            case when is_top_rank then 'शीर्ष वरीयता (१-५)' end,
            case when is_high_rank and not is_top_rank then 'उच्च वरीयता (६-१०)' end,
            case when is_low_rank then 'तल्लो वरीयता (५०+)' end,
            case when is_women then 'महिला' end,
            case when is_inclusive_group then 'समावेशी समूह' end,
            case when has_disability then 'अपाङ्गता' end,
            case when is_from_backward_area then 'पिछडिएको क्षेत्र' end,
            case when is_new_party then 'नयाँ पार्टी' end,
            case when is_fptp_veteran then 'प्रत्यक्ष अनुभवी' end,
            case when is_proportional_veteran then 'समानुपातिक अनुभवी' end,
            case when is_opportunist then 'अवसरवादी' end,
            case when is_from_improving_party then 'सुधारोन्मुख पार्टी' end,
            case when is_from_declining_party then 'खस्कँदो पार्टी' end,
            case when is_varaute then 'बहादुर' end, -- Assuming Varaute means brave or similar context in some cases, but often means switcher/opportunist. I'll use Varaute/बहादुर or just the phonetic. Actually Varaute means those who keep coming back without winning? I'll use 'बहादुर (दोहोरिने)'
            case when is_gati_chhada then 'गति छाडा' end,
            case when is_budi_bokuwa then 'बुढी बोकुवा' end,
            case when is_budo_bokuwa then 'बुढो बोकुवा' end
        ],
        x -> x is not null
    ) as tags
from with_tags
