# Iteration 2.43 — native cell detail and source-resolved GLUT labels

Date: 2026-09-22 UTC. Version: `2.43.0-research.1`. Status: paused partial checkpoint; not a completed iteration.

## Starting evidence and prior turn

The previous goal turn made verified progress: 2.42 introduced exact neurite inspection and information routes, recovered real Cano-Gomez inputs, and passed its declared tests. The current 2.42 deterministic manifest was rebuilt and verified before edits. Its 264-input manifest remains an immutable parent. The full App goal remains incomplete; same-cell spinal internal segmentation and broader research coverage require further work.

## In-place implementation

- UPG-207/208: independently audit and expose native SP/Tac1 and GRPR soma tracing detail from the existing exact DAT candidates, retaining their source frame and raw closure flags.
- UPG-211: build exact per-nucleus GLUT active.ident source-slot assignments and a searchable source-label information panel. This does not enlarge the confirmed CHOL_IN set or assert that all GLUT labels are interneurons.
- UPG-212: bring selected type records and source-specific research controls closer to the top of the information page while keeping complete source denominators available on demand.
- The research watch records UPG-213–215 as future source candidates. No additional viewer or admission work was performed for those rows in this checkpoint.

## Validation and source findings

The production build passed. Focused identity, active-record, selection-delta, and 2.43 source-extension tests passed 26/26. The 2.43 deterministic manifest was refreshed against the current source registry and source-extension receipts. The full `npm test` suite and a browser review were not rerun for this checkpoint; it is therefore paused and not declared complete. Source denominators currently resolve to 27 sources, 36 record sets, 11 exact cell/profile rosters, and 2 exact source-object sets. UPG-200–204 remain completed; UPG-207, UPG-208, UPG-211, and UPG-212 remain in progress.

## File-specific rollback

Only touched existing file preimages are captured in `/private/tmp/ohri-243-preimages`. A reverse text patch and per-file hashes will be saved after final edits. New source derivatives reference existing source assets where possible. No full-project copy is created, and no unrelated work is reset or deleted.
