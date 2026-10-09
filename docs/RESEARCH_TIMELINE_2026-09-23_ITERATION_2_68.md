# Research timeline — iteration 2.68

Date: 2026-09-23  
Version: `2.68.0-research.1`  
Status: local, unpackaged research iteration  
Rollback parent: [immutable iteration 2.67 manifest](../data/research-iteration-manifest-2.67.json)

## Changes

- Added a compact researcher-facing spatial-molecular availability panel for the BIL adult mouse spinal-cord Xenium collection. It identifies the linked study as a bioRxiv preprint and separates source availability from cell identity, interneuron classification, reuse permission and 3D geometry.
- Added UPG-244 to the live research/model queue. Its first audit records the public BIL directory listing (16 run/slide folders and one sampled folder's file names and byte sizes) without downloading file contents. The sampled folder includes cell- and nucleus-boundary tables, cell and transcript tables, analysis outputs, gene-panel metadata, and a 27,512,909,500-byte OME-TIFF.
- Recorded the preprint-reported scope: 523 sections, 14 eight-week C57BL/6J mice (7 male, 7 female), 480 targeted genes, 616,599 neurons and 2,081,760 non-neuronal cells. The reported 339 glutamatergic, 196 GABAergic and 56 cholinergic neuron-type counts are not an interneuron denominator. Rostral cervical, thoracic and lumbar segments and coccygeal cord are not represented in the cited sampling scope.
- Preserved the sample-key discrepancy for later resolution: the directory lists 16 run/slide folders while the paper reports 14 mice; this iteration does not guess how folders map to animals or sections.
- Preserved rights uncertainty. BIL's general download policy states CC BY-SA 4.0, while the collection page carries a repository-under-review notice; this audit did not retrieve record-specific rights metadata. The data remain link-only pending exact asset rights, file checksum, schema, cell/sample key, type-assignment, coordinate-axis and source-to-atlas transform checks.
- The UI explains the eventual use boundary: if exact file, rights and identity gates pass, show source-local 2D segmentation/transcript evidence only. No cell or nucleus boundaries, transcript points, interneuron roster rows, 3D objects, membranes, SWC joins, same-cell joins, atlas registrations or biological measurements were admitted.
- Sealed 2.67 as the immutable parent. The app stays within the existing project; no complete-folder copy or BIL payload is added.

## Verification

- Full `npm run test:research` passed: build, lint, all validators and the current research test runner; 898 tests total, 883 passed, 15 intentionally skipped, 0 failed.
- The local 2.68 overview was inspected in a temporary browser tab on port 3001. UPG-244 appeared with the source/status/denominator details; its disclosure exposed the sampling, classification and rights limits and source links. No BIL payload or external page was opened, and the card admits no cell objects or geometry.
- `npm run validate:research-manifest-2.67` passed against the sealed parent snapshot; the refreshed 2.68 manifest is regenerated and checked after this timeline update.

## Source basis and limits

- [BIL Xenium collection, DOI 10.35077/g.1196](https://doi.brainimagelibrary.org/doi/10.35077/g.1196)
- [Cano-Gomez et al., bioRxiv preprint](https://doi.org/10.64898/2026.06.11.731752)
- [BIL download and distribution policy](https://www.brainimagelibrary.org/download.html)

The BIL directory listing establishes accessible file names and listed sizes, not valid table schemas, annotations, object checksums, cell IDs or morphology. Preprint statistics remain paper-reported values. This is a research-data availability increment, not a completed Xenium integration or complete interneuron atlas.

## Rollback

Restore the application and queue behavior associated with `data/research-iteration-manifest-2.67.json`. That pinned parent preserves the 2.67 source-authority morphology renderer and planned UPG-243 EM search. Do not rebuild the parent from the mutable 2.68 queue or application.
