# Public-data-only roadmap

**Decision date:** 2026-08-18  
**Applies to:** development after Research MVP engineering candidate 0.2; implemented as a public-data workbench candidate in 0.3 and a metadata-admission upgrade in 0.4

## Decision

All future scientific inputs must be publicly accessible digital data with a stable accession or URL, an auditable version, recorded reuse terms, and reproducible provenance. The project will not depend on OHRI internal specimens, unpublished institutional experimental data, proprietary biological records, physical tissue, or new wet-lab acquisition.

Public accessibility does not automatically authorize rebundling or public deployment. Every acquired or derived asset still requires an asset-level rights decision, attribution, version, checksum, and scientific-use boundary.

Release 0.2 already satisfies the scientific-input part of this policy: its evidence is derived from published literature, its reference anatomy comes from BrainGlobe/SC_atlas_P56, and its morphology examples come from NeuroMorpho.Org. It contains no OHRI internal experimental data and remains unchanged as a frozen engineering candidate.

The existing `0.2.0-curator.1` ZIP, its checksum, release payload, charter, and review records remain frozen. The 0.3 workbench is a new candidate and does not silently rewrite or overwrite the distributed 0.2 package.

## Fixed constraint and revised objective

The fixed constraint is **public data only**. Dataset, method, spatial resolution, and number of represented cell types may change as source quality changes.

The revised objective is to build a versioned, evidence-linked public-data atlas that lets researchers inspect cell-type definitions, spatial distributions, morphology examples, injury-state evidence, and explicit uncertainty. It is not a promise of a cell census, complete connectome, or reconstruction of every interneuron.

## Acquisition priority

| Priority | Public source | Intended use | Maximum permissible claim before new validation |
|---|---|---|---|
| 1 | [SpinalJ processed example](https://data.mendeley.com/datasets/mkc37w4rrv/1), DOI `10.17632/mkc37w4rrv.1`, CC BY 4.0 | Reproduce a section-to-atlas registration pipeline using the released preprocessing, registration, atlas-mapping, and analysis outputs | Registration engineering benchmark only. It does not identify the seven evidence entities or register a NeuroMorpho SWC. |
| 2 | [Cano-Gomez et al. 2026 preprint](https://www.biorxiv.org/content/10.64898/2026.06.11.731752v1), GEO `GSE318731`, [BIL `10.35077/g.1196`](https://doi.brainimagelibrary.org/doi/10.35077/g.1196) | Evaluate public rostrocaudal, sex-balanced, spatial-transcriptomic, multiomic, and projection-class data | Preprint-derived, condition-bounded source-local `OBS` or author-space results only. No project `REG` until transform provenance and independent error validation pass. |
| 3 | [Russ et al. CELLxGENE collection](https://cellxgene.cziscience.com/collections/554fe96e-832b-4651-ac1b-a2df9a6735c3), GEO `GSE158380` | Extend the molecular taxonomy and marker crosswalk | Type-level molecular evidence. No individual-cell atlas coordinate unless supplied and validated by a spatial source. |
| 4 | [Tabulae Paralytica](https://www.nature.com/articles/s41586-024-07504-y), GEO `GSE234774`, multiome `GSE230765` | Add injury-, time-, severity-, sex-, drug-, and model-bounded state evidence; begin with processed data | Visium spot- or condition-level `OBS/INF` only. A spot is not an individual interneuron, and mid-thoracic data do not represent C1-S3. |
| 5 | [NeuroMorpho.Org public API](https://neuromorpho.org/apiReference.html) and direct SWCs | Build a version-pinned repository-query census, audit every matching direct file, and expose admitted morphology with source attributes and missingness | Source-local morphology `OBS` only. A query record is not an independent animal or biological type, and no anatomical placement exists without a validated specimen-specific transform. |

The large SpinalJ raw datasets are not the first acquisition step. The released processed dataset is assessed first; raw parts are downloaded only when a specific reproducibility check requires them.

## UPG-030A NeuroMorpho reconstruction census

UPG-030A is the concrete P0 morphology child of UPG-030. It replaces five-example discovery as the research-iteration entry point while leaving the frozen 0.2 morphology assets unchanged. The exact official query indexes 142 unique repository records. All 142 direct standardized SWCs were acquired and audited; all 142 passed the current parsing/domain/QC gate, 142 lazy source-local geometries were admitted, and zero records were quarantined. The separate denominator and quarantine report remain mandatory even when the quarantine count is zero.

“Census” here means **all records returned by one version-pinned NeuroMorpho query**. It does not mean all mouse spinal interneurons, all interneuron types, a representative sample, or independent animals. The query is confined to lumbar source contexts, 140 records belong to the Todd archive and two to Chen_Dai, and all 142 records derive from five papers. The API does not expose an animal-level identifier sufficient for prevalence, frequency, or between-animal inference.

Source reconstruction attributes also bound the viewer. Of the 142 indexed records, 92 are `Diameter, 3D, Angles`, 48 are `No Diameter, 3D, Angles`, and two are `Diameter, 2D, Angles`; consequently 140 are 3D and two are 2D, while 94 have diameter metadata overall. Forty-five reconstruction domains include an axon, but all are physically classified as moderate and zero report a complete axon. Missing diameter, an omitted axon, and an incomplete axon remain acquisition/reconstruction properties rather than biological conclusions.

The generated research census has four separate denominators:

1. `queryIndexedCount = 142` — exact records in the checksum-locked official response;
2. `directFileAuditedCount = 142` — indexed records for which the direct standardized SWC outcome was tested;
3. `admittedGeometryCount = 142` — files that were locally SHA-256-pinned and passed seven-column, topology, domain and dimensionality checks;
4. `quarantinedCount = 0` — failed or scientifically ineligible files retained with a reason.

Only admitted geometry may drive a morphology selector, and the two source-2D records must remain explicitly 2D rather than being promoted into observed 3D arbors. Every geometry remains unregistered with a null atlas transform. No NeuroMorpho label creates a same-cell or exact-type join to the Russ taxonomy, SCI evidence entities, fine-anatomy labels, or injury-state sources. No duplicate raw-SWC hash groups or duplicate canonical-geometry hash groups were found, but those file-level results do not establish different animals or specimens.

The census must retain NeuroMorpho.Org (RRID:SCR_002145), the repository citation, and the original paper for every reconstruction. The repository's CC BY 4.0 terms authorize attributed reuse; they do not remove the source-specific citation and limitation requirements.

## 0.3 public-data workbench

Candidate 0.3 turns this roadmap into a versioned application capability:

- data/public-data-catalog-0.3.json is the authoritative catalog and upgrade queue.
- schemas/public-data-catalog.schema.json and scripts/validate-public-data-catalog.mjs reject non-public policy, internal-data flags, invalid source dependencies, and a source that claims project REG.
- The Sources panel permits source/stage search, records each accession, version, source link, rights state, coordinate authority, admissible use, prohibited claims, next checks, and exports a per-source intake record. It does not download candidate files automatically.
- New browser state fields round-trip through URL and state JSON. An old 0.2 state export remains importable; it receives a default catalog view.
- data/release-manifest-0.3.json pins the 0.3 catalog and its schema alongside the 0.2 evidence release, spatial assets, rights ledger, scientific ledgers, and exact runtime lock.

The included queue is intentionally executable rather than aspirational: UPG-001 starts with a source-local SpinalJ reproducibility report; UPG-002 audits Cano-Gomez coordinate provenance; UPG-003 and UPG-004 add taxonomic and injury-state adapters only after an accession-pinned input is selected. The remaining entries expand morphology and build the deterministic admission service.

## 0.8 curator-feedback and adjudication gate

Candidate 0.8 adds a local-only feedback inbox and a strict feedback contract. It permits a curator to import only a feedback file that names the exact package distribution, workbench release, release-manifest SHA-256, and `0 REG` boundary. A receipt export is an audit aid only; it does not modify evidence, acquire a file, approve a release, or create a registration.

`UPG-007` is the next release gate: it requires an explicit adjudication record for at least two independent curators reviewing the same distribution, package digest, and manifest hash. Divergent verdicts and `unable_to_assess` outcomes must remain visible. A form count, a local receipt, or a majority tally is not an approval and cannot promote a source object to `REG`.

## 1.0 executable local adjudication packet

Candidate 1.0 implements the engineering part of `UPG-007` without treating it as scientific approval:

- Each feedback JSON must contain the reviewer-reported companion ZIP SHA-256 as well as its version, release-manifest hash, verdict and `0 REG` identity.
- The workbench compares two or more uniquely identified records only when every curator reports `zip_verified=yes` and exactly one 64-character digest. The browser deliberately does not claim to recompute the original archive digest.
- A named adjudicator exports a local packet that preserves all responses, `revise` decisions, `unable_to_assess` outcomes and any disagreement. A mixed verdict can be deferred or returned for revision, but can never produce a next-private-review recommendation.
- The only available dispositions are `defer_pending_evidence`, `return_for_revision`, and `recommend_next_private_review`. None authorizes public release, source acquisition, biological truth, or `REG`.

`UPG-007` is therefore **ready for independent curator input**, but it is not complete until two real curators review one immutable package and a human records an explicit resolution. The public-data admission gates, especially `UPG-008` for Tabulae source checksum and asset-level rights, remain separate and unresolved.

## 0.4 P0 metadata-admission gate

Candidate 0.4 preserves the distributed 0.3 package and implements a strict first intake for `PDS-SPINALJ-PROCESSED`:

- `data/public-source-intakes/spinalj-processed-metadata-audit-0.4.json` records public landing-page, protocol, and repository-context evidence; it is not an acquired-data manifest.
- The record pins the dataset DOI/version, declared landing-page `CC BY 4.0` metadata, and dataset-declared `SpinalJ v1.13` while refusing to substitute an unpinned repository version.
- Its negative state is executable: no remote acquisition attempted; no candidate file enumeration; no file hash; zero bundled assets; no inspected transform; zero registrations; no bundle or public-hosting authorization.
- `schemas/public-source-intake.schema.json` and `scripts/validate-public-source-intake.mjs` fail if any of those declarations are weakened.
- `data/release-manifest-0.4.json` pins the catalog, intake record, schemas and runtime lock together. The Sources panel exposes the intake and exports it with the selected source; it does not download data.

The next P0 step remains intentionally blocked on a file-level public manifest, checksums, native spacing/orientation, source and target coordinate declarations, transform provenance, a disjoint landmark validation split, asset-level rights review, and curator approval. Passing those gates would still produce a source-local reproducibility benchmark, not a project registration or transfer to the current NeuroMorpho SWCs.

The latest source-specific P1 triage is recorded in `docs/PUBLIC_SOURCE_RESEARCH_WATCH_2026-08-18.md`. It decomposes Cano-Gomez adapter work into separate metadata, file-manifest, source-local-rendering, and independently validated registration-candidate gates; none changes the 0.4 release or its zero-REG status.

## Spatial decision tree

1. **Public source provides native images, stable object IDs, coordinate metadata, transform files, and usable landmarks:** preserve the original `OBS`, reproduce the transform, calculate held-out physical-space error, and submit a separate `REG` candidate for dual-curator review.
2. **Public source provides coordinates but not a reproducible or independently testable transform:** keep the data as source-local or author-space `OBS`; do not call it project `REG`.
3. **Public source provides type proportions, spatial spots, or density maps:** represent the result as condition-bounded `INF` with the aggregation and uncertainty recorded.
4. **Public source provides only literature-supported projection tendencies:** retain `SCH`; do not synthesize a measured synaptic edge list.
5. **No public source passes the registration gate:** release the atlas with zero `REG` objects. This is an acceptable scientific outcome, not a reason to invent placement.

## Next development cycle

1. Inventory the SpinalJ processed files, file sizes, formats, checksums, coordinate spaces, registration outputs, and reuse requirements without acquiring the full raw series.
2. Build a source adapter that preserves native SpinalJ outputs and produces a separate reproducibility report; do not map the current NeuroMorpho SWCs or evidence entities to it.
3. Audit `GSE318731` and BIL `10.35077/g.1196` for stable specimen IDs, pixel size, orientation, cell coordinates, cross-modality keys, transform provenance, and distribution rights.
4. Add CELLxGENE/GEO molecular and injury data only through accession-pinned, checksum-recorded manifests and condition-specific schemas.
5. Promote an object to `REG` only if the existing landmark, error, provenance, rights, and dual-curator gates pass. Otherwise retain `OBS`, `INF`, `SCH`, or `SYN` explicitly.
6. The 0.4 catalog, metadata intake and manifest carry explicit `scientificInputPolicy: public_sources_only` and `institutionalExperimentalDataUsed: false`. Maintain these fields in every subsequent release instead of retroactively editing release 0.2.
7. Complete UPG-030A by pinning the 142-record official response, recording every direct-file audit outcome, admitting only QC-passing source-local geometry, and exposing query-indexed versus admitted versus quarantined counts separately.
8. Retain UPG-037's sampled-native-mask/coverage slice: 38 planes represent all 32 contiguous z-wise annotation-state runs, and the inventory-complete set is limited to 73 direct leaves represented in the pinned terminology/annotation on those sampled planes—37 study regions, three structural landmarks, and 33 default-off motor-context records. Also retain the separate public-source-derived sibling asset `public/data/allen_cord_20um_native_volume_v2/`, which adds lazy full-native-volume exact masks and voxel-face surfaces for all 73 labels in those same non-count semantic lanes: 38,845,542 voxels, 52,062 row runs, 11,138,364 exposed unit faces, 214,841 exact rectangles and 429,682 triangles. An independent set oracle reports zero missing, duplicate, shifted, oppositely oriented or extra faces. Its full-volume semantic SHA-256 is `1e5ee2daaeabd3505572f5efdb92e700387f7bd794720e78ec21511338500d12`, and its manifest SHA-256 is `d77b526acc6a80326f75ba3131e885f9d7841b5d01b184daa3651a48f1e85c20`. It performs no interpolation, smoothing, decimation or hole filling and remains `INF`, measurement-forbidden, and `0 REG`. Exactness is only to the pinned source voxel grid; computational face agreement is not sub-voxel accuracy, independent biological validation, cell placement, or a count of interneurons, cells or types.
9. Treat UPG-038 comparisons with the public Allen P56 plates as same-source concordance and sensitivity checks. They cannot provide independent validation, named C1–S3 assignment, or a precision claim without a separately qualified source and documented correspondence.

## 1.7 browser-local Tabulae spatial inspection

Candidate 1.7 implements a narrowly scoped public-data capability rather than assuming an OHRI data supply. It records the public `GSE234774_RAW.tar` listing and its 24 declared Visium section triplets, but does not download or bundle the archive. A researcher can select one lawfully obtained local gzip triplet; the browser validates filenames, decompresses locally, overlays source-local Visium spots on the selected 2D tissue image, and exports a receipt containing only filenames, local SHA-256 values and parser summaries.

This is intentionally not an object admission, numerical adapter, cell-type call, 3D reconstruction, transform, or registration. The archive has no source checksum or asset-level reuse decision in the current contract; local hashes prove only the reviewer-selected files. `UPG-011` remains the numerical-admission gate. New `UPG-012` requires stable section/specimen identity, physical frame/order/scale/orientation, transform provenance, rights review and held-out landmark error before any cross-section source-frame or 3D proposal. See [ADR-001](ADR-001-TABULAE-LOCAL-SPATIAL-SESSION.md).

## 1.8 source-local Tabulae comparison

Candidate 1.8 lets a reviewer place up to four independently selected declared Tabulae sections next to one another. The visual aid is deliberately a comparison of separate source-local 2D cards—not an attempted reconstruction. The contract rejects cross-section transforms, image or spot overlays, normalization, inferred section order, stacking, inter-section distance, quantitative contrasts, treatment effects, cell calls, and `REG`.

The 10x output specification supports mapping a position table onto the matching source tissue image using its scale factors. It does not supply the project with a physical relation between independent sections. `UPG-013` therefore preserves a separate research gate for any multi-section interpretation or concordance proposal; its hard stop includes compatible conditions/specimen identity, assets and rights, evidence for geometry, locked provenance, held-out validation, and curator review. See [ADR-002](ADR-002-TABULAE-LOCAL-COMPARISON-BOARD.md).

## 1.9 local metadata-only admission composer

Candidate 1.9 makes the existing SpinalJ and Cano-Gomez manifest gates usable without hand-authoring JSON. The local composer only exports source-declared metadata into the existing `0.7` and `0.8` shapes. It does not contact a repository, accept a source file, calculate a local hash, persist a record, acquire/bundle an asset, establish rights, transform coordinates, validate biology or create `REG`.

`UPG-014` now provides a browser-local, detached [RO-Crate 1.3](https://www.researchobject.org/ro-crate/specification/1.3/structure.html) metadata export for one declared external HTTPS source. It emits no payload and records the source as catalogued public metadata only, unacquired and unregistered. It does not establish reuse rights, validate a source object, transform coordinates, or create `REG`; a downloaded or registered asset still requires its separate admission, validation, and curator gates.

## 2.1 public-source feasibility planning

Candidate 2.1 makes the public-source limits actionable before any proposed integration. The feasibility planner lets a researcher choose up to four evidence axes and reports whether one declared route covers them, whether only separate non-joinable routes exist, or whether the package has no qualified route. The last result is a package-coverage gap, never an inference that biology or public evidence is absent.

The planner exports only a browser-local receipt. It does not request, acquire, inspect, hash, upload, transform, align, combine, analyze, persist, or bundle a source object. It cannot establish a same-cell, same-specimen, coordinate, causal, or project-registration relationship. `UPG-015` keeps future additions tied to source-specific metadata, rights, admission, and curator gates; any claimed same-cell join or `REG` needs its own independently validated contract. See [ADR-005](ADR-005-PUBLIC-SOURCE-FEASIBILITY-PLANNER.md).

## 2.2 two-lane provenance audit and 2.3 relationship proposal gate

Candidate 2.2 keeps the frozen Research MVP evidence chain and declared public-source planning chain in separate typed lanes. The trace documents only declared references and displays no cross-lane edge. This follows the useful provenance discipline in [W3C PROV-O](https://www.w3.org/TR/prov-o/) and [PROV Constraints](https://www.w3.org/TR/prov-constraints/): a typed relationship must be explicit and internally consistent, not inferred from a common label or visual co-display.

`UPG-016` exports a local trace receipt without acquiring, inspecting, transforming, aligning, combining, or registering a source object. Candidate 2.3 implements `UPG-017` as an explicitly **not-admitted** local proposal composer: it can record immutable release records, a typed candidate relation, and missing proof requirements, but it cannot establish identity, coordinates, reuse permission, biological truth, a cross-lane edge, or `REG`. See [ADR-006](ADR-006-TWO-LANE-PROVENANCE-TRACE.md) and [ADR-007](ADR-007-CROSS-LANE-RELATIONSHIP-ADMISSION.md).

## Success criteria

- A clean-machine build can reconstruct every bundled scientific asset from public accessions or from immutable, provenance-recorded package inputs.
- No scientific claim requires an OHRI internal dataset, physical sample, unpublished record, or network request at review runtime.
- Every new source records accession, version/date, rights, checksum, native coordinate space, experimental condition, transformation status, and known missingness.
- Public data from different animals or studies are joined only at a defensible population, region, or condition level; they are never presented as same-cell multimodal observations without an explicit shared identifier.
- Failure to obtain a validated public registration leaves the registration count at zero and does not block evidence, taxonomy, morphology, or injury-state improvements.

## Non-goals

- Claiming that all mouse spinal interneurons have been enumerated or reconstructed.
- Treating a NeuroMorpho query record, unique repository ID, or SWC as an independent animal, biological frequency denominator, or complete axonal reconstruction.
- Treating a public SWC, Visium spot, inferred density, probabilistic projectome, or visually aligned object as a registered cell.
- Inferring complete synaptic connectivity from morphology, projection direction, co-location, or transcriptomics.
- Mixing mouse and human data, developmental and adult data, or incompatible injury models without explicit condition separation.
