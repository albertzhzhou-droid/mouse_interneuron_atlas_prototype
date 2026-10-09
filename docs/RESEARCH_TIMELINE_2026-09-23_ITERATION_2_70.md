# Research timeline — iteration 2.70 (2026-09-23)

## Scope

Continued the existing mouse spinal interneuron atlas in place from the sealed 2.69 parent. This iteration records a bounded NeuroMorpho 8.6.126 discovery signal under UPG-245; it does not reconcile or expand the active 8.6.124 geometry corpus.

## Evidence update

- The official NeuroMorpho release banner reported version 8.6.126, dated 2026-09-23, and 298,745 repository reconstructions. Its homepage announcement mentioned 30 novel Todd archive reconstructions.
- The metadata search interface showed 339 hits for the selected filters: mouse, spinal cord, interneuron, Todd. No age filter was applied.
- This is a UI hit count, not a stable-ID census or a 8.6.126-versus-8.6.124 delta. Stable IDs and a machine-readable API response were not retrieved. The selected Todd archive filter differs from the bundled 1,097-record 8.6.124 no-age query, so those two counts are not comparable as additions or as an interneuron denominator.
- The API reference is documented, but the exact response remained unobtained in this review. Release totals and the 30-item homepage announcement are not used to infer spinal-interneuron eligibility.

## Model and UI disposition

- Added a current-release watch card beside the historical 8.6.125 adult-query comparison. The card labels the 339 as Todd-filter UI hits and visibly states that the exact delta is unresolved.
- Updated UPG-245 to partially completed for the UI audit only; stable-ID reconciliation, exact file review, object classification, integrity, dimensionality and reuse-term checks remain open.
- Kept NeuroMorpho 8.6.124 as the active geometry release. Added records, geometry objects, identity joins, registrations, measurements and downloaded payload bytes remain 0.
- Refreshed the research upgrade registry from its source queue and retained its dynamic denominators and stale-literal check.

## Verification and rollback

- The dedicated UI-audit tests reject false stable-ID comparisons, denominator changes and geometry admission.
- The 2.70 manifest seals the exact 2.69 manifest as its immutable parent and records a distinct timeline path.
- Roll back this iteration by restoring the sealed parent named in `data/research-iteration-manifest-2.70.json`; do not delete or overwrite the parent snapshot.
- No full-project copy was created.
