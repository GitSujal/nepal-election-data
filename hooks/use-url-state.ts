"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback, useMemo } from "react"

type FilterValue = string | number | string[] | null

interface UseUrlStateOptions {
  push?: boolean  // true = creates history entry, false = replace
}

export function useUrlState<T extends Record<string, FilterValue>>(
  defaultValues: T,
  options: UseUrlStateOptions = {}
): [T, (updates: Partial<T>) => void, () => void] {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { push = false } = options

  // Parse current URL state with proper type handling
  const currentState = useMemo(() => {
    const state = { ...defaultValues }

    for (const key of Object.keys(defaultValues)) {
      const urlValue = searchParams.get(key)
      const defaultValue = defaultValues[key]

      if (urlValue === null) continue

      // Handle array types (badges)
      if (Array.isArray(defaultValue)) {
        state[key as keyof T] = (urlValue
          ? urlValue.split(',').map(v => decodeURIComponent(v)).filter(Boolean)
          : []) as T[keyof T]
      }
      // Handle number types (IDs)
      else if (typeof defaultValue === 'number') {
        const parsed = parseInt(urlValue, 10)
        state[key as keyof T] = (isNaN(parsed) ? defaultValue : parsed) as T[keyof T]
      }
      // Handle string types (names - already decoded by browser)
      else {
        state[key as keyof T] = urlValue as T[keyof T]
      }
    }

    return state
  }, [searchParams, defaultValues])

  // Update URL with new state
  const setState = useCallback((updates: Partial<T>) => {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '' || value === 0 ||
          (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        // Encode each badge name, join with comma
        params.set(key, value.map(v => encodeURIComponent(v)).join(','))
      } else {
        params.set(key, String(value))
      }
    }

    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname

    if (push) {
      router.push(newUrl, { scroll: false })
    } else {
      router.replace(newUrl, { scroll: false })
    }
  }, [searchParams, pathname, router, push])

  // Reset to defaults (clear URL params)
  const resetState = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [pathname, router])

  return [currentState, setState, resetState]
}
