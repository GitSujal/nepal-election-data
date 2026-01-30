{{ config(materialized='view') }}

select *
from {{ source('raw', 'pratakhya_election_result') }}
