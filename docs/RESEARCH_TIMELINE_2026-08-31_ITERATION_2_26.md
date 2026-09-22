# Research Timeline — 2026-08-31 — Iteration 2.26

> **Version transition:** `2.25.0-research.1` -> `2.26.0-research.1`  
> **Recorded at:** 2026-08-31 14:59 EDT  
> **Mode:** in-place localhost research iteration; open/public digital data only  
> **Packaging status:** no distributable package was created, and no folder containing a complete project copy was created.

## Outcome

Iteration 2.26 admits two exact, independent NeuroMorpho.Org release `8.6.124` source objects as functional-class observed-morphology routes:

- `NMO_45674`: one young, calbindin-positive, glycinergic Renshaw interneuron reconstruction from mouse L5 lamina VII.
- `NMO_50424`: one young-adult, NPY-positive interneuron reconstruction from superficial lumbar dorsal horn / L2i.

These are individual, source-local reconstructions. They are not averages, archetypes, complete cells, atlas-registered objects, or morphology-to-transcriptomic identities.

| Denominator | 2.25 | 2.26 | Interpretation |
|---|---:|---:|---|
| Active unique main-scene morphologies | 8 | 10 | Two non-overlapping source objects appended by exact `neuronId` |
| Named observed-morphology routes | 5 | 7 | Six dorsal-horn routes and one ventral-horn Renshaw route |
| Frozen adult-query census | 142 | 142 | No census expansion |
| Representation states / routes | 9 / 11 | 9 / 13 | Two exact route-authority bindings added |
| Canonical source packages / record sets | 24 / 25 | 24 / 26 | One functional-class record set added under the existing NeuroMorpho source package |
| Durable upgrade rows | 118 | 124 | `UPG-137`–`UPG-142` added; `UPG-130` and `UPG-131` completed |
| Native DAT semantic objects | 0 | 0 | DAT files are checksum-pinned provenance bytes only |
| Exact same-cell physiology joins | 0 | 0 | Paper-level physiology has no exact object key |
| Same-specimen internal structures / rendered internal primitives | 0 / 0 | 0 / 0 | Missing object-level evidence creates no substitute geometry |
| Cross-source identities / project registrations | 0 / 0 | 0 / 0 | Co-display and shared labels create neither identity nor placement |

## Exact public-data receipts

### `NMO_45674` — Renshaw route

- Route: `mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674`
- Source record: `NeuroMorpho:45674`, neuron name `101029p2-A-In`
- Geometry: 6,973 nodes, 6,972 segments, including 6,247 source type-2 axon nodes
- Integrity: `Dendrites & Axon Moderate`; complete-axon claim is false
- Standardized SWC: 294,364 bytes; SHA-256 `95b2fc29900a994ef87d6f50c07481115f94207c5ebaeb9f436e7e494edac1fd`
- Source-native DAT: 353,251 bytes; SHA-256 `9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87`
- Preparation boundary: the repository's 50 µm horizontal preparation and the paper's 400 µm transverse recording / later 50 µm serial resection context remain non-equivalent stages.
- Identity boundary: the GlyT2-EGFP context is not individual-genotype validation, and no exact same-cell physiology key was established.

### `NMO_50424` — NPY route

- Route: `mouse.sc.npy_l2i_dorsal_horn.observed.nmo_50424`
- Source record: `NeuroMorpho:50424`, neuron name `C135-18-06-13-Ab`
- Geometry: 9,805 nodes, 9,804 segments, including 8,718 source type-2 axon nodes
- Integrity: `Dendrites & Axon Moderate`; complete-axon claim is false
- Standardized SWC: 381,795 bytes; SHA-256 `0cdb5c32555f94d2ffd1765d8c21f1f95703692c45917f2a2d2449ecc457138b`
- Source-native DAT: 480,757 bytes; SHA-256 `90662374ccfacc0404b1b8817161015fa52c6c384911700f428a4c5421cb79d9`
- Metadata boundary: the repository `Swiss-Webster ` field conflicts with the paper's NPY-hrGFP/C57BL/6 context and remains `conflict_unresolved`.
- Quality boundary: the deposited 27-to-15 g weight interval is inverted and remains invalid for biological interpretation rather than being silently normalized.
- Identity boundary: no exact same-cell key admits capsaicin response, firing class, or other paper-level electrophysiology.

For both routes, standardized centerlines and recorded source radii may support labelled observed skeletons and deterministic radius-derived surfaces. A radius-derived surface is not a membrane. No nucleus, organelle, bouton, synapse, receptor distribution, ultrastructure, atlas placement, cross-source identity, complete axon, or native-DAT semantic object is admitted.

## Delta-only asset set

The only new data directory is:

`public/data/functional_class_observed_morphology_route_pack_v1/`

It is a route-specific delta, not a project copy. Its on-disk total is approximately 3.3 MiB and 11 files: ten source/derived assets listed by the manifest, plus the manifest itself.

| Asset kind | Count | Admission role |
|---|---:|---|
| Official API snapshots | 2 | Source metadata receipts |
| Official morphometry snapshots | 2 | Source-reported morphometry receipts; PCA extents are not SWC bounds or anatomical axes |
| Standardized SWCs | 2 | Observed source-local centerlines and radii |
| Source-native DAT files | 2 | Unparsed, unrendered provenance bytes only |
| Deterministic lazy-geometry payloads | 2 | Browser-loading derivatives traceable to the SWCs |
| Asset manifest | 1 | File inventory, bytes, SHA-256, release, and rights receipt |

Asset manifest: 2,768 bytes; SHA-256 `a44d7b109357d086d0d7bc27481ee76bdcfe7382e804f74aeb08195b47878f5f`.

The bundled NeuroMorpho records are governed by CC BY 4.0 subject to NeuroMorpho.Org Terms of Use and original-paper attribution. That permission does not authorize bundling article figures, microscopy panels, or article text; none were added.

## Evidence-aware rendering and information presentation

- Added `evidence-aware-3d-representation-contract-0.3` with nine evidence states and thirteen route bindings.
- Added exact route-level authority, source frame, release, receipt, radius, axon-integrity, DAT, physiology, internal-detail, identity, and registration fields for both new objects.
- Missing internal evidence continues to resolve to `UNAVAILABLE` with zero primitives. Procedural organelles or other biological proxies remain prohibited.
- The observed-morphology route library now presents seven named spinal routes and ten unique selectable forms, including preparation ambiguity, metadata conflict, DAT-only provenance, and zero exact physiology joins.
- Research overview, data-lab, application release labels, page title, and route-count language now report iteration 2.26 denominators consistently.

## Source registry and durable upgrade queue

The source registry remains at 24 canonical source packages and advances to 26 record sets. It records the functional-class route pack as two exact source objects, includes the asset-manifest receipt, preserves life-stage context, distinguishes morphometry and DAT provenance, and keeps DAT semantics, same-cell electrophysiology, cross-source identity, internals, and registration unavailable.

The deterministic upgrade registry now contains 124 rows. `UPG-130` and `UPG-131` are completed only for the two admitted exterior-morphology routes. The new research candidates remain gated:

| Upgrade | Candidate | Required boundary |
|---|---|---|
| `UPG-137` | Exact PrP/nNOS and PrP/galanin NeuroMorpho routes | Separate object checksums/topology; no paper-wide physiology or projection transfer |
| `UPG-138` | PV excitatory and inhibitory source-bounded complements | Independent routes; no paired or same-cell comparison; missing axons remain missing |
| `UPG-139` | LTMR-recipient-zone roster and pilot objects | Reconcile 650 repository records against the paper's 305 reconstructions before denominator claims |
| `UPG-140` | Lamina-X exercise/control source-plane pair | Explicit 2D rendering only; no extrusion into invented z geometry |
| `UPG-141` | Adult-human lumbar taxonomy information adapter | Link-only until file-level rights; joins require deposited donor/sample/barcode keys |
| `UPG-142` | Adult-human T4/L4 multiomic/spatial adapter | Link-only until rights; same-nucleus and spatial identities require stable deposited keys |

## Files added in iteration 2.26

### Route pack and delta assets

- `tools/build_functional_class_observed_morphology_route_pack.py`
- `data/functional-class-observed-morphology-route-pack-0.1.json`
- `schemas/functional-class-observed-morphology-route-pack-0.1.schema.json`
- `scripts/validate-functional-class-observed-morphology-route-pack-0.1.mjs`
- `tests/functional-class-observed-morphology-route-pack.test.mjs`
- `public/data/functional_class_observed_morphology_route_pack_v1/` — eleven delta files in total

### Representation contract 0.3

- `tools/build_evidence_aware_3d_representation_contract_0_3.mjs`
- `data/evidence-aware-3d-representation-contract-0.3.json`
- `schemas/evidence-aware-3d-representation-contract-0.3.schema.json`
- `scripts/validate-evidence-aware-3d-representation-contract-0.3.mjs`
- `tests/evidence-aware-3d-representation-0.3.test.mjs`

### Iteration manifest 2.26

- `tools/build_research_iteration_manifest_2_26.mjs`
- `data/research-iteration-manifest-2.26.json`
- `schemas/research-iteration-manifest-2.26.schema.json`
- `scripts/validate-research-iteration-manifest-2.26.mjs`
- `tests/research-iteration-manifest-2.26.test.mjs`
- `docs/RESEARCH_TIMELINE_2026-08-31_ITERATION_2_26.md`

## Files materially updated in iteration 2.26

- Runtime and information UI: `app/atlas-types.ts`, `app/ObservedMorphologyRouteLibrary.tsx`, `app/AtlasPrototype.tsx`, `app/ResearchDataLab.tsx`, `app/ResearchOverview.tsx`, `app/globals.css`, and `app/layout.tsx`.
- Source and upgrade records: `data/research-source-registry-0.1.json`, `scripts/validate-research-source-registry-0.1.mjs`, `tests/research-source-registry.test.mjs`, `tools/build_research_upgrade_registry.mjs`, `data/research-model-upgrade-registry-0.1.json`, and `docs/RESEARCH_MODEL_UPGRADE_QUEUE.md`.
- Runtime and rendered-output verification: `tests/main-scene-observed-route-integration.test.mjs`, `tests/observed-morphology-runtime-contract.test.mjs`, `tests/microns-observed-cell-nucleus-reference.test.mjs`, and `tests/rendered-html.test.mjs`.
- Historical-snapshot protection: `scripts/validate-research-iteration-manifest-2.25.mjs` and `tests/research-iteration-manifest-2.25.test.mjs`; these now validate immutable 2.25 receipts instead of rebuilding against mutable current registries.
- Release, rights, and documentation: `README.md`, `docs/RIGHTS_LEDGER.csv`, `package.json`, and `package-lock.json`.

## Deterministic receipts

- Functional-class route-pack contract: 28,937 bytes; SHA-256 `400b17afd707c3b53ee0cbb1d6402943535111c01402eb3903b256d12e176840`.
- Representation contract 0.3: 18,496 bytes; SHA-256 `00c464afc793b8853d176366ece708f993c89920dba4027789bc7e84d9b03aa6`.
- Research source registry: 24 canonical sources, 26 record sets, 161 source-local type records, zero open scope contradictions, and zero registrations.
- Research upgrade registry: 124 rows; UI-linked upgrade IDs resolve.
- Research iteration manifest 2.26: 26 authoritative inputs; manifest content SHA-256 `fbf40be71ab73e4a550d7be3e2791ef184ef784a33b5e8c3ac78f4e3cb465ba0`.
- Historical research iteration manifest 2.25 remains locked at manifest content SHA-256 `f7bc56dfe6671b67f0fa8a5115faadf615e98e056d207894c75441fb3a5dc6e1`.

## Validation receipt

Completed before the final full-suite run:

- Functional-class route-pack schema validator and focused tests passed.
- Representation-contract 0.3 schema validator and focused tests passed.
- Source-registry validator passed: 24 canonical sources, 26 record sets, 161 source-local type records, zero open scope contradictions, and zero registrations.
- Upgrade-registry validator passed: 124 rows and 14 UI-linked upgrade IDs resolved.
- Manifest 2.26 builder `--check`, schema validator, and focused tests passed after the current `package-lock.json` receipt was pinned.
- Immutable manifest 2.25 validator and five focused tests passed.
- Rendered HTML tests passed 34/34 after 2.26 denominator wording was aligned.

Closing validation completed on 2026-08-31 EDT:

- `npm run build` passed. Vinext completed all five build stages. It emitted one non-blocking warning that a minified client chunk exceeds 500 kB; this is a performance follow-up, not a failed scientific-data or runtime contract.
- `npm run lint` passed with zero reported ESLint errors.
- Full `npm test` passed: 413 tests total, 411 passed, 2 skipped by existing conditional release checks, 0 failed, 0 cancelled, and 0 todo. The full command repeated build and lint, ran the complete validator chain, and then executed every `tests/*.test.mjs` file.
- The full chain reconfirmed 26 exact manifest inputs, 24 source packages, 26 record sets, 124 upgrades, 2 functional-class routes, 10 active unique morphologies, 13 representation routes, 0 native-DAT semantic admissions, 0 exact physiology joins, 0 internal primitives, and 0 registrations.
- Final `git diff --check` and the delta-directory audit passed; no full-project copy directory or distributable archive/package was created by iteration 2.26.

**Browser visual QA was not performed.** This timeline does not claim interactive browser inspection, screenshot comparison, responsive-layout review, or cross-browser rendering validation.

## Rollback guidance

Rollback should be surgical and must preserve unrelated user work in this dirty worktree. Do not use broad `git reset`, `git clean`, or destructive recursive deletion.

1. Move the delta-only directory `public/data/functional_class_observed_morphology_route_pack_v1/` aside as one recoverable unit if its assets must be withdrawn.
2. Remove from the active build only the iteration-2.26 added contracts, schemas, builders, validators, tests, and this timeline listed above. Keep an external copy if audit history is required.
3. Restore the materially updated runtime, registry, queue, rights, package, test, and README files from their known 2.25 versions, without touching unrelated files.
4. Repoint `app/atlas-types.ts`, `package.json`, and the current manifest scripts to representation contract `0.2` and research iteration manifest `2.25`.
5. Regenerate only the affected deterministic registries/contracts, then rerun build, lint, the immutable 2.25 validator, and the full test suite.
6. Verify the restored denominators are eight active unique morphologies, five named routes, nine states / eleven representation routes, 24 source packages / 25 record sets, and 118 upgrade rows. Internal primitives, exact physiology joins, cross-source identities, and registrations must remain zero.

This guidance identifies the 2.26 delta but does not authorize deletion of unrelated or pre-existing project files.
