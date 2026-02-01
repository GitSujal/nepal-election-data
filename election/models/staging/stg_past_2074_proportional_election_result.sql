{{ config(materialized='view') }}

-- NOTE: This is party-level aggregate data only.
-- No candidate names, districts, or constituency-level breakdown available for 2074 proportional results.
-- Each row represents one party's total proportional vote count.

with source as (
    select * from {{ source('raw', 'past_2074_proportional_election_result') }}
),

renamed as (
    select
        {{ adapter.quote("PartyID") }},
        {{ adapter.quote("SymbolID") }},
        {{ adapter.quote("SymbolName") }},
        {{ adapter.quote("PoliticalPartyName") }},
        {{ adapter.quote("SerialNo") }},
        {{ adapter.quote("TotalVoteReceived") }},
        {{ adapter.quote("Rank") }}
    from source
)

select * from renamed
