"use client"

import { useState, useEffect } from "react"

export interface ElectionHistoryEntry {
  year: string
  position: string
  district: string
  constituency: string
  result: string
  party: string
}

export interface PoliticalHistoryEntry {
  event: string
  date: string
  details: string
  link_to_source: string
  event_type: "ELECTION_WIN" | "ELECTION_LOSS" | "MINISTERIAL_APPT" | "PARTY_SWITCH" | "RESIGNATION" | "OTHER"
  event_category: "GOOD" | "BAD" | "NEUTRAL"
}

export interface CandidatePoliticalHistory {
  candidate_id: number
  candidate_name: string
  candidate_party: string
  candidate_party_logo: string
  candidates_current_position: string
  candidates_current_position_in_party: string
  candidate_picture: string
  election_history: ElectionHistoryEntry[]
  political_history: PoliticalHistoryEntry[]
  analysis?: string
  overall_approval_rating?: number
}

let cachedData: CandidatePoliticalHistory[] | null = null
let fetchPromise: Promise<CandidatePoliticalHistory[]> | null = null

export function usePoliticalHistory(candidateId?: number) {
  const [data, setData] = useState<CandidatePoliticalHistory | null>(null)
  const [allData, setAllData] = useState<CandidatePoliticalHistory[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Return cached data if available
        if (cachedData) {
          setAllData(cachedData)
          if (candidateId) {
            const candidate = cachedData.find((c) => c.candidate_id === candidateId)
            setData(candidate || null)
          }
          setLoading(false)
          return
        }

        // Reuse existing fetch promise if one is in flight
        if (!fetchPromise) {
          fetchPromise = fetch("/data/candidates_political_history.json")
            .then((response) => {
              if (!response.ok) {
                throw new Error("Failed to load political history data")
              }
              return response.json()
            })
            .then((json: CandidatePoliticalHistory[]) => {
              cachedData = json
              fetchPromise = null
              return json
            })
            .catch((err) => {
              fetchPromise = null
              throw err
            })
        }

        const result = await fetchPromise
        setAllData(result)

        if (candidateId) {
          const candidate = result.find((c) => c.candidate_id === candidateId)
          setData(candidate || null)
          if (!candidate) {
            setError("इस उम्मेदवारको राजनीतिक इतिहास उपलब्ध छैन")
          }
        }
      } catch (err) {
        console.error("Error loading political history:", err)
        setError("डाटा लोड गर्न समस्या भयो")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [candidateId])

  return { data, allData, loading, error }
}

// Utility to get candidate history synchronously if already cached
export function getCachedPoliticalHistory(candidateId: number): CandidatePoliticalHistory | null {
  if (!cachedData) return null
  return cachedData.find((c) => c.candidate_id === candidateId) || null
}

// Clear cache (useful for testing or when data needs to be refreshed)
export function clearPoliticalHistoryCache() {
  cachedData = null
  fetchPromise = null
}
