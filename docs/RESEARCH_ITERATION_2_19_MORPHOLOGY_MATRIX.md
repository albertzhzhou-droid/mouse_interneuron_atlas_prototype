# Research iteration 2.19 — morphology matrix and source-object comparison

Date: 2026-08-30  
Application label: `2.19.0-research.1`  
Policy: public/open digital sources only; no OHRI specimens, images, unpublished data, or inferred completion.

## Decision

The highest-impact evidence-safe increment was not another schematic cell glyph. The admitted corpus already contains 142 checksum-pinned NeuroMorpho reconstructions, while the previous interface rendered one record at a time and compared cohorts only as tables. Iteration 2.19 therefore makes the real source objects visually enumerable and comparable without assigning them to molecular or SCI populations.

The release adds:

- a paginated matrix covering all 142 admitted SWCs;
- exact-coordinate XY, XZ and YZ orthographic centreline projections;
- filters for source class, axon field and diameter authority;
- a persistent two-to-four-record comparison basket;
- separate interactive 3D source-local viewports with observed-centreline and evidence-gated radius modes;
- a seven-metric record matrix and root-node-centred Sholl curves from the checksum-pinned analysis asset;
- JSON and CSV comparison receipts;
- a 13-axis per-record micro-detail evidence matrix over every admitted reconstruction, with `OBS`, `DERIVED`, and fail-closed `UNAVAILABLE` states;
- one separately admitted, checksum-pinned Super-CLEM dorsal-horn EM slice and a pixel-preserving browser PNG, shown only as two-dimensional synapse-scale source context;
- a strict `morphology-matrix-contract-0.1` validator and mutation tests.

The current-run interaction, responsive-layout and hydration checks are recorded in [RESEARCH_ITERATION_2_19_PRODUCT_AUDIT.md](RESEARCH_ITERATION_2_19_PRODUCT_AUDIT.md).

## Fixed evidence boundary

- Every geometry remains `OBS_STANDARDIZED_SOURCE_LOCAL` and unregistered.
- The matrix projection uses exact source coordinates with no PCA rotation, interpolation, smoothing, resampling, inferred soma or morphology averaging.
- Thumbnails and 3D viewports fit independently. Apparent size and orientation are not comparable.
- Radius surfaces are created only on request and only where the official source metadata reports diameter. They are open six-sided tapered-frustum display derivatives, not membranes.
- All 48 official `No Diameter` records render centreline-only geometry and zero surface primitives.
- Forty-five records contain an axon field, but every such field has moderate integrity and zero records establish a complete axon.
- The comparison relation is `co_display_only`; there are zero molecular/SCI/type identities, zero same-cell links and zero atlas registrations.
- Same-specimen membrane, nucleus, organelles, boutons, receptor maps, synapses and ultrastructure remain unavailable. No generic replacement is rendered.
- The separate Super-CLEM slice does not alter those per-cell missingness states: it is `co_display_only`, its parent cell is unresolved, and it creates zero NeuroMorpho, molecular-type or atlas relationships.
- Standardized soma samples are never promoted into a soma contour. The coverage algorithm preserves separate axes for centreline topology, neurite type annotations, axon field, diameter input, radius-derived display surface, soma contour, plasma membrane, nucleus, organelles, boutons, receptor distribution, synaptic partners and atlas placement.

## Locked denominators

| Measure | Value |
|---|---:|
| Query-indexed records | 142 |
| QC-admitted geometries | 142 |
| Source-labelled 3D / 2D | 140 / 2 |
| Diameter available / `No Diameter` | 94 / 48 |
| Records with source type-2 axon field | 45 |
| Source type-2 nodes | 269,611 |
| Complete axons | 0 |
| Same-specimen internal models | 0 |
| Atlas registrations | 0 |
| Exact Super-CLEM 2D source slices admitted | 1 |
| Super-CLEM segmentations / meshes / 3D reconstructions | 0 / 0 / 0 |
| Super-CLEM parent-cell / NeuroMorpho / type / atlas joins | 0 / 0 / 0 / 0 |
| Papers / archives | 5 / 2 |
| Exact analysis cohorts | 7 |

These are repository-record denominators. They are not independent animals, prevalence observations, biological types, canonical morphologies, or a complete interneuron census.

## Open-source micro-detail audit

### Super-CLEM GlyR — single-slice phase completed; full stack pending

The CC BY 4.0 Figshare release contains 787 individually addressable files totalling approximately 4.185 GiB across TIFF, TXT, MATLAB, Leica and Origin formats. The primary study includes 13 dorsal and 23 ventral synapses from two mice that were imaged with PALM and reconstructed from serial 70 nm EM sections. This supports a separate same-physical-synapse viewer, not a whole-neuron model.

The implemented phase admits exactly one dorsal-horn source object: Figshare file `32606555`, a 2,405,817-byte 1794 × 1332, 8-bit indexed-palette TIFF from source label `Dorsal 2`. The local original matches the deposited MD5 `384e5d12c9d024feed140b0ab46bb688` and SHA-256 `56d8bf7356e1f619ea175aa08a1021a27dbf4302caed835828ecf3ebdae95d5e`. Pillow 12.3.0 directly decoded the palette TIFF and saved a palette-mode PNG with optimization disabled; there was no crop, resampling, annotation or intensity transform. The 1,884,486-byte browser PNG retains the 1794 × 1332 dimensions, is pinned by SHA-256 `3583cf15007c2c5e62196f2a2fcb8e7393433b6d094688cbc17112ae870e2c1c`, and has exact decoded-RGB equality to the TIFF (no differing-pixel bounding box).

This is a two-dimensional source reference in a same-physical-synapse, 70 nm serial-section context. It is not a segmentation, contour set, mesh or 3D reconstruction. No exact file-level PALM crosswalk or receptor overlay is admitted, visible ultrastructure is not labelled as an organelle, and the parent cell, named interneuron, dendrite and presynaptic cell remain unresolved. The object is not attached to any NeuroMorpho record, molecular profile or atlas entity.

The next phase is the complete 11-section series for this same synapse. Advancement requires checksum-pinning every section, manual outlining, section alignment and explicit source-to-derivative receipts; no 3D claim is allowed until those derivatives and their uncertainty are validated.

Sources: [dataset v1](https://doi.org/10.6084/m9.figshare.17816747.v1), [primary paper](https://elifesciences.org/articles/74441), [official mirror](https://www.opendata.bio.ens.psl.eu/Super-CLEM-GlyR/).

### BioImage Archive S-BSST609 — raw no-go, link-only go

The audited accession exposes ten top-level archives totalling approximately 59.76 GiB compressed. It provides postnatal dorsal-horn A-fibre, microglial, lysosomal and synaptic-marker tissue context, not a complete interneuron or verified synaptic partner pair. The accession metadata inspected in this audit did not expose an explicit reuse-licence field. Raw ingestion therefore remains blocked; public downloadability is not treated as redistribution permission.

Source: [S-BSST609](https://www.ebi.ac.uk/biostudies/bioimages/studies/S-BSST609).

### BIL 10.35077/g.1196 — metadata go, raw mirroring no-go

The collection exposes 16 run/slide directories for a 480-gene Xenium study spanning 523 spinal sections, 616,599 neurons and 2,081,760 non-neuronal cells from seven male and seven female mice. Per-run objects include cell and nucleus boundaries, transcripts, feature matrices and large `morphology.ome.tif` tissue images. The latter are segmentation-context images, not traced neurite morphology. One representative run exceeds 28 GiB and the full collection is likely several hundred GiB. Dataset-level redistribution rights were not explicit in the audited DOI record, so the immediate route is link/metadata only, followed by selective Parquet streaming after rights review.

Source: [BIL 10.35077/g.1196](https://doi.brainimagelibrary.org/doi/10.35077/g.1196).

### Complete same-cell mouse-spinal source — no-go

No verified public source was found that binds full neurite morphology, molecular identity, spinal position, synaptic partners, membrane, nucleus and organelles to the same physical mouse spinal interneuron. The closest same-object source is Super-CLEM, whose unit is the synapse rather than the complete cell. This negative result is retained as UPG-104 instead of being repaired with cross-source assembly.

## Information-model follow-up

The 153-record type atlas is already source-preserving but still lacks an explicit cross-source concordance workbench. UPG-106 will compare marker strings, transmitter class, anatomical context and life-stage boundaries without scalar similarity scores or deduplication. It must also correct two coverage-model issues before prioritization: Hayashi is absent from the current five-lane coverage view, and Häring P17–P28 must not be described by a broad adult category that the source taxonomy does not assert.

## Go/no-go sequence

1. Keep UPG-098 complete and use the matrix/comparator as the primary real-cell morphology workflow.
2. Keep the completed UPG-099 single-slice phase isolated; advance only to its 11-section same-synapse stack with exact per-file receipts, manual outlining, alignment and explicit derivative/uncertainty records.
3. Implement UPG-106 before generating any cross-source type recommendations.
4. Keep BIL and S-BSST609 link-only until dataset-level rights and a tractable exact subset are resolved.
5. Do not create a “complete cell interior” mode until a same-object source passes UPG-090/102.
