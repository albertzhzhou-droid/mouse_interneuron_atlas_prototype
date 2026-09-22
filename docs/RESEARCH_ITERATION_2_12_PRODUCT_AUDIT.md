# Research iteration 2.12 product audit

Snapshot date: 2026-08-27  
Scope: UPG-049 Research Explorer and controlled research focus

## Audit status

The source and automated interaction contracts are healthy. Current-run post-change visual acceptance is pending because the in-app Browser URL policy blocked the already-open localhost tab immediately after the development server restart. The audit did not switch to another browser or use a headless workaround. Consequently, this document does not claim a visually verified desktop/mobile release or a valid same-viewport after screenshot.

The current-turn pre-change 1440 × 1000 reference is retained only as a baseline:

![Pre-change Research Atlas overview](../output/research-iteration-2.12/audit/01-baseline-overview-desktop.png)

## Audited steps

| Step | Journey | Health | Evidence | Remaining check |
|---:|---|---|---|---|
| 1 | Open the Research Atlas default view | Healthy in SSR/code | Explorer heading, 339-record denominator and grouped-search controls server-render before the SCI workspace | Current-run post-change desktop screenshot |
| 2 | Verify local index before showing records | Healthy | Browser component verifies manifest identity and index SHA-256; standalone validator recomputes all nine input hashes | Observe loading/error transition in the in-app Browser |
| 3 | Search label, marker, DOI/PMID or accession | Healthy in deterministic tests | Literal search/ranking tests; `Vsx2` remains separate across source namespaces | Live keyboard/input test |
| 4 | Select one grouped result | Healthy in state contract | One canonical `(focusKind, focusId)` pair; namespace-qualified IDs; no relationship creation | Live focus styling and scroll behavior |
| 5 | Read Summary, Evidence, Gaps and Provenance | Healthy in code contract | All four tab controls and panels carry the same focus attributes; unknown focus renders explicit unavailable state | Current-run desktop and screen-reader inspection |
| 6 | Open the source-specific workspace | Healthy in component contract | Focus navigation maps to type, anatomy, morphology or coverage lane and preserves the same canonical ID | Live transition/reload test |
| 7 | Filter a focused record out of a lane | Healthy in SSR/unit contract | SCI, morphology and coverage preserve the focus and display an explicit retained-outside-results message | Live verification for each lane |
| 8 | Share/reload canonical URL | Healthy in parse/serialize and SSR tests | Canonical focus round-trip, legacy migration and canonical focused-type SSR | In-app Browser reload/popstate test |
| 9 | Use desktop layout at 1440 × 1000 | Pending visual acceptance | Responsive two-column result/dossier CSS and 44 px controls are present | Same-state after screenshot and visual comparison |
| 10 | Use mobile layout at 390 × 844 | Pending visual acceptance | Explorer, controls, dossier tabs and detail grids collapse through 980/720/460 px breakpoints | Current-run mobile screenshot, overflow and touch-target inspection |
| 11 | Keyboard/accessibility pass | Partially healthy | Home/End and arrow handling exists for research and dossier tabs; inputs are labelled; status/error semantics are present | Screen reader, 200–400% zoom, contrast and actual keyboard traversal |

## Design changes

- The Research Explorer now precedes the older lane map so researchers can begin with a record, marker, paper or accession rather than choosing a subsystem first.
- A left source-results browser and right source-locked dossier use the existing green/ink/amber design system.
- The 339 denominator is broken down into the five heterogeneous record kinds so it is not presented as an interneuron count.
- The boundary card stays above the dossier tabs; technical hashes are collapsed under Technical provenance.
- Result buttons are at least 64 px high, controls and tabs at least 44 px, and main text is 11–13 px in the new flow.
- Mobile layouts collapse to one column and convert the four dossier tabs into a 2 × 2 grid at 460 px.

## Visual acceptance blocker

The pre-change screenshot was captured in the in-app Browser before implementation. After the dev-server restart, the Browser connector rejected localhost tab inspection under its URL security policy. Because switching to another browser would violate the selected-browser contract, no post-change screenshot or combined before/after comparison was fabricated. The next audit must reopen the localhost page in the in-app Browser, capture 1440 × 1000 and 390 × 844 states, inspect both images, and update steps 2–11 from pending/partial to observed health before calling the visual release complete.

## Evidence limits

This audit is not researcher usability testing and does not include screen-reader output, formal contrast calculation, browser zoom, physical touch-device testing or independent scientific review. Automated success cannot establish visual quality or scientific validity.
