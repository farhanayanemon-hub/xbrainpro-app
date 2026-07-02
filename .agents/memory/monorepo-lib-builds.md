---
name: Monorepo lib builds
description: Why artifact typecheck breaks after editing shared libs, and how to fix it.
---

Shared libs under `lib/*` are composite TypeScript project references. Artifacts
(under `artifacts/*`) consume their built `dist` output, not the source.

**Symptom:** artifact typecheck fails with TS6305 ("output file has not been built
from source file") or "module has no exported member" right after you change a lib.

**Why:** the lib's `dist`/`.tsbuildinfo` is stale relative to its source, so the
artifact resolves the old declarations.

**How to apply:** when a lib change isn't reflected, run
`rm -rf lib/*/dist lib/*/.tsbuildinfo` then `pnpm exec tsc --build --force`
(root script `typecheck:libs` = `tsc --build`). Only editing an artifact's own
`src` (not a lib) does not require this.
