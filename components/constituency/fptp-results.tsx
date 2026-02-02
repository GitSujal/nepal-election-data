"use client"

import { type FPTPResult, parseResults } from "@/lib/constituency-data"
import { Trophy, Medal, Vote, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FPTPResultsProps {
  results2079: string | FPTPResult[]
  results2074: string | FPTPResult[]
  year: "2079" | "2074"
}

export function FPTPResults({ results2079, results2074, year }: FPTPResultsProps) {
  const resultsData = year === "2079" ? results2079 : results2074

  // Handle both string (old format) and array (new format)
  let results: FPTPResult[] = []
  if (typeof resultsData === "string") {
    results = parseResults<FPTPResult>(resultsData)
  } else if (Array.isArray(resultsData)) {
    results = resultsData
  }
  
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-center text-muted-foreground">
          २०{year} को प्रत्यक्ष निर्वाचन परिणाम उपलब्ध छैन
        </p>
      </div>
    )
  }

  // Sort by vote count descending
  const sortedResults = [...results].sort((a, b) => b.vote_count - a.vote_count)
  const totalVotes = sortedResults.reduce((sum, r) => sum + r.vote_count, 0)
  const maxVotes = sortedResults[0]?.vote_count || 1
  const winner = sortedResults[0]
  const runnerUp = sortedResults[1]
  const margin = winner && runnerUp ? winner.vote_count - runnerUp.vote_count : 0
  const marginPercent = totalVotes > 0 ? ((margin / totalVotes) * 100).toFixed(2) : "0"

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-secondary/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Vote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                प्रत्यक्ष निर्वाचन {year}
              </h3>
              <p className="text-sm text-muted-foreground">
                कूल मत: {totalVotes.toLocaleString("ne-NP")}
              </p>
            </div>
          </div>
          {margin > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">
                अन्तर: {margin.toLocaleString("ne-NP")} ({marginPercent}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="divide-y divide-border">
        {sortedResults.slice(0, 7).map((result, originalIndex) => {
          const votePercent = totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0
          const barWidth = (result.vote_count / maxVotes) * 100
          const isWinner = result.remarks === "Elected" || originalIndex === 0

          return (
            <div
              key={`${result.candidate_name}-${originalIndex}`}
              className={cn(
                "relative p-4 transition-colors hover:bg-secondary/30",
                isWinner && "bg-success/5"
              )}
            >
              {/* Background bar */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 opacity-20 transition-all",
                  isWinner ? "bg-success" : "bg-primary"
                )}
                style={{ width: `${barWidth}%` }}
              />

              <div className="relative flex items-center gap-4">
                {/* Rank */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold",
                    originalIndex === 0
                      ? "bg-gold/20 text-gold"
                      : originalIndex === 1
                        ? "bg-silver/20 text-silver"
                        : originalIndex === 2
                          ? "bg-bronze/20 text-bronze"
                          : "bg-secondary text-muted-foreground"
                  )}
                >
                  {originalIndex === 0 ? (
                    <Trophy className="h-5 w-5" />
                  ) : originalIndex === 1 ? (
                    <Medal className="h-5 w-5" />
                  ) : (
                    originalIndex + 1
                  )}
                </div>

                {/* Candidate Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-foreground">
                      {result.candidate_name}
                    </span>
                    {isWinner && (
                      <span className="shrink-0 rounded-full bg-success/20 px-2 py-0.5 text-xs font-semibold text-success">
                        विजयी
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="truncate">{result.party_name}</span>
                    {result.symbol_name && (
                      <span className="shrink-0 text-xs">({result.symbol_name})</span>
                    )}
                  </div>
                </div>

                {/* Vote Count */}
                <div className="shrink-0 text-right">
                  <div className="text-lg font-bold text-foreground">
                    {result.vote_count.toLocaleString("ne-NP")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {votePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show More */}
      {sortedResults.length > 7 && (
        <div className="border-t border-border bg-secondary/30 px-6 py-3 text-center">
          <span className="text-sm text-muted-foreground">
            + {sortedResults.length - 7} अन्य उम्मेदवार
          </span>
        </div>
      )}
    </div>
  )
}
