{{ config(materialized='view') }}
with source as (
        select * from {{ source('raw', 'states') }}
  ),
  renamed as (
      select
          {{ adapter.quote("id") }},
        {{ adapter.quote("name") }}

      from source
  )
  select * from renamed
    