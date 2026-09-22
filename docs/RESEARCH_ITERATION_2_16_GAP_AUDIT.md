# Research iteration 2.16 evidence-gap audit

Audit date: 2026-08-27  
Scope: the public-data-only Häring/GSE103840 dorsal-horn taxonomy slice. This is an evidence and modeling audit, not a claim that the app contains a complete interneuron census or a complete 3D cell model.

## Outcome

Iteration 2.16 closes a substantial source-taxonomy gap by adding 30 checksum-bounded Häring source profiles to the type atlas. It does **not** close the morphology, cell-interior, same-cell multimodal, spatial-registration, projection, electrophysiology, synaptic, or SCI-state gaps. Those axes remain explicit unavailable values rather than being filled with generic geometry.

The canonical contract is `data/haring-dorsal-horn-source-taxonomy-0.1.json` (SHA-256 `23d6cda3af6c4205926e8d994fea0cbc11d5cd02c2287e72f7c6a17c89c98549`). The Research Explorer index is `public/data/research_explorer_index_v1/search-index.json` (SHA-256 `d392803d448fc28deb867ae603d5c5614503e7fc4de28a03bda97b0a4916ced1`).

## Reference-backed detail now present

| Precision axis | Admitted detail | Evidence authority | Boundary retained in the model |
|---|---|---|---|
| Source taxonomy | Glut1–15 and Gaba1–15, including raw labels and the deposited Gaba1 `Glut_Gal` anomaly | Checksum-pinned processed matrix plus Supplementary Tables 4, 5, and 8 | Thirty source labels are not thirty canonical cross-study types and not thirty confirmed local interneuron classes |
| Cell assignments | 1,545 exact final cell columns and exact per-profile counts | Matrix `standard_names` row reconciled to Supplementary Table 4 | Counts are sampled cells, not prevalence or animal denominators |
| Marker detail | Signed Table 5 detection rules and distinct Table 8 main/co-marker sets with exact worksheet locators | Primary supplementary workbooks | Detection rules are source validation rules, not universal necessary-and-sufficient identities |
| Age and selection metadata | Exact profile-level P17–P28 day counts, deposited 0/1 sex-code counts, and strain/selection-label counts | Processed matrix metadata rows | These are cell-column aggregates; broad adult/juvenile/young-adult categories and donor-level sex/age are not asserted |
| Experimental denominator | 28 source animals: 3 Vgat-cre;tdTomato FACS, 5 Vglut2-eGFP FACS, and 20 unbiased dissociation animals | Article and Supplementary Figure 1 context | Animal, cell, GSM, section, and staining denominators remain separate |
| Curation pipeline | 1,639 post-QC neurons → 94 excluded → 1,545 final cells; 43 initial BackSPIN clusters → 30 final types; 767 Glut-group + 778 Gaba-group cells | Article/supplement plus reconciled matrix | Pipeline stages are not biological replicates or prevalence |
| Population spatial context | Two animals and six cervical sections | Supplementary population-level density maps | This is not per-cell xyz, a same-cell localization, a project-atlas transform, or a 3D reconstruction |
| Provenance | GEO, DOI/PMID, BioProject/SRA context, file sizes, SHA-256 receipts, and exact table/cell locators | Official GEO/Nature records and pinned local receipts | Public accessibility is not treated as permission to rebundle all source files or author code |

## Empty axes that must remain empty

The current public exports do not support the following per-cell or per-profile fields:

- donor identity or a cell-to-donor key;
- spinal level for each sequenced cell;
- x/y/z coordinates or an atlas transform;
- soma, dendrite, axon, organelle, or synapse geometry;
- electrophysiology or raw traces;
- projection target or complete axon trajectory;
- same-cell morphology–transcriptome–projection linkage;
- SCI condition, injury response, lineage trajectory, or causal sensory function;
- exact identity with Russ, Sathyamurthy, Hayashi, Matson, NeuroMorpho, or the seven SCI evidence entities.

Accordingly, iteration 2.16 creates **0 registrations** and **0 exact cross-source identities**. A generic sphere, synthetic arbor, or independently observed SWC cannot be relabeled as the morphology of Glut7 or any other Häring cluster.

## Source discrepancies retained without silent repair

1. Glut7 contains 104 cells in the checksum-pinned matrix and Supplementary Table 4, but the Supplementary Figure 2 legend says 105. The contract uses 104 to preserve the 1,545-cell reconciliation and records 105 as a conflict.
2. Article/supplement/workbook context supports Fluidigm C1, while every GEO GSM record says `10X Chromium cellranger pipeline version 1.1`. The app does not synthesize one universal platform label.
3. The release contains deposited 0/1 sex codes, while an author-exporter comment describes a stale −1/0/1 convention. The app retains the released codes and does not infer donor sex.
4. The SRA summary says `mouse brain dorsal horn`, whereas article, GEO sample source, protocol, and workbook context converge on spinal-cord dorsal horn. The convergent tissue context is shown while the SRA wording remains visible.

## Verification baseline

- `npm run test:research`: 262 tests; 260 passed, 2 skipped, 0 failed. Build, lint, validators, deterministic index construction, 12 focused Häring contract tests, and Research Explorer tests passed.
- `npm run test:frozen-2.8`: passed; 141 frozen files, 0 registrations, archive SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`.
- `git diff --check`: passed with no whitespace errors.

## Research decision for the next precision cycle

UPG-086 is the next provenance/detail slice: add all 1,545 cell/GSM/SRX records and 2,157 SRR runs, while keeping enrichment, dendrogram, RNAscope, 2D laminar, Arc-association, and tracing observations in separate evidence lanes. This can deepen the information model but still cannot authorize cluster-specific 3D cell geometry. Source-observed morphology and cellular-interior modeling therefore require their own evidence contracts rather than a visual substitution.
