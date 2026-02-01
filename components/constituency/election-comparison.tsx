"use client"

import { type FPTPResult, parseResults } from "@/lib/constituency-data"
import { ArrowRight, TrendingUp, TrendingDown, Equal, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ElectionComparisonProps {
  results2079: string | FPTPResult[]
  results2074: string | FPTPResult[]
  winner2079: string
  winner2074: string
}

export function ElectionComparison({
  results2079,
  results2074,
  winner2079,
  winner2074,
}: ElectionComparisonProps) {
  // Handle both string (old format) and array (new format)
  let fptp2079: FPTPResult[] = []
  if (typeof results2079 === "string") {
    fptp2079 = parseResults<FPTPResult>(results2079)
  } else if (Array.isArray(results2079)) {
    fptp2079 = results2079
  }

  let fptp2074: FPTPResult[] = []
  if (typeof results2074 === "string") {
    fptp2074 = parseResults<FPTPResult>(results2074)
  } else if (Array.isArray(results2074)) {
    fptp2074 = results2074
  }

  // Get winners
  const winner2079Data = fptp2079.find(
    (r) => r.remarks === "Elected" || fptp2079.indexOf(r) === 0
  )
  const winner2074Data = fptp2074.find(
    (r) => r.remarks === "Elected" || fptp2074.indexOf(r) === 0
  )

  const total2079 = fptp2079.reduce((sum, r) => sum + r.vote_count, 0)
  const total2074 = fptp2074.reduce((sum, r) => sum + r.vote_count, 0)

  const partyChanged = winner2079 !== winner2074
  const sameCandidate = winner2079Data?.candidate_name === winner2074Data?.candidate_name

  // Vote comparison for winning party
  const winningParty2079Votes = fptp2079
    .filter((r) => r.party_name === winner2079)
    .reduce((sum, r) => sum + r.vote_count, 0)
  const winningParty2074Votes = fptp2074
    .filter((r) => r.party_name === winner2079)
    .reduce((sum, r) => sum + r.vote_count, 0)

  const voteChange = winningParty2079Votes - winningParty2074Votes
  const voteChangePercent =
    winningParty2074Votes > 0 ? ((voteChange / winningParty2074Votes) * 100).toFixed(1) : 0

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-secondary/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/20">
            <RefreshCw className="h-5 w-5 text-chart-3" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              निर्वाचन तुलना
            </h3>
            <p className="text-sm text-muted-foreground">
              २०७४ vs २०७९
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Timeline Comparison */}
        <div className="flex items-center justify-between gap-4">
          {/* 2074 */}
          <div className="flex-1 rounded-xl border border-border bg-secondary/30 p-4 text-center">
            <div className="mb-2 text-2xl font-bold text-accent">२०७४</div>
            {winner2074Data ? (
              <>
                <div className="mb-1 font-semibold text-foreground">
                  {winner2074Data.candidate_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {winner2074}
                </div>
                <div className="mt-2 text-lg font-bold text-foreground">
                  {winner2074Data.vote_count.toLocaleString("ne-NP")} मत
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">डाटा उपलब्ध छैन</div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-2">
            <ArrowRight className="h-8 w-8 text-muted-foreground" />
            {partyChanged ? (
              <span className="rounded-full bg-accent/20 px-2 py-1 text-xs font-semibold text-accent">
                पार्टी परिवर्तन
              </span>
            ) : sameCandidate ? (
              <span className="rounded-full bg-success/20 px-2 py-1 text-xs font-semibold text-success">
                पुन: निर्वाचित
              </span>
            ) : (
              <span className="rounded-full bg-primary/20 px-2 py-1 text-xs font-semibold text-primary">
                उही पार्टी
              </span>
            )}
          </div>

          {/* 2079 */}
          <div className="flex-1 rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
            <div className="mb-2 text-2xl font-bold text-primary">२०७९</div>
            {winner2079Data ? (
              <>
                <div className="mb-1 font-semibold text-foreground">
                  {winner2079Data.candidate_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {winner2079}
                </div>
                <div className="mt-2 text-lg font-bold text-foreground">
                  {winner2079Data.vote_count.toLocaleString("ne-NP")} मत
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">डाटा उपलब्ध छैन</div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {/* Voter Turnout Comparison */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="mb-2 text-sm text-muted-foreground">कूल मत परिवर्तन</div>
            <div className="flex items-center gap-2">
              {total2079 > total2074 ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : total2079 < total2074 ? (
                <TrendingDown className="h-5 w-5 text-destructive" />
              ) : (
                <Equal className="h-5 w-5 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "text-lg font-bold",
                  total2079 > total2074
                    ? "text-success"
                    : total2079 < total2074
                      ? "text-destructive"
                      : "text-muted-foreground"
                )}
              >
                {total2079 > total2074 ? "+" : ""}
                {(total2079 - total2074).toLocaleString("ne-NP")}
              </span>
            </div>
          </div>

          {/* Winner Vote Change */}
          {winningParty2074Votes > 0 && (
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="mb-2 text-sm text-muted-foreground">विजेता पार्टी मत परिवर्तन</div>
              <div className="flex items-center gap-2">
                {voteChange > 0 ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : voteChange < 0 ? (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                ) : (
                  <Equal className="h-5 w-5 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "text-lg font-bold",
                    voteChange > 0
                      ? "text-success"
                      : voteChange < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {voteChange > 0 ? "+" : ""}
                  {voteChangePercent}%
                </span>
              </div>
            </div>
          )}

          {/* Candidates Count */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="mb-2 text-sm text-muted-foreground">उम्मेदवार संख्या</div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-accent">{fptp2074.length}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold text-primary">{fptp2079.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
