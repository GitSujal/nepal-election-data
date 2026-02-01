export interface FPTPResult {
  candidate_name: string
  party_name: string
  symbol_name: string | null
  vote_count: number
  rank: string
  remarks: string | null
  candidate_profile_url: string | null
  party_symbol_url: string | null
}

export interface ProportionalResult {
  party_name: string
  vote_count: number
  rank: number
}

export interface Constituency {
  state_id: number
  state_name: string
  district_id: number
  district_name: string
  constituency_id: string
  constituency_name: string
  fptp_2079_results: string // JSON string
  fptp_2074_results: string // JSON string
  proportional_2079_results: string // JSON string
  winning_party_2079: string
  winning_party_2074: string
  is_gadh: boolean
  gadh_party_name: string | null
  tags: string // JSON string array
}

// Helper to parse the Python-style string to JSON
export function parseResults<T>(resultsString: string): T[] {
  if (!resultsString || resultsString === "[]") return []
  try {
    // Replace Python None with null and single quotes with double quotes
    const jsonString = resultsString
      .replace(/None/g, "null")
      .replace(/'/g, '"')
      .replace(/\n/g, ",")
    return JSON.parse(jsonString)
  } catch {
    return []
  }
}

// Sample data matching the user's JSON structure
export const constituencyData: Constituency[] = [
  {
    state_id: 1,
    state_name: "कोशी प्रदेश",
    district_id: 1,
    district_name: "ताप्लेजुंग",
    constituency_id: "1",
    constituency_name: "ताप्लेजुंग-1",
    fptp_2079_results: `[{"candidate_name": "योगेश कुमार भट्टराई", "party_name": "नेपाल कम्युनिष्ट पार्टी (एमाले)", "symbol_name": "सूर्य", "vote_count": 21943, "rank": "1", "remarks": "Elected"}, {"candidate_name": "खेल प्रसाद बुडाक्षेत्री", "party_name": "नेपाल कम्युनिष्ट पार्टी (माओवादी केन्द्र)", "symbol_name": "गोलाकारभित्र हँसिया हथौडा", "vote_count": 21735, "rank": "2", "remarks": null}, {"candidate_name": "होम प्रसाद तुम्बाहाम्फे", "party_name": "संघीय लोकतान्त्रिक राष्ट्रिय मञ्च", "symbol_name": "दाप सहितको खुकुरी", "vote_count": 941, "rank": "3", "remarks": null}, {"candidate_name": "चन्द्र मादेन", "party_name": "जनता समाजवादी पार्टी, नेपाल", "symbol_name": "ढल्केको छाता", "vote_count": 628, "rank": "4", "remarks": null}, {"candidate_name": "राम बहादुर कार्की", "party_name": "राष्ट्रिय प्रजातन्त्र पार्टी", "symbol_name": "हलो", "vote_count": 406, "rank": "5", "remarks": null}]`,
    fptp_2074_results: `[{"candidate_name": "भवानी प्रसाद खापुङ", "party_name": "नेपाल कम्युनिष्ट पार्टी (एमाले)", "symbol_name": null, "vote_count": 21335, "rank": "1", "remarks": "Elected"}, {"candidate_name": "खेल प्रसाद बुडाक्षेत्री", "party_name": "नेपाल कम्युनिष्ट पार्टी (माओवादी केन्द्र)", "symbol_name": null, "vote_count": 18500, "rank": "2", "remarks": null}, {"candidate_name": "राम कुमार राई", "party_name": "नेपाली काँग्रेस", "symbol_name": null, "vote_count": 8200, "rank": "3", "remarks": null}]`,
    proportional_2079_results: `[{"party_name": "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)", "vote_count": 18569, "rank": 1}, {"party_name": "नेपाली काँग्रेस", "vote_count": 13774, "rank": 2}, {"party_name": "नेपाल कम्युनिष्ट पार्टी (माओवादी केन्द्र)", "vote_count": 5998, "rank": 3}, {"party_name": "संघीय लोकतान्त्रिक राष्ट्रिय मञ्च", "vote_count": 1814, "rank": 4}, {"party_name": "राष्ट्रिय प्रजातन्त्र पार्टी", "vote_count": 925, "rank": 5}]`,
    winning_party_2079: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    winning_party_2074: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    is_gadh: true,
    gadh_party_name: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    tags: "[]",
  },
  {
    state_id: 1,
    state_name: "कोशी प्रदेश",
    district_id: 2,
    district_name: "पाँचथर",
    constituency_id: "2",
    constituency_name: "पाँचथर-1",
    fptp_2079_results: `[{"candidate_name": "कृष्ण कुमार राई", "party_name": "नेपाली काँग्रेस", "symbol_name": "रुख", "vote_count": 19500, "rank": "1", "remarks": "Elected"}, {"candidate_name": "सुमन राई", "party_name": "नेपाल कम्युनिष्ट पार्टी (एमाले)", "symbol_name": "सूर्य", "vote_count": 18200, "rank": "2", "remarks": null}, {"candidate_name": "भीम लिम्बू", "party_name": "नेपाल कम्युनिष्ट पार्टी (माओवादी केन्द्र)", "symbol_name": "हँसिया हथौडा", "vote_count": 5600, "rank": "3", "remarks": null}]`,
    fptp_2074_results: `[{"candidate_name": "सुमन राई", "party_name": "नेपाल कम्युनिष्ट पार्टी (एमाले)", "symbol_name": null, "vote_count": 22000, "rank": "1", "remarks": "Elected"}, {"candidate_name": "कृष्ण कुमार राई", "party_name": "नेपाली काँग्रेस", "symbol_name": null, "vote_count": 17500, "rank": "2", "remarks": null}]`,
    proportional_2079_results: `[{"party_name": "नेपाली काँग्रेस", "vote_count": 16500, "rank": 1}, {"party_name": "नेपाल कम्युनिष्ट पार्टी (एमाले)", "vote_count": 14200, "rank": 2}, {"party_name": "नेपाल कम्युनिष्ट पार्टी (माओवादी केन्द्र)", "vote_count": 4800, "rank": 3}]`,
    winning_party_2079: "नेपाली काँग्रेस",
    winning_party_2074: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    is_gadh: false,
    gadh_party_name: null,
    tags: "[]",
  },
  {
    state_id: 3,
    state_name: "बागमती प्रदेश",
    district_id: 27,
    district_name: "काठमाडौं",
    constituency_id: "1",
    constituency_name: "काठमाडौं-1",
    fptp_2079_results: `[{"candidate_name": "प्रकाश मान सिंह", "party_name": "राष्ट्रिय स्वतन्त्र पार्टी", "symbol_name": "क्रिकेट ब्याट", "vote_count": 42500, "rank": "1", "remarks": "Elected"}, {"candidate_name": "गोकर्ण विष्ट", "party_name": "नेपाली काँग्रेस", "symbol_name": "रुख", "vote_count": 28000, "rank": "2", "remarks": null}, {"candidate_name": "रामेश्वर श्रेष्ठ", "party_name": "नेपाल कम्युनिष्ट पार्टी (एमाले)", "symbol_name": "सूर्य", "vote_count": 15000, "rank": "3", "remarks": null}]`,
    fptp_2074_results: `[{"candidate_name": "प्रकाश मान सिंह", "party_name": "नेपाली काँग्रेस", "symbol_name": null, "vote_count": 35000, "rank": "1", "remarks": "Elected"}, {"candidate_name": "राजन भट्टराई", "party_name": "नेपाल कम्युनिष्ट पार्टी (एमाले)", "symbol_name": null, "vote_count": 28000, "rank": "2", "remarks": null}]`,
    proportional_2079_results: `[{"party_name": "राष्ट्रिय स्वतन्त्र पार्टी", "vote_count": 38000, "rank": 1}, {"party_name": "नेपाली काँग्रेस", "vote_count": 25000, "rank": 2}, {"party_name": "नेपाल कम्युनिष्ट पार्टी (एमाले)", "vote_count": 12000, "rank": 3}]`,
    winning_party_2079: "राष्ट्रिय स्वतन्त्र पार्टी",
    winning_party_2074: "नेपाली काँग्रेस",
    is_gadh: false,
    gadh_party_name: null,
    tags: "[]",
  },
]

// Helper functions
export function getUniqueStates(data: Constituency[]) {
  const states = new Map<number, string>()
  data.forEach((c) => states.set(c.state_id, c.state_name))
  return Array.from(states.entries()).map(([id, name]) => ({ id, name }))
}

export function getDistrictsByState(data: Constituency[], stateId: number) {
  const districts = new Map<number, string>()
  data
    .filter((c) => c.state_id === stateId)
    .forEach((c) => districts.set(c.district_id, c.district_name))
  return Array.from(districts.entries()).map(([id, name]) => ({ id, name }))
}

export function getConstituenciesByDistrict(data: Constituency[], districtId: number) {
  return data
    .filter((c) => c.district_id === districtId)
    .map((c) => ({ id: c.constituency_id, name: c.constituency_name }))
}
