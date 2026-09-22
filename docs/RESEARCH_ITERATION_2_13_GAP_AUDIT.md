# Research iteration 2.13 gap audit

Snapshot date: 2026-08-27  
Working label: `2.13.0-research.1`  
Completed slice: UPG-064 source-local Matson neuronal SCI time course

## Outcome

Iteration 2.13 adds a condition-resolved neuronal SCI evidence lane from Matson et al. / GSE172167 and exposes its 17 source-local neuronal populations in the global Research Explorer. The implementation retains the exact sampled conditions, independent-cord denominators, per-library identifiers, population counts, ranked-marker snapshots and documented source conflicts. It does not fill a 3D cell, atlas coordinate, neurite, synapse, projection or prevalence field that the source does not supply.

The global Explorer now contains 356 heterogeneous source records from ten checksum-pinned local inputs. The added 17 records are search and dossier objects, not 17 confirmed interneuron types and not spatially modeled cells.

## Exact source frame

| Field | Retained value | Boundary |
|---|---:|---|
| Injury model | T9 90-kdyn contusion | One tested injury context; not transferable to other lesions |
| Sampled tissue | L2–S1 lumbar cord below lesion, with proximal dorsal and ventral roots | No atlas coordinates or segment-specific placement for individual nuclei |
| Animals | 15 female C57BL/6 cords, 12–30 weeks; three per condition | Terminal samples; not a longitudinal same-cell trajectory |
| Conditions | Uninjured, 1 dpi, 1 wpi, 3 wpi, 6 wpi | Five discrete observations; no temporal interpolation |
| Retained nuclei | 67,903 | Captured-data denominator, not biological abundance |
| Neuronal nuclei | 23,651 | Captured-data denominator, not prevalence |
| Neuronal populations | 17 label-transfer families | 16 non-motor families remain unresolved as local interneuron versus projection neuron; motoneurons are context only |
| Population-condition rows | 85 | Exact 17 × 5 source partition |
| Population-sample rows | 255 | Exact 17 × 15 source partition |

## Finer retained detail

- Every population has one namespace-qualified canonical ID, source label, source subclass, transmitter context, annotation method and exact captured-neuronal-nucleus count.
- Each population retains ranked marker genes 1–3 from Supplementary Dataset 2. They are ranks only: expression scores, specificity, effect sizes and p-values are unavailable.
- Every condition exposes all three source replicates with source ID, GSM, BioSample, SRX, population count and exact captured-neuronal denominator.
- The selected condition is URL-addressable and survives versioned app-state export/import without creating a new biological relationship.
- RAG-expressing cluster 23 and spinocerebellar tracing are shown as separate contextual assertions. They are not inserted into the 17-population denominator or joined to one sequenced nucleus.
- Six source discrepancies remain visible rather than being silently reconciled: sequencing platform/loading target, discarded-nucleus arithmetic, D-26 recovery range, tissue wording, Figure 4l N and F-12 raw-run size.

## Enforced empty fields

The following fields remain explicitly unavailable for every Matson population unless a future directly supporting source object is admitted:

- nucleus or cell coordinates;
- atlas transform or registered spinal placement;
- soma, dendrite or axon geometry;
- complete-axon status;
- same-cell molecular-to-tracing identity;
- observed synaptic connectivity;
- biological prevalence or whole-cord abundance;
- cell-autonomous causal recovery; and
- exact identity to Russ, Sathyamurthy, NeuroMorpho, Allen-anatomy or project SCI records.

Marker overlap, co-display, condition response and nearby anatomy cannot populate any of these fields.

## Deterministic asset contract

- Source metadata: `GSE172167_meta.txt.gz`, SHA-256 `5aabb2cd86c5d23486acbd511a17db3ec66540e67221389954a80b89390282d2`.
- GEO family SOFT: `GSE172167_family.soft.gz`, SHA-256 `81022a0cf74f2e84d0c5730473fb32f8d9110322537bed542e871d6965b96156`.
- Ranked-marker workbook: Supplementary Dataset 2, SHA-256 `ce390abbaf5a6b4ca376e03112a34141f105774918339c59a3614c98d20b6c74`.
- Research Explorer index: 356 records, SHA-256 `beb6767e8f6a2c4c49445b7253696015d37b2cb6d4a8a33a90338530a9053290`.
- Project registrations: zero.
- Exact cross-source identities: zero.

The builder accepts the two exact GEO source files only when their bytes match the declared hashes. GEO raw binaries remain remote and are not bundled. The Supplementary Dataset 2-derived three-rank snapshot is retained with attribution under the article supplement's CC BY 4.0 terms.

## Remaining scientific and precision gaps

1. No admitted source joins adult molecular identity, complete single-cell morphology, native spatial coordinates, observed synapses and SCI state in the same cell.
2. The 17 Matson families are transferred source labels, not a complete taxonomy of spinal interneurons and not confirmed local-interneuron identities.
3. Only ranks 1–3 of 20 source-ranked markers are currently represented. UPG-076 requires a deterministic workbook parser before the remaining ranks can enter the model.
4. Optional gene-matrix reprocessing remains blocked by the non-Matrix-Market dense file format and source anomalies, including the F-12 raw-run size. UPG-077 must fail closed until all barcode/header joins and anomaly decisions are reproducible.
5. The reference-atlas anatomy lane remains separate. Exact source voxels can improve internal anatomical display, but cannot place a Matson nucleus or supply a missing cellular structure.
6. Morphology remains limited to the separate 142-record NeuroMorpho repository census, with zero molecular or SCI same-cell links and zero complete axons.
7. Formal researcher usability, screen-reader, high-zoom, physical-device and independent scientific-curator validation remain future gates.

## Primary sources

- [Matson et al., Nature Communications 2022](https://www.nature.com/articles/s41467-022-33184-1)
- [GEO GSE172167](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE172167)
- [Supplementary Dataset 2](https://static-content.springer.com/esm/art%3A10.1038%2Fs41467-022-33184-1/MediaObjects/41467_2022_33184_MOESM4_ESM.xlsx)
