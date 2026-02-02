"use client"

import Image from "next/image"
import { useState } from "react"
import { User, GraduationCap, Vote, Trophy } from "lucide-react"
import { BadgeDisplay } from "@/components/candidate/badge-display"
import { usePartySymbols } from "@/hooks/use-party-symbols"
import { cn } from "@/lib/utils"

interface CandidatePreviewCardProps {
  candidate: any
  onClick: (candidate: any) => void
}

export function CandidatePreviewCard({ candidate, onClick }: CandidatePreviewCardProps) {
  const [imgError, setImgError] = useState(false)
  const { getSymbolUrl } = usePartySymbols()
  const symbolUrl = getSymbolUrl(candidate.political_party_name)

  const electionsContested = candidate.elections_contested ?? 0
  const wins = [candidate.prev_election_result, candidate.prev_2074_election_result].filter(
    (r) => r === "Winner"
  ).length

  return (
    <button
      type="button"
      onClick={() => onClick(candidate)}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left",
        "transition-all hover:border-primary/40 hover:shadow-md hover:scale-[1.01]"
      )}
    >
      {/* Top section: image + basic info */}
      <div className="flex items-start gap-3 p-4">
        {/* Candidate image */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
          {candidate.candidate_image_url && !imgError ? (
            <Image
              src={candidate.candidate_image_url}
              alt={candidate.candidate_name}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <User className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Name & party */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground text-sm leading-tight">
            {candidate.candidate_name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5">
            {symbolUrl && (
              <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-white p-0.5 shadow-sm ring-1 ring-border/10">
                <Image
                  src={symbolUrl}
                  alt=""
                  width={16}
                  height={16}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              </div>
            )}
            <p className="truncate text-xs text-muted-foreground">
              {candidate.political_party_name}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {candidate.district_name}-{candidate.constituency_id}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 border-t border-border/50 bg-secondary/30 px-4 py-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground" title="शिक्षा">
          <GraduationCap className="h-3.5 w-3.5" />
          <span>{candidate.qualification_level || "एन/ए"}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground" title="सहभागी चुनाव संख्या">
          <Vote className="h-3.5 w-3.5" />
          <span>{electionsContested}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground" title="विगतको विजय">
          <Trophy className="h-3.5 w-3.5" />
          <span>{wins}</span>
        </div>
      </div>

      {/* Badges */}
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="border-t border-border/50 px-4 py-2">
          <BadgeDisplay tags={candidate.tags} size="sm" />
        </div>
      )}
    </button>
  )
}
