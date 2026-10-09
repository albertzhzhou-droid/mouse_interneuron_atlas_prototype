# Research timeline — iteration 2.72 (2026-09-23)

## Scope

Continued in place from the immutable 2.71 parent. Reconciled the official NeuroMorpho 8.6.126 Todd release set with the bundled 8.6.124 no-age mouse spinal-interneuron query under UPG-245. This is a metadata/stable-ID audit, not a geometry import.

## Evidence update

- The official 8.6.126 Todd release page lists 30 novel reconstructions. The 30 release labels were individually reviewed for archive, species, region, cell-class and record metadata; 30 unique stable NeuroMorpho IDs were recovered.
- The candidates were compared with all 1,097 stable IDs in the pinned 8.6.124 no-age query. Zero candidate IDs occur in the baseline. Its exact Todd-filtered subset is 309 records.
- The current metadata UI reports 339 hits for mouse + spinal cord + interneuron + Todd with no age filter. `309 + 30 = 339` reconciles arithmetically, but it is not a complete current-query stable-ID census and cannot rule out removals or metadata changes.
- The release watch card now exposes each candidate's stable ID and official detail-page link while retaining the incomplete-roster caveat.

## Model and UI disposition

- Keep the 8.6.124 denominator and geometry corpus active. The 30 candidates remain source metadata, not admitted records.
- No original morphology files were downloaded or hashed. Object-level reuse terms, file dimensionality and completeness remain unreviewed.
- No new record, geometry, internal structure, identity join, registration or measurement was admitted.

## Verification and rollback

- The stable-ID audit validator recomputes the 8.6.124 Todd-filtered baseline subset and verifies the 30 candidate IDs are unique and absent from that baseline.
- The 2.72 manifest seals the exact 2.71 manifest as immutable parent and includes this unique timeline file.
- Roll back this iteration by restoring the parent listed in `data/research-iteration-manifest-2.72.json`; preserve that parent snapshot.
- No full-project copy was created.
