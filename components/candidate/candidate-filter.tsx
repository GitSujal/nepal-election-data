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

      {/* Selected badge showcase cards */}
      {selectedBadges.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {selectedBadges.map(badge => {
            const def = badgeDefinitions[badge]
            const Icon = def ? iconMap[def.icon] : null
            const color = def?.color ?? "primary"
            const colorMap: Record<string, string> = {
              gold: "bg-gold/20 text-gold border-gold/40",
              silver: "bg-silver/20 text-silver border-silver/40",
              bronze: "bg-bronze/20 text-bronze border-bronze/40",
              primary: "bg-primary/20 text-primary border-primary/40",
              accent: "bg-accent/20 text-accent border-accent/40",
              warning: "bg-warning/20 text-warning border-warning/40",
              destructive: "bg-destructive/20 text-destructive border-destructive/40",
            }
            const bgMap: Record<string, string> = {
              gold: "from-gold/30 to-gold/5",
              silver: "from-silver/30 to-silver/5",
              bronze: "from-bronze/30 to-bronze/5",
              primary: "from-primary/30 to-primary/5",
              accent: "from-accent/30 to-accent/5",
              warning: "from-warning/30 to-warning/5",
              destructive: "from-destructive/30 to-destructive/5",
            }
            const count = filteredCandidates.length
            return (
              <button
                key={badge}
                type="button"
                onClick={() => toggleBadge(badge)}
                title={def?.description_np || def?.description}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all hover:scale-[1.02] ${colorMap[color]}`}
              >
                {/* Glow background */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-b opacity-50 ${bgMap[color]}`} />
                {/* Close button */}
                <X className="absolute right-1.5 top-1.5 z-10 h-3.5 w-3.5 opacity-60 hover:opacity-100" />
                {/* Icon */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow-md">
                  {Icon && <Icon size={20} />}
                </div>
                {/* Name */}
                <span className="relative z-10 text-xs font-bold leading-tight">
                  {def?.nameNepali ?? def?.name ?? badge}
                </span>
                {def?.nameNepali && (
                  <span className="relative z-10 text-[10px] opacity-70">{def.name}</span>
                )}
                {/* Count */}
                <span className="relative z-10 mt-0.5 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold shadow-sm">
                  {count} उम्मेदवार
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
