"use client"

import { type Candidate, getVotePercentage, getMargin } from "@/lib/candidates-data"
import { cn } from "@/lib/utils"
import { Trophy, TrendingUp, TrendingDown, Vote, MapPin, BarChart3, XCircle } from "lucide-react"

interface ElectionResultCardProps {
  candidate: Candidate
  year: "2079" | "2074"
}

export function ElectionResultCard({ candidate, year }: ElectionResultCardProps) {
  // Get the relevant data based on year
  const isYear2079 = year === "2079"
  
  const votes = isYear2079 ? candidate.prev_election_votes : candidate.prev_2074_election_votes
  const result = isYear2079 ? candidate.prev_election_result : candidate.prev_2074_election_result
  const party = isYear2079 ? candidate.prev_election_party : candidate.prev_2074_election_party
  const district = isYear2079 ? candidate.prev_election_district : candidate.prev_2074_election_district
  const constituencyId = isYear2079 
    ? candidate.prev_election_constituency_id 
    : candidate.prev_2074_election_constituency_id
  const castedVotes = isYear2079 
    ? candidate.prev_election_casted_vote 
    : candidate.prev_2074_election_casted_vote
  const winnerVotes = isYear2079
    ? candidate.prev_winner_votes
    : candidate.prev_2074_winner_votes
  const runnerUpVotes = isYear2079 
    ? candidate.prev_runner_up_votes 
    : candidate.prev_2074_runner_up_votes
  const rank = isYear2079 ? candidate.prev_election_rank : candidate.prev_2074_election_rank

  // If no data for this year, don't render
  if (!votes) return null

  const isWinner = result === "Winner"
  const votePercentage = getVotePercentage(votes, castedVotes)
  // For winners, margin = their votes - runner up votes
  // For losers, margin = their votes - winner votes (will be negative)
  const opponentVotes = isWinner ? runnerUpVotes : winnerVotes
  const margin = getMargin(votes, opponentVotes)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border-2 bg-card",
        isWinner ? "border-winner/50" : "border-loser/50"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-6 py-4",
          isWinner ? "bg-winner/10" : "bg-loser/10"
        )}
      >
        <div>
          <h3 className="text-lg font-bold text-foreground">Election {year} BS</h3>
          <p className="text-sm text-muted-foreground">{party}</p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 font-bold",
            isWinner ? "bg-winner text-background" : "bg-loser text-background"
          )}
        >
          {isWinner ? (
            <>
              <Trophy className="h-4 w-4" />
              WINNER
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              LOST
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Location info */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-lg bg-primary/20 px-3 py-2 text-sm font-semibold text-primary">
            <Vote className="h-4 w-4" />
            प्रत्यक्ष
          </span>

          {district && constituencyId && (
            <span className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
              <MapPin className="h-4 w-4" />
              {district}-{constituencyId}
            </span>
          )}

          {rank && (
            <span className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
              Rank: #{rank}
            </span>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Votes */}
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              Votes Received
            </div>
            <p className="text-2xl font-bold text-foreground">{votes.toLocaleString()}</p>
          </div>

          {/* Vote percentage */}
          {votePercentage !== null && (
            <div className="rounded-xl bg-secondary/50 p-4">
              <div className="mb-1 text-sm text-muted-foreground">Vote Share</div>
              <p className="text-2xl font-bold text-primary">{votePercentage}%</p>
              {/* Progress bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={cn(
                    "h-full transition-all",
                    isWinner ? "bg-winner" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(votePercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Margin */}
          {margin !== null && (
            <div className="rounded-xl bg-secondary/50 p-4">
              <div className="mb-1 text-sm text-muted-foreground">
                {isWinner ? "Winning Margin" : "Lost By"}
              </div>
              <p
                className={cn(
                  "flex items-center gap-1 text-2xl font-bold",
                  margin > 0 ? "text-winner" : "text-loser"
                )}
              >
                {margin > 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {margin > 0 ? "+" : ""}
                {margin.toLocaleString()}
              </p>
            </div>
          )}

          {/* Runner-up/Winner votes */}
          {opponentVotes && (
            <div className="rounded-xl bg-secondary/50 p-4">
              <div className="mb-1 text-sm text-muted-foreground">
                {isWinner ? "Runner-up Votes" : "Winner Votes"}
              </div>
              <p className="text-2xl font-bold text-muted-foreground">
                {opponentVotes.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Total casted votes */}
        {castedVotes && castedVotes > 0 && (
          <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">निर्वाचन क्षेत्रमा खसेको कूल मत</span>
              <span className="font-semibold text-foreground">{castedVotes.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
