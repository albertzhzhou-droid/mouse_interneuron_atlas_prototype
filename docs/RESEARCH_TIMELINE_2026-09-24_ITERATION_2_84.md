# Research timeline — iteration 2.84 (2026-09-24)

## Scope and outcome

Added a compact, collapsible comparison index for five independent structural-data lanes: MICrONS Phase 1, BANC v888, Super-CLEM PALM, MicroStructFormer, and Todd native soma contours. Its rows are assembled from each lane's existing pinned source contract and separately state source scope/count, exact object identifiers or their limits, coordinate frame and scale caveats, visible representation, reconstruction completeness, rights, and source locator. The index links to the corresponding detailed viewer or source audit; it is not part of the active selected-record matrix and is closed by default.

The comparison preserves source-local boundaries: MICrONS remains one cortical inhibitory cell plus its source-linked nucleus; BANC remains one adult-female fly-VNC neuron with a source-local tree and nucleus point; Super-CLEM remains one uncalibrated 2D localization file; MicroStructFormer remains a 540-row image/mask source with no cell identity; and the Todd contour audit remains two exact records with 19 source loops. These counts are not added together or presented as an interneuron denominator. The index admits no geometry, same-cell joins, atlas registrations, or measurements.

Added UPG-256 as a P1 research watch to test whether NeuroMorpho's official filter-query API can discover additional exact spinal interneuron morphology records beyond the current frozen selections. The official reference documents a paginated neuron endpoint and custom/filter query routes. The API has not been queried in this iteration; dynamic results are explicitly not accepted as a corpus snapshot or a cell denominator. Any later import still needs complete pagination, exact stable IDs and files, source-local region/type review, morphology semantics, and object-specific rights.

## Evidence and boundaries

- The canonical source registry remains 31 sources, 41 record sets, 13 exact cell/profile rosters, 4 exact source-object sets and 387 source profiles. The frozen NeuroMorpho corpus and all prior source denominators are unchanged.
- Five independent source registries are indexed; their counts remain separate. Missing scale, identity, completeness, or object-level reuse terms remain explicit rather than being inferred from nearby sources or publications.
- The MICrONS v185 synapse-table resolution is shown only as metadata for that separate table; it is not used as the mesh's voxel scale. The BANC source tree and nucleus point retain their native coordinate contracts. The PALM plot remains unitless XY; MicroStructFormer remains source-link-only; passing a Todd contour software screen is not surface admission.
- No full-project copy was created. The iteration modifies the existing checkout and adds a unique timeline plus a sealed 2.84 manifest.

## Verification

Full `npm run test:research` passed after the layout adjustment: build and lint completed, and all 975 current tests finished with 960 passed, 15 conditionally skipped, and 0 failed. The source-registry and denominator validators reported 31 sources, 41 record sets, 13 exact cell/profile rosters, 4 exact source-object sets, and 0 stale literals. The 2.84 manifest snapshot validator passed.

Browser QA on the rebuilt localhost preview opened the Structure panel and expanded both the independent reference library and the UPG-252 index. All five source-local cards appeared with their source-specific counts, IDs or explicit identity limits, scale/frame caveats, completeness boundaries, rights, and source links. The narrow side panel initially compressed two columns; the cards were changed to a single-column layout and visually rechecked after restarting the preview against the rebuilt assets. The active selected-record detail stayed separate from the independent sources; no source counts were pooled and no geometry, joins, or registrations were added.

The production build reports the existing non-blocking large-client-chunk and route-classification advisories.

## Research references

- [NeuroMorpho official API reference](https://neuromorpho.org/apiReference.html)
- [NeuroMorpho Terms of Use](https://neuromorpho.org/useterm.jsp)
