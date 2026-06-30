import { verifyToken, extractTokenFromHeader } from '../utils/auth.js'

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return res.status(401).json({
        error: { message: 'Authentication required. Please log in.' },
      })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({
        error: { message: 'Invalid or expired token. Please log in again.' },
      })
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      userType: decoded.userType,
      verified: decoded.verified,
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({
      error: { message: 'Authentication failed.' },
    })
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require auth
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          userType: decoded.userType,
          verified: decoded.verified,
        }
      }
    }

    next()
  } catch {
    // Ignore errors in optional auth
    next()
  }
}

/**
 * Role-based authorization middleware
 * Requires user to have one of the specified roles
 * @param {string[]} allowedRoles - Array of allowed role names
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: 'Authentication required.' },
      })
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({
        error: {
          message: 'You do not have permission to perform this action.',
        },
      })
    }

    next()
  }
}

/**
 * Verified user middleware
 * Requires user to have verified their email
 */
export function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: { message: 'Authentication required.' },
    })
  }

  if (!req.user.verified) {
    return res.status(403).json({
      error: { message: 'Please verify your email to access this feature.' },
    })
  }

  next()
}

/**
 * Resource ownership middleware factory
 * Creates middleware that checks if user owns the requested resource
 * @param {function} getOwnerId - Function to extract owner ID from request
 */
export function requireOwnership(getOwnerId) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required.' },
        })
      }

      const ownerId = await getOwnerId(req)
      if (ownerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            message: 'You do not have permission to access this resource.',
          },
        })
      }

      next()
    } catch (error) {
      console.error('Ownership check error:', error)
      return res.status(500).json({
        error: { message: 'Error verifying resource ownership.' },
      })
    }
  }
}

export default {
  authenticate,
  optionalAuth,
  requireRole,
  requireVerified,
  requireOwnership,
}
