"""
Load raw JSON and CSV data from the data/ directory into DuckDB.
Creates an election.db database with tables for each data file.
"""
import duckdb
from pathlib import Path

# Define the database path
DB_PATH = "election/election.db"

# Define the data files to load (supports .json and .csv)
DATA_FILES = {
    "states": "data/states.json",
    "districts": "data/districts.json",
    "constituency": "data/constituency.json",
    "current_first_past_the_post_candidates": "data/current_first_past_the_post_candidates.json",
    "current_proportional_election_candidates": "data/current_proportional_election_candidates.csv",
    "past_2079_first_past_the_post_election_result": "data/past_2079_first_past_the_post_election_result.json",
    "past_2079_proportional_election_result": "data/past_2079_proportional_election_result.json",
    "parliament_members": "data/parliament_members.json",
    "past_2074_first_past_the_post_election_result": "data/2074_first_past_the_post_election_result.json",
    "past_2074_proportional_election_result": "data/2074_proportional_election_result.json",
    "political_party_symbols": "data/political_party_symbols.json"
}

def main():
    """Load all data files into DuckDB."""
    print(f"Initializing DuckDB database: {DB_PATH}")

    # Connect to DuckDB (creates the database if it doesn't exist)
    con = duckdb.connect(DB_PATH)

    # Load each data file into a table
    for table_name, file_path in DATA_FILES.items():
        print(f"\nLoading {file_path} into table '{table_name}'...")

        # Check if file exists
        if not Path(file_path).exists():
            print(f"  WARNING: File {file_path} not found, skipping...")
            continue

        # Pick the right reader based on file extension
        if file_path.endswith(".csv"):
            read_func = f"read_csv_auto('{file_path}')"
        else:
            read_func = f"read_json_auto('{file_path}')"

        # Create table from data file
        con.execute(f"""
            CREATE OR REPLACE TABLE {table_name} AS
            SELECT * FROM {read_func}
        """)
        
        # Get row count
        row_count = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        print(f"  ✓ Loaded {row_count:,} rows into '{table_name}'")
    
    # Display summary
    print("\n" + "="*60)
    print("DATABASE SUMMARY")
    print("="*60)
    
    tables = con.execute("SHOW TABLES").fetchall()
    for (table_name,) in tables:
        row_count = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        print(f"  {table_name}: {row_count:,} rows")
    
    print("\n✓ Data loading complete!")
    print(f"✓ Database saved to: {DB_PATH}")
    
    # Close connection
    con.close()

if __name__ == "__main__":
    main()
