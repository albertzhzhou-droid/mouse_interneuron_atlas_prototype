# Research timeline — iteration 2.54 (2026-09-23)

## Scope

Continue the source-grounded morphology/UI work after the 2.53 MICrONS spatial-eligibility audit. NMO 108978 (`cell-4_16`) is already one of the 142 records in the pinned adult NeuroMorpho query but was not selectable as its own main-scene route. The iteration activates that exact census child without changing the five-record frozen lens, the 142 census denominator, or the seven-record supplementary comparator set.

## Implemented

- Added a checksum-backed census-child route contract for NMO 108978: standardized SWC (1,817 nodes / 1,816 segments; source-reported radii) and source-native Neurolucida DAT soma contours (12 `Cell Body` line loops / 2,614 ordered vertices).
- Added the 14th selectable main-scene morphology and 11th named spinal morphology route. Census and supplementary comparison counts are derived from route membership and the canonical source registry; native-contour totals and NMO 108978 / 249676 per-record counts are read from the admission catalog.
- Added evidence-aware representation contract 0.6 with a dedicated observed source-native line-loop state and per-representation source-frame receipts. The standardized SWC and native DAT are rendered separately; matching soma counts establish no correspondence or transform.
- Preserved missing age as `Not Reported`, the deposited SP/excitatory source labels, the source integrity label “Dendrites Complete,” and no reconstructed axon. No exact paper subtype, same-cell molecular relationship, cross-source identity, registration, membrane, volume or internal primitives are added.
- Added UPG-226 as a completed morphology increment and linked it to the canonical NeuroMorpho source registry.
- Sealed iteration 2.53 byte-for-byte as the parent snapshot and advanced the active release to 2.54.

## Verification

- `npm run build`: passed. Vinext reported the existing large client-chunk warning and dynamic route classification limitation; neither stopped the build.
- Focused route, representation, census, source-registry and rendered-HTML checks: 76/76 passed. SSR confirms NMO 108978 stays within the census, preserves separate DAT/SWC frames, and makes no internal-object or registration claim.
- `npm run test:research`: passed after regenerating the 2.54 receipt; build, lint, data/schema/source/3D/history validators passed and the current test run reported 816 tests, 801 passed, 15 optional/environment-dependent skips, 0 failures.
- Corrected the MICrONS active-snapshot regression test to validate active iteration 2.54 rather than the immutable parent 2.53 snapshot; the 2.53 snapshot remains unchanged.
- UPG-200 through UPG-204 are marked completed in the validated research-upgrade registry. This iteration closes at 2.54; no additional modeling changes are scheduled here.
- Browser route-switch verification: not completed. The Playwright CLI package is absent from the local npm cache (`ENOTCACHED` under offline mode), and desktop browser automation reports that macOS is locked. No browser interaction result is claimed.
- GitHub push: not performed. The configured push target has not been verified as the GitHub repository the user requested; confirm the destination before publishing. Browser verification likewise requires an unlocked desktop or an available CLI package.
