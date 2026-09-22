# Research timeline — iteration 2.38

Date: 2026-09-02  
Transition: unpackaged research iteration 2.37 → unpackaged research iteration 2.38  
Scope: in-place public-data research, source-record presentation repair, one source-local developmental taxonomy increment and one qualitative publication-video reference. No full-project copy, release package, deployment, private data, physical specimen, inferred cell geometry or duplicated content folder was created.

## Outcome first

Iteration 2.38 makes the selected knowledge-base record drive the central evidence model, source-locked detail rail and five-axis modeling-readiness display. Switching between interneurons now replaces record-specific identity, counts, markers or source measurements. Byte-identical source context and shared missingness remain available but appear once instead of being repeated across large peer cards. A molecular record is explicitly presented as evidence, not as a cell shape, and clears any previously selected morphology.

The iteration also adds 51 exact source-local Delile embryonic fine-subtype aggregates. The Research Explorer now contains 630 records, including 376 molecular profiles across nine namespaces, and its manifest pins 20 source files. The canonical source registry remains at 27 packages while increasing to 32 record sets. The research/model queue contains 171 rows through UPG-189.

eLife 83108 Video 5 is available as a separately attributed, remote qualitative SBF-SEM reference for mouse PKD2L1-positive cerebrospinal-fluid-contacting neurons. It remains publication imagery rather than a coordinate-bearing raw object and contributes zero geometry and zero internal objects.

## Immutable parent

Iteration 2.38 derives from, and does not rewrite, `data/research-iteration-manifest-2.37.json`:

- release ID: `ohri-mouse-interneuron-research-iteration-2.37.0`;
- bytes: `161281`;
- file SHA-256: `2ddc5b4cce26cbe5db492234446a52f3c0f182c0ff0ed896104ec6a9c4fb3b08`;
- manifest-content SHA-256: `04b6f7a09968489afa420edb527a159e04f4dc07bab4ce402e394808256ca765`.

The 2.38 builder verifies all four fields before hashing any current input. Historical 2.37 files remain unchanged.

## Record-driven UI and knowledge-base reconciliation

The presentation contract partitions every Explorer record into three evidence sections:

1. record identity;
2. record-specific evidence;
3. exact shared source context.

Evidence and missingness indices form complete, non-overlapping partitions. Shared rows are collapsed only when their complete label, value, authority and locator receipts are byte-identical across the namespace. Distinguishing rows therefore remain attached to the selected record.

Each selected record exposes five readiness axes: source record, cell geometry, internal structure, atlas registration and cross-source same-cell identity. Only an exact morphology record can report one admitted source-local geometry object. Molecular, anatomy, SCI and coverage records report zero admitted cell geometry. Every record reports zero generated fallback primitives, zero same-record internal objects, zero registrations and zero same-cell joins.

This resolves the earlier unchanged-cell impression without manufacturing visual differences. When two molecular records have different evidence, their readouts change. When the knowledge base contains no same-cell morphology, the scene stays empty and states why.

## Delile developmental taxonomy increment

The source is Delile et al. 2019:

- primary article: [doi:10.1242/dev.173807](https://doi.org/10.1242/dev.173807);
- study accession: [BioStudies E-MTAB-7320](https://www.ebi.ac.uk/biostudies/arrayexpress/studies/E-MTAB-7320);
- authors' analysis: [commit `5de98d43bf89a003ea43aeb599136f7a4e1ee055`](https://github.com/juliendelile/MouseSpinalCordAtlas/tree/5de98d43bf89a003ea43aeb599136f7a4e1ee055);
- parsed source object: `output/phenoData_annotated.csv`, 3,036,323 bytes, SHA-256 `4f5bd353771ea478928e305df784f3fc868bb89a9ffc5fbce112da70c4a769bf`;
- compact factual derivative: 122,037 bytes, SHA-256 `7a77c8c10f15224188bb542fddf63bc97de57b06dd9289e324bc7b8612219597`.

The exact denominator chain is retained:

- 41,025 metadata rows;
- 18,144 source-defined neurons;
- 15,394 typed non-motor neurons;
- 15,217 cells assigned to 51 exact fine subtypes;
- 177 cardinal-only cells outside the fine roster: 95 `dl6` and 82 `V2a`;
- 1,056 excluded `MN` cells;
- 1,694 excluded `Null_Neuron` cells.

Five stages, E9.5 through E13.5, and 12 stage–replicate labels are preserved. The table does not resolve a biological-animal count, so those labels are not promoted to 12 animals. Source spelling `dl` remains unchanged; it is not silently rewritten to `dI`.

The public authors' repository has no detected explicit licence. The source annotation object remains link-only under `NOASSERTION`; only the attributed compact factual aggregate is bundled. These 51 records are embryonic source-local labels, not adult identities or cross-study canonical types. They add zero morphology, whole-cell geometry, internal structures, electrophysiology, synapses, SCI identity, registrations or cross-modal joins.

## PKD2L1 publication-video reference

The admitted reference is Nakamura et al., eLife 2023:

- article: [doi:10.7554/eLife.83108](https://doi.org/10.7554/eLife.83108);
- article API version: 2;
- API receipt: 247,909 bytes, SHA-256 `854963b39bbb091f4cf3a03c470e3a644a69444741b59aa6287b31ed10f97944`;
- Video 5 frame size: 872 × 1080;
- MP4 receipt: 46,541,650 bytes;
- reported acquisition context: 5 nm/pixel, 50 nm section step and more than 25 µm depth.

The remote video can be viewed as qualitative publication imagery. The official article and API do not expose an admitted raw coordinate-bearing stack, segmentation labels, mesh or skeleton. That statement is scoped to the official article and API; it is not a universal absence claim. No tracing, segmentation, interpolation, depth reconstruction, measurement, atlas registration or same-cell join is permitted. The video is not fused with the Crozat profile or any other selected record.

## Exact release denominators

- canonical source packages: 27;
- canonical record sets: 32;
- bundled exact rosters: nine;
- molecular source profiles: 376;
- molecular source namespaces: nine;
- Research Explorer records: 630;
- Research Explorer source files: 20;
- Delile fine subtypes: 51;
- research/model upgrade rows: 171, ending at UPG-189;
- new inferred geometry, fallback shapes, internal objects, registrations and same-cell joins: zero.

## New 2.38 files

- `tools/build_research_iteration_manifest_2_38.mjs`;
- `schemas/research-iteration-manifest-2.38.schema.json`;
- `scripts/validate-research-iteration-manifest-2.38.mjs`;
- `tests/research-iteration-manifest-2.38.test.mjs`;
- `data/research-iteration-manifest-2.38.json`;
- `docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_38.md`.

New authoritative inputs include the Delile builder/contract/schema/validator/test, the PKD2L1 publication-video contract/caption/validator/test, and the record-presentation runtime/readout/test. All 146 parent input IDs, scopes and paths remain in their original order, with current receipts rehashed, followed by 13 new 2.38 inputs. Eight cumulative live artifacts receive current-purpose descriptions for their 2.38 counts or versions; every other inherited purpose remains unchanged. The immutable 2.37 parent file is not edited. The final manifest therefore contains 159 authoritative inputs.

## Verification record

The focused scientific and integration gate on 2026-09-02 verified:

- Delile: 51 profiles / 15,217 cells; exact compact-contract SHA-256 `7a77c8c10f15224188bb542fddf63bc97de57b06dd9289e324bc7b8612219597`;
- PKD2L1 Video 5: qualitative publication reference with zero admitted geometry primitives;
- source registry: 27 canonical sources, 32 record sets and 376 source-local type records;
- Explorer: 630 records, 20 source files, zero registrations and search-index SHA-256 `527fc440e1699da86e2512b2b1043984ef2ce189013672e18476810481b32f8a`;
- upgrade registry: 171 rows from UPG-022 through UPG-189;
- presentation contract: all 630 records partition evidence and missingness exactly once, molecular switching clears geometry, shared source context is collapsed only on exact equality, and no fallback shape is generated;
- deterministic 2.38 manifest: immutable-parent receipt, schema, on-disk input receipts, byte-identical rebuild and mutation rejection.
- current automated suite: 641 tests, 633 passed, eight optional online-source audits skipped and zero failed;
- production build and full-project lint: passed;
- live production-browser switches: Delile `dl1.1` → `V3.4`, Sathyamurthy `DE-1` → `DE-2`, Roome `dILA1-A1` → `dILB6-E1`, and exact morphology `NeuroMorpho:109005` → `NeuroMorpho:109021` all replaced current-record content without retaining the prior record; molecular switches retained zero geometry, zero internal objects and zero fallback shapes, while both morphology objects loaded from their own verified bytes;
- browser console: zero errors and zero warnings across the inspected record, morphology and internal-reference states;
- frozen curator package 2.8: unchanged and independently reverified as 141 files, zero registrations and ZIP SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`.

The manifest's own file and content hashes are intentionally not embedded here because this timeline is one of its 13 newly admitted inputs. The builder and validator report those receipts without a circular dependency.

## Package metadata integration

The live research workspace is versioned `2.38.0-research.1` in both `package.json` and the root `package-lock.json`. The current build and validation routes point to the 2.38 manifest, include the Delile and PKD2L1 gates, and retain the immutable 2.37 snapshot check. This is an unpackaged research iteration: the frozen 2.8 curator ZIP remains unchanged and no new distributable package is created here.

## File-specific rollback

Rollback is receipt-scoped and must not delete the project or rewrite history:

1. Remove only the six new 2.38 files listed above.
2. Remove only the Delile builder/contract/schema/validator/test, then restore the source registry, Explorer builder/index/manifest/runtime/validator and related UI receipts to their 2.37 values. This returns the source registry from 32 to 31 record sets and Explorer from 630/376/nine namespaces/20 sources to 579/325/eight namespaces/19 sources.
3. Remove only the PKD2L1 Video 5 contract, caption, validator and test, then restore the internal-reference panel and atlas-type import receipts to their 2.37 values.
4. Remove only the record-presentation runtime, readout and test, then restore Atlas focus, Explorer, focus evidence rail and stylesheet receipts to their 2.37 values.
5. Restore the research queue and generated upgrade registry to the 2.37 receipts, removing only UPG-183 through UPG-189.
6. Preserve the immutable 2.37 manifest/timeline, all earlier scientific objects, and unrelated worktree changes.

This rollback reverses only iteration 2.38. It does not authorize broad cleanup, deletion of shared dependencies, removal of earlier morphology objects, or creation of a parallel full-project copy.
