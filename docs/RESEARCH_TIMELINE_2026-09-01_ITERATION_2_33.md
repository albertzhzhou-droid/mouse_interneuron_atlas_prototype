# Research Timeline — 2026-09-01 — Iteration 2.33

> **Target transition:** `2.32.0-research.1` -> `2.33.0-research.1`
>
> **State at this record:** localhost research implementation with the 2.33 code, deterministic manifest, production build, full lint and full automated suite passing. Interactive localhost browser QA remains unverified because the available browser rejected the localhost URL under its navigation policy. No distributable package or deployment was created.

## Outcome

Iteration 2.33 adds two deliberately narrow tools for examining source evidence without filling unavailable biology.

- The admitted MICrONS visual-cortex cell+nucleus reference can now be clipped along its exact source-native x, y or z axis. One shader plane affects only the cell-segmentation surface; the linked nucleus remains intact. The operation generates no cap, repaired surface, resampled mesh, geometry, registration or spinal-cord relationship.
- Type Atlas retains the immediately previous valid source record as a URL-preserved baseline and renders an exact, whitelisted source-record delta. Changed values remain side by side; exact shared display strings appear once. The delta creates no same-cell or same-type identity and performs no normalization, harmonization or hidden-field traversal.
- The open-data audit pinned the current `GSE318731` supplementary-object inventory and admission gates, identified a biologically relevant PKD2L1+ spinal-interneuron SBF-SEM publication whose raw volume is not deposited, and confirmed that the public Janelia corticospinal FIB-SEM objects and current EMPIAR search results cannot serve as interneuron same-cell internal-geometry surrogates.

This iteration improves source inspection and makes record changes visible. It does not add a spinal interneuron membrane, nucleus, organelle, synapse, bouton, receptor, atlas registration or complete-cell EM reconstruction.

## MICrONS source-native clipping

The clipping contract is `microns-source-native-clipping-0.1`, release `ohri-microns-source-native-clipping-0.1.0`, implementing `UPG-166` with authority `DER_DISPLAY_OPERATION_ON_OBS_EM_SEGMENTATION`.

### Fixed source identity

| Field | Exact value |
|---|---|
| Source contract | `microns-observed-cell-nucleus-reference-0.1` |
| Cell root | `648518346349516051` |
| Linked nucleus | `4309` |
| Native frame | `MICrONS_Phase1_aligned_EM_native` |
| Native units | nanometre |
| Biological region | visual cortex layer 2/3 |
| Project relationship | cross-region, not spinal cord |
| Cell geometry | 372,382 vertices; 704,444 triangles |
| Nucleus geometry | 12,682 vertices; 23,344 triangles |

The immutable asset-manifest receipt remains 94,901 bytes with SHA-256 `063e66321ecfcb8633dd39be0e08d467318ea276eeae0e6fef8344b313c5f2f1`. Clipping reuses the admitted cell and nucleus position/triangle streams; it does not rewrite those buffers.

### Operation contract

| Property | Enforced behavior |
|---|---|
| Method | Three.js material clipping plane with local clipping enabled |
| User coordinate | source-native nanometres |
| Supported axes | x, y, z |
| Retained side | positive or negative |
| Render target | cell segmentation surface only |
| Default state | off; z = 80,240 nm; keep positive |
| Cell clipping planes when enabled | 1 |
| Nucleus clipping planes | 0 |
| Cap, repair, resampling and generated geometry | 0 |
| Geometry mutations, joins and registrations | 0 |
| Measurement, membrane and spinal-internal claims | false |

Exact clipping limits come from the checksum-pinned source cell positions:

- x: 193,453.140625–382,259.5 nm
- y: 142,840.671875–241,471.5 nm
- z: 817.6767578125–86,263.234375 nm

The source-to-world conversion uses the already admitted uniform display transform. Invalid axes, sides, non-finite positions and positions outside the exact source bounds fail closed. URL state persists `micronsClip`, `micronsClipAxis`, `micronsClipNm` and `micronsClipSide`. Imported active clipping is accepted only when its immutable contract and duplicated requested state agree exactly; imported runtime claims are never trusted.

The exposed opening is an uncapped shader discard, not a biological cross-section or newly observed surface. Disabling the plane restores the unmodified source buffers.

## Source-record delta inspector

The display-only contract `source-record-display-delta-0.1` compares exactly two distinct source records through an explicit row whitelist.

- On a valid type-record change, the prior record becomes the baseline and is retained in the `typeBaseline` URL parameter.
- Equality is exact JavaScript string equality. The helper does not trim, normalize, map labels, infer missing fields, harmonize namespaces or inspect unlisted fields.
- Each whitelisted row is evaluated once per record. Row IDs and labels must be unique; readers must return non-empty display strings.
- Changed rows retain old/current values side by side. Exact shared rows are collapsed into one disclosure block, reducing duplicated cards without deleting a valid shared limitation.
- The exported Type Atlas dossier includes the same deterministic delta when a baseline exists.

For the pinned Alkaslasi I1 -> I2 demonstration, eight whitelisted rows resolve to three changes and five exact shared rows:

| Dimension | I1 | I2 |
|---|---|---|
| Dataset sampling count | 1,520 nuclei | 780 nuclei |
| Source marker panel | Pax2 · Mpped2 · Slc6a1 · Piezo2 | Pax2 · Mpped2 · Slc6a1 |
| Source-region membership | Cervical 361 · Thoracic 404 · Lumbar 755 | Cervical 220 · Thoracic 208 · Lumbar 352 |

Life stage, transmitter class, missing morphology, missing internal structure and missing cross-source same-cell link are exact shared display rows and therefore appear once. These source assignments are not prevalence estimates or independent-animal denominators.

The inspector's scientific boundary is fixed at zero same-cell identities, zero same-type identities, zero admitted or generated geometry primitives, zero joins and zero registrations. A textual match or difference establishes no morphology, abundance, causality, connectivity, spatial correspondence or atlas registration.

## Open-data research audit and admission gates

### GEO `GSE318731`

Official records: [GEO series](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE318731), [supplementary directory](https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/), BioProject `PRJNA1419852`, platform `GPL34328`.

The public series currently contains 72 sample records (`GSM9501488`–`GSM9501559`) and four supplementary objects:

| Exact object name | Bytes | Admission state |
|---|---:|---|
| `GSE318731_Multiome_NHASH-IDs.csv.gz` | 970 | Metadata mapping only; not proof of cell-barcode pairing |
| `GSE318731_P56_cholinergic_multiome.rds` | 127,862,795 | Object inspection pending |
| `GSE318731_P56_gabaergic_multiome.rds` | 1,646,402,816 | Object inspection pending |
| `GSE318731_P56_glutamatergic_multiome_UPDATE.rds` | 1,832,005,077 | Object inspection pending; `_UPDATE` is the current filename |

The three RDS files total 3,606,270,688 bytes. The repository directory and HTTP headers expose no publisher-provided object checksum. The 970-byte mapping object had a locally streamed SHA-256 receipt of `73bfed0866d4159dab6e5965427f1519cd68e53fe1141b5b51a487a128df2f3d`; the multi-gigabyte RDS objects were not downloaded merely to create local hashes.

The [primary atlas paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC13308138/) reports 92,782 glutamatergic, 73,364 GABAergic and 3,199 cholinergic snMultiome nuclei, totaling 169,345, with 516 neuron types in 57 transcriptomic groups. These counts must remain separate from the paper's 616,599 Xenium neurons.

Admission remains gated on all of the following:

1. Pin full-object byte counts and locally calculated SHA-256 receipts after authorized retrieval.
2. Inspect each RDS in an isolated compatible R environment and record Seurat version, assays, layers, dimensions, metadata columns, reductions, identities and barcodes.
3. Prove RNA–ATAC pairing at the cell-barcode level. The NHASH table maps sample/library records and does not alone prove same-cell pairing.
4. Verify whether complete ATAC peak matrices, fragments or links are retained. If not, admit RNA/labels only and mark ATAC unavailable.
5. Preserve exact region, sex, biological-replicate and technical-replicate scope per cell where present; do not infer it from aggregate filenames.
6. Preserve the authors' taxonomy and distinguish snMultiome from Xenium; label transfer is not same-cell identity.
7. Use none of these molecular records to generate cell geometry, internal structures, boutons, synapses or atlas registration.
8. Keep the current project state metadata/link-only until object and derived-data redistribution rights are explicitly resolved.

[GEO's official disclaimer](https://www.ncbi.nlm.nih.gov/geo/info/disclaimer.html) says NCBI itself places no restriction on GEO data use or distribution but cannot grant rights that may be retained by submitters. The paper/preprint license does not automatically license the deposited RDS objects for redistribution in this application.

### Mouse spinal same-cell volume EM

The best biologically matched lead is Nakamura et al., [eLife 12:e83108](https://pmc.ncbi.nlm.nih.gov/articles/PMC9943067/). Its PKD2L1+ cerebrospinal-fluid-contacting neurons are GABAergic spinal interneurons, and genetically targeted SBF-SEM resolves same-cell local soma/dendritic-bulb/axon-bundle and synaptic context. However, the raw SBF-SEM stacks, segmentations and reconstruction meshes are not publicly deposited; the public source data are numerical figure data. The local imaged volume is also not a complete cell across the reported long projections. **Runtime admission: no-go; publication-only deposit watch.**

Two public Janelia/OpenOrganelle FIB-SEM datasets are exact spinal-tissue objects but fail cell identity:

- `jrc_mus-sc-zp104a`, DOI `10.25378/janelia.20134574.v1`, [official record](https://api.figshare.com/v2/articles/20134574)
- `jrc_mus-sc-zp105a`, DOI `10.25378/janelia.20134979.v1`, [official record](https://api.figshare.com/v2/articles/20134979)

Both are 6 nm isotropic, 40 × 30 × 75 µm dorsal corticospinal-tract volumes with CC BY 4.0 records. They contain descending corticospinal projection axons, not spinal interneurons, and do not provide an interneuron soma, dendritic arbor or whole-cell reconstruction. **Runtime interneuron admission: no-go; at most an explicitly labeled comparative axonal-ultrastructure reference.** The [primary paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC9402237/) does not license identity transfer.

The [official EMPIAR repository](https://www.ebi.ac.uk/empiar/about/) is CC0, but the iteration audit found no qualifying entry under exact and broader mouse/spinal/interneuron terms. Repository openness cannot compensate for wrong organism, region or cell identity. Future admission requires one stable chain across `Mus musculus`, spinal cord, interneuron identity, same-cell raw volume and segmentation, calibrated frame, object checksum and reusable rights.

## Exact no-surrogate boundaries

The following substitutions remain forbidden:

- MICrONS visual-cortex clipping -> spinal interneuron internal anatomy or membrane measurement.
- Transcriptomic or spatial label similarity -> same-cell morphology, same-type identity, organelles or connectivity.
- Shared display text -> biological equivalence.
- Janelia corticospinal axons -> interneuron soma, dendrite, organelles or whole-cell geometry.
- Publication figures -> deposited raw volume, segmentation or reconstructable mesh.
- Open repository license -> evidence of biological fit.
- Missing source type, object or assay -> numeric zero, generic geometry or procedural placeholder.

An unavailable same-cell source remains unavailable. It is not filled by cross-region, cross-modality or cross-cell interpolation.

## Files changed in iteration 2.33

New implementation roots:

- `app/microns-source-native-clipping.js`
- `data/microns-source-native-clipping-0.1.json`
- `schemas/microns-source-native-clipping-0.1.schema.json`
- `scripts/validate-microns-source-native-clipping-0.1.mjs`
- `tests/microns-source-native-clipping.test.mjs`
- `app/source-record-delta.js`
- `app/SourceRecordDeltaInspector.tsx`
- `tests/source-record-delta.test.mjs`

Integration edits:

- `app/atlas-types.ts`
- `app/SceneCanvas.tsx`
- `app/AtlasPrototype.tsx`
- `app/InternalStructureReferencePanel.tsx`
- `app/microns-import-provenance.js`
- `tests/microns-import-provenance.test.mjs`
- `app/InterneuronTypeAtlas.tsx`
- `app/globals.css`

Documentation added by this operation:

- `docs/RESEARCH_TIMELINE_2026-09-01_ITERATION_2_33.md`

Iteration and validation records:

- `data/research-iteration-manifest-2.33.json`
- `schemas/research-iteration-manifest-2.33.schema.json`
- `scripts/validate-research-iteration-manifest-2.33.mjs`
- `tests/research-iteration-manifest-2.33.test.mjs`
- `tools/build_research_iteration_manifest_2_33.mjs`
- `scripts/validate-research-iteration-manifest-2.32-snapshot.mjs`
- `tests/research-iteration-manifest-2.32-snapshot.test.mjs`
- `data/research-model-upgrade-registry-0.1.json`
- `docs/RESEARCH_MODEL_UPGRADE_QUEUE.md`

The 2.33 manifest has 75 exact authoritative inputs and 151 research/model upgrades (`UPG-022`–`UPG-169`). Its final file receipt is 109,358 bytes with SHA-256 `6b2c1571c8dccf5aeced3518435dfe4bf0bff4c605f9a9255524299d72dda081`; its canonical manifest-content SHA-256 is `1b4632ea19ea00b27422408bf96d4dabe39e7e23330d6511fe4b6ccdafa6752f`. The parent 2.32 manifest remains an immutable snapshot.

## Verification status

Completed for the current implementation:

- `node --test tests/source-record-delta.test.mjs tests/microns-source-native-clipping.test.mjs tests/microns-import-provenance.test.mjs`: **17/17 passed**, 0 failed, 0 skipped.
- `node scripts/validate-microns-source-native-clipping-0.1.mjs`: passed with 3 axes; 372,382 cell vertices; 12,682 nucleus vertices; one enabled cell plane; zero nucleus planes, generated geometry, joins and registrations.
- `node tools/build_research_iteration_manifest_2_33.mjs --check`: passed against the committed deterministic 2.33 bytes.
- `node scripts/validate-research-iteration-manifest-2.33.mjs`: passed with 75 authoritative inputs, 151 upgrades, 24 UI-whitelisted delta rows, zero generated geometry and zero registrations.
- `npm test` / `npm run test:research`: **552 tests; 548 passed, 0 failed and 4 intentionally skipped**. This route also passed the production build, whole-project lint, current data/schema/scientific validators, the active 2.33 manifest and immutable 2.28–2.32 snapshots.
- `git diff --check`: passed after the final timeline and test-contract updates.

Unverified or intentionally outside this iteration:

- Interactive browser verification of clipping direction on all axes/sides, nucleus persistence, URL restoration, prior/current type transitions, responsive layout and accessibility behavior. The available in-app browser blocked the localhost URL under its URL policy; build, SSR and source-contract tests are not a substitute for visual inspection.
- A distributable 2.33 package and deployment were neither requested for this slice nor created.
- Every `GSE318731` RDS integrity, assay, barcode-pairing and redistribution-rights gate described above.
- Any future raw-data deposit and object-level admission for PKD2L1+ CSF-contacting-neuron volume EM.

## File-specific rollback

1. To remove source-native clipping, remove only the clipping runtime, contract, schema, validator and focused test listed above; revert its imports/state/control/render/import-export/CSS integration in `atlas-types.ts`, `SceneCanvas.tsx`, `AtlasPrototype.tsx`, `InternalStructureReferencePanel.tsx`, `microns-import-provenance.js`, its import tests and `globals.css`.
2. Preserve the original `microns-observed-cell-nucleus-reference-0.1` contract, asset manifest, cell/nucleus binary buffers, checksums and source identity. Clipping rollback must not delete or regenerate the admitted MICrONS source object.
3. To remove the source-record delta, remove only `source-record-delta.js`, `SourceRecordDeltaInspector.tsx` and its focused test; revert the prior-record baseline, `typeBaseline` URL preservation, deterministic dossier delta and delta CSS integration.
4. Preserve every source taxonomy, molecular profile, source-record fingerprint and exact count. Delta rollback removes only the comparison presentation, not biological records.
5. The open-data section admitted no new biological object. Do not add or delete an RDS, EM stack, segmentation or mesh as part of documentation rollback.
6. Do not rewrite the immutable 2.32 manifest, earlier timelines or unrelated dirty-worktree files. Any separately produced 2.33 manifest, package or upgrade-queue change must be rolled back through its own exact receipt.

This rollback scope identifies the 2.33 increment only; it does not authorize broad deletion, source-data replacement or history rewriting.
