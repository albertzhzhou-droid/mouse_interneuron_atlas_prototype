# Research iteration 2.18 — evidence-gated morphology fidelity

Date: 2026-08-30  
Status: unpackaged localhost research iteration  
Policy: public/open digital sources only; no OHRI data, images, specimens or unpublished records

## Outcome

Iteration 2.18 replaces a single visually ambiguous cell-form display with three explicit evidence states:

1. **Observed SWC** — checksum-verified standardized source-local coordinates, topology and source types. Constant-width strokes are viewer aids, not anatomical caliber.
2. **Radius-derived surface** — a deterministic open six-sided tapered frustum for each non-zero SWC edge, using the exact source-authorized radius at each endpoint after the declared uniform display transform. This is a display derivative, not an observed membrane, soma contour or measurable biological surface.
3. **Same-specimen internal structure** — unavailable and disabled. The five specimens have no linked membrane segmentation, nucleus, organelles, boutons, receptor distribution, synapse reconstruction or ultrastructure; the renderer creates zero substitute primitives.

The authoritative machine contract is `data/morphology-fidelity-contract-0.1.json`; its strict conditional schema and independent validator reject a surface for an official `No Diameter` record and reject any same-specimen internal-structure claim.

## Five main-scene exemplars

| NeuroMorpho record | Nodes / edges | Official diameter authority | Radius-derived surface | Axon evidence | Same-specimen internal detail |
|---|---:|---|---|---|---|
| 104003 | 109 / 108 | Diameter; radius 0.120–5.391 µm | available | no source type 2 | unavailable |
| 108974 | 1,801 / 1,800 | Diameter; radius 0.055–4.742 µm | available | no source type 2 | unavailable |
| 109005 | 10,314 / 10,313 | Diameter; radius 0.075–5.209 µm | available | 3,249 type-2 nodes; axon only moderate, not complete | unavailable |
| 242822 | 4,515 / 4,514 | **No Diameter** | unavailable; placeholder CNG radii ignored | no source type 2 | unavailable |
| 260150 | 1,297 / 1,296 | **No Diameter** | unavailable; placeholder CNG radii ignored | no source type 2 | unavailable |

All five remain `OBS_STANDARDIZED_SOURCE_LOCAL`, unregistered and unrelated to the selected SCI evidence entity or any molecular population. Their five geometry objects and raw SWCs are pinned by byte count and SHA-256. The renderer verifies the selected geometry before creating a scene object and provides no fallback after a mismatch.

The full 142-record Research Explorer morphology lane now exposes the same authority boundary: 94 records report diameter and permit a radius derivative after verification; 48 report `No Diameter` and remain centerline-only. Every dossier carries explicit observed-membrane and same-specimen-internal-structure gaps.

## Runtime and export integrity

The main viewport reports requested and actual morphology state separately:

- requested neuron and mode;
- selected asset and geometry SHA-256;
- `loading`, `verified`, `unavailable` or `failed` verification;
- `rendered` versus `not_rendered` scene-object state;
- visible versus hidden layer state;
- actual mode and derived algorithm ID;
- explicit no-fallback reason.

JSON and CSV exports retain this runtime receipt. PNG disclosure is based on actual verified/rendered/visible state, not only the requested control value. A hidden, failed, unavailable or still-loading morphology is not labelled as a visible verified cell form.

## Parameter and risk audit

| Decision or assumption | Evidence state | Risk | Iteration decision |
|---|---|---:|---|
| SWC coordinates/topology identify the deposited source-local reconstruction | directly pinned and checksum verified | low | use as observed input |
| Source radii authorize display thickness | available for 94/142 census records and 3/5 scene exemplars; explicitly absent for the others | medium if ignored | hard gate surface creation on official diameter metadata |
| A tapered tube is the biological membrane | unsupported | high | prohibit the claim; mark measurement forbidden |
| Numeric radii in a standardized file whose official record says `No Diameter` are measured caliber | unsupported | high | ignore them and render zero surface primitives |
| Same-cell internal structure can be filled from a generic neuron model | unsupported | critical | no-go; disabled unavailable mode |
| One public mouse spinal object joins full morphology, transcriptomic type, spinal position, synapses and organelles for the same cell | not found in the audited public routes; this is an inference across source modality boundaries | high | no-go until a stable same-cell linkage object passes UPG-090 |
| Root-centred uniform display scaling is a biological registration | unsupported | high | disclose as a viewer-only transform; retain `0 REG` |

## Public-source routes for future detail

- [NeuroMorpho.Org terms](https://neuromorpho.org/useterm.jsp): continue source-local SWC expansion under original-paper, RRID and resource attribution. This is the first priority because it improves real morphology without cross-source invention.
- [Brain Image Library 10.35077/g.1196](https://doi.brainimagelibrary.org/doi/10.35077/g.1196): possible adult spinal Xenium/projectome lane. It is spatial/projectome evidence, not whole-cell morphology or EM, and projection neurons must remain outside interneuron counts. File-level objects, hashes and CC BY-SA 4.0 handling remain prerequisites.
- [Super-CLEM GlyR](https://doi.org/10.6084/m9.figshare.17816747.v1) and its [primary paper](https://elifesciences.org/articles/74441): possible separate synapse-scale viewer. It cannot be attached to a selected NeuroMorpho cell or generalized to all inhibitory interneurons.
- [BioImage Archive S-BSST609](https://www.ebi.ac.uk/biostudies/bioimages/studies/S-BSST609): possible separate dorsal-horn tissue-context viewer after channel, voxel, specimen, checksum and rights audit. It is not intracellular anatomy.
- [BICCN mouse MOp Patch-seq](https://biccn.org/science/cell-census-primary-motor-cortex) and [Gouwens et al.](https://doi.org/10.1038/s41586-021-03950-0): same-cell multimodal schema/QC reference only. Cortex cannot populate a spinal cell.
- [MICrONS](https://tutorial.microns-explorer.org/index.html) and OpenOrganelle: cross-region educational references only. Visual-cortex synapses or non-spinal organelles cannot become the inside of a spinal interneuron.

These routes are queued as UPG-088–097. The relationship vocabulary planned in UPG-097 defaults every cross-source combination to `co_display_only` unless stable source evidence proves `same_physical_object` or `same_source_population`.

## Acceptance evidence

- Morphology-fidelity JSON Schema and semantic validator pass for five records, three authorized surfaces and zero internal-structure models.
- Mutation tests reject a radius surface for a `No Diameter` record and reject invented internal structure.
- Geometry tests verify exact endpoint radii, open topology, source-type grouping, hidden types, zero-length-edge behavior, exact pre-sized typed buffers and 32-bit index rollover.
- Research Explorer index 1.5.0 validates 397 records, including 142 morphology dossiers, 94 diameter-authorized records and 48 explicit no-diameter records, with zero registrations.
- Build and lint must pass before browser acceptance; browser results are recorded separately in `RESEARCH_ITERATION_2_18_PRODUCT_AUDIT.md`.

## Remaining limits

- UPG-091 remains in progress until every export carries a fully replayable camera, clipping, visible-layer, display-transform and renderer/build receipt; iteration 2.18 closes the misleading runtime-state portion only.
- UPG-092 remains in progress because same-specimen internal detail is correctly unavailable, not completed. A separate educational reference is permissible only with its own source and `SCH`/cross-region boundary.
- No public-source candidate currently authorizes a complete interneuron atlas, a same-cell molecular/morphology/synapse/organelle join, a connectome, prevalence, atlas registration or a treatment claim.
