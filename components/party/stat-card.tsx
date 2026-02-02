"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function StatCard({ title, icon, children, className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      <div className="mb-4 flex items-center gap-3">
        {icon && <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>}
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}

interface StatItemProps {
  label: ReactNode
  count: number
  total?: number
  maxCount?: number
  colorClass?: string
  className?: string
}

export function StatItem({ label, count, total, maxCount, colorClass = "bg-primary", className }: StatItemProps) {
  const percentage = total 
    ? (total > 0 ? (count / total) * 100 : 0)
    : (maxCount && maxCount > 0 ? (count / maxCount) * 100 : 0)
  
  const displayPercentage = total ? `(${((count / total) * 100).toFixed(1)}%)` : ""

  return (
    <div className={cn("group flex flex-col gap-2", className)}>
      <div className="flex items-center gap-4">
        <div className="min-w-[120px] shrink-0">
          {typeof label === 'string' ? (
            <span className="text-sm font-semibold text-foreground">{label || "अन्य"}</span>
          ) : (
            label
          )}
        </div>
        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div 
            className={cn("h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80", colorClass)}
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>
        <div className="min-w-[45px] text-right">
          <span className="text-sm font-bold text-foreground">{count}</span>
          {displayPercentage && (
            <span className="ml-1 text-[10px] text-muted-foreground">{displayPercentage}</span>
          )}
        </div>
      </div>
    </div>
  )
}
