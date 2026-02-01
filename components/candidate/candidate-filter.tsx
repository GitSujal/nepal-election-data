"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, X, Filter } from "lucide-react"
import { useJsonData } from "@/hooks/use-json-data"

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

  // Extract parties - filtered based on current selection
  const parties = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (state) filtered = filtered.filter(c => c.state_name === state)
    if (district) filtered = filtered.filter(c => c.district_name === district)
    if (constituency) filtered = filtered.filter(c => String(c.constituency_id) === constituency)
    const unique = Array.from(new Set(filtered.map(c => c.political_party_name)))
    return unique.sort()
  }, [allCandidates, state, district, constituency])

  // Filter candidates based on selected filters
  const filteredCandidates = useMemo(() => {
    if (!allCandidates) return []
    let filtered = allCandidates
    if (state) filtered = filtered.filter(c => c.state_name === state)
    if (district) filtered = filtered.filter(c => c.district_name === district)
    if (constituency) filtered = filtered.filter(c => String(c.constituency_id) === constituency)
    if (party) filtered = filtered.filter(c => c.political_party_name === party)
    return filtered
  }, [allCandidates, state, district, constituency, party])

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
                  <option key={s} value={s}>{s}</option>
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
                <option value="">All Constituencies ({constituencies.length})</option>
                {constituencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
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
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
