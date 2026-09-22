# Open-data research watch: P17–P28 dorsal-horn taxonomy and next model-detail candidates

Snapshot date: 2026-08-27  
Scope: public digital data and images only; no OHRI specimens, unpublished records, or requested physical material.

## Selection decision

The implemented slice is the Häring 17–28-day mouse dorsal-horn taxonomy (`UPG-082`; conventionally P17–P28, with GEO/SRA source text “3–4 week mice”). It scored highest on the impact/feasibility gate because it adds a source-native 30-cluster dorsal-horn label system to the researcher-facing type atlas, exposes exact cell and specimen denominators, and can be built from checksum-pinned public objects without inventing geometry or cross-study identity. The source does not assert an adult, juvenile or young-adult category for this sequencing cohort.

| Candidate | Research impact | Public-object tractability | Immediate decision |
|---|---|---|---|
| Häring 17–28-day dorsal-horn taxonomy | High: 15 glutamatergic + 15 GABAergic source clusters, marker panels, cluster counts, and population-level spatial context | High: GEO series, one processed matrix, four supplementary workbooks, and one supplementary PDF are directly retrievable | Completed as `UPG-082` |
| Montañana-Rosell ALS spatial/interneuron series | High: source-local lumbar transcript coordinates, segmented neurons, and longitudinal marker-state measurements | Medium-high: three MIT-licensed ZIP objects and two archived analysis pipelines; file-level inventory and transforms still require audit | Queue as `UPG-083` |
| Delile embryonic neural-tube atlas | High: E9.5-E13.5 developmental state and dorsoventral context | Medium: ArrayExpress/BioStudies objects and code are public, but exact cell/embryo denominators, releases, and label files need an object audit | Queue as `UPG-084` |
| Abraira LTMR-recipient-zone architecture | High: 11 genetic subtypes with published morphology, physiology, and input/output assertions | Low-medium: the article and supplements are public, but no reusable raw reconstruction/electrophysiology object was located | Queue an assertion-only gate as `UPG-085` |
| Häring cell-accession and multimodal-evidence expansion | High: exact GSM/SRX/SRR provenance, curation stages, enrichment/dendrogram, RNAscope, Arc and tracing evidence can be kept in distinct lanes | Medium: public objects exist, but cell→donor and cell→spinal-level keys are absent and the public analysis code has no licence | Queue as `UPG-086` |

## UPG-082 — Häring 17–28-day dorsal-horn source taxonomy

Primary basis:

- [Häring et al. 2018](https://doi.org/10.1038/s41593-018-0141-1), PMID 29686262.
- [GEO GSE103840](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE103840), BioProject PRJNA407224, SRA SRP117627.

Pinned public-object receipts:

| Object | Bytes | SHA-256 | Use |
|---|---:|---|---|
| `GSE103840_molecule_counts.xlsx` | 123,463,759 | `0b4bbd1bb5ef1e80cfdf286761cf697183a8e6f11ca25c901ff4841ddfaf63de` | Source dimensions plus exact cell-column cluster, age, deposited-sex-code and strain/selection metadata; source object is not bundled |
| `41593_2018_141_MOESM6_ESM.xlsx` | 9,583 | `a8c723ea7d7a3baef40fad0ef6395f027bc2932c94c9e43791fa7a7ea59e2f00` | Supplementary Table 4 cluster sizes and molecule/gene-count summaries |
| `41593_2018_141_MOESM7_ESM.xlsx` | 9,858 | `c29bf5371b91a492fc454a210d9b927702de50e4aa94a3d07bde2c52aa0f4669` | Supplementary Table 5 marker-combination identification rules |
| `41593_2018_141_MOESM8_ESM.xlsx` | 10,564 | `e9d811d9e741c03cb25e3d610c570b0d6a849decc08bca48b2ff5c5511d10416` | Supplementary Table 6 source-reported correlations; never an exact identity map |
| `41593_2018_141_MOESM10_ESM.xlsx` | 57,844 | `80a4b0d803adf88f5fcec191bc4d03f5eba182d235f364d96f50d84ece525fc8` | Supplementary Table 8 marker summaries and spatial/activity count tables |
| `41593_2018_141_MOESM1_ESM.pdf` | 3,272,419 | `00b340c16deead3627418c7a903e359589efad35870c565a15e3962f6bf951c9` | Supplementary figure/method locators only; no article image is bundled |

The processed matrix worksheet `moldata_C1_data_DHneurons_no_an` declares `A1:BGL24385`: one field-name column, 1,545 unique cell-ID columns, seven header/metadata rows, and 24,378 gene rows (`Xkr4` through `Erdr1`). Active rows 2–7 retain `age(days)`, `sex(female=1)`, `total mol`, raw `cluster name`, standardized `standard_names`, and `strain`. The 30 standardized-label counts reconcile exactly to 1,545 and to Supplementary Table 4. Cell-column metadata are not independent-animal denominators: the deposited sex codes cover 1,490 cell columns coded 0 and 55 coded 1, ages span 17–28 days, and strain/selection labels cover 637 C57bl6, 537 vGat-Cre-tdTomato, and 371 vGlut2-eGFP cell columns. `P17–P28` is the project’s conventional normalization of the deposited day values; the literal GEO/SRA age text is `3–4 week mice`, and no broader life-stage category is asserted.

Denominator boundary:

- 1,545 sequenced cells are divided among 30 source clusters: Glut1-Glut15 and Gaba1-Gaba15.
- Supplementary Table 4 and the processed matrix `standard_names` row both produce `32, 34, 34, 34, 24, 75, 104, 77, 34, 129, 61, 35, 38, 34, 22, 18, 87, 145, 11, 19, 51, 39, 67, 85, 66, 48, 56, 34, 41, 11`, summing to 1,545.
- The donor frame is 28 animals: three Vgat-tdTomato FACS donors, five Vglut2-GFP FACS donors, and 20 unbiased dorsal-horn dissociation donors. These are distinct from cell, GSM, section, and staining denominators.
- Supplementary Figure 7 population-level spatial information uses two animals and six cervical sections (three sections per animal per staining). It is laminar population context, not single-cell xyz and not registration to this project's reference frame.
- The curation stages remain separate: 1,639 post-QC neurons, 94 source-labelled excluded cells and 1,545 final cells; 43 initial BackSPIN clusters became 30 final types, with 767 Glut-group and 778 Gaba-group cells. These are pipeline-stage denominators, not replicates or prevalence.

Retained source discrepancies:

- Glut7 is 104 in the checksum-pinned matrix and Supplementary Table 4 but 105 in the Supplementary Figure 2 legend. The model uses 104 because it reconciles to 1,545 and keeps 105 visible as a source conflict.
- Article/supplement/workbook context supports Fluidigm C1, whereas all GEO GSM records say `10X Chromium cellranger pipeline version 1.1`; no universal platform label is synthesized.
- The released matrix and GEO use 0/1 sex codes, while an exporter comment describes a stale −1/0/1 convention; the release retains deposited 0/1 cell codes and does not infer donor-sex denominators.
- SRA says `mouse brain dorsal horn`, while article, GEO sample source, protocol and workbook context identify spinal-cord dorsal horn. The convergent spinal-cord context is displayed and the SRA wording remains visible.

Admission boundaries:

- The 30 profiles remain in namespace `haring-2018:GSE103840`; the existing `coverage:haring-2018` record remains a separate evidence-coverage judgment.
- Marker combinations, main/co-markers, raw and standardized cluster labels, barcode-level cluster membership, cell-column age/sex/strain metadata, counts, and exact workbook cells may be retained as factual metadata.
- Supplementary Table 6 correlations may later support a source-reported candidate-comparison view, but they cannot create Häring-Sathyamurthy identities.
- No complete neurite morphology, axon, electrophysiology, projection target, direct synaptic edge, SCI state, same-cell cross-lane link, atlas transform, or project coordinate is supplied by this taxonomy. Every axis remains explicitly unavailable.
- Public downloadability is not treated as an asset-level redistribution licence. No source XLSX or PDF is bundled in the application.

## UPG-083 — MIT-licensed ALS spatial/interneuron object audit

[Montañana-Rosell et al. 2024](https://doi.org/10.1126/sciadv.adk3229) studies lumbar spinal interneuron marker states in wild-type and SOD1G93A mice across source-declared postnatal/disease stages. The [St Andrews dataset](https://doi.org/10.17630/6985fab0-c649-4e71-9592-dbda527040ec) exposes three MIT-licensed digital objects: `ISS.zip` (4.27 MB), `RNAscope_tdTomato.zip` (19.6 KB), and `RNAscope_HiPlexUp.zip` (75.6 MB), plus archived analysis pipelines.

Before admission, pin every member path, byte count, checksum, specimen/section/hemicord key, pixel scale, coordinate origin, segmentation-mask identity, transcript-to-cell registration transform, genotype, sex, age, and disease stage. Transcript coordinates and segmented somata may enter a source-local 2D spatial lane; they are not neurites, synapses, complete cells, or coordinates in the current 3D atlas. Marker loss is a disease-state observation and cannot by itself establish cell death, connectivity loss, or identity with a transcriptomic cluster.

## UPG-084 — Delile embryonic source-native adapter

[Delile et al. 2019](https://doi.org/10.1242/dev.173807) profiles cervical/thoracic developing mouse neural tube from E9.5-E13.5; the public study is [ArrayExpress/BioStudies E-MTAB-7320](https://www.ebi.ac.uk/biostudies/arrayexpress/studies/E-MTAB-7320), with analysis code linked from the article.

This must be a source-native developmental adapter, separate from the cross-study reconciliation watch in `UPG-027B`. Pin the migrated BioStudies release, all sample and processed-label objects, embryo and cell denominators, exact stage/region fields, object licences, and label hierarchy before displaying profiles. Developmental progenitor/neuronal states cannot be relabeled as adult populations, mapped to adult coordinates, or treated as a same-cell lineage trajectory.

## UPG-085 — Abraira LTMR-RZ assertion-only multimodal pack

[Abraira et al. 2017](https://doi.org/10.1016/j.cell.2016.12.010) reports 11 genetically labelled deep-dorsal-horn LTMR-recipient-zone interneuron subtypes. The primary article reports 305 unbiased sparse reconstructions and 52 random-neuron recordings, while subtype panels retain separate morphology and electrophysiology denominators; for example, published subtype reconstructions sum to 351 across the 11 lines, and the listed subtype recordings sum to 128 with at least three animals per cross.

The source can support assertion-level records for genetic label, transmitter context, laminar distribution, firing-pattern categories, reported reconstruction summaries, putative-marker apposition evidence, and source-declared direct versus polysynaptic physiology. It cannot supply browser 3D morphology or raw traces unless stable public source objects and rights are located. Published marker appositions must remain anatomically defined contacts rather than being silently promoted to electrophysiologically verified synapses; unpublished observations mentioned by the paper are excluded.

## UPG-086 — Häring cell-accession provenance and separated multimodal lanes

Extend the admitted `GSE103840` taxonomy without collapsing modalities. Pin the full GEO family SOFT and SRA inventories, then require 1,545 unique cell IDs/GSM/SRX records, 2,157 SRR runs and zero workbook↔SOFT metadata mismatches. A per-cell provenance record may expose cell ID, chip/well, accessions, deposited age/sex/strain, molecules and both raw/standard labels; donor ID, spinal level, xyz, morphology, projection, electrophysiology and SCI fields must remain null because the public exports do not supply them.

Keep Table 2 enrichment, Table 3 dendrogram structure, RNAscope validation, 2D laminar summaries, Arc heat/cold association and tracing context as distinct evidence lanes with their own denominators. Supplementary Figure 3 predicted/subjective morphology must never become measured geometry. The public author repository is pinned only as a provenance lead because it has no licence; do not vendor or modify its code.

## Recommended execution order

1. Execute `UPG-086` as the next provenance-and-evidence separation upgrade; it adds cell/accession detail but still cannot fill 3D geometry, donor or same-cell cross-modal gaps.
2. Audit `UPG-083` object inventories and transforms; it is the strongest candidate for source-local spatial detail.
3. Audit `UPG-084` for developmental coverage once its BioStudies object release and denominators are pinned.
4. Build `UPG-085` only as an assertion-level multimodal evidence pack unless raw digital measurements become available.
