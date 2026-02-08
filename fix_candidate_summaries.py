"""
Fix Candidate Summaries

Finds candidates who did NOT participate in the 2079 FPTP election but whose
Gemini-generated analysis/summary incorrectly mentions 2079 election candidacy.
Sends batches to Gemini to fix the summaries, then updates the candidate history files.
"""

import asyncio
import json
import os
import re
import sys
from pathlib import Path
from typing import List

import google.genai as genai
from google.genai import types
from pydantic import BaseModel, Field


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class CandidateSummaryEntry(BaseModel):
    """A single candidate entry with ID and summary to fix."""
    candidate_id: int = Field(description="Candidate ID")
    summary: str = Field(description="The corrected summary text")


class CandidateSummaryBatch(BaseModel):
    """Batch of candidate summaries - used for both request and response."""
    candidates: List[CandidateSummaryEntry] = Field(
        description="List of candidate summaries"
    )


# ============================================================================
# SYSTEM PROMPT
# ============================================================================

SYSTEM_PROMPT = (
    "Fix the summary for these candidates. These candidates have not contested "
    "in past 2079 election but wrongly have mention of 2079 election in their "
    "summary. Remove that part and that part only from the summary and reproduce "
    "the correct summary. Keep all other parts intact."
)


# ============================================================================
# STEP 1: FIND CANDIDATES NEEDING FIXES
# ============================================================================

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

    # Relaxed regex: matches २०७९, 2079, ०७९
    pattern = re.compile(r"२०७९|2079|०७९")

    matches = []
    for cid in no_2079_ids:
        h = history_by_id.get(cid)
        if h and h.get("analysis") and pattern.search(h["analysis"]):
            matches.append({
                "candidate_id": h["candidate_id"],
                "summary": h["analysis"],
            })

    # Sort by candidate_id for deterministic ordering
    matches.sort(key=lambda x: x["candidate_id"])
    return matches


# ============================================================================
# STEP 2: CALL GEMINI TO FIX SUMMARIES
# ============================================================================

async def fix_batch(
    client,
    batch: list[dict],
    model_name: str,
    semaphore: asyncio.Semaphore,
    batch_num: int,
    total_batches: int,
) -> list[dict]:
    """Fix a single batch of candidate summaries via Gemini."""
    async with semaphore:
        print(f"  Batch {batch_num}/{total_batches} ({len(batch)} candidates)...")

        request_batch = CandidateSummaryBatch(
            candidates=[
                CandidateSummaryEntry(
                    candidate_id=c["candidate_id"],
                    summary=c["summary"],
                )
                for c in batch
            ]
        )

        user_message = json.dumps(
            request_batch.model_dump(), ensure_ascii=False, indent=2
        )

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CandidateSummaryBatch,
            system_instruction=SYSTEM_PROMPT,
        )

        try:
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=[{"role": "user", "parts": [{"text": user_message}]}],
                config=config,
            )

            if not response.parsed:
                print(f"    Batch {batch_num}: Empty response, retrying...")
                raise ValueError("Empty response from Gemini API")

            result: CandidateSummaryBatch = response.parsed
            print(f"    Batch {batch_num}: OK ({len(result.candidates)} candidates)")
            return [c.model_dump() for c in result.candidates]

        except Exception as e:
            print(f"    Batch {batch_num}: FAILED - {type(e).__name__}: {e}")
            # Return originals on failure so we don't lose data
            return batch


async def fix_all_summaries(
    candidates: list[dict],
    batch_size: int = 20,
    concurrency: int = 10,
    model_name: str = "gemini-2.5-flash",
    api_key: str | None = None,
) -> list[dict]:
    """Fix all candidate summaries in batches."""
    api_key = api_key or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "Google API key not provided. "
            "Set GOOGLE_API_KEY environment variable or pass api_key parameter."
        )

    client = genai.Client(api_key=api_key)
    semaphore = asyncio.Semaphore(concurrency)

    # Split into batches
    batches = [
        candidates[i : i + batch_size]
        for i in range(0, len(candidates), batch_size)
    ]
    total_batches = len(batches)

    print(f"\nFixing {len(candidates)} candidates in {total_batches} batches")
    print(f"  Batch size: {batch_size}")
    print(f"  Concurrency: {concurrency}")
    print(f"  Model: {model_name}\n")

    tasks = [
        fix_batch(client, batch, model_name, semaphore, i + 1, total_batches)
        for i, batch in enumerate(batches)
    ]

    results = await asyncio.gather(*tasks)

    # Flatten results
    fixed = []
    for batch_result in results:
        fixed.extend(batch_result)

    return fixed


# ============================================================================
# STEP 3: UPDATE CANDIDATE HISTORY FILES
# ============================================================================

def update_history_files(
    fixed_candidates: list[dict],
    history_dir: str = "data/candidates_history",
):
    """Update individual candidate history JSON files with fixed summaries."""
    updated = 0
    not_found = 0

    for candidate in fixed_candidates:
        cid = candidate["candidate_id"]
        file_path = Path(history_dir) / f"{cid}.json"

        if not file_path.exists():
            not_found += 1
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        data["analysis"] = candidate["summary"]

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        updated += 1

    print(f"\nUpdated {updated} candidate history files")
    if not_found:
        print(f"  Not found: {not_found} files")


# ============================================================================
# MAIN
# ============================================================================

async def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Fix candidate summaries that incorrectly mention 2079 election"
    )
    parser.add_argument(
        "--find-only",
        action="store_true",
        help="Only find candidates and save to candidates_needs_fixing.json (no LLM calls)",
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Run Gemini to fix summaries and update history files",
    )
    parser.add_argument(
        "--batch-size", type=int, default=20, help="Batch size (default: 20)"
    )
    parser.add_argument(
        "--concurrency", type=int, default=10, help="Concurrency (default: 10)"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gemini-3-flash-preview",
        help="Gemini model name (default: gemini-3-flash-preview)",
    )

    args = parser.parse_args()

    # Step 1: Find candidates
    print("Finding candidates with incorrect 2079 mentions in summaries...")
    candidates = find_candidates_needing_fixes()
    print(f"Found {len(candidates)} candidates needing fixes")

    # Save to candidates_needs_fixing.json
    output_path = "candidates_needs_fixing.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)
    print(f"Saved to {output_path}")

    if args.find_only:
        print("\n--find-only mode: Stopping here.")
        return

    if not args.fix:
        print("\nUse --fix to run Gemini and update history files.")
        return

    # Step 2: Fix summaries via Gemini
    fixed = await fix_all_summaries(
        candidates,
        batch_size=args.batch_size,
        concurrency=args.concurrency,
        model_name=args.model,
    )

    # Save fixed results
    fixed_output_path = "candidates_fixed_summaries.json"
    with open(fixed_output_path, "w", encoding="utf-8") as f:
        json.dump(fixed, f, ensure_ascii=False, indent=2)
    print(f"\nSaved fixed summaries to {fixed_output_path}")

    # Step 3: Update individual history files
    update_history_files(fixed)

    print("\nDone! Run the following to rebuild exported data:")
    print("  cd election && uv run dbt build")
    print("  uv run export_to_json.py")


if __name__ == "__main__":
    asyncio.run(main())
