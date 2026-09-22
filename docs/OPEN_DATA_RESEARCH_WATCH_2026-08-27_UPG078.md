# Open-data research watch — UPG-078–081

Snapshot date: 2026-08-27  
Scope: public digital data and primary literature only; no physical specimens, OHRI data, unpublished records or inferred biological joins.

## Decision summary

Prioritize the two mouse candidates before the zebrafish comparative lanes. UPG-078 can add lesion-remote SCI condition and spatial context, while UPG-079 turns the already declared UPG-067 neonatal-V2a concept into an exact object-admission task. Neither fills missing interneuron geometry or connectivity. UPG-080 and UPG-081 add unusually direct lineage, electrophysiology and synapse-scale comparative evidence, but they are larval zebrafish sources and must remain visibly separated from every mouse lane.

All four items remain future work. Public discoverability is not an ingestion claim, and no source below is bundled in the current release.

## Ranked candidates

### 1. UPG-078 — mouse lesion-remote SCI context

**Primary sources**

- Article: [McCallum et al., Nature](https://doi.org/10.1038/s41586-025-09887-y).
- GEO umbrella: [GSE312911](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE312911), an umbrella SuperSeries with 256 GEO sample objects across four SubSeries. The umbrella raw TAR is reported as 3.5 GB and mixes CSV, H5, JPG and TAB objects; it is not one biological denominator.
- snRNA-seq SubSeries: [GSE312880](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE312880), BioProject [PRJNA1377547](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1377547). GEO reports 35 sample/library objects and a 3.1-GB `GSE312880_RAW.tar` containing H5 files, with raw reads in SRA.
- Visium SubSeries: [GSE312910](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE312910), BioProject [PRJNA1377593](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1377593). GEO reports 16 sample objects and a 341.7-MB `GSE312910_RAW.tar` containing CSV, H5 and JPG files, with raw reads in SRA.

**Scientific value and exact boundary**

GSE312880 profiles nuclei from all spinal-cord cell classes in 3-mm spared-tissue chunks rostral and caudal to an incomplete lateral-hemisection injury at healthy/0, 3, 7 and 28 dpi. GSE312910 adds Visium sections from spared regions above and below the lesion at the same time axis. This can represent lesion distance/direction, time, assay and glial microenvironment alongside the existing distal-lumbar Matson lane without pretending the two experiments sampled the same cells or injury geometry.

The article's mechanistic centre is lesion-remote astrocyte–microglia repair biology. A neuronal label found in the all-cell snRNA object does not make this an interneuron-focused study, and a Visium spot is not a cell.

**Rights and integrity status**

The GEO records provide public download links but do not state an asset-level redistribution licence for the H5, CSV or JPG objects. The future adapter may fetch and process local copies for audit, but rebundling remains blocked until each admitted object has a recorded reuse basis, byte count and checksum. The 35 and 16 denominators are GEO sample/library objects, not automatically 35 and 16 independent animals; the animal–library–section mapping must be derived from source metadata rather than guessed from sample names.

**Acceptance gate**

1. Pin GSE312880 and GSE312910 separately; do not ingest the mixed GSE312911 umbrella TAR as a single source object.
2. Record every sample accession, source animal when available, health/injury status, dpi, rostral/caudal direction, side, chunk or section identity, assay, source file, byte count and SHA-256.
3. Keep snRNA nuclei, Visium spots and histology JPGs in distinct object classes. A cross-assay association starts as `not_established` unless the source supplies an explicit mapping.
4. Preserve the incomplete lateral-hemisection model and lesion-remote sampling. Do not relabel it as the T9 contusion geometry used by Matson.
5. Resolve file-level redistribution rights before packaging any source object.

**Explicit non-support**

This source does not establish single-cell neurite morphology, observed interneuron synapses, a dense connectome, adult whole-cord prevalence, same-cell longitudinal response, registration to the bundled mouse atlas or exact identity with a Matson/Russ/Sathyamurthy population. Ligand–receptor or cell–cell interaction inference remains computational context, not direct connectivity.

### 2. UPG-079 — exact neonatal mouse V2a object adapter

**Relationship to the queue**

UPG-067 already records the scientific concept. UPG-079 is the non-duplicative implementation gate for exact files, denominators and source-local labels.

**Primary sources and verified artifacts**

- Article: [Hayashi et al., Neuron](https://doi.org/10.1016/j.neuron.2018.01.023).
- GEO: [GSE108788](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE108788), one 10x sample from cervical and lumbar V2a cells FACS-sorted from two P0 neonates and pooled before sequencing.
- GEO reports a 3.4-MB `GSE108788_RAW.tar` containing CSV files, raw reads in [SRP128071](https://www.ncbi.nlm.nih.gov/sra?term=SRP128071), and BioProject [PRJNA428534](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA428534).
- The article reports approximately 3,000 Tom-positive cells processed and 949 QC-retained neurons for transcriptomic analysis. These 949 cells remain one pooled library, not 949 independent specimens.

**Scientific value and exact boundary**

The source can add a development- and region-bounded V2a dossier with Type-I/high-Chx10 local-network and Type-II/Chx10-downregulated supraspinal-projection terminology plus source-defined subtypes. Cervical/lumbar origin and P0 stage must remain first-class fields. Type II is projection-neuron context and must not inflate local-interneuron counts.

**Rights and integrity status**

GEO makes the files publicly downloadable but does not expose an asset-level redistribution licence. The exact TAR members, CSV schemas, cell identifiers and raw-read linkage require checksum pinning before admission; public access alone does not authorize rebundling.

**Acceptance gate**

1. Record the two-neonate-to-one-library pooling and prohibit specimen-level differential claims.
2. Retain the article's approximately 3,000 processed / 949 QC-retained distinction and reproduce the cell inclusion gate before displaying cluster denominators.
3. Preserve P0, cervical/lumbar and Type-I/Type-II source labels; do not map them exactly onto an adult or SCI population from marker overlap.
4. Store absent coordinates, morphology, synapse evidence and per-cell projection tracing as unavailable rather than inferred.
5. Resolve file-level reuse status before packaging source CSV or read objects.

**Explicit non-support**

GSE108788 does not support adult or SCI identity, independent-animal replication, same-cell morphology plus transcriptome, source-cell coordinates, direct synaptic connectivity, adult prevalence, atlas registration or an exact cross-study identity.

### 3. UPG-080 — larval-zebrafish V2a/V2b paired electrophysiology

**Primary sources and verified artifacts**

- Article: [Bello-Rojas and Bagnall, eLife](https://doi.org/10.7554/eLife.83680).
- Dataset: [Dryad 10.5061/dryad.4xgxd25dh](https://doi.org/10.5061/dryad.4xgxd25dh), public version 3, published 2022-12-22 under [CC0-1.0](https://spdx.org/licenses/CC0-1.0.html).
- The version-3 API manifest contains exactly two files: `Ephys_Data_Submission.zip`, 4,465,128,115 bytes, SHA-256 `18953547b8ca457c3814f877ff580f5851f6173b4ed02b4190c99e8c61071ec8`; and `README.md`, 1,958 bytes, SHA-256 `3700f417b1101a4ec0b502700f8f6f83a1abcea0f7f848768daaebd6eda72f26`.
- Dryad describes the archive as raw `.abf` electrophysiology files. The experimental methods place whole-cell recordings at 4–6 dpf; dye fills used to visualize recorded cells do not by themselves create admitted digital morphology.

**Scientific value and denominators**

This source directly tests clonally related V2a/V2b sister neurons in vivo. Denominators are assay-specific and must never be summed: the article reports 65 labelled sister pairs for a lineage-classification comparison, 27 pairs for the reported axon-proximity comparison, 13 clonal pairs for synchronous-input analysis, 10 clonal pairs from 10 fish for direct sister-to-sister connection testing, and 7 non-sister pairs from 7 fish for the corresponding comparison. A parser must recover the archive's actual fish, pair, cell, condition and sweep mapping before any trace is displayed.

**Rights and integrity status**

The Dryad data files are CC0 and have a versioned public manifest. Scholarly citation remains required by project policy. Admission still depends on a successful 4.47-GB archive download, checksum match, decompression audit, README reconciliation, deterministic `.abf` inventory and a clear mapping from recordings to the article's assay-specific denominators.

**Acceptance gate**

1. Keep `Danio rerio`, 4–6 dpf and source transgenic/label context visible on every record.
2. Parse recordings without silently pooling clonal/non-clonal, V2a/V2b, current/voltage clamp, drug, fish or pair units.
3. Store article-level claims separately from raw-trace-derived features; reproduce detection parameters before deriving an event count.
4. Keep axonal trajectory descriptions, paired electrophysiology, optogenetic influence and direct pair tests as different evidence classes.
5. Add no mouse relationship stronger than a comparative, source-qualified vocabulary link.

**Explicit non-support**

The archive does not establish mouse V2a/V2b identity, adult spinal organization, SCI response, whole-cord prevalence, a dense connectome, source-cell atlas coordinates or complete reconstructed morphology. A negative pair test is limited to the tested fish, cells, assay and detection conditions; it is not universal biological absence.

### 4. UPG-081 — larval-zebrafish spinal SBEM connectivity

**Primary sources and verified scope**

- Article: [Svara et al., Cell Reports](https://doi.org/10.1016/j.celrep.2018.05.023).
- Repository record: [FreiDok 145135](https://freidok.uni-freiburg.de/data/145135).
- The source is one 6 dpf nacre zebrafish larva. The SBEM volume is 74 × 74 × 207 µm at 9 × 9 × 21 nm voxel pitch, spanning two complete segments plus 51% and 71% of the adjoining segments and containing 2,177 somata.
- The article reports 139 reconstructed motoneurons (68 left, 71 right), 8,528 synaptic input locations on the 68 left-side motoneurons, 39 CiDs of which 35 contacted a reconstructed motoneuron, 265 CiD→motoneuron synapses among 5,111 inspected proximity locations, and 34 reconstructed CoBLs. These are one-specimen source-local reconstruction and contact denominators, not population frequencies.

**Verified repository objects and anomaly**

FreiDok's JSON manifest lists a 4,072,309-byte article PDF with SHA-256 `6c996dda086efe7f291788f30b1d34968dedcd0c25c13e4105bb50848df47f35` and a 33,959,844-byte supplemental ZIP with SHA-256 `23194b4d91a0a45757b3bc1c0bdd2c39b54a4f0d9356638d9f76d02ac5edf245`. The supplemental archive inventory contains four XLSX files, two PDFs and three nested ZIP catalogues (`Catalog 1, MNs.pdf`, `Catalog 2, CiDs.pdf`, `Catalog 3, CoBLs.pdf`). The landing metadata label instead says two ZIP files, two PDFs and four `.xls` files. This count/extension discrepancy must fail closed until a clean checksum-matched acquisition and independent archive inventory reproduce the contents.

The repository record declares CC BY 4.0 at publication level, but both downloadable objects have empty file-level licence fields in the manifest. The record supplies publication supplements and cell catalogues, not the raw 74 × 74 × 207-µm SBEM image volume as a reusable digital stack. Raw-volume ingestion and redistribution are therefore unsupported at present.

**Acceptance gate**

1. Acquire a clean supplemental object whose byte count and SHA-256 match the repository manifest, then validate every nested archive before reading tables or catalogues.
2. Resolve the repository's archive-count/extension discrepancy and file-level reuse basis before packaging any object or derivative.
3. Preserve one larva, 6 dpf, voxel pitch, sampled segment extent, hemisegment, reconstruction class, source neuron ID, contact locator and annotation method.
4. Treat CiD and CoBL assignments as the authors' larval-zebrafish, morphology-supported classes; do not turn them into exact mouse V2a/V0 identities.
5. Keep direct EM-observed contacts separate from physiological influence. Preserve the article's limits on synapse-type discrimination and long-range axons leaving the approximately three-segment volume.
6. If the raw SBEM image volume remains unavailable, do not render reconstructed objects against a fabricated or article-figure-derived volume.

**Explicit non-support**

This single larval-zebrafish volume does not support mouse identity, adult or injured anatomy, whole-cord coverage, prevalence, sex effects, individual variability, cross-species coordinates, complete long-range axons or a mouse connectome. It cannot fill a missing mouse morphology or synapse field merely because the circuit class has a similar name.

## Cross-source admission rules

1. **Species and stage are hard partitions.** Mouse P0, adult mouse SCI and 4–6 dpf zebrafish records may be compared only through explicit source-qualified vocabulary; no shared object identity is created.
2. **Experimental units stay source-native.** Animal, pooled library, nucleus, Visium spot, section, cell pair, electrophysiology sweep, reconstructed neuron and EM contact remain distinct denominators.
3. **A modality fills only what it measures.** Transcriptomics does not supply neurites, spatial spots do not supply single cells, dye fills do not automatically supply digital reconstructions, and an article PDF is not the raw SBEM stack.
4. **Directness is typed.** EM-observed contact, paired electrophysiological response, optogenetic influence, inferred ligand–receptor interaction and marker co-occurrence are separate evidence classes.
5. **Rights are object-level.** A public landing page or article licence cannot silently license every downloadable data object. Every bundled file needs an explicit reuse basis, stable locator, byte count and integrity hash.
6. **Unsupported fields remain empty.** No procedural cell position, arbor, synapse, prevalence, registration or cross-study identity may be generated to make the model appear complete.
