# Feasibility prototype completion audit

This document distinguishes what the software can prove now from the external research validation required before calling it a research atlas.

## P0 software and scientific-contract checks

- [x] Species is fixed to adult mouse throughout the release.
- [x] The seven records state their non-mutually-exclusive classification axes.
- [x] Every record contains an allowed claim and a not-established boundary.
- [x] Every visible cell/state glyph is tagged `SYN`; every pathway is tagged `SCH`.
- [x] The UI says that coordinates are schematic and not valid for measurement.
- [x] Complete, staggered and lateral-hemisection models remain distinct filter values.
- [x] Locomotion, breathing and spasm remain distinct endpoint values.
- [x] Empty filter results are not described as biological absence.
- [x] Evidence cards preserve negative findings.
- [x] All seven records include ledger ID, DOI and source link.
- [x] The JSON export includes release ID, active state, sources and disclaimer.
- [x] A full semantic list and evidence panel remain available without WebGL.
- [x] External atlas, morphology and imaging assets are not bundled or falsely represented.

## Scientific red-team assertions enforced by the validator

1. P02 is `staggered_hemisection`, never a single complete-lesion result.
2. P03 carries `NEC` but not `SUF`, and its boundary says sufficiency is unestablished.
3. P05 preserves complete-T8 failure, no extra axon growth and residual coactivation.
4. P08 preserves the neonatal/adult separation and variable partial adult recovery.
5. P09 explicitly sets `humanCausalEvidence: false`.
6. P14 is a spasm endpoint and cannot become a beneficial locomotor record.
7. P16 is a breathing endpoint and cannot enter locomotion counts.
8. Every geometry uses `schematicPosition`; no `exactXyz` field exists.
9. Every record has `SYN` geometry and `SCH` pathway status.
10. No unsupported phrase such as “complete connectome” or “clinical treatment model” appears in a supported claim.

## Engineering verification required for release

- [x] Production build succeeds.
- [x] Server-rendered route returns HTTP 200 and product-specific metadata/content.
- [x] Data-contract validator and all seven Node tests pass.
- [x] No starter loading skeleton, example database route or preview metadata remains.
- [x] No external volume, mesh, morphology or cell-data request is required.
- [x] Built JavaScript and total asset size are recorded.
- [x] Dependency findings are recorded; compatible patches were applied without `--force`.

Exact commands, measurements and residual toolchain warnings are recorded in
[`BUILD_AND_VALIDATION_REPORT.md`](BUILD_AND_VALIDATION_REPORT.md).

## External gates not claimed by this feasibility build

- [ ] Two independent spinal-neuroscience curators approve canonical mappings.
- [ ] At least five target researchers complete the predefined tasks.
- [ ] At least 90% of users correctly distinguish observed, registered, inferred, schematic and synthetic.
- [ ] A real atlas registration passes held-out-landmark validation.
- [ ] Imported SWCs pass topology, units, completeness and orientation QC.
- [ ] Asset redistribution rights are approved for every imported dataset.

Until those external gates pass, the release name remains **feasibility prototype**, not **complete research atlas**.
