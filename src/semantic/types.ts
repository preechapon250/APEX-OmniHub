/**
 * Semantic Translator Core Types
 * Defines the canonical event schema with locale support
 */

export const LOCALES = ['en', 'es', 'de', 'ja', 'fr', 'pt', 'it'] as const;
export type Locale = typeof LOCALES[number];

export interface CanonicalEvent {
  /** Unique event identifier */
  eventId: string;

  /** Correlation ID for tracing end-to-end */
  correlationId: string;

  /** Tenant isolation */
  tenantId: string;

  /** User isolation */
  userId: string;

  /** Data source identifier */
  source: string;

  /** Provider name (meta_business, linkedin, twitter, etc.) */
  provider: string;

  /** External system identifier */
  externalId: string;

  /** Standardized event type */
  eventType: EventType;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** Strictly typed locale field for internationalization */
  locale: Locale;

  /** User consent flags */
  consentFlags: ConsentFlags;

  /** Provider-specific metadata */
  metadata: Record<string, any>;

  /** Standardized payload */
  payload: Record<string, any>;
}

// Re-export event types from canonical schema
export {
  EventType,
  ConsentType,
  ConsentFlags,
  EventEnvelope
} from '../omniconnect/types/canonical';

// Translation request/response types
export interface TranslationRequest {
  tenantId: string;
  idempotencyKey: string;
  source: string;
  eventData: Record<string, any>;
  locale?: Locale;
  metadata?: Record<string, any>;
}

export interface TranslationResponse {
  success: boolean;
  event?: CanonicalEvent;
  cached?: boolean;
  processingTime?: number;
  error?: string;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Atomic lock types
export interface AtomicLockResult {
  id: string;
  status: TranslationStatus;
  created: boolean;
}

export type TranslationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';