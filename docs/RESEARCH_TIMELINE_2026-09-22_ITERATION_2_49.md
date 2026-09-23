# Research timeline — iteration 2.49 (2026-09-22)

## Scope

Continue the evidence-led internal-detail queue from the public BANC/CAVE Drosophila VNC comparison route. This iteration audits one metadata-qualified candidate and improves its information card; it does not add BANC geometry to the mouse spinal atlas. Drosophila remains a separate comparative species lane.

## Source audit

- Pinned Harvard Dataverse dataset DOI `10.7910/DVN/7WTH1N`, released version 3, and verified the Feather metadata file receipt in `data/banc-v888-candidate-audit-0.1.json`.
- Parsed metadata has 188,508 rows × 81 columns, differing from the current schema documentation (188,162 × 79). Both are segment-level metadata counts, not interneuron denominators.
- A strict metadata screen yields 12,571 rows satisfying the declared VNC-intrinsic, proofread, nucleus, position, subclass, and type fields. It is a candidate filter, not a biological census.
- The deterministic sentinel is root `720575941350424112`, cell type `IN14A018`, subclass `ventral_nerve_cord_contralateral_restricted`. Its nucleus annotation row has a matching root ID. The DOI-pinned SWC archive member was extracted by bounded byte ranges and has 7,451 nodes; its checksum is recorded in the candidate receipt.
- Candidate mitochondria annotation rows and synapses were not independently filtered. Matching GCS mesh fragments are mutable, pre-v888, lack a release-materialization link, and do not have verified object-level reuse terms. Therefore the same-cell geometry chain remains incomplete.

## Changes

- Added the candidate audit contract, validator, and regression test.
- Updated the internal-reference information card with the release/documentation discrepancy, candidate/root/nucleus/SWC receipts, and explicit unresolved object gates. The candidate remains informational only and is not joined to the selected mouse cell.
- Updated UPG-219 and UPG-221 queue evidence and rebuilt the derived upgrade registry from the queue.
- Promoted the current app/package version and research manifest to 2.49 while preserving the 2.48 manifest as an immutable parent snapshot. Added exact input receipts for this iteration.

## Verification

The candidate audit and regression tests, UPG registry suite, 2.48 immutable-snapshot check, 2.49 manifest validation, application production build, and ESLint all pass. `npm run test:research` completed with 788 tests: 773 passed, 15 skipped, and 0 failed. The production build emits a non-blocking large-client-chunk advisory. This iteration was checked through automated build, data, and renderer-contract tests; no fresh browser screenshot review is claimed.

## Open gates

No BANC meshes, nuclei, mitochondria, synapses, registrations, same-cell joins, or geometry are admitted. Do not infer mouse spinal anatomy, homology, causal function, or an interneuron denominator from this fly dataset. Continue with exact object/version identity, candidate-specific mitochondria and synapse rows, and object-specific reuse evidence before considering any rendering.
