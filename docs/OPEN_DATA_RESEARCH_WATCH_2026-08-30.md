# Open-data research watch: exact premotor positions and expression-versus-translation states

Snapshot date: 2026-08-30  
Scope: public digital data and images only; no OHRI specimens, unpublished records, physical material, or institution-supplied research data.

## Selection decision

This audit adds three non-duplicative public-data opportunities. The two Ronzano studies provide the strongest newly verified object-level spinal-neuron position records: one exposes three-coordinate lumbar premotor-cell tables, while the other exposes source-local two-coordinate divergent-premotor and long-descending propriospinal records plus soma-area measurements. The Lister series adds a different axis—RNA abundance versus translation during peripheral neuropathic pain—but supplies no cell positions or morphology.

| Upgrade | Public opportunity | Visualization value | Decision |
|---|---|---|---|
| UPG-114 | Ronzano et al., eLife 81976 | Exact source-local early-postnatal lumbar premotor-cell points with raw/normalized frame and experiment/muscle/method filters | P0 exact-object audit; go after full workbook manifest, schema and checksum capture |
| UPG-115 | Ronzano et al., eLife 70858 | Exact source-local 2D divergent-premotor/long-descending propriospinal maps and soma-area distributions | P1 exact-object audit; go as a separate 2D evidence view, never repaired into 3D |
| UPG-116 | Lister et al., eLife 100451 and GEO GSE265957 | Tissue-, condition-, time-, target- and assay-aware RNA-versus-translation state exploration | P1 metadata/remote-data adapter; no bundled GEO asset until file-level reuse terms are explicit |

These sources do not replace the existing priorities for adult whole-cord spatial data, adult multiomic type coverage or NeuroMorpho reconstruction coverage. They add source-specific observations with different life stages, experimental units and modalities.

## Shared admission policy

- Every record must retain species, source-declared life stage, spinal region, experimental unit, modality, stable source ID, exact file URL, byte count, SHA-256, rights state and source coordinate/assay frame.
- A coordinate row is an observed labelled-cell position in that study, not an observed soma surface, dendrite, axon, molecular type, atlas registration or synaptic edge.
- Raw and normalized coordinates are separate representations. A display toggle may switch between them; it must not imply that either frame is registered to the project's Allen-derived anatomy.
- Pooled files, experiments, animals, sections, cells and sequencing libraries are different denominator levels and must not be summed or renamed interchangeably.
- Public downloadability is not by itself a file-level redistribution licence. Metadata and acquisition recipes may be stored even when source files cannot be rebundled.
- Missing source files, fields or rights must fail closed. No procedural neuron, imputed coordinate, synthetic transcript profile or generic internal structure may appear as fallback.
- Cross-source co-display defaults to `co_display_only`; these three sources establish zero same-physical-cell joins to the current molecular, morphology, SCI, synapse or internal-detail lanes.

## UPG-114 — eLife 81976 exact lumbar premotor-coordinate adapter

### Primary source and stable objects

- [Ronzano et al., “Spinal premotor interneurons controlling antagonistic muscles are spatially intermingled”](https://doi.org/10.7554/eLife.81976), PMID 36512397, PMCID [PMC9844990](https://pmc.ncbi.nlm.nih.gov/articles/PMC9844990/).
- [Official eLife figures and source-data inventory](https://elifesciences.org/articles/81976/figures).
- Audited example object: [Figure 3—figure supplement 2—source data 1](https://cdn.elifesciences.org/articles/81976/elife-81976-fig3-figsupp2-data1-v3.xlsx), 15,157 bytes, SHA-256 `8a9eb3b3f1a0f9ac5d26bd5ac58dfe94141e29150b868169a446ff8d6fee8615` at this snapshot.

The eLife article and its published source data are distributed with the article under CC BY. Any separately hosted executable code still requires its own repository-level licence audit before reuse.

### Species, life stage, region and experimental unit

- Species: *Mus musculus*.
- Life stage: early postnatal. The central ChAT-Cre/RΦGT comparison injected P1–P2 mice and analysed them 8–9 days later; additional source cohorts use their own injection, endpoint, laboratory and tracing-method fields. No record may be collapsed to an adult label.
- Region: lumbar spinal cord, L1–L6, with the source's own transverse and rostrocaudal coordinate definitions.
- Experimental unit: an individual injected-animal experiment. A coordinate row is a labelled neuron within an experiment; a pooled workbook is an aggregation, not an additional animal or an independent replicate.

For the principal Figure 3 LG-versus-TA comparison, the source reports 11 LG experiments and 7 TA experiments. This is a comparison-specific denominator, not a total-animal count for every method and figure in the paper. The audited example workbook contains 515 non-header numeric `x`, `y`, `z` rows; those 515 positions are not 515 types, independent animals or representative cells from the whole spinal cord.

### Modality and coordinate semantics

- Modality: viral premotor-circuit tracing followed by histological cell detection and positional mapping.
- Raw-coordinate files preserve source-measured transverse `x`/`y`; `z` is shifted so the L4/L5 border is the origin and negative values are rostral.
- Normalized files scale transverse coordinates to an idealized 1,700 μm by 900 μm spinal-cord section while retaining the source-defined rostrocaudal axis in micrometres.
- The figures page also exposes per-experiment workbooks in which interneuron and motor-neuron records may be separated by sheet. The full file/sheet inventory must be parsed rather than inferred from filenames.

### Permitted model and visualization

- Render each admitted coordinate as a point or non-cellular centroid glyph in its source frame.
- Filter by experiment ID, injected muscle, laboratory, tracing method, spinal segment and raw-versus-normalized frame.
- Preserve motor-neuron rows as motor-context records outside the interneuron count.
- Show source-reported experiment denominators beside density or overlap summaries; pooled points must not become prevalence estimates.
- Expose the exact source file, sheet, row, coordinate transform description and checksum for every selected point.

### Strict non-inference limits

- No dendrite, axon, soma contour, membrane, nucleus, organelle, bouton, receptor or synaptic partner is supplied.
- A traced premotor relationship does not provide a complete connectome, synapse count, synaptic strength or full axon path.
- The source does not identify a molecular transcriptomic type for each point.
- The normalized frame is not an atlas transform, and neither raw nor normalized coordinates may be placed in the current 3D reference anatomy without a separately validated registration.
- Early-postnatal organization cannot be relabelled as adult organization or transferred to SCI.
- Differences across laboratories or tracing strategies must remain visible as method effects; they cannot be pooled silently into one biological population.

### Go/no-go and acceptance gate

**Go:** source-local point viewing, filtering and source-reported spatial summaries after object admission.  
**No-go:** neurite generation, atlas placement, adult transfer, molecular typing, inferred edges or internal-cell completion.

Acceptance requires:

1. A complete official workbook manifest with stable URL, figure locator, file version, bytes and SHA-256.
2. Per-sheet schemas that distinguish interneurons, motor neurons, pooled rows, per-experiment rows, raw coordinates and normalized coordinates.
3. Exact experiment, muscle, segment, injection age, endpoint age, laboratory, method and section-sampling fields wherever the source supplies them; missing values remain null.
4. A reversible coordinate-frame receipt documenting axes, origin, direction, units and every display transform.
5. Point counts that reconcile independently to each admitted workbook and to the source's experiment-level summaries without treating cells as biological replicates.
6. A visible `early postnatal`, `source local`, `not atlas registered`, `point position only` disclosure and zero generated neurite/internal-detail primitives.

## UPG-115 — eLife 70858 divergent-premotor and propriospinal source tables

### Primary source and stable objects

- [Ronzano et al., “Proximal and distal spinal neurons innervating multiple synergist and antagonist motor pools”](https://doi.org/10.7554/eLife.70858), PMID 34727018, PMCID [PMC8631798](https://pmc.ncbi.nlm.nih.gov/articles/PMC8631798/).
- [Official eLife figures and source-data inventory](https://elifesciences.org/articles/70858/figures).
- Audited example object: [Figure 3—source data 1](https://cdn.elifesciences.org/articles/70858/elife-70858-fig3-data1-v2.xlsx), 17,469 bytes, SHA-256 `c787ac2d3a8472e2123155c76f2d9f97532765414edb2542b48a27d02aad0131` at this snapshot.

The eLife article and published source data are CC BY 4.0.

### Species, life stage, region and experimental unit

- Species: *Mus musculus*.
- Life stage: neonatal/early postnatal. The paper reports P1–P3 hindlimb injections and approximately P9–P10 endpoints for the principal tracing cohorts; every admitted experiment must retain its exact source fields.
- Region: the source divides the cord into cervical C1–T1, thoracic T2–T11, lumbar L1–L6 and sacral S1–S4 regions and analyses 30 μm transverse sections.
- Experimental unit: an injected-animal/muscle-pair experiment. Cells and section measurements are nested observations, not independent animals.

The primary synergist-versus-antagonist comparison comprises seven muscle-pair experiments—four synergist and three antagonist. Source-reported regional and figure-specific denominators must remain separate. The article explicitly notes that double infection underestimates the true fraction of divergent premotor neurons; displayed percentages therefore remain apparent detection rates.

### Audited workbook structure and modality

- Modality: modified monosynaptic rabies-virus tracing, fluorescence labelling, transverse cell mapping and soma cross-sectional measurement.
- The first sheet of the audited Figure 3 workbook has 93 non-empty rows including one header row, yielding 92 source cell records. Its fields include sample, cord division, identity, labelling, injected muscles, medio-lateral position and dorso-ventral position.
- The second sheet has 136 non-empty rows including its header and carries soma cross-sectional area measurements across source-defined regions/classes. The admission parser must establish exact observation count, grouping and missingness from the sheet rather than treating every numeric row as a new animal.
- The audited cell-map sheet provides two normalized transverse coordinates. It does not provide a `z` coordinate or a reconstructable axon path.

### Permitted model and visualization

- Render source-local 2D transverse point maps by sample, muscle pair, spinal division, single/double labelling and source-declared cell class.
- Plot soma cross-sectional area only as a separate measured field with its own region, group and denominator.
- Represent source-supported divergence or long-descending premotor status as typed tracer-evidence assertions linked to the original sample/figure/table locator.
- Retain cervical long-descending propriospinal neurons as a source population, not a complete molecular type or a reconstructed projection.

### Strict non-inference limits

- Do not add a synthetic third coordinate, interpolate an axon, draw a source-to-target trajectory or register the points to project anatomy.
- Double labelling is evidence under the tested tracing design; it is not a complete estimate of divergence prevalence or synapse number.
- Soma cross-sectional area is not a 3D soma mesh, total cell volume, neurite morphology or internal structure.
- Source-labelled boutons/appositions, where reported, do not by themselves supply a complete connectome or synaptic strength.
- The workbooks do not assign a transcriptomic type to every cell.
- Early-postnatal evidence cannot be represented as adult or SCI circuitry.

### Go/no-go and acceptance gate

**Go:** source-local 2D maps, soma-area distributions and direct tracer-evidence assertions with experiment-level provenance.  
**No-go:** 3D repair, full axon or synapse rendering, adult transfer, molecular identity or inferred prevalence.

Acceptance requires:

1. A complete official source-workbook manifest and per-file checksum record.
2. A schema that preserves sample, injected muscle pair, cord division, labelling class, identity field, transverse coordinates, area measurement and source row locator.
3. Reconciliation of per-experiment, per-region, per-section and per-cell denominators without counting nested rows as independent animals.
4. Separate visual layers for observed 2D points, measured soma areas and tracer-evidence assertions; none may be converted into neurite geometry.
5. A visible `early postnatal`, `source-local 2D`, `viral-tracing under-detection`, `not atlas registered` disclosure.
6. Zero generated `z` values, zero inferred axon paths and zero exact cross-source identities.

## UPG-116 — eLife 100451 / GSE265957 RNA-versus-translation state adapter

### Primary source and stable objects

- [Lister et al., “Translational control in the spinal cord regulates gene expression and pain hypersensitivity in the chronic phase of neuropathic pain”](https://doi.org/10.7554/eLife.100451).
- [GEO GSE265957](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE265957), 96 public sample records.
- [BioProject PRJNA1105042](https://www.ncbi.nlm.nih.gov/bioproject/PRJNA1105042).
- GEO processed object: `GSE265957_processed_files_tpms_and_degs_SNI_TRAP_and_RF.xlsx`, 22.8 MB as reported by the accession; raw reads are available through SRA.

The eLife article is CC BY. GEO and SRA provide public access, but the accession page does not state a reusable asset licence for the deposited workbook or read files. Until file-level rights are resolved, the project may retain metadata, links, checksums and an acquisition recipe but must not rebundle the source objects.

### Species, life stage, region and experimental unit

- Species: *Mus musculus*.
- Life stage: the paper reports C57BL/6 mice obtained at 6–7 weeks of age and includes both sexes. Exact age at each collection must be taken from the source sample/method metadata rather than replaced with an unqualified adult label.
- Region/tissue: spinal cord and dorsal-root ganglion are distinct tissue groups. They must never be merged into a generic spinal-neuron profile.
- Experimental unit: a deposited GEO sample/library record. Biological replicate, animal, tissue aliquot, input/IP pair and mRNA/ribosome-footprint pair are separate concepts; 96 samples must not be reported as 96 independent animals.

### Assay and denominator structure

The 96 public GEO sample records span two workflows:

1. Bulk mRNA and ribosome-footprint profiling of spinal cord and DRG after spared-nerve injury versus sham at day 4 and day 63, plus CFA versus vehicle at day 3. The accession reports two biological replicates for each condition and assay.
2. Translating-ribosome affinity purification targeting GAD2 inhibitory and TAC1 excitatory populations after spared-nerve injury versus sham at day 4 and day 60. Input and immunoprecipitated fractions are both sequenced, with three biological replicates per condition/fraction.

The manifest must retain workflow, tissue, perturbation, comparator, time point, target population, input/IP status, mRNA/ribosome-footprint status, replicate and GSM/SRX/SRR identifiers. The relationship between paired libraries and unique animals must remain unresolved until an explicit sample manifest proves it.

### Permitted model and visualization

- Build a non-spatial molecular-state explorer with filters for tissue, condition, time point, workflow, cell-targeting strategy, input/IP or mRNA/ribosome-footprint assay and replicate.
- Keep RNA abundance and translational readouts as separate axes. A gene-level comparison may show source-reported TPM/differential-expression or translation metrics only with the exact contrast and denominator.
- Keep GAD2 and TAC1 as broad targeted populations, not as complete inhibitory/excitatory taxonomies.
- Link article-level functional claims only as separate assertions with their original experimental scope; they do not become properties of every GAD2 or TAC1 cell.

### Strict non-inference limits

- These are bulk and pooled targeted-population measurements, not single-cell profiles.
- No cell coordinates, cell counts, type proportions, morphology, electrophysiology, axon, synapse, partner or atlas placement are supplied by GSE265957.
- Ribosome occupancy or TRAP enrichment is not direct protein abundance, protein localization or a subcellular structure measurement.
- The paper's parvalbumin-focused manipulations cannot relabel the deposited GAD2/TAC1 TRAP libraries as PV-specific transcriptomes.
- Spared-nerve injury is peripheral nerve injury and CFA is an inflammatory-pain model; neither may be labelled SCI or traumatic spinal-cord tissue.
- Differences across time, sex, tissue or assay cannot be assigned to a displayed individual cell.

### Go/no-go and acceptance gate

**Go:** metadata-first, remotely acquired molecular-state exploration with exact contrast and replicate provenance.  
**No-go:** 3D points, synthetic cells, morphology, inferred protein structures, SCI relabelling, PV-specific relabelling or bundled GEO files without rights clearance.

Acceptance requires:

1. A 96-record sample manifest that reconciles exactly to GEO and retains every GSM plus associated BioProject/SRA identifiers.
2. A checksum-pinned processed-workbook schema and raw-run inventory acquired from official endpoints.
3. Explicit pairing/grouping fields that separate sample/library count, biological replicate count and any recoverable unique-animal count.
4. Independent assay labels for mRNA, ribosome footprint, TRAP input and TRAP IP; the UI must not collapse them into one expression value.
5. Explicit spinal cord versus DRG, SNI versus sham, CFA versus vehicle, day 3/4/60/63 and GAD2 versus TAC1 scopes.
6. A recorded file-level rights decision. If redistribution remains unclear, only citations, metadata, checksums and the acquisition recipe enter the package.
7. Zero spatial primitives, zero inferred individual cells, zero SCI labels and zero cross-source morphology/type identities.

## Internal-detail and coverage conclusion

UPG-114 materially improves exact source-local 3D point placement, and UPG-115 adds complementary 2D circuit-position and soma-area records. Neither supplies neurite morphology or internal cell anatomy. UPG-116 improves condition- and assay-aware molecular state but is non-spatial and population-level.

No source in this three-item audit binds molecular identity, complete neurite morphology, 3D position, verified synaptic partners, membrane, nucleus and organelles to the same physical mouse spinal interneuron. The UPG-104 same-cell internal-detail result therefore remains a no-go. Empty membrane, nuclear, organelle, receptor, bouton and partner fields must remain visibly unavailable; they cannot be filled by joining these sources or by procedural generation.

## Recommended execution order

1. Execute the UPG-114 object manifest and source-local point adapter first; it is the only new source that directly adds reusable three-coordinate spinal-neuron positions.
2. Execute UPG-115 as an independent 2D evidence view. Its absence of `z` is a scientific boundary, not a missing value to repair.
3. Execute UPG-116 after the 96-sample manifest and rights decision; keep it outside the 3D scene as a molecular-state explorer.
4. Re-run the same-cell public-repository watch separately. Do not delay the three bounded upgrades while waiting for a source that closes the full internal-detail chain.
