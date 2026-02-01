"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, Search, MapPin, Building2, Vote, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useJsonData } from "@/hooks/use-json-data"

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

interface ConstituencyFilterProps {
  onSelect: (constituency: ConstituencyData | null) => void
}

export function ConstituencyFilter({ onSelect }: ConstituencyFilterProps) {
  const [selectedState, setSelectedState] = useState<string>("")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("")
  const [selectedConstituency, setSelectedConstituency] = useState<string>("")

  // Load all constituencies from JSON
  const { data: allConstituencies, loading: dataLoading } = useJsonData<ConstituencyData>(
    'dim_constituency_profile'
  )

  // Extract unique states
  const states = useMemo(() => {
    if (!allConstituencies) return []
    const unique = Array.from(new Set(allConstituencies.map(c => c.state_name)))
    return unique.sort()
  }, [allConstituencies])

  // Extract districts based on selected state
  const districts = useMemo(() => {
    if (!allConstituencies || !selectedState) return []
    const filtered = allConstituencies.filter(c => c.state_name === selectedState)
    const unique = Array.from(new Set(filtered.map(c => c.district_name)))
    return unique.sort()
  }, [allConstituencies, selectedState])

  // Extract constituencies based on selected district
  const constituencies = useMemo(() => {
    if (!allConstituencies || !selectedDistrict) return []
    const filtered = allConstituencies.filter(c => c.district_name === selectedDistrict)
    return filtered.sort((a, b) => parseInt(a.constituency_id) - parseInt(b.constituency_id))
  }, [allConstituencies, selectedDistrict])

  // Auto-select district if only one available
  useEffect(() => {
    if (selectedState && districts.length === 1 && !selectedDistrict) {
      setSelectedDistrict(districts[0])
    }
  }, [selectedState, districts, selectedDistrict])

  // Auto-select constituency if only one available
  useEffect(() => {
    if (selectedDistrict && constituencies.length === 1 && !selectedConstituency) {
      setSelectedConstituency(constituencies[0].constituency_id)
      onSelect(constituencies[0])
    }
  }, [selectedDistrict, constituencies, selectedConstituency, onSelect])

  const handleStateChange = (newState: string) => {
    setSelectedState(newState)
    setSelectedDistrict("")
    setSelectedConstituency("")
    onSelect(null)
  }

  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict)
    setSelectedConstituency("")
    onSelect(null)
  }

  const handleConstituencyChange = (constituencyId: string) => {
    setSelectedConstituency(constituencyId)
    const selected = allConstituencies?.find(
      (c) => c.district_name === selectedDistrict && c.constituency_id === constituencyId
    )
    onSelect(selected || null)
  }

  if (dataLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-muted-foreground">निर्वाचन क्षेत्र डेटा लोड हो रहेको छ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
          <Search className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">निर्वाचन क्षेत्र खोज्नुहोस्</h2>
          <p className="text-sm text-muted-foreground">प्रदेश, जिल्ला र निर्वाचन क्षेत्र छान्नुहोस्</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* State */}
        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            प्रदेश
          </label>
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className={cn(
                "w-full appearance-none rounded-lg border border-border bg-input px-4 py-3 pr-10",
                "text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              )}
            >
              <option value="">प्रदेश छान्नुहोस् ({states.length})</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <Building2 className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* District */}
        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            जिल्ला
          </label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!selectedState}
              className={cn(
                "w-full appearance-none rounded-lg border border-border bg-input px-4 py-3 pr-10",
                "text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <option value="">जिल्ला छान्नुहोस् ({districts.length})</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <MapPin className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Constituency */}
        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            निर्वाचन क्षेत्र
          </label>
          <div className="relative">
            <select
              value={selectedConstituency}
              onChange={(e) => handleConstituencyChange(e.target.value)}
              disabled={!selectedDistrict}
              className={cn(
                "w-full appearance-none rounded-lg border border-border bg-input px-4 py-3 pr-10",
                "text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <option value="">निर्वाचन क्षेत्र छान्नुहोस् ({constituencies.length})</option>
              {constituencies.map((c) => (
                <option key={c.constituency_id} value={c.constituency_id}>
                  {c.constituency_name}
                </option>
              ))}
            </select>
            <Vote className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}
