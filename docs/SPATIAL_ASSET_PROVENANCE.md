# Spatial asset provenance and scientific-use contract

Snapshot date: 2026-08-26  
Scope: localhost Research MVP only; no deployment or external publication is implied.

This document covers the spatial asset sets bundled under `public/data/`. The manifests and raw files, not this narrative, are authoritative for machine validation.

## 1. Adult mouse spinal-cord reference

### Frozen identity

| Field | Frozen value |
|---|---|
| Asset | `allen_cord_20um` |
| BrainGlobe atlas version | `3.0` |
| BrainGlobe Atlas API used by the generator | `3.0.1` |
| Species and life stage | *Mus musculus*, adult |
| Coordinate-space component | `allen_spinal_cord-adult-mouse-space:2021` |
| Template component | `allen_spinal_cord-adult-mouse-nissl-template:2021` |
| Annotation component | `allen_spinal_cord-adult-mouse-annotation:2021` |
| Terminology component | `allen_spinal_cord-adult-mouse-terminology:2021` |
| Native shape, z-y-x | `[1567, 253, 322]` voxels |
| Native resolution, z-y-x | `[20, 10, 10]` µm |
| Orientation | `asr` |
| Array directions | anterior→posterior, superior→inferior, right→left |
| Geometry status | `INF` |

The pinned BrainGlobe source manifest is:

- URL: <https://brainglobe.s3.amazonaws.com/atlas/atlases/allen_cord_20um/3_0/manifest.json>
- SHA-256: `95f305de7b19274908ac5dd24abfa5a0e6544effad1bfdd7d542b177a27cfad1`
- S3 ETag recorded at acquisition: `b372800d773e593592c08a39418a9782`

The current post-2.8 research asset has identity `allen_cord_20um:3.0:ohri-sampled-reference-v4` and asset-manifest SHA-256 `75aa6dc5cbeb05b52eff2266751a700cced23c9b1ea2f880bede19bd03e225c8`. Its `files` array records the byte count and SHA-256 of 119 declared files: 38 PNG planes; 76 pixel-exact native 322×253 RGBA overlays for those sampled planes, comprising one combined fine-browser-plus-structural-context overlay and one separate motor-context overlay per plane; `atlas-contours.json`; `atlas-internal-compartments.json`; `atlas-fine-anatomy.json`; the source manifest; and `terminology.csv`. `asset-manifest.json` is the enclosing manifest and is not counted in its own `files` array. The validator also rejects files present on disk but absent from that list. This identity is intentionally distinct from the frozen 15-plane Candidate 2.8 asset.

### INF derivation record

`atlas-contours.json` identifies both inputs:

1. `allen_spinal_cord-adult-mouse-annotation:2021`
2. `allen_spinal_cord-adult-mouse-nissl-template:2021`

The generated contour payload SHA-256 is `b25b19828163b6accf544e6f9458ada47e149ee0022761255fc68ea851cb8356`.

Method: sample 38 native transverse planes; form the outer mask from `annotation > 0`; form gray matter from terminology descendants of identifier 71; convert each mask to row-wise perimeter polygons at a four-voxel stride. The 38 PNGs are Nissl planes with annotation color and boundary overlays, resized with nearest-neighbour sampling from 322×253 native pixels to 644×506 display pixels. Relative to the previous 33-plane research grid, v4 adds z27, z77, z172, z811, and z1106.

A full audit of the 1,567 native annotation planes found 32 contiguous z-wise annotation-state runs. The previous 33-plane grid represented 27/32 runs; its five gaps were z14–41, z66–88, z161–184, z792–831, and z1088–1125. The five added indices provide one sampled plane from each formerly omitted run, so the v4 grid represents 32/32. These are contiguous source-data states, not spinal segments, independent anatomical sections, specimens, or evidence of new biological resolution.

Confidence is `{ "value": null, "missingReason": "not_measured" }`. This is deliberate: no registration-error or contour-accuracy experiment was performed for this derivative. `measurementUse` is therefore `forbidden`.

### Major internal compartments

`atlas-internal-compartments.json` is the versioned asset `allen_cord_20um:3.0:internal-compartments-v3`, an `INF` display derivative of the same pinned annotation rather than a hand-drawn anatomical model. Its SHA-256 is `e6dbd7715823be603a3d5b4fc3c84e4874f4f0474e206ea95bf7589410fe5ac0`. It retains exactly seven source structures and their Allen terminology metadata:

| Source structure | Identifier | Source-mask rule |
|---|---:|---|
| Dorsal horn | `90` | identifier 90 and terminology descendants |
| Central Spinal Cord | `100` | identifier 100 and terminology descendants |
| Ventral horn | `110` | identifier 110 and terminology descendants |
| Central Canal | `16` | exact identifier 16 only |
| Dorsal funiculus | `74` | identifier 74 and terminology descendants |
| Lateral funiculus complete | `75` | identifier 75 and terminology descendants |
| Ventral funiculus | `70` | identifier 70 and terminology descendants |

For every included terminology label, the derivative preserves `identifier`, `annotationValue`, `parentIdentifier`, `rootIdentifierPath`, name, abbreviation, and source color. On each of the same 38 native z planes, it creates a binary mask from those annotation values, separates the mask with deterministic four-neighbour connectivity, and traces closed rings exact relative to the sampled native annotation-pixel edges of each component. This is not a sub-voxel boundary. There is no minimum-size filtering. Disconnected and bilateral components are never bridged, diagonal contact does not merge components, and plane-local component indices do not imply correspondence across planes.

The current derivative contains 973 plane-local connected components and 975 exact source-mask rings. Dorsal funiculus identifier 74 is absent at sampled planes z=1470, 1519, and 1566, so all three records are retained explicitly as `presence: "missing"` with `missingReason: "source_mask_absent_at_sampled_plane"`; missing geometry is not interpolated. All other major-structure plane combinations are present. Ring signed area is validated against the source-mask voxel count for every component.

This finer internal anatomy remains `INF`, `measurementUse` remains `forbidden`, registration count remains zero, and every spinal-segment field remains explicit null / `pending_curation`. The file performs no cross-plane interpolation or surface lofting and does not establish a full-volume surface, cross-plane component correspondence, sub-voxel accuracy, independent validation, or a coordinate join to molecular types, SWC exemplars, evidence entities, injury sites, or pathways.

### Selectable fine anatomy

`atlas-fine-anatomy.json` is schema `0.2.0`, versioned as `allen_cord_20um:3.0:fine-anatomy-v2`, with SHA-256 `f34b7a47ccdd37c1a4aa61eeae61763dae5ce99657fdab2e33056fa1730acc02`. It inventory-locks all 73 direct leaves represented by the pinned terminology and annotation on 38 sampled planes, but keeps their roles separate: 37 selectable browser identifiers (14 laminae, 17 named nuclei/columns, and 6 tracts), three structural-context identifiers (central canal 16, lateral funiculus 65, and ventral funiculus 70), and 33 motor-context identifiers (28–60). Browser categories are project navigation aids only; the source identifier, name, abbreviation, parent, complete hierarchy path, and source color remain authoritative. Inventory-complete here means complete only for those 73 represented direct leaves on the sampled planes, not sub-voxel accuracy, full-volume anatomy, cross-plane component correspondence, anatomical measurement, independent validation, cells, cell types, interneurons, or biology.

Across 1,406 browser structure-plane records, the 37-label browser lane retains 2,431 separate four-connected exact-label components as 2,511 simple closed source-mask rings and records 670 absent structure-plane pairs explicitly. The three-label structural-context lane retains 166 components, zero missing plane records, and 387,870 sampled voxels. The 33-label motor-context lane retains 228 components, 1,144 missing plane records, and 51,998 sampled voxels. Every direct leaf is present on at least one of the 38 sampled planes. There is no descendant expansion, color-based reconstruction, minimum-size filter, hand drawing, interpolation, cross-plane joining, or procedural fill.

The viewer renders one of the 37 browser structures at a time and exposes current-plane present/missing status, sampled coverage, and source hierarchy. Structural context remains separately identified, while the 33 motor-context labels are a non-interneuron context lane that is off by default. The 76 pixel-exact native RGBA overlays for the 38 sampled planes retain the browser-plus-structural and motor-context layers separately; they do not form an inferred surface or fused internal mesh. This payload is `INF`, measurement-forbidden, and `0 REG`; atlas-region counts do not count interneurons, cells, connectivity, or a biological census.

### Full-native-volume three-lane masks and voxel-face surfaces

`public/data/allen_cord_20um_native_volume_v2/` is a sibling asset rather than a modification of the 119-file sampled-plane directory. Its identity is `allen_cord_20um:3.0:native-volume-direct-label-surfaces-v2`; its asset-manifest SHA-256 is `d77b526acc6a80326f75ba3131e885f9d7841b5d01b184daa3651a48f1e85c20`. The manifest pins the full `[1567, 253, 322]` uint32 little-endian z-y-x annotation volume with semantic SHA-256 `1e5ee2daaeabd3505572f5efdb92e700387f7bd794720e78ec21511338500d12`, computed in C order. The source grid remains `[20, 10, 10]` µm z-y-x with `asr` orientation. Its 160-file compressed-source inventory is separately canonicalized as sorted `relative POSIX path<TAB>decimal bytes<TAB>lowercase file SHA-256<LF>` records and hashes to `1402e9724d9e8b2b1bf8d0c65a3556944a317c99c4065874c7f2948ec5e8f44f` for 1,263,167 bytes. Recompression can change this object-inventory hash without changing the stronger semantic uint32-volume hash. The earlier v1 sibling remains a historical 37-label intermediate and is not loaded by the current viewer.

The builder is pinned to Node `v26.0.0` and refuses other runtime versions. Its manifest declares determinism only for the pinned input objects, generator bytes, and Node version; this prevents cross-runtime byte differences from being misrepresented as unconditional reproducibility.

This UPG-037 slice covers all 73 represented direct identifiers without merging their roles. The 37-study-region lane preserves 21,293,714 voxels / 38,914 row runs / 164,347 rectangles / 328,694 triangles; the three-structural-landmark lane preserves 15,495,432 / 9,328 / 34,945 / 69,890; and the 33-motor-context lane preserves 2,056,396 / 3,820 / 15,549 / 31,098. Overall, 38,845,542 exact-identifier source voxels are retained as 52,062 row runs. Deterministic exposed-voxel-face rectangularization represents 11,138,364 unit faces as 214,841 lossless coplanar voxel-boundary rectangles, triangulated at browser load into 429,682 triangles. Every record has `includedInInterneuronCounts: false`; motor context is off by default.

Each of the 73 label payloads is checksum-pinned and only one selected payload is loaded at a time. Exact sampled-mask rings and full-volume surfaces use voxel-boundary coordinates rather than passing pixel edges through the voxel-centre transform. A separate validator oracle enumerates the source-mask unit-face set and independently expands the stored rectangles; it detects missing, duplicate, shifted, oppositely oriented and extra faces and currently reports zero for every mismatch class. This computational independence is not independent biological validation. The rectangles reduce the display payload without changing the union of source voxels: there is no descendant expansion, interpolation, smoothing, decimation, hole filling, component filtering, topology modification, or manual geometry. The surface is exact only relative to the pinned source voxel grid, whose underlying atlas contains source interpolation. It remains `INF`, `measurementUse: "forbidden"`, and `0 REG`, and it cannot establish cell position, laminar membership, named spinal segment, molecular identity, connectivity, biological validation, or a count of interneurons. A genuinely independent anatomical benchmark remains pending; UPG-037 therefore remains in progress.

Native voxel `[z,y,x,1]` is mapped to display millimetres by the recorded matrix:

```text
left_mm   =  0.01*x - 1.605
dorsal_mm = -0.01*y + 1.260
caudal_mm =  0.02*z
```

The subsequent native-mm-to-scene transform exists only to fit the current viewer. It is explicitly `visualization_only_not_cell_registration`.

For a voxel-boundary coordinate `[z_edge,y_edge,x_edge]`, each index is shifted by `-0.5` before applying the corresponding centre-coordinate formula above. This separate edge transform is required for pixel-edge rings and exposed voxel faces; it is still visualization-only and measurement-forbidden.

### Primary sources and rights

- BrainGlobe atlas description: <https://brainglobe.info/documentation/brainglobe-atlasapi/usage/atlas-details.html>
- BrainGlobe V3 storage model: <https://brainglobe.info/blog/atlas-api-v3.html>
- BrainGlobe AWS Open Data entry: <https://registry.opendata.aws/brainglobe/> — hosted distribution marked CC0 1.0.
- Original `SC_atlas_P56` dataset: <https://data.mendeley.com/datasets/4rrggzv5d5/1> — version 1, CC BY 4.0, DOI `10.17632/4rrggzv5d5.1`.
- Fiederling et al. 2021: <https://pmc.ncbi.nlm.nih.gov/articles/PMC8516137/>, DOI `10.1016/j.crmeth.2021.100074`.
- BrainGlobe Atlas API code is BSD-3-Clause. Its software licence is distinct from the rights in atlas data.

This bundle retains attribution to the original dataset and BrainGlobe even though the AWS distribution is marked CC0. No paper figure or article text is copied; the article's CC BY-NC-ND licence must not be mistaken for permission to adapt its figures.

## 2. NeuroMorpho morphology exemplars

### Frozen selection

Repository release: `8.6.124`. The official API query snapshot returned 142 records:

```text
https://neuromorpho.org/api/neuron/select?q=species:mouse&fq=brain_region:spinal%20cord&fq=cell_type:interneuron&fq=age_classification:adult&size=500&sort=neuron_id,asc
```

Five phenotype-stratified examples were chosen. They are exemplars, not a representative sample, census, frequency estimate, or taxonomy of adult mouse spinal interneurons.

| NeuroMorpho ID | Phenotype label in this MVP | Original paper DOI |
|---:|---|---|
| 104003 | Dynorphin-expressing inhibitory interneuron | `10.1038/s41593-018-0119-z` |
| 108974 | Substance P-expressing excitatory interneuron | `10.1097/j.pain.0000000000001406` |
| 109005 | GRP-expressing excitatory interneuron with reconstructed axon | `10.1097/j.pain.0000000000001406` |
| 242822 | Substance P-expressing radial excitatory interneuron | `10.1016/j.neuroscience.2020.06.038` |
| 260150 | NPFF-positive vertical excitatory interneuron | `10.1038/s41598-023-32720-3` |

The NeuroMorpho asset manifest has SHA-256 `4ee24a35b282376ee507c0218806671b9c9f6f18c820d2ffaa298a53162a8647`; the checksum-linked `morphology-lines.json` has SHA-256 `6ba511fb2eb4dc23c20f4415c079cebe5bab565279f63fc72dc1c98ee6bd4330`.

Every raw SWC is parsed as seven columns and checked for finite values, unique positive node IDs, one parent field per node, one root, present parents, no self-parent, acyclicity, positive radius, and agreement between SWC type codes and the declared axon/no-axon domain. File bytes, node counts, bounds, root ID, zero-length-edge count, and SHA-256 are compared with the manifest.

### UPG-030A research query census

The five files above remain the frozen exemplar set. UPG-030A is a separate research-iteration asset under `public/data/neuromorpho_release_8_6_124_census_v1/`; it does not rewrite the frozen five-file manifest or turn the old exemplar selection into a retrospective census.

The official release-query response contains 142 unique NeuroMorpho record IDs. This is a **repository query census**, not a biological census of mouse spinal interneurons, cell types, animals, or specimens. The response has no animal-level identifier that establishes independent sampling, so neither the 142 records nor any admitted SWC subset can be used as a denominator for population frequency, prevalence, biological diversity, or inter-animal variability.

The source coverage is narrow:

| Source dimension | Query-indexed records | Interpretation boundary |
|---|---:|---|
| Lumbar source context | 142 | No cervical, thoracic, sacral, or whole-cord morphology coverage follows. |
| Todd archive | 140 | Repository concentration is not biological prevalence. |
| Chen_Dai archive | 2 | These two lamina-X neurite-domain records do not repair whole-cord coverage. |
| Original papers | 5 | Records within a paper are not established as independent animals by the API. |
| `Diameter, 3D, Angles` | 92 | These are source reconstruction attributes, not registration or shrinkage correction. |
| `No Diameter, 3D, Angles` | 48 | Missing diameter must remain explicit. |
| `Diameter, 2D, Angles` | 2 | Two-dimensional reconstructions must not be rendered or counted as observed 3D arbors. |
| Axon included in domain | 45 | All 45 report `Dendrites & Axon Moderate`; zero report a complete axon. |

Thus 140 records are 3D and two are 2D. Ninety-four records have diameter metadata overall, but only 92 combine diameter with 3D geometry. A `No Axon` domain is a reconstruction boundary, not proof of biological axon absence. Likewise, a moderate axon is not a complete projection, connectome edge, or route through the atlas.

UPG-030A preserves the exact official query response in `official-query-snapshot.json` and normalizes its records into `census-index.json`. All 142 indexed direct standardized SWCs were acquired and audited independently; all 142 passed the current parsing/domain/QC gate, 142 lazy geometries were emitted, and zero records were quarantined. This includes 140 source-3D and two source-2D geometries. The index records 94 files with source diameter available, 48 without diameter, 32 records with numeric age, 110 without numeric age, two type-6 geometries, and zero project registrations. Exact raw-file and canonical-geometry hash grouping found no duplicate groups, but that result does not establish animal or specimen independence.

Each admitted file retains its direct URL, byte count, SHA-256, source-paper identifiers, dimensionality, diameter availability, domain, physical integrity, raw node types, and topology report. A failed download or QC result is recorded as quarantined; it is never silently omitted, repaired, or replaced. The current quarantine count is zero, but the denominator and empty report remain explicit. Browser geometry is emitted as one lazy file per admitted record under `geometry/`, while raw admitted SWCs remain under `swc/`. The manifest declares 287 files: the official snapshot, census index, quarantine report, 142 standardized SWCs, and 142 lazy geometry files.

| Generated UPG-030A object | SHA-256 |
|---|---|
| `official-query-snapshot.json` | `f35f1755885ca495ab3fecb2385e797eaeec3dc56d684413a8324a2e9297113b` |
| `census-index.json` | `1598b5119f5826719e390fe46615a291b51fa3cd7716e9a191ad645f73165364` |
| `asset-manifest.json` | `2c1153fe86e3bc2f08505cf2416ab25b2d8e9ca747b0bffcfad5aacc9286cf91` |

The two Chen_Dai records contain soma nodes plus SWC type 6 in the standardized files. Type 6 remains an uninterpreted source code associated with those neurite-domain records; the project does not relabel it as dendrite or axon. Normalized display labels remain separate from the source arrays.

### UPG-050 source-local morphology analysis

The separate derivative under `public/data/neuromorpho_release_8_6_124_analysis_v1/` accepts only the two checksum-pinned UPG-030A census documents above and all 142 checksum-declared lazy geometry files. It does not modify or replace a source geometry. `tools/build_neuromorpho_analysis.py` uses the Python standard library only and emits sorted-key compact JSON. A byte-reproducibility rebuild matched both generated files.

The analysis derives 142 record phenotypes and seven exact source cohorts. Its neurite rule includes a segment only when the child node's retained SWC type is not 1; 529,583 neurite segments are analysed and 890 child-type-1 segments are explicitly excluded. It retains 2,353 source-type-6 segments across the two 2D Chen_Dai records as uninterpreted. Sholl spheres use 10 µm radii, the retained root-node coordinate rather than an inferred soma centroid, analytic straight-line intersections and a half-open `(0, 1]` endpoint policy.

| Generated UPG-050 object | SHA-256 |
|---|---|
| `tools/build_neuromorpho_analysis.py` | `10813a83b8c42f6478186bbd752571f5db62391283966b073b08516c9d95a132` |
| `analysis-index.json` | `b1cf19da5406d1cbc95f2926fb4b721f690e91857f0ad1468fc8ec8517333905` |
| `asset-manifest.json` | `a6fed35c6326eb1fa4e4060c85620cdba04bfe69eadee4968cc8784f5c08fc03` |

The seven cohort keys include citation, source tertiary label, dimensionality, domain and physical integrity. Thus 2D and 3D are never implicitly pooled. Every `n` is a repository-record count; independent animal, donor, specimen and prevalence denominators remain unavailable. The derivative does not harmonize reconstruction methods or shrinkage, create a cross-paper biological effect size, fill an incomplete axon, infer cell type, add a synapse, or create atlas registration.

### Coordinate and registration boundary

Raw SWC geometry is `OBS` only within `NeuroMorpho_CNG_standardized_local_frame`. It has no transform into `allen_cord_20um`.

For every exemplar:

- `registrationStatus` is `unregistered`;
- `atlasTransform.value` is `null` with `missingReason: asset_unavailable`;
- `atlasPlacement.value` is `null` with `missingReason: out_of_scope`;
- the soma-centred scale in `morphology-lines.json` is `viewer_only`;
- `scientificUse` is `morphology_illustration_only_not_spatial_query`.

The viewer must not use these coordinates to infer spinal level, lamina, laterality, inter-cell distance, pathway length, or relationship to injury. Visually co-presenting a morphology with the atlas does not constitute registration.

### NeuroMorpho rights and access rules

- Terms of Use: <https://neuromorpho.org/useterm.jsp> — CC BY 4.0 plus repository use terms.
- API reference: <https://neuromorpho.org/apiReference.html>.
- Programmatic metadata access must use the official API.
- SWCs must be fetched through their direct file URLs with an identifying User-Agent; scripted `.jsp` scraping is prohibited.
- Reuse must cite the original paper for each reconstruction, NeuroMorpho.Org (RRID:SCR_002145), and Tecuatl et al. 2024, DOI `10.1096/fba.2024-00048`.

The same attribution requirements apply to every UPG-030A census record and admitted SWC. CC BY 4.0 permits reuse with attribution; it does not waive the repository terms, the original-paper citation, or the obligation to keep reconstruction limitations visible.

## 3. Local regeneration and validation

Run from the project root. The cache and isolated Python environment remain outside the repository.

```bash
python3.12 -m venv /private/tmp/ohri-spatial-assets-venv
/private/tmp/ohri-spatial-assets-venv/bin/python -m pip install \
  "brainglobe-atlasapi==3.0.1" "Pillow==11.3.0"

BRAINGLOBE_CONFIG_DIR=/private/tmp/ohri-bg-config \
XDG_CACHE_HOME=/private/tmp/ohri-atlas-cache \
/private/tmp/ohri-spatial-assets-venv/bin/python tools/build_atlas_reference.py \
  --cache /private/tmp/ohri-brainglobe \
  --z-indices 0,27,49,77,98,147,172,196,245,294,343,392,441,490,539,588,637,686,735,784,811,833,882,931,980,1029,1078,1106,1127,1176,1225,1274,1323,1372,1421,1470,1519,1566 \
  --output public/data/allen_cord_20um_v3_0

/private/tmp/ohri-spatial-assets-venv/bin/python tools/build_morphology_assets.py \
  --source-cache /private/tmp \
  --output public/data/neuromorpho_release_8_6_124

/private/tmp/ohri-spatial-assets-venv/bin/python tools/build_neuromorpho_census.py \
  --source-cache /private/tmp/ohri-neuromorpho-census-v1 \
  --output public/data/neuromorpho_release_8_6_124_census_v1

PYTHONDONTWRITEBYTECODE=1 python3 tools/build_neuromorpho_analysis.py

npm run build:atlas-native-volumes -- \
  --cache /private/tmp/ohri-brainglobe \
  --output public/data/allen_cord_20um_native_volume_v2

node scripts/validate-spatial-assets.mjs
node scripts/validate-neuromorpho-census.mjs
node --test tests/neuromorpho-census.test.mjs
node scripts/validate-neuromorpho-analysis.mjs
node --test tests/neuromorpho-analysis.test.mjs
node scripts/validate-atlas-internal-compartments.mjs
node scripts/validate-atlas-fine-anatomy.mjs
node scripts/validate-atlas-native-volumes.mjs
node --test tests/spatial-assets.test.mjs
node --test tests/atlas-internal-compartments.test.mjs
node --test tests/atlas-fine-anatomy.test.mjs
node --test tests/atlas-native-volumes.test.mjs
/private/tmp/ohri-spatial-assets-venv/bin/python -m unittest \
  tests/test_atlas_internal_compartments_builder.py -v
```

The acquisition steps require network access. Once generated, the localhost viewer and validator use only the local assets.

## 4. Scientific limitations that must remain visible

1. The Fiederling atlas was assembled from representative annotated transverse sections and longitudinal interpolation; it is not a population-average cellular atlas or an observed whole-cord specimen.
2. The sampled-plane assets use 38 non-uniformly selected transverse display planes. The grid represents all 32 contiguous z-wise annotation-state runs in the pinned volume, but that coverage does not increase native voxel resolution, create independent biological sections, reverse interpolation in the source atlas, or validate geometry comparison. The annotation-state runs are not spinal segments. The sibling v2 asset covers the full pinned voxel volume for all 73 represented direct labels in separate 37-study-region, three-structural-landmark and 33-motor-context lanes, but its voxel-face surfaces inherit the same source-volume interpolation and are still neither measured segmentations nor validated registration targets. Sampled plane-local components are not tracked across planes.
3. BrainGlobe terminology does not provide curated C1–S3 boundaries in this asset package. Every plane's segment remains explicitly `pending_curation`; AP millimetres must not be silently converted into a named segment.
4. Confidence and registration error for the derived contours were not measured. Missing uncertainty is an evidence gap, not zero error.
5. The frozen five SWCs and the broader UPG-030A query both remain lumbar-concentrated. The 142 query-indexed records come from five papers and two archives, are not established as independent animals, and do not cover all developmental lineages, molecular classes, spinal levels, circuit roles, injury states, sexes, ages, or axonal morphologies. Zero query records report a complete axon.
6. SWC tissue processing, reconstruction completeness, shrinkage handling, and local axes differ by source. Raw coordinates remain source-local.
7. Neither the atlas planes nor the SWCs validate the existing schematic population positions or pathways. `INF`, `OBS`, `SYN`, and `SCH` statuses must remain distinct.
8. No human translation, disease mechanism, treatment effect, connectome completeness, or cell-census claim follows from these spatial assets.
9. The 73 direct-leaf identifiers are atlas-region labels, not 73 interneuron types: 37 remain in the separate study-region browser, three are structural context, and 33 are default-off motor context. Full-volume exact-mask/surface coverage applies to all 73 labels through those three non-count lanes, one selected label at a time. Source completeness for the pinned direct leaves does not erase 670 browser or 1,144 motor-context missing structure-plane records, establish all-anatomy or all-interneuron coverage, or count cells.
