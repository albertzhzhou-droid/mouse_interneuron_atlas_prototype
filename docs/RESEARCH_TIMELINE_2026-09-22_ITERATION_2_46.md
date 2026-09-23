# Iteration 2.46 — source-local spinal interneuron ultrastructure reference

Date: 2026-09-22. Version: `2.46.0-research.1`. Status: locally verified candidate. This iteration adds a cited 2D reference, not reconstructed 3D ultrastructure.

## Starting point

Iteration 2.46 continues in the existing project directory from the immutable 2.45 manifest. It does not create or package a second project copy. The 2.45 manifest remains an independently checked snapshot and is the rollback baseline for this iteration.

## Changes

- Added the unchanged publisher Figure 1 from Davis et al. (2023) to the morphology-comparison view as a collapsed, source-local mouse spinal reference. The image is pinned at 1,195,290 bytes, 1,594 × 1,172 px, SHA-256 `3beafa543799863db6752e97e31b718e9d6e93645866d4065178c8ce3413cb74`, with CC BY 4.0 attribution and source links.
- Preserved the caption-bounded relationship: panels a–c show other recorded cells; the caption says e–g are EM examples of the cell in panel d. This remains a publication-level same-cell assertion, not independent identity validation. The paper reports compromised EM tissue preservation; the figure is not a raw stack or reconstructable cell volume.
- Added a source-asset validator, mutation-resistant tests, server-rendered UI assertions, and a deterministic 2.46 manifest whose parent is the sealed 2.45 release.
- Updated the 2.32–2.34 historical snapshot validators to keep manifests byte-frozen while explicitly treating the later-evolving comparison panel as a superseded live input. The historical manifest JSON files themselves remain unchanged.
- Advanced UPG-213 only for a source-local figure reader with zero project geometry, registrations, or active-record joins. Added UPG-218 for a future version-pinned MICrONS synapse point-overlay audit and UPG-219 for a future, explicitly cross-species BANC VNC internal-detail comparison. Neither future item admits geometry in this iteration.

## Evidence and scientific boundary

The image shows four of the five recorded inhibitory calretinin-expressing islet cells and small EM examples caption-linked to the cell reconstructed in panel d. It does not identify the exact cell's age, sex, or animal in the figure, nor provide source segmentations, raw TEM images, serial z coordinates, organelle meshes, or a molecular-taxonomy crosswalk. The UI therefore presents the full source figure unchanged and explicitly reports zero segmentations, meshes, active-record joins, and atlas registrations. No figure pixels or line work are used to create atlas geometry.

UPG-218 remains a planned route pending exact MICrONS root/version, coordinate-frame, proofreading, and detection-status audits. UPG-219 remains a planned comparative route for adult female Drosophila VNC data; it is not vertebrate spinal-cord evidence and does not imply homology to mouse interneurons.

## Verification

- The 2.45 snapshot is pinned at 279,746 bytes, file SHA-256 `9459ae104b7330295f6fbbcda5210f5615dda7d0e778cdb42bb7e8aeb41e269c`, content SHA-256 `193844378da13817fd6d0914d476716e6fe9f79d68f88d0f91d58ec831795848`, with 314 authoritative inputs.
- `npm run validate:research-upgrades`, `npm run validate:davis-icr-reference`, and the 2.45 immutable-snapshot validator passed. The upgrade registry contains 201 rows through UPG-219; the Davis image receipt verifies 1,195,290 bytes and the expected SHA-256, with 0 admitted geometry, joins, or registrations.
- The source-registry denominator audit resolved current totals from the registry: 27 sources, 36 record sets, 11 exact cell/profile rosters and 2 exact source-object sets across 8 displays, with 0 stale UI literals. UPG-202's 27/34/10/1 values are explicitly labeled as its historical post-UPG-204 snapshot.
- `npm test` passed: production build, lint, all data/contract/snapshot validators, and 777 tests (762 passed, 15 optional skips, 0 failed). The rendered-HTML suite passed all 39 tests, including the morphology comparator route and English-only UI assertion.
- The final 2.46 deterministic manifest validates with 327 authoritative inputs and immutable 2.45 as its parent. Its final content receipt is emitted by `npm run validate:research-manifest`.

## File-specific rollback

Rollback baseline: immutable `data/research-iteration-manifest-2.45.json`, file SHA-256 `9459ae104b7330295f6fbbcda5210f5615dda7d0e778cdb42bb7e8aeb41e269c`. Verify it with `npm run validate:research-manifest-2.45`. To roll back only iteration 2.46, restore the paths refreshed for 2.46 from the sealed parent and remove only iteration-specific 2.46 files; preserve the pre-existing 2.44/2.45 changes and all unrelated work. Do not reset or clean the repository broadly.

Iteration-specific additions: `app/DavisICRSameCellReference.tsx`; `data/source-candidates/davis-icr-same-cell-20260922/receipt.json` and its unchanged publisher PNG; `scripts/validate-davis-icr-same-cell-reference-0.1.mjs`; `tests/davis-icr-same-cell-reference.test.mjs`; the 2.45 snapshot validator/test; 2.46 manifest builder/validator/test/manifest; this timeline. Adjusted existing paths: `scripts/validate-research-iteration-manifest-2.32-snapshot.mjs`, `scripts/validate-research-iteration-manifest-2.33-snapshot.mjs`, and `scripts/validate-research-iteration-manifest-2.34-snapshot.mjs`.
