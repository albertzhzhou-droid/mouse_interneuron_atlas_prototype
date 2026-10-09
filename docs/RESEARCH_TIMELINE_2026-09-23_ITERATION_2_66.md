# Research timeline — iteration 2.66 (2026-09-23)

## Objective and rollback

Continue the open-data mouse spinal interneuron workbench in place. The immutable rollback parent is `data/research-iteration-manifest-2.65.json` (549,009 bytes; SHA-256 `a4d2e6d8bae8c64f048e32041167cb051e61dd76ecd46e3489c4e48da9e646b3`; content SHA-256 `df038e26533b71492d4ae3f79250903c0f7504d88b646172b3f2ecc4a0fb627f`).

## Completed increment — UPG-242 bounded public-data and reuse audit

- Reviewed the official eLife version-of-record article, pinned article API v2 (247,909 bytes; SHA-256 `854963b39bbb091f4cf3a03c470e3a644a69444741b59aa6287b31ed10f97944`), article figures/data/video page, and eLife journal-content terms.
- The paper's count of 71 refers to single-cell light-microscopy tracing, not an SBF-SEM census. Its formal data-availability statement names numerical source-data spreadsheets for Figures 2 and 7. The article API additionally lists Figure 3 source data, which is not an EM volume or segmentation.
- The eLife figure page lists seven figures, seven videos, and one MDAR checklist. Figure 4 panels C–I show serial SBF-SEM publication images; panel J is a publication-rendered reconstruction. Video 5 is a remote 872 × 1080 rendition with an MP4 receipt of 46,541,650 bytes and ETag `492326b245e768ffe6fdf7923880b8f6`; it is not a voxel stack.
- Reported acquisition metadata include 5 nm/pixel, 50 nm section steps, approximate image extents and depth >25 μm. The reviewed sources do not provide full stack dimensions, axis order, voxel arrays, segmentation labels, mesh/skeleton exports, stable EM-object identifiers, or a Video 5-to-cell crosswalk.
- eLife terms say articles and related journal content are CC-BY unless otherwise indicated; no separate Video 5 exception was found in the reviewed metadata. Attribution is required. This does not establish independent asset-specific reuse rights.
- The audit did not download or bundle the video or any volume payload. It admits zero EM volumes, internal geometry/objects, same-cell joins, registrations, and measurements. The bounded review is not a universal absence claim. UPG-188 remains the separate raw-object acquisition gate.
- The internal-detail panel now separates publication imagery from model-usable data and shows the reviewed source scope, data-availability statement, figure/movie counts, incomplete volume metadata, and rights qualification. No object geometry is constructed from the media.

## Primary sources

- [Nakamura et al., eLife 2023](https://elifesciences.org/articles/83108)
- [eLife figures, data, and video page](https://elifesciences.org/articles/83108/figures)
- [Pinned eLife article API v2](https://api.elifesciences.org/articles/83108)
- [eLife terms](https://elifesciences.org/terms)
- [Full text and data-availability statement (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9943067/)

## Verification

- `npm run test:research` passed: production application build, whole-repository ESLint, research validators, and 886 current tests (871 passed, 15 conditionally skipped, 0 failed).
- The 2.65 immutable-snapshot validator/tests passed. The rebuilt 2.66 manifest validates with 547 unique authoritative inputs, 224 upgrade rows, 65 completed rows, 37 displayed research-facing identifiers, and zero stale denominator literals.
- The audit JSON Schema and semantic validator both reject promotion of publication media to a voxel stack, geometry, identity join, or measurement source.
- The production build retains the existing >500 kB minified-chunk advisory tracked separately under UPG-230; this does not fail the build or research suite.
- UPG-242 and the registry-wide displayed-ID denominator are validated from the generated research/model registry; no static display denominator is introduced.

## Next research gates

1. Keep UPG-188 open until a public, rights-compatible source object/volume path with exact IDs, full coordinate/axis metadata, and a reproducible payload receipt is established.
2. Do not turn publication images, rendered reconstructions, or article-level acquisition pitch into voxel volume, segmentation, internal morphology, same-cell identity, or measurement evidence.
3. Continue expanding mouse interneuron evidence only when source records, denominators, and provenance remain explicit.
