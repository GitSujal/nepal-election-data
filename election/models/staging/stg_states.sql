{{ config(materialized='view') }}

select *
from {{ source('raw', 'states') }}
