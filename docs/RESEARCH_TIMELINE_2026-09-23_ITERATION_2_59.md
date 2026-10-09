# Research timeline — iteration 2.59 (2026-09-23)

## Objective and rollback

Continue the public-data, evidence-bounded atlas in the existing project tree. The immutable rollback parent is `data/research-iteration-manifest-2.58.json` (374,795 bytes; SHA-256 `6be72adb0b4223666d95eb5e1191e7be38124d0e781a13bf415088b63fd228be`; content SHA-256 `35b97b96e3ac70f5688c7618f82e65a14cadec6b20dc1bae91585d6f3d41bc07`). Iteration 2.58 is sealed at 214 research/model upgrades; the live queue advances to 215 with UPG-233.

## Research increment

- Added a runtime-derived exact `officialMetadata.strain` facet to the existing verified 1,097-record NeuroMorpho source-object browser. Raw labels and per-label record counts are read from the existing pinned index; missing source fields remain distinct from literal labels such as `Not reported`.
- Selecting a different exact record replaces the active observed SWC only after the existing object-specific checksum/byte verification. The UI list exposes each record's raw strain label, source ID, source dimensions and membership; the selected-record dossier continues to disclose neurite domain, integrity, source radii, missingness and unregistered source-local frame.
- Recomputed the exact Abraira/Ginty subset from the retained 8.6.124 universe index: 650 distinct NeuroMorpho IDs with 650 distinct *indexed* raw-SWC SHA-256 values; 12 raw strain strings; source-class labels 208 excitatory and 442 inhibitory; 640 repository-labelled 3D and 10 repository-labelled planar records; 650 diameter-authorized and zero records with an axon in the reconstructed domain. This is metadata/index-level reconciliation only: the SWC bytes were not rehashed in this audit.
- The primary article describes separate morphology-analysis scopes of 305 neurons and 351 subtype-focused reconstructions. The exact NeuroMorpho record-to-figure crosswalk and animal-level identifiers remain unavailable; 650 repository entries must not replace either paper denominator or be interpreted as independent animals, prevalence, or 12/11 canonical types. UPG-139 remains open for source-object and paper-membership reconciliation.
- NMO 75265 is an example exact repository object for the Rorbeta-CreER source label: mouse, young, lumbar dorsal horn/LTMR-RZ, source-labelled inhibitory; soma and dendrites, no reconstructed axon, source-labelled 3D with diameter, moderate dendritic integrity. It remains its own source-local record—not a model for the selected Vsx2/Hoxa10 molecular profile or any unlinked cluster.
- No SWC or project-folder copies were added. No mean/archetype cell, canonical subtype, molecular-profile join, same-cell join, added axon, contour surface, internal primitive or atlas registration was admitted. The synthetic cluster glyph remains explicitly a non-cell evidence glyph; this iteration adds a path to inspect exact observed source morphologies rather than implying that a source exemplar belongs to the selected molecular cluster.

## Verification

- The Ginty roster audit rebuilds from the contract-hashed 8.6.124 index; schema and mutation tests preserve raw labels, the 305/351 distinction, and zero joins/derived cell forms.
- Facet tests cover exact string matching, duplicate raw values, missingness, and record-level option counts. The 2.58 byte/content snapshot validator and mutation test pass.
- The 2.59 manifest pins every changed file receipt and the 2.58 rollback parent; the full-app research gate is run after integrating this increment.
- The live project tree is modified in place. No complete project copy is created, and this iteration does not commit or push.

## Sources consulted

- [NeuroMorpho.Org API reference](https://neuromorpho.org/apiReference.html) documents record and morphology access.
- [NMO 75265 detailed record](https://neuromorpho.org/neuron_info.jsp?neuron_name=RorBCreER-261-04-B_1) provides the exact per-record labels, geometry domain and integrity.
- [Abraira et al. 2017 full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC5236062/) reports 7 excitatory/4 inhibitory LTMR-RZ subtypes and distinct 305- and 351-neuron morphology-analysis scopes.
- [NeuroMorpho terms of use](https://neuromorpho.org/useterm.jsp) are retained as the attribution/reuse reference; this iteration redistributes no new source geometry.
