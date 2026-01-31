{{ config(materialized='view') }}

with source as (
        select * from {{ source('raw', 'past_proportional_election_result') }}
)
select
    s.id as state_id,
    s.name as state_name,
    d.id as district_id,
    d.name as district_name,
    c.id as constituency_id,
    c.name as constituency_name,
    r.SerialNo as serial_no,
    r.PartyID as party_id,
    r.SymbolID as symbol_id,
    r.SymbolName as symbol_name,
    r.PoliticalPartyName as political_party_name,
    r.DistrictCd as district_cd,
    r.DistrictName as district_name_alt,
    r.StateID as state_id_alt,
    r.SCConstID as sc_const_id,
    r.CenterConstID as center_const_id,
    r.OrderID as order_id,
    r.TotalVoteReceived as total_vote_received
from source s
cross join unnest(s.districts) as t(d)
cross join unnest(d.constituencies) as t2(c)
cross join unnest(c.results) as t3(r)
