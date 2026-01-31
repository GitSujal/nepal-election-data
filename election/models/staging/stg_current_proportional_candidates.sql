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
        {{ adapter.quote("Remarks") }} as remarks
    from source
)

select * from renamed
