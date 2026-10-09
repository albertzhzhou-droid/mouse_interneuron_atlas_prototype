# Research timeline — iteration 2.53 (2026-09-23)

## Scope

Audit whether the published MICrONS v185 manual mitochondria layer can be spatially overlaid on the exact v185.4 visual-cortex cell already shown by the app. Record a defensible negative result in the UI and upgrade queue, and identify a high-value future source for finer structural research without importing data whose availability or reuse terms are unresolved. Keep the change in the existing project; no project-copy folder was created.

## Source audit

- A read-only request of the official `mit_new/info` object returned 482 bytes with SHA-256 `e458ae905bab05a30957454eead792279a4611eb307c6c2c79e396f3a5549364`. The metadata reports a uint32 raw segmentation layer at `[4,4,40]` nm, voxel offset `[19746,11753,65]`, and size `[2560,2560,100]`. The raw metadata bytes are not bundled.
- Under direct nominal-origin conversion, the layer occupies X `[78984,89224)` nm and Y `[47012,57252)` nm. The checksum-pinned cell mesh for root `648518346349516051` (v185.4) occupies X `[193453.140625,382259.5]` nm and Y `[142840.671875,241471.5]` nm. These boxes do not intersect on X or Y under identity mapping.
- The `info` object supplies no target-root membership and no cross-layer affine transform; shared origin/axis compatibility remains unverified. The negative overlap result is therefore an eligibility failure under the layer's listed nominal grid, not a claim that mitochondria are biologically absent from the cell. The cell-specific object count stays zero.
- Fish-X v3 is a promising comparative route: its preprint reports a 6-dpf larval-zebrafish retina/brain/anterior-spinal-cord EM dataset, 176,810 validated cells, over 25 million synapses and 523 reconstructed neurons across nine reported classes. The article's data-availability statement says the ssEM dataset is available upon request, despite linked public Neuroglancer layers and a public code repository. Queue an access/version/object-identity/rights audit only; do not treat viewer availability or public code as an open-data license or transfer fish detail to mouse.

## Changes

- Added `data/microns-mitochondria-spatial-compatibility-0.1.json`, a validator and mutation tests. The validator recomputes the target mesh bounds from the checksum-pinned asset manifest and derives the candidate layer bounds from its reported voxel grid.
- Updated the cross-region reference card to show the nominal-grid mismatch, the missing transform and the no-biological-absence caveat. It continues to admit zero mitochondria, registrations and spinal joins.
- Closed UPG-223 for this exact target under the documented nominal grid, while keeping the transform and root-membership gates explicit. Added UPG-225 for Fish-X's public-export and reuse-rights audit as a separate species/stage comparator.
- Sealed 2.52 byte-for-byte as the parent snapshot and advanced the live app/release manifest to 2.53. Added this unique timeline under the existing `docs` directory.

## Evidence boundary

- Exact target: one MICrONS visual-cortex cell root, not a spinal interneuron.
- Mitochondria layer bounds overlap this cell on 0/2 in-plane axes under direct nominal mapping; cross-layer transform verified: no; target-root membership verified: no.
- Admitted mitochondria objects: 0; added geometry: 0; registration: 0; biological absence claims: 0; mouse-spinal identity joins: 0.
- Fish-X counts, types, coordinates and reconstructions remain outside the mouse spinal denominator/model. No Fish-X data payload is imported.

## Verification

The MICrONS bounds validator passes; its three mutation/boundary tests pass. The focused UI/SSR batch passes 45/45 tests. Final `npm run test:research` passes with 807 tests total: 792 passed, 15 intentionally skipped, 0 failed; this command also completed the application build, lint, data validators and the research validation suite. The 2.53 manifest is rebuilt from the final timeline and separately checked with its validator and the sealed 2.52 parent validator.

No screenshot-based visual QA is claimed. The app process/UI was not available for a fresh unlocked-browser inspection in this iteration.

## Rollback

To return to the sealed 2.52 release, switch the live application import/version and package scripts back to the 2.52 snapshot; remove only the 2.53 manifest/builder/validator/test/timeline and the new MICrONS spatial-compatibility contract/validator/test; then restore the pre-2.53 UPG-223 queue text, remove UPG-225, and regenerate the upgrade registry. Preserve the 2.51/2.52 artifacts and all unrelated dirty work. Do not use a workspace-wide reset or cleanup.

## Primary sources

- [MICrONS Phase 1](https://www.microns-explorer.org/phase1)
- [MICrONS v185 release notes](https://www.microns-explorer.org/v185-release-notes)
- [Exact `mit_new/info` metadata object](https://storage.googleapis.com/neuroglancer/pinky10/ground_truth_registration/dst/mit_new/info)
- [Fish-X v3 primary preprint](https://www.biorxiv.org/content/10.1101/2025.06.12.659365v3.full)
- [Fish-X author code repository](https://github.com/MiRA-Han-Lab/Fish-X)
- [Fish-X brain EM viewer](https://ng.zebrafish.digital-brain.cn/Fish-X/Brain_EM_images)
