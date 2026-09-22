# Research Timeline — 2026-08-31 — Iteration 2.27

> **Version transition:** `2.26.0-research.1` -> `2.27.0-research.1`
> **Recorded at:** 2026-08-31 17:11 EDT
> **Mode:** in-place localhost research iteration; open/public digital data only
> **Packaging status:** no distributable package was created, and no folder containing a complete project copy was created.

## Outcome

Iteration 2.27 admits two exact, independent NeuroMorpho.Org release `8.6.124` source objects as PrP dorsal-horn observed-morphology routes:

- `NMO_50394`: one PrP-promoter reporter-positive, nNOS-positive interneuron reconstruction from superficial lumbar dorsal horn / L2i.
- `NMO_50408`: one PrP-promoter reporter-positive, galanin-expressing interneuron reconstruction from superficial lumbar dorsal horn / L2i.

These are individual, source-local reconstructions. They are not averages, archetypes, complete cells, atlas-registered objects, exact physiology records, internal-structure models, or morphology-to-transcriptomic identities.

| Denominator | 2.26 | 2.27 | Interpretation |
|---|---:|---:|---|
| Active unique main-scene morphologies | 10 | 12 | Two non-overlapping source objects appended by exact `neuronId` |
| Named observed-morphology routes | 7 | 9 | Eight dorsal-horn routes and one ventral-horn Renshaw route |
| Named dorsal / ventral routes | 6 / 1 | 8 / 1 | Two PrP dorsal-horn routes appended; the ventral denominator is unchanged |
| Frozen adult-query census | 142 | 142 | No census expansion |
| Representation states / routes | 9 / 13 | 9 / 15 | Two exact route-authority bindings added; no new representation state invented |
| Canonical source packages / record sets | 24 / 26 | 24 / 27 | One PrP dorsal-horn record set added under the existing NeuroMorpho source package |
| Bundled exact rosters | 5 | 6 | One exact, checksum-pinned two-object roster added |
| Durable upgrade rows | 124 | 130 | Registry now contains 130 rows spanning `UPG-022`–`UPG-148` |
| Native DAT semantic objects | 0 | 0 | DAT files are checksum-pinned provenance bytes only |
| Exact same-cell physiology joins | 0 | 0 | The paper exposes no exact NeuroMorpho-ID or filename crosswalk |
| Same-specimen internal structures / rendered internal primitives | 0 / 0 | 0 / 0 | Missing object-level evidence creates no substitute geometry |
| Cross-source identities / project registrations | 0 / 0 | 0 / 0 | Co-display and shared labels create neither identity nor placement |

## Exact public-data receipts

### `NMO_50394` — nNOS-positive / PrP-promoter-positive route

- Route: `mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394`
- Source record: `NeuroMorpho:50394`, neuron name `C11-15-08-12-B`
- Positive object labels admitted: `Neuronal Nitric Oxide Synthase (nNOS)-positive`, `prion protein (PrP) promoter-positive`, and `interneuron`
- Geometry: 4,012 nodes and 4,011 segments; source-type counts `1=3`, `2=1,520`, and `3=2,489`
- Integrity: `Dendrites & Axon Moderate`; complete-axon claim is false
- Official API snapshot: 1,542 bytes; SHA-256 `d5954d795e3a2308ae3bb7077d546766641b2e169c4be73f2bfdaa0c663081d1`
- Official morphometry snapshot: 469 bytes; SHA-256 `b2e1da4a3ae35e854969a16357c014851745b2c67020b372615a03de77ef9162`
- Standardized SWC: 151,317 bytes; SHA-256 `adeb2b0c6934ae07f32d54e8fcaebc8cee29429d884e44692756ee15da8a00d2`
- Source-native DAT: 191,975 bytes; SHA-256 `eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109`
- Deterministic lazy geometry: 429,479 bytes; SHA-256 `cbc08ede052636e2f30249d1a633a5f1b88531d375f80f23751b062c48eeda47`
- Canonical geometry SHA-256: `8f50c34eedb33adc44402f60c5bd18e4e19f3b6dd65ea5890ce3cb93240734df`
- Topology SHA-256: `102a85df24185bd34eeb4fabbd4abdf4924ef82e8d82140bc386651569843f87`
- Negative-label boundary: galanin negativity and all other marker-exclusivity claims remain unassigned to this object.

### `NMO_50408` — galanin-expressing / PrP-promoter-positive route

- Route: `mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408`
- Source record: `NeuroMorpho:50408`, neuron name `C113-08-05-13-C`
- Positive object labels admitted: `galanin-expressing`, `prion protein (PrP) promoter-positive`, and `interneuron`
- Geometry: 6,125 nodes and 6,124 segments; source-type counts `1=4`, `2=3,244`, and `3=2,877`
- Integrity: `Dendrites & Axon Moderate`; complete-axon claim is false
- Official API snapshot: 1,515 bytes; SHA-256 `6d6be05370c9054aa0956ad3cdfb0ec94acfad560216b57da5d67fe5d32f2444`
- Official morphometry snapshot: 470 bytes; SHA-256 `9c849e5a828b99f37e215dc1b09856617a70b2ef1c0505ff3b81a151d028606d`
- Standardized SWC: 222,351 bytes; SHA-256 `452c2b3d76d9680318470ba16b5c271a403018a1c6dcedaa94b68f1fdec6c470`
- Source-native DAT: 300,076 bytes; SHA-256 `78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2`
- Deterministic lazy geometry: 638,051 bytes; SHA-256 `c545292d72010af04760fb0851fa479260c20865b4e678f596bbabf7f13f0123`
- Canonical geometry SHA-256: `c0c5d068c03437f2106892e8994f6b631243036af17e1bdf6bd0362c3c286271`
- Topology SHA-256: `e14539c8e605dfa0fa492fa2176e0ba502e40ba369be689c691ba8de27f256cc`
- Negative-label boundary: nNOS negativity and all other marker-exclusivity claims remain unassigned to this object.

### Shared evidence boundaries

- The admitted labels are positive source-metadata labels only. Neither object has an admitted negative-marker or mutually exclusive subtype claim.
- `PrP-promoter-positive` describes the reporter/promoter context. It does not establish endogenous PrP protein abundance, peptide abundance, receptor distribution, or an individual molecular assay.
- The repository reports a 300 µm parasagittal source preparation. The paper's later 60 µm serial resectioning is a separate arbor-recovery stage; these thicknesses are not interchangeable and are not collapsed into one field.
- The raw repository strain value is preserved as `Swiss-Webster `, including its trailing space. The paper's PrP-GFP context is not an exact filename-keyed individual background or genotype record.
- The deposited weight interval is 27-to-15 g. Because the lower/upper bounds are inverted, it remains invalid for biological interpretation and is not silently normalized.
- The paper does not expose `NMO_50394`, `NMO_50408`, `C11-15-08-12-B`, or `C113-08-05-13-C` as an object crosswalk. Cohort-level firing properties, afferent inputs, bouton contacts, projection targets, physiology, and other findings therefore remain unjoined.
- `Dendrites & Axon Moderate` admits observed source-local axon centerlines but no complete axon, complete projection, or whole-cell arbor claim.
- Native Neurolucida DAT files are bundled only as checksum-pinned receipts. They are unparsed, unrendered, and admit zero semantic objects, boutons, contacts, synapses, or other primitives.
- Recorded source radii may support deterministic display surfaces. A radius-derived surface is not an observed membrane, segmentation, or independent morphometric measurement.
- Missing same-specimen membrane, nucleus, organelle, synapse, receptor-distribution, and ultrastructure evidence produces zero internal primitives rather than procedural biological substitutes.
- Both objects remain in a source-local NeuroMorpho frame. Display scaling or co-display creates no atlas registration, cross-source identity, relationship to another morphology, SCI entity, molecular profile, or prevalence estimate.

## Delta-only asset set

The only new data directory is:

`public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/`

It is a route-specific delta, not a project copy. The directory contains exactly 11 files: ten source/derived assets listed by the manifest, plus the manifest itself. Exact regular-file bytes total 1,940,011; `du -sk` reports 1,916 KiB, approximately 1.9 MiB.

| Asset kind | Count | Admission role |
|---|---:|---|
| Official API snapshots | 2 | Source metadata receipts |
| Official morphometry snapshots | 2 | Source-reported morphometry receipts; PCA extents are not SWC bounds or anatomical axes |
| Standardized SWCs | 2 | Observed source-local centerlines and radii |
| Source-native DAT files | 2 | Unparsed, unrendered provenance bytes only |
| Deterministic lazy-geometry payloads | 2 | Browser-loading derivatives traceable to the SWCs |
| Asset manifest | 1 | File inventory, bytes, SHA-256, release, and rights receipt |

Asset manifest: 2,766 bytes; SHA-256 `2f17597f67532debfa79828a6313887fb362e9cdc4baba9d3015d94129c5ef8f`.

The bundled NeuroMorpho records are governed by CC BY 4.0 subject to NeuroMorpho.Org Terms of Use and original-paper attribution. Article PDF/text, figures, microscopy, and other publisher assets were excluded. The rights ledger records the DAT files as receipt-only and does not infer physiology, internal-structure, or registration semantics from them.

## Evidence-aware rendering and information presentation

- Added `evidence-aware-3d-representation-contract-0.4` with nine evidence states and fifteen route bindings; the immutable 0.3 base remains receipt-pinned.
- Added exact route-level authority, source frame, release, metadata/morphometry/SWC/DAT/geometry receipts, radius status, axon integrity, marker limits, preparation ambiguity, invalid-weight status, DAT status, physiology status, internal-detail status, identity status, and registration status for both new objects.
- Missing internal evidence continues to resolve to `UNAVAILABLE` with zero primitives. Procedural organelles and other biological proxies remain prohibited.
- The observed-morphology route library now presents nine named spinal routes and twelve unique selectable forms, including the raw strain and invalid-weight warnings for the two PrP routes.
- Research overview, data lab, application release labels, page title, and route-count language now report the 2.27 denominators consistently in English.
- Runtime merging is keyed by exact `neuronId`; the active sorted identity set now includes `50394` and `50408` without replacing the ten earlier objects.

## Source registry and durable upgrade queue

The source registry remains at 24 canonical source packages and advances from 26 to 27 record sets and from five to six bundled exact rosters. The new record set is limited to two exact source objects and includes the asset-manifest receipt. It preserves life-stage, preparation, raw-strain, invalid-weight, morphometry, SWC, geometry, and DAT provenance while keeping marker exclusivity, endogenous PrP abundance, DAT semantics, same-cell electrophysiology, cross-source identity, internals, and registration unavailable.

The deterministic upgrade registry advances from 124 to 130 rows and now spans `UPG-022`–`UPG-148`. `UPG-137` is completed only for the two admitted exterior-morphology routes. The new candidates remain evidence-gated:

| Upgrade | Candidate | Required boundary |
|---|---|---|
| `UPG-143` | `NMO_45718` non-Renshaw counter-route | Independent exact object; no transfer of Renshaw identity, physiology, projection, or internal detail |
| `UPG-144` | Allen Tac2 P4/P56 section-plane adapter | Preserve section plane and age; no 2D-to-3D extrusion or cross-age same-cell claim |
| `UPG-145` | Rat `NMO_34024` lamina-I comparative complete-axon-metadata pilot | Comparative species lane only; repository integrity language must not become a mouse identity or atlas registration |
| `UPG-146` | Adult-human `GSE243077` family | File-level rights and stable donor/sample/cell keys before any object join |
| `UPG-147` | ModelDB `267056` synthetic spinal dorsal-horn network | Synthetic-model lane only; no observed-cell or observed-morphology authority |
| `UPG-148` | Rhesus intact/SCI context | Condition and species context only until exact digital objects, rights, and stable keys are verified |

The queue also establishes a global rule that labels shared across sources never create identity or registration; stable source keys and explicit join evidence are required.

## Files added in iteration 2.27

### PrP dorsal-horn route pack and delta assets

- `tools/build_prp_dorsal_horn_observed_morphology_route_pack.py`
- `data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json`
- `schemas/prp-dorsal-horn-observed-morphology-route-pack-0.1.schema.json`
- `scripts/validate-prp-dorsal-horn-observed-morphology-route-pack-0.1.mjs`
- `tests/prp-dorsal-horn-observed-morphology-route-pack.test.mjs`
- `public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/` — exactly eleven delta files in total

### Representation contract 0.4

- `tools/build_evidence_aware_3d_representation_contract_0_4.mjs`
- `data/evidence-aware-3d-representation-contract-0.4.json`
- `schemas/evidence-aware-3d-representation-contract-0.4.schema.json`
- `scripts/validate-evidence-aware-3d-representation-contract-0.4.mjs`
- `tests/evidence-aware-3d-representation-0.4.test.mjs`

### Iteration manifest 2.27

- `tools/build_research_iteration_manifest_2_27.mjs`
- `data/research-iteration-manifest-2.27.json`
- `schemas/research-iteration-manifest-2.27.schema.json`
- `scripts/validate-research-iteration-manifest-2.27.mjs`
- `tests/research-iteration-manifest-2.27.test.mjs`
- `docs/RESEARCH_TIMELINE_2026-08-31_ITERATION_2_27.md`

## Files materially updated in iteration 2.27

- Runtime and information UI: `app/atlas-types.ts`, `app/ObservedMorphologyRouteLibrary.tsx`, `app/AtlasPrototype.tsx`, `app/ResearchDataLab.tsx`, `app/ResearchOverview.tsx`, and `app/layout.tsx`.
- Source and upgrade records: `data/research-source-registry-0.1.json`, `scripts/validate-research-source-registry-0.1.mjs`, `tests/research-source-registry.test.mjs`, `tools/build_research_upgrade_registry.mjs`, `data/research-model-upgrade-registry-0.1.json`, and `docs/RESEARCH_MODEL_UPGRADE_QUEUE.md`.
- Runtime and rendered-output verification: `tests/main-scene-observed-route-integration.test.mjs`, `tests/observed-morphology-runtime-contract.test.mjs`, `tests/microns-observed-cell-nucleus-reference.test.mjs`, and `tests/rendered-html.test.mjs`.
- Historical-snapshot protection: `scripts/validate-research-iteration-manifest-2.26.mjs` and `tests/research-iteration-manifest-2.26.test.mjs`; these validate the immutable 2.26 receipts instead of rebuilding against mutable current registries.
- Build compatibility: `tools/build_functional_class_observed_morphology_route_pack.py` now accepts configurable strain/preparation status while reproducing the 0.1 functional-class pack byte-identically.
- Release, rights, and documentation: `README.md`, `docs/RIGHTS_LEDGER.csv`, `package.json`, and `package-lock.json`.

## Deterministic receipts

- PrP dorsal-horn route-pack contract: 31,435 bytes; SHA-256 `a8737dff3fbfe244d36e2af19b32e1dd8142e2626a90c0d89c00881b83eaf709`.
- PrP delta asset manifest: 2,766 bytes; SHA-256 `2f17597f67532debfa79828a6313887fb362e9cdc4baba9d3015d94129c5ef8f`.
- Representation contract 0.4: 21,341 bytes; SHA-256 `1dec67e67884199a481ce8127793523acf56d0d50df83cfe330e933c8260e392`.
- Immutable representation contract 0.3 base: 18,496 bytes; SHA-256 `00c464afc793b8853d176366ece708f993c89920dba4027789bc7e84d9b03aa6`.
- Research source registry: 24 canonical source packages, 27 record sets, six bundled exact rosters; 89,686 bytes; SHA-256 `7c70cbb64a7545f5c6428881177805d32c85be53c4208837c5ce5d727622911a`.
- Research upgrade registry: 130 rows; 271,716 bytes; SHA-256 `02ab4c612d34e9521b9f4ee3fe5d40f84f3496e88252139d2f4d0c90f1b6c259`.
- Research iteration manifest 2.27: 30 authoritative inputs; manifest content SHA-256 `d1d0d3420f4bd72e45e50f32e31ff02c81e9bf16594ba468f41f36215221943d`.
- Immutable research iteration manifest 2.26 remains locked at 40,818 bytes, file SHA-256 `f65972360bfa8c376b9989a1e03a7a7e1e0029f5b76b2837742ebe52298a9196`, and manifest content SHA-256 `fbf40be71ab73e4a550d7be3e2791ef184ef784a33b5e8c3ac78f4e3cb465ba0`.

## Validation receipt

Focused validation completed before the closing full-suite run:

- The PrP route-pack builder/check, schema validator, source-object receipts, topology checks, zero-admission boundaries, and focused tests passed.
- Representation-contract 0.4 builder/check, schema validator, and focused tests passed; historical representation contract 0.3 remained valid.
- Source-registry validation passed at 24 canonical source packages, 27 record sets, six bundled exact rosters, zero open scope contradictions, and zero registrations.
- Upgrade-registry validation passed at 130 rows with UI-linked upgrade IDs resolved.
- Manifest 2.27 builder `--check`, schema validator, receipt verification, deterministic-content check, and focused tests passed at 30 authoritative inputs; immutable manifest 2.26 validation also passed.
- The focused scientific-contract and manifest test batch passed 34/34.
- The SSR/runtime integration batch passed 44/44, including rendered output for both new PrP routes, 2.27 denominator text, raw-strain/invalid-weight warnings, runtime merging, and current-manifest bindings.
- A later production-browser inspection exposed one stale navigation label, `Morphology · 142 census · 7 separate exact routes`. It was corrected to `9 separate exact routes`, and an SSR assertion now rejects regression to the stale denominator.

Closing validation completed on 2026-08-31 EDT:

- `npm run build` passed all Vinext build stages. It emitted only the non-blocking advisory that a minified client chunk exceeds 500 kB and a Node `DEP0205` deprecation warning; neither is a failed scientific-data or runtime contract.
- `npm run lint` passed with zero reported ESLint errors.
- Full `npm test` passed: 430 tests total, 428 passed, 2 skipped by existing conditional release checks, 0 failed, 0 cancelled, and 0 todo. The full command repeated the validation chain, build, lint, and every `tests/*.test.mjs` file.
- The full chain reconfirmed 30 exact manifest inputs, 24 source packages, 27 record sets, six bundled exact rosters, 130 upgrades, two PrP routes, twelve active unique morphologies, nine named observed routes, fifteen representation routes, zero native-DAT semantic admissions, zero exact physiology joins, zero internal primitives, zero cross-source identities, and zero registrations.

Production-browser visual QA was performed on localhost with Playwright after the final rebuild. The top-level 2.27 information surface, corrected nine-route morphology tab, route-library card grid, active `NMO_50394` card, `NMO_50408` card, preparation context, repository metadata warnings, zero-join badges, and route-opening controls were visually inspected at the captured desktop viewport. No overlap, clipping, unreadable warning text, or contradictory route count was observed in those inspected states. This was a focused Chromium desktop inspection, not a responsive breakpoint matrix, screenshot-diff baseline, or cross-browser certification.

## Rollback guidance

Rollback must be surgical and must preserve unrelated user work in this dirty worktree. Do not use broad `git reset`, `git clean`, destructive recursive deletion, or checkout commands that overwrite unrelated changes.

1. Move `public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/` aside as one recoverable unit if the 2.27 delta must be withdrawn; verify the exact path and eleven-file inventory before acting.
2. Remove from the active build only the iteration-2.27 PrP pack, representation 0.4, manifest 2.27, validators, tests, builders, and documentation listed above. Preserve a copy when audit history is required.
3. Restore only the materially updated runtime, registry, queue, rights, package, test, and README files from their known 2.26 versions. Do not touch unrelated files or concurrent work.
4. Repoint `app/atlas-types.ts`, `package.json`, and current-manifest scripts to evidence-aware representation contract `0.3` and research iteration manifest `2.26`.
5. Regenerate only the affected deterministic registries/contracts, then rerun build, lint, immutable 2.26 validation, targeted SSR/runtime checks, and the full test suite.
6. Verify the restored denominators are ten active unique morphologies, seven named routes, six dorsal plus one ventral route, nine states / thirteen representation routes, 24 source packages / 26 record sets / five bundled exact rosters, 124 upgrade rows, and the frozen census of 142. DAT semantics, same-cell physiology joins, internal primitives, cross-source identities, and registrations must remain zero.

This guidance identifies the 2.27 delta but does not authorize deletion or overwriting of unrelated or pre-existing project files.
