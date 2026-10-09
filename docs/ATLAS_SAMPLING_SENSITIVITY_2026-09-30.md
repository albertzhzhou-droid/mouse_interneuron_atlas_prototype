# UPG-026 — same-source annotation sampling sensitivity

This increment compares plane selections against one fixed native Allen spinal-cord annotation. It measures which source annotation-state runs and direct-label voxels are represented. It does not estimate independent biological error, reconstruction error, anatomical accuracy, geometric distance, interpolation fidelity or registration precision.

The result remains `INF`, `measurementUse: forbidden`, and `REG = 0`. The atlas itself contains source-derived longitudinal interpolation; verifying its native annotation masks does not provide an independent anatomical ground truth. The 32 contiguous annotation-state runs are repeated source-data states, not spinal segments, independent sections, specimens or new biological resolution.

## Inputs and verification

The annotation is `allen_spinal_cord-adult-mouse-annotation:2021` in `allen_spinal_cord-adult-mouse-space:2021`, distributed as `allen_cord_20um` 3.0. Its native shape is `[1567,253,322]`, resolution is `[20,10,10]` micrometres in ZYX, and orientation is `asr`. The fixed original source-manifest SHA-256 is `95f305de7b19274908ac5dd24abfa5a0e6544effad1bfdd7d542b177a27cfad1`.

The original compressed Zarr cache is no longer available locally. No download was performed and no full volume was copied or emitted. Instead, the builder reads the existing 73 checksum-pinned assets under `public/data/allen_cord_20um_native_volume_v2/structures/`. Their masks encode the complete annotation losslessly as 32 native XY row-RLE planes and their contiguous z-run extents. Embedded surface geometry is not used in this analysis.

The builder validates the pinned native manifest and all 73 files, label identities, direct-label inventory, frame, shape, resolution, orientation, state extents, bounds, row counts, and mutually exclusive direct-label occupancy. It reconstructs only the 32 unique 253×322 uint32 planes in memory. Each complete plane must match its existing source-state SHA-256. Each plane's bytes are fed into the full-volume digest once for each z position in its state run, without creating a full-volume array. The resulting full semantic hash must equal:

`1e5ee2daaeabd3505572f5efdb92e700387f7bd794720e78ec21511338500d12`

The canonical hash is SHA-256 over unsigned 32-bit little-endian values in native C-order ZYX. This rechecks the annotation semantics from existing lossless masks. It does **not** freshly verify the original compressed-object tree, independent anatomy or source acquisition. The JSON records that limitation explicitly as `rawZarrObjectInventoryReverified: false`.

## Plane selections and evidence strength

| Selection | Plane count | Evidence |
| --- | ---: | --- |
| Archived 15 | 15 | Exact `sampledZIndices` from the local 2.8.0-curator.1 archive; all 15 actual PNG files rechecked against their byte counts and hashes. |
| Declared historical 33 | 33 | The fixed reference builder explicitly declares `BASE_Z_INDICES = tuple(range(0, 1520, 49)) + (1566,)`. The existing provenance document describes the previous 33-plane grid. No independent archived 33-plane output was found, verified or recreated. |
| Current 38 | 38 | Exact indices in the current reference manifest; all 38 actual PNG files rechecked. They equal the declared base plus z27, z77, z172, z811 and z1106. |
| Declared denser 75 | 75 | A new, nested counting strategy: retain every current index and add `floor((left + right) / 2)` in each of the 37 adjacent gaps. No new PNGs, interpolation or geometry are emitted. |

The archived 15 indices are `[98,196,294,392,490,588,686,784,882,980,1078,1176,1274,1372,1470]`. They come from actual archive evidence rather than a fabricated evenly spaced replacement. All strategy indices are included in the result JSON. The old 33 strategy is intentionally labelled `generator_declaration_only_historical_output_not_available`; its computed counts replay that explicit definition against the fixed source and do not validate a missing historical output.

## Counts and interpretation

There are 73 nonzero direct annotation labels and 38,845,542 labelled voxels across the full source. The ten hierarchy-only identifiers have zero direct voxels and are excluded from direct-label denominators. The 37 interneuron-focused anatomical labels, three structural-context labels and 33 motor-context labels retain separate lane counts; these are anatomical source labels, not interneuron cell counts.

| Selection | Annotation states represented | Direct labels sampled | Voxels represented by covered states | Voxels on selected planes |
| --- | ---: | ---: | ---: | ---: |
| Archived 15 | 15/32 | 63/73 | 21,198,654 / 38,845,542 = 54.5717% | 372,128 / 38,845,542 = 0.9580% |
| Declared historical 33 | 27/32 | 70/73 | 33,761,054 / 38,845,542 = 86.9110% | 814,512 / 38,845,542 = 2.0968% |
| Current 38 | 32/32 | 73/73 | 38,845,542 / 38,845,542 = 100% | 988,126 / 38,845,542 = 2.5437% |
| Declared denser 75 | 32/32 | 73/73 | 38,845,542 / 38,845,542 = 100% | 1,961,032 / 38,845,542 = 5.0483% |

**State coverage** counts each contiguous source run once if it contains at least one selected native z plane.

**Represented-state voxel coverage** sums each covered state's exact label-plane voxel count times the complete state z-run length. This counts identical native source masks within a verified run, without interpolating between sampled planes or claiming spatial reconstruction accuracy.

**Selected-plane voxel coverage** sums label voxels on the distinct chosen planes only. It describes sampling budget, not accuracy. Sampling a second plane in the same repeated state increases this budget but cannot add a new source state. The 75 selection accordingly adds budget without changing state or direct-label presence coverage relative to 38.

The 15 selection misses ten labels that are present in the fixed source, including source identifiers 25 and 67 in the anatomical lane. The declared 33 selection misses motor-context identifiers 44, 51 and 59. Their status is `source_present_but_not_sampled`, not biologically absent. The result contains each label's exact full-source count, sampled count, represented-state count and missed presence-state indices.

## Reproduction and acceptance

Run `node tools/build_atlas_sampling_sensitivity.mjs` to regenerate the separate JSON, or append `--check` to require byte-identical output. Inputs and output paths are fixed. The builder has no network calls and does not edit existing atlas assets, original source receipts or shared Atlas UI. Its JSON includes SHA-256 and byte receipts for both manifests, the original source manifest, the historical manifest, all 73 masks, 53 actual PNGs, and the existing generator/provenance definitions.

`tests/atlas-sampling-sensitivity.test.mjs` exercises nonuniform run weighting, repeated-plane sampling, source-present-but-unsampled labels, lane denominators, malformed/gapped/overlapping states, invalid native indices, exact RLE bounds and cross-label overlap, the declared denser strategy, fixed-source regression counts, all scientific gates, and full offline regeneration/semantic verification.

`AtlasSamplingSensitivityPanel` is a standalone default-exported client component with no props or provider dependency. It exposes strategy counts, per-label evidence and a JSON export. Integration into Overview is handled separately. Its counts do not enable geometry comparison, measurements, registration or a precision label. Independent biological validation and the missing historical 33-plane output remain open evidence requirements.
