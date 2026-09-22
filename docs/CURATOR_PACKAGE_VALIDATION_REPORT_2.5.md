# Curator package validation report — candidate 2.5

## Release boundary

- Workbench release: `ohri-mouse-interneuron-public-data-workbench-2.5.0`
- Curator distribution: `2.5.0-curator.1`
- Scientific inputs: public digital sources only
- Registrations: `0`

## Verification record

The final package build records its ZIP SHA-256 and frozen input-manifest content hash in the generated release directory. The release gate verifies every allowlisted input by SHA-256, rejects changed byte counts and symbolic-link escapes, and rejects an unlisted package file.

The candidate includes `48` SHA-256-locked inputs: candidate 2.4 inputs plus the `UPG-018` assertion-provenance contract and its JSON Schema. It runs schema validation, semantic validation, component/unit tests, static-rendering checks, and curator-package verification.

## `UPG-018` validation assertions

- Only the frozen `0.7.0` SpinalJ and `0.8.0` Cano-Gomez metadata manifest/source pairs are supported.
- A receipt must name a declared unacquired object or explicit `unknown`, a required check, a typed evidence locator, one permitted source state, a reviewer, and a date.
- Permitted source states are exactly publisher-asserted, curator-transcribed, and unresolved; local verification, admission, authorization, acquisition, and registration states are absent.
- Each receipt records `sourceObjectsAcquired=false`, `sourceObjectsBundled=false`, `localChecksumsCalculated=false`, and `registrationsCreated=0`.
- It has no source-file download, upload, remote request, persistence, coordinate transform, cross-study relationship, or registration path.

## Remaining boundary

This report is an engineering validation record, not source-object authentication, an object-level rights decision, a local checksum verification, biological validation, or public deployment / public-release authorization. `UPG-019` remains a design-only authorization and reproducible-local-verification gate. The package remains private curator review material and contains zero registrations.
