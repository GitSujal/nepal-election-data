{{ config(materialized='view') }}

with source as (
    select * from {{ source('raw', 'parliament_members') }}
),

renamed as (
    select
        member_id,
        code,
        slug,
        parliament_type,
        member_type,
        status,
        case
            when gender = 0 then 'Male'
            when gender = 1 then 'Female'
            else 'Other'
        end as gender,
        dob,
        registered_date_bs,
        tenure_end_date,
        election_area_no,
        territory_no,
        name_np,
        name_en,
        designation_np,
        designation_en,
        description_np,
        description_en,
        district_id,
        district_code,
        district_name_np,
        district_name_en,
        political_party_id,
        political_party_name_np,
        political_party_name_en,
        election_type_id,
        election_type_np,
        case
            when election_type_en = 'Direct' then 'FPTP'
            when election_type_en = 'Indirect' then 'Proportional'
            else election_type_en
        end as election_type,
        -- Normalized name for cross-term and cross-dataset matching
        {{ sanitize_candidate_name('name_np') }} as name_normalized
    from source
)

select * from renamed
