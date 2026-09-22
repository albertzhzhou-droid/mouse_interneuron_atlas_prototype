# ADR-012: Keep reference anatomy, molecular types, and SCI evidence in separate coordinate lanes

**Status:** Accepted for candidate 2.8  
**Date:** 2026-08-26  
**Deciders:** Project developer; scientific admission remains subject to independent domain review

## Post-2.8 research amendments — 2026-08-26 and 2026-08-27

The Candidate 2.8 facts below remain a historical record for the frozen `2.8.0-curator.1` archive. The current working tree is a separate, unreleased research iteration; it does not reuse or rewrite the Candidate 2.8 asset identity.

The current reference asset is `allen_cord_20um:3.0:ohri-sampled-reference-v4`, sampled on 38 native transverse planes. Its major-compartment asset is `internal-compartments-v3`: 973 separate four-connected components and 975 mask-edge rings exact relative to the sampled native annotation pixels, with dorsal funiculus ID 74 explicitly missing at z=1470, 1519, and 1566. Its schema `0.2.0` `fine-anatomy-v2` asset inventory-locks 73 direct leaves represented by the pinned terminology and annotation on those sampled planes. The 37-label selected-one-at-a-time browser retains 14 laminae, 17 nuclei/columns, and 6 tracts as 2,431 components and 2,511 rings with 670 explicit missing structure-plane records. Three structural-context labels (IDs 16, 65, and 70) retain 166 components, zero missing plane records, and 387,870 sampled voxels. Thirty-three motor-context labels (IDs 28–60) retain 228 components, 1,144 missing plane records, and 51,998 sampled voxels.

Only one of the 37 fine-browser structures is selected at a time. Source identifiers and hierarchies are retained; project browser categories carry no anatomical authority. Structural context remains separate, and the motor-context lane is off by default and excluded from interneuron-focused counts. The sampled-plane asset also carries 76 pixel-exact native 322×253 RGBA overlays: a combined browser-plus-structural overlay and a separate motor-context overlay for each plane. That sampled asset does not infer a surface. Descendant expansion, procedural filling, sub-voxel claims, geometry measurement, independent validation, and registration remain forbidden. Atlas-region counts are not interneuron, cell, or type counts.

The 2026-08-27 bounded increment now uses the separate sibling asset `allen_cord_20um:3.0:native-volume-direct-label-surfaces-v2` for all 73 represented direct source labels in explicit 37-study-region, three-structural-landmark and 33-motor-context lanes. Its manifest SHA-256 is `d77b526acc6a80326f75ba3131e885f9d7841b5d01b184daa3651a48f1e85c20`, and it pins the full `[1567, 253, 322]` annotation volume by semantic SHA-256 `1e5ee2daaeabd3505572f5efdb92e700387f7bd794720e78ec21511338500d12`. Across the 73 labels, 38,845,542 exact-identifier voxels are retained as 52,062 row runs and losslessly represented by 214,841 exposed voxel-face rectangles / 429,682 browser triangles. An independent set oracle expands all 11,138,364 unit faces and reports zero missing or extra faces. The browser loads one selected label lazily, and every record is excluded from interneuron counts.

The new surfaces are exact only relative to the pinned source voxel grid. They use an explicit voxel-edge transform and perform no interpolation, smoothing, decimation, hole filling, descendant expansion, component filtering, topology modification, or manual completion. They remain `INF`, measurement-forbidden, and `0 REG`; they create no cell position, laminar membership, named spinal segment, molecular identity, connectivity, biological count, or independent-validation claim. The set oracle is independent of the production rectangularizer but audits the same source mask, so it is a computational fidelity test rather than independent biological validation.

These amendments retain UPG-025 as the completed historical 37-browser milestone and implement bounded slices of UPG-037. A full audit of the 1,567 native planes found 32 contiguous z-wise annotation-state runs; the previous 33-plane research grid represented 27, while added planes z27, z77, z172, z811, and z1106 raise coverage to 32/32. Annotation-state runs are not spinal segments, specimens, independent sections, or new biological observations. Full-volume context coverage is now implemented, but interpolation sensitivity and genuinely independent anatomical error work remain incomplete, so measurement and geometry-comparison claims stay closed. Reference anatomy remains `INF`, the other coordinate lanes remain separate, and project registration count remains zero.

## Context

The earlier 3D view used a procedural outer cord and a hand-authored gray-matter silhouette. Candidate 2.8 replaces them with a version-pinned derivative of the adult mouse `allen_cord_20um` atlas: 15 native transverse planes, an outer-cord contour, a coarse gray-matter row-envelope, source hashes, coordinate matrices, and an explicit `INF` / measurement-forbidden contract. The row-envelope is an older display approximation, not a full gray boundary.

Candidate 2.8 also derives seven atlas-source-ID major internal structures directly from the pinned annotation masks: dorsal horn (90), central spinal cord (100), ventral horn (110), central canal (16), dorsal funiculus (74), lateral funiculus complete (75), and ventral funiculus (70). The payload preserves 408 separate 4-connected components and 408 exact mask-edge polygons across 15 ordered plane records per structure. Dorsal funiculus ID 74 at z1470 is explicitly missing because its source mask is absent at that plane.

The project also contains two other non-equivalent evidence lanes. Russ et al. 2021 supplies a postnatal molecular taxonomy with 69 neural populations, 65 of which this project displays as non-motoneuron interneuron/projection-neuron candidates. They are not 65 confirmed interneurons. The SCI Research MVP contains five population-level entities and two state overlays supported by condition-bounded mechanistic evidence. Neither lane supplies a validated transform into the atlas derivative, and marker overlap does not establish same-cell identity.

Primary reference records are the [Allen Mouse Spinal Cord Reference Atlas documentation](https://brain-map.org/support/documentation/mouse-spinal-cord-reference-atlases), the [BrainGlobe `allen_cord_20um` atlas listing](https://brainglobe.info/documentation/brainglobe-atlasapi/usage/atlas-details.html), and the [Russ harmonized taxonomy](https://www.nature.com/articles/s41467-021-25125-1) with [GEO GSE158380](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE158380).

## Decision

Candidate 2.8 uses three deliberately separate lanes:

1. **Reference anatomy (`INF`)** — loft the bundled outer-cord and coarse gray-matter row-envelope contours in their declared atlas-derived display frame. The viewer may interpolate those two older surface contours between the 15 sampled planes for display continuity, but the gray-matter row-envelope is not a full gray boundary. The seven internal structures render only as plane-local line segments using a seven-color project display-only palette keyed to preserved source IDs. Display colors carry no source/anatomical authority; each exact source color is retained in `userData`. Internal components are never lofted, filled, joined, manually bridged, or treated as cross-plane-corresponded objects. No reference anatomy exposes measurement, named segment assignment, cell placement, or a registration claim.
2. **Molecular type landscape (`TYPE_LEVEL`)** — expose all 65 Russ non-motoneuron interneuron/projection-neuron candidates as a first-class searchable information view, while retaining the four non-candidate populations as source context. These are candidates, not 65 confirmed interneurons. Type labels remain unplaced and all cross-study identity mappings remain non-exact.
3. **SCI evidence entities (`SYN` geometry, `SCH` pathways)** — keep the seven condition-linked entities and state overlays in their schematic evidence lane. Visual co-display with reference anatomy does not establish a shared coordinate system.

If the bundled contour payload fails validation or loading, the main viewer hides reference anatomy. It does not substitute a synthetic shape that could be mistaken for reference-derived anatomy.

Finer structures such as individual Rexed laminae, named nuclei, and tracts may enter the 3D model only after a version-pinned extraction from the source annotation volume preserves atlas identifiers, provenance, transforms, missingness, and validation. They will not be inferred from the coarse gray-matter row-envelope or from the current major-compartment lines.

## Options considered

| Option | Reference fidelity | Scientific inference risk | Runtime / bundle cost | Decision |
|---|---:|---:|---:|---|
| Retain and visually polish the procedural scaffold | Low | High: polish could imply anatomy that is not sourced | Low | Rejected |
| Render the full raw atlas volume immediately | Highest potential detail | Medium: still not a cell registration and needs stronger asset/performance controls | High | Deferred |
| Loft the already bundled, checksum-locked outer-cord and coarse gray-matter row-envelope contours | Moderate and traceable | Low when retained as `INF`, measurement-forbidden, and not described as a full gray boundary | Low | Accepted |
| Render seven source-ID internal masks as plane-local exact-edge lines without lofting, filling or joining | High at the sampled mask edges; no cross-plane continuity claim | Low when missingness and component separation are retained | Moderate | Accepted |
| Lazily render one selected lossless exposed voxel-face surface from 73 direct labels partitioned into study-region, structural-landmark and motor-context lanes | Exact to the source voxel grid for those identifiers; not sub-voxel or independently biologically validated | Low when lane roles, non-count policy, no-geometry-operations policy and measurement prohibition are enforced | Moderate | Accepted for the post-2.8 UPG-037 slice |
| Place the 65 non-motoneuron molecular candidate populations or seven SCI entities inside the reference anatomy by marker/region similarity | Unsupported | Critical: creates false identity and coordinate joins | Low | Rejected |
| Keep reference, type, morphology, and SCI evidence in separate pages only | Clear boundaries | Low | Low | Rejected as the sole design because it leaves the main 3D model artificially empty |

## Trade-off analysis

The accepted outer-cord and coarse row-envelope loft is materially more faithful than procedural geometry and is feasible offline, but it is not a full-resolution segmentation. Interpolation between 15 sampled planes improves those two surfaces’ visual continuity, not anatomical certainty. Internal line rendering provides reference-backed detail without asserting continuity: 408 plane-local components remain separate, including bilateral and disconnected masks, and one missing plane remains empty. Co-display improves orientation but increases the chance that a viewer assumes registration, so the UI, export disclosure, legend, layer names, and data contracts must repeat the non-registration boundary.

In the post-2.8 research tree, exact exposed-face rectangularization is preferred over marching-cubes smoothing for the 73-label native-volume slice because every rendered face can be reconstructed from the exact mask runs and independently reconciled at the unit-face level. The cost is visibly voxelized geometry and no sub-voxel claim; that cost is accepted because smoothing or decimation would add an unsupported anatomical boundary and complicate mask-to-surface fidelity.

## Consequences

- The main anatomy becomes reference-driven and visibly labeled `INF`; the synthetic cord and hand-drawn butterfly are removed.
- The package continues to contain zero `REG` objects and forbids measurement from the display loft.
- The 65 Russ non-motoneuron interneuron/projection-neuron candidates become discoverable without being manufactured as 3D points or called 65 confirmed interneurons.
- Dorsal/central/ventral gray regions, central canal, and dorsal/lateral/ventral funiculi are visible only as plane-local lines using project display colors keyed to preserved source IDs. Display colors carry no source/anatomical authority; exact source colors remain metadata in `userData`. The structures are not meshes, fills, or cross-plane objects.
- The present release still lacks individual lamina, named-nucleus, and tract geometry. Those gaps remain explicit rather than being filled procedurally.
- Any future mapping across anatomy, taxonomy, morphology, injury data, or causal entities requires its own versioned evidence and validation decision.

## Candidate 2.8 action items

- **UPG-022 — complete:** Ship the reference-derived outer-cord and coarse gray-matter row-envelope loft in the main viewer with load-failure, provenance, and export disclosures.
- **UPG-023 — complete:** Ship the first-class 65-candidate Type Landscape and multi-source knowledge-coverage matrix while retaining the non-motoneuron interneuron/projection-neuron candidate boundary.
- **UPG-024 — complete:** Extract seven atlas-ID-preserving major compartments from the pinned annotation volume and render them as project-display-color plane-local lines keyed to preserved source IDs. Display colors carry no source/anatomical authority, exact source colors remain in `userData`, and there is no loft, fill, join, manual bridge, or cross-plane correspondence.
- **UPG-025:** Evaluate individual lamina, named-nucleus, and tract geometry only where the source annotation carries those identifiers; report unsupported planes as missing.
- **UPG-026:** Increase transverse sampling density and quantify interpolation sensitivity before enabling any geometry comparison.
- **UPG-027:** Benchmark cross-study molecular label reconciliation without producing exact identity or spatial placement by default.
- **UPG-028:** Assess the public SpinalTRAQ cervical population template as a separate future reference after asset-level rights, scope, and coordinate compatibility review.

## Post-2.8 action items

- **UPG-025 — complete historical milestone:** Keep the source-ID 37-structure fine-anatomy browser checksum-locked, selected-one-at-a-time, missingness-preserving, measurement-forbidden, and separate from interneuron-type identity; its inventory-complete 73-direct-leaf sampled-plane expansion is tracked under UPG-037.
- **UPG-026 — in progress:** Retain the 38-plane, 32/32 annotation-state-run coverage grid while designing sensitivity tests. Do not call a same-source withheld plane independent validation or enable geometry comparison from sampling coverage alone.
- **UPG-037 — in progress:** The sampled-mask and sibling lazy full-native-volume exact-mask/voxel-face slices are implemented for 73 direct leaves in separate 37-study-region, three-structural-landmark, and 33-default-off-motor-context lanes. An independent unit-face set oracle reports zero missing/extra faces. A genuinely independent anatomical benchmark remains future work.
- **UPG-038 — research watch:** Treat Allen P56 plate comparisons as same-source concordance and sensitivity checks, not independent validation or authority for named C1–S3 assignments.
- **UPG-029–036 — research watch/planned:** Prioritize public spatial-object inventory and transform validation, morphology coverage, and multi-study taxonomy/context lanes under the no-join default recorded in the research-model upgrade queue.
