"""
Load raw JSON data from the data/ directory into DuckDB.
Creates an election.db database with tables for each JSON file.
"""
import duckdb
from pathlib import Path

# Define the database path
DB_PATH = "election/election.db"

# Define the JSON files to load
JSON_FILES = {
    "constituency": "data/constituency.json",
    "current_candidates": "data/current_candidates.json",
    "districts": "data/districts.json",
    "pratakhya_election_result": "data/pratakhya_election_result.json",
    "samanupatik_election_results": "data/samanupatik_election_results.json",
    "states": "data/states.json",
}

def main():
    """Load all JSON files into DuckDB."""
    print(f"Initializing DuckDB database: {DB_PATH}")
    
    # Connect to DuckDB (creates the database if it doesn't exist)
    con = duckdb.connect(DB_PATH)
    
    # Load each JSON file into a table
    for table_name, json_path in JSON_FILES.items():
        print(f"\nLoading {json_path} into table '{table_name}'...")
        
        # Check if file exists
        if not Path(json_path).exists():
            print(f"  WARNING: File {json_path} not found, skipping...")
            continue
        
        # Create table from JSON file
        con.execute(f"""
            CREATE OR REPLACE TABLE {table_name} AS 
            SELECT * FROM read_json_auto('{json_path}')
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
