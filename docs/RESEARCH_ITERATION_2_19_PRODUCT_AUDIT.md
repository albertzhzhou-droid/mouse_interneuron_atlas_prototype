# Product audit — research iteration 2.19

Date: 2026-08-30  
Build: `2.19.0-research.1`  
Preview: `http://localhost:3000/?lab=morphology&morphologyView=compare&morphologyCompare=109005%2C260150%2C104003%2C108974`

## Outcome

The morphology workflow now exposes the real admitted reconstruction corpus instead of requiring a researcher to inspect one record at a time. The primary path is matrix → comparison basket → independent 3D viewports → exact metric/Sholl tables → replay receipt. Below the per-record missingness matrix, a separate Super-CLEM panel adds one exact public 2D dorsal-horn EM reference slice while explicitly refusing to use it as the inside of any selected morphology.

The before/current review used screenshots captured in this run at the same 1280 × 720 viewport. The current build makes the 142-record scope, 94/48 diameter boundary, four-object comparison and zero-registration boundary substantially easier to find. The comparator's first geometry row remains below the initial 720 px fold because the application-wide research summary is retained; the dedicated comparator-card capture confirms that the source objects themselves render without clipping once the region is entered.

## Browser checks

| Check | Result |
|---|---|
| Direct URL restoration with four comparison IDs | Passed after hydration fix |
| New-session console diagnostics | 0 errors; 0 warnings |
| Matrix census | 142 of 142 |
| Matrix pagination | 12 records per page; page 2 exercised |
| Orthographic source axes | XY, XZ and YZ available; XZ exercised |
| Matrix canvases | 12 exact-coordinate projections on the active page |
| `No Diameter` filter | 48 records; first result NMO 242822 disclosed as disabled |
| Comparison basket | Four unique records restored from the URL |
| Radius authorization | NMO 109005 enabled; NMO 260150 disabled |
| Micro-detail evidence coverage | 13 axes × 142 admitted records; four selected records inspected |
| Internal-detail fail-closed rows | Soma contour, membrane, nucleus, organelles, boutons, receptors and partners all `UNAVAILABLE` |
| Super-CLEM source object | Figshare file `32606555`; 2,405,817-byte 1794 × 1332, 8-bit indexed-palette TIFF; MD5 and SHA-256 receipts verified |
| Super-CLEM browser derivative | 1,884,486-byte 1794 × 1332 palette PNG; decoded RGB equals the TIFF exactly; no crop, resampling, intensity transform, segmentation or scientific annotation |
| Synapse-reference boundary | One 2D same-physical-synapse slice; parent cell unresolved; no PALM/receptor overlay, organelle label, NeuroMorpho/type/atlas join or 3D claim |
| Synapse-reference image load | Complete at natural size 1794 × 1332; source scale bar visible |
| Comparison relation | `co-display only`; 0 registrations; 0 same-cell links |
| Desktop overflow | 1280 px body and scroll width matched |
| Mobile overflow | 390 px body and scroll width matched |
| Mobile layout | Controls and four slots stack; the 338 px synapse panel, 306 px image and 308 px receipt grid remain readable without overflow |

## Defect found and fixed

`MorphologyViewer` initially read `window.location` inside the comparison-state initializer. The server rendered a zero-object tab label while the first client render used four URL IDs, causing a React hydration mismatch. Comparison state now starts deterministically empty on both server and client and restores the URL selection only after the checksum-verified census loads.

## Current-run evidence

- `output/iteration-2.19-baseline-morphology.png`
- `output/iteration-2.19-comparator-desktop.png`
- `output/iteration-2.19-comparator-cards-desktop.png`
- `output/iteration-2.19-comparator-radius-desktop.png`
- `output/iteration-2.19-morphology-matrix-desktop.png`
- `output/iteration-2.19-comparator-mobile-390x844.png`
- `output/iteration-2.19-comparator-card-mobile-390x844.png`
- `output/iteration-2.19-microdetail-evidence-desktop.png`
- `output/iteration-2.19-internal-detail-boundaries-desktop.png`
- `output/iteration-2.19-super-clem-reference-desktop.jpg`
- `output/iteration-2.19-super-clem-reference-receipts-desktop.jpg`
- `output/iteration-2.19-super-clem-reference-mobile-390x844.jpg`
- `output/iteration-2.19-super-clem-reference-receipts-mobile-390x844.jpg`

## Scientific UX boundary retained

The interface does not fill unavailable anatomy. Same-specimen membrane, nucleus, organelles, boutons, receptor maps, synaptic partners and atlas registration remain visibly unavailable. Source-authorized radii generate a disclosed display derivative; official `No Diameter` records remain exact centreline-only objects.

The Super-CLEM image is an independent source object under CC BY 4.0. Its source TIFF and pixel-preserving PNG derivative are visibly distinguished, and the panel states that page proximity creates no biological relationship. It adds no segmentation, mesh, 3D reconstruction, receptor overlay, exact PALM crosswalk, organelle identity or parent-cell assignment.
