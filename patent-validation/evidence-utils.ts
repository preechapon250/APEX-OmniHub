/**
 * PATENT VALIDATION — Evidence Generation Utilities
 *
 * @version 1.0.0
 * @date    2026-02-13
 * @author  APEX Business Systems
 * @license Proprietary — All Rights Reserved
 *
 * Provides cryptographically-hashed, timestamped evidence output
 * for each patent claim test. All evidence files include:
 * - ISO-8601 timestamps with milliseconds
 * - SHA-256 digest for tamper detection
 * - Structured JSON for legal admissibility
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// TYPES
// ============================================================================

export interface EvidencePayload {
  timestamp: string;
  testName: string;
  claimNumber: number;
  claimName: string;
  data: unknown;
  version: {
    node: string;
    vitest: string;
    platform: string;
  };
  cryptoHash: string;
}

export interface MetricsPayload {
  $schema: string;
  claimNumber: number;
  claimName: string;
  timestamp: string;
  executionTimeMs: number;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  variance: number;
  evidenceFiles: string[];
}

// ============================================================================
// EVIDENCE GENERATION
// ============================================================================

/**
 * Generate timestamped, SHA-256-hashed evidence for a test.
 * Writes `results-{epoch}.json` in the claim directory and
 * appends to `evidence/master-log.jsonl` in the project root.
 */
export function generateEvidence(
  testName: string,
  claimNumber: number,
  claimName: string,
  data: unknown,
  claimDir?: string
): EvidencePayload {
  const payload = {
    timestamp: new Date().toISOString(),
    testName,
    claimNumber,
    claimName,
    data,
    version: {
      node: process.version,
      vitest: '4.0.16',
      platform: process.platform,
    },
  };

  // SHA-256 hash for tamper detection
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');

  const evidence: EvidencePayload = { ...payload, cryptoHash: hash };

  // Determine output directory
  const outputDir = claimDir ?? process.cwd();
  const epoch = Date.now();
  const filename = `results-${epoch}.json`;
  const filePath = path.join(outputDir, filename);

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write timestamped evidence file
  fs.writeFileSync(filePath, JSON.stringify(evidence, null, 2));

  // Append to master log (JSONL format)
  const masterLogDir = path.join(process.cwd(), 'evidence');
  if (!fs.existsSync(masterLogDir)) {
    fs.mkdirSync(masterLogDir, { recursive: true });
  }
  const masterLogPath = path.join(masterLogDir, 'master-log.jsonl');
  fs.appendFileSync(masterLogPath, JSON.stringify(evidence) + '\n');

  return evidence;
}

// ============================================================================
// METRICS GENERATION
// ============================================================================

/**
 * Write metrics.json for a claim directory.
 * Conforms to JSON Schema v7 structure.
 */
export function writeMetrics(
  claimDir: string,
  claimNumber: number,
  claimName: string,
  executionTimeMs: number,
  testsRun: number,
  testsPassed: number,
  testsFailed: number,
  evidenceFiles: string[] = []
): MetricsPayload {
  const metrics: MetricsPayload = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    claimNumber,
    claimName,
    timestamp: new Date().toISOString(),
    executionTimeMs,
    testsRun,
    testsPassed,
    testsFailed,
    variance: testsRun > 0 ? (testsFailed / testsRun) * 100 : 0,
    evidenceFiles,
  };

  const metricsPath = path.join(claimDir, 'metrics.json');
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

  return metrics;
}

// ============================================================================
// SHA-256 HELPERS
// ============================================================================

/**
 * Compute SHA-256 hash of a file.
 */
export function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Compute SHA-256 hash of a string.
 */
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Get the claim directory path for a given claim number and name.
 */
export function getClaimDir(claimNumber: number, claimName: string): string {
  const paddedNum = String(claimNumber).padStart(2, '0');
  return path.resolve(
    process.cwd(),
    'patent-validation',
    'claims',
    `${paddedNum}-${claimName}`
  );
}
