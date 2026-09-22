# Research timeline — iteration 2.37

Date: 2026-09-02  
Version: `2.37.0-research.1`  
Parent: immutable `ohri-mouse-interneuron-research-iteration-2.36.0`  
Status: unpackaged localhost research iteration

## Purpose

Iteration 2.37 addresses the observed UI-to-knowledge-base gap. A selected research record must control the active research lane, evidence rail and visual target as one atomic state. Switching a source-local interneuron profile must expose its own available evidence, while evidence that the source does not provide remains explicit and cannot be filled with a generic cell, procedural organelle or cross-source proxy.

## Evidence increment

The iteration adds a deterministic adapter for Roome et al., *Ontogeny of the spinal cord dorsal horn* (`10.1126/science.adx5781`; `GSE291462`). Only the published supplementary workbooks are used for the compact local derivative.

- Table S6 (`Sheet1!A1:F158`): 157 refined dIL types, exact captured-cell counts, percent composition and three cluster-QC measures.
- Table S7 (`neuron_refined_markers!A1:G15901`): all 15,900 deposited differential-feature rows across 159 labels.
- Two non-roster developmental labels, `dILA-Immature` and `dILB-Immature`, remain outside the exact 157-type roster.
- Twenty-six non-text gene cells caused by spreadsheet date coercion remain null and quarantined; no apparent date is repaired into an asserted gene.
- Six display features per type are selected deterministically using adjusted p-value at most 0.05, positive log2 fold change, `pct.1` at least 0.25 and prevalence delta at least 0.10. They are labelled positive differential features meeting display thresholds, not canonical markers.

Biological and technical denominators remain separate: 15 biological litter pools, 3–10 embryos per pool, 30 attempted Chromium reactions, one excluded reaction and 29 retained technical outputs. The captured-cell flow is 337,422 pre-filter cells, 195,146 post-filter cells, 94,048 neurons and 61,444 refined dIL cells. Twenty-nine is not presented as a biological-replicate count.

The source workbooks remain link-only. The compact factual derivatives are bundled with attribution. GEO and the public analysis-code repository remain link-only under `NOASSERTION`; no source object or unlicensed code is copied.

## UI and data changes

- `UPG-180` is completed by the 157-profile Roome taxonomy and the complete 15,900-row feature-evidence contract.
- `UPG-181` is completed by one canonical focus transition that resolves the selected record, research lab, evidence panel and visual target together.
- Molecular selection clears any previously rendered morphology. It exposes zero admitted cell-geometry primitives and zero same-record internal primitives.
- The current-record evidence rail prioritizes source-local label, denominator, marker or feature evidence and QC before shared rows.
- Every multi-record molecular namespace has a unique four-row preview fingerprint; shared dataset/project limits appear once in a consolidated disclosure.
- The checksum-verified Explorer index is memoized per browser session, so switching records does not repeatedly fetch, hash and parse the same approximately 7.9 MB asset.
- Direct morphology selection routes to the morphology lab and retains the exact source-local visual target and geometry receipt.
- `UPG-182` remains planned: a ZExplorer zebrafish spinal E/I SWC adapter is link/receipt-only, retains raw SWC type 7 as unknown and cannot establish a mouse-type mapping.

## Denominators after the change

- 579 Research Explorer records.
- 325 source-local molecular/functional profiles across eight namespaces.
- 149 source-local morphology records retained as `142 frozen census + 7 supplementary`.
- 73 anatomy labels, 17 SCI populations, seven SCI entities and eight coverage lanes.
- 27 canonical sources and 31 record sets.
- Eight coverage lanes by seven precision axes: 56 explicit judgments.
- 164 research-model upgrades from `UPG-022` through `UPG-182`.

These are source-record counts, not a deduplicated biological cell-type census or prevalence estimate.

## Geometry and internal-detail boundary

This iteration adds zero morphology objects, zero internal-structure objects, zero same-cell cross-modal joins and zero registrations. Roome scRNA-seq cells and Xenium cells are different cells; RCTD label transfer is not a same-cell join. The supplementary tables do not supply dendrites, axons, synapses, electrophysiology, organelles, whole-cell surfaces or a deposited 3D transform. Therefore a Roome type may change its molecular evidence fingerprint but must leave the 3D cell scene empty. Missing evidence is not a biological zero.

No sphere, averaged arbor, inferred membrane, inferred nucleus, inferred organelle, pseudo-depth, cross-source morphology or representative cell is generated.

## Deterministic inputs and validation

The 2.37 manifest inherits the 127 inputs locked by 2.36, refreshes their current receipts for this in-place iteration, adds the Roome contracts and tooling, the focus workspace/evidence rail, the immutable 2.36 snapshot checks, the upgrade-registry tooling, this timeline and the two newly pinned current UI/test files. It records the exact immutable 2.36 parent file and content hashes.

Required release gates:

```text
npm run lint
npm run build
npm test
npm run test:frozen-2.8
node tools/build_research_explorer_index.mjs --check
node tools/build_research_upgrade_registry.mjs --check
node tools/build_research_iteration_manifest_2_37.mjs --check
```

Focused acceptance tests cover exact workbook re-derivation, source/feature denominators, quarantine integrity, all-namespace preview uniqueness, index memoization, atomic focus routing, stale-geometry clearing, schema validation, parent-chain integrity and mutation rejection.

## Rollback

Rollback is file-specific. Restore the 2.36 versions of the inherited files whose receipts changed, remove only the 2.37 Roome/focus/manifest/timeline additions, restore `package.json` and `package-lock.json` to `2.36.0-research.1`, and point `app/atlas-types.ts` back to `data/research-iteration-manifest-2.36.json`. Rebuild the 2.36 Explorer and upgrade registry only with their 2.36 builders and verify the immutable 2.36 snapshot receipt.

Do not delete or overwrite historical manifests, timelines, the frozen `2.8.0-curator.1` package or source assets. No full-project copy, complete-content-folder copy or distributable package was created in this iteration.
