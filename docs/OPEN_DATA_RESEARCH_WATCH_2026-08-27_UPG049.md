# Open-data research watch — UPG-049 continuation

Snapshot date: 2026-08-27  
Scope: public digital data and literature only; no physical specimens, OHRI internal data, unpublished records or inferred biological joins.

## Decision summary

The strongest next source is Matson et al. / GSE172167 because it directly samples neuronal states after mouse SCI across acute-to-chronic time points. Arokiaraj et al. is the strongest adult dorsal-horn spatial/regulatory candidate, but its two-animal Xenium design and unresolved file-level reuse terms make it a source-local, rights-gated lane. Serafin et al. can strengthen a pDyn-lineage dossier. Brennan and Milich are valuable only as non-neuronal lesion-environment context.

None of the candidates supplies a complete adult mouse spinal-interneuron atlas with same-cell molecular identity, full neurite morphology, observed synapses, atlas registration and SCI state. Those combined fields therefore remain unavailable.

## Ranked candidates

### 1. UPG-064 — Matson neuronal SCI time course

- Primary article: [Matson et al., Nature Communications 2022](https://doi.org/10.1038/s41467-022-33184-1)
- Public repository: [GSE172167](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE172167)
- Reported frame: female C57BL/6 mice, 12–30 weeks, 90-kdyn T9 contusion; uninjured, 1 dpi and 1/3/6 wpi; three mice per condition, 15 independent cords.
- Reported data: 67,903 nuclei, including 23,651 neurons; 17 neuronal populations after neuronal reclustering.
- Model value: a source-local neuronal injury-state lane with explicit time, injury and denominator fields, including Shox2/V2d-associated and spinocerebellar responses.
- Hard boundary: lumbar nuclei have no admitted atlas coordinates or morphology. Spinocerebellar populations are projection neurons, not local interneurons. Label transfer and AAV validation do not establish a same-cell join.
- Admission gate: retrieve the exact GEO object inventory, checksums, sample table and file-level terms before retaining any source object. Public repository access alone is not a redistribution decision.

### 2. UPG-065 — Arokiaraj adult dorsal-horn spatial/regulatory reference

- Primary article: [Arokiaraj et al., Cell Reports 2024](https://doi.org/10.1016/j.celrep.2024.114876)
- Public records: [GSE253954](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE253954), [GSE253951](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE253951), and [GSE253952](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE253952)
- Reported Xenium frame: two 10-week C57BL/6 mice—one male saline control and one female receiving innocuous mechanical stimulation—with eight non-consecutive lumbar sections.
- Reported snATAC frame: 20 healthy 7–8-week mice in two ten-mouse pools, each pool containing five males and five females; L3–L5 dorsal horn.
- Model value: source-native laminar positions and regulatory-accessibility context for adult dorsal-horn excitatory and inhibitory classes, including PDYN-related populations.
- Hard boundary: stimulus and sex are confounded in the two Xenium animals; the panel is targeted rather than whole-transcriptome; there is no SCI, neurite morphology or connectivity. Cell polygons and proximity are not morphology or synapses.
- Admission gate: keep metadata/citation only until exact downloadable objects, checksums, coordinate schema, segmentation semantics and asset-level reuse terms are audited.

### 3. UPG-066 — Serafin pDyn-lineage maturation dossier

- Primary article: [Serafin et al., PAIN 2019](https://doi.org/10.1097/j.pain.0000000000001636)
- Public repository: [GSE128052](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE128052)
- Reported frame: pDyn-IRES-Cre × Sun1-GFP mice at P7, P21 and P80; initially two male and two female animals per age. One P21 library failed, leaving 11 animals; the failed library's sex was not reported.
- Reported data: 22 paired GFP-positive and GFP-negative bulk nuclear RNA-seq fractions; 5,000 sorted nuclei per fraction per animal.
- Model value: age-bounded pDyn-lineage markers and maturation evidence, including a defensible adult P80 context.
- Hard boundary: lineage GFP is not identical to current Pdyn expression. Bulk-sorted nuclei cannot resolve subtypes, morphology, coordinates, connectivity or prevalence.
- Admission gate: audit the exact GEO/SRA files and reuse terms before bundling; otherwise retain citation and metadata only.

### 4. UPG-067 — Hayashi source-native V2a hierarchy

- Primary article: [Hayashi et al., Neuron 2018](https://doi.org/10.1016/j.neuron.2018.01.023)
- Public repository: [GSE108788](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE108788)
- Reported frame: two P0 mice; sex not reported; cervical and lumbar V2a cells isolated for 10x scRNA-seq, with no injury and no independent biological replication.
- Model value: source-native V2a Type-I/local versus Type-II/supraspinal organization and cervical–lumbar molecular gradients.
- Hard boundary: P0 programs cannot be presented as adult states; Type-II records are projection/output neurons. The source contributes to Russ harmonization, so this is deconvolution of a source namespace rather than a new exact identity map.

### 5. UPG-068 — Brennan intervention/outcome context

- Primary article: [Brennan et al., Nature Communications 2022](https://doi.org/10.1038/s41467-022-31797-0)
- Public records: [GSE196928](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE196928), [ODC-SCI dataset 695](https://odc-sci.org/data/695), and [dataset DOI 10.34945/F5B012](https://doi.org/10.34945/F5B012)
- Reported GEO frame: female 10–12-week mice, T9 75-kdyn contusion or sham, PLX5622 or vehicle; six pooled single-cell libraries spanning sham, 7 dpi and 28 dpi, approximately three to four mice per group; bulk RNA n=14.
- Wider ODC context: 230 mice across additional crush, chemokine/TLR, behavioral, histological and tracing experiments.
- Model value: causal intervention and outcome context around neuronal models.
- Hard boundary: the 21,016-cell single-cell dataset contains no neurons. CellChat or ligand–receptor predictions are not synapses or anatomical connectivity.

### 6. UPG-069 — Milich acute lesion environment

- Primary article: [Milich et al., Journal of Experimental Medicine 2021](https://doi.org/10.1084/jem.20210040)
- Public repository: [GSE162610](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE162610)
- Correction: [2025 correction](https://doi.org/10.1084/jem.2021004007232025c)
- Reported frame: female C57BL/6J mice, 8–10 weeks, 65-kdyn T8 contusion; ten libraries from 16 mice—uninjured 3 libraries/5 mice, 1 dpi 3/5, 3 dpi 2/3 and 7 dpi 2/3.
- Reported data: 66,178 cells. Neurons were excluded from downstream analysis because dissociation introduced neuronal survival bias.
- Model value: an honest lesion-environment lane with `neuronal_state: unavailable`.
- Hard boundary: the source cannot support interneuron-state, morphology or connectivity claims; predicted cell–cell interactions remain computational hypotheses.

## Cross-source modeling rules

1. A shared marker or label returns separate search results; it does not create an identity edge.
2. Spatial coordinates, segmented cell polygons and nearby cells remain source-local observations; none is neurite morphology, synaptic connectivity or atlas registration.
3. Projection neurons remain context records and are excluded from local-interneuron counts.
4. Developmental, adult-baseline, pain/stimulation and SCI states remain orthogonal condition fields unless one source directly measures their relationship.
5. A paper license and a repository landing page do not replace file-level object, checksum, attribution and reuse review.
6. Missing morphology, connectivity, coordinates, denominators or rights remain explicit missingness; they are never filled with a schematic biological claim.

## Recommended order

1. UPG-064 Matson metadata/sample/object inventory and source-local neuronal SCI adapter.
2. UPG-065 Arokiaraj file-level rights and coordinate-schema audit.
3. UPG-066 Serafin pDyn-lineage dossier.
4. UPG-067 Hayashi source-native V2a deconvolution.
5. UPG-068 and UPG-069 as contextual, explicitly non-neuronal lesion-environment lanes.
