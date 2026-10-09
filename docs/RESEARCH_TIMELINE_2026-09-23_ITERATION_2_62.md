# Research timeline — iteration 2.62 (2026-09-23)

## Objective and rollback

Continue the open-data-only atlas in the existing project tree. Seal iteration 2.61 as the rollback parent: `data/research-iteration-manifest-2.61.json` (403,521 bytes; SHA-256 `1f12b57cc7ce6c7139bf83fb3cbae4f7c420547f0b460a2a833638384afa6218`; content SHA-256 `b0ea719bade1bf2348088fea4f2b39add4d59e5e9e6de115b8cfc655edc8a01e`).

## Completed increment — UPG-237

- Added an expandable paper DOI × exact raw `cell_type` source cross-tab over the checksum-pinned NeuroMorpho 8.6.124 no-age index.
- The index resolves 1,097 exact NMO IDs across 12 DOIs: 1,097 DOI-record memberships, 2,735 DOI × raw-label memberships, and 1,095 multi-label records. The pinned snapshot has no missing DOI and no multi-DOI record; the adapter and synthetic tests preserve both cases explicitly for future inputs.
- Each paper-label row retains exact NMO IDs and archive counts. NMO IDs are not merged across papers or promoted to an animal, subtype, or prevalence denominator.
- The index stores PMID/DOI citation fields but no record-to-figure crosswalk. All 1,097 figure memberships are therefore unassessable—not negative figure matches. DOI/label filters narrow the record list only; they never auto-select an NMO record or change the active geometry.
- Added UPG-238–240 as future, evidence-gated comparison audits. None adds a current source, type, cell record, or geometry.

## Research watch and next gates

- Fish1 is a 7-dpf larval-zebrafish resource with same-specimen EM/LM and a whole brain/spinal-cord/ganglia annotation scope. Stable soma lore IDs and segmentation root IDs have different version behavior; an exact spinal interneuron/object and redistribution route is not yet admitted. It remains a distinct zebrafish comparison lane. [Release](https://fish1-release.storage.googleapis.com/index.html), [programmatic access](https://fish1-release.storage.googleapis.com/programmatic.html), [data policy](https://fish1-release.storage.googleapis.com/data_policy.html).
- MicroStructFormer describes mouse spinal-cord EM semantic segmentation for axonal/subcellular and periaxonal classes. Its data/model assets are CC BY-NC-SA 4.0, separate from GPLv3 software. The available project description does not establish a versioned 3D stack, exact interneuron identity, or same-cell organelle geometry; no assets are copied. [Dataset](https://dnq2023.github.io/MSF_WEBSITE/dataset/), [license](https://dnq2023.github.io/MSF_WEBSITE/license/), [Roboflow project](https://universe.roboflow.com/mcgill-bxqbm/microstructformer-mousespinalcord-em-ultrastructure-segmentation), [preprint](https://doi.org/10.64898/2026.05.26.727755).
- Svara et al. reconstruct CiD and CoBL circuits in larval zebrafish spinal SBEM. The article reports three supplemental data files, but that does not establish access to the raw volume, editable segmentations, exact exportable skeletons, or file-specific reuse rights. UPG-240 audits those exact object routes; no zebrafish circuit or labels are transferred to mouse. [Article](https://doi.org/10.1016/j.celrep.2018.05.023), [institution-hosted article PDF](https://pure.mpg.de/pubman/item/item_3055210_7/component/file_3055224/1-s2.0-S2211124718307563-main.pdf), [supplement record](https://pure.mpg.de/rest/items/item_3055210/component/file_3055225/content).

## Scientific and distribution boundaries

No new 3D cell form, ultrastructure, interneuron identity, same-cell join, atlas registration, or cell/animal denominator is added. The UI displays source provenance only and preserves the distinct raw terms. Source datasets from the three research-watch candidates are not redistributed by this increment. Existing folders are updated in place; no full project copy is created.

## Verification

- `npm run build` and `npm run lint` passed as part of the full research gate.
- `npm run test:research` passed, including research/source/geometry validators and the current Node test set: 866 tests, 851 passed, 15 skipped, 0 failed.
- A flaky test that regenerated an XLSX ZIP twice and compared timestamps embedded in the source-file hash was corrected to parse the same synthetic bytes twice; deterministic derived-panel output and source checksum enforcement remain tested.
- Screenshot-based visual review was not completed, so no visual sign-off is claimed.
- The 2.62 manifest is rebuilt and validated after recording this verification receipt.

## Workspace and release

Rollback is the immutable 2.61 manifest above. No commit or GitHub push is part of this iteration; that remains reserved for the user's explicit queue-completion/pause milestone.
