import requests
import json
import os

url = "https://result.election.gov.np/JSONFiles/ElectionResultCentral2082.txt"
output_file = "data/current_candidates.json"

# Ensure data directory exists
os.makedirs(os.path.dirname(output_file), exist_ok=True)

print(f"Downloading from {url}...")
try:
    response = requests.get(url)
    response.raise_for_status()
    
    # Handle UTF-8 BOM by decoding content directly
    decoded_content = response.content.decode('utf-8-sig')
    data = json.loads(decoded_content)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully saved to {output_file} with UTF-8 encoding.")

except Exception as e:
    print(f"Error: {e}")
