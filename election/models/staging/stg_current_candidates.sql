{{ config(materialized='view') }}

select *
from {{ source('raw', 'current_candidates') }}
