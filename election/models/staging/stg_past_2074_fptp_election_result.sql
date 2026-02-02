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
        {{ adapter.quote("Samudaya") }},
        -- Normalized name for cross-term and cross-dataset matching
        -- Strips spaces, dots, parens, ZWJ/ZWNJ, titles (डा, डा०, कु, श्री)
        -- Normalizes long→short vowels (ी→ि, ू→ु), anusvara (ँ→ं), conjuncts (ङ्ग→ङ)
        -- Also normalizes व↔ब, ण→न (common Nepali spelling variations)
        -- Remove brackets: (), {}, []
        replace(replace(replace(replace(replace(replace(replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(
                            replace(replace({{ adapter.quote("CandidateName") }}, chr(8205), ''), chr(8204), ''),
                            '\{[^}]*\}|\([^)]*\)|\[[^\]]*\]', '', 'g'
                        ),
                        '[\s\.\x{00a0}]+', '', 'g'
                    ),
                    '^(डा॰?|डा०?|कु\.|श्री\.?)', ''
                ),
                '[०-९।]+', '', 'g'
            ),
        'ी', 'ि'), 'ू', 'ु'), 'ँ', 'ं'), 'ङ्ग', 'ङ'), 'ट्ट', 'ट'), 'व', 'ब'), 'ण', 'न')
        as candidate_name_normalized
    from source
)

select * from renamed
