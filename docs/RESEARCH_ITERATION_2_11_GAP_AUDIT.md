# Research iteration 2.11 gap audit

Date: 2026-08-27  
Scope: public/open digital sources only; no OHRI specimens, physical sections, unpublished institutional data or inferred biological filling.

## Outcome

Iteration `2.11.0-research.1` completes UPG-050 as a source-local morphology-phenotyping slice. It does not add a new neuron, biological type, atlas coordinate, transform, synapse, projection claim or registration. It makes the already admitted 142 NeuroMorpho standardized SWCs more analytically useful while preserving every unsupported field as unavailable.

## Source and method basis

- The only geometry input is the checksum-pinned UPG-030A census: 142 repository records, 142 admitted standardized SWCs, five papers, two archives, 140 source-labelled 3D records, two source-labelled 2D records and zero registrations.
- NeuroMorpho's [standardization specification](https://www.neuromorpho.org/StdSwc1.21.jsp) defines the standardized CNG/SWC representation and source-type codes. The analysis preserves the retained node rows; it does not claim they are unprocessed tissue coordinates.
- NeuroMorpho's [FAQ](https://neuromorpho.org/myfaq.jsp) describes vectorized centre lines, branch connectivity, accepted 2D reconstructions and possible reconstruction incompleteness. Those limits are propagated to the UI.
- Sholl shells follow the geometric idea introduced by [Sholl 1953](https://pubmed.ncbi.nlm.nih.gov/13117757/), but are centred on the retained root-node coordinate because a soma centroid is not established by this asset.
- The chosen descriptive features—bifurcations, cable length, Euclidean extent, terminal paths and branch order—are consistent with the morphometric vocabulary described for NeuroMorpho's central resource ([Ascoli et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC6673130/)).

## Implemented evidence chain

1. `tools/build_neuromorpho_analysis.py` refuses input unless both pinned census hashes match.
2. It verifies all 142 declared geometry files by byte count and SHA-256, validates seven-column topology, one source-type-1 root, connectivity and zero registrations, and then derives metrics without coordinate, radius, topology or type modification.
3. It writes a compact, sorted-key `analysis-index.json` plus an asset manifest that declares the index hash and byte count.
4. `scripts/validate-neuromorpho-analysis.mjs` independently verifies the manifest, census, all geometry hashes, all 142 record metrics, all seven cohort partitions, Type-7 summaries and median Sholl profiles.
5. The browser independently verifies the analysis-index SHA-256 before presenting any derived cohort value. Failure leaves the underlying record browser available and substitutes no analysis.

## Numerical scope

| Item | Verified value | Boundary |
|---|---:|---|
| Analysed records | 142 | NeuroMorpho repository records, not animals or biological types |
| Exact source cohorts | 7 | DOI/PMID + source tertiary label + dimensionality + domain + physical integrity |
| Analysed neurite segments | 529,583 | Child-node source type is not 1 |
| Excluded type-1 child segments | 890 | Explicitly excluded from all neurite metrics |
| Source-type-6 segments | 2,353 across 2 records | Retained as uninterpreted; never promoted to axon or dendrite |
| Registrations | 0 | No atlas transform or anatomical placement |
| Complete axons | 0 | Forty-five axon-containing records are only moderate reconstructions |

## Exact cohort denominators

| Source | Source label | Geometry/domain/integrity | n records |
|---|---|---|---:|
| DOI 10.1016/j.neuroscience.2020.06.038 | Substance P-(SP) expressing | 3D · dendrites/soma/no axon · dendrites complete | 18 |
| DOI 10.1038/s41593-018-0119-z | Dynorphin-expressing | 3D · dendrites/soma/no axon · dendrites moderate | 15 |
| DOI 10.1038/s41598-023-32720-3 | vertical | 3D · dendrites/soma/no axon · dendrites complete | 30 |
| DOI 10.1097/j.pain.0000000000001406 | Gastrin-releasing peptide-expressing | 3D · dendrites/soma/axon · dendrites and axon moderate | 45 |
| DOI 10.1097/j.pain.0000000000001406 | Gastrin-releasing peptide-expressing | 3D · dendrites/soma/no axon · dendrites moderate | 1 |
| DOI 10.1097/j.pain.0000000000001406 | Substance P-(SP) expressing | 3D · dendrites/soma/no axon · dendrites complete | 31 |
| DOI 10.1113/JP283037 | unreported | 2D · neurites/soma · neurites moderate | 2 |

No row in this table is an independent-animal denominator or a prevalence sample. No pair of rows is treated as a harmonized biological comparison.

## Derived metrics and precision boundary

Each record now has stems, non-type-1 terminal nodes, non-type-1 bifurcation nodes, maximum centrifugal branch order, maximum root-path length, maximum root-node Euclidean distance, total neurite cable length, per-source-type segment/terminal/cable summaries and 10 µm Sholl intersections. Line/sphere intersections are analytic; the half-open `(0, 1]` interval prevents a shared endpoint from being counted by both adjacent segments.

The values are precise relative to the retained standardized polyline geometry. They are not biological ground truth, sub-voxel anatomy, tissue shrinkage-corrected length, acquisition-normalized morphology, or evidence that missing branches never existed. “More internally detailed” therefore means more reproducible description of admitted source geometry—not procedural anatomical completion.

## UI increment

- Two URL-addressable morphology views: individual source-local reconstructions and exact-cohort phenotyping.
- Cohort A/B and metric selectors, five-number distribution tables, retained source-type summaries and root-centred median Sholl tables.
- Selected-record phenotype panel beside the existing 3D source geometry.
- Visible checksum state, paper DOI, dimensionality, domain, integrity, record denominator and independent-animal missingness.
- Morphology-lane body text is at least 12 px; primary controls are at least 44 px. Home/End and arrow navigation work on the morphology tabs, and overflow tables are keyboard-focusable.

## Verification

- Deterministic builder reproduced both output files byte-for-byte.
- Independent all-record oracle: 142/142 scalar and per-source-type metric sets match.
- Independent Sholl oracle: all 142 profiles match, including 15,785 half-open intersections.
- Independent cohort oracle: seven cohorts and 142 unique assigned record IDs match, including Type-7 quantiles and source-type-zero inclusion.
- Focused suite: 11/11 morphology-analysis tests pass.
- Standalone validator: 142 records; seven exact cohorts; two type-6 records; zero registrations.
- Full working-tree gate passes: build, lint, all scientific/data validators and 202/204 tests pass; two legacy release-manifest tests are intentionally skipped outside the frozen 2.8 source tree.
- Frozen 2.8 archive gate passes independently: 141 files, zero registrations and ZIP SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`.
- Final browser QA passes at 1440×1000 and 390×844: zero console errors, no page-level mobile overflow, URL-state restoration, keyboard tab navigation and individual/cohort switching all verified.

## Intentionally empty or unresolved

- Atlas coordinates, laminar placement, named segment placement and specimen-specific transforms.
- Same-cell or exact-type links to Russ, Sathyamurthy, SCI evidence entities or reference anatomy.
- Independent animal, donor and specimen identifiers; prevalence and population-frequency denominators.
- Complete axons, synaptic edges, circuit membership and projection targets.
- Harmonized cross-paper effect sizes, acquisition normalization, shrinkage correction and inferential statistics.
- Histological images, source tissue sections and any procedural filling of missing branches.

## Next implementation priority

UPG-049 is now the highest-priority product/research slice: one Research Explorer, grouped global search and a single explicit `focusKind` + `focusId` context that keeps Summary, Evidence, Gaps and Provenance on the same selected record. UPG-051 and UPG-052 then unify missingness/source-universe semantics and restore field-level citation locators. This work must not manufacture cross-source identity edges.

The refreshed open-data watch also adds five non-admitted candidates: UPG-060 adult nocifensive ensembles and UPG-063 T9-crush SCI time states are the strongest next evidence lanes; UPG-061 separates long ascending/descending V0g propriospinal evidence; UPG-062 is blocked by multimodal sample/rights reconciliation; and UPG-059 remains permission-gated projection-neuron context under CC BY-NC-ND. None supplies an all-interneuron adult mouse atlas with complete single-cell 3D morphology, synapses and SCI state, so those combined fields remain empty.
