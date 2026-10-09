# Research timeline — iteration 2.57 (2026-09-23)

## Objective and rollback

Continue the public-data, evidence-bounded atlas in the existing project tree. The immutable rollback parent is `data/research-iteration-manifest-2.56.json` (358,724 bytes; SHA-256 `c08ce63ddd197c868d4243f4b9919ce8924d568708f6041e157f380c45fee31f`; content SHA-256 `f647b41c62d67ed3258f5e58623a8fd2d1d3ee7e25bec9f6c4b5576135be168f`). Iteration 2.56 remains frozen at 212 research/model upgrades; the live queue advances to 213 with UPG-231.

## Research increment

- Rechecked Todd NeuroMorpho NMO 50424 and 50408 source DAT and source-native `Cell Body` contour receipts from `data/neurolucida-native-contour-admission-catalog-0.3.json`. The audit does not modify or repair source points.
- Audited 19 exact contour loops and 1,136 ordered vertices across 19 contiguous source z planes. The source arrays are not in z order for either record; adjacency diagnostics sort only their comparison view.
- NMO 50424: 8 loops / 427 vertices; 5 of 7 adjacent intervals fall within the exploratory screen, while 2 exceed it. All 8 polygons are simple.
- NMO 50408: 11 loops / 709 vertices; 4 of 10 intervals fall within the screen and 6 are held. Two exact contours self-intersect (z = −22 and −18 µm); one additional zero-length edge is reported at z = −18 µm without editing the source point payload.
- Across both records, the 128-sample cyclic screen marks 9/17 intervals within its inherited criteria and holds 8/17. Those numerical thresholds come from the separate NMO 50394 software implementation and are not independently validated biological tolerances. A within-screen result is not shell admission or evidence of biological change.
- The existing record inspector now exposes the interval metrics and exact topology flags for those two records. It retains source loops only: 0 contour-derived shells, triangles, internal objects, joins or registrations were added.
- UPG-220 advances to a partially completed source-topology audit with shell admission held. UPG-231 records the outstanding independent multi-record threshold-validation work.

## Verification

- Recomputed the topology audit directly from exact local DAT/geometry receipts. `npm run test:research` passed the production build, ESLint, validators and 836 tests (821 passed, 15 optional/source-access tests skipped, 0 failed).
- The Vite build still reports at least one minified client chunk over 500 kB; this remains tracked under UPG-230 and was not addressed by removing features.
- 2.56 is now checked through a byte/content-locked snapshot validator and remains the rollback parent; it is not rebuilt against changed 2.57 inputs.
- The user’s existing modifications remain in place. This iteration adds no whole-project copy and does not commit or push.
