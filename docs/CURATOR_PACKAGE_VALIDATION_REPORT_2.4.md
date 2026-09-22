# Curator package validation report — candidate 2.4

## Release boundary

- Workbench release: `ohri-mouse-interneuron-public-data-workbench-2.4.0`
- Curator distribution: `2.4.0-curator.1`
- Scientific inputs: public digital sources only
- Registrations: `0`

## Verification record

The final package build records its ZIP SHA-256 and frozen input-manifest content hash in the generated release directory. The release gate verifies every allowlisted input by SHA-256, rejects changed byte counts and symbolic-link escapes, and rejects an unlisted package file.

The candidate includes `46` SHA-256-locked inputs: the former release inputs plus the `UPG-006` service contract and its JSON Schema. It also runs schema validation, semantic validation, component/unit tests, static rendering checks, and curator-package verification.

## `UPG-006` validation assertions

- Only the `0.7.0` SpinalJ and `0.8.0` Cano-Gomez metadata manifest/source pairs are accepted.
- A receipt is always `not_admitted_pending_curator_object_and_rights_review`.
- It records `sourceObjectsAcquired=false`, `sourceObjectsBundled=false`, `localChecksumsCalculated=false`, and `registrationsCreated=0`.
- It has no source-file download, upload, remote request, persistence, coordinate transform, or registration path.

## Remaining boundary

This report is an engineering validation record, not an object-level rights decision, source-object checksum verification, biological validation, or public-release authorization. The package remains private curator review material, is not authorization for public deployment, and contains zero registrations.
