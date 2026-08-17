# Phase 1 benchmark and prototype scope

Snapshot date: 2026-08-17

Release target: `ohri-mouse-interneuron-feasibility-0.1.0`

## Decision

The first release is an adult-mouse evidence atlas feasibility prototype. It is not a literal reconstruction of every spinal interneuron. The prototype proves that a researcher can move between a whole-cord orientation scaffold, a transverse orientation view, an entity list, an evidence card, a source, and an explicit boundary without treating a synthetic glyph as an observed cell.

The species is fixed to *Mus musculus* (`NCBITaxon:10090`). Rat, zebrafish and human results are excluded from model geometry. They may appear only as explicitly separated methodological or translational context.

## Comparable systems and parameters

| Resource | Current parameter/structure used for the decision | Prototype mapping | Hard boundary |
|---|---|---|---|
| [BrainGlobe `allen_cord_20um`](https://brainglobe.info/documentation/brainglobe-atlasapi/usage/atlas-details.html) | Adult mouse C1-S3; one available anisotropic resolution, **20 x 10 x 10 µm**; template, annotation volume, hierarchy and meshes | Production atlas import target; scaffold/source metadata contract | The current renderer is procedural `SYN` geometry and does not bundle or claim registration to the volume |
| [SpinalJ / SpineRacks](https://pmc.ncbi.nlm.nih.gov/articles/PMC8605391/) | Adult mouse C1-S3; 1,302 registered source sections at 25 µm; Fiji/ImageJ registration and region/lamina quantification | Whole-cord acquisition, offline registration and validation workflow | The 25 µm source sections must not be confused with BrainGlobe's resampled 20 x 10 x 10 µm atlas |
| [Neuroglancer](https://github.com/google/neuroglancer) | Three orthogonal cross-sections plus independent 3D view; meshes, skeletons, annotations; precomputed, N5, Zarr v2/v3 and OME-Zarr 0.4/0.5; WebGL2 + WebWorker data path | Layer model, synchronized 3D/slice interaction, shareable state and future streaming architecture | Neuroglancer is a viewer, not a source of cell identity, registration or biological truth |
| [NeuroMorpho.Org](https://neuromorpho.org/apiReference.html) | Searchable neuron metadata, morphometry and SWC; local specimen coordinates, correction and physical-integrity fields | Future `morphology_asset` and SWC completeness/QC schema | An SWC can be a representative local-frame reconstruction; it cannot be placed in atlas space without a validated transform |
| [Allen Mouse Spinal Cord Atlas](https://mousespinal.brain-map.org/spinal/common/content/Overview.pdf) | P4/P56 male C57BL/6J; ~17,000 genes; 20 µm transverse sections; adult gene sampling roughly every 2 mm; 34 reference levels and 80+ structures | Marker/ISH evidence link and future section anchors | Sparse 2D ISH from different animals is not continuous cell-resolved 3D expression |
| [SPARC organ scaffolds](https://docs.sparc.science/docs/organ-scaffolds) | Material coordinates, fiducials, specimen-to-scaffold mapping, ontology annotation and transform provenance | Coordinate-space, transform and provenance records | No generic SPARC mouse spinal-cord scaffold is used as source anatomy |
| [Fish1](https://fish1-release.storage.googleapis.com/index.html) | One 7 dpf zebrafish; 4 x 4 x 30 nm raw EM; 187,053 cell bodies; ~30 million synapses; versioned materialized tables and on-demand skeletons | Stable biological ID vs mutable segmentation ID, versioned-query and proofreading concepts | No zebrafish anatomy, taxonomy, counts or connectivity is transferred to adult mouse |

The machine-readable copy of this table is in `data/benchmark-snapshot-2026-08-17.json`.

## Prototype content

The seven displayed records intentionally do not form one mutually exclusive taxonomy.

| Entity | Classification axis | Ledger | Endpoint | Spatial rendering |
|---|---|---|---|---|
| Propriospinal relay neurons | Projection/connectivity | P02 | Locomotion | Synthetic soma + schematic detour path |
| dI3 glutamatergic interneurons | Developmental lineage + transmitter | P03 | Locomotion | Synthetic glyph in a region-level lumbar context |
| SC^Vsx2::Hoxa10 | Molecular + spatial identity | P09 | Locomotion | Synthetic glyph; source spatial evidence is not copied into the prototype |
| V3 interneurons | Developmental lineage | P14 | Spasm | Synthetic sacral glyph + schematic commissural path |
| Ipsilateral cervical V2a neurons | Lineage + projection | P16 | Breathing | Synthetic cervical glyph + schematic ipsilateral path |
| Vgat+/KCC2-sensitive state | Neurotransmitter/intervention state overlay | P05 | Locomotion | Synthetic wireframe overlay; not a cell family |
| vGlut2-lineage transmitter switching | Lineage/injury-age/transmitter state overlay | P08 | Locomotion | Synthetic wireframe overlay; neonatal and adult evidence not pooled |

## Coordinate and rendering contract

- Coordinate-space ID: `prototype_schematic_v0`.
- Right-handed scene: `+X` anatomical right, `+Y` dorsal, `+Z` rostral.
- Cord range: `z = -20...20 schematic_unit`.
- The UI deliberately uses `sch.u.` and never presents these values as measured millimetres or micrometres.
- Cord surface: 64 longitudinal x 32 radial segments; no shadows or post-processing.
- Renderer pixel ratio is capped at 1.75.
- Scaffold, gray-matter orientation and entities are separate layers.
- Every entity glyph is `SYN`; every displayed pathway is `SCH`.
- Transmitter color uses a color-vision-safe scheme: excitatory blue, inhibitory vermillion, mixed purple and state-dependent magenta.
- Evidence is encoded with text badges and line style, not color alone.

## Technical structure

```text
data/atlas-release-0.1.json
        │
        ├── filters / URL state / export ── React client
        │
        ├── evidence and benchmark panels ─ semantic HTML
        │
        └── synthetic geometry ──────────── Three.js WebGL2
                                               │
                                               └── accessible list + CSS slice fallback
```

The feasibility renderer uses native Three.js to avoid importing a full volumetric viewer before any source volume is bundled. A production atlas should replace the procedural scaffold with a version-pinned BrainGlobe/OME-Zarr release and adopt Neuroglancer-style chunking, workers and shareable viewer states.

## In scope

- Adult mouse only.
- One whole-cord schematic orientation scaffold.
- Seven source-linked entities/overlays.
- Search and filters for transmitter, segment, endpoint and injury model.
- Four camera presets, orbit/zoom, transverse-plane slider and 2D orientation inset.
- Layer visibility controls.
- Evidence card with allowed claim, not-established boundary and negative findings.
- Benchmark panel, versioned URL state and JSON export.
- WebGL failure fallback with the full semantic entity list.

## Out of scope

- Cell census, connectome or exact soma coordinates.
- Imported BrainGlobe volumes, OME-Zarr, meshes or NeuroMorpho SWCs.
- The full Russ 69-population taxonomy.
- Automatic morphology or connection completion.
- Effect-size meta-analysis, electrophysiology simulation or EES field simulation.
- Human causal inference, clinical advice or treatment recommendation.
- User uploads, persistent curation and collaborative annotation.

## Next data gate

Before the renderer may display any `OBS` or `REG` object, the relevant release must provide the source accession, license, native coordinate space, target coordinate space, transform, registration error, interpolation method, checksum and dual-curator review. Missing values must remain `null + missing_reason`; they cannot become zero coordinates.
