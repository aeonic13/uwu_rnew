import { useState, useEffect } from 'react'
import { agreementsService } from '../../services/agreementsService'
import { rentService } from '../../services/rentService'

/**
 * The tenant's current lease and its rent plan (household split, own
 * share, autopay). Prefers a fully-signed lease, else the most recent.
 */
export function useRentPlan() {
  const [lease, setLease] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    agreementsService
      .listAgreements()
      .then(agreements => {
        const current =
          agreements.find(a => a.status === 'signed') || agreements[0]
        if (!active || !current) return null
        setLease(current)
        return rentService.getPlan(current.id).then(p => active && setPlan(p))
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return { lease, plan, setPlan, loading }
}

export default useRentPlan
