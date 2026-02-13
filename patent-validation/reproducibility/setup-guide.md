# Patent Validation — Setup Guide

> **Version:** 1.0.0  
> **Last Updated:** 2026-02-13  
> **Author:** APEX Business Systems  
> **Status:** Production Ready

---

## Prerequisites

| Requirement             | Version      | Required                               |
| ----------------------- | ------------ | -------------------------------------- |
| Node.js                 | ≥ 20.x (LTS) | ✅ Yes                                 |
| npm                     | ≥ 10.x       | ✅ Yes                                 |
| Git                     | Latest       | ✅ Yes (commit hash tracking)          |
| Docker + Docker Compose | Latest       | ⬜ Optional (isolated reproducibility) |
| pandoc + xelatex        | Latest       | ⬜ Optional (PDF report generation)    |

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd APEX-OmniHub
npm ci

# 2. Run all patent claim validations
npm run validate:patent-claims

# 3. Generate legal package (after tests pass)
npm run validate:generate-legal-package

# 4. Or run everything in one command
sh patent-validation/master-command.sh
```

## Run Individual Claims

```bash
npm run validate:claim-1   # Claim 1: Tri-Force Protocol
npm run validate:claim-2   # Claim 2: Trinity Integration
npm run validate:claim-3   # Claim 3: Cyber-Physical Security
npm run validate:claim-4   # Claim 4: Temporal Workflows
npm run validate:claim-5   # Claim 5: Deterministic Execution
```

## Docker (Isolated Environment)

For reproducible execution in a clean environment:

```bash
cd patent-validation/reproducibility
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Output Structure

After execution, evidence artifacts are generated in the following locations:

| Path                                                       | Contents                               |
| ---------------------------------------------------------- | -------------------------------------- |
| `patent-validation/claims/0{1-5}-*/results-*.json`         | Timestamped test evidence with SHA-256 |
| `patent-validation/claims/0{1-5}-*/metrics.json`           | Performance metrics per claim          |
| `patent-validation/legal-package/chain-of-custody.html`    | SHA-256 manifest + attestation         |
| `patent-validation/legal-package/expert-witness-data.json` | Raw methodology + file catalog         |
| `patent-validation/validation-summary.json`                | Aggregate pass/fail results            |
| `evidence/master-log.jsonl`                                | Append-only evidence log               |

## Verification

Confirm SHA-256 integrity of any evidence file:

```bash
# Linux/macOS
shasum -a 256 patent-validation/claims/01-triforce-protocol/results-*.json

# Windows (PowerShell)
Get-FileHash patent-validation\claims\01-triforce-protocol\results-*.json -Algorithm SHA256
```

Compare output against the `cryptoHash` field inside each JSON file.

## Troubleshooting

| Issue                  | Resolution                                                   |
| ---------------------- | ------------------------------------------------------------ |
| `DATABASE_URL` not set | Tests skip DB-dependent assertions with WARNING              |
| pandoc not found       | Legal package generates HTML only (PDF skipped)              |
| Timeout after 30min    | Partial results saved; check `validation-summary.json`       |
| Node.js < 20           | Upgrade: `nvm install 20 && nvm use 20`                      |
| `No test files found`  | Ensure `vitest.config.patent.ts` root points to project root |

---

## Revision History

| Version | Date       | Author                | Changes         |
| ------- | ---------- | --------------------- | --------------- |
| 1.0.0   | 2026-02-13 | APEX Business Systems | Initial release |

---

**© 2026 APEX Business Systems. All rights reserved.**
