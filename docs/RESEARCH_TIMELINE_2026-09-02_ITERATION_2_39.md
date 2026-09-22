# Research timeline — iteration 2.39

Date: 2026-09-02  
Working label: `2.39.0-research.1`  
Parent: immutable research iteration 2.38  
Delivery mode: in-place localhost research upgrade; no full-project copy and no distributable package

## Why this iteration exists

Iteration 2.38 made source-record switching visible in the evidence UI, but it did not add finer geometry. Iteration 2.39 closes one narrowly supported geometry gap without converting missing evidence into a generic cell model: NMO 45718 now exposes its exact source-native Neurolucida soma contour traces in a viewer that appears only for that exact morphology record. All other records continue to show only the geometry and evidence actually admitted for them.

## Source decision

The checksum-pinned NMO 45718 Neurolucida DAT contains eight source-labelled soma contour objects. A clean-room, source-specific extractor was compared against the official NeuroMorpho `xyz2swc` parser pinned at commit `e07fd2d53c03945f011c335c7b643765f2d85a09`. Both routes agreed on the exact 275-point payload, SHA-256 `a478e6263e7d00c1f17bc64143014a3519c39f771b6809a28b057db07c724ab4`.

The admitted objects are:

- seven source-closed `Soma 1` traces at z = −29, −31, −33, −35, −37, −39 and −41 µm, totalling 252 vertices;
- one 23-vertex `Cell Body` trace at z = 13/15 µm whose source `closed` flag is false but which is interpreted as closed under the documented legacy CellBody exception;
- 275 semantic last-to-first line-loop segments in total.

The source DAT is 343,774 bytes with SHA-256 `ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415`. The deterministic browser geometry is 45,606 bytes. Its file SHA-256 is regenerated whenever the checksum-pinned builder receipt changes, while the independent point-payload receipt above must remain constant.

## Implemented change

- Added a deterministic, checksum-gated DAT contour builder and an exact geometry contract.
- Added a browser runtime validator and a Three.js `LineLoop` viewer with separate toggles for the seven-plane stack and legacy trace.
- Added an explicit 20 µm source-coordinate guide plus viewer-only axes. Recentering and uniform scaling are reversible display transforms; source coordinates remain in the payload.
- Gated the component to `observedCellForm.neuronId === 45718`. Switching to another morphology unmounts it; switching to a molecular, anatomy, SCI or source record clears the prior cell geometry through the existing fail-closed focus resolver.
- Registered the eight contour objects as one exact source-object set, explicitly separate from the nine exact cell/profile rosters. The frozen 142-record census and the one-record premotor route are unchanged.
- Completed UPG-186 and added explicit future gates for Cano-Gomez source-object inspection, the missing BIL cell-to-final-type bridge, DAT-to-SWC coordinate crosswalks, per-file DAT admission and any conditional `DER` surface.
- Recorded open-data availability findings separately from admitted model objects. Candidate EM or spatial assets with no selected-interneuron identity bridge remain queue-only and cannot appear as type-specific detail.

## Scientific boundary

The native contour viewer admits ordered closed polylines only. It admits zero polygon fills, triangles, lofted surfaces, membranes, nuclei, organelles, volumes, shrinkage corrections, standardized-SWC overlays, same-cell molecular joins, type-average morphologies or atlas registrations. The distant legacy `Cell Body` trace is never joined to the seven-plane `Soma 1` stack.

The standardized SWC and native DAT belong to the same NeuroMorpho record, but their coordinate transform is not established. Same record identity does not authorize an overlay or vertex correspondence. The source labels also remain repository labels and do not establish definitive calbindin absence, premotor identity or Renshaw exclusion.

## Open-data findings carried forward

- Cano-Gomez/Pool supplementary Table S1 is a semi-structured nomenclature table with 531 type-like rows, 518 exact unique strings, duplicate and malformed entries, and no cell IDs. It cannot independently instantiate the paper's reported 516-type roster or an interneuron-only set. Exact RDS metadata inspection and a source-released `cell_id` to final `groups_manual`/`neuron_types` bridge are still required.
- Brain Image Library Xenium coordinates and boundaries are source-local 2D objects. Ten-micrometre sections cannot be serially stacked into a 3D cell without an explicit section/object chain and transform.
- Janelia mouse dorsal corticospinal FIB-SEM can support a bounded raw-EM/manual-nucleus availability receipt, but the cell class is unknown and the mask is only a partial ROI. It cannot become a selected spinal-interneuron internal model.
- Fish1 exposes powerful larval-zebrafish geometry infrastructure, but the public path still lacks the typed spinal lore-ID, stable root crosswalk, proofreading receipt and object-level redistribution chain required by this project.
- eLife 83108 Video 5 remains qualitative publication imagery; no coordinate-bearing raw stack or source segmentation is admitted.

## Verification record

Focused checks completed during implementation:

- deterministic contour rebuild and byte receipt;
- independent point-payload agreement and exact 8/275 denominators;
- mutation rejection for wrong cell identity, invented surface count, changed closure semantics and malformed points;
- source-registry checks for 27 canonical sources, 33 record sets, nine bundled exact cell/profile rosters, one separately typed exact source-object set, 376 source profiles and zero registrations;
- production build and lint;
- current research regression suite: 657 tests, 649 passed, eight optional online checks skipped and zero failed;
- frozen 2.8 verification: 141 files and zero registrations, with the frozen ZIP still at SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`;
- live localhost switch QA: NMO 45718 exposed one identity-gated native viewer with eight contours, 275 vertices and zero surfaces, internal objects or registrations; switching to NMO 109005 unmounted that viewer and loaded the different checksum-verified radius-derived scene; switching to Hayashi Cluster 6 and then Cluster 3 cleared cell geometry and changed 86 cells to 121 cells plus the record-specific marker panel;
- record-card QA: the Hayashi card retained eight record-specific fields, collapsed eleven exact shared fields, removed the prior record during switching and showed the shared evidence block exactly once;
- browser console QA: zero warnings and zero errors across the tested switch sequence;
- stale-copy regression: the NMO 45718 UI no longer says the DAT lacks a validated parser or that its native vertices are unavailable. The older route-pack contract remains an immutable historical input, while the 2.39 runtime and manifest state the separate eight-contour admission explicitly.

The final command counts and current 2.39 manifest receipts are recorded by the generated research-iteration manifest and its validator. Optional online checks may skip when network access is unavailable; a skip is not a source admission.

## Rollback

Rollback is file-specific and in place. Do not copy or replace the full project.

1. Remove the 2.39-only contour implementation files: `tools/build_neurolucida_source_native_soma_contours.mjs`, `data/neurolucida-source-native-soma-contour-trace-0.1.json`, `public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json`, `app/neurolucida-native-soma-contours.js`, `app/NativeSomaContourViewer.tsx`, its validator and focused test.
2. Remove the NMO 45718 contour import/export and conditional component call from `app/atlas-types.ts` and `app/AtlasPrototype.tsx`, plus only the `.native-soma-contour-*` rules from `app/globals.css`.
3. Revert only the 2.39 NeuroMorpho record-set, asset, modality, admission, linked-upgrade and missingness edits in `data/research-source-registry-0.1.json`, its validator and tests.
4. Restore UPG-186 to its 2.38 planned row and remove only UPG-190 onward added by this iteration, then rebuild `data/research-model-upgrade-registry-0.1.json`.
5. Remove the 2.39 open-source availability audit contract, validator and test.
6. Restore `package.json`, `package-lock.json`, `app/layout.tsx`, `README.md`, and `tools/run_current_research_tests.mjs` to their 2.38 references.
7. Remove only the 2.39 manifest/schema/builder/validator/tests and this timeline. Keep `data/research-iteration-manifest-2.38.json` byte-identical.

The archived `2.8.0-curator.1` package is outside this rollback and must remain unchanged.
