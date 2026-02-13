# APEX OmniHub — Patent Validation Suite

> **Version:** 1.0.0  
> **Date:** 2026-02-13  
> **Author:** APEX Business Systems  
> **Classification:** Confidential — Attorney Work Product  
> **License:** Proprietary — All Rights Reserved

---

## Overview

The Patent Validation Suite provides automated, reproducible evidence for **five patent claims** covering the APEX OmniHub cyber-physical orchestration system. Each claim is validated through deterministic tests that produce cryptographically-hashed JSON evidence, suitable for legal proceedings and patent prosecution.

## Architecture

```
patent-validation/
├── README.md                          ← This document
├── vitest.config.patent.ts            ← Isolated test configuration
├── evidence-utils.ts                  ← SHA-256 evidence generation library
├── run-all.ts                         ← Orchestrator (30-minute timeout)
├── generate-legal-package.ts          ← Chain-of-custody & manifest generator
├── master-command.sh                  ← Single-line execution script
├── claims/
│   ├── 01-triforce-protocol/          ← Claim 1: Guardian, Planner, Executor
│   │   └── test.spec.ts
│   ├── 02-trinity-integration/        ← Claim 2: E2E Flow, Latency, Rollback
│   │   └── test.spec.ts
│   ├── 03-cyber-physical-security/    ← Claim 3: Spoofing, Biometric, Enclave
│   │   └── test.spec.ts
│   ├── 04-temporal-workflows/         ← Claim 4: MAN Mode, Saga, Idempotency
│   │   └── test.spec.ts
│   └── 05-deterministic-execution/    ← Claim 5: Audit, Replay, Atomicity
│       └── test.spec.ts
├── legal-package/                     ← Generated: chain-of-custody, manifest
├── reproducibility/
│   ├── docker-compose.test.yml        ← Docker-based execution
│   └── setup-guide.md                 ← Step-by-step instructions
└── validation-summary.json            ← Generated: aggregate results
```

## Patent Claims Covered

| #   | Claim                       | Module Under Test                     | Key Assertions                                                                       |
| --- | --------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | **Tri-Force Protocol**      | `promptDefense.ts`, `chaos-engine.ts` | 100% prompt injection block rate, 1000× deterministic planning, zero-gap audit chain |
| 2   | **Trinity Integration**     | `contracts.ts`, `chaos-engine.ts`     | E2E flow tracing (50 flows), latency overhead <10%, rollback compensation            |
| 3   | **Cyber-Physical Security** | `security.ts`, `biometric-auth.ts`    | 100 spoofed HMAC-SHA256 rejections, biometric attack blocking, enclave attestation   |
| 4   | **Temporal Workflows**      | `idempotency.ts`, `chaos-engine.ts`   | MAN mode approval gates, saga compensation, idempotency proof                        |
| 5   | **Deterministic Execution** | `chaos-engine.ts`, `idempotency.ts`   | 100-workflow audit completeness, 10× replay determinism, cross-system atomicity      |

## Quick Start

```bash
# Install dependencies
npm ci

# Run all 5 claims
npm run validate:patent-claims

# Run individual claim
npm run validate:claim-1

# Generate legal package (after tests pass)
npm run validate:generate-legal-package

# One-shot: run everything
sh patent-validation/master-command.sh
```

## Evidence Output

Each test produces:

- **`results-{epoch}.json`** — Timestamped evidence with SHA-256 integrity hash
- **`metrics.json`** — Performance metrics, pass/fail counts, variance
- **`evidence/master-log.jsonl`** — Append-only audit trail (JSONL format)

The legal package generator produces:

- **`chain-of-custody.html`** — Formal attestation with SHA-256 manifest
- **`expert-witness-data.json`** — Methodology and file catalog for expert review

## Technology Stack

| Component  | Version  | Purpose                                          |
| ---------- | -------- | ------------------------------------------------ |
| Vitest     | 4.0.x    | Test runner (isolated pool, 5-min timeout/claim) |
| TypeScript | ES2022   | Strict mode, ESM imports                         |
| Node.js    | ≥ 20.x   | Runtime (SHA-256, crypto module)                 |
| Docker     | Optional | Reproducible isolated environment                |

## Configuration

The suite uses `vitest.config.patent.ts` which:

- Sets `environment: 'node'` (no DOM required)
- Sets `testTimeout: 300_000` (5 minutes per test file)
- Uses `pool: 'forks'` for process isolation
- Resolves `@` alias to `src/` for consistent imports

## Versioning

| Version | Date       | Changes                                                      |
| ------- | ---------- | ------------------------------------------------------------ |
| 1.0.0   | 2026-02-13 | Initial release — 5 claims, evidence pipeline, legal package |

---

**© 2026 APEX Business Systems. All rights reserved.**  
Patent-pending technology. Unauthorized reproduction prohibited.
