# Research iteration 2.10 gap audit

Snapshot date: 2026-08-27  
Release label: unpackaged `2.10.0-research.1` localhost research iteration  
Input policy: published literature and public digital datasets only

## Implemented in this iteration

1. The Research Atlas is now the first/default information experience, ahead of the separate 3D SCI-evidence workspace.
2. A two-source Spinal Neuron Type Evidence Atlas retains 112 source-population records as two non-merged namespaces:
   - 69 Russ 2021 source populations, including 65 project-designated interneuron/projection candidates;
   - 43 Sathyamurthy 2018 adult-lumbar neuronal clusters, including 42 non-motor spinal-neuron records whose local-interneuron versus projection-neuron status remains unresolved and one explicit VC-2 motor-neuron context record.
3. Type profiles support source, region, transmitter and free-text filtering; source-local dossier inspection; field locators; two-to-four-record comparison; JSON export; and URL-restored tab, profile and comparison state.
4. The Sathyamurthy contract distinguishes 24 GEO accessions from 19 independent pooled Drop-Seq samples (9 baseline, 5 formalin, 5 rotarod), retains the condition-by-sex sample split (4M/5F, 3M/2F, 3M/2F), records two mice per pooled sample and the derived 38-mouse source denominator, and distinguishes 10 formalin sequencing reactions from five biological replicates. Its 4,280 assigned neuronal nuclei remain dataset sampling counts; no profile-specific animal denominator is recoverable. It preserves the raw GEO `DE12` anomaly separately from the paper display label `DE-12` and never converts either into a new biological identity.
5. Six developmental-lineage relationships are retained only as `marker_context_only` / `not_established` hints. Exact cross-source identity and project registration counts both remain zero.
6. The researcher-facing gaps summary now foregrounds missing identity joins, non-lumbar morphology, complete axons/synapses, transforms, whole-spine molecular coverage and SCI spatial-state coverage rather than administrative intake status.
7. A sibling anatomy v2 asset adds selected-one-at-a-time lazy full-native-volume exact masks and voxel-face surfaces for all 73 represented direct labels in separate 37-study-region, three-structural-landmark and 33-motor-context lanes. It preserves 38,845,542 exact-identifier voxels as 52,062 row runs and 214,841 exact rectangles / 429,682 browser triangles. A separate unit-face set oracle independently expands 11,138,364 stored source-boundary faces and reports zero missing, duplicate, shifted, oppositely oriented or extra faces. Every record is excluded from interneuron counts; the asset performs no interpolation, smoothing, decimation, hole filling, or manual completion and remains `INF`, measurement-forbidden, and `0 REG`.

## Evidence and integrity receipts

| Object | Pinned evidence | Implemented boundary |
|---|---|---|
| Sathyamurthy article | DOI `10.1016/j.celrep.2018.02.003`; PMCID `PMC5849084`; Figure 4 and results locators retained | Article is CC BY-NC-ND 4.0; figures are not rebundled or adapted |
| GEO cluster metadata | GSE103892; `GSE103892_Sample_Cell_Cluster_Information.txt.gz`; 114,576 bytes; SHA-256 `2a22f9b19db27c43dc6632e15395d63a4eb8b0087d1ac5b491411c01d1e41d30` | Source object is not bundled; public access is not treated as a separate redistribution licence |
| Source sample frame | 24 GEO accessions; 19 independent pooled samples; 9 baseline, 5 formalin, 5 rotarod; condition sex split 4M/5F, 3M/2F, 3M/2F; two mice per pool; 38 mice derived from reported pooling; 10 formalin sequencing reactions from five biological replicates | Accession, sequencing-reaction, pooled-sample, mouse, nucleus and profile counts are distinct denominator levels; no profile-specific animal count is available |
| Source-profile arithmetic | 5,369 rows with a neuron-cluster field = 1,089 generic `Neuron` rows + 4,280 rows assigned to the displayed 43 profiles | Counts describe the processed dataset sample, not biological prevalence or independent animals |
| Source labels and markers | 43 distinct source-local labels, exactly three Figure 4 marker strings per profile, explicit field locators | Source putative assignments are not canonical identities |
| Activity context | 21 source entries across 17 profiles; two source-reported rotarod non-detections retained for DE-4 and DI-9 | Fos/cFOS association is not electrical firing, necessity, sufficiency, connectivity or SCI evidence |
| Rights | Article licence and GEO-object reuse uncertainty stored separately | Derived factual metadata only; no source matrix or figure body is distributed |
| Full native annotation volume | `[1567, 253, 322]` uint32 z-y-x source volume; semantic SHA-256 `1e5ee2daaeabd3505572f5efdb92e700387f7bd794720e78ec21511338500d12`; v2 sibling manifest SHA-256 `d77b526acc6a80326f75ba3131e885f9d7841b5d01b184daa3651a48f1e85c20` | Exact only relative to the pinned source voxel grid; the independent face oracle checks encoding fidelity, not biological ground truth, sub-voxel anatomy, cell placement, or a count of interneurons |

## Current precision ledger

| Lane | Present precision | Important empty or unresolved portion | Admission rule |
|---|---|---|---|
| Reference anatomy | 38 checksum-locked native planes; 73 represented direct source labels; 76 pixel-exact native RGBA overlays; 2,431 browser-lane components and 2,511 sampled-mask rings; lazy full-native-volume exact masks/surfaces for all 73 labels in three lanes, preserving 38,845,542 voxels as 52,062 runs, 11,138,364 unit faces and 214,841 rectangles / 429,682 triangles | No sub-voxel accuracy, anatomical measurement, named segment mapping or independent biological validation; 670 browser and 1,144 motor-context sampled structure-plane absences remain explicit | Keep sampled edges and full-volume surfaces exact to the pinned voxel grid; keep every atlas region outside interneuron counts; never interpolate, smooth, decimate, fill holes or claim segment/cell identity from visual similarity |
| Molecular types | 112 source records in two namespaces; profile-level markers, scopes, counts and locators | The 42 Sathyamurthy non-motor profiles remain unresolved as local interneurons versus projection neurons; zero exact cross-study identities; no linked morphology, electrophysiology, projection target, synaptic connectivity, cross-source same-cell identity, cell coordinates, SCI context or registration; incomplete whole-spine, age and injury coverage | Shared markers may create only a reviewable candidate relationship |
| Morphology | 142 QC-admitted source-local SWCs; 140 source-3D and two source-2D | All lumbar; 48 lack diameter; 45 have only moderate axon; zero complete axons; zero molecular/SCI links | Never synthesize absent neurites or register without a validated specimen-specific transform |
| SCI evidence | Seven evidence entities and condition-specific claims/limits | No cell-level spatial registration; no dense injury-state 3D atlas | Keep tested perturbation, association and inferred mechanism as different evidence grades |
| Connectivity | Typed scientific boundaries only | No dense synapse-resolved adult mouse spinal-interneuron connectome | Co-location, marker overlap, projection overlap and functional influence cannot become a direct synaptic edge |

## Highest-priority remaining work

1. **Internal-anatomy precision:** obtain a genuinely independent anatomical benchmark for the completed 73-label three-lane native-volume surface set. The current set oracle verifies mask-to-surface encoding only. SpinalTRAQ remains a separate candidate reference for a held-out transform benchmark, not an automatic replacement or registration.
2. **Whole-spine molecular/spatial coverage:** inventory Cano-Gomez/BIL objects by specimen, spinal level, coordinate frame, panel and rights; retain projection neurons as a distinct context lane and the source 22-anchor TPS as author-space only.
3. **Type reconciliation:** add adult P56 V1 and cholinergic source taxonomies before any broader consensus mapping; keep age, region, lineage enrichment and selection bias explicit.
4. **Morphology analysis:** add paper-aware cohort summaries and deterministic Sholl/branch-order/terminal metrics only for admitted SWCs, with reconstruction completeness and non-independent-animal uncertainty visible.
5. **Research retrieval:** add grouped global search and an assertion-level citation index without collapsing source namespaces.
6. **Accessibility:** complete screen-reader, contrast, zoom, touch and mobile-long-page verification. The current slice improves type size, primary targets, roving lists, Home/End tabs and keyboard-scrollable comparison, but does not constitute a formal assistive-technology audit.

## Explicit no-go results

- Do not fill an empty anatomical region with a hand-drawn or generative structure.
- Do not interpolate, smooth, decimate, hole-fill, repair, or manually complete a native-volume surface; exactness to the pinned voxel grid is not sub-voxel accuracy or anatomical ground truth.
- Do not infer a dendrite, axon, synapse, cell position or whole-spine extent from transcriptomic or tissue-image context.
- Do not count 112 source records as 112 unique biological types or confirmed interneurons.
- Do not interpret “non-motor” as established local-interneuron identity; projection-neuron status remains unresolved for the 42 Sathyamurthy non-motor profiles.
- Do not interpret 4,280 assigned nuclei as animal replication, biological abundance or prevalence.
- Do not collapse GEO accessions, sequencing reactions, pooled samples, mice, nuclei or profiles into one denominator.
- Do not convert the app's co-display into a same-cell, same-type, same-coordinate or causal relationship.
- Do not reuse the frozen `2.8.0-curator.1` release identity for this research working tree.

## Verification status

- Native-volume asset validator: passed for 73 exact source-ID masks in three semantic lanes, 38,845,542 source voxels, 52,062 row runs, 11,138,364 exposed unit faces, 214,841 lossless voxel-face rectangles, 429,682 triangles, and zero missing/extra faces by an independent set oracle; `INF`, measurement forbidden, and `0 REG`; manifest SHA-256 `d77b526acc6a80326f75ba3131e885f9d7841b5d01b184daa3651a48f1e85c20`.
- Focused Sathyamurthy schema and semantic validator: passed.
- Focused Sathyamurthy regression tests: 7/7 passed.
- Production build: passed; the only build notice is the existing advisory for client chunks larger than 500 kB.
- ESLint including accessibility rules: passed.
- Full research suite: 193 tests, 191 passed, zero failed and two expected release-lock skips. This includes a viewer-path regression proving that the normalized fine-anatomy contract retains the three-lane policy required to validate the 73-record native-volume manifest.
- Frozen `2.8.0-curator.1` isolation check: passed for 141 files with zero registrations; ZIP SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`.
- Production-browser verification: passed at 1440 × 1000 and 390 × 844. The Atlas lane loaded the checksum-matching v2 manifest, rendered study-region ID 1, structural-landmark ID 65 and motor-context ID 29 from separate lazy payloads, and removed the ID 65 ready state immediately when the motor lane began loading. Each ready state reported zero missing/extra unit faces and the structural/motor copy explicitly excluded those regions from interneuron counts. At 390 px, the three lane buttons, active lane selector and full-volume-surface label hit area each measured 44 px high, with no horizontal overflow; browser diagnostics contained no console errors. Current-run evidence: `output/research-iteration-2.10/browser-qa/atlas-three-lane-native-volume-desktop-1440x1000.jpg`, `atlas-structural-context-id65-desktop-1440x1000.jpg`, and `atlas-motor-context-id29-mobile-390x844.jpg`.
