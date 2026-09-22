# Research Timeline — 2026-08-31 — Iteration 2.28

> **Version transition:** `2.27.0-research.1` -> `2.28.0-research.1`
> **Recorded at:** 2026-08-31 18:38 EDT
> **Mode:** in-place localhost research iteration; open/public digital data only
> **Packaging status:** no distributable package was created, and no folder containing a complete project copy was created.

## Outcome

Iteration 2.28 admits one exact NeuroMorpho.Org release `8.6.124` source object as an independent ventral-horn comparison route:

- Route: `mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718`
- Source object: `NMO_45718`, neuron name `101026p1-A-In`, Bannatyne archive
- Scope: one P9 mouse L5 ventral-horn reconstruction in the NeuroMorpho standardized source-local frame
- Source labels retained literally: `Calbindin (CB)-negative`, `glycinergic`, `pre-motor`, `non-renshaw`, and `interneuron`

This is one individual source-local reconstruction. It is not an average, archetype, complete cell, independently verified molecular/functional class, atlas-registered object, exact physiology record, internal-structure model, or morphology-to-transcriptomic identity.

| Denominator | 2.27 | 2.28 | Interpretation |
|---|---:|---:|---|
| Active unique main-scene morphologies | 12 | 13 | One non-overlapping source object appended by exact `neuronId=45718` |
| Named observed-morphology routes | 9 | 10 | Eight dorsal-horn routes and two ventral-horn routes |
| Named dorsal / ventral routes | 8 / 1 | 8 / 2 | One ventral comparison route appended; dorsal count unchanged |
| Frozen adult-query census | 142 | 142 | No census expansion or rewrite |
| Representation states / routes | 9 / 15 | 9 / 16 | One exact route-authority binding added; no representation state invented |
| Canonical source packages / record sets | 24 / 27 | 24 / 28 | One NeuroMorpho record set added under the existing source package |
| Bundled exact rosters | 6 | 7 | One exact, checksum-pinned single-object roster added |
| Research-manifest authoritative inputs | 30 | 34 | Deterministically rebuilt, schema-validated, and checksum-locked in the current 2.28 manifest |
| Durable upgrade rows | 130 (`UPG-022`–`UPG-148`) | 131 (`UPG-022`–`UPG-149`) | UPG-149 was added as a separate supplementary-comparison follow-on |
| Native DAT semantic objects | 0 | 0 | DAT is a checksum-pinned provenance object only |
| Exact same-cell physiology joins | 0 | 0 | The paper exposes no exact NMO-ID or filename crosswalk |
| Same-specimen internal structures / rendered internal primitives | 0 / 0 | 0 / 0 | Missing object-level evidence creates no substitute geometry |
| Cross-source identities / project registrations | 0 / 0 | 0 / 0 | Co-display and shared wording create neither identity nor placement |

## Exact `NMO_45718` route and receipts

### Source record

- Repository: NeuroMorpho.Org, release `8.6.124`, `RRID:SCR_002145`
- Official record: [101026p1-A-In](https://neuromorpho.org/neuron_info.jsp?neuron_name=101026p1-A-In)
- Official metadata API: [NMO 45718](https://neuromorpho.org/api/neuron/id/45718)
- Official morphometry API: [NMO 45718 morphometry](https://neuromorpho.org/api/morphometry/id/45718)
- Standardized SWC: [101026p1-A-In.CNG.swc](https://neuromorpho.org/dableFiles/bannatyne/CNG%20version/101026p1-A-In.CNG.swc)
- Source-native DAT: [101026p1-A-In.dat](https://neuromorpho.org/dableFiles/bannatyne/Source-Version/101026p1-A-In.dat)
- Primary paper: [Bhumbra et al. 2014](https://doi.org/10.1523/JNEUROSCI.0199-14.2014), PMID `25232126`
- Rights: [NeuroMorpho.Org Terms of Use](https://neuromorpho.org/useterm.jsp), CC BY 4.0 subject to repository and original-paper attribution

The source record retains mouse, young, P9, `GlyT2-EGFP`, cohort-valued `Male/Female`, no reported weight, control, in vitro, biocytin, Neurolucida, `Dendrites, Soma, Axon`, source diameter/3D/angle attributes, and `Dendrites & Axon Moderate`. `Male/Female` is not an individual-sex assignment, and missing weight is not imputed.

### File receipts

| Object | Bytes | SHA-256 | Admission role |
|---|---:|---|---|
| Official API snapshot | 1,513 | `ac769a76e959d093a0468d345356256627b0ccd5536334f7b943734521b55407` | Repository metadata receipt |
| Official morphometry snapshot | 473 | `d999e37d9b94650415fd50e795ff0b43af24045e95a87c43c1b5e2ee57dda38a` | Repository PCA-morphometry receipt |
| Standardized SWC | 214,337 | `c8926708a1350c58124c47ebee8167820b8e0bd568bcb676e90e34f3ca6dfaee` | Observed source-local centerlines and radii |
| Source-native Neurolucida DAT | 343,774 | `ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415` | Unparsed, unrendered provenance bytes only |
| Deterministic lazy geometry | 615,468 | `c5193dbca4f17bb945a034196dd7dee130096502c71e01b6e5aedacfcade8865` | Browser-loading derivative traceable to the SWC |
| Five-asset manifest | 1,647 | `0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8` | Inventory, bytes, checksums, release, and rights receipt |

The route-pack contract is 19,112 bytes with SHA-256 `39afe0acc449c367cd48776b150058982c8d57186ea9adbeb9314b08d62b2cb3`.

### Geometry, topology, and soma standardization

- Exact geometry: 5,636 nodes / 5,635 segments; source-type counts `1=8`, `2=4,237`, `3=1,391`
- Topology validation: connected, acyclic, single-root, and zero zero-length edges
- Canonical-geometry SHA-256: `08514c7c924c2b1ff444eb45f43e89ab1633bce64dc1618be148617e80de52a3`
- Topology SHA-256: `7fb6e4ed99208c66fa323a297bd85c800f3cbbe340baafcf7f0312832dda5af9`
- Raw SWC bounds: minimum `[-436.01, -264.19, -200]`, maximum `[251.84, 289.81, 28]`; extent `[687.85, 554, 228]` µm
- Source radii: minimum `0.05`, maximum `8.5894`, mean approximately `0.2467619411` µm
- Official morphometry: width `583.793`, height `482.994`, depth `212`, length `8518.26` µm. Width/height/depth are 95% principal-component extents, not raw SWC bounds, anatomical axes, tissue thickness, or `REG`.
- Soma receipt: the standardized-SWC header reports eight original soma contours averaged into eight type-1 soma points (`8 -> 8`). Native contour vertices are unavailable; the eight points are not an observed membrane, nucleus, contour reconstruction, or volumetric soma segmentation.

### Preparation, shrinkage, and label limits

- Repository slicing fields are horizontal / 50 µm. The paper separately describes 400 µm transverse L5 recording slices followed by 50 µm serial resectioning. Because neither `NMO_45718` nor `101026p1-A-In` appears as a paper crosswalk, these fields remain distinct preparation stages and are not interpreted as one 50 µm source slab.
- The repository says shrinkage was reported and not corrected but provides no numeric reported/corrected values. Source coordinates are therefore not shrinkage-restored in-vivo dimensions.
- The repository labels are retained as source metadata only. The paper notes possible calbindin washout and states that non-Renshaw glycinergic cells are not necessarily premotor; neither caution is assignable to this exact object without a stable key, but both prevent definitive molecular absence, premotor identity, or Renshaw-exclusion claims.
- Moderate dendrite-and-axon integrity admits the deposited centerlines but not a complete axon, complete projection, or whole-cell arbor.
- Source radii authorize only a labelled deterministic display derivative, not an observed membrane, segmentation, or independent measurement.
- The DAT file is Neurolucida V3 binary with zero admitted semantic objects and zero rendered primitives. It does not add boutons, contacts, synapses, or internal structures.
- No exact physiology, connectivity, contact count, projection, per-cell genotype, molecular assay, membrane, nucleus, organelle, receptor map, atlas placement, cross-source identity, or `REG` is admitted.

## Delta-only asset inventory — exactly six files

The only new data directory is `public/data/premotor_comparison_observed_morphology_route_pack_v1/`. It is a route-specific delta, not a project copy. Its five declared assets plus its manifest total exactly six regular files and exactly 1,177,212 bytes.

1. `api/nmo-45718.json` — 1,513 bytes
2. `asset-manifest.json` — 1,647 bytes
3. `geometry/nmo-45718.json` — 615,468 bytes
4. `morphometry/nmo-45718-morphometry.json` — 473 bytes
5. `original/nmo-45718.dat` — 343,774 bytes
6. `swc/nmo-45718.swc` — 214,337 bytes

No article PDF, article text, article figure, microscopy panel, Allen Tac2 image, complete project copy, or distributable package was added.

## Representation and source-registry changes

- Evidence-aware representation contract `0.5` retains nine states and extends the immutable `0.4` base from 15 to 16 routes.
- `NMO_45718` may render its verified standardized SWC and an explicitly labelled source-radius derivative. Same-specimen internals remain `UNAVAILABLE` with zero primitives.
- Runtime objects retain the route ID, exact source frame, release, contract/asset checksums, topology, radius authority, moderate/incomplete axon status, label limits, preparation conflict, shrinkage status, `8 -> 8` soma receipt, zero identity joins, and zero registration.
- The source registry remains at 24 canonical packages and advances from 27 to 28 record sets and from six to seven bundled exact rosters.
- The frozen 142-record adult-query census remains unchanged. `NMO_45718` is one supplementary route, not census member 143.

## UPG-143–148 selection table

| Upgrade | Iteration-2.28 decision | Gate retained |
|---|---|---|
| `UPG-143` | **Selected and completed** | Admit only exact `NMO_45718`; repository labels, paper context, preparation stages, shrinkage, DAT semantics, physiology, internals, identity, and registration remain bounded as above |
| `UPG-144` | **Deferred to iteration 2.29** | Build a separate exact-2D Allen contract only after per-object receipts and explicit thickness/plane conflict handling; no 2D-to-3D or cross-age promotion |
| `UPG-145` | Planned | Rat `NMO_34024` remains a rat source-local comparative route; exact API/morphometry/topology/manifest/rights gates still pending and no mouse mapping or registration is allowed |
| `UPG-146` | Research watch | Adult-human `GSE243077` family remains link-only pending affirmative file-level rights and stable donor/sample/library/barcode keys |
| `UPG-147` | Research watch | ModelDB `267056` remains synthetic `SYN`/`SCH`, metadata/link-only pending an explicit code licence |
| `UPG-148` | Research watch | Rhesus intact/SCI data remain cross-species, condition-bounded, file-level-rights-gated context with no mouse identity or causal-recovery promotion |

`UPG-149` is recorded separately as a P0 supplementary-route comparison adapter. It must preserve the exact arithmetic `142 census + 7 supplementary`, never relabel the frozen census as 149, and retain independent source-local auto-fit frames with `co_display_only`, zero common-scale/orientation authority, zero identity, and zero `REG`.

## Deferred Allen Tac2 exact-2D audit (`UPG-144`)

### Exact public objects

The audited target is Allen Mouse Spinal Cord `productId=13`, Tac2 `geneId=21095` / Entrez `21334`, probe `79692549`:

| Age | SectionDataSet | Specimen / donor | Images |
|---|---:|---|---:|
| P4 | [`100003847`](https://api.brain-map.org/api/v2/data/SectionDataSet/100003847.json) | `451` / `91` | 13 |
| P4 | [`100036203`](https://api.brain-map.org/api/v2/data/SectionDataSet/100036203.json) | `3686` / `1064` | 13 |
| P56 | [`100003848`](https://api.brain-map.org/api/v2/data/SectionDataSet/100003848.json) | `356` / `72` | 16 |
| P56 | [`100036202`](https://api.brain-map.org/api/v2/data/SectionDataSet/100036202.json) | `2905` / `783` | 16 |

All four API records are male C57BL/6J and report `0.99 µm/pixel`. Together they enumerate exactly 58 SectionImages: 57 source-labelled `expression=true` and one `expression=false` (`SectionImage 100061412`); zero images are marked failed.

The future retrieval route is source-linked through the exact SectionDataSet APIs and Allen's [official image-download service documentation](https://brain-map.org/support/tutorials/downloading-an-image). No image, expression mask, or derived Allen pixel object is bundled in 2.28.

### Why the adapter is deferred

- Thickness conflict: the exact APIs report `section_thickness=25.0` µm, while the [Allen production overview](https://mousespinal.brain-map.org/spinal/common/content/Overview.pdf) reports 20 µm sections.
- Plane conflict: the APIs report plane `variable`; production documentation describes coronal/cross-sectional tissue, and the P4 primary-study description uses transverse sections. Normalized plane and physical z spacing therefore remain unavailable.
- Registration limit: all four data sets have `reference_space_id=null` and `alignment3d=null`; all 58 SectionImages have `alignment2d=null`. The audit produces `0 REG`, zero cross-age transforms, and no serial-section volume.
- Spatial limit: P4 exposes generic `SPINAL COLUMN`; P56 uses broad cervical/thoracic/lumbar/sacral categories. These do not supply an exact shared segment or cell coordinate.
- Semantic limit: sections, signal pixels, expression masks, and image-level `expression` flags are not cells, cell counts, somata, morphology, internal structure, or Tac2 interneuron instances. Colorimetric ISH intensity is not promoted to a quantitative cross-age trajectory.
- Age limit: co-mounted or viewer-synchronized material does not establish same-cell identity, age registration, developmental lineage, or quantitative P4-to-P56 change.
- Geometry limit: no stacking, interpolation, extrusion, inferred z, 3D cell, atlas placement, NeuroMorpho join, membrane, physiology, connectivity, or synapse claim is permitted.
- Rights limit: Allen content is governed by [Allen Terms of Use](https://alleninstitute.org/terms-of-use/), a custom research/noncommercial attribution framework rather than CC BY. No Allen pixels or masks are bundled in 2.28; commercial redistribution requires permission, and Allen names/marks must not imply endorsement.

The 2.29 contract must retain each SectionDataSet and SectionImage as a source-local 2D object, pin retrieval-time bytes/SHA-256 for every admitted API/image/mask object, preserve both source conflicts without silent normalization, keep image index distinct from tissue index, and fail closed to `0 REG`.

## Implementation and documentation surface

Iteration-2.28 implementation paths include the premotor-comparison builder/contract/schema/validator/test, the six-file public asset directory, representation-contract `0.5` builder/contract/schema/validator/test, runtime route bindings, source/upgrade registries and validators, current-manifest `2.28` build/validation chain, package release labels, focused runtime/SSR tests, README, rights ledger, and this timeline. These implementation files are not counted in the exact six-file public-data delta.

The current documentation task changed only:

- `README.md`
- `docs/RIGHTS_LEDGER.csv`
- `docs/RESEARCH_TIMELINE_2026-08-31_ITERATION_2_28.md`

No queue, upgrade registry, source registry, package file, application file, test, schema, data contract, manifest, or asset was edited by this documentation task.

## Deterministic receipts

- Premotor-comparison route-pack contract: 19,112 bytes; SHA-256 `39afe0acc449c367cd48776b150058982c8d57186ea9adbeb9314b08d62b2cb3`.
- Premotor-comparison five-asset manifest: 1,647 bytes; SHA-256 `0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8`.
- Exact public asset delta: six files; 1,177,212 bytes.
- Representation contract `0.5`: 23,381 bytes; SHA-256 `94085465117e4cbc70763ea78f931cfb17d3f99c5dc907a3fe4556ef1063dbed`.
- Research source registry: 24 canonical packages / 28 record sets / seven bundled exact rosters; 91,645 bytes; SHA-256 `3ad472e12ed0f5136dd7f07396812db6bc54c53d2d7fcda92a57b7859754c0e7`.
- Research upgrade registry: 131 rows spanning `UPG-022`–`UPG-149`; 280,641 bytes; SHA-256 `fd0a302f7808fc65d43a3668c3a23386adfb13c9177b90edefe61b250528a404`.
- Research iteration manifest `2.28`: 34 authoritative inputs; 69,092 bytes; file SHA-256 `f599acbd6969ba082014b258c098e648014116dc736535265bc7d5c154110b8e`; canonical manifest-content SHA-256 `af376ba79d00132582448ab7217ca03c2e4af18efc5f0ca9720acef231f9b173`.
- Immutable manifest `2.27` remains historical and must not be rebuilt against mutable 2.28 inputs.

## Validation receipt

Focused validation completed on 2026-08-31 EDT:

- Premotor-comparison route-pack validator passed at one route, 13 unique main-scene forms, zero DAT semantics, zero exact physiology joins, zero internal primitives, and zero `REG`; its focused tests passed 5/5.
- Evidence-aware representation-contract `0.5` validator passed at nine states / sixteen routes, zero DAT semantics, zero exact physiology joins, zero internal primitives, zero cross-source identities, and zero `REG`; its focused tests passed 4/4.
- Source-registry validator passed at 24 canonical sources / 28 record sets, zero open scope contradictions, and zero registrations; its focused tests passed 15/15, including the exact `NMO_45718` record set.
- Upgrade-registry validator passed at 131 rows spanning `UPG-022`–`UPG-149`; its focused tests passed 8/8, including UPG-143 completion, UPG-144 deferral, and UPG-149 denominator gates.

Closing validation completed on 2026-08-31 EDT:

- Current manifest `2.28` builder `--check`, strict schema/semantic validator, 34-input receipt verification, deterministic byte-for-byte materialization, and focused tests passed 7/7. The validator retained zero DAT semantic admissions, zero same-cell physiology joins, zero internal primitives, and zero registrations.
- `npm test` completed successfully, including the production build and ESLint. The build emitted only the non-failing Vite chunk-size advisory; no lint errors were reported.
- The full Node test suite reported 448 tests: 446 passed, zero failed, and two explicitly skipped release-package checks. Historical manifest `2.27` remained an immutable 30-input snapshot and passed its own validator/tests without rebuilding current mutable inputs.
- Production-browser visual QA at the canonical `NMO_45718` morphology route confirmed the English 2.28 surface, 10 named routes / 13 unique forms / frozen census 142, runtime-checksum-verified 5,636-node / 5,635-segment geometry, repository-label and calbindin caveats, soma-standardization and shrinkage receipts, and explicit zero-internal / zero-physiology / zero-registration gates. Full-page, detail, and route-card captures were saved under `output/playwright/`; the inspected route card showed no text overlap, clipping, or control overflow.

These observed results do not authorize a package or full-project copy.

## Surgical rollback list

Rollback must preserve unrelated user work in this dirty worktree. Do not use broad `git reset`, `git clean`, recursive deletion, or checkout commands that overwrite unrelated changes.

1. If the exact data delta must be withdrawn, first verify and move aside only `public/data/premotor_comparison_observed_morphology_route_pack_v1/` as one recoverable unit; confirm its six-file / 1,177,212-byte inventory before acting.
2. Remove from the active build only the premotor-comparison route-pack builder, contract, schema, validator, focused test, and the six-file asset directory. Preserve audit copies when required.
3. Remove only the representation-contract `0.5` builder, contract, schema, validator, and focused test, then repoint the active runtime/current-manifest chain to immutable representation contract `0.4`.
4. Restore only the `NMO_45718` runtime bindings and 2.28 denominator text in the affected application, SSR/runtime tests, source-registry/current-manifest/package labels, README, rights ledger, and timeline. Do not touch unrelated or concurrent edits.
5. Remove only the current-manifest `2.28` builder/schema/validator/test/manifest files if they were created; restore `2.27` as current without rebuilding immutable historical receipts.
6. Rebuild only the affected deterministic registry/representation/current-manifest artifacts, then rerun the focused route, representation, source-registry, upgrade-registry, SSR/runtime, manifest, build, lint, and full-test gates.
7. Verify the restored 2.27 denominators: 12 active unique morphologies, nine named routes, eight dorsal / one ventral, frozen census 142, nine states / fifteen representation routes, 24 packages / 27 record sets / six exact rosters, and 30 manifest inputs. DAT semantics, exact physiology joins, internal primitives, cross-source identities, and registrations must remain zero.
8. Do not add, remove, or reclassify the deferred Allen Tac2 objects during a 2.28 rollback; they were not bundled or admitted in this iteration.

This list identifies the 2.28 increment but does not authorize deletion or overwriting of unrelated, pre-existing, or concurrent project files.
