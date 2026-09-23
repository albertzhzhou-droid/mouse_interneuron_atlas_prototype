# Research timeline — iteration 2.50 (2026-09-22)

## Scope

Continue the public-source evidence audit after the partial BANC v888 candidate chain. This increment reconciles publication-facing version receipts for adult-mouse spinal MERFISH files; it does not download either H5AD, create a new cell denominator, add cell morphology, or add internal structure.

## Source audit

- Zenodo record `18039571` and record `20533289` have the same study title but distinct file names and published MD5 checksums. The later record page is explicitly marked v2; its object names are not the names on record `18039571`.
- A later spatial-transcriptomics annotation benchmark cites record `18039571` as a dataset of 18 mouse spinal-cord sections. The existing UPG-152 audit of the v2 H5AD reports 108 section IDs. These are not interchangeable denominators until exact H5AD observation, sample and section keys are compared.
- Zenodo versioning describes separate identifiers for record versions and a concept DOI for the record family. The machine-readable lineage between these two specific records has not been independently confirmed in this increment; the same title and creator are not treated as proof.
- The reviewed landing pages expose open-access availability, but no file-level redistribution licence was visible. No data payload is redistributed.
- The adult spinal-cord study reports seven MERFISH imaging z-planes, but this acquisition fact does not prove that the deposited H5ADs contain serial cell masks, per-plane boundaries or reconstructable cell geometry.

## Changes

- Added a machine-checked metadata-only record comparing the two published file manifests, including v1/v2-specific names and MD5s, observed version label, publication context, open gates and zero-admission counts.
- Added UPG-222 as a P0 version-lineage and exact-file comparison gate; clarified UPG-152 so it cannot silently conflate versions or section denominators.
- Kept both source files unbundled and left version lineage, file-level rights and H5AD-level content comparison explicitly unresolved.
- Promoted the current application and research manifest to 2.50. Sealed the 2.49 manifest by its existing exact file/content hashes and preserved 2.48 as its immutable parent.

## Verification

`npm run test:research` passed: 792 tests total, 777 passed, 15 skipped, 0 failed. This includes the production build, lint, the new version-audit and upgrade-registry tests, the 2.49/2.48 immutable snapshot checks, the 2.50 manifest check, and renderer regressions. A separate rendered-HTML run passed all 39 tests. The production build retains non-blocking Node deprecation, large-client-chunk and route-classification advisories. No fresh visual screenshot review or H5AD payload inspection is claimed.

## Open gates

UPG-221 remains partial: no BANC mesh, nucleus surface, mitochondria or synapse rows are admitted. UPG-222 remains partial: confirm the two records' all-version metadata, retrieve and checksum each object, compare exact H5AD structure/keys/denominators, and resolve file-level reuse rights before any importer. Both routes remain metadata/provenance only until their declared evidence gates pass; neither authorizes fabricated geometry or internal compartments.
