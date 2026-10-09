# Research timeline — iteration 2.86 (2026-09-24)

## Scope and outcome

UPG-258 fixes repeated broad missingness in the active-record intracellular-detail matrix. A pinned-index screen found that 165 of 641 exact Research Explorer records repeated the same dataset/record-wide `internal_structure` gap verbatim across the nucleus, organelle, synapse and receptor cards. The matrix now shows that shared boundary once, while retaining all four structural slots, their status, distinct slot-specific explanation and source locator. This is a presentation correction, not evidence of biological absence or a geometry-admission rule.

The exact-record selection guard is unchanged: pending or mismatched selections still hide the prior record receipt. Source-reported values, derived displays and admitted objects remain separate. The project adds no cell surface, nucleus, organelle, synapse, receptor, identity join, registration or mouse denominator.

## Source-route screen

This round screened additional public EM/ultrastructure routes for exact spinal-interneuron identity. The MICrONS ground-truth package describes mouse visual-cortex EM rather than spinal cord; the MicroStructFormer spinal-cord resource is a 2D ultrastructure-segmentation dataset without an exact interneuron-cell identity mapping. Neither route is admitted to a selected mouse interneuron record or rendered as its intracellular geometry. Existing source-specific route audits remain separate.

## Queue and denominator state

UPG-258 is completed for its declared UI increment. The queue contains 240 rows, 70 completed items and 45 research-facing IDs resolved by the app. The source registry remains at 31 canonical sources, 41 record sets, 13 exact cell/profile rosters, 4 exact source-object sets and 387 source profiles; stale denominator literals remain 0.

## Verification

`npm run test:research` passed, including the production build, lint, registered research validators and regression suite: 978 checks total, 963 passed, 15 conditionally skipped and 0 failed. The UPG-258 coverage and queue-registry tests pass. The manifest records no change to geometry, identity joins, registration or mouse denominators. Build output still reports non-blocking large-client-chunk and route-classification advisories, plus a Node module-registration deprecation warning.

## References

- [MICrONS mouse visual-cortex EM ground-truth dataset](https://zenodo.org/records/5760218)
- [MicroStructFormer dataset and spinal-cord ultrastructure labels](https://dnq2023.github.io/MSF_WEBSITE/dataset/)
