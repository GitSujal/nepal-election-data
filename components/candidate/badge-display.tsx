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
  Crown,
  HeartHandshake,
  Trophy,
  ArrowDown,
  User,
  Users,
  Accessibility,
  MapPin,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Zap,
  Building2,
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
  crown: Crown,
  "heart-handshake": HeartHandshake,
  // PR-specific icons
  trophy: Trophy,
  "arrow-down": ArrowDown,
  user: User,
  users: Users,
  accessibility: Accessibility,
  "map-pin": MapPin,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  "rotate-ccw": RotateCcw,
  zap: Zap,
  chair: Building2,
  "building2": Building2,
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
  candidate?: { minister_appointment_count?: number }
}

export function BadgeDisplay({ tags, size = "md", candidate }: BadgeDisplayProps) {
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
        const showCount = badge.id === "purba-mantri" && candidate?.minister_appointment_count
        return (
          <div
            key={badge.id}
            className={cn(
              "flex items-center rounded-full border font-medium transition-all hover:scale-105 relative",
              colorClasses[badge.color],
              sizeClasses[size]
            )}
            title={badge.description_np || badge.description}
          >
            <Icon size={iconSizes[size]} />
            <div className="flex flex-col leading-tight">
              <span>{badge.nameNepali || badge.name}</span>
              {badge.nameNepali && (
                <span className="text-[10px] opacity-70">{badge.name}</span>
              )}
            </div>
            {showCount && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {candidate.minister_appointment_count}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function BadgeShowcase({ tags, candidate }: { tags: string[], candidate?: { minister_appointment_count?: number } }) {
  const [flippedIndex, setFlippedIndex] = React.useState<number | null>(null)
  const badges = tags.map((tag) => badgeDefinitions[tag]).filter(Boolean)

  if (badges.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-center">
        <p className="text-muted-foreground">अहिलेसम्म कुनै विशेषता प्राप्त भएको छैन</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {badges.map((badge, index) => {
        const Icon = iconMap[badge.icon] || Star
        const isFlipped = flippedIndex === index
        const showCount = badge.id === "purba-mantri" && candidate?.minister_appointment_count

        return (
          <div
            key={badge.id}
            className="group h-44 [perspective:1000px]"
            onMouseEnter={() => setFlippedIndex(index)}
            onMouseLeave={() => setFlippedIndex(null)}
            onClick={() => setFlippedIndex(isFlipped ? null : index)}
          >
            <div
              className={cn(
                "relative h-full w-full transition-all duration-500 [transform-style:preserve-3d]",
                isFlipped ? "[transform:rotateY(180deg)]" : ""
              )}
            >
              {/* Front Side */}
              <div
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center [backface-visibility:hidden]",
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
                  {showCount && (
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
                      {candidate.minister_appointment_count}
                    </span>
                  )}
                </div>
                <span className="relative z-10 text-sm font-bold">
                  {badge.nameNepali || badge.name}
                </span>
                {showCount && (
                  <span className="relative z-10 text-xs font-semibold opacity-90">
                    {candidate.minister_appointment_count}× मन्त्री
                  </span>
                )}
                <span className="relative z-10 text-xs opacity-80">{badge.name}</span>
              </div>

              {/* Back Side (Description) */}
              <div
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center rounded-xl border p-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]",
                  colorClasses[badge.color]
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-b opacity-20",
                    bgColorClasses[badge.color]
                  )}
                />
                <p className="relative z-10 text-xs leading-relaxed font-medium">
                  {badge.description_np || badge.description}
                </p>
                {badge.description_np && (
                  <p className="relative z-10 mt-2 text-[10px] italic opacity-60">
                    {badge.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
