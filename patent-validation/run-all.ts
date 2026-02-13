/**
 * PATENT VALIDATION — Run All Claims
 *
 * @version 1.0.0
 * @date    2026-02-13
 * @author  APEX Business Systems
 * @license Proprietary — All Rights Reserved
 *
 * Orchestrator script that executes all 5 patent claim test suites,
 * enforces the 30-minute timeout, and generates a summary report.
 *
 * Usage: tsx patent-validation/run-all.ts
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MAX_RUNTIME_MS = 30 * 60 * 1000; // 30 minutes
const startTime = Date.now();

const CLAIMS = [
  { num: 1, name: 'triforce-protocol' },
  { num: 2, name: 'trinity-integration' },
  { num: 3, name: 'cyber-physical-security' },
  { num: 4, name: 'temporal-workflows' },
  { num: 5, name: 'deterministic-execution' },
];

interface ClaimResult {
  claimNumber: number;
  claimName: string;
  status: 'PASSED' | 'FAILED' | 'TIMEOUT' | 'SKIPPED';
  durationMs: number;
  error?: string;
}

const results: ClaimResult[] = [];
let hasFailure = false;

console.log('═══════════════════════════════════════════════════════════');
console.log('  APEX OmniHub — Patent Validation Suite');
console.log(`  Started: ${new Date().toISOString()}`);
console.log('═══════════════════════════════════════════════════════════\n');

for (const claim of CLAIMS) {
  const elapsed = Date.now() - startTime;
  if (elapsed > MAX_RUNTIME_MS) {
    console.error(`\nTIMEOUT: Execution exceeded 30min limit at ${new Date().toISOString()}`);
    console.error(`Completed claims: ${results.filter(r => r.status === 'PASSED').map(r => r.claimNumber).join(', ')}`);
    console.error(`Pending: ${CLAIMS.filter(c => !results.find(r => r.claimNumber === c.num)).map(c => c.num).join(', ')}`);

    // Mark remaining as timeout
    for (const remaining of CLAIMS) {
      if (!results.find(r => r.claimNumber === remaining.num)) {
        results.push({
          claimNumber: remaining.num,
          claimName: remaining.name,
          status: 'TIMEOUT',
          durationMs: 0,
        });
      }
    }
    hasFailure = true;
    break;
  }

  const claimStart = Date.now();
  const paddedNum = String(claim.num).padStart(2, '0');
  const claimDir = `patent-validation/claims/${paddedNum}-${claim.name}/`;

  console.log(`\n▶ Claim ${claim.num}: ${claim.name}`);
  console.log(`  Directory: ${claimDir}`);

  try {
    execSync(
      `npx vitest run --config patent-validation/vitest.config.patent.ts ${claimDir}`,
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        timeout: 5 * 60 * 1000, // 5 minutes per claim
        env: {
          ...process.env,
          CLAIM_NUMBER: String(claim.num),
          CLAIM_NAME: claim.name,
        },
      }
    );

    const durationMs = Date.now() - claimStart;
    results.push({
      claimNumber: claim.num,
      claimName: claim.name,
      status: 'PASSED',
      durationMs,
    });
    console.log(`  ✅ PASSED (${(durationMs / 1000).toFixed(1)}s)`);
  } catch (error) {
    const durationMs = Date.now() - claimStart;
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({
      claimNumber: claim.num,
      claimName: claim.name,
      status: 'FAILED',
      durationMs,
      error: errorMsg,
    });
    hasFailure = true;
    console.error(`  ❌ FAILED (${(durationMs / 1000).toFixed(1)}s)`);
  }
}

// ============================================================================
// SUMMARY
// ============================================================================
const totalDuration = Date.now() - startTime;

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  VALIDATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════');

for (const result of results) {
  const icon = result.status === 'PASSED' ? '✅' : result.status === 'TIMEOUT' ? '⏰' : '❌';
  console.log(`  ${icon} Claim ${result.claimNumber}: ${result.claimName} — ${result.status} (${(result.durationMs / 1000).toFixed(1)}s)`);
}

console.log(`\n  Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
console.log(`  Completed: ${new Date().toISOString()}`);
console.log('═══════════════════════════════════════════════════════════\n');

// Write summary JSON
const summaryPath = path.join(process.cwd(), 'patent-validation', 'validation-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  totalDurationMs: totalDuration,
  results,
  allPassed: !hasFailure,
}, null, 2));

if (hasFailure) {
  const failedClaims = results.filter(r => r.status !== 'PASSED');
  console.error(`VALIDATION INCOMPLETE: ${failedClaims.length} claim(s) did not pass.`);
  for (const fc of failedClaims) {
    console.error(`  CLAIM ${fc.claimNumber} ${fc.status}: ${fc.error ?? 'See logs'}`);
  }
  process.exit(1);
}

console.log('ALL CLAIMS VALIDATED SUCCESSFULLY.');
process.exit(0);
