import { signedLeaseFilename } from '../utils/agreements.js'
import { describe, it, expect } from 'vitest'
import {
  signatureState,
  pendingSigners,
  shapeAgreement,
  defaultLeaseTerms,
} from '../utils/agreements.js'

const user = (id, first, last) => ({
  id,
  firstName: first,
  lastName: last,
  email: `${first.toLowerCase()}@example.com`,
  phone: '',
})

const signers = [
  {
    id: 's1',
    role: 'tenant',
    userId: 'emma',
    signed: true,
    signedAt: '2026-09-01',
    user: user('emma', 'Emma', 'Wilson'),
  },
  {
    id: 's2',
    role: 'tenant',
    userId: 'alex',
    signed: false,
    user: user('alex', 'Alex', 'Johnson'),
  },
  {
    id: 's3',
    role: 'landlord',
    userId: 'jen',
    signed: false,
    user: user('jen', 'Jennifer', 'Park'),
  },
]

describe('signatureState', () => {
  it('is signed only when every signer has signed', () => {
    const partial = signatureState(signers)
    expect(partial.allSigned).toBe(false)
    expect(partial.tenantsSigned).toBe(false)
    expect(partial.landlordSigned).toBe(false)
    expect(partial.signedCount).toBe(1)
    expect(partial.total).toBe(3)

    const done = signatureState(signers.map(s => ({ ...s, signed: true })))
    expect(done.allSigned).toBe(true)
    expect(done.tenantsSigned).toBe(true)
    expect(done.landlordSigned).toBe(true)
  })

  it('treats an empty signer list as unsigned', () => {
    expect(signatureState([]).allSigned).toBe(false)
  })

  it('lists pending signers tenants first, landlord last', () => {
    const order = pendingSigners([signers[2], signers[1]]).map(s => s.userId)
    expect(order).toEqual(['alex', 'jen'])
  })
})

describe('shapeAgreement', () => {
  const agreement = {
    id: 'ag1',
    monthlyRent: 2950,
    securityDeposit: 2950,
    startDate: '2026-06-01',
    endDate: '2027-06-01',
    terms: { utilities: 'Tenant pays', lateFee: '5%' },
    createdAt: '2026-05-20',
    groupId: 'g1',
    application: {
      listing: { title: 'Beachside 2BR', location: 'Pacific Beach' },
      owner: user('jen', 'Jennifer', 'Park'),
    },
    signers,
  }

  it('shows a tenant their own block, everyone else, and who is pending', () => {
    const s = shapeAgreement(agreement, 'alex')
    expect(s.status).toBe('pending_signature')
    expect(s.isGroupLease).toBe(true)
    expect(s.viewerRole).toBe('tenant')
    expect(s.viewerHasSigned).toBe(false)
    expect(s.tenant.name).toBe('Alex Johnson')
    expect(s.tenants.map(t => t.name)).toEqual(['Emma Wilson', 'Alex Johnson'])
    expect(s.landlord.name).toBe('Jennifer Park')
    expect(s.pendingSigners.map(p => p.name)).toEqual([
      'Alex Johnson',
      'Jennifer Park',
    ])
    expect(s.signedCount).toBe(1)
    expect(s.signerCount).toBe(3)
    expect(s.terms.petPolicy).toBe('As agreed between the parties.')
  })

  it('gives the landlord their role and the first tenant as `tenant`', () => {
    const s = shapeAgreement(agreement, 'jen')
    expect(s.viewerRole).toBe('landlord')
    expect(s.tenant.name).toBe('Emma Wilson')
    expect(s.landlord.isViewer).toBe(true)
  })

  it('is signed once every block is signed', () => {
    const s = shapeAgreement(
      { ...agreement, signers: signers.map(x => ({ ...x, signed: true })) },
      'emma'
    )
    expect(s.status).toBe('signed')
    expect(s.pendingSigners).toEqual([])
  })

  it('marks strangers as other', () => {
    expect(shapeAgreement(agreement, 'nobody').viewerRole).toBe('other')
  })

  it('names an unattached block on an imported lease after its invite', () => {
    const importedLease = {
      ...agreement,
      source: 'imported',
      monthToMonth: true,
      documentUrl: 'https://files.example.com/lease.pdf',
      signers: [
        {
          id: 's1',
          role: 'tenant',
          userId: 'emma',
          signed: true,
          applicationId: 'm1',
          user: user('emma', 'Emma', 'Wilson'),
        },
        {
          id: 's2',
          role: 'tenant',
          userId: null,
          signed: false,
          applicationId: 'm2',
          user: null,
        },
        {
          id: 's3',
          role: 'landlord',
          userId: 'jen',
          signed: true,
          user: user('jen', 'Jennifer', 'Park'),
        },
      ],
      members: [
        { id: 'm1', tenantInvite: null },
        {
          id: 'm2',
          tenantInvite: {
            firstName: 'Alex',
            lastName: 'Johnson',
            email: 'alex@example.com',
            phone: null,
            status: 'pending',
          },
        },
      ],
    }
    const s = shapeAgreement(importedLease, 'emma')
    expect(s.imported).toBe(true)
    expect(s.monthToMonth).toBe(true)
    expect(s.documentUrl).toBe('https://files.example.com/lease.pdf')
    expect(s.status).toBe('pending_signature')
    expect(s.tenants.map(t => t.name)).toEqual(['Emma Wilson', 'Alex Johnson'])
    expect(s.tenants[1]).toMatchObject({
      userId: null,
      email: 'alex@example.com',
      signed: false,
      isViewer: false,
      inviteStatus: 'pending',
    })
    expect(s.pendingSigners.map(p => p.name)).toEqual(['Unknown'])
  })
})

describe('defaultLeaseTerms', () => {
  it('uses one month of rent for the deposit', () => {
    const t = defaultLeaseTerms(
      { price: 1500 },
      { startDate: 'a', endDate: 'b' }
    )
    expect(t.monthlyRent).toBe(1500)
    expect(t.securityDeposit).toBe(1500)
    expect(t.terms.utilities).toMatch(/utilities/i)
  })
})

describe('signedLeaseFilename', () => {
  it('names the download after the lease with the extension from the content type', () => {
    expect(signedLeaseFilename({ id: 'ag1' }, 'application/pdf')).toBe(
      'signed-lease-ag1.pdf'
    )
    expect(
      signedLeaseFilename({ id: 'ag1' }, 'image/jpeg; charset=binary')
    ).toBe('signed-lease-ag1.jpg')
  })

  it('falls back to the upload URL extension, then pdf', () => {
    expect(
      signedLeaseFilename(
        { id: 'ag2', documentUrl: 'https://cdn.example/x/doc_1.DOCX?v=2' },
        'application/octet-stream'
      )
    ).toBe('signed-lease-ag2.docx')
    expect(signedLeaseFilename({ id: 'ag3' }, '')).toBe('signed-lease-ag3.pdf')
  })
})
