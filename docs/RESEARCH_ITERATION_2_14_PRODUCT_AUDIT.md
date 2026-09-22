# Research iteration 2.14 product audit

Snapshot date: 2026-08-27  
Scope: UPG-076 complete Matson ranked-marker panels and deep-marker discovery

## 1. Audit scope

This audit covers the current localhost build at 1440 × 1000 and 390 × 844. It exercises the source-local Pdyn dossier, the rank-6–20 disclosure, exact worksheet-cell display, local `Parm1` search, global Research Explorer search, canonical focus state and the 20-item global dossier panel. It also records production build, lint, validators and the complete working-tree regression result.

The audit is a product and implementation check. It is not biological validation, a formal WCAG conformance claim, a screen-reader study, a touch-device study or researcher usability evidence.

## 2. Researcher goal and accessibility target

The intended journey is: locate a source population from any of its 20 published ranked genes, inspect the exact source order and worksheet cells, and see missing structure/connectivity fields without mistaking rank for expression strength or identity. The interaction target is keyboard-focusable, responsive, readable without page-level horizontal scrolling, and explicit about what the source cannot establish.

## 3. Strengths observed

- The Pdyn dossier declares `20 / 20 retained` and shows ranks 1–5 by default, limiting initial density while keeping the complete source denominator visible.
- Expanding the native disclosure exposes all 20 ranks and exact cells. Current-run anchors include `Parm1` at rank 17 / `K18` and `Pax8` at rank 20 / `K21`.
- Marker rank is visually separated from the unavailable statistics list: score, expression magnitude, specificity, fold change and p-value remain unavailable.
- Local `Parm1` search reduces the 17-population source list to the single Pdyn record while preserving the canonical `sci_population` focus and 3-wpi state in the URL.
- Global `Parm1` search returns one record in one source namespace. Its Evidence dossier renders all 20 ordered markers; no cross-source relationship is created.
- The unsupported-field panel stays adjacent to the marker evidence. Cell coordinates, morphology, complete axon, same-cell projection status and synaptic connectivity remain unavailable rather than visually completed.

## 4. UX risks

- The full 20-rank panel is intentionally tall on mobile. This is acceptable for evidence inspection but still requires significant vertical travel before later dossier sections.
- Long symbols such as `4930590L20Rik` wrap to two lines at 390 px. The card preserves containment and source value, but dense gene lists remain scan-heavy.
- Exact hashes and workbook ranges are useful for reproducibility but secondary for most researchers. They remain below the rank panel; further collapsing them must not hide the scientific boundary or unavailable-statistics statement.
- The 17-record source list and dossier remain side by side on desktop, so the information view is efficient for comparison but visually dense.

## 5. Accessibility risks

- The disclosure uses native `details`/`summary`, has a visible focus outline and a measured 44-px summary height at 390 px. Pointer activation was observed. A conclusive automated keyboard-activation result was not obtained in this browser run, so complete live keyboard traversal remains a follow-up check rather than an acceptance claim.
- Screen-reader announcements, 200–400% zoom, forced-colors mode and formal contrast ratios were not tested.
- The mobile two-column marker grid has no horizontal overflow, but very long gene tokens rely on wrapping; future source symbols should be checked with the same breakpoint tests.

## 6. Opportunity areas

1. Add a compact jump between the selected source-population result and its marker panel on narrow screens.
2. Add a copyable citation/locator action for one marker or the complete panel without implying source-file redistribution.
3. Preserve ordered rank, exact source cell and unavailable-statistics language in every future marker-panel adapter.
4. Keep new source-specific panels behind the same literal-search, namespace-grouping and fail-closed focus contracts.

## 7. Scientific evidence limits

The richer marker panel does not add cell coordinates, neurite geometry, same-cell morphology, axon completion, projection tracing, synapses, biological prevalence, quantitative injury effects or exact cross-study identity. Sixteen non-motor Matson labels remain unresolved as local interneurons versus ascending projection neurons, and the motoneuron record remains context only. Co-display and literal search do not change those limits.

## 8. Verification record

- Exact-source Matson rebuild: byte-identical; data SHA-256 `620b6a04faf3d91ed202846bf8f7c32eb0f7b861342e5cb8a8a11c92cc7bef49`.
- Research Explorer rebuild: byte-identical index and manifest; 356 records; index SHA-256 `d9218b409a4f64c46718d39bfee0df834bd91f394f52ff20d9802499dc1537f7`.
- `npm test`: 234 discovered; 232 passed; zero failed; two release-lock checks skipped by design.
- Production build and lint: passed. Vinext emitted its non-blocking chunk-size and route-classification advisories.
- Matson validator: 17 populations, 340 ranked genes, 15 samples, five timepoints, 23,651 neuronal nuclei and zero project registrations.
- Desktop 1440 × 1000: five default cards, 20 expanded cards, no page-level horizontal overflow.
- Mobile 390 × 844: five default cards, 20 expanded cards, two-column rank grid, 44-px disclosure summary and no page-level horizontal overflow.
- Global deep-marker journey: `Parm1` → one Pdyn record in one Matson namespace → 20 ordered dossier markers.
- Browser console: zero warning/error entries.

## Current-run visual evidence

- [Desktop expanded Pdyn marker panel](../output/research-iteration-2.14/audit/matson-pdyn-desktop-expanded.png)
- [Mobile expanded Pdyn marker panel](../output/research-iteration-2.14/audit/matson-pdyn-mobile-expanded.png)

## Recommendation

Accept UPG-076 as a complete, source-bounded molecular-depth slice. The next model-filling work should prioritize public objects that directly add a currently empty axis—native coordinates, same-cell morphology, projection identity or observed connectivity—while maintaining strict source, species, stage and experimental-unit partitions.
