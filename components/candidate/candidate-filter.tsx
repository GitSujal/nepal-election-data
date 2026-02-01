"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, Search, X, Filter, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useJsonData } from "@/hooks/use-json-data"
import { usePartySymbols } from "@/hooks/use-party-symbols"
import Image from "next/image"

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
  selectedCandidate: CandidateData | null
}

export function CandidateFilter({ onSelectCandidate, selectedCandidate }: CandidateFilterProps) {
  const [state, setState] = useState<string>("")
  const [district, setDistrict] = useState<string>("")
  const [constituency, setConstituency] = useState<string>("")
  const [party, setParty] = useState<string>("")
  const [showResults, setShowResults] = useState(false)
  const [symbolErrors, setSymbolErrors] = useState<Set<string>>(new Set())

  // Load all candidates from JSON
  const { data: allCandidates, loading: dataLoading } = useJsonData<CandidateData>(
    'dim_current_fptp_candidates'
  )

  // Load party symbols
  const { getSymbolUrl } = usePartySymbols()

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

  // Extract parties - filtered based on current selection
  const parties = useMemo(() => {
    if (!allCandidates) return []

    let filtered = allCandidates

    // Filter by state if selected
    if (state) {
      filtered = filtered.filter(c => c.state_name === state)
    }

    // Filter by district if selected
    if (district) {
      filtered = filtered.filter(c => c.district_name === district)
    }

    // Filter by constituency if selected
    if (constituency) {
      filtered = filtered.filter(c => String(c.constituency_id) === constituency)
    }

    const unique = Array.from(new Set(filtered.map(c => c.political_party_name)))
    return unique.sort()
  }, [allCandidates, state, district, constituency])

  // Filter candidates based on selected filters
  const filteredCandidates = useMemo(() => {
    if (!allCandidates) return []

    let filtered = allCandidates

    if (state) {
      filtered = filtered.filter(c => c.state_name === state)
    }
    if (district) {
      filtered = filtered.filter(c => c.district_name === district)
    }
    if (constituency) {
      filtered = filtered.filter(c => String(c.constituency_id) === constituency)
    }
    if (party) {
      filtered = filtered.filter(c => c.political_party_name === party)
    }

    return filtered.slice(0, 50)
  }, [allCandidates, state, district, constituency, party])

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

  // Auto-select district if only one available after state selection
  useEffect(() => {
    if (state && districts.length === 1 && !district) {
      setDistrict(districts[0])
    }
  }, [state, districts, district])

  // Auto-select constituency if only one available after district selection
  useEffect(() => {
    if (district && constituencies.length === 1 && !constituency) {
      setConstituency(constituencies[0])
    }
  }, [district, constituencies, constituency])

  // Auto-select candidate if only one available after party selection or other filters
  useEffect(() => {
    if ((party || state || district || constituency) && filteredCandidates.length === 1) {
      onSelectCandidate(filteredCandidates[0])
    }
  }, [filteredCandidates, party, state, district, constituency, onSelectCandidate])

  const handleReset = () => {
    setState("")
    setDistrict("")
    setConstituency("")
    setParty("")
    onSelectCandidate(null)
  }

  const hasActiveFilters = state || district || constituency || party

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Find Candidate</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            type="button"
            className="flex items-center gap-1 rounded-lg px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>

      {/* Loading state */}
      {dataLoading && (
        <div className="text-center text-muted-foreground py-4">Loading candidates data...</div>
      )}

      {/* Filters grid */}
      {!dataLoading && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* State */}
            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                State/Province
              </label>
              <div className="relative">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All States ({states.length})</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* District */}
            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">District</label>
              <div className="relative">
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                  disabled={!state}
                >
                  <option value="">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
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
                  <option value="">All Constituencies ({constituencies.length})</option>
                  {constituencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Party */}
            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Party</label>
              <div className="relative">
                <select
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-input px-4 py-2.5 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Parties ({parties.length})</option>
                  {parties.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Results count and list */}
          <div className="mt-4">
            <button
              onClick={() => setShowResults(!showResults)}
              type="button"
              className="flex w-full items-center justify-between rounded-lg bg-secondary px-4 py-3 text-left transition-colors hover:bg-secondary/80"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">
                  <span className="font-semibold text-primary">{filteredCandidates.length}</span>{" "}
                  candidates found
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  showResults && "rotate-180"
                )}
              />
            </button>

            {showResults && filteredCandidates.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-border bg-background">
                {filteredCandidates.map((candidate) => {
                  const symbolUrl = getSymbolUrl(candidate.political_party_name)
                  const hasSymbolError = symbolErrors.has(candidate.candidate_id)

                  return (
                    <button
                      key={candidate.candidate_id}
                      onClick={() => {
                        onSelectCandidate(candidate)
                        setShowResults(false)
                      }}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-secondary",
                        selectedCandidate?.candidate_id === candidate.candidate_id && "bg-primary/10"
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                        {symbolUrl && !hasSymbolError ? (
                          <Image
                            src={symbolUrl}
                            alt={candidate.symbol_name || "Party symbol"}
                            width={40}
                            height={40}
                            className="h-full w-full object-contain p-1 rounded-full"
                            onError={() => {
                              setSymbolErrors(prev => new Set([...prev, candidate.candidate_id]))
                            }}
                            unoptimized
                          />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{candidate.candidate_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {candidate.political_party_name.slice(0, 30)}... | {candidate.district_name}-
                          {candidate.constituency_id}
                        </p>
                      </div>
                      {selectedCandidate?.candidate_id === candidate.candidate_id && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {showResults && filteredCandidates.length === 0 && (
              <div className="mt-2 rounded-lg border border-border bg-background px-4 py-8 text-center text-muted-foreground">
                No candidates match your filters
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
