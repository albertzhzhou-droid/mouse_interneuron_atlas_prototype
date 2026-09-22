# Cano-Gomez P56 metadata recovery

Recovered from the exact public GEO objects on 2026-09-22 UTC. This directory retains three small metadata CSV.gz files, their complete extraction audits, and three acquisition receipts. The 3,606,270,688 source bytes are temporary inputs and are not bundled. No project directory was copied.

| Source object | Source bytes | Rows | Groups | Nonempty `meta.data$neuron_types` labels |
|---|---:|---:|---:|---:|
| `GSE318731_P56_cholinergic_multiome.rds` | 127,862,795 | 3,199 | 5 | 38 |
| `GSE318731_P56_gabaergic_multiome.rds` | 1,646,402,816 | 73,364 | 24 | 204 |
| `GSE318731_P56_glutamatergic_multiome_UPDATE.rds` | 1,832,005,077 | 92,782 | 28 | 0; source column absent |

The source directory is [NCBI GEO GSE318731 supplementary files](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/). Exact URLs, byte counts, SHA-256 values and byte-range receipts are preserved in `*.rds.download.json`. These are project-computed integrity pins, not publisher-provided checksums. CHOL and GABA exactly reproduce their earlier source hashes; GLUT was first completely verified in this recovery.

The GLUT UPDATE metadata has only `orig.ident`, `nCount_RNA`, `nFeature_RNA`, `anatomy`, `groups`, `source`, and `Sex`. The absent `neuron_types` field is emitted as source NA for all 92,782 nuclei, with a `SOURCE_ABSENT_ASSIGNMENT` receipt restricted to SHA-256 `ff3784791ccb5d23311b9d0a8e2a4bd09dd251f75d0a2fc4b30e762dcef29c92`. The separate `active.ident` slot has 277 factor levels and 277 observed distinct nonmissing labels, with zero unused levels. The [source-observation receipt](GSE318731_P56_glutamatergic_multiome_UPDATE.active-ident-observation.json) records its 92,782 entries, 92,782 unique nonempty names, and exact equality of those names to metadata row names in the same order. It also pins the retained RDS and the reproducible inspector script. This is an observation within one object; no assay identity was inspected and no labels are admitted or substituted into the metadata-only registry. The observed metadata label union is therefore 242, not the paper-reported 516. Neither count is an interneuron denominator.

Only exact `groups == CHOL_IN` rows are admitted: 11 profiles and 923 nuclei. All 169,345 rows are retained in the assignment audit. GABA lacks source and Sex metadata columns; their absence remains explicit. Geometry, intracellular structures, cross-assay identity, cross-source identity and atlas registration remain unestablished.

## Reproduce

Use `python3 tools/fetch_cano_gomez_sources.py CHOL <temporary-raw-directory>` and the equivalent GABA/GLUT commands. Downloads use resumable 16 MiB ranges, exact Content-Range checks, gzip CRC, and whole-source SHA-256 checks. A source is published as complete only after all checks pass; assembly briefly requires one extra source-sized temporary file.

The extraction runtime used base R 4.6.1 from `https://cdn.posit.co/r/macos/R-4.6.1-macos-arm64.tar.gz` (94,302,183 bytes; SHA-256 `99e36a4fb66169d800d293bbab18e8c453b7a805bd082af54e06acd6dab266cb`), unpacked in temporary storage without system installation.

Run `tools/extract_cano_gomez_rds_metadata_stream.py` with the exact source SHA-256, source filename, class name, Rscript path and a new extraction output directory. Extract CHOL first; GABA and GLUT require its current-code audit through `--chol-probe-audit`. The worker materializes the full RDS before retaining only metadata; the operational CHOL probe does not establish memory safety for larger sources.

Retain the two small output files per source in this directory. Rebuild the three production derivatives with:

```sh
node tools/build_cano_gomez_p56_multiome_interneuron_registry.mjs \
  data/source-extractions/cano-gomez-p56 \
  /private/tmp/cano-registry-rebuild
node scripts/validate-cano-gomez-p56-multiome-interneuron-registry-0.1.mjs \
  /private/tmp/cano-registry-rebuild/cano-gomez-p56-multiome-interneuron-registry-0.1.json
```

The builder rejects an existing output directory. Compare the regenerated files and update only the exact production artifacts and their source-card checksums. Keep original RDS files link-only. Project derivatives retain the private research repository boundary pending separate public-release review.
