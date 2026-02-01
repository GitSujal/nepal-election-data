"use client"

import { type Constituency } from "@/lib/constituency-data"
import { MapPin, Building2, Flag, Trophy, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConstituencyHeaderProps {
  constituency: Constituency
}

export function ConstituencyHeader({ constituency }: ConstituencyHeaderProps) {
  const sameWinner = constituency.winning_party_2079 === constituency.winning_party_2074

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative p-6 md:p-8">
        {/* Top Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Main Info */}
          <div className="flex-1">
            {/* Constituency Name */}
            <div className="mb-4">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {constituency.constituency_name}
              </h1>
              <p className="mt-1 text-lg text-muted-foreground">
                निर्वाचन क्षेत्र
              </p>
            </div>

            {/* Location Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                {constituency.state_name}
              </span>
              <span className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                {constituency.district_name}
              </span>
            </div>
          </div>

          {/* Gadh Badge (Stronghold) */}
          {constituency.is_gadh && constituency.gadh_party_name && (
            <div className="flex flex-col items-center rounded-xl border border-gold/30 bg-gold/10 p-4">
              <Shield className="mb-2 h-8 w-8 text-gold" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                गढ
              </span>
              <span className="mt-1 max-w-[150px] text-center text-sm font-medium text-foreground">
                {constituency.gadh_party_name}
              </span>
            </div>
          )}
        </div>

        {/* Winner Comparison */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* 2079 Winner */}
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                २०७९ विजेता
              </span>
            </div>
            <p className="font-medium text-foreground">
              {constituency.winning_party_2079}
            </p>
          </div>

          {/* 2074 Winner */}
          <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Flag className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold text-accent">
                २०७४ विजेता
              </span>
            </div>
            <p className="font-medium text-foreground">
              {constituency.winning_party_2074}
            </p>
          </div>
        </div>

        {/* Consistency Indicator */}
        {sameWinner && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-success/10 py-2 text-sm font-medium text-success">
            <Shield className="h-4 w-4" />
            यो क्षेत्रमा दुई निर्वाचनमा एउटै पार्टी विजयी
          </div>
        )}
      </div>
    </div>
  )
}
