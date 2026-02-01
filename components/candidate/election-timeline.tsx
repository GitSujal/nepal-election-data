"use client"

import { type Candidate } from "@/lib/candidates-data"
import { cn } from "@/lib/utils"
import { Trophy, Users, Vote, MapPin, TrendingUp, TrendingDown, CircleDot } from "lucide-react"

interface ElectionTimelineProps {
  candidate: Candidate
}

interface TimelineEntry {
  year: "2074" | "2079" | "2081"
  type: "FPTP" | "Proportional" | null
  district: string | null
  constituency: number | null
  party: string | null
  result: "Winner" | "Loser" | "Current" | null
  votes: number | null
  runnerUpVotes: number | null
  wasMember: boolean
}

export function ElectionTimeline({ candidate }: ElectionTimelineProps) {
  // Build timeline entries from candidate data
  const entries: TimelineEntry[] = []

  // 2074 entry
  if (candidate.was_parliament_member_2074 || candidate.prev_2074_election_votes) {
    entries.push({
      year: "2074",
      type: candidate.parliament_member_2074_election_type,
      district: candidate.parliament_member_2074_district || candidate.prev_2074_election_district,
      constituency: candidate.parliament_member_2074_constituency || 
        (candidate.prev_2074_election_constituency_id ? parseInt(candidate.prev_2074_election_constituency_id) : null),
      party: candidate.parliament_member_2074_party || candidate.prev_2074_election_party,
      result: candidate.prev_2074_election_result,
      votes: candidate.prev_2074_election_votes,
      runnerUpVotes: candidate.prev_2074_runner_up_votes,
      wasMember: candidate.was_parliament_member_2074,
    })
  }

  // 2079 entry
  if (candidate.was_parliament_member_2079 || candidate.prev_election_votes) {
    entries.push({
      year: "2079",
      type: candidate.parliament_member_2079_election_type,
      district: candidate.parliament_member_2079_district || candidate.prev_election_district,
      constituency: candidate.parliament_member_2079_constituency || 
        (candidate.prev_election_constituency_id ? parseInt(candidate.prev_election_constituency_id) : null),
      party: candidate.parliament_member_2079_party || candidate.prev_election_party,
      result: candidate.prev_election_result,
      votes: candidate.prev_election_votes,
      runnerUpVotes: candidate.prev_runner_up_votes,
      wasMember: candidate.was_parliament_member_2079,
    })
  }

  // 2081 current entry
  entries.push({
    year: "2081",
    type: "FPTP",
    district: candidate.district_name,
    constituency: candidate.constituency_name,
    party: candidate.political_party_name,
    result: "Current",
    votes: candidate.current_vote_received || null,
    runnerUpVotes: null,
    wasMember: false,
  })

  const getResultColor = (result: TimelineEntry["result"]) => {
    switch (result) {
      case "Winner":
        return "border-winner bg-winner/10 text-winner"
      case "Loser":
        return "border-loser bg-loser/10 text-loser"
      case "Current":
        return "border-primary bg-primary/10 text-primary"
      default:
        return "border-muted bg-muted/10 text-muted-foreground"
    }
  }

  const getResultLabel = (result: TimelineEntry["result"]) => {
    switch (result) {
      case "Winner":
        return "ELECTED"
      case "Loser":
        return "LOST"
      case "Current":
        return "CONTESTING"
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
                    entry.result === "Winner"
                      ? "border-winner"
                      : entry.result === "Loser"
                        ? "border-loser"
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
                    {entry.result === "Winner" && <Trophy className="h-4 w-4" />}
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
                    {entry.runnerUpVotes && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Margin</span>
                        <span
                          className={cn(
                            "flex items-center gap-1 font-semibold",
                            entry.votes > entry.runnerUpVotes ? "text-winner" : "text-loser"
                          )}
                        >
                          {entry.votes > entry.runnerUpVotes ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {entry.votes > entry.runnerUpVotes ? "+" : ""}
                          {(entry.votes - entry.runnerUpVotes).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Parliament member badge */}
                {entry.wasMember && (
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
