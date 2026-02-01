{{ config(materialized='view') }}

with source as (
    select * from {{ source('raw', 'past_2074_first_past_the_post_election_result') }}
),

renamed as (
    select
        {{ adapter.quote("CandidateName") }},
        {{ adapter.quote("Gender") }},
        {{ adapter.quote("Age") }},
        {{ adapter.quote("PartyID") }},
        {{ adapter.quote("SymbolID") }},
        {{ adapter.quote("SymbolName") }},
        {{ adapter.quote("PoliticalPartyName") }},
        {{ adapter.quote("ElectionPost") }},
        {{ adapter.quote("DistrictName") }},
        {{ adapter.quote("State") }},
        {{ adapter.quote("SCConstID") }},
        {{ adapter.quote("CenterConstID") }},
        {{ adapter.quote("SerialNo") }},
        {{ adapter.quote("TotalVoteReceived") }},
        {{ adapter.quote("CastedVote") }},
        {{ adapter.quote("TotalVoters") }},
        {{ adapter.quote("Rank") }},
        {{ adapter.quote("Remarks") }},
        {{ adapter.quote("Samudaya") }}
    from source
)

select * from renamed
