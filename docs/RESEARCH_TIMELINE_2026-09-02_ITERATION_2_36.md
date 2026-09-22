# Research timeline — iteration 2.36

Date: 2026-09-02  
Transition: unpackaged research iteration 2.35 → unpackaged research iteration 2.36  
Scope: in-place public-data research, source-profile expansion and record-specific UI reconciliation. No full-project copy, release package, deployment, private data, physical specimen, inferred cell geometry or duplicated content folder was created.

## Outcome first

Iteration 2.36 closes the most visible knowledge/UI mismatch without drawing an unsupported neuron. It adds six checksum-pinned, source-local embryonic Dmrt3/dI6 transcriptomic group summaries and one corresponding source-coverage lane. The Type Atlas now exposes 168 molecular profiles across seven source namespaces; the Research Explorer contains 421 records, including seven source lanes; the source registry contains 26 canonical packages and 30 record sets; and the upgrade registry contains 162 rows through UPG-180.

Changing the selected interneuron record now changes the displayed source record, counts, markers and evidence fingerprint. It does not retain SCI synthetic anchors or substitute a generic cell. A non-SCI record with no admitted same-record object reports zero same-record internal primitives. Repeated missing fields are retained in one expandable missing-axis disclosure rather than repeated as large peer cards.

## Immutable parent

Iteration 2.36 is derived from, but does not rewrite, `data/research-iteration-manifest-2.35.json`:

- release ID: `ohri-mouse-interneuron-research-iteration-2.35.0`;
- bytes: `134630`;
- file SHA-256: `71f90cfc2c6ad2c6f74146d1992493fc77229c131764faff83657dcada797dc1`;
- manifest-content SHA-256: `0691b27bd2cd46e0d96d9a8862ff8478819572f7cfde225d20b9d9c93aeff828`.

The deterministic builder verifies all four parent fields before reading current inputs. Historical 2.35 files are snapshot inputs, not templates to overwrite.

## Dmrt3/dI6 source increment

The admitted source is Iglesias González et al. 2021:

- primary article: [doi:10.3389/fncel.2021.781197](https://doi.org/10.3389/fncel.2021.781197);
- public series: [GEO GSE185731](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE185731);
- authors' analysis: [commit `4096425edc4a8c008f6069e08ef4583120e550ae`](https://github.com/JonETJakobsson/dmrt3-single-cell/commit/4096425edc4a8c008f6069e08ef4583120e550ae);
- bundled object: a compact factual derivative only; the source loom and notebook remain checksum-pinned and link-only.

The source-local analysis frame is preserved exactly:

- three E14.5 embryos → one pooled tube → one independent library;
- 384 deposited mouse wells → 354 cells retained by the executed notebook's QC → 274 retained dI6-lineage cells;
- M1–M6 counts: `[84, 34, 33, 45, 54, 24]`, which sum to 274;
- source-local top-marker summaries: M1 `Zfhx3/Meis2/Zfhx4`, M2 `Irx4/Tshz3/Ldb2`, M3 `Pid1/Sst/Slit2`, M4 `Hoxb8/Hoxb7/Hoxb9`, M5 `Sall3/Npy/Nxph1`, M6 `Neurod6/Neurod2/Zeb2`.

M1–M6 are embryonic study-local group summaries, not six adult canonical types. Pooling leaves zero animal-resolved transcriptomic replicates. The loom does not export per-well M1–M6 assignments or scalar pseudotime; neither is reconstructed.

## Preserved source conflict

The primary-article Methods and the pinned executed notebook describe different QC, normalization and highly-variable-gene settings. This discrepancy remains one named quarantine: `methods-vs-executed-notebook-qc-hvg`.

The executed notebook is the derivation authority for the compact M1–M6 summary because it produced the committed results. That choice does not claim that the Methods text reproduces the notebook, and the two parameter sets are not averaged or silently harmonized.

## UI and knowledge-base reconciliation

The reconciled interface uses a fail-closed focus gate:

1. SCI synthetic population anchors can render only when the current focus kind is `sci_entity` and its ID exactly matches the active SCI entity.
2. Selecting a molecular profile, morphology record, source lane, anatomy label or SCI population hides the SCI anchor layer and prevents a previous SCI scene from masquerading as the selected cell.
3. The internal-reference stage and decision panel name the exact current knowledge record and display `0 same-record internal primitives` when no same-record object has been admitted.
4. Record switching updates the evidence fingerprint and result-card snippet. Dmrt3 M1–M6 cards therefore expose different labels, exact retained-cell counts, marker panels and temporal contexts.
5. Missing evidence axes remain present and non-inferable, but the UI consolidates them in one expandable disclosure with an explicit count.

This is a presentation and evidence-binding correction, not a geometry shortcut. Cross-region MICrONS references remain separate scenes and do not become internals of a selected spinal record.

## Exact release denominators

- application: `2.36.0-research.1`;
- canonical source packages: 26;
- canonical record sets: 30;
- molecular source profiles: 168;
- molecular source namespaces: seven;
- Research Explorer records: 421;
- Explorer source-lane records: seven;
- research/model upgrade rows: 162, ending at UPG-180;
- new Dmrt3/dI6 group summaries: six;
- new Dmrt3/dI6 geometry, internal objects, registrations and same-cell cross-modal joins: zero.

## Provenance implementation roots

New 2.36 files:

- `tools/build_research_iteration_manifest_2_36.mjs`;
- `schemas/research-iteration-manifest-2.36.schema.json`;
- `scripts/validate-research-iteration-manifest-2.36.mjs`;
- `tests/research-iteration-manifest-2.36.test.mjs`;
- `data/research-iteration-manifest-2.36.json`;
- `docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_36.md`.

New authoritative scientific inputs:

- `tools/build_dmrt3_di6_source_taxonomy.mjs`;
- `data/dmrt3-di6-source-taxonomy-0.1.json`;
- `schemas/dmrt3-di6-source-taxonomy-0.1.schema.json`;
- `scripts/validate-dmrt3-di6-source-taxonomy-0.1.mjs`;
- `tests/dmrt3-di6-source-taxonomy.test.mjs`.

Updated receipts cover the source/upgrade registries, rights ledger, Explorer builder/index/runtime/validator/tests, Type Atlas, source registry validator/tests, Atlas focus synchronization, internal-reference panel, evidence fingerprint, result-card snippets, Overview/Data Lab, stylesheet, rendered-HTML and MICRONS/current-manifest regressions, package metadata, README and queue. New inputs additionally pin the seven-lane/49-judgment knowledge-coverage contract, schema, validator and test; the canonical manifest-hash runtime; the immutable 2.35 snapshot validator/test; and the current-test runner. The 2.36 manifest contains 127 authoritative inputs: 113 inherited identities plus 14 new inputs.

## Geometry, internal-detail and copy boundary

Iteration 2.36 adds:

- zero source-derived cell morphologies or generic cell surrogates;
- zero membranes, nuclei, organelles, boutons, receptors, synapses or partners;
- zero atlas transforms or registrations;
- zero morphology↔transcriptomics, physiology↔transcriptomics or internal-structure↔transcriptomics same-cell joins;
- zero project copies, package copies or new folders containing a complete copy of project content.

Population-level markers, temporal context, counts and transmitter context cannot authorize a sphere, surface, neurite, organelle or synapse. An empty same-record internal scene is a positive scientific statement about availability, not unfinished rendering.

## Future research queue added during this iteration

- **UPG-177 — Fish1 comparative candidate:** admit a larval-zebrafish same-specimen EM chain only after a genuine spinal-interneuron `lore_id`, stable CAVE root, exact tables, materialization, scale discrepancy and file-level reuse terms are resolved. An untyped smoke-test root is not a cell-type substitute. [Official release](https://fish1-release.storage.googleapis.com/index.html) and [programmatic guide](https://fish1-release.storage.googleapis.com/programmatic.html).
- **UPG-178 — Guan adult-zebrafish SBEM tombstone:** keep the public volume as raw-volume context only while no stable downloadable named V2a/esV2a/Dmrt3/CoLo object is verified. Tissue pixels and paper-level class discussion do not create selected-cell geometry. [Primary article](https://doi.org/10.1073/pnas.2106785118) and [WEBKNOSSOS dataset](https://webknossos.org/datasets/b2275d664e4c2a96/zebrafish_vertebra_250um/view).
- **UPG-179 — Janelia mouse-spinal FIB-SEM inventory:** record raw and nucleus-segmentation layers as reference-only objects with `interneuronAdmitted=false` until a deposited object independently establishes a resident interneuron and exact same-cell joins. Projection axons in spinal tissue are not local interneuron surrogates. [Wild-type dataset](https://doi.org/10.25378/janelia.20134574.v1), [mutant dataset](https://doi.org/10.25378/janelia.20134979.v1) and [article](https://doi.org/10.1093/hmg/ddac072).
- **UPG-180 — Roome dorsal-horn roster and 2D spatial adapter:** enumerate the exact refined-type roster from source objects and preserve scRNA and Xenium as different cells. Adjacent 2D sections cannot be stacked into 3D without an exact transform and section order. [Primary article](https://doi.org/10.1126/science.adx5781) and [GEO GSE291462](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE291462).

## Verification record

The release gate consists of:

- Dmrt3/dI6 deterministic builder and focused contract tests;
- source-registry validation at 26 packages, 30 record sets and 168 source profiles;
- Research Explorer validation at 421 records, including 168 molecular profiles and seven source lanes;
- upgrade-registry validation at 162 rows through UPG-180;
- deterministic 2.36 manifest schema, on-disk receipt, immutable-parent, mutation and byte-rebuild tests;
- application lint/build and rendered UI tests run by the parent release workflow.

Final local verification on 2026-09-02:

- `npm test` passed the production build, ESLint, the complete validation chain and 596 Node test cases: 589 passed, seven optional source-object audits skipped, zero failed;
- `npm run test:frozen-2.8` independently reverified the unchanged 141-file curator archive at ZIP SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`;
- live-browser QA selected Dmrt3/dI6 M1 and then M4 through the interface: the fingerprint changed from 84 cells with `Zfhx3/Meis2/Zfhx4` to 45 cells with `Hoxb8/Hoxb7/Hoxb9`, the M4 fingerprint retained no stale M1 count, exactly one nine-axis missing-evidence disclosure remained collapsed, unsupported main-scene geometry stayed at zero, SCI anchors stayed hidden, the coverage lane showed seven sources, and browser warning/error logs were empty.

The provenance-focused gate was executed on 2026-09-02 and passed:

- Dmrt3 validator: six profiles; `384 → 354 → 274`; compact-contract SHA-256 `e5d7b26df781033a971282b697684cf6f71daa2fe711883475723186c2d92468`; zero geometry/internal objects/cross-source identities;
- coverage validator: seven lanes, seven axes and zero project registrations; focused tests lock all 49 judgments;
- source registry: 26 canonical sources, 30 record sets and 168 source-local profiles;
- Explorer: 421 records, zero registrations and search-index SHA-256 `2401e2e25b7b3d93b80bcda86a7072e816af95f2b5f349496d9105e3b46dc211`;
- upgrade registry: 162 queue rows from UPG-022 through UPG-180;
- immutable 2.35 snapshot: exact 134,630-byte parent file and both SHA-256 receipts passed;
- combined focused Node test run: 28 tests, 25 passed, zero failed and three optional exact-source-object audits skipped because no local source-object paths were supplied.

The final manifest's own file/content hashes are intentionally not embedded here because this timeline is itself one of the manifest's 14 newly admitted authoritative inputs. The deterministic builder and test provide those receipts without a circular dependency.

## File-specific rollback

Rollback is receipt-scoped and must not delete the project or rewrite history:

1. Remove only the six new 2.36 provenance files listed above.
2. Remove only the five Dmrt3/dI6 contract roots, then restore `app/atlas-types.ts` and `app/InterneuronTypeAtlas.tsx` to their exact 2.35 receipts.
3. Restore `data/research-source-registry-0.1.json`, its validator/test, and `docs/RIGHTS_LEDGER.csv` to the 2.35 receipts; this removes only `SRC-IGLESIAS-GONZALEZ-2021` and `RS-DMRT3-DI6-M1-M6-GROUPS` from the 2.36 delta.
4. Restore the Explorer builder, index asset manifest, search index, runtime, validator and tests to the 2.35 receipts, returning from 421/168/seven source lanes to 414/162/six source lanes.
5. Restore `app/AtlasPrototype.tsx`, `app/InternalStructureReferencePanel.tsx`, `app/ResearchRecordEvidenceFingerprint.tsx`, `app/ResearchExplorer.tsx`, `app/ResearchDataLab.tsx`, `app/ResearchOverview.tsx`, `app/globals.css` and `tests/rendered-html.test.mjs` to their 2.35 receipts.
6. Restore UPG-171/174 and remove only UPG-177–180 in `docs/RESEARCH_MODEL_UPGRADE_QUEUE.md`, then rebuild `data/research-model-upgrade-registry-0.1.json` to its 2.35 receipt.
7. Restore `package.json` and `package-lock.json` to version `2.35.0-research.1` and their 2.35 receipts.
8. Preserve all earlier manifests, timelines, morphology objects and unrelated worktree changes.

This rollback scope reverses only iteration 2.36. It does not authorize broad cleanup, removal of shared dependencies, deletion of generated scientific assets outside this delta, or creation of a parallel full-project copy.
