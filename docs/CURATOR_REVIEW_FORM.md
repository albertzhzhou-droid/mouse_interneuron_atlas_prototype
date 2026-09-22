# Independent curator review form — public-data workbench candidate 2.7

Use one copy per curator. Complete this form independently before discussing decisions with another curator. Select exactly one outcome for every review item:

- `[ ] ACCEPT` — the evidence, wording, interaction, and boundary are accurate for this candidate.
- `[ ] REJECT` — a specific defect must be corrected before the candidate advances.
- `[ ] UNCERTAIN` — the reviewer cannot decide without named evidence, expertise, or testing.

A completed form is a review record, not approval to call this release research-validated, not evidence of registration, and not approval for public deployment or public redistribution.

## A. Review metadata

| Field | Curator entry |
|---|---|
| Curator name or stable reviewer ID | |
| Relevant expertise | |
| Institution or affiliation, if disclosed | |
| Conflict-of-interest statement | |
| Review date and time zone | |
| Independent review completed before discussion with another curator? | `[ ] Yes` `[ ] No` |
| Workbench release ID | `ohri-mouse-interneuron-public-data-workbench-2.7.0` |
| Workbench catalog schema | `0.4.0` plus Russ type-level crosswalk `0.1.0`, Russ reconciliation dossier `0.1.0`, Tabulae condition catalog `0.1.0`, Tabulae source-local spatial session `0.1.0`, Tabulae multi-session comparison `0.1.0`, intake registry `0.7.0`, SpinalJ preflight `0.7.0`, Cano-Gomez specimen preflight `0.8.0`, local file-admission composer `0.1.0`, public-source release-admission review `0.1.0`, assertion-provenance composer `0.1.0`, authorization-plan composer `0.1.0`, independent authorization-evidence composer `0.1.0`, detached provenance-crate export `0.1.0`, public-source feasibility planner `0.1.0`, two-lane provenance trace `0.1.0`, cross-lane relationship admission `0.1.0`, local feedback contract `2.7.0`, and local adjudication contract `2.7.0` |
| Frozen scientific evidence release | `ohri-mouse-interneuron-research-mvp-candidate-0.2.0` |
| Scientific evidence schema | `0.2.0` |
| Release status | `localhost_candidate` |
| Manifest content SHA-256 | Verify the current value in `data/release-manifest-2.7.json`; it must match the packaged manifest. |
| Source-build commit SHA, if supplied (optional for package-only review) | |
| Operating system and browser | |
| Localhost URL used | |
| Curator ZIP filename | |
| Curator ZIP SHA-256 verified against sender's digest? | `[ ] Yes` `[ ] No` |
| `START_HERE.html` reviewed before launch? | `[ ] Yes` `[ ] No` |
| Network disconnected during application review? | `[ ] Yes` `[ ] No` |
| External source links deliberately opened? | `[ ] Yes` `[ ] No` |

If the release ID or manifest hash differs from the frozen values above, or the ZIP digest differs from the sender's digest, stop and record the difference. A missing Git commit is not a package-review defect unless the distribution record promised one. The review cannot count toward dual approval of the frozen candidate until the reviewed artifact is identified unambiguously.

**Artifact-identity outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

Evidence or discrepancy:

> 

## B. Preflight scientific boundary

Select one outcome for each statement.

| ID | Required boundary | Accept | Reject | Uncertain | Evidence or correction |
|---|---|:---:|:---:|:---:|---|
| B-01 | This is a localhost Research MVP **engineering candidate**, not a research-validated atlas. | `[ ]` | `[ ]` | `[ ]` | |
| B-02 | It is not a complete interneuron census or exhaustive taxonomy. | `[ ]` | `[ ]` | `[ ]` | |
| B-03 | It is not a connectome or tract reconstruction. | `[ ]` | `[ ]` | `[ ]` | |
| B-04 | It is not a clinical tool, treatment recommendation, or clinical-safety claim. | `[ ]` | `[ ]` | `[ ]` | |
| B-05 | It does not claim human cell-type causality. | `[ ]` | `[ ]` | `[ ]` | |
| B-06 | All seven evidence-entity geometries are `SYN`; all their paths are `SCH`. | `[ ]` | `[ ]` | `[ ]` | |
| B-07 | The BrainGlobe reference derivative is `INF`, not entity placement and not valid for measurement. | `[ ]` | `[ ]` | `[ ]` | |
| B-08 | The five NeuroMorpho SWCs are `OBS` only in their source-local frames. | `[ ]` | `[ ]` | `[ ]` | |
| B-09 | The five SWCs are unregistered, non-representative exemplars and are not linked to the seven evidence entities. | `[ ]` | `[ ]` | `[ ]` | |
| B-10 | The current registration count is **0**; no visible object qualifies as `REG`. | `[ ]` | `[ ]` | `[ ]` | |
| B-11 | The viewer uses bundled local assets and makes no automatic external data request; external sites open only after a deliberate link click. | `[ ]` | `[ ]` | `[ ]` | |
| B-12 | Private curator-package sharing retains attribution; public deployment or public redistribution remains an institutional review gate. | `[ ]` | `[ ]` | `[ ]` | |

Preflight notes:

> 

## C. Six researcher-task reviews

### US-01 — Locate in space

Review the main 3D view, atlas reference tab, and all five morphology exemplars.

**Outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

Confirm each item:

- `[ ]` `INF`, `OBS`, `SYN`, and `SCH` remain visually and verbally distinct.
- `[ ]` The UI does not imply a shared atlas coordinate system for evidence entities and SWCs.
- `[ ]` The atlas display transform is not described as cell registration.
- `[ ]` Soma centring or viewer scaling is not described as registration.
- `[ ]` No segment, lamina, laterality, distance, path length, or injury relationship is inferred from an unregistered SWC.
- `[ ]` Measurement use is forbidden for the current evidence-entity and atlas-reference display.
- `[ ]` No `REG` badge or registration-error value is shown for the current release.

Observed screen, object, and status:

> 

Evidence or exact wording correction:

> 

### US-02 — Inspect identity axes

**Outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

Review the fixed entity set:

| Stable entity ID | Expected kind | Present once | Identity axes accurate | Outcome and notes |
|---|---|:---:|:---:|---|
| `mouse.propriospinal.relay` | `functional_population` | `[ ]` | `[ ]` | |
| `mouse.di3.isl1` | `developmental_lineage` | `[ ]` | `[ ]` | |
| `mouse.sc.vsx2_hoxa10` | `molecular_spatial_population` | `[ ]` | `[ ]` | |
| `mouse.v3.sim1` | `developmental_lineage` | `[ ]` | `[ ]` | |
| `mouse.v2a.cervical_ipsilateral` | `lineage_projection_population` | `[ ]` | `[ ]` | |
| `mouse.overlay.vgat_kcc2` | `injury_state_overlay` | `[ ]` | `[ ]` | |
| `mouse.overlay.vglut2_vgat_switch` | `injury_state_overlay` | `[ ]` | `[ ]` | |

Confirm:

- `[ ]` Count is exactly five population entities plus two injury-state overlays.
- `[ ]` Lineage, molecular identity, transmitter, projection/connectivity, spatial identity, and injury state are not collapsed into one mutually exclusive taxonomy.
- `[ ]` No marker is presented as a complete or uniquely defining taxonomy without supporting evidence.
- `[ ]` The seven records are not described as all spinal interneurons.

Mapping evidence and exact correction, if any:

> 

### US-03 — Evaluate causal evidence

**Outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

| Check | Accept | Reject | Uncertain | Stable IDs, evidence, or correction |
|---|:---:|:---:|:---:|---|
| Entity → claim → condition → source → DOI/access is traceable. | `[ ]` | `[ ]` | `[ ]` | |
| Causal vocabulary is used consistently: `ASSOC/NEC/SUF/DEP/FEAS`. | `[ ]` | `[ ]` | `[ ]` | |
| `CLM-P03-DI3-NECESSITY` remains `NEC`, not `SUF`. | `[ ]` | `[ ]` | `[ ]` | |
| Negative, null, counterdirectional, and boundary statements remain visible and source-linked. | `[ ]` | `[ ]` | `[ ]` | |
| Missing values have a stated reason and are not converted to zero or absence. | `[ ]` | `[ ]` | `[ ]` | |
| Endpoints remain bounded to the measured outcome. | `[ ]` | `[ ]` | `[ ]` | |

Challenged claim/condition/statement IDs:

> 

Exact replacement wording and supporting evidence:

> 

### US-04 — Compare models without pooling

**Outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

| Required comparison | Accept | Reject | Uncertain | Observation or correction |
|---|:---:|:---:|:---:|---|
| P05 staggered T7/T10 and complete T8 remain separate. | `[ ]` | `[ ]` | `[ ]` | |
| P08 neonatal and adult injury conditions remain separate. | `[ ]` | `[ ]` | `[ ]` | |
| P09 mouse causal experiments and the uncontrolled human cohort remain separate. | `[ ]` | `[ ]` | `[ ]` | |
| Species, life stage, lesion, phase, intervention, endpoint, causal grade, result, negatives, and boundaries remain visible per row. | `[ ]` | `[ ]` | `[ ]` | |
| Two to four conditions can be compared without implicit pooling. | `[ ]` | `[ ]` | `[ ]` | |
| Spasm, breathing, and locomotion are not treated as interchangeable endpoints. | `[ ]` | `[ ]` | `[ ]` | |

Comparison IDs reviewed:

> 

Evidence or exact correction:

> 

### US-05 — Trace, export, and restore

**Outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

| Check | Pass | Fail | Not tested | Notes |
|---|:---:|:---:|:---:|---|
| Visible claim traced to source and DOI/access record | `[ ]` | `[ ]` | `[ ]` | |
| JSON export completed | `[ ]` | `[ ]` | `[ ]` | |
| CSV export completed | `[ ]` | `[ ]` | `[ ]` | |
| PNG export completed with disclosure | `[ ]` | `[ ]` | `[ ]` | |
| Current-version JSON state imported | `[ ]` | `[ ]` | `[ ]` | |
| Entity, filters, comparisons, camera, slice, layers, and panel restored | `[ ]` | `[ ]` | `[ ]` | |
| Incompatible or malformed import rejected clearly | `[ ]` | `[ ]` | `[ ]` | |
| No automatic internet request was required | `[ ]` | `[ ]` | `[ ]` | |

Export/import file names and observed differences:

> 

Scientific disclosure or provenance correction:

> 

### US-06 — Identify gaps without interpreting absence

**Outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

| Check | Accept | Reject | Uncertain | Observation or correction |
|---|:---:|:---:|:---:|---|
| Gaps are visible by entity and category. | `[ ]` | `[ ]` | `[ ]` | |
| Unknown values use a valid explicit missing reason. | `[ ]` | `[ ]` | `[ ]` | |
| An empty search/filter result is not described as biological absence. | `[ ]` | `[ ]` | `[ ]` | |
| Lack of morphology or registration does not remove an evidence record. | `[ ]` | `[ ]` | `[ ]` | |
| An evidence gap is not presented as a negative biological finding. | `[ ]` | `[ ]` | `[ ]` | |

Queries/entities reviewed and exact correction:

> 

## D. Source-specific red-team review

Select one outcome per source. Cite stable claim, condition, and statement IDs where possible.

| Source gate | Accept | Reject | Uncertain | Required evidence and wording notes |
|---|:---:|:---:|:---:|---|
| **P02 / SRC-P02:** staggered hemisection is not a single complete lesion; `P02-N01`, `P02-B01`, and `P02-B02` are retained. | `[ ]` | `[ ]` | `[ ]` | |
| **P03 / SRC-P03:** dI3 evidence remains `NEC`, not `SUF`; `P03-N01`, `P03-B01`, and `P03-B02` are retained. | `[ ]` | `[ ]` | `[ ]` | |
| **P05 / SRC-P05:** staggered and complete-T8 conditions are separate; `P05-N01`–`P05-N06`, `P05-B01`, and `P05-B02` are retained. | `[ ]` | `[ ]` | `[ ]` | |
| **P08 / SRC-P08:** neonatal and adult conditions are separate; `P08-N01`, `P08-N02`, `P08-L01`, `P08-B01`, and `P08-B02` are retained. | `[ ]` | `[ ]` | `[ ]` | |
| **P09 / SRC-P09:** mouse and human streams are separate; `humanCausalEvidence=false`; `P09-N01`, `P09-L01`, `P09-B01`, and `P09-B02` are retained. | `[ ]` | `[ ]` | `[ ]` | |
| **P14 / SRC-P14:** endpoint is spasm, not beneficial locomotion; `P14-C01`, `P14-B01`, `P14-B02`, and `P14-B03` are retained. | `[ ]` | `[ ]` | `[ ]` | |
| **P16 / SRC-P16:** endpoint is breathing, not locomotion; `P16-N01`, `P16-B01`, `P16-B02`, and `P16-B03` are retained. | `[ ]` | `[ ]` | `[ ]` | |

Critical source discrepancy, including exact location and proposed replacement:

> 

## E. Russ type-level taxonomy crosswalk review

| Item | Accept | Reject | Uncertain | Evidence, qualification, or required action |
|---|:---:|:---:|:---:|---|
| `ohri-russ-harmonized-taxonomy-crosswalk-0.1.0` reports 69 source populations, 65 displayed interneuron candidates, and eight groups. | `[ ]` | `[ ]` | `[ ]` | |
| The crosswalk authority is `TYPE_LEVEL`; it grants no coordinate, same-cell join, connection edge, or registration. | `[ ]` | `[ ]` | `[ ]` | |
| The bundled JSON contains only derived labels and three marker ranks; the cited Supplementary Table XLSX and cell-level count matrix are not bundled. | `[ ]` | `[ ]` | `[ ]` | |
| The source table receipt remains pinned to 1,475,885 bytes and SHA-256 `a45578c893998fae42acf781c4700d162249497476b0b81149302f49929fd2e0`. | `[ ]` | `[ ]` | `[ ]` | |
| `Excit-36` / `Vsx2` and `Excit-38` / `Sim1` remain marker-context candidates, never exact identities for the prototype entities. | `[ ]` | `[ ]` | `[ ]` | |
| All seven prototype crosswalks remain non-exact; no marker rank is converted to adult segment assignment, connectivity, or `REG`. | `[ ]` | `[ ]` | `[ ]` | |
| `UPG-009` keeps postnatal reference, adult-lumbar validation, source-table narrative, and any corrections available for curator reconciliation before a narrower transfer. | `[ ]` | `[ ]` | `[ ]` | |
| `ohri-russ-reconciliation-dossier-0.1.0` records both official corrections, remains `PROVENANCE_RECONCILIATION_ONLY`, and does not convert either correction into a Supplementary Table 1 content rewrite. | `[ ]` | `[ ]` | `[ ]` | |
| `ohri-tabulae-paralytica-condition-catalog-0.1.0` contains exactly eight metadata-only groups and 93 distinct literal GEO labels; it admits no source body, processed metadata, numerical analysis, coordinate, same-cell join, treatment effect, cell identity or `REG`. | `[ ]` | `[ ]` | `[ ]` | |
| The Tabulae spatial-section group is explicitly not a cell-level record, and `UPG-011` still requires object-level terms, metadata and a compatible-condition plan before any source-data adapter. | `[ ]` | `[ ]` | `[ ]` | |
| `ohri-tabulae-paralytica-spatial-local-session-0.1.0` lists 24 declared sections but bundles no source file; the local viewer accepts only the exact gzip triplet, makes no remote request/upload/persistence, and keeps a source-local 2D spot separate from an individual interneuron, 3D coordinate, transform or `REG`. | `[ ]` | `[ ]` | `[ ]` | |
| `ohri-tabulae-paralytica-spatial-local-comparison-0.1.0` permits up to four distinct local sessions side by side only; it has no cross-section transform, established order/geometry, numerical comparison, source-file bundle, or registration authority. | `[ ]` | `[ ]` | `[ ]` | |
| `UPG-013` remains research-watch: a side-by-side card layout cannot become correspondence, treatment-effect evidence, a 3D stack, a source-to-project transform, or `REG`. | `[ ]` | `[ ]` | `[ ]` | |
| `UPG-014` exports a detached RO-Crate 1.3 metadata document for one declared external HTTPS source only. It cannot acquire, bundle, rights-clear, validate, transform or register a source asset. | `[ ]` | `[ ]` | `[ ]` | |
| `UPG-015` evaluates selected evidence axes only against declared package routes. It reports a single source-specific route, separate non-joinable routes, or a package-coverage gap; it does not acquire data, claim biological absence, imply a same-cell/same-specimen/coordinate/causal relationship, or create `REG`. | `[ ]` | `[ ]` | `[ ]` | |
| `UPG-016` presents frozen Research MVP evidence references and public-source planning routes in two separate typed lanes. It shows no cross-lane edge and does not infer a source-object, same-cell, coordinate, causal, authorization, or registration relationship. | `[ ]` | `[ ]` | `[ ]` | |
| `UPG-017` exports only a local, typed, **not-admitted** cross-lane relationship proposal. It names frozen records, records missing object/rights/independent-evidence/validation requirements, does not acquire a source object, does not alter the trace or source status, and creates zero registrations. | `[ ]` | `[ ]` | `[ ]` | |
| `UPG-006` reviews only imported SpinalJ `0.7` or Cano-Gomez `0.8` metadata manifests. A complete record remains **not admitted** pending independent curator object and rights review; it acquires, bundles, hashes, transforms, or registers no source object. | `[ ]` | `[ ]` | `[ ]` | |
| `UPG-018` requires a declared unacquired object or explicit unknown, typed evidence locator, allowed source state, reviewer and date. Its receipt remains `not_locally_verified`, not admitted, and at 0 REG; it does not turn a URL, manifest, or curator transcription into object possession, reuse authorization, biological truth, a cross-study relation, or `REG`. `UPG-019` fixes one declared unacquired manifest file and requested—not granted—rights review. `UPG-020` prepares an independent-review packet linked to that plan, with a proposed reviewer, evidence locator, and five planned stages. It remains a draft: no decision is authenticated, no access is authorized, no source is acquired or retained, no checksum/content review runs, and no `REG` is created. `UPG-021` remains research-watch. | `[ ]` | `[ ]` | `[ ]` | |
| `UPG-012` remains a separate research-watch gate: physical section order/frame, transform provenance, held-out error and rights review are required before any cross-section/3D proposal. | `[ ]` | `[ ]` | `[ ]` | |
| `PDS-STARMAP-PLUS-2023` remains one source-local adult-lumbar spatial-reference lead with no bundled object, project transform, whole-spine census, or `REG`. | `[ ]` | `[ ]` | `[ ]` | |

**Russ crosswalk outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

Exact label, marker, source-version, or boundary correction:

> 

## F. Spatial assets, morphology, and registration

### Current release decision

| Review item | Accept | Reject | Uncertain | Evidence or correction |
|---|:---:|:---:|:---:|---|
| BrainGlobe `allen_cord_20um:3.0` is accurately described as an adult-mouse `INF` reference derivative. | `[ ]` | `[ ]` | `[ ]` | |
| The 15 sampled planes and contours are not described as an exhaustive observed volume. | `[ ]` | `[ ]` | `[ ]` | |
| Segment identity remains pending where the asset does not provide curated C1–S3 boundaries. | `[ ]` | `[ ]` | `[ ]` | |
| NeuroMorpho release 8.6.124 IDs 104003, 108974, 109005, 242822, and 260150 are source-local `OBS`. | `[ ]` | `[ ]` | `[ ]` | |
| All five SWCs remain unregistered and non-representative. | `[ ]` | `[ ]` | `[ ]` | |
| No SWC is linked to one of the seven evidence entities. | `[ ]` | `[ ]` | `[ ]` | |
| Co-display is not registration, and viewer transforms are not scientific transforms. | `[ ]` | `[ ]` | `[ ]` | |
| Registration count is exactly 0 and no registration error is claimed. | `[ ]` | `[ ]` | `[ ]` | |

**Spatial-status outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

Evidence, screenshot reference, or exact correction:

> 

### Future registration proposal — do not use to relabel the frozen 0.2 evidence payload or workbench candidate 2.7

Complete only if recommending a future `REG` candidate. Leaving this section blank does not change the current count of zero.

| Required future-registration field | Proposed value or missing reason |
|---|---|
| Source object/accession | |
| Source coordinate space and units | |
| Target atlas/version/space | |
| Transform method | |
| Transform file SHA-256 | |
| Training landmark IDs | |
| Held-out landmark IDs | |
| Held-out segment groups | |
| Held-out median error in target-space µm | |
| Held-out P95 error in target-space µm | |
| Anatomical suitability concern | |
| Curator decision and reviewer ID | |

The charter's provisional thresholds—at least 10 held-out landmarks across at least three segment groups, median error ≤40 µm, and P95 ≤80 µm—must be approved or revised by two curators before the first real registration is released. They are project thresholds, not universal biological standards.

## G. P0 public-source intake review

| Item | Accept | Reject | Uncertain | Evidence, qualification, or required action |
|---|:---:|:---:|:---:|---|
| `PSI-SPINALJ-PROCESSED-2026-08-18` names only public landing-page/protocol/repository-context evidence. | `[ ]` | `[ ]` | `[ ]` | |
| The intake explicitly records zero downloaded files, zero file hashes, zero bundled assets, and zero registrations. | `[ ]` | `[ ]` | `[ ]` | |
| Landing-page `CC BY 4.0` metadata is not mislabeled as file-level reuse, bundle, or public-host authorization. | `[ ]` | `[ ]` | `[ ]` | |
| Dataset-declared `SpinalJ v1.13` is retained; no unpinned repository version is substituted. | `[ ]` | `[ ]` | `[ ]` | |
| Required checks include native metadata, transform provenance, disjoint landmarks, held-out physical-space error, and asset-level rights review. | `[ ]` | `[ ]` | `[ ]` | |
| No current entity or NeuroMorpho SWC is called registered from this metadata audit. | `[ ]` | `[ ]` | `[ ]` | |

**P0 intake outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

Exact intake correction or missing evidence:

> 

### Object-level file-manifest preflight

| Item | Accept | Reject | Uncertain | Evidence, qualification, or required action |
|---|:---:|:---:|:---:|---|
| `PFP-SPINALJ-PROCESSED-2026-08-18` remains `awaiting_object_level_public_manifest`. | `[ ]` | `[ ]` | `[ ]` | |
| The preflight accepts zero candidate files and stores no credential. | `[ ]` | `[ ]` | `[ ]` | |
| A future candidate manifest must distinguish a declared source SHA-1/SHA-256 from `localSha256=null`, and retain public object URL, bytes, format, file-level rights and native coordinates or explicit missing reason. | `[ ]` | `[ ]` | `[ ]` | |
| Importing a manifest cannot download, bundle, transform, or register data. | `[ ]` | `[ ]` | `[ ]` | |

**File-manifest preflight outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

Exact correction or missing evidence:

> 

### Local public file-manifest composer

| Item | Accept | Reject | Uncertain | Evidence, qualification, or required action |
|---|:---:|:---:|:---:|---|
| The composer emits only SpinalJ `0.7.0` and Cano-Gomez specimen-aware `0.8.0` metadata manifests. | `[ ]` | `[ ]` | `[ ]` | |
| It requires publisher/repository URL, bytes, format, source-declared checksum, rights record and required coordinate/specimen metadata or explicit missingness. | `[ ]` | `[ ]` | `[ ]` | |
| Every exported file fixes `localSha256` to null and the admission decision to `metadata_only_not_downloaded_not_registered`. | `[ ]` | `[ ]` | `[ ]` | |
| The composer cannot fetch, upload, persist, locally hash, acquire, bundle, rights-clear, transform or register a source object. | `[ ]` | `[ ]` | `[ ]` | |
| `UPG-014` emits detached RO-Crate 1.3 metadata only: one declared external HTTPS source, no payload, no source acquisition, no source-object rights decision, and no registration. | `[ ]` | `[ ]` | `[ ]` | |

**Local composer outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

Exact correction or missing evidence:

> 

## H. Rights and distribution review

This section records review of attribution and distribution language; it is not legal advice.

| Item | Accept | Reject | Uncertain | Evidence, qualification, or required action |
|---|:---:|:---:|:---:|---|
| BrainGlobe AWS distribution is recorded as CC0 1.0. | `[ ]` | `[ ]` | `[ ]` | |
| Original `SC_atlas_P56` Mendeley v1 dataset is recorded as CC BY 4.0 with attribution. | `[ ]` | `[ ]` | `[ ]` | |
| NeuroMorpho assets are recorded as CC BY 4.0 plus repository terms. | `[ ]` | `[ ]` | `[ ]` | |
| NeuroMorpho reuse retains repository, Tecuatl 2024, and original-paper citations. | `[ ]` | `[ ]` | `[ ]` | |
| No Fiederling article figure or text is represented as copied or adapted. | `[ ]` | `[ ]` | `[ ]` | |
| Private sharing of this curator package retains all attribution and source records. | `[ ]` | `[ ]` | `[ ]` | |
| Public deployment/public redistribution remains subject to institutional asset-level review. | `[ ]` | `[ ]` | `[ ]` | |

**Rights-language outcome:** `[ ] ACCEPT` `[ ] REJECT` `[ ] UNCERTAIN`

Reviewer qualification for rights decision, if applicable:

> 

Required attribution or distribution correction:

> 

## I. Overall independent decision

### Candidate decision

- `[ ] ACCEPT` — acceptable as the named **localhost public-data workbench candidate 2.7**, subject to the limitations recorded here.
- `[ ] REJECT` — release-blocking scientific, spatial, interaction, or rights defect exists.
- `[ ] UNCERTAIN` — additional named evidence, expertise, or testing is required.

### Research-validation decision

- `[ ] NOT ELIGIBLE IN CANDIDATE 2.7` — the workbench and frozen evidence payload have zero registrations and the charter's external human gates are not complete.
- `[ ] OTHER` — explain below. This selection does not override the charter or create research-validation status.

### Promotion blockers

List each release-blocking item with stable IDs, exact evidence, and the minimum correction:

1. 
2. 
3. 

### Non-blocking recommendations

1. 
2. 
3. 

### Unresolved uncertainties

For each uncertainty, name the missing source, expertise, test, asset, or rights determination:

1. 
2. 
3. 

### Curator attestation

I reviewed the identified release independently and reported uncertainty rather than inferring unavailable evidence. I did not treat co-display as registration, five SWCs as a representative population, missing data as zero or absence, or this engineering candidate as a clinical or research-validated product.

| Field | Entry |
|---|---|
| Curator name or stable reviewer ID | |
| Signature or approved electronic identifier | |
| Date | |
