{{ config(materialized='table') }}

with parties as (
    select * from {{ ref('dim_parties') }}
),

fptp_2082 as (
    select * from {{ ref('dim_current_fptp_candidates') }}
),

pr_2082 as (
    select * from {{ ref('dim_current_proportional_candidates') }}
),

fptp_2079 as (
    select * from {{ ref('dim_fptp_2079_candidates') }}
),

fptp_2079_results as (
    select * from {{ ref('stg_past_2079_fptp_election_result') }}
),

pr_2079_results as (
    select * from {{ ref('stg_past_2079_proportional_election_result') }}
),

fptp_2074_results as (
    select * from {{ ref('stg_past_2074_fptp_election_result') }}
),

pr_2074_results as (
    select * from {{ ref('stg_past_2074_proportional_election_result') }}
),

fptp_2074 as (
    select
        {{ adapter.quote("CandidateName") }} as candidate_name,
        {{ adapter.quote("Gender") }} as gender,
        {{ adapter.quote("Age") }} as age,
        {{ adapter.quote("PoliticalPartyName") }} as party_name,
        {{ adapter.quote("TotalVoteReceived") }} as vote_count,
        {{ adapter.quote("Rank") }} as rank,
        {{ adapter.quote("Remarks") }} as remarks,
        {{ adapter.quote("Samudaya") }} as samudaya,
        {{ adapter.quote("SCConstID") }} as constituency_id
    from fptp_2074_results
),

parliament_members as (
    select * from {{ ref('dim_parliament_members') }}
),

-- Aggregate HoR Representatives
reps_summary as (
    select
        current_party_name,
        count(case when was_member_2079 then 1 end) as reps_2079,
        count(case when was_member_2074 then 1 end) as reps_2074,
        count(case when was_member_2079 and election_type_2079 = 'FPTP' then 1 end) as fptp_reps_2079,
        count(case when was_member_2079 and election_type_2079 = 'Proportional' then 1 end) as pr_reps_2079,
        count(case when was_member_2074 and election_type_2074 = 'FPTP' then 1 end) as fptp_reps_2074,
        count(case when was_member_2074 and election_type_2074 = 'Proportional' then 1 end) as pr_reps_2074
    from parties p
    left join parliament_members pm
        on pm.party_2079_np = p.current_party_name
        or pm.party_2074_np = p.current_party_name
    group by current_party_name
),

-- FPTP 2074 Stats (Need to handle party names)
fptp_2074_stats as (
    select
        p.current_party_name,
        count(*) as candidate_count,
        count(case when trim(f.remarks) = 'Elected' then 1 end) as seats_won,
        sum(f.vote_count) as total_votes
    from parties p
    left join fptp_2074 f
        on trim(f.party_name) = p.current_party_name
        or list_contains(p.previous_names, trim(f.party_name))
    group by p.current_party_name
),

-- FPTP 2079 Stats
fptp_2079_stats as (
    select
        p.current_party_name,
        count(*) as candidate_count,
        count(case when trim(f.Remarks) = 'Elected' then 1 end) as seats_won,
        sum(f.TotalVoteReceived) as total_votes
    from parties p
    left join fptp_2079_results f
        on trim(f.PoliticalPartyName) = p.current_party_name
        or list_contains(p.previous_names, trim(f.PoliticalPartyName))
    group by p.current_party_name
),

-- PR 2079 Stats (Votes only as we don't have PR candidate list for 2079 easily)
pr_2079_stats as (
    select
        trim(political_party_name) as political_party_name,
        sum(total_vote_received) as total_votes
    from pr_2079_results
    group by 1
),

pr_2079_stats_unified as (
    select
        p.current_party_name,
        sum(s.total_votes) as total_votes
    from parties p
    left join pr_2079_stats s
        on s.political_party_name = p.current_party_name
        or list_contains(p.previous_names, s.political_party_name)
    group by p.current_party_name
),

-- PR 2074 Stats
pr_2074_stats as (
    select
        trim({{ adapter.quote("PoliticalPartyName") }}) as party_name,
        sum(cast({{ adapter.quote("TotalVoteReceived") }} as bigint)) as total_votes
    from pr_2074_results
    group by 1
),

pr_2074_stats_unified as (
    select
        p.current_party_name,
        sum(s.total_votes) as total_votes
    from parties p
    left join pr_2074_stats s
        on s.party_name = p.current_party_name
        or list_contains(p.previous_names, s.party_name)
    group by p.current_party_name
),

-- Current FPTP Aggregates (2082)
fptp_2082_agg as (
    select
        political_party_name,
        avg(age) as avg_age,
        count(*) as total_candidates,
        count(case when is_new_candidate then 1 end) as new_candidates,
        count(case when not is_new_candidate then 1 end) as returning_candidates
    from fptp_2082
    group by 1
),

fptp_2082_qual as (
    select political_party_name, list({'group': qualification_level, 'count': c}) as stats
    from (select political_party_name, qualification_level, count(*) as c from fptp_2082 group by 1, 2) group by 1
),

fptp_2082_gender as (
    select political_party_name, list({'group': gender, 'count': c}) as stats
    from (select political_party_name, gender, count(*) as c from fptp_2082 group by 1, 2) group by 1
),

fptp_2082_dist as (
    select political_party_name, list({'group': citizenship_district, 'count': c}) as stats
    from (select political_party_name, citizenship_district, count(*) as c from fptp_2082 group by 1, 2) group by 1
),

fptp_2082_age_group as (
    select political_party_name, list({'group': age_group, 'count': c}) as stats
    from (select political_party_name, age_group, count(*) as c from fptp_2082 group by 1, 2) group by 1
),

fptp_2082_tags as (
    select political_party_name, list({'tag': tag_item, 'count': c}) as stats
    from (
        select political_party_name, tag_item, count(*) as c 
        from (
            select political_party_name, unnest(tags) as tag_item from fptp_2082
        ) t1
        group by 1, 2
    ) group by 1
),

-- Current PR Aggregates (2082)
pr_2082_agg as (
    select
        political_party_name,
        count(*) as total_candidates
    from pr_2082
    group by 1
),

pr_2082_gender as (
    select political_party_name, list({'group': gender, 'count': c}) as stats
    from (select political_party_name, gender, count(*) as c from pr_2082 group by 1, 2) group by 1
),

pr_2082_inc as (
    select political_party_name, list({'group': inclusive_group, 'count': c}) as stats
    from (select political_party_name, inclusive_group, count(*) as c from pr_2082 group by 1, 2) group by 1
),

pr_2082_dist as (
    select political_party_name, list({'group': citizenship_district, 'count': c}) as stats
    from (select political_party_name, citizenship_district, count(*) as c from pr_2082 group by 1, 2) group by 1
),

pr_2082_back as (
    select political_party_name, list({'group': backward_area, 'count': c}) as stats
    from (select political_party_name, backward_area, count(*) as c from pr_2082 group by 1, 2) group by 1
),

pr_2082_dis as (
    select political_party_name, list({'group': disability, 'count': c}) as stats
    from (select political_party_name, disability, count(*) as c from pr_2082 group by 1, 2) group by 1
),

pr_2082_tags as (
    select political_party_name, list({'tag': tag_item, 'count': c}) as stats
    from (
        select political_party_name, tag_item, count(*) as c
        from (
            select political_party_name, unnest(tags) as tag_item from pr_2082
        ) t1
        group by 1, 2
    ) group by 1
)

-- Final joined for profile
select
    p.party_id,
    p.current_party_name as party_name,
    p.symbol_url,
    p.symbol_alt,
    p.leader,
    p.founded_year,
    p.wikipedia_url,
    
    -- History
    {
        '2079': {
            'fptp_seats': f79s.seats_won,
            'fptp_votes': f79s.total_votes,
            'pr_votes': pr79s.total_votes,
            'total_reps': rs.reps_2079,
            'fptp_reps': rs.fptp_reps_2079,
            'pr_reps': rs.pr_reps_2079
        },
        '2074': {
            'fptp_seats': f74s.seats_won,
            'fptp_votes': f74s.total_votes,
            'pr_votes': pr74s.total_votes,
            'total_reps': rs.reps_2074,
            'fptp_reps': rs.fptp_reps_2074,
            'pr_reps': rs.pr_reps_2074
        }
    } as history_json,

    -- Current Stats (2082)
    {
        'fptp': {
            'total': f82.total_candidates,
            'new': f82.new_candidates,
            'returning': f82.returning_candidates,
            'avg_age': f82.avg_age,
            'qualification': f82q.stats,
            'gender': f82g.stats,
            'district': f82d.stats,
            'age_group': f82a.stats,
            'tags': f82t.stats
        },
        'pr': {
            'total': p82.total_candidates,
            'gender': p82g.stats,
            'inclusive': p82i.stats,
            'district': p82d.stats,
            'backward': p82b.stats,
            'disability': p82dis.stats,
            'tags': p82t.stats
        }
    } as current_stats_json,

    -- Party Level Tags
    list_filter(
        [
            case when f82.avg_age > 55 then 'Budo Party 👴' end,
            case when (cast(f82.returning_candidates as double) / nullif(f82.total_candidates, 0)) > 0.5 then 'Same Same 👯' end,
            case when (cast(f82.new_candidates as double) / nullif(f82.total_candidates, 0)) > 0.5 then 'Naya Anuhar 🧒' end
        ],
        x -> x is not null
    ) as party_tags

from parties p
left join reps_summary rs on rs.current_party_name = p.current_party_name
left join fptp_2074_stats f74s on f74s.current_party_name = p.current_party_name
left join fptp_2079_stats f79s on f79s.current_party_name = p.current_party_name
left join pr_2079_stats_unified pr79s on pr79s.current_party_name = p.current_party_name
left join pr_2074_stats_unified pr74s on pr74s.current_party_name = p.current_party_name
left join fptp_2082_agg f82 on f82.political_party_name = p.current_party_name
left join fptp_2082_qual f82q on f82q.political_party_name = p.current_party_name
left join fptp_2082_gender f82g on f82g.political_party_name = p.current_party_name
left join fptp_2082_dist f82d on f82d.political_party_name = p.current_party_name
left join fptp_2082_age_group f82a on f82a.political_party_name = p.current_party_name
left join fptp_2082_tags f82t on f82t.political_party_name = p.current_party_name
left join pr_2082_agg p82 on p82.political_party_name = p.current_party_name
left join pr_2082_gender p82g on p82g.political_party_name = p.current_party_name
left join pr_2082_inc p82i on p82i.political_party_name = p.current_party_name
left join pr_2082_dist p82d on p82d.political_party_name = p.current_party_name
left join pr_2082_back p82b on p82b.political_party_name = p.current_party_name
left join pr_2082_dis p82dis on p82dis.political_party_name = p.current_party_name
left join pr_2082_tags p82t on p82t.political_party_name = p.current_party_name

