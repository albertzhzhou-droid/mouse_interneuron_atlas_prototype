# Post-2.90 research timeline — NMO 45718 main-scene DAT overlay

Date: 2026-09-24  
Application version: `2.90.0-research.1` (unchanged)  
Parent state: sealed local iteration 2.90; this is a post-seal, local UI integration.  
Scope: make the already audited UPG-192 NMO 45718 DAT↔SWC display crosswalk optionally visible in the main source-local 3D scene.

This record documents implementation explicitly requested by the user against `docs/UPGRADE_PLAN_2026-09-24.md`. The plan remains unchanged; its original planning-only status was not treated as implementation authorization. No new release, upgrade-queue status, source-registry entry, or GitHub push was created.

## User-visible change

- Added an opt-in `DAT Soma 1 contours · OBS` layer to the main scene when the exact NeuroMorpho 45718 morphology is active.
- The layer draws only the seven audited source-closed DAT `Soma 1` line contours in the same record's standardized SWC-local display frame. The existing SWC scene remains independently selectable.
- Before showing the overlay, runtime checks verify the exact DAT, native-contour, standardized-geometry and selected-record geometry receipts, then revalidate the crosswalk and its geometry boundaries. A mismatch fails closed.
- Hiding the base source-local SWC clears the overlay and its receipt and disables the control. Re-enabling SWC allows the selected record's overlay to be verified again.
- The overlay does not include the separate legacy `Cell Body` contour. It creates no surface, volume, membrane, internal object, measurement or atlas registration. The transform is project-derived and supports a display-consistency screen only.

## Pinned source boundary

The pre-existing UPG-192 contract remains the source of truth: `data/neurolucida-dat-swc-crosswalk-0.1.json`.

| Input | Bytes | SHA-256 |
|---|---:|---|
| NMO 45718 original DAT | 343,774 | `ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415` |
| NMO 45718 standardized SWC | 214,337 | `c8926708a1350c58124c47ebee8167820b8e0bd568bcb676e90e34f3ca6dfaee` |
| Extracted native contour geometry | 45,606 | `a0aa80ce0f12b08cfe61b2862f1b3a29f67a1105a722b0dceda2fd3b25e898e8` |
| Standardized source-local geometry | 615,468 | `c5193dbca4f17bb945a034196dd7dee130096502c71e01b6e5aedacfcade8865` |

The seven contours contain 252 vertices and correspond by the audited project-derived pairing to SWC type-1 nodes 2–8. The primary held-out residual is 0.0059331778 µm; the alternating sensitivity held-out residual is 0.0092227148 µm. These are last-place display-consistency checks, not anatomical accuracy or registration confidence. The source-open `Cell Body` trace remains excluded.

## Files owned by this addition

The following names identify this addition within files that already contain unrelated uncommitted work. Revert only these feature-owned hunks; do not restore whole files.

- `app/SceneCanvas.tsx`: `Nmo45718DatSwcCrosswalkRuntime`, `showNmo45718DatSwcCrosswalk`, the checksum-gated `nmo45718DatSwcCrosswalkRoot` lifecycle, and the `nmo45718DatSwcCrosswalkStatus` scene disclosure.
- `app/AtlasPrototype.tsx`: `showNmo45718DatSwcCrosswalk`, its runtime status and clear/receive handlers, the `nmo-dat-crosswalk-scene-control` UI, and its `SceneCanvas` prop wiring.
- `app/globals.css`: selectors beginning `.nmo-dat-crosswalk-scene-`.

The DAT/SWC contract, its source inputs, the independent native-contour view, the separate UPG-192 crosswalk viewer, the 2.90 manifest and the upgrade queue were not modified by this addition.

## Validation

- `npm run test:research`: passed on the implementation working tree. Production build, lint, the configured validators and research suite completed; 993 tests total, 978 passed, 15 conditional skips, 0 failed. The build retains an existing client chunk warning above 500 kB; no latency improvement is claimed.
- `npx tsc --noEmit`: still reports 35 project-wide errors from the existing working tree; the new `SceneCanvas` overlay block had no reported type errors. This check is not recorded as passing.
- Production-build browser review at `http://127.0.0.1:3010/`, exact route `NeuroMorpho:45718`: enabling the control produced the verified state `loaded-verified-seven-source-contours-display-screen-only`; the visible scene disclosed 7 contours / 252 vertices. Hiding the base SWC set the overlay control disabled and scene status to `idle`; restoring SWC and enabling the control returned to the verified state. The rendered scene screenshot showed the overlay alongside the source-local arbor.
- Cross-record browser review navigated from NMO 45718 to the adjacent source record NMO 45719 (listed as 2D, no-age-delta SWC). The 45718 main-scene geometry and overlay control were removed; the application reported no admitted main-scene morphology and no fallback. Returning to `NeuroMorpho:45718` restored the exact source-local view. Thus both record-switch clearing and base-layer hide/show clearing were exercised.

## Remaining scientific goal

This addition improves access to one exact source-local morphology and its audited 2D contour correspondence. It does not deliver the plan's separate M4 goal: a same-specimen three-dimensional interneuron interior with observed membrane, nucleus, organelles or synapses. Those objects remain unavailable for NMO 45718, and no other record inherits this transform.
