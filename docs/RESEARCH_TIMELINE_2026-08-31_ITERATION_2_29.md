# Research Timeline — 2026-08-31 — Iteration 2.29

> **Version transition:** `2.28.0-research.1` -> `2.29.0-research.1`
> **Recorded at:** 2026-08-31 19:52 EDT
> **Mode:** in-place localhost research iteration; open/public digital data only
> **Packaging status:** no distributable package and no folder containing a complete project copy were created.

## Outcome and selection decision

Iteration 2.29 completes `UPG-149`: the research comparator now exposes seven already admitted, checksum-pinned supplementary NeuroMorpho route objects beside the immutable 142-record census.

| Collection | Records | Meaning |
|---|---:|---|
| Frozen census | 142 | Unchanged adult-query census from iteration 2.28 |
| Supplementary routes | 7 | Exact route-local objects outside the census |
| Viewable source objects | 149 | `142 + 7`; **never a 149-record census** |

The exact supplementary roster is `NMO_45674`, `NMO_45718`, `NMO_50394`, `NMO_50408`, `NMO_50424`, `NMO_170035`, and `NMO_249676`.

`UPG-149` was selected instead of `UPG-144` because it could immediately turn seven existing checksum-gated 3D source objects into a useful comparison surface without inventing new evidence. The Allen Tac2 `UPG-144` audit remains a separate exact-2D candidate with unresolved section-thickness and plane conflicts, zero deposited alignment objects, and no justified 2D-to-3D promotion.

The following iteration-2.28 denominators remain unchanged: 13 active unique main-scene morphologies, 10 named spinal routes, 9 evidence states / 16 representation routes, 24 canonical source packages / 28 record sets / 7 exact rosters, zero DAT semantic admissions, and zero registrations.

## Exact adapter and delta receipts

| Object | Bytes | SHA-256 | Role |
|---|---:|---|---|
| Supplementary comparison adapter | 42,808 | `f487034457ec2187996f0d3db8935545e64d1ce6783391b668c0747bdf2d5e05` | Seven records, explicit census-versus-supplementary membership, four route-source receipt records, geometry references, missingness, and scientific boundaries |
| Supplementary analysis delta | 34,013 | `b2f90156d9e9eb86cc2dfc72f05a140c6942c802a492274472c86a0c7a29d0df` | Seven source-local record analyses; no cross-record aggregate |
| Public delta asset manifest | 3,619 | `ab7b2a8fbc458e0871a39819e88007ffe3ad84f6378f87a2a24015484028db6f` | Exact payload declaration and source receipts |
| Combined adapter schema | 24,130 | `50b79761fb881468d077a4f18c215fe544601789195c7ffe22e4d74bfeeeace0` | Fail-closed schema for adapter membership, records, provenance, and missingness |

The public delta directory `public/data/supplementary_morphology_comparison_v1/` contains exactly two regular files:

1. `analysis-delta.json` — 34,013 bytes
2. `asset-manifest.json` — 3,619 bytes

It contains zero copied geometry files, zero copied SWCs, zero full-content copies, and zero registrations. Every supplementary geometry path points back to its existing exact route pack; the adapter verifies the corresponding contract and asset-manifest receipts. Duplicate neuron IDs, duplicate geometry paths, receipt mismatches, unsupported padding, and analysis-to-geometry mismatches fail closed.

## Comparator and information-surface changes

- The 3D comparator now accepts two to four records from the combined selectable layer while leaving the individual browser, 142-record matrix, and cohort analysis census-only.
- Search supports ID, source label, archive, and region. The collection filter separates frozen-census and supplementary-route objects; filtering never changes membership.
- Cards explicitly label `FROZEN CENSUS` or `SUPPLEMENTARY ROUTE`, retain route provenance, and disclose source frame, physical-integrity wording, and the absence of complete-biological-axon authority.
- Mixed census/supplementary selections persist in `morphologyCompare` URL state. Initial load, updates, and browser `popstate` restoration normalize against the currently available combined roster, so a supplementary failure cannot corrupt the frozen census route.
- Relative census geometry paths and absolute route-pack geometry paths share one loader. Bytes, SHA-256, object identity, topology status, and segment count are checked before rendering.
- JSON and CSV exports include collection contributions and route-contract / route-manifest receipts. Export stays locked until every selected geometry passes its runtime byte/checksum/identity gate and every selected analysis record has a verified source-geometry receipt.
- Declared release membership is shown separately from runtime availability: `149 declared = 142 frozen census + 7 supplementary`, while the runtime line reports the actually indexed census and supplementary counts plus both verification states. The comparator tab likewise reports the runtime indexed count rather than implying that unavailable records loaded successfully.
- Audit fixes replaced stale overview/library counts with 10 named routes and 7 supplementary objects, and aligned the Research Overview, Data Lab, route library, rendered HTML, and comparator language with the same denominator policy.
- Independent source-local cameras continue to auto-fit each object. Apparent card size is not a common physical scale or registration.

## Scientific boundaries

Iteration 2.29 admits source-object co-display and descriptive record-level metrics only. It does not admit:

- a 149-record census, synthetic padding, or a new animal/donor/specimen/prevalence denominator;
- common scale, common orientation, a shared coordinate frame, atlas placement, transform, or `REG`;
- same-cell identity, cross-source identity, representative archetype, molecular equivalence, or same-type identity;
- a complete biological axon, repaired truncation, projection, connectivity, contact, bouton, or synapse claim;
- membrane, nucleus, organelle, receptor, ultrastructure, or any other same-specimen internal model.

Counts remain zero for geometry copies, SWC copies, padding records, common-scale admissions, common-orientation admissions, atlas placements, atlas transforms, complete-axon claims, same-specimen internal structures, rendered internal primitives, cross-source identities, and registrations. Source physical-integrity labels and source-authorized radii are retained literally and are not promoted beyond their deposited scope.

## Upgrade registry and future research

The deterministic upgrade registry now contains 136 rows spanning `UPG-022`–`UPG-154`. `UPG-149` is completed; the new research queue is:

| Upgrade | Status | Evidence-bounded next step |
|---|---|---|
| `UPG-150` | Planned | Add per-source-type morphology summaries while keeping deposited axon, dendrite, apical, and uninterpreted SWC codes separate; missing types remain unavailable, not zero-filled biology |
| `UPG-151` | Planned | Add a viewport-local µm scale and preparation/truncation card without implying shared scale, orientation, restored in-vivo dimensions, repaired neurites, or registration |
| `UPG-152` | Rights-gated | Evaluate the exact adult-mouse spinal MERFISH Zenodo objects as section-local spatial information; no invented z, neurites, membranes, or synapses, and no file bundling without affirmative object-level rights |
| `UPG-153` | Research watch | Evaluate CAP dataset 1410 as a source-local cross-species taxonomy lane while preserving the macaque-species and hierarchy-count conflicts and requiring an affirmative object licence |
| `UPG-154` | Planned, trace-only | Stream a pinned representative NWB trace from immutable DANDI `001469/0.250611.1844`; extracellular activity is not an identified interneuron, morphology, synapse, motor output, or atlas coordinate |

`UPG-144` remains deferred as an exact-2D Allen contract and is not used to fill any 3D or internal-structure gap.

## Manifest and immutable-history receipts

- Research iteration manifest `2.29`: 38 authoritative inputs; 77,136 bytes; file SHA-256 `8856ad6413fae98f5f6f9d13cbb0627c8b41b8a9dbaa04ebd9a232689edaeba5`; canonical content SHA-256 `069b1be3a37a8086f89ea4467503235ed0734afcbfd2974538bae528c4995982`.
- Upgrade registry: 136 rows, `UPG-022`–`UPG-154`; 300,846 bytes; SHA-256 `a0f1abf0c471f5bd10cdd01e022f3280bcd81515a7a6880eb77fe9c342bd8988`.
- Parent iteration `2.28` remains immutable at 34 inputs, 69,092 bytes, file SHA-256 `f599acbd6969ba082014b258c098e648014116dc736535265bc7d5c154110b8e`, and content SHA-256 `af376ba79d00132582448ab7217ca03c2e4af18efc5f0ca9720acef231f9b173`.
- The active historical-validation route uses `scripts/validate-research-iteration-manifest-2.28-snapshot.mjs`. It verifies the frozen 2.28 file/content receipts, parent receipt, immutable inputs, route assets, denominators, and zero-claim boundaries without rebuilding 2.28 against mutable 2.29 registry, rights-ledger, or package-lock files.
- The former live-input deterministic 2.28 validator remains separately callable for forensic use but is not the active historical gate.

## Validation status

Closing validation completed on 2026-08-31 EDT:

- Focused iteration-2.29 tests: **29/29 passed**.
- Rendered-HTML tests: **34/34 passed**.
- Production build: **passed**.
- Current 2.29 manifest builder `--check`, strict schema/semantic validation, 38-input receipt verification, deterministic byte-for-byte materialization, and mutation rejection: **passed**.
- Immutable 2.28 snapshot validation route: **passed**.
- Full `npm test`: **462 total / 460 passed / 0 failed / 2 explicitly skipped**. The command completed the production build, full ESLint pass, all scientific/data/manifest validators, and the current working-tree regression suite. The build emitted only the non-failing Vite chunk-size advisory.
- Production-browser QA at a mixed `NMO 45674` supplementary + `NMO 109005` census URL confirmed exact two-record restoration rather than four-record padding. The UI reported `149 declared = 142 frozen census + 7 supplementary` separately from the verified runtime index `142 + 7 = 149`.
- The supplementary collection filter returned exactly seven selectable records. Adding `NMO 45718`, switching its source-authorized radius derivative, removing it, re-adding it, and reloading preserved the exact three-record selection and restored the re-added viewport to observed centerlines.
- All three selected geometries reported bytes verified before rendering. The JSON export unlocked only after those runtime receipts were present and recorded census/supplementary membership, route receipts, analysis-asset SHA-256 values, source-geometry SHA-256 values, and `verified_before_export` for every object.
- Browser console inspection reported zero errors and zero warnings; every comparator manifest, analysis, census, and selected geometry request returned HTTP 200.
- Visual inspection found no comparator overlap, clipping, or unreadable controls at 1440 × 1100. The evidence-boundary matrix retained `UNAVAILABLE` for membrane, nucleus, organelles, boutons, receptors, partners, and atlas placement. The capture is `output/playwright/iteration-2.29-comparator.png`.

These results do not authorize a distributable package or complete-project copy.

## Surgical rollback

Rollback must preserve unrelated work in the dirty worktree. Do not use broad reset, clean, checkout, or recursive deletion commands.

1. Disable only the supplementary adapter import and analysis-delta loader, then restore comparator selection normalization to the frozen 142-record census.
2. Revert only the 2.29 comparator membership labels, collection/search filter, declared-versus-runtime denominator panel, mixed URL-state handling, route provenance, geometry-gated export authority, and associated styles/tests. Keep the pre-existing 2.28 census, route packs, and geometry assets intact.
3. After verifying the exact two-file inventory, move aside only `public/data/supplementary_morphology_comparison_v1/` as one recoverable delta. Remove only the supplementary adapter builder/data/schema/validator/test files; do not remove any referenced route-pack geometry or SWC.
4. Remove only the 2.29 manifest builder, manifest, schema, validator, and test. Repoint the active manifest command to the immutable 2.28 snapshot route; never rebuild or rewrite the historical 2.28 JSON.
5. Restore the upgrade queue and registry to the 2.28 state: `UPG-149` returns to planned, `UPG-150`–`UPG-154` are removed from the active registry, and the historical total returns to 131 rows without changing earlier rows.
6. Restore only affected version labels, README/rights/timeline references, current package scripts, and application copy. Preserve unrelated or concurrent changes.
7. Re-run focused adapter/comparator, rendered HTML, current/historical manifest, build, lint, and full-test gates. Verify the rollback state still has census 142, 13 unique main-scene morphologies, 10 named routes, 9 states / 16 representation routes, and zero DAT semantics, complete-axon claims, internals, identities, and registrations.

This rollback list identifies only the 2.29 increment. It does not authorize deletion or overwriting of unrelated project files, and iteration 2.29 created neither a full project copy nor a distributable package.
