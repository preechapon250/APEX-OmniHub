/**
 * PATENT VALIDATION — Legal Package Generator
 *
 * @version 1.0.0
 * @date    2026-02-13
 * @author  APEX Business Systems
 * @license Proprietary — All Rights Reserved
 *
 * Generates chain-of-custody documentation and expert witness data bundle.
 * Produces HTML report (with PDF fallback via pandoc if available).
 *
 * Usage: tsx patent-validation/generate-legal-package.ts
 */
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PATENT_DIR = path.join(ROOT, 'patent-validation');
const LEGAL_DIR = path.join(PATENT_DIR, 'legal-package');
const EVIDENCE_DIR = path.join(ROOT, 'evidence');

// ============================================================================
// HELPERS
// ============================================================================

function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return 'UNKNOWN — git not available';
  }
}

function getGitBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return 'UNKNOWN';
  }
}

function collectEvidenceFiles(): Array<{ path: string; relativePath: string; sha256: string; sizeBytes: number }> {
  const files: Array<{ path: string; relativePath: string; sha256: string; sizeBytes: number }> = [];

  // Collect from claims directories
  const claimsDir = path.join(PATENT_DIR, 'claims');
  if (fs.existsSync(claimsDir)) {
    for (const claimFolder of fs.readdirSync(claimsDir)) {
      const claimPath = path.join(claimsDir, claimFolder);
      if (!fs.statSync(claimPath).isDirectory()) continue;

      for (const file of fs.readdirSync(claimPath)) {
        if (file.startsWith('results-') && file.endsWith('.json')) {
          const fullPath = path.join(claimPath, file);
          files.push({
            path: fullPath,
            relativePath: path.relative(ROOT, fullPath),
            sha256: hashFile(fullPath),
            sizeBytes: fs.statSync(fullPath).size,
          });
        }
        if (file === 'metrics.json') {
          const fullPath = path.join(claimPath, file);
          files.push({
            path: fullPath,
            relativePath: path.relative(ROOT, fullPath),
            sha256: hashFile(fullPath),
            sizeBytes: fs.statSync(fullPath).size,
          });
        }
      }
    }
  }

  // Collect master log
  const masterLog = path.join(EVIDENCE_DIR, 'master-log.jsonl');
  if (fs.existsSync(masterLog)) {
    files.push({
      path: masterLog,
      relativePath: path.relative(ROOT, masterLog),
      sha256: hashFile(masterLog),
      sizeBytes: fs.statSync(masterLog).size,
    });
  }

  return files;
}

function isPandocAvailable(): boolean {
  try {
    execSync('pandoc --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// CHAIN OF CUSTODY REPORT
// ============================================================================

function generateChainOfCustody(): string {
  const timestamp = new Date().toISOString();
  const commitHash = getGitCommitHash();
  const branch = getGitBranch();
  const evidenceFiles = collectEvidenceFiles();
  const systemInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    hostname: require('node:os').hostname(),
  };

  // Build SHA-256 manifest table
  const manifestRows = evidenceFiles
    .map(f => `
      <tr>
        <td style="font-family:monospace;font-size:11px;word-break:break-all">${f.relativePath}</td>
        <td style="font-family:monospace;font-size:10px;word-break:break-all">${f.sha256}</td>
        <td style="text-align:right">${(f.sizeBytes / 1024).toFixed(1)} KB</td>
      </tr>`)
    .join('');

  const manifestHash = crypto
    .createHash('sha256')
    .update(evidenceFiles.map(f => `${f.sha256}:${f.relativePath}`).join('\n'))
    .digest('hex');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Chain of Custody — APEX OmniHub Patent Validation</title>
  <style>
    body { font-family: 'Georgia', 'Times New Roman', serif; max-width: 900px; margin: 40px auto; padding: 0 30px; color: #1a1a1a; line-height: 1.6; }
    h1 { font-size: 22px; border-bottom: 3px double #333; padding-bottom: 10px; }
    h2 { font-size: 16px; margin-top: 30px; border-bottom: 1px solid #999; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
    th, td { padding: 8px 10px; text-align: left; border: 1px solid #ccc; }
    th { background: #f0f0f0; font-weight: bold; }
    .attestation { background: #fffde7; border: 2px solid #f9a825; padding: 20px; margin: 30px 0; font-style: italic; }
    .hash { font-family: monospace; font-size: 12px; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    .footer { margin-top: 40px; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
    .warning { background: #fff3e0; border-left: 4px solid #ff9800; padding: 10px 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <h1>CHAIN OF CUSTODY</h1>
  <p><strong>Document:</strong> APEX OmniHub Patent Validation Evidence</p>
  <p><strong>Generated:</strong> ${timestamp}</p>
  <p><strong>Classification:</strong> Confidential — Attorney Work Product</p>

  <h2>1. Source Code Identity</h2>
  <table>
    <tr><th>Property</th><th>Value</th></tr>
    <tr><td>Git Commit Hash</td><td class="hash">${commitHash}</td></tr>
    <tr><td>Git Branch</td><td>${branch}</td></tr>
    <tr><td>Repository</td><td>APEX-OmniHub</td></tr>
  </table>

  <h2>2. Execution Environment</h2>
  <table>
    <tr><th>Property</th><th>Value</th></tr>
    <tr><td>Platform</td><td>${systemInfo.platform} (${systemInfo.arch})</td></tr>
    <tr><td>Node.js Version</td><td>${systemInfo.nodeVersion}</td></tr>
    <tr><td>Hostname</td><td>${systemInfo.hostname}</td></tr>
    <tr><td>Execution Timestamp (UTC)</td><td>${timestamp}</td></tr>
  </table>

  <h2>3. SHA-256 Evidence Manifest</h2>
  <p>Total evidence files: <strong>${evidenceFiles.length}</strong></p>
  <p>Manifest digest: <span class="hash">${manifestHash}</span></p>
  <table>
    <thead>
      <tr><th>File</th><th>SHA-256</th><th>Size</th></tr>
    </thead>
    <tbody>${manifestRows}</tbody>
  </table>

  <h2>4. Attestation</h2>
  <div class="attestation">
    <p>Under penalty of perjury, I attest that the above-described tests were executed
    on the system identified herein at the timestamps recorded. The SHA-256 hashes
    listed in this document correspond to the evidence files produced during
    automated test execution. No evidence files have been modified after generation.</p>
    <br>
    <p>System: <strong>${systemInfo.hostname}</strong></p>
    <p>Timestamp: <strong>${timestamp}</strong></p>
    <p>Git Commit: <strong>${commitHash}</strong></p>
    <br>
    <p>Signature: _________________________________</p>
    <p>Name (Print): _________________________________</p>
    <p>Date: _________________________________</p>
  </div>

  <div class="footer">
    <p>This document was auto-generated by the APEX OmniHub Patent Validation Suite.</p>
    <p>Document hash: <span class="hash">${crypto.createHash('sha256').update(timestamp + commitHash + manifestHash).digest('hex')}</span></p>
  </div>
</body>
</html>`;
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  console.log('Generating legal package...\n');

  // Create legal-package directory
  if (!fs.existsSync(LEGAL_DIR)) {
    fs.mkdirSync(LEGAL_DIR, { recursive: true });
  }

  // Generate chain of custody HTML
  const html = generateChainOfCustody();
  const htmlPath = path.join(LEGAL_DIR, 'chain-of-custody.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`  ✅ Generated: ${htmlPath}`);

  // Attempt PDF conversion if pandoc is available
  if (isPandocAvailable()) {
    try {
      const pdfPath = path.join(LEGAL_DIR, 'chain-of-custody.pdf');
      execSync(`pandoc "${htmlPath}" -o "${pdfPath}" --pdf-engine=xelatex`, {
        cwd: ROOT,
        stdio: 'pipe',
      });
      console.log(`  ✅ Generated PDF: ${pdfPath}`);
    } catch (error) {
      console.warn(`  ⚠️  PDF generation failed (pandoc error). HTML version available.`);
    }
  } else {
    console.warn('  ⚠️  pandoc not found — skipping PDF generation. HTML report is primary.');
  }

  // Create expert witness data bundle (zip of evidence)
  const evidenceFiles = collectEvidenceFiles();
  const expertDataPath = path.join(LEGAL_DIR, 'expert-witness-data.json');
  fs.writeFileSync(expertDataPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalFiles: evidenceFiles.length,
    files: evidenceFiles.map(f => ({
      path: f.relativePath,
      sha256: f.sha256,
      sizeBytes: f.sizeBytes,
    })),
    methodology: {
      framework: 'Vitest 4.0.16',
      language: 'TypeScript (ES2022, strict mode)',
      hashAlgorithm: 'SHA-256',
      timestampFormat: 'ISO-8601 with milliseconds',
      executionModel: 'Deterministic with fixed seeds',
    },
  }, null, 2));
  console.log(`  ✅ Generated: ${expertDataPath}`);

  // Summary
  const summaryPath = path.join(PATENT_DIR, 'validation-summary.json');
  const hasSummary = fs.existsSync(summaryPath);
  console.log(`\n  Legal package: ${LEGAL_DIR}`);
  console.log(`  Evidence files: ${evidenceFiles.length}`);
  if (hasSummary) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    console.log(`  Validation result: ${summary.allPassed ? 'ALL PASSED' : 'INCOMPLETE'}`);
  }
  console.log('\nDone.');
}

main();
