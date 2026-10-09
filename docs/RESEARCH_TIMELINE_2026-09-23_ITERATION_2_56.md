# Research timeline — iteration 2.56 (2026-09-23)

## Scope and rollback

Continue the source-grounded atlas using the sealed 2.55 release as the only parent. Rollback reference: `data/research-iteration-manifest-2.55.json` (347,440 bytes; SHA-256 `d3d167e7bc6493605578bf0ecfbfd03dfe19e0ecdc1db9163d086a4dd4ead87f`; content SHA-256 `08b67bbadadd36393e96cbac676c6274248f656872bcf335497443a36366daac`). The previous release was not rewritten; its historical registry denominators remain sealed.

## Research and implementation

- Added a separate 4 dpf *Danio rerio* spinal-cord comparison panel based on Kelly et al. and GEO GSE232801. It lists ten article-reported interneuron labels and their article-located marker/subtype evidence. The 11,762 integrated cells and 33 neuronal clusters remain study denominators, not an animal count or the ten-label count. GEO's 150-fish summary and the article's approximately 150 cords per replicate across two replicates remain an explicit unresolved conflict. The barcode-to-label roster remains unverified and the neuronal RDS remains link-only.
- Kept the fish comparison outside the 387 source-profile mouse-centric core denominator. It contributes no mouse equivalences, cell geometry, internal structures, same-cell morphology links, or registration.
- Recorded the observed exact-query 8.6.125 vs 8.6.124 NeuroMorpho semantic metadata comparison: the same 142 stable neuron IDs and no changed semantic fields after excluding API links. The 219,524-byte remote response is not retained; its reported hash is a historical observation, and independent reproduction requires rerunning the exact GET. Geometry-file hashes, asset-level dimensionality and reuse/attribution rights were not rechecked. The active morphology collection remains 8.6.124.
- Added the 8.6.125 audit to the canonical source registry under UPG-228 and exposed its evidence limits in the Research Overview. The source, record-set, roster and source-object denominators remain dynamically derived; current totals are 28, 37, 11 and 2. The research/model upgrade queue now has 212 rows through UPG-230, including the distinct comparative fish taxonomy gap and a build-warning-based deferred-loading budget candidate.
- Converted 2.55 validation to a byte/content-locked immutable snapshot. This iteration's builder receipts refresh only changed files and add exact research, UI, validation, and timeline inputs.
- No complete-project-copy folder was created. The model still renders zero internal primitives from these additions; no sphere or other proxy geometry was introduced.

## Verification

- The current 2.56 manifest validates 447 exact input receipts and names 2.55 as its immutable parent. The source registry resolves 28 sources, 37 record sets, 11 exact rosters, and 2 exact source-object sets; all eight displayed denominator values are registry-derived, with zero stale canonical denominator literals.
- `npm run test:research`: 830 tests, 815 passed, 15 conditionally skipped, 0 failed. Source, taxonomy, morphology, spatial-asset, and current-release validators passed; the 2.55 byte/content-locked snapshot remains valid.
- `npm run build` and `npm run lint` passed. The Vite production build emitted a non-blocking warning that at least one minified client chunk exceeds 500 kB; this is recorded as UPG-230 for measured code-splitting rather than feature removal.
- The incremental-layout validator reports zero complete project copies. These increments add no internal-detail primitives or registrations.

## Sources

- [GEO GSE232801](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE232801)
- [Kelly et al., eLife](https://doi.org/10.7554/eLife.89338), [Table 1](https://elifesciences.org/articles/89338#table1)
- [NeuroMorpho official API documentation](https://neuromorpho.org/api.jsp), [API reference](https://neuromorpho.org/apiReference.html), and [Terms of Use](https://www.neuromorpho.org/useterm.jsp)
