"use client"

import { useState, Suspense } from "react"
import { GitCompareArrows, Building2, TrendingUp, TrendingDown, Minus, Shield, Target } from "lucide-react"
import { PartyFilter, PartyProfileData } from "@/components/party/party-filter"
import { StatCard, StatItem } from "@/components/party/stat-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { usePartySymbols } from "@/hooks/use-party-symbols"
import { useUrlState } from "@/hooks/use-url-state"
import { defaultPartyComparisonFilterState } from "@/lib/filter-types"

function PartyComparisonPageContent() {
  const [urlState, setUrlState] = useUrlState(defaultPartyComparisonFilterState)
  const [party1, setParty1] = useState<PartyProfileData | null>(null)
  const [party2, setParty2] = useState<PartyProfileData | null>(null)
  const { getSymbolUrl } = usePartySymbols()

  const handleParty1Change = (party: PartyProfileData | null) => {
    setParty1(party)
    setUrlState({ party1: party?.party_id || 0 })
  }

  const handleParty2Change = (party: PartyProfileData | null) => {
    setParty2(party)
    setUrlState({ party2: party?.party_id || 0 })
  }

  return (
    <main className="container mx-auto px-4 py-8 pb-20">
      <div className="mb-12 flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 shadow-sm border border-primary/20">
          <GitCompareArrows className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">पार्टी तुलना</h1>
          <p className="mt-2 text-lg text-muted-foreground">दुईवटा पार्टीहरू बीचको विवरण र तथ्याङ्क तुलना गर्नुहोस्</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2">पहिलो पार्टी (पार्टी क)</label>
          <PartyFilter onSelect={handleParty1Change} urlState={{ party: urlState.party1 }} onUrlStateChange={(updates) => setUrlState({ party1: updates.party })} />
        </div>
        <div className="space-y-4">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2">दोस्रो पार्टी (पार्टी ख)</label>
          <PartyFilter onSelect={handleParty2Change} urlState={{ party: urlState.party2 }} onUrlStateChange={(updates) => setUrlState({ party2: updates.party })} />
        </div>
      </div>

      {party1 && party2 && (
        <div className="mt-8 flex justify-center gap-12 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-4 w-12 rounded-full bg-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">पार्टी क</span>
              <span className="text-sm font-black text-foreground">{party1.party_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 border-l border-border pl-12">
            <div className="h-4 w-12 rounded-full bg-compare-secondary" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">पार्टी ख</span>
              <span className="text-sm font-black text-foreground">{party2.party_name}</span>
            </div>
          </div>
        </div>
      )}

      <Separator className="my-12 h-[2px] bg-border/50" />

      {party1 && party2 ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Comparison Sections */}
          <section className="space-y-6">
            <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-primary" />
              निर्वाचन परिणाम तुलना (सिट संख्या)
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <SeatComparisonCard 
                title="२०७९ निर्वाचन सिट" 
                p1={party1.history_json?.["2079"]?.total_reps || 0}
                p2={party2.history_json?.["2079"]?.total_reps || 0}
                label1={party1.party_name}
                label2={party2.party_name}
              />
              <SeatComparisonCard
                title="२०७४ निर्वाचन सिट"
                p1={party1.history_json?.["2074"]?.total_reps || 0}
                p2={party2.history_json?.["2074"]?.total_reps || 0}
                label1={party1.party_name}
                label2={party2.party_name}
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <MetricComparisonCard
                title="गढ (Gadh)"
                v1={party1.gadh_count || 0}
                v2={party2.gadh_count || 0}
                icon={<Shield className="h-5 w-5 text-emerald-600" />}
              />
              <MetricComparisonCard
                title="पकड (Pakad)"
                v1={party1.pakad_count || 0}
                v2={party2.pakad_count || 0}
                icon={<Target className="h-5 w-5 text-amber-600" />}
              />
            </div>
          </section>

          <section className="space-y-6">
             <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-primary" />
              प्रत्यक्ष उम्मेदवार विवरण (FPTP)
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
               <MetricComparisonCard 
                  title="कुल उम्मेदवार"
                  v1={party1.current_stats_json?.fptp?.total || 0}
                  v2={party2.current_stats_json?.fptp?.total || 0}
               />
               <MetricComparisonCard 
                  title="औसत उमेर"
                  v1={Math.round(party1.current_stats_json?.fptp?.avg_age || 0)}
                  v2={Math.round(party2.current_stats_json?.fptp?.avg_age || 0)}
                  suffix=" वर्ष"
                  type="lower-is-better"
               />
               <MetricComparisonCard 
                  title="नयाँ अनुहार (%)"
                  v1={party1.current_stats_json?.fptp?.total ? Math.round((party1.current_stats_json.fptp.new / party1.current_stats_json.fptp.total) * 100) : 0}
                  v2={party2.current_stats_json?.fptp?.total ? Math.round((party2.current_stats_json.fptp.new / party2.current_stats_json.fptp.total) * 100) : 0}
                  suffix="%"
               />
               <MetricComparisonCard 
                  title="महिला उम्मेदवार (%)"
                  v1={party1.current_stats_json?.fptp?.total ? Math.round(((party1.current_stats_json.fptp.gender?.find((g: any) => g.group === 'महिला')?.count || 0) / party1.current_stats_json.fptp.total) * 100) : 0}
                  v2={party2.current_stats_json?.fptp?.total ? Math.round(((party2.current_stats_json.fptp.gender?.find((g: any) => g.group === 'महिला')?.count || 0) / party2.current_stats_json.fptp.total) * 100) : 0}
                  suffix="%"
               />
               <MetricComparisonCard 
                  title="सिट परिवर्तन (२०७४-२०७९)"
                  v1={(party1.history_json?.["2079"]?.total_reps || 0) - (party1.history_json?.["2074"]?.total_reps || 0)}
                  v2={(party2.history_json?.["2079"]?.total_reps || 0) - (party2.history_json?.["2074"]?.total_reps || 0)}
                  showPlus
               />
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-primary" />
              विवरणगत तुलना (Distribution Analysis)
            </h2>
            <div className="grid gap-8 lg:grid-cols-2 items-start">
               <div className="flex flex-col gap-8">
                  <DistributionComparisonCard 
                    title="लैंगिक विवरण (FPTP)"
                    data1={party1.current_stats_json?.fptp?.gender}
                    data2={party2.current_stats_json?.fptp?.gender}
                    total1={party1.current_stats_json?.fptp?.total}
                    total2={party2.current_stats_json?.fptp?.total}
                    label1={party1.party_name}
                    label2={party2.party_name}
                  />
                  <DistributionComparisonCard 
                    title="उमेर समूह (FPTP)"
                    data1={party1.current_stats_json?.fptp?.age_group}
                    data2={party2.current_stats_json?.fptp?.age_group}
                    total1={party1.current_stats_json?.fptp?.total}
                    total2={party2.current_stats_json?.fptp?.total}
                    label1={party1.party_name}
                    label2={party2.party_name}
                  />
               </div>
               <DistributionComparisonCard 
                  title="शैक्षिक योग्यता (FPTP)"
                  data1={party1.current_stats_json?.fptp?.qualification}
                  data2={party2.current_stats_json?.fptp?.qualification}
                  total1={party1.current_stats_json?.fptp?.total}
                  total2={party2.current_stats_json?.fptp?.total}
                  label1={party1.party_name}
                  label2={party2.party_name}
                  className="h-full"
               />
            </div>
            <div className="pt-4">
               <DistributionComparisonCard 
                  title="विशेषताहरू (Tags) - FPTP"
                  data1={party1.current_stats_json?.fptp?.tags}
                  data2={party2.current_stats_json?.fptp?.tags}
                  total1={party1.current_stats_json?.fptp?.total}
                  total2={party2.current_stats_json?.fptp?.total}
                  label1={party1.party_name}
                  label2={party2.party_name}
                  columns={2}
               />
            </div>
          </section>

          {/* PR Candidate Comparison Section */}
          <section className="space-y-6">
             <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-primary" />
              समानुपातिक उम्मेदवार विवरण (PR)
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
               <MetricComparisonCard 
                  title="कुल उम्मेदवार"
                  v1={party1.current_stats_json?.pr?.total || 0}
                  v2={party2.current_stats_json?.pr?.total || 0}
               />
               <MetricComparisonCard 
                  title="महिला उम्मेदवार (%)"
                  v1={party1.current_stats_json?.pr?.total ? Math.round(((party1.current_stats_json.pr.gender?.find((g: any) => g.group === 'महिला')?.count || 0) / party1.current_stats_json.pr.total) * 100) : 0}
                  v2={party2.current_stats_json?.pr?.total ? Math.round(((party2.current_stats_json.pr.gender?.find((g: any) => g.group === 'महिला')?.count || 0) / party2.current_stats_json.pr.total) * 100) : 0}
                  suffix="%"
               />
               <MetricComparisonCard 
                  title="अपाङ्गता भएका (%)"
                  v1={party1.current_stats_json?.pr?.total ? Math.round(((party1.current_stats_json.pr.disability?.find((d: any) => d.group === 'Yes')?.count || 0) / party1.current_stats_json.pr.total) * 100) : 0}
                  v2={party2.current_stats_json?.pr?.total ? Math.round(((party2.current_stats_json.pr.disability?.find((d: any) => d.group === 'Yes')?.count || 0) / party2.current_stats_json.pr.total) * 100) : 0}
                  suffix="%"
               />
            </div>
            <div className="grid gap-8 md:grid-cols-2">
               <DistributionComparisonCard 
                  title="लैंगिक विवरण (PR)"
                  data1={party1.current_stats_json?.pr?.gender}
                  data2={party2.current_stats_json?.pr?.gender}
                  total1={party1.current_stats_json?.pr?.total}
                  total2={party2.current_stats_json?.pr?.total}
                  label1={party1.party_name}
                  label2={party2.party_name}
                  className="h-full"
               />
               <DistributionComparisonCard 
                  title="समावेशी समूह (PR)"
                  data1={party1.current_stats_json?.pr?.inclusive}
                  data2={party2.current_stats_json?.pr?.inclusive}
                  total1={party1.current_stats_json?.pr?.total}
                  total2={party2.current_stats_json?.pr?.total}
                  label1={party1.party_name}
                  label2={party2.party_name}
                  className="h-full"
               />
            </div>
            <div className="pt-4">
               <DistributionComparisonCard 
                  title="विशेषताहरू (Tags) - PR"
                  data1={party1.current_stats_json?.pr?.tags}
                  data2={party2.current_stats_json?.pr?.tags}
                  total1={party1.current_stats_json?.pr?.total}
                  total2={party2.current_stats_json?.pr?.total}
                  label1={party1.party_name}
                  label2={party2.party_name}
                  columns={2}
               />
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 h-24 w-24 rounded-full bg-secondary/30 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground">तुलना सुरु गर्न पार्टीहरू छान्नुहोस्</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">तपाईंले माथिको सर्च बक्सबाट कुनै पनि दुई पार्टीहरू छानेर तिनीहरूको तथ्याङ्क तुलना गर्न सक्नुहुन्छ।</p>
        </div>
      )}
    </main>
  )
}

function SeatComparisonCard({ title, p1, p2, label1, label2 }: { title: string, p1: number, p2: number, label1: string, label2: string }) {
  const max = Math.max(p1, p2, 1)
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <h3 className="mb-10 text-xl font-black text-foreground border-b border-border/50 pb-4">{title}</h3>
      <div className="space-y-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between font-extrabold">
             <span className="text-secondary-foreground text-base">{label1}</span>
             <span className="text-2xl text-primary tabular-nums">{p1}</span>
          </div>
          <div className="relative h-6 w-full overflow-hidden rounded-r-lg bg-secondary/30">
             <div 
                className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                style={{ width: `${(p1/max)*100}%` }} 
             />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between font-extrabold">
             <span className="text-secondary-foreground text-base">{label2}</span>
             <span className="text-2xl text-compare-secondary tabular-nums">{p2}</span>
          </div>
          <div className="relative h-6 w-full overflow-hidden rounded-r-lg bg-secondary/30">
             <div 
                className="h-full bg-compare-secondary transition-all duration-1000 ease-out shadow-[0_0_15px_color-mix(in_oklch,var(--compare-secondary)_30%,transparent)]" 
                style={{ width: `${(p2/max)*100}%` }} 
             />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricComparisonCard({ title, v1, v2, suffix = "", type = "higher-is-better", showPlus = false, icon }: { title: string, v1: number, v2: number, suffix?: string, type?: "higher-is-better" | "lower-is-better", showPlus?: boolean, icon?: React.ReactNode }) {
    const isV1Better = type === "higher-is-better" ? v1 > v2 : v1 < v2
    const isV2Better = type === "higher-is-better" ? v2 > v1 : v2 < v1

    const formatValue = (v: number) => {
        if (showPlus && v > 0) return `+${v}${suffix}`
        return `${v}${suffix}`
    }

    return (
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <h3 className="mb-6 text-base font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">{icon}{title}</h3>
            <div className="flex items-center justify-between gap-6">
                <div className={cn(
                    "flex flex-1 flex-col items-center justify-center rounded-2xl p-6 transition-all duration-500",
                    isV1Better ? "bg-primary/10 ring-2 ring-primary/20 scale-105" : "bg-secondary/30"
                )}>
                    <span className={cn("text-4xl font-black tabular-nums", isV1Better ? "text-primary" : "text-foreground")}>{formatValue(v1)}</span>
                    {isV1Better && <TrendingUp className="mt-2 h-6 w-6 text-primary" />}
                </div>
                
                <div className="text-sm font-black text-muted-foreground/20 italic">VS</div>

                <div className={cn(
                    "flex flex-1 flex-col items-center justify-center rounded-2xl p-6 transition-all duration-500",
                    isV2Better ? "bg-compare-secondary/10 ring-2 ring-compare-secondary/20 scale-105" : "bg-secondary/30"
                )}>
                    <span className={cn("text-4xl font-black tabular-nums", isV2Better ? "text-compare-secondary" : "text-foreground")}>{formatValue(v2)}</span>
                    {isV2Better && <TrendingUp className="mt-2 h-6 w-6 text-compare-secondary" />}
                </div>
            </div>
        </div>
    )
}

function DistributionComparisonCard({ 
    title, 
    data1 = [], 
    data2 = [], 
    total1 = 1, 
    total2 = 1, 
    label1, 
    label2,
    columns = 1,
    className
}: { 
    title: string, 
    data1: any[], 
    data2: any[], 
    total1: number, 
    total2: number, 
    label1: string, 
    label2: string,
    columns?: 1 | 2,
    className?: string
}) {
    // Get all unique group names
    const groups = Array.from(new Set([
        ...(data1 || []).map(d => d.group),
        ...(data2 || []).map(d => d.group)
    ])).filter(Boolean)

    // Sort groups by total volume
    const sortedGroups = groups.sort((a, b) => {
        const countA = (data1?.find(d => d.group === a)?.count || 0) + (data2?.find(d => d.group === a)?.count || 0)
        const countB = (data1?.find(d => d.group === b)?.count || 0) + (data2?.find(d => d.group === b)?.count || 0)
        return countB - countA
    })

    return (
        <div className={cn("rounded-3xl border border-border bg-card p-8 shadow-sm", className)}>
            <h3 className="mb-10 text-xl font-black text-foreground border-b border-border/50 pb-4">{title}</h3>
            <div className={cn(
                "gap-x-12 gap-y-10",
                columns === 2 ? "grid md:grid-cols-2" : "flex flex-col"
            )}>
                {sortedGroups.map((group) => {
                    const v1 = data1?.find(d => d.group === group)?.count || 0
                    const v2 = data2?.find(d => d.group === group)?.count || 0
                    const p1 = total1 > 0 ? (v1 / total1) * 100 : 0
                    const p2 = total2 > 0 ? (v2 / total2) * 100 : 0

                    return (
                        <div key={group} className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-base font-extrabold text-foreground">{group}</span>
                                <div className="flex gap-6 text-xs font-bold tabular-nums">
                                   <span className="text-primary">{v1} ({p1.toFixed(1)}%)</span>
                                   <span className="text-compare-secondary">{v2} ({p2.toFixed(1)}%)</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {/* Party 1 Bar */}
                                <div className="relative h-6 w-full overflow-hidden rounded-r-lg bg-secondary/30">
                                    <div 
                                        className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                                        style={{ width: `${p1}%` }} 
                                    />
                                </div>
                                {/* Party 2 Bar */}
                                <div className="relative h-6 w-full overflow-hidden rounded-r-lg bg-secondary/30">
                                    <div 
                                        className="h-full bg-compare-secondary transition-all duration-1000 ease-out shadow-[0_0_15px_color-mix(in_oklch,var(--compare-secondary)_30%,transparent)]" 
                                        style={{ width: `${p2}%` }} 
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// Required Suspense wrapper for useSearchParams
export default function PartyComparisonPage() {
  return (
    <Suspense fallback={
      <main className="container mx-auto px-4 py-8 pb-20">
        <div className="animate-pulse space-y-12">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-3xl bg-muted" />
            <div className="h-10 w-64 rounded bg-muted" />
            <div className="h-6 w-96 rounded bg-muted" />
          </div>
        </div>
      </main>
    }>
      <PartyComparisonPageContent />
    </Suspense>
  )
}
