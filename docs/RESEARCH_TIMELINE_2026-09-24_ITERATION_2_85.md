# Research timeline — iteration 2.85 (2026-09-24)

## Scope and outcome

Added UPG-257 as a P1 source-data audit for Koh et al.'s larval-zebrafish spinal sensorimotor-circuit supplements. The published article page identifies a 216.8-KB XLSX, and the methods describe source object IDs/type labels, synapse coordinates and pre-/postsynaptic references, plus a tripartite-glia list. This is a newly identified comparative fine-detail route, separate from the existing raw-volume gate in UPG-081.

The actual XLSX payload could not be inspected in this environment. Its sheets, row counts, stable-ID namespace, coordinate metadata and the presence of any reconstruction payload therefore remain unverified. The new watch explicitly holds ingestion and rendering until those checks and the supplement-specific reuse review pass. This iteration adds no zebrafish or mouse source record, cell count, morphology, synapse point, internal compartment, geometry, identity join or registration.

## Scientific scope and boundaries

- The article describes a 6-dpf zebrafish spinal EM volume (74 × 74 × 207 µm; 9 × 9 × 21 nm voxels) from one healthy animal. Its local circuit spans DRG neurons, interneurons and motor neurons and also examines astroglial contacts.
- Paper-described Knossos object IDs and synapse-reference fields are not yet verified against the actual workbook. Do not claim a parsed roster or exact workbook denominator.
- Named zebrafish neuron classes do not establish mouse interneuron types. Study-level counts remain source-specific and are not a mouse denominator.
- Synapse coordinates or glial contacts are not complete neuronal morphology or organelle-level interior segmentation. No geometry is rendered and no source objects are bundled.
- The article reports CC BY-NC-ND; file-level rights and permission to redistribute any derived object remain unresolved.

## Queue and denominator state

UPG-257 is classified as a connectivity research watch with worksheet, stable-ID, coordinate, object-scope and rights gates open. The model-upgrade queue contains 239 rows, 69 completed rows and now ends at UPG-257. The canonical research-source registry and its prior denominators are unchanged; this discovery is not counted as an admitted source.

## Verification

`npm run test:research` passed: production build, lint, all registered data and research validators, and 976 regression tests (961 passed, 15 conditionally skipped, 0 failed). The research-source registry remained at 31 sources, 41 record sets, 13 exact cell/profile rosters, 4 exact source-object sets and 387 profiles; the stale-literal check reported zero. The upgrade registry regenerated deterministically at 239 rows with 69 completed and 44 IDs resolved in the research UI. The 2.85 manifest snapshot tests pass and pin the 2.84 parent, the uninspected-workbook boundary, zero geometry admission and zero change to the mouse denominator.

The production build reports the existing non-blocking large-client-chunk and route-classification advisories. The full test run also emits the current Node module-register deprecation warning.

## References

- [Koh et al., *Cell Reports* article and associated data](https://pmc.ncbi.nlm.nih.gov/articles/PMC12958134/)
- [Supplementary XLSX listed by PMC](https://pmc.ncbi.nlm.nih.gov/articles/instance/12958134/bin/NIHMS2142936-supplement-2.xlsx)
