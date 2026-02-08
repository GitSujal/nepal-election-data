"use client"

import { type Candidate } from "@/lib/candidates-data"
import { cn } from "@/lib/utils"
import { Trophy, Users, Vote, MapPin, TrendingUp, TrendingDown, CircleDot, ThumbsDown } from "lucide-react"
import { usePoliticalHistory } from "@/hooks/use-political-history"

interface ElectionTimelineProps {
  candidate: Candidate
}

interface TimelineEntry {
  year: string
  type: "FPTP" | "Proportional" | "Current" | null
  position: string
  district: string | null
  constituency: string | null
  party: string | null
  result: "Winner" | "Loser" | "Current" | null
  votes: number | null
  opponentVotes: number | null  // Winner votes for losers, runner-up votes for winners
  wasMember: boolean
}

export function EnhancedElectionTimeline({ candidate }: ElectionTimelineProps) {
  const { data: politicalHistory } = usePoliticalHistory(candidate.candidate_id)

  // Build timeline entries
  // 2074 and 2079 always come from authoritative dim model data (actual election results)
  // Other years (by-elections, older elections) come from Gemini political history
  const entries: TimelineEntry[] = []

  // 2074 entry from actual data
  if (candidate.was_parliament_member_2074 || candidate.prev_2074_election_votes) {
    const is2074Winner = candidate.prev_2074_election_result === "Winner"
    entries.push({
      year: "2074",
      type: candidate.parliament_member_2074_election_type || "FPTP",
      position: "प्रतिनिधि सभा सदस्य",
      district: candidate.prev_2074_election_district || candidate.parliament_member_2074_district,
      constituency: candidate.prev_2074_election_constituency_id ||
        (candidate.parliament_member_2074_constituency ? String(candidate.parliament_member_2074_constituency) : null),
      party: candidate.prev_2074_election_party || candidate.parliament_member_2074_party,
      result: candidate.prev_2074_election_result,
      votes: candidate.prev_2074_election_votes,
      opponentVotes: is2074Winner ? candidate.prev_2074_runner_up_votes : candidate.prev_2074_winner_votes,
      wasMember: candidate.was_parliament_member_2074,
    })
  }

  // 2079 entry from actual data
  if (candidate.was_parliament_member_2079 || candidate.prev_election_votes) {
    const is2079Winner = candidate.prev_election_result === "Winner"
    entries.push({
      year: "2079",
      type: candidate.parliament_member_2079_election_type || "FPTP",
      position: "प्रतिनिधि सभा सदस्य",
      district: candidate.prev_election_district || candidate.parliament_member_2079_district,
      constituency: candidate.prev_election_constituency_id ||
        (candidate.parliament_member_2079_constituency ? String(candidate.parliament_member_2079_constituency) : null),
      party: candidate.prev_election_party || candidate.parliament_member_2079_party,
      result: candidate.prev_election_result,
      votes: candidate.prev_election_votes,
      opponentVotes: is2079Winner ? candidate.prev_runner_up_votes : candidate.prev_winner_votes,
      wasMember: candidate.was_parliament_member_2079,
    })
  }

  // Add entries from political history for other years (by-elections, older elections)
  if (politicalHistory?.election_history) {
    politicalHistory.election_history.forEach((election) => {
      const isWin = election.result === "विजयी"
      entries.push({
        year: election.year,
        type: election.position.includes("समानुपातिक") ? "Proportional" : "FPTP",
        position: election.position,
        district: election.district,
        constituency: election.constituency,
        party: election.party,
        result: isWin ? "Winner" : "Loser",
        votes: null,
        opponentVotes: null,
        wasMember: isWin,
      })
    })
  }

  // Always add current 2082 entry
  entries.push({
    year: "2082",
    type: "Current",
    position: "प्रतिनिधि सभा उम्मेदवार",
    district: candidate.district_name,
    constituency: String(candidate.constituency_name),
    party: candidate.political_party_name,
    result: "Current",
    votes: candidate.current_vote_received || null,
    opponentVotes: null,
    wasMember: false,
  })

  // Sort by year (oldest first for timeline display)
  entries.sort((a, b) => {
    const yearA = parseInt(a.year)
    const yearB = parseInt(b.year)
    return yearA - yearB
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
        return "निर्वाचित"
      case "Loser":
        return "पराजित"
      case "Current":
        return "उम्मेदवार"
      default:
        return "N/A"
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold uppercase tracking-wider text-muted-foreground">
          चुनावी यात्रा
        </h2>
        {entries.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {entries.length} चुनाव{entries.length > 1 ? 'हरू' : ''}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connection line - horizontal on desktop */}
        <div className={cn(
          "absolute left-[50px] right-0 top-12 hidden h-1 bg-gradient-to-r from-border via-primary/50 to-border md:block md:left-0",
          entries.length === 1 && "md:hidden"
        )} />
        
        {/* Connection line - vertical on mobile */}
        <div className={cn(
          "absolute bottom-0 left-12 top-0 w-1 bg-gradient-to-b from-border via-primary/50 to-border md:hidden",
          entries.length === 1 && "hidden"
        )} />

        <div className={cn(
          "flex flex-col gap-6",
          entries.length === 1 ? "md:flex md:justify-center" : "md:grid md:gap-6",
          entries.length === 2 && "md:grid-cols-2",
          entries.length >= 3 && "md:grid-cols-3"
        )}>
          {entries.map((entry, index) => (
            <div key={`${entry.year}-${index}`} className="relative flex gap-4 md:flex-col md:gap-0">
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
                  {entry.type && entry.type !== "Current" && (
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
                    {entry.result === "Loser" && <ThumbsDown className="h-4 w-4" />}
                    {entry.result === "Current" && <CircleDot className="h-4 w-4" />}
                    {getResultLabel(entry.result)}
                  </span>
                </div>

                {/* Position */}
                {entry.position && (
                  <div className="mb-2 text-xs font-semibold text-foreground">
                    {entry.position}
                  </div>
                )}

                {/* Location */}
                {entry.district && entry.constituency && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {entry.district} {entry.constituency}
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
                    {entry.opponentVotes && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Margin:</span>
                        <span
                          className={cn(
                            "flex items-center gap-1 font-bold",
                            entry.votes > entry.opponentVotes ? "text-winner" : "text-loser"
                          )}
                        >
                          {entry.votes > entry.opponentVotes ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {entry.votes > entry.opponentVotes ? "+" : ""}
                          {(entry.votes - entry.opponentVotes).toLocaleString()}
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
