#!/usr/bin/env python3
"""
Script to extract political party information from Wikipedia
including party names, links, and symbol images
"""

import requests
from bs4 import BeautifulSoup
import json
import re

def extract_party_data():
    url = "https://en.wikipedia.org/wiki/List_of_political_parties_in_Nepal"
    
    # Send request
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    parties = []
    
    # Find all tables in the page
    tables = soup.find_all('table', {'class': 'wikitable'})
    
    print(f"Found {len(tables)} tables")
    
    for table_idx, table in enumerate(tables):
        print(f"\nProcessing table {table_idx + 1}")
        rows = table.find_all('tr')
        print(f"  Found {len(rows)} rows")
        
        # Get header to identify column positions
        header_row = rows[0] if rows else None
        headers = []
        if header_row:
            headers = [th.get_text(strip=True).lower() for th in header_row.find_all(['th', 'td'])]
            print(f"  Headers: {headers}")
        
        for row_idx, row in enumerate(rows):
            cells = row.find_all('td')
            
            # Skip rows without enough cells (likely headers)
            if len(cells) < 3:
                continue
            
            party_data = {}
            
            # Determine which column is which based on headers
            # For tables 1-2 (national parties): symbol(1), name(2), founded(3), position(4), ideology(5), leader(6+)
            # For other tables: varies based on headers
            
            # Try to find the party name - it should have a meaningful link
            party_col_idx = None
            for idx, cell in enumerate(cells[:5]):  # Check first 5 cells
                links = cell.find_all('a')
                for link in links:
                    href = link.get('href', '')
                    text = link.get_text(strip=True)
                    # Skip navigation links and political position links
                    if text and len(text) > 3 and 'politics' not in href and '#' not in href and 'edit' not in href.lower():
                        party_col_idx = idx
                        break
                if party_col_idx is not None:
                    break
            
            if party_col_idx is None:
                continue
            
            # Extract symbol image (usually in column before party name)
            if party_col_idx > 0:
                symbol_cell = cells[party_col_idx - 1]
                symbol_img = symbol_cell.find('img')
                if symbol_img and symbol_img.get('src'):
                    symbol_url = symbol_img['src']
                    if symbol_url.startswith('//'):
                        symbol_url = 'https:' + symbol_url
                    party_data['symbol_url'] = symbol_url
                    party_data['symbol_alt'] = symbol_img.get('alt', '')
            
            # Extract party name
            party_cell = cells[party_col_idx]
            party_link = party_cell.find('a')
            if party_link:
                href = party_link.get('href', '')
                # Filter out political position links
                if 'politics' not in href:
                    party_data['party_name_en'] = party_link.get_text(strip=True)
                    party_data['party_url'] = 'https://en.wikipedia.org' + href
                    
                    # Look for Nepali name in same cell
                    full_text = party_cell.get_text()
                    nepali_match = re.search(r'[\u0900-\u097F]+(?:\s+[\u0900-\u097F]+)*', full_text)
                    if nepali_match:
                        party_data['party_name_np'] = nepali_match.group(0).strip()
            
            # Extract founded year (usually next column after party name)
            if party_col_idx + 1 < len(cells):
                founded_cell = cells[party_col_idx + 1]
                year_match = re.search(r'\b(19\d{2}|20\d{2})\b', founded_cell.get_text(strip=True))
                if year_match:
                    party_data['founded_year'] = year_match.group(1)
            
            # Extract leader - search through cells starting after founded/position/ideology
            # Usually leader is around column 5-7 for national parties
            leader_start_idx = max(party_col_idx + 3, 5)  # Start from at least column 5
            for idx in range(leader_start_idx, min(len(cells), party_col_idx + 8)):
                cell = cells[idx]
                cell_text = cell.get_text(strip=True)
                
                # Skip cells with numbers/fractions (likely vote counts)
                if re.match(r'^\d+\s*/\s*\d+', cell_text) or (cell_text.isdigit() and len(cell_text) == 4):
                    continue
                
                # Skip cells that are clearly not leader names
                if len(cell_text) < 3 or len(cell_text) > 50:
                    continue
                
                # Skip common non-leader terms and ideologies
                skip_patterns = [
                    r'^(centre|left|right|far-left|far-right|centre-left|centre-right)',
                    r'(democracy|socialism|communism|marxism|leninism|capitalism|liberalism)',
                    r'^(big tent|n/?a|unknown|–)$',
                    r'^\d+$'  # Just numbers
                ]
                if any(re.search(pattern, cell_text, re.IGNORECASE) for pattern in skip_patterns):
                    continue
                
                # Look for person name (usually has a link to their Wikipedia page)
                leader_links = cell.find_all('a')
                for leader_link in leader_links:
                    leader_text = leader_link.get_text(strip=True)
                    href = leader_link.get('href', '')
                    
                    # Person pages usually don't have these keywords in URL
                    excluded_keywords = ['politics', 'ideology', '#', 'edit']
                    if not any(keyword in href.lower() for keyword in excluded_keywords):
                        if leader_text and len(leader_text) > 2 and len(leader_text) < 50:
                            party_data['leader'] = leader_text
                            break
                
                if party_data.get('leader'):
                    break
                
                # If no link found but text looks like a name
                elif cell_text and not re.match(r'^\d{4}', cell_text):
                    party_data['leader'] = cell_text
                    break
            
            # Only add if we have a valid party name
            if party_data.get('party_name_en') and not party_data['party_name_en'].endswith('politics'):
                parties.append(party_data)
                if row_idx <= 5 and party_data.get('symbol_url'):  # Print first few with symbols for debugging
                    print(f"    Row {row_idx}: {party_data.get('party_name_en', 'No EN name')[:40]} | Leader: {party_data.get('leader', 'N/A')}")
    
    # Remove duplicates based on party name
    unique_parties = []
    seen_names = set()
    
    for party in parties:
        name_key = party.get('party_name_en', '') or party.get('party_name_np', '')
        if name_key and name_key not in seen_names:
            seen_names.add(name_key)
            unique_parties.append(party)
    
    return unique_parties

if __name__ == '__main__':
    print("Extracting party data from Wikipedia...")
    parties = extract_party_data()
    
    # Save to JSON file
    output_file = 'data/political_party_symbols.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(parties, f, ensure_ascii=False, indent=2)
    
    print(f"Extracted {len(parties)} parties")
    print(f"Data saved to {output_file}")
    
    # Print sample
    print("\nSample data (first 3 parties):")
    for party in parties[:3]:
        print(json.dumps(party, ensure_ascii=False, indent=2))
