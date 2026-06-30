import { useState, useCallback } from 'react'

const STORAGE_KEY = 'rentra_prequal'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Hook for managing a tenant's one-time pre-qualification status.
 * Data is persisted in localStorage so it carries across all listings.
 */
export function usePreQualification() {
  const [preQualData, setPreQualData] = useState(() => loadFromStorage())

  const isPreQualified = !!preQualData?.completedAt

  const completePreQual = useCallback(verifications => {
    const data = {
      completedAt: new Date().toISOString(),
      verifications,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setPreQualData(data)
  }, [])

  const clearPreQual = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setPreQualData(null)
  }, [])

  return { isPreQualified, preQualData, completePreQual, clearPreQual }
}
