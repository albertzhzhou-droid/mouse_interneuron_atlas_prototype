# BANC v888 mitochondrial-detail route check — 2026-09-23

## Decision

One exact adult-female fly VNC interneuron candidate provides a new bounded **count-only** internal-detail receipt: v888 root `720575941350424112` (`IN14A018`) has a source-derived metadata metric of 31 mitochondria. This is useful comparative evidence for the source's own candidate, not 31 observed 3D positions and not a detail layer for any selected mouse spinal interneuron.

The archive route is real but not yet a geometry route. The official BANC data map lists a per-mitochondrion table with v888 root IDs, while the separate detected-mitochondria segmentation product is marked `MISSING`. The exact Dataverse v3 file receipt is 1,107,598,431 bytes, MD5 `2e3be9c0d063969ae019121117007e9a`, and unrestricted in the DOI archive. The project records CC BY 4.0 for its Dataverse deposit; this audit does not transfer that licence to mutable GCS mesh objects.

The maintained `bancr` client exposes `banc_mitochondria(rootids=...)` and filters the table by `pt_root_id`, but the implementation initializes the CAVE client with `fafbseg:::check_cave()`. No CAVE credentials were inspected or used and no query was run. The documented root-filter route is preferable to retrieving the whole 1.1 GB compressed table, but needs a configured authorized client or an exact public subset.

## What was added to the existing app

- The comparative-reference card now treats `31` as a verified, source-reported per-neuron count for this exact v888 root and explicitly says the positions and mitochondria geometry are unavailable.
- The card links the query method and keeps the fly candidate separate from the currently selected mouse record.
- No placeholder organelle markers, meshes, joins, registrations, or selected-mouse internal geometry were added.
- UPG-232 captures the remaining exact-row / coordinates / rights gate. UPG-219 and UPG-221 remain open for their separate cell-mesh and candidate-object chains.

## Evidence and unresolved gates

- BANC v888 candidate audit: `data/banc-v888-candidate-audit-0.1.json` pins the candidate metadata row, its source-reported mitochondrial count, the v888 crosswalk, exact SWC member receipt, and the unfiltered per-mito file ID/size/MD5.
- Independent source route audit: `data/banc-v888-mitochondria-route-audit-0.1.json` keeps count metadata, per-mito annotation rows, and segmentation geometry as distinct evidence levels.
- The source map and client route are linked in the application and cited in the audit. No source objects were downloaded, extracted, or rendered in this iteration.

Next, use a documented authorized root-filtered query or a verified versioned public subset; audit exact row IDs, coordinates, units, same-root membership, v888 correspondence, and reuse terms. If the query yields centroids only, any future visual must show points as points, with explicit point/centroid authority; it must not manufacture mitochondrial membranes or volumes.
