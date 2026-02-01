# Security Documentation - OmniHub Local Agents

## Overview

This directory contains Python scripts for local agent integration with OmniHub. This document addresses security considerations and explains design decisions.

## SonarQube Security Hotspot: PRNG Usage

### Issue: python:S2245 - Using pseudorandom number generators (PRNGs) is security-sensitive

**Location:** `apex_sales_agent.py` lines 59, 82

**Status:** ✅ SAFE - Reviewed and approved for the following reasons:

### Why This Is Safe

1. **Simulation/Demo Context Only**
   - The PRNG (`random.random()`) is used **exclusively** to simulate realistic call outcome distributions
   - This is test/demo code, not production business logic
   - Real production deployments would integrate with actual telephony systems that provide real outcomes

2. **No Security-Sensitive Operations**
   - NOT used for cryptographic operations (token generation, key derivation, etc.)
   - NOT used for authentication or authorization decisions
   - NOT used for generating idempotency keys (those use `uuid.uuid4()` or timestamps)
   - NOT used for session management or access control

3. **Explicit Documentation**
   - Module docstring clearly states this is simulation code
   - Inline comments at each usage explain the context
   - `# nosec` markers suppress false-positive security scanner warnings

4. **Deterministic vs. Unpredictable**
   - Call outcome simulation doesn't require cryptographic randomness
   - Predictability is acceptable (and even desirable for reproducible testing)
   - The purpose is to generate statistically distributed test data, not unpredictable secrets

### What Would Require `secrets` Module

If any of the following were true, we would use `secrets.SystemRandom()` instead:

- ❌ Generating API keys, tokens, or session IDs
- ❌ Generating idempotency keys (we use UUID4 instead)
- ❌ Cryptographic nonces or initialization vectors
- ❌ Password salts or authentication challenges
- ❌ CSRF tokens or security-sensitive random values

### Production Replacement Path

When moving from simulation to production:

```python
# BEFORE (simulation):
if random.random() < 0.7:  # Simulate 70% connection rate
    self.handle_connected(lead_id, phone)

# AFTER (production):
outcome = telephony_system.dial(phone_number)
if outcome.status == TelephonyStatus.CONNECTED:
    self.handle_connected(lead_id, phone)
```

No cryptographic randomness needed in either case - the randomness comes from real-world call outcomes.

## API Key Security

### Proper Secrets Management

✅ **Correct practices implemented:**

1. **Environment Variables**
   - API keys loaded from `OMNIHUB_API_KEY` environment variable
   - Never hardcoded in source code
   - `.env.example` provided without real values

2. **Idempotency Keys**
   - Use `uuid.uuid4()` (cryptographically strong PRNG via OS urandom)
   - Format: `{source}:{event_type}:{uuid4}`
   - Server-side enforcement prevents replay attacks

3. **Transport Security**
   - All communication over HTTPS (TLS 1.2+)
   - API keys transmitted in `Authorization: Bearer` header
   - Server validates keys against hashed database records

## Input Validation

### Server-Side Enforcement

All security-critical validation happens server-side in OmniLink Port:

1. **Authentication**
   - API key validation via Supabase auth
   - Integration/tenant ID derived from validated key (never from request body)

2. **Authorization**
   - Scope checks (`events:write`, `tasks:claim`, etc.)
   - Emergency kill-switch (`OMNILINK_ENABLED=false`)

3. **Data Validation**
   - Payload size limits (max 1MB per event, 16KB per task output)
   - Schema validation for event types and task parameters
   - Idempotency enforcement via database constraints

### Client-Side (Local Agents)

Local agents perform basic input sanitization:

- Retry logic with exponential backoff (prevents accidental DoS)
- Bounded payload sizes (output truncated to 16KB)
- Structured logging (no sensitive data in logs)

## Threat Model

### In Scope

✅ Protections implemented:

- API key compromise → Revocation via OmniDash UI
- Network interception → TLS encryption mandatory
- Replay attacks → Idempotency key uniqueness constraint
- Privilege escalation → Tenant ID from auth context only
- Rate limiting → Server-side enforcement per API key

### Out of Scope

This is a **local agent integration**, not a public API:

- Local agents run on trusted machines within operator's infrastructure
- No multi-tenancy isolation needed (each agent has its own API key)
- No user-generated code execution (handlers are static, not dynamic)

## Compliance Notes

### OWASP Top 10 (2021)

- **A01:2021 – Broken Access Control** → Mitigated via API key scopes + tenant derivation
- **A02:2021 – Cryptographic Failures** → API keys via env vars, TLS in transit
- **A03:2021 – Injection** → Parameterized SQL queries, no eval() or exec()
- **A04:2021 – Insecure Design** → Single-front-door discipline enforced
- **A05:2021 – Security Misconfiguration** → Kill-switch available, minimal attack surface
- **A07:2021 – Identification and Authentication Failures** → Bearer token auth with revocation
- **A08:2021 – Software and Data Integrity Failures** → Idempotency prevents replay
- **A09:2021 – Security Logging and Monitoring Failures** → Audit logs in `omnilink_events`

### CWE-330: Use of Insufficiently Random Values

**Finding:** `random.random()` used for non-cryptographic simulation

**Assessment:** Not applicable - no security decisions based on PRNG output

**Remediation:** N/A (already safe for intended use case)

## Security Review Checklist

For security auditors reviewing this code:

- [x] API keys stored in environment variables (not hardcoded)
- [x] HTTPS/TLS required for all API communication
- [x] PRNG usage limited to simulation/testing (not security-sensitive)
- [x] Idempotency keys use cryptographically strong UUID4
- [x] Server-side validation for all inputs
- [x] Tenant isolation via API key authentication
- [x] Emergency kill-switch available (OMNILINK_ENABLED=false)
- [x] No direct database access from local agents
- [x] Structured logging without sensitive data
- [x] Retry logic with bounded exponential backoff

## Contact

For security concerns or vulnerability reports:

- Review emergency controls: `supabase/migrations/20260103000000_create_emergency_controls.sql`
- Kill-switch documentation: `local-agents/README.md` (Rollback section)
- Architecture docs: `TECHNICAL_ARCHITECTURE_SPEC_WITH_WORKFLOW.md`

Last reviewed: 2026-02-01
