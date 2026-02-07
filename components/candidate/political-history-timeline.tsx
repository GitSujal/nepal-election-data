"use client"

import { cn } from "@/lib/utils"
import { usePoliticalHistory } from "@/hooks/use-political-history"
import type { CandidatePoliticalHistory } from "@/hooks/use-political-history"
import {
  Trophy,
  ThumbsDown,
  Users,
  UserX,
  Calendar,
  ExternalLink,
  Landmark,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"

interface PoliticalHistoryTimelineProps {
  candidateId: number
  candidateName: string
}

interface TimelineEvent {
  date: string // BS date for sorting
  type: "election" | "political"
  title: string
  details: string
  result?: "WIN" | "LOSS" | "GOOD" | "BAD" | "NEUTRAL"
  party?: string
  location?: string
  link?: string
  eventType?: string
  year?: string
}

const eventTypeConfig = {
  ELECTION_WIN: {
    icon: Trophy,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950",
    borderColor: "border-green-300 dark:border-green-700",
  },
  ELECTION_LOSS: {
    icon: ThumbsDown,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    borderColor: "border-red-300 dark:border-red-700",
  },
  MINISTERIAL_APPT: {
    icon: Landmark,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  PARTY_SWITCH: {
    icon: Users,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-950",
    borderColor: "border-purple-300 dark:border-purple-700",
  },
  RESIGNATION: {
    icon: UserX,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    borderColor: "border-orange-300 dark:border-orange-700",
  },
  OTHER: {
    icon: AlertCircle,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-950",
    borderColor: "border-gray-300 dark:border-gray-700",
  },
}

// Convert Devanagari numerals to Arabic numerals
function convertDevanagariToArabic(str: string): string {
  const devanagariMap: { [key: string]: string } = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  }
  return str.replace(/[०-९]/g, (match) => devanagariMap[match] || match)
}

// Convert Arabic numerals to Devanagari numerals
function convertArabicToDevanagari(str: string): string {
  const arabicMap: { [key: string]: string } = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
  }
  return str.replace(/[0-9]/g, (match) => arabicMap[match] || match)
}

// Convert BS date string to sortable format (handle both BS and AD years)
function parseBSDate(dateStr: string): number {
  // Convert Devanagari numerals to Arabic first
  const arabicDate = convertDevanagariToArabic(dateStr)
  // Remove any non-digit characters except hyphens
  const cleaned = arabicDate.replace(/[^0-9-]/g, "")
  const parts = cleaned.split("-")
  
  if (parts.length !== 3) return 0
  
  const year = parseInt(parts[0])
  const month = parseInt(parts[1])
  const day = parseInt(parts[2])
  
  return year * 10000 + month * 100 + day
}

export function PoliticalHistoryTimeline({
  candidateId,
  candidateName,
}: PoliticalHistoryTimelineProps) {
  const { data: historyData, loading, error } = usePoliticalHistory(candidateId)

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error || !historyData) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            {error || "राजनीतिक इतिहास उपलब्ध छैन"}
          </p>
        </div>
      </div>
    )
  }

  // Only include political activities (excluding election results, as they're shown in election history)
  const timelineEvents: TimelineEvent[] = []

  // Add political history - exclude election win/loss events
  historyData.political_history?.forEach((event) => {
    // Skip election results as they're already in election history
    if (event.event_type === "ELECTION_WIN" || event.event_type === "ELECTION_LOSS") {
      return
    }

    let result: "WIN" | "LOSS" | "GOOD" | "BAD" | "NEUTRAL"
    if (event.event_category === "GOOD") result = "GOOD"
    else if (event.event_category === "BAD") result = "BAD"
    else result = "NEUTRAL"

    // Extract year from date (convert Devanagari numerals first)
    const arabicDate = convertDevanagariToArabic(event.date)
    const yearMatch = arabicDate.match(/^(\d{4})/)
    const year = yearMatch ? yearMatch[1] : ""

    timelineEvents.push({
      date: event.date,
      type: "political",
      title: event.event,
      details: event.details,
      result,
      link: event.link_to_source,
      eventType: event.event_type,
      year,
    })
  })

  // Sort by date (newest first)
  timelineEvents.sort((a, b) => parseBSDate(b.date) - parseBSDate(a.date))

  // Group events by year for display
  const eventsByYear: { [year: string]: TimelineEvent[] } = {}
  timelineEvents.forEach((event) => {
    if (event.year) {
      if (!eventsByYear[event.year]) {
        eventsByYear[event.year] = []
      }
      eventsByYear[event.year].push(event)
    }
  })

  // Get sorted years (newest first)
  const years = Object.keys(eventsByYear).sort((a, b) => parseInt(b) - parseInt(a))

  const getEventConfig = (event: TimelineEvent) => {
    const eventType = event.eventType as keyof typeof eventTypeConfig
    return eventTypeConfig[eventType] || eventTypeConfig.OTHER
  }

  const getResultIcon = (result?: string) => {
    switch (result) {
      case "WIN":
      case "GOOD":
        return CheckCircle2
      case "LOSS":
      case "BAD":
        return XCircle
      default:
        return AlertCircle
    }
  }

  const getResultColor = (result?: string) => {
    switch (result) {
      case "WIN":
      case "GOOD":
        return "text-green-600 dark:text-green-400"
      case "LOSS":
      case "BAD":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getResultGradient = (result?: string) => {
    switch (result) {
      case "GOOD":
        return "bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 hover:from-green-100/60 hover:to-green-200/40 dark:hover:from-green-950/30 dark:hover:to-green-900/20"
      case "BAD":
        return "bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 hover:from-red-100/60 hover:to-red-200/40 dark:hover:from-red-950/30 dark:hover:to-red-900/20"
      case "NEUTRAL":
        return "bg-gradient-to-br from-yellow-50/50 to-yellow-100/30 dark:from-yellow-950/20 dark:to-yellow-900/10 hover:from-yellow-100/60 hover:to-yellow-200/40 dark:hover:from-yellow-950/30 dark:hover:to-yellow-900/20"
      default:
        return "bg-card hover:bg-muted/20"
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold uppercase tracking-wider text-muted-foreground">
              राजनीतिक घटनाक्रम
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {timelineEvents.length} घटनाहरू • नयाँ देखि पुरानो क्रममा
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200/50 dark:border-yellow-800/30 p-3">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-800/90 dark:text-yellow-200/80 leading-relaxed">
            <strong>सूचना:</strong> यो विवरण AI द्वारा सङ्कलित गरिएको हो र त्रुटिपूर्ण हुन सक्छ। कृपया सावधानीपूर्वक प्रयोग गर्नुहोस्।
          </p>
        </div>
      </div>

      {/* Timeline with center line and alternating events */}
      <div className="relative">
        {/* Center vertical line - desktop only */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />
        
        {/* Left vertical line - mobile only */}
        <div className="md:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />

        <div className="space-y-12">
          {years.map((year, yearIndex) => {
            const yearEvents = eventsByYear[year]
            // Calculate the starting index for this year's events
            const startIndex = years.slice(0, yearIndex).reduce((sum, y) => sum + eventsByYear[y].length, 0)
            
            return (
              <div key={year} className="space-y-8">
                {yearEvents.map((event, eventIndex) => {
                  const config = getEventConfig(event)
                  const Icon = config.icon
                  const ResultIcon = getResultIcon(event.result)
                  // Alternate sides: even global index on left, odd on right (desktop only)
                  const globalIndex = startIndex + eventIndex
                  const isLeft = globalIndex % 2 === 0

                  return (
                    <div key={eventIndex} className="relative">
                      {/* Year marker on the center line (desktop) or left line (mobile) */}
                      <div className={cn(
                        "absolute top-0 z-20 flex items-center justify-center",
                        "md:left-1/2 md:-translate-x-1/2",
                        "left-8 -translate-x-1/2"
                      )}>
                        <div className={cn(
                          "flex items-center justify-center rounded-full border-4 border-primary bg-card shadow-lg",
                          "h-12 w-12 md:h-16 md:w-16"
                        )}>
                          <span className="text-sm md:text-lg font-bold text-foreground">{convertArabicToDevanagari(year)}</span>
                        </div>
                      </div>

                      {/* Event card - alternating on desktop, always right on mobile */}
                      <div className={cn(
                        "relative flex items-start gap-4",
                        // Mobile: always to the right with padding for year marker
                        "pt-16 pl-20",
                        // Desktop: alternating sides
                        "md:pt-20 md:pl-0",
                        isLeft ? "md:justify-end md:pr-[calc(50%+3rem)]" : "md:justify-start md:pl-[calc(50%+3rem)]"
                      )}>
                        {/* Connecting line from center to card - desktop only */}
                        <div className={cn(
                          "hidden md:block absolute top-8 w-10 h-0.5 bg-primary/30",
                          isLeft ? "right-[calc(50%-0.5rem)]" : "left-[calc(50%-0.5rem)]"
                        )} />
                        
                        {/* Connecting line for mobile */}
                        <div className="md:hidden absolute left-8 top-6 w-8 h-0.5 bg-primary/30" />

                        {/* Icon marker at card end */}
                        <div className={cn(
                          "absolute z-10",
                          // Mobile: always at the left
                          "left-14 top-3.5",
                          // Desktop: alternating
                          "md:top-5",
                          isLeft ? "md:left-auto md:right-[calc(50%+2.25rem)]" : "md:left-[calc(50%+2.25rem)] md:right-auto"
                        )}>
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm",
                              config.bgColor,
                              config.borderColor
                            )}
                          >
                            <Icon className={cn("h-5 w-5", config.color)} />
                          </div>
                        </div>

                        {/* Event card */}
                        <div className="flex-1 md:max-w-md">
                          <div
                            className={cn(
                              "group rounded-lg border p-4 transition-all hover:shadow-md",
                              config.borderColor,
                              getResultGradient(event.result)
                            )}
                          >
                            {/* Header with date and result indicator */}
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground leading-tight">{event.title}</h3>
                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{event.date}</span>
                                  </div>
                                </div>
                              </div>
                              {event.result && (
                                <div className="flex shrink-0">
                                  <ResultIcon className={cn("h-5 w-5", getResultColor(event.result))} />
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <p className="text-sm leading-relaxed text-muted-foreground">{event.details}</p>

                            {/* Footer with party and source */}
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              {event.party && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Users className="h-3.5 w-3.5" />
                                  <span className="line-clamp-1">{event.party}</span>
                                </div>
                              )}
                              {event.link && (
                                <a
                                  href={event.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  स्रोत
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      {timelineEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">घटनाहरू उपलब्ध छैन</p>
        </div>
      )}
    </div>
  )
}
