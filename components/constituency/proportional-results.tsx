"use client"

import { type ProportionalResult, parseResults } from "@/lib/constituency-data"
import { Users, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProportionalResultsProps {
  results: string | ProportionalResult[]
}

export function ProportionalResults({ results }: ProportionalResultsProps) {
  // Handle both string (old format) and array (new format)
  let parsedResults: ProportionalResult[] = []
  if (typeof results === "string") {
    parsedResults = parseResults<ProportionalResult>(results)
  } else if (Array.isArray(results)) {
    parsedResults = results
  }

  if (parsedResults.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-center text-muted-foreground">
          २०७९ को समानुपातिक निर्वाचन परिणाम उपलब्ध छैन
        </p>
      </div>
    )
  }

  // Sort by vote count
  const sortedResults = [...parsedResults].sort((a, b) => b.vote_count - a.vote_count)
  const totalVotes = sortedResults.reduce((sum, r) => sum + r.vote_count, 0)
  const maxVotes = sortedResults[0]?.vote_count || 1

  // Get top 5 for chart visualization
  const topResults = sortedResults.slice(0, 5)
  const otherResults = sortedResults.slice(5)
  const otherVotes = otherResults.reduce((sum, r) => sum + r.vote_count, 0)

  // Color palette for parties
  const partyColors = [
    "bg-primary",
    "bg-accent",
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5",
    "bg-muted-foreground",
  ]

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-secondary/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              समानुपातिक निर्वाचन २०७९
            </h3>
            <p className="text-sm text-muted-foreground">
              कूल मत: {totalVotes.toLocaleString("ne-NP")}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="p-6">
        {/* Horizontal stacked bar */}
        <div className="mb-6 h-8 flex overflow-hidden rounded-lg">
          {topResults.map((result, index) => {
            const width = (result.vote_count / totalVotes) * 100
            return (
              <div
                key={result.party_name}
                className={cn(partyColors[index], "transition-all hover:opacity-80")}
                style={{ width: `${width}%` }}
                title={`${result.party_name}: ${result.vote_count.toLocaleString("ne-NP")} (${width.toFixed(1)}%)`}
              />
            )
          })}
          {otherVotes > 0 && (
            <div
              className={cn(partyColors[5], "transition-all hover:opacity-80")}
              style={{ width: `${(otherVotes / totalVotes) * 100}%` }}
              title={`अन्य: ${otherVotes.toLocaleString("ne-NP")}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap gap-3">
          {topResults.map((result, index) => (
            <div key={result.party_name} className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", partyColors[index])} />
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {result.party_name.length > 20
                  ? result.party_name.substring(0, 20) + "..."
                  : result.party_name}
              </span>
            </div>
          ))}
          {otherVotes > 0 && (
            <div className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", partyColors[5])} />
              <span className="text-xs text-muted-foreground">अन्य</span>
            </div>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="border-t border-border divide-y divide-border">
        {sortedResults.slice(0, 10).map((result, index) => {
          const votePercent = totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0
          const barWidth = (result.vote_count / maxVotes) * 100

          return (
            <div
              key={result.party_name}
              className="relative p-4 transition-colors hover:bg-secondary/30"
            >
              {/* Background bar */}
              <div
                className={cn("absolute inset-y-0 left-0 opacity-10", partyColors[Math.min(index, 5)])}
                style={{ width: `${barWidth}%` }}
              />

              <div className="relative flex items-center gap-4">
                {/* Rank */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    index === 0
                      ? "bg-gold/20 text-gold"
                      : index === 1
                        ? "bg-silver/20 text-silver"
                        : index === 2
                          ? "bg-bronze/20 text-bronze"
                          : "bg-secondary text-muted-foreground"
                  )}
                >
                  {index + 1}
                </div>

                {/* Party Info */}
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {result.party_name}
                  </span>
                </div>

                {/* Vote Count */}
                <div className="shrink-0 text-right">
                  <div className="font-bold text-foreground">
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
      {sortedResults.length > 10 && (
        <div className="border-t border-border bg-secondary/30 px-6 py-3 text-center">
          <span className="text-sm text-muted-foreground">
            + {sortedResults.length - 10} अन्य पार्टीहरु
          </span>
        </div>
      )}
    </div>
  )
}
