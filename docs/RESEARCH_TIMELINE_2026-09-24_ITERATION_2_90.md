# Research timeline — iteration 2.90

Date: 2026-09-24  
Application version: `2.90.0-research.1`  
Parent: iteration 2.89 (`ohri-mouse-interneuron-research-iteration-2.89.0`)  
Scope: complete UPG-192 as one checksum-pinned NMO 45718 DAT↔SWC coordinate crosswalk; stop after this increment.

## Research question and decision

Can seven native Neurolucida `Soma 1` section contours from the exact NeuroMorpho NMO 45718 record be shown together with that same record's standardized SWC centerline without assuming the two files share a coordinate frame?

The project-derived crosswalk passed a narrow, predeclared display-consistency audit. All seven source-closed `Soma 1` contours (252 vertices; DAT z = −29 to −41 µm) pair by same-record order and consecutive 2 µm z levels with SWC type-1 nodes 2–8 (standardized z = 0 to −12 µm). The fitted transform is a 2D reflection/rotation/uniform scale/translation plus a +29 µm z shift. The source does not deposit a vertex correspondence table; this relationship remains a reproducible project-derived crosswalk, not source-asserted point identity or atlas registration.

Primary fit: contour-centroid pairs 1–5 fit; pairs 6–7 held out. Maximum held-out XY residual: 0.0059331778 µm. Alternating sensitivity split: pairs 1, 3, 5, 7 fit; pairs 2, 4, 6 held out. Maximum held-out residual: 0.0092227148 µm. A proper-rotation-only alternative fails the 0.01 µm last-place display-consistency screen on held-out points (maximum 2.4746904 µm). This screen is a digitization consistency check only, not biological tolerance, measurement accuracy, anatomical ground truth or generalizable registration confidence.

## Implementation

- Added `data/neurolucida-dat-swc-crosswalk-0.1.json`, its reproducible builder, browser-safe fit validator and file-level validator.
- Added a separate, reversible 3D viewer shown only when NMO 45718 is selected. The native DAT viewer and its prior admission contract remain unchanged.
- The crosswalk viewer fetches and checksum-verifies the exact contour-geometry and standardized-geometry JSON assets; it renders only seven transformed line loops and the exact 5,635 SWC line segments. It does not render SWC radii as surfaces.
- The source-open legacy `Cell Body` contour remains excluded from the crosswalk and available only in the independent native-DAT view.
- UPG-192 is complete for this single record. UPG-261 records a future per-record discovery/audit gate; no other record was inspected, transformed or admitted in this increment.
- Version advanced in place from 2.89 to 2.90. No project copy was made.

## Source receipts

| Object | Bytes | SHA-256 |
|---|---:|---|
| Original NMO 45718 DAT | 343,774 | `ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415` |
| Standardized NMO 45718 SWC | 214,337 | `c8926708a1350c58124c47ebee8167820b8e0bd568bcb676e90e34f3ca6dfaee` |
| Extracted seven-plus-one native contour geometry | 45,606 | `a0aa80ce0f12b08cfe61b2862f1b3a29f67a1105a722b0dceda2fd3b25e898e8` |
| Standardized source-local geometry | 615,468 | `c5193dbca4f17bb945a034196dd7dee130096502c71e01b6e5aedacfcade8865` |

## Scientific and UI boundaries

- The transform applies only to NMO 45718 and is never reused as a default.
- Seven source-closed `Soma 1` loops are paired to type-1 samples; the loops are not lofted into a soma surface.
- `Cell Body` has a retained source-open flag and does not match the seven-plane stack; it is excluded.
- The viewer creates zero surface, mesh, volume, membrane, internal-structure object, biological measurement or atlas registration.
- Displayed source SWC type labels remain source labels; co-display makes no new molecular identity or representative-cell claim.
- If any required asset fails byte/hash, record, frame, correspondence or residual validation, the combined display is withheld.

## Validation record

- `npm run test:research` passed on the current working tree: production build, ESLint, data/schema/source/iteration validators, and the current research suite completed successfully. Current research tests: 993 total, 978 passed, 15 conditional skips, 0 failed. The build still reports the existing >500 kB client-chunk warning; this iteration makes no measured performance claim.
- Production browser review at `http://127.0.0.1:3010/`: the 1,097-record Exact universe selects the exact `101026p1-A-In` / NeuroMorpho 45718 row and displays “SOURCE RECEIPTS VERIFIED.” The crosswalk reports seven DAT `Soma 1` contours / 252 vertices and 5,635 same-record SWC segments; the separate native contour view remains available. Its declared surface, internal-object, biological-measurement and registration counts remain zero, and the source-open legacy `Cell Body` contour remains excluded.
- Desktop and 390 × 844 narrow-screen review completed. The narrow layout stacks the research cards in one column without observed horizontal clipping. Browser selection is URL-restorable to `NeuroMorpho:45718`; source-local frame labels remain explicit.
- The crosswalk is only a source-local display-consistency match for this one deposited record. It does not establish a same-cell internal model, membrane, soma volume, project registration, or biological measurement.
- The immutable 2.90 manifest is generated after this record is finalized and validated against the sealed 2.89 parent.

## Rollback map

The iteration is additive and in-place. For a selective rollback, consult `data/research-iteration-manifest-2.90.json` for the exact 2.90 input receipts and compare with the immutable 2.89 parent. Revert only the 2.90-owned files listed in that manifest; retain unrelated pre-existing worktree changes. The main-scene gate is the conditional NMO 45718 component mount in `app/NeuroMorphoUniversePanel.tsx`; the crosswalk implementation, data contract, validator and styles are separately named `neurolucida-dat-swc-crosswalk` / `Nmo45718DatSwcCrosswalkViewer` artifacts.
