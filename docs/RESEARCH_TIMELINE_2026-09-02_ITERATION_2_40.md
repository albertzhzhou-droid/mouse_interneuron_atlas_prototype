# Research timeline — iteration 2.40

Date: 2026-09-02  
Working label: `2.40.0-research.1`  
Parent: immutable research iteration 2.39  
Delivery mode: in-place localhost research upgrade; no full-project copy and no distributable package

## Outcome first

Iteration 2.40 narrows the visible gap between the selected knowledge-base record and the evidence shown for it. Every one of the 376 molecular profiles across nine exact source namespaces now uses the same eight evidence-completeness slots, so a missing field stays visible instead of disappearing from a shorter card or inheriting another profile's content. Shared source context and shared limitations remain available once, while the central readout is reduced to visualization authority rather than repeating the evidence dossier.

The source-native morphology lane is also record-specific. Five locally bundled Neurolucida DAT files were audited independently. NMO 45718 retains its previously admitted 8 contour traces / 275 vertices. NMO 45674 adds only seven `CellBody` contours whose source `closed` flags are explicitly true, totalling 200 vertices. NMO 50424, NMO 50394 and NMO 50408 remain held because every soma-named contour in those files retains `sourceClosedFlag=false`. Across both admitted records, the runtime may show 15 exact source-native line loops / 475 vertices and still admits zero fill, triangles, surfaces, volumes, internal structures, standardized-SWC overlays, same-cell joins or registrations.

## UI-to-knowledge-base gap diagnosis

The prior UI could change the selected record while still looking substantially unchanged for three structural reasons:

1. Evidence cards were driven by each record's variable row inventory. A field absent from one record could vanish rather than appear as an explicit, comparable gap.
2. The five-axis modeling-readiness block, the central model readout, record evidence, shared context and missingness repeated overlapping information. Repetition made exact record changes harder to distinguish and created large cards without adding authority.
3. Source-native DAT detail was implemented as one NMO 45718-specific component. Other locally bundled DATs had no per-record audited disposition in the active view, so switching morphology records could not explain whether native detail was admitted, held or unaudited.

Iteration 2.40 repairs the presentation contract and record routing. It does not manufacture a visual difference when the source lacks one. A molecular profile still has zero admitted cell geometry, and a held DAT still renders zero native primitives.

## Fixed eight-slot molecular completeness

Every indexed molecular profile now exposes these slots in this fixed order:

1. sampling;
2. markers;
3. region;
4. life stage;
5. transmitter;
6. cell geometry;
7. internal structure;
8. provenance.

An available slot points to one exact indexed evidence row and retains its authority and source locator. A missing slot retains a machine-readable reason, source locator and detail. Missing means not established in the pinned record; it is never converted into biological absence or a zero-valued measurement.

The contract is applied to all 376 molecular profiles in the nine exact namespaces. Molecular records use the eight-slot panel instead of repeating the generic five-axis readiness panel. The complete record-specific receipt, additional record-specific fields, exact shared source context, record-specific gaps and consolidated shared limits remain available once in the evidence rail. The central record readout now reports only the selected focus identity, source namespace, rendering route, switch effect and admitted visualization-object counts. This reduces duplicate cards without removing source evidence.

## Per-record source-native contour routing

`NativeContourRecordViewer` is keyed to the currently selected `observedCellForm.neuronId`. The catalog recognizes exactly NMO 45718, 45674, 50424, 50394 and 50408:

- an admitted record loads only its own derivative, verifies the declared byte length and SHA-256 before parsing, validates the payload against that record's admission contract, and renders exact `LineLoop` objects;
- a held record exposes its record-specific audit reason and zero admitted geometry;
- a record absent from the catalog receives no native-contour component;
- changing identity aborts the prior request and prevents prior-record geometry from satisfying the new state.

The viewer preserves source coordinates in the payload. Recentering, uniform scaling, axes and the 20 µm guide are reversible viewer operations, not biological geometry or atlas placement.

## Five-DAT audit and admission table

The clean-room audit was compared with the official NeuroMorpho `xyz2swc` parser pinned at commit `e07fd2d53c03945f011c335c7b643765f2d85a09`. Ordered float32 soma point arrays agreed for all five DATs. The table distinguishes audited source objects from objects admitted for display.

| NMO | Source DAT receipt | Audited soma-named contours / vertices | Soma point-payload SHA-256 | 2.40 admission |
|---|---|---:|---|---|
| 45718 | 343,774 B · `ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415` | 8 / 275 | `a478e6263e7d00c1f17bc64143014a3519c39f771b6809a28b057db07c724ab4` | Existing 2.39 admission retained: 8 contours / 275 vertices |
| 45674 | 353,251 B · `9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87` | 8 / 227 | all eight: `fdf787a947c962e25880c427fd4004a39cb1b48526cb06a0b485d675be1a0c7f` | **7 explicitly source-closed contours / 200 vertices admitted**; admitted subset payload `b163a222ae560d3467a94f3438985c868548695205d56efaaeed454b67977208` |
| 50424 | 480,757 B · `90662374ccfacc0404b1b8817161015fa52c6c384911700f428a4c5421cb79d9` | 8 / 427 | `6638f9b056bedadaba503f3607115a4be27988ae71dd0ed8b309f3085143ab8b` | Held: 0 contours / 0 vertices |
| 50394 | 191,975 B · `eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109` | 14 / 768 | `b823d7ef36d28ec05836425c82ba5b9bd4edfd8fb1bf1b821eecce833abe8f4b` | Held: 0 contours / 0 vertices |
| 50408 | 300,076 B · `78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2` | 11 / 709 | `8052deb6cef02af95f8b7864784f8e5b9ed2c1d070c87698150b4152701a14b5` | Held: 0 contours / 0 vertices |

### NMO 45674 strict subset

The admitted NMO 45674 objects are seven `CellBody` contours with `sourceClosedFlag=true`. Their source-order vertex vector is `[14, 33, 27, 50, 46, 17, 13]`; their z vector is `[−82, −80, −80, −78, −76, −76, −74]` µm. Duplicate −80 and −76 planes remain separate and retain source order. Their deterministic 35,842-byte derivative has SHA-256 `1e41538a6443dcf7893386c180d3d22ddf81cc72a4d96f66a16193c97747cec3`.

The 2.40 audit also corrects one provenance transcription in the current catalog: the pinned official type-library Git blob SHA-1 is `31d223b111f2109e0c72149b367efd885f45e0ed`. The immutable 2.39 artifacts retain their historical byte receipts and are not rewritten; the corrected 2.40 catalog is separately hashed.

One additional 27-vertex spaced `Cell Body` object at z = −78 µm retains `sourceClosedFlag=false` and is excluded. Two open `Unknown1` traces are also excluded. The Neuromorphological File Specification documents a legacy false-flag `CellBody` case, but this source's spaced name and mixed object inventory are not silently normalized into another closed loop.

### Held Todd records

- NMO 50424 contains eight soma-named `Cell Body` objects / 427 vertices; all eight source closure flags are false.
- NMO 50394 contains fourteen soma-named `Cell Body` objects / 768 vertices; all fourteen source closure flags are false.
- NMO 50408 contains eleven soma-named `Cell Body` objects / 709 vertices; all eleven source closure flags are false.

The independent parser identifies these as soma-contour objects but preserves the false source flag. Their `User Line` contours have unresolved biological meaning. Tree, branch, marker and spine blocks are not promoted through this contour contract; markers are not boutons or synapses, spines are not synapses, and branch-leaf codes are not accepted as biological ending semantics. A future per-file policy may reassess the spaced legacy name, but iteration 2.40 admits none of these objects.

## Scientific boundary

The two admitted DAT records remain independent source-local objects. Same NeuroMorpho record identity does not establish a DAT-to-standardized-SWC coordinate transform, vertex correspondence or overlay. No contour stack is filled, triangulated or lofted. The display therefore contains:

- 15 admitted source-native closed polylines;
- 475 admitted ordered vertices and semantic last-to-first line segments;
- zero polygon fills or triangles;
- zero surfaces, membranes or biological volumes;
- zero nuclei, organelles, receptors, boutons, synapses or other internal structures;
- zero standardized-SWC overlays;
- zero same-cell molecular or cross-modal joins;
- zero atlas registrations.

The 15 contours are source objects, not 15 cells or 15 interneuron types. NMO 45718's separate legacy trace remains governed by the immutable 2.39 contract; the stricter NMO 45674 decision does not retroactively rewrite it.

## Cano-Gomez staged RDS audit and future gate

The Cano-Gomez work in this iteration remains an availability and reconciliation audit. No RDS object is bundled or admitted, and no 516-type roster or BIL spatial cell layer is instantiated.

GEO lists three supplementary Seurat RDS objects and one mapping file:

- cholinergic RDS: 127,862,795 bytes;
- GABAergic RDS: 1,646,402,816 bytes;
- updated glutamatergic RDS: 1,832,005,077 bytes;
- NHASH map: 970 bytes, containing 72 sample/channel mappings rather than cell IDs.

The article reports 169,345 neuronal nuclei, 57 groups and 516 neuronal types. These are nested source denominators, not evidence that all 516 labels are interneurons. PMC Table S1 is 47,238 bytes with SHA-256 `c705a06a8c196b947f098595ef7a7822cb64c6561cc22373b8f73314b21f0157`; its 531 type-like rows reduce to 518 exact unique strings, with 13 duplicate extras and two malformed labels. It therefore cannot instantiate the reported 516-type roster by itself.

Standard BIL output also lacks the final `cell_id` → `groups_manual` / `neuron_types` bridge. UPG-190 remains the exact acquisition, checksum, Seurat-object and rights preflight; UPG-191 remains the BIL identity-bridge gate. UPG-204 is the planned final stable-nucleus/type/group reconciliation plus explicit motor- and projection-neuron exclusion gate. Until those gates pass, Cano-Gomez contributes zero admitted molecular profiles, interneuron classifications, spatial primitives, morphology, internal structures, same-cell joins or registrations.

## Files added in iteration 2.40

Native-DAT audit, geometry and runtime:

- `app/neurolucida-native-contour-admission.js`;
- `app/NativeContourRecordViewer.tsx`;
- `data/neurolucida-native-contour-admission-catalog-0.2.json`;
- `public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-45674-source-closed-soma-contours.json`;
- `tools/build_neurolucida_native_contour_admission_catalog.mjs`;
- `scripts/validate-neurolucida-native-contour-admission-catalog-0.2.mjs`;
- `tests/neurolucida-native-contour-admission-catalog.test.mjs`.

Immutable-parent and iteration envelope:

- `scripts/validate-research-iteration-manifest-2.39-snapshot.mjs`;
- `tests/research-iteration-manifest-2.39-snapshot.test.mjs`;
- `tools/build_research_iteration_manifest_2_40.mjs`;
- `schemas/research-iteration-manifest-2.40.schema.json`;
- `scripts/validate-research-iteration-manifest-2.40.mjs`;
- `tests/research-iteration-manifest-2.40.test.mjs`;
- `data/research-iteration-manifest-2.40.json`;
- `docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_40.md`.

The five 2.40 manifest-envelope files are required to be present at iteration closure. They are listed here while their final generated receipts and validation results remain pending below.

## Files modified in iteration 2.40

Record-specific UI and routing:

- `app/AtlasPrototype.tsx`;
- `app/atlas-types.ts`;
- `app/globals.css`;
- `app/ObservedMorphologyRouteLibrary.tsx`;
- `app/ResearchFocusEvidencePanel.tsx`;
- `app/ResearchRecordModelReadout.tsx`;
- `app/ResearchOverview.tsx`;
- `app/research-record-presentation.js`.

Source and upgrade registries:

- `data/research-source-registry-0.1.json`;
- `scripts/validate-research-source-registry-0.1.mjs`;
- `tests/research-source-registry.test.mjs`;
- `docs/RESEARCH_MODEL_UPGRADE_QUEUE.md`;
- `tools/build_research_upgrade_registry.mjs`;
- `scripts/validate-research-model-upgrade-registry-0.1.mjs`;
- `tests/research-model-upgrade-registry.test.mjs`.

Version, presentation and command pointers:

- `package.json`;
- `package-lock.json`;
- `app/layout.tsx`;
- `README.md`;
- `tests/rendered-html.test.mjs`;
- `tests/research-record-presentation.test.mjs`;
- `tests/observed-morphology-runtime-contract.test.mjs`;
- `tests/microns-observed-cell-nucleus-reference.test.mjs`;
- `tools/run_current_research_tests.mjs`;
- `scripts/validate-neurolucida-source-native-soma-contour-trace-0.1.mjs` (the live validator now recognizes the shared record-gated viewer while the 2.39 snapshot remains immutable).

The immutable `data/research-iteration-manifest-2.39.json` is not modified.

## Verification record

Completed focused checks during implementation:

- native-contour catalog, geometry, identity-gating and related focused checks: **15 passed, 0 failed**;
- fixed-slot record-presentation tests: **7 passed, 0 failed**;
- focused Research Overview server-render check: **1 passed, 0 failed**;
- immutable 2.39 snapshot checks: **3 passed, 0 failed**;
- targeted ESLint: **0 errors**; the CSS ignored-file warning is non-failing;
- production build: **passed**.

Final closure checks:

- `npm run test:research`: **670 tests; 662 passed; 8 skipped; 0 failed**. The skips are optional online re-derivations and do not admit any object or claim.
- production `vinext build`: **passed**; ESLint: **0 errors**. The bundler retained its non-failing large-chunk advisory.
- deterministic 2.40 manifest builder `--check`, strict AJV 2020-12 schema validation, on-disk receipt validation, byte-identical rebuild and mutation tests: **passed**. The final manifest retains **187 authoritative inputs**, **27 canonical sources**, **33 record sets**, **9 exact cell/profile rosters + 1 exact source-object set**, **376 molecular profiles**, **186 upgrades through UPG-204**, **15 admitted line loops / 475 vertices**, and zero surfaces, internal objects or registrations.
- immutable snapshots through 2.39: **passed**; no historical manifest was rebuilt from current live inputs.
- frozen curator 2.8 package: **141 files verified**, zero registrations, ZIP SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`.
- live localhost browser QA on port 3001: NMO 45674 reached `CHECKSUM VERIFIED` with one exact canvas and 7 loops / 200 vertices; NMO 45718 reached its exact record with one canvas and 8 loops / 275 vertices; NMO 50424, 50394 and 50408 each exposed the exact held record with zero admitted loops, zero vertices and zero canvases; NMO 109005 and an Alkaslasi I1 molecular selection exposed no native-contour component and zero canvases.
- the browser record sequence confirmed that an admitted canvas did not survive a held, unaudited or molecular selection. Console inspection returned Vite connection and React development notices only, with no application error entry.

This closes iteration 2.40. Its Todd decision remains intentionally conservative; UPG-203 may change the next iteration only if file-specific closure evidence is recorded without rewriting this snapshot.

## File-specific rollback

Rollback is in place and receipt-scoped. Do not create a project copy, replace the full project or use broad deletion.

1. Remove only the new 2.40 native-contour files listed above, including the NMO 45674 derivative. Preserve the 2.39 NMO 45718 contract, geometry, builder and `NativeSomaContourViewer` files.
2. Restore only the 2.40 edits in `AtlasPrototype.tsx`, `atlas-types.ts`, `globals.css` and `ObservedMorphologyRouteLibrary.tsx`, returning native-contour routing to the NMO 45718-only 2.39 behavior.
3. Restore only the 2.40 fixed-slot and de-duplication edits in `research-record-presentation.js`, `ResearchFocusEvidencePanel.tsx`, `ResearchRecordModelReadout.tsx`, `ResearchOverview.tsx`, `rendered-html.test.mjs` and `research-record-presentation.test.mjs` to their 2.39 receipts.
4. Restore the source registry and its validator/tests to the 2.39 receipt. Remove only the NMO 45674 and five-file native-DAT catalog additions; retain the existing NMO 45718 source-object set.
5. Restore `RESEARCH_MODEL_UPGRADE_QUEUE.md` and the generated upgrade-registry builder, registry, validator and test to the 2.39 state: 178 rows ending at UPG-196. Remove only the 2.40 rows added after UPG-196, including UPG-204, and rebuild the registry rather than hand-editing generated content.
6. Restore `package.json`, the root `package-lock.json`, `app/layout.tsx` and `README.md` to `2.39.0-research.1`. Return `validate:research-manifest`, `build:research-manifest`, current-test routing and visible iteration labels to their 2.39 pointers.
7. Remove only the 2.40 manifest builder, schema, validator, test, generated manifest and this timeline. Remove the two 2.39 snapshot helper files only if they were introduced solely for the 2.40 child; keep `data/research-iteration-manifest-2.39.json` and its timeline byte-identical.
8. Re-run the restored 2.39 focused and manifest checks. Preserve the archived `2.8.0-curator.1` package and all unrelated worktree changes.

This rollback returns the active research/version pointers to iteration 2.39 without creating a parallel project copy or altering earlier public-data evidence.
