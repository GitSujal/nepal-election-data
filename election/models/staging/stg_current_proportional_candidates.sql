{{ config(materialized='view') }}

with source as (
    select * from {{ source('raw', 'current_proportional_election_candidates') }}
),

renamed as (
    select
        {{ adapter.quote("Political Party") }} as political_party_name,
        {{ adapter.quote("S.N.") }} as serial_no,
        {{ adapter.quote("Full Name") }} as full_name,
        {{ adapter.quote("Voter ID Number") }} as voter_id_number,
        {{ adapter.quote("Gender") }} as gender,
        {{ adapter.quote("Inclusive Group") }} as inclusive_group,
        {{ adapter.quote("Citizenship District") }} as citizenship_district,
        {{ adapter.quote("Backward Area") }} as backward_area,
        {{ adapter.quote("Disability") }} as disability,
        {{ adapter.quote("Associated Party") }} as associated_party,
        {{ adapter.quote("Remarks") }} as remarks,
        -- Normalized name for cross-term and cross-dataset matching
        -- Strips spaces, dots, parens, ZWJ/ZWNJ, titles (डा, डा०, कु, श्री)
        -- Normalizes long→short vowels (ी→ि, ू→ु), anusvara (ँ→ं), conjuncts (ङ्ग→ङ)
        -- Also normalizes व↔ब, ण→न (common Nepali spelling variations)
        -- Remove brackets: (), {}, []
        replace(replace(replace(replace(replace(replace(replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        replace(replace({{ adapter.quote("Full Name") }}, chr(8205), ''), chr(8204), ''),
                        '[\s\.\x{00a0}]+', '', 'g'
                    ),
                    '^(डा॰?|डा०?|कु\.|श्री\.?)', ''
                ),
                '[(){}[\]०-९।]+', '', 'g'
            ),
        'ी', 'ि'), 'ू', 'ु'), 'ँ', 'ं'), 'ङ्ग', 'ङ'), 'ट्ट', 'ट'), 'व', 'ब'), 'ण', 'न')
        as candidate_name_normalized
    from source
)

select * from renamed
