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
)

select
    row_number() over (order by current_party_name) as party_id,
    current_party_name,
    previous_names
from all_parties
