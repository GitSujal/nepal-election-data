"use client"

import { type PRCandidate } from "@/lib/candidates-data"
import { PRElectionTimeline } from "./pr-election-timeline"
import {
  ListOrdered,
  MapPin,
  Users,
  Building,
  History,
  Award,
  TrendingUp,
  TrendingDown,
} from "lucide-react"

interface PRCandidateDetailsProps {
  candidate: PRCandidate
}

export function PRCandidateDetails({ candidate }: PRCandidateDetailsProps) {
  // Calculate parliament membership count
  const parliamentMemberships = [
    candidate.was_parliament_member_2074,
    candidate.was_parliament_member_2079,
  ].filter(Boolean).length

  const details = [
    {
      icon: ListOrdered,
      label: "सूची वरीयता",
      value: `#${candidate.rank_position}`,
      subValue: candidate.is_top_rank ? "शीर्ष ५ मा" : candidate.is_high_rank ? "शीर्ष १० मा" : candidate.is_low_rank ? "५०+ वरीयता" : undefined,
    },
    {
      icon: Users,
      label: "समावेशी समूह",
      value: candidate.inclusive_group || "खुलासा नगरिएको",
    },
    {
      icon: MapPin,
      label: "नागरिकता जिल्ला",
      value: candidate.citizenship_district,
    },
    {
      icon: Building,
      label: "राजनीतिक दल",
      value: candidate.political_party_name,
      subValue: candidate.matched_party_name && candidate.matched_party_name !== candidate.political_party_name
        ? `मिलान: ${candidate.matched_party_name}`
        : undefined,
    },
  ]

  // Party performance comparison
  const hasPartyPerformanceData = candidate.prev_2079_party_votes || candidate.prev_2074_party_votes

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Basic Details Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold uppercase tracking-wider text-muted-foreground">
          उम्मेदवार विवरण
        </h2>

        <div className="space-y-5">
          {details.map((detail, index) => (
            <div key={index} className="group">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-primary/20">
                  <detail.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{detail.label}</p>
                  <p className="mt-0.5 font-medium text-foreground whitespace-pre-line">
                    {detail.value}
                  </p>
                  {detail.subValue && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{detail.subValue}</p>
                  )}
                </div>
              </div>
              {index < details.length - 1 && (
                <div className="ml-14 mt-4 border-b border-border/50" />
              )}
            </div>
          ))}
        </div>

        {/* Stats summary */}
        <div className="mt-8 grid grid-cols-3 gap-4 rounded-xl bg-secondary/50 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{candidate.rank_position}</p>
            <p className="text-xs text-muted-foreground">सूची वरीयता</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-winner">{parliamentMemberships}</p>
            <p className="text-xs text-muted-foreground">संसद सदस्यता</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">{candidate.tags?.length || 0}</p>
            <p className="text-xs text-muted-foreground">विशेषताहरू</p>
          </div>
        </div>

        {/* Party History if available */}
        {candidate.party_previous_names && candidate.party_previous_names.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">पार्टीका अन्य नामहरू</p>
            <div className="flex flex-wrap gap-2">
              {candidate.party_previous_names.slice(0, 3).map((name, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                >
                  {name}
                </span>
              ))}
              {candidate.party_previous_names.length > 3 && (
                <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                  +{candidate.party_previous_names.length - 3} थप
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Parliament History & Party Performance Card */}
      <div className="space-y-6">
        {/* Parliament History */}
        {(candidate.was_parliament_member_2074 || candidate.was_parliament_member_2079) && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold uppercase tracking-wider text-muted-foreground">
              <History className="h-5 w-5" />
              संसदीय इतिहास
            </h2>

            <div className="space-y-4">
              {candidate.was_parliament_member_2079 && (
                <div className="rounded-xl border border-winner/30 bg-winner/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-winner" />
                      <span className="font-semibold text-winner">२०७९ संसद सदस्य</span>
                    </div>
                    <span className="rounded-full bg-winner/20 px-2 py-0.5 text-xs font-medium text-winner">
                      {candidate.parliament_member_2079_election_type}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {candidate.parliament_member_2079_party && (
                      <p>पार्टी: {candidate.parliament_member_2079_party}</p>
                    )}
                    {candidate.parliament_member_2079_district && (
                      <p>जिल्ला: {candidate.parliament_member_2079_district}</p>
                    )}
                    {candidate.parliament_member_2079_constituency && (
                      <p>निर्वाचन क्षेत्र: {candidate.parliament_member_2079_constituency}</p>
                    )}
                  </div>
                </div>
              )}

              {candidate.was_parliament_member_2074 && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-primary">२०७४ संसद सदस्य</span>
                    </div>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                      {candidate.parliament_member_2074_election_type}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {candidate.parliament_member_2074_party && (
                      <p>पार्टी: {candidate.parliament_member_2074_party}</p>
                    )}
                    {candidate.parliament_member_2074_district && (
                      <p>जिल्ला: {candidate.parliament_member_2074_district}</p>
                    )}
                    {candidate.parliament_member_2074_constituency && (
                      <p>निर्वाचन क्षेत्र: {candidate.parliament_member_2074_constituency}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Election Timeline with history */}
        <PRElectionTimeline candidate={candidate} />

        {/* Party Performance */}
        {hasPartyPerformanceData && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold uppercase tracking-wider text-muted-foreground">
              {candidate.is_from_improving_party ? (
                <TrendingUp className="h-5 w-5 text-winner" />
              ) : candidate.is_from_declining_party ? (
                <TrendingDown className="h-5 w-5 text-destructive" />
              ) : (
                <Building className="h-5 w-5" />
              )}
              पार्टी कार्यसम्पादन
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {candidate.prev_2079_party_votes && (
                <div className="rounded-xl bg-secondary/50 p-4">
                  <p className="text-sm text-muted-foreground">२०७९ पार्टी मत</p>
                  <p className="text-xl font-bold text-foreground">
                    {candidate.prev_2079_party_votes.toLocaleString()}
                  </p>
                  {candidate.prev_2079_districts_contested && (
                    <p className="text-xs text-muted-foreground">
                      {candidate.prev_2079_districts_contested} जिल्लामा प्रतिस्पर्धा
                    </p>
                  )}
                </div>
              )}

              {candidate.prev_2074_party_votes && (
                <div className="rounded-xl bg-secondary/50 p-4">
                  <p className="text-sm text-muted-foreground">२०७४ पार्टी मत</p>
                  <p className="text-xl font-bold text-foreground">
                    {candidate.prev_2074_party_votes.toLocaleString()}
                  </p>
                  {candidate.prev_2074_party_rank && (
                    <p className="text-xs text-muted-foreground">
                      वरीयता: #{candidate.prev_2074_party_rank}
                    </p>
                  )}
                </div>
              )}
            </div>

            {candidate.is_from_improving_party && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-winner/10 px-3 py-2 text-sm text-winner">
                <TrendingUp className="h-4 w-4" />
                <span>पार्टीको मत २०७४ देखि २०७९ सम्म बढेको छ</span>
              </div>
            )}

            {candidate.is_from_declining_party && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <TrendingDown className="h-4 w-4" />
                <span>पार्टीको मत २०७४ देखि २०७९ सम्म घटेको छ</span>
              </div>
            )}
          </div>
        )}

        {/* Additional Info Card */}
        {(candidate.is_varaute || candidate.is_gati_chhada || candidate.is_fptp_veteran) && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold uppercase tracking-wider text-muted-foreground">
              थप जानकारी
            </h2>

            <div className="space-y-3">
              {candidate.is_varaute && (
                <div className="flex items-center gap-3 rounded-lg bg-warning/10 px-4 py-3">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <p className="font-medium text-warning">पानी मरुवा</p>
                    <p className="text-xs text-muted-foreground">प्रत्यक्षमा हारेर समानुपातिकमा आएका</p>
                  </div>
                </div>
              )}

              {candidate.is_gati_chhada && (
                <div className="flex items-center gap-3 rounded-lg bg-gold/10 px-4 py-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-medium text-gold">गति छाडा</p>
                    <p className="text-xs text-muted-foreground">धेरै पटक सांसद वा समानुपातिकबाट निर्वाचित</p>
                  </div>
                </div>
              )}

              {candidate.is_fptp_veteran && (
                <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-medium text-primary">प्रत्यक्ष अनुभवी</p>
                    <p className="text-xs text-muted-foreground">प्रत्यक्षबाट पहिले संसद पदकाएका</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
