import duckdb
import shutil
import os
import sys

# Configuration
SOURCE_DB = "/home/sujal/personal/nepal-election-data/election/election.db"
LEAN_DB_NAME = "election_lean.duckdb"
# Default to a 'public' directory in the root, matching common frontend patterns
TARGET_DIR = "/home/sujal/personal/nepal-election-data/public"
TARGET_PATH = os.path.join(TARGET_DIR, LEAN_DB_NAME)

def prepare_lean_db():
    if not os.path.exists(SOURCE_DB):
        print(f"Error: Source database not found at {SOURCE_DB}")
        sys.exit(1)

    print(f"Connecting to source: {SOURCE_DB}")
    
    # Create the target directory if it doesn't exist
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)
        print(f"Created target directory: {TARGET_DIR}")

    # If the lean DB already exists, remove it to start fresh
    if os.path.exists(LEAN_DB_NAME):
        os.remove(LEAN_DB_NAME)

    # Initialize the lean database
    target_con = duckdb.connect(LEAN_DB_NAME)
    
    # Attach the source database as read-only
    target_con.execute(f"ATTACH '{SOURCE_DB}' AS source (READ_ONLY)")
    
    # Get all dim_ tables
    tables = target_con.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'main' 
        AND table_name LIKE 'dim_%' 
        AND table_catalog = 'source'
    """).fetchall()
    
    if not tables:
        print("No 'dim_' tables found to extract!")
        target_con.close()
        return

    print(f"Found {len(tables)} dimension tables. Extracting...")

    for (table_name,) in tables:
        print(f"  -> Copying {table_name}...")
        # Deep copy the table into the new DB
        target_con.execute(f"CREATE TABLE main.{table_name} AS SELECT * FROM source.main.{table_name}")
    
    print("Detaching source and optimizing...")
    target_con.execute("DETACH source")
    
    # Vacuum to reclaim space and minimize file size
    target_con.execute("VACUUM")
    target_con.execute("CHECKPOINT")
    
    target_con.close()
    
    # Move to the public folder
    print(f"Moving lean database to {TARGET_PATH}")
    shutil.move(LEAN_DB_NAME, TARGET_PATH)
    
    size_mb = os.path.getsize(TARGET_PATH) / (1024 * 1024)
    print(f"Success! Lean database created: {size_mb:.2f} MB")

if __name__ == "__main__":
    prepare_lean_db()
