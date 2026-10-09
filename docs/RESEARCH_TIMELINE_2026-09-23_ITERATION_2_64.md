# Research timeline — iteration 2.64 (2026-09-23)

## Objective and rollback

Continue the public-data-only atlas in place and assess whether a high-detail, source-reported interneuron circuit could safely contribute comparative morphology evidence. The immutable rollback parent is `data/research-iteration-manifest-2.63.json` (532,687 bytes; SHA-256 `54a71daf3f4bac4e99c77c2358aad5cb6c2fc320d81d5f6f41aa2324f23a9834`; content SHA-256 `bf5d09a59e762e50123b6333e96d5b2394516cbe72ee7b0257ad8073538680f7`).

## Completed increment — UPG-240 article / supplement-list audit

- Audited Svara et al.'s author-hosted Cell Reports article and the Max Planck author-institution publication listing. The article reports a single 6 days-post-fertilization larval zebrafish spinal SBEM volume, 74 × 74 × 207 μm at 9 × 9 × 21 nm voxel pitch. The axes are retained as reported lengths and voxel pitch; no xyz axis naming or transform is introduced.
- The source volume covers two complete segments and 51% of the rostral and 71% of the caudal adjoining segment, with 2,177 somata. The article reports 139 motoneurons (68 left, 71 right), 39 cells with morphology consistent with CiD among 170 completely traced cells, and 34 CoBL reconstructions. These are source-selected reconstructions in one larva, not a population estimate or complete interneuron census. The morphological CiD label is not represented here as a genetic V2a assignment.
- The author-institution listing identifies three supplement archives: `1-s2.0-S2211124718307563-mmc6.zip`, `...mmc7.zip`, and `...mmc8.zip`. The article states that its Supplemental Information contains four figures, four tables, and three data files. The archive members themselves were not inspected. Sizes, checksums, internal formats, stable neuron IDs, coordinate fields, reconstruction completeness, and per-package reuse terms remain unknown.
- The article states that it is open access under CC BY 4.0. This is recorded as an article-level licence only; it is not treated as independently verified permission for each ZIP's payload or project redistribution.
- Added a collapsed, link-only card to the independent structure-reference panel. It shows the paper's sample and reconstruction denominators without changing the selected record or 3D scene. UPG-240 remains planned for exact archive-member / rights audit; UPG-081's separate raw-volume archive gate is unchanged.
- The audit did not download or bundle any ZIP, image, table, skeleton, mesh, segmentation, or volume data. The project admits zero Svara neuron objects, skeletons, meshes, synapse edges, identity joins, mouse transfers, or cross-species coordinate transfers. No full-project copy was created.

## Primary sources

- [Svara et al., primary author-hosted article PDF](https://pure.mpg.de/pubman/item/item_3055210_7/component/file_3055224/1-s2.0-S2211124718307563-main.pdf)
- [Author-hosted Supplementary Information PDF](https://pure.mpg.de/rest/items/item_3055210/component/file_3055225/content)
- [Official Max Planck publication listing with the three ZIP links](https://www.bi.mpg.de/publication-search/2328567?person=%2Fpersons%2Fresource%2Fpersons118241)
- [FreiDok archive candidate](https://freidok.uni-freiburg.de/data/145135) (still governed by the earlier UPG-081 stable-volume and rights gate)

## Verification

- The Svara metadata contract validates exact species, stage, acquisition dimensions, reconstruction counts, exact listed filenames, and all unknown package fields; its JSON Schema is tested with Ajv.
- Mutation tests reject invented checksums/sizes, genetic reassignment, mouse transfer, and any admitted geometry or source payload.
- `npm run test:research` passed: production build, ESLint, data/schema/source validators and 875 current tests (860 passed, 15 conditionally skipped, 0 failed/cancelled). Current test files run with concurrency capped at four to avoid large-audit resource-contention timeouts.
- Focused 2.63 immutable snapshot and 2.64 manifest checks passed. Targeted SSR, snapshot, and source-contract suite passed 46/46, including structure-panel rendering of the Svara card and explicit article-vs-supplement licence scope.
- The live research-upgrade registry resolves 222 upgrade rows, 35 research-facing UI IDs, and 0 stale denominator literals; source registry remains 28 packages, 37 record sets, 387 profiles, 11 exact rosters and 2 exact source-object sets.
- Browser visual sign-off is not claimed; SSR and production-build checks do not substitute for visual inspection.
- The production build completes with existing large-client-chunk and dynamic-route classification warnings, plus a Node `module.register()` deprecation warning; no build error was reported.

## Next research gates

1. Obtain non-download or read-only package metadata that identifies each archive's byte size, media type, checksum and declared rights.
2. Inspect only the members needed to establish exact per-neuron stable IDs, morphology modality, coordinate frame and reconstruction completeness; preserve a source-local identity graph and one-larva denominator.
3. Revisit geometry admission only after archive evidence and export terms are verified. Keep the result zebrafish- and stage-specific; it cannot fill a mouse interneuron gap by analogy.
