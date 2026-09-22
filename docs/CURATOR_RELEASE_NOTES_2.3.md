# Curator release notes — 2.3.0-curator.1

**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-2.3.0`  
**Scope:** localhost-only, private named-curator review; 0 registrations

Public deployment, public hosting, and public release remain unauthorized pending institutional review.

## What changed

Candidate 2.3 implements `UPG-017`: a browser-local cross-lane relationship admission proposal composer. It pairs one frozen Research MVP entity record with one frozen public-source catalogue record, then records one typed *candidate* relation and the evidence that is absent.

The exported JSON is always `not_admitted`. It has no identified/acquired source object, no asset-level rights decision, no independent relation evidence, no validation plan, and `registrationsCreated: 0`. For coordinate-transform and same-cell questions, the composer makes their additional proof requirements visible rather than pretending that a label or overlay supplies them.

The existing two-lane provenance trace remains deliberately unjoined. This new proposal record does not add an edge to that trace or change any source, entity, evidence, or registration state.

`UPG-015` remains available: the feasibility planner distinguishes a single source-specific route, separate non-joinable routes, and a package-coverage gap. `UPG-016` remains the two-lane provenance trace. Neither feature establishes a same-cell, same-specimen, coordinate, causal, authorization, or registration relation.

## Hard boundaries

- A shared term, co-display, candidate proposal, source URL, classifier output, or curator preference never establishes a source-object link, same-cell/same-specimen identity, coordinate transform, causal relation, reuse authorization, or `REG`.
- No remote request, source-file upload/download, persistence, inspection, hashing, transformation, alignment, combination, analysis, or source-object bundling occurs.
- The workbench uses public digital sources only: no OHRI internal experimental data, physical specimens, or unpublished institutional biological record.
- Entity geometry remains SYN, paths SCH, atlas reference INF, and morphology OBS only in its stated source-local frames.

## Validation

Run:

```bash
npm run validate:relationship-admission
node --test tests/cross-lane-relationship-admission.test.mjs
npm run validate:manifest
```

The release-manifest content SHA-256 is in `data/release-manifest-2.3.json`. Verify the generated ZIP using its paired `.zip.sha256` sidecar before review.

## Curator focus

In the Sources panel, choose an atlas evidence entity and a public-source card. In **CROSS-LANE ADMISSION GATE**, select a candidate relation type. Confirm that the proposal remains visibly **NOT ADMITTED · 0 REG**, lists missing evidence, and exports only a local JSON receipt with no source object acquired and zero registrations.
