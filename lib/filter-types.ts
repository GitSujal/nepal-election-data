// URL Filter State Types
// These types define the shape of filter state stored in URL parameters

// FPTP Filter State (using IDs for geography)
export interface FPTPFilterState {
  state: number        // state_id (0 = all)
  district: number     // district_id (0 = all)
  constituency: number // constituency_id (0 = all)
  party: string        // political_party_name ('' = all)
  badges: string[]     // tags array
  candidate: number    // candidate_id (0 = none selected)
}

// PR Filter State
export interface PRFilterState {
  party: string        // political_party_name ('' = all)
  group: string        // inclusive_group ('' = all)
  badges: string[]     // tags array
  candidate: number    // serial_no (0 = none selected)
}

// Combined URL filter state (all URL params)
export interface UrlFilterState {
  tab: string          // 'fptp' or 'pr'
  // FPTP (using IDs)
  state: number        // state_id
  district: number     // district_id
  constituency: number // constituency_id
  // Shared (using names)
  party: string        // political_party_name
  badges: string[]     // tags array
  candidate: number    // candidate_id or serial_no
  // PR only
  group: string        // inclusive_group
}

// Default values (empty/zero means "all")
export const defaultFilterState: UrlFilterState = {
  tab: 'fptp',
  state: 0,
  district: 0,
  constituency: 0,
  party: '',
  badges: [],
  candidate: 0,
  group: '',
}

// Helper to extract FPTP filter state from URL state
export function getFPTPFilterState(urlState: UrlFilterState): FPTPFilterState {
  return {
    state: urlState.state,
    district: urlState.district,
    constituency: urlState.constituency,
    party: urlState.party,
    badges: urlState.badges,
    candidate: urlState.candidate,
  }
}

// Helper to extract PR filter state from URL state
export function getPRFilterState(urlState: UrlFilterState): PRFilterState {
  return {
    party: urlState.party,
    group: urlState.group,
    badges: urlState.badges,
    candidate: urlState.candidate,
  }
}

// Constituency Page Filter State
export interface ConstituencyFilterState {
  state: string        // state_name ('' = all)
  district: string     // district_name ('' = all)
  constituency: string // constituency_id ('' = none selected)
}

export const defaultConstituencyFilterState: ConstituencyFilterState = {
  state: '',
  district: '',
  constituency: '',
}

// Party Page Filter State
export interface PartyFilterState {
  party: number        // party_id (0 = none selected)
}

export const defaultPartyFilterState: PartyFilterState = {
  party: 0,
}

// Party Comparison Page Filter State
export interface PartyComparisonFilterState {
  party1: number       // party_id for first party (0 = none selected)
  party2: number       // party_id for second party (0 = none selected)
}

export const defaultPartyComparisonFilterState: PartyComparisonFilterState = {
  party1: 0,
  party2: 0,
}
