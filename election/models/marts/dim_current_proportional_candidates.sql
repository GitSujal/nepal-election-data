{{ config(materialized='table') }}

with proportional as (
    select * from {{ ref('stg_current_proportional_candidates') }}
),

parties as (
    select * from {{ ref('dim_parties') }}
),

proportional_mapping as (
    select
        {{ adapter.quote("proportional_party_name") }} as proportional_party_name,
        {{ adapter.quote("mapped_party_name") }} as mapped_party_name
    from {{ ref('proportional_to_fptp_party_name_mapping') }}
    where {{ adapter.quote("mapped_party_name") }} is not null
      and trim({{ adapter.quote("mapped_party_name") }}) != ''
)

select
    pc.serial_no,
    pc.full_name,
    pc.voter_id_number,
    pc.gender,
    pc.inclusive_group,
    pc.citizenship_district,
    pc.backward_area,
    pc.disability,
    pc.associated_party,
    pc.remarks,

    -- Party info: direct match, then seed mapping, then associated_party
    pc.political_party_name,
    coalesce(p_direct.party_id, p_mapped.party_id, p_assoc.party_id) as party_id,
    coalesce(p_direct.current_party_name, p_mapped.current_party_name, p_assoc.current_party_name) as matched_party_name,
    coalesce(p_direct.previous_names, p_mapped.previous_names, p_assoc.previous_names) as party_previous_names

from proportional pc
-- 1. Direct match on political_party_name
left join parties p_direct
    on pc.political_party_name = p_direct.current_party_name
-- 2. Seed mapping: proportional party name → mapped party name → dim_parties
left join proportional_mapping pm
    on pc.political_party_name = pm.proportional_party_name
    and p_direct.party_id is null
left join parties p_mapped
    on pm.mapped_party_name = p_mapped.current_party_name
-- 3. Fallback: associated_party
left join parties p_assoc
    on pc.associated_party = p_assoc.current_party_name
    and p_direct.party_id is null
    and p_mapped.party_id is null
