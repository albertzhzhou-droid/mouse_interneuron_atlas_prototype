# 2026-10-04 · Hierarchical pages and navigation

## User direction

The prior visual adjustment did not meet the user's needs. This iteration replaces the stacked home page with a site menu, hierarchical destinations and distinct URLs. The home page provides entry points; it does not mount the research collections or main scene.

## Implemented structure

- `/`: concise research-area landing page.
- `/explore/morphology`: curated route library; `/explore/morphology/viewer`: source record viewer.
- `/explore/cell-types`: profiles, with `/compare`, `/additional` and `/zebrafish` subpages.
- `/explore/anatomy` and `/explore/positions`: independent anatomy and position tools.
- `/research/explorer`, `/research/sci`, `/research/coverage`: record search, SCI conditions and evidence coverage.
- `/sources`, `/objects`, `/source-audits`: registry and source-specific tools.
- `/catalogues/svara`, `/connectivity/svara`: publication-specific pages.
- `/workspace`: main 3D scene and its controls. This page no longer mounts ResearchDataLab or the collection stack.

Desktop navigation uses a persistent grouped sidebar, current-page markers, child-page links and breadcrumbs. Mobile navigation uses a native expandable menu. Route links are actual URLs; browser back/forward and direct links remain available. Each collection route lazy-mounts one primary module within its source-record provider. The route owns the page choice rather than a conflicting `lab` query.

The morphology library now provides title/ID search and six records per page. Its full collection-membership explanation remains available in a disclosure. Record-specific scientific fields and warnings remain intact. Independent viewers use container-width breakpoints to account for the sidebar. Every page has its own browser title. Interface motion is limited to brief color/fade changes and respects reduced motion; scientific views do not rotate automatically.

Legacy root query links redirect to appropriate pages, preserving the query. Explicit scene-state links continue to `/workspace`. Curated morphology routes open an exact admitted object; general record-search results use the broader record viewer so they do not imply admission to the main scene. No cross-source identity or geometry permission is added.

## Preservation

Preimages and hashes are stored under `qa/2026-10-04-multipage-layout/`. The scientific workspace remains dirty with concurrent I51 activity. Revert only this iteration's changes in shared files; whole-file Git resets or archive restoration can erase concurrent work. The frozen 2.90 manifest is not changed. Current 2.91 runtime pins include the new shell inputs.

## Build and browser observations

- TypeScript compilation completed without diagnostics. Production build completed; logs are in the QA directory.
- Desktop inspection at 1280 × 720: home, morphology library, record viewer, cell-type profiles/comparison, SCI, source registry and main workspace loaded through real menu or subpage navigation. Browser back and breadcrumbs returned to the expected parent page.
- Morphology pagination changed from records 1–6 to 7–12. Searching `104003` returned one exact route; its action opened `/workspace` with `focusId=NeuroMorpho:104003`, its matching cell form and one canvas.
- The record viewer used two columns at 1280 px and had no document-level horizontal overflow. The independent SCI and registry pages mounted zero canvases.
- Mobile inspection at 390 × 844: native menu expanded, a morphology link navigated to its page, the menu reset closed, and document width remained 390 px.
- Legacy `/?lab=types` redirected to `/explore/cell-types?lab=types`. Source-specific view state stays attached to its record and route.
- Targeted ESLint produced no output and was terminated after a prolonged stall; it is not recorded as passed.
- No automated test suite was added or run. Historical single-page rendered-HTML assertions and fixed input-count assertions need a separate test migration before they can be used as evidence for this route structure.

This is a local presentation/navigation iteration. It does not mark another scientific upgrade complete or authorize additional geometry. No GitHub push was performed.
