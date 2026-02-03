"use client"

import { type PRCandidate } from "@/lib/candidates-data"
import { BadgeShowcase } from "./badge-display"
import { User, Building2, MapPin, ListOrdered, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState } from "react"
import { usePartySymbols } from "@/hooks/use-party-symbols"

interface PRProfileHeaderProps {
  candidate: PRCandidate
}

export function PRProfileHeader({ candidate }: PRProfileHeaderProps) {
  const [symbolError, setSymbolError] = useState(false)
  const { getSymbolUrl } = usePartySymbols()
  const partySymbolUrl = getSymbolUrl(candidate.political_party_name)

  // Determine candidate level based on parliament history
  const getLevel = () => {
    const timesElected = candidate.times_elected ?? 0
    if (timesElected >= 2) {
      return { label: "दिग्गज", color: "bg-gold text-gold-foreground" }
    }
    if (timesElected >= 1 || candidate.was_parliament_member_2079 || candidate.was_parliament_member_2074) {
      return { label: "अनुभवी", color: "bg-primary text-primary-foreground" }
    }
    return { label: "नयाँ", color: "bg-accent text-accent-foreground" }
  }

  const level = getLevel()

  // Rank badge styling based on position
  const getRankBadge = () => {
    const rank = candidate.rank_position
    if (rank <= 5) {
      return { label: `#${rank}`, color: "bg-gold text-gold-foreground" }
    }
    if (rank <= 10) {
      return { label: `#${rank}`, color: "bg-silver text-silver-foreground" }
    }
    if (rank <= 20) {
      return { label: `#${rank}`, color: "bg-bronze text-bronze-foreground" }
    }
    return { label: `#${rank}`, color: "bg-secondary text-secondary-foreground" }
  }

  const rankBadge = getRankBadge()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--primary)_1px,_transparent_1px)] bg-[length:24px_24px]" />
      </div>

      {/* Decorative top bar */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="relative p-6 md:p-8">
        {/* Top section with info */}
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          {/* Avatar placeholder with rank */}
          <div className="relative">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-4 border-primary/30 bg-gradient-to-br from-secondary to-muted md:h-40 md:w-40">
              <User className="h-16 w-16 text-muted-foreground md:h-20 md:w-20" />
            </div>
            {/* Rank badge */}
            <div
              className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold shadow-lg",
                rankBadge.color
              )}
            >
              वरीयता {rankBadge.label}
            </div>
            {/* Level indicator on top right */}
            <div
              className={cn(
                "absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-lg",
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
                <ListOrdered className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">सूची वरीयता:</span>
                <span className="font-semibold text-foreground">{candidate.rank_position}</span>
              </div>
              {candidate.inclusive_group && (
                <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{candidate.inclusive_group}</span>
                </div>
              )}
              {candidate.gender && (
                <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
                  <span className="text-sm text-muted-foreground">लिंग:</span>
                  <span className="font-semibold text-foreground">{candidate.gender}</span>
                </div>
              )}
            </div>

            {/* Party info */}
            <div className="mt-4 flex items-center justify-center gap-3 md:justify-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm border border-border">
                {partySymbolUrl && !symbolError ? (
                  <Image
                    src={partySymbolUrl}
                    alt="Party symbol"
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
                {candidate.matched_party_name && candidate.matched_party_name !== candidate.political_party_name && (
                  <p className="text-sm text-muted-foreground">
                    मिलान: {candidate.matched_party_name}
                  </p>
                )}
              </div>
            </div>

            {/* Citizenship and location tags */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <span className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                <MapPin className="h-3 w-3" />
                नागरिकता: {candidate.citizenship_district}
              </span>
              {candidate.backward_area && (
                <span className="rounded-md bg-warning/20 px-3 py-1 text-sm font-medium text-warning">
                  पिछडिएको क्षेत्र
                </span>
              )}
              {candidate.disability && candidate.disability !== "No" && (
                <span className="rounded-md bg-accent/20 px-3 py-1 text-sm font-medium text-accent">
                  अपाङ्गता: {candidate.disability}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="mt-8">
          <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground md:text-left">
            विशेषताहरू र ब्याजहरू
          </h2>
          <BadgeShowcase tags={candidate.tags} />
        </div>
      </div>
    </div>
  )
}
