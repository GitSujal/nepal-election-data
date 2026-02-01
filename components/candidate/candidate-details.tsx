"use client"

import { type Candidate } from "@/lib/candidates-data"
import {
  GraduationCap,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  Building,
  Heart,
} from "lucide-react"

interface CandidateDetailsProps {
  candidate: Candidate
}

export function CandidateDetails({ candidate }: CandidateDetailsProps) {
  // Calculate wins
  const wins = [
    candidate.prev_election_result === "Winner",
    candidate.prev_2074_election_result === "Winner",
  ].filter(Boolean).length

  const details = [
    {
      icon: GraduationCap,
      label: "Education Level",
      value: candidate.qualification_level || "N/A",
      subValue: candidate.qualification,
    },
    {
      icon: Building,
      label: "Institution",
      value: candidate.institution_name || "N/A",
    },
    {
      icon: Briefcase,
      label: "Experience",
      value: candidate.experience || "Not specified",
    },
    {
      icon: MapPin,
      label: "Permanent Address",
      value: candidate.address,
    },
    {
      icon: Calendar,
      label: "Age",
      value: `${candidate.age} years`,
      subValue: `Age Group: ${candidate.age_group}`,
    },
    {
      icon: Users,
      label: "Father's Name",
      value: candidate.father_name,
    },
    {
      icon: Heart,
      label: "Spouse Name",
      value: candidate.spouse_name || "N/A",
    },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-6 text-lg font-semibold uppercase tracking-wider text-muted-foreground">
        Candidate Profile
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
          <p className="text-2xl font-bold text-primary">{candidate.elections_contested}</p>
          <p className="text-xs text-muted-foreground">Elections</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-winner">{wins}</p>
          <p className="text-xs text-muted-foreground">Wins</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-accent">{candidate.tags.length}</p>
          <p className="text-xs text-muted-foreground">Badges</p>
        </div>
      </div>

      {/* Party History if available */}
      {candidate.party_previous_names && candidate.party_previous_names.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Party Aliases</p>
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
                +{candidate.party_previous_names.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
