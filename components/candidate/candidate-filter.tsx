"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ChevronDown, X, Filter, Shield, Star, GraduationCap, Plane, Repeat, Footprints, Baby, Fingerprint, PartyPopper, Sparkles, UserRound, Banknote, Scissors, Medal, Crown, HeartHandshake } from "lucide-react"
import { useJsonData } from "@/hooks/use-json-data"
import { badgeDefinitions, tagNameToIdMap } from "@/lib/candidates-data"
import type { FPTPFilterState } from "@/lib/filter-types"

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
  candidate_id: number
  candidate_name: string
  state_id: number
  state_name: string
  district_id: number
  district_name: string
  constituency_id: number
  political_party_name: string
  party_id: number | null
  party_display_order?: number
  tags?: string[]
  [key: string]: any
}

interface CandidateFilterProps {
  onSelectCandidate: (candidate: CandidateData | null) => void
  onFilteredCandidatesChange: (candidates: CandidateData[]) => void
  selectedCandidate: CandidateData | null
  // URL state integration
  urlState: FPTPFilterState
  onUrlStateChange: (updates: Partial<FPTPFilterState>) => void
}

export function CandidateFilter({
  onSelectCandidate,
  onFilteredCandidatesChange,
  selectedCandidate,
  urlState,
  onUrlStateChange,
}: CandidateFilterProps) {
  const [badgeDropdownOpen, setBadgeDropdownOpen] = useState(false)
  const badgeDropdownRef = useRef<HTMLDivElement>(null)

  const effectiveBadges = useMemo(
    () => urlState.badges.map(badge => tagNameToIdMap[badge] ?? badge),
    [urlState.badges]
  )

  useEffect(() => {
    const deduped = Array.from(new Set(effectiveBadges))
    const hasChanges =
      deduped.length !== urlState.badges.length ||
      deduped.some((badge, index) => badge !== urlState.badges[index])
    if (hasChanges) {
      onUrlStateChange({ badges: deduped })
    }
  }, [effectiveBadges, onUrlStateChange, urlState.badges])

  // Load all candidates from JSON
  const { data: allCandidates, loading: dataLoading } = useJsonData<CandidateData>(
    'dim_current_fptp_candidates'
  )

  // Convert IDs to display values using useMemo
  const selectedStateName = useMemo(() => {
    if (!urlState.state || !allCandidates) return ''
    const match = allCandidates.find(c => c.state_id === urlState.state)
    return match?.state_name || ''
  }, [urlState.state, allCandidates])

  const selectedDistrictName = useMemo(() => {
    if (!urlState.district || !allCandidates) return ''
    const match = allCandidates.find(c => c.district_id === urlState.district)
    return match?.district_name || ''
  }, [urlState.district, allCandidates])

  // Extract unique states
  const states = useMemo(() => {
    if (!allCandidates) return []
    const stateMap = new Map<number, string>()
    for (const c of allCandidates) {
      if (!stateMap.has(c.state_id)) {
        stateMap.set(c.state_id, c.state_name)
      }
    }
    return Array.from(stateMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allCandidates])

  // Extract districts based on selected state
  const districts = useMemo(() => {
    if (!allCandidates || !urlState.state) return []
    const filtered = allCandidates.filter(c => c.state_id === urlState.state)
    const districtMap = new Map<number, string>()
    for (const c of filtered) {
      if (!districtMap.has(c.district_id)) {
        districtMap.set(c.district_id, c.district_name)
      }
    }
    return Array.from(districtMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allCandidates, urlState.state])

  // Extract constituencies based on selected district
  const constituencies = useMemo(() => {
    if (!allCandidates || !urlState.district) return []
    const filtered = allCandidates.filter(c => c.district_id === urlState.district)
    const unique = Array.from(new Set(filtered.map(c => c.constituency_id)))
    return unique.sort((a, b) => a - b)
  }, [allCandidates, urlState.district])

  // Extract parties - filtered based on current selection, sorted by party_display_order
  const parties = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (urlState.state) filtered = filtered.filter(c => c.state_id === urlState.state)
    if (urlState.district) filtered = filtered.filter(c => c.district_id === urlState.district)
    if (urlState.constituency) filtered = filtered.filter(c => c.constituency_id === urlState.constituency)
    // Build a map of party ID → { name, order }
    const partyOrderMap = new Map<number, { name: string; order: number }>()
    for (const c of filtered) {
      if (!c.party_id) continue
      const order = c.party_display_order ?? 9999
      const existing = partyOrderMap.get(c.party_id)
      if (!existing || order < existing.order) {
        partyOrderMap.set(c.party_id, { name: c.political_party_name, order })
      }
    }
    return Array.from(partyOrderMap.entries())
      .map(([id, data]) => ({ id, name: data.name, order: data.order }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
  }, [allCandidates, urlState.state, urlState.district, urlState.constituency])

  // Available badges based on current geographic/party filters
  const availableBadges = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (urlState.state) filtered = filtered.filter(c => c.state_id === urlState.state)
    if (urlState.district) filtered = filtered.filter(c => c.district_id === urlState.district)
    if (urlState.constituency) filtered = filtered.filter(c => c.constituency_id === urlState.constituency)
    if (urlState.party) filtered = filtered.filter(c => c.party_id === urlState.party)
    const badgeSet = new Set<string>()
    for (const c of filtered) {
      if (c.tags) {
        for (const t of c.tags) badgeSet.add(t)
      }
    }
    return Object.keys(badgeDefinitions).filter(b => badgeSet.has(b))
  }, [allCandidates, urlState.state, urlState.district, urlState.constituency, urlState.party])

  // Filter candidates based on selected filters, sorted by party_display_order
  const filteredCandidates = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (urlState.state) filtered = filtered.filter(c => c.state_id === urlState.state)
    if (urlState.district) filtered = filtered.filter(c => c.district_id === urlState.district)
    if (urlState.constituency) filtered = filtered.filter(c => c.constituency_id === urlState.constituency)
    if (urlState.party) filtered = filtered.filter(c => c.party_id === urlState.party)
    if (effectiveBadges.length > 0) {
      filtered = filtered.filter(c =>
        c.tags && effectiveBadges.every(b => c.tags?.includes(b))
      )
    }
    return [...filtered].sort((a, b) => (a.party_display_order ?? 9999) - (b.party_display_order ?? 9999))
  }, [allCandidates, urlState.state, urlState.district, urlState.constituency, urlState.party, effectiveBadges])

  // Notify parent of filtered candidates
  useEffect(() => {
    onFilteredCandidatesChange(filteredCandidates)
  }, [filteredCandidates, onFilteredCandidatesChange])

  // Auto-select district if only one available
  useEffect(() => {
    if (urlState.state && districts.length === 1 && !urlState.district) {
      onUrlStateChange({ district: districts[0].id })
    }
  }, [urlState.state, districts, urlState.district, onUrlStateChange])

  // Auto-select constituency if only one available
  useEffect(() => {
    if (urlState.district && constituencies.length === 1 && !urlState.constituency) {
      onUrlStateChange({ constituency: constituencies[0] })
    }
  }, [urlState.district, constituencies, urlState.constituency, onUrlStateChange])

  // Auto-select candidate if only one available
  useEffect(() => {
    if ((urlState.party || urlState.state || urlState.district || urlState.constituency) && filteredCandidates.length === 1) {
      onSelectCandidate(filteredCandidates[0])
      onUrlStateChange({ candidate: filteredCandidates[0].candidate_id })
    }
  }, [filteredCandidates, urlState.party, urlState.state, urlState.district, urlState.constituency, onSelectCandidate, onUrlStateChange])

  // Select candidate from URL state on initial load
  useEffect(() => {
    if (urlState.candidate && allCandidates && !selectedCandidate) {
      const candidate = filteredCandidates.find(c => c.candidate_id === urlState.candidate)
      if (candidate) {
        onSelectCandidate(candidate)
      } else if (filteredCandidates.length > 0) {
        // Candidate ID doesn't match any in filtered results, clear it
        onUrlStateChange({ candidate: 0 })
      }
    }
  }, [urlState.candidate, allCandidates, filteredCandidates, selectedCandidate, onSelectCandidate, onUrlStateChange])

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

  // Handle state change - cascade reset children
  const handleStateChange = (stateId: number) => {
    onUrlStateChange({
      state: stateId,
      district: 0,
      constituency: 0,
      party: '',
      candidate: 0,
    })
    onSelectCandidate(null)
  }

  // Handle district change - cascade reset children
  const handleDistrictChange = (districtId: number) => {
    onUrlStateChange({
      district: districtId,
      constituency: 0,
      party: 0,
      candidate: 0,
    })
    onSelectCandidate(null)
  }

  // Handle constituency change - cascade reset children
  const handleConstituencyChange = (constituencyId: number) => {
    onUrlStateChange({
      constituency: constituencyId,
      party: 0,
      candidate: 0,
    })
    onSelectCandidate(null)
  }

  // Handle party change
  const handlePartyChange = (partyId: number) => {
    onUrlStateChange({
      party: partyId,
      candidate: 0,
    })
    onSelectCandidate(null)
  }

  const handleReset = () => {
    onUrlStateChange({
      state: 0,
      district: 0,
      constituency: 0,
      party: 0,
      badges: [],
      candidate: 0,
    })
    onSelectCandidate(null)
  }

  const toggleBadge = (badge: string) => {
    const newBadges = effectiveBadges.includes(badge)
      ? effectiveBadges.filter(b => b !== badge)
      : [...effectiveBadges, badge]
    onUrlStateChange({ badges: newBadges })
  }

  const hasActiveFilters = urlState.state || urlState.district || urlState.constituency || urlState.party || effectiveBadges.length > 0

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
                value={urlState.state || ''}
                onChange={(e) => handleStateChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">सबै प्रदेशहरू ({states.length})</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
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
                value={urlState.district || ''}
                onChange={(e) => handleDistrictChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                disabled={!urlState.state}
              >
                <option value="">सबै जिल्लाहरू ({districts.length})</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
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
                value={urlState.constituency || ''}
                onChange={(e) => handleConstituencyChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                disabled={!urlState.district}
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
                value={urlState.party || ''}
                onChange={(e) => handlePartyChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">सबै दलहरू ({parties.length})</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
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
              <span className={effectiveBadges.length === 0 ? "text-muted-foreground" : ""}>
                {effectiveBadges.length === 0
                  ? `सबै विशेषताहरू (${availableBadges.length})`
                  : `${effectiveBadges.length} चयन गरिएको`}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {badgeDropdownOpen && (
              <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                {availableBadges.map(badge => {
                  const def = badgeDefinitions[badge]
                  const isSelected = effectiveBadges.includes(badge)
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
      {effectiveBadges.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {effectiveBadges.map(badge => {
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
