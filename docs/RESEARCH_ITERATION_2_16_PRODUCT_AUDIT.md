# Research iteration 2.16 product audit

Audit date: 2026-08-27  
Browsers/viewports: Codex in-app browser at 1440×1000 and 390×844  
Primary state: Häring Glut7 deep link under the Type Evidence lab

## Outcome

The new four-source information model is usable at both audited breakpoints. The overview, Type Evidence atlas, Häring deep link, curation denominators, and explicit missingness remain legible without horizontal page overflow. Browser console inspection returned zero errors in every captured state. This was a focused product audit, not a formal WCAG, screen-reader, contrast-ratio, performance, or cross-browser certification.

## Numbered researcher flow

1. **Orient from the overview.** The first information view states that 153 records are source populations across four studies, not unique biological types, and displays `0 REG` before the independent 3D workspace.
2. **Search the exact source.** Entering `GSE103840` in the Research Explorer returns 31 records across two namespaces: 30 Häring molecular profiles plus one separate coverage-source record. Co-occurrence does not create a biological join.
3. **Open a stable profile link.** The Glut7 state retains `lab=types`, `focusKind=molecular_profile`, and the namespace-qualified `focusId=haring-2018:GSE103840:Glut7` in the URL.
4. **Inspect source-native detail.** The dossier exposes the source namespace, accession, dorsal region, excitatory class, P17–P28 normalization, 104 sampled cells, raw label `Glut_Tac2_1`, Table 5/8 marker context, exact count boundary, and the local-interneuron-versus-projection-neuron uncertainty.
5. **Audit denominators before interpreting the cluster.** The internal cards retain 28 animals → 1,545 sampled cells, the 1,639 → 1,545 curation flow, exact selected-profile age/sex-code/strain cell-column summaries, and two-animal/six-section population spatial context.
6. **Read unavailable axes and conflicts.** Morphology, xyz, SCI context, registration, projection, electrophysiology, and same-cell links remain unavailable. Four source discrepancies are shown without silently selecting a preferred narrative.

## Current-run visual evidence

### Desktop overview — 1440×1000

![Desktop research overview](../output/iteration-2.16-product-audit/overview-desktop-1440x1000.png)

### Desktop Glut7 dossier

![Desktop Glut7 dossier](../output/iteration-2.16-product-audit/haring-glut7-detail-desktop-1440x1000.png)

### Desktop internal evidence and curation

![Desktop Glut7 internal evidence](../output/iteration-2.16-product-audit/haring-glut7-internal-evidence-desktop-1440x1000.png)

### Mobile overview — 390×844

![Mobile research overview](../output/iteration-2.16-product-audit/overview-mobile-390x844.png)

### Mobile Glut7 selection and identity boundary

![Mobile Glut7 dossier](../output/iteration-2.16-product-audit/haring-glut7-mobile-390x844.png)

### Mobile internal evidence and curation

![Mobile Glut7 internal evidence](../output/iteration-2.16-product-audit/haring-glut7-internal-evidence-mobile-390x844.png)

## Measured layout and interaction checks

| Check | Desktop | Mobile |
|---|---:|---:|
| Viewport | 1440×1000 | 390×844 |
| Document scroll width | 1440 px | 390 px |
| Horizontal overflow | None observed | None observed |
| Console errors | 0 | 0 |
| Overview count | 397 exact source records | 397 exact source records |
| Deep-link selection | Glut7 resolved | Glut7 resolved |
| Curation flow in DOM | Present | Present |

## Remaining product limitations

- The Type Evidence dossier is deliberately long because denominators, missingness, locators, and conflicts are not collapsed into a misleading summary. A future evidence-lane navigator can reduce scrolling without hiding those fields.
- This audit did not certify full keyboard traversal, screen-reader announcement order, color contrast, reduced-motion behavior, WebGL performance on low-end hardware, or browsers other than the in-app Chromium surface.
- The main 3D causal-evidence lane still uses synthetic cell-like glyphs. They are labeled `SYN`, but their sphere-like somata remain too abstract for the new model-precision requirement. The next rendering cycle must separate population evidence, observed SWC morphology, and any educational cell-interior reference so that visual detail never implies a nonexistent cluster-specific reconstruction.
