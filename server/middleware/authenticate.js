import { verifyToken, extractTokenFromHeader } from '../utils/auth.js'
import prisma from '../utils/prisma.js'

/**
 * Middleware to authenticate requests using JWT
 * Adds user object to req.user if authentication is successful
 */
export async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Authentication required. Please provide a valid token.',
        },
      })
    }

    // Verify token
    const decoded = verifyToken(token)

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired token. Please log in again.',
        },
      })
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        firstName: true,
        lastName: true,
        university: true,
        verified: true,
        avatarUrl: true,
      },
    })

    if (!user) {
      return res.status(401).json({
        error: {
          message: 'User not found. Please log in again.',
        },
      })
    }

    // Attach user to request object
    req.user = user

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(500).json({
      error: {
        message: 'Authentication failed. Please try again.',
      },
    })
  }
}

/**
 * Middleware to require specific user type
 * Must be used after authenticate middleware
 */
export function requireUserType(...allowedTypes) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          message: 'Authentication required.',
        },
      })
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        error: {
          message: `Access denied. This endpoint requires ${allowedTypes.join(' or ')} account.`,
        },
      })
    }

    next()
  }
}

/**
 * Middleware to require verified email
 * Must be used after authenticate middleware
 */
export function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        message: 'Authentication required.',
      },
    })
  }

  if (!req.user.verified) {
    return res.status(403).json({
      error: {
        message:
          'Email verification required. Please verify your email address.',
      },
    })
  }

  next()
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (token) {
      const decoded = verifyToken(token)

      if (decoded && decoded.userId) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            userType: true,
            firstName: true,
            lastName: true,
            university: true,
            verified: true,
            avatarUrl: true,
          },
        })

        if (user) {
          req.user = user
        }
      }
    }

    next()
  } catch (error) {
    // Continue without user authentication
    next()
  }
}

export default {
  authenticate,
  requireUserType,
  requireVerified,
  optionalAuth,
}
