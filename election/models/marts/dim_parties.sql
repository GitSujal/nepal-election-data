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
    select * from parties_from_fptp
    union all
    select * from new_proportional_parties
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
            pm.party_2079_np = ap.current_party_name
            or list_contains(ap.previous_names, pm.party_2079_np)
        )
    group by ap.current_party_name
),

-- Classify parties into display order categories
party_display_order_calc as (
    select
        ap.current_party_name,
        coalesce(pc.member_count_2079, 0) as member_count_2079,
        case
            when coalesce(pc.member_count_2079, 0) > 0 then 1
            when len(ap.previous_names) = 0 and coalesce(pc.member_count_2079, 0) = 0 then 2
            else 3
        end as category
    from all_parties ap
    left join parliament_2079_counts pc
        on pc.current_party_name = ap.current_party_name
)

select
    row_number() over (order by ap.current_party_name) as party_id,
    ap.current_party_name,
    ap.previous_names,
    ps.symbol_url,
    ps.symbol_alt,
    ps.leader,
    ps.founded_year,
    ps.party_url as wikipedia_url,
    pdo.party_display_order
from all_parties ap
left join party_symbols ps
    on trim(replace(ap.current_party_name, '-', ' ')) = trim(replace(ps.party_name_np, '-', ' '))
    or trim(replace(ap.current_party_name, '-', ' ')) = trim(replace(ps.party_name_en, '-', ' '))
    -- also check if any of the previous names match the symbols (normalized)
    or list_contains(
        list_transform(ap.previous_names, x -> trim(replace(x, '-', ' '))),
        trim(replace(ps.party_name_np, '-', ' '))
    )
left join (
    select
        current_party_name,
        row_number() over (order by category asc, member_count_2079 desc, current_party_name asc) as party_display_order
    from party_display_order_calc
) pdo
    on pdo.current_party_name = ap.current_party_name
qualify row_number() over (partition by ap.current_party_name order by ps.party_name_np is not null desc) = 1
