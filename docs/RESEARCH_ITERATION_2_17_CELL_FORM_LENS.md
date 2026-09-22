# Research iteration 2.17 cell-form lens

Status: **completed** on 2026-08-27  
Scope: the public-data-only main 3D workspace. This iteration separates literature evidence, observed cell form, atlas anatomy and schematic paths; it does not create cluster-specific morphology, same-cell multimodal identity or atlas registration.

## Outcome implemented

Iteration 2.17 removes the visual implication that a sphere-like SCI evidence glyph is an observed interneuron. The SCI literature lane now uses visibly non-cell population-evidence nodes, while a separate cell-form lens displays one of five checksum-pinned NeuroMorpho reconstructions in its own source-local frame.

The two lanes may be visible at the same time for research comparison, but they remain unrelated evidence objects. Selecting an SCI entity does not choose its morphology; selecting a NeuroMorpho record does not assign it to a molecular profile, an SCI entity, an atlas region or a pathway.

This iteration adds observed soma/neurite form where the source supports it. It does **not** add cellular organelles, membrane ultrastructure, boutons, verified synapses, complete axon trajectories or a cytological interior model.

## Geometry-authority contract

| Visible object | Authority | What the geometry may communicate | What it must not communicate |
|---|---|---|---|
| SCI population-evidence node | `SYN` | A selectable literature evidence entity and its declared evidence fields | An observed cell, soma, dendrite, axon, prevalence, molecular type or same-cell identity |
| NeuroMorpho cell form | `OBS` | Source-observed segment geometry, retained neurite-domain codes, dimensionality and physical-integrity boundary in a standardized local frame | Atlas position, laminar membership, cluster/SCI identity, complete projection, synapse, prevalence or a representative type shape |
| Adult spinal-cord reference anatomy | `INF` | A checksum-pinned atlas-derived display scaffold and its declared source labels | Observed cell placement, cell membership, an independent anatomical measurement or a registration |
| Evidence/path overlay | `SCH` | The declared schematic relationship class used by the literature model | A traced axon, observed synapse, complete connectivity route or measured distance |

The project registration count remains **0**. The exact molecular/SCI↔morphology identity count remains **0**. No object crosses authority classes because of visual proximity, shared color, simultaneous visibility or user selection.

## Admitted observed-form slice

The 2.17 main-scene lens is bounded by `data/observed-cell-form-lens-0.1.json` and the existing validated derivative `/data/neuromorpho_release_8_6_124/morphology-lines.json`.

| Receipt field | Frozen value |
|---|---|
| NeuroMorpho release | `8.6.124` |
| Repository identifier | `RRID:SCR_002145` |
| Reuse boundary | CC BY 4.0 plus NeuroMorpho.Org use terms and original-paper attribution |
| Cell-form derivative bytes | `984826` |
| Cell-form derivative SHA-256 | `6ba511fb2eb4dc23c20f4415c079cebe5bab565279f63fc72dc1c98ee6bd4330` |
| Asset-manifest SHA-256 | `4ee24a35b282376ee507c0218806671b9c9f6f18c820d2ffaa298a53162a8647` |
| Display frame | `NeuroMorpho_CNG_standardized_local_frame` |
| Display transform | Soma-centred uniform viewer scale retained from the validated derivative |
| Registration status | `unregistered` for every record |

| NeuroMorpho ID | Source-linked phenotype label | Reconstruction domain | Physical-integrity statement | Segments |
|---:|---|---|---|---:|
| `104003` | Dynorphin-expressing inhibitory interneuron | Dendrites, Soma, No Axon | Dendrites Moderate | 108 |
| `108974` | Substance P-expressing excitatory interneuron | Dendrites, Soma, No Axon | Dendrites Complete | 1,800 |
| `109005` | GRP-expressing excitatory interneuron | Dendrites, Soma, Axon | Dendrites & Axon Moderate | 10,313 |
| `242822` | Substance P-expressing radial excitatory interneuron | Dendrites, Soma, No Axon | Dendrites Complete | 4,514 |
| `260150` | NPFF-positive vertical excitatory interneuron | Dendrites, Soma, No Axon | Dendrites Complete | 1,296 |

`No Axon` describes the deposited reconstruction domain and is not evidence that the biological cell lacked an axon. The one axon-containing exemplar is moderate, not complete. The five records are phenotype-stratified exemplars selected for inspection; they are not a representative morphology sample, a frequency estimate, a type census or independent-animal evidence.

## Molecular and SCI identity boundary

No observed reconstruction in this lens is assigned to a Russ, Sathyamurthy, Hayashi, Häring or Matson source-population record. None is assigned to any of the seven SCI evidence entities. A shared marker or phenotype word can support a search result or candidate review note, but it cannot create:

- a same-cell link;
- an exact same-type link;
- transfer of injury state or causal function;
- atlas placement or laminar membership;
- projection or synaptic connectivity;
- a complete-cell or complete-axon claim.

The information page and export must state this boundary beside the cell-form selector rather than relying on color or a global legend.

## Required viewport and export disclosure

Each saved viewport or image export should have a companion machine-readable receipt containing at least:

- selected NeuroMorpho object ID, source-paper identifier and geometry hash;
- selected SCI evidence object, when present, as a separate record with `SYN` authority;
- visible `INF`, `OBS`, `SYN` and `SCH` layers;
- camera pose, clipping state, viewport size and selected display mode;
- soma-centering/uniform-scale display transform and source coordinate frame;
- dimensionality, neurite domain and physical-integrity statement;
- renderer/build identity and timestamp;
- `projectRegistrationCount: 0` and `exactCrossSourceIdentityCount: 0`;
- a statement that display coordinates are not atlas measurements.

A screenshot without this receipt remains useful as an illustration but is not a reproducible research view. The receipt does not turn source-local viewer coordinates into registered anatomy.

## 2.17 acceptance gates

Iteration 2.17 was accepted against the following gates:

1. SCI evidence entities are rendered as visibly non-cell nodes and no sphere/soma/arbor language remains attached to those `SYN` geometries.
2. The five `OBS` records load only from the checksum-validated derivative, retain source ID/domain/integrity metadata, and fail closed when the payload or declared hash is invalid.
3. The observed-form layer and selected record are URL-addressable, survive state export/import, and do not modify the selected SCI entity.
4. Co-display creates no raycast, state, label or export relationship between `OBS` and molecular/SCI records.
5. The workspace and information page display `SOURCE-LOCAL`, `UNREGISTERED`, `0 REG` and no-type/no-entity-link language at the point of use.
6. Desktop and mobile verification covers selector usability, WebGL rendering, responsive overflow, URL persistence and point-of-use/export disclosure; a fully replayable camera/renderer receipt remains UPG-091.
7. Automated tests reject authority-code drift, invented identity, nonzero registration, unadmitted record IDs, altered source hashes and any claim that a moderate/absent reconstructed axon is complete biological anatomy.

Validation evidence:

- `npm run test:research`: 266 tests, 264 passed, 2 intentionally skipped, 0 failed.
- `npm run test:frozen-2.8`: frozen 141-file curator package passed unchanged; 0 REG; ZIP SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`.
- Desktop browser verification: 1440 × 1000, checksum-loaded OBS geometry, selector and layer toggle persisted in the URL, no current console warnings/errors and no horizontal overflow.
- Mobile browser verification: 390 × 844, no horizontal overflow; overlapping provenance overlays found in the first pass were removed from the compact scene while the full source/relationship card remains immediately below it.
- Current visual receipts: `output/iteration-2.17-cell-form-lens-desktop-1440x1000.png`, `output/iteration-2.17-cell-form-lens-nmo260150-desktop-1440x1000.png` and `output/iteration-2.17-cell-form-lens-mobile-390x844.png`.

## Next evidence-gated upgrades

- **UPG-088 — broader licensed NeuroMorpho census:** the exact NeuroMorpho 8.6.124 query criteria `species:mouse` + `brain_region:spinal cord` + `cell_type:interneuron`, with no age-classification filter, return 1,097 repository records across 12 source papers. The source-repository audit partitions them into 1,058 3D and 39 2D records; 916 of the 3D records report diameter and 142 do not; 253 records include axon in the deposited domain, but none supports a complete-axon claim. Admission still requires a pinned query snapshot, direct-object checksums/QC, original-paper attribution and explicit dimensionality/domain/integrity fields. The 1,097 records are not 1,097 biological types, independent animals, representative sampling or molecular/SCI identity links.
- **UPG-089 — public image-volume segmentation:** segment only exact, rights-cleared source volumes with voxel/axis/acquisition metadata, raw-to-derived receipts, method version and uncertainty. A tissue-density or soma volume is not automatically neurite or intracellular geometry.
- **UPG-090 — same-cell morphology–transcriptomics:** admit a relationship only when a public primary dataset supplies stable same-cell/specimen identifiers and an auditable modality-linkage object. Marker similarity, co-location or cells from one paper are insufficient.
- **UPG-091 — per-viewport geometry receipts:** pair each viewport/image export with replayable renderer, camera, layer, source-object, transform, integrity and authority metadata while preserving `0 REG` and zero exact cross-source identities.
- **UPG-092 — geometry evidence modes:** separate source-observed SWC topology from deterministic radius-derived surfaces and from explicitly generic educational internal structure; never fabricate caliber or observed membrane.
- **UPG-093 — spinal synapse nanoscale lane:** audit and admit the CC BY Super-CLEM GlyR source objects as a separately accessed glycinergic-synapse viewer with source denominators and no automatic attachment to a whole cell.
- **UPG-094 — cross-region educational ultrastructure:** evaluate MICrONS and OpenOrganelle assets only with visible visual-cortex/generic-tissue labels and no transfer of density, identity or geometry to spinal interneurons.

## Primary source and rights links

- [NeuroMorpho API reference](https://neuromorpho.org/apiReference.html)
- [NeuroMorpho.Org reuse terms](https://neuromorpho.org/useterm.jsp)
- [NeuroMorpho.Org](https://neuromorpho.org/)
