/**
 * phoneNormalizer — Centralized, Africa-first phone number normalization.
 *
 * Normalizes local-format phone numbers into E.164 (+<countrycode><number>)
 * using a country-context hint rather than assuming Kenya for every number.
 *
 * Usage:
 *   normalizePhone('0712345678', 'KE')  → '+254712345678'
 *   normalizePhone('0712345678')        → '+254712345678' (defaultCountry fallback)
 *   normalizePhone('+256712345678')     → '+256712345678' (already E.164, passthrough)
 *
 * @module utils/phoneNormalizer
 */

'use strict';

// Country dial codes for Nile Flow's current/expansion markets.
// national trunk prefix ('0') is stripped before prepending the dial code.
const COUNTRY_DIAL_CODES = Object.freeze({
  KE: '254', // Kenya
  UG: '256', // Uganda
  SS: '211', // South Sudan
  TZ: '255', // Tanzania
  RW: '250', // Rwanda
  NG: '234', // Nigeria
  GH: '233', // Ghana
});

const DEFAULT_COUNTRY = 'KE';

/**
 * Normalize a phone number to E.164 format.
 *
 * @param {string} phone            — Raw phone number (local or international)
 * @param {string} [countryHint]    — ISO2 country code (e.g. 'KE', 'UG') used when the
 *                                     number is in local/national format (starts with 0
 *                                     or has no country code at all).
 * @returns {string} — E.164 formatted number (e.g. '+254712345678'), or '' if the
 *                      number cannot be confidently normalized.
 */
function normalizePhone(phone, countryHint) {
  const raw = String(phone || '').trim();
  if (!raw) return '';

  const digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return '';

  // Already in E.164 form (+ followed by 8-15 digits)
  if (digits.startsWith('+')) {
    return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : '';
  }

  const dialCode = COUNTRY_DIAL_CODES[countryHint] || COUNTRY_DIAL_CODES[DEFAULT_COUNTRY];

  // National format with trunk prefix, e.g. 0712345678
  let national = digits;
  if (national.startsWith('0')) {
    national = national.slice(1);
  } else if (national.startsWith(dialCode)) {
    // Number already includes the dial code but is missing the '+'
    return /^\+?[1-9]\d{7,14}$/.test(`+${national}`) ? `+${national}` : '';
  }

  const candidate = `+${dialCode}${national}`;
  return /^\+[1-9]\d{7,14}$/.test(candidate) ? candidate : '';
}

/**
 * Check whether a phone number can be normalized to a valid E.164 number.
 */
function isValidPhone(phone, countryHint) {
  return normalizePhone(phone, countryHint) !== '';
}

module.exports = { normalizePhone, isValidPhone, COUNTRY_DIAL_CODES, DEFAULT_COUNTRY };
