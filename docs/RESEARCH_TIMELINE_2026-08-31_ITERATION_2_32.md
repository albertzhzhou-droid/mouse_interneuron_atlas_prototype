# Research Timeline — 2026-08-31 — Iteration 2.32

> **Version transition:** `2.31.0-research.1` -> `2.32.0-research.1`
>
> **Release state:** unpackaged localhost research iteration; no full-project copy, distributable package, deployment or new biological-source object was created.

## Outcome

Iteration 2.32 closes the most visible UI-to-knowledge mismatch without inventing missing biology.

- A non-SCI research focus now has no active SCI entity. The last SCI selection may remain dormant only for URL/state restoration; it is not passed to the renderer, evidence card or selected-row highlight.
- Active scientific selection and keyboard navigation are independent: a non-SCI focus retains exactly one roving tab stop in the population list without reactivating an SCI entity. An imported `selectedId: null` remains null, while a valid SCI focus canonically owns its persisted selection.
- Molecular selections receive one shared, source-record-specific evidence fingerprint. Alkaslasi I1 and I2 now visibly differ in exact sampled-nucleus count, marker context and deposited region membership while both retain zero admitted cell geometry.
- Research Explorer and Type Atlas now read the same source-taxonomy life-stage facts for Sathyamurthy (`adult`) and Alkaslasi (`adult; source mice aged 8 weeks`); an unknown exact record remains explicitly unreported.
- Shared project limits are collapsed once per fingerprint. Detailed metadata remains available on demand, and record-specific gap counts remain unchanged.
- All 149 admitted morphology objects now expose checksum-gated source topology, canonical source-type availability, and exact root, branchpoint and terminal landmarks.
- Missing SWC source types remain `UNAVAILABLE`, never biological zero. Type 1 remains standardized soma samples, not a soma contour. Terminal landmarks are not boutons or synapses.

## Root-cause audit

The source index was changing when users selected different molecular records, but `AtlasPrototype` updated the active SCI entity only when the new focus was itself an SCI entity. The prior SCI selection therefore remained attached to `SceneCanvas`, so I1 -> I2 could update the type card while leaving the same SCI anchor/scaffold visible.

The 413-record Explorer also contained only 43 distinct summary strings and 17 distinct boundary strings. Its 3,634 structured gap rows intentionally reuse shared dataset/project limits, but the UI was repeating that content as if it were record-specific. A large set of internal snake/camel-case tokens was also reaching primary card text.

The first focus fix also coupled selected-row highlighting to the list's roving tab stop, which removed the entire population list from sequential keyboard navigation under a non-SCI focus. Separately, Explorer's generic life-stage fallback missed source facts already retained by Type Atlas. Both gaps are now resolved without creating an active SCI selection or inferring age from another record.

This iteration changes presentation and focus ownership, not the underlying evidence record. Shared scientific limits are collapsed; source-specific facts remain visible; unsupported fields remain missing rather than being filled.

## Focus-synchronized evidence fingerprint

The active entity contract is now explicit:

| Focus state | Active SCI entity | Main-scene morphology | Primary information surface |
|---|---:|---:|---|
| `sci_entity` | exact selected entity | none unless separately admitted | SCI evidence card |
| `molecular_profile` | 0 | 0 | source-record fingerprint |
| exact admitted main-scene `morphology_record` | 0 | exact matching source object | morphology dossier + topology detail |
| viewer-only `morphology_record` | 0 | 0 | exact source-specific viewer |
| anatomy, SCI population or source lane | 0 | 0 | exact selected research dossier |

The fingerprint exposes source label, namespace, observation unit, exact retained sampling count where available, marker context, region evidence, life stage/transmitter context and evidence-axis status. Machine tokens are humanized. It states `0 admitted cell-geometry primitives` and never generates a sphere, representative cell, neurite arbor or internal structure for a molecular profile.

Life stage is resolved only from the exact record or its pinned source taxonomy. Sathyamurthy and Alkaslasi therefore display the same authority in Explorer and Type Atlas; unknown records fail closed as `not retained in this exact record`.

Exact demonstration records:

| Record | Sampled nuclei | Marker panel | Deposited region membership |
|---|---:|---|---|
| Alkaslasi I1 | 1,520 | Pax2, Mpped2, Slc6a1, Piezo2 | Cervical 361; Thoracic 404; Lumbar 755 |
| Alkaslasi I2 | 780 | Pax2, Mpped2, Slc6a1 | Cervical 220; Thoracic 208; Lumbar 352 |

These counts are source-row assignments from an enriched cholinergic dataset, not prevalence, independent-animal denominators or a cross-study type identity.

## Exact morphology topology detail

`UPG-150` is complete over exactly `142 frozen census + 7 supplementary` objects.

| Metric | Exact value |
|---|---:|
| Viewable source objects | 149 |
| Frozen-census records | 142 |
| Supplementary records | 7 |
| Source nodes | 566,511 |
| Source segments | 566,362 |
| Neurite segments | 565,423 |
| Terminal landmarks | 6,957 |
| Bifurcation landmarks | 6,223 |
| Records with source type 1 | 149 |
| Records with source type 2 | 51 |
| Records with source type 3 | 147 |
| Records with source type 4 | 0 |
| Records with other/uninterpreted source types | 2 |

The deterministic runtime retains the deposited SWC node/parent table, independent source frame, membership, geometry receipt, source-type domains, per-domain cable/terminal/bifurcation/branch-order/root-distance metrics, 10 µm Sholl profiles and exact landmark node IDs. No coordinate, radius, topology or source-type rewriting is allowed.

The renderer uses line-cross data overlays for root, standardized type-1 samples, branchpoints and terminals. It creates zero biological surfaces. The individual viewer and comparator expose a checksum-gated topology table and make canonical type availability explicit rather than padding missing types with zeros. A browser runtime guard also rejects unknown membership, invalid membership arithmetic, missing or duplicate source domains, malformed type-1 samples, and absent type 2/3/4 rows padded with numeric values.

## Public-data queue update

The upgrade registry now contains 148 rows through `UPG-166`.

- `UPG-163` plans a source-local adult-mouse spinal Xenium adapter from [BIL 10.35077/g.1196](https://doi.brainimagelibrary.org/doi/10.35077/g.1196). The study reports 523 ten-micrometre sections, 480 genes and 616,599 neurons. Exact run/file receipts and final curated labels remain gated. Simplified polygons and section imagery cannot become reconstructed neurites, full cells, organelles, synapses or an extruded 3D neuron. BIL states [CC BY-SA 4.0](https://www.brainimagelibrary.org/download.html).
- `UPG-164` records `GSE318731` adult-mouse spinal snMultiome as metadata/link-only pending exact RDS barcode/assay verification and object-level redistribution rights. RNA-ATAC pairing must be proved within the deposited object; Multiome-to-Xenium label transfer is not same-cell identity. See the [primary study](https://pmc.ncbi.nlm.nih.gov/articles/PMC13308138/).
- `UPG-165` records a dated no-go result: no qualifying public mouse-spinal-interneuron volume-EM object was found with one stable identity chain across raw volume, calibrated frame, cell/internal masks, type evidence, overlays, rights and checksums. [EMPIAR's CC0 policy](https://www.ebi.ac.uk/empiar/policies/) does not by itself establish biological fit.
- `UPG-166` plans an exact source-native clipping inspector for the already admitted MICrONS visual-cortex cell+nucleus reference. It may clip the cell shell only, add no caps or geometry, and transfers no spinal identity, scale, type or internal-structure claim.

## Iteration receipt

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `data/research-iteration-manifest-2.32.json` | 98,357 | `eaacd5bb0acae3c704e24ac2c1ffa4ef508bc5491155898bec6f28a825ea5e77` |
| Canonical 2.32 manifest content | — | `4b0ed4508655553736b656f7a72a6d2e869218e0a4eff886811c7f0f15e113a2` |
| `data/morphology-topology-detail-0.1.json` | 5,032 | `85a4c8c379d8893a216de37c7f3d5e2010c72b2bdad1df491214bdbe29557541` |
| `public/data/morphology_topology_detail_v1/index.json` | 902,933 | `fdd6c1e4e6b5bf7032ec45719ec630245e078599c47915d46b72914d69e3d5b9` |
| `schemas/morphology-topology-detail-0.1.schema.json` | 8,327 | `f8298aea3ca7d18f10b1bd64f13159d5835725e8ea008c88197d633c2a2b98a5` |
| `app/source-local-morphology-geometry.js` | 17,661 | `18132bdba00acb8a79a5e5f5da05a5c5f33b3d2a8efb490c942753260bc0d0f9` |
| `app/MorphologyTopologyDetailPanel.tsx` | 10,531 | `0e7288e18cd9378c28a21bc9da5ad4f3ef745d7e5d909e77c9e4cc1b554dd462` |
| `app/morphology-topology-detail-runtime.js` | 10,233 | `4e38bd5dffe7b4fdf6ef163453adaef7c83e345b226d119e7cec7c6384a4e88c` |
| `app/ResearchRecordEvidenceFingerprint.tsx` | 3,935 | `be01d48ac8fbaed072f2b41d3d893636970cebf2832d69fbe3d43f591bd2e315` |
| `app/research-explorer-index.js` | 15,930 | `6d659cbe15b96cbc8d59a67d31cbe1719b577ed4a6e5cdc53fd425a26310749a` |
| `app/research-visual-target.js` | 5,742 | `5c8c75c1f2e93b183fd3a198fe4c2f44420db8b3ba19ce2615aed9d45bf01314` |
| `app/AtlasPrototype.tsx` | 118,272 | `73b86872c03d7bc67a2e8f6dfb69734f67a37c5072e03c61d15f8e58f5c4bb55` |
| `data/research-model-upgrade-registry-0.1.json` | 342,804 | `3b3246a4da0eed06330097944836358ac864cf0949b6ced501fd8c3597e3327a` |

The active manifest locks 63 authoritative inputs, 161 indexed molecular profiles, 149 topology records and 148 research-upgrade rows. Its parent is immutable iteration 2.31 at 87,120 bytes, file SHA-256 `49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996`, and canonical content SHA-256 `c714ba7ac7f306987b0344899c20381eda6a568d57b222773746839c687a0fd4`. The historical 2.31 resolver receipt remains unchanged even though 2.32 pins the superseding live resolver bytes.

## Validation evidence

- `npm run build`: passed. The existing large-client-chunk advisory remains non-blocking.
- `npm run lint`: passed.
- Full `npm test`: passed with **536 tests total, 534 passed, 0 failed and 2 intentional skips**.
- Topology detail focused tests: **10/10 passed**, including browser-runtime mutation gates.
- Topology landmark-rendering focused tests: **3/3 passed**.
- Focus-target tests: **11/11 passed**.
- Rendered-English/SSR tests: **36/36 passed**, including distinct I1/I2 fingerprints and zero surrogate geometry.
- Research Explorer index tests: **16/16 passed**, including shared source-taxonomy life-stage authority.
- Iteration 2.32 manifest tests: **8/8 passed**; deterministic builder and standalone validator passed.
- Immutable iteration 2.31 snapshot tests: **6/6 passed**.
- `git diff --check`: passed.

Interactive in-app browser QA was unavailable in this run: the browser client rejected the localhost claim/reload under its URL policy, and a replacement local server could not bind its inspector port in the sandbox (`EPERM` on `0.0.0.0:9229`). No alternate browser-control route was used. Server-rendered UI tests and the production build passed, but this limitation means no new 2.32 screenshot is claimed.

## Scientific boundaries and remaining work

Iteration 2.32 improves fidelity to available evidence; it does not fill unavailable biology.

- Molecular and SCI population records still have no admitted cell morphology unless an exact stable source key connects them to one source object.
- The 149 NeuroMorpho records expose external reconstruction topology, not cell membrane, nucleus, cytoplasm, organelles, receptors, boutons, synapses, molecular identity, physiology or complete biological axons.
- Two records remain source-planar with z unavailable. Every morphology remains independently framed and unregistered.
- Repeated shared limitations still exist in the structured knowledge layer because they are valid project/dataset constraints; the UI now collapses them instead of presenting each repetition as a new record-specific fact.
- The MICrONS reference remains one visual-cortex cell plus linked nucleus and cannot be assigned to a spinal record or interneuron type.
- No public volume-EM source currently passes the same-cell spinal internal-detail gate; internal modeling therefore remains unavailable rather than procedural.
- No project copy, package copy, deployment, atlas registration or cross-source identity was created.

## File-specific rollback

1. Revert the SCI active/retained/roving-selection changes in `app/AtlasPrototype.tsx` and `app/research-visual-target.js` plus their focus tests to undo focus synchronization. Preserve the exact morphology resolver behavior and the immutable 2.31 manifest receipt.
2. Revert `app/ResearchRecordEvidenceFingerprint.tsx`, `app/research-explorer-index.js` life-stage resolution, and the Type Atlas/Research Explorer integration and CSS to undo the fingerprint. Do not delete or rewrite source taxonomy records.
3. Revert the topology-rendering additions in `app/source-local-morphology-geometry.js`, `app/SceneCanvas.tsx`, `app/SourceLocalMorphologyViewport.tsx`, `app/MorphologyViewer.tsx` and `app/MorphologyComparePanel.tsx` to remove the overlay/UI only.
4. Remove only the 2.32 topology root/runtime/schema/builder/validator/tests and browser runtime guard to undo `UPG-150`. Do not alter the frozen 142-record census, seven supplementary source objects, SWCs or earlier analysis artifacts.
5. Revert UPG-163–166 in `docs/RESEARCH_MODEL_UPGRADE_QUEUE.md`, then deterministically rebuild and validate the upgrade registry.
6. Move aside only the exact 2.32 manifest builder/data/schema/validator/test and repoint the active application import to the immutable 2.31 snapshot. Never rebuild or rewrite the 2.31 manifest.

This rollback list identifies only the 2.32 increment. It does not authorize deletion or overwriting of unrelated project files.
