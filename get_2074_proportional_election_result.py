import requests
import json

url = "https://result.election.gov.np/JSONFiles/ElectionResultCentralPR.txt"
output_file = "data/2074_proportional_election_result.json"

print(f"Downloading from {url}...")
try:
    response = requests.get(url)
    response.raise_for_status()

    # Force UTF-8 encoding because the server might say "text/plain" or similar without charset
    response.encoding = 'utf-8-sig'

    data = json.loads(response.text)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f"Successfully saved to {output_file} with UTF-8 encoding.")
    print(f"Records: {len(data) if isinstance(data, list) else 'dict'}")

except Exception as e:
    print(f"Error: {e}")
