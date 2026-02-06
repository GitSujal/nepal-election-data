"use client"

import { type PRCandidate } from "@/lib/candidates-data"
import { cn } from "@/lib/utils"
import { Award, Vote, Users, MapPin, CircleDot, TrendingUp, TrendingDown } from "lucide-react"

interface PRElectionTimelineProps {
  candidate: PRCandidate
}

interface TimelineEntry {
  year: "2074" | "2079" | "2082"
  type: "FPTP" | "Proportional" | null
  district: string | null
  constituency: number | null
  party: string | null
  result: "Winner" | "Loser" | "Member" | "Current" | "Unavailable" | null
  wasMember: boolean
  votes: number | null
  margin: number | null
}

export function PRElectionTimeline({ candidate }: PRElectionTimelineProps) {
  // Build timeline entries from candidate data
  const entries: TimelineEntry[] = []

  const has2074History = Boolean(
    candidate.was_parliament_member_2074
      || candidate.prev_2074_fptp_result
      || candidate.prev_2074_fptp_votes
  )
  const has2079History = Boolean(
    candidate.was_parliament_member_2079
      || candidate.prev_2079_fptp_result
      || candidate.prev_2079_fptp_votes
  )

  // 2074 entry - check for both parliament member status and FPTP results
  if (has2074History) {
    entries.push({
      year: "2074",
      type: candidate.was_parliament_member_2074 
        ? candidate.parliament_member_2074_election_type 
        : "FPTP",
      district: candidate.was_parliament_member_2074
        ? candidate.parliament_member_2074_district
        : candidate.prev_2074_fptp_district,
      constituency: candidate.was_parliament_member_2074
        ? candidate.parliament_member_2074_constituency
        : candidate.prev_2074_fptp_constituency_id,
      party: candidate.was_parliament_member_2074
        ? candidate.parliament_member_2074_party
        : candidate.prev_2074_fptp_party,
      result: candidate.was_parliament_member_2074 
        ? "Member"
        : candidate.prev_2074_fptp_result,
      wasMember: candidate.was_parliament_member_2074 || false,
      votes: candidate.prev_2074_fptp_votes,
      margin: candidate.prev_2074_fptp_margin,
    })
  }

  // 2079 entry - check for both parliament member status and FPTP results
  if (has2079History) {
    entries.push({
      year: "2079",
      type: candidate.was_parliament_member_2079
        ? candidate.parliament_member_2079_election_type
        : "FPTP",
      district: candidate.was_parliament_member_2079
        ? candidate.parliament_member_2079_district
        : candidate.prev_2079_fptp_district,
      constituency: candidate.was_parliament_member_2079
        ? candidate.parliament_member_2079_constituency
        : candidate.prev_2079_fptp_constituency_id,
      party: candidate.was_parliament_member_2079
        ? candidate.parliament_member_2079_party
        : candidate.prev_2079_fptp_party,
      result: candidate.was_parliament_member_2079
        ? "Member"
        : candidate.prev_2079_fptp_result,
      wasMember: candidate.was_parliament_member_2079 || false,
      votes: candidate.prev_2079_fptp_votes,
      margin: candidate.prev_2079_fptp_margin,
    })
  }

  if (has2074History && !has2079History) {
    entries.push({
      year: "2079",
      type: "FPTP",
      district: null,
      constituency: null,
      party: null,
      result: "Unavailable",
      wasMember: false,
      votes: null,
      margin: null,
    })
  }

  // 2082 current entry
  entries.push({
    year: "2082",
    type: "Proportional",
    district: null,
    constituency: null,
    party: candidate.political_party_name,
    result: "Current",
    wasMember: false,
    votes: null,
    margin: null,
  })

  if (entries.length === 1) {
    // Only current entry, no history
    return null
  }

  const getResultColor = (result: TimelineEntry["result"]) => {
    switch (result) {
      case "Member":
        return "border-gold bg-gold/10 text-gold"
      case "Winner":
        return "border-winner bg-winner/10 text-winner"
      case "Loser":
        return "border-loser bg-loser/10 text-loser"
      case "Unavailable":
        return "border-muted bg-muted/10 text-muted-foreground"
      case "Current":
        return "border-primary bg-primary/10 text-primary"
      default:
        return "border-muted bg-muted/10 text-muted-foreground"
    }
  }

  const getResultLabel = (result: TimelineEntry["result"]) => {
    switch (result) {
      case "Member":
        return "संसद सदस्य"
      case "Winner":
        return "विजेता"
      case "Loser":
        return "पराजित"
      case "Unavailable":
        return "इतिहास उपलब्ध छैन"
      case "Current":
        return "हाल प्रतिस्पर्धी"
      default:
        return "N/A"
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-6 text-lg font-semibold uppercase tracking-wider text-muted-foreground">
        Election Journey
      </h2>

      {/* Timeline */}
      <div className="relative">
        {/* Connection line - horizontal on desktop */}
        <div className="absolute left-[50px] right-0 top-12 hidden h-1 bg-gradient-to-r from-border via-primary/50 to-border md:block md:left-0" />
        
        {/* Connection line - vertical on mobile */}
        <div className="absolute bottom-0 left-12 top-0 w-1 bg-gradient-to-b from-border via-primary/50 to-border md:hidden" />

        <div className="flex flex-col gap-6 md:grid md:grid-cols-3 md:gap-6">
          {entries.map((entry, index) => (
            <div key={entry.year} className="relative flex gap-4 md:flex-col md:gap-0">
              {/* Year marker - positioned for both mobile and desktop */}
              <div className="relative z-10 flex shrink-0 items-center justify-center md:mb-4 md:justify-center">
                <div
                  className={cn(
                    "flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 bg-card shadow-lg",
                    entry.result === "Member"
                      ? "border-gold"
                      : entry.result === "Winner"
                        ? "border-winner"
                        : entry.result === "Loser"
                          ? "border-loser"
                          : entry.result === "Unavailable"
                            ? "border-muted"
                            : "border-primary"
                  )}
                >
                  <span className="text-2xl font-bold text-foreground">{entry.year}</span>
                  <span className="text-xs text-muted-foreground">BS</span>
                </div>
              </div>

              {/* Election card */}
              <div
                className={cn(
                  "flex-1 rounded-xl border-2 p-4 transition-all hover:scale-[1.02]",
                  getResultColor(entry.result)
                )}
              >
                {/* Type badge and result */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  {entry.type && (
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                        entry.type === "FPTP"
                          ? "bg-primary/20 text-primary"
                          : "bg-accent/20 text-accent"
                      )}
                    >
                      {entry.type === "FPTP" ? (
                        <>
                          <Vote className="h-3 w-3" />
                          प्रत्यक्ष
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3" />
                          समानुपातिक
                        </>
                      )}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-sm font-bold">
                    {entry.result === "Member" && <Award className="h-4 w-4" />}
                    {entry.result === "Winner" && <TrendingUp className="h-4 w-4" />}
                    {entry.result === "Loser" && <TrendingDown className="h-4 w-4" />}
                    {entry.result === "Unavailable" && <CircleDot className="h-4 w-4" />}
                    {entry.result === "Current" && <CircleDot className="h-4 w-4" />}
                    {getResultLabel(entry.result)}
                  </span>
                </div>

                {/* Location */}
                {entry.district && entry.constituency && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {entry.district}-{entry.constituency}
                    </span>
                  </div>
                )}

                {/* Party */}
                {entry.party && (
                  <div className="mt-2 text-xs text-muted-foreground truncate" title={entry.party}>
                    {entry.party}
                  </div>
                )}

                {/* Vote stats */}
                {entry.votes && entry.votes > 0 && (
                  <div className="mt-3 space-y-1 border-t border-border/50 pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Votes</span>
                      <span className="font-semibold">{entry.votes.toLocaleString()}</span>
                    </div>
                    {entry.margin !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Margin</span>
                        <span
                          className={cn(
                            "flex items-center gap-1 font-semibold",
                            entry.result === "Winner" ? "text-winner" : "text-loser"
                          )}
                        >
                          {entry.result === "Winner" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {entry.result === "Winner" ? "+" : "-"}
                          {Math.abs(entry.margin).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Parliament member badge */}
                {entry.result === "Member" && (
                  <div className="mt-3 flex items-center justify-center">
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold">
                      Parliament Member
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
