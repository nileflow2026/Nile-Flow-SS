// src/auth/SecurityPolicies.js
/**
 * Client-side security policy enforcement.
 * Handles login attempt tracking, rate limiting stubs, and suspicious activity detection.
 * Actual rate limiting is enforced server-side; this provides UX feedback.
 */

// Client-side login attempt tracking
const LOGIN_ATTEMPTS_KEY = "rider:loginAttempts";
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

class SecurityPolicies {
  /**
   * Track a login attempt locally
   */
  recordLoginAttempt(email, success) {
    try {
      const attempts = this._getStoredAttempts();
      const key = email.toLowerCase().trim();

      if (success) {
        // Clear attempts on successful login
        delete attempts[key];
      } else {
        // Increment or create
        if (!attempts[key]) {
          attempts[key] = { count: 1, firstAttempt: Date.now() };
        } else {
          attempts[key].count += 1;
        }
      }

      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    } catch {
      // non-critical
    }
  }

  /**
   * Check if the account is currently locked out client-side
   */
  isLockedOut(email) {
    try {
      const attempts = this._getStoredAttempts();
      const key = email.toLowerCase().trim();
      const record = attempts[key];

      if (!record) return false;

      const elapsed = Date.now() - record.firstAttempt;

      // Reset if lockout period has passed
      if (elapsed > LOCKOUT_DURATION_MS) {
        delete attempts[key];
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
        return false;
      }

      return record.count >= MAX_LOGIN_ATTEMPTS;
    } catch {
      return false;
    }
  }

  /**
   * Get remaining attempts before lockout
   */
  getRemainingAttempts(email) {
    try {
      const attempts = this._getStoredAttempts();
      const key = email.toLowerCase().trim();
      const record = attempts[key];

      if (!record) return MAX_LOGIN_ATTEMPTS;

      const elapsed = Date.now() - record.firstAttempt;
      if (elapsed > LOCKOUT_DURATION_MS) return MAX_LOGIN_ATTEMPTS;

      return Math.max(0, MAX_LOGIN_ATTEMPTS - record.count);
    } catch {
      return MAX_LOGIN_ATTEMPTS;
    }
  }

  /**
   * Get lockout remaining time in seconds
   */
  getLockoutTimeRemaining(email) {
    try {
      const attempts = this._getStoredAttempts();
      const key = email.toLowerCase().trim();
      const record = attempts[key];

      if (!record) return 0;

      const elapsed = Date.now() - record.firstAttempt;
      const remaining = LOCKOUT_DURATION_MS - elapsed;

      if (remaining <= 0) return 0;

      return Math.ceil(remaining / 1000);
    } catch {
      return 0;
    }
  }

  /**
   * Clear login attempts for an email
   */
  clearAttempts(email) {
    try {
      const attempts = this._getStoredAttempts();
      const key = email.toLowerCase().trim();
      delete attempts[key];
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    } catch {
      // non-critical
    }
  }

  /**
   * Validate password strength client-side
   */
  validatePasswordStrength(password) {
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const isStrong = score >= 4;

    return {
      isStrong,
      score,
      checks,
      message: isStrong
        ? "Strong password"
        : score >= 3
          ? "Moderate password"
          : "Weak password — add uppercase, number, or special character",
    };
  }

  /**
   * Detect if a redirect URL is safe (prevents open redirect attacks)
   */
  isSafeRedirect(url, allowedHosts = []) {
    if (!url) return false;

    try {
      const parsed = new URL(url, window.location.origin);

      // Relative URLs are safe
      if (!parsed.host || parsed.host === window.location.host) return true;

      // Check against allowed hosts
      return allowedHosts.some(
        (host) => parsed.host === host || parsed.host.endsWith(`.${host}`),
      );
    } catch {
      return false;
    }
  }

  /**
   * Sanitize error messages for display (never leak sensitive info)
   */
  sanitizeErrorMessage(error) {
    if (!error) return "An unexpected error occurred.";

    const message = typeof error === "string" ? error : error.message || "";

    // Strip sensitive patterns
    let sanitized = message
      .replace(/token/i, "[credential]")
      .replace(/password/i, "[credential]")
      .replace(/secret/i, "[credential]")
      .replace(/key/i, "[credential]")
      .replace(/authorization/i, "[credential]");

    // Don't expose internal error details
    if (sanitized.includes("ENOTFOUND") || sanitized.includes("ECONNREFUSED")) {
      return "Unable to connect to server. Please check your connection.";
    }

    return sanitized;
  }

  _getStoredAttempts() {
    try {
      const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}

const securityPolicies = new SecurityPolicies();
export default securityPolicies;
