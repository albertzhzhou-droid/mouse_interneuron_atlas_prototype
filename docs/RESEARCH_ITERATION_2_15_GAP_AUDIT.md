# Research iteration 2.15 gap audit

Snapshot date: 2026-08-27  
Working label: `2.15.0-research.1`  
Completed slice: UPG-079 source-native Hayashi P0 V2a taxonomy

## Outcome

Iteration 2.15 adds one narrowly bounded, reference-backed source lane: the 11 numbered P0 V2a clusters reported by Hayashi et al. / GSE108788. Each cluster now retains its article-reported sampling count and only the marker, medial/lateral, cervical/lumbar and Chx10-high/low context that the source supports. This is finer internal evidence structure, not finer geometric resolution.

The 11 profiles are developmental, source-local transcriptomic clusters. They are not 11 canonical interneuron types, not 11 adult identities and not 11 confirmed local spinal interneuron populations. Every cluster contains both putative Type I and Type II cells, while Type II includes a supraspinal projection-neuron context. Consequently, the project-confirmed local-interneuron count contributed by this slice remains zero.

The global Research Explorer now contains 367 heterogeneous records, including 123 molecular source-population records across three studies. These sums are not deduplicated biological type counts. UPG-079 does not complete the atlas of all interneurons and does not fill an unsupported cell shape, coordinate, synapse, projection or cross-source identity.

## Exact source and denominator frame

| Stage or unit | Retained value | Admission boundary |
|---|---:|---|
| Source animals | 2 P0 neonates | The source does not report sex in the admitted record |
| Pre-pooling FACS collection | 2,800 cervical + 2,800 lumbar cells = 5,600 | Collection-stage count; not the processed or QC-retained denominator |
| Pooled 10x libraries | 1 Chromium Single Cell 3-prime v2 library | The two animals and two spinal regions were pooled before sequencing |
| Independent transcriptomic libraries | 1 | Cells are sampling units, not independent specimens; animal-resolved replication is unavailable after pooling |
| Cells processed | Approximately 3,000 | Article-reported approximate pipeline-stage denominator |
| QC-retained neurons | 949 | Exact public-matrix barcode count and article Figure 6 cluster-count sum |
| Article region assignments | 455 cervical + 494 lumbar = 949 | Computational bulk-signature assignments after pooling; not direct region columns in the GEO matrix |
| Numbered clusters | 11 | Article-reported source-local clusters; exact barcode-to-cluster assignments are not deposited |

The three cell stages—5,600 collected, approximately 3,000 processed and 949 QC retained—remain distinct. None is whole-cord abundance or biological prevalence.

## Checksum-pinned digital objects

| Object | Exact size | SHA-256 | Boundary |
|---|---:|---|---|
| `GSE108788_RAW.tar` | 3,604,480 bytes | `7bf234f91c12ff09b5d132cb84a91c7bdafd96158f93a5c7083b5062f5c8fd97` | Exact GEO archive; contains one matrix member and is not bundled |
| `GSM2913270_umiGeneCounts.csv.gz` | 3,597,244 bytes | `d6d55f8780c7102fd71fe66e037dac6f48638c97ce2124b331c498e3fb73f8de` | Exact compressed matrix member; not bundled |
| Uncompressed matrix bytes | 24,981,295 bytes | `a0d97a23ac28700e621ca90a6725b6bfb38f645094affa8289ed922ce33f9753` | 12,986 unique gene rows by 949 unique barcode columns, plus `gene_name` |
| `data/hayashi-v2a-source-taxonomy-0.1.json` | Derived factual contract | `eaaa49ea63c300d1a719eb9119a3c2735674d3f0d5113567dcb583489674f882` | Stores source-local facts, locators, missingness and hard boundaries; no source matrix or figure |
| Research Explorer `search-index.json` | 2,484,257 bytes | `aea7f48d090b4af0f74bdaa422a932cea5ed69ec793a756ac3abf52fb56d3cb0` | 367 navigation/dossier records and zero project registrations |

The public count matrix supplies raw UMI counts only. It has no cluster, Type I/II, cervical/lumbar or source-animal annotation column. Article figures are also not bundled. Public download access is not promoted to an assumed asset-level redistribution licence.

## New source-native internal detail

| Cluster | Cells | Article-supported molecular/spatial context | Rostrocaudal context | Type-I/II boundary |
|---|---:|---|---|---|
| 1 | 144 | Lateral; group context `Zfhx3`, `Zfhx4`, `Nefl`, `Shox2` | Lumbar-enriched | Mixed Type I and Type II |
| 2 | 130 | Lateral; group context `Zfhx3`, `Zfhx4`, `Nefl`, `Shox2` | Lumbar-enriched | Mixed Type I and Type II |
| 3 | 121 | Medial; group context `Nfib`, `Tcf4`, `NeuroD2`, `Sp8` | Mixed cervical/lumbar | Mixed Type I and Type II |
| 4 | 117 | Medial; group context `Nfib`, `Tcf4`, `NeuroD2`, `Sp8` | Mixed cervical/lumbar | Mixed Type I and Type II |
| 5 | 112 | Medial; group context `Nfib`, `Tcf4`, `NeuroD2`, `Sp8` | Mixed cervical/lumbar | Mixed Type I and Type II |
| 6 | 86 | Lateral; group context `Zfhx3`, `Zfhx4`, `Nefl`, `Shox2` | Mostly cervical | Mixed; among clusters 6–8 with the highest Chx10-low fraction |
| 7 | 59 | Lateral; group context `Zfhx3`, `Zfhx4`, `Nefl`, `Shox2` | Not established | Mixed; among clusters 6–8 with the highest Chx10-low fraction |
| 8 | 52 | Lateral; group context `Zfhx3`, `Zfhx4`, `Nefl`, `Shox2` | Mostly cervical | Mixed; among clusters 6–8 with the highest Chx10-low fraction |
| 9 | 51 | Marker/spatial group not established | Not established | Mixed Type I and Type II |
| 10 | 48 | Lateral; group context `Zfhx3`, `Zfhx4`, `Nefl`, `Shox2` | Lumbar-enriched | Mixed Type I and Type II |
| 11 | 29 | Marker/spatial group not established | Not established | Mixed Type I and Type II |

The counts sum exactly to 949. The marker panels are article-supported group contexts, not per-cluster quantitative expression profiles or identity rules. “Medial,” “lateral,” “mostly cervical” and “lumbar-enriched” are categorical source contexts; they cannot be converted into cell coordinates, atlas registration or procedural 3D placement.

The article's major-type framework is retained as a second, non-exclusive evidence axis:

- Type I: Chx10/Vsx2-high or maintained, with a dense local recurrent spinal-network context.
- Type II: Chx10/Vsx2-low or downregulated, with local plus supraspinal/brainstem projection context.
- Every numbered cluster contains both putative types. No numbered cluster is promoted to a pure Type I or Type II population, and no exact barcode-level Type-I/II assignment is available.
- Population-level tracing and immunostaining do not create same-cell links to sequenced barcodes or numbered clusters. Type II remains excluded from confirmed local-interneuron counts.

## Unresolved article-versus-matrix discrepancy

The checksum-pinned public matrix was re-read deterministically with the declared rule “raw UMI count greater than zero.” The result does not reproduce two article-reported percentages:

| Measure | Exact matrix reanalysis | Article-reported value | Status |
|---|---:|---:|---|
| At least one of `Vsx2`, `Sox14`, `Shox2`, `Lhx3` or `Lhx4` | 942/949 = 99.262% | 99.5% | Unresolved difference |
| `Slc17a6` positive | 862/949 = 90.832% | 92.7% | Unresolved difference |

Both observations remain visible. The project does not silently average, round, overwrite or “correct” either result. The difference may reflect an unreported threshold, analysis object or processing step, but the admitted public objects do not establish a cause. The matrix result is therefore labeled derived, while the publication value remains a separate direct article report.

## Fields that must remain unavailable

Unless a future checksum-pinned public digital object directly supports them, UPG-079 leaves the following fields empty or explicitly `not_available`/`not_measured`:

- exact barcode-to-cluster, barcode-to-Type-I/II and barcode-to-cervical/lumbar maps;
- cell, nucleus or atlas coordinates, spinal-segment position, laminar position and registration transforms;
- soma, dendrite, axon, complete-cell geometry or same-cell molecular–morphology identity;
- same-cell projection tracing, exact projection target and complete-axon status;
- observed synaptic partners, synapse coordinates or a synaptic edge list;
- animal-resolved transcriptomic replication after pooling;
- adult, aging, ALS or spinal-cord-injury identity for the P0 clusters;
- whole-cord abundance, prevalence, cell loss or expansion;
- exact identity to Russ, Sathyamurthy, Matson, NeuroMorpho, Allen-anatomy or project SCI records; and
- sex, which was not reported in the admitted source frame.

Search co-occurrence, shared markers, nearby anatomy and visually plausible placement cannot populate these fields. Cluster 7 retains an unavailable rostrocaudal assignment; clusters 9 and 11 retain unavailable marker-group, medial/lateral and rostrocaudal fields.

## Verification gates

Current-run verification established:

- the Hayashi contract validator passed its schema, denominator, locator, missingness and hard-boundary checks;
- all 10 Hayashi contract and exact-gzip mutation tests passed, including the checksum-pinned matrix audit;
- the deterministic Research Explorer rebuild produced 367 records, including exactly 11 records in `hayashi-2018:GSE108788` and 123 total molecular source-population records;
- all 10 focused Research Explorer index tests and all 23 server-rendering tests passed;
- the full `npm test` chain completed with production build, lint, all scientific/data validators and 246 tests: 244 passed, zero failed and two release-lock tests were intentionally skipped;
- desktop 1440×1000 and mobile 390×844 browser checks resolved the canonical Cluster 6 URL state, showed no browser console errors or warnings, and measured no mobile page-width overflow (`390 px` document width in a `390 px` viewport);
- the separately frozen `2.8.0-curator.1` archive still verifies as 141 files, zero registrations and ZIP SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`; it was not rebuilt or changed; and
- project registrations and exact cross-source identities introduced by this slice remain zero.

These software and evidence-contract gates do not establish biological validation, curator acceptance, complete interneuron coverage or permission to redistribute the unbundled GEO objects.

## Next public-data implementation candidates

The next slice should add a currently empty evidence axis, not merely another unjoined label list. The following are candidates, not admitted evidence:

1. **Montañana-Rosell 2024 source-native spatial-image lane.** Audit the exact repository record and its `ISS.zip`, `RNAscope_tdTomato.zip` and `RNAscope_HiPlexUp.zip` objects for checksums, coordinate/image schema and asset-level licence. If admitted, preserve ALS genotype, age, spinal level, image and specimen denominators and render only source-local spatial measurements. Do not map them onto Hayashi P0 clusters without direct cross-source evidence. [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11141618/) · [data record](https://doi.org/10.17630/6985fab0-c649-4e71-9592-dbda527040ec)
2. **Häring/GSE103840 source-native dorsal-horn adapter.** Pin the exact 1,545 single-cell object frame, sample metadata, processed matrices and article cluster labels before adding the reported inhibitory and excitatory molecular classes. This should deepen adult dorsal-horn taxonomy while remaining separate from Russ, Sathyamurthy and Hayashi. [GEO GSE103840](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE103840)
3. **Sweeney 2018 developmental V1 combinatorial lane.** Encode the reported P0 V1 transcription-factor combinations and four-clade framework with exact figure/table locators, while keeping predicted, observed and experimentally validated assignments distinct. This can add lineage structure but does not supply complete-cell geometry or same-cell transcriptomic joins. [Primary article](https://pmc.ncbi.nlm.nih.gov/articles/PMC5880537/)
4. **Delile/E-MTAB-7320 developmental adapter.** Audit and pin the annotated metadata and expression objects for the developing mouse spinal cord, preserving stage, replicate and any source-defined pseudotime only. It must not be treated as a physical-coordinate source or a direct identity map to P0 Hayashi or adult records. [ArrayExpress/BioStudies E-MTAB-7320](https://www.ebi.ac.uk/biostudies/arrayexpress/studies/E-MTAB-7320) · [Single Cell Expression Atlas](https://www.ebi.ac.uk/gxa/sc/experiments/E-MTAB-7320)
5. **Allen spinal in-situ-hybridization image receipts.** Add only exact source links, identifiers, plate/image metadata and rights boundaries first. Images may support marker-level anatomical context, but they cannot create same-cell morphology, transcriptomic identity or a registration without an explicit transform and validation. [Allen Mouse Spinal Cord Atlas documentation](https://brain-map.org/support/documentation/mouse-spinal-cord-reference-atlases)

Before any candidate changes the model, it must pass exact-file inventory, checksum, reuse-rights, schema, specimen/cell denominator, source-coordinate and mutation gates. Public readability or downloadability alone is not sufficient for redistribution, and a cross-source marker resemblance is never an exact identity.

## Primary sources

- [Hayashi et al., Neuron 2018](https://doi.org/10.1016/j.neuron.2018.01.023)
- [Hayashi et al., PubMed Central full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC8601153/)
- [NCBI GEO GSE108788](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE108788)
- [NCBI GEO GSE108790 SuperSeries](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE108790)
- [NCBI SRA SRP128071](https://www.ncbi.nlm.nih.gov/sra?term=SRP128071)
- [NCBI BioProject PRJNA428534](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA428534)
