"use client"

import { useState, useCallback } from "react"
import { CandidateFilter } from "@/components/candidate/candidate-filter"
import { CandidatePreviewGrid } from "@/components/candidate/candidate-preview-grid"
import { ProfileHeader } from "@/components/candidate/profile-header"
import { CandidateDetails } from "@/components/candidate/candidate-details"
import { ElectionTimeline } from "@/components/candidate/election-timeline"
import { ElectionResultCard } from "@/components/candidate/election-result-card"
import { Vote, Users, ChevronRight, BarChart3, ArrowLeft } from "lucide-react"

interface CandidateData {
  candidate_id: string
  candidate_name: string
  state_name: string
  district_name: string
  constituency_id: number | string
  political_party_name: string
  prev_election_votes?: number
  prev_2074_election_votes?: number
  [key: string]: any
}

export default function CandidateProfilePage() {
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null)
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateData[]>([])

  const handleFilteredCandidatesChange = useCallback((candidates: CandidateData[]) => {
    setFilteredCandidates(candidates)
  }, [])

  const handleSelectCandidate = useCallback((candidate: CandidateData | null) => {
    setSelectedCandidate(candidate)
  }, [])

  const handleBackToResults = () => {
    setSelectedCandidate(null)
  }

  // Show detail view when a candidate is explicitly selected
  const showDetail = selectedCandidate !== null
  // Show preview grid when there are multiple filtered candidates and none is selected
  const showPreview = !showDetail && filteredCandidates.length > 1

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

        {/* Filter section */}
        <CandidateFilter
          onSelectCandidate={handleSelectCandidate}
          onFilteredCandidatesChange={handleFilteredCandidatesChange}
          selectedCandidate={selectedCandidate}
        />

        {/* Back button when viewing detail */}
        {showDetail && filteredCandidates.length > 1 && (
          <button
            type="button"
            onClick={handleBackToResults}
            className="mt-6 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            पछाडि फर्कनुहोस् ({filteredCandidates.length})
          </button>
        )}

        {/* Detail view */}
        {showDetail && (
          <div className="mt-8 space-y-8">
            {/* Profile Header with badges */}
            <ProfileHeader candidate={selectedCandidate as any} />

            {/* Details and Stats section */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Candidate Details - 1/3 */}
              <div className="lg:col-span-1">
                <CandidateDetails candidate={selectedCandidate as any} />
              </div>

              {/* Timeline - 2/3 */}
              <div className="lg:col-span-2">
                <ElectionTimeline candidate={selectedCandidate as any} />
              </div>
            </div>

            {/* Past Election Results */}
            {(selectedCandidate!.prev_election_votes || selectedCandidate!.prev_2074_election_votes) && (
              <div className="space-y-6">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Detailed Election Results
                </h2>

                {/* 2079 Results */}
                {selectedCandidate!.prev_election_votes && (
                  <ElectionResultCard candidate={selectedCandidate as any} year="2079" />
                )}

                {/* 2074 Results */}
                {selectedCandidate!.prev_2074_election_votes && (
                  <ElectionResultCard candidate={selectedCandidate as any} year="2074" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Preview grid */}
        {showPreview && (
          <CandidatePreviewGrid
            candidates={filteredCandidates}
            onSelectCandidate={handleSelectCandidate}
          />
        )}

        {/* Empty state - no filters applied and no candidate selected */}
        {!showDetail && !showPreview && filteredCandidates.length <= 1 && filteredCandidates.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">No Candidate Selected</h3>
            <p className="mt-2 max-w-md text-center text-muted-foreground">
              उम्मेदवारको विस्तृत प्रोफाइल, चुनावी इतिहास र कार्यसम्पादन तथ्याङ्कहरू हेर्नको लागि माथिका फिल्टरहरू प्रयोग गरेर उम्मेदवार छनोट गर्नुहोस्।
            </p>
          </div>
        )}
      </main>
    </>
  )
}
