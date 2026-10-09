# Research timeline — iteration 2.75 (2026-09-23)

## Scope

Continued in place from the sealed 2.74 research iteration. This increment resolves a documentation gap in UPG-249 by separating public source availability from candidate-specific object verification and display permission. It adds no biological geometry and makes no change to the mouse spinal-cord census.

## UPG-249 source availability findings

- Exact BANC comparison candidate remains root `720575941350424112`, source type `IN14A018`, with verified v888 nucleus ID `73044750394982464`. It is an adult-female *Drosophila melanogaster* VNC source object, not a mouse interneuron or homolog.
- The official BANC data map lists a v888 per-mitochondrion annotation table (`mitochondria_v1_human_readable.csv.gz`) in the Dataverse v3 release and public GCS mirror. The exact Dataverse asset is 1,107,598,431 bytes (MD5 `2e3be9c0d063969ae019121117007e9a`; release license CC BY 4.0). Its exact candidate rows and coordinate values have not been retrieved. The maintained `bancr::banc_mitochondria(rootids=...)` accessor supports filtering by `pt_root_id`, but initializes a configured CAVE client; no credential was inspected or used.
- The official client source documents an ID-addressable nucleus mesh route, `nuclei/seg_v1`, for the stable nucleus ID. The mesh payload was not fetched or hashed, the route was not tied to the v888 materialization at object level, and object-level reuse terms were not verified. It remains a candidate route only.
- The client also documents a separate mitochondria mesh route under `250423_mito/seg`. The BANC data map marks its detected-mitochondria segmentation product `MISSING`; the separate route is not shown to be the exact v888 candidate product. No candidate segmentation IDs or mesh objects were verified.
- Public raw synapse tables v2 and v3 are listed for v888. The v2 Dataverse asset is 12,257,440,602 bytes (MD5 `e3679e7b9cec032ed1745c7a9dfd42d8`) and records coordinates in nanometres. The v3 table is marked as in testing and uses a 16 × 16 × 45 nm source grid. The public enriched parquet products are multi-gigabyte; no bounded candidate-specific query path was pinned, no rows were extracted, and no archive was downloaded.
- Source-file access, candidate-specific row retrieval, exact mesh bytes, object identity, coordinate validation, and object-level reuse are recorded as separate gates. Public endpoints and table listings alone do not satisfy geometry admission.

## Interface and model boundary

- The BANC source card now reports the documented nucleus/mitochondria routes, exact archive sizes, synapse-version coordinate differences, and unresolved same-object gates. It makes clear which facts come from public source documentation and which remain unverified for the exact candidate.
- UPG-249 is marked partially completed for the route inventory only. It remains open for exact payload/version/hash/rights and source-coordinate validation.
- The only BANC comparison geometry remains the previously admitted checksum-pinned SWC centerline and the same-root nucleus annotation point. New nucleus surfaces, mitochondria points/surfaces, synapse objects, mouse identity joins, atlas registrations, and measurements remain zero.
- Mouse census and registry bases remain unchanged: 30 canonical sources, 39 record sets, 387 source profiles, 13 exact profile rosters, 4 exact source-object sets, and 1,097 frozen NeuroMorpho records.

## Verification and rollback

- Added strict schema, cross-record validator, and tests for the UPG-249 source-availability audit; retained fail-closed admission assertions.
- The 2.74 release is now checked through its sealed manifest snapshot rather than rebuilding it against mutable current files. This keeps 2.74's parent receipt useful as the immutable rollback pointer while iteration 2.75 continues in the same project directory.
- The 2.75 manifest records the exact 2.74 parent bytes/hash and this iteration's source, UI, queue, test, and audit receipts. No full-project copy was created.
- Verification: `npm run lint` passed; `npm run build` passed with the existing large-chunk (>500 kB) advisory and a non-blocking `vinext` route-classification warning. Focused UPG-249, source-route, registry, and 2.74/2.75 snapshot checks passed (22/22). The complete current research test suite passed after rebuilding the 2.75 app output: 927 passed, 15 skipped, 0 failed (942 total).

## Primary public references

- [Official BANC data-product map](https://github.com/htem/BANC-project/blob/main/manuscript/print/banc_data_locations.md)
- [BANC `bancr` CAVE table documentation](https://natverse.org/bancr/reference/banc_cave_tables.html)
- [BANC synapse table versions and coordinate frames](https://natverse.org/bancr/reference/banc_all_synapses.html)
- [BANC enriched synapse table access and size](https://natverse.org/bancr/reference/banc_synapses_enriched.html)
- [BANC nucleus and mitochondria mesh accessors](https://github.com/natverse/bancr/blob/main/R/meshes.R)
- [BANC v888 Harvard Dataverse release · CC BY 4.0](https://doi.org/10.7910/DVN/7WTH1N)
- [Primary BANC paper](https://doi.org/10.1038/s41586-026-10735-w)
