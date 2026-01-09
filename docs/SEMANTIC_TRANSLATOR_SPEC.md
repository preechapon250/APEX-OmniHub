# SEMANTIC TRANSLATOR SPECIFICATION

**Version:** 1.0.0
**Date:** January 9, 2026
**Status:** PRODUCTION DEPLOYED
**Classification:** INTERNAL - TECHNICAL SPECIFICATION

## OVERVIEW

The Semantic Translator Core provides a universal adapter for canonical event translation with atomic idempotency and multi-language voice hardening. This specification defines the complete architecture for zero-drift semantic translation.

## ARCHITECTURAL COMPONENTS

### 1. CANONICAL EVENT SCHEMA

```typescript
interface CanonicalEvent {
  eventId: string;
  correlationId: string;
  tenantId: string;
  userId: string;
  source: string;
  provider: string;
  externalId: string;
  eventType: EventType;
  timestamp: string;
  locale: Locale; // NEW: Strictly typed locale field
  consentFlags: ConsentFlags;
  metadata: Record<string, any>;
  payload: Record<string, any>;
}
```

**Locale Type Definition:**
```typescript
type Locale = 'en' | 'es' | 'de' | 'ja' | 'fr' | 'pt' | 'it';
```

### 2. ATOMIC IDEMPOTENCY SCHEMA

**Table: `translation_receipts`**
```sql
CREATE TABLE translation_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  result JSONB,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, idempotency_key, source)
);

-- Performance index for active translations
CREATE INDEX idx_translation_active
ON public.translation_receipts (tenant_id, idempotency_key, source)
WHERE status IN ('PENDING', 'PROCESSING');

-- Enable RLS
ALTER TABLE translation_receipts ENABLE ROW LEVEL SECURITY;

-- Service role only policy
CREATE POLICY "Service role access only" ON translation_receipts
FOR ALL USING (auth.role() = 'service_role');
```

### 3. I18N ENGINE SPECIFICATION

**Core Requirements:**
- Zero-dependency TypeScript implementation
- React Store (Zustand or Context) for state management
- Strictly typed dictionaries with fallback support
- Supported locales: `en`, `es`, `de`, `ja`, `fr`, `pt`, `it`

**API Contract:**
```typescript
export const LOCALES = ['en', 'es', 'de', 'ja', 'fr', 'pt', 'it'] as const;
export type Locale = typeof LOCALES[number];

export interface I18nDictionary {
  [key: string]: string | I18nDictionary;
}

export interface UseI18nReturn {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, any>) => string;
  dictionaries: Record<Locale, I18nDictionary>;
}

export declare function useI18n(): UseI18nReturn;
```

### 4. VOICE INTERFACE INTEGRATION

**WebSocket URL Pattern:**
```
wss://api.apex-omnilink.com/voice?lang=${currentLocale}
```

**Cleanup Requirements:**
```typescript
// Strict cleanup function called on:
// 1. Component unmount
// 2. Language change
function cleanup(): void {
  if (recorder) {
    recorder.stop();
    recorder = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
}
```

### 5. EDGE FUNCTION SPECIFICATIONS

#### Semantic Translator (`/supabase/functions/semantic-translator/index.ts`)

**Endpoint:** `POST /semantic-translator`
**Atomic Lock Pattern:**
```sql
INSERT INTO translation_receipts (tenant_id, idempotency_key, source, status)
VALUES ($1, $2, $3, 'PENDING')
ON CONFLICT (tenant_id, idempotency_key, source) DO NOTHING
RETURNING id;
```

**Response Logic:**
- If row exists: Return cached result
- If new row: Process translation → Update status to COMPLETED

#### Web3 Verify Enhancement (`/supabase/functions/web3-verify/index.ts`)

**New typedData Support:**
```typescript
import { verifyTypedData } from 'viem';

// Support both personal_sign and typedData
interface Web3VerifyRequest {
  wallet_address: string;
  signature: string;
  message?: string;        // For personal_sign
  typedData?: TypedData;   // For EIP-712
  domain?: any;
  types?: any;
  primaryType?: string;
}
```

#### Voice Function (`/supabase/functions/apex-voice/index.ts`)

**Language Parameter:**
```typescript
// Read lang from query params
const lang = new URL(req.url).searchParams.get('lang') || 'en';

// Inject language-specific system prompt
const systemPrompt = `You are APEX. Be concise and professional. Speak only in ${LANGUAGE_NAMES[lang]}.`;
```

### 6. METADATA SPECIFICATIONS

#### JSON-LD Context (`/src/semantic/contexts/event.jsonld`)
```json
{
  "@context": {
    "@version": 1.1,
    "eventId": "https://apex-omnilink.com/vocab#eventId",
    "correlationId": "https://apex-omnilink.com/vocab#correlationId",
    "tenantId": "https://apex-omnilink.com/vocab#tenantId",
    "userId": "https://apex-omnilink.com/vocab#userId",
    "locale": {
      "@id": "https://apex-omnilink.com/vocab#locale",
      "@type": "xsd:string",
      "@pattern": "^(en|es|de|ja|fr|pt|it)$"
    },
    "eventType": "https://apex-omnilink.com/vocab#eventType",
    "timestamp": {
      "@id": "https://apex-omnilink.com/vocab#timestamp",
      "@type": "xsd:dateTime"
    }
  }
}
```

#### OpenAPI Specification (`/src/semantic/openapi/translator.yaml`)
```yaml
openapi: 3.1.0
info:
  title: Semantic Translator API
  version: 1.0.0
servers:
  - url: https://api.apex-omnilink.com
paths:
  /semantic-translator:
    post:
      summary: Translate event to canonical format
      operationId: translateEvent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TranslationRequest'
      responses:
        '200':
          description: Translation successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TranslationResponse'
```

## IMPLEMENTATION SEQUENCE

### Phase 1: Core Infrastructure (CRITICAL)
1. Create `translation_receipts` migration
2. Update `CanonicalEvent` with `locale` field
3. Implement runtime validation system

### Phase 2: I18N & Voice (HIGH)
4. Create i18n engine with React Store
5. Refactor VoiceInterface with i18n integration and cleanup
6. Add language parameter to apex-voice function

### Phase 3: Edge Functions (MEDIUM)
7. Implement semantic-translator with atomic locks
8. Add typedData support to web3-verify
9. Generate JSON-LD and OpenAPI metadata

## VERIFICATION CHECKLIST

### Database
- [ ] `translation_receipts` table exists with constraints
- [ ] RLS enabled, service role only
- [ ] Performance index created

### Semantic Core
- [ ] `CanonicalEvent` includes `locale: Locale` field
- [ ] Runtime validation implemented
- [ ] JSON-LD context generated
- [ ] OpenAPI spec created

### I18N Engine
- [ ] `useI18n` hook exported
- [ ] `LOCALES` constant exported
- [ ] Type-safe dictionary fallback
- [ ] React Store implementation

### Voice Interface
- [ ] Imports `useI18n` hook
- [ ] WebSocket URL includes `?lang=${locale}`
- [ ] `cleanup()` function implemented
- [ ] Cleanup called on unmount and language change

### Edge Functions
- [ ] `semantic-translator` implements atomic lock pattern
- [ ] `web3-verify` supports typedData verification
- [ ] `apex-voice` reads language parameter

### Testing
- [ ] `npm run typecheck` passes
- [ ] All files exist in `src/semantic/`
- [ ] VoiceInterface imports verified

## DEPLOYMENT NOTES

- All changes are backward compatible
- Zero downtime deployment possible
- Database migration is additive only
- Feature flags can control rollout if needed

## SECURITY CONSIDERATIONS

- Atomic idempotency prevents race conditions
- Service role only access to translation receipts
- Input validation on all locale parameters
- WebSocket connections properly cleaned up
- EIP-712 verification for enhanced security

---

**END OF SPECIFICATION**