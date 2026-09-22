# Research iteration 2.12 gap audit

Snapshot date: 2026-08-27  
Working label: `2.12.0-research.1`  
Completed slice: UPG-049 Research Explorer

## Outcome

Iteration 2.12 makes the existing evidence lanes searchable and focus-consistent without adding a new biological record or relationship. A deterministic local index exposes 339 source records under one canonical `focusKind` + `focusId` contract. Search results stay grouped by source namespace, and the selected Summary, Evidence, Gaps and Provenance panels resolve from the same exact record.

The slice creates zero registrations, zero cross-source identity edges, zero morphology-to-type links, zero cell-to-atlas placements and zero inferred synapses. An unknown or incomplete focus fails closed; it never substitutes the first record. Missing anatomy, morphology, sample, coordinate, connectivity, rights or denominator fields remain missing.

## Exact source-record denominator

| Focus kind | Records | Scientific unit |
|---|---:|---|
| `molecular_profile` | 112 | 69 Russ + 43 Sathyamurthy source-population records; not deduplicated types and not all confirmed interneurons |
| `morphology_record` | 142 | NeuroMorpho repository reconstruction records; not independent animals or a biological census |
| `anatomy_label` | 73 | Exact source-atlas labels in 37 study-region, three structural-context and 33 motor-context lanes; not cells or types |
| `sci_entity` | 7 | Project evidence entities, including state overlays; SYN/SCH and unregistered |
| `source_lane` | 5 | Project-curated literature coverage lanes; not biological records |
| **Total** | **339** | Heterogeneous source records; the total is a search denominator only |

## Deterministic asset contract

- Asset set: `ohri:research-explorer-index:1.0.0`
- Index bytes: `2,122,347`
- Index SHA-256: `cc99d2a4dffcca13e1bcecc34a57fc6d3f1361cc3cc824324a6103d6ac79a80b`
- Input count: nine files
- Registration count: zero

The builder reads only the current pinned SCI release, Russ and Sathyamurthy taxonomies, NeuroMorpho census and derived analysis, fine-anatomy payload and source manifest, and knowledge-coverage matrix. The output is rebuilt from those records rather than being handwritten into the UI. The manifest pins every input byte count and SHA-256.

## Search and identity boundary

- Search terms are literal retained labels, markers, source names, DOI/PMID, accessions and locators.
- Ranking is exact ID, exact title, ID prefix, title prefix, namespace prefix, then literal text.
- Results are grouped by lane and namespace. `Vsx2` therefore returns separate Russ, Sathyamurthy and SCI records rather than one synthesized “Vsx2 type.”
- DOI and accession co-occurrence is bibliographic discovery, not biological identity.
- No search record contains a project registration or an admitted relationship outside its own source record.

## Canonical focus and fail-closed behavior

The parent application owns the selected research object, active research lab, query and dossier view. Canonical URLs use:

```text
focusKind=molecular_profile
focusId=russ-2021:Excit-36
lab=types
```

Legacy `type`, `morphologyNeuron`, `anatomyStructure`, `coverageLane` and `cell` selections are read only when the canonical pair is absent. New URL serialization writes the canonical pair and does not allow two simultaneous selection authorities.

Type, morphology, anatomy and coverage components report selections into the shared focus. Their filters retain a focused record outside the visible result set and show an explicit notice; they do not display another record. The SCI filter now follows the same rule. The provenance helper also returns an empty trace for a null or unknown entity instead of falling back to release entity zero.

## Dossier semantics

Every indexed source record supplies:

- an exact canonical identity and source namespace;
- a source-bounded summary;
- evidence rows with authority and locator;
- explicit gaps with status and reason;
- citation, DOI/accession, URLs, locators and available object hashes;
- geometry/frame/registration/measurement metadata;
- a hard scientific boundary; and
- source-specific navigation parameters.

These common fields normalize presentation, not biology. The dossier does not harmonize denominators, translate coordinate frames, map taxonomies or create relationships.

## Validation gates

- Standalone manifest/index/input hash validator.
- Exact 339-record, five-kind and 13-namespace denominator checks.
- Canonical-key uniqueness and focus-specific navigation checks.
- Mutation tests for relationship promotion, registration, stale navigation and asset drift.
- Separate-result tests for `Vsx2`, DOI and accession discovery.
- Canonical parse/serialize, legacy migration and invalid-focus tests.
- SCI provenance null/unknown fail-closed regressions.
- SSR checks for the default Explorer, canonical focused type lane and focus retained outside filters.

## Remaining scientific gaps

1. No same-cell molecular–morphology–spatial–SCI dataset is admitted.
2. No morphology is registered to the reference atlas; complete axons remain zero in the current 142-record census.
3. The 112 molecular profiles remain source-local and non-deduplicated; local-interneuron versus projection status remains unresolved where the source does not establish it.
4. The 73 anatomy labels are reference-region geometry, not interneuron placement or cell counts. Spinal segment labels and independent biological validation remain unavailable.
5. Connectivity remains absent except for separately bounded literature assertions; co-location, tracing, ligand–receptor prediction or functional influence is not a direct synapse.
6. Source-universe and assertion-level citation semantics remain fragmented outside the Explorer. UPG-051 and UPG-052 remain the next software/data-model priorities.
7. Researcher-mode full-app typography, zoom, screen-reader and live mobile verification remain incomplete under UPG-053.

## Next research intake

The refreshed public-data watch ranks Matson et al. / GSE172167 first for a neuronal SCI temporal-state adapter, followed by Arokiaraj adult dorsal-horn spatial/regulatory data and the Serafin pDyn-lineage series. They remain research-watch entries only. Exact downloadable objects, file-level reuse terms, checksums, sample manifests and source-specific boundaries must pass before any source object enters the model.
