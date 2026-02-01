"use client"

import React from "react"
import { badgeDefinitions, type Badge } from "@/lib/candidates-data"
import {
  Shield,
  Star,
  GraduationCap,
  Plane,
  Repeat,
  Footprints,
  Baby,
  Fingerprint,
  PartyPopper,
  Sparkles,
  UserRound,
  Banknote,
  Scissors,
  Medal,
} from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  star: Star,
  "graduation-cap": GraduationCap,
  plane: Plane,
  repeat: Repeat,
  footprints: Footprints,
  baby: Baby,
  fingerprint: Fingerprint,
  "party-popper": PartyPopper,
  sparkles: Sparkles,
  "user-round": UserRound,
  banknote: Banknote,
  scissors: Scissors,
  medal: Medal,
}

const colorClasses: Record<Badge["color"], string> = {
  gold: "bg-gold/20 text-gold border-gold/40",
  silver: "bg-silver/20 text-silver border-silver/40",
  bronze: "bg-bronze/20 text-bronze border-bronze/40",
  primary: "bg-primary/20 text-primary border-primary/40",
  accent: "bg-accent/20 text-accent border-accent/40",
  warning: "bg-warning/20 text-warning border-warning/40",
  destructive: "bg-destructive/20 text-destructive border-destructive/40",
}

const bgColorClasses: Record<Badge["color"], string> = {
  gold: "from-gold/30 to-gold/5",
  silver: "from-silver/30 to-silver/5",
  bronze: "from-bronze/30 to-bronze/5",
  primary: "from-primary/30 to-primary/5",
  accent: "from-accent/30 to-accent/5",
  warning: "from-warning/30 to-warning/5",
  destructive: "from-destructive/30 to-destructive/5",
}

interface BadgeDisplayProps {
  tags: string[]
  size?: "sm" | "md" | "lg"
}

export function BadgeDisplay({ tags, size = "md" }: BadgeDisplayProps) {
  const badges = tags.map((tag) => badgeDefinitions[tag]).filter(Boolean)

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-base gap-2",
  }

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const Icon = iconMap[badge.icon] || Star
        return (
          <div
            key={badge.id}
            className={cn(
              "flex items-center rounded-full border font-medium transition-all hover:scale-105",
              colorClasses[badge.color],
              sizeClasses[size]
            )}
            title={badge.description}
          >
            <Icon size={iconSizes[size]} />
            <span>{badge.name}</span>
          </div>
        )
      })}
    </div>
  )
}

export function BadgeShowcase({ tags }: { tags: string[] }) {
  const badges = tags.map((tag) => badgeDefinitions[tag]).filter(Boolean)

  if (badges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-center">
        <p className="text-muted-foreground">No badges earned yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {badges.map((badge) => {
        const Icon = iconMap[badge.icon] || Star
        return (
          <div
            key={badge.id}
            className={cn(
              "group relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border p-4 text-center transition-all hover:scale-[1.02]",
              colorClasses[badge.color]
            )}
          >
            {/* Glow effect */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-b opacity-50",
                bgColorClasses[badge.color]
              )}
            />

            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-background/80 shadow-lg">
              <Icon size={28} className="transition-transform group-hover:scale-110" />
            </div>
            <span className="relative z-10 font-bold text-sm">{badge.name}</span>
            <span className="relative z-10 text-xs opacity-80">{badge.nameNepali}</span>
          </div>
        )
      })}
    </div>
  )
}
