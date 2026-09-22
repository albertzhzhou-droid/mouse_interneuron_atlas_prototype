# Research iteration 2.24 — evidence-aware morphology and fail-closed internal detail

Date: 2026-08-30  
Release: `2.24.0-research.1`  
Manifest: `data/research-iteration-manifest-2.24.json`  
Input policy: public digital sources only; no physical specimens, OHRI internal data, unpublished institutional records, or inferred same-cell joins.

## Outcome

Iteration 2.24 fills one visible morphology gap with an exact public source object and removes an unsupported internal-geometry substitute.

- NeuroMorpho `NMO 109021` is available through the independent route `mouse.sc.grp_dorsal_horn.observed.nmo_109021`.
- The unchanged five-record legacy exemplar lens and the new independent route produce six active main-scene morphology choices. The release-query census remains exactly 142 records; no duplicate census record was created.
- Nine representation states are bound to seven 3D routes by a machine-readable evidence contract.
- The former procedural internal cutaway has been replaced by an explicit unavailable-object state with zero rendered biological primitives.
- Five internal-compartment terms remain visible as non-rendered vocabulary references only.
- Cross-source exact identities and project registrations remain zero.

The change increases source-backed detail without completing missing anatomy by visual plausibility.

## Independent GRP dorsal-horn morphology

### Admitted source object

| Field | Admitted value |
|---|---|
| Route | `mouse.sc.grp_dorsal_horn.observed.nmo_109021` |
| NeuroMorpho ID / name | `109021` / `24-07-15-B` |
| Archive | Todd |
| Species / life stage | mouse / adult |
| Source context | lumbar and mid-lumbar spinal dorsal horn |
| Reporter strain | `Tg(Grp-EGFP)DV197Gsat` |
| Reconstruction | Neurolucida; in vitro; parasagittal; 300 µm |
| Physical integrity | `Dendrites & Axon Moderate` |
| Source-local geometry | 2,790 nodes and 2,789 edges |
| SWC node types | 12 soma, 2,202 axon, 576 dendrite |
| Radius range | 0.045–3.085 µm |
| Registration | none |

The route uses the source's GRP label and reporter strain but presents the cell as **GRP reporter-positive**. It does not promote reporter status to direct same-cell GRP-mRNA confirmation.

Primary and repository records:

- [NeuroMorpho neuron record](https://neuromorpho.org/neuron_info.jsp?neuron_name=24-07-15-B)
- [NeuroMorpho API record](https://neuromorpho.org/api/neuron/id/109021)
- [Dickie et al., *Pain* 2019](https://doi.org/10.1097/j.pain.0000000000001406)
- [NeuroMorpho data-use terms](https://neuromorpho.org/useterm.jsp)

### Exact receipts

- Bundled standardized SWC: 104,228 bytes; SHA-256 `fd30c7fbafd6642a99265e0009ef0bc5b75709fc7a1fba3bcc80ad47d28bde02`.
- Bundled deterministic browser geometry: 289,290 bytes; SHA-256 `19cab96e659bf8add7c370afe6d684da62dc6af79c92067c2ecc2294124e9f39`.
- Official remote Neurolucida DAT: 161,610 bytes; SHA-256 `a9bf5cd0369f12c28aad7d0c1664c7d6cbc68bf05774d5c3c095994db9308af9`; recorded but not bundled.
- Official initial standardization log: 42,372 bytes; SHA-256 `f806408bfa55f050ac45531eb31d3471e40e4f4e9041df2d077d9f32bcabf987`; recorded but not bundled.
- Official remaining-issues log: 10,105 bytes; SHA-256 `1c9ea3f5b59acdbcd3bbb05b60165c211cf6c5fe99924bf023abcce6e291ef09`; recorded but not bundled.

The source header states that twelve original soma contours were averaged into twelve standardized source-type-1 soma points. Those points are reduced contour summaries, not the original contour vertices, an observed membrane, a nucleus or a volumetric soma segmentation.

### Permitted and prohibited interpretations

Permitted:

- source-local SWC coordinates, topology and source types;
- source-local descriptive morphometrics;
- a deterministic open radius-derived display surface because source radius is available;
- explicit comparison with another independently displayed record under `co_display_only` authority.

Prohibited:

- complete-axon interpretation;
- representative morphology for every GRP neuron;
- exact identity with `mouse.sc.vsx2_hoxa10`, an SCI entity, a transcriptomic cluster or another NeuroMorpho record;
- laminar or atlas placement;
- observed membrane, closed soma, nucleus, organelle, receptor, bouton, synapse or ultrastructure claims;
- biological measurements taken from the display-derived surface.

## Evidence-aware 3D contract

`data/evidence-aware-3d-representation-contract-0.1.json` separates what a rendered object is from how visually detailed it appears.

| State | Meaning | Core boundary |
|---|---|---|
| `OBS_RAW_TEXTURE` | checksum-verified source pixels or voxels | texture is not a segmented object |
| `OBS_SEGMENTED_SURFACE` | exact source segmentation boundary | segmentation is not a molecular membrane measurement |
| `OBS_SKELETON` | source-local SWC coordinates and topology | skeleton is not membrane or volume |
| `OBS_POINT` | one exact source coordinate row | point has no biological radius |
| `DER_RADIUS_SURFACE` | deterministic open frusta from authorized radii | derivative is not observed membrane |
| `INF_REFERENCE_GEOMETRY` | pinned-atlas display derivative | reference geometry is not measurement or registration |
| `SCH_PATH` | non-anatomical evidence-organizing path | path is not observed connectivity |
| `SYN_DATA_GLYPH` | non-cell literature or injury-state glyph | glyph is not a soma, cell or density estimate |
| `UNAVAILABLE` | no admitted object-level geometry | render zero biological primitives |

Seven bound routes cover reference anatomy, population evidence, the legacy morphology lens, the independent `NMO 109021` morphology, the MICrONS cell+nucleus reference, the internal-evidence audit and the Ronzano premotor positions.

Every scientific scene object must expose machine-readable runtime metadata for:

- stable ID;
- representation state;
- source frame;
- source version;
- source-receipt SHA-256;
- cell-morphology claim;
- project registration count;
- cross-source identity count.

Co-display, camera changes and selection do not create an identity, coordinate join or registration.

## Internal-detail correction

`data/cross-region-internal-reference-0.1.json` now declares:

- `authority: UNAVAILABLE_OBJECT_GEOMETRY`;
- `renderedPrimitiveCount: 0`;
- `missingEvidencePolicy: zero_primitives`;
- `sourceDerivedGeometryCount: 0`;
- `registrationCount: 0`.

Neuronal envelope, nucleus, mitochondria, neurite continuity and synaptic-contact context remain vocabulary references with `rendered: false`. Spheres, capsules, tubes, boxes and other procedural biological proxies are explicitly prohibited when no object-level source geometry has been admitted.

The exact MICrONS visual-cortex cell segmentation and linked nucleus remain available in their separate observed-reference route. They are never attached to a spinal morphology and do not authorize a spinal membrane, nucleus, organelle set or registration.

This behavior supersedes the rendered schematic cutaway described in the historical iteration 2.20 implementation note; that earlier document remains unchanged as a record of the previous state.

## Interface changes

- A quick action opens the exact `NMO 109021` route directly.
- Source, integrity, slice-thickness and soma-standardization warnings accompany the route.
- The structure panel exposes representation authority, route state, source frame, source version, checksum receipt and prohibited claims.
- The internal route is now a compartment-evidence audit rather than an illustrated cell cutaway.
- The footer labels the workspace as unpackaged research iteration 2.24.

## Next public-data gates

The machine-readable research queue now contains 111 milestones, `UPG-022` through `UPG-129`.

- `UPG-126`: evaluate additional mouse dorsal-horn subtype morphologies as independent, checksum-pinned routes; do not create a representative composite.
- `UPG-127`: evaluate one zebrafish V3 axon-only record as a species- and neurite-domain-bounded independent route.
- `UPG-128`: evaluate published rat cervical 2D serial-EM imagery as texture-only evidence; do not extrude a 2D image into 3D anatomy.
- `UPG-129`: continue searching for a genuinely open mouse-spinal same-cell internal dataset. Admission requires raw 3D data, object segmentation, stable cell identity, sufficient rights and exact receipts. Until then, internal geometry remains at zero primitives.

## Validation boundary

The 2.24 manifest locks twenty authoritative inputs. Its canonical `manifestContentSha256` is `dee49a706f7bbbf2940fc52ce9c9632313858f7f76f5080af15450ad015a8bcd`.

Completed automated checks:

- `npm test`: passed; 376 tests, 374 passed, zero failed and two intentional historical-release skips;
- production build and lint: passed; the build retains a non-failing large-chunk advisory;
- route/schema/receipt validation: passed for `NMO 109021`, with 2,790 nodes, 2,789 edges, zero internal primitives and zero registrations;
- evidence-aware representation validation: passed for nine states and seven routes, with zero primitives on unavailable routes and zero registrations;
- internal-reference validation: passed for five non-rendered vocabulary classes, zero rendered primitives and zero registrations;
- SSR coverage: 33/33 states passed, including the independent `NMO 109021` radius route and the zero-primitive internal audit;
- morphology traversal stress test: a 20,000-node deep source-local chain completes iteratively without recursive stack overflow while preserving the existing preorder analysis semantics;
- `npm run test:frozen-2.8`: passed; the unchanged 141-file archive retains ZIP SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`.

Browser automation and screenshot comparison were not authorized for this iteration and therefore are not claimed as completed visual QA. The frozen `2.8.0-curator.1` archive remains unchanged and outside this working-tree release.
