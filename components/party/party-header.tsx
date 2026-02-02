"use client"

import { PartyProfileData } from "./party-filter"
import { Building2, TrendingUp, TrendingDown, Minus, Shield, Target } from "lucide-react"
import { usePartySymbols } from "@/hooks/use-party-symbols"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface PartyHeaderProps {
  party: PartyProfileData
}

export function PartyHeader({ party }: PartyHeaderProps) {
  const { getSymbolUrl } = usePartySymbols()
  const symbolUrl = party.symbol_url || getSymbolUrl(party.party_name)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const reps2079 = (party.history_json?.["2079"]?.total_reps) || 0
  const reps2074 = (party.history_json?.["2074"]?.total_reps) || 0
  const trend = reps2079 - reps2074
  const gadhCount = party.gadh_count || 0
  const pakadCount = party.pakad_count || 0

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start lg:items-center">
          {/* Party Symbol */}
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-white p-3 sm:h-36 sm:w-36 shadow-md border-2 border-border/50">
            {symbolUrl ? (
              <div className="relative h-full w-full">
                <Image
                  src={symbolUrl}
                  alt={party.party_name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <Building2 className="h-14 w-14 text-muted-foreground" />
            )}
          </div>

          {/* Party Info */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
                {party.party_name}
              </h1>
              {party.leader && (
                <p className="mt-1 text-xl font-medium text-muted-foreground">
                  नेता: {party.leader}
                </p>
              )}
            </div>

            {/* Tags - Bigger badges to match seat counts */}
            <div className="flex flex-wrap gap-3">
              {party.party_tags && party.party_tags.map((tag: string) => (
                <Badge 
                  key={tag}
                  variant="secondary"
                  className="rounded-xl px-5 py-2.5 text-lg font-bold shadow-sm"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Seat Trends */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-primary/5 border border-primary/20 px-8 py-5 shadow-sm min-w-[140px]">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">२०७९ सिट</span>
                <span className="text-4xl font-black text-primary">
                  {reps2079}
                </span>
              </div>

              {/* Trend Indicator */}
              <div className={cn(
                "flex flex-col items-center justify-center rounded-2xl px-4 py-5 shadow-sm min-w-[100px] border",
                trend > 0 ? "bg-green-500/10 border-green-500/20 text-green-600" : 
                trend < 0 ? "bg-red-500/10 border-red-500/20 text-red-600" : 
                "bg-slate-500/10 border-slate-500/20 text-slate-600"
              )}>
                {trend > 0 ? <TrendingUp className="h-8 w-8" /> : 
                 trend < 0 ? <TrendingDown className="h-8 w-8" /> : 
                 <Minus className="h-8 w-8" />}
                <span className="mt-1 text-2xl font-black">
                  {trend > 0 ? `+${trend}` : trend}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end px-3">
              <span className="text-base font-medium text-muted-foreground">२०७४ मा:</span>
              <span className="text-xl font-bold text-foreground">{reps2074} सिट</span>
            </div>
          </div>
        </div>

        {/* Gadh / Pakad Cards */}
        {(gadhCount > 0 || pakadCount > 0) && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {gadhCount > 0 && (
              <div>
                <button
                  onClick={() => setExpandedCard(expandedCard === 'gadh' ? null : 'gadh')}
                  className="w-full flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 text-left transition-colors hover:bg-emerald-500/15"
                >
                  <Shield className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">गढ</span>
                    <span className="ml-2 text-2xl font-black text-emerald-600">{gadhCount}</span>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">{expandedCard === 'gadh' ? '▲' : '▼'}</span>
                </button>
                {expandedCard === 'gadh' && party.gadh_constituencies && (
                  <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
                    {party.gadh_constituencies.map((c: string) => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            {pakadCount > 0 && (
              <div>
                <button
                  onClick={() => setExpandedCard(expandedCard === 'pakad' ? null : 'pakad')}
                  className="w-full flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-5 py-4 text-left transition-colors hover:bg-amber-500/15"
                >
                  <Target className="h-6 w-6 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">पकड</span>
                    <span className="ml-2 text-2xl font-black text-amber-600">{pakadCount}</span>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">{expandedCard === 'pakad' ? '▲' : '▼'}</span>
                </button>
                {expandedCard === 'pakad' && party.pakad_constituencies && (
                  <div className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                    {party.pakad_constituencies.map((c: string) => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
