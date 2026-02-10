"use client"

import { useState, useMemo, Suspense } from "react"
import { Users, User, Trophy, Vote, MapPin, GraduationCap, Calendar, Award, Briefcase, TrendingUp, TrendingDown, Building2, FileText, AlertTriangle, Swords, ChevronRight, Clock } from "lucide-react"
import { CandidateComparisonSelector } from "@/components/candidate/candidate-comparison-selector"
import { BadgeDisplay } from "@/components/candidate/badge-display"
import { usePoliticalHistory, type CandidatePoliticalHistory } from "@/hooks/use-political-history"
import { usePartySymbols } from "@/hooks/use-party-symbols"
import { useUrlState } from "@/hooks/use-url-state"
import { defaultCandidateComparisonFilterState } from "@/lib/filter-types"
import { badgeDefinitions, type Candidate } from "@/lib/candidates-data"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

function CandidateComparisonPageContent() {
  const [urlState, setUrlState] = useUrlState(defaultCandidateComparisonFilterState)
  const [candidate1, setCandidate1] = useState<Candidate | null>(null)
  const [candidate2, setCandidate2] = useState<Candidate | null>(null)
  const { getSymbolUrl } = usePartySymbols()

  // Fetch political histories for both candidates
  const { data: history1 } = usePoliticalHistory(candidate1?.candidate_id)
  const { data: history2 } = usePoliticalHistory(candidate2?.candidate_id)

  const handleCandidate1Change = (c: Candidate | null) => {
    setCandidate1(c)
    setUrlState({ c1: c?.candidate_id || 0 })
  }

  const handleCandidate2Change = (c: Candidate | null) => {
    setCandidate2(c)
    setUrlState({ c2: c?.candidate_id || 0 })
  }

  const bothSelected = candidate1 && candidate2

  return (
    <main className="container mx-auto px-4 py-8 pb-20">
      {/* Page Header */}
      <div className="mb-10 flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 shadow-sm border border-primary/20">
          <Swords className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">उम्मेदवार तुलना</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            दुईजना उम्मेदवारहरू बीचको विस्तृत तथ्याङ्क तुलना गर्नुहोस्
          </p>
        </div>
      </div>

      {/* Candidate Selectors */}
      <div className="grid gap-8 lg:grid-cols-2">
        <CandidateComparisonSelector
          label="पहिलो उम्मेदवार (क)"
          selectedCandidateId={urlState.c1}
          onSelect={handleCandidate1Change}
          otherCandidateId={urlState.c2 || undefined}
        />
        <CandidateComparisonSelector
          label="दोस्रो उम्मेदवार (ख)"
          selectedCandidateId={urlState.c2}
          onSelect={handleCandidate2Change}
          otherCandidateId={urlState.c1 || undefined}
        />
      </div>

      {/* Color Legend */}
      {bothSelected && (
        <div className="mt-8 flex flex-wrap justify-center gap-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-4 w-12 rounded-full bg-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">उम्मेदवार क</span>
              <span className="text-sm font-black text-foreground">{candidate1!.candidate_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 border-l border-border pl-8">
            <div className="h-4 w-12 rounded-full bg-compare-secondary" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">उम्मेदवार ख</span>
              <span className="text-sm font-black text-foreground">{candidate2!.candidate_name}</span>
            </div>
          </div>
        </div>
      )}

      <Separator className="my-10 h-[2px] bg-border/50" />

      {bothSelected ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Head-to-Head Profile Cards */}
          <HeadToHeadProfiles
            c1={candidate1!}
            c2={candidate2!}
            h1={history1}
            h2={history2}
            getSymbolUrl={getSymbolUrl}
          />

          {/* Key Metrics Comparison */}
          <section className="space-y-6">
            <SectionHeader title="मुख्य तथ्याङ्क तुलना" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="उमेर"
                v1={candidate1!.age}
                v2={candidate2!.age}
                suffix=" वर्ष"
                type="neutral"
              />
              <MetricCard
                title="चुनाव संख्या"
                v1={candidate1!.total_elections_contested}
                v2={candidate2!.total_elections_contested}
              />
              <MetricCard
                title="विजय संख्या"
                v1={candidate1!.total_wins_from_profile || 0}
                v2={candidate2!.total_wins_from_profile || 0}
              />
              <MetricCard
                title="स्वीकृति दर"
                v1={history1?.overall_approval_rating || 0}
                v2={history2?.overall_approval_rating || 0}
                suffix="%"
              />
              <MetricCard
                title="मन्त्री नियुक्ति"
                v1={candidate1!.minister_appointment_count || 0}
                v2={candidate2!.minister_appointment_count || 0}
              />
              <MetricCard
                title="विशेषता संख्या"
                v1={candidate1!.tags.length}
                v2={candidate2!.tags.length}
              />
            </div>
          </section>

          {/* Election Results Comparison */}
          <section className="space-y-6">
            <SectionHeader title="चुनावी परिणाम तुलना" />
            <ElectionComparison c1={candidate1!} c2={candidate2!} />
          </section>

          {/* Badges/Tags Comparison */}
          <section className="space-y-6">
            <SectionHeader title="विशेषता तुलना" />
            <TagsComparison c1={candidate1!} c2={candidate2!} />
          </section>

          {/* Personal Details Comparison */}
          <section className="space-y-6">
            <SectionHeader title="व्यक्तिगत विवरण तुलना" />
            <PersonalDetailsComparison c1={candidate1!} c2={candidate2!} />
          </section>

          {/* Political History Comparison */}
          <section className="space-y-6">
            <SectionHeader title="राजनीतिक इतिहास" />
            <PoliticalHistoryComparison
              c1={candidate1!}
              c2={candidate2!}
              h1={history1}
              h2={history2}
            />
          </section>

          {/* Analysis Comparison */}
          {(history1?.analysis || history2?.analysis) && (
            <section className="space-y-6">
              <SectionHeader title="राजनीतिक विश्लेषण" />
              <AnalysisComparison h1={history1} h2={history2} c1={candidate1!} c2={candidate2!} />
            </section>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 h-24 w-24 rounded-full bg-secondary/30 flex items-center justify-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold text-foreground">तुलना सुरु गर्न उम्मेदवारहरू छान्नुहोस्</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            माथिको सर्च बक्सबाट दुईजना उम्मेदवार छानेर तिनीहरूको विस्तृत तथ्याङ्क तुलना गर्न सक्नुहुन्छ।
          </p>
        </div>
      )}
    </main>
  )
}

/* ===== Section Header ===== */
function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-3">
      <span className="h-8 w-1.5 rounded-full bg-primary" />
      {title}
    </h2>
  )
}

/* ===== Head-to-Head Profile Cards ===== */
function HeadToHeadProfiles({
  c1, c2, h1, h2, getSymbolUrl,
}: {
  c1: Candidate
  c2: Candidate
  h1: CandidatePoliticalHistory | null
  h2: CandidatePoliticalHistory | null
  getSymbolUrl: (name: string) => string | null
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfileCard candidate={c1} history={h1} getSymbolUrl={getSymbolUrl} color="primary" />
      <ProfileCard candidate={c2} history={h2} getSymbolUrl={getSymbolUrl} color="compare-secondary" />
    </div>
  )
}

function ProfileCard({
  candidate, history, getSymbolUrl, color,
}: {
  candidate: Candidate
  history: CandidatePoliticalHistory | null
  getSymbolUrl: (name: string) => string | null
  color: "primary" | "compare-secondary"
}) {
  const candidateImageUrl = `https://result.election.gov.np/Images/Candidate/${candidate.candidate_id}.jpg`
  const partySymbolUrl = getSymbolUrl(candidate.political_party_name)
  const wins = candidate.total_wins_from_profile || 0

  const getLevel = () => {
    if (candidate.total_elections_contested >= 2 && candidate.prev_election_result === "Winner") {
      return { label: "दिग्गज", bg: "bg-gold text-gold-foreground" }
    }
    if (candidate.was_parliament_member_2079 || candidate.was_parliament_member_2074) {
      return { label: "अनुभवी", bg: "bg-primary text-primary-foreground" }
    }
    return { label: "नयाँ", bg: "bg-accent text-accent-foreground" }
  }
  const level = getLevel()

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl border-2 bg-card shadow-sm",
      color === "primary" ? "border-primary/30" : "border-compare-secondary/30"
    )}>
      {/* Top color bar */}
      <div className={cn(
        "h-2",
        color === "primary" ? "bg-primary" : "bg-compare-secondary"
      )} />

      <div className="p-6">
        {/* Photo + Name */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-3",
            color === "primary" ? "border-primary/40" : "border-compare-secondary/40"
          )}>
            <Image
              src={candidateImageUrl}
              alt={candidate.candidate_name}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
              }}
            />
            <div className={cn(
              "absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-md",
              level.bg
            )}>
              {level.label}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black text-foreground truncate text-balance">
              {candidate.candidate_name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              {partySymbolUrl && (
                <div className="h-6 w-6 shrink-0 overflow-hidden rounded bg-background border border-border">
                  <Image
                    src={partySymbolUrl}
                    alt="Party"
                    width={24}
                    height={24}
                    className="h-full w-full object-contain p-0.5"
                    unoptimized
                  />
                </div>
              )}
              <span className="text-sm text-muted-foreground truncate">{candidate.political_party_name}</span>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-secondary/50 p-2.5 text-center">
            <p className={cn(
              "text-xl font-black tabular-nums",
              color === "primary" ? "text-primary" : "text-compare-secondary"
            )}>{candidate.age}</p>
            <p className="text-[10px] font-medium text-muted-foreground">उमेर</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-2.5 text-center">
            <p className={cn(
              "text-xl font-black tabular-nums",
              color === "primary" ? "text-primary" : "text-compare-secondary"
            )}>{candidate.total_elections_contested}</p>
            <p className="text-[10px] font-medium text-muted-foreground">चुनाव</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-2.5 text-center">
            <p className={cn(
              "text-xl font-black tabular-nums",
              color === "primary" ? "text-primary" : "text-compare-secondary"
            )}>{wins}</p>
            <p className="text-[10px] font-medium text-muted-foreground">विजय</p>
          </div>
        </div>

        {/* Location */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
            <MapPin className="h-3 w-3" />
            {candidate.state_name}
          </span>
          <span className="rounded-lg bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
            {candidate.district_name}
          </span>
          <span className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium",
            color === "primary" ? "bg-primary/15 text-primary" : "bg-compare-secondary/15 text-compare-secondary"
          )}>
            क्षेत्र {candidate.constituency_name}
          </span>
        </div>

        {/* Approval rating */}
        {history?.overall_approval_rating != null && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground font-medium">स्वीकृति दर</span>
                <span className={cn(
                  "font-black",
                  color === "primary" ? "text-primary" : "text-compare-secondary"
                )}>{history.overall_approval_rating}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary/50">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    color === "primary" ? "bg-primary" : "bg-compare-secondary"
                  )}
                  style={{ width: `${history.overall_approval_rating}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Current position */}
        {history?.candidates_current_position_in_party && (
          <div className="mt-3 rounded-lg bg-muted/40 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">वर्तमान पद</p>
            <p className="text-xs font-semibold text-foreground mt-0.5">{history.candidates_current_position_in_party}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ===== Metric Card ===== */
function MetricCard({
  title, v1, v2, suffix = "", type = "higher-is-better",
}: {
  title: string
  v1: number
  v2: number
  suffix?: string
  type?: "higher-is-better" | "lower-is-better" | "neutral"
}) {
  const isV1Better = type === "neutral" ? false : type === "higher-is-better" ? v1 > v2 : v1 < v2
  const isV2Better = type === "neutral" ? false : type === "higher-is-better" ? v2 > v1 : v2 < v1

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-5 text-sm font-black uppercase tracking-widest text-muted-foreground/80">
        {title}
      </h3>
      <div className="flex items-center justify-between gap-4">
        <div className={cn(
          "flex flex-1 flex-col items-center justify-center rounded-2xl p-4 transition-all duration-500",
          isV1Better ? "bg-primary/10 ring-2 ring-primary/20 scale-105" : "bg-secondary/30"
        )}>
          <span className={cn(
            "text-3xl font-black tabular-nums",
            isV1Better ? "text-primary" : "text-foreground"
          )}>{v1}{suffix}</span>
          {isV1Better && <TrendingUp className="mt-1 h-5 w-5 text-primary" />}
        </div>
        <div className="text-xs font-black text-muted-foreground/20 italic">VS</div>
        <div className={cn(
          "flex flex-1 flex-col items-center justify-center rounded-2xl p-4 transition-all duration-500",
          isV2Better ? "bg-compare-secondary/10 ring-2 ring-compare-secondary/20 scale-105" : "bg-secondary/30"
        )}>
          <span className={cn(
            "text-3xl font-black tabular-nums",
            isV2Better ? "text-compare-secondary" : "text-foreground"
          )}>{v2}{suffix}</span>
          {isV2Better && <TrendingUp className="mt-1 h-5 w-5 text-compare-secondary" />}
        </div>
      </div>
    </div>
  )
}

/* ===== Election Comparison ===== */
function ElectionComparison({ c1, c2 }: { c1: Candidate; c2: Candidate }) {
  const elections = [
    { year: "२०७९", label: "2079" },
    { year: "२०७४", label: "2074" },
  ]

  return (
    <div className="space-y-6">
      {elections.map(({ year, label }) => {
        const e1 = getElectionData(c1, label)
        const e2 = getElectionData(c2, label)
        if (!e1.votes && !e2.votes) return null

        return (
          <div key={label} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-black text-foreground border-b border-border/50 pb-3">
              {year} निर्वाचन
            </h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <ElectionCard data={e1} candidate={c1} color="primary" />
              <ElectionCard data={e2} candidate={c2} color="compare-secondary" />
            </div>

            {/* Vote comparison bar */}
            {e1.votes && e2.votes && (
              <div className="mt-6 space-y-3 pt-4 border-t border-border/50">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">प्राप्त मत तुलना</p>
                <VoteComparisonBar v1={e1.votes} v2={e2.votes} name1={c1.candidate_name} name2={c2.candidate_name} />
              </div>
            )}
          </div>
        )
      })}

      {/* Current 2082 election */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-black text-foreground border-b border-border/50 pb-3">
          २०८२ निर्वाचन (वर्तमान)
        </h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Vote className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">उम्मेदवार</span>
            </div>
            <p className="text-sm text-foreground">{c1.district_name} - क्षेत्र {c1.constituency_name}</p>
            <p className="text-xs text-muted-foreground mt-1">{c1.political_party_name}</p>
          </div>
          <div className="rounded-2xl border-2 border-compare-secondary/20 bg-compare-secondary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Vote className="h-4 w-4 text-compare-secondary" />
              <span className="text-sm font-bold text-compare-secondary">उम्मेदवार</span>
            </div>
            <p className="text-sm text-foreground">{c2.district_name} - क्षेत्र {c2.constituency_name}</p>
            <p className="text-xs text-muted-foreground mt-1">{c2.political_party_name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ElectionDataSummary {
  votes: number | null
  result: "Winner" | "Loser" | null
  party: string | null
  district: string | null
  constituency: string | null
}

function getElectionData(c: Candidate, year: string): ElectionDataSummary {
  if (year === "2079") {
    return {
      votes: c.prev_election_votes,
      result: c.prev_election_result,
      party: c.prev_election_party,
      district: c.prev_election_district,
      constituency: c.prev_election_constituency_id,
    }
  }
  return {
    votes: c.prev_2074_election_votes,
    result: c.prev_2074_election_result,
    party: c.prev_2074_election_party,
    district: c.prev_2074_election_district,
    constituency: c.prev_2074_election_constituency_id,
  }
}

function ElectionCard({
  data, candidate, color,
}: {
  data: ElectionDataSummary
  candidate: Candidate
  color: "primary" | "compare-secondary"
}) {
  if (!data.votes) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {candidate.candidate_name} - भाग लिएनन्
        </p>
      </div>
    )
  }

  const isWinner = data.result === "Winner"

  return (
    <div className={cn(
      "rounded-2xl border-2 p-4",
      isWinner ? "border-winner/30 bg-winner/5" : "border-loser/30 bg-loser/5"
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
          isWinner ? "bg-winner/15 text-winner" : "bg-loser/15 text-loser"
        )}>
          {isWinner ? <Trophy className="h-3.5 w-3.5" /> : null}
          {isWinner ? "निर्वाचित" : "पराजित"}
        </span>
        <span className={cn(
          "text-xs font-medium",
          color === "primary" ? "text-primary" : "text-compare-secondary"
        )}>{candidate.candidate_name}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">प्राप्त मत</span>
          <span className="font-bold text-foreground tabular-nums">{data.votes?.toLocaleString()}</span>
        </div>
        {data.district && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">क्षेत्र</span>
            <span className="text-foreground">{data.district} {data.constituency}</span>
          </div>
        )}
        {data.party && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">पार्टी</span>
            <span className="text-foreground truncate ml-2">{data.party}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function VoteComparisonBar({
  v1, v2, name1, name2,
}: {
  v1: number
  v2: number
  name1: string
  name2: string
}) {
  const total = v1 + v2
  const p1 = (v1 / total) * 100
  const p2 = (v2 / total) * 100

  return (
    <div className="space-y-2">
      <div className="flex h-8 w-full overflow-hidden rounded-full">
        <div
          className="flex items-center justify-end bg-primary px-3 transition-all duration-1000"
          style={{ width: `${p1}%` }}
        >
          <span className="text-xs font-bold text-primary-foreground tabular-nums">{v1.toLocaleString()}</span>
        </div>
        <div
          className="flex items-center justify-start bg-compare-secondary px-3 transition-all duration-1000"
          style={{ width: `${p2}%` }}
        >
          <span className="text-xs font-bold text-primary-foreground tabular-nums">{v2.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{name1} ({p1.toFixed(1)}%)</span>
        <span>{name2} ({p2.toFixed(1)}%)</span>
      </div>
    </div>
  )
}

/* ===== Tags Comparison ===== */
function TagsComparison({ c1, c2 }: { c1: Candidate; c2: Candidate }) {
  const allTags = useMemo(() => {
    const tagSet = new Set([...c1.tags, ...c2.tags])
    return Array.from(tagSet)
  }, [c1.tags, c2.tags])

  const sharedTags = c1.tags.filter((t) => c2.tags.includes(t))
  const only1 = c1.tags.filter((t) => !c2.tags.includes(t))
  const only2 = c2.tags.filter((t) => !c1.tags.includes(t))

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      {/* Shared badges */}
      {sharedTags.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            साझा विशेषता ({sharedTags.length})
          </h4>
          <BadgeDisplay tags={sharedTags} size="md" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Only candidate 1 */}
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            {c1.candidate_name} मात्र ({only1.length})
          </h4>
          {only1.length > 0 ? (
            <BadgeDisplay tags={only1} size="md" candidate={c1} />
          ) : (
            <p className="text-sm text-muted-foreground">कुनै अनन्य विशेषता छैन</p>
          )}
        </div>

        {/* Only candidate 2 */}
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-compare-secondary flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-compare-secondary" />
            {c2.candidate_name} मात्र ({only2.length})
          </h4>
          {only2.length > 0 ? (
            <BadgeDisplay tags={only2} size="md" candidate={c2} />
          ) : (
            <p className="text-sm text-muted-foreground">कुनै अनन्य विशेषता छैन</p>
          )}
        </div>
      </div>

      {/* Full tag comparison table */}
      {allTags.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border/50">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            विस्तृत तुलना
          </h4>
          <div className="space-y-2">
            {allTags.map((tag) => {
              const def = badgeDefinitions[tag]
              const has1 = c1.tags.includes(tag)
              const has2 = c2.tags.includes(tag)
              return (
                <div key={tag} className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-2.5">
                  <span className="text-sm font-medium text-foreground">
                    {def?.nameNepali || tag}
                  </span>
                  <div className="flex items-center gap-6">
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      has1 ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                    )}>
                      {has1 ? "O" : "X"}
                    </span>
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      has2 ? "bg-compare-secondary/15 text-compare-secondary" : "bg-secondary text-muted-foreground"
                    )}>
                      {has2 ? "O" : "X"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ===== Personal Details Comparison ===== */
function PersonalDetailsComparison({ c1, c2 }: { c1: Candidate; c2: Candidate }) {
  const rows = [
    { label: "शैक्षिक योग्यता", v1: c1.qualification_level || "N/A", v2: c2.qualification_level || "N/A", icon: GraduationCap },
    { label: "योग्यता विवरण", v1: c1.qualification || "N/A", v2: c2.qualification || "N/A", icon: GraduationCap },
    { label: "उमेर समूह", v1: c1.age_group, v2: c2.age_group, icon: Calendar },
    { label: "लिंग", v1: c1.gender, v2: c2.gender, icon: User },
    { label: "स्थायी ठेगाना", v1: c1.address || "N/A", v2: c2.address || "N/A", icon: MapPin },
    { label: "नागरिकता जिल्ला", v1: c1.citizenship_district, v2: c2.citizenship_district, icon: MapPin },
    { label: "बसोबास जिल्ला", v1: c1.basobas_jilla || "N/A", v2: c2.basobas_jilla || "N/A", icon: MapPin },
    { label: "अनुभव", v1: c1.experience || "खुलासा नगरिएको", v2: c2.experience || "खुलासा नगरिएको", icon: Briefcase },
    { label: "संस्था", v1: c1.institution_name || "N/A", v2: c2.institution_name || "N/A", icon: Building2 },
  ]

  return (
    <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border bg-muted/30 px-4 py-3">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">विवरण</div>
        <div className="text-xs font-bold uppercase tracking-wider text-primary text-center">उम्मेदवार क</div>
        <div className="text-xs font-bold uppercase tracking-wider text-compare-secondary text-center">उम्मेदवार ख</div>
      </div>
      {/* Data rows */}
      {rows.map((row, i) => {
        const Icon = row.icon
        const isSame = row.v1 === row.v2
        return (
          <div key={row.label} className={cn(
            "grid grid-cols-[1fr_1fr_1fr] px-4 py-3 items-center",
            i < rows.length - 1 && "border-b border-border/50",
            isSame && "bg-muted/10"
          )}>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{row.label}</span>
            </div>
            <div className="text-sm text-foreground text-center">{row.v1}</div>
            <div className="text-sm text-foreground text-center">{row.v2}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ===== Political History Comparison ===== */
function PoliticalHistoryComparison({
  c1, c2, h1, h2,
}: {
  c1: Candidate
  c2: Candidate
  h1: CandidatePoliticalHistory | null
  h2: CandidatePoliticalHistory | null
}) {
  const events1 = h1?.political_history || []
  const events2 = h2?.political_history || []

  if (events1.length === 0 && events2.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <p className="text-muted-foreground">राजनीतिक इतिहास उपलब्ध छैन</p>
      </div>
    )
  }

  const getEventColor = (category: string) => {
    switch (category) {
      case "GOOD": return "border-winner/50 bg-winner/5"
      case "BAD": return "border-loser/50 bg-loser/5"
      default: return "border-border bg-muted/20"
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "ELECTION_WIN": return "निर्वाचन विजय"
      case "ELECTION_LOSS": return "निर्वाचन पराजय"
      case "MINISTERIAL_APPT": return "मन्त्री नियुक्ति"
      case "PARTY_SWITCH": return "पार्टी परिवर्तन"
      case "RESIGNATION": return "राजीनामा"
      case "MAJOR_ACHIEVEMENT": return "उपलब्धि"
      default: return "अन्य"
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Candidate 1 History */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-4">
          <span className="h-3 w-3 rounded-full bg-primary" />
          {c1.candidate_name} ({events1.length} घटना)
        </h4>
        {events1.length > 0 ? (
          <div className="relative space-y-3 pl-6">
            <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-primary/20" />
            {events1.map((event, idx) => (
              <div key={idx} className={cn("relative rounded-xl border p-3", getEventColor(event.event_category))}>
                <div className="absolute -left-[17px] top-4 h-3 w-3 rounded-full border-2 border-primary bg-card" />
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {getEventTypeLabel(event.event_type)}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {event.date}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">{event.event}</p>
                {event.details && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{event.details}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">राजनीतिक इतिहास उपलब्ध छैन</p>
        )}
      </div>

      {/* Candidate 2 History */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-compare-secondary flex items-center gap-2 mb-4">
          <span className="h-3 w-3 rounded-full bg-compare-secondary" />
          {c2.candidate_name} ({events2.length} घटना)
        </h4>
        {events2.length > 0 ? (
          <div className="relative space-y-3 pl-6">
            <div className="absolute bottom-0 left-2 top-0 w-0.5 bg-compare-secondary/20" />
            {events2.map((event, idx) => (
              <div key={idx} className={cn("relative rounded-xl border p-3", getEventColor(event.event_category))}>
                <div className="absolute -left-[17px] top-4 h-3 w-3 rounded-full border-2 border-compare-secondary bg-card" />
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {getEventTypeLabel(event.event_type)}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {event.date}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">{event.event}</p>
                {event.details && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{event.details}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">राजनीतिक इतिहास उपलब्ध छैन</p>
        )}
      </div>
    </div>
  )
}

/* ===== Analysis Comparison ===== */
function AnalysisComparison({
  h1, h2, c1, c2,
}: {
  h1: CandidatePoliticalHistory | null
  h2: CandidatePoliticalHistory | null
  c1: Candidate
  c2: Candidate
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-2">
        {h1?.analysis && (
          <div className="rounded-3xl border-2 border-primary/20 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-primary">{c1.candidate_name}</h4>
              {h1.overall_approval_rating && (
                <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {h1.overall_approval_rating}%
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{h1.analysis}</p>
          </div>
        )}
        {h2?.analysis && (
          <div className="rounded-3xl border-2 border-compare-secondary/20 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-compare-secondary" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-compare-secondary">{c2.candidate_name}</h4>
              {h2.overall_approval_rating && (
                <span className="ml-auto rounded-full bg-compare-secondary/10 px-2.5 py-0.5 text-xs font-bold text-compare-secondary">
                  {h2.overall_approval_rating}%
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{h2.analysis}</p>
          </div>
        )}
      </div>
      <div className="flex items-start gap-2 rounded-xl bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200/50 dark:border-yellow-800/30 p-3">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-800/90 dark:text-yellow-200/80 leading-relaxed">
          <strong>सूचना:</strong> यो विश्लेषण AI द्वारा सङ्कलित गरिएको हो र त्रुटिपूर्ण हुन सक्छ। कृपया सावधानीपूर्वक प्रयोग गर्नुहोस्।
        </p>
      </div>
    </div>
  )
}

/* ===== Main Export ===== */
export default function CandidateComparisonPage() {
  return (
    <Suspense fallback={
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 mx-auto rounded bg-muted" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="h-14 rounded-2xl bg-muted" />
            <div className="h-14 rounded-2xl bg-muted" />
          </div>
        </div>
      </main>
    }>
      <CandidateComparisonPageContent />
    </Suspense>
  )
}
