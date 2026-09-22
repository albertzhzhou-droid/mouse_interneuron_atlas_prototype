# Research iteration 2.22 — exact Ronzano premotor positions

Date: 2026-08-30  
Scope: public/open digital evidence only  
Upgrade state: UPG-114 partially completed — segment-pooled exact-coordinate phase; UPG-117 planned — exact-annotation roster phase

## Outcome

This iteration adds an exact, source-local three-coordinate lane without filling any unsupported part of a neuron.

- UPG-114 admits 22 official Ronzano et al. segment workbooks: 11 raw-coordinate files and 11 normalized-coordinate files.
- The admitted workbooks contain 14,484 raw rows and 17,394 normalized rows, or 31,878 rows across two independent representations.
- Every rendered point is one numeric source row. It is not a soma surface, a generated cell, a neurite, an atlas placement, a molecular type or a synaptic edge.
- Five LG segment pairs have different raw and normalized row counts. No point identity is admitted across frames, including the six TA pairs whose row counts and z sequences match.
- The next molecular-taxonomy candidate is the adult cholinergic spinal atlas from Alkaslasi et al. UPG-117 is a bounded execution phase for the broader UPG-041 research watch, not a claim that the application now covers all adult spinal interneurons.

## UPG-114 source and biological scope

Primary source:

- [Ronzano et al., “Spinal premotor interneurons controlling antagonistic muscles are spatially intermingled”](https://doi.org/10.7554/eLife.81976)
- [Official eLife article](https://elifesciences.org/articles/81976)
- [Official figures and source-data inventory](https://elifesciences.org/articles/81976/figures)
- [PMC9844990](https://pmc.ncbi.nlm.nih.gov/articles/PMC9844990/)
- PMID 36512397

Source scope:

- Species: *Mus musculus*.
- Injection age: P1–P2.
- Analysis interval: 8–9 days after injection.
- Region: lumbar spinal cord, source segments L1–L6; the admitted LG segment series begins at L2.
- Tracing context: ΔG rabies viral tracing in ChAT-Cre/+; Rosa26-RΦGT neonatal mice for the pooled LG and TA coordinate series.
- Source-reported comparison denominator: 11 LG experiments and seven TA experiments.

The experiment counts describe the source comparison. They are not recoverable row-level experiment IDs in the 22 admitted segment-pooled workbooks, and they are not a denominator for every experiment in the paper.

## Exact object and integrity receipts

| Object | Bytes | SHA-256 or canonical receipt | Meaning |
|---|---:|---|---|
| 22 official source workbooks | 1,046,636 | 2b8b75cae1a7cd559dc4b213923538c5a08b66ecd7a8dfec4b72a355aa8e7481 | SHA-256 of the canonical sorted filename + byte count + file SHA-256 + row-count receipt lines; this is not a ZIP or concatenated-file digest |
| Derived exact positions payload | 1,274,690 | abf46460d0e37c2ea82b90f2eaf6531d5df8f44e9dcea8448d43d321835184f3 | Exact numeric XYZ cells copied in source-file row order |
| Position-reference contract | 38,612 | 37833a6db9f1f6345f0ccc9f71083f9b11b7e8f232b8e4fa6d5879618092d82d | Current iteration contract containing source URLs, file receipts, coordinate semantics, cross-frame audit and missingness |

The source row key is source-file ID plus one-based Excel row. All admitted workbooks have zero header rows and exactly three finite numeric columns in x, y, z order. The derivation performs no smoothing, interpolation, imputation, registration, point pairing, deduplication, coordinate rounding, cell generation or geometry generation.

### Row denominators

| Representation | Official files | LG rows | TA rows | Total rows |
|---|---:|---:|---:|---:|
| Raw | 11 | 6,849 | 7,635 | 14,484 |
| Normalized | 11 | 9,759 | 7,635 | 17,394 |
| Across independent representations | 22 | 16,608 | 15,270 | 31,878 |

The final row is a data-row denominator across two representations. It is not a count of 31,878 unique cells, independent animals, biological types or atlas-registered objects.

## Official workbook manifest

Each file below is linked to the exact official eLife CDN object admitted in this iteration.

| Frame | Muscle | Segment | Rows | Bytes | SHA-256 | Source URL |
|---|---|---|---:|---:|---|---|
| Raw | LG | L2 | 867 | 24,107 | 2a6a22807f185acf1dd0b6dcecca2e20eaf900f45eb8485cbfc8b5cef0d0cdb1 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data2-v3.xlsx) |
| Raw | LG | L3 | 1,229 | 33,308 | 24a515c12ad26187a9f19c4bb080b0afca2092257461e73931d9ce5bc24caca5 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data3-v3.xlsx) |
| Raw | LG | L4 | 2,017 | 52,381 | 8e26c080042880b097adc039f9e84797be470f0b12df7c3e202a083e33d9ae7d | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data4-v3.xlsx) |
| Raw | LG | L5 | 1,850 | 47,325 | 56fa098c95f42deb28b69356df65d5fff6e43055273f600372d082fc1798e9bc | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data5-v3.xlsx) |
| Raw | LG | L6 | 886 | 26,236 | e308fbc0e4ed877bd42a73f714428aca556196a943133361db17a12ca53dcf87 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data6-v3.xlsx) |
| Raw | TA | L1 | 296 | 9,658 | 34c0863e7686978d751a5d0ef6b1595804ec8a20ef19eebc0a6e13e18926e1e1 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data7-v3.xlsx) |
| Raw | TA | L2 | 883 | 24,686 | 4c8229e1447c1bed035750448c6574c95af56ca77558e107a3fb0c7da17aef66 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data8-v3.xlsx) |
| Raw | TA | L3 | 1,519 | 40,998 | e3016288fa54c15b4113d5899df622935356d5eef458c82eff8d7ec90434d82a | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data9-v3.xlsx) |
| Raw | TA | L4 | 1,923 | 51,694 | 2ee6e529636e6e6e7b16bd2df78bade11eab4c7d1bcd73d28667a1db6c3f405f | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data10-v3.xlsx) |
| Raw | TA | L5 | 1,891 | 50,383 | 7ab88071d8f3b6782804057f704edd800139e5c320c590bbc46731716807a9eb | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data11-v3.xlsx) |
| Raw | TA | L6 | 1,123 | 31,631 | 448d575329a12b2b3cc1bdcb8369da3880a286a66e8251fb3e2f070ad875dc11 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data12-v3.xlsx) |
| Normalized | LG | L2 | 1,521 | 56,846 | 1afaf1b38370f9b47221a6bf71446ff5aa625ae79598eabfead6aafd77ee2120 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data2-v3.xlsx) |
| Normalized | LG | L3 | 2,136 | 78,667 | fd8216a12ed55a1d4621106c41be350935890535aae5c3d60cfb833d2375d34c | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data3-v3.xlsx) |
| Normalized | LG | L4 | 2,802 | 103,767 | c66428958fdbfaf1f477ffa0c60e3ecf546e84c69fb109842a7b80a7f951e91 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data4-v3.xlsx) |
| Normalized | LG | L5 | 2,348 | 86,569 | 387a65ac47c26fd009d70968235dd34d1124d8172e931a3225a4821dd8f138da | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data5-v3.xlsx) |
| Normalized | LG | L6 | 952 | 37,950 | 92c5a5ef86e894075204f996f5778663899029bf950c280ef1514df3c1142a7b | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data6-v3.xlsx) |
| Normalized | TA | L1 | 296 | 13,113 | bc7e0870fca86284686eb581b0fd53138b6a16e06c8b144217259a8712f56482 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data7-v3.xlsx) |
| Normalized | TA | L2 | 883 | 34,133 | bfbbc44c598521ccdf09d5ca0aae34e91bdc6073406686a1a22018c8a8f61829 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data8-v3.xlsx) |
| Normalized | TA | L3 | 1,519 | 56,947 | bc9ce3f32beae7b89345a510fcfd6848002351f520684cae317983218c2eab39 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data9-v3.xlsx) |
| Normalized | TA | L4 | 1,923 | 72,126 | 2c9f7561bfbfd6f52c80491a74ccd6350e8d80b795a6cf3b8fcb12a404a20783 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data10-v3.xlsx) |
| Normalized | TA | L5 | 1,891 | 70,778 | 2b4938b9dbcbd799a7d5b2d79977d82db4c10b09e0f0f03118ed3e33f08fa64c | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data11-v3.xlsx) |
| Normalized | TA | L6 | 1,123 | 43,333 | 619ea71b0f340446e11988213a33aa9cb2a2c43a9823ebfff6158d3fb551b5b6 | [official workbook](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp1-data12-v3.xlsx) |

## Coordinate-frame semantics

### Raw frame

- x and y are the source coordinates before normalization.
- z is in micrometres and shifted so zero is the L4/L5 border; negative z is rostral.
- The viewer may apply a uniform fit for display. That fit is not a biological transform or a measurement frame.

### Normalized frame

- x is the source section-normalized mediolateral coordinate relative to central-canal and white-matter reference points.
- y is the source quadrant-normalized dorsoventral coordinate relative to central-canal and white-matter reference points.
- z retains the source micrometre definition and L4/L5 origin.
- The viewer multiplies x by 1,700 μm and y by 900 μm to match the source's illustrational idealized-cord scaling, keeps z unchanged and then uniformly fits the result to the viewport.
- This display transform does not make the points measurable or register them to the project's Allen-derived reference anatomy.

Both frames remain source-local and unregistered. Project registration count and atlas-join count are zero.

## Cross-frame audit

| Muscle | Segment | Raw rows | Normalized rows | Count match | z-sequence match | Admitted point identity |
|---|---|---:|---:|---|---|---|
| LG | L2 | 867 | 1,521 | No | No | No |
| LG | L3 | 1,229 | 2,136 | No | No | No |
| LG | L4 | 2,017 | 2,802 | No | No | No |
| LG | L5 | 1,850 | 2,348 | No | No | No |
| LG | L6 | 886 | 952 | No | No | No |
| TA | L1 | 296 | 296 | Yes | Yes | No |
| TA | L2 | 883 | 883 | Yes | Yes | No |
| TA | L3 | 1,519 | 1,519 | Yes | Yes | No |
| TA | L4 | 1,923 | 1,923 | Yes | Yes | No |
| TA | L5 | 1,891 | 1,891 | Yes | Yes | No |
| TA | L6 | 1,123 | 1,123 | Yes | Yes | No |

The five LG discrepancies prohibit row pairing. Matching TA counts and z order still do not establish identity because the source provides no stable cross-workbook cell key. The application therefore switches between two independent representations and never animates, joins, deduplicates or compares a presumed same point across frames.

## Available and unavailable filters

The admitted segment-pooled files support:

- coordinate frame: raw or normalized;
- injected-muscle group: LG or TA;
- lumbar segment: source-supported L1–L6 membership;
- display-only camera and point-size controls.

They do not support:

- experiment or individual-animal filtering;
- laboratory filtering;
- tracing-method filtering within the admitted pooled series;
- per-section or per-cell molecular-type filtering.

Those fields are not hidden implementation work. They are absent from the admitted segment-pooled workbook schema. Adding an experiment, animal, laboratory or method filter would require admitting a separate source object with explicit row-level fields and a new checksum/schema audit.

## Rights and redistribution boundary

The eLife article and its published supporting source-data files are CC BY 4.0:

- [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Copyright 2022 Ronzano, Skarlatou, Barriga et al.

The 22 workbooks and exact positions derivative are retained with source attribution. Their inclusion does not waive attribution, suggest endorsement or change the scientific scope of the source. Any separately hosted code or non-article object still requires its own rights audit.

## UPG-114 no-inference policy

The lane must fail closed. It may show a point only after the positions payload passes the expected byte-count and SHA-256 check.

The application must not:

- generate a soma, membrane, nucleus, dendrite, axon, bouton, receptor, organelle or other cell geometry from a point;
- treat muscle-group membership as a complete synapse or partner roster;
- attach a molecular type, electrophysiological phenotype, SCI state or adult placement to a point;
- register raw or normalized coordinates to the current reference anatomy;
- infer a same physical cell across raw and normalized workbooks;
- interpret pooled point counts as prevalence, population frequency, independent-animal replication or a complete interneuron census;
- fill missing geometry or identity with a procedural fallback.

The valid authority statement is: **source-observed labelled-cell position only, early postnatal, source local, unregistered**.

## UPG-117 — Alkaslasi adult cholinergic spinal taxonomy candidate

UPG-117 is the bounded next implementation phase for the broader UPG-041 research watch.

Primary sources:

- [Alkaslasi et al. 2021, Nature Communications](https://doi.org/10.1038/s41467-021-22691-2)
- [GEO GSE167597](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE167597)

Exact candidate object:

| Field | Value |
|---|---|
| GEO filename | GSE167597_all_AlkaslasiPiccus_annotations.csv.gz |
| Bytes | 333,655 |
| SHA-256 | 6e69c106544a394dd23b6e7b4fc2d159a715aaa8a70adbd61721338e8d29c091 |
| Total deposited nuclei | 34,231 |
| Source-labelled interneuron subset | 5,375 nuclei across I1–I8 |
| Species and age | Mouse; source cohort reported at eight weeks |
| Sampling design | Chat-Cre/Sun1-FACS enrichment with reporter history |

### Exact interneuron-subset denominator

| Source cluster | Nuclei |
|---|---:|
| I1 | 1,520 |
| I2 | 780 |
| I3 | 756 |
| I4 | 702 |
| I5 | 584 |
| I6 | 544 |
| I7 | 160 |
| I8 | 329 |
| Total | 5,375 |

### Source region-membership denominator

| Source region label | Interneuron-subset nuclei |
|---|---:|
| Cervical | 1,392 |
| Thoracic | 1,489 |
| Lumbar | 2,494 |
| Total | 5,375 |

The deposited label **Lumbar** is retained verbatim. GEO describes the associated collection context as lumbar/sacral. These values are sample-membership categories, not x, y or z coordinates, laminar positions, segment registrations or anatomical centroids.

### Sampling and claim boundary

The Chat-Cre/Sun1-FACS design enriches a reporter-defined cholinergic lineage/state. Therefore:

- 5,375 is an exact subset denominator inside this deposited object, not the prevalence of interneurons in an unbiased whole cord;
- I1–I8 are source clusters, not eight universal canonical interneuron types;
- cluster size differences are not biological abundance estimates;
- the roster cannot be used to infer cell density, segment distribution, connectivity, morphology or population frequency;
- skeletal and visceral motor populations remain source context and must not enter the interneuron subset.

No admitted field supplies xyz coordinates, soma or neurite morphology, electrophysiology, synapses, partners, membrane, nucleus shape, organelles or atlas registration.

### UPG-117 rights boundary

The publisher article and article-hosted source-data material are CC BY 4.0. That licence must not be silently extended to the separately deposited GEO object.

GSE167597 and the exact annotation filename are publicly accessible, but a file-level redistribution licence for the GEO annotation object has not been pinned. Until that is resolved:

- keep the exact GEO object remote;
- retain its official acquisition URL/recipe, filename, byte count and SHA-256;
- do not claim that the package may redistribute the compressed GEO object;
- expose a derived exact roster only within the applicable source terms and with the enrichment and no-prevalence boundary attached.

### UPG-117 acceptance gate

The planned phase may be marked complete only when:

1. The object is acquired from the official GEO endpoint and re-verifies at 333,655 bytes and SHA-256 6e69c106544a394dd23b6e7b4fc2d159a715aaa8a70adbd61721338e8d29c091.
2. A deterministic parser preserves every source nucleus identifier and source field required to reproduce the 34,231-total and 5,375-interneuron denominators.
3. I1–I8 counts reconcile exactly to 1,520, 780, 756, 702, 584, 544, 160 and 329.
4. Cervical, thoracic and Lumbar membership counts reconcile exactly to 1,392, 1,489 and 2,494.
5. Motor and other non-interneuron source records remain visible as excluded context rather than being silently deleted or counted.
6. The Chat-Cre/Sun1-FACS enrichment and reporter-history boundary is visible wherever counts appear.
7. Region is rendered as sample metadata, never as spatial geometry.
8. Morphology, synapses, organelles, xyz, atlas registration, prevalence and cross-source identity remain explicitly unavailable.
9. The package records a file-level rights decision. If redistribution rights remain unverified, the source object stays remote.

## Iteration-level no-inference conclusion

UPG-114 improves exact source-local position coverage. UPG-117 would improve exact adult cholinergic molecular-taxonomy coverage. They answer different questions and must remain separate:

- a Ronzano point has no admitted molecular cluster;
- an Alkaslasi nucleus record has no admitted 3D point or morphology;
- co-display creates no same-cell, same-type, lineage, anatomical-registration or connectivity edge.

Neither source fills the current model's membrane, nuclear, organelle, receptor, bouton, partner, complete-axon or same-cell multimodal gaps. Those fields remain empty unless a checksum-pinned public source explicitly supplies and links them.
