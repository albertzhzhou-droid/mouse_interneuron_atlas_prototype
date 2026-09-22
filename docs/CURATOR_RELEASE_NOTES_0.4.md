# Curator release notes — public-data workbench candidate 0.4

**Distribution candidate:** `0.4.0-curator.1`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-0.4.0`  
**Workbench catalog schema:** `0.4.0`  
**Registration count:** `0`

## Purpose

Candidate 0.4 retains the frozen 0.2 evidence payload and the six public-source leads in the 0.3 workbench. It adds one P0 SpinalJ metadata-only intake record. It does not add a candidate image, transform, coordinate, biological observation, or registered object.

The record cites three public evidence pages and six reported metadata facts, while asserting zero remote acquisition attempts, zero downloaded files, zero file hashes, zero bundled assets, and zero registrations. Its purpose is to make the first acquisition decision auditable rather than implicit.

## Curator focus

1. Confirm the intake distinguishes landing-page CC BY 4.0 metadata from file-level reuse, bundle, and public-hosting authorization.
2. Confirm the dataset-declared SpinalJ v1.13 is not silently replaced by an unpinned repository version.
3. Confirm `metadata_audited` means no candidate file or transform has been admitted.
4. Confirm the Sources panel exports the linked metadata record but makes no remote request.
5. Confirm all existing geometry labels remain unchanged: entity `SYN`, path `SCH`, reference anatomy `INF`, local morphology `OBS`, and registration count `0`.

## Verification

From a source checkout, run:

```bash
node scripts/validate-public-data-catalog.mjs
node scripts/validate-public-source-intake.mjs
node scripts/build-release-manifest.mjs --check
npm test
```

The ZIP is for private named-curator review only. Public deployment, public hosting, and broader redistribution are not authorized.
