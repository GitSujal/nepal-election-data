{{ config(materialized='table') }}

with members as (
    select * from {{ ref('stg_parliament_members') }}
),

-- Manual name mapping seed: maps 2074 spelling → 2079 spelling
name_mapping as (
    select
        {{ adapter.quote("name_2074") }} as name_2074,
        {{ adapter.quote("name_2079") }} as name_2079
    from {{ ref('parliament_member_name_mapping') }}
),

-- Apply manual mapping: unify 2074 names to their 2079 counterpart
-- This is the third matching tier after exact match and normalization
members_unified as (
    select
        m.*,
        -- Use mapped name if available (for seed matches), otherwise keep normalized name
        coalesce(nm.name_2079, m.name_np) as unified_name_np,
        coalesce(
            (select m2.name_normalized from {{ ref('stg_parliament_members') }} m2
             where m2.name_np = nm.name_2079 limit 1),
            m.name_normalized
        ) as unified_name_normalized
    from members m
    left join name_mapping nm
        on m.name_np = nm.name_2074
),

-- Aggregate per member using unified normalized name
member_summary as (
    select
        unified_name_normalized as name_normalized,
        -- Use the latest term's name as the display name
        max(name_np) as name_np,
        max(name_en) as name_en,
        max(gender) as gender,
        max(dob) as dob,
        -- Number of times elected
        count(*) as times_elected,
        -- List of distinct parties
        list(distinct political_party_name_np) as parties_np,
        list(distinct political_party_name_en) as parties_en,
        -- Did they switch parties across terms?
        case
            when count(distinct political_party_name_np) > 1 then true
            else false
        end as is_party_switcher,
        -- List of terms (BS years)
        list(registered_date_bs order by registered_date_bs) as terms_bs,
        -- List of election types per term
        list(election_type order by registered_date_bs) as election_types,
        -- List of districts per term
        list(district_name_np order by registered_date_bs) as districts_np,
        -- List of constituency numbers per term
        list(election_area_no order by registered_date_bs) as election_areas,
        -- Latest term info
        max(registered_date_bs) as latest_term_bs,
        -- Was elected in 2074 (previous term)?
        max(case when registered_date_bs = 2074 then true else false end) as was_member_2074,
        -- Was elected in 2079 (current term)?
        max(case when registered_date_bs = 2079 then true else false end) as was_member_2079,
        -- Party in 2074
        max(case when registered_date_bs = 2074 then political_party_name_np end) as party_2074_np,
        -- Party in 2079
        max(case when registered_date_bs = 2079 then political_party_name_np end) as party_2079_np,
        -- Election type in 2074
        max(case when registered_date_bs = 2074 then election_type end) as election_type_2074,
        -- Election type in 2079
        max(case when registered_date_bs = 2079 then election_type end) as election_type_2079,
        -- District in 2074
        max(case when registered_date_bs = 2074 then district_name_np end) as district_2074_np,
        -- District in 2079
        max(case when registered_date_bs = 2079 then district_name_np end) as district_2079_np,
        -- Constituency in 2074
        max(case when registered_date_bs = 2074 then election_area_no end) as election_area_2074,
        -- Constituency in 2079
        max(case when registered_date_bs = 2079 then election_area_no end) as election_area_2079
    from members_unified
    group by unified_name_normalized
)

select
    row_number() over (order by name_np) as parliament_member_id,
    *
from member_summary
