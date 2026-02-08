"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { ChevronDown, X, Filter, Shield, Star, Crown, Trophy, ArrowDown, User, Users, Accessibility, MapPin, Medal, TrendingUp, TrendingDown, RotateCcw, Zap, Repeat, Baby, PartyPopper, Banknote, HeartHandshake, Building2 } from "lucide-react"
import { useJsonData } from "@/hooks/use-json-data"
import { badgeDefinitions, tagNameToIdMap } from "@/lib/candidates-data"
import type { PRFilterState } from "@/lib/filter-types"

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  star: Star,
  crown: Crown,
  trophy: Trophy,
  "arrow-down": ArrowDown,
  user: User,
  users: Users,
  accessibility: Accessibility,
  "map-pin": MapPin,
  medal: Medal,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "rotate-ccw": RotateCcw,
  zap: Zap,
  repeat: Repeat,
  baby: Baby,
  "party-popper": PartyPopper,
  banknote: Banknote,
  "heart-handshake": HeartHandshake,
  building2: Building2,
}

interface PRCandidateData {
  serial_no: number
  candidate_name: string
  political_party_name: string
  inclusive_group: string | null
  inclusive_group_id: number | null
  citizenship_district: string
  rank_position: number
  party_id: number | null
  party_display_order: number | null
  tags: string[]
  [key: string]: any
}

interface PRCandidateFilterProps {
  onSelectCandidate: (candidate: PRCandidateData | null) => void
  onFilteredCandidatesChange: (candidates: PRCandidateData[]) => void
  selectedCandidate: PRCandidateData | null
  // URL state integration
  urlState: PRFilterState
  onUrlStateChange: (updates: Partial<PRFilterState>) => void
}

export function PRCandidateFilter({
  onSelectCandidate,
  onFilteredCandidatesChange,
  selectedCandidate,
  urlState,
  onUrlStateChange,
}: PRCandidateFilterProps) {
  const [badgeDropdownOpen, setBadgeDropdownOpen] = useState(false)
  const badgeDropdownRef = useRef<HTMLDivElement>(null)
  const isClearing = useRef(false)

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

  // Load all PR candidates from JSON
  const { data: allCandidates, loading: dataLoading } = useJsonData<PRCandidateData>(
    'dim_current_proportional_candidates'
  )

  // Extract unique parties sorted by display order
  const parties = useMemo(() => {
    if (!allCandidates) return []
    const partyOrderMap = new Map<number, { name: string; order: number }>()
    for (const c of allCandidates) {
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
  }, [allCandidates])

  // Extract unique inclusive groups
  const inclusiveGroups = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (urlState.party) filtered = filtered.filter(c => c.party_id === urlState.party)
    const groups = new Map<number, string>()
    for (const c of filtered) {
      if (c.inclusive_group_id && c.inclusive_group && c.inclusive_group.trim()) {
        if (!groups.has(c.inclusive_group_id)) {
          groups.set(c.inclusive_group_id, c.inclusive_group)
        }
      }
    }
    return Array.from(groups.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allCandidates, urlState.party])

  // Available badges based on current filters
  const availableBadges = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (urlState.party) filtered = filtered.filter(c => c.party_id === urlState.party)
    if (urlState.group) filtered = filtered.filter(c => c.inclusive_group_id === urlState.group)
    const badgeSet = new Set<string>()
    for (const c of filtered) {
      if (c.tags) {
        for (const t of c.tags) badgeSet.add(t)
      }
    }
    return Object.keys(badgeDefinitions).filter(b => badgeSet.has(b))
  }, [allCandidates, urlState.party, urlState.group])

  // Filter candidates based on selected filters, sorted by party_display_order then rank
  const filteredCandidates = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (urlState.party) filtered = filtered.filter(c => c.party_id === urlState.party)
    if (urlState.group) filtered = filtered.filter(c => c.inclusive_group_id === urlState.group)
    if (effectiveBadges.length > 0) {
      filtered = filtered.filter(c =>
        c.tags && effectiveBadges.every(b => c.tags.includes(b))
      )
    }
    return [...filtered].sort((a, b) => {
      const orderDiff = (a.party_display_order ?? 9999) - (b.party_display_order ?? 9999)
      if (orderDiff !== 0) return orderDiff
      return a.rank_position - b.rank_position
    })
  }, [allCandidates, urlState.party, urlState.group, effectiveBadges])

  // Notify parent of filtered candidates
  useEffect(() => {
    onFilteredCandidatesChange(filteredCandidates)
  }, [filteredCandidates, onFilteredCandidatesChange])

  // Track the last candidate ID we restored from URL to prevent duplicate selections
  const lastUrlSelectedId = useRef<number>(0)
  // Suppress auto-select after user explicitly dismisses a candidate (back button)
  const suppressAutoSelect = useRef(false)

  // Reset suppressAutoSelect when actual filter values change (user is browsing again)
  useEffect(() => {
    suppressAutoSelect.current = false
  }, [urlState.party, urlState.group, effectiveBadges])

  // Auto-select candidate if only one available after applying filters
  // Only triggers when filters or results change, not when selection is cleared
  useEffect(() => {
    if (suppressAutoSelect.current) return
    if ((urlState.party || urlState.group) &&
        filteredCandidates.length === 1 &&
        !urlState.candidate &&
        !selectedCandidate) {
      onSelectCandidate(filteredCandidates[0])
      // URL is updated by the handler
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCandidates, urlState.party, urlState.group, onSelectCandidate])

  // Select candidate from URL state on initial load or when URL candidate changes
  useEffect(() => {
    // Don't run if we're deliberately clearing the selection
    if (isClearing.current) {
      isClearing.current = false
      return
    }

    if (urlState.candidate && allCandidates) {
      const candidate = filteredCandidates.find(c => c.serial_no === urlState.candidate)
      if (candidate && urlState.candidate !== lastUrlSelectedId.current) {
        // New candidate from URL - select it (initial load or browser navigation)
        lastUrlSelectedId.current = urlState.candidate
        onSelectCandidate(candidate)
      } else if (!candidate && filteredCandidates.length > 0) {
        // Candidate ID doesn't match any in filtered results, clear it
        lastUrlSelectedId.current = 0
        onUrlStateChange({ candidate: 0 })
      }
    } else if (!urlState.candidate) {
      if (selectedCandidate && lastUrlSelectedId.current) {
        // URL cleared but we have a selection that came from URL - user pressed back
        lastUrlSelectedId.current = 0
        isClearing.current = true
        suppressAutoSelect.current = true
        onSelectCandidate(null)
      } else {
        // No URL candidate and either no selection or selection came from a click
        // (URL hasn't caught up yet) - just reset the ref without clearing
        lastUrlSelectedId.current = 0
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

  // Handle party change - cascade reset children
  const handlePartyChange = (partyId: number) => {
    isClearing.current = true
    onUrlStateChange({
      party: partyId,
      group: 0,
      candidate: 0,
    })
    onSelectCandidate(null)
  }

  // Handle group change
  const handleGroupChange = (groupId: number) => {
    isClearing.current = true
    onUrlStateChange({
      group: groupId,
      candidate: 0,
    })
    onSelectCandidate(null)
  }

  const handleReset = () => {
    isClearing.current = true
    onUrlStateChange({
      party: 0,
      group: 0,
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

  const hasActiveFilters = urlState.party || urlState.group || effectiveBadges.length > 0

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">समानुपातिक उम्मेदवार खोज्नुहोस्</h2>
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

          {/* Inclusive Group */}
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">समावेशी समूह</label>
            <div className="relative">
              <select
                value={urlState.group || ''}
                onChange={(e) => handleGroupChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">सबै समूहहरू ({inclusiveGroups.length})</option>
                {inclusiveGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
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
