#!/usr/bin/env python3
"""Export dim tables to JSON files for frontend use."""

import json
import sys
import os
import duckdb

SOURCE_DB = "/home/sujal/personal/nepal-election-data/election/election.db"
OUTPUT_DIR = "/home/sujal/personal/nepal-election-data/public/data"

def export_table_to_json(db_path: str, table_name: str, output_file: str):
    """Export a DuckDB table to JSON file."""
    try:
        con = duckdb.connect(db_path, read_only=True)

        # Read table and convert to list of dicts
        result = con.execute(f"SELECT * FROM {table_name}").fetchall()
        columns = [desc[0] for desc in con.description]

        data = [dict(zip(columns, row)) for row in result]

        # Write to JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        con.close()
        print(f"✓ Exported {len(data)} rows from {table_name} to {output_file}")
        return len(data)
    except Exception as e:
        print(f"✗ Error exporting {table_name}: {e}")
        return 0

def main():
    """Export all required tables."""
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}\n")

    # Tables to export
    tables = [
        'dim_current_fptp_candidates',
        'dim_parties',
        'dim_constituency_profile',
        'political_party_symbols',
    ]

    total_rows = 0
    for table in tables:
        output_file = os.path.join(OUTPUT_DIR, f"{table}.json")
        rows = export_table_to_json(SOURCE_DB, table, output_file)
        total_rows += rows

    print(f"\nTotal: {total_rows} rows exported")
    print(f"JSON files ready in: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()

