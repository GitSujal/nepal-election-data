export interface Candidate {
  candidate_id: number
  candidate_name: string
  gender: string
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
  experience: string | null
  other_details: string | null
  symbol_code: number
  symbol_name: string
  political_party_name: string
  state_id: number
  state_name: string
  district_id: number
  district_name: string
  constituency_id: number
  constituency_name: number
  citizenship_district: string
  election_status: string | null
  current_vote_received: number
  rank_position: number
  
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

  elections_contested: number
  party_previous_names: string[]
  
  // Boolean flags
  is_same_party_after_merger_check: boolean
  is_same_party_2074_after_merger_check: boolean
  is_same_party_2074_2079: boolean
  is_tourist_candidate: boolean
  is_education_changed: boolean
  is_new_party: boolean
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
  is_proportional_veteran: boolean
  is_chheparo: boolean
  is_vaguwa: boolean
  is_vaguwa_prev_winner: boolean
  is_new_candidate: boolean
  is_educated: boolean
  is_uneducated: boolean
  is_gen_z: boolean
  is_grandpa: boolean
  is_influential: boolean
  is_opportunist: boolean
  is_split_vote_candidate: boolean
  is_loyal: boolean
  candidate_type: string
  tags: string[]
}

export interface Badge {
  id: string
  name: string
  nameNepali: string
  description: string
  icon: string
  color: "gold" | "silver" | "bronze" | "primary" | "accent" | "warning" | "destructive"
}

// Badge definitions based on the 14 tags
export const badgeDefinitions: Record<string, Badge> = {
  "Tourist": {
    id: "tourist",
    name: "Tourist",
    nameNepali: "पर्यटक",
    description: "Candidacy district differs from citizenship district",
    icon: "plane",
    color: "accent"
  },
  "Chheparo": {
    id: "chheparo",
    name: "Chheparo",
    nameNepali: "छेपारो",
    description: "Switched parties since last election",
    icon: "repeat",
    color: "warning"
  },
  "Vaguwa": {
    id: "vaguwa",
    name: "Vaguwa",
    nameNepali: "भगुवा",
    description: "Changed constituency since last election",
    icon: "footprints",
    color: "bronze"
  },
  "Vaguwa (Won Prev)": {
    id: "vaguwa-won",
    name: "Vaguwa (Won Prev)",
    nameNepali: "भगुवा (विजयी)",
    description: "Changed constituency after winning previous election",
    icon: "footprints",
    color: "primary"
  },
  "New Candidate": {
    id: "new-candidate",
    name: "New Candidate",
    nameNepali: "नयाँ उम्मेदवार",
    description: "First time FPTP candidate",
    icon: "baby",
    color: "primary"
  },
  "Educated": {
    id: "educated",
    name: "Educated",
    nameNepali: "शिक्षित",
    description: "High School (+2) or above qualification",
    icon: "graduation-cap",
    color: "silver"
  },
  "Uneducated": {
    id: "uneducated",
    name: "Uneducated",
    nameNepali: "अशिक्षित",
    description: "Below High School qualification",
    icon: "fingerprint",
    color: "bronze"
  },
  "New Party": {
    id: "new-party",
    name: "New Party",
    nameNepali: "नयाँ पार्टी",
    description: "Party formed after last elections",
    icon: "party-popper",
    color: "accent"
  },
  "Gen-z": {
    id: "gen-z",
    name: "Gen-Z",
    nameNepali: "जेन-जी",
    description: "Under 30 years old",
    icon: "sparkles",
    color: "primary"
  },
  "Grandpa": {
    id: "grandpa",
    name: "Grandpa",
    nameNepali: "बाजे",
    description: "Over 60 years old",
    icon: "user-round",
    color: "silver"
  },
  "Influential": {
    id: "influential",
    name: "Influential",
    nameNepali: "प्रभावशाली",
    description: "Won previous election with 20%+ margin",
    icon: "star",
    color: "gold"
  },
  "Opportunist": {
    id: "opportunist",
    name: "Opportunist",
    nameNepali: "अवसरवादी",
    description: "Was Independent, now with established party",
    icon: "banknote",
    color: "warning"
  },
  "Split Vote": {
    id: "split-vote",
    name: "Split Vote",
    nameNepali: "भोट बाँडेर",
    description: "Got less than 3% votes in last election",
    icon: "scissors",
    color: "destructive"
  },
  "Proportional Veteran": {
    id: "proportional-veteran",
    name: "PR Veteran",
    nameNepali: "समानुपातिक दिग्गज",
    description: "Parliament member via proportional list",
    icon: "medal",
    color: "gold"
  },
  "Loyal": {
    id: "loyal",
    name: "Loyal",
    nameNepali: "वफादार",
    description: "Same party & constituency across all elections",
    icon: "shield",
    color: "gold"
  }
}

// Sample data matching the actual JSON structure
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
    elections_contested: 2,
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
    candidate_type: "Same Location",
    tags: ["Educated", "Loyal"]
  },
  {
    candidate_id: 339725,
    candidate_name: "राजेन्द्र कुमार राई",
    gender: "पुरुष",
    age: 59,
    age_group: "50-60",
    date_of_birth: 59,
    father_name: "तेज वहादुर राई",
    spouse_name: "मन्जु राई",
    qualification: "आई.ए.",
    qualification_level: "2",
    qualification_level_scale: 3,
    institution_name: "त्रि.वि.",
    address: "धनकुटा पाख्रिवास नगरपालिका राम्चे",
    experience: "२०७४ र २०७९ मा सम्पन्न प्रतिनिधि सभा सदस्य निर्वाचन विजयी\nदुई पटक संघीय मन्त्रीको जिम्मेवारी \n२०४९ मा जि.वि.स. सदस्य र २०५४ मा जि.वि.स. उपसभापति",
    other_details: null,
    symbol_code: 2598,
    symbol_name: "सुर्य",
    political_party_name: "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)",
    state_id: 1,
    state_name: "कोशी प्रदेश",
    district_id: 8,
    district_name: "धनकुटा",
    constituency_id: 1,
    constituency_name: 1,
    citizenship_district: "धनकुटा",
    election_status: null,
    current_vote_received: 0,
    rank_position: 1,
    prev_election_votes: 30101,
    prev_election_rank: "1",
    prev_election_remarks: "Elected",
    prev_election_result: "Winner",
    prev_election_party: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    prev_election_state: 1,
    prev_election_district: "धनकुटा",
    prev_election_district_cd: 8,
    prev_election_constituency_id: "1",
    prev_election_casted_vote: 66727.0,
    prev_election_total_voters: 0,
    prev_qualification: "Bachelor",
    prev_qualification_level: "Bachelor",
    prev_runner_up_votes: 28704,
    prev_2074_election_votes: 37333,
    prev_2074_election_rank: "1",
    prev_2074_election_remarks: "Elected",
    prev_2074_election_result: "Winner",
    prev_2074_election_party: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    prev_2074_election_state: 1,
    prev_2074_election_district: "धनकुटा",
    prev_2074_election_constituency_id: "1",
    prev_2074_election_casted_vote: 0,
    prev_2074_election_total_voters: 0,
    prev_2074_runner_up_votes: 33310,
    elections_contested: 2,
    party_previous_names: [
      "नेपाल कम्युनिष्ट पार्टी (एमाले)",
      "नेपाल कम्युनिष्ट पार्टी (नेकपा)",
      "नेपाल कम्युनिष्ट पार्टी (माक्र्सवादी)",
      "नेपाल कम्युनिष्ट पार्टी (मार्क्सवादी लेनिनवादी)"
    ],
    is_same_party_after_merger_check: true,
    is_same_party_2074_after_merger_check: true,
    is_same_party_2074_2079: true,
    is_tourist_candidate: false,
    is_education_changed: true,
    is_new_party: false,
    was_parliament_member_2074: true,
    parliament_member_2074_election_type: "FPTP",
    parliament_member_2074_party: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    parliament_member_2074_district: "धनकुटा",
    parliament_member_2074_constituency: 1,
    was_parliament_member_2079: true,
    parliament_member_2079_election_type: "FPTP",
    parliament_member_2079_party: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    parliament_member_2079_district: "धनकुटा",
    parliament_member_2079_constituency: 1,
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
    candidate_type: "Same Location",
    tags: ["Educated", "Loyal"]
  },
  {
    candidate_id: 340452,
    candidate_name: "ज्ञानेन्द्र बहादुर कार्की",
    gender: "पुरुष",
    age: 69,
    age_group: "60+",
    date_of_birth: 69,
    father_name: "कृष्ण मोहन कार्की",
    spouse_name: "नविना राणा",
    qualification: "स्नातोकत्तर(राजनैतिक शास्त्र)",
    qualification_level: "Masters",
    qualification_level_scale: 5,
    institution_name: "त्रि.वि.वि.",
    address: "सुनसरी बराहक्षेत्र नगरपालिका",
    experience: "-",
    other_details: "-",
    symbol_code: 2583,
    symbol_name: "रुख",
    political_party_name: "नेपाली काँग्रेस",
    state_id: 1,
    state_name: "कोशी प्रदेश",
    district_id: 10,
    district_name: "सुनसरी",
    constituency_id: 4,
    constituency_name: 4,
    citizenship_district: "भोजपुर",
    election_status: null,
    current_vote_received: 0,
    rank_position: 1,
    prev_election_votes: 30483,
    prev_election_rank: "1",
    prev_election_remarks: "Elected",
    prev_election_result: "Winner",
    prev_election_party: "नेपाली काँग्रेस",
    prev_election_state: 1,
    prev_election_district: "सुनसरी",
    prev_election_district_cd: 10,
    prev_election_constituency_id: "4",
    prev_election_casted_vote: 74423.0,
    prev_election_total_voters: 0,
    prev_qualification: "Masters",
    prev_qualification_level: "Masters",
    prev_runner_up_votes: 30371,
    prev_2074_election_votes: 32347,
    prev_2074_election_rank: "1",
    prev_2074_election_remarks: "Elected",
    prev_2074_election_result: "Winner",
    prev_2074_election_party: "नेपाली काँग्रेस",
    prev_2074_election_state: 1,
    prev_2074_election_district: "सुनसरी",
    prev_2074_election_constituency_id: "4",
    prev_2074_election_casted_vote: 0,
    prev_2074_election_total_voters: 0,
    prev_2074_runner_up_votes: 26822,
    elections_contested: 2,
    party_previous_names: [],
    is_same_party_after_merger_check: true,
    is_same_party_2074_after_merger_check: true,
    is_same_party_2074_2079: true,
    is_tourist_candidate: true,
    is_education_changed: false,
    is_new_party: true,
    was_parliament_member_2074: true,
    parliament_member_2074_election_type: "FPTP",
    parliament_member_2074_party: "नेपाली काङ्ग्रेस",
    parliament_member_2074_district: "सुनसरी",
    parliament_member_2074_constituency: 4,
    was_parliament_member_2079: true,
    parliament_member_2079_election_type: "FPTP",
    parliament_member_2079_party: "नेपाली काङ्ग्रेस",
    parliament_member_2079_district: "सुनसरी",
    parliament_member_2079_constituency: 4,
    is_proportional_veteran: false,
    is_chheparo: false,
    is_vaguwa: false,
    is_vaguwa_prev_winner: false,
    is_new_candidate: false,
    is_educated: true,
    is_uneducated: false,
    is_gen_z: false,
    is_grandpa: true,
    is_influential: false,
    is_opportunist: false,
    is_split_vote_candidate: false,
    is_loyal: true,
    candidate_type: "Same Location",
    tags: ["Tourist", "Educated", "New Party", "Grandpa", "Loyal"]
  },
  {
    candidate_id: 340917,
    candidate_name: "उपेन्द्र यादव",
    gender: "पुरुष",
    age: 65,
    age_group: "60+",
    date_of_birth: 65,
    father_name: "धनि लाल यादव",
    spouse_name: "पार्वती देवी यादव",
    qualification: "स्नातकोत्तर",
    qualification_level: "Masters",
    qualification_level_scale: 5,
    institution_name: null,
    address: "मोरङ विराटनगर महानगरपालिका पुरानो हवाइ फिल्ड",
    experience: null,
    other_details: null,
    symbol_code: 2542,
    symbol_name: "ढल्केको छाता",
    political_party_name: "जनता समाजवादी पार्टी, नेपाल",
    state_id: 2,
    state_name: "मधेश प्रदेश",
    district_id: 15,
    district_name: "सप्तरी",
    constituency_id: 3,
    constituency_name: 3,
    citizenship_district: "सुनसरी",
    election_status: null,
    current_vote_received: 0,
    rank_position: 1,
    prev_election_votes: 16979,
    prev_election_rank: "1",
    prev_election_remarks: null,
    prev_election_result: "Loser",
    prev_election_party: "जनता समाजवादी पार्टी, नेपाल",
    prev_election_state: 2,
    prev_election_district: "सप्तरी",
    prev_election_district_cd: 15,
    prev_election_constituency_id: "2",
    prev_election_casted_vote: 60921.0,
    prev_election_total_voters: 0,
    prev_qualification: "Masters",
    prev_qualification_level: "Masters",
    prev_runner_up_votes: 16979,
    prev_2074_election_votes: 21620,
    prev_2074_election_rank: "1",
    prev_2074_election_remarks: "Elected",
    prev_2074_election_result: "Winner",
    prev_2074_election_party: "संघीय समाजवादी फोरम नेपाल",
    prev_2074_election_state: 2,
    prev_2074_election_district: "सप्तरी",
    prev_2074_election_constituency_id: "2",
    prev_2074_election_casted_vote: 0,
    prev_2074_election_total_voters: 0,
    prev_2074_runner_up_votes: 19704,
    elections_contested: 2,
    party_previous_names: [
      "नयाँ शक्ति पार्टी नेपाल",
      "संघीय समाजवादी फोरम नेपाल"
    ],
    is_same_party_after_merger_check: false,
    is_same_party_2074_after_merger_check: true,
    is_same_party_2074_2079: false,
    is_tourist_candidate: true,
    is_education_changed: false,
    is_new_party: false,
    was_parliament_member_2074: true,
    parliament_member_2074_election_type: "FPTP",
    parliament_member_2074_party: "जनता समाजवादी पार्टी नेपाल",
    parliament_member_2074_district: "सप्तरी",
    parliament_member_2074_constituency: 2,
    was_parliament_member_2079: true,
    parliament_member_2079_election_type: "FPTP",
    parliament_member_2079_party: "जनता समाजवादी पार्टी नेपाल",
    parliament_member_2079_district: "बारा",
    parliament_member_2079_constituency: 2,
    is_proportional_veteran: false,
    is_chheparo: true,
    is_vaguwa: true,
    is_vaguwa_prev_winner: false,
    is_new_candidate: false,
    is_educated: true,
    is_uneducated: false,
    is_gen_z: false,
    is_grandpa: true,
    is_influential: false,
    is_opportunist: false,
    is_split_vote_candidate: false,
    is_loyal: false,
    candidate_type: "Chheparo",
    tags: ["Tourist", "Chheparo", "Vaguwa", "Educated", "Grandpa"]
  },
  {
    candidate_id: 340864,
    candidate_name: "लिलानाथ श्रेष्ठ",
    gender: "पुरुष",
    age: 68,
    age_group: "60+",
    date_of_birth: 68,
    father_name: "जित वहादुर श्रेष्ठ",
    spouse_name: "विश्व श्रेष्ठ",
    qualification: "स्नातक",
    qualification_level: "Bachelor",
    qualification_level_scale: 4,
    institution_name: "TU",
    address: "सिराहा गोलबजार नगरपालिका चोहर्वा",
    experience: "2037साल देखि राजनीतिक",
    other_details: null,
    symbol_code: 2598,
    symbol_name: "सुर्य",
    political_party_name: "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)",
    state_id: 2,
    state_name: "मधेश प्रदेश",
    district_id: 16,
    district_name: "सिराहा",
    constituency_id: 3,
    constituency_name: 3,
    citizenship_district: "सिराहा",
    election_status: null,
    current_vote_received: 0,
    rank_position: 1,
    prev_election_votes: 28064,
    prev_election_rank: "1",
    prev_election_remarks: "Elected",
    prev_election_result: "Winner",
    prev_election_party: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    prev_election_state: 2,
    prev_election_district: "सिराहा",
    prev_election_district_cd: 16,
    prev_election_constituency_id: "3",
    prev_election_casted_vote: 69406.0,
    prev_election_total_voters: 0,
    prev_qualification: "Bachelor",
    prev_qualification_level: "Bachelor",
    prev_runner_up_votes: 26882,
    prev_2074_election_votes: 23272,
    prev_2074_election_rank: "1",
    prev_2074_election_remarks: "Elected",
    prev_2074_election_result: "Winner",
    prev_2074_election_party: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    prev_2074_election_state: 2,
    prev_2074_election_district: "सिराहा",
    prev_2074_election_constituency_id: "3",
    prev_2074_election_casted_vote: 0,
    prev_2074_election_total_voters: 0,
    prev_2074_runner_up_votes: 27847,
    elections_contested: 2,
    party_previous_names: [
      "नेपाल कम्युनिष्ट पार्टी (एमाले)",
      "नेपाल कम्युनिष्ट पार्टी (नेकपा)",
      "नेपाल कम्युनिष्ट पार्टी (माक्र्सवादी)",
      "नेपाल कम्युनिष्ट पार्टी (मार्क्सवादी लेनिनवादी)"
    ],
    is_same_party_after_merger_check: true,
    is_same_party_2074_after_merger_check: true,
    is_same_party_2074_2079: true,
    is_tourist_candidate: false,
    is_education_changed: false,
    is_new_party: false,
    was_parliament_member_2074: true,
    parliament_member_2074_election_type: "FPTP",
    parliament_member_2074_party: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    parliament_member_2074_district: "सिराहा",
    parliament_member_2074_constituency: 3,
    was_parliament_member_2079: true,
    parliament_member_2079_election_type: "FPTP",
    parliament_member_2079_party: "नेपाल कम्युनिष्ट पार्टी (एमाले)",
    parliament_member_2079_district: "सिराहा",
    parliament_member_2079_constituency: 3,
    is_proportional_veteran: false,
    is_chheparo: false,
    is_vaguwa: false,
    is_vaguwa_prev_winner: false,
    is_new_candidate: false,
    is_educated: true,
    is_uneducated: false,
    is_gen_z: false,
    is_grandpa: true,
    is_influential: false,
    is_opportunist: false,
    is_split_vote_candidate: false,
    is_loyal: true,
    candidate_type: "Same Location",
    tags: ["Educated", "Grandpa", "Loyal"]
  }
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
