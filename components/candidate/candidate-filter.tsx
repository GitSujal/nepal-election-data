"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ChevronDown, X, Filter, Shield, Star, GraduationCap, Plane, Repeat, Footprints, Baby, Fingerprint, PartyPopper, Sparkles, UserRound, Banknote, Scissors, Medal, Crown, HeartHandshake } from "lucide-react"
import { useJsonData } from "@/hooks/use-json-data"
import { badgeDefinitions } from "@/lib/candidates-data"

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  star: Star,
  "graduation-cap": GraduationCap,
  plane: Plane,
  repeat: Repeat,
  footprints: Footprints,
  baby: Baby,
  fingerprint: Fingerprint,
  "party-popper": PartyPopper,
  sparkles: Sparkles,
  "user-round": UserRound,
  banknote: Banknote,
  scissors: Scissors,
  medal: Medal,
  crown: Crown,
  "heart-handshake": HeartHandshake,
}

interface CandidateData {
  candidate_id: string
  candidate_name: string
  state_name: string
  district_name: string
  constituency_id: number | string
  political_party_name: string
  [key: string]: any
}

interface CandidateFilterProps {
  onSelectCandidate: (candidate: CandidateData | null) => void
  onFilteredCandidatesChange: (candidates: CandidateData[]) => void
  selectedCandidate: CandidateData | null
}

export function CandidateFilter({ onSelectCandidate, onFilteredCandidatesChange, selectedCandidate }: CandidateFilterProps) {
  const [state, setState] = useState<string>("")
  const [district, setDistrict] = useState<string>("")
  const [constituency, setConstituency] = useState<string>("")
  const [party, setParty] = useState<string>("")
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [badgeDropdownOpen, setBadgeDropdownOpen] = useState(false)
  const badgeDropdownRef = useRef<HTMLDivElement>(null)

  // Load all candidates from JSON
  const { data: allCandidates, loading: dataLoading } = useJsonData<CandidateData>(
    'dim_current_fptp_candidates'
  )

  // Extract unique states
  const states = useMemo(() => {
    if (!allCandidates) return []
    const unique = Array.from(new Set(allCandidates.map(c => c.state_name)))
    return unique.sort()
  }, [allCandidates])

  // Extract districts based on selected state
  const districts = useMemo(() => {
    if (!allCandidates || !state) return []
    const filtered = allCandidates.filter(c => c.state_name === state)
    const unique = Array.from(new Set(filtered.map(c => c.district_name)))
    return unique.sort()
  }, [allCandidates, state])

  // Extract constituencies based on selected district
  const constituencies = useMemo(() => {
    if (!allCandidates || !district) return []
    const filtered = allCandidates.filter(c => c.district_name === district)
    const unique = Array.from(new Set(filtered.map(c => String(c.constituency_id))))
    return unique.sort((a, b) => parseInt(a) - parseInt(b))
  }, [allCandidates, district])

  // Extract parties - filtered based on current selection, sorted by party_display_order
  const parties = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (state) filtered = filtered.filter(c => c.state_name === state)
    if (district) filtered = filtered.filter(c => c.district_name === district)
    if (constituency) filtered = filtered.filter(c => String(c.constituency_id) === constituency)
    // Build a map of party name → min display order
    const partyOrderMap = new Map<string, number>()
    for (const c of filtered) {
      const order = c.party_display_order ?? 9999
      const existing = partyOrderMap.get(c.political_party_name)
      if (existing === undefined || order < existing) {
        partyOrderMap.set(c.political_party_name, order)
      }
    }
    return Array.from(partyOrderMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name)
  }, [allCandidates, state, district, constituency])

  // Available badges based on current geographic/party filters
  const availableBadges = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (state) filtered = filtered.filter(c => c.state_name === state)
    if (district) filtered = filtered.filter(c => c.district_name === district)
    if (constituency) filtered = filtered.filter(c => String(c.constituency_id) === constituency)
    if (party) filtered = filtered.filter(c => c.political_party_name === party)
    const badgeSet = new Set<string>()
    for (const c of filtered) {
      if (c.tags) {
        for (const t of c.tags) badgeSet.add(t)
      }
    }
    return Object.keys(badgeDefinitions).filter(b => badgeSet.has(b))
  }, [allCandidates, state, district, constituency, party])

  // Filter candidates based on selected filters, sorted by party_display_order
  const filteredCandidates = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (state) filtered = filtered.filter(c => c.state_name === state)
    if (district) filtered = filtered.filter(c => c.district_name === district)
    if (constituency) filtered = filtered.filter(c => String(c.constituency_id) === constituency)
    if (party) filtered = filtered.filter(c => c.political_party_name === party)
    if (selectedBadges.length > 0) {
      filtered = filtered.filter(c =>
        c.tags && selectedBadges.every(b => c.tags.includes(b))
      )
    }
    return [...filtered].sort((a, b) => (a.party_display_order ?? 9999) - (b.party_display_order ?? 9999))
  }, [allCandidates, state, district, constituency, party, selectedBadges])

  // Notify parent of filtered candidates
  useEffect(() => {
    onFilteredCandidatesChange(filteredCandidates)
  }, [filteredCandidates, onFilteredCandidatesChange])

  // Reset dependent filters when parent changes
  useEffect(() => {
    setDistrict("")
    setConstituency("")
    setParty("")
  }, [state])

  useEffect(() => {
    setConstituency("")
    setParty("")
  }, [district])

  useEffect(() => {
    setParty("")
  }, [constituency])

  // Auto-select district if only one available
  useEffect(() => {
    if (state && districts.length === 1 && !district) {
      setDistrict(districts[0])
    }
  }, [state, districts, district])

  // Auto-select constituency if only one available
  useEffect(() => {
    if (district && constituencies.length === 1 && !constituency) {
      setConstituency(constituencies[0])
    }
  }, [district, constituencies, constituency])

  // Auto-select candidate if only one available
  useEffect(() => {
    if ((party || state || district || constituency) && filteredCandidates.length === 1) {
      onSelectCandidate(filteredCandidates[0])
    }
  }, [filteredCandidates, party, state, district, constituency, onSelectCandidate])

  // Close badge dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (badgeDropdownRef.current && !badgeDropdownRef.current.contains(e.target as Node)) {
        setBadgeDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleReset = () => {
    setState("")
    setDistrict("")
    setConstituency("")
    setParty("")
    setSelectedBadges([])
    onSelectCandidate(null)
  }

  const toggleBadge = (badge: string) => {
    setSelectedBadges(prev =>
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    )
  }

  const hasActiveFilters = state || district || constituency || party || selectedBadges.length > 0

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">उम्मेदवार खोज्नुहोस्</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            type="button"
            className="flex items-center gap-1 rounded-lg px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
            रिसेट
          </button>
        )}
      </div>

      {/* Loading state */}
      {dataLoading && (
        <div className="text-center text-muted-foreground py-4">उम्मेदवारहरूको विवरण लोड हुँदैछ...</div>
      )}

      {/* Filters grid */}
      {!dataLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* State */}
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              प्रदेश
            </label>
            <div className="relative">
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">सबै प्रदेशहरू ({states.length})</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* District */}
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">जिल्ला</label>
            <div className="relative">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                disabled={!state}
              >
                <option value="">सबै जिल्लाहरू ({districts.length})</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Constituency */}
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              निर्वाचन क्षेत्र
            </label>
            <div className="relative">
              <select
                value={constituency}
                onChange={(e) => setConstituency(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                disabled={!district}
              >
                <option value="">सबै निर्वाचन क्षेत्रहरू ({constituencies.length})</option>
                {constituencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Party */}
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">दल</label>
            <div className="relative">
              <select
                value={party}
                onChange={(e) => setParty(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">सबै दलहरू ({parties.length})</option>
                {parties.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Badge */}
          <div className="relative" ref={badgeDropdownRef}>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">विशेषताहरू</label>
            <button
              type="button"
              onClick={() => setBadgeDropdownOpen(o => !o)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-input px-4 py-2.5 text-left text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <span className={selectedBadges.length === 0 ? "text-muted-foreground" : ""}>
                {selectedBadges.length === 0
                  ? `सबै विशेषताहरू (${availableBadges.length})`
                  : `${selectedBadges.length} चयन गरिएको`}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {badgeDropdownOpen && (
              <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                {availableBadges.map(badge => {
                  const def = badgeDefinitions[badge]
                  const isSelected = selectedBadges.includes(badge)
                  const Icon = def ? iconMap[def.icon] : null
                  return (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => toggleBadge(badge)}
                      title={def?.description_np || def?.description}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary ${
                        isSelected ? "bg-primary/10 font-medium" : ""
                      }`}
                    >
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                      }`}>
                        {isSelected && <span className="text-xs">✓</span>}
                      </span>
                      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <div className="flex flex-col leading-tight">
                        <span>{def?.nameNepali ?? def?.name ?? badge}</span>
                        {def?.nameNepali && (
                          <span className="text-[10px] text-muted-foreground">{def.name}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected badge chips */}
      {selectedBadges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedBadges.map(badge => {
            const def = badgeDefinitions[badge]
            const Icon = def ? iconMap[def.icon] : null
            return (
              <button
                key={badge}
                type="button"
                onClick={() => toggleBadge(badge)}
                title={def?.description_np || def?.description}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {Icon && <Icon className="h-3 w-3" />}
                <div className="flex flex-col items-start leading-none">
                  <span>{def?.nameNepali ?? def?.name ?? badge}</span>
                  {def?.nameNepali && (
                    <span className="text-[9px] opacity-70">{def.name}</span>
                  )}
                </div>
                <X className="h-3 w-3 ml-0.5" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
