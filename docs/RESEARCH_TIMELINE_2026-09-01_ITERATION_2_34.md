# Research timeline — iteration 2.34

Date: 2026-09-01  
Transition: unpackaged research iteration 2.33 → unpackaged research iteration 2.34  
Scope: in-place public-data research upgrade; no full-project copy, distributable package, deployment, curator/admin workflow, or privately supplied object was created.

## Trigger and decision

The visible product had drifted from its available morphology evidence. The application exposed only 149 exact morphology objects in the comparison tools, switching among broader interneuron records could leave an unchanged prior cell visible, and information cards repeated shared project limitations while omitting record-specific source fields.

Iteration 2.34 fixes that mismatch with one fixed scientific parameter: only exact, stable mouse spinal-interneuron source objects may drive cell geometry. Life stage, archive, paper, source dimensionality, diameter availability, deposited neurite domain and UI presentation remain filterable dimensions. Missing internal detail, absent source domains and unavailable joins are not filled with generic or procedurally generated biology.

## Official source audit

The exact official NeuroMorpho release 8.6.124 query is:

`species:mouse` + `brain_region:spinal cord` + `cell_type:interneuron`, with no age filter.

The three pinned API pages contain 500, 500 and 97 records: 1,097 records and 1,097 unique NeuroMorpho IDs across 12 papers and five archives. The source distributions are retained without normalization:

- life stage: 729 young, 226 young adult, 142 adult;
- dimensionality/diameter: 916 diameter-authorized 3D, 142 no-diameter 3D, 39 diameter-authorized source-labelled 2D;
- deposited domain: 842 dendrites+soma+no axon, 253 dendrites+soma+axon, two uninterpreted neurites+soma;
- physical integrity: 740 dendrites moderate, 233 dendrites+axon moderate, 79 dendrites complete, 23 dendrites incomplete, 20 dendrites moderate+axon incomplete and two neurites moderate;
- complete-axon claims: zero.

The two counts of 142 are independent denominators: the 142 adult records are not the same set as the 142 no-diameter records. A NeuroMorpho record is not an independent animal, specimen, biological type, prevalence estimate or identity link to a molecular/SCI record.

Official evidence: [API reference](https://neuromorpho.org/apiReference.html), [release/API page](https://www.neuromorpho.org/api.jsp), [morphology and completeness FAQ](https://neuromorpho.org/myfaq.jsp), and [reuse terms](https://neuromorpho.org/useterm.jsp).

## Exact object acquisition and QC

`tools/build_neuromorpho_no_age_universe.py` snapshots all three API pages and acquires the official standardized CNG SWC for every record with an identifying user agent and rate limiting. A first pass quarantined five transient DNS failures; the explicit retry completed those objects, and the final immutable result has zero quarantined records.

The completed asset set contains:

- 1,097 admitted exact SWCs;
- 149 previously admitted exact objects referenced in place;
- 948 delta raw SWCs;
- zero copied geometry JSON files;
- 954 files and approximately 77 MiB in the new dataset directory;
- zero duplicate raw-SWC hash groups and zero duplicate canonical-geometry hash groups;
- zero atlas registrations and zero same-specimen internal-structure objects.

Every SWC passes strict seven-column parsing, finite-coordinate/radius checks, unique node IDs, one root, parent existence, connectivity, acyclicity, identity, byte count, SHA-256 and source-metadata gates. The validator reparses all 1,097 objects and recomputes node/segment counts, bounds, extents, type counts and cable length. It also checks the frozen adult-subset and seven named-route memberships against their existing exact assets.

Pinned primary receipts:

| Object | Bytes | SHA-256 |
|---|---:|---|
| `universe-index.json` | 8,025,022 | `1ba52eb81aa141349f9e9a6916f8acf5a089ba079e9de34507e50f32bd6cfd68` |
| `asset-manifest.json` | 258,944 | `fcc798ed00b81b64073daea24777773a7fc56617f21cbe71206b36e800e859d5` |
| runtime roster | 12,747 | `9c8baa5301ca726a60b70b00a95cdb70a6c1e7a268a3ad8ba6673d29aedc8ec1` |
| quarantine report | 216 | `1d9cc65ec335335f3e5d6f6509d29bb742a34d1c21b23d1e5fb7b8d3008e5830` |

The asset manifest declares the delta files; existing exact SWCs are referenced rather than duplicated. Standardized source-local coordinates are not atlas axes or restored in-vivo dimensions.

## Runtime and UI reconciliation

The morphology workspace now defaults to an `Exact universe · 1,097 source objects` tab, while the existing census is explicitly labelled `Frozen adult subset · 142 exact SWCs`. Research Overview, the Data Lab scope strip and the main browse action lead with 1,097 while preserving the frozen-142 and legacy-149 comparison denominators; the frozen summary is hidden when the universe tab is active so two incompatible scopes are not shown as one count.

Selection is evidence-addressed:

1. a selected NeuroMorpho ID must belong to the pinned 1,097-record runtime roster;
2. selection immediately clears the prior geometry;
3. the selected source path, byte count and SHA-256 are verified;
4. the exact SWC is parsed and only then rendered;
5. an invalid, malformed, unadmitted or failed selection renders no cell and cannot borrow a previous or representative geometry.

The universe browser supports record-specific filters for life stage, archive, dimensionality, diameter, axon domain, paper, membership and source text. One shared boundary panel now carries dataset-wide identity, geometry and unavailable-axis limits. Each record card is limited to facts that can differ for that object: source labels, region, stage, sex, strain, condition, domain, integrity, attributes, numeric-age availability, exact topology/morphometrics, paper, archive and provenance receipts.

Source-labelled 2D remains a source classification rather than a license to invent depth. Audit of all 39 2D SWCs found finite z values and 37 non-zero source-z extents; the runtime preserves those source values, locks the display to the source XY view and adds no inferred or extruded depth. `No Diameter` records retain the syntactic SWC radius column for parsing but do not authorize radius-derived surfaces.

## Evidence boundary

This iteration does not create:

- a representative or averaged interneuron;
- a complete axon or repaired neurite;
- membrane, nucleus, organelle, bouton, synapse, receptor or internal ultrastructure;
- molecular/SCI ↔ morphology identity;
- a cross-paper common frame, atlas placement or registration;
- an animal/specimen denominator or prevalence estimate;
- geometry from metadata, textual similarity, a shared marker or a missing field.

The exact SWC is connected vector centreline/radius morphology in a standardized local frame. It is not observed membrane or same-cell internal anatomy.

## Research queue additions

UPG-088 is now completed at the exact-object level. Four source-gated follow-ons were appended without admission or geometry fabrication:

- UPG-170: adult Chx10/V2a C1–L1 light-sheet population-reference movie;
- UPG-171: E14.5 Dmrt3/dI6 M1–M6 transcriptomic adapter;
- UPG-172: aggregate PKD2L1 regional anatomy/electrophysiology tables;
- UPG-173: adult lumbar Shox2/Chx10 aggregate electrophysiology taxonomy.

No newly located source passed a same-cell morphology↔transcriptomics gate or supplied neuron-resolved mouse-spinal interneuron volume-EM/internal-ultrastructure objects. Publication figures, compressed movies, aggregate tables and non-interneuron EM therefore remain non-surrogates.

## New implementation roots

- `tools/build_neuromorpho_no_age_universe.py`
- `data/neuromorpho-no-age-query-universe-0.1.json`
- `data/neuromorpho-no-age-query-universe-roster-0.1.json`
- `public/data/neuromorpho_release_8_6_124_no_age_universe_v1/`
- `schemas/neuromorpho-no-age-query-universe-0.1.schema.json`
- `scripts/validate-neuromorpho-no-age-query-universe-0.1.mjs`
- `tests/neuromorpho-no-age-query-universe.test.mjs`
- `app/neuromorpho-swc-runtime.js`
- `tests/neuromorpho-swc-runtime.test.mjs`
- `app/NeuroMorphoUniversePanel.tsx`

Integration edits include `app/MorphologyViewer.tsx`, `app/SourceLocalMorphologyViewport.tsx`, `app/morphology-matrix-state.js`, `app/research-visual-target.js`, `app/ResearchExplorer.tsx`, `app/ResearchDataLab.tsx`, `app/ResearchOverview.tsx`, `app/AtlasPrototype.tsx`, `app/globals.css`, focused tests, the research-upgrade queue/registry, version labels and the 2.34 deterministic research manifest. The Research Explorer now labels its 149 morphology records as a frozen cross-lane index and points separately to the 1,097-object exact morphology universe instead of presenting the two denominators as interchangeable.

## Verification

Completed before final handoff:

- standalone 1,097-object universe validator: passed;
- all 1,097 SWC byte, SHA-256, identity, topology and scientific-admission checks: passed with zero quarantines;
- universe contract tests: passed;
- lazy SWC runtime and exact-parity tests: passed;
- focus resolver tests: passed;
- focused UI/runtime suite: 10/10 passed;
- server-rendered English UI suite: 36/36 passed;
- research-upgrade registry: 155 entries, validator and 8/8 focused tests passed;
- immutable research-iteration snapshots 2.28–2.33: passed without rebuilding historical manifests from current inputs;
- deterministic research-iteration 2.34 manifest: 102 authoritative inputs, immutable 2.33 parent receipt, 155 research upgrades, 1,097 admitted source objects, 149 existing exact-asset references, 948 delta raw SWCs, zero generated geometry copies and zero registrations; byte-identical rebuild and mutation gates passed;
- current whole-project research regression: 565 tests, 561 passed, zero failed and four intentional optional-source/release-check skips;
- targeted ESLint: passed;
- production build: passed, with the existing large-chunk advisory only.

The final manifest file and content SHA-256 receipts are emitted and asserted after this timeline input is incorporated; they are not embedded here because this timeline is itself one of the manifest's authoritative inputs.

Interactive browser visual QA remains unverified because the available in-app browser blocked the localhost URL under its URL policy. Build, SSR and source-contract tests are evidence for compilation and behavior contracts, not a substitute for visual inspection.

## File-specific rollback

1. Remove only the new universe builder, contract, roster, schema, validator, tests, runtime, panel and `neuromorpho_release_8_6_124_no_age_universe_v1` dataset.
2. Revert only the universe-tab, runtime-roster and fail-closed focus integrations in the listed app files, plus their focused CSS/tests.
3. Restore UPG-088 to its prior watch state and remove only UPG-170–173 before deterministically rebuilding the upgrade registry.
4. Restore current iteration labels and manifest wiring to the immutable 2.33 snapshot.
5. Preserve the frozen 142-record adult census, seven supplementary route assets, prior timelines/manifests and archived 2.8 curator package. They were reused or referenced, not replaced.
6. Do not delete unrelated dirty-worktree files, rewrite history or remove a broad project directory.

This rollback scope covers only the 2.34 increment and does not authorize broad cleanup.
