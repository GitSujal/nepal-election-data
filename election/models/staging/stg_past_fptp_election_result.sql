{{ config(materialized='view') }}
with source as (
        select * from {{ source('raw', 'past_first_past_the_post_election_result') }}
  ),
  renamed as (
      select
          {{ adapter.quote("CandidateName") }},
        {{ adapter.quote("Gender") }},
        {{ adapter.quote("Age") }},
        {{ adapter.quote("PartyID") }},
        {{ adapter.quote("SymbolID") }},
        {{ adapter.quote("SymbolName") }},
        {{ adapter.quote("CandidateID") }},
        {{ adapter.quote("StateName") }},
        {{ adapter.quote("PoliticalPartyName") }},
        {{ adapter.quote("ElectionPost") }},
        {{ adapter.quote("DistrictCd") }},
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
        {{ adapter.quote("DOB") }},
        {{ adapter.quote("CTZDIST") }},
        {{ adapter.quote("FATHER_NAME") }},
        {{ adapter.quote("SPOUCE_NAME") }},
        {{ adapter.quote("QUALIFICATION") }},
        {{ adapter.quote("EXPERIENCE") }},
        {{ adapter.quote("OTHERDETAILS") }},
        {{ adapter.quote("NAMEOFINST") }},
        {{ adapter.quote("ADDRESS") }}

      from source
  )
  select * from renamed
