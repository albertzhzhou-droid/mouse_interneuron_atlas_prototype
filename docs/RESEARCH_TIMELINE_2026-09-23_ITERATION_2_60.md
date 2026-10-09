# Research timeline — iteration 2.60 (2026-09-23)

## Objective and rollback

Continue the open-source, evidence-bounded research atlas in its existing project tree. The immutable rollback parent is `data/research-iteration-manifest-2.59.json` (385,525 bytes; SHA-256 `43723cd3a02c398a6e1c009c15919df969b4a48d5f14612840665fb1ed5cff63`; content SHA-256 `4bfec6af50db2b7fbb76b9ac2909289322f1327569984dc95ad7170b21fc0bdc`). Its 215 research/model milestones remain a historical sealed snapshot; the live queue advances through UPG-235.

## Research increment

- Added UPG-234: a separate-study PKD2L1-positive population-context card that appears only within the Crozat PKD2L1 dossier. It transcribes the eight Table 5 mean ± SD [minimum, maximum] strata from Leblond et al. (2025): two ages, two sexes and four spinal regions, for PKD2L1-positive cells per histological section and centroid distance from the central-canal centre.
- Preserved the study frame as 18 mice and 811 sections; reported age-stratum sections are 401 at 3 weeks and 410 at 8 weeks, and sex-stratum sections are 413 female and 398 male. These section groups reconcile to 811 but remain nested within animals; the mouse, not each section, is the biological replicate. No age-by-sex or region-by-age intersection values are generated from the marginal summaries.
- No per-region Table 5 section N is supplied in the retained source contract; the four region-specific section counts therefore stay null. Marginal age, sex and region summaries must not be summed.
- The card discloses proximal (≤100 µm) versus distal (100–230 µm) distance bands and the source's uncertainty about distal PKD2L1-positive cell identity. It does not assume functional equivalence between those groups.
- Added the reported imaging-method metadata (10× whole-cord and 20× central-canal confocal settings) for interpretation only. No images, segmentations, per-cell coordinates, individual morphologies, internal structures, 3D objects, Crozat same-cell join or atlas registration were admitted.
- UPG-235 adds a future audit for a stable public raw-image deposit. The article states raw data will be made available by the authors “without undue reservation” but provides no public repository object in the reviewed article. The project remains public-data-only: no private file request or unpublished data are in scope.
- The main 3D scene is not made more geometrically detailed by this iteration. The aggregate data do not support a cell-specific shape or internal model; the exact observed SWC viewer and its unregistered source frame remain the defensible morphology route.

## Source and rights

- [Leblond et al. 2025, full article and Table 5](https://doi.org/10.3389/fnana.2025.1652848). The article is published under CC BY; the app presents attributed, article-reported aggregate values and does not bundle article figures or image files.
- The source's Data Availability Statement says raw data will be made available by the authors without undue reservation. This is not itself an identified public dataset or a verified raw-image release.

## Verification

- Contract validation reconciles the two published age section counts and the two sex section counts independently to 811; it rejects inferred region denominators, raw-data availability promotion, per-cell morphology, geometry, same-cell joins and interneuron-count promotion.
- Registry synchronization adds UPG-234 and UPG-235 from the queue; the historic 2.59 snapshot remains independently checksum-verified.
- Production build and lint passed. The build retains a known warning for minified chunks above 500 kB; that remains queued technical debt rather than being hidden with a higher warning threshold.
- Full `npm run test:research` passed: 855 tests total, 840 passed, 15 explicitly skipped for unavailable optional external inputs/runtimes, and 0 failed. The initial run exposed one stale MICrONS test reference to the immutable 2.59 manifest; the test now follows the current 2.60 release, whose manifest independently pins the same MICrONS assets. The follow-up full gate passed.
- The focused UI, PKD2L1 contract, UPG registry, and current/historical manifest tests passed (58/58 before the final MICrONS pin update; the dedicated MICrONS suite passed 8/8 after it).
- Dynamic registry denominator validation reports 28 canonical sources, 37 record sets, 11 exact cell/profile rosters, 2 exact source-object sets, and 0 stale literals. The live upgrade registry contains 217 rows through UPG-235, with 31 research-facing IDs resolved.
- The 2.60 research manifest validates with 494 exact inputs, parent release 2.59, 217 upgrade rows, all 8 Table 5 strata, no verified public raw-data deposit, 0 admitted geometry primitives, and 0 full-project copies. The immutable 2.59 parent remains separately verified.
- Incremental-layout validation passed with `fullProjectCopyCount: 0`.
- A native screenshot-based visual review was not possible during this iteration because the Mac remained locked and the in-app browser exposed no page. Code/rendered-HTML checks are not reported as a substitute for that visual review.

## Workspace and rollback discipline

The project tree is updated in place. No new folder containing a complete project copy is created. No source-data bundle, geometry copy, or scratch output is added. No commit or push is made by this iteration. The rollback path is the immutable 2.59 manifest above.
