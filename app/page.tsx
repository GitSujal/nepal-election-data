"use client"

import { useState, useCallback, Suspense, useMemo } from "react"
import { CandidateFilter } from "@/components/candidate/candidate-filter"
import { CandidatePreviewGrid } from "@/components/candidate/candidate-preview-grid"
import { PartyCountChart } from "@/components/candidate/party-count-chart"
import { ProfileHeader } from "@/components/candidate/profile-header"
import { CandidateDetails } from "@/components/candidate/candidate-details"
import { EnhancedElectionTimeline } from "@/components/candidate/enhanced-election-timeline"
import { PoliticalHistoryTimeline } from "@/components/candidate/political-history-timeline"
import { ElectionResultCard } from "@/components/candidate/election-result-card"
import { PRProfileHeader } from "@/components/candidate/pr-profile-header"
import { PRCandidateDetails } from "@/components/candidate/pr-candidate-details"
import { PRCandidatePreviewGrid } from "@/components/candidate/pr-candidate-preview-grid"
import { PRCandidateFilter } from "@/components/candidate/pr-candidate-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, ChevronRight, BarChart3, ArrowLeft } from "lucide-react"
import { type CandidateType } from "@/lib/candidates-data"
import { useUrlState } from "@/hooks/use-url-state"
import { defaultFilterState, getFPTPFilterState, getPRFilterState, type UrlFilterState } from "@/lib/filter-types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCandidate = any

function CandidatePageContent() {
  const [urlState, setUrlState, resetUrlState] = useUrlState(defaultFilterState)
  
  // Derive candidate type from URL
  const candidateType = urlState.tab === 'pr' ? 'pr' : 'fptp'

  // FPTP state
  const [selectedFPTPCandidate, setSelectedFPTPCandidate] = useState<AnyCandidate | null>(null)
  const [filteredFPTPCandidates, setFilteredFPTPCandidates] = useState<AnyCandidate[]>([])

  // PR state
  const [selectedPRCandidate, setSelectedPRCandidate] = useState<AnyCandidate | null>(null)
  const [filteredPRCandidates, setFilteredPRCandidates] = useState<AnyCandidate[]>([])

  // FPTP handlers
  const handleFPTPFilteredCandidatesChange = useCallback((candidates: AnyCandidate[]) => {
    setFilteredFPTPCandidates(candidates)
  }, [])

  const handleSelectFPTPCandidate = useCallback((candidate: AnyCandidate | null) => {
    setSelectedFPTPCandidate(candidate)
  }, [])

  const handleBackToFPTPResults = () => {
    setSelectedFPTPCandidate(null)
    setUrlState({ candidate: 0 })
  }

  // PR handlers
  const handlePRFilteredCandidatesChange = useCallback((candidates: AnyCandidate[]) => {
    setFilteredPRCandidates(candidates)
  }, [])

  const handleSelectPRCandidate = useCallback((candidate: AnyCandidate | null) => {
    setSelectedPRCandidate(candidate)
  }, [])

  const handleBackToPRResults = () => {
    setSelectedPRCandidate(null)
    setUrlState({ candidate: 0 })
  }

  // Computed state based on candidate type
  const selectedCandidate = candidateType === "fptp" ? selectedFPTPCandidate : selectedPRCandidate
  const filteredCandidates = candidateType === "fptp" ? filteredFPTPCandidates : filteredPRCandidates
  const handleBackToResults = candidateType === "fptp" ? handleBackToFPTPResults : handleBackToPRResults

  // Show detail view when a candidate is explicitly selected
  const showDetail = selectedCandidate !== null
  // Show preview grid when there are multiple filtered candidates and none is selected
  const showPreview = !showDetail && filteredCandidates.length > 1

  // Check if we should show party count chart for FPTP
  const showFPTPPartyChart = useMemo(() => {
    if (candidateType !== 'fptp' || selectedFPTPCandidate || filteredFPTPCandidates.length <= 1) {
      return false
    }
    // Count unique parties in filtered results
    const uniqueParties = new Set(filteredFPTPCandidates.map((c: any) => c.political_party_name))
    return uniqueParties.size > 1
  }, [candidateType, selectedFPTPCandidate, filteredFPTPCandidates])

  // Check if we should show party count chart for PR
  const showPRPartyChart = useMemo(() => {
    if (candidateType !== 'pr' || selectedPRCandidate || filteredPRCandidates.length <= 1) {
      return false
    }
    // Count unique parties in filtered results
    const uniqueParties = new Set(filteredPRCandidates.map((c: any) => c.political_party_name))
    return uniqueParties.size > 1
  }, [candidateType, selectedPRCandidate, filteredPRCandidates])

  const handleTabChange = (value: string) => {
    if (value === 'pr') {
      setUrlState({
        tab: 'pr',
        state: 0,        // Clear FPTP-specific
        district: 0,
        constituency: 0,
        candidate: 0,
      })
      setSelectedFPTPCandidate(null)
      setSelectedPRCandidate(null)
    } else {
      setUrlState({
        tab: 'fptp',
        group: 0,        // Clear PR-specific
        candidate: 0,
      })
      setSelectedFPTPCandidate(null)
      setSelectedPRCandidate(null)
    }
  }

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        {/* Page title */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>गृहपृष्ठ</span>
            <ChevronRight className="h-4 w-4" />
            <span className={showDetail ? "cursor-pointer hover:text-foreground" : "text-foreground"} onClick={showDetail ? handleBackToResults : undefined}>
              उम्मेदवारहरू
            </span>
            {selectedCandidate && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{selectedCandidate.candidate_name}</span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground text-balance md:text-4xl">
            उम्मेदवार विवरण
          </h1>
          <p className="mt-2 text-muted-foreground">
            आफ्नो मत हाल्नु अघि आफ्ना उम्मेदवारहरूलाई राम्रोसँग चिनौं
          </p>
        </div>

        {/* Candidate Type Tabs */}
        <Tabs defaultValue="fptp" value={candidateType} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-6">
            <TabsTrigger value="fptp">प्रत्यक्ष (FPTP)</TabsTrigger>
            <TabsTrigger value="pr">समानुपातिक (PR)</TabsTrigger>
          </TabsList>

          {/* FPTP Tab Content */}
          <TabsContent value="fptp" className="mt-0 space-y-0">
            {/* Filter section */}
            <CandidateFilter
              onSelectCandidate={handleSelectFPTPCandidate}
              onFilteredCandidatesChange={handleFPTPFilteredCandidatesChange}
              selectedCandidate={selectedFPTPCandidate}
              urlState={getFPTPFilterState(urlState)}
              onUrlStateChange={setUrlState}
            />

            {/* Back button when viewing detail */}
            {selectedFPTPCandidate && filteredFPTPCandidates.length > 1 && (
              <button
                type="button"
                onClick={handleBackToFPTPResults}
                className="mt-6 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                पछाडि फर्कनुहोस् ({filteredFPTPCandidates.length})
              </button>
            )}

            {/* Detail view */}
            {selectedFPTPCandidate && (
              <div className="mt-8 space-y-8">
                {/* Profile Header with badges */}
                <ProfileHeader candidate={selectedFPTPCandidate as any} />

                {/* Details and Stats section */}
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Candidate Details - 1/3 */}
                  <div className="lg:col-span-1">
                    <CandidateDetails candidate={selectedFPTPCandidate as any} />
                  </div>

                  {/* Enhanced Election Timeline - 2/3 */}
                  <div className="lg:col-span-2">
                    <EnhancedElectionTimeline candidate={selectedFPTPCandidate as any} />
                  </div>
                </div>

                {/* Comprehensive Political History Timeline - Full Width */}
                <PoliticalHistoryTimeline 
                  candidateId={selectedFPTPCandidate.candidate_id}
                  candidateName={selectedFPTPCandidate.candidate_name}
                />

                {/* Past Election Results */}
                {(selectedFPTPCandidate.prev_election_votes || selectedFPTPCandidate.prev_2074_election_votes) && (
                  <div className="space-y-6">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                      <BarChart3 className="h-6 w-6 text-primary" />
                      Detailed Election Results
                    </h2>

                    {/* 2079 Results */}
                    {selectedFPTPCandidate.prev_election_votes && (
                      <ElectionResultCard candidate={selectedFPTPCandidate as any} year="2079" />
                    )}

                    {/* 2074 Results */}
                    {selectedFPTPCandidate.prev_2074_election_votes && (
                      <ElectionResultCard candidate={selectedFPTPCandidate as any} year="2074" />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Party Count Chart */}
            {showFPTPPartyChart && (
              <PartyCountChart
                candidates={filteredFPTPCandidates}
                className="mt-6"
              />
            )}

            {/* Preview grid */}
            {!selectedFPTPCandidate && filteredFPTPCandidates.length > 1 && (
              <CandidatePreviewGrid
                candidates={filteredFPTPCandidates}
                onSelectCandidate={handleSelectFPTPCandidate}
              />
            )}

            {/* Empty state */}
            {!selectedFPTPCandidate && filteredFPTPCandidates.length === 0 && (
              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">उम्मेदवार छानिएको छैन</h3>
                <p className="mt-2 max-w-md text-center text-muted-foreground">
                  उम्मेदवारको विस्तृत प्रोफाइल, चुनावी इतिहास र कार्यसम्पादन तथ्याङ्कहरू हेर्नको लागि माथिका फिल्टरहरू प्रयोग गरेर उम्मेदवार छनोट गर्नुहोस्।
                </p>
              </div>
            )}
          </TabsContent>

          {/* PR Tab Content */}
          <TabsContent value="pr" className="mt-0 space-y-0">
            {/* Filter section */}
            <PRCandidateFilter
              onSelectCandidate={handleSelectPRCandidate}
              onFilteredCandidatesChange={handlePRFilteredCandidatesChange}
              selectedCandidate={selectedPRCandidate}
              urlState={getPRFilterState(urlState)}
              onUrlStateChange={setUrlState}
            />

            {/* Back button when viewing detail */}
            {selectedPRCandidate && filteredPRCandidates.length > 1 && (
              <button
                type="button"
                onClick={handleBackToPRResults}
                className="mt-6 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                पछाडि फर्कनुहोस् ({filteredPRCandidates.length})
              </button>
            )}

            {/* Detail view */}
            {selectedPRCandidate && (
              <div className="mt-8 space-y-8">
                {/* Profile Header with badges */}
                <PRProfileHeader candidate={selectedPRCandidate as any} />

                {/* Details section */}
                <PRCandidateDetails candidate={selectedPRCandidate as any} />
              </div>
            )}

            {/* Party Count Chart */}
            {showPRPartyChart && (
              <PartyCountChart
                candidates={filteredPRCandidates}
                className="mt-6"
              />
            )}

            {/* Preview grid */}
            {!selectedPRCandidate && filteredPRCandidates.length > 1 && (
              <PRCandidatePreviewGrid
                candidates={filteredPRCandidates}
                onSelectCandidate={handleSelectPRCandidate}
              />
            )}

            {/* Empty state */}
            {!selectedPRCandidate && filteredPRCandidates.length === 0 && (
              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">उम्मेदवार छानिएको छैन</h3>
                <p className="mt-2 max-w-md text-center text-muted-foreground">
                  समानुपातिक उम्मेदवारको विवरण हेर्नको लागि माथिका फिल्टरहरू प्रयोग गरेर उम्मेदवार छनोट गर्नुहोस्।
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

// Required Suspense wrapper for useSearchParams
export default function CandidateProfilePage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="h-48 w-full rounded-2xl bg-muted" />
        </div>
      </main>
    }>
      <CandidatePageContent />
    </Suspense>
  )
}
