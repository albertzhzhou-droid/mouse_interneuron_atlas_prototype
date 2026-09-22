# Research iteration 2.11 product audit

Date: 2026-08-27  
Target: existing localhost research workbench; desktop 1440×1000 and mobile 390×844.  
Design constraint: extend the existing dark-green morphology system; do not invent a new visual language or a biological diagram.

## Reference and change

The current product itself was the visual reference. The pre-change morphology view already made coverage and source-local boundaries visible, but placed nine filters, a 142-record list, one 3D viewer and a long evidence card into a dense three-column surface. Most morphology copy rendered at 7–9 px and several controls were 30–38 px tall. It could answer “inspect one reconstruction,” not “compare the admitted morphology landscape.”

![Before: individual-only morphology census](../output/research-iteration-2.11/audit/01-morphology-before.png)

The new surface preserves the same palette, borders, typographic family and evidence-state vocabulary. It adds one explicit two-view switch rather than another global route, then uses semantic cards and tables for record/cohort distributions. No decorative or procedurally drawn biological asset was added.

![After: paper-aware cohort phenotyping](../output/research-iteration-2.11/audit/02-morphology-cohorts-desktop.png)

![Same-viewport before/after morphology comparison](../output/research-iteration-2.11/audit/05-before-after-comparison.png)

## Audited flow

1. **Open Morphology from the Research Atlas — healthy.** The existing lane remains recognizable, and the census summary still leads with 142 indexed/QC-admitted records, 140 source-labelled 3D records, 94 diameter-enabled records, five papers, two archives and zero complete axons. A two-button view switch now separates individual source geometry from cohort phenotyping.
2. **Enter Cohort phenotyping — healthy.** The first screen states that the derivative is checksum-verified, contains 142 records and zero registrations, and uses repository records rather than animals/specimens/prevalence as the denominator. Cohort selectors expose paper, source label, 2D/3D, `n`, domain and integrity before any metric is interpreted.
3. **Compare distributions — healthy with scientific limit.** Selecting a metric updates minimum/Q1/median/Q3/maximum summaries. Per-source-type and root-node-centred Sholl tables remain scrollable and keyboard-focusable. These are descriptive source-stratum comparisons; the interface does not calculate a p-value, biological effect size or harmonized cross-paper difference.
4. **Return to an individual reconstruction — healthy.** The original lazy 3D source geometry, radius/skeleton modes, source-type toggles, metadata, missingness and provenance remain available. A new reproducible phenotype block adds the seven scalar metrics, peak Sholl shell and per-source-type values without replacing the admission audit.
5. **Restore and share the state — healthy.** `lab=morphology`, `morphologyView`, `morphologyNeuron`, both cohort IDs and the selected metric survive the top-level URL serializer. Reloading a URL does not create a scientific relationship.
6. **Mobile morphology use — healthy for this slice.** At 390×844 the view tabs, selectors, cohort cards and boundary cards stack to one column. Primary morphology controls are at least 44 px and body text is at least 12 px. The page has no page-level horizontal overflow; wide scientific tables have their own focusable horizontal scroll region.
7. **Failure behavior — healthy by automated proof.** An analysis manifest/hash/schema/denominator/dimensionality mutation is rejected. The individual source-record viewer remains usable and no derived value is substituted.

## Visual and interaction checks

- No clipped title, overlapping selector, broken card border or unexpected horizontal page overflow at the two tested viewports.
- The checksum badge, record denominator and independent-animal missingness remain visible without opening technical provenance.
- The dark analysis canvas maintains the existing contrast hierarchy: off-white primary text, teal evidence/verified accents, and ochre scientific-boundary warnings.
- Long DOI/domain strings wrap inside cohort cards rather than expanding the page.
- Morphology view tabs support Arrow Left/Right and Home/End. All primary selectors are natively labelled.
- Browser console errors: zero in the final tested cohort and individual states.

![After: selected record with reproducible phenotype](../output/research-iteration-2.11/audit/03-morphology-individual-analysis-desktop.png)

![After: mobile cohort phenotyping](../output/research-iteration-2.11/audit/04-morphology-cohorts-mobile.png)

## Limits of this audit

- No formal screen-reader session, automated contrast calculation, 200–400% zoom audit or physical touch-device test was performed.
- The morphology record list still exposes many tab stops; roving list focus remains part of UPG-053.
- The Research Atlas as a whole still has smaller text and controls outside the upgraded morphology surface.
- This audit did not resolve the cross-lane context problem: type selection and SCI evidence selection can still diverge. UPG-049 must introduce one explicit researcher focus before consolidating Gaps and Provenance.
- Researcher usability with domain experts remains pending; visual QA cannot validate scientific usefulness or interpretation by itself.
