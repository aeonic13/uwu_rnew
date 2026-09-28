import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  LEGAL_PAGES,
  LegalHub,
  TermsPage,
  PrivacyPage,
  EsignPage,
  ScreeningPage,
  FeesPage,
  TenantRightsPage,
  CommunityPage,
} from './LegalPages'
import { POLICY_VERSIONS } from './policyVersions'

const wrap = ui => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('LegalHub', () => {
  it('links to every tenant-facing policy', () => {
    wrap(<LegalHub />)
    const hub = screen.getByTestId('legal-hub')
    const links = hub.querySelectorAll('a')
    expect(links).toHaveLength(LEGAL_PAGES.length)
    for (const page of LEGAL_PAGES) {
      expect(screen.getByText(page.title)).toBeInTheDocument()
      expect(POLICY_VERSIONS[page.key]).toBeTruthy()
    }
    expect([...links].map(a => a.getAttribute('href'))).toEqual(
      LEGAL_PAGES.map(p => p.path)
    )
  })
})

describe('policy pages', () => {
  const pages = [
    ['Terms of Service', TermsPage, /not a party to your lease/i],
    ['Privacy Policy', PrivacyPage, /do not sell your personal information/i],
    [
      'Electronic Records & Signatures Consent',
      EsignPage,
      /same effect as a handwritten signature/i,
    ],
    [
      'Tenant Screening Disclosure & Authorization',
      ScreeningPage,
      /not run today/i,
    ],
    ['Fees & Payments', FeesPage, /no money moves through rentra/i],
    ['Your Rights as a California Renter', TenantRightsPage, /21 days/i],
    ['Fair Housing & Community Guidelines', CommunityPage, /source of income/i],
  ]

  it.each(pages)(
    '%s renders with a counsel-review banner and a version',
    (title, Page, phrase) => {
      wrap(<Page />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title)
      expect(screen.getByTestId('counsel-banner')).toHaveTextContent(
        /not legal advice/i
      )
      expect(screen.getByText(/^Version /)).toBeInTheDocument()
      expect(screen.getAllByText(phrase).length).toBeGreaterThan(0)
    }
  )

  it('states honestly that recorded rent payments carry no fee and move no money', () => {
    wrap(<FeesPage />)
    expect(screen.getByText(/there is no fee/i)).toBeInTheDocument()
    expect(screen.getByText(/does not debit anything/i)).toBeInTheDocument()
  })
})
