"use client"

import { type Candidate } from "@/lib/candidates-data"
import { BadgeShowcase } from "./badge-display"
import { User, Building2, MapPin, Vote } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState } from "react"
import { usePartySymbols } from "@/hooks/use-party-symbols"

interface ProfileHeaderProps {
  candidate: Candidate
}

export function ProfileHeader({ candidate }: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false)
  const [symbolError, setSymbolError] = useState(false)
  const candidateImageUrl = `https://result.election.gov.np/Images/Candidate/${candidate.candidate_id}.jpg`
  const { getSymbolUrl } = usePartySymbols()
  const partySymbolUrl = getSymbolUrl(candidate.political_party_name)

  // Determine candidate level/status based on election history
  const getLevel = () => {
    if (candidate.elections_contested >= 2 && candidate.prev_election_result === "Winner") {
      return { label: "VETERAN", color: "bg-gold text-gold-foreground" }
    }
    if (candidate.elections_contested >= 1) {
      return { label: "EXPERIENCED", color: "bg-primary text-primary-foreground" }
    }
    return { label: "NEWCOMER", color: "bg-accent text-accent-foreground" }
  }

  const level = getLevel()

  // Count wins
  const wins = [
    candidate.prev_election_result === "Winner",
    candidate.prev_2074_election_result === "Winner",
  ].filter(Boolean).length

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--primary)_1px,_transparent_1px)] bg-[length:24px_24px]" />
      </div>

      {/* Decorative top bar */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="relative p-6 md:p-8">
        {/* Top section with avatar and info */}
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          {/* Avatar */}
          <div className="relative">
            <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-primary/30 bg-secondary md:h-40 md:w-40">
              {!imageError ? (
                <Image
                  src={candidateImageUrl || "/placeholder.svg"}
                  alt={candidate.candidate_name}
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
                  <User className="h-16 w-16 text-muted-foreground md:h-20 md:w-20" />
                </div>
              )}
            </div>
            {/* Level indicator */}
            <div
              className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold shadow-lg",
                level.color
              )}
            >
              {level.label}
            </div>
          </div>

          {/* Name and Party info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
              {candidate.candidate_name}
            </h1>

            {/* Quick stats */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
                <span className="text-sm text-muted-foreground">Age:</span>
                <span className="font-semibold text-foreground">{candidate.age}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
                <Vote className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Elections:</span>
                <span className="font-semibold text-foreground">{candidate.elections_contested}</span>
              </div>
              {wins > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-winner/20 px-3 py-1.5">
                  <span className="text-sm text-winner">Wins:</span>
                  <span className="font-semibold text-winner">{wins}</span>
                </div>
              )}
            </div>

            {/* Party info */}
            <div className="mt-4 flex items-center justify-center gap-3 md:justify-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                {partySymbolUrl && !symbolError ? (
                  <Image
                    src={partySymbolUrl}
                    alt={candidate.symbol_name || "Party symbol"}
                    width={48}
                    height={48}
                    className="h-full w-full object-contain p-1"
                    onError={() => setSymbolError(true)}
                    unoptimized
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground text-balance">{candidate.political_party_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span>Symbol:</span>
                  <span className="font-medium">{candidate.symbol_name}</span>
                </p>
              </div>
            </div>

            {/* Location tags */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <span className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                <MapPin className="h-3 w-3" />
                {candidate.state_name}
              </span>
              <span className="rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                {candidate.district_name}
              </span>
              <span className="rounded-md bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
                निर्वाचन क्षेत्र {candidate.constituency_name}
              </span>
            </div>

            {/* Citizenship indicator for tourists */}
            {candidate.is_tourist_candidate && (
              <div className="mt-3 flex items-center justify-center md:justify-start">
                <span className="flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs text-accent">
                  <MapPin className="h-3 w-3" />
                  Citizenship from: {candidate.citizenship_district}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Badges Section */}
        <div className="mt-8">
          <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground md:text-left">
            Achievements & Badges
          </h2>
          <BadgeShowcase tags={candidate.tags} />
        </div>
      </div>
    </div>
  )
}
