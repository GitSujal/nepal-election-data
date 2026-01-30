import duckdb

con = duckdb.connect('election.db', read_only=True)

print('=== DIM_CANDIDATES SUMMARY ===')
print(f'Total candidates: {con.execute("SELECT COUNT(*) FROM main.dim_candidates").fetchone()[0]}')
print(f'\nTourist candidates: {con.execute("SELECT COUNT(*) FROM main.dim_candidates WHERE is_tourist_candidate = true").fetchone()[0]}')
print(f'Party switchers (Chheparo): {con.execute("SELECT COUNT(*) FROM main.dim_candidates WHERE is_party_switcher = true").fetchone()[0]}')
print(f'\nCandidate types:')
print(con.execute("SELECT candidate_type, COUNT(*) as count FROM main.dim_candidates GROUP BY candidate_type ORDER BY count DESC").df())
print(f'\nSample enriched data:')
print(con.execute("SELECT candidate_name, district_name, citizenship_district, is_tourist_candidate, candidate_type, last_election_result FROM main.dim_candidates WHERE last_election_vote_count IS NOT NULL LIMIT 5").df())

con.close()
