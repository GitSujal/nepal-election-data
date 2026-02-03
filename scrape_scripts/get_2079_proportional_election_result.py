import requests
import json
import time

def load_json(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)

def run():
    # Load metadata
    states = load_json('data/states.json')
    districts = load_json('data/districts.json')
    constituencies_count = load_json('data/constituency.json')

    # Convert counts to a dict for easy lookup
    # constituency.json format: [{"distId": 1, "consts": 1}, ...]
    const_count_map = {item['distId']: item['consts'] for item in constituencies_count}

    # Build Structure
    # Map State ID -> State Obj
    state_map = {s['id']: {**s, "districts": []} for s in states}

    # Map District ID -> District Obj (and add to state)
    dist_map = {}
    for d in districts:
        d_obj = {
            "id": d['id'],
            "name": d['name'],
            "constituencies": []
        }
        dist_map[d['id']] = d_obj
        
        parent_id = d.get('parentId')
        if parent_id and parent_id in state_map:
            state_map[parent_id]['districts'].append(d_obj)
        else:
            print(f"Warning: District {d['name']} ({d['id']}) has invalid parent '{parent_id}'")

    # Iterate and Fetch
    total_requests = 0
    success_requests = 0

    print("Starting scraping...")

    # We iterate nicely through the hierarchy to print progress
    for state_id in sorted(state_map.keys()):
        state = state_map[state_id]
        print(f"Processing State: {state['name']} ({state_id})")
        
        for dist in state['districts']:
            dist_id = dist['id']
            count = const_count_map.get(dist_id, 0)
            
            if count == 0:
                print(f"  Warning: No constituency count for District {dist['name']} ({dist_id})")
                continue

            for c_id in range(1, count + 1):
                url = f"https://result.election.gov.np/JSONFiles/Election2079/HOR/PR/HOR/HOR-{dist_id}-{c_id}.json"
                print(f"  Fetching {dist['name']} - Const {c_id} ({url})...", end="", flush=True)
                
                try:
                    r = requests.get(url, timeout=10)
                    if r.status_code == 200:
                        data = r.json()
                        const_obj = {
                            "id": c_id,
                            "name": f"{dist['name']} {c_id}",
                            "results": data
                        }
                        dist['constituencies'].append(const_obj)
                        print(" [OK]")
                        success_requests += 1
                    else:
                        print(f" [FAILED: {r.status_code}]")
                except Exception as e:
                    print(f" [ERROR: {e}]")
                
                total_requests += 1
                # time.sleep(0.1) # Be nice

    output_data = list(state_map.values())
    
    with open('data/past_proportional_election_result.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=4, ensure_ascii=False)

    print(f"\nScraping Completed.")
    print(f"Total Requests: {total_requests}")
    print(f"Successful: {success_requests}")
    print(f"Saved to 'data/past_2079_proportional_election_result.json'")

if __name__ == "__main__":
    run()
