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
        {{ adapter.quote("ADDRESS") }}

      from source
  )
  select * from renamed
