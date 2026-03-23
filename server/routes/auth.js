import express from 'express'
import prisma from '../utils/prisma.js'
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  generateSecureToken,
  validatePasswordStrength,
} from '../utils/auth.js'
import { sendVerificationEmail } from '../utils/email.js'

const router = express.Router()

// Validate .edu email
function validateEduEmail(email) {
  return /^[^\s@]+@[^\s@]+\.edu$/i.test(email)
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, userType, firstName, lastName, university, phone } =
      req.body

    // Validate required fields
    if (!email || !password || !userType || !firstName || !lastName) {
      return res.status(400).json({
        error: { message: 'All fields are required' },
      })
    }

    // Validate .edu email for students
    if (userType === 'student' && !validateEduEmail(email)) {
      return res.status(400).json({
        error: {
          message:
            'Students must register with a valid .edu email address',
        },
      })
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: {
          message: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
      })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return res.status(409).json({
        error: { message: 'User with this email already exists' },
      })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate email verification token
    const verifyToken = generateSecureToken()

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        userType,
        firstName,
        lastName,
        university,
        phone,
        verifyToken,
        verified: false,
      },
      select: {
        id: true,
        email: true,
        userType: true,
        firstName: true,
        lastName: true,
        university: true,
        verified: true,
        createdAt: true,
      },
    })

    // Generate tokens
    const tokens = generateTokens(user)

    // Send verification email
    try {
      await sendVerificationEmail(user, verifyToken)
      console.log(`✅ Verification email sent to ${email}`)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue registration even if email fails
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(400).json({ error: { message: error.message } })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required' },
      })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' },
      })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)

    if (!isValidPassword) {
      return res.status(401).json({
        error: { message: 'Invalid email or password' },
      })
    }

    // Generate tokens
    const tokens = generateTokens(user)

    // Return user data (excluding password hash)
    const { passwordHash, verifyToken, resetToken, ...userData } = user

    res.json({
      message: 'Login successful',
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userData,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: { message: 'Login failed' } })
  }
})

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        error: { message: 'Verification token is required' },
      })
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    })

    if (!user) {
      return res.status(400).json({
        error: { message: 'Invalid or expired verification token' },
      })
    }

    // Mark user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verifyToken: null,
      },
    })

    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Verification error:', error)
    res.status(400).json({ error: { message: 'Verification failed' } })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: { message: 'Email is required' },
      })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: 'If an account exists, a password reset email has been sent',
      })
    }

    // Generate reset token
    const resetToken = generateSecureToken()
    const resetTokenExp = new Date(Date.now() + 3600000) // 1 hour

    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExp,
      },
    })

    // TODO: Send password reset email with resetToken
    console.log(`Reset token for ${email}: ${resetToken}`)

    res.json({
      message: 'If an account exists, a password reset email has been sent',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: { message: 'Request failed' } })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        error: { message: 'Token and new password are required' },
      })
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: {
          message: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
      })
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: {
          gte: new Date(),
        },
      },
    })

    if (!user) {
      return res.status(400).json({
        error: { message: 'Invalid or expired reset token' },
      })
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
      },
    })

    res.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: { message: 'Password reset failed' } })
  }
})

export default router
