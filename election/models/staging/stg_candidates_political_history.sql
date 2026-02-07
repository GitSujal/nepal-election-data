{{ config(materialized='table') }}

with source as (
    select * from {{ source('raw', 'candidates_political_history') }}
),

-- Unnest political_history array to extract ministerial appointments
ministerial_appointments as (
    select
        s.candidate_id,
        s.candidate_name,
        ph.event_type
    from source s
    cross join unnest(s.political_history) as t(ph)
    where ph.event_type = 'MINISTERIAL_APPT'
),

-- Count ministerial appointments
minister_counts as (
    select
        candidate_id,
        candidate_name,
        count(*) as minister_appointment_count
    from ministerial_appointments
    group by candidate_id, candidate_name
),

-- Unnest election_history to count total elections and wins
election_details as (
    select
        s.candidate_id,
        s.candidate_name,
        eh.result
    from source s
    cross join unnest(s.election_history) as t(eh)
),

-- Count total elections and wins from profile history
election_stats as (
    select
        candidate_id,
        candidate_name,
        count(*) as total_elections_from_profile,
        sum(case 
            when result in ('विजयी', 'Elected') then 1 
            else 0 
        end) as total_wins_from_profile
    from election_details
    group by candidate_id, candidate_name
),

-- Combine all profile-based stats
profile_stats as (
    select
        s.candidate_id,
        s.candidate_name,
        s.candidate_party,
        s.candidates_current_position,
        s.candidates_current_position_in_party,
        s.candidate_picture,
        s.election_history,
        s.political_history,
        s.analysis,
        s.overall_approval_rating,
        coalesce(mc.minister_appointment_count, 0) as minister_appointment_count,
        coalesce(es.total_elections_from_profile, 0) as total_elections_from_profile,
        coalesce(es.total_wins_from_profile, 0) as total_wins_from_profile,
        case 
            when mc.minister_appointment_count > 0 then true 
            else false 
        end as is_past_minister
    from source s
    left join minister_counts mc
        on s.candidate_id = mc.candidate_id
    left join election_stats es
        on s.candidate_id = es.candidate_id
)

select * from profile_stats
