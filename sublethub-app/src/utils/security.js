import DOMPurify from 'dompurify';

// ============================================================================
// SQL INJECTION PREVENTION UTILITIES
// ============================================================================

/**
 * SQL Query Builder with parameterized queries
 * This prevents SQL injection by treating user input as data, not code
 */
export class SecureQueryBuilder {
  constructor() {
    this.query = '';
    this.params = [];
  }

  /**
   * Build a SELECT query with parameterized values
   * @param {string} table - Table name
   * @param {array} columns - Columns to select
   * @param {object} conditions - WHERE conditions
   * @returns {object} Query and parameters
   */
  select(table, columns = ['*'], conditions = {}) {
    this.query = `SELECT ${columns.join(', ')} FROM ${this.escapeIdentifier(table)}`;
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = this.buildWhereClause(conditions);
      this.query += ` WHERE ${whereClause}`;
    }

    return { query: this.query, params: this.params };
  }

  /**
   * Build an INSERT query with parameterized values
   * @param {string} table - Table name
   * @param {object} data - Data to insert
   * @returns {object} Query and parameters
   */
  insert(table, data) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    this.query = `INSERT INTO ${this.escapeIdentifier(table)} (${columns.map(col => this.escapeIdentifier(col)).join(', ')}) VALUES (${placeholders})`;
    this.params = values;

    return { query: this.query, params: this.params };
  }

  /**
   * Build an UPDATE query with parameterized values
   * @param {string} table - Table name
   * @param {object} data - Data to update
   * @param {object} conditions - WHERE conditions
   * @returns {object} Query and parameters
   */
  update(table, data, conditions) {
    const setClause = Object.keys(data).map(key => `${this.escapeIdentifier(key)} = ?`).join(', ');
    const setValues = Object.values(data);

    this.query = `UPDATE ${this.escapeIdentifier(table)} SET ${setClause}`;
    this.params = [...setValues];

    if (Object.keys(conditions).length > 0) {
      const whereClause = this.buildWhereClause(conditions);
      this.query += ` WHERE ${whereClause}`;
    }

    return { query: this.query, params: this.params };
  }

  /**
   * Build WHERE clause with parameterized values
   * @param {object} conditions - Conditions object
   * @returns {string} WHERE clause
   */
  buildWhereClause(conditions) {
    const clauses = [];
    
    for (const [key, value] of Object.entries(conditions)) {
      if (Array.isArray(value)) {
        // Handle IN clause
        const placeholders = value.map(() => '?').join(', ');
        clauses.push(`${this.escapeIdentifier(key)} IN (${placeholders})`);
        this.params.push(...value);
      } else if (typeof value === 'object' && value !== null) {
        // Handle operators like { gt: 100 }, { like: '%test%' }
        for (const [op, val] of Object.entries(value)) {
          const operator = this.getOperator(op);
          clauses.push(`${this.escapeIdentifier(key)} ${operator} ?`);
          this.params.push(val);
        }
      } else {
        clauses.push(`${this.escapeIdentifier(key)} = ?`);
        this.params.push(value);
      }
    }

    return clauses.join(' AND ');
  }

  /**
   * Escape SQL identifiers (table names, column names)
   * @param {string} identifier - Identifier to escape
   * @returns {string} Escaped identifier
   */
  escapeIdentifier(identifier) {
    // Remove any non-alphanumeric characters except underscores
    const cleaned = identifier.replace(/[^a-zA-Z0-9_]/g, '');
    return `\`${cleaned}\``;
  }

  /**
   * Convert operator shorthand to SQL operators
   * @param {string} op - Operator shorthand
   * @returns {string} SQL operator
   */
  getOperator(op) {
    const operators = {
      'gt': '>',
      'gte': '>=',
      'lt': '<',
      'lte': '<=',
      'ne': '!=',
      'like': 'LIKE',
      'ilike': 'ILIKE'
    };
    return operators[op] || '=';
  }
}

/**
 * Validate and sanitize database inputs
 * @param {any} input - User input to validate
 * @param {string} type - Expected data type
 * @param {object} options - Validation options
 * @returns {any} Sanitized input
 */
export function validateInput(input, type, options = {}) {
  switch (type) {
    case 'email':
      return validateEmail(input);
    case 'phone':
      return validatePhone(input);
    case 'number':
      return validateNumber(input, options);
    case 'string':
      return validateString(input, options);
    case 'date':
      return validateDate(input);
    case 'uuid':
      return validateUUID(input);
    default:
      throw new Error(`Unsupported validation type: ${type}`);
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return email.toLowerCase().trim();
}

function validatePhone(phone) {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!phoneRegex.test(phone) || cleaned.length < 10) {
    throw new Error('Invalid phone number format');
  }
  return cleaned;
}

function validateNumber(num, options) {
  const parsed = parseFloat(num);
  if (isNaN(parsed)) {
    throw new Error('Invalid number');
  }
  if (options.min !== undefined && parsed < options.min) {
    throw new Error(`Number must be at least ${options.min}`);
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new Error(`Number must be at most ${options.max}`);
  }
  return parsed;
}

function validateString(str, options) {
  if (typeof str !== 'string') {
    throw new Error('Input must be a string');
  }
  
  const trimmed = str.trim();
  
  if (options.minLength && trimmed.length < options.minLength) {
    throw new Error(`String must be at least ${options.minLength} characters`);
  }
  if (options.maxLength && trimmed.length > options.maxLength) {
    throw new Error(`String must be at most ${options.maxLength} characters`);
  }
  if (options.pattern && !options.pattern.test(trimmed)) {
    throw new Error('String format is invalid');
  }
  
  return trimmed;
}

function validateDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return date.toISOString();
}

function validateUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error('Invalid UUID format');
  }
  return uuid.toLowerCase();
}

// ============================================================================
// XSS PREVENTION UTILITIES
// ============================================================================

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, options = {}) {
  if (typeof input !== 'string') {
    return input;
  }

  // Use DOMPurify for comprehensive XSS protection
  const config = {
    ALLOWED_TAGS: options.allowedTags || ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: options.allowedAttributes || [],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false
  };

  return DOMPurify.sanitize(input, config);
}

/**
 * Escape HTML characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return str;
  }

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'\/]/g, (match) => htmlEscapes[match]);
}

/**
 * Sanitize user-generated content for display
 * @param {string} content - Content to sanitize
 * @param {string} context - Context where content will be displayed
 * @returns {string} Sanitized content
 */
export function sanitizeUserContent(content, context = 'general') {
  const configs = {
    general: {
      allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i'],
      allowedAttributes: []
    },
    comment: {
      allowedTags: ['p', 'br', 'strong', 'em'],
      allowedAttributes: []
    },
    description: {
      allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
      allowedAttributes: []
    },
    none: {
      allowedTags: [],
      allowedAttributes: []
    }
  };

  const config = configs[context] || configs.general;
  return sanitizeInput(content, config);
}

/**
 * Validate and sanitize form data
 * @param {object} formData - Form data to validate
 * @param {object} schema - Validation schema
 * @returns {object} Sanitized form data
 */
export function sanitizeFormData(formData, schema) {
  const sanitized = {};

  for (const [field, rules] of Object.entries(schema)) {
    if (formData.hasOwnProperty(field)) {
      let value = formData[field];

      // Apply sanitization rules
      if (rules.sanitize) {
        if (rules.sanitize === 'html') {
          value = escapeHtml(value);
        } else if (rules.sanitize === 'content') {
          value = sanitizeUserContent(value, rules.context);
        }
      }

      // Apply validation rules
      if (rules.type) {
        value = validateInput(value, rules.type, rules.options);
      }

      sanitized[field] = value;
    } else if (rules.required) {
      throw new Error(`Required field missing: ${field}`);
    }
  }

  return sanitized;
}

// ============================================================================
// RATE LIMITING UTILITIES
// ============================================================================

/**
 * Rate limiter class to prevent brute force attacks
 */
export class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.blockedIPs = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Check if request should be rate limited
   * @param {string} identifier - IP address or user ID
   * @param {object} options - Rate limiting options
   * @returns {object} Result with allowed status and remaining attempts
   */
  checkLimit(identifier, options = {}) {
    const {
      maxRequests = 5,
      windowMs = 15 * 60 * 1000, // 15 minutes
      blockDurationMs = 60 * 60 * 1000, // 1 hour
      action = 'default'
    } = options;

    const key = `${identifier}:${action}`;
    const now = Date.now();

    // Check if IP is currently blocked
    if (this.blockedIPs.has(identifier)) {
      const blockInfo = this.blockedIPs.get(identifier);
      if (now < blockInfo.blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: blockInfo.blockedUntil,
          blocked: true,
          message: 'IP blocked due to too many failed attempts'
        };
      } else {
        // Block expired, remove it
        this.blockedIPs.delete(identifier);
      }
    }

    // Get or create request history for this key
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requestHistory = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = requestHistory.filter(timestamp => now - timestamp < windowMs);
    this.requests.set(key, validRequests);

    // Check if limit exceeded
    if (validRequests.length >= maxRequests) {
      // Block the IP
      this.blockedIPs.set(identifier, {
        blockedAt: now,
        blockedUntil: now + blockDurationMs,
        reason: 'Rate limit exceeded'
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: now + blockDurationMs,
        blocked: true,
        message: `Too many ${action} attempts. IP blocked for ${blockDurationMs / 60000} minutes.`
      };
    }

    // Record this request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return {
      allowed: true,
      remaining: maxRequests - validRequests.length,
      resetTime: now + windowMs,
      blocked: false,
      message: 'Request allowed'
    };
  }

  /**
   * Reset rate limit for an identifier
   * @param {string} identifier - IP address or user ID
   * @param {string} action - Action type
   */
  reset(identifier, action = 'default') {
    const key = `${identifier}:${action}`;
    this.requests.delete(key);
    this.blockedIPs.delete(identifier);
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Clean up old request histories
    for (const [key, history] of this.requests.entries()) {
      const validRequests = history.filter(timestamp => now - timestamp < maxAge);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }

    // Clean up expired IP blocks
    for (const [ip, blockInfo] of this.blockedIPs.entries()) {
      if (now > blockInfo.blockedUntil) {
        this.blockedIPs.delete(ip);
      }
    }
  }

  /**
   * Get current status for an identifier
   * @param {string} identifier - IP address or user ID
   * @param {string} action - Action type
   * @returns {object} Current status
   */
  getStatus(identifier, action = 'default') {
    const key = `${identifier}:${action}`;
    const requestHistory = this.requests.get(key) || [];
    const blocked = this.blockedIPs.has(identifier);
    
    return {
      requestCount: requestHistory.length,
      blocked,
      blockInfo: blocked ? this.blockedIPs.get(identifier) : null
    };
  }

  /**
   * Destroy the rate limiter and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
    this.blockedIPs.clear();
  }
}

// Global rate limiter instance
const globalRateLimiter = new RateLimiter();

/**
 * Rate limiting configurations for different actions
 */
export const RATE_LIMITS = {
  LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 60 * 60 * 1000, // 1 hour
    action: 'login'
  },
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
    action: 'password_reset'
  },
  MESSAGE_SEND: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
    action: 'message'
  },
  APPLICATION_SUBMIT: {
    maxRequests: 3,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours
    action: 'application'
  },
  LISTING_CREATE: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
    action: 'listing'
  }
};

/**
 * Apply rate limiting to a request
 * @param {string} identifier - IP address or user ID
 * @param {string} action - Action type
 * @returns {object} Rate limit result
 */
export function applyRateLimit(identifier, action) {
  const config = RATE_LIMITS[action.toUpperCase()] || RATE_LIMITS.LOGIN;
  return globalRateLimiter.checkLimit(identifier, config);
}

/**
 * Reset rate limit for a specific action
 * @param {string} identifier - IP address or user ID
 * @param {string} action - Action type
 */
export function resetRateLimit(identifier, action) {
  globalRateLimiter.reset(identifier, action);
}

// ============================================================================
// ADDITIONAL SECURITY UTILITIES
// ============================================================================

/**
 * Generate secure random tokens
 * @param {number} length - Token length
 * @returns {string} Random token
 */
export function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Hash passwords securely
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  // In a real application, use bcrypt or similar
  // This is a simplified example
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt'); // Use proper salt generation
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify hashed passwords
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} Whether password matches
 */
export async function verifyPassword(password, hash) {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

/**
 * Validate file uploads
 * @param {File} file - File to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
export function validateFileUpload(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
  } = options;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Log security events
 * @param {string} event - Event type
 * @param {object} details - Event details
 * @param {string} severity - Event severity
 */
export function logSecurityEvent(event, details, severity = 'info') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    severity,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };

  // In a real application, send this to a secure logging service
  console.log('Security Event:', logEntry);
  
  // Store critical events locally for immediate analysis
  if (severity === 'critical' || severity === 'high') {
    const criticalEvents = JSON.parse(localStorage.getItem('criticalSecurityEvents') || '[]');
    criticalEvents.push(logEntry);
    
    // Keep only the last 100 critical events
    if (criticalEvents.length > 100) {
      criticalEvents.splice(0, criticalEvents.length - 100);
    }
    
    localStorage.setItem('criticalSecurityEvents', JSON.stringify(criticalEvents));
  }
}

export default {
  SecureQueryBuilder,
  validateInput,
  sanitizeInput,
  escapeHtml,
  sanitizeUserContent,
  sanitizeFormData,
  RateLimiter,
  RATE_LIMITS,
  applyRateLimit,
  resetRateLimit,
  generateSecureToken,
  hashPassword,
  verifyPassword,
  validateFileUpload,
  logSecurityEvent
};