# Curator release notes — Research MVP engineering candidate 0.2

Release date: 2026-08-17  
Release ID: `ohri-mouse-interneuron-research-mvp-candidate-0.2.0`  
Release status: `localhost_candidate`  
Schema version: `0.2.0`  
Manifest content SHA-256: `503de9449ad3b2c7efb1a810def5f3b05e61a62633e69b6e11974ac0c4f45295`

## Release purpose

Version 0.2 is a **localhost Research MVP engineering candidate** for curator and target-researcher evaluation. It turns the earlier interaction feasibility prototype into a versioned, evidence-traceable local research workflow. It is not a research-validated atlas and is not approved for deployment.

The candidate is designed to help reviewers inspect bounded SCI-interneuron evidence, compare non-equivalent experimental conditions without pooling them, and identify missing evidence. It does not claim to visualize every interneuron.

## Frozen scientific inventory

| Item | Release 0.2 inventory | Boundary |
|---|---:|---|
| Stable evidence entities | 7 | Exactly 5 populations + 2 injury-state overlays; not a census. |
| Claims | 8 | Source-bounded; no claim may exceed its condition or endpoint. |
| Experimental conditions | 13 | Adult/neonatal, mouse/human, lesion types, phases, and endpoints remain separate. |
| Primary source records | 7 | P02, P03, P05, P08, P09, P14, and P16. |
| Stable negative/boundary statements | 31 | Null, negative, counterdirectional, and translational limits must remain visible. |
| BrainGlobe reference asset | 1 | `allen_cord_20um:3.0`, adult mouse, 15 sampled local planes/contours, `INF`. |
| NeuroMorpho SWCs | 5 | Release 8.6.124 IDs 104003, 108974, 109005, 242822, and 260150; source-local `OBS`. |
| Registrations | **0** | No SWC-to-atlas transform, held-out error, or `REG` object exists. |
| Manifest inputs | 8 | SHA-256-pinned release, schema, evidence/source snapshots, assets, rights ledger, and package lock. |

## What 0.2 adds

### Structured scientific contract

- A machine-readable entity → claim → condition → source relationship.
- Explicit species, life stage, lesion, phase, intervention, endpoint, result, causal grade, negative finding, and boundary fields.
- Controlled causal grades: `ASSOC`, `NEC`, `SUF`, `DEP`, and `FEAS`.
- Explicit missingness objects rather than silent nulls, fake zeroes, or synthetic evidence.
- Stable safeguards for negative, null, counterdirectional, and nonsignificant findings.
- Required separation of P05 staggered versus complete T8, P08 neonatal versus adult, and P09 mouse versus human evidence.

### Research workflow

- Evidence cards with source and condition traceability.
- Side-by-side comparison of two to four conditions without implicit pooling.
- A gaps view that distinguishes missing evidence from biological absence.
- Versioned URL state and version-locked JSON state import.
- JSON, CSV, and disclosure-bearing PNG export.
- A local Reference Data Lab with atlas-reference and morphology views.

### Local spatial assets

- A pinned BrainGlobe `allen_cord_20um` version 3.0 reference, generated with BrainGlobe Atlas API 3.0.1.
- Frozen atlas identity: adult *Mus musculus*, shape `[1567, 253, 322]` z-y-x, resolution `[20, 10, 10]` µm z-y-x, orientation `asr`, and 2021 component versions.
- Fifteen nonblank sampled planes and derived contours stored locally with file-level hashes.
- Five checksum-verified, topology-QC-passed NeuroMorpho adult-mouse spinal-interneuron SWCs.
- A generated release manifest that records eight authoritative input hashes and the zero-registration boundary.

## Spatial semantics that must not drift

| Displayed material | Status | Permitted interpretation | Prohibited interpretation |
|---|---|---|---|
| Seven evidence-entity glyphs | `SYN` | Prototype interaction and evidence navigation. | Observed cells, atlas coordinates, measured locations, or population abundance. |
| Evidence-entity paths | `SCH` | Literature-supported schematic circuit concepts. | Reconstructed tracts, measured connectivity geometry, or path length. |
| BrainGlobe sampled planes and contours | `INF` | Pinned derived adult-mouse reference context. | Observed entity placement, registration, exhaustive volume, or measurement of evidence entities. |
| Five NeuroMorpho SWCs | `OBS` in source-local frames | Morphology illustration in `NeuroMorpho_CNG_standardized_local_frame`. | Representative sampling, seven-entity identity mapping, spinal level/lamina/laterality, or atlas location. |
| Registered objects | `REG` | None in this release. | Any inference that viewer scaling, centring, co-display, or an atlas plane establishes registration. |

There are **0 registrations**. Every SWC is unregistered. `atlasTransform` is unavailable, `atlasPlacement` is out of scope, and registration error is not estimated. The atlas and morphology tabs are independent local asset views; their visual coexistence does not create a common scientific coordinate system.

The five SWCs are phenotype-stratified examples selected from an official-query snapshot of 142 records. They are not a representative sample, census, taxonomy, coverage assessment, or frequency estimate. They are not mapped to the seven evidence entities.

## Source red-team boundaries retained

- **P02:** staggered hemisection is not one complete lesion; reduced brainstem labeling and the human-efficacy boundary remain required.
- **P03:** the dI3 claim is necessity (`NEC`), not sufficiency (`SUF`); subtle baseline stance/foot-placement findings remain required.
- **P05:** staggered T7/T10 and complete T8 are distinct; early and bumetanide nulls, complete-T8 failure, no axon growth, unchanged evoked latency, residual coactivation, and the no-global-disinhibition boundary remain required.
- **P08:** neonatal and adult conditions are distinct; variable partial adult recovery, training-alone null, unblinded testing, and the no-global-inhibition boundary remain required.
- **P09:** mouse causal experiments and the uncontrolled human cohort are distinct; `humanCausalEvidence=false`; the healthy-mouse null and nonrandomized-cohort limitation remain required.
- **P14:** the endpoint is spasm, not beneficial locomotion; the repeated-stimulation counterfinding and no-clinical-safety boundary remain required.
- **P16:** the endpoint is breathing, not locomotion; the healthy resting-breathing null and V2a population non-equivalence boundary remain required.

## Offline and distribution behavior

The private curator kit contains a prebuilt static site and standard-library localhost servers. Its launcher uses an installed Node.js runtime when available and can fall back to Python 3; it does not need `npm install`, a development toolchain, or network access. The primary entry point is `START_HERE.html`; package recipients should follow its included digest-verification and launcher instructions.

Within the extracted kit, the localhost viewer reads the release, atlas planes, contours, and morphologies from bundled local paths. It does not automatically contact external literature, atlas, or morphology services. External source pages open only if a reviewer deliberately selects a link. A curator can review the application with the network disconnected; asset-acquisition scripts are not invoked by the viewer.

The curator package may be shared privately with reviewers if attribution and source records are retained. This is not general public-release approval. Public deployment or public redistribution remains an institutional asset-level review gate.

Rights records rechecked for this candidate state:

- BrainGlobe AWS distribution: CC0 1.0.
- Original `SC_atlas_P56` Mendeley version 1 dataset: CC BY 4.0, attribution required.
- NeuroMorpho.Org assets: CC BY 4.0 plus repository terms, with NeuroMorpho.Org, Tecuatl et al. 2024, and each original reconstruction paper cited.
- Fiederling article figures and text are not copied or adapted in the bundle.

## Explicit non-claims

Release 0.2 is not:

- a complete spinal-interneuron census or exhaustive taxonomy;
- a connectome, tract reconstruction, or measurement-grade spatial atlas;
- evidence that the five SWCs represent spinal interneuron diversity;
- evidence that an SWC or evidence entity has an atlas location;
- a clinical model, diagnostic tool, treatment recommendation, or clinical-safety assessment;
- a human causal cell-population model;
- a deployed or publicly redistributed product.

## Source-repository engineering verification

The source repository passed the following developer-only gates on 2026-08-17. These scripts and `npm` commands are not required in the recipient static kit:

```bash
node scripts/validate-research-mvp.mjs
node scripts/validate-json-schema.mjs
node scripts/validate-spatial-assets.mjs
node scripts/build-release-manifest.mjs --check
npm test
```

These checks cover data relationships, strict JSON Schema execution, status and missingness rules, stable source/negative boundaries, spatial hashes and SWC topology, the generated release manifest, production build, structured evidence UI, comparison/gaps behavior, state restoration, exports, and the no-`REG` boundary. Package recipients instead verify the distributed ZIP against its companion `.zip.sha256` file and run the integrity verifier included with the kit as directed by `START_HERE.html`.

Handoff result: `npm run lint` passed; `npm test` passed with 37 Node tests, 0 failures; all research, schema, spatial, and manifest validators passed. The build emitted a non-blocking warning for a minified Three.js client chunk larger than 500 kB. These are source-build results, not a claim that the final curator ZIP was browser-tested after packaging.

Machine checks do not establish scientific accuracy, anatomical suitability, representativeness, public-redistribution authority, or researcher usability. The production localhost build has a recorded browser acceptance run in `docs/LOCALHOST_MVP_VALIDATION_REPORT.md`, including JSON export → state change → import → export. Independent completion of that workflow remains a curator/researcher task. This note does not claim a post-packaging browser run of the final curator ZIP; any such result must be recorded against the final package digest.

## Human gates still open

Promotion beyond **localhost Research MVP engineering candidate** requires all applicable charter gates, including:

1. Two independent spinal-neuroscience curators reviewing the same mapping hash.
2. Resolution of every curator rejection and documented adjudication of disagreements.
3. Institutional review before public deployment or public redistribution.
4. Curator confirmation of any proposed source object's morphology identity, completeness, orientation, and anatomical suitability.
5. At least one future native object completing a scientifically validated registration before any `REG` claim is made.
6. Curator approval or revision of the project's provisional registration-error protocol.
7. At least five target researchers completing US-01 through US-06.
8. At least 90% of tested researchers correctly distinguishing `OBS`, `REG`, `INF`, `SCH`, and `SYN`.

Until those gates pass, use **localhost Research MVP engineering candidate 0.2**, not **research-validated MVP**.

## Curator packet

- `docs/CURATOR_REVIEW_GUIDE.md` — setup, status definitions, six tasks, red-team questions, and feedback protocol.
- `docs/CURATOR_REVIEW_FORM.md` — independent fillable decision record.
- `docs/CURATOR_RELEASE_NOTES_0.2.md` — this release-scoped summary.
- `docs/RESEARCH_MVP_CHARTER.md` — promotion contract and automatic/human gates.
- `docs/RESEARCH_MVP_GAP_AUDIT.md` — current evidence and implementation gaps.
- `docs/SPATIAL_ASSET_PROVENANCE.md` — atlas/SWC methods, rights, and limitations.
- `docs/RIGHTS_LEDGER.csv` — asset-level rights record.
