import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { teamService } from '../../services/teamService'

const ROLE_LABEL = { owner: 'yours', manager: 'manager', co_owner: 'co-owner' }

/**
 * Lets a landlord who works several portfolios (their own plus any team
 * memberships) pick the one every owner screen scopes to. Renders nothing
 * when there is only one. Switching is persisted server-side, then the
 * page reloads so every screen re-reads with the new scope.
 */
export default function PortfolioSwitcher({ className = '' }) {
  const [portfolios, setPortfolios] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    teamService
      .portfolios()
      .then(list => {
        if (!cancelled) setPortfolios(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        // Not fatal: the screen simply works the current portfolio.
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (portfolios.length < 2) return null

  const active = portfolios.find(p => p.active) || portfolios[0]

  const change = async e => {
    const ownerId = e.target.value
    if (!ownerId || ownerId === active.ownerId) return
    setBusy(true)
    setError('')
    try {
      await teamService.setActive(ownerId)
      window.location.reload()
    } catch (err) {
      setError(err?.message || 'Could not switch portfolios.')
      setBusy(false)
    }
  }

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <label className="inline-flex items-center gap-2 text-sm text-gray-600">
        <span>Working portfolio</span>
        <select
          value={active.ownerId}
          onChange={change}
          disabled={busy}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white text-gray-900 disabled:opacity-50"
        >
          {portfolios.map(p => (
            <option key={p.ownerId} value={p.ownerId}>
              {p.ownerName || 'Portfolio'} ({ROLE_LABEL[p.role] || p.role})
            </option>
          ))}
        </select>
      </label>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

PortfolioSwitcher.propTypes = {
  className: PropTypes.string,
}
