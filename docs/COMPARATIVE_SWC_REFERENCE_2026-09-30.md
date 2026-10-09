# Exact comparative SWC references — 2026-09-30

UPG-127 and UPG-145 now have two independent source-local display routes. These are one zebrafish axon reconstruction and one rat soma/neurite reconstruction, with separate object identities, scientific scopes and auto-fit views. They add zero records to the mouse census, zero same-cell joins and zero atlas registrations.

## Source verification and timeline

The 2026-08-31 queue receipts were treated as leads, with no exact local payload initially present. On 2026-09-30 the official API and direct SWC endpoints were fetched using an identified client. Both SWCs match the previously recorded byte lengths and SHA-256 hashes. The original historical receipts were left unchanged. The current repository terms and format/standardization documentation were read separately; API/SWC URLs do not embed a server release, so the local namespace uses `exact-source-snapshot-2026-09-30`. The repository page's observed 8.6.127 release is recorded separately.

| Source object | Exact SWC bytes | SHA-256 | Independent parsing |
| --- | ---: | --- | --- |
| NMO_183779 · `20190706_8_1` · Cohen_A | 145,055 | `40c6fc025a7224390b5d74064301250281ca1bc8deac63cbcd5fdabb134413c7` | 3,849 type-2 nodes, 3,848 edges, one connected acyclic root, zero zero-length edges |
| NMO_34024 · `L420-LCN` · Szucs | 731,956 | `7b71de215c860af28ed78381eaaaad2c03d24d19038ee5e1e8c7962cdf901357` | 17,973 nodes, 17,972 edges; 12 type-1 / 14,988 type-2 / 2,973 type-3; one connected acyclic root, zero zero-length edges |

The rat API and source DAT also match the historical receipts. The current rat morphometry response is 468 bytes with SHA-256 `a1ea035737fb8bc47afef7292e00216fa9bea068d09bc3346dae0637eb893d38`, different from the historical `2ae700c70fa9c4bf49dd1dffd2143ef86147e9a5fbfa7e1ba803c06d615ea9c4`. Historical morphometry bytes were unavailable; the contract retains this as receipt drift and admits only the exact current snapshot. No explanation for the drift is invented. Repository principal-component dimensions remain separate from the parsed axis-aligned extents.

The 2026-09-30 UI increment loads all three selected object's public assets—API, SWC and current morphometry—and verifies every byte length/SHA-256 before returning geometry. Identity, species, domain, frame, units, metadata, topology and preserved rat conflict gates are also checked. Any failure withholds the complete selected geometry. Each route renders source centerline edges only, supports separate current-view receipt JSON and raw-node CSV, and uses cancellation plus active-request isolation.

## Scientific boundaries that remain

NMO_183779 retains the exact 5-day larval zebrafish, glutamatergic V3 tonic-spiking labels. The source explicitly reports `No Dendrites, No Soma, Axon` and `No Diameter`. Its constant raw radius of 0.125 is preserved but cannot authorize physical calibre, a tube, a membrane, area or volume. Its axon root is not a soma. Source-reported axon completeness does not establish an intact whole cell, an exact electrophysiological recording, V2/Vsx2 identity or mouse identity.

NMO_34024 retains rat/Wistar, P14–P24, raw cohort sex `Male/Female`, lumbar lamina I, biocytin and reported-but-uncorrected shrinkage. `L420-LCN` and primary-paper `L420_E2` have no exact deposited crosswalk. The paper's Fig. 6 termination near the surface after pia removal and its methods' deleted unconnectable processes below 5% remain paper-level cautions. They prevent treating the repository completeness label as biological intactness; they do not create a same-cell join. The SWC header says 23 contours averaged into 23 soma points, but the exact parsed file has 12 type-1 samples. Both assertions remain visible. No native DAT semantics, membrane, internals, inhibitory transmitter identity, individual physiology, boutons, synapses or connectivity are admitted.

NeuroMorpho reuse is [CC BY 4.0 under the official terms](https://neuromorpho.org/useterm.jsp), with the original paper, complete NeuroMorpho.Org name/RRID and current required repository-method citation. The two original papers are [Böhm et al.](https://doi.org/10.1016/j.neuron.2022.01.001) and [Szűcs et al.](https://doi.org/10.1002/cne.23311). Standardized SWC representation and soma conversion follow the [repository format FAQ](https://neuromorpho.org/myfaq.jsp), [standardization rules](https://neuromorpho.org/StdSwc1.21.jsp) and [soma-format notes](https://neuromorpho.org/SomaFormat.html). The API objects do not contain embedded coordinate-unit declarations; units follow the repository's micrometre SWC convention. Source DAT and primary-paper XML receipts are retained only as local audit inputs and are not public display assets.

## Native-contour source context

The existing seven admitted native-contour records now receive a 27,134-byte context document built from their five small exact route packs and seven hash-verified stored API snapshots. It retains species, source region, raw age values/scale, life stage, condition, sex and field locators. NMO_108978 has unknown numeric age; adult remains a source label. No full census or universe index is imported, and no identity is inferred from display titles.

## Artifacts and validation

- Contract: `data/comparative-swc-reference-0.1.json`.
- Exact public API/SWC/morphometry bytes and manifest: `public/data/comparative_swc_reference_v1/`.
- Exact audit inputs: `data/source-candidates/neuromorpho-comparative-2026-09-30/`.
- Independent UI: `app/ComparativeSwcReferenceWorkbench.tsx`, default export, no Provider dependency.
- Reproducible builders: `tools/build_comparative_swc_reference.mjs --check` and `tools/build_native_contour_source_context.mjs --check`.
- Native metadata: `data/native-contour-source-context-0.1.json`.

The two SWC source tests, independent-object core tests and molecular-concordance tests pass 27/27. Checks cover real source bytes, exact domains, damaged payloads, metadata/QC drift, unknown IDs, file/rights/frame gates, removed rat conflict gates, cross-object exports, native-context API locators, nucleus-parent evidence and obsolete A→B→A requests. ESLint and TypeScript pass for the current workspace. Rendered-browser integration is a separate root-task check.
