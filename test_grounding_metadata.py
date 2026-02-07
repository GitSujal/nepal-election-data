"""
Test grounding metadata enrichment for candidate profiles.

Demonstrates how grounding metadata from Google Search is extracted
and used to populate source URLs in candidate profiles.
"""

from candidate_profile_fetcher import (
    CandidateProfileResponse,
    enrich_profile_with_grounding_metadata,
    PoliticalHistoryEvent,
)


def test_grounding_metadata_enrichment():
    """Test that grounding metadata enriches profile with source URLs"""
    print("=" * 70)
    print("GROUNDING METADATA ENRICHMENT TEST")
    print("=" * 70)

    # Create sample profile without sources
    print("\n1. Creating sample profile with empty source URLs...")
    profile = CandidateProfileResponse(
        candidate_id=341116,
        candidate_name="देवेन्द्र पौडेल",
        candidate_party="नेपाली कम्युनिष्ट पार्टी",
        analysis="Sample analysis",
        overall_approval_rating=75,
        political_history=[
            PoliticalHistoryEvent(
                event="नवलपरासीमा रुकेर बस्न थाल्न",
                date="2024-05-15",
                details="देवेन्द्र पौडेल आफ्नो पूर्व जिल्ला बागलुङबाट नवलपरासीमा स्थानान्तरण गरे।",
                link_to_source="",  # EMPTY - will be populated
                event_type="PARTY_SWITCH",
                event_category="NEUTRAL"
            ),
            PoliticalHistoryEvent(
                event="मन्त्रीमा नियुक्त",
                date="2023-12-01",
                details="देवेन्द्र पौडेल शिक्षा मन्त्रीमा नियुक्त हुए।",
                link_to_source="",  # EMPTY - will be populated
                event_type="MINISTERIAL_APPT",
                event_category="GOOD"
            ),
        ],
    )

    print(f"   ✓ Created profile with {len(profile.political_history)} events")
    print(f"   ✓ Event 1 source: '{profile.political_history[0].link_to_source}'")
    print(f"   ✓ Event 2 source: '{profile.political_history[1].link_to_source}'")

    # Create sample grounding metadata (from Google Search)
    print("\n2. Simulating grounding metadata from Google Search...")
    grounding_metadata = {
        "webSearchQueries": [
            "देवेन्द्र पौडेल नवलपरासी",
            "देवेन्द्र पौडेल शिक्षा मन्त्री",
        ],
        "groundingChunks": [
            {
                "web": {
                    "uri": "https://nepalnews.com/article/2024/05/15/candidate-transfer",
                    "title": "nepalnews.com - Candidate Transfer News"
                }
            },
            {
                "web": {
                    "uri": "https://parliament.gov.np/minister/education/2023/devendrapoudel",
                    "title": "parliament.gov.np - Minister Appointments"
                }
            },
            {
                "web": {
                    "uri": "https://bbcnews.com/categories/nepal-politics",
                    "title": "BBC News - Nepal Politics"
                }
            },
        ],
        "groundingSupports": [
            {
                "segment": {
                    "startIndex": 0,
                    "endIndex": 85,
                    "text": "Candidate transfer news..."
                },
                "groundingChunkIndices": [0]
            }
        ]
    }

    print(f"   ✓ Grounding metadata has {len(grounding_metadata['groundingChunks'])} source URLs:")
    for i, chunk in enumerate(grounding_metadata['groundingChunks']):
        print(f"      [{i}] {chunk['web']['uri']}")

    # Enrich profile with grounding metadata
    print("\n3. Enriching profile with grounding metadata...")
    enriched_profile = enrich_profile_with_grounding_metadata(
        profile,
        grounding_metadata
    )
    print("   ✓ Enrichment completed")

    # Verify sources were populated
    print("\n4. Verifying source URLs were populated...")
    for i, event in enumerate(enriched_profile.political_history):
        print(f"   Event {i+1}:")
        print(f"      Title: {event.event}")
        print(f"      Source: {event.link_to_source}")
        is_populated = bool(event.link_to_source) and event.link_to_source != ""
        status = "✓" if is_populated else "✗"
        print(f"      Status: {status} {'(Populated)' if is_populated else '(Empty)'}")

    # Verify all sources are populated
    all_populated = all(
        bool(event.link_to_source) for event in enriched_profile.political_history
    )

    print("\n" + "=" * 70)
    if all_populated:
        print("✅ GROUNDING METADATA ENRICHMENT SUCCESSFUL")
        print("=" * 70)
        print("\nSummary:")
        print(f"  ✓ Profile enriched: {len(enriched_profile.political_history)} events")
        print(f"  ✓ All sources populated: Yes")
        print(f"  ✓ Source URLs extracted from grounding metadata: {len(grounding_metadata['groundingChunks'])}")
        print("\nBenefits:")
        print("  ✓ link_to_source fields populated from actual Google Search results")
        print("  ✓ Facts are traceable to verified web sources")
        print("  ✓ No manual URL entry needed")
        print("  ✓ Automatic attribution from grounding metadata")
        return True
    else:
        print("❌ GROUNDING METADATA ENRICHMENT FAILED")
        print("=" * 70)
        print("Some events still have empty source URLs")
        return False


if __name__ == "__main__":
    success = test_grounding_metadata_enrichment()
    exit(0 if success else 1)
