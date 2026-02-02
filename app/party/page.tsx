"use client"

import { useState } from "react"
import { Building2, Vote } from "lucide-react"
import { PartyFilter, PartyProfileData } from "@/components/party/party-filter"
import { PartyHeader } from "@/components/party/party-header"
import { PartyStats } from "@/components/party/party-stats"
import { PartyHistory } from "@/components/party/party-history"

export default function PartyProfilePage() {
  const [selectedParty, setSelectedParty] = useState<PartyProfileData | null>(null)

  return (
    <main>
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                पार्टी प्रोफाइल
              </h1>
              <p className="text-muted-foreground">
                विभिन्न राजनीतिक दलहरूको विस्तृत विवरण र तथ्याङ्क
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter */}
        <div className="mb-8">
          <PartyFilter onSelect={setSelectedParty} />
        </div>

        {/* Content */}
        {selectedParty ? (
          <div className="space-y-12">
            {/* Header */}
            <PartyHeader party={selectedParty} />

            {/* Stats */}
            <section>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Vote className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">उम्मेदवार तथ्याङ्क (२०८२)</h2>
              </div>
              <PartyStats party={selectedParty} />
            </section>

            {/* History */}
            <PartyHistory party={selectedParty} />
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              पार्टी छान्नुहोस्
            </h3>
            <p className="text-muted-foreground max-w-sm text-center">
              माथिको सर्च बक्सबाट कुनै पनि राजनीतिक दल खोजेर त्यसको विस्तृत विवरण हेर्नुहोस्
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

