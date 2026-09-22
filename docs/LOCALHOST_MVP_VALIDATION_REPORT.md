# Localhost Research MVP validation report

**Candidate:** `ohri-mouse-interneuron-research-mvp-candidate-0.2.0`  
**Application:** `ohri-mouse-interneuron-atlas-prototype@0.2.0`  
**Validation date:** 2026-08-17  
**Decision:** pass as a **localhost Research MVP engineering candidate**; do not describe it as a research-validated atlas and do not deploy in this phase.

> **Historical browser-validation snapshot.** This report records manifest `f192ca88...` before the English-only curator-package wording and static-URL hydration update. It remains evidence for the underlying browser workflows, but it is not the package-integrity report for the later `0.2.0-curator.1` archive. Use the curator-package validation report and package checksum for the distributed artifact.

## Reproducibility lock

- Release-manifest content SHA-256: `f192ca88a5681921bd49a23b3dd47dd10becdd9df2d7843705d3b5339a20bffb`.
- Eight exact inputs are byte-counted and SHA-256 locked, including the Research MVP release/schema, external evidence ledger/source manifest, atlas/morphology manifests, rights ledger, and JavaScript dependency lock.
- Atlas asset-manifest SHA-256: `df41e08e3c3a802a7de96d68cd1cb5e150432ebde603599668f69b662ac78c14`.
- Morphology asset-manifest SHA-256: `4ee24a35b282376ee507c0218806671b9c9f6f18c820d2ffaa298a53162a8647`.
- Registered-object count: `0`.

## Automatic validation

The final production build passed:

```text
npm run lint: PASS
npm test: PASS
Node tests: 35 passed, 0 failed
Research MVP validator: PASS
Draft 2020-12 JSON Schema validator: PASS
Spatial-asset validator: PASS
Release-manifest drift/tamper check: PASS
```

The production build retains one non-blocking performance warning: the Three.js client chunk is greater than 500 kB after minification. No correctness, provenance, or localhost runtime failure was associated with that warning.

## Browser acceptance against the production localhost build

The built application was served at `http://127.0.0.1:4173`; no development server or deployed site was used.

| Workflow | Browser evidence | Result |
|---|---|---|
| US-01 locate/status | Real `allen_cord_20um:3.0` plane and sampled 3D reference loaded as `INF`; native z/AP shown; segment pending; measurement forbidden | Pass at engineering level |
| US-02 identity axes | Population/overlay identities and lineage, molecular, transmitter, projection, and state axes remain separate | Pass |
| US-03 causal evidence | Entity → claim → condition → source trace, causal grades, negative findings, boundaries, and human-causal guard visible | Pass |
| US-04 compare | P05 staggered T7/T10 and complete T8 rows selected side by side; `DEP`, result, negative/counterfinding, and boundary rows rendered without pooling | Pass |
| US-05 reproduce | URL reload restored the two P05 selections; JSON export included current manifest hash; export → state change → import → export was deep-equal after removing only `exportedAt` | Pass |
| US-06 gaps | Explicit missing reasons shown; a zero-result query stated that it was not evidence that the cell type does not exist | Pass |
| Morphology boundary | NeuroMorpho 109005 loaded with 10,314 nodes and `OBS local morphology / UNREGISTERED`; no atlas transform claimed | Pass |
| Export formats | JSON, seven-row RFC 4180 CSV, and PNG with `SYN GEOMETRY · SCH PATHWAYS · NOT ATLAS-REGISTERED` disclosure downloaded successfully | Pass |
| Keyboard | Entity ArrowDown changed selection; evidence-tab ArrowRight changed panel and URL | Pass |
| WebGL failure | Injected `webglcontextlost` switched to the accessible fallback while lists, sources, and transverse orientation remained available | Pass |

The normalized payloads before and after the JSON round trip had the same SHA-256:

```text
cc9daaf914b2ba2a972686cecf10d28150fc263f83d5f4de6c5f3a9b67724eff
```

An intentionally wrong `releaseId` fixture was rejected visibly and did not change the current state.

## Browser, layout, console, and network checks

- Desktop full-page visual inspection passed.
- Width `390 px`: no horizontal overflow; the scientific-status banner and all workflows remained readable.
- Width `320 px`: `documentElement.scrollWidth === window.innerWidth === 320`.
- A fresh browser session reported `0` console errors and `0` warnings before failure injection.
- Atlas contours, atlas plane PNG, icon, fonts, scripts, and styles returned localhost HTTP 200.
- After switching tabs, `morphology-lines.json` returned localhost HTTP 200.
- No automatic external data request was observed.
- The intentional WebGL context-loss test added one Three.js context-lost log and no error or warning.

## Saved validation artifacts

- `output/playwright/research-mvp-desktop.png`
- `output/playwright/research-mvp-mobile-390-final.png`
- `output/playwright/us04-p05-comparison.png`
- `output/playwright/observed-swc-unregistered.png`
- `output/playwright/export-vgat-kcc2.csv`
- `output/playwright/export-vgat-kcc2.png`
- `output/playwright/state-roundtrip-before.json`
- `output/playwright/state-roundtrip-after.json`

## Gates that automation cannot close

1. No morphology or evidence entity has a scientifically validated transform into the atlas; there are zero `REG` objects.
2. Two independent spinal-neuroscience curators have not approved identity mappings, evidence boundaries, or a future registration protocol.
3. Private attributed curator sharing is permitted, but public deployment or broader redistribution still requires the documented institutional asset-level rights review.
4. Five target researchers have not yet completed the task study, and the 90% status-comprehension criterion has not been tested.
5. The five SWCs are examples, not a representative sample or census of spinal interneurons.

These are explicit next scientific/human gates, not software failures and not permission to infer missing biology.
