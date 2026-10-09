# Research timeline — iteration 2.51 (2026-09-23)

## Scope

Audit whether public MICrONS Phase 1 subcellular sources can add concrete detail to the existing exact cross-region visual-cortex interneuron reference. This increment is deliberately source/access-and-identity bounded: it does not add a synapse or mitochondrion to the 3D scene and does not link the cortical exemplar to a spinal record.

## Evidence audit

- The MICrONS Phase 1 page describes a P36 male mouse visual-cortex L2/3 volume and a 3.2-million-row table of automated *putative* synapse detections. It explicitly warns that many objects are not proofread and the table is not a straightforward connectivity graph.
- Zenodo record `7510511` lists `221206_pni_synapses_v185.csv` at 388,781,071 bytes with published MD5 `19073f4b5cbae60d7f92d73f204940ed`; the metadata deposit is version 185.3. The existing cell mesh is v185.4. The table preview exposes `ctr_pt_*_nm` centre columns and pre/post voxel-coordinate columns, but no per-row proofreading field. No exact-cell query, full-table transfer, filtered payload, or saved source data was performed.
- The official CAVE tutorial says a configured token is required for programmatic queries. The unauthenticated metadata request redirected to the authorization route. The MICrONS page recommends contacting the project before large-scale downloads; this iteration did not bypass authentication or substitute a full-file scan for a bounded query.
- v185 release notes define nominal table/mesh voxel scale as `[4, 4, 40]` nm, discuss optional post-hoc measurement corrections, and list a manual mitochondrial annotation layer at `precomputed://gs://neuroglancer/pinky10/ground_truth_registration/dst/mit_new`. That route's exact target-root membership, object ID, version compatibility and transform have not been audited.
- Although candidate coordinate fields use the nominal nanometre frame, the v185.3 table-to-v185.4 mesh root lineage and point-to-mesh agreement remain unverified. Matching root text and coordinate names are not treated as sufficient identity evidence.

## Changes

- Added `data/microns-subcellular-source-audit-0.1.json` and its validator/test to preserve the exact source file receipt, observed table columns, access gate, version mismatch, quality caveat, coordinate boundary and zero-admission counts.
- Added a collapsed “Subcellular data routes” panel under the exact MICrONS reference. It makes the candidate synapse/mitochondria sources and missing object-level evidence visible without duplicating the anatomy card or adding procedural primitives.
- Updated UPG-218 to partially completed: source/file/schema/coordinate facts are verified; an authorized root-filtered query, exact release lineage and mesh-distance audit remain open.
- Added UPG-223 to the research/model queue for exact-cell membership and transform audit of the official mitochondrial route. The queue now contains 205 research/model upgrades through UPG-223.
- Promoted the application and release manifest to 2.51, sealed the existing 2.50 manifest as an immutable parent, and created this unique timeline file in the existing project tree. No project-wide copy folder was created.

## Scientific boundaries

- Additional rendered synapse points: 0. Additional mitochondria objects: 0. Additional geometry, same-cell cross-source joins, spinal identity joins, registrations, and functional-connectivity claims: 0.
- MICrONS remains a cortical comparison specimen with a coarse human cell label, not a molecular subtype or spinal interneuron identity.
- Do not use the automated table as a proofread graph, assign synapse class/function, apply measurement corrections to display geometry, or infer absent mitochondria.

## Verification

`npm run test:research` passed: 797 tests total, 782 passed, 15 skipped, 0 failed. This includes the production build, lint, current scientific and source validators, the immutable 2.50 parent snapshot, the 2.51 manifest/audit tests, and server-rendered HTML checks for the new source-route disclosure. The build retains the existing non-blocking Node deprecation, large-client-chunk and route-classification advisories. No fresh UI screenshot review is claimed because the desktop was locked during the available visual-audit attempt.

## Open gates

1. Obtain an authorized exact-root CAVE query or an official compact cell-specific export; preserve uint64 identifiers exactly.
2. Verify the exact v185.3 table root lineage against the v185.4 mesh, then quantify every retained point's source-frame distance to that surface.
3. Resolve exact mitochondrial annotation IDs and membership for the target root, including materialization/version, coordinate transform, annotation quality and reuse terms.
4. If any exact objects become admissible, keep the visual-cortex scene separate from the spinal taxonomy/morphology records.

## Primary sources

- [MICrONS Phase 1 dataset and synapse-table scope](https://www.microns-explorer.org/phase1)
- [MICrONS Layer 2/3 Data Tables, Zenodo record 7510511](https://zenodo.org/records/7510511)
- [Official CAVE synapse-query guide](https://tutorial.microns-explorer.org/quickstart_notebooks/04-cave-query-synapses.html)
- [MICrONS v185 release notes](https://www.microns-explorer.org/v185-release-notes)
