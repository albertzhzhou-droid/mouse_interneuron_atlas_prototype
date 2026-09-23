# Research timeline — iteration 2.48

## Focus

Advance object-level internal detail by checking whether a public comparative connectome can provide a real, source-identifiable VNC interneuron model. Improve the information page so researchers can distinguish dataset-level modality availability from an admitted same-cell model.

## Evidence finding

- The BANC paper release identifies CAVE materialization v888, one adult female *Drosophila melanogaster* CNS including the entire ventral nerve cord, and publicly accessible neuron meshes, skeletons, metadata, synapse tables, and cell/nucleus/mitochondria segmentations through separate repositories.
- The official per-file metadata documentation reports 188,162 rows at one row per segment. This is not an interneuron denominator.
- The primary paper dates final-print v888 to 2026-04-17, while the per-file metadata documentation labels its table snapshot 2026-04-16. v888 remains the stable release key; both date statements are retained.
- The official data-location map lists `mitochondria_v1_human_readable.csv.gz` as a per-mitochondrion v888 CAVE table with root IDs, but a separate “BANC's detected mitochondria” product is marked `MISSING`. The paper separately reports flat segmentation data on BossDB. This is an object-packaging discrepancy, not evidence that mitochondria are biologically absent.
- No exact source-classified VNC-local interneuron root, per-object mesh/segmentation chain, byte/hash receipt, coordinate bridge, proofreading receipt, or object-level BossDB reuse decision was admitted in this iteration.

## Modifications

- Added `data/banc-v888-comparative-internal-reference-0.1.json` as a bounded availability contract with explicit release, modality, identity, reuse and missingness fields.
- Added a collapsed BANC comparison card to the existing Structure information panel, with links to the official 3D viewer, paper, data-product map, Dataverse and BossDB. The card reports the segment-row denominator, release-date discrepancy and mitochondria source-map discrepancy.
- Kept BANC outside the selected mouse-cell scene: zero imported source objects, zero cell/nucleus/mitochondria/synapse geometry, zero joins and zero registrations.
- Advanced UPG-219 to “release-level availability audited; exact cell chain pending” and added UPG-221 for exact VNC-local-interneuron selection and same-cell object-link verification.
- Sealed 2.47 as an immutable parent snapshot; the 2.48 manifest receipts only this iteration's additions and refreshed changed inputs. No duplicate project directory or full-content copy was created.

## Release boundaries

BANC remains a comparative invertebrate lane, not mouse spinal anatomy or a vertebrate homolog. The source documentation conflict and exact cell chain remain open. No BANC geometry is rendered until UPG-221 resolves stable cell identity, exact object keys, coordinate frame, proofreading, checksums and reuse terms.
