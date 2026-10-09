# Research timeline — iteration 2.63 (2026-09-23)

## Objective and rollback

Continue the public-data-only atlas in the existing project tree, with finer internal-reference detail only where the source supports it. The rollback parent is the immutable 2.62 snapshot: `data/research-iteration-manifest-2.62.json` (524,598 bytes; SHA-256 `b2406e0c04f5a2d66058975051c9113496ce4036e3d52b316317bbd31f0f6618`; content SHA-256 `07813a9e96c22a59624d27f4c6483f4563b4c978190b841e16d7323528054078`).

## Completed increment — UPG-239 public-package audit

- Pinned the Hugging Face dataset-card/viewer revision `92a2ca0f9d1387fcf7eaca0c67f5467cb3a5ad1f` for `Dnq2025/Mask2former_Finetune`. Its public metadata reports 540 paired image/label rows (528 train, 12 validation), a 5.69 GB repository, and one preview image/mask pair of 3964 × 3964 pixels. The viewer supplies no physical pixel scale, biological-object identifier, or serial-section key.
- Recorded the six model output labels, including background and five non-background classes. Axon/myelin masks in the documented workflow come from a separate segmentation tool; these labels are not a census of interneuron types or direct source observations of organelles in the selected cell.
- Kept the dataset/model license (CC BY-NC-SA 4.0) separate from the software license (GPLv3). The atlas includes only a collapsed reference card with source links and metadata; it downloads and redistributes no dataset, mask, image, model weight, or prediction.
- The Roboflow v16 page is a separate release description (302 images, 13 classes, reported mIoU 24.2% without a stated evaluation-set definition). It is not merged into the pinned Hugging Face denominator or label map. UPG-134 remains separately blocked on an exportable version, file-level image/mask checksums and join, held-out-original evaluation, and release/rights compatibility.
- No selected-cell identity, same-cell join, cross-section stacking, registration, cell/internal geometry, or change to the active 3D record is admitted. This public-package metadata audit is complete; it does not meet the 3D cell-identity or internal-geometry gate.

## Source links

- [Hugging Face dataset card and viewer](https://huggingface.co/datasets/Dnq2025/Mask2former_Finetune)
- [Hugging Face model card and label map](https://huggingface.co/Dnq2025/MicroStructFormer)
- [Official dataset description](https://dnq2023.github.io/MSF_WEBSITE/dataset/) and [license statement](https://dnq2023.github.io/MSF_WEBSITE/license/)
- [Roboflow v16 listing](https://universe.roboflow.com/mcgill-bxqbm/microstructformer-mousespinalcord-em-ultrastructure-segmentation)
- [Primary preprint](https://doi.org/10.64898/2026.05.26.727755)

## Scientific and distribution boundaries

The new card is independent of the active-cell evidence card and 3D scene. Public availability does not itself establish redistribution permission; file-level licensing and stable object identity remain required for future assets. This iteration creates no biological denominator, same-cell link, 3D reconstruction, or internally rendered organelle. The existing workspace is updated in place; no full project copy is made.

## Verification

- `npm run validate:research-manifest-2.62`, `npm run validate:research-manifest`, `npm run validate:microstructformer-reference`, `npm run validate:source-registry`, `npm run validate:source-registry-denominators`, `npm run validate:research-upgrades`, `npm run validate:schema`, and `npm run validate:incremental-layout` passed.
- `npm run test:research` passed: application build, ESLint, scientific/data/schema gates, and 870 current tests (855 passed, 15 conditionally skipped, zero failed/cancelled). The current test runner caps parallel files at four to avoid resource-contention timeouts in the large-source audit tests.
- Focused 2.62 snapshot, 2.63 manifest, MicroStructFormer contract, MICrONS source receipt, and SSR integration tests passed. Server-side rendering verifies the collapsed structure-panel card and its identity, geometry, external-mask and redistribution boundaries.
- No screenshot/browser visual sign-off is claimed: the available in-app preview still reported iteration 2.62, and its local preview port could not be reached during this run. SSR and production-build checks are not a substitute for visual inspection.
- The production build completes with the repository's existing large-client-chunk and dynamic-route classification warnings; no build error was reported.

## Workspace and release

The 2.62 snapshot is the immutable rollback parent. This is a local in-place research increment only; it does not authorize a commit, GitHub push, or distribution of the upstream dataset/model assets.
