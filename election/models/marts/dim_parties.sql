{{ config(materialized='table') }}

with party_mapping as (
    select
        {{ adapter.quote("PoliticalPartyName_current") }} as current_party_name,
        {{ adapter.quote("SymbolName") }} as symbol_name,
        {{ adapter.quote("PoliticalPartyName_previous") }} as previous_party_name,
        {{ adapter.quote("Status") }} as status
    from {{ ref('party_current_new_name_mapping') }}
    where {{ adapter.quote("PoliticalPartyName_current") }} is not null
      and trim({{ adapter.quote("PoliticalPartyName_current") }}) != ''
),

party_symbols as (
    select * from {{ ref('stg_political_party_symbols') }}
),

parties_from_fptp as (
    select
        current_party_name,
        coalesce(
            list(distinct previous_party_name order by previous_party_name)
                filter (
                    where previous_party_name is not null
                      and trim(previous_party_name) != ''
                      and trim(previous_party_name) != trim(current_party_name)
                ),
            []
        ) as previous_names
    from party_mapping
    group by current_party_name
),

-- New parties from proportional candidates that have no mapped_party_name
proportional_mapping as (
    select
        {{ adapter.quote("proportional_party_name") }} as proportional_party_name,
        {{ adapter.quote("mapped_party_name") }} as mapped_party_name
    from {{ ref('proportional_to_fptp_party_name_mapping') }}
),

new_proportional_parties as (
    select
        proportional_party_name as current_party_name,
        []::varchar[] as previous_names
    from proportional_mapping
    where (mapped_party_name is null or trim(mapped_party_name) = '')
      and proportional_party_name not in (select current_party_name from parties_from_fptp)
),

all_parties as (
    select
        *,
        {{ sanitize_party_name('current_party_name') }} as norm_name,
        list_transform(
            previous_names,
            x -> {{ sanitize_party_name('x') }}
        ) as norm_previous_names
    from (
        select * from parties_from_fptp
        union all
        select * from new_proportional_parties
    )
),

-- Count 2079 parliament members per current party (merger-aware)
parliament_2079_counts as (
    select
        ap.current_party_name,
        count(*) as member_count_2079
    from all_parties ap
    inner join {{ ref('dim_parliament_members') }} pm
        on pm.was_member_2079 = true
        and (
            {{ sanitize_party_name('pm.party_2079_np') }} = ap.norm_name
            or list_contains(ap.norm_previous_names, {{ sanitize_party_name('pm.party_2079_np') }})
        )
    group by ap.current_party_name
),

-- Check if party had candidates in any previous election (FPTP 2079, FPTP 2074, PR 2079, PR 2074)
party_prev_fptp_2079 as (
    select
        ap.current_party_name,
        count(*) as candidate_count
    from all_parties ap
    inner join {{ ref('stg_past_2079_fptp_election_result') }} pr
        on {{ sanitize_party_name('pr.PoliticalPartyName') }} = ap.norm_name
        or list_contains(ap.norm_previous_names, {{ sanitize_party_name('pr.PoliticalPartyName') }})
    group by ap.current_party_name
),

party_prev_fptp_2074 as (
    select
        ap.current_party_name,
        count(*) as candidate_count
    from all_parties ap
    inner join {{ ref('stg_past_2074_fptp_election_result') }} pr
        on {{ sanitize_party_name('pr.PoliticalPartyName') }} = ap.norm_name
        or list_contains(ap.norm_previous_names, {{ sanitize_party_name('pr.PoliticalPartyName') }})
    group by ap.current_party_name
),

party_prev_pr_2079 as (
    select
        ap.current_party_name,
        count(*) as candidate_count
    from all_parties ap
    inner join {{ ref('stg_past_2079_proportional_election_result') }} pr
        on {{ sanitize_party_name('pr.political_party_name') }} = ap.norm_name
        or list_contains(ap.norm_previous_names, {{ sanitize_party_name('pr.political_party_name') }})
    group by ap.current_party_name
),

party_prev_pr_2074 as (
    select
        ap.current_party_name,
        count(*) as candidate_count
    from all_parties ap
    inner join {{ ref('stg_past_2074_proportional_election_result') }} pr
        on {{ sanitize_party_name('pr.PoliticalPartyName') }} = ap.norm_name
        or list_contains(ap.norm_previous_names, {{ sanitize_party_name('pr.PoliticalPartyName') }})
    group by ap.current_party_name
),

-- Aggregate all previous election participation
party_history as (
    select
        ap.current_party_name,
        coalesce(pf79.candidate_count, 0) + 
        coalesce(pf74.candidate_count, 0) + 
        coalesce(pp79.candidate_count, 0) + 
        coalesce(pp74.candidate_count, 0) as total_prev_candidates,
        case
            when coalesce(pf79.candidate_count, 0) + 
                 coalesce(pf74.candidate_count, 0) + 
                 coalesce(pp79.candidate_count, 0) + 
                 coalesce(pp74.candidate_count, 0) > 0 then false
            else true
        end as is_new_party
    from all_parties ap
    left join party_prev_fptp_2079 pf79
        on pf79.current_party_name = ap.current_party_name
    left join party_prev_fptp_2074 pf74
        on pf74.current_party_name = ap.current_party_name
    left join party_prev_pr_2079 pp79
        on pp79.current_party_name = ap.current_party_name
    left join party_prev_pr_2074 pp74
        on pp74.current_party_name = ap.current_party_name
),

-- Classify parties into display order categories
party_display_order_calc as (
    select
        ap.current_party_name,
        coalesce(pc.member_count_2079, 0) as member_count_2079,
        ph.is_new_party,
        case
            when coalesce(pc.member_count_2079, 0) > 0 then 1
            when ph.is_new_party = true and coalesce(pc.member_count_2079, 0) = 0 then 2
            else 3
        end as category
    from all_parties ap
    left join parliament_2079_counts pc
        on pc.current_party_name = ap.current_party_name
    inner join party_history ph
        on ph.current_party_name = ap.current_party_name
)

select
    row_number() over (order by ap.current_party_name) as party_id,
    ap.current_party_name,
    ap.norm_name,
    ap.previous_names,
    ap.norm_previous_names,
    ph.is_new_party,
    ph.total_prev_candidates,
    ps.symbol_url,
    ps.symbol_alt,
    ps.leader,
    ps.founded_year,
    ps.party_url as wikipedia_url,
    pdo.party_display_order
from all_parties ap
inner join party_history ph
    on ph.current_party_name = ap.current_party_name
left join (
    -- Best effort symbol match
    with party_variants as (
        select
            ap.current_party_name,
            unnest(list_append(ap.norm_previous_names, ap.norm_name)) as variant_norm
        from all_parties ap
    )
    select
        pv.current_party_name,
        ps.symbol_url,
        ps.symbol_alt,
        ps.leader,
        ps.founded_year,
        ps.party_url,
        row_number() over (partition by pv.current_party_name order by ps.party_name_np is not null desc) as rnk
    from party_variants pv
    inner join (
        select
            *,
            {{ sanitize_party_name('party_name_np') }} as party_name_np_norm
        from party_symbols
    ) ps
        on pv.variant_norm = ps.party_name_np_norm
) ps
    on ps.current_party_name = ap.current_party_name and ps.rnk = 1
left join (
    select
        current_party_name,
        row_number() over (order by category asc, member_count_2079 desc, current_party_name asc) as party_display_order
    from party_display_order_calc
) pdo
    on pdo.current_party_name = ap.current_party_name
qualify row_number() over (partition by ap.current_party_name order by pdo.party_display_order) = 1
