# Research timeline — iteration 2.81 (2026-09-24)

## Scope and outcome

Continued the public Trevisan V1 source-availability audit from sealed iteration 2.80. Inspected the repository's matrix-loading and sample-metadata helper functions and recorded their implementation rules without treating those rules as validated GEO assignments.

## V1 public-code reconstruction route

- `Functions/2_Load_and_merge.R` discovers directories ending in `*_cellranger`, reads `outs/filtered_feature_bc_matrix` by default via `Read10X`, and creates Seurat objects with defaults `min.cells = 10` and `min.features = 1000`. The default therefore documents a filtered-matrix analysis route, not a direct import of raw reads.
- `Functions/3_Add_metadata.R` derives `region` from the third character from the end of `orig.ident`, `replicate` from its final character, and `age` from its first numeric substring. The directory-name prefix supplies the sample/project identifier used to create the Seurat object.
- These functions clarify how the public scripts expect to reconstruct metadata. They do not demonstrate that every GEO sample ID follows this naming convention, that barcode identifiers map one-to-one across deposited matrices and supplementary rosters, or that the scripts were reproduced against public inputs.
- Updated the source audit, schema, validator, UI panel and UPG-254 queue row to show the code-derived parsing rules and keep full GEO sample-name validation, per-cell reproduction, file-specific reuse rights, count checksums and barcode joins explicitly unresolved. No public count or supplementary payload was downloaded.
- No new cell/profile denominator, morphology, internal structure, same-cell join, registration, or measurement was admitted; V1 remains excluded from the existing 387-profile denominator and main 3D scene.

## Historical receipt and release boundary

- Iteration 2.81 is a local, incremental follow-on to sealed 2.80. The canonical registry remains 31 sources, 41 record sets, 13 exact cell/profile rosters, 4 exact source-object sets and 387 source profiles; the upgrade registry remains 236 rows, 69 complete.
- No commit, GitHub push, full-project copy or source-data download was made.

## Verification

- `npm run test:research` passed the production build, lint, full validator chain and 966 tests: 951 passed, 15 skipped under optional source/runtime conditions, 0 failed.
- `node --test tests/rendered-html.test.mjs` passed all 39 checks, including the updated V1 source-availability language.
- The Trevisan source-audit validator, UPG registry validator, and 2.80/2.81 manifest validators passed. The production build emitted the existing non-fatal large-client-chunk advisory.

## Research references

- [Trevisan et al., Nature Communications (2026)](https://doi.org/10.1038/s41467-026-76522-3)
- [GEO GSE275595](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE275595)
- [Public V1 analysis repository](https://github.com/Bikoff-Lab/V1_interneuron_snRNAseq_Age_Atlas)
- [Matrix-loading function](https://github.com/Bikoff-Lab/V1_interneuron_snRNAseq_Age_Atlas/blob/main/Functions/2_Load_and_merge.R)
- [Metadata derivation function](https://github.com/Bikoff-Lab/V1_interneuron_snRNAseq_Age_Atlas/blob/main/Functions/3_Add_metadata.R)
- [Repository MIT license](https://github.com/Bikoff-Lab/V1_interneuron_snRNAseq_Age_Atlas/blob/main/LICENSE)
