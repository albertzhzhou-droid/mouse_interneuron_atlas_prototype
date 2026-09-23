# Iteration 2.44 — source-grounded spinal volume-EM reference

Date: 2026-09-22. Version: `2.44.0-research.1`. Status: locally verified and paused at 2.44; no later iteration is included.

## Starting point

The starting checkout was clean at `b7cebbc` (2.43 partial checkpoint). Iteration 2.43 is preserved byte-for-byte as an immutable parent manifest. This work continues in the existing project directory; it creates no full-project copy.

## Changes

- Closed UPG-207/208 with the validated NMO 108978 and NMO 249676 source-native contour receipts; the admitted objects remain ordered line traces, not surfaces or internal cell structures.
- Closed UPG-211/212 with the source-slot GLUT identity adapter and the revised type-information navigation. The 277 labels remain separate from the 387 confirmed-profile denominator and absent `meta.data$neuron_types` remains absent.
- Added UPG-216 as an independent, link-only reference to Zhang et al.'s published mouse spinal dorsal-horn volume reconstruction. The card reports the 35 × 24 × 2 μm acquisition and the source-described profiles and structures without treating profiles as cell counts or the source as a named subtype.
- Added UPG-217 as the next exact-object availability and reuse audit for raw stacks, editable area lists, segmentations and meshes.
- Added an immutable 2.43 parent snapshot, a 2.44 deterministic research manifest and file-specific scientific validation. The current source registry and upgrade queue remain the source of denominators.

## Scientific and display boundary

The published volume is presented as external context only. No raw serial stack, area list, segmentation or mesh is imported or rehosted; no trace is reconstructed from the figure; no selected-record identity join, registration, measurement or new project geometry is admitted. The Slc32a1 context is broad inhibitory-neuron labeling and does not assign a molecular interneuron subtype. The publication's axon and dendrite are treated as profiles, not a stable cell count.

## Verification

`npm test` passed: 136 test files, 768 tests total, 753 passed, 0 failed and 15 optional/tool-dependent tests skipped. The run included the application build, lint, current research validators and the 2.44 test suite. The standalone source-registry, research-upgrade and spinal volume-EM reference validators also passed. A local UI smoke check confirmed the 2.44 interface, registry-derived denominators (27 source packages, 36 record sets, 11 exact profiles and 2 source-object sets), and a collapsed external-reference card explicitly labeled as not the selected record.

These checks verify software and declared source receipts only; they do not establish access to unavailable raw EM data, cell-specific internal geometry or same-cell identity. Work is paused at this verified iteration pending a separately configured GitHub destination and valid GitHub authentication.

## File-specific rollback

Rollback reference: the starting commit `b7cebbc`. Review `git diff b7cebbc --` and revert only the iteration-2.44 paths below if rollback is explicitly chosen; do not reset or clean the repository broadly.

Existing files changed: `package.json`, `package-lock.json`, `app/atlas-types.ts`, `app/InternalStructureReferencePanel.tsx`, `app/globals.css`, `app/layout.tsx`, `app/AtlasPrototype.tsx`, `app/NativeContourRecordViewer.tsx`, `docs/RESEARCH_MODEL_UPGRADE_QUEUE.md`, `tools/build_research_upgrade_registry.mjs`, `scripts/validate-research-model-upgrade-registry-0.1.mjs`, `tests/research-model-upgrade-registry.test.mjs`, `tests/research-iteration-manifest-2.43.test.mjs`, `tests/observed-morphology-runtime-contract.test.mjs`, `tests/microns-observed-cell-nucleus-reference.test.mjs`, `tests/rendered-html.test.mjs`, `tests/research-source-registry-cano-relationship.test.mjs`, `tools/run_current_research_tests.mjs`, `data/research-source-registry-0.1.json`, and `data/research-model-upgrade-registry-0.1.json`.

Iteration-specific files added: `data/spinal-inhibitory-interneuron-volume-em-reference-0.1.json`, `data/research-iteration-manifest-2.44.json`, `scripts/validate-spinal-inhibitory-interneuron-volume-em-reference-0.1.mjs`, `tests/spinal-inhibitory-interneuron-volume-em-reference.test.mjs`, `scripts/validate-research-iteration-manifest-2.43-snapshot.mjs`, `tools/build_research_iteration_manifest_2_44.mjs`, `scripts/validate-research-iteration-manifest-2.44.mjs`, `tests/research-iteration-manifest-2.44.test.mjs`, and this timeline. The generated `data/research-model-upgrade-registry-0.1.json` is rebuilt from the queue and its deterministic builder.
