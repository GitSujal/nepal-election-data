"use client"

import { useState, useMemo, useCallback } from "react"
import { ChevronDown, MapPin, Users, Check, ChevronRight, Search } from "lucide-react"
import { useJsonData } from "@/hooks/use-json-data"
import { usePartySymbols } from "@/hooks/use-party-symbols"
import type { Candidate } from "@/lib/candidates-data"
import type { CandidateComparisonFilterState } from "@/lib/filter-types"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ConstituencySelectorProps {
  urlState: CandidateComparisonFilterState
  onUrlStateChange: (updates: Partial<CandidateComparisonFilterState>) => void
  candidate1: Candidate | null
  candidate2: Candidate | null
  onCandidate1Change: (c: Candidate | null) => void
  onCandidate2Change: (c: Candidate | null) => void
}

export function ConstituencySelector({
  urlState,
  onUrlStateChange,
  candidate1,
  candidate2,
  onCandidate1Change,
  onCandidate2Change,
}: ConstituencySelectorProps) {
  const { data: allCandidates, loading } = useJsonData<Candidate>("dim_current_fptp_candidates")
  const { getSymbolUrl } = usePartySymbols()
  const [searchQuery, setSearchQuery] = useState("")

  // Extract unique states
  const states = useMemo(() => {
    if (!allCandidates) return []
    const stateMap = new Map<number, string>()
    for (const c of allCandidates) {
      if (!stateMap.has(c.state_id)) stateMap.set(c.state_id, c.state_name)
    }
    return Array.from(stateMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.id - b.id)
  }, [allCandidates])

  // Extract districts for selected state
  const districts = useMemo(() => {
    if (!allCandidates || !urlState.state) return []
    const filtered = allCandidates.filter((c) => c.state_id === urlState.state)
    const distMap = new Map<number, string>()
    for (const c of filtered) {
      if (!distMap.has(c.district_id)) distMap.set(c.district_id, c.district_name)
    }
    return Array.from(distMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allCandidates, urlState.state])

  // Extract constituencies for selected district
  const constituencies = useMemo(() => {
    if (!allCandidates || !urlState.district) return []
    const filtered = allCandidates.filter((c) => c.district_id === urlState.district)
    const constMap = new Map<number, number>()
    for (const c of filtered) {
      if (!constMap.has(c.constituency_id)) constMap.set(c.constituency_id, c.constituency_name)
    }
    return Array.from(constMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name - b.name)
  }, [allCandidates, urlState.district])

  // Get candidates for the selected constituency
  const constituencyCandidates = useMemo(() => {
    if (!allCandidates || !urlState.constituency) return []
    let filtered = allCandidates.filter((c) => c.constituency_id === urlState.constituency)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.candidate_name.toLowerCase().includes(q) ||
          c.political_party_name.toLowerCase().includes(q)
      )
    }
    return filtered.sort((a, b) => (a.party_display_order ?? 9999) - (b.party_display_order ?? 9999))
  }, [allCandidates, urlState.constituency, searchQuery])

  // Get selected district and state names for display
  const selectedStateName = states.find((s) => s.id === urlState.state)?.name || ""
  const selectedDistrictName = districts.find((d) => d.id === urlState.district)?.name || ""
  const selectedConstituencyName = constituencies.find((c) => c.id === urlState.constituency)?.name

  const handleStateChange = useCallback((stateId: number) => {
    onUrlStateChange({ state: stateId, district: 0, constituency: 0, c1: 0, c2: 0 })
    onCandidate1Change(null)
    onCandidate2Change(null)
    setSearchQuery("")
  }, [onUrlStateChange, onCandidate1Change, onCandidate2Change])

  const handleDistrictChange = useCallback((districtId: number) => {
    onUrlStateChange({ district: districtId, constituency: 0, c1: 0, c2: 0 })
    onCandidate1Change(null)
    onCandidate2Change(null)
    setSearchQuery("")
  }, [onUrlStateChange, onCandidate1Change, onCandidate2Change])

  const handleConstituencyChange = useCallback((constituencyId: number) => {
    onUrlStateChange({ constituency: constituencyId, c1: 0, c2: 0 })
    onCandidate1Change(null)
    onCandidate2Change(null)
    setSearchQuery("")
  }, [onUrlStateChange, onCandidate1Change, onCandidate2Change])

  const handleToggleCandidate = useCallback((candidate: Candidate) => {
    const cId = candidate.candidate_id
    // If already selected as c1, deselect
    if (urlState.c1 === cId) {
      onUrlStateChange({ c1: 0 })
      onCandidate1Change(null)
      return
    }
    // If already selected as c2, deselect
    if (urlState.c2 === cId) {
      onUrlStateChange({ c2: 0 })
      onCandidate2Change(null)
      return
    }
    // If no c1, set as c1
    if (!urlState.c1) {
      onUrlStateChange({ c1: cId })
      onCandidate1Change(candidate)
      return
    }
    // If no c2, set as c2
    if (!urlState.c2) {
      onUrlStateChange({ c2: cId })
      onCandidate2Change(candidate)
      return
    }
    // Both slots full -- replace c2
    onUrlStateChange({ c2: cId })
    onCandidate2Change(candidate)
  }, [urlState.c1, urlState.c2, onUrlStateChange, onCandidate1Change, onCandidate2Change])

  // Restore candidates from URL state on load
  useMemo(() => {
    if (!allCandidates) return
    if (urlState.c1 && !candidate1) {
      const c = allCandidates.find((x) => x.candidate_id === urlState.c1)
      if (c) onCandidate1Change(c)
    }
    if (urlState.c2 && !candidate2) {
      const c = allCandidates.find((x) => x.candidate_id === urlState.c2)
      if (c) onCandidate2Change(c)
    }
  }, [allCandidates, urlState.c1, urlState.c2, candidate1, candidate2, onCandidate1Change, onCandidate2Change])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  const currentStep = !urlState.state ? 1 : !urlState.district ? 2 : !urlState.constituency ? 3 : 4

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[
          { step: 1, label: "प्रदेश" },
          { step: 2, label: "जिल्ला" },
          { step: 3, label: "क्षेत्र" },
          { step: 4, label: "उम्मेदवार" },
        ].map(({ step, label }, idx) => (
          <div key={step} className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-all",
              currentStep >= step
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            )}>
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black",
                currentStep >= step
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted-foreground/10 text-muted-foreground"
              )}>
                {currentStep > step ? <Check className="h-3 w-3" /> : step}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {idx < 3 && (
              <ChevronRight className={cn(
                "h-3.5 w-3.5",
                currentStep > step ? "text-primary" : "text-muted-foreground/30"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Dropdowns Row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* State */}
        <div className="relative">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            प्रदेश छान्नुहोस्
          </label>
          <div className="relative">
            <select
              value={urlState.state}
              onChange={(e) => handleStateChange(parseInt(e.target.value, 10) || 0)}
              className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={0}>-- प्रदेश --</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* District */}
        <div className="relative">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            जिल्ला छान्नुहोस्
          </label>
          <div className="relative">
            <select
              value={urlState.district}
              onChange={(e) => handleDistrictChange(parseInt(e.target.value, 10) || 0)}
              disabled={!urlState.state}
              className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value={0}>-- जिल्ला --</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Constituency */}
        <div className="relative">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            निर्वाचन क्षेत्र छान्नुहोस्
          </label>
          <div className="relative">
            <select
              value={urlState.constituency}
              onChange={(e) => handleConstituencyChange(parseInt(e.target.value, 10) || 0)}
              disabled={!urlState.district}
              className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-3 pr-10 text-sm font-medium text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value={0}>-- क्षेत्र --</option>
              {constituencies.map((c) => (
                <option key={c.id} value={c.id}>क्षेत्र नं. {c.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Selected Location Badge */}
      {urlState.constituency > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-primary">
            {selectedStateName}
          </span>
          <ChevronRight className="h-3 w-3 text-primary/40" />
          <span className="text-sm font-bold text-primary">
            {selectedDistrictName}
          </span>
          <ChevronRight className="h-3 w-3 text-primary/40" />
          <span className="text-sm font-bold text-primary">
            क्षेत्र नं. {selectedConstituencyName}
          </span>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            <Users className="h-3 w-3" />
            {constituencyCandidates.length} उम्मेदवार
          </span>
        </div>
      )}

      {/* Candidate List */}
      {urlState.constituency > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">
              तुलना गर्न दुईजना उम्मेदवार छान्नुहोस्
            </h3>
            <div className="flex items-center gap-2">
              {candidate1 && (
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                  क: {candidate1.candidate_name.split(" ")[0]}
                </span>
              )}
              {candidate2 && (
                <span className="rounded-full bg-compare-secondary/15 px-2.5 py-1 text-xs font-bold text-compare-secondary">
                  ख: {candidate2.candidate_name.split(" ")[0]}
                </span>
              )}
            </div>
          </div>

          {/* Search within constituency */}
          {constituencyCandidates.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="उम्मेदवार खोज्नुहोस्..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {/* Candidate Cards Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {constituencyCandidates.map((candidate) => {
              const isC1 = urlState.c1 === candidate.candidate_id
              const isC2 = urlState.c2 === candidate.candidate_id
              const isSelected = isC1 || isC2
              const partySymbolUrl = getSymbolUrl(candidate.political_party_name)
              const candidateImageUrl = `https://result.election.gov.np/Images/Candidate/${candidate.candidate_id}.jpg`

              return (
                <button
                  key={candidate.candidate_id}
                  type="button"
                  onClick={() => handleToggleCandidate(candidate)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all duration-200",
                    isC1
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                      : isC2
                      ? "border-compare-secondary bg-compare-secondary/5 ring-2 ring-compare-secondary/20 shadow-md"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  {/* Selection Badge */}
                  {isSelected && (
                    <div className={cn(
                      "absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black shadow-sm",
                      isC1 ? "bg-primary text-primary-foreground" : "bg-compare-secondary text-primary-foreground"
                    )}>
                      {isC1 ? "क" : "ख"}
                    </div>
                  )}

                  {/* Candidate Photo */}
                  <div className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-secondary",
                    isC1 ? "border-primary/40" : isC2 ? "border-compare-secondary/40" : "border-border"
                  )}>
                    <Image
                      src={candidateImageUrl}
                      alt={candidate.candidate_name}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                      }}
                    />
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-bold truncate",
                      isC1 ? "text-primary" : isC2 ? "text-compare-secondary" : "text-foreground"
                    )}>
                      {candidate.candidate_name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {partySymbolUrl && (
                        <div className="h-4 w-4 shrink-0 overflow-hidden rounded bg-background border border-border">
                          <Image
                            src={partySymbolUrl}
                            alt=""
                            width={16}
                            height={16}
                            className="h-full w-full object-contain p-0.5"
                            unoptimized
                          />
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground truncate">
                        {candidate.political_party_name}
                      </span>
                    </div>
                    {candidate.prev_election_result && (
                      <span className={cn(
                        "mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        candidate.prev_election_result === "Winner"
                          ? "bg-winner/10 text-winner"
                          : "bg-loser/10 text-loser"
                      )}>
                        {candidate.prev_election_result === "Winner" ? "२०७९ विजेता" : "२०७९ पराजित"}
                      </span>
                    )}
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      isC1 ? "bg-primary/15 text-primary" : "bg-compare-secondary/15 text-compare-secondary"
                    )}>
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {constituencyCandidates.length === 0 && searchQuery && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">कुनै उम्मेदवार भेटिएन</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state before constituency selected */}
      {!urlState.constituency && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50">
            <MapPin className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-bold text-foreground">निर्वाचन क्षेत्र छान्नुहोस्</h3>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            पहिले प्रदेश, जिल्ला र निर्वाचन क्षेत्र छानेर उम्मेदवारहरू हेर्नुहोस्
          </p>
        </div>
      )}
    </div>
  )
}
