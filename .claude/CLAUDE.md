## Context

**Repository:** apexbusiness-systems/APEX-OmniHub
**Branch:** omnidash-convergence-v1-7752315402323590125
**Target:** main
**PR:** #479

## Problem Statement

A feature branch attempting to add "Man Mode" features has 5 merge conflicts with main:
- apps/omnihub-site/package.json
- apps/omnihub-site/package-lock.json
- apps/omnihub-site/src/App.tsx
- apps/omnihub-site/src/components/ProtectedRoute.tsx
- apps/omnihub-site/vite.config.ts

**Root Cause:** The feature branch was created days ago. Main evolved significantly with PR #480 (merged 3 hours ago) that implemented:
- SPA refactor using react-router-dom
- Universal Entity Protocol onboarding
- PWA features with service workers
- Build optimizations using @vitejs/plugin-react-swc

**Current State:** Branch has been rebased but conflicts show the feature branch code conflicts with main's new architecture.

## Your Mission

**Integrate Man Mode features INTO main's new SPA architecture WITHOUT destroying main's improvements.**

### Critical Rules:

1. **PRESERVE Main's Infrastructure:**
   - ✅ Keep @vitejs/plugin-react-swc (faster builds than standard React plugin)
   - ✅ Keep PWA configuration (service workers, offline mode, caching)
   - ✅ Keep build optimizations (code splitting, terser, source maps)
   - ✅ Keep SPA routing structure from PR #480

2. **ADD Man Mode Features:**
   - Add Man Mode routes to existing router
   - Add Man Mode components/contexts
   - Add ProtectedRoute Man Mode gating (merge with existing security checks)
   - Add ONLY dependencies that Man Mode actually uses

3. **Integration Strategy:**
   - Man Mode wraps INSIDE main's providers (don't replace)
   - Man Mode routes live UNDER main's routing (don't replace)
   - Man Mode builds WITH main's config (don't replace)

## Specific Requirements

### For package.json:
- START with main's current dependencies
- ADD only if Man Mode code actually imports/uses:
  - Examine feature branch code to see what's actually needed
  - Don't add speculative dependencies
- KEEP main's @vitejs/plugin-react-swc in devDependencies

### For vite.config.ts:
- KEEP main's entire config (PWA, optimizations, SWC plugin)
- ADD Man Mode-specific plugins only if needed
- Don't downgrade from SWC to standard React plugin

### For App.tsx:
- INTEGRATE Man Mode routes into main's SPA structure
- NEST ManModeProvider inside main's existing providers
- MERGE both route sets (main's + Man Mode's)
- Don't replace main's routing structure

### For ProtectedRoute.tsx:
- MERGE authentication checks from both branches:
  - Main's permission checks (from new architecture)
  - Man Mode's gating logic (from feature branch)
- Preserve ALL security checks in correct order:
  1. User authentication
  2. Permission checks (main's)
  3. Man Mode checks (feature's)

### For package-lock.json:
- Delete and regenerate after resolving package.json
- Never manually merge lockfiles

## Success Criteria

✅ PR shows "mergeable: true" on GitHub
✅ npm run typecheck passes
✅ npm run lint passes
✅ npm run build passes
✅ Main's PWA features still work
✅ Main's build performance unchanged (SWC still used)
✅ Man Mode features successfully added
✅ No code from main destroyed

## Execution Steps

1. Fetch latest main branch state
2. Examine feature branch diff to understand Man Mode features
3. Identify what dependencies Man Mode actually needs
4. Resolve each conflict file using integration strategy above
5. Regenerate package-lock.json
6. Verify all builds/tests pass
7. Push rebased branch
8. Verify GitHub shows mergeable status

## What NOT To Do

❌ Don't "Force Resolution" by overwriting main's files
❌ Don't add dependencies without verifying they're used
❌ Don't downgrade build tooling (keep SWC)
❌ Don't destroy PWA configuration
❌ Don't claim success until GitHub API shows mergeable: true

## Questions You Should Ask Before Acting

1. What does the feature branch code actually import/use?
2. Are there any apexcharts imports in the Man Mode code?
3. What routes does Man Mode actually add?
4. What providers/contexts does Man Mode introduce?
5. Can you verify main's current architecture before integrating?