/**
 * PATENT VALIDATION — Vitest Configuration (Isolated)
 *
 * @version 1.0.0
 * @date    2026-02-13
 * @author  APEX Business Systems
 * @license Proprietary — All Rights Reserved
 *
 * Separate config to avoid interfering with the main test suite.
 * Uses Node environment (no jsdom) since these are system-level validations.
 */
import { defineConfig } from 'vitest/config';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['patent-validation/claims/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 300_000, // 5 minutes per test file
    pool: 'forks',
    reporters: ['verbose'],
    root: PROJECT_ROOT,
  },
  resolve: {
    alias: {
      '@': path.resolve(PROJECT_ROOT, 'src'),
    },
  },
});
