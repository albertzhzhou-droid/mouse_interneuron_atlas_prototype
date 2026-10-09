# 2026-10-04 · Academic reading layout

## Request and scope

Continue the atlas with particular attention to human-readable layout and restrained academic animation. Current baseline is 2.91, including I50; this update changes presentation and view-input receipts. It adds no scientific objects, joins, registration, geometry authority, or upgrade-completion counts.

## Implementation

- Paper-toned reading surface, serif page and section headings, larger text and calmer borders.
- Separate collection navigation from the 3D workspace, with page anchors that scroll/focus without replacing the current query/selection, and preserved keyboard tab behavior.
- Compact primary view actions; secondary export/import/reset tools remain in a native disclosure.
- Collection tabs show short titles and supporting captions while including the visible title and original descriptive wording in their accessible names.
- Natural-height workspace prevents long morphology/provenance sections from being clipped. Desktop rails scroll independently; narrow screens use a single column.
- Text-only evidence-mode explanations and route warnings expand on demand. Active record, geometry status and relationship limits remain visible. Canvas components keep their existing mounting and scientific rendering behavior.
- 160–200 ms interface fades/color transitions, disabled when reduced motion is requested. No automatic camera motion or recurring effects.
- New interface CSS is part of all seven viewer build input declarations and compact runtime pins.

## Preservation and rollback

Pre-edit bytes of parent-owned existing files are in `qa/2026-10-04-academic-interface/preimages.zip`; pin integration originals are in `pin-preimages.zip`. Corresponding JSON receipts record hashes. Archives preserve the already-dirty local baseline. Concurrent I51 work shares AtlasPrototype.tsx, main-scene-source-view.js, both builder recipes, the upgrade plan and generated receipts. Revert only the UI-specific hunks in these shared files, preserving I51 changes, then regenerate the current manifest/runtime. Whole-file archive restoration or a Git reset would remove concurrent work. For UI-exclusive files restore their archived versions, and remove the new CSS/timeline plus their import and pin entries.

## Inspection record

Initial production build completed, but it began before the runtime pin generator finished and the preview reported a missing concurrent I51 PV-route build input. Regenerated current pins and rebuilding before rendered-page acceptance. The initial dev server configuration-loader timeout required no source/config change; production compilation succeeded.

A point-in-time preservation scan reconciled the 2,388 baseline inputs: 2,362 unchanged, 17 UI-owned differences and 9 concurrent I51-owned differences, no missing or unexplained paths. All 18 UI/pin preimages matched recorded hashes. I51 has its own matching preimages and adds eleven non-UI authoritative inputs. These are preserved and are not scientific results of this presentation update.

## Final observed results

- Final `npm run build` completed successfully after current renderer pins were regenerated. Existing chunk-size and route-classification warnings remain in the build log.
- Browser rendering inspected at 1440×900, 1280×720, 768×900 and 390×844. Document scroll width equalled viewport width at each size. The 1440px workspace used 240 / 806 / 320px columns. The 768px morphology disclosure used a single 438px content column.
- The desktop workspace used natural height (about 2,630px for the inspected initial state) with visible overflow instead of clipping. The scientific stage retained an explicit height.
- Native section navigation initially caused the framework to reload stale URL selection. Fixed by using the same prevent-default, focus-and-scroll pattern as the existing skip link. Rechecked Overview→3D: active collection remained Overview and keyboard focus moved to `sci-evidence-workspace`.
- Tab End/Home navigation reached Coverage/Overview. Secondary view tools exposed all five retained actions. The morphology mode explanation expanded at 390px without horizontal overflow.
- Selected NMO 104003 in the actual interface: runtime reported geometry bytes verified and observed SWC rendered and visible. The same source remained selected after viewport resizing and disclosure expansion. This is a bounded presentation observation, not a new scientific validation.
- Interface CSS specifies 160–200ms color/fade transitions and a reduced-motion override; the three existing programmatic smooth-scroll calls now consult the motion preference. The browser tool offered no motion-emulation capability, so forced reduced-motion runtime behavior was not claimed.
- `npx tsc --noEmit` did not complete after approximately 14 minutes. Process sampling showed the main thread waiting on small dependency-file reads under `node_modules/undici/types`, with no compiler diagnostics. Stopped that owned process; type checking is **incomplete**, not passed.
- No automated test suite was run in this UI task. No commit or GitHub push was made.

Evidence: `qa/2026-10-04-academic-interface/` contains build logs, browser screenshots, input receipts and `verification-summary.json`. The type-check log is empty because the process produced no diagnostics.
