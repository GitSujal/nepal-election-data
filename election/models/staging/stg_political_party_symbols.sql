{{ config(materialized='view') }}

with source as (
    select * from {{ source('raw', 'political_party_symbols') }}
),

renamed as (
    select
        party_name_en,
        party_name_np,
        party_url,
        symbol_url,
        symbol_alt,
        leader,
        founded_year
    from source
)

select * from renamed
