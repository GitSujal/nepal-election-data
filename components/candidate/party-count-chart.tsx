"use client"

import { useMemo } from "react"
import { BarChart3 } from "lucide-react"

interface CandidateData {
  candidate_id: number
  candidate_name: string
  political_party_name: string
  party_display_order?: number
  [key: string]: any
}

interface PartyCountChartProps {
  candidates: CandidateData[]
  className?: string
}

interface PartyCount {
  party: string
  count: number
  displayOrder: number
}

export function PartyCountChart({ candidates, className = "" }: PartyCountChartProps) {
  // Calculate party counts
  const { partyCounts, totalFilteredCandidates } = useMemo(() => {
    // Filter out independent candidates (स्वतन्त्र) from the chart
    const filteredCandidates = candidates.filter(
      c => c.political_party_name !== 'स्वतन्त्र'
    )
    
    const counts = new Map<string, { count: number; displayOrder: number }>()
    
    for (const candidate of filteredCandidates) {
      const party = candidate.political_party_name
      const existing = counts.get(party)
      const displayOrder = candidate.party_display_order ?? 9999
      
      if (existing) {
        existing.count += 1
        // Keep the minimum display order
        existing.displayOrder = Math.min(existing.displayOrder, displayOrder)
      } else {
        counts.set(party, { count: 1, displayOrder })
      }
    }
    
    // Convert to array and sort by count (descending), then by display order
    const sorted = Array.from(counts.entries())
      .map(([party, { count, displayOrder }]) => ({ party, count, displayOrder }))
      .sort((a, b) => {
        // First sort by count descending
        if (b.count !== a.count) return b.count - a.count
        // Then by display order ascending
        return a.displayOrder - b.displayOrder
      })
      .slice(0, 5) // Take top 5
    
    return {
      partyCounts: sorted,
      totalFilteredCandidates: filteredCandidates.length
    }
  }, [candidates])

  // Calculate max count for scaling bars
  const maxCount = Math.max(...partyCounts.map(p => p.count))

  // If only one party or no candidates, don't show the chart
  if (partyCounts.length <= 1) {
    return null
  }

  return (
    <div className={`rounded-2xl border border-border bg-card p-4 md:p-6 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">दलगत उम्मेदवार संख्या</h2>
        <span className="text-sm text-muted-foreground">(शीर्ष 5 दलहरू)</span>
      </div>

      <div className="space-y-3">
        {partyCounts.map((item, index) => {
          const percentage = (item.count / maxCount) * 100
          
          return (
            <div key={item.party} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="font-medium text-foreground line-clamp-1" title={item.party}>
                    {item.party}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5">
                    {item.count}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    उम्मेदवार
                  </span>
                </span>
              </div>
              
              <div className="relative h-8 overflow-hidden rounded-lg bg-secondary">
                <div
                  className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                >
                  <div className="flex h-full items-center justify-end pr-2">
                    {percentage > 15 && (
                      <span className="text-xs font-semibold text-primary-foreground">
                        {Math.round((item.count / totalFilteredCandidates) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        कुल {totalFilteredCandidates} उम्मेदवारहरू मध्ये {partyCounts.reduce((sum, p) => sum + p.count, 0)} उम्मेदवारहरू शीर्ष 5 दलहरूमा
      </div>
    </div>
  )
}
