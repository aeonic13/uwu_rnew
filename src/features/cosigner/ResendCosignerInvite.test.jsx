import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResendCosignerInvite from './ResendCosignerInvite'
import { cosignerService } from '../../services/cosignerService'

vi.mock('../../services/cosignerService', () => ({
  cosignerService: { resend: vi.fn() },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ResendCosignerInvite', () => {
  it('labels an expired link and resends with a fresh expiry', async () => {
    const past = new Date(Date.now() - 86400000).toISOString()
    const future = new Date(Date.now() + 7 * 86400000).toISOString()
    cosignerService.resend.mockResolvedValue({
      cosigner: { id: 'cs-1', expiresAt: future },
    })
    const onResent = vi.fn()

    render(
      <ResendCosignerInvite
        cosignerId="cs-1"
        expiresAt={past}
        onResent={onResent}
      />
    )

    expect(screen.getByText(/Invite link expired/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Resend invite'))

    await waitFor(() => expect(screen.getByText('Resent')).toBeInTheDocument())
    expect(cosignerService.resend).toHaveBeenCalledWith('cs-1')
    expect(onResent).toHaveBeenCalledWith({ id: 'cs-1', expiresAt: future })
  })

  it('labels a live link and shows the server error on failure', async () => {
    const future = new Date(Date.now() + 3 * 86400000).toISOString()
    cosignerService.resend.mockRejectedValue(new Error('Too many requests'))

    render(<ResendCosignerInvite cosignerId="cs-2" expiresAt={future} />)

    expect(screen.getByText(/Invite link expires/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Resend invite'))
    expect(await screen.findByText('Too many requests')).toBeInTheDocument()
    expect(screen.getByText('Resend invite')).toBeInTheDocument()
  })
})
