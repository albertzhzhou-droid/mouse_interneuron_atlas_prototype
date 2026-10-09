# Research timeline — iteration 2.73 (2026-09-23)

## Scope

Continued in place from immutable iteration 2.72. Completed the exact current NeuroMorpho 8.6.126 Todd query and admitted thirty source-local standardized reconstructions as supplementary selectable geometry. The frozen 8.6.124 mouse spinal-interneuron census remains unchanged.

## Source and roster evidence

- The official filtered API snapshot contains 339 unique Todd mouse spinal-cord interneuron records. Compared against the pinned 8.6.124 Todd subset: 309 shared stable IDs, 30 additions (NMO 322379–322408), zero removals, and zero changes in the compared shared-record metadata fields.
- All 30 direct standardized SWCs were checksum-verified and parsed as connected trees: 24,209 nodes and 24,179 segments, with positive z extent in every record.
- The repository marks ten candidates as `Diameter, 3D`; those records may show a clearly labelled radius-derived open surface. Twenty candidates have `No Diameter, 3D` and remain centerline-only. This is a display-authority boundary, not evidence that the repository radii are physical membrane measurements.
- NeuroMorpho reuse terms permit CC BY 4.0 use with attribution. Cite NeuroMorpho.Org RRID:SCR_002145 and its repository paper, plus the original reconstruction article once a per-record crosswalk is established.

## Evidence and geometry boundaries

- The thirty reconstructions are supplementary routes only. They contribute zero records to the frozen 1,097-object query, and create no cross-source identity, atlas registration, or measurement.
- The per-record DOI fields are blank and PMID is the non-resolving value `2017`. A 2026 neurotensin-interneuron article is retained as candidate cohort context only; it is not assigned to any individual NMO record. Animal, figure and lamina assignments remain unresolved.
- Original Neurolucida morphology files and standardization logs were not available. Although the repository reports dendrites complete, independent biological completeness has not been established.
- No nucleus, membrane, synapse, bouton, receptor distribution, organelle or other internal primitive is inferred or rendered.

## UI, registry, and rollback

- The active 3D representation contract advances to 0.7, preserving the 17 parent routes and adding 30 exact per-record source and geometry receipts. Its validator rechecks SWC and geometry hashes and enforces the ten-versus-twenty radius policy.
- The shared active-record loader now admits the 30 Todd supplements from one separately checksum-verified source-route pack. The verified search collection reaches 671 source records at runtime (641 base index records + 30 additions), including 179 morphology records (142 frozen census + 37 supplementary exact objects); the underlying frozen 2.72 census and the base 641-record index artifact are unchanged.
- Search results, the active evidence card, selection-delta receipt, and 3D authority gate consume the same resolved record object. The route pack is fail-closed on checksum or identity mismatch, and the new rows retain unresolved article mapping, zero census contribution, source-local coordinates, and zero internal primitives.
- The live research source registry is 29 sources, 38 record sets, 12 exact cell/profile rosters, and 3 exact source-object sets. The research/model upgrade registry contains 229 rows through UPG-247; UPG-245 is completed for this bounded admission and UPG-247 remains planned for the unresolved per-record article crosswalk.
- The 2.73 manifest seals the exact 2.72 snapshot as immutable parent and includes the current route assets, validators, tests, package version, and this unique timeline. No full-project copy was created.
- Roll back this iteration using the exact parent receipt in `data/research-iteration-manifest-2.73.json`; preserve the parent snapshot.

## Primary public references

- [NeuroMorpho.Org release page](https://neuromorpho.org/)
- [NeuroMorpho.Org API reference](https://neuromorpho.org/apiReference.html)
- [NeuroMorpho.Org Terms of Use](https://neuromorpho.org/useterm.jsp)
- [Candidate neurotensin-interneuron article](https://doi.org/10.1177/17448069261468203)
