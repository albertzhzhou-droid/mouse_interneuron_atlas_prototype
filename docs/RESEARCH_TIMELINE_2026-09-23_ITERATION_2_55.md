# Research timeline — iteration 2.55 (2026-09-23)

## Scope

Continue the source-grounded morphology UI after 2.54. The 142 checksum-pinned adult mouse spinal-interneuron query records were already admitted as exact standardized SWC sources, but only a small named subset could select geometry in the main scene. This iteration makes every frozen-census object individually selectable through the shared active-record path while leaving the seven supplementary objects separate.

## Implemented

- Added a deterministic derived main-scene index containing metadata and exact source-asset receipts for all 142 records from the pinned NeuroMorpho 8.6.124 corpus; it does not copy or alter any SWC payload.
- Expanded the main-scene chooser and active morphology record mapping to 149 exact source objects: 142 frozen-census records plus seven supplementary records. The census denominator remains 142; 135 additional census geometries became selectable relative to 2.54.
- Preserved the source-labeled dimensionality: 140 3D and two planar 2D records. NMO 194468 and 194469 have source diameter metadata but stay planar; radius-derived 3D surfaces remain eligible only for the 92 census records with both 3D inputs and source diameter metadata.
- Kept raw repository labels verbatim (125 Excitatory, 15 Inhibitory, two Not Reported), with no subtype reconciliation, animal/specimen inference, atlas registration, cross-source identity or same-specimen internal structures. Internal primitives remain zero.
- Added UPG-227 for the completed main-scene selection expansion and UPG-228 as a research watch for the official NeuroMorpho 8.6.125 release. Exact query/version/object/rights delta review remains pending; no 8.6.125 records were mixed into the active corpus.
- Added an automated incremental-layout guard. No directory containing a full project copy was added; future complete-copy layouts fail validation. Existing generated/dependency directories are excluded from the scan.
- Sealed the 2.54 release byte-for-byte and advanced the active application to 2.55.

## Verification

- The main-scene index builder and validator reproduce all 142 exact record identities and geometry receipts; source dimensionality, secondary-label counts and zero-registration/internal-object boundaries are checked.
- Focused source/index, scene integration, selection targeting and incremental-layout tests pass.
- Full `npm run test:research` passed: build, lint, all research/data validators, and 824 tests (809 passed, 15 skipped, 0 failed). Skips are optional source-audit tests whose external source objects were not locally acquired.
- No full-project duplicate folder was created. This timeline and the immutable 2.54 snapshot provide rollback/reference points.
- 8.6.125 exact-query delta audit remains queued as UPG-228; the release-wide repository total is not used as a spinal-interneuron denominator.
