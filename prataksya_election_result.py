import requests
import json

url = "https://result.election.gov.np/JSONFiles/ElectionResultCentral2079.txt"
output_file = "data/pratakhya_election_result.json"

print(f"Downloading from {url}...")
try:
    response = requests.get(url)
    response.raise_for_status()
    
    # Force UTF-8 encoding because the server might say "text/plain" or similar without charset
    response.encoding = 'utf-8'
    
    data = response.json()
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully saved to {output_file} with UTF-8 encoding.")

except Exception as e:
    print(f"Error: {e}")
