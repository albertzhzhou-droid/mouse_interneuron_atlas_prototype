# Research timeline — iteration 2.87 (2026-09-24)

## Scope and outcome

UPG-257 audited both official Koh et al. supplemental files. The XLSX contains 31 figure-named worksheet regions with count/category tables, measurements and heatmap rows; the seven-page PDF contains static figures/captions, including reconstruction illustrations. Neither file contains a machine-readable stable-object roster, XYZ object/synapse coordinates, row-level object references, or importable segmentation geometry. This is limited to these two files: the article describes object, synapse and tripartite-glia lists in its methods, and the separately deposited code route remains unaudited under UPG-259.

The official PMC article-version metadata reports CC BY-NC-ND and matches both retrieved supplement files by MD5. It does not expose a separate per-supplement licence field. The files remain link-only: neither is copied into the project, modified, or redistributed. The audit adds no zebrafish objects, coordinates, geometry, same-cell/cross-species joins, registration or mouse denominator.

## Queue and denominator state

UPG-257 is complete for its declared two-file audit; UPG-259 is planned to inspect the separate Zenodo code deposit and exact-file reuse terms. The queue contains 241 research/model rows, 71 completed items and 45 research-facing IDs resolved by the app. The source registry remains at 31 canonical sources, 41 record sets, 13 exact cell/profile rosters, 4 exact source-object sets and 387 source profiles; stale denominator literals remain 0.

## Verification

The supplemental-file audit validator pins both file identities, metadata MD5s, worksheet names/ranges, the PDF page count, licence boundary and no-admission state. The 2.87 manifest records 18 authoritative inputs and its immutable 2.86 parent. `npm run test:research` passed: production build, lint and registered validators completed, followed by 981 regression checks (966 passed, 15 conditionally skipped, 0 failed). Build output retains non-blocking large-client-chunk and route-classification advisories, plus the Node module-registration deprecation warning.

## References

- [Koh et al., Cell Reports article and supplemental files](https://pmc.ncbi.nlm.nih.gov/articles/PMC12958134/)
- [PMC article-version metadata for the exact supplemental file checksums and licence](https://pmc-oa-opendata.s3.amazonaws.com/PMC12958134.1/PMC12958134.1.json)
- [PMC Article Dataset access and per-version licence metadata guidance](https://pmc.ncbi.nlm.nih.gov/tools/pmcaws/)
- [Zenodo supporting-code deposit, queued for separate file-level audit](https://doi.org/10.5281/zenodo.17475612)
