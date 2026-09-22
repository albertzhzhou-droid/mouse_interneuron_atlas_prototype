# Curator package validation report — candidate 2.6

**Workbench release:** ohri-mouse-interneuron-public-data-workbench-2.6.0  
**Curator distribution:** 2.6.0-curator.1  
**Registration count:** 0

## Scope validated

Candidate 2.6 adds the UPG-019 local authorization-and-verification plan composer. The version-locked contract validates the two frozen manifest formats, five required planned stages, limited requested-rights states, predecessor release identities, and the fixed non-promotion result. Unit tests reject an unlisted source object, a promoted rights state, and a manifest with a local hash. The exported plan requires sourceObjectsAcquired false, sourceObjectsBundled false, localChecksumsCalculated false, contentInspected false, and registrationsCreated 0. The UI test confirms no source transfer or persistence API.

## Required checks

Run npm run lint, npm test, then node scripts/package-curator-review.mjs --check.

The package check verifies the digest, frozen release manifest, curated allowlists and included static application. It does not authenticate any remote source object or assess external permissions.

## Boundaries

This validation is an engineering record. It is not source-object authentication, an object-level rights decision, authorized acquisition, a local checksum verification, content inspection, biological validation, coordinate registration, or public deployment authorization. The package remains private curator-review material; it contains zero registrations and no acquired public-source object.
