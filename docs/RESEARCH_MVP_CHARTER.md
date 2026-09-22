# Research MVP charter

**Candidate contract:** `ohri-mouse-interneuron-research-mvp-candidate-0.2.0`

**Scope:** localhost-first research workflow for seven evidence entities in an adult-mouse C1-S3 model. This is not a cell census, connectome, clinical model, or claim that all spinal interneurons have been reconstructed.

## Completion language

- **Feasibility prototype:** synthetic geometry demonstrates interaction and evidence-boundary concepts.
- **Localhost Research MVP engineering candidate:** structured evidence, model comparison, explicit gaps, a pinned local atlas reference, and local morphology observations support engineering validation without claiming registration or scientific validation.
- **Research-validated MVP:** the localhost candidate plus the rights, dual-curator, landmark, morphology, and researcher-task gates below.

Release 0.2 is a **localhost Research MVP engineering candidate**. It includes a local BrainGlobe 3.0 `INF` reference, five NeuroMorpho 8.6.124 `OBS` local-frame SWCs, structured comparison and gaps UI, and zero registrations. It is not a research-validated MVP.

## Fixed scientific invariants

1. Model geometry is adult *Mus musculus* (`NCBITaxon:10090`), C1-S3.
2. The seven stable entity IDs remain five populations plus two injury-state overlays.
3. Evidence-entity geometry is `SYN` and pathways are `SCH`; neither inherits spatial authority from the separately displayed atlas or SWCs.
4. Neonatal mouse and human evidence may inform bounded context, but must be stored as distinct conditions and cannot silently become adult-mouse model geometry.
5. Complete, staggered, and incomplete lesions; cervical, thoracic, and sacral injuries; acute and chronic phases; and locomotion, breathing, and spasm endpoints remain distinct.
6. Negative, null, counterdirectional, and nonsignificant findings retain stable IDs.
7. The BrainGlobe reference derivative is `INF`. The five NeuroMorpho morphologies are `OBS` only in their local source frames, remain unregistered, and are not representative of all spinal interneurons or mapped to the seven evidence entities.
8. `registrations` remains empty and no object may be labeled `REG` until the next scientific gate passes.

## Data relationship

Every displayed conclusion must follow this trace:

```text
entity -> claim -> experimental condition -> source -> DOI/access record
   |        |               |
   |        |               +-> negative/boundary statement IDs
   |        +-> causal grade and endpoint
   +-> geometry/path status and spatial provenance
```

Unknown required values use `{ "value": null, "missingReason": "..." }`. Allowed reasons are `not_reported`, `not_measured`, `asset_unavailable`, `not_applicable`, `out_of_scope`, and `pending_curation`. Zero, an empty string, or a synthetic coordinate may not substitute for missing evidence.

## US-01 — Locate in space

**Story:** A researcher can locate an entity in a version-pinned adult-mouse C1-S3 reference and can tell whether the visible object is observed, registered, inferred, schematic, or synthetic.

**Automatic engineering acceptance**

1. A locally acquired `allen_cord_20um` release supplies its actual version, orientation, shape, resolution, path, checksum, coordinate-space ID, and asset-level rights record.
2. Every spatial object has units and one of `OBS/REG/INF/SCH/SYN`.
3. `OBS` requires source accession, native coordinate space, units, and asset checksum.
4. `REG` additionally requires source/target spaces, transform checksum, held-out landmarks, calculated error, and curator-review IDs.
5. `INF` requires input IDs, inference/interpolation method, and uncertainty or confidence metadata.
6. `SCH` and `SYN` always have `measurementAllowed=false`.

**Current engineering evidence:** the pinned BrainGlobe `allen_cord_20um:3.0` reference records shape `[1567, 253, 322]`, resolution `[20, 10, 10] µm` z-y-x, orientation `asr`, source and derived checksums, `INF` method, and forbidden measurement use. Five NeuroMorpho 8.6.124 SWCs pass file, topology, units, and provenance checks as local-frame `OBS`. The UI keeps these layers separate and states that no transform connects them.

**Next scientific promotion gate — not satisfied:** at least one real morphology or specimen must complete native-data QC and a validated registration into the pinned atlas. Other entities without qualifying locations remain explicit gaps. This requires new data suitability judgment and curator review; it is not implied by the current automatic asset checks.

**Provisional registration gate for that future `REG` object**

- At least 10 held-out landmarks across at least three segment groups.
- Training and held-out landmark IDs are disjoint.
- Median target-space error is at most 40 µm and P95 is at most 80 µm.
- Two curators must approve or revise these project thresholds before the first real registration is released; they are not represented as universal biological standards.

## US-02 — Inspect identity axes

**Story:** A researcher can distinguish lineage, molecular identity, transmitter, projection/connectivity, and injury state without treating them as one mutually exclusive taxonomy.

**Acceptance**

1. The stable IDs are exactly the seven IDs in release 0.2.
2. Counts remain five population entities and two `injury_state_overlay` records in UI, API, comparison, and export.
3. Every entity has a controlled `entityKind` and at least one `classificationAxis`.
4. Marker, transmitter, lineage, projection, spatial identity, and state remain separate fields or relations.
5. A marker does not automatically create a unique family mapping.
6. Each canonical identity mapping is approved by two different spinal-neuroscience curators reviewing the same mapping hash.

## US-03 — Evaluate causal evidence

**Story:** A researcher can move from an entity to a claim and its exact experimental condition, determine the causal level, and inspect negative results and boundaries.

**Acceptance**

1. Entity, claim, condition, source, and evidence statement are independent records with referential integrity.
2. Each condition records species, life stage, strain, sex, injury level/type/completeness, phase, intervention, comparator, experimental unit, sample-size provenance, causal test, endpoint, measurement, and result—or an explicit missing reason.
3. Causal grades use the controlled vocabulary `ASSOC/NEC/SUF/DEP/FEAS` and are visible with definitions.
4. Abstract- or metadata-level evidence cannot contain unverified exact sample sizes or effect estimates.
5. All required negative/boundary IDs in release 0.2 remain linked to both source and claim.
6. P03 remains `NEC` and never becomes `SUF` without a new qualifying source and review.

## US-04 — Compare models without pooling

**Story:** A researcher can compare two to four experimental conditions side by side without silently pooling incompatible models or endpoints.

**Acceptance**

1. Comparison rows display identity, species/life stage, lesion level/type/completeness, phase, intervention, endpoint, causal grade, result, negative findings, and boundary.
2. Adult/neonatal, mouse/human, complete/staggered/incomplete, cervical/thoracic/sacral, acute/chronic, and locomotion/breathing/spasm remain stratified unless the UI explicitly shows separate groups.
3. P05 staggered T7/T10 and complete T8 are separate condition records.
4. P08 neonatal and adult injuries are separate condition records.
5. P09 mouse causal experiments and the uncontrolled human cohort are separate claims and conditions; `humanCausalEvidence=false`.
6. Comparison selections round-trip through URL and JSON state.

## US-05 — Trace and reproduce

**Story:** A researcher can trace every visible item to its evidence and spatial assets, then export and restore the exact research state.

**Acceptance**

1. The trace is `object -> entity -> claim -> condition -> source -> DOI/access record`.
2. Spatial trace additionally includes accession, rights decision, native space, transform, target atlas, registration error, checksum, and curator approvals where applicable.
3. The release manifest hashes the research release, schema, evidence ledger snapshot, source manifest snapshot, atlas, SWC, transforms, and rights ledger used by the release.
4. Export includes release/schema hashes, atlas/morphology/transform versions and hashes, selected entity, comparisons, filters, camera, slice, layer visibility, status labels, and disclaimer.
5. `export -> import -> export` is deep-equal except for an explicitly excluded export timestamp.
6. Every DOI and access status matches the authoritative source manifest.

**Current engineering evidence:** JSON import is version-locked to the Research MVP release/schema, rejects oversized, malformed, or structurally invalid state, and restores entity selection, search, filters, camera, slice, layers, panel, and comparison IDs. JSON, CSV, and PNG export plus URL restoration are implemented. The live-browser export/import/export task remains to be executed before claiming browser-level round-trip proof.

## US-06 — Identify evidence gaps

**Story:** A researcher can distinguish a query with no matches from biological absence and can see which evidence or asset is still missing.

**Acceptance**

1. Every required field is a valid value or an explicit missing-value object.
2. A gaps view reports condition, sample, endpoint, spatial, morphology, rights, and curation gaps by entity.
3. Empty filters state that the result is not evidence of biological absence.
4. Entities without an approved morphology or registration remain evidence records but cannot render as `OBS` or `REG`.
5. Deliberately incomplete fixtures display their missing reason; validators reject raw nulls, fake zero coordinates, and unreasoned omissions.

## Source-specific red-team gates

- **P02:** staggered hemisection, not one complete lesion; retain reduced brainstem labeling and human-efficacy boundary.
- **P03:** `NEC`, not `SUF`; retain subtle baseline stance/foot-placement findings.
- **P05:** separate staggered and complete-T8 conditions; preserve early and bumetanide null results, complete-T8 failure, no axon growth, unchanged evoked latency, residual coactivation, and no global-disinhibition claim.
- **P08:** separate neonatal and adult conditions; preserve variable partial adult recovery, training-alone null result, unblinded testing, and the global-inhibition boundary.
- **P09:** separate mouse and human streams; human causal evidence is false; preserve the healthy-mouse null result and nonrandomized human limitation.
- **P14:** endpoint is spasm, not beneficial locomotion; preserve the repeated-stimulation counterfinding and clinical-safety boundary.
- **P16:** endpoint is breathing, not locomotion; preserve the healthy resting-breathing null result and population-equivalence boundary.

## Localhost candidate verification

The engineering gates run without deployment:

```bash
node scripts/validate-research-mvp.mjs
node scripts/validate-json-schema.mjs
node scripts/validate-spatial-assets.mjs
node scripts/build-release-manifest.mjs --check
npm test
```

The test suite must build the production localhost bundle and cover strict JSON Schema execution, the Research MVP data contract, spatial checksums/QC, generated release manifest, structured evidence UI, comparison/gaps UI, URL-state restoration, version-locked JSON state import, disclosure-bearing exports, and the no-REG boundary. A live-browser export/import/export task remains a promotion gate even though the import workflow and persistent-state restoration tests now exist.

## External human gates

Automation cannot establish the following:

1. Two independent spinal-neuroscience curators approve each canonical mapping and evidence-boundary version.
2. Asset-level redistribution rights are approved for every bundled atlas, SWC, section, mesh, or derived file.
3. Curators confirm held-out landmark anatomy and the registration-error protocol.
4. Curators confirm SWC identity, completeness, orientation, and whether it may be described as representative.
5. At least five target researchers complete US-01 through US-06 tasks.
6. At least 90% of tested researchers correctly distinguish `OBS`, `REG`, `INF`, `SCH`, and `SYN`.

Until these gates pass, use **localhost Research MVP engineering candidate**, not **research-validated MVP**.
