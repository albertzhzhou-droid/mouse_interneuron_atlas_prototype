# Research Iteration 2.25 — Independent Dorsal-Horn Morphology Route Pack

> **Status:** unpackaged localhost research iteration `2.25.0-research.1`. This iteration admits four independently named, source-local NeuroMorpho route memberships without creating an average interneuron, changing the frozen five-exemplar lens, or expanding the 142-record adult-query census.

## Outcome

Iteration 2.25 adds a checksum-pinned route-pack contract for four exact NeuroMorpho.Org release `8.6.124` reconstructions. Two routes reuse records already present in the frozen five-exemplar lens and the 142-record census; two routes are supplementary source objects outside that census.

| Denominator | Exact value | Interpretation |
|---|---:|---|
| Route-pack memberships | 4 | Four independent source records; never an averaged or representative cell |
| Frozen/census overlaps | 2 | `NMO_104003` and `NMO_108974`; existing runtime identities and assets are reused |
| Supplementary records | 2 | `NMO_170035` and `NMO_249676`; the only newly appended runtime records |
| Active unique main-scene morphologies | 8 | Five frozen exemplars + prior independent `NMO_109021` + two supplementary records |
| Named dorsal-horn routes | 5 | Prior `NMO_109021` route + the four route-pack routes |
| Frozen adult-query census | 142 | Unchanged; census expansion count is zero |
| Representation states / routes | 9 / 11 | Current evidence contract `0.2`; four cell-specific routes were added to the historical seven-route base |
| Same-specimen internal structures / rendered internal primitives | 0 / 0 | Missing object-level evidence renders no substitute geometry |
| Cross-source identities / project registrations | 0 / 0 | Co-display and route selection create neither identity nor atlas placement |

The pack is a mixed-life-stage mouse source package, not an “adult-mouse pack”: `NMO_104003` and `NMO_108974` are deposited as adult, `NMO_170035` as young adult, and `NMO_249676` as young.

## Exact route memberships

All four geometries remain in the `NeuroMorpho_CNG_standardized_local_frame`, are unregistered, and come from 60 µm sections. Region and lamina terms below are deposited source labels, not project atlas coordinates.

| NMO / route | Membership | Cautious source-bounded label | Geometry and integrity receipt |
|---|---|---|---|
| `NMO_249676` / `mouse.sc.grpr_lamina_i_ii.observed.nmo_249676` | Supplementary; `NeuroMorpho:249676` | Young GRPRCreERT2-captured excitatory lamina I–II interneuron; receptor-class metadata, not a direct receptor-abundance assay | 1,178 nodes / 1,177 segments; 12 soma points; 63 type-2 axon nodes; sagittal; `Dendrites Moderate, Axon Incomplete`; `No Diameter`; DOI `10.1097/j.pain.0000000000002677` |
| `NMO_108974` / `mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108974` | Frozen/census overlap; `NeuroMorpho:108974` | Adult Tac1Cre/Brainbow, source-labelled SP-class excitatory dorsal-horn interneuron | 1,801 nodes / 1,800 segments; 9 soma points; no reconstructed type-2 axon; parasagittal; `Dendrites Complete`; source `Diameter`; DOI `10.1097/j.pain.0000000000001406` |
| `NMO_170035` / `mouse.sc.pv_pax2_lamina_ii_iii.observed.nmo_170035` | Supplementary; `NeuroMorpho:170035` | Young-adult PVCre, PV-positive/Pax2-positive inhibitory lamina II–III interneuron | 2,167 nodes / 2,166 segments; 18 soma points; no reconstructed type-2 axon; sagittal; `Dendrites Moderate`; `No Diameter`; DOI `10.1097/j.pain.0000000000002422` |
| `NMO_104003` / `mouse.sc.pdyn_dorsal_horn.observed.nmo_104003` | Frozen/census overlap; `NeuroMorpho:104003` | Adult PdynCre/AAV-eGFP reporter-captured, Sst2a-receptor-positive inhibitory dorsal-horn interneuron | 109 nodes / 108 segments; 3 soma points; no reconstructed type-2 axon; parasagittal; `Dendrites Moderate`; source `Diameter`; DOI `10.1038/s41593-018-0119-z` |

Marker wording remains source-bounded:

- `GRPR` denotes the gastrin-releasing peptide receptor, not the GRP ligand represented by the separate `NMO_109021` route. Cre capture does not prove functional receptor abundance in the reconstructed cell.
- The Tac1/SP wording does not claim a new direct peptide or single-cell transcript assay beyond the retained source metadata.
- The PV route is specifically the deposited Pax2-positive inhibitory record; it does not establish that every PV neuron is inhibitory.
- Filename tokens associated with SST or VGLUT2 in `NMO_104003` do not establish SST/VGLUT2 expression by this reconstructed cell. The SWC contains no bouton, contact, or synapse objects.

## Runtime merge and census boundary

The merge key is `neuronId`. `NMO_104003` and `NMO_108974` retain the exact frozen observed-form and fidelity records and continue to reference their canonical census geometry and SWC assets. They are route-pack memberships, not newly appended selector entries, exports, census children, or biological observations.

Only `NMO_170035` and `NMO_249676` add runtime records and supplementary assets. Therefore:

```text
5 frozen unique records
+ 1 pre-existing independent NMO_109021 record
+ 2 supplementary route-pack records
= 8 active unique morphologies
```

The four route-pack route IDs plus the prior `NMO_109021` route produce five named dorsal-horn routes. This named-route denominator must not be added to either the five frozen exemplars or the 142-record census because two route-pack members already overlap the frozen/census set.

## Rendering and fail-closed missingness

The current `evidence-aware-3d-representation-contract-0.2` retains nine representation states:

`OBS_RAW_TEXTURE`, `OBS_SEGMENTED_SURFACE`, `OBS_SKELETON`, `OBS_POINT`, `DER_RADIUS_SURFACE`, `INF_REFERENCE_GEOMETRY`, `SCH_PATH`, `SYN_DATA_GLYPH`, and `UNAVAILABLE`.

It binds eleven routes. Four cell-specific route-pack entries were added because the runtime route ID is also the representation-authority lookup key. The historical `0.1` contract remains the seven-route base; it is not the active 2.25 representation contract.

Diameter and axon handling fail closed:

- `NMO_249676` and `NMO_170035` report `No Diameter`. Numeric radius placeholders in their standardized SWCs do not authorize caliber, measurement, or a radius-derived surface. A surface request must resolve to `UNAVAILABLE`, with zero substitute surface primitives.
- `NMO_108974` and `NMO_104003` report source diameter. Their optional deterministic radius-derived surfaces remain display derivatives, never observed membranes or measurement surfaces.
- `NMO_249676` contains 63 observed type-2 nodes but explicitly reports an incomplete axon. It cannot establish a complete projection.
- `NMO_108974`, `NMO_170035`, and `NMO_104003` report no reconstructed axon. This is missing reconstruction coverage, not evidence that the biological neurons lacked axons.
- No route makes a complete-axon claim. A 60 µm section and dendrite-integrity label cannot establish a complete whole-cell arbor.
- The 12, 9, 18, and 3 standardized soma points respectively summarize averaged source contours. They are not native contour vertices, membranes, nuclei, or volumetric soma segmentations.

For every route, same-specimen membrane segmentation, nucleus, organelles, synapses, receptor distribution, and ultrastructure remain unavailable. The rendered internal-primitive count is zero; procedural spheres, tubes, organelle proxies, or cross-specimen interiors are prohibited.

## Identity, join, and registration boundary

Route admission creates none of the following:

- an identity with `mouse.sc.vsx2_hoxa10` or another SCI evidence entity;
- a same-cell or same-type join to a Russ, Sathyamurthy, Hayashi, Häring, Alkaslasi, or Matson molecular population;
- an identity between GRPR `NMO_249676` and GRP `NMO_109021`;
- a relationship between independent NeuroMorpho reconstructions;
- a cross-source coordinate transform, laminar placement beyond deposited metadata, or atlas registration;
- a prevalence, representative morphology, complete-axon, connectivity, bouton, synapse, membrane, or internal-organelle claim.

Selection, co-display, camera changes, uniform display scaling, and shared source labels do not relax these boundaries. Exact cross-source identity, project registration, and admitted cross-source join counts remain zero.

## Assets, rights, and attribution

The supplementary asset manifest contains six files for only `NMO_170035` and `NMO_249676`: two official API snapshots, two standardized SWCs, and two deterministic source-local geometry payloads. `NMO_104003` and `NMO_108974` reuse their frozen census assets rather than creating duplicate authority paths.

The bundled NeuroMorpho assets are recorded as **CC BY 4.0 subject to NeuroMorpho.Org Terms of Use and original-paper attribution**. Redistribution must retain:

- NeuroMorpho.Org release `8.6.124`, RRID `SCR_002145`, and the [NeuroMorpho use-terms record](https://neuromorpho.org/useterm.jsp);
- Tecuatl, Ljungquist and Ascoli 2024, DOI `10.1096/fba.2024-00048`;
- all four original-paper DOIs: `10.1097/j.pain.0000000000002677`, `10.1097/j.pain.0000000000001406`, `10.1097/j.pain.0000000000002422`, and `10.1038/s41593-018-0119-z`;
- the exact API, SWC, and geometry receipts declared by the route-pack contract and asset manifest.

That asset permission does **not** transfer to article text, figures, microscopy images or panels, or source-paper supplementary materials. No such article content is bundled or adapted in this iteration; this explicitly includes content from the `NMO_104003` Nature Neuroscience article. Article figures and images remain link-and-cite-only unless their own object-specific licence or permission is separately recorded.

## Source-backed next work: UPG-130–136

These queue entries remain separate from the completed route pack and retain their own admission gates:

| Upgrade | Current status | Source-backed next route or gate |
|---|---|---|
| `UPG-130` | Planned; exact public SWC and DAT receipts verified | Evaluate `NMO_45674` as one young, GlyT2-EGFP, calbindin-positive Renshaw exterior-morphology route. Its moderate dendrite/axon integrity cannot become a complete Renshaw archetype or same-cell electrophysiology claim. |
| `UPG-131` | Planned; exact public SWC and DAT receipts verified | Evaluate `NMO_50424` as one young-adult NPY-positive dorsal-horn exterior-morphology route. It is not an NPY archetype and admits no internal geometry. |
| `UPG-132` | Planned; redistribution rights-gated | Evaluate `GSE158380` as a six-study molecular/spatial information adapter over 19,353 neurons. Source matrices remain unbundled; no cluster-to-NeuroMorpho identity is authorized. |
| `UPG-133` | Planned; redistribution rights-gated | Evaluate adult-lumbar Activity-SEQ `GSE103892` with its 17,354 total nuclei, 4,280 neuronal nuclei, and 43 neuronal clusters. Activity association is not a trajectory, causal function, morphology, coordinate, or internal geometry. |
| `UPG-134` | Blocked; export and rights compatibility pending | Evaluate MicroStructFormer dataset version 16 only as a 2D TEM renderer/segmentation-QA lane. Unrelated cross-sections must not be stacked, extruded, or attached to a neuron route. |
| `UPG-135` | Research watch; developmental scope, storage, and rights gated | Audit embryonic E16.5 Xenium `GSE291460` only as developmental information context. Its 2D embryonic/knockout coordinates cannot populate the adult scaffold or become z geometry. |
| `UPG-136` | Raw-data blocked | Keep true same-cell internals fail closed. The current official EMPIAR catalog query returned zero exact `spinal cord` matches, which is not proof of absence. Admission still requires an identified mouse spinal interneuron with traceable raw 3D pixels, same-object segmentations, calibrated coordinates, checksums, rights, overlay QA, and topology QC. |

The exact queue language, receipts, source links, and acceptance boundaries remain authoritative in `docs/RESEARCH_MODEL_UPGRADE_QUEUE.md`.

## Exact local contracts

- `data/dorsal-horn-observed-morphology-route-pack-0.1.json` — 42,226 bytes; SHA-256 `923db6a9ed013e856ffc7c6ab601c67b25608ac68572538c578fd75fa41fe593`.
- `public/data/dorsal_horn_observed_morphology_route_pack_v1/asset-manifest.json` — 1,696 bytes; SHA-256 `4f64fb595a4362cf0403cb0d3abc3c6fdc14b7f74d473a82ccd67bed9b9dab87`.
- `data/evidence-aware-3d-representation-contract-0.2.json` — 15,818 bytes; SHA-256 `86568689f340d8f506590e16e28f3ffed25bc7e040b09f422126a53abcd87346`.
- `data/research-iteration-manifest-2.25.json` — 22 authoritative inputs; manifest content SHA-256 `f7bc56dfe6671b67f0fa8a5115faadf615e98e056d207894c75441fb3a5dc6e1`.

## Verification boundary

Every denominator, identity, life stage, morphology receipt, route count, missingness rule, rights statement, and UPG status in this document was checked against the current local JSON contracts, asset manifest, rights ledger, and research queue. No web lookup was used.

**Browser visual QA was not performed.** No interactive browser inspection, screenshot comparison, responsive-layout review, or cross-browser rendering claim is included in this iteration note.
