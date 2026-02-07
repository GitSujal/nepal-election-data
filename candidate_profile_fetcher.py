"""
Candidate Profile Fetcher

This module fetches and enriches candidate profiles by calling Gemini Pro with a system prompt.
It includes:
- Pydantic models to validate the LLM response
- A function to loop through candidates and fetch their profiles
- Caching logic to skip already-processed candidates
"""

import json
import os
from pathlib import Path
from typing import Optional, List
from datetime import datetime

import google.genai as genai
from google.genai import types
from pydantic import BaseModel, Field, field_validator


# ============================================================================
# PYDANTIC MODELS FOR VALIDATION
# ============================================================================

class ElectionHistoryEvent(BaseModel):
    """Election history entry for a candidate"""
    year: str = Field(description="Election year in BS (e.g., '२०७४')")
    position: str = Field(description="Position contested (Nepali)")
    district: str = Field(description="District (Nepali)")
    constituency: str = Field(description="Constituency (Nepali)")
    result: str = Field(description="Result: 'विजयी' / 'पराजित' / 'N/A'")
    party: str = Field(description="Party affiliation at that time (Nepali)")


class PoliticalHistoryEvent(BaseModel):
    """Political history event entry"""
    event: str = Field(description="Short event title (Nepali)")
    date: str = Field(description="Date in YYYY-MM-DD format (BS)")
    details: str = Field(description="Factual summary (2-3 sentences in Nepali)")
    link_to_source: str = Field(description="Direct URL to reliable news source")
    event_type: str = Field(
        description="Select ONE: 'ELECTION_WIN', 'ELECTION_LOSS', 'MINISTERIAL_APPT', "
                    "'PARTY_SWITCH', 'SCANDAL_CORRUPTION', 'COURT_CASE', 'MAJOR_ACHIEVEMENT', "
                    "'CONTROVERSIAL_STATEMENT', 'RESIGNATION', 'OTHER'"
    )
    event_category: str = Field(description="Select ONE: 'GOOD', 'BAD', 'NEUTRAL'")


class CandidateProfileResponse(BaseModel):
    """
    Pydantic model for validating the LLM response.
    Matches the Target JSON Schema from the system prompt.
    """
    candidate_id: int = Field(description="Candidate ID (copied from source)")
    candidate_name: str = Field(description="Full name in Nepali")
    candidate_party: str = Field(description="Current political party (Nepali)")
    candidate_party_logo: Optional[str] = Field(
        default="",
        description="URL of official party logo or empty string"
    )
    candidates_current_position: Optional[str] = Field(
        default="",
        description="Current public/state role in Nepali or empty string"
    )
    candidates_current_position_in_party: Optional[str] = Field(
        default="",
        description="Current rank within party in Nepali or empty string"
    )
    candidate_picture: Optional[str] = Field(
        default="",
        description="High-quality photo URL"
    )
    election_history: List[ElectionHistoryEvent] = Field(
        default_factory=list,
        description="Election history sorted oldest to newest"
    )
    political_history: List[PoliticalHistoryEvent] = Field(
        default_factory=list,
        description="Political history sorted newest to oldest (max 35 events)"
    )
    analysis: str = Field(
        description="Executive summary in Nepali (5-8 sentences)"
    )
    overall_approval_rating: int = Field(
        ge=0,
        le=100,
        description="Integer rating 0-100 based on wins vs. scandals"
    )

    @field_validator("political_history")
    def validate_political_history_limit(cls, v):
        """Ensure max 35 political history events"""
        if len(v) > 35:
            return v[:35]
        return v

    class ConfigDict:
        """Pydantic config"""
        extra = "forbid"  # Raise error on unexpected fields


# ============================================================================
# CANDIDATE PROFILE FETCHER FUNCTION
# ============================================================================

def fetch_candidate_profiles(
    candidates_json_path: str = "public/data/dim_current_fptp_candidates.json",
    output_dir: str = "data/candidates_history",
    system_prompt_path: str = "candidate_profile_researcher.md",
    api_key: Optional[str] = None,
    model_name: str = "gemini-3-flash-preview",
    limit: Optional[int] = None,
    skip_existing: bool = True,
) -> dict:
    """
    Fetch candidate profiles from Gemini using system prompt.

    Args:
        candidates_json_path: Path to the candidates JSON file
        output_dir: Directory to save candidate profile JSONs
        system_prompt_path: Path to the system prompt markdown file
        api_key: Google API key (uses GOOGLE_API_KEY env var if not provided)
        model_name: Model name to use (default: gemini-3-flash-preview)
        limit: Limit number of candidates to process (None = process all)
        skip_existing: Skip candidates that already have saved profiles

    Returns:
        Dictionary with statistics about the processing:
        {
            "total_candidates": int,
            "processed": int,
            "skipped": int,
            "successful": int,
            "failed": int,
            "errors": List[dict]
        }
    """
    # Setup
    api_key = api_key or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "Google API key not provided. "
            "Set GOOGLE_API_KEY environment variable or pass api_key parameter."
        )

    client = genai.Client(api_key=api_key)

    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Load candidates JSON
    if not os.path.exists(candidates_json_path):
        raise FileNotFoundError(f"Candidates file not found: {candidates_json_path}")

    with open(candidates_json_path, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    # Load system prompt
    if not os.path.exists(system_prompt_path):
        raise FileNotFoundError(f"System prompt file not found: {system_prompt_path}")

    with open(system_prompt_path, "r", encoding="utf-8") as f:
        system_prompt_content = f.read()

    # Extract system prompt (remove markdown code fence if present)
    system_prompt = extract_system_prompt(system_prompt_content)

    # Stats
    stats = {
        "total_candidates": 0,
        "processed": 0,
        "skipped": 0,
        "successful": 0,
        "failed": 0,
        "errors": [],
    }

    print(f"Starting candidate profile fetch for {len(candidates)} candidates...")
    print(f"Using model: {model_name}")
    print(f"Output directory: {output_dir}")
    print(f"Skip existing: {skip_existing}\n")

    # Process each candidate
    for idx, candidate in enumerate(candidates):
        if limit and idx >= limit:
            print(f"\nReached limit of {limit} candidates. Stopping.")
            break

        candidate_id = candidate.get("candidate_id")
        candidate_name = candidate.get("candidate_name", "Unknown")
        stats["total_candidates"] += 1

        output_path = Path(output_dir) / f"{candidate_id}.json"

        # Check if already exists
        if skip_existing and output_path.exists():
            print(f"  [{idx + 1}] SKIP (exists): {candidate_id} - {candidate_name}")
            stats["skipped"] += 1
            continue

        print(f"  [{idx + 1}] PROCESSING: {candidate_id} - {candidate_name}")

        try:
            # Call Gemini API (returns already-validated CandidateProfileResponse)
            validated_profile = call_gemini_api(
                client=client,
                candidate=candidate,
                system_prompt=system_prompt,
                model_name=model_name,
            )

            # Save to file (validated_profile is already a Pydantic model)
            with open(output_path, "w", encoding="utf-8") as f:
                # Convert Pydantic model to dict and save as JSON
                profile_dict = validated_profile.model_dump()
                json.dump(
                    profile_dict,
                    f,
                    ensure_ascii=False,
                    indent=2,
                )

            print(f"        ✓ Saved successfully")
            stats["successful"] += 1
            stats["processed"] += 1

        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON from LLM for candidate {candidate_id}: {str(e)}"
            print(f"        ✗ JSON Error: {error_msg}")
            stats["failed"] += 1
            stats["processed"] += 1
            stats["errors"].append({"candidate_id": candidate_id, "error": error_msg})

        except ValueError as e:
            error_msg = (
                f"Validation error for candidate {candidate_id}: {str(e)}"
            )
            print(f"        ✗ Validation Error: {error_msg}")
            stats["failed"] += 1
            stats["processed"] += 1
            stats["errors"].append({"candidate_id": candidate_id, "error": error_msg})

        except Exception as e:
            error_msg = f"Error processing candidate {candidate_id}: {type(e).__name__}: {str(e)}"
            print(f"        ✗ Error: {error_msg}")
            stats["failed"] += 1
            stats["processed"] += 1
            stats["errors"].append({"candidate_id": candidate_id, "error": error_msg})

    # Print summary
    print("\n" + "=" * 70)
    print("PROCESSING SUMMARY")
    print("=" * 70)
    print(f"Total candidates:    {stats['total_candidates']}")
    print(f"Processed:           {stats['processed']}")
    print(f"Skipped (existing):  {stats['skipped']}")
    print(f"Successful:          {stats['successful']}")
    print(f"Failed:              {stats['failed']}")

    if stats["errors"]:
        print(f"\nErrors encountered ({len(stats['errors'])}):")
        for error in stats["errors"][:10]:  # Show first 10
            print(f"  - Candidate {error['candidate_id']}: {error['error']}")
        if len(stats["errors"]) > 10:
            print(f"  ... and {len(stats['errors']) - 10} more")

    return stats


def enrich_profile_with_grounding_metadata(
    profile: CandidateProfileResponse,
    grounding_metadata: dict,
) -> CandidateProfileResponse:
    """
    Enrich candidate profile with source URLs from grounding metadata.
    
    Extracts web source URLs from groundingChunks and updates link_to_source
    fields in political_history when they are empty or placeholder values.

    Args:
        profile: CandidateProfileResponse object
        grounding_metadata: Grounding metadata dict with groundingChunks

    Returns:
        Updated CandidateProfileResponse with enriched source URLs
    """
    try:
        # Extract grounding chunks with web URIs
        grounding_chunks = grounding_metadata.get('groundingChunks', [])
        
        if not grounding_chunks:
            return profile

        # Collect available source URLs
        source_urls = []
        for chunk in grounding_chunks:
            if 'web' in chunk and 'uri' in chunk['web']:
                source_urls.append(chunk['web']['uri'])

        if not source_urls:
            return profile

        # Enrich political_history events with source URLs
        if profile.political_history:
            for event in profile.political_history:
                # If link_to_source is empty or a placeholder, populate from sources
                if not event.link_to_source or event.link_to_source == "":
                    # Assign sources in round-robin fashion
                    idx = profile.political_history.index(event) % len(source_urls)
                    event.link_to_source = source_urls[idx]

        # Convert to dict and back to Pydantic model to ensure validation
        profile_dict = profile.model_dump()
        return CandidateProfileResponse(**profile_dict)

    except Exception as e:
        # If grounding enrichment fails, return original profile
        print(f"Warning: Failed to enrich profile with grounding metadata: {e}")
        return profile


def call_gemini_api(
    client,
    candidate: dict,
    system_prompt: str,
    model_name: str = "gemini-3-flash-preview",
) -> CandidateProfileResponse:
    """
    Call Gemini API with system prompt, Google Search grounding, and schema enforcement.
    
    Uses:
    - Google Search grounding to ensure factual information only
    - Grounding metadata to extract real source URLs
    - Gemini's schema enforcement to ensure the response matches CandidateProfileResponse
    - System prompt for candidate profile enrichment

    Args:
        client: Google GenAI client instance
        candidate: Candidate dictionary from the JSON file
        system_prompt: System prompt string
        model_name: Model name to use (default: "gemini-3-flash-preview")

    Returns:
        CandidateProfileResponse object (already validated by Gemini)
        with link_to_source fields populated from grounding metadata

    Raises:
        ValueError: If the API returns an error or invalid response
    """
    # Prepare candidate data (source JSON)
    candidate_data = {
        "candidate_id": candidate.get("candidate_id"),
        "candidate_name": candidate.get("candidate_name"),
        "father_name": candidate.get("father_name"),
        "spouse_name": candidate.get("spouse_name"),
        "district_name": candidate.get("district_name"),
        "prev_election_district": candidate.get("prev_election_district"),
        "prev_election_party": candidate.get("prev_election_party"),
        "prev_election_result": candidate.get("prev_election_result"),
        "prev_election_votes": candidate.get("prev_election_votes"),
        "prev_2074_election_result": candidate.get("prev_2074_election_result"),
        "prev_2074_election_votes": candidate.get("prev_2074_election_votes"),
        "political_party_name": candidate.get("political_party_name"),
        "party_previous_names": candidate.get("party_previous_names", []),
        "candidate_image_url": candidate.get("candidate_image_url", ""),
        "is_vaguwa": candidate.get("is_vaguwa", False),
        "is_tourist_candidate": candidate.get("is_tourist_candidate", False),
    }

    # Create message with system prompt and candidate data
    user_message = f"""
Here is the SOURCE JSON for the candidate:

{json.dumps(candidate_data, ensure_ascii=False, indent=2)}

Please research and provide the enriched PROFILE JSON following the schema specified in the system prompt.
Use grounding metadata to populate link_to_source fields with actual web source URLs when available.
"""

    # Create Google Search grounding tool
    grounding_tool = types.Tool(
        google_search=types.GoogleSearch()
    )

    # Create config with schema enforcement and grounding
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=CandidateProfileResponse,
        tools=[grounding_tool],  # Enable Google Search grounding
        system_instruction=system_prompt,
    )

    # Call Gemini API with schema enforcement and grounding
    response = client.models.generate_content(
        model=model_name,
        contents=[
            {
                "role": "user",
                "parts": [{"text": user_message}],
            }
        ],
        config=config,
    )

    # Extract parsed response
    if not response.parsed:
        raise ValueError("Empty response from Gemini API")

    # response.parsed is already a CandidateProfileResponse instance
    validated_profile = response.parsed

    # Extract grounding metadata and enrich response with source URLs
    if hasattr(response, 'grounding_metadata') and response.grounding_metadata:
        validated_profile = enrich_profile_with_grounding_metadata(
            validated_profile,
            response.grounding_metadata
        )

    return validated_profile


def extract_system_prompt(markdown_content: str) -> str:
    """
    Extract system prompt from markdown file.
    Handles various formats of markdown files containing the prompt.

    Args:
        markdown_content: Content of the markdown file

    Returns:
        Cleaned system prompt string
    """
    # Remove markdown frontmatter if present
    if markdown_content.startswith("---"):
        parts = markdown_content.split("---", 2)
        if len(parts) >= 3:
            markdown_content = parts[2]

    # Remove markdown headers and extra formatting
    lines = markdown_content.split("\n")
    prompt_lines = []
    in_code_block = False

    for line in lines:
        # Skip markdown headers and decorative lines
        if line.startswith("#"):
            continue
        # Track code blocks
        if line.strip().startswith("```"):
            in_code_block = not in_code_block
            continue
        # Skip empty lines at the start
        if not prompt_lines and not line.strip():
            continue
        # Keep content
        prompt_lines.append(line)

    # Join and clean
    system_prompt = "\n".join(prompt_lines).strip()

    return system_prompt


# ============================================================================
# CLI ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="Fetch and enrich candidate profiles using Gemini API.")
    parser.add_argument("--limit", type=int, help="Limit the number of candidates to process")
    parser.add_argument("--no-skip", action="store_true", help="Do not skip candidates that already have saved profiles")

    argparser = parser.parse_args()
    # Parse command line arguments
    limit = argparser.limit
    skip_existing = not argparser.no_skip

    # Run the fetcher
    try:
        stats = fetch_candidate_profiles(
            limit=limit,
            skip_existing=skip_existing,
        )
        sys.exit(0 if stats["failed"] == 0 else 1)
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)
