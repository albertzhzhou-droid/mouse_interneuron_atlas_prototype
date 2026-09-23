# Iteration 2.45 — checksum-pinned spinal synapse serial-section browser

Date: 2026-09-22. Version: `2.45.0-research.1`. Status: locally verified candidate; no 3D synapse reconstruction is claimed.

## Starting point

Iteration 2.45 continues in the existing project directory from the immutable 2.44 manifest. It does not create a second project copy. The 2.44 manifest is now checked as a fixed snapshot; its historical evidence is retained even as the live queue and application advance.

## Changes

- Audited the official Figshare v1 API receipt and the deposited README section index for the same Dorsal 2 grid B position E9 synapse-1 source object. Admitted the eleven distinct TIFF file IDs in filename-section order `20140`–`20150`: `32606585`, `32606588`, `32606555`, `32606558`, `32606561`, `32606567`, `32606570`, `32606573`, `32606576`, `32606579`, and `32606582`.
- Verified each 2,405,817-byte local TIFF against the Figshare-supplied MD5, computed MD5, and a local SHA-256. Total source TIFF bytes: 26,463,987. All images decode to 1,794 × 1,332 8-bit indexed-palette TIFFs.
- Created ten additional browser PNG derivatives, reusing the existing PNG for file `32606555`. Pillow 12.3.0 decoded-pixel SHA-256 receipts match source-to-PNG for all eleven images. No crop, resampling, intensity transform, outline, or annotation was applied.
- Replaced the single-image card with an accessible 11-section 2D browser: previous/next controls, a keyboard-operable range input, live section/file receipts, and a link to the current source TIFF. Images remain separate 2D files; the browser does not register or combine them.
- Advanced UPG-099 and UPG-112 to show that source acquisition and the ordinal browser are complete while contours, alignment, uncertainty review, and any bounded synapse reconstruction remain pending. Closed UPG-217 only for the audited Zhang paper/supplement file list; its listed reconstruction videos remain link-only because their asset-specific reuse terms were not verified.
- Added a deterministic 2.45 manifest, exact-source validator and tests; updated the version-specific queue registry and immutable 2.44 snapshot validator.

## Evidence and scientific boundary

Maynard et al. describe 70 nm serial sections and manual registration for their spinal SR-CLEM analysis. The viewer therefore reports 70 nm as the nominal section thickness, but does not claim a calibrated z origin or source-provided cross-section registration. The exact file order is a deposited ordinal sequence.

The deposited object is a synapse-labelled image series, not a named interneuron. Parent cell, presynaptic identity, molecular subtype, cell morphology, and atlas location remain unresolved. No source-derived contours, segmentation labels, mesh, 3D volume, receptor/PALM crosswalk, organelle annotations, measurements, selected-record joins, or registrations are admitted. Unavailable means not established in this release, not biologically absent.

For the independent Zhang et al. publication audit, the checked paper and listed supplements expose article/supplement files and reconstruction videos but do not list raw serial images, editable TrakEM2 area lists, labels, or meshes. This is deliberately a bounded file-list finding, not proof that an object cannot exist elsewhere or be obtained from authors.

## Verification

- `npm test` passed: production build and lint succeeded; all source, registry, historical-snapshot, serial-stack, and release-manifest validators passed; 773 test cases ran (758 passed, 15 optional skips, 0 failed) across 138 current test files.
- The first full-suite runs exposed two stale historical-version references in runtime/MICrONS tests. They now assert the active 2.45 manifest; the final complete rerun passed.
- The 2.45 manifest validator passed with 314 authoritative inputs and immutable 2.44 as parent. The 2.45 manifest rebuild is deterministic.
- Local browser smoke: the production UI reported 2.45. Clicking “Show next source section” changed the displayed image and all live provenance fields from section 1/11, label 20140, Figshare file 32606585 to section 2/11, label 20141, file 32606588. The same-section sequence remains explicitly unregistered and non-volumetric.

## File-specific rollback

Rollback baseline: immutable `data/research-iteration-manifest-2.44.json` and its 2.44 file receipt. Revert only the paths changed for this iteration; do not reset or clean the repository broadly. 2.44 is independently checkable with `npm run validate:research-manifest-2.44`.

Iteration 2.45-specific additions: `data/super-clem-dorsal-synapse1-serial-stack-0.1.json`; `scripts/validate-super-clem-serial-stack-0.1.mjs`; `tests/super-clem-serial-stack.test.mjs`; `scripts/validate-research-iteration-manifest-2.44-snapshot.mjs`; `tests/research-iteration-manifest-2.44-snapshot.test.mjs`; `tools/build_research_iteration_manifest_2_45.mjs`; `scripts/validate-research-iteration-manifest-2.45.mjs`; `tests/research-iteration-manifest-2.45.test.mjs`; `data/research-iteration-manifest-2.45.json`; this timeline; the ten new source TIFFs and ten corresponding PNG derivatives (the existing file-32606555 TIFF and PNG are reused, not duplicated).

Existing paths refreshed by this iteration: `app/SuperClemSynapseReference.tsx`, `app/AtlasPrototype.tsx`, `app/atlas-types.ts`, `app/layout.tsx`, `app/globals.css`, `docs/RESEARCH_MODEL_UPGRADE_QUEUE.md`, `data/research-model-upgrade-registry-0.1.json`, `scripts/validate-research-model-upgrade-registry-0.1.mjs`, `tools/build_research_upgrade_registry.mjs`, `tests/research-model-upgrade-registry.test.mjs`, `tests/rendered-html.test.mjs`, `tools/run_current_research_tests.mjs`, `package.json`, and `package-lock.json`.
