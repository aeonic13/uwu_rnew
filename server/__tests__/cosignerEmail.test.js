import { describe, it, expect, vi, beforeEach } from 'vitest'

// No provider keys in the test env, so sendEmail short-circuits with
// { success: false } after the template has been rendered. That is enough
// to prove the template itself does not throw.
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

const emailModule = await import('../utils/email.js')
const { sendCosignerInvitation, sendCosignerAcceptedEmail } = emailModule

describe('sendCosignerInvitation', () => {
  it('does not throw for a floating pre-qual invite with no listing', async () => {
    await expect(
      sendCosignerInvitation({
        cosignerEmail: 'parent@example.com',
        cosignerName: 'Pat',
        tenantName: 'Sam Student',
        listingTitle: null,
        listingLocation: null,
        monthlyRent: null,
        inviteUrl: 'https://myrentra.com/cosigner/accept/abc',
      })
    ).resolves.toMatchObject({ success: false })
  })

  it('does not throw for an application-bound invite with a listing', async () => {
    await expect(
      sendCosignerInvitation({
        cosignerEmail: 'parent@example.com',
        cosignerName: 'Pat',
        tenantName: 'Sam Student',
        listingTitle: '2BR near campus',
        listingLocation: 'San Diego, CA',
        monthlyRent: 1850,
        inviteUrl: 'https://myrentra.com/cosigner/accept/abc',
      })
    ).resolves.toMatchObject({ success: false })
  })
})

describe('sendCosignerAcceptedEmail', () => {
  const tenant = { email: 'sam@ucsd.edu', firstName: 'Sam' }
  const cosigner = {
    firstName: 'Pat',
    lastName: 'Parent',
    email: 'pat@example.com',
  }

  it('renders for a floating cosigner (no listing)', async () => {
    await expect(
      sendCosignerAcceptedEmail(tenant, cosigner, null)
    ).resolves.toMatchObject({ success: false })
  })

  it('renders for an application-bound cosigner', async () => {
    await expect(
      sendCosignerAcceptedEmail(tenant, cosigner, '2BR near campus')
    ).resolves.toMatchObject({ success: false })
  })
})
