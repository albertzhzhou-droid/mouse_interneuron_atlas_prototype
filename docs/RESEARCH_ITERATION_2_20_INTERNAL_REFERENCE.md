# Research iteration 2.20 — focused cell form and reference-gated internal detail

Application label: `2.20.0-research.1`  
Date: 2026-08-30  
Input policy: public digital sources only; no physical specimens, OHRI internal data, unpublished institutional records, or inferred same-cell joins.

## Decision

The main-scene defect was primarily evidence hierarchy, not a missing sphere shader. The current population glyph is already an octahedral `SYN` evidence node rather than a cell, but the combined home camera allowed that small abstract node to compete with the real NeuroMorpho object. Adding a nucleus or organelles to the population glyph would have created a biologically unsupported composite.

Iteration 2.20 therefore makes two distinct improvements:

1. The default main-scene camera is now `cell_detail`, centred on the checksum-gated source-local NeuroMorpho reconstruction. Population/SCI entities remain non-cell data glyphs in a separate lane.
2. A new `internal_reference` camera displays a separate five-class teaching cutaway. It is governed by a validated `SCH_REFERENCE_ONLY` contract and cannot inherit the selected population, morphology, spinal identity, coordinates, cell type, measurement authority, or registration.

## Four structural authority states

| Mode | Visible basis | Authority | What it cannot claim |
|---|---|---|---|
| Observed SWC | Checksum-pinned NeuroMorpho coordinates, topology and source types | `OBS_STANDARDIZED_SOURCE_LOCAL` | Membrane, soma contour, atlas position, cell-type identity or complete axon |
| Radius-derived surface | Open six-sided tapered frusta from authorized source endpoint radii | `DERIVED_FROM_OBS_SOURCE_RADIUS` | Observed membrane, closed soma, internal structure or measurement-grade surface |
| Same-specimen internal structure | No admitted source | `UNAVAILABLE_FOR_SAME_SPECIMEN` | Generates zero primitives |
| Cross-region internal reference | Five schematic component classes with public-source vocabulary support | `SCH_REFERENCE_ONLY` | Source mesh, biological count/placement/scale, spinal identity, selected-cell attachment or registration |

## Reference contract

`data/cross-region-internal-reference-0.1.json` fixes:

- `relationshipToSelectedPopulation: co_display_only`;
- `relationshipToSelectedMorphology: co_display_only`;
- `samePhysicalObject: false`;
- `sourceDerivedGeometryCount: 0`;
- `registrationCount: 0`;
- `measurementUse: forbidden`;
- five schematic component classes: neuronal envelope, nucleus, mitochondria, neurite continuity and synaptic-contact context;
- four explicit non-rendered classes/claims: ER, Golgi, receptor distribution and same-specimen internal structure.

Every visible object carries `SCH_REFERENCE_ONLY` user data. Mitochondrial count, crista pattern, organelle placement, envelope shape, neurite continuation and contact geometry are illustrative. The cutaway is hidden whenever another scene mode is active; conversely, the atlas, population and source-morphology lanes are hidden while the cutaway is active.

## Public reference basis

### MICrONS Phase 1 v185.4 — cross-region vocabulary source

The official release describes a 250 × 140 × 90 µm layer 2/3 volume from a P36 male mouse visual cortex, imaged at 3.58 × 3.58 × 40 nm, with dense cell segmentation, linked nucleus information, manual mitochondria ground truth and dense synapse detection. It supports the displayed compartment vocabulary but not the shapes, counts or placements in this app. No MICrONS mesh or volume is bundled.

- Dataset: [MICrONS Phase 1](https://www.microns-explorer.org/phase1)
- Primary study: [Turner et al., Cell 2022](https://doi.org/10.1016/j.cell.2022.01.023)
- Boundary: visual cortex, not spinal cord; no selected object ID is admitted in iteration 2.20.

### Super-CLEM GlyR — independent spinal synapse context

The existing checksum-pinned Super-CLEM object remains one real two-dimensional mouse spinal dorsal-horn EM slice in a same-physical-synapse, serial 70 nm section context. It supports spinal synapse-scale context only. It is not used as cutaway geometry, its parent cell remains unresolved, and it creates zero NeuroMorpho/type/atlas joins.

- Dataset: [Figshare 17816747 v1](https://doi.org/10.6084/m9.figshare.17816747.v1)
- Primary study: [eLife 74441](https://doi.org/10.7554/eLife.74441)

### OpenOrganelle mouse hippocampus — future raw-EM lead

`jrc_mus-hippocampus-1` provides an 8 nm isotropic P7 mouse hippocampal FIB-SEM volume under CC BY 4.0. It is retained as a future exact-object inspection lead only; no segmentation or geometry from it enters the cutaway.

- Dataset: [OpenOrganelle jrc_mus-hippocampus-1](https://openorganelle.janelia.org/datasets/jrc_mus-hippocampus-1)
- Deposited object: [Janelia Figshare 24085176](https://janelia.figshare.com/articles/dataset/24085176)

## Research information surface

The right evidence rail now includes a first-class **Structure** panel ahead of comparison, gaps, sources, benchmarks and administrative review. It answers the same-specimen question first, opens the reference cutaway, lists each rendered class and its claim boundary, lists non-rendered structures with reasons, and shows region/life-stage/modality/source links. The curator workflow remains available as the final **Admin** tab rather than occupying the structural-research path.

The morphology disclosure now shows four cards rather than conflating “internal structure unavailable” with “no useful reference exists.” The distinction is:

- unavailable for this specimen;
- available only as an independently sourced teaching reference.

## Accessibility and state

- New camera modes are URL- and import-state-addressable: `cell_detail` and `internal_reference`.
- The canvas ARIA description now changes with mode and current layer visibility.
- Anatomy/morphology legends and the synthetic cross-section inset are hidden while the independent internal reference is active.
- The reference legend states five schematic classes, zero source meshes, zero joins, zero registrations and measurement forbidden.
- The Structure tab and both reference-opening controls are standard keyboard-focusable buttons with pressed state.

## Validation and runtime QA

- `npm run build`: passed.
- `npm run lint`: passed.
- `npm run test:research`: passed; 305 tests, 303 passed and 2 intentionally skipped, with all research validators green.
- `npm run test:frozen-2.8`: passed; the previously distributed 2.8 curator package remains checksum-valid and unchanged.
- `node scripts/validate-cross-region-internal-reference.mjs`: passed; 3 sources, 5 schematic classes, 0 source-derived geometry objects and 0 registrations.
- Focused contract tests include mutation rejection for source-geometry promotion, measured placement and same-object relationship promotion.
- Browser runtime verified default `view=cell_detail`, `view=internal_reference`, pressed state, scene-mode data attribute, absence of application errors, source/claim disclosures and a 390 × 844 mobile viewport without horizontal overflow.

Current-run screenshots:

- `output/iteration-2.20-cluster-baseline-desktop.jpg`
- `output/iteration-2.20-cell-detail-isolated-desktop.jpg`
- `output/iteration-2.20-internal-reference-final-desktop.jpg`
- `output/iteration-2.20-structure-panel-final-desktop.jpg`
- `output/iteration-2.20-cell-detail-mobile-final.jpg`
- `output/iteration-2.20-internal-reference-mobile-final.jpg`
- `output/iteration-2.20-structure-panel-mobile-final.jpg`
- `output/iteration-2.20-handoff-desktop.jpg`

## Remaining go/no-go gates

1. **Exact cross-region geometry — UPG-111:** one MICrONS inhibitory cell may become a separate observed reference only after materialization/release version, root ID, linked nucleus ID, mitochondrion IDs, segmentation timestamp, bytes, hashes and proofreading state are fixed.
2. **Serial spinal synapse — UPG-112:** all eleven Super-CLEM sections must be checksum-pinned before manual contour/alignment derivatives and uncertainty receipts; even then, the parent neuron remains unresolved.
3. **Canonical sources and record granularity — UPG-108/109:** reconcile the currently different source universes and expose cluster/population/type/cell/nucleus units before adding more types.
4. **Lane-scoped biological context — UPG-110:** replace global scope wording with per-lane species, life stage, region and experimental unit.
5. **Machine-readable scientific roadmap — UPG-113:** separate research/model upgrades from the 21-item governance/admission queue and expose current blockers in the research UI.

No verified public source was found that binds full neurite morphology, molecular identity, spinal position, synapses, membrane, nucleus and organelles to the same physical mouse spinal interneuron. That negative result remains a data-availability conclusion, not a reason to invent a composite cell.
