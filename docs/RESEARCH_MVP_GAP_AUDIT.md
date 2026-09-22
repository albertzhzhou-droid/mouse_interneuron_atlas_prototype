# Research MVP gap audit

**Audit date:** 2026-08-17

**Audited candidate:** `ohri-mouse-interneuron-research-mvp-candidate-0.2.0`

## Verdict

Release 0.2 is now a **localhost Research MVP engineering candidate**. It combines the structured evidence contract with comparison and gaps UI, a pinned local BrainGlobe atlas reference, and five real local-frame NeuroMorpho morphologies. It is not a research-validated MVP: there are zero registered cells or evidence entities, public deployment or broader redistribution remains pending institutional review, and curator/researcher validation has not occurred. Private sharing with named curators is permitted only when the complete attribution and source records remain in the package.

The three visible spatial layers remain deliberately separate:

- evidence-entity geometry: `SYN`;
- literature-supported pathways: `SCH`;
- BrainGlobe reference derivative: `INF`;
- five NeuroMorpho morphologies: `OBS` in local source frames, all unregistered;
- registered objects: none.

## Requirement status

| Requirement | Current authoritative evidence | Status |
|---|---|---|
| Seven stable entities | Exact IDs frozen in `data/research-mvp-release-0.2.json` | Pass |
| Five populations + two overlays | Validator and tests enforce 5+2 | Pass |
| Entity → claim → condition → source | Eight claims, thirteen separated conditions, seven source records | Pass |
| Stable negative/boundary evidence | Thirty-one source-linked statement IDs | Pass |
| Explicit missingness | Controlled `{value:null,missingReason}` values and recursive validation | Pass |
| Structured evidence UI | Claim streams, separated conditions, source links, causal guards | Pass |
| Model-comparison UI | Two to four conditions; stratification warning; no aggregation | Pass |
| Gaps UI | Condition, spatial, morphology, rights, and curation gaps shown | Pass |
| BrainGlobe reference | Local `allen_cord_20um:3.0` sampled planes/contours, manifests and checksums | Pass as `INF` reference only |
| NeuroMorpho SWCs | Five checksum-verified and topology-QC-passed release 8.6.124 files | Pass as local-frame `OBS` examples only |
| Real atlas registration | `registrations=[]`; no morphology or entity claims `REG` | Missing — next scientific gate |
| Reproducible state | URL state, version-locked JSON import, persistent-state restoration, and JSON/CSV/PNG export implemented | Implemented; live-browser round-trip task pending |
| Release manifest | `release-manifest-0.2.json`; check mode verifies eight SHA-256 inputs and zero registrations | Pass |
| Dual-curator approval | No approval records | External human gate |
| Public deployment or broader redistribution approval | Private attributed curator sharing permitted; public release remains pending | Institutional human/rights gate |
| Five-researcher/90% status study | No completed task-study record | External human gate |

## Evidence and model separation

- P05 has distinct staggered T7/T10 and complete-T8 conditions.
- P08 has distinct neonatal and adult conditions. Neonatal evidence does not inherit the adult model-geometry label.
- P09 has four mouse causal conditions and a separate human EES/rehabilitation condition with `humanCausalEvidence=false`.
- P14 remains a spasm endpoint and cannot enter beneficial-locomotion counts.
- P16 remains a breathing endpoint and cannot enter locomotion counts.
- P02/P03/P05/P08/P09/P14/P16 negative, null, limitation, counterfinding, and boundary statements retain stable IDs.

The evidence UI exposes these condition rows and source links. This is statement-level preservation, not a claim that every quantitative table from each paper has been transcribed.

## Atlas reference now present

`public/data/allen_cord_20um_v3_0/` contains the local research reference:

- BrainGlobe atlas version `3.0`, API reference `3.0.1`;
- adult *Mus musculus*;
- native shape `[1567, 253, 322]` in z-y-x order;
- native resolution `[20, 10, 10] µm` in z-y-x order;
- orientation `asr` and coordinate-space components pinned to 2021;
- 15 nonblank sampled transverse PNG planes, derived contours, terminology, source manifest, and per-file SHA-256 values;
- geometry status `INF`, because the published reference uses representative sections/interpolation and this local derivative further samples planes and contours;
- display transform restricted to visualization, with measurement use forbidden and no claimed cell-registration error.

The atlas is real reference data, but it does not locate the seven evidence entities or the five SWCs.

## Morphologies now present

`public/data/neuromorpho_release_8_6_124/` contains five adult mouse spinal-interneuron SWCs from NeuroMorpho release `8.6.124`:

- NeuroMorpho IDs `104003`, `108974`, `109005`, `242822`, and `260150`;
- source-paper and API provenance, local path, SHA-256, byte count, node count, bounds, units, and physical-integrity metadata;
- validated seven-column format, finite values, unique IDs, single root, existing parents, acyclic topology, positive radii, and domain/type agreement;
- geometry status `OBS` only in each NeuroMorpho CNG standardized local reconstruction frame;
- `registrationStatus=unregistered`, `atlasTransform.value=null`, and no atlas placement.

These five files are phenotype-stratified examples, not a representative sample or census. They are not canonical morphologies for the seven SCI evidence entities and cannot answer atlas-space queries.

## Registration remains the decisive gap

There is no scientifically valid transform connecting any NeuroMorpho specimen, evidence entity, or synthetic glyph to `allen_cord_20um`. A display matrix, schematic placement, or visual alignment does not count as registration.

The next promotion gate requires:

1. select a morphology/specimen with sufficient source-frame and anatomical anchoring metadata;
2. preserve its original local `OBS` geometry;
3. create a separate derived transform into the pinned atlas;
4. use independent held-out anatomical landmarks and recompute physical-space error;
5. record source/target spaces, transform and input checksums, interpolation, uncertainty, and failure cases;
6. obtain two curator approvals for landmark anatomy, identity mapping, and the same transform hash;
7. only then add a `REG` record.

The provisional project threshold remains at least 10 held-out landmarks across three segment groups, median error ≤40 µm and P95 ≤80 µm. Curators must approve or revise that protocol before it can act as a scientific release gate.

## Automatic engineering gates

Run locally, without deployment:

```bash
node scripts/validate-research-mvp.mjs
node scripts/validate-json-schema.mjs
node scripts/validate-spatial-assets.mjs
node scripts/build-release-manifest.mjs --check
npm test
```

Together these gates cover:

- strict JSON Schema 2020-12 execution with pinned Ajv and format validation;
- the 7 = 5 + 2 identity contract and relationship integrity;
- DOI/source values, missingness, red-team assertions, and all 31 safeguards;
- local atlas manifest, file declarations, dimensions, nonblank planes, contours, and checksums;
- all five SWCs, topology/QC, local `OBS` semantics, and null atlas transforms;
- generated release-manifest completeness and drift detection;
- production build, server rendering, structured evidence, comparison/gaps UI, URL state, exports, and no-REG disclosure.

## Remaining automatic work

1. Execute the live-browser `export → import → export` task and compare persistent state, excluding only declared volatile fields such as the export timestamp and current URL serialization.
2. Add transform/held-out-error validation when a scientifically suitable registration exists.
3. Add browser-hardware measurements across the agreed device matrix; SSR and unit tests do not prove all WebGL environments.

## Required external review

Automation cannot establish the following:

- Two independent spinal-neuroscience curators approve identity mappings, evidence boundaries, landmark anatomy, and any future transform.
- A qualified rights reviewer approves public deployment or broader redistribution for every bundled or derived asset. The current decision permits attributed private curator review; it is not public-deployment authorization.
- Curators confirm that a selected SWC is complete and sufficiently anchored for the intended registration and that any “representative” wording is justified.
- At least five target researchers complete US-01 through US-06 tasks, with at least 90% correctly distinguishing `OBS`, `REG`, `INF`, `SCH`, and `SYN`.

## Next implementation order

1. Keep release 0.2, its schema, source-specific validator, spatial validator, and generated manifest as one versioned engineering contract.
2. Complete the full localhost test matrix and inspect the rendered MVP; do not deploy.
3. Complete the live-browser state round-trip and researcher tasks against localhost.
4. Identify a scientifically registrable source specimen and complete the `OBS → REG` pipeline without altering the original.
5. Seek curator, rights, and researcher validation before any **research-validated MVP** label or deployment decision.
