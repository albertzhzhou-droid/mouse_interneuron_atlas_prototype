# Curator release notes — 2.2.0-curator.1

**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-2.2.0`  
**Scope:** localhost-only, private named-curator review; 0 registrations

Public deployment, public hosting, and public release remain unauthorized pending institutional review.

## What changed

Candidate 2.2 adds `UPG-016`, a browser-local two-lane provenance trace. It renders the selected frozen Research MVP chain (`entity → claim → condition → statement/source`) beside the feasibility planner's declared public-source route chain (`axis → route → public source`). The lanes are deliberately unjoined.

The receipt records both lane selections, the version locks, and explicit `sourceObjectsAcquired: false` / `registrationsCreated: 0` fields. It is an audit record, not evidence acquisition or a data integration result.

`UPG-015` remains available: a feasibility result can be one source-specific route, separate non-joinable routes, or a package-coverage gap. It does not establish a same-cell, same-specimen, coordinate, or causal relationship.

## Hard boundaries

- A shared term, co-display, or adjacent trace node never establishes a source-object link, same-cell/same-specimen identity, coordinate transform, causal relation, reuse authorization, or `REG`.
- No remote request, source-file upload/download, persistence, inspection, hashing, transformation, alignment, combination, analysis, or source-object bundling occurs.
- The workbench uses public digital sources only: no OHRI internal experimental data, physical specimens, or unpublished institutional biological record.
- Entity geometry remains SYN, paths SCH, atlas reference INF, and morphology OBS only in its stated source-local frames.

## Validation

Run:

```bash
npm run validate:provenance-trace
node --test tests/evidence-provenance-trace.test.mjs
npm run validate:manifest
```

The release-manifest content SHA-256 is in `data/release-manifest-2.2.json`. Verify the generated ZIP using its paired `.zip.sha256` sidecar before review.

## Curator focus

Select an evidence entity, then select a feasibility axis. Confirm that the research lane stays a bounded frozen-reference chain, the planning lane stays a source-route chain, and the **NO CROSS-LANE EDGE** notice remains visible. Export a receipt and confirm it reports no acquired source object and zero registrations.
