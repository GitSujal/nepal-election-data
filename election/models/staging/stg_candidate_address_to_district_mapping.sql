{{ config(materialized='view') }}

with source as (
    select * from {{ source('raw', 'candidate_address_to_district_mapping') }}
),

renamed as (
    select
        address,
        district as basobas_jilla,
        district_id as basobas_district_id

    from source
),

-- Join with districts to get consistent district IDs for comparison
with_district_id as (
    select
        r.address,
        r.basobas_jilla,
        r.basobas_district_id,
        d.{{ adapter.quote("id") }} as district_id_verified
    from renamed r
    left join {{ ref('stg_districts') }} d
        on r.basobas_district_id = d.{{ adapter.quote("id") }}
)

select * from with_district_id
