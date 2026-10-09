# Research timeline — iteration 2.78 (2026-09-23)

## Scope and outcome

Continued in the existing 2.77 project tree. The main increment closes the UI-to-knowledge-record gap in the internal-detail view: the detail matrix and its summary now consume the one checksum-verified active record collection already shared by search, evidence and model-authority panels. It does not issue a second index request. During a pending, mismatched or failed selection, the previous record's matrix and geometry receipt are hidden.

## Active-record detail and 3D readout

- Added an 11-slot, exact-record detail matrix for source-local morphology, radius-derived display, soma trace, cell boundary, nucleus, organelles, synaptic structures, receptor distribution, coordinates/frame, reconstruction completeness, and atlas/same-cell relationships.
- Each row retains a distinct evidence state and locator. A source-reported nucleus ID does not become geometry; SWC centerlines or radius-derived tubes are not membrane; “unavailable” does not mean biologically absent.
- Denominators are generated from the verified core Research Explorer index and displayed separately from verified source-route supplements. The current source boundary is 641 core records, 149 core morphology records, plus the separately audited 30-record Todd route pack; these are distinct record units, not a unified interneuron census.
- The internal 3D stage receipt now reads exact-record morphology, internal-object, fallback, same-cell-join and registration counts from the shared verified record. While verification is pending, it presents no previous record's counts.
- No proxy spheres or representative cell shapes were added. No new geometry, internal objects, identity joins, registration, census contribution, or measurements were admitted.

## Queue research and next work

- UPG-251 is partially completed for the 641-record Explorer collection; UPG-252 plans matching detail receipts for independent source-object registries while preserving species, modality, identity and rights boundaries.
- UPG-253 plans publication-to-object discovery beyond DOI-only overlap, using PMIDs, titles, authors, repository records and supplement names. A paper-level candidate is not an object match; exact object/specimen/figure crosswalk and reuse rights remain required.
- Current queue: 235 research/model rows through UPG-253, 69 marked completed. UPG-240, UPG-244, UPG-247 and UPG-249 remain open; UPG-250, UPG-252 and UPG-253 remain planned.

## Verification and rollback

- `npm run test:research` passed: production build, ESLint, source/denominator and research validators, and 957 current tests (942 passed, 15 optional source/runtime checks skipped; 0 failed).
- Browser QA switched from exact morphology record NMO 109005 to Sathyamurthy DE-1. The active detail matrix changed to DE-1, the morphology-object count changed from 1 to 0, and internal objects, fallback primitives, cross-source joins and registrations remained 0. The prior record receipt did not remain visible.
- The sealed 2.78 manifest validates 32 hashed inputs, 641 core Explorer records, 149 core morphology records, 30 separate Todd route-pack records, 11 detail slots, and zero new geometry, same-cell joins or registrations.
- Rollback is limited to the 2.78 edits in the active-record detail helper/panel, stage readout, related CSS/tests, queue/registry, version metadata and 2.78 manifest artifacts. Restore those paths to the 2.77 captured versions where available; retain all other worktree changes. The 2.77 manifest keeps its release-time file hashes, while its historical verifier checks the immutable manifest and receipt structure rather than requiring a later mutable checkout to match every old source file. A manifest hash is not a substitute for archived source bytes.
- No complete project copy was created. No commit or GitHub push was performed; evidence and source-object work remains open.

## Research references

- [NeuroMorpho API reference](https://neuromorpho.org/apiReference.html)
- [NeuroMorpho Terms of Use](https://neuromorpho.org/useterm.jsp)
- `data/neuromorpho-type-source-doi-overlap-audit-0.1.json`
- `data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json`
