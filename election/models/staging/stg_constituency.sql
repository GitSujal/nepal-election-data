{{ config(materialized='view') }}
with source as (
        select * from {{ source('raw', 'constituency') }}
  ),
  renamed as (
      select
          {{ adapter.quote("distId") }},
        {{ adapter.quote("consts") }}

      from source
  )
  select * from renamed
    