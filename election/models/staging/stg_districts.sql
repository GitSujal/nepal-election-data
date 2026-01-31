{{ config(materialized='view') }}
with source as (
        select * from {{ source('raw', 'districts') }}
  ),
  renamed as (
      select
          {{ adapter.quote("id") }},
        {{ adapter.quote("name") }},
        {{ adapter.quote("parentId") }}

      from source
  )
  select * from renamed
    