# Research timeline — iteration 2.67

Date: 2026-09-23  
Version: `2.67.0-research.1`  
Status: local, unpackaged research iteration  
Rollback parent: [immutable iteration 2.66 manifest](../data/research-iteration-manifest-2.66.json)

## Changes

- Centralized morphology render-mode eligibility so the individual-record viewer and exact-record universe apply the same source-authority rule.
- Default source-labelled 3D records with official diameter metadata to an explicitly labelled, deterministic radius-derived surface. Researchers can still choose observed SWC centerlines for the selected record.
- Keep source-labelled 2D records planar even when diameter metadata exists. Records without source diameter authority, or without a 3D source label, remain centerline-only. No depth, membrane, or missing biological structure is inferred.
- Added five regression checks covering default and explicit modes, 2D protection, missing radius authority, and both viewer integrations.
- Added UPG-243 as a planned, bounded search for openly accessible mouse spinal EM volumes, segmentations, stable interneuron object IDs, source coordinates and explicit rights. Candidate repositories include [EMPIAR](https://www.ebi.ac.uk/empiar/), [BioImage Archive](https://www.ebi.ac.uk/bioimage-archive/) and [EMDB](https://www.ebi.ac.uk/emdb/). This queue entry is not evidence that a qualifying dataset has been found; geometry admission remains zero until file, licence, identity and same-specimen crosswalk gates pass.
- Sealed 2.66 as an immutable rollback snapshot. The new iteration does not copy the full project.

## Verification

- `node --test tests/morphology-render-mode.test.mjs`
- `npm run validate:research-upgrades`
- Registry currently resolves 225 research/model queue rows, of which 38 identifiers are referenced by the researcher-facing UI; the UI denominator is derived and not a literal.
- No new EM payload, cell object, internal structure, registration or measurement was admitted.

## Rollback

Restore the application version and UI/source behavior associated with `data/research-iteration-manifest-2.66.json`. That manifest remains file- and content-hash pinned at 547 inputs, 224 queue rows and 37 displayed upgrade references. Do not rebuild the 2.66 snapshot from newer live inputs.
