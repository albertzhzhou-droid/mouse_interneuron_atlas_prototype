# Research Timeline — 2026-08-31 — Iteration 2.30

> **Version transition:** `2.29.0-research.1` -> `2.30.0-research.1`
> **Recorded at:** 2026-08-31 20:37 EDT
> **Mode:** in-place localhost research iteration; open/public digital data only
> **Packaging status:** no distributable package and no folder containing a complete project copy were created.

## Outcome

Iteration 2.30 completes `UPG-151`. The comparator now provides a physical-scale and preparation/truncation disclosure for every checksum-gated viewable morphology object without promoting independently normalized source-local views into a registered or common-scale model.

| Collection | Records | Meaning |
|---|---:|---|
| Frozen census | 142 | Unchanged census inherited from immutable iteration 2.29 |
| Supplementary routes | 7 | Exact source-local objects outside the census |
| Viewable source objects | 149 | `142 + 7`; **never a 149-record census** |

The denominator and membership rules from iteration 2.29 are unchanged. Iteration 2.30 adds disclosure and viewport behavior; it does not add a neuron, specimen, animal, source geometry, source SWC, registration, or biological reconstruction.

## Source-frame contract receipts

The deterministic `morphology-source-frame-disclosure-0.1` contract binds every selectable record to its already admitted geometry and exposes only source-supported coordinate and preparation facts.

| Object | Bytes | SHA-256 | Role |
|---|---:|---|---|
| `data/morphology-source-frame-disclosure-0.1.json` | 469,544 | `e76abace7e59995f4b1849ce87a7e10e0d066a80844959589d5f06fcba0c5230` | 149-record source-frame, preparation, truncation and scale-authority contract |
| Canonical contract content | — | `cd6b85eb5961e49667bdc126b0230fba35db534fdcc2c8008d5655893978a8ad` | Semantic content receipt stored inside the contract |
| `schemas/morphology-source-frame-disclosure-0.1.schema.json` | 14,554 | `382bc051000d96d7142b5176598dad969f36568579e70f563e83606ac6ca8e4b` | Fail-closed schema |
| `tools/build_morphology_source_frame_disclosure.mjs` | 20,391 | `dae31dc3d47d203b3374c1cc902c09950e705147386e44a8fe96af8175c72633` | Deterministic builder and node-level source-receipt checks |
| `app/morphology-viewport-scale.js` | 3,658 | `f51a96dd5fe21d36ca7455245145b002a232116115e5af992d0f6465542f1aac` | Pure target-plane scale and aspect-safe fit calculations |

The contract independently recomputes each record's minimum, maximum, and extent from geometry nodes; verifies geometry bytes, SHA-256, identity, units, local-frame declaration and display transform; and rejects receipt drift. Display coordinates retain the source-reported micrometre unit and the `NeuroMorpho_CNG_standardized_local_frame`. The soma-centering/uniform-scale transform is viewer-only.

## Exact coverage and preparation disclosure

| Contract field | Count | Interpretation |
|---|---:|---|
| Source-local 3D objects | 147 | Positive source z extent; no inferred or restored coordinate |
| Source-local 2D objects | 2 | `NMO 194468` and `NMO 194469`; z extent is exactly zero |
| Scale-eligible objects | 149 | Independent source-coordinate scale only |
| Reported slicing direction | 149 | Raw source field retained |
| Reported slicing thickness | 149 | Source section field retained; not used as viewport scale |
| Numeric age available | 38 | Absence for other records remains unavailable, not imputed |
| Unresolved preparation-context conflicts | 5 | Paper and repository contexts remain separate |
| Source-labelled moderate or incomplete integrity | 70 | Retained as truncation/coverage disclosure, not repaired |
| Common-scale admissions | 0 | No cross-viewport physical normalization |
| Inferred missing coordinates | 0 | Missing z or neurites are not procedurally filled |
| Repaired cut neurites | 0 | Truncation is not extended or completed |
| Restored in-vivo dimensions | 0 | Shrinkage fields do not authorize inverse correction |
| Registrations | 0 | No atlas or cross-source transform is admitted |

Raw shrinkage wording remains case-sensitive and unrepaired: 2 records report `Reported`, 18 report `Not Reported`, 127 report `Not reported`, and 2 are null. This literal preservation is intentional; capitalization is not silently harmonized into stronger evidence.

The two 2D objects are locked straight-on along the positive source-z viewing direction, and rotation is disabled. Their transverse-section label does not create a 3D volume, missing z coordinate, anatomical atlas plane, or cross-record orientation.

## Comparator and export changes

- Each comparator card owns its camera, target, CSS viewport dimensions, source-coordinate transform, and scale bar. No scale value is shared between cards.
- The bar follows a 1-2-5 micrometre series with a 92 CSS-pixel target and is recomputed after initial fit, orbit zoom and viewport resize. Drawing-buffer density and device-pixel ratio do not establish physical scale.
- Perspective scale is calculated at the camera target plane. It describes that plane only; geometry nearer or farther from the camera has a different apparent scale.
- Initial camera distance is fitted against the limiting vertical or horizontal field of view, avoiding aspect-ratio clipping while retaining independent per-object fitting.
- Persistent cards expose protocol, raw section wording, numeric age status, source-coordinate extent, raw shrinkage status, physical-integrity wording, axon-field scope, and unresolved paper-versus-repository context.
- JSON/CSV comparison export is gated on verified analysis authority, full geometry authority, and a current scale receipt. The receipt retains camera position, target, field of view, CSS dimensions, source display transform and recomputable micrometres per CSS pixel.

These changes make source-local dimensions inspectable and replayable. They do not make apparent object size comparable across independently fitted cards.

## Scientific boundaries

Iteration 2.30 admits a display calculation over checksum-verified source coordinates and literal preparation metadata only. It does not admit:

- a 149-record census, new biological denominator, representative interneuron, or population prevalence;
- a shared scale, shared camera, common orientation, anatomical axis, atlas placement, transform, or `REG`;
- correction for fixation, sectioning, shrinkage, warping, tissue loss, or any other restoration of in-vivo dimensions;
- inferred z for planar objects, repaired branches, filled gaps, extrapolated neurites, or a complete biological axon;
- same-cell or cross-source identity, molecular equivalence, physiology join, connectivity, bouton, contact, or synapse;
- membrane, nucleus, mitochondrion, organelle, receptor, ultrastructure, or other same-specimen internal geometry.

Source physical-integrity and neurite-domain labels describe deposited reconstruction coverage. Missing or truncated reconstruction is not biological absence, and a source radius remains a display derivative rather than an observed membrane.

## Upgrade registry and future-source research

The deterministic registry now contains 140 rows spanning `UPG-022`–`UPG-158`. `UPG-151` is completed. Four newly recorded opportunities remain non-admitted research-watch items:

| Upgrade | Status | Evidence-bounded next step |
|---|---|---|
| `UPG-155` | P0 research watch | Audit ZExplorer larval-zebrafish single-neuron metadata and individually addressable morphology only after stable object/version receipts, coordinate/topology QC, a paper crosswalk, and a permissible object-level reuse boundary. Repository counts are not verified interneuron or animal denominators. [Official project API](https://mouse.digital-brain.cn/projectome/2/srv/api/v1/public/projects), [ZExplorer](https://zebrafish.cn/), [terms](https://zebrafish.cn/terms-of-use) |
| `UPG-156` | P1 research watch | Treat `GSE235395` only as an adult-zebrafish regenerative SCI-state lane: 0, 1, 3 and 6 weeks post injury, with pooled-library and destructive-endpoint limits. CellChat predictions are not observed synapses, and source files stay link-only until file-level rights are affirmative. [GEO](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE235395), [primary article](https://doi.org/10.1038/s41467-024-50628-y) |
| `UPG-157` | P1 research watch | Build a chick/human embryonic `GSE312424` LARRY lineage adapter only after a stable same-sample gene-expression-to-clone-barcode join. Clone inheritance plus endpoint RNA does not establish a longitudinal same-cell observation, mature identity, morphology, position, physiology, synapse, or cross-species equivalence. [GEO](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE312424), [BioProject](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1373277) |
| `UPG-158` | P2 research watch | Retain the embryonic-mouse MADM study as assertion-only developmental context until reusable public geometry objects with stable IDs, specimen mapping, units/frame, bytes, hashes and licence exist. Tracing incompleteness forbids complete-neurite or census claims. [primary preprint](https://doi.org/10.64898/2026.02.12.705305), [author repository](https://github.com/sgobeil1/SCLineage) |

None of these four items changes the current model, adds a source object, or fills an internal-structure gap. Cross-species context is not transferred into mouse identity.

## Manifest and immutable-history receipts

- Parent iteration `2.29` remains immutable at 38 authoritative inputs, 77,136 bytes, file SHA-256 `8856ad6413fae98f5f6f9d13cbb0627c8b41b8a9dbaa04ebd9a232689edaeba5`, and canonical content SHA-256 `069b1be3a37a8086f89ea4467503235ed0734afcbfd2974538bae528c4995982`.
- The active historical route `scripts/validate-research-iteration-manifest-2.29-snapshot.mjs` validates the frozen receipt and scientific denominators without rebuilding 2.29 against live 2.30 inputs.
- Upgrade registry: 140 rows, `UPG-022`–`UPG-158`; 318,117 bytes; SHA-256 `9dd38dd42872efef6bb83c84c892693a5ea791557f1ea90539be9bdc78fe91da`.
- Active iteration `2.30` is locked at 42 authoritative inputs, 81,964 bytes, file SHA-256 `c8796b7732d2f36998976698f1991f5d70e95fae96b33c20301d4b21d80e5858`, and canonical content SHA-256 `c80407736016bf95e0b4dc9d937126e8955628cef4c2485384df835639c3538f`.
- The deterministic 2.30 builder check, standalone validator, and nine focused manifest/mutation tests passed before this receipt was recorded. The manifest preserves the 2.29 parent receipt, `142 + 7 = 149` viewable-object arithmetic, 149 scale-eligible records, 140 upgrade rows, zero registrations, and zero project/package-copy claims.

## Validation evidence at the documentation checkpoint

The following checks were run from the current working tree on 2026-08-31 EDT:

- Source-frame disclosure validator: **passed**; `142 census + 7 supplementary = 149`, 2 2D + 147 3D, zero shared-scale admissions, and zero registrations.
- Focused source-frame, viewport-scale and comparison/export suite: **24/24 passed**.
- Research/model upgrade registry validator: **passed**; 140 rows spanning `UPG-022`–`UPG-158`.
- Immutable 2.29 snapshot suite: **5/5 passed**.
- Current 2.30 manifest builder/validator: **passed**; 42 inputs, 149 viewable and scale-eligible objects.
- Current 2.30 manifest focused and mutation suite: **9/9 passed**.

Closing full lint/test and browser visual/console QA are not claimed by this checkpoint. They remain closing gates for the main iteration workflow. Passing them would still not authorize a distributable package or a complete-project copy.

## Surgical rollback

Rollback must preserve unrelated work in the dirty worktree. Do not use broad reset, clean, checkout, or recursive deletion commands.

1. Disable only the `app/morphology-source-frame-disclosure.ts` adapter and restore `app/morphology-census-data.ts` to its previous geometry-only authority checks. Keep every underlying census and supplementary source geometry intact.
2. Revert only the source-scale/straight-on behavior in `app/SourceLocalMorphologyViewport.tsx` and the corresponding 2.30 rules in `app/globals.css`. Remove no source geometry, SWC, route contract, or analysis asset.
3. Revert only the 2.30 preparation/coverage card and camera-scale export fields in `app/MorphologyComparePanel.tsx` and `app/morphology-comparison.js`, together with their focused tests. Restore the 2.29 `co_display_only` comparator without changing membership.
4. Move aside only `data/morphology-source-frame-disclosure-0.1.json`, its schema, builder, validator, focused test, and `app/morphology-viewport-scale.js` plus its focused test after verifying those exact paths. Do not remove any file referenced by their geometry receipts.
5. Remove only the 2.30 manifest builder/data/schema/validator/test after verifying exact paths, and repoint the active manifest route to the immutable 2.29 snapshot. Never rebuild, rewrite, or re-hash the historical 2.29 manifest.
6. Restore `UPG-151` to planned and remove only `UPG-155`–`UPG-158` if rolling back the complete registry delta, then deterministically rebuild and validate the registry. Preserve every earlier upgrade row.
7. Restore only affected 2.30 package/application labels, package scripts, README text, and this timeline. Preserve unrelated or concurrent changes.
8. Re-run source geometry, comparator, immutable-manifest, build, lint and full-test gates. Verify the restored state still reports `142 census + 7 supplementary`, no 149-record census, zero internals, zero cross-source identities, and zero registrations.

This rollback list identifies only the 2.30 increment. It does not authorize deletion or overwriting of unrelated project files, and iteration 2.30 created neither a full project copy nor a distributable package.
