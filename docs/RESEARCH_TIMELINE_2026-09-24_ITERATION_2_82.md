# Research timeline — iteration 2.82 (2026-09-24)

## Scope and outcome

Continued the public Trevisan V1 data-availability audit by enumerating the official GEO sample-title roster and checking the public metadata parser against the observed sample names. Added an English UI panel that distinguishes title-pattern matches, sample-level metadata observations, parser exceptions, and unresolved import gates.

## GEO sample roster and parser exceptions

- The official GSE275595 series page lists 29 GSM sample records. The 24 postnatal titles fit the public helper's expected title pattern; five titles do not: `P0HetR1`, `P0KoR1`, `P0HetR2`, `P0KoR2`, and `E135HetR1`.
- Three representative regular sample records and all five exceptions were inspected at GEO sample level. All five exceptions report `Whole cord`; the source helper's third-from-end rule returns `t`/`o`, and its first-numeric-substring rule returns `135` for `E13.5`. These are parser exceptions, not biological transitions.
- Representative GSM8480577 lists separate Cell Ranger `barcodes.tsv.gz`, `features.tsv.gz`, and `matrix.mtx.gz` components with their displayed sizes. The series page lists a 1,450,055,680-byte MTX/TSV TAR and raw data in SRA.
- No GSM matrix payload was downloaded or checksummed; GEO file-specific reuse terms remain unverified. Per-cell barcode-to-matrix crosswalks and per-nucleus age/cluster/region rows were not reproduced. No new profile, morphology, internal detail, same-cell join, registration, or measurement was admitted.
- Updated UPG-254 to record the sample-level audit while retaining its partial status and the remaining file-level, rights, and per-nucleus gates.

## Historical receipt and release boundary

- Iteration 2.82 is a local, incremental follow-on to sealed 2.81. The canonical registry remains 31 sources, 41 record sets, 13 exact cell/profile rosters, 4 exact source-object sets, and 387 source profiles; the upgrade registry remains 236 rows, 69 complete.
- No commit or GitHub push was made. No full-project copy or source payload download was made.

## Verification

- `npm run test:research` passed: production build, lint, complete research-validator chain and 970 tests (955 passed, 15 skipped under optional source/runtime conditions, 0 failed).
- The production build and English-only SSR suite passed; `node --test tests/rendered-html.test.mjs` passed all 39 checks, including the GEO sample audit panel and exception-record links.
- The sample-audit schema/semantic validator and targeted Trevisan tests passed. The 2.80, 2.81 and 2.82 immutable manifest validators passed; 2.82 records 37 authoritative inputs and links to the sealed 2.81 parent.
- The canonical source registry remains 31 sources, 41 record sets, 13 exact rosters, 4 exact source-object sets and 387 profiles; the upgrade registry remains 236 rows, 69 complete. The build emitted the existing non-fatal large-client-chunk advisory.

## Research references

- [Trevisan et al., Nature Communications (2026)](https://doi.org/10.1038/s41467-026-76522-3)
- [GEO GSE275595](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE275595)
- [Representative sample GSM8480577](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSM8480577)
- [Exception sample GSM8480601](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSM8480601)
- [Exception sample GSM8480605](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSM8480605)
- [Public metadata derivation function](https://github.com/Bikoff-Lab/V1_interneuron_snRNAseq_Age_Atlas/blob/main/Functions/3_Add_metadata.R)
