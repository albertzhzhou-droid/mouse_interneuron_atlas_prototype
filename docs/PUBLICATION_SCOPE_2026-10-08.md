# Public handoff · 2026-10-08

Repository: https://github.com/albertzhzhou-droid/mouse_interneuron_atlas_prototype

This handoff freezes the current 2.91 research implementation, including the upgraded homepage, grouped SiteNavigation/sidebar, independent routes, Breadcrumb and light reading layout. Further upgrade development is paused at the user's request. The complete remaining queue is in [PENDING_UPDATES_2026-10-08.md](PENDING_UPDATES_2026-10-08.md): 83 of 243 rows are exactly `completed`; 160 retain their existing statuses. Repository publication does not complete the scientific goals.

I68 uses a native GET attachment route for Study facts. The full engineering run passed 1,615 tests, with 15 existing conditional skips and no failures/cancellations, plus build, strict type checking, lint and required validators. The 26 targeted checks passed. The actual native browser download did not produce an accepted new saved file; UPG-173 remains in progress. Original execution receipts and finite integration checkpoints are retained under `docs/qa/2026-10-07-implementation-68/`.

## Public contents and local originals

All 9,730 originally cloud-only repository files were restored and reviewed before publication. Code, admitted data/derivatives, source attribution, receipts, plans, tests and reviewed QA records are included. Existing dependency/build-output and source-original exclusions remain in `.gitignore`.

The additional exact paths below remain local and are excluded from this public handoff. Their source receipts, original checksums and gates remain unchanged:

- `data/source-candidates/russ-geo-original-audit-20261005/GSE158380_cells.csv.gz`
- `data/source-candidates/russ-geo-original-audit-20261005/GSE158380_features.updated-11-22-2022.csv.gz`
- `data/source-candidates/svara-supplements-20261002/publisher-supplement-policy.html`
- `data/source-candidates/mccreedy-v2a-20261002/publisher.html.txt`
- `docs/qa/2026-10-05-implementation-63/accepted-i63-owned-and-layout-checkpoint.zip`
- `docs/qa/2026-10-07-implementation-64/exact-accepted-i63-checkpoint.zip`
- `docs/qa/2026-10-07-implementation-64/accepted-i64-owned-and-layout-checkpoint.zip`

The two Russ GEO gzip originals retain the recorded `redistributionRightsCleared: false` gate. The three listed QA ZIPs contain those same originals. The two raw publisher HTML captures contain unrelated public vendor frontend configuration; source-derived facts, links, hashes and attribution remain published. No source rights gate was promoted to cleared. `.openai/hosting.json` remains local workspace configuration and is absent from the current public tree.

## Reproduction boundary

Install the pinned dependencies with `npm ci` using Node >=22.13, then use `npm run dev` or `npm run build`. Website runtime assets remain bundled and checksum-gated. The public file snapshot successfully built without held originals or `.openai/hosting.json` at UTC 2026-10-09T00:55:43.316273–00:55:56.347829; strict type checking and lint also passed after making the local hosting configuration optional. The first failed build is retained alongside the successful second attempt. Full historical source-preservation checks and the complete research manifest validator additionally require exact locally retained source originals and the ignored frozen 2.8 curator release assets listed in their receipts; a public clone alone is not claimed to satisfy those archival byte checks. Do not replace a missing original with a changed current web page or weaken its checksum/rights gate.

The machine-readable publication review is [PUBLICATION_REVIEW.json](qa/2026-10-08-publication/PUBLICATION_REVIEW.json). Actual publication is established by the repository's public visibility and remote branch commit, verified after the push. Local checks do not establish a hosted website deployment.
