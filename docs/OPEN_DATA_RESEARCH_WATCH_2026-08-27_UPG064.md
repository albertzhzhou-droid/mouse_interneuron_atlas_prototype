# Open-data research watch — post-UPG-064 depth queue

Snapshot date: 2026-08-27  
Scope: public digital data and literature only; no physical specimens, OHRI data, unpublished records or inferred biological joins.

## Decision summary

The next useful work should deepen source-local evidence rather than make the 3D model look complete. UPG-076 is the most direct precision increment because the already-audited Matson Supplementary Dataset 2 contains 20 ranked genes per source population while the current UI retains only ranks 1–3. UPG-077 may add gene-level reprocessing later, but only after the unusual dense matrix format, barcode/header equality and F-12 source anomaly pass explicit gates.

Among new sources, Caudet Segarra provides unusually clear CC0 developmental spatial measurements, while Niehaus adds adult lumbar peripheral-injury neuronal context. Both must remain orthogonal to adult SCI state and reference-atlas placement. The remaining candidates primarily add immune, functional or bulk-tissue context; none fills missing single-cell morphology, observed synapses or same-cell multi-modal identity.

## Ranked candidates

### 1. UPG-076 — complete Matson ranked-marker extraction

- Source: [Matson Supplementary Dataset 2](https://static-content.springer.com/esm/art%3A10.1038%2Fs41467-022-33184-1/MediaObjects/41467_2022_33184_MOESM4_ESM.xlsx)
- Current admitted depth: ranks 1–3 for all 17 source populations.
- Proposed depth: all 20 ranked genes per population through a deterministic workbook parser with workbook and output hashes.
- Hard boundary: the workbook supplies rank order, not an expression score, specificity estimate, effect size or p-value. Full extraction cannot create an exact cross-source identity.

### 2. UPG-077 — anomaly-gated Matson matrix reprocessing

- Source: [GEO GSE172167](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE172167) and [SRA SRP315018](https://www.ncbi.nlm.nih.gov/sra?term=SRP315018)
- Potential value: gene-level condition summaries with explicit library and barcode denominators.
- Admission gates: detect the dense whitespace format rather than assuming Matrix Market; prove normalized count-header/barcode hash equality; prove all 67,903 barcode-prefix joins; retain the F-12 raw-run size anomaly and any waiver decision.
- Hard boundary: a processed expression matrix does not supply cell coordinates, morphology, synapses, whole-cord prevalence or longitudinal same-cell response.

### 3. UPG-073 — developmental source-local spatial measurements

- Primary article: [Caudet Segarra et al., Science Advances](https://doi.org/10.1126/sciadv.adz3075)
- Public data: [Dryad 10.5061/dryad.j3tx95xtz](https://doi.org/10.5061/dryad.j3tx95xtz), CC0.
- Reported scope: embryonic E9.5–E13.5 spatial centroid/intensity measurements for dI3, dI5, V0, V2a and V3 contexts.
- Model value: stage-, embryo- and section-bounded 2D source-space evidence.
- Hard boundary: embryonic source coordinates cannot be transferred into the adult reference atlas or treated as adult cell identity, neurite morphology or connectivity.

### 4. UPG-071 — adult lumbar peripheral-injury neuronal context

- Primary article: [Niehaus et al., Neuron 2021](https://doi.org/10.1016/j.neuron.2021.02.018)
- Public data: [GSE134003](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE134003)
- Reported scope: 19-animal adult lumbar SNI/superficial-injury neuronal-subtype dataset with a contaminated sample excluded.
- Model value: source-local adult injury-response comparison.
- Hard boundary: SNI is peripheral nerve injury, not SCI. It cannot fill the Matson SCI state, atlas placement, morphology or causal-recovery fields.

### 5. UPG-072 — glycinergic Pvalb functional assertions

- Primary article: [Gradwell et al., Neuron 2024](https://doi.org/10.1016/j.neuron.2024.01.027)
- Public archive: [Zenodo 10520447](https://zenodo.org/records/10520447)
- Potential value: deep-dorsal-horn Pvalb subtype and behavioral/function assertions.
- Gate: resolve the 1.7 GB archive's animal, session, genotype, age, sex and redistribution semantics before object admission.
- Hard boundary: behavioral and histological files are not complete cellular morphology or direct synaptic connectivity.

### 6. UPG-070 — age-stratified SCI immune context

- Primary article: [Kong et al., Neuron](https://doi.org/10.1016/j.neuron.2024.12.012)
- Public records: [GSE281205](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE281205), [GSE275982](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE275982), [GSE275570](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE275570)
- Potential value: young versus 20–22-month immune-state context across naïve, 14 dpi and 28 dpi, including separate anti-CD8 intervention evidence.
- Hard boundary: immune communication is context, not neural synaptic connectivity or an interneuron state.

### 7. UPG-074 — injury-infiltrating T-cell context

- Primary article: [Gao et al., Nature 2024](https://doi.org/10.1038/s41586-024-07906-y)
- Public data: [GSE216390](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE216390)
- Reported scope: paired GEX/TCR evidence from two 12-mouse pools after T9 contusion.
- Hard boundary: the pooled unit of inference remains explicit; TCR similarity and ligand–receptor inference are not neural connectivity.

### 8. UPG-075 — chronic bulk-tissue intervention context

- Primary article: [Buchl et al., Neurotrauma Reports 2024](https://doi.org/10.1016/j.neurot.2024.e00517)
- Public data: [GSE271662](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE271662)
- Reported scope: atorvastatin, vehicle and control bulk-tissue samples with 7/7/2 denominators.
- Hard boundary: bulk expression cannot be assigned to an interneuron population or individual cell.

## Admission rules for finer modeling

1. A field enters the model only if a directly supporting object, source locator, denominator, coordinate frame when applicable, integrity hash and reuse status are recorded.
2. A source may deepen only the dimensions it measures. A ranked-marker workbook cannot fill geometry; a spatial centroid cannot fill neurites; a behavioral archive cannot fill synapses.
3. Developmental, peripheral-injury, immune, bulk-tissue and adult-SCI contexts remain separate condition axes.
4. Shared genes, labels or response direction produce searchable co-occurrence only, never exact identity or a same-cell join.
5. Projection neurons and motoneurons remain context and stay outside local-interneuron counts unless a source directly establishes local circuit identity.
6. Conflicting source statements remain in a versioned discrepancy ledger; one convenient statement cannot silently overwrite another.
7. If the source cannot support a field, the model stores explicit unavailable status and renders no substitute geometry.
