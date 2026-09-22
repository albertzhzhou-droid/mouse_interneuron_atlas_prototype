# Curator release notes — 1.7.0-curator.1

**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-1.7.0`  
**Frozen scientific evidence:** `ohri-mouse-interneuron-research-mvp-candidate-0.2.0`  
**Release-manifest content SHA-256:** `bd60ee8cf2c1232290439bc74eccadd29ab19f9f78a96bc532faf19f0a19c32f`  
**Registration count:** **0**

## What changed from candidate 1.6

Candidate 1.7 adds a real but deliberately bounded **Tabulae Visium spot inspector**. A researcher may select one exact, locally obtained gzip triplet for any of 24 declared `GSE234774` sections. The browser validates the filename triplet, decompresses it locally, calculates local SHA-256 receipts, and overlays source-local Visium spot positions over the selected 2D tissue image.

The ZIP does **not** contain the GEO archive, image, CSV, scale-factor JSON, or a claimed source checksum. The archive is listed publicly as `GSE234774_RAW.tar` (129 MiB); its asset-level reuse decision remains unresolved in this release. The inspector makes no automatic download, external request, upload, persistence, transform, segmentation, gene-expression calculation, cell-type call, same-cell join, 3D reconstruction, or registration. Its receipt contains only filenames, local hashes, parser counts, and scale factors.

A Visium spot is not an individual interneuron. This local 2D session is neither an atlas coordinate nor a source-to-project transform. It cannot create `OBS` placement in the atlas or `REG`.

## Preserved Tabulae condition boundary

The existing `SOURCE_METADATA_CONDITION_INDEX_ONLY` browser retains **eight condition groups and 93 distinct literal labels**. No GEO source-file body or processed metadata is bundled by that browser, and it cannot create a whole-spinal-cord atlas, treatment effect, cell-level identity, same-cell join, transform or `REG`.

## New review gate

`UPG-011` is now in progress for a numerical source adapter and still requires an exact object checksum or trusted checksum endpoint, an asset-level reuse decision, a source data dictionary, a compatible-condition analysis plan, and curator review. New `UPG-012` separately requires stable section/specimen identity, physical frame/order/scale/orientation, transform provenance, and held-out landmark error before anyone may propose cross-section source-frame or 3D work. Neither gate is a registration approval.

See [ADR-001](ADR-001-TABULAE-LOCAL-SPATIAL-SESSION.md) for the decision and boundaries.

## Preserved boundaries

The seven evidence entities remain synthetic (`SYN`); displayed routes remain schematic (`SCH`); BrainGlobe reference assets remain inferred (`INF`); and the five NeuroMorpho exemplars remain source-local observed (`OBS`) morphology only. The package retains **0 registrations**. It remains a named private curator-review package only; public deployment or broader redistribution requires institutional review and asset-level rights clearance.
