# Curator release notes — public-data workbench candidate 1.6

**Distribution candidate:** `1.6.0-curator.1`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-1.6.0`  
**Release-manifest content SHA-256:** `cc05249fb4683dd5565c7134cc490ecc4c014243e35f935baeae79f13cbdacaf`  
**Registration count:** **0 registrations**

Candidate 1.6 adds a reviewable Tabulae Paralytica condition browser while preserving the public-data-only boundary.

## Tabulae metadata-only condition index

The Sources workbench now exposes `ohri-tabulae-paralytica-condition-catalog-0.1.0`. Its only authority is `SOURCE_METADATA_CONDITION_INDEX_ONLY`, and its admission decision is `metadata_only_not_downloaded_not_bundled_not_registered`.

The index records eight condition groups and 93 distinct literal labels visible in the public GEO series pages:

- GSE234774: uninjured, post-SCI time-course, injury-mechanism, severity, visible male-label, drug-label, and Visium spatial-section groups.
- GSE230765: RNA and ATAC source-label groups for `UN`, `D7`, and `2M`.

Each group preserves its GEO accession, source modality, aggregation level, literal condition labels, explicit interpretation boundary, and next gate. The spatial group is explicitly a set of spatial sections, not cell-level data. Drug abbreviations, severity tokens and `OLD` remain literal source labels; the application does not invent a protocol, dosage, numerical timepoint, effect, comparison, or causal result.

No GEO source-file body or processed metadata is bundled. There is no local hash, count matrix, numerical analysis, individual cell identity, source/project coordinate, same-cell pairing, cross-condition pooling, treatment claim, SWC transfer, or `REG`.

## Next public-data gate

`UPG-011` remains a research-watch gate. It requires one version-pinned processed object, asset-level rights decision, sample metadata, checksum, coordinate/aggregation fields, and a prespecified compatible-condition comparison rule before a bounded source-data adapter can be proposed. It cannot create a whole-spinal-cord atlas, treatment-effect claim, same-cell join, project registration, or public-release authority.

## Preserved boundaries

The package still has seven stable synthetic evidence entities, five source-local unregistered NeuroMorpho morphology exemplars, a BrainGlobe inferred reference, zero downloaded candidate files in preflight, zero newly acquired public assets, and **0 registrations**. The existing Russ reconciliation dossier, STARmap PLUS eligibility lead, Cano-Gomez specimen-aware preflight, and local adjudication-packet workflow remain non-promoting and read-only.

This package is for named private curator review. Public deployment or broad redistribution remains subject to institutional review and asset-level rights decisions.
