"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Search, X, User, ChevronDown } from "lucide-react"
import { useJsonData } from "@/hooks/use-json-data"
import Image from "next/image"
import { usePartySymbols } from "@/hooks/use-party-symbols"
import { type CandidatePoliticalHistory, usePoliticalHistory } from "@/hooks/use-political-history"
import type { Candidate } from "@/lib/candidates-data"

interface CandidateComparisonSelectorProps {
  label: string
  selectedCandidateId: number
  onSelect: (candidate: Candidate | null) => void
  otherCandidateId?: number
}

export function CandidateComparisonSelector({
  label,
  selectedCandidateId,
  onSelect,
  otherCandidateId,
}: CandidateComparisonSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [stateFilter, setStateFilter] = useState<number>(0)
  const [districtFilter, setDistrictFilter] = useState<number>(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: allCandidates, loading } = useJsonData<Candidate>("dim_current_fptp_candidates")
  const { getSymbolUrl } = usePartySymbols()

  // Extract states
  const states = useMemo(() => {
    if (!allCandidates) return []
    const stateMap = new Map<number, string>()
    for (const c of allCandidates) {
      if (!stateMap.has(c.state_id)) stateMap.set(c.state_id, c.state_name)
    }
    return Array.from(stateMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allCandidates])

  // Extract districts for selected state
  const districts = useMemo(() => {
    if (!allCandidates || !stateFilter) return []
    const filtered = allCandidates.filter((c) => c.state_id === stateFilter)
    const distMap = new Map<number, string>()
    for (const c of filtered) {
      if (!distMap.has(c.district_id)) distMap.set(c.district_id, c.district_name)
    }
    return Array.from(distMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allCandidates, stateFilter])

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (stateFilter) filtered = filtered.filter((c) => c.state_id === stateFilter)
    if (districtFilter) filtered = filtered.filter((c) => c.district_id === districtFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.candidate_name.toLowerCase().includes(q) ||
          c.political_party_name.toLowerCase().includes(q) ||
          c.district_name.toLowerCase().includes(q)
      )
    }
    // Remove the other selected candidate
    if (otherCandidateId) {
      filtered = filtered.filter((c) => c.candidate_id !== otherCandidateId)
    }
    return filtered.sort((a, b) => (a.party_display_order ?? 9999) - (b.party_display_order ?? 9999))
  }, [allCandidates, stateFilter, districtFilter, searchQuery, otherCandidateId])

  // Selected candidate object
  const selectedCandidate = useMemo(() => {
    if (!selectedCandidateId || !allCandidates) return null
    return allCandidates.find((c) => c.candidate_id === selectedCandidateId) || null
  }, [selectedCandidateId, allCandidates])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (candidate: Candidate) => {
    onSelect(candidate)
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleClear = () => {
    onSelect(null)
    setSearchQuery("")
    setStateFilter(0)
    setDistrictFilter(0)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
          {label}
        </label>
        <div className="h-14 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-3" ref={dropdownRef}>
      <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
        {label}
      </label>

      {/* Selected candidate display */}
      {selectedCandidate ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-primary/30 bg-secondary">
            <Image
              src={`https://result.election.gov.np/Images/Candidate/${selectedCandidate.candidate_id}.jpg`}
              alt={selectedCandidate.candidate_name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground truncate">{selectedCandidate.candidate_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {selectedCandidate.political_party_name} - {selectedCandidate.district_name} {selectedCandidate.constituency_name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="उम्मेदवार खोज्नुहोस्..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (!isOpen) setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
              {/* Filters */}
              <div className="flex gap-2 border-b border-border p-3">
                <div className="relative flex-1">
                  <select
                    value={stateFilter}
                    onChange={(e) => {
                      setStateFilter(parseInt(e.target.value, 10) || 0)
                      setDistrictFilter(0)
                    }}
                    className="w-full appearance-none rounded-lg border border-border bg-input px-3 py-2 pr-8 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value={0}>सबै प्रदेश</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="relative flex-1">
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(parseInt(e.target.value, 10) || 0)}
                    disabled={!stateFilter}
                    className="w-full appearance-none rounded-lg border border-border bg-input px-3 py-2 pr-8 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                  >
                    <option value={0}>सबै जिल्ला</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {filteredCandidates.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    कुनै उम्मेदवार भेटिएन
                  </div>
                ) : (
                  <div>
                    <p className="px-3 py-2 text-xs text-muted-foreground border-b border-border/50">
                      {filteredCandidates.length} उम्मेदवार
                    </p>
                    {filteredCandidates.slice(0, 100).map((candidate) => (
                      <button
                        key={candidate.candidate_id}
                        type="button"
                        onClick={() => handleSelect(candidate)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/50"
                      >
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-secondary">
                          <Image
                            src={`https://result.election.gov.np/Images/Candidate/${candidate.candidate_id}.jpg`}
                            alt={candidate.candidate_name}
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {candidate.candidate_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {candidate.political_party_name} - {candidate.district_name} {candidate.constituency_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
