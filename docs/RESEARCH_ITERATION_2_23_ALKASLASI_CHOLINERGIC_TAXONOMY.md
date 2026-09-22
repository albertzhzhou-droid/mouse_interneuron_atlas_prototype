# Research iteration 2.23 — Alkaslasi cholinergic taxonomy and internal-detail evidence gates

Date: 2026-08-30  
Release: `2.23.0-research.1`  
Manifest: `data/research-iteration-manifest-2.23.json`

## Outcome

This iteration adds eight source-local adult mouse spinal cholinergic profiles, I1–I8, without converting transcriptomic assignments into cells with geometry. It also records the next internal-detail candidates under a stricter same-specimen/same-cell admission rule.

The resulting denominators are:

- 24 canonical source packages and 24 record sets;
- 161 explicitly non-deduplicated molecular profiles across five studies;
- 406 independent Research Explorer records across thirteen checksum-pinned inputs;
- 107 research/model upgrades, `UPG-022` through `UPG-125`;
- 15 exact inputs in the 2.23 iteration manifest;
- zero cross-source exact identities and zero registrations.

These counts describe software records and source-local observations. They are not a census of unique interneuron types or biological abundance.

## Alkaslasi source contract

Primary publication: Alkaslasi et al., *Nature Communications* 12, 2471 (2021), DOI `10.1038/s41467-021-22691-2`, PMID `33931636`. Public series: `GSE167597`, `SRP308350`, `PRJNA705097`.

The deterministic builder consumes the exact remote object:

- file: `GSE167597_all_AlkaslasiPiccus_annotations.csv.gz`;
- compressed bytes: 333,655;
- compressed SHA-256: `6e69c106544a394dd23b6e7b4fc2d159a715aaa8a70adbd61721338e8d29c091`;
- uncompressed bytes: 3,372,611;
- uncompressed SHA-256: `d8ca3a504cbbc3a96050e0c98ad7ac04d1a9a0b791b94acbee7ef158840febc2`;
- rows and unique barcodes: 34,231;
- exact I1–I8 subset tuple SHA-256: `11e9f1dc232d08f26cbe657468b61000b6964be1046e0cab06c718d0c6e77bf9`.

The source file and its 5,375-barcode interneuron roster are not bundled. The committed contract contains checksum-derived factual aggregates, field locators and boundaries only. Public GEO access is not treated as a separate file-level redistribution licence.

To reproduce the contract from a lawfully downloaded copy:

```bash
npm run build:alkaslasi-taxonomy -- \
  --source-gzip /path/to/GSE167597_all_AlkaslasiPiccus_annotations.csv.gz
```

The builder fails closed on a changed filename, bytes, hash, header, row order, barcode inventory, denominator, cross-tab, source anomaly or conflict roster.

## Denominator and sampling boundaries

The contract keeps these levels separate:

- 12 mice, six female and six male, eight weeks old;
- matching spinal regions first pooled from two mice;
- four mice represented in each of three processing replicates;
- nine region-by-replicate GEO samples;
- 34,231 post-QC nuclei;
- 16,042 cholinergic nuclei;
- 5,375 nuclei assigned to I1–I8.

I1–I8 counts are `1,520, 780, 756, 702, 584, 544, 160, 329`. Their exact Cervical, Thoracic and deposited `Lumbar` cross-tabs sum to `1,392, 1,489, 2,494`; deposited sex-field values `M`, `F` and `NA` sum to `1,533, 1,559, 2,283`.

These are yields from a Chat-IRES-Cre/Sun1-GFP FACS-enriched, pooled snRNA-seq design. They are not whole-cord prevalence, unbiased abundance, animal-level replication or evidence of sex differences. `NA` remains `NA`; it is not imputed as mixed sex. Source `Lumbar` remains verbatim while lumbar/sacral collection context is stored separately.

## No-silent-repair ledger

The source audit preserves:

- all 4,798 `cervical-cervical_6` barcode suffixes, including 769 I1–I8 rows;
- four excluded skeletal-motor rows whose `newnames` and `skeletaltypes` fields disagree with the source-wide S1/S2/S3 mapping;
- the GEO series page's currently displayed PMID `37559423`, which is not the Alkaslasi 2021 article; DOI `10.1038/s41467-021-22691-2` and PMID `33931636` remain authoritative.

None of these discrepancies is rewritten. The skeletal conflicts are outside the I1–I8 denominator and are shown as source-object context only.

## Information surfaces

The English type-evidence page and Research Explorer now expose:

- eight accession-qualified I1–I8 records;
- exact per-profile sample-region and deposited-sex-field counts;
- source-local marker context and the two-stage I8 caution;
- the 12-mouse → 3-replicate → 9-sample flow;
- the raw-object checksum receipt, unbundled-roster state and rights boundary;
- the raw suffix anomaly, four excluded label conflicts and PMID discrepancy;
- explicit missing axes for cell coordinates, morphology, electrophysiology, projections, synapses, SCI state, internal structure and atlas registration.

Search, comparison or a shared marker never creates an identity edge. The eight records add molecular evidence only; they add zero 3D primitives.

## Internal-detail research result

No open dataset was found that supplies an exact same-cell EM or organelle segmentation for `mouse.sc.vsx2_hoxa10`. Cross-species or cross-specimen structures therefore remain reference candidates and cannot fill that route.

Ranked candidates:

1. **Fish1 CLEM** — highest same-specimen potential. One 7 dpf zebrafish includes confocal `vglut2a`/`gad1b` labels and serial EM in a shared frame. Admission requires a genuine spinal lore ID, current CAVE root and materialization, ROI evidence, mesh/SWC/synapse receipts, raw overlays and resolution of the static VAST `241003` versus CAVE `fish1_v250915` mapping. Dataset redistribution rights remain insufficiently explicit, so raw data must stay source-streamed pending clarification.
2. **NeuroMorpho `NMO_109021`** — immediately checksum-verifiable adult mouse GRP dorsal-horn morphology, but not internal detail and not Vsx2/Hoxa10. Its 104,228-byte SWC has SHA-256 `fd30c7fbafd6642a99265e0009ef0bc5b75709fc7a1fba3bcc80ad47d28bde02` and 2,790 nodes. It may enter only an independent `mouse.sc.grp_dorsal_horn` route with moderate-completeness and slice-truncation warnings.
3. **Guan adult-zebrafish spinal SBEM** — V2a identity context is closer, but the named-cell annotation is blocked. The official WEBKNOSSOS record identifies dataset object `6064317a010000740060d95a`, publication `616e71ead3d5bac067f9058a`, and a `20,951 × 15,644 × 7,095` uint8 raw volume at `12 × 12 × 35 nm`. The referenced `SC_zf_0113.nml.zip` currently returns HTTPS 404 or HTTP timeout and the publication API reports no annotations. Raw bounded cutouts may be evaluated; named esV2a/CoLo geometry cannot be admitted until an official NML object, checksum and rights record are restored.
4. **Hildebrand 2017 ssEM** — useful as a raw-streaming benchmark only. The accessible route does not currently provide a stable local-spinal-interneuron catalog or exact-cell annotations suitable for this product.

Explicitly rejected as target-cell completion: Svara aggregate workbooks, MicroStructFormer 2D patches, MICrONS cortex, insect VNC connectomes, and every combination of mouse transcriptomic identity with another specimen's or species' internal geometry.

## New admission queue

`UPG-118` through `UPG-125` encode the research result:

- mandatory same-cell source contract;
- independent NeuroMorpho GRP route;
- Fish1 spinal lore-ID pilot and reviewed same-cell organelle layer;
- Guan raw-Zarr admission and separate NML-recovery gate;
- evidence-aware renderer semantics;
- object-specific redistribution-rights gate.

The core acceptance rule is: same specimen and same cell, or the internal geometry remains disabled. A skeleton is not a membrane; a point or centroid is not an organelle; unsegmented texture is not a segmented object; missing evidence stays visible.

## Validation

The release must pass:

```bash
npm test
npm run test:frozen-2.8
```

The frozen 2.8 curator package remains unchanged. Browser or screenshot-based visual QA is not part of this iteration unless the user explicitly authorizes a preview restart and use of the selected browser.
