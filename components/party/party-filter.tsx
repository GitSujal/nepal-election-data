"use client"

import { useState, useMemo } from "react"
import { Building2, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useJsonData } from "@/hooks/use-json-data"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { usePartySymbols } from "@/hooks/use-party-symbols"
import Image from "next/image"

export interface PartyProfileData {
  party_id: number
  party_name: string
  symbol_url: string | null
  symbol_alt: string | null
  leader: string | null
  history_json: any
  current_stats_json: any
  party_tags: string[]
  party_display_order?: number
  [key: string]: any
}

interface PartyFilterProps {
  onSelect: (party: PartyProfileData | null) => void
}

export function PartyFilter({ onSelect }: PartyFilterProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const { getSymbolUrl } = usePartySymbols()

  // Load all parties from JSON
  const { data: allParties, loading: dataLoading } = useJsonData<PartyProfileData>(
    'dim_parties_profile'
  )

  const sortedParties = useMemo(() => {
    if (!allParties) return []
    return [...allParties].sort((a, b) => (a.party_display_order || 999) - (b.party_display_order || 999))
  }, [allParties])

  const selectedParty = useMemo(() => {
    if (!value || !allParties) return null
    return allParties.find((p) => p.party_id.toString() === value) || null
  }, [value, allParties])

  if (dataLoading) {
    return (
      <div className="flex h-14 items-center gap-3 rounded-xl border border-border bg-card px-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">डेटा लोड हुँदैछ...</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-20 w-full justify-between rounded-2xl bg-card px-6 text-left font-normal hover:bg-card/80 md:h-24 shadow-sm border-2 transition-all hover:border-primary/50"
          >
            {selectedParty ? (
              <div className="flex items-center gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm border border-border md:h-16 md:w-16">
                  {selectedParty.symbol_url || getSymbolUrl(selectedParty.party_name) ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={selectedParty.symbol_url || getSymbolUrl(selectedParty.party_name)!}
                        alt={selectedParty.party_name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground md:h-8 md:w-8" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-extrabold text-foreground md:text-2xl leading-tight">
                    {selectedParty.party_name}
                  </span>
                  {selectedParty.leader && (
                    <span className="text-xs font-medium text-muted-foreground md:text-sm">
                      नेता: {selectedParty.leader}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary md:h-12 md:w-12">
                   <Building2 className="h-5 w-5 text-muted-foreground" />
                 </div>
                 <span className="text-lg font-medium text-muted-foreground md:text-xl">पार्टी छान्नुहोस्...</span>
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-6 w-6 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command className="rounded-xl">
            <CommandInput placeholder="पार्टीको नाम खोज्नुहोस्..." className="h-14 text-lg" />
            <CommandList className="max-h-[500px]">
              <CommandEmpty>कुनै पार्टी भेटिएन।</CommandEmpty>
              <CommandGroup>
                {sortedParties.map((party) => {
                  const symbolUrl = party.symbol_url || getSymbolUrl(party.party_name)
                  return (
                    <CommandItem
                      key={party.party_id}
                      value={party.party_name}
                      onSelect={() => {
                        const newValue = party.party_id.toString()
                        setValue(newValue === value ? "" : newValue)
                        onSelect(newValue === value ? null : party)
                        setOpen(false)
                      }}
                      className="flex cursor-pointer items-center gap-5 px-6 py-4 hover:bg-secondary/80"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm border border-border">
                        {symbolUrl ? (
                          <div className="relative h-full w-full">
                            <Image
                              src={symbolUrl}
                              alt={party.party_name}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <Building2 className="h-7 w-7 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <span className="text-lg font-bold text-foreground leading-tight">
                          {party.party_name}
                        </span>
                        {party.leader && (
                          <span className="text-sm text-muted-foreground">
                            नेता: {party.leader}
                          </span>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-6 w-6 text-primary",
                          value === party.party_id.toString() ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
