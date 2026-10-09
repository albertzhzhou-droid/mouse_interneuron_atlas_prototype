# Research timeline — iteration 2.65 (2026-09-23)

## Objective and rollback

Continue the open-data mouse spinal interneuron workbench in place. The immutable rollback parent is `data/research-iteration-manifest-2.64.json` (542,060 bytes; SHA-256 `2a644041bde50181466c73d4d751be8b340eec8c13198cb8dc71e4ee7dd0de73`; content SHA-256 `6f87e0a14631ff166895ed7f89b0f10e612db17d3c106f588079faf44b4b5ec3`).

## Completed increment — UPG-241 literal-label morphology handoff

- Corrected the molecular-profile call-to-action so its selected profile label now populates the source-object search in both the 1,097-record exact universe and the 142-record frozen subset. The shared query is case-insensitive literal text filtering of repository metadata, not biological label normalization or subtype inference.
- Each new discovery request remounts the morphology viewer, clears selection/geometry/error state, opens the exact-object browser, and prevents the browser from silently selecting its usual default object or the first filtered result. A researcher must explicitly select one exact NeuroMorpho record before source-local geometry is rendered.
- The profile remains the active evidence context during search. Its card says that the text query does not establish subtype equivalence or same-cell identity. Selecting an exact source object changes the focus to that object; source metadata and geometric provenance remain specific to that record.
- The `morphologyQuery` URL parameter preserves direct-link intent. A query URL explicitly requesting the morphology workspace is not redirected back to the molecular-profile tab; unrelated canonical focus routing remains unchanged.
- Added regression contracts for callback propagation, shared search state, deep-link restoration, geometry/default clearing, and no-fallback behavior. No source record, subtype mapping, identity edge, geometry, registration, or denominator was added.

## Research watch — UPG-242 mouse spinal CSF-cN SBF-SEM availability

- Nakamura et al. report single-cell tracing of 71 mouse spinal CSF-cNs and show spinal SBF-SEM material in Figure 4, including mitochondria and vesicles, plus a 3D reconstruction; Video 5 is described as serial-section SBF-SEM imagery around the central canal.
- The article’s data-availability statement identifies numerical source-data spreadsheets for Figures 2 and 7. It does not identify an EM-volume or segmentation deposit. That does not prove that no files exist elsewhere: exact figure/movie payloads, stable EM object IDs, stack dimensions, voxel axes/scale, segmentations, reconstruction provenance, checksums, and asset-level terms remain to be inventoried.
- Until a public, rights-compatible EM stack or source segmentation is verified, the route remains links-only. This iteration admits zero EM volumes, cell or organelle geometry, synapse objects, same-cell joins, or downloaded payload bytes. No internal structures are inferred for a selected NeuroMorpho cell.

## Primary sources

- [Nakamura et al., eLife 2023](https://doi.org/10.7554/eLife.83108)
- [Full text and data-availability statement (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9943067/)
- [Figures, source data, and video supplements](https://elifesciences.org/articles/83108/figures)
- [NeuroMorpho API reference](https://neuromorpho.org/apiReference.html)

## Verification

- `npm run test:research` passed: application build, full ESLint run, research validators, and 880 current tests (865 passed, 15 conditionally skipped, 0 failed).
- Local browser acceptance opened morphology discovery from the Sathyamurthy DE-1 profile. The URL retained `morphologyQuery=DE-1`; both the exact universe and frozen-subset search fields retained the same literal query; no exact morphology record was selected; the 3D state remained at zero morphology primitives and zero fallback objects.
- Regression coverage also passed for the historical 2.64 snapshot, current 2.65 manifest, query handoff/deep links, default-selection clearing, and fail-closed geometry behavior.

## Next research gates

1. UPG-242: inventory the public Figure 4 and Video 5 payloads and identify whether a full SBF-SEM volume, scale/axes, stable object IDs, or segmentation files are available under reusable terms.
2. Retain the hard geometry and same-cell gates: no EM-derived internal object may attach to a morphology record until specimen/object identity, exact coordinates, scale, segmentation provenance, and rights are verified.
3. Continue expanding mouse interneuron evidence only when source records and denominators are explicit. Repository-label search is discoverability, not a source-supported cell-type equivalence.
