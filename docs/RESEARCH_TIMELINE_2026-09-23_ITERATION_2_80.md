# Research timeline — iteration 2.80 (2026-09-23)

## Scope and outcome

Continued the existing 2.79 project tree. Audited the public Trevisan V1 data route and added a source-availability evidence panel. The increment distinguishes what the article, interactive resource and code repository report from what has actually been retrieved, checksummed and crosswalked in this atlas.

## Trevisan V1 source availability

- The paper reports that raw sequencing, count tables and associated metadata are in GEO GSE275595, and identifies Supplementary Data 3 as the unique barcode roster for cells used in the final figures. The study-wide selected-nucleus count remains 89,494; the supplement workbook was not downloaded or inspected in this increment.
- Read-only inspection of the public ShinyCell view showed `age`, `replicate` and `seurat_clusters` as cell-information annotations; its inspected subset selector offered `replicate` and `seurat_clusters`, with cluster values 0–13.
- The paper-linked analysis repository is public and the inspected `LICENSE` is MIT. Its final-integration R script references `age`, `replicate`, `region` and `seurat_clusters`, along with `Data_raw_Merged.rds` and `Cells_pos.csv`. The inspected final-integration directory contained that script, not a prebuilt integrated object. This documents a reconstruction route, not validated rows or a reproduced cluster assignment.
- Added a structured source-availability audit with a strict schema and tests. The UI now separates published inputs, the analysis route and the outstanding import gate. The article's CC BY 4.0 and code's MIT license are not asserted as licenses for GEO files.
- Per-cell barcode-to-matrix mapping, exact counts by age/cluster/region, GEO file-specific reuse terms and checksums remain unverified. UPG-254 is now partially completed; its source-object gate remains open. No new profile, 3D morphology, internal structure, same-cell join, registration or measurement is admitted.

## Historical receipt and release boundary

- The 2.79 snapshot verifier now validates the sealed manifest, parent identity, stored receipt shape and frozen summaries without rebuilding the historical release from files that legitimately changed in 2.80.
- Iteration 2.80 is sealed as a local research increment. The canonical registry remains 31 sources, 41 record sets, 13 exact cell/profile rosters, 4 exact source-object sets and 387 source profiles. The upgrade registry remains 236 rows, of which 69 are complete.
- No commit, GitHub push, full-project copy or source-data download was made.

## Verification

- `npm run test:research` passed the production build, lint, full research validator chain and 965 tests (950 passed, 15 skipped by optional source/runtime conditions, 0 failed). After adding the explicit URL-restored type-atlas assertion, `node tools/run_current_research_tests.mjs` again passed 965 tests with the same counts.
- `node --test tests/rendered-html.test.mjs` passed all 39 rendered-page and English-only checks, including the URL-restored type-atlas route and its source-availability panel.
- The 2.79 and 2.80 immutable snapshot validators passed. The production build emits a non-fatal large-client-chunk advisory.

## Research references

- [Trevisan et al., Nature Communications (2026)](https://doi.org/10.1038/s41467-026-76522-3)
- [GEO GSE275595](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE275595)
- [Interactive V1 resource](https://v1interneurons.stjude.org/shinyApp/)
- [Public analysis repository](https://github.com/Bikoff-Lab/V1_interneuron_snRNAseq_Age_Atlas)
- [Repository MIT license](https://github.com/Bikoff-Lab/V1_interneuron_snRNAseq_Age_Atlas/blob/main/LICENSE)
