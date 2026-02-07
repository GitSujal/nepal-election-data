// Candidate type for tab differentiation
export type CandidateType = "fptp" | "pr"

// Base interface with shared properties
export interface BaseCandidate {
  candidate_name: string
  gender: string
  political_party_name: string
  citizenship_district: string
  rank_position: number
  party_previous_names: string[]
  party_display_order: number | null
  tags: string[]

  // Parliament member details
  was_parliament_member_2074: boolean
  parliament_member_2074_election_type: "FPTP" | "Proportional" | null
  parliament_member_2074_party: string | null
  parliament_member_2074_district: string | null
  parliament_member_2074_constituency: number | null
  was_parliament_member_2079: boolean
  parliament_member_2079_election_type: "FPTP" | "Proportional" | null
  parliament_member_2079_party: string | null
  parliament_member_2079_district: string | null
  parliament_member_2079_constituency: number | null

  // Shared boolean flags
  is_new_party: boolean
  is_proportional_veteran: boolean
  is_chheparo: boolean
  is_new_candidate: boolean
  is_opportunist: boolean
  is_budi_bokuwa: boolean
  is_budo_bokuwa: boolean
}

// FPTP Candidate interface (original Candidate)
export interface Candidate extends BaseCandidate {
  candidate_id: number
  age: number
  age_group: string
  date_of_birth: number
  father_name: string
  spouse_name: string
  qualification: string
  qualification_level: string
  qualification_level_scale: number
  institution_name: string | null
  address: string
  basobas_jilla: string
  basobas_district_id: number
  experience: string | null
  other_details: string | null
  symbol_code: number
  symbol_name: string
  state_id: number
  state_name: string
  district_id: number
  district_name: string
  constituency_id: number
  constituency_name: number
  election_status: string | null
  current_vote_received: number

  // 2079 Election data
  prev_election_votes: number | null
  prev_election_rank: string | null
  prev_election_remarks: string | null
  prev_election_result: "Winner" | "Loser" | null
  prev_election_party: string | null
  prev_election_state: number | null
  prev_election_district: string | null
  prev_election_district_cd: number | null
  prev_election_constituency_id: string | null
  prev_election_casted_vote: number | null
  prev_election_total_voters: number
  prev_qualification: string | null
  prev_qualification_level: string | null
  prev_runner_up_votes: number | null

  // 2074 Election data
  prev_2074_election_votes: number | null
  prev_2074_election_rank: string | null
  prev_2074_election_remarks: string | null
  prev_2074_election_result: "Winner" | "Loser" | null
  prev_2074_election_party: string | null
  prev_2074_election_state: number | null
  prev_2074_election_district: string | null
  prev_2074_election_constituency_id: string | null
  prev_2074_election_casted_vote: number | null
  prev_2074_election_total_voters: number
  prev_2074_runner_up_votes: number | null

  // Minister history from political profile
  is_past_minister: boolean
  minister_appointment_count: number
  total_elections_contested: number
  total_wins_from_profile: number | null

  // FPTP-specific boolean flags
  is_same_party_after_merger_check: boolean
  is_same_party_2074_after_merger_check: boolean
  is_same_party_2074_2079: boolean
  is_tourist_candidate: boolean
  is_education_changed: boolean
  is_vaguwa: boolean
  is_vaguwa_prev_winner: boolean
  is_educated: boolean
  is_uneducated: boolean
  is_gen_z: boolean
  is_grandpa: boolean
  is_influential: boolean
  is_split_vote_candidate: boolean
  is_loyal: boolean
  is_nepo: boolean
  has_known_spouse: boolean
  has_known_parent: boolean
  candidate_type: string
}

// PR (Proportional) Candidate interface
export interface PRCandidate extends BaseCandidate {
  serial_no: number
  voter_id_number: string
  inclusive_group: string | null
  backward_area: string | null
  disability: string | null
  associated_party: string | null
  remarks: string | null
  party_id: number | null
  matched_party_name: string | null

  // Party performance data
  prev_2079_party_votes: number | null
  prev_2079_districts_contested: number | null
  prev_2079_states_contested: number | null
  prev_2074_party_votes: number | null
  prev_2074_party_rank: string | null
  party_existed_2079: boolean
  party_existed_2074: boolean
  party_elections_contested: number

  // FPTP history details for PR candidates
  prev_2079_fptp_votes: number | null
  prev_2079_fptp_result: "Winner" | "Loser" | null
  prev_2079_fptp_district: string | null
  prev_2079_fptp_constituency_id: number | null
  prev_2079_fptp_margin: number | null
  prev_2079_fptp_party: string | null
  prev_2074_fptp_votes: number | null
  prev_2074_fptp_result: "Winner" | "Loser" | null
  prev_2074_fptp_district: string | null
  prev_2074_fptp_constituency_id: number | null
  prev_2074_fptp_margin: number | null
  prev_2074_fptp_party: string | null

  // Additional stats
  times_elected: number | null
  pr_times_elected: number | null
  parliament_member_2079_election_type_normalized: string | null

  // PR-specific boolean flags
  is_fptp_2079_loser: boolean
  is_fptp_2074_loser: boolean
  is_fptp_veteran: boolean
  is_same_party_2079_after_merger_check: boolean | null
  is_same_party_2074_after_merger_check: boolean | null
  is_party_loyal: boolean
  is_high_rank: boolean
  is_top_rank: boolean
  is_women: boolean
  is_inclusive_group: boolean
  has_disability: boolean
  is_from_backward_area: boolean
  is_from_improving_party: boolean
  is_from_declining_party: boolean
  is_varaute: boolean
  is_gati_xada: boolean
  is_hutihara: boolean
}

// Union type for any candidate
export type AnyCandidate = Candidate | PRCandidate

// Type guard to check if candidate is FPTP
export function isFPTPCandidate(candidate: AnyCandidate): candidate is Candidate {
  return 'candidate_id' in candidate
}

// Type guard to check if candidate is PR
export function isPRCandidate(candidate: AnyCandidate): candidate is PRCandidate {
  return 'serial_no' in candidate
}

export interface Badge {
  id: string
  name: string
  nameNepali: string
  description: string
  description_np?: string
  icon: string
  color: "gold" | "silver" | "bronze" | "primary" | "accent" | "warning" | "destructive"
}

// Badge definitions based on the 14 tags
export const badgeDefinitions: Record<string, Badge> = {
  "tourist": {
    id: "tourist",
    name: "Tourist",
    nameNepali: "पर्यटक",
    description: "Candidacy district differs from citizenship district",
    description_np: "नागरिकता जारी भएको जिल्ला वा हाल बसोबास गरिरहेको जिल्ला भन्दा फरक निर्वाचन क्षेत्रमा उम्मेदवारी",
    icon: "plane",
    color: "accent"
  },
  "chheparo": {
    id: "chheparo",
    name: "Chheparo",
    nameNepali: "छेपारो",
    description: "Switched parties since last election",
    description_np: "अघिल्लो चुनावदेखि पार्टी परिवर्तन",
    icon: "repeat",
    color: "warning"
  },
  "vaguwa": {
    id: "vaguwa",
    name: "Vaguwa",
    nameNepali: "भगुवा",
    description: "Changed constituency since last election",
    description_np: "अघिल्लो चुनावदेखि निर्वाचन क्षेत्र परिवर्तन",
    icon: "footprints",
    color: "bronze"
  },
  "vaguwa-won": {
    id: "vaguwa-won",
    name: "Vaguwa (Won Prev)",
    nameNepali: "भगुवा (विजेता)",
    description: "Changed constituency after winning previous election",
    description_np: "अघिल्लो चुनाव जितेपछि निर्वाचन क्षेत्र परिवर्तन",
    icon: "footprints",
    color: "primary"
  },
  "new-candidate": {
    id: "new-candidate",
    name: "New Candidate",
    nameNepali: "नयाँ अनुहार",
    description: "First time FPTP candidate",
    description_np: "पहिलो पटक प्रत्यक्ष उम्मेदवार",
    icon: "baby",
    color: "primary"
  },
  "educated": {
    id: "educated",
    name: "Educated",
    nameNepali: "शिक्षित",
    description: "High School (+2) or above qualification",
    description_np: "उच्च माध्यमिक (+2) वा माथिको योग्यता",
    icon: "graduation-cap",
    color: "silver"
  },
  "uneducated": {
    id: "uneducated",
    name: "Uneducated",
    nameNepali: "अशिक्षित",
    description: "Below High School qualification",
    description_np: "उच्च माध्यमिक भन्दा तलको योग्यता",
    icon: "fingerprint",
    color: "bronze"
  },
  "new-party": {
    id: "new-party",
    name: "New Party",
    nameNepali: "नयाँ पार्टी",
    description: "Party formed after last elections",
    description_np: "अघिल्लो चुनावपछि गठन भएको पार्टी",
    icon: "party-popper",
    color: "accent"
  },
  "gen-z": {
    id: "gen-z",
    name: "Gen-Z",
    nameNepali: "जेन जी",
    description: "27 years old and below",
    description_np: "२७ वर्ष र सो मुनिका",
    icon: "sparkles",
    color: "primary"
  },
  "grandpa": {
    id: "grandpa",
    name: "Grandpa",
    nameNepali: "हजुरबा",
    description: "Over 60 years old",
    description_np: "६० वर्ष माथिका",
    icon: "user-round",
    color: "silver"
  },
  "influential": {
    id: "influential",
    name: "Influential",
    nameNepali: "प्रभावशाली",
    description: "Won previous election with 20%+ margin",
    description_np: "२०% भन्दा बढी मतान्तरले अघिल्लो चुनाव जितेका",
    icon: "star",
    color: "gold"
  },
  "opportunist": {
    id: "opportunist",
    name: "Opportunist",
    nameNepali: "अवसरवादी",
    description: "Was Independent, now with established party",
    description_np: "पहिले स्वतन्त्र, अहिले स्थापित पार्टीसँग",
    icon: "banknote",
    color: "warning"
  },
  "split-vote": {
    id: "split-vote",
    name: "Split Vote",
    nameNepali: "भोट कटुवा",
    description: "Got less than 3% votes in last election",
    description_np: "भोट काट्नका लागि मात्र उठ्ने तर नजित्ने",
    icon: "scissors",
    color: "destructive"
  },
  "proportional-veteran": {
    id: "proportional-veteran",
    name: "PR Veteran",
    nameNepali: "समानुपातिक अनुभवी",
    description: "Parliament member via proportional list",
    description_np: "समानुपातिकबाट पहिले संसद पदकाएका",
    icon: "medal",
    color: "gold"
  },
  "loyal": {
    id: "loyal",
    name: "Loyal",
    nameNepali: "बफादार",
    description: "Same party & constituency across all elections",
    description_np: "सबै चुनावमा एउटै पार्टी र क्षेत्रबाट उम्मेदवार",
    icon: "shield",
    color: "gold"
  },
  "nepo": {
    id: "nepo",
    name: "Nepo",
    nameNepali: "नातावाद",
    description: "Politician from family with political background",
    description_np: "राजनीतिक पृष्ठभूमि भएको परिवारका सदस्य",
    icon: "heart-handshake",
    color: "accent"
  },
  "budi-bokuwa": {
    id: "budi-bokuwa",
    name: "Budi Bokuwa",
    nameNepali: "बुढी बोकुवा",
    description: "Candidate whose spouse is also a candidate",
    description_np: "श्रीमती पनि उम्मेदवार भएको",
    icon: "heart-handshake",
    color: "accent"
  },
  "budo-bokuwa": {
    id: "budo-bokuwa",
    name: "Budo Bokuwa",
    nameNepali: "बुढो बोकुवा",
    description: "Candidate whose spouse is also a candidate",
    description_np: "श्रीमान पनि उम्मेदवार भएको",
    icon: "heart-handshake",
    color: "accent"
  },
  "purba-mantri": {
    id: "purba-mantri",
    name: "Purba Mantri",
    nameNepali: "पूर्व मन्त्री",
    description: "Former minister with government experience",
    description_np: "सरकारमा मन्त्री भएको अनुभव भएका उम्मेदवार",
    icon: "crown",
    color: "gold"
  },
  // PR-specific badges
  "party-loyal": {
    id: "party-loyal",
    name: "Party Loyal",
    nameNepali: "पार्टीप्रति वफादार",
    description: "Stayed with same party across elections",
    description_np: "सबै चुनावमा एउटै पार्टीसँग रहेका",
    icon: "shield",
    color: "gold"
  },
  "top-rank": {
    id: "top-rank",
    name: "Top Rank (1-5)",
    nameNepali: "शीर्ष वरीयता (१-५)",
    description: "Ranked 1-5 in party list, very likely to win",
    description_np: "पार्टी सूचीमा १-५ वरीयता, जित्ने सम्भावना उच्च",
    icon: "crown",
    color: "gold"
  },
  "high-rank": {
    id: "high-rank",
    name: "High Rank (6-10)",
    nameNepali: "उच्च वरीयता (६-१०)",
    description: "Ranked 6-10 in party list",
    description_np: "पार्टी सूचीमा ६-१० वरीयता",
    icon: "trophy",
    color: "silver"
  },
  "women": {
    id: "women",
    name: "Women",
    nameNepali: "महिला",
    description: "Female candidate",
    description_np: "महिला उम्मेदवार",
    icon: "user",
    color: "primary"
  },
  "inclusive-group": {
    id: "inclusive-group",
    name: "Inclusive Group",
    nameNepali: "समावेशी समूह",
    description: "From inclusive/marginalized group",
    description_np: "समावेशी/सीमान्तकृत समूहबाट",
    icon: "users",
    color: "primary"
  },
  "disability": {
    id: "disability",
    name: "Disability",
    nameNepali: "अपाङ्गता",
    description: "Candidate with disability",
    description_np: "अपाङ्गता भएका उम्मेदवार",
    icon: "accessibility",
    color: "accent"
  },
  "backward-area": {
    id: "backward-area",
    name: "Backward Area",
    nameNepali: "पिछडिएको क्षेत्र",
    description: "From backward/underdeveloped area",
    description_np: "पिछडिएको क्षेत्रबाट",
    icon: "map-pin",
    color: "bronze"
  },
  "fptp-veteran": {
    id: "fptp-veteran",
    name: "FPTP Veteran",
    nameNepali: "प्रत्यक्ष अनुभवी",
    description: "Parliament member via FPTP in past",
    description_np: "प्रत्यक्षबाट पहिले संसद पदकाएका",
    icon: "medal",
    color: "gold"
  },
  "improving-party": {
    id: "improving-party",
    name: "Improving Party",
    nameNepali: "सुधारोन्मुख पार्टी",
    description: "Party improved votes from 2074 to 2079",
    description_np: "२०७४ देखि २०७९ सम्म मत बढेको पार्टी",
    icon: "trending-up",
    color: "primary"
  },
  "declining-party": {
    id: "declining-party",
    name: "Declining Party",
    nameNepali: "खस्कँदो पार्टी",
    description: "Party lost votes from 2074 to 2079",
    description_np: "२०७४ देखि २०७९ सम्म मत घटेको पार्टी",
    icon: "trending-down",
    color: "destructive"
  },
  "pani-maruwa": {
    id: "pani-maruwa",
    name: "Pani Maruwa",
    nameNepali: "पानी मरुवा",
    description: "Lost FPTP, now in PR list",
    description_np: "प्रत्यक्षमा हारेर समानुपातिकमा आउने पातकीहरू", 
    icon: "rotate-ccw",
    color: "warning"
  },
  "gati-xada": {
    id: "gati-xada",
    name: "Gati Xada",
    nameNepali: "गति छाडा",
    description: "Proportional parliament member continuing same PR path",
    description_np: "पहिले समानुपातिकबाट सांसद भएर अहिले पनि समानुपातिकमा उम्मेदवार",
    icon: "building2",
    color: "primary"
  },
  "hutihara": {
    id: "hutihara",
    name: "Hutihara",
    nameNepali: "हुतिहरा",
    description: "Won FPTP election before, now candidate in proportional list",
    description_np: "पहिले प्रत्यक्षबाट जितेर, अहिले समानुपातिकमा उम्मेदवार",
    icon: "baby",
    color: "warning"
  }
};

// Sample data matching the actual JSON structure
// Map from Nepali tag names to badge IDs (for backward compatibility if needed)
export const tagNameToIdMap: Record<string, string> = {
  "पर्यटक": "tourist",
  "छेपारो": "chheparo",
  "भगुवा": "vaguwa",
  "भगुवा (विजेता)": "vaguwa-won",
  "नयाँ अनुहार": "new-candidate",
  "शिक्षित": "educated",
  "अशिक्षित": "uneducated",
  "नयाँ पार्टी": "new-party",
  "जेन जी": "gen-z",
  "हजुरबा": "grandpa",
  "प्रभावशाली": "influential",
  "अवसरवादी": "opportunist",
  "भोट कटुवा": "split-vote",
  "समानुपातिक अनुभवी": "proportional-veteran",
  "बफादार": "loyal",
  "नातावाद": "nepo",
  "बुढी बोकुवा": "budi-bokuwa",
  "बुढो बोकुवा": "budo-bokuwa",
  "पूर्व मन्त्री": "purba-mantri",
  "पार्टीप्रति वफादार": "party-loyal",
  "शीर्ष वरीयता (१-५)": "top-rank",
  "उच्च वरीयता (६-१०)": "high-rank",
  "महिला": "women",
  "समावेशी समूह": "inclusive-group",
  "अपाङ्गता": "disability",
  "पिछडिएको क्षेत्र": "backward-area",
  "प्रत्यक्ष अनुभवी": "fptp-veteran",
  "सुधारोन्मुख पार्टी": "improving-party",
  "खस्कँदो पार्टी": "declining-party",
  "पानी मरुवा": "pani-maruwa",
  "गति छाडा": "gati-xada",
  "हुतिहरा": "hutihara",
}

export const candidates: Candidate[] = [
  {
    candidate_id: 339403,
    candidate_name: "राजेन्द्र प्रसाद लिङ्देन",
    gender: "पुरुष",
    age: 60,
    age_group: "60+",
    date_of_birth: 60,
    father_name: "मान प्रसाद लिङ्देन",
    spouse_name: "सिता थापा",
    qualification: "स्‍नातक",
    qualification_level: "Bachelor",
    qualification_level_scale: 4,
    institution_name: "TU",
    address: "झापा हल्दिबारी गाउँपालिका नमुना टोल",
    experience: null,
    other_details: null,
    symbol_code: 2604,
    symbol_name: "हलो",
    political_party_name: "राष्ट्रिय प्रजातन्त्र पार्टी",
    state_id: 1,
    state_name: "कोशी प्रदेश",
    district_id: 4,
    district_name: "झापा",
    constituency_id: 3,
    constituency_name: 3,
    citizenship_district: "झापा",
    basobas_jilla: "झापा",
    basobas_district_id: 4,
    election_status: null,
    current_vote_received: 0,
    rank_position: 1,
    prev_election_votes: 40662,
    prev_election_rank: "1",
    prev_election_remarks: "Elected",
    prev_election_result: "Winner",
    prev_election_party: "राष्ट्रिय प्रजातन्त्र पार्टी",
    prev_election_state: 1,
    prev_election_district: "झापा",
    prev_election_district_cd: 4,
    prev_election_constituency_id: "3",
    prev_election_casted_vote: 84808.0,
    prev_election_total_voters: 0,
    prev_qualification: "स्तनातक",
    prev_qualification_level: "Bachelor",
    prev_runner_up_votes: 37386,
    prev_2074_election_votes: 44614,
    prev_2074_election_rank: "1",
    prev_2074_election_remarks: "Elected",
    prev_2074_election_result: "Winner",
    prev_2074_election_party: "राष्ट्रिय प्रजातन्त्र पार्टी",
    prev_2074_election_state: 1,
    prev_2074_election_district: "झापा",
    prev_2074_election_constituency_id: "3",
    prev_2074_election_casted_vote: 0,
    prev_2074_election_total_voters: 0,
    prev_2074_runner_up_votes: 40506,
    total_elections_contested: 2,
    party_previous_names: [
      "एकीकृत राष्ट्रिय प्रजातन्त्र पार्टी(राष्ट्रवादी)",
      "राष्ट्रिय प्रजातन्त्र पार्टी (प्रजातान्त्रिक)",
      "राष्ट्रिय प्रजातन्त्र पार्टी (संयुक्त)",
      "राष्ट्रिय प्रजातन्त्र पार्टी नेपाल"
    ],
    is_same_party_after_merger_check: true,
    is_same_party_2074_after_merger_check: true,
    is_same_party_2074_2079: true,
    is_tourist_candidate: false,
    is_education_changed: false,
    is_new_party: false,
    was_parliament_member_2074: true,
    parliament_member_2074_election_type: "FPTP",
    parliament_member_2074_party: "राष्ट्रिय प्रजातन्त्र पार्टी",
    parliament_member_2074_district: "झापा",
    parliament_member_2074_constituency: 3,
    was_parliament_member_2079: true,
    parliament_member_2079_election_type: "FPTP",
    parliament_member_2079_party: "राष्ट्रिय प्रजातन्त्र पार्टी",
    parliament_member_2079_district: "झापा",
    parliament_member_2079_constituency: 3,
    is_proportional_veteran: false,
    is_chheparo: false,
    is_vaguwa: false,
    is_vaguwa_prev_winner: false,
    is_new_candidate: false,
    is_educated: true,
    is_uneducated: false,
    is_gen_z: false,
    is_grandpa: false,
    is_influential: false,
    is_opportunist: false,
    is_split_vote_candidate: false,
    is_loyal: true,
    is_nepo: false,
    has_known_spouse: false,
    has_known_parent: false,
    is_budi_bokuwa: false,
    is_budo_bokuwa: false,
    candidate_type: "Same Location",
    tags: ["educated", "loyal"],
    party_display_order: 4
  },
]

// Helper functions for filtering
export const getUniqueStates = () => [...new Set(candidates.map(c => c.state_name))]
export const getUniqueDistricts = (state?: string) => {
  const filtered = state ? candidates.filter(c => c.state_name === state) : candidates
  return [...new Set(filtered.map(c => c.district_name))]
}
export const getUniqueConstituencies = (district?: string) => {
  const filtered = district ? candidates.filter(c => c.district_name === district) : candidates
  return [...new Set(filtered.map(c => `${c.district_name}-${c.constituency_name}`))]
}
export const getUniqueParties = () => [...new Set(candidates.map(c => c.political_party_name))]

export const filterCandidates = (
  state?: string,
  district?: string,
  constituency?: string,
  party?: string
) => {
  return candidates.filter(c => {
    if (state && c.state_name !== state) return false
    if (district && c.district_name !== district) return false
    if (constituency && `${c.district_name}-${c.constituency_name}` !== constituency) return false
    if (party && c.political_party_name !== party) return false
    return true
  })
}

// Helper to get vote percentage
export const getVotePercentage = (votes: number | null, totalCasted: number | null): number | null => {
  if (!votes || !totalCasted || totalCasted === 0) return null
  return Math.round((votes / totalCasted) * 1000) / 10
}

// Helper to get margin
export const getMargin = (candidateVotes: number | null, runnerUpVotes: number | null): number | null => {
  if (candidateVotes === null || runnerUpVotes === null) return null
  return candidateVotes - runnerUpVotes
}
