import os
import re
import pandas as pd

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OCR_DATA_DIR = os.path.join(BASE_DIR, "ocr", "data")
OUTPUT_FILE = os.path.join(BASE_DIR, "data/current_proportional_election_candidates.csv")


HEADER_NORMALIZE = {
    "क्रम संख्या": "S.N.",
    "मतदाता नम्बर": "Voter ID Number",
    "समावेशी समूह": "Inclusive Group",
    "नागरिकता जारी जिल्ला": "Citizenship District",
    "कैफियत": "Remarks",
    "सम्बन्धित राजनितिक दल": "Associated Party",
}

# OCR produces spelling variants of these headers — map them all to the canonical English name
FUZZY_HEADER_PATTERNS = {
    r"पूरा नाम.*बन्द.*अनुसार": "Full Name",
    r"लि[ङंग][्ग]?": "Gender",
}


def normalize_header(h):
    """Map a Nepali header (possibly OCR-garbled) to its canonical English name."""
    h = h.strip()
    if h in HEADER_NORMALIZE:
        return HEADER_NORMALIZE[h]
    for pattern, eng in FUZZY_HEADER_PATTERNS.items():
        if re.search(pattern, h):
            return eng
    return h


def parse_markdown_table(table_text):
    """Parses a markdown table string into a list of dicts."""
    lines = [line.strip() for line in table_text.strip().splitlines() if line.strip()]
    if len(lines) < 3:
        return []

    raw_headers = [h.strip() for h in lines[0].split("|") if h.strip()]
    headers = [normalize_header(h) for h in raw_headers]
    rows = []
    for line in lines[2:]:
        cells = [c.strip() for c in line.split("|")]
        if cells and cells[0] == "":
            cells = cells[1:]
        if cells and cells[-1] == "":
            cells = cells[:-1]
        if len(cells) == len(headers):
            rows.append(dict(zip(headers, cells)))
    return rows


def build_table_to_party_map(index_md_text):
    """Parse the root markdown.md to build a mapping from table filename to party name."""
    table_to_party = {}
    last_known_party = "Unknown"

    skip_prefixes = (
        "निर्वाचन", "प्रतिनिधि", "समानुपातिक", "बन्दसूची",
        "पाना", "पास", "पान", "पान्ना",
    )

    lines = index_md_text.splitlines()
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue

        # Check for party name on same line as label
        match = re.search(r"राजनीतिक दलको नाम[:\-–—\s]+(.*)", stripped)
        if match:
            name = match.group(1).strip().strip("-–—: ")
            if name and not name.startswith("बन्दसूची"):
                last_known_party = name
            else:
                # Party name might be on a nearby line
                for j in range(i + 1, min(i + 4, len(lines))):
                    candidate = lines[j].strip()
                    if not candidate:
                        continue
                    if candidate.startswith("बन्दसूची"):
                        # Check the line after the date line too
                        continue
                    if any(candidate.startswith(p) for p in skip_prefixes):
                        continue
                    if candidate.startswith("["):
                        break
                    last_known_party = candidate
                    break
            continue

        # Check for standalone party name (line after बन्दसूची that's not a known prefix or link)
        # This is handled above in the lookahead

        # Check for table reference
        tbl_match = re.match(r"\[(tbl-\d+\.md)\]", stripped)
        if tbl_match:
            table_to_party[tbl_match.group(1)] = last_known_party

    return table_to_party


def main():
    # Read the root markdown.md to build table-to-party mapping
    index_path = os.path.join(OCR_DATA_DIR, "markdown.md")
    with open(index_path, "r", encoding="utf-8") as f:
        index_text = f.read()

    table_to_party = build_table_to_party_map(index_text)
    print(f"Found {len(table_to_party)} table-to-party mappings")

    # Find all table files across page directories
    all_rows = []
    pages_dir = os.path.join(OCR_DATA_DIR, "pages")

    # Collect all table files with their paths
    table_files = {}
    for page_entry in os.listdir(pages_dir):
        page_path = os.path.join(pages_dir, page_entry)
        if not os.path.isdir(page_path):
            continue
        for f in os.listdir(page_path):
            if re.match(r"tbl-\d+\.md", f):
                table_files[f] = os.path.join(page_path, f)

    # Process tables in order
    for tbl_name in sorted(table_files.keys(), key=lambda x: int(re.search(r"(\d+)", x).group(1))):
        tbl_path = table_files[tbl_name]
        party = table_to_party.get(tbl_name, "Unknown")

        with open(tbl_path, "r", encoding="utf-8") as f:
            table_text = f.read()

        rows = parse_markdown_table(table_text)
        for row in rows:
            # Normalize backward area checkmarks
            for col in ["पिछडिएको क्षेत्र", "पिछड़िएको क्षेत्र"]:
                if col in row:
                    row["Backward Area"] = "✓" if ("☑" in row[col] or "✓" in row[col] or "ü" in row[col]) else ""
                    del row[col]

            # Normalize disability checkmarks
            for col in ["अपाङ्गगता भएको व्यक्ति", "अपाङ्गता भएको व्यक्ति"]:
                if col in row:
                    row["Disability"] = "✓" if ("☑" in row[col] or "✓" in row[col] or "ü" in row[col]) else ""
                    del row[col]

            row["Political Party"] = party
            all_rows.append(row)

        tbl_num = int(re.search(r"(\d+)", tbl_name).group(1))
        print(f"Processed {tbl_name} ({len(rows)} rows, party: {party})", end="\r")

    print()

    if all_rows:
        df = pd.DataFrame(all_rows)

        # Reorder columns
        desired_order = [
            "Political Party", "S.N.", "Full Name", "Voter ID Number",
            "Gender", "Inclusive Group", "Citizenship District",
            "Backward Area", "Disability", "Associated Party", "Remarks",
        ]
        existing = [c for c in desired_order if c in df.columns]
        extra = [c for c in df.columns if c not in desired_order]
        df = df[existing + extra]

        df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")
        print(f"Success! {len(df)} rows saved to {OUTPUT_FILE}")
    else:
        print("No data was extracted.")


if __name__ == "__main__":
    main()
