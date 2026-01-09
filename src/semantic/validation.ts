/**
 * Semantic Translator Runtime Validation
 * Zero-dependency TypeScript type guards for CanonicalEvent validation
 */

import { CanonicalEvent, Locale, LOCALES, ValidationResult, ValidationError, EventType } from './types';
import { ConsentType } from '../omniconnect/types/canonical';

/**
 * Type guard for Locale validation
 */
export function isValidLocale(value: any): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale);
}

/**
 * Type guard for EventType validation
 */
export function isValidEventType(value: any): value is EventType {
  return typeof value === 'string' && Object.values(EventType).includes(value as EventType);
}

/**
 * Type guard for UUID validation
 */
export function isValidUUID(value: any): boolean {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Type guard for ISO 8601 timestamp validation
 */
export function isValidTimestamp(value: any): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
}

/**
 * Type guard for consent flags validation
 */
export function isValidConsentFlags(value: any): boolean {
  if (typeof value !== 'object' || value === null) return false;

  const validKeys = Object.values(ConsentType);
  for (const key of Object.keys(value)) {
    if (!validKeys.includes(key as ConsentType)) return false;
    if (typeof value[key] !== 'boolean') return false;
  }
  return true;
}

/**
 * Comprehensive CanonicalEvent validation
 */
export function validateCanonicalEvent(event: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Required string fields
  const requiredStringFields = [
    'eventId', 'correlationId', 'tenantId', 'userId',
    'source', 'provider', 'externalId', 'timestamp'
  ];

  for (const field of requiredStringFields) {
    if (typeof event[field] !== 'string' || !event[field].trim()) {
      errors.push({
        field,
        message: `${field} must be a non-empty string`,
        code: 'INVALID_STRING'
      });
    }
  }

  // UUID validations
  const uuidFields = ['eventId', 'correlationId', 'tenantId', 'userId'];
  for (const field of uuidFields) {
    if (event[field] && !isValidUUID(event[field])) {
      errors.push({
        field,
        message: `${field} must be a valid UUID`,
        code: 'INVALID_UUID'
      });
    }
  }

  // Timestamp validation
  if (event.timestamp && !isValidTimestamp(event.timestamp)) {
    errors.push({
      field: 'timestamp',
      message: 'timestamp must be a valid ISO 8601 string',
      code: 'INVALID_TIMESTAMP'
    });
  }

  // Locale validation
  if (!isValidLocale(event.locale)) {
    errors.push({
      field: 'locale',
      message: `locale must be one of: ${LOCALES.join(', ')}`,
      code: 'INVALID_LOCALE'
    });
  }

  // EventType validation
  if (!isValidEventType(event.eventType)) {
    errors.push({
      field: 'eventType',
      message: `eventType must be a valid EventType enum value`,
      code: 'INVALID_EVENT_TYPE'
    });
  }

  // Consent flags validation
  if (!isValidConsentFlags(event.consentFlags)) {
    errors.push({
      field: 'consentFlags',
      message: 'consentFlags must be an object with valid ConsentType keys and boolean values',
      code: 'INVALID_CONSENT_FLAGS'
    });
  }

  // Object validations
  const requiredObjectFields = ['metadata', 'payload'];
  for (const field of requiredObjectFields) {
    if (typeof event[field] !== 'object' || event[field] === null || Array.isArray(event[field])) {
      errors.push({
        field,
        message: `${field} must be a non-null object`,
        code: 'INVALID_OBJECT'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Type guard for CanonicalEvent
 */
export function isCanonicalEvent(event: any): event is CanonicalEvent {
  return validateCanonicalEvent(event).valid;
}

/**
 * Assert function for CanonicalEvent (throws on invalid)
 */
export function assertCanonicalEvent(event: any): asserts event is CanonicalEvent {
  const result = validateCanonicalEvent(event);
  if (!result.valid) {
    throw new Error(`Invalid CanonicalEvent: ${result.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
  }
}

/**
 * Validate translation request
 */
export function validateTranslationRequest(request: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!request.tenantId || !isValidUUID(request.tenantId)) {
    errors.push({
      field: 'tenantId',
      message: 'tenantId must be a valid UUID',
      code: 'INVALID_TENANT_ID'
    });
  }

  if (!request.idempotencyKey || typeof request.idempotencyKey !== 'string') {
    errors.push({
      field: 'idempotencyKey',
      message: 'idempotencyKey must be a non-empty string',
      code: 'INVALID_IDEMPOTENCY_KEY'
    });
  }

  if (!request.source || typeof request.source !== 'string') {
    errors.push({
      field: 'source',
      message: 'source must be a non-empty string',
      code: 'INVALID_SOURCE'
    });
  }

  if (!request.eventData || typeof request.eventData !== 'object') {
    errors.push({
      field: 'eventData',
      message: 'eventData must be an object',
      code: 'INVALID_EVENT_DATA'
    });
  }

  // Optional locale validation
  if (request.locale !== undefined && !isValidLocale(request.locale)) {
    errors.push({
      field: 'locale',
      message: `locale must be one of: ${LOCALES.join(', ')}`,
      code: 'INVALID_LOCALE'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize and normalize CanonicalEvent
 */
export function sanitizeCanonicalEvent(event: any): CanonicalEvent | null {
  try {
    // Create a clean copy
    const sanitized = { ...event };

    // Normalize strings
    const stringFields = ['eventId', 'correlationId', 'tenantId', 'userId', 'source', 'provider', 'externalId'];
    for (const field of stringFields) {
      if (sanitized[field]) {
        sanitized[field] = String(sanitized[field]).trim();
      }
    }

    // Ensure locale is valid, default to 'en'
    if (!isValidLocale(sanitized.locale)) {
      sanitized.locale = 'en';
    }

    // Ensure objects exist
    if (!sanitized.metadata || typeof sanitized.metadata !== 'object') {
      sanitized.metadata = {};
    }
    if (!sanitized.payload || typeof sanitized.payload !== 'object') {
      sanitized.payload = {};
    }

    // Ensure consentFlags exist
    if (!isValidConsentFlags(sanitized.consentFlags)) {
      sanitized.consentFlags = {};
    }

    // Validate final result
    if (isCanonicalEvent(sanitized)) {
      return sanitized;
    }

    return null;
  } catch (error) {
    return null;
  }
}