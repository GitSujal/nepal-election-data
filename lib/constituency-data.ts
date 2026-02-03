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
  is_pakad: boolean
  pakad_party_name?: string | null
  tags: string | string[] // JSON string array or parsed array
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
