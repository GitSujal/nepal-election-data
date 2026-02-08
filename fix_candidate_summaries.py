"""
Fix Candidate Summaries (Regex-based)

Finds candidates who did NOT participate in the 2079 FPTP election but whose
Gemini-generated analysis/summary incorrectly mentions 2079 election candidacy.
Uses regex to remove sentences containing 2079 references from the analysis field.
"""

import json
import re
from pathlib import Path

# Regex pattern to detect 2079 references (Nepali digits, ASCII digits, short form)
PATTERN_2079 = re.compile(r"२०७९|2079|०७९")


def find_candidates_needing_fixes(
    fptp_path: str = "public/data/dim_current_fptp_candidates.json",
    history_path: str = "public/data/candidates_political_history.json",
) -> list[dict]:
    """
    Find candidates who didn't participate in 2079 FPTP but whose analysis
    mentions the 2079 election.
    """
    with open(fptp_path, "r", encoding="utf-8") as f:
        fptp = json.load(f)
    with open(history_path, "r", encoding="utf-8") as f:
        history = json.load(f)

    # Candidates without 2079 FPTP participation
    no_2079_ids = set(
        c["candidate_id"] for c in fptp if not c.get("prev_election_result")
    )

    # Build history lookup
    history_by_id = {h["candidate_id"]: h for h in history}

    matches = []
    for cid in no_2079_ids:
        h = history_by_id.get(cid)
        if h and h.get("analysis") and PATTERN_2079.search(h["analysis"]):
            matches.append(
                {
                    "candidate_id": h["candidate_id"],
                    "analysis": h["analysis"],
                }
            )

    matches.sort(key=lambda x: x["candidate_id"])
    return matches


def remove_2079_sentences(text: str) -> str:
    """
    Remove sentences containing 2079 references from Nepali text.

    Splits on '।' (Devanagari danda) which is the standard Nepali sentence
    terminator. Does NOT split on '.' since periods in Nepali text are almost
    always abbreviations (नं., डा., वि.क., etc.) rather than sentence endings.
    """
    parts = text.split("।")

    # Filter out parts that contain 2079 references
    filtered = [p for p in parts if not PATTERN_2079.search(p)]

    # Rejoin with danda
    result = "।".join(filtered)

    # Clean up extra whitespace
    result = re.sub(r"\s+", " ", result).strip()

    # Remove leading danda if the first sentence was removed
    result = result.lstrip("।").strip()

    return result


def update_history_files(
    candidates: list[dict],
    history_dir: str = "data/candidates_history",
) -> tuple[int, int, int]:
    """Update individual candidate history JSON files with fixed analyses."""
    updated = 0
    not_found = 0
    skipped = 0

    for candidate in candidates:
        cid = candidate["candidate_id"]
        file_path = Path(history_dir) / f"{cid}.json"

        if not file_path.exists():
            not_found += 1
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        original = data.get("analysis", "")
        fixed = remove_2079_sentences(original)

        if fixed == original:
            skipped += 1
            continue

        data["analysis"] = fixed

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        updated += 1

    return updated, not_found, skipped


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Fix candidate summaries that incorrectly mention 2079 election"
    )
    parser.add_argument(
        "--find-only",
        action="store_true",
        help="Only find candidates needing fixes (no file changes)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would change without writing files",
    )
    args = parser.parse_args()

    print("Finding candidates with incorrect 2079 mentions in summaries...")
    candidates = find_candidates_needing_fixes()
    print(f"Found {len(candidates)} candidates needing fixes\n")

    if args.find_only:
        for c in candidates[:10]:
            print(f"  {c['candidate_id']}: {c['analysis'][:100]}...")
        if len(candidates) > 10:
            print(f"  ... and {len(candidates) - 10} more")
        return

    if args.dry_run:
        for c in candidates[:5]:
            original = c["analysis"]
            fixed = remove_2079_sentences(original)
            print(f"=== {c['candidate_id']} ===")
            print(f"BEFORE: {original[:200]}...")
            print(f"AFTER:  {fixed[:200]}...")
            print()
        return

    print("Updating candidate history files...")
    updated, not_found, skipped = update_history_files(candidates)

    print(f"\nResults:")
    print(f"  Updated: {updated}")
    print(f"  Not found: {not_found}")
    print(f"  Skipped (no change): {skipped}")
    print(f"\nDone! Run the following to rebuild:")
    print(f"  cd election && uv run dbt build")
    print(f"  npm run prepare-data")


if __name__ == "__main__":
    main()
