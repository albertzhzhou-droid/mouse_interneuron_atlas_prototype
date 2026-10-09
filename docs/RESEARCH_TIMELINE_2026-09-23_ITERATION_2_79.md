# Research timeline — iteration 2.79 (2026-09-23)

## Scope and outcome

Continued in the existing 2.78 project tree. Added a bounded, selectable article-derived reference for the postnatal mouse spinal V1 interneuron taxonomy. It is a separate molecular/source-context view, not another cell shape, not a complete census of all interneurons, and not part of the existing 387 source-profile denominator.

## V1 age and cluster reference

- The source article reports 89,494 selected V1 nuclei from two independent transcriptomic replicates across P0, P14, P28 and P56, resolved into 14 higher-resolution clusters. The article reports nuclei from all four ages in every cluster, in roughly equal proportions; these are cross-sectional samples and do not track the same cells over time.
- Added a keyboard-operable 14-cluster browser with source-located marker/clade descriptions. It preserves the partial Sp8/Pou6f2 co-expression in cluster 5; Calb1 as a proxy for the MafA clade and the paper's qualified Renshaw interpretation for cluster 8; Rnf220 clusters 1/6; and the non-exclusive Nr5a2 characterization of cluster 9.
- The paper-reported size range (22.9% for cluster 0 to 2.2% for cluster 13) is shown only as an article-level range. Exact per-cluster counts, the barcode roster and cluster-by-region assignments were not imported. GEO/raw files and article figures were not bundled.
- The article's CC BY 4.0 attribution is displayed. Its article licence is not treated as a licence for GEO files.
- Cluster selection stays local to this browser. It creates zero cell morphologies, internal structures, same-cell joins, registrations, measurements or main-scene objects. UPG-040 is partially completed; UPG-254 records the exact roster/denominator/file-rights audit that remains open.

## Queue, denominator and rollback

- The queue now contains 236 rows through UPG-254, with 69 complete rows. UPG-040 is partial and UPG-254 is planned. The canonical summary remains 31 sources, 41 record sets, 13 exact cell-profile rosters, 4 source-object sets and 387 profiles.
- The 2.78 snapshot verifier was made historical-input-independent: it verifies the sealed manifest hash, parent identity, recorded input-receipt structure, denominator summary and no-geometry boundary, without rebuilding 2.78 from files that have since changed.
- Rollback is limited to this iteration's new V1 reference/schema/validator/test, component integration and styles, UPG-040/UPG-254 queue and generated registry, version/manifest metadata, timeline, and the 2.78 snapshot-verifier hardening. Preserve every unrelated change in the existing worktree. A manifest hash records a release-time input; it is not an archive of the source bytes.
- No full-project copy, commit, or GitHub push was made. Exact source metadata, rights and morphology gates remain open.

## Verification

- `npm run test:research` passed after correcting the page shell to derive its displayed iteration from the package version: production build, lint, release/data/schema/registry/source validators, immutable snapshot checks, and 961 current tests (946 passed, 15 skipped by optional runtime/source-asset conditions, 0 failed).
- `node --test tests/rendered-html.test.mjs` passed all 39 SSR/UI checks, including current-version display and English-only rendered UI. The build retains a non-fatal large-client-chunk advisory.
- Manual local browser smoke test: selecting V1 cluster 6 changed the evidence dossier to its Rnf220-enriched profile; selecting cluster 8 changed it to the qualified Calb1/MafA-clade reference. The selection stayed outside the active 3D target; the main scene retained 0 admitted morphology geometry.
- The V1 reference validator, schema, source-record boundary tests, upgrade-registry checks and immutable 2.79 manifest validator passed. Manifest receipts 25 authoritative inputs; no V1 geometry, internal structures, same-cell joins, registrations, or measurements were admitted.

## Research references

- [Trevisan et al., Nature Communications (2026)](https://doi.org/10.1038/s41467-026-76522-3)
- [GEO GSE275595](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE275595)
- [Interactive V1 resource](https://v1interneurons.stjude.org/shinyApp/)
- [CC BY 4.0 licence](https://creativecommons.org/licenses/by/4.0/)
