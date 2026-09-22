# Research iteration 2.14 gap audit

Snapshot date: 2026-08-27  
Working label: `2.14.0-research.1`  
Completed slice: UPG-076 complete Matson ranked-marker panels

## Outcome

Iteration 2.14 fills one narrow, referenced information gap: every Matson/GSE172167 source-local neuronal population now retains all 20 genes ranked in Supplementary Dataset 2, with the exact workbook cell for each rank. This increases molecular dossier depth without inventing quantitative expression evidence, a cell identity, a spatial placement or an anatomical structure.

The 17 records remain source-local label-transfer populations. They are not 17 confirmed interneuron types, and their 340 ranked-gene records are not measurements of abundance, specificity or injury effect.

## Exact workbook boundary

| Field | Verified value | Admission boundary |
|---|---:|---|
| Source object | `41467_2022_33184_MOESM4_ESM.xlsx`, 16,885 bytes | Exact object only; an HTML response renamed `.xlsx` is rejected |
| Source SHA-256 | `ce390abbaf5a6b4ca376e03112a34141f105774918339c59a3614c98d20b6c74` | Any byte change fails closed |
| Worksheet | `Sheet1` | Resolved through the OOXML workbook relationship, not an assumed member name |
| Declared worksheet dimension | `A1:AM43` | Preserved as source metadata |
| Actual populated range | `A1:AM21` | Rows 22–43 contain empty/style-only cells and contribute no marker values |
| Modeled columns | `A:Q` | Only the 17 source columns mapped to the Matson neuronal/context populations are admitted; `R:AM` remain outside this adapter |
| Retained panel | 17 populations × ranks 1–20 = 340 records | Every record contains only gene symbol, rank and exact source cell |
| Derived panel SHA-256 | `7b071d49c43816321fb24a3c31fb9282abf559d9b990a48549278410e85769a4` | Digest covers canonical UTF-8 lines of alias, rank, gene and source cell |

The workbook supplies no marker score, expression magnitude, specificity statistic, fold change, effect size or p-value for these columns. Those fields therefore remain unavailable. Rank is retained as source order only and cannot be promoted to an exact identity rule or quantitative strength.

## Population identity boundary

- Sixteen non-motor populations remain unresolved as local spinal interneurons versus ascending projection neurons at the record level. Marker panels alone cannot resolve that distinction.
- `MN`/motoneurons are retained as source context only and are excluded from any interneuron count.
- RAG-state, tracing and spinocerebellar observations remain separate contextual evidence; they are not same-cell joins to any of the 17 label-transfer populations.
- Exact identity to Russ, Sathyamurthy, NeuroMorpho, reference-anatomy or project SCI entities remains zero.

## Required empty fields

Unless a future admitted public digital object directly supports them, the following remain empty or explicitly `not_available`/`not_measured`:

- cell, nucleus or atlas coordinates and registration transforms;
- soma, dendrite, axon and complete-cell geometry;
- linked morphology or same-cell molecular–morphology identity;
- complete axon and projection-target assignment;
- observed synaptic partners or synaptic connectivity;
- whole-cord abundance, biological prevalence, cell loss or expansion; and
- cross-source type identity or inferred anatomical placement.

Search co-occurrence, marker overlap, nearby reference anatomy and visually plausible placement cannot populate these fields.

## Verified deterministic and search gates

Current-run focused verification, not a browser or full-suite claim, established:

- an exact-source rebuild was byte-identical to `data/matson-neuronal-sci-timecourse-0.1.json`; the generated file SHA-256 is `620b6a04faf3d91ed202846bf8f7c32eb0f7b861342e5cb8a8a11c92cc7bef49`;
- a Research Explorer rebuild produced 356 source records and was byte-identical for both the index and asset manifest; the index SHA-256 is `d9218b409a4f64c46718d39bfee0df834bd91f394f52ff20d9802499dc1537f7`;
- all 48 focused parser, Matson contract/state, Research Explorer and SSR tests passed with zero failures or skips; and
- deep-ranked genes are searchable (`Parm1` resolves the source-local Pdyn population and `SDR42E2` resolves CSF-c) without creating a cross-source biological relationship.

The focused mutation gates reject a changed workbook hash, wrong headers, missing or duplicate ranks, reordered or altered genes, wrong source cells, populated lower rows, formulas, invented statistics and relationship/registration promotion. Browser interaction, visual layout and the complete repository test suite are outside this audit and are not claimed here.

## Remaining precision gap and research strategy

The fixed goal is technology development: a more precise, evidence-auditable 3D research atlas. The evidence rule is also fixed: only traceable public digital data or imagery may populate biological fields, and unsupported content stays empty. Within that boundary, the implementation method and chosen public sources may evolve as stronger downloadable objects become available.

Priority should go to public objects that directly add a currently empty axis—native coordinates, same-cell morphology, projection identity, connectivity or quantitatively defined molecular state—while preserving source-native namespaces and denominators. A richer marker list alone must not be mistaken for richer cellular structure. Any future source must pass file-level provenance, checksum, license/reuse, schema, denominator and mutation gates before it changes the model.

## Primary sources

- [Matson et al., Nature Communications 2022](https://www.nature.com/articles/s41467-022-33184-1)
- [GEO GSE172167](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE172167)
- [Supplementary Dataset 2](https://static-content.springer.com/esm/art%3A10.1038%2Fs41467-022-33184-1/MediaObjects/41467_2022_33184_MOESM4_ESM.xlsx)
