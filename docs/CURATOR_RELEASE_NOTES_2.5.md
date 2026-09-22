# Curator release notes — public-data workbench candidate 2.5

## Identity

- Workbench release: `ohri-mouse-interneuron-public-data-workbench-2.5.0`
- Curator distribution: `2.5.0-curator.1`
- Input policy: public digital sources only; no OHRI internal experimental data, physical specimens, or unpublished institutional records.
- Registration count: `0` (0 registrations)

## What changed

Candidate 2.5 implements `UPG-018`, an assertion-level provenance composer located below the existing `UPG-006` metadata-only release-admission review in the Sources tab. For each required check in a supported SpinalJ `0.7.0` or Cano-Gomez `0.8.0` manifest, a curator can export one local JSON receipt identifying:

- a declared unacquired file record or explicit unknown;
- one typed check and claim scope;
- a publisher URL, landing page, metadata field, or curator-note locator;
- source state (`publisher_asserted`, `curator_transcribed`, or `unresolved`); and
- the local reviewer and review date.

Every receipt remains `not_locally_verified`, `not_admitted_pending_curator_object_and_rights_review`, and `0 REG`. It does not authenticate a statement, acquire or inspect an object, calculate a local checksum, decide rights, authorize reuse, transform coordinates, link studies, or make a biological claim.

`UPG-019` is now the next research-watch gate. It requires an object-specific authorization and reproducible local-verification design before any future acquisition or local hashing is considered. Public availability, a publisher checksum, a repository-wide licence, or a landing-page URL is not authorization.

Candidate 2.5 retains the public-source feasibility planner (`UPG-015`), which distinguishes one qualified source-specific route from separate non-joinable routes and a package-coverage gap; the two-lane provenance trace (`UPG-016`); and the not-admitted relationship proposal (`UPG-017`). None establishes a same-cell, same-specimen, coordinate, causal, authorization, or registration relation.

## Curator decision boundary

- A provenance locator locates an assertion; it does not validate it.
- “Publisher asserted” and “curator transcribed” are not “locally verified.”
- A manifest file ID is declared metadata, not an acquired source object.
- A completed metadata checklist or provenance receipt is not asset admission or rights authorization.
- This candidate makes no automatic external request and creates zero registrations.

Public-source licences remain applicable to their source assets. The packaged workbench is for private attributed curator review; public deployment or redistribution requires institutional review.

## Review materials

- `docs/ADR-009-ASSERTION-PROVENANCE-BEFORE-OBJECT-ADMISSION.md`
- `data/public-source-assertion-provenance-0.1.json`
- `schemas/public-source-assertion-provenance-0.1.schema.json`
- `docs/CURATOR_REVIEW_GUIDE.md`
- `docs/CURATOR_REVIEW_FORM.md`

Use the package's `START_HERE.html` and loopback launcher; no `npm install` is required for a curator review.
