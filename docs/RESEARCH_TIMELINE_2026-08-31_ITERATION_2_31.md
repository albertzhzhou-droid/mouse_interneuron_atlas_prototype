# Research Timeline — 2026-08-31 — Iteration 2.31

> **Version transition:** `2.30.0-research.1` -> `2.31.0-research.1`
> **Recorded at:** 2026-08-31 21:31 EDT
> **Closing validation:** 2026-08-31 21:47 EDT
> **Mode:** in-place localhost research iteration; open/public digital data only
> **Packaging status:** no distributable package and no folder containing a complete project copy were created.

## Outcome

Iteration 2.31 closes the UI-to-knowledge-base gap addressed by `UPG-159` and `UPG-160`. A selected Research Explorer record now has one evidence-bounded visual disposition. Exact morphology focus either activates that exact admitted geometry or routes to the exact source-specific morphology viewer; every non-morphology focus clears the previous morphology. No focus can retain, borrow, infer, average, or substitute another record's geometry.

| Indexed record class | Records | Visual disposition |
|---|---:|---|
| Exact main-scene morphology | 13 | Activate the exact checksum-gated source-local object |
| Exact source-specific viewer-only morphology | 136 | Keep the main scene empty and open the exact morphology viewer |
| Molecular, anatomy, SCI and source-lane records | 264 | Keep the main scene empty; no admitted morphology link exists |
| **Total** | **413** | Every indexed record has exactly one fail-closed disposition |

The morphology denominator remains `142 frozen census + 7 supplementary = 149 viewable source objects`. It is never a 149-record census. This iteration changes indexing, disclosure and state resolution; it adds no specimen, animal, source reconstruction, wet-lab evidence, cross-source identity, atlas transform, registration, or biological internal structure.

## Canonical focus-to-visual-target contract

`app/research-visual-target.js` is the single pure resolver for canonical `focusKind` + `focusId` state.

- The thirteen main-scene records synchronize the exact source record, neuron ID and cell-detail mode.
- The other 136 morphology records resolve to `exact_morphology_available_only_in_source_specific_morphology_viewer`; the exact object remains available in the dedicated viewer, while the main scene renders no morphology.
- The 264 non-morphology records resolve to `focus_has_no_admitted_morphology_link`; molecular similarity, anatomical co-display, SCI condition and source membership cannot manufacture a geometry relationship.
- Invalid or unresolved focus remains unavailable and never falls back to a default neuron.
- When a target becomes inactive, `SceneCanvas` aborts the previous geometry request, disposes the former object, clears the root and publishes an unavailable runtime receipt. A late response cannot restore stale geometry.
- Explicit valid structural-reference camera presets remain independent of morphology identity. They are not evidence of a cell/type/region relationship.
- JSON, CSV and image-export state is emitted only from the currently active morphology target. Inactive or viewer-only focus cannot export the previous record as if it were selected.

The main-scene set remains exactly `NMO 45674`, `45718`, `50394`, `50408`, `50424`, `104003`, `108974`, `109005`, `109021`, `170035`, `242822`, `249676`, and `260150`.

## Research Explorer index and missingness

The deterministic Explorer 1.8.0 index now contains all 149 viewable morphology objects while retaining census membership explicitly.

| Object | Bytes | SHA-256 | Role |
|---|---:|---|---|
| `public/data/research_explorer_index_v1/search-index.json` | 5,293,046 | `5954c2911a196fc14dc033142f3a028c3cc612f5dbce8514e2b8316f42510c54` | 413-record search/dossier index |
| `public/data/research_explorer_index_v1/asset-manifest.json` | 4,290 | `8753a0d579f0b3b0b47227d5d43bce230d5f1338f730a9204626ef77e33a8b33` | Pinned 16-source-file asset receipt |
| `app/research-visual-target.js` | 4,588 | `21d20d86a7c687098f8f909c8b4b9b7737267163a9e4e84aacf15b74b48930a3` | Pure visual-disposition resolver |

The 413 records comprise 161 molecular profiles, 149 morphology records, 73 anatomy labels, 17 SCI populations, seven SCI entities and six source-coverage lanes.

All 3,634 gap rows have the same machine-readable fields: `axisId`, `label`, `status`, `reasonCode`, `scope`, `authority`, `sourceLocator`, `rawValue`, `detail`, and `inferenceAllowed: false`.

| Gap scope | Rows | UI treatment |
|---|---:|---|
| Record-specific | 1,166 | Shown with the selected record |
| Shared dataset limit | 1,433 | Deduplicated and collapsed once per dossier |
| Shared project limit | 1,035 | Deduplicated and collapsed once per dossier |
| **Total** | **3,634** | Missing coverage never becomes biological absence |

Controlled reason-code counts are: `not_measured_by_study` 833, `repository_object_unavailable` 628, `relationship_not_established` 548, `no_admitted_transform` 487, `source_not_reported` 424, `source_schema_no_field` 315, `not_ingested` 285, `not_applicable` 73, and `unresolved_source_conflict` 41. The UI no longer repeats project-wide boilerplate in every record-specific card.

## Morphology record disclosure

`app/MorphologyRecordDisclosure.tsx` provides one shared, complete record disclosure in the single-record and comparison viewers.

- It displays frozen-census versus supplementary membership, preparation protocol, raw section direction and thickness, numeric-age availability, normalized and literal raw shrinkage status, source-coordinate extent, neurite domain, physical integrity, axon/truncation limits and preparation-context conflicts.
- Geometry and raw-SWC byte/hash receipts are visible in full.
- The metric list is complete and count-labelled; it is no longer silently truncated to eight rows.
- Shared comparator-wide scientific boundaries render once instead of repeating in each viewport card.

These fields expose what the source object does and does not contain. They do not authorize inverse shrinkage correction, repaired neurites, complete axons, same-cell physiology, inferred internal structures, shared scale or registration.

## Manifest and immutable-history receipts

| Object | Bytes | SHA-256 |
|---|---:|---|
| `data/research-iteration-manifest-2.31.json` | 87,120 | `49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996` |
| Canonical 2.31 manifest content | — | `c714ba7ac7f306987b0344899c20381eda6a568d57b222773746839c687a0fd4` |
| `tools/build_research_iteration_manifest_2_31.mjs` | 24,011 | `c3bc904f3cc5b88900c76ed06bfa2456a5c573b25d35bdb456dee594a50d5691` |
| `schemas/research-iteration-manifest-2.31.schema.json` | 9,009 | `eff9fb107c9601ac47cdec0a33a4ad0078f291d113901098accdbca9558b3ca6` |
| `scripts/validate-research-iteration-manifest-2.31.mjs` | 17,755 | `56e580ab882d65d51c715f612e33fc7ae0e6c102590879ca7e896a4a1e915f0e` |
| `tests/research-iteration-manifest-2.31.test.mjs` | 9,524 | `b5a15eefd6a66834219f2d684b8a8e4490f8f4f5353f8280c680dc2e0b0b6bba` |

The active 2.31 manifest locks 46 authoritative inputs, 413 records, the exact `13 / 136 / 264` visual disposition, 3,634 inference-forbidden gap rows, 144 upgrade rows and zero fallback geometry, internal primitives, cross-source identities, atlas transforms or registrations.

Parent iteration 2.30 is immutable at 81,964 bytes, file SHA-256 `c8796b7732d2f36998976698f1991f5d70e95fae96b33c20301d4b21d80e5858`, and canonical content SHA-256 `c80407736016bf95e0b4dc9d937126e8955628cef4c2485384df835639c3538f`. Its snapshot validator checks the frozen receipt without rebuilding it against live 2.31 inputs. Iteration 2.29 and earlier manifests remain immutable history.

## Upgrade registry and future-source research

The deterministic registry contains 144 rows spanning `UPG-022`–`UPG-162`; the 329,676-byte registry has SHA-256 `0251483ef56a1869f7abbd4c56c81b514a82fbfea12b4e22fe222ecd06713a7d`.

| Upgrade | Status | Evidence-bounded outcome or next step |
|---|---|---|
| `UPG-159` | Completed | Canonical fail-closed focus-to-visual-target mapping; exact geometry only, stale geometry clearing, zero substitution |
| `UPG-160` | Completed | 413-record Explorer, all 149 viewable morphology objects, controlled missingness and deduplicated record cards |
| `UPG-161` | P1 research watch | Audit the Janelia longitudinal embryonic-zebrafish spinal-cord files for time-dependent 3D centroid tracks, calcium traces, lineage/birth-time fields and marker labels. The SWC-like lineage table is not neurite morphology; zebrafish developmental state cannot be transferred into a mouse interneuron identity. [Dataset](https://janelia.figshare.com/articles/dataset/Longitudinal_functional_imaging_data_for_the_zebrafish_embryonic_spinal_cord/7605824), [primary paper](https://doi.org/10.1016/j.cell.2019.08.039), [analysis code](https://github.com/zqwei/Zebrafish_spinal_cord_development) |
| `UPG-162` | P1 research watch | Keep the separate Janelia laser-ablation calcium dataset as a zebrafish lesion-functional lane only. Transverse lesion context is not mammalian SCI; co-activity is neither a synapse nor causal connectivity. [Dataset](https://doi.org/10.25378/janelia.7607411) |

The longitudinal dataset is licensed CC BY-NC 4.0 at the source, so any future bundling must pass file-level reuse and attribution review. Neither research-watch row changes the current model or fills a mouse morphology/internal-structure gap.

## Validation evidence at the documentation checkpoint

The following checks were completed from the current working tree on 2026-08-31 EDT:

- Research Explorer focused tests: **20/20 passed**; standalone validator and deterministic rebuild comparison passed.
- Current 2.31 manifest focused tests: **11/11 passed**; deterministic builder and standalone validator passed.
- Combined manifest/Explorer/upgrade checks: **32/32 passed**.
- Immutable 2.30 snapshot tests: **6/6 passed**; immutable 2.29 validation passed.
- Upgrade registry builder check and standalone validator passed at 144 rows.
- Combined focus-target, rendered-HTML, main-scene integration, morphology disclosure/comparison, Explorer, 2.31 manifest and immutable-2.30 suite: **93/93 passed**.
- Current research runner: **515 tests; 513 passed, 0 failed, 2 intentionally skipped** across 90 current test files.
- Full `npm test`: **passed** with the same **515 / 513 / 0 / 2** result after build, lint and all scientific/data/schema/source/asset validators.
- Full ESLint: **passed** with no lint warnings or errors.
- Production build: **passed**. Non-failing toolchain notices were Node `DEP0205`, Vite chunks above 500 kB and Vinext static-route-classification uncertainty; these did not change scientific assets or test outcomes.
- `git diff --check`: **passed**.

A passing localhost iteration still does not authorize a distributable package or complete-project copy.

## Browser and visual QA

Playwright exercised the production build at 1440 × 1000 and 390 × 844 viewport sizes.

- Default SCI focus showed `focus_has_no_admitted_morphology_link`, a disabled morphology layer, no selected NMO option, zero morphology primitives and no fallback.
- Selecting `NMO 109005` and then `NMO 109021` through the main-scene control changed the canonical URL, selected ID, visible cell label and geometry receipt from `f8bb6079614e20e376a2e4ae51a6eb2f574e63e73d38dbebe98854ec84cdcecb` to `6212fd3b78ad3e7ef054b656ab9cf080f57360db710eedb767c55c493036563f`; the prior label disappeared and runtime bytes were verified.
- Direct `NMO 109006` focus left the main-scene selector empty, rendered no fallback and displayed `exact_morphology_available_only_in_source_specific_morphology_viewer` while retaining the exact source-specific record card.
- `NMO 194468` in comparator slot A displayed `2D source XY plane; z depth unavailable. Rotation is locked`, the exact `1,607.77 × 3,560.14 µm` source extent and two complete 64-character geometry/SWC hashes.
- Molecular `DE-1` focus cleared morphology. Its dossier showed one record-specific gap, seven shared dataset/project limits in one closed disclosure and one shared project-boundary banner.
- An explicit `internal_reference` URL with exact `NMO 109005` focus preserved the independent camera mode and its zero-biological-primitive boundary.
- Final browser console: **0 errors, 0 warnings**.
- Desktop screenshot: `output/playwright/iteration-2.31-focus-visual-target.png`.
- Mobile screenshot: `output/playwright/iteration-2.31-focus-visual-target-mobile.png`.

## Scientific boundaries

Iteration 2.31 admits exact source-object selection and explicit missingness. It does not admit:

- a complete interneuron census, a representative/average cell, population prevalence or animal denominator;
- a morphology for a molecular profile, SCI population, anatomy label or source lane without an admitted exact record relationship;
- a main-scene substitute for a source-specific viewer-only morphology;
- a shared coordinate frame, shared scale, anatomical orientation, atlas placement, transform or `REG`;
- repaired branches, completed axons, inferred z, inverse shrinkage correction or restored in-vivo dimensions;
- same-cell molecular/physiology/connectivity joins, synaptic causality, membrane, nucleus, organelle, receptor or ultrastructure geometry;
- mouse identity or mammalian SCI conclusions transferred from zebrafish developmental or lesion datasets.

## Surgical rollback

Rollback must preserve unrelated work in the dirty worktree. Do not use broad reset, clean, checkout or recursive deletion commands.

1. Revert only `app/research-visual-target.js`, its focused test and the 2.31 target-state wiring in `app/AtlasPrototype.tsx` and `app/SceneCanvas.tsx`. Preserve every underlying source geometry and route contract.
2. Revert only the 2.31 Explorer index-builder additions for the seven supplementary records and structured gap fields, then rebuild and validate the index. Do not modify the frozen 142-record census or delete supplementary source objects.
3. Revert only `app/MorphologyRecordDisclosure.tsx` and its integrations in the morphology viewer/comparator; preserve all source-frame, analysis and geometry assets.
4. Revert only the 2.31 reason-coded/collapsed gap presentation and focused tests. Do not silently erase missingness or convert it to absence.
5. Move aside only the exact 2.31 manifest builder/data/schema/validator/test after verifying their paths, and repoint the active manifest route to the immutable 2.30 snapshot. Never rebuild or rewrite the 2.30 manifest.
6. Restore `UPG-159` and `UPG-160` to their earlier states and remove only `UPG-161`–`UPG-162` if rolling back the complete registry delta, then deterministically rebuild the registry. Preserve every earlier upgrade row.
7. Restore only affected package/application labels, README text and this timeline. Preserve unrelated or concurrent changes.
8. Re-run focus-state, Explorer, morphology disclosure, immutable-manifest, build, lint, regression and browser gates. Verify zero fallback geometry, zero invented internals, zero cross-source identities and zero registrations.

This rollback list identifies only the 2.31 increment. It does not authorize deletion or overwriting of unrelated project files, and iteration 2.31 created neither a full project copy nor a distributable package.
