"""
Fetch all House of Representatives members from the Nepal Parliament API.
Saves raw JSON response and a flattened JSON for loading into DuckDB.
"""
import json
import requests
import warnings

API_URL = "https://hr.parliament.gov.np/api/v1/members"
RAW_OUTPUT = "data/parliament_members_raw.json"
OUTPUT = "data/parliament_members.json"


def fetch_members():
    """Fetch members from the Parliament API."""
    print(f"Fetching members from {API_URL}...")
    warnings.filterwarnings("ignore", message="Unverified HTTPS request")
    response = requests.get(API_URL, verify=False, timeout=30)
    response.raise_for_status()
    data = response.json()
    print(f"  Retrieved {len(data['data'])} records")
    return data["data"]


def flatten_member(member):
    """Flatten a member record for tabular storage."""
    # Get Nepali and English translations
    translations = member.get("parliament_member_translations", [])
    name_np = ""
    name_en = ""
    designation_np = ""
    designation_en = ""
    description_np = ""
    description_en = ""

    for t in translations:
        if t.get("locale") == "np":
            name_np = t.get("name", "")
            designation_np = t.get("designation", "")
            description_np = t.get("description", "")
        elif t.get("locale") == "en":
            name_en = t.get("name", "")
            designation_en = t.get("designation", "")
            description_en = t.get("description", "")

    district = member.get("district") or {}
    party = member.get("political_party") or {}
    election_type = member.get("election_type") or {}

    return {
        "member_id": member.get("id"),
        "code": member.get("code"),
        "slug": member.get("slug"),
        "parliament_type": member.get("parliament_type"),
        "member_type": member.get("member_type"),
        "status": member.get("status"),
        "gender": member.get("gender"),
        "dob": member.get("dob"),
        "registered_date_bs": member.get("registered_date"),
        "tenure_end_date": member.get("tenure_end_date"),
        "election_area_no": member.get("election_area_no"),
        "territory_no": member.get("territory_no"),
        # Names
        "name_np": name_np,
        "name_en": name_en,
        "designation_np": designation_np,
        "designation_en": designation_en,
        "description_np": description_np,
        "description_en": description_en,
        # District
        "district_id": district.get("id"),
        "district_code": district.get("code"),
        "district_name_np": district.get("name_np", ""),
        "district_name_en": district.get("name_en", ""),
        # Political party
        "political_party_id": party.get("id"),
        "political_party_name_np": party.get("party_name_np", ""),
        "political_party_name_en": party.get("party_name_en", ""),
        # Election type
        "election_type_id": election_type.get("id"),
        "election_type_np": election_type.get("election_type_np", ""),
        "election_type_en": election_type.get("election_type_en", ""),
    }


def main():
    members = fetch_members()

    # Save raw response
    print(f"Saving raw data to {RAW_OUTPUT}...")
    with open(RAW_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(members, f, ensure_ascii=False, indent=2)

    # Filter to HR members only (House of Representatives) and flatten
    hr_members = [m for m in members if m.get("parliament_type") == "hr" and m.get("member_type") == "member"]
    print(f"  {len(hr_members)} HR elected members out of {len(members)} total")

    flattened = [flatten_member(m) for m in hr_members]

    print(f"Saving flattened data to {OUTPUT}...")
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(flattened, f, ensure_ascii=False, indent=2)

    print(f"  ✓ Saved {len(flattened)} records")


if __name__ == "__main__":
    main()
