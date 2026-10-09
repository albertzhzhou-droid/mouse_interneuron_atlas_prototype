# W04 / M4 · bounded current source gate

2026-09-30：**本轮核验范围内 0 条满足 M4 的 exact mouse spinal interneuron volume + segmentation + parent + calibrated frame chain**。这是五个已知 near-miss 记录及有限官方域名检索的当前结果，不是所有仓库或世界范围的缺失结论。没有新增摘要卡片；没有重复 BIL 检索。

Current normalized evidence is `data/mouse-spinal-m4-source-gate-20260930.json`. It pins six newly retrieved official JSON files, **285,196 B**, plus the eight WT reference source files, **1,410,836 B**: **14 current source files / 1,696,032 B**. Every file has exact URL, bytes and SHA256. The three older repository/near-miss/PKD2L1 audits remain intact with their own pinned byte fingerprints; the historical EMPIAR count 3,119 and old UI search counters were **not** re-enumerated or presented as current.

| Exact current record | Verified current source scope | M4 gate result |
| --- | --- | --- |
| [WT 20134574](https://api.figshare.com/v2/articles/20134574) + [manual nuclei 26513224](https://api.figshare.com/v2/articles/26513224) | Both v1, CC BY 4.0; exact shared parent `jrc_mus-sc-zp104a`; two bounded source chunks and local affines acquired | Independent native 2D reference is permitted. Nucleus instance 2 remains partial and cell class unknown; no cell/soma/type crosswalk or IN chain. |
| [Mutant 20134979](https://api.figshare.com/v2/articles/20134979) | Current v1, CC BY 4.0; `jrc_mus-sc-zp105a`, ATL1 KI / REEP1 KO dorsal corticospinal-tract volume | Projection/tissue source does not establish an exact spinal IN. Only metadata acquired this refresh. |
| [eLife 83108](https://api.elifesciences.org/articles/83108) | Version 2, 247,909 B, SHA256 `854963b39bbb091f4cf3a03c470e3a644a69444741b59aa6287b31ed10f97944`; **same bytes as 2026-09-23 historical receipt** | Current formal availability describes numerical source data for Figures 2 and 7. Figure 4 and Video 5 remain publication EM media; inspected metadata supplies no deposited voxel/mask/object-parent frame chain. The 71 light-traced cells are not an EM object census. |
| [BioStudies S-BSST609](https://www.ebi.ac.uk/biostudies/api/v1/studies/S-BSST609) and [/info](https://www.ebi.ac.uk/biostudies/api/v1/studies/S-BSST609/info) | Public; 10 listed files: optical TIFF/CZI/LSM/LIFF archives, LabChart/electrophysiology and spreadsheets | No exact segmented spinal IN EM volume identified in the inspected study metadata. Archive payloads were not downloaded. |
| [BioStudies S-BIAD2822](https://www.ebi.ac.uk/biostudies/api/v1/studies/S-BIAD2822) and [/info](https://www.ebi.ac.uk/biostudies/api/v1/studies/S-BIAD2822/info) | Public, CC-BY-4.0; 24 listed files; human breast cancer, mouse lung tumor, mouse 4T1 and human MB-231 biosamples; 3D nucleus annotation is breast cancer | Actual volume/segmentation resource, but wrong tissue/identity for this M4 lane. |

`data/source-candidates/mouse-spinal-m4-20260930/receipt.json` preserves an initial eLife 406 content-negotiation failure and its successful wildcard-header retry. Final six requests succeeded. Network/API failures are never used to prove source absence.

## Bounded search freshness

Current searches used official EBI/Janelia/Figshare/eLife domains for `mouse spinal interneuron volume electron microscopy segmentation raw data repository`, exact mouse spinal IN terms, and spinal IN volume/segmentation EMPIAR terms. Query strings, domains and screened exclusions are recorded in the current JSON. The returned primary-source excerpts included [CREMI](https://cremi.janelia.org/data/) (Drosophila), [spinal V1 work](https://elifesciences.org/articles/95172) (quantitative/confocal/Neurolucida source scope), [local inhibitory myelin study](https://elifesciences.org/articles/15784) (visual cortex), and [Shox2 work](https://elifesciences.org/articles/42519v1) (paired recordings). No returned excerpt established the complete required M4 chain. Excerpt screening is not full repository enumeration; no universal candidate denominator is assigned.

## Exact restart conditions

Reopen the M4 source gate when an explicit candidate supplies:

1. Public mouse spinal source accession/version and bounded downloadable voxel address, checksum and exact reuse terms.
2. Deposited cell/soma, nucleus and requested intracellular masks/contours with stable object and parent IDs.
3. Evidence that the exact segmented parent object is an interneuron. Unknown type remains unknown when identity evidence is absent.
4. Axes, units, spacing, origin/translation and segmentation-to-raw affine in the same source frame. Atlas transforms are separate.
5. Annotation method, exact object rights/attribution and distinct absent/unknown label semantics.
6. Exact same-acquisition cell/parent crosswalk for any same-cell internal chain. Shared tissue, named region or spatial overlap alone does not establish it.

The current gate can be reproduced offline using `tools/build_mouse_spinal_m4_source_gate.py`; `scripts/validate-mouse-spinal-m4-source-gate-20260930.mjs` checks all current and historical fingerprints, five exclusions, preserved source scope and zero scientific admissions. Reacquisition uses only the six known small JSON endpoints in `tools/mouse-spinal-m4-fetch-metadata.py`, capped at 1 MB per metadata response. No source-open automation or indefinite polling was introduced.
