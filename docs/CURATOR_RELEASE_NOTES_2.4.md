# Curator release notes — public-data workbench candidate 2.4

## Identity

- Workbench release: `ohri-mouse-interneuron-public-data-workbench-2.4.0`
- Curator distribution: `2.4.0-curator.1`
- Input policy: public digital sources only; no OHRI internal experimental data, physical specimens, or unpublished institutional records.
- Registration count: `0` (0 registrations)

## What changed

Candidate 2.4 implements `UPG-006`: a deterministic, browser-local public-source release-admission review for only the frozen SpinalJ `0.7` and Cano-Gomez `0.8` metadata manifests. After a manifest is imported in the Sources tab, the workbench shows every review check and can export a not-admitted JSON receipt.

The receipt distinguishes recorded publisher metadata from independently required curator review. It never says that a listed source object was acquired, inspected, locally hashed, bundled, authorized for reuse, transformed, registered, or biologically validated.

`UPG-018` is newly queued for source-assertion provenance: future work must record the source object or explicit unknown, evidence locator, asserting/reviewing agent, time, and claim scope. This is a research gate, not a data admission path.

Candidate 2.4 retains the `UPG-015` feasibility planner, which distinguishes a source-specific route from separate non-joinable routes and a package-coverage gap; the `UPG-016` two-lane provenance trace; and the `UPG-017` not-admitted relationship proposal. None establishes a same-cell, same-specimen, coordinate, or causal relation.

## Curator decision boundary

- **Metadata complete for curator review only** is not asset admission.
- A publisher checksum is not a local checksum verification.
- A public URL or landing page is not evidence of possession or reuse permission.
- A source coordinate frame is not a project transform or registration.
- This candidate makes no automatic external request and creates zero registrations.

Public-source licences remain applicable to their source assets. The packaged workbench is for private attributed curator review; public deployment or redistribution requires institutional review.

## Review materials

- `docs/ADR-008-PUBLIC-SOURCE-RELEASE-ADMISSION.md`
- `data/public-source-release-admission-service-0.1.json`
- `schemas/public-source-release-admission-service-0.1.schema.json`
- `docs/CURATOR_REVIEW_GUIDE.md`
- `docs/CURATOR_REVIEW_FORM.md`

Use the package's `START_HERE.html` and loopback launcher; no `npm install` is required for a curator review.
