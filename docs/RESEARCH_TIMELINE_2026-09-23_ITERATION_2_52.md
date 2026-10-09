# Research timeline — iteration 2.52 (2026-09-23)

## Scope

Turn one locally retained Super-CLEM PALM MAT object into a source-faithful, two-dimensional observation view without claiming physical calibration or cell identity. Research and queue the next useful comparative source for interneuron connectivity. Preserve the previous 2.51 release as a byte-verified parent. No project-copy folder was created.

## Source audit and interpretation

- The original Figshare v1 item is covered by a source receipt recording CC BY 4.0 and exact repository checksums. The MAT object `32526932` is `181130_EosRmov009_MTT_without_tracking_results.mat`; its DOI-pinned MD5 matches Figshare, and its SHA-256 is `57999c43c3ce6d0406e3db35546ad6f3d8e153cefe04997ecb992b28df356272`.
- Extracted all five pages of the local source README. It identifies `181130_EosRmov009` as AQ848, female, >2 months WT, dorsal spinal cord. The matrix `matrice_results` is 5 × 18,358 with rows frame number, X, Y, alpha and sigma. The local README does not specify physical units, origin, axis orientation or drift-correction status for the MAT coordinates.
- The separate `_roi1-counts.txt` lists two clusters with 3,654 and 2,519 detections and areas reported in 10 × 10 nm pixels; it is not an exhaustive partition of the 18,358 MAT detections and does not provide an object-level detection-to-cluster crosswalk. The paper notes that PALM detections are affected by fluorophore blinking/conversion, so they are not treated as unique GlyR molecules.
- The decoded, deterministic browser payload (`public/data/superclem_palm_native_points_0_1.json`; SHA-256 `1fddc85f4cd6813be8b7f674d19d49dfcb9df81a0ff7401c9a76073dae1df9c8`) retains every detection's frame and raw X/Y values. It omits alpha and sigma only from the plotting payload; the complete original MAT remains checksum-pinned in the source candidate directory. The viewer verifies the payload hash before plotting, maps coordinates to screen pixels solely as a display transform, preserves equal numeric X/Y scale, and labels both axes as native source values without units.
- Separately researched Schneider-Mizell et al.'s 2025 visual-cortex study. It reports a 1,352-neuron cortical column and 163 interneurons assigned to four connectivity-based subclasses, and states that its analysis used MICrONS materialization v795. The paper points to Zenodo 7641780 for column-cell synapse tables, skeletons and type/connectivity tables, and to MICrONS Explorer for EM and segmentation. These are useful future comparative data routes, not spinal interneuron denominators or molecular identities.

## Changes

- Added `data/super-clem-palm-localization-reference-0.1.json`, a deterministic decoder in `tools/build_superclem_palm_native_points_0_1.mjs`, and a source-bound validator/test.
- Added a collapsed source-only 2D detection plot to the Structure panel. It loads the derived 18,358-point payload only when expanded; failed loading has no synthetic or geometry fallback. Its scope is explicitly invariant across selected interneurons, with no selected-cell, BP057 EM, synapse-cluster, receptor-molecule, depth or atlas-space join.
- Reframed UPG-214 as partially complete: a file-native plot exists, while calibration and identity gates remain unresolved.
- Added UPG-224 for a versioned source-object, ID, denominator, proofreading, completeness and rights audit of the published MICrONS inhibitory-connectivity census. It remains a future cross-region comparison; cortical geometry and connectivity cannot be transferred to spinal cells.
- Sealed the 2.51 iteration and promoted the app/release manifest to 2.52. Added this unique timeline in the existing `docs` folder.

## Admission and scientific boundaries

- Source-reported PALM detections shown: 18,358, in XY only. New 3D geometry: 0; physical coordinate calibration: not established; drift correction: not established; cell/synapse/receptor assignment: 0; BP057 EM overlay: 0; registration: 0.
- The 1,352/163 values remain denominators for one published visual-cortex study selection, not for all inhibitory neurons or spinal interneurons. Its 4 connectivity-based subclasses are not one-to-one molecular labels.
- No counts, cluster membership, neuronal type or internal structure are inferred from the PALM scatter. It is an independent source acquisition, not a change to any interneuron model.

## Verification

The source decoder and source receipt validate against exact count, frame and X/Y ranges. The deterministic derived JSON and scientific boundary tests are included in the research suite. `npm run test:research` passed: 802 tests total, 787 passed, 15 intentionally skipped, 0 failed. Production build and lint passed; the 2.51 immutable snapshot, 2.52 manifest, source-derived payload, registry and native-volume validators passed. No screenshot-based visual QA is claimed: the available desktop was locked during the visual-audit attempt.

## Primary sources

- [Maynard et al., eLife 2021](https://doi.org/10.7554/eLife.74441)
- [Figshare v1 source data](https://doi.org/10.6084/m9.figshare.17816747.v1)
- [Schneider-Mizell et al., Nature 2025](https://doi.org/10.1038/s41586-024-07780-8)
- [Full article at PubMed Central](https://pmc.ncbi.nlm.nih.gov/articles/PMC11981935/)
- [Zenodo column-census data record](https://doi.org/10.5281/zenodo.7641780)
- [MICrONS mm3 data portal](https://www.microns-explorer.org/cortical-mm3)
- [MICrONS materialization 795 release manifest](https://tutorial.microns-explorer.org/release_manifests/version-795.html)
