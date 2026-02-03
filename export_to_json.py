#!/usr/bin/env python3
"""Export dim tables to JSON files for frontend use."""

import json
import sys
import os
import duckdb
import numpy as np
import pandas as pd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DB = os.path.join(SCRIPT_DIR, "election", "election.db")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "public", "data")


def convert_value(val):
    """Convert a value to JSON-serializable format."""
    # Handle numpy arrays
    if isinstance(val, np.ndarray):
        return val.tolist()
    # Handle pandas NA
    if pd.isna(val):
        return None
    # Handle numpy types
    if isinstance(val, (np.integer, np.int64, np.int32)):
        return int(val)
    if isinstance(val, (np.floating, np.float64, np.float32)):
        return None if np.isnan(val) else float(val)
    if isinstance(val, np.bool_):
        return bool(val)
    return val


def export_table_to_json(db_path: str, table_name: str, output_file: str):
    """Export a DuckDB table to JSON file."""
    try:
        con = duckdb.connect(db_path, read_only=True)

        # Read table and convert to pandas DataFrame
        df = con.execute(f"SELECT * FROM {table_name}").df()

        # Convert to records with proper type handling
        data = []
        for _, row in df.iterrows():
            record = {}
            for col in df.columns:
                record[col] = convert_value(row[col])
            data.append(record)

        # Write to JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        con.close()
        print(f"✓ Exported {len(data)} rows from {table_name} to {output_file}")
        return len(data)
    except Exception as e:
        print(f"✗ Error exporting {table_name}: {e}")
        import traceback
        traceback.print_exc()
        return 0

def main():
    """Export all required tables."""
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}\n")

    # Tables to export
    tables = [
        'dim_current_fptp_candidates',
        'dim_current_proportional_candidates',
        'dim_parties',
        'dim_constituency_profile',
        'dim_parties_profile',
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

