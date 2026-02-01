"use client"

import { useState } from "react"
import { ConstituencyFilter } from "@/components/constituency/constituency-filter"
import { ConstituencyHeader } from "@/components/constituency/constituency-header"
import { FPTPResults } from "@/components/constituency/fptp-results"
import { ProportionalResults } from "@/components/constituency/proportional-results"
import { ElectionComparison } from "@/components/constituency/election-comparison"
import { Vote, MapPin } from "lucide-react"

interface ConstituencyData {
  state_id: number
  state_name: string
  district_id: number
  district_name: string
  constituency_id: string
  constituency_name: string
  fptp_2079_results: any
  fptp_2074_results: any
  proportional_2079_results: any
  winning_party_2079: string
  winning_party_2074: string
  [key: string]: any
}

export default function ConstituencyProfilePage() {
  const [selectedConstituency, setSelectedConstituency] = useState<ConstituencyData | null>(null)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
              <MapPin className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                निर्वाचन क्षेत्र प्रोफाइल
              </h1>
              <p className="text-muted-foreground">
                आफ्नो निर्वाचन क्षेत्रको विस्तृत जानकारी हेर्नुहोस्
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter */}
        <div className="mb-8">
          <ConstituencyFilter
            onSelect={setSelectedConstituency}
          />
        </div>

        {/* Content */}
        {selectedConstituency ? (
          <div className="space-y-8">
            {/* Header */}
            <ConstituencyHeader constituency={selectedConstituency as any} />

            {/* Election Comparison */}
            <ElectionComparison
              results2079={selectedConstituency.fptp_2079_results}
              results2074={selectedConstituency.fptp_2074_results}
              winner2079={selectedConstituency.winning_party_2079}
              winner2074={selectedConstituency.winning_party_2074}
            />

            {/* Results Grid */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* FPTP 2079 */}
              <FPTPResults
                results2079={selectedConstituency.fptp_2079_results}
                results2074={selectedConstituency.fptp_2074_results}
                year="2079"
              />

              {/* FPTP 2074 */}
              <FPTPResults
                results2079={selectedConstituency.fptp_2079_results}
                results2074={selectedConstituency.fptp_2074_results}
                year="2074"
              />
            </div>

            {/* Proportional Results */}
            <ProportionalResults results={selectedConstituency.proportional_2079_results} />
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Vote className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              निर्वाचन क्षेत्र छान्नुहोस्
            </h3>
            <p className="max-w-md text-center text-muted-foreground">
              माथिको फिल्टर प्रयोग गरेर प्रदेश, जिल्ला र निर्वाचन क्षेत्र छानेपछि
              विस्तृत जानकारी देख्न सक्नुहुनेछ।
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
