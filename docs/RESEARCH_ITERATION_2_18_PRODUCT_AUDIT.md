# Research iteration 2.18 — product and browser audit

Date: 2026-08-30  
Target: unpackaged localhost research iteration `2.18.0-research.1`  
Scope: evidence-gated source-local morphology fidelity; no OHRI data, images, specimens or unpublished records

## 1. Scope

This audit covers the main-scene cell-form lens and the dedicated morphology census workspace after the 2.18 morphology-fidelity upgrade. It tests the three authority states—observed SWC, deterministic radius-derived surface, and unavailable same-specimen internal structure—without treating the reference atlas, SCI evidence entities or source populations as the same biological object.

The audit does not validate biological atlas registration, prevalence, a complete interneuron census, a connectome, membrane segmentation or intracellular anatomy. Those claims remain outside the admitted evidence.

## 2. User goal and accessibility target

The user needs a researcher-facing 3D tool that makes an incomplete model scientifically legible: visible detail must be traceable to a source, unavailable detail must remain visibly unavailable, and a requested high-fidelity state must never silently substitute unsupported geometry.

The interaction target for this iteration was:

- English-only interface copy for distribution;
- mouse and keyboard operability;
- 44 px minimum fidelity controls;
- explicit selected, disabled and runtime states;
- a responsive 390 × 844 layout with no horizontal overflow;
- persistent source/mode state in the URL and export receipts.

## 3. Strengths confirmed in browser

- **Diameter-authorized surface path:** at 1440 × 1000, `NMO 109005` loaded with `cellFidelity=surface`; the viewport receipt stated `Geometry bytes verified · derived surface rendered and visible.` The selected surface control had `aria-pressed="true"`; observed SWC remained available; same-specimen internal structure was disabled.
- **No Diameter fail-closed path:** requesting `NMO 260150` with `cellFidelity=surface` rewrote the URL to `cellFidelity=swc`. The interface stated `Source reports No Diameter`, ignored placeholder SWC radii, disabled both radius-derived and internal modes, and reported `Geometry bytes verified · observed SWC rendered and visible.`
- **Touch-target and responsive behavior:** at 390 × 844, the three fidelity controls stacked vertically at 314 × 44 px. `documentElement.scrollWidth`, `body.scrollWidth` and `innerWidth` were all 390 px, so measured horizontal overflow was zero.
- **Dedicated morphology workspace:** the renderer exposed observed, derived and unavailable internal states. A radius request selected for `NMO 109005` did not leak when the user selected no-diameter `NMO 260150`; the latter used observed SWC with the radius control disabled. Returning to `NMO 109005` restored its own radius selection.
- **Runtime honesty:** the visible receipt reports the actual verified/rendered/visible state rather than repeating the requested control state.
- **Console health:** current-run browser logs contained only Vite connection debug messages and the React DevTools development notice; no warning or error was recorded.

## 4. UX risks

- The main research page is information-dense and long. The morphology-fidelity explanation is clear once reached, but researchers may not immediately discover it from the overview position.
- The spinal reference volume, evidence entities and source-local reconstruction remain visible together. Although labels repeatedly state `0 REG` and `co-display`, spatial proximity can still be misread as biological placement.
- Exact provenance is intentionally detailed. Hashes, authority codes and missingness are valuable for audit, but progressive disclosure remains important so first-time users can identify the primary morphology state quickly.
- The radius-derived surface improves depth perception but can look membrane-like. The present labels mitigate this, yet screenshots removed from the interface could lose the boundary unless the PNG receipt stays visible.

## 5. Accessibility risks

- The three fidelity controls meet the 44 px target in the tested desktop and mobile states, and disabled states are programmatic. A full screen-reader traversal and contrast audit remains outstanding.
- Dense 10–12 px technical labels are readable at the tested desktop scale but may be demanding for low-vision users. Browser zoom and text reflow were not exhaustively tested in this iteration.
- WebGL morphology conveys structure visually. Metadata, counts, mode state and limitations remain available as text when 3D is unavailable, but an equivalent non-visual topology description is not yet complete.
- Color is supplemented by labels and authority codes, but source-type line distinctions should still be checked under common color-vision simulations.

## 6. Opportunities

- Add a direct `Inspect morphology fidelity` entry point near the overview summary while retaining the current research-page hierarchy.
- Provide an optional compact audit drawer containing the geometry hash, algorithm version, visible source types and display transform, leaving the three biological authority states prominent.
- Add a screenshot-safe disclosure strip to every exported PNG so derived surfaces cannot circulate without their `DER` and `not observed membrane` boundary.
- Extend automated accessibility coverage to focus order, screen-reader names, 200% zoom, forced colors and color-vision simulation.
- Admit future public microscopy or spatial objects only as separate source objects with a typed relationship (`same_physical_object`, `same_source_population` or `co_display_only`).

## 7. Limits retained by design

- No same-specimen membrane, nucleus, organelle, bouton, receptor, synapse or ultrastructural object exists for the five main-scene cells. Internal structure therefore renders zero primitives.
- Only three of five exemplars authorize a radius-derived surface. The two official `No Diameter` records remain centerline-only even though standardized files contain numeric placeholder radii.
- `NMO 109005` contains axon type-2 nodes, but its physical integrity is moderate; the application does not call it a complete axon.
- Root-centred uniform scaling is a viewer-only transform, not atlas registration or a biological coordinate transform.
- UPG-091 remains in progress until every export carries a fully replayable camera, clipping, visible-layer, transform and renderer/build receipt.
- UPG-092 remains in progress because same-specimen internal detail is correctly unavailable rather than implemented.
- The production build retains a known bundle-size warning for a chunk larger than 500 kB; it is a performance/deployment concern, not a failed correctness gate.

## 8. Recommendations

1. Keep the current fail-closed authority contract as a release blocker for all future geometry work.
2. Next, expand checksum-pinned NeuroMorpho objects and surface only the diameter-authorized subset; this is the lowest-risk path to broader morphological coverage.
3. Evaluate the queued adult spinal spatial/projectome and Super-CLEM sources as separate lanes, never as invented internal anatomy for a NeuroMorpho specimen.
4. Complete UPG-091 before presenting PNG/JSON/CSV exports as replayable scientific scene records.
5. Perform a dedicated accessibility pass before external curator distribution, including screen reader, 200% zoom and color-vision checks.

## Acceptance evidence

- `npm run test:research`: passed; build and lint passed; 274 tests total, 272 passed, zero failed, two intentional skips.
- Frozen `2.8` verification: 141 files, zero registration artifacts; package SHA-256 `50e10df2c568c298af5d3a35c48cb6bd52d1638d8d72822f30336837e3c60dfe`.
- Current screenshots:
  - `output/iteration-2.18-morphology-fidelity-desktop-1440x1000.png`
  - `output/iteration-2.18-morphology-fidelity-no-diameter-desktop-1440x1000.png`
  - `output/iteration-2.18-morphology-fidelity-mobile-390x844.png`
  - `output/iteration-2.18-vs-2.17-desktop-comparison.png`
  - `output/iteration-2.18-vs-2.17-mobile-comparison.png`

The verified deliverable tab remains open on the `NMO 109005` radius-derived state. No deployment or curator package was produced in this iteration.
