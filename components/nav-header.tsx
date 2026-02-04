"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { User, MapPin, Building2, Scale } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

export function NavHeader() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      label: "उम्मेदवार प्रोफाइल",
      icon: User,
    },
    {
      href: "/constituency",
      label: "निर्वाचन क्षेत्र",
      icon: MapPin,
    },
    {
      href: "/party",
      label: "पार्टी प्रोफाइल",
      icon: Building2,
    },
    {
      href: "/party-comparison",
      label: "पार्टी तुलना",
      icon: Scale,
    },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - hide text on mobile */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/favicon.svg" alt="मतदाता जानकारी" width={40} height={40} className="rounded-lg" />
          <span className="hidden sm:inline text-lg font-bold text-foreground">
            मतदाता जानकारी
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-6 w-6 sm:h-4 sm:w-4" />
                {isActive ? (
                  <span className="text-xs sm:text-sm">{item.label}</span>
                ) : (
                  <span className="hidden sm:inline">{item.label}</span>
                )}
              </Link>
            )
          })}

          {/* Theme Toggle */}
          <div className="ml-2 border-l border-border pl-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
