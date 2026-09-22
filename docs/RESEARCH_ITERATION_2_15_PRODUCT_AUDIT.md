# Research iteration 2.15 product audit

Snapshot date: 2026-08-27  
Working label: `2.15.0-research.1`  
Audited slice: UPG-079 Hayashi P0 V2a evidence integration

## Outcome

The 2.15 research build passes the current product gate for a source-native evidence increment. A stable URL opens Hayashi Cluster 6 in the Type Evidence lane, the page shows the 11-cluster source frame without presenting it as a canonical type census, and the dossier keeps article evidence, deposited-matrix evidence and unavailable fields visibly separate.

This is a localhost research iteration, not a new curator distribution. The frozen `2.8.0-curator.1` package remains unchanged and separately verifiable.

## Audited states

| State | Viewport | Result |
|---|---:|---|
| Canonical Hayashi Cluster 6 deep link | 1440×1000 | Passed |
| Canonical Hayashi Cluster 6 deep link | 390×844 | Passed |
| Responsive page width | 390×844 | `documentElement.scrollWidth = 390`; no page-level horizontal overflow |
| Browser console | Both audited states | No errors or warnings |
| URL-controlled selection | Both audited states | `focusKind=molecular_profile`; `focusId=hayashi-2018:GSE108788:cluster-6` |
| English interface | Server-rendering suite plus browser audit | Passed |

## Information and evidence hierarchy

The page now communicates the source hierarchy in this order:

1. global model scope and non-completeness boundary;
2. three non-merged source namespaces and their separate denominators;
3. Hayashi article-level cluster and Type-I/II evidence boundary;
4. a source-local profile list;
5. one detailed dossier with identity authority, count boundary and experimental-unit flow;
6. explicit evidence-availability cells; and
7. technical provenance and primary-source links.

The deep-linked dossier shows `2 neonates → 1 library → 949 cells`, keeps 5,600 collected, approximately 3,000 processed and 949 QC-retained cells distinct, and labels the 455/494 cervical/lumbar split as a post-pooling computational assignment. Morphology, cell coordinates, SCI context, registration, electrophysiology linkage, projection target, synaptic connectivity and cross-source same-cell identity remain unavailable rather than visually inferred.

## Responsive and interaction findings

- Desktop preserves the existing dark-green research-atlas shell and card grammar. The new Hayashi material uses the same summary, warning, metric, list and dossier components rather than introducing a second visual system.
- Mobile collapses the profile dossier to a readable single column. The Cluster 6 title, identity-authority warning and field cards remain legible without horizontal clipping.
- The six Research Atlas tabs expose tab semantics, the profile collection exposes listbox/option semantics, and the selected Hayashi profile remains URL-addressable after reload.
- The header was corrected during this audit from an app-wide `Adult` scope to `Life stage: source-declared`. The adult reference anatomy remains adult-specific, while the P0 Hayashi lane is no longer contradicted by the global page scope.

## Remaining product risks

1. The 123-record type list is information-dense. A future slice should add source-aware result grouping or a compact mobile results-to-detail transition without hiding negative/unavailable evidence.
2. The production build reports a client chunk larger than 500 kB. This is not a correctness failure, but route- or lane-level code splitting should be assessed before remote deployment.
3. The Hayashi page can show source-level medial/lateral and cervical/lumbar context, but it must not render those categories as 3D points or regions until a direct coordinate object and validated transform exist.
4. No researcher usability session, formal screen-reader pass, contrast calculation, zoom audit or touch-device study has been completed. The current result is a browser and semantic-code audit, not human-factors validation.
5. The current iteration is intentionally unpackaged. A future distributable must use a new release identity and manifest; it must not overwrite the frozen 2.8 package or bundle the GEO matrix without an asset-level reuse decision.

## Acceptance evidence

- `npm test`: production build, lint and full scientific validation completed; 246 tests total, 244 passed, zero failed and two release-lock tests skipped by design.
- Focused Hayashi suite: 10/10 passed, including exact compressed/uncompressed source hashes, dimensions and deterministic rebuild.
- Research Explorer suite: 10/10 passed with 367 records, 123 molecular profiles, exactly 11 Hayashi profiles and zero registrations.
- Server-rendering suite: 23/23 passed, including English-only output, default overview, stable type dossier and Hayashi Cluster 6 evidence boundaries.
- Frozen curator archive check: 141 files, zero registrations, ZIP SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`.

## Decision

Accept UPG-079 as a reference-backed research-model increment. Do not promote it to a complete interneuron atlas, exact cross-study taxonomy, spatially registered model, connectome or curator-approved release.
