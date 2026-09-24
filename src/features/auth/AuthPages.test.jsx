import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ForgotPasswordPage from './ForgotPasswordPage'
import ResetPasswordPage from './ResetPasswordPage'
import VerifyEmailPage from './VerifyEmailPage'
import { authService } from '../../services/authService'

vi.mock('../../services/authService', () => ({
  authService: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
}))

const auth = { user: null, refreshUser: vi.fn() }
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => auth,
}))

function renderAt(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path.split('?')[0]} element={element} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.user = null
})

describe('ForgotPasswordPage', () => {
  it('rejects a malformed email without calling the API', () => {
    renderAt('/forgot-password', <ForgotPasswordPage />)
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'nope' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    expect(authService.forgotPassword).not.toHaveBeenCalled()
  })

  it('sends the request and shows the same confirmation either way', async () => {
    authService.forgotPassword.mockResolvedValue({})
    renderAt('/forgot-password', <ForgotPasswordPage />)
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'sam@ucsd.edu' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(await screen.findByText('Check your email')).toBeInTheDocument()
    expect(authService.forgotPassword).toHaveBeenCalledWith('sam@ucsd.edu')
    expect(screen.getByText(/If an account exists for/)).toBeInTheDocument()
  })
})

describe('ResetPasswordPage', () => {
  it('explains a link with no token', () => {
    renderAt('/reset-password', <ResetPasswordPage />)
    expect(
      screen.getByText('This reset link is incomplete')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /request a new link/i })
    ).toHaveAttribute('href', '/forgot-password')
  })

  it('enforces the server password rules and a matching confirmation', () => {
    renderAt('/reset-password?token=abc', <ResetPasswordPage />)
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'short' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'longenough1' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'different1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(authService.resetPassword).not.toHaveBeenCalled()
  })

  it('resets with the token from the URL and offers sign in', async () => {
    authService.resetPassword.mockResolvedValue({})
    renderAt('/reset-password?token=abc', <ResetPasswordPage />)
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'longenough1' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'longenough1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))
    expect(await screen.findByText('Password updated')).toBeInTheDocument()
    expect(authService.resetPassword).toHaveBeenCalledWith('abc', 'longenough1')
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login'
    )
  })

  it('surfaces the server error for an expired token', async () => {
    authService.resetPassword.mockRejectedValue(
      new Error('Invalid or expired reset token')
    )
    renderAt('/reset-password?token=old', <ResetPasswordPage />)
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'longenough1' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'longenough1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))
    expect(
      await screen.findByText('Invalid or expired reset token')
    ).toBeInTheDocument()
  })
})

describe('VerifyEmailPage', () => {
  it('verifies on load and refreshes the signed-in user', async () => {
    auth.user = { userType: 'student', verified: false, email: 'sam@ucsd.edu' }
    authService.verifyEmail.mockResolvedValue({})
    renderAt('/verify-email?token=tok', <VerifyEmailPage />)
    expect(await screen.findByText('Email verified')).toBeInTheDocument()
    expect(authService.verifyEmail).toHaveBeenCalledWith('tok')
    await waitFor(() => expect(auth.refreshUser).toHaveBeenCalled())
    expect(screen.getByRole('link', { name: /continue/i })).toHaveAttribute(
      'href',
      '/'
    )
  })

  it('offers a resend to a signed-in user when the link is dead', async () => {
    auth.user = { userType: 'student', verified: false, email: 'sam@ucsd.edu' }
    authService.verifyEmail.mockRejectedValue(
      new Error('Invalid or expired verification token')
    )
    authService.resendVerification.mockResolvedValue({})
    renderAt('/verify-email?token=old', <VerifyEmailPage />)
    expect(await screen.findByText('Could not verify')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /send a new link/i }))
    expect(
      await screen.findByText(/fresh link is on its way/)
    ).toBeInTheDocument()
    expect(authService.resendVerification).toHaveBeenCalled()
  })

  it('sends a signed-out visitor to sign in when the link is dead', async () => {
    authService.verifyEmail.mockRejectedValue(new Error('Invalid'))
    renderAt('/verify-email?token=old', <VerifyEmailPage />)
    expect(await screen.findByText('Could not verify')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /sign in to request a new link/i })
    ).toHaveAttribute('href', '/login')
  })

  it('explains a link with no token without calling the API', () => {
    renderAt('/verify-email', <VerifyEmailPage />)
    expect(screen.getByText('This link is incomplete')).toBeInTheDocument()
    expect(authService.verifyEmail).not.toHaveBeenCalled()
  })
})
