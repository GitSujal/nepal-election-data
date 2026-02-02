{{ config(materialized='view') }}
with source as (
        select * from {{ source('raw', 'current_first_past_the_post_candidates') }}
  ),
  renamed as (
      select
          {{ adapter.quote("CandidateID") }},
        {{ adapter.quote("CandidateName") }},
        {{ adapter.quote("AGE_YR") }},
        {{ adapter.quote("Gender") }},
        {{ adapter.quote("PoliticalPartyName") }},
        {{ adapter.quote("SYMBOLCODE") }},
        {{ adapter.quote("SymbolName") }},
        {{ adapter.quote("CTZDIST") }},
        {{ adapter.quote("DistrictName") }},
        {{ adapter.quote("StateName") }},
        {{ adapter.quote("STATE_ID") }},
        {{ adapter.quote("SCConstID") }},
        {{ adapter.quote("ConstName") }},
        {{ adapter.quote("TotalVoteReceived") }},
        {{ adapter.quote("R") }},
        {{ adapter.quote("E_STATUS") }},
        {{ adapter.quote("DOB") }},
        {{ adapter.quote("FATHER_NAME") }},
        {{ adapter.quote("SPOUCE_NAME") }},
        {{ adapter.quote("QUALIFICATION") }},
        {{ adapter.quote("NAMEOFINST") }},
        {{ adapter.quote("EXPERIENCE") }},
        {{ adapter.quote("OTHERDETAILS") }},
        {{ adapter.quote("ADDRESS") }},
        -- Normalized name for cross-term and cross-dataset matching
        -- Strips spaces, dots, parens, ZWJ/ZWNJ, titles (डा, डा०, कु, श्री)
        -- Normalizes long→short vowels (ी→ि, ू→ु), anusvara (ँ→ं), conjuncts (ङ्ग→ङ)
        -- Also normalizes व↔ब, ण→न (common Nepali spelling variations)
        -- Remove brackets: (), {}, []
        replace(replace(replace(replace(replace(replace(replace(
            regexp_replace(
                regexp_replace(
                    regexp_replace(
                        replace(replace({{ adapter.quote("CandidateName") }}, chr(8205), ''), chr(8204), ''),
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
