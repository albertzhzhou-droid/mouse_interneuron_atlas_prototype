# Research timeline — iteration 2.35

Date: 2026-09-01  
Transition: unpackaged research iteration 2.34 → unpackaged research iteration 2.35  
Scope: in-place public-data evidence and UI reconciliation; no full-project copy, distributable package, deployment, curator/admin workflow, private data, physical specimen or fabricated biological object was created.

## Trigger and fixed decision

The visible type browser had drifted from its knowledge base. Switching source profiles could leave the same generic cell visible, the evidence cards repeated project-wide limits, and source-specific anatomy, electrophysiology, denominators and missingness were not consistently exposed.

Iteration 2.35 keeps the cell geometry gate fixed: a source profile without a checksum-pinned same-record morphology object renders no cell. UI presentation may vary, but source identity, record granularity, denominators, join keys, conflict handling and object availability do not float. A marker-defined population, an experiment row and a firing pattern are not promoted to separate biological types.

## Public source selected for the first functional-profile increment

The first increment is the Crozat et al. PKD2L1-positive cerebrospinal-fluid-contacting-neuron source profile because its public Figshare deposit exposes exact file-level observations and denominators that can change the evidence card without pretending to supply 3D geometry.

- primary article: [Crozat et al. 2025](https://doi.org/10.1038/s42003-025-08559-x);
- immutable dataset target: [Figshare article 29430869 version 2](https://doi.org/10.6084/m9.figshare.29430869.v2);
- licence: CC BY 4.0 for dataset version 2 and its downloadable files;
- inventory: 92 files, 1,848,613 bytes;
- inventory composition: 74 XLSX, five CSV, seven Rmd and six `.DS_Store` files;
- key evidence receipts: seven file IDs with publisher MD5, byte count and locally verified SHA-256.

The application bundles the checksum-pinned factual derivative and direct source links, not the 92 source files. Re-acquisition must verify the recorded publisher MD5, byte count and SHA-256 before parsing.

## Exact observations and denominators

The single displayed PKD2L1 profile retains experiment-family observations rather than merging them into a false per-cell table:

- firing pattern: cervical N=10 animals/n=21 cells, 14 tonic and seven single-spike; thoracic N=12/n=23, nine tonic and 14 single-spike; lumbar N=9/n=21, 15 tonic and six single-spike;
- firing total: 38/65 tonic and 27/65 single-spike;
- passive properties: the article reports N=191 animals/n=659 cells, while the deposited table contains 654 complete rows (227 cervical, 239 thoracic and 188 lumbar);
- resting membrane potential: N=25 animals/n=125 observations (20 cervical, 41 thoracic and 64 lumbar);
- anatomy field-of-view/cell totals: 50/1,193 cervical, 51/1,167 thoracic and 51/1,594 lumbar.

Generic `Cell` integers are reused or reset across experiment families. Only keys explicitly declared by a source table may join rows inside that family. No whole-deposit cell roster or anatomy↔electrophysiology same-cell join is admitted.

## Four quarantined source conflicts

1. `Firing_pattern-Details.xlsx` embeds Fisher p=0.0616 while the primary article reports p=3.772e-6. Exact counts remain visible; the inferential statistics are not reconciled.
2. `Firing_pattern_Loc.xlsx` contains cervical and thoracic percentages, no lumbar row and no denominators. It cannot establish localization-to-function association.
3. The article passive-property denominator is n=659, but the deposited table has 654 complete rows.
4. The thoracic six-week distance array has n=478, whereas the field-of-view table reports 457 cells. No stable key resolves the 21-row difference.

Quarantine is visible in the source profile, Explorer record and provenance trail. Conflicted values are not averaged, silently selected or converted into geometry.

## UI and knowledge-base reconciliation

The Type Atlas now contains 162 source profiles across six source namespaces: 69 Russ, 43 Sathyamurthy, 11 Hayashi V2a, 30 Häring dorsal-horn, eight Alkaslasi cholinergic and one Crozat PKD2L1 profile. These are source records, not 162 unique or harmonized biological types.

The Research Explorer contains 414 records: 73 anatomy labels, 162 source profiles, 149 frozen morphology records, seven SCI entities, 17 SCI populations and six source lanes. The canonical source registry contains 25 sources and 29 record sets. Selecting the Crozat profile changes the evidence fingerprint and exposes observed cohort-level electrophysiology, exact source locators, denominators and four quarantines.

Shared project limitations stay in the shared boundary layer. Record cards carry fields that can differ for the selected source record. The focus resolver clears the previous morphology whenever the selected record has no admitted geometry, so a molecular/source-profile switch cannot inherit a generic or stale cell.

The reconciliation pass also closes the concrete navigation and card gaps:

- selecting a molecular profile exits `cell_detail`, `internal_reference` or `microns_observed_reference` and returns to the neutral home view;
- the viewport readout names the exact selected focus, reports zero admitted main-scene geometry and displays the fail-closed reason;
- the PKD2L1 fingerprint says `Multiple experiment-specific N/n` and retains the exact segment firing, passive-property, RMP and field-of-view/cell summaries separately;
- all 162 Explorer source profiles now contain exactly one canonical transmitter row and one non-inferable internal-structure gap; Hayashi's 11 profiles resolve to excitatory and the Crozat profile to inhibitory/GABAergic;
- the source-profile fingerprint adds projection target, synaptic/circuit connectivity, cross-source same-cell link and raw-electrophysiology-trace axes;
- a directly selected namespace is forced into the initial visible result groups even when it falls beyond the first eight groups;
- additional/source-wide evidence and shared missingness are collapsed only at display time; the underlying dossier payload is unchanged;
- duplicated Alkaslasi region/sex display rows are removed from the summary, while Häring's four retained source discrepancies remain available under the collapsed evidence/provenance details.

## Geometry and internal-detail boundary

The Crozat deposit does not provide raw ABF traces, raw microscopy, SWC, reconstructable morphology, segmentation, voxel volume, mesh, atlas transform or a stable cross-experiment cell ID. It also does not establish a same-cell link to the separate PKD2L1 SBF-SEM publication.

Therefore iteration 2.35 adds:

- zero cell geometries;
- zero atlas registrations or transforms;
- zero cross-source same-cell identities;
- zero same-specimen internal-structure objects;
- zero inferred membranes, nuclei, organelles, synapses, projections or circuit partners.

An empty geometry viewport is the scientifically correct state for this profile. Aggregate distributions, field-of-view counts, distance arrays and publication videos are not substitutes for a neuron-resolved source object.

## New implementation roots

- `tools/build_crozat_pkd2l1_functional_profile.mjs`
- `data/crozat-pkd2l1-functional-profile-0.1.json`
- `schemas/crozat-pkd2l1-functional-profile-0.1.schema.json`
- `scripts/validate-crozat-pkd2l1-functional-profile-0.1.mjs`
- `tests/crozat-pkd2l1-functional-profile.test.mjs`
- `docs/RESEARCH_TIMELINE_2026-09-01_ITERATION_2_35.md`
- `schemas/research-iteration-manifest-2.35.schema.json`
- `tools/build_research_iteration_manifest_2_35.mjs`
- `scripts/validate-research-iteration-manifest-2.35.mjs`
- `tests/research-iteration-manifest-2.35.test.mjs`
- immutable 2.34 snapshot validator and tests

Integration edits cover the source registry and tests, rights ledger, Explorer builder/index/runtime and tests, Type Atlas, evidence fingerprint, Overview, Data Lab, focus/SSR regressions, upgrade queue/registry, package validation routes and current research manifest. Iteration 2.34 remains byte-for-byte immutable.

## Research queue continuation

UPG-172 is completed for the exact aggregate functional-profile phase. Three evidence-gated follow-ons were appended:

- UPG-174: exact Dmrt3/dI6 pooled-transcriptome adapter with the source M1–M6 denominators retained;
- UPG-175: PKD2L1 experiment-family parsers that keep each table's key space and denominator separate;
- UPG-176: eLife 83108 Video 5 as a publication-video-only internal-detail watch, never a raw vEM stack, segmentation or mesh.

The deterministic upgrade registry contains 158 rows through UPG-176.

## Verification

Manifest-layer verification completed for this handoff:

- Crozat contract deterministic builder, schema validator and focused tests: passed;
- source-registry counts and Crozat record granularity: 25 sources, 29 record sets and 162 source profiles;
- Research Explorer counts: 414 total records and 162 source profiles;
- immutable research-iteration snapshots 2.28–2.34: passed without rebuilding historical manifests from current live inputs;
- deterministic research-iteration 2.35 manifest: immutable 2.34 parent receipt, 158 upgrades through UPG-176, zero registrations, zero admitted Crozat geometry and mutation gates passed.

The final manifest file and content SHA-256 receipts are emitted and asserted after this timeline input is incorporated; they are not embedded here because this file is itself an authoritative manifest input.

## File-specific rollback

1. Remove only the Crozat builder, contract, schema, validator and focused tests.
2. Revert only the Crozat source/profile adapter, Explorer/type-card integration, focus clearing regression and updated count labels.
3. Remove only UPG-174–176, restore UPG-172 to its prior state and deterministically rebuild the upgrade registry.
4. Restore the source registry, Explorer artifacts and version/validation wiring to their immutable 2.34 receipts.
5. Remove the 2.35 manifest infrastructure and reinstate the immutable 2.34 snapshot as the current release boundary.
6. Preserve the 1,097-object NeuroMorpho universe, frozen 149-record Explorer morphology lane, earlier manifests/timelines and unrelated dirty-worktree files.

This rollback scope covers only the 2.35 increment and does not authorize broad cleanup, history rewriting or deletion of the project directory.
