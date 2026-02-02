"use client"

import { PartyProfileData } from "./party-filter"
import { History, TrendingUp, Vote, Award } from "lucide-react"

interface PartyHistoryProps {
  party: PartyProfileData
}

export function PartyHistory({ party }: PartyHistoryProps) {
  const history = party.history_json
  if (!history) return null

  const years = Object.keys(history).sort((a, b) => parseInt(b) - parseInt(a))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <History className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">निर्वाचन इतिहास</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {years.map((year) => {
          const stats = history[year]
          const hasData = stats.fptp_votes || stats.pr_votes || stats.total_reps > 0

          if (!hasData) return null

          return (
            <div key={year} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="bg-muted/50 px-6 py-4 border-b border-border">
                <h3 className="text-xl font-bold text-foreground">{year} को निर्वाचन</h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Reps Count */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">कुल प्रतिनिधि</p>
                    <p className="text-2xl font-bold text-primary">{stats.total_reps || 0}</p>
                  </div>
                  <div className="text-center border-x border-border">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">प्रत्यक्ष (FPTP)</p>
                    <p className="text-xl font-bold text-foreground">{stats.fptp_reps || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">समानुपातिक (PR)</p>
                    <p className="text-xl font-bold text-foreground">{stats.pr_reps || 0}</p>
                  </div>
                </div>

                {/* Vote Totals */}
                <div className="space-y-4">
                  {stats.fptp_votes > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4">
                      <div className="flex items-center gap-3">
                        <Vote className="h-5 w-5 text-accent" />
                        <span className="font-medium">प्रत्यक्ष मत</span>
                      </div>
                      <span className="text-lg font-bold">{(stats.fptp_votes || 0).toLocaleString('ne-NP')}</span>
                    </div>
                  )}
                  
                  {stats.pr_votes > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-success" />
                        <span className="font-medium">समानुपातिक मत</span>
                      </div>
                      <span className="text-lg font-bold">{(stats.pr_votes || 0).toLocaleString('ne-NP')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
