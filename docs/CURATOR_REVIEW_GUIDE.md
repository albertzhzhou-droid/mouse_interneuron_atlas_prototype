# Curator review guide — public-data workbench candidate 2.7

## Review identity

| Field | Frozen value |
|---|---|
| Workbench release ID | `ohri-mouse-interneuron-public-data-workbench-2.7.0` |
| Workbench catalog schema | `0.4.0` plus type-level Russ taxonomy crosswalk `0.1.0`, Russ provenance reconciliation dossier `0.1.0`, Tabulae condition catalog `0.1.0`, Tabulae source-local spatial session `0.1.0`, Tabulae multi-session comparison `0.1.0`, intake registry `0.7.0`, SpinalJ preflight `0.7.0`, Cano-Gomez specimen preflight `0.8.0`, local file-admission composer `0.1.0`, public-source release-admission review `0.1.0`, assertion-provenance composer `0.1.0`, authorization-plan composer `0.1.0`, independent authorization-evidence composer `0.1.0`, detached provenance-crate export `0.1.0`, public-source feasibility planner `0.1.0`, two-lane provenance trace `0.1.0`, cross-lane relationship admission `0.1.0`, local feedback contract `2.7.0`, and local adjudication contract `2.7.0` |
| Frozen scientific evidence release | `ohri-mouse-interneuron-research-mvp-candidate-0.2.0` |
| Scientific evidence schema | `0.2.0` |
| Release status | `localhost_candidate` |
| Manifest content SHA-256 | Verify the current value in `data/release-manifest-2.7.json`; it must match the packaged manifest. |
| Review environment | Offline-capable localhost application; no deployment |
| Current registration count | **0** |

This packet supports independent scientific and rights review of a **localhost public-data workbench candidate**. It is not evidence that the release is research-validated.

## Purpose and boundaries

The review asks whether the application accurately preserves the distinctions already established in the evidence ledger, source manifest, data contract, and spatial-asset records. It does not ask a curator to infer missing anatomy, approve a treatment, or treat co-displayed objects as sharing coordinates.

The candidate contains seven stable evidence entities: five population entities and two injury-state overlays. All seven evidence-entity geometries are synthetic (`SYN`) and all displayed paths are schematic (`SCH`). The separately displayed BrainGlobe atlas derivative is an inferred/interpolated reference (`INF`). Five NeuroMorpho SWCs are observed geometry (`OBS`) only in their source-local reconstruction frames. The release contains **zero `REG` objects**, zero atlas transforms for the SWCs, and no registration-error estimates.

The five SWCs are phenotype-stratified examples, not a representative sample, census, taxonomy, or frequency estimate. They are not mapped to the seven evidence entities. The product is not a complete interneuron census, connectome, clinical tool, treatment recommendation, or claim of human cell-type causality. Candidate 2.7 adds an independent authorization-evidence packet composer to the authorization-plan and assertion-provenance composers, deterministic public-source metadata release-admission review, feasibility planner, deliberately unjoined provenance trace, and not-admitted relationship proposal composer. It records a declared unacquired object, plan identifier, proposed independent reviewer, evidence locator, and five planned review stages without authenticating a decision, authorizing, acquiring, retaining, hashing, inspecting, or admitting a source object. A missing qualified route is a package-coverage result, not a biological-absence claim. No interaction fetches, uploads, downloads, persists, hashes a source file, authorizes reuse, embeds an external source object, transforms coordinates, admits an asset, or creates `REG`.

## Launch the private curator package

The distributed curator kit is a prebuilt static localhost application. Its launcher uses an installed Node.js runtime when available and can fall back to Python 3. It does not require `npm install`, network access, or a development toolchain.

1. Verify the ZIP SHA-256 against the digest sent through the approved private channel.
2. Extract the ZIP to a local folder; do not run it from inside the archive.
3. Open `START_HERE.html` and read the frozen release identity, scientific-status legend, and launch instructions.
4. Start the included standard-library localhost launcher using the exact command shown in `START_HERE.html`.
5. Open the printed loopback URL. Confirm that it begins with `http://127.0.0.1:` or `http://localhost:` and does not bind to a non-loopback address.
6. Keep the terminal window open during review. Stop the launcher with `Ctrl+C` when finished.

Do not substitute a deployed URL. The curator package must load its prebuilt site and research assets from the extracted local files.

### Optional repository workflow for developers

Only a developer reviewing the source repository needs the following commands:

```bash
npm install
npm run dev
```

Open the localhost address printed by the development server, normally `http://localhost:3000`. This is not the primary curator launch path.

The extracted kit loads the release, atlas planes, contours, and morphologies from local relative paths. It does not automatically query external literature, atlas, or morphology services. Source links can open external websites only when a reviewer deliberately clicks them. For a strictly offline review, disconnect the network and do not follow external links. Asset-acquisition scripts are not part of the viewer session.

The curator package may be shared privately with reviewers if all attribution and source records are retained. Do not publicly deploy or publicly redistribute this candidate as part of the review; those uses remain an institutional asset-level review gate.

## Repository-only machine preflight

These source-repository commands are for developers and are not included in or required by the recipient static kit. Package recipients should instead verify the distributed ZIP against its companion `.zip.sha256` file and run the kit's included integrity verifier as directed by `START_HERE.html`. Those package checks establish file integrity; neither package nor repository checks replace scientific curation.

Developers with the source repository may run:

```bash
node scripts/validate-research-mvp.mjs
node scripts/validate-json-schema.mjs
node scripts/validate-public-data-catalog.mjs
node scripts/validate-russ-harmonized-taxonomy-crosswalk-0.1.mjs
node scripts/validate-public-source-intake.mjs
node scripts/validate-public-file-admission-preflight-0.7.mjs
node scripts/validate-public-file-admission-preflight-0.8.mjs
node scripts/validate-public-file-admission-composer-0.1.mjs
node scripts/validate-russ-reconciliation-dossier-0.1.mjs
node scripts/validate-tabulae-spatial-local-session-0.1.mjs
node scripts/validate-tabulae-spatial-local-comparison-0.1.mjs
node scripts/validate-public-provenance-crate-0.1.mjs
node scripts/validate-evidence-feasibility-planner-0.1.mjs
node scripts/validate-evidence-provenance-trace-0.1.mjs
node scripts/validate-cross-lane-relationship-admission-0.1.mjs
node scripts/validate-public-source-release-admission-service-0.1.mjs
node scripts/validate-public-source-assertion-provenance-0.1.mjs
node scripts/validate-public-source-authorization-plan-0.1.mjs
node scripts/validate-curator-review-contracts-2.7.mjs
node scripts/validate-spatial-assets.mjs
node scripts/build-release-manifest.mjs --check
npm test
```

Record the manifest hash and curator ZIP digest in `CURATOR_REVIEW_FORM.md`. A source commit is optional provenance when it is supplied with the kit; package-only reviewers are not expected to have Git metadata. Two curators must review the same release, mapping hash, and package digest independently.

## Spatial-status vocabulary

| Status | Meaning in this release | What it does **not** mean |
|---|---|---|
| `OBS` | Geometry directly represented in the cited source asset and retained in its stated native/source-local frame. The five SWCs are `OBS` only in `NeuroMorpho_CNG_standardized_local_frame`. | Atlas location, representativeness, biological completeness, or linkage to an evidence entity. |
| `INF` | A derived or interpolated reference with recorded inputs and method. The BrainGlobe planes and contours are `INF`. | Directly observed entity placement, validated registration, or permission to measure entity location. |
| `SCH` | A literature-supported schematic route used to communicate a bounded circuit concept. | Reconstructed tract, measured connection geometry, or path length. |
| `SYN` | Project-authored prototype geometry used for interaction. All seven evidence entities are `SYN`. | Observation, specimen geometry, or anatomical coordinates. |
| `REG` | An observed object transformed from a declared source space to a declared target atlas, with transform checksum, held-out landmark error, and curator approvals. | Mere co-display, viewer scaling, centring, or a visualization-only transform. |

Workbench candidate 2.7 and its frozen evidence payload contain **0 `REG` objects**. A curator must reject any wording or visual interpretation that implies otherwise.

## Eleven review tasks after launch

### Task 1 — Locate in space without creating registration

1. Open the main 3D view and the local Reference Data Lab.
2. Inspect the atlas reference tab and at least two sampled planes.
3. Inspect all five morphology exemplars in the morphology tab.
4. Return to the evidence-entity view and inspect at least two entities.
5. Confirm that the UI distinguishes atlas `INF`, morphology `OBS`, entity `SYN`, and path `SCH`.

**Accept if:** no screen or interaction implies that an evidence entity or SWC has a validated atlas location; measurement use is forbidden; and the morphology view states that the five SWCs are source-local, unregistered, non-representative, and not linked to the seven entities.

**Reject if:** co-display, soma centring, viewer scaling, a scene position, or an atlas plane is described as `REG`; a named spinal segment is inferred from an unregistered SWC; or a distance, lamina, laterality, pathway length, or injury relationship is presented as measured.

### Task 2 — Inspect identity axes and the fixed 5 + 2 model

1. Search and open each of the seven stable entity IDs listed in the review form.
2. Check whether lineage, molecular identity, transmitter, projection/connectivity, spatial identity, and injury state remain separate axes.
3. Confirm that the two `mouse.overlay.*` records are state overlays, not population classes.

**Accept if:** all seven IDs are present exactly once, the count remains five populations plus two overlays, and a marker is not treated as a unique or complete cell taxonomy.

**Reject if:** an overlay is counted as a population, an identity axis is silently collapsed into another, or the interface implies that these seven records enumerate all interneurons.

### Task 3 — Evaluate causal evidence and counterevidence

1. Open the dI3 record and trace `CLM-P03-DI3-NECESSITY` to its condition and source.
2. Confirm that its causal grade remains `NEC`, not `SUF`.
3. Open the VGAT/KCC2 overlay and inspect both P05 conditions and their negative/boundary statements.
4. Verify that every visible conclusion can be traced through entity → claim → condition → source → DOI/access record.

**Accept if:** causal grades, experimental units, endpoints, results, null findings, counterdirectional findings, and translational boundaries are visible without strengthening the source.

**Reject if:** association becomes causation; necessity becomes sufficiency; a missing value becomes zero; a null result disappears; or a source-specific endpoint becomes general locomotor recovery or human efficacy.

### Task 4 — Compare models without pooling

1. Compare the two P05 conditions: staggered T7/T10 and complete T8.
2. Compare the P08 neonatal and adult conditions.
3. Compare at least one P09 mouse causal condition with the P09 uncontrolled human cohort.
4. Add a fourth condition, then reduce the comparison back to two.

**Accept if:** the comparison preserves species, life stage, lesion level/type/completeness, phase, intervention, endpoint, causal grade, result, negative findings, and boundary for each row. P05, P08, and P09 strata must remain separate.

**Reject if:** incompatible models are pooled, the human cohort is presented as causal cell-population evidence, adult and neonatal recovery are merged, or spasm/breathing endpoints are recast as locomotion.

### Task 5 — Trace, export, and restore a review state

1. Select an entity, apply filters, choose two to four comparison conditions, adjust the camera/slice/layers, and open a panel.
2. Trace at least one displayed claim to its source and DOI/access status.
3. Export JSON, CSV, and PNG.
4. Import the JSON state into the same release and confirm that the selected entity, filters, comparisons, camera, slice, layers, and panel are restored.

**Accept if:** exports retain release/schema identity, status labels, provenance, and disclaimers; the JSON importer rejects incompatible or malformed state; and restoration does not change the scientific meaning.

**Reject if:** an export drops the `SYN/SCH/INF/OBS` boundary, implies `REG`, silently restores an unknown entity, or requires an automatic internet request. Record any live-browser file-selection or round-trip failure as an engineering blocker.

### Task 6 — Identify gaps without interpreting absence

1. Open the gaps view for at least two entities.
2. Use a filter or search that intentionally yields no matches.
3. Inspect missing condition, sample, endpoint, spatial, morphology, rights, and curation fields.

**Accept if:** missing values have an explicit reason and an empty result is clearly described as a query result, not biological absence. Unregistered entities remain evidence records but are not promoted to `OBS` or `REG`.

**Reject if:** raw null, zero, empty text, or a synthetic coordinate substitutes for unknown evidence; “not found” becomes “not present”; or an evidence gap is rewritten as a negative biological finding.

### Task 7 — Audit the public-source intake without acquiring data

1. Open **Sources** and select **SpinalJ processed example data**.
2. Confirm the pinned intake card states metadata audited, files not admitted.
3. Inspect the reported facts and required file-admission checks.
4. Export the source intake record and confirm it includes the linked public metadata intake.

**Accept if:** the intake reports zero downloaded files, zero bundled assets, zero registrations, an unverified transform, and pending file-level rights; the dataset-declared SpinalJ v1.13 is retained; and no current repository version is silently substituted.

**Reject if:** the card or export implies a downloaded image, a usable transform, a validated registration, bundling/public-host authorization, or a transfer of source-local mapping to the five NeuroMorpho SWCs or seven synthetic entities.

### Task 8 — Audit the Russ taxonomy crosswalk without creating an identity transfer

1. Open **Sources** and select **Russ 2021 harmonized molecular taxonomy**.
2. Confirm that the explorer reports 69 populations, 65 interneuron candidates, eight groups, and `TYPE_LEVEL` authority.
3. Search `Excit-36` and `Excit-38`, then inspect their marker context and the linked prototype crosswalk warnings.
4. Export the local crosswalk JSON and inspect the source-table receipt.

**Accept if:** the source XLSX remains unbundled, its bytes and SHA-256 receipt remain visible, all seven prototype mappings remain non-exact, and postnatal reference / adult-lumbar validation contexts are not merged.

**Reject if:** a marker rank becomes a unique project identity, a spatial coordinate, adult segment assignment, same-cell multimodal join, connection claim, or `REG` status.

### Task 9 — Audit correction provenance, Tabulae condition labels, and the future STARmap PLUS gate

1. With **Russ 2021 harmonized molecular taxonomy** selected, open **Russ 2021 correction review**.
2. Confirm both correction records are linked: `COR-RUSS-2022-02` for supplementary links/cross-references and `COR-RUSS-2022-10` for the Figure 3A `Excit-21` / `Excit-31` / `Excit-32` label correction.
3. Confirm that both records explicitly state no Supplementary Table 1 content or label change, then export the dossier.
4. Select **Tabulae Paralytica spinal-cord injury atlas**, filter the condition browser, inspect its visible GEO labels, and export the index.
5. Confirm the Tabulae index has eight groups / 93 distinct labels, `SOURCE_METADATA_CONDITION_INDEX_ONLY` authority, zero bundled source bodies, and an explicit distinction between source sample labels, spatial sections, and cells.
6. Select **STARmap PLUS adult mouse CNS atlas — lumbar spinal-cord slice** and confirm its `SOURCE_LOCAL_OBS` / metadata-audit boundary and `UPG-010` rejection conditions.

**Accept if:** the dossier remains `PROVENANCE_RECONCILIATION_ONLY`, preserves the unbundled marker-table receipt, keeps adult-lumbar and postnatal contexts separate; the Tabulae index remains literal-label metadata only with no numerical analysis, cell identity, coordinate, same-cell join or `REG`; and the STARmap lead is described as one source-local lumbar slice rather than an admitted whole-spine atlas.

**Reject if:** any correction is used to create an exact mapping, coordinate, connection, same-cell join, or `REG`; a Tabulae series label is expanded into an unverified treatment/sex/severity effect, a spatial section becomes an interneuron, or an unacquired source body is implied; or STARmap is presented as acquired, complete, registered, or representative of the entire spinal cord.

### Task 10 — Inspect an unbundled Tabulae source-local spatial section

1. Select **Tabulae Paralytica spinal-cord injury atlas** in **Sources** and locate **Tabulae source-local comparison board**.
2. Confirm that it lists 24 declared sections and requires the exact three gzip member names for each selected section.
3. If you choose to obtain one lawful public GEO triplet, select it locally; otherwise inspect the empty-state and filename requirements only.
4. When a triplet is selected, confirm that the browser shows a 2D tissue image plus source-local Visium spots and can export a local receipt.
5. Confirm that the receipt excludes the image and coordinate rows, while retaining local file hashes and parser summaries.

**Accept if:** no source file is bundled, fetched automatically, uploaded or persisted; imported files must match a declared GEO section; the display is explicitly source-local 2D; and a spot is never described as an interneuron, gene-expression result, 3D coordinate, atlas transform, same-cell join or `REG`.

**Reject if:** the package claims a published source checksum or reuse authorization that it does not have; a local SHA-256 is relabelled as a source checksum; a section is silently converted to cell-level data or 3D anatomy; or the component makes a remote acquisition, persistence, transformation or registration claim.

### Task 11 — Inspect multi-section boundaries

1. With two or more lawful local triplets, add distinct declared sections up to the four-session limit; otherwise inspect the selection and empty-state contracts.
2. Confirm that cards are labelled source-local, side-by-side only, and that section order and inter-section geometry are not established.
3. Export a comparison receipt and confirm that it contains per-session names, hashes, parser counts and scale factors, but no source image, coordinate rows or expression data.

**Accept if:** the board cannot overlay, normalize, order, stack, align or quantify sections; it never infers a cellular, treatment, 3D or registration result.

**Reject if:** a card layout or receipt is described as spatial correspondence, a physical section order, a source-to-project transform, or `REG`.

### Task 12 — Inspect the local public file-manifest composer

1. In **Sources**, select **SpinalJ processed example data** and inspect the object-level composer; then select **Cano-Gomez et al. mouse spinal-cord spatial and multiomic resource** and inspect the specimen-aware composer.
2. Confirm that each form is locked to its matching `0.7.0` or `0.8.0` schema and that the Cano-Gomez form retains `preprint_resource`.
3. Confirm the form requires publisher/repository metadata rather than a local source file: HTTPS object URL, published bytes, format, source-declared checksum, file-level rights record, and coordinate/specimen fields or explicit missingness.
4. Confirm incomplete records block export. If a complete hypothetical metadata record is entered, inspect only the downloaded JSON; do not treat it as an acquired asset.

**Accept if:** export fixes `localSha256` to `null` and `metadata_only_not_downloaded_not_registered`, and the component never fetches, uploads, persists, locally hashes, bundles, transforms, rights-clears or registers a source asset.

**Reject if:** a URL or source checksum is presented as proof of possession, local verification, reuse authorization, a project transform, a biological result, or `REG`.

### Task 13 — Inspect the not-admitted cross-lane relationship proposal gate

1. In **Sources**, select an atlas evidence entity and a public-source card.
2. In **CROSS-LANE ADMISSION GATE**, choose each candidate relation type, including coordinate transform and same-cell identity.
3. Confirm the proposal remains **NOT ADMITTED · 0 REG** and exposes missing source-object, rights, independent-evidence and validation-plan requirements. Confirm that coordinate and same-cell choices add their stricter requirements.
4. Export the JSON and confirm `admissionDecision` is `not_admitted`, `sourceObjectsAcquired` is `false`, and `registrationsCreated` is `0`.

**Accept if:** the interface exports a local metadata-only question with frozen record IDs and explicit blockers, without adding an edge to the trace or changing any source/entity status.

**Reject if:** a proposal, shared label, visual overlap, source URL, or curator selection is presented as a source-object relationship, same-cell/same-specimen identity, coordinate transform, reuse authorization, biological fact, or `REG`.

### Task 14 — Inspect the metadata-only release-admission review

1. In **Sources**, use the local composer to export a complete hypothetical SpinalJ `0.7` or Cano-Gomez `0.8` metadata manifest, then import it.
2. Inspect **UPG-006 · RELEASE-ADMISSION REVIEW** and verify the required checks distinguish recorded publisher metadata from independently required asset-level rights review.
3. In **UPG-018 · ASSERTION PROVENANCE**, create one publisher-asserted or unresolved assertion with a typed locator, curator alias and date; export its JSON receipt.
4. Confirm the UPG-006 receipt is `not_admitted_pending_curator_object_and_rights_review` and the UPG-018 receipt is `not_locally_verified`; both have no acquired/bundled object, no local checksum, and `registrationsCreated=0`.

**Accept if:** a complete manifest and its assertion receipt are described only as metadata/provenance for curator review, with all source-object authentication, admission, verification, rights, acquisition, transform, and registration decisions still blocked.

**Reject if:** the receipt, URL, declared source checksum, curator transcription, or review check is described as source-file possession, local verification, reuse authorization, biological truth, a transform, or `REG`.

## Required red-team questions

Answer every question in the review form with **Accept**, **Reject**, or **Uncertain**, and cite the exact claim, condition, statement, or source record that supports the decision.

- **P02:** Is the staggered hemisection kept distinct from a single complete lesion? Are reduced brainstem labeling and the no-human-efficacy boundary retained?
- **P03:** Does the claim remain necessity (`NEC`), never sufficiency (`SUF`)? Are subtle baseline stance and foot-placement findings retained?
- **P05:** Are staggered T7/T10 and complete T8 separate? Are the early null, bumetanide null, complete-T8 failure, no-axon-growth finding, unchanged evoked latency, residual coactivation, and no-global-disinhibition boundary retained?
- **P08:** Are neonatal and adult conditions separate? Are variable partial adult recovery, the training-alone null, unblinded testing, and the no-global-inhibition claim retained?
- **P09:** Are mouse causal experiments separate from the uncontrolled human cohort? Is `humanCausalEvidence=false` retained, together with the healthy-mouse null and nonrandomized-cohort limitation?
- **P14:** Is the endpoint spasm rather than beneficial locomotion? Are the repeated-stimulation counterfinding and no-clinical-safety boundary retained?
- **P16:** Is the endpoint breathing rather than locomotion? Are the healthy resting-breathing null and the non-equivalence to locomotor V2a populations retained?
- **Russ / UPG-003 / UPG-009:** Do all 69 labels remain type-level only? Are marker context, postnatal reference and adult-lumbar validation kept distinct? Is any narrower transfer deferred until the source-table/narrative/correction reconciliation is reviewed?
- **Tabulae / UPG-004 / UPG-011 / UPG-012 / UPG-013:** Are all eight groups only literal GEO series-label metadata? Does the multi-session board remain source-local 2D with no bundled source asset, source checksum claim, upload, persistence, alignment, order, stack, quantitative comparison, cell call, 3D reconstruction, transform or `REG`? Do the spatial sections remain non-cell records, and do the 93 labels remain free of an inferred effect, coordinate, same-cell join, source-body acquisition or `REG`?
- **SpinalJ / Cano-Gomez / UPG-006 / UPG-014:** Does the composer and release-admission review emit metadata only, clearly distinguish publisher assertions from asset-level rights review, and retain no source-file upload, download, local hash, persistence, rights authorization, bundle, source-to-project transform or `REG`? Does the detached RO-Crate 1.3 export reference exactly one declared external HTTPS source while retaining the unacquired/unregistered state?
- **Source assertions / UPG-018:** Does the composer require a declared unacquired object or explicit unknown, typed locator, allowed source state, reviewer and date? Does it remain not locally verified and not admitted rather than becoming an authority, asset-rights, biological, relationship, transform, or `REG` decision?
- **Authorization plan / UPG-019 and evidence packet / UPG-020:** Does the plan bind one declared unacquired manifest object, version, linked assertion ID, and requested—not granted—rights review? Does the packet bind that plan to a proposed independent reviewer, evidence locator, and five planned authority/terms/retrieval/integrity/retention stages? Is the packet still not authenticated, not executed, not locally verified, with no authorization, acquisition, credential storage, retention, local checksum, content inspection, transform, or `REG`? Is `UPG-021` still research-watch?
- **Feasibility planner / UPG-015:** For a selected question, does the planner distinguish a single source-specific route from separate non-joinable routes and from a package-coverage gap? Does it avoid acquiring a source, claiming biological absence, asserting a same-cell/same-specimen/coordinate/causal relation, or creating `REG`?
- **Two-lane trace / UPG-016:** Does the research lane retain declared entity/claim/condition/statement/source references and the public lane retain only axis/route/public-source references? Does the **NO CROSS-LANE EDGE** policy prevent an inferred identity, source-object, coordinate, causal, authorization, or `REG` relation?
- **Relationship proposal / UPG-017:** Does every candidate relation remain not admitted, with a frozen research record, frozen public-source record, missing object/rights/independent-evidence/validation fields, `sourceObjectsAcquired=false`, and `registrationsCreated=0`? Do coordinate and same-cell options retain their relation-specific proof requirements?

Also ask:

- Can any viewer-only coordinate be mistaken for a measured anatomical coordinate?
- Can any object be mistaken for `REG` despite the manifest count of zero?
- Can a reviewer mistake five phenotype-stratified SWCs for a representative set?
- Can a missing field, empty result, or absence of a bundled asset be mistaken for biological absence?
- Can a curator trace every challenged statement to a stable record and source?
- Does any wording exceed the species, life stage, injury model, phase, intervention, endpoint, or causal test in the source?

## How to submit feedback

1. Make a fresh copy of `CURATOR_REVIEW_FORM.md`. Do not share answers with the second curator before both independent forms are submitted.
2. Record the exact release ID, manifest content hash, and curator ZIP digest. Record a source-build commit only if it was supplied. Reviews of different release, mapping, or package hashes cannot be counted as dual approval of the same artifact.
3. Choose exactly one decision for every item: **Accept**, **Reject**, or **Uncertain**.
4. Identify the challenged record with stable IDs whenever possible: entity, claim, condition, negative/boundary statement, source, atlas asset, or morphology ID.
5. Classify feedback as evidence, wording, identity mapping, spatial/registration, interaction, or rights.
6. For wording changes, provide exact replacement text and the evidence that bounds it. Do not strengthen claims to make the UI simpler.
7. For a rejection, state the release-blocking condition and the minimum correction that would resolve it. For uncertainty, state what source, expertise, or test is missing.
8. Do not directly edit the release payload or source ledger during independent review. Send the completed form to the project lead for adjudication and a new versioned candidate.

Curator approval of wording or mappings does not itself create a registration, establish representativeness, authorize public deployment/public redistribution, or convert this engineering candidate into a research-validated product. Private curator-package sharing is permitted only with retained attribution and source records; public release remains an institutional asset-level review gate. Promotion also requires the human gates in the Research MVP charter, including two independent spinal-neuroscience curators reviewing the same mapping hash and target-researcher task testing.

## Authoritative materials for review

The following paths are relative to the extracted curator-package root:

- `docs/RESEARCH_MVP_CHARTER.md`
- `docs/RESEARCH_MVP_GAP_AUDIT.md`
- `docs/SPATIAL_ASSET_PROVENANCE.md`
- `docs/RIGHTS_LEDGER.csv`
- `data/research-mvp-release-0.2.json`
- `data/public-data-catalog-0.4.json`
- `data/russ-harmonized-taxonomy-crosswalk-0.1.json`
- `data/russ-reconciliation-dossier-0.1.json`
- `data/tabulae-condition-catalog-0.1.json`
- `data/tabulae-spatial-local-session-0.1.json`
- `data/tabulae-spatial-local-comparison-0.1.json`
- `data/public-source-intakes/spinalj-processed-metadata-audit-0.4.json`
- `data/public-source-intake-registry-0.7.json`
- `data/file-admission-preflight-0.7.json`
- `data/file-admission-preflight-0.8.json`
- `data/public-file-admission-composer-0.1.json`
- `data/evidence-feasibility-planner-0.1.json`
- `data/evidence-provenance-trace-0.1.json`
- `data/cross-lane-relationship-admission-0.1.json`
- `data/public-source-release-admission-service-0.1.json`
- `data/public-source-assertion-provenance-0.1.json`
- `data/public-source-authorization-plan-0.1.json`
- `data/public-source-independent-authorization-evidence-0.1.json`
- `data/curator-feedback-contract-2.7.json`
- `data/curator-adjudication-contract-2.7.json`
- `data/release-manifest-2.7.json`
- `schemas/research-mvp-release.schema.json`
- `schemas/russ-harmonized-taxonomy-crosswalk-0.1.schema.json`
- `schemas/russ-reconciliation-dossier-0.1.schema.json`
- `schemas/tabulae-condition-catalog-0.1.schema.json`
- `schemas/tabulae-spatial-local-session-0.1.schema.json`
- `schemas/tabulae-spatial-local-comparison-0.1.schema.json`
- `schemas/public-file-admission-manifest-0.7.schema.json`
- `schemas/public-file-admission-preflight-0.7.schema.json`
- `schemas/public-file-admission-manifest-0.8.schema.json`
- `schemas/public-file-admission-preflight-0.8.schema.json`
- `schemas/public-file-admission-composer-0.1.schema.json`
- `schemas/evidence-feasibility-planner-0.1.schema.json`
- `schemas/evidence-provenance-trace-0.1.schema.json`
- `schemas/cross-lane-relationship-admission-0.1.schema.json`
- `schemas/public-source-release-admission-service-0.1.schema.json`
- `schemas/public-source-assertion-provenance-0.1.schema.json`
- `schemas/public-source-authorization-plan-0.1.schema.json`
- `schemas/public-source-independent-authorization-evidence-0.1.schema.json`
- `schemas/curator-feedback-contract-2.7.schema.json`
- `schemas/curator-adjudication-contract-2.7.schema.json`
- `evidence/EVIDENCE_LEDGER.md` — package-local copy of `../interneuron_sci_review/02_EVIDENCE/EVIDENCE_LEDGER.md`.
- `evidence/SOURCE_MANIFEST.tsv` — package-local copy of `../interneuron_sci_review/01_LITERATURE/SOURCE_MANIFEST.tsv`.
