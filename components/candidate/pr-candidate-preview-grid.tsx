"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Building2, ListOrdered, Users } from "lucide-react"
import { BadgeDisplay } from "./badge-display"
import { usePartySymbols } from "@/hooks/use-party-symbols"
import Image from "next/image"

interface PRCandidateData {
  serial_no: number
  candidate_name: string
  political_party_name: string
  inclusive_group: string | null
  citizenship_district: string
  rank_position: number
  gender: string
  party_display_order: number | null
  tags: string[]
  [key: string]: any
}

interface PRCandidatePreviewGridProps {
  candidates: PRCandidateData[]
  onSelectCandidate: (candidate: PRCandidateData) => void
}

const ITEMS_PER_PAGE = 50

export function PRCandidatePreviewGrid({ candidates, onSelectCandidate }: PRCandidatePreviewGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const { getSymbolUrl } = usePartySymbols()

  const totalPages = Math.ceil(candidates.length / ITEMS_PER_PAGE)

  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return candidates.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [candidates, currentPage])

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  // Reset to page 1 when candidates change
  useMemo(() => {
    setCurrentPage(1)
  }, [candidates.length])

  if (candidates.length === 0) {
    return null
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Header with pagination info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {candidates.length} उम्मेदवार भेटियो
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedCandidates.map((candidate) => (
          <PRCandidateCard
            key={`${candidate.serial_no}-${candidate.political_party_name}`}
            candidate={candidate}
            onSelect={() => onSelectCandidate(candidate)}
            getSymbolUrl={getSymbolUrl}
          />
        ))}
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            अघिल्लो
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            पछिल्लो
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

interface PRCandidateCardProps {
  candidate: PRCandidateData
  onSelect: () => void
  getSymbolUrl: (partyName: string) => string | null
}

function PRCandidateCard({ candidate, onSelect, getSymbolUrl }: PRCandidateCardProps) {
  const [symbolError, setSymbolError] = useState(false)
  const partySymbolUrl = getSymbolUrl(candidate.political_party_name)

  // Rank badge styling
  const getRankStyle = () => {
    const rank = candidate.rank_position
    if (rank <= 5) return "bg-gold/20 text-gold border-gold/40"
    if (rank <= 10) return "bg-silver/20 text-silver border-silver/40"
    if (rank <= 20) return "bg-bronze/20 text-bronze border-bronze/40"
    return "bg-secondary text-secondary-foreground border-border"
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg"
    >
      {/* Party symbol and name row */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-border">
          {partySymbolUrl && !symbolError ? (
            <Image
              src={partySymbolUrl}
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-contain p-1"
              onError={() => setSymbolError(true)}
              unoptimized
            />
          ) : (
            <Building2 className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
            {candidate.candidate_name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {candidate.political_party_name}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {/* Rank badge */}
        <span className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${getRankStyle()}`}>
          <ListOrdered className="h-3 w-3" />
          #{candidate.rank_position}
        </span>

        {/* Gender */}
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {candidate.gender}
        </span>

        {/* Inclusive group */}
        {candidate.inclusive_group && (
          <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
            <Users className="h-3 w-3" />
            {candidate.inclusive_group.length > 15
              ? candidate.inclusive_group.substring(0, 15) + "..."
              : candidate.inclusive_group}
          </span>
        )}
      </div>

      {/* Citizenship */}
      <p className="mt-2 text-xs text-muted-foreground">
        नागरिकता: {candidate.citizenship_district}
      </p>

      {/* Tags */}
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="mt-3">
          <BadgeDisplay tags={candidate.tags.slice(0, 3)} size="sm" />
        </div>
      )}
    </button>
  )
}
