# Research timeline — iteration 2.88 (2026-09-24)

## Scope and outcome

UPG-259 resolved the article-cited Zenodo concept DOI to version record `10.5281/zenodo.17475613` (v1.0, CC BY 4.0). The sole 9,289-byte archive was retrieved after checking the exact file metadata; its MD5 matched the Zenodo record. The ZIP contains only two Python scripts. One builds object/synapse/glia lists from an external workbook with eight circuit-named sheets; the other parses `annotation.xml` from a separate Knossos `.k.zip`. Neither input is in the Zenodo archive, and the published PMC figure-summary XLSX has different sheet names. The scripts were inspected as text only and not executed. The code deposit therefore supplies reproducible transformations, not the rows or morphology payload needed to materialize them.

The deposit is licensed CC BY 4.0, but that code licence does not establish reuse rights for the absent workbook or Knossos annotation. No code or source data is copied into the project. No zebrafish cell, coordinate, geometry, measurement, same-cell/cross-species join, registration or mouse denominator was added. UPG-260 tracks discovery of those exact inputs from public, rights-reviewed sources only; no author contact or credentialed access is planned.

## Queue and denominator state

UPG-259 is complete for its versioned, exact-file code-package audit; UPG-260 is planned for the missing public inputs and rights gate. The queue contains 242 research/model rows, 72 completed items and 45 research-facing IDs resolved by the app. The source registry remains at 31 canonical sources, 41 record sets, 13 exact cell/profile rosters, 4 exact source-object sets and 387 source profiles; stale denominator literals remain 0.

## Verification

The 2.88 audit validator pins the concept/version DOI relationship, file size/MD5, exact archive member inventory, external-input requirements, CC BY code boundary and zero-admission state. The 2.88 manifest records 21 authoritative inputs and its immutable 2.87 parent. `npm run test:research` passed: production build, lint and registered validators completed, followed by 984 regression checks (969 passed, 15 conditionally skipped, 0 failed). Build output retains non-blocking large-client-chunk and route-classification advisories, plus the Node module-registration deprecation warning. Final manifest, source-audit, queue-registry and focused 2.88 tests passed after the run.

## References

- [Koh et al., Cell Reports article and data-availability statement](https://pmc.ncbi.nlm.nih.gov/articles/PMC12958134/)
- [Zenodo concept DOI](https://doi.org/10.5281/zenodo.17475612)
- [Zenodo v1.0 record](https://zenodo.org/records/17475613)
- [Versioned GitHub v1.0 source tag](https://github.com/ZacharyMKoh/Spinal-Sensorimotor-Circuit/tree/v1.0)
