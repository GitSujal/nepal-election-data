"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { CandidatePreviewCard } from "@/components/candidate/candidate-preview-card"

const PAGE_SIZE = 50

interface CandidatePreviewGridProps {
  candidates: any[]
  onSelectCandidate: (candidate: any) => void
}

export function CandidatePreviewGrid({ candidates, onSelectCandidate }: CandidatePreviewGridProps) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(candidates.length / PAGE_SIZE)
  const paginated = candidates.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset to first page when candidates list changes
  useEffect(() => { setPage(0) }, [candidates.length])

  if (candidates.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-foreground">कुनै उम्मेदवार फेला परेन</h3>
        <p className="mt-2 max-w-md text-center text-muted-foreground">
          उम्मेदवारहरू फेला पार्न माथिको फिल्टरहरू प्रयोग गर्नुहोस्।
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          कुल <span className="font-semibold text-foreground">{candidates.length}</span> उम्मेदवारहरू मध्ये <span className="font-semibold text-foreground">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, candidates.length)}</span> देखाइएको छ
        </p>
        <p className="text-xs text-muted-foreground">पुरा विवरण हेर्न उम्मेदवारमा क्लिक गर्नुहोस्</p>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginated.map((candidate) => (
          <CandidatePreviewCard
            key={candidate.candidate_id}
            candidate={candidate}
            onClick={onSelectCandidate}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            पछाडि
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => {
              // Show first, last, and pages around current
              if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                      i === page
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              }
              // Show ellipsis
              if (i === 1 && page > 2) {
                return <span key={i} className="px-1 text-muted-foreground">...</span>
              }
              if (i === totalPages - 2 && page < totalPages - 3) {
                return <span key={i} className="px-1 text-muted-foreground">...</span>
              }
              return null
            })}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            अगाडि
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
