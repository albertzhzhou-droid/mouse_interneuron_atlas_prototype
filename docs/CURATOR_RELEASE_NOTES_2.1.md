# Curator release notes — 2.1.0-curator.1

**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-2.1.0`  
**Scope:** localhost-only, private named-curator review; 0 registrations

Public deployment, public hosting, and public release remain unauthorized pending institutional review.

## What changed

Candidate 2.1 adds `UPG-015`, a browser-local public-source research-question feasibility planner. A researcher can select up to four evidence axes and receive one of three explicit results:

- one declared source-specific route covers the requested axes;
- separate source-specific routes can guide planning but cannot be joined; or
- the current package has no qualified route, which is a package-coverage gap and not a biological-absence claim.

The exported feasibility receipt records the selected axes, source routes, decision, and scientific boundary. It is a planning record only.

## Hard boundaries

- No remote requests, source-file upload, source-file download, persistence, credential storage, local hash calculation, source-object embedding, automatic acquisition, alignment, or transformation occurs.
- The planner never establishes a same-cell, same-specimen, coordinate, causal, or source-to-project relationship.
- A receipt does not prove possession, grant data reuse or redistribution rights, validate biological truth, or create `REG`.
- The workbench still uses public digital sources only and has no OHRI internal experimental data, physical specimens, or unpublished institutional biological record.
- The underlying Research MVP retains 0 registrations; entity geometry remains SYN, paths SCH, atlas reference INF, and morphology OBS only in stated source-local frames.

## Validation

Run:

```bash
npm run validate:feasibility-planner
node --test tests/evidence-feasibility-planner.test.mjs
npm run validate:manifest
```

The release-manifest content SHA-256 is recorded in `data/release-manifest-2.1.json`. Verify the generated ZIP against its companion `.zip.sha256` before review.

## Curator focus

Check a one-route example (Russ molecular taxonomy plus adult-lumbar marker context), a multi-route example (molecular taxonomy plus morphology), and a package-gap example (synaptic connectivity). Confirm that each outcome preserves the stated boundary and that no result turns missing package coverage into biological absence or a non-joinable pairing into a same-cell relationship.
