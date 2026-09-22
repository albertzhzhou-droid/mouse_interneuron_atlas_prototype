# Research iteration 2.13 product audit

Snapshot date: 2026-08-27  
Scope: UPG-064 Matson neuronal SCI time course and 356-record Research Explorer

## Audit status

The 2.13 source/state/SSR contracts, production build, lint and full working-tree regression suite pass. A current-run in-app Browser audit covered the source-local SCI journey at 1440 × 1000 and 390 × 844, inspected the resulting images, exercised literal marker and GSM search, switched discrete timepoints, checked canonical URL state, expanded a source conflict and traversed research tabs by keyboard. The final browser console contained zero warning/error entries.

The mobile audit found two genuine layout defects before acceptance: a grid min-content track expanded the SCI panel to 704 px inside a 364 px container, and missing-evidence camelCase keys were not separated for display. The grid tracks now use `minmax(0, 1fr)` at the relevant breakpoints and the readable-label helper splits camelCase. The repeated 390 px audit reports `clientWidth === scrollWidth` for the root and Research Lab, and all 33 audited SCI buttons, inputs, selects and conflict summaries are at least 44 px high.

No screenshot or automated result is treated as biological validation, formal accessibility certification or researcher usability evidence.

## Audited journey

| Step | Researcher journey | Expected evidence | Acceptance state |
|---:|---|---|---|
| 1 | Open the Research Atlas default view | Explorer reports 356 heterogeneous source records and a zero-join boundary before the 3D workspace | Observed healthy at 1440 × 1000 |
| 2 | Search a retained marker or GSM | `Gal` resolves the local Pdyn record; `GSM5243310` returns 17 records in the one Matson namespace without creating a join | Observed healthy; deterministic tests pass |
| 3 | Open the Pdyn SCI population | Canonical `sci_population` focus opens the SCI lab without changing source identity | Observed healthy; SSR/state tests pass |
| 4 | Switch 3 wpi → 6 wpi → 3 wpi | Each discrete control updates `sciTime`; restored 3 wpi shows D-25/GSM5243310 and the two sibling replicates | Observed healthy |
| 5 | Inspect population dossier | Source label, subclass, annotation method, ranks 1–3 and exact counts remain visible | Observed healthy at desktop and mobile |
| 6 | Inspect missing evidence | Coordinates, neurite geometry, atlas placement, same-cell tracing and synaptic edges remain unavailable | Observed healthy; camelCase display defect corrected |
| 7 | Inspect conflicts | All six declared source discrepancies remain visible; conflict 001 exposes both statements and the no-silent-selection decision | Observed healthy |
| 8 | Export a receipt | Receipt retains source hashes, focus, timepoint and zero-registration boundary | Component/data contract and lint pass; download click not included in this audit |
| 9 | Reload/share canonical URL | Focus and discrete timepoint survive URL parse/serialize and explicit reload | Observed healthy; state/SSR tests pass |
| 10 | Use 1440 × 1000 and 390 × 844 layouts | No root/Lab horizontal overflow; source frame, controls and dossier remain readable; 33 audited interactive targets meet 44 px | Observed healthy after mobile grid correction |
| 11 | Use keyboard research-lane navigation | End selects Coverage, Home restores Overview, ArrowRight selects Types | Observed healthy |

## Design changes

- A dedicated SCI States tab sits alongside Types, Morphology, Atlas, Conditions and Coverage.
- A four-card source frame prevents the 17-population list from being read without the 15-cord, five-condition and 23,651-neuronal-nucleus denominators.
- Time is controlled by six explicit buttons—All plus five sampled conditions—rather than an interpolating slider.
- Population controls separate literal search from transmitter/source class and preserve an out-of-filter canonical focus.
- The dossier places supported source fields beside an equally prominent unavailable-evidence list.
- Ranked marker positions are displayed as ranks, followed immediately by their no-score/no-p-value boundary.
- The selected-condition audit exposes all three source samples and denominators rather than hiding them behind an aggregate chart.
- RAG/spinocerebellar context and source discrepancies are separate sections so they cannot appear as ordinary population fields.
- Responsive rules collapse source cards, filters, replicates, dossiers and the discrepancy ledger to one column on narrow screens; interactive controls keep a 44 px minimum height.

## Scientific display overrides

- No inferred cell body, dendrite, axon, synapse, atlas point or injury trajectory is rendered for a Matson population.
- Counts are labelled captured nuclei and never abundance, frequency or prevalence.
- The 17 labels remain source-local label-transfer families.
- Motoneurons remain context; the 16 other populations are not relabelled confirmed interneurons.
- One canonical focus and one selected condition drive all displayed panels; invalid focus IDs fail closed.
- Six conflicts remain inspectable; UI clarity cannot be obtained by suppressing contradictory source statements.

## Remaining product checks

- Complete live keyboard traversal through every timepoint, search, population-list and discrepancy control; the research-lane Home/End/Arrow sequence is observed.
- Live receipt-download inspection; its component and data contract currently pass.
- Screen-reader output, 200–400% zoom and formal contrast measurement.
- Physical touch-device verification and independent researcher usability testing.

## Verification record

- `npm run build`: passed; Vinext emitted its existing chunk-size advisory and route-classification notice.
- `npm run lint`: passed with zero findings.
- Focused Matson, Research Explorer, morphology and SSR suites: passed after the final source/UI changes.
- `npm test`: 229 tests discovered; 227 passed, zero failed and two existing release-lock checks skipped by design.
- Matson validator: 17 populations, 15 samples, five conditions, 23,651 neuronal nuclei, zero registrations.
- Research Explorer validator: 356 records, zero registrations, SHA-256 `beb6767e8f6a2c4c49445b7253696015d37b2cb6d4a8a33a90338530a9053290`.
- Desktop layout: 1440 px root/client and scroll width; console warning/error count zero.
- Mobile layout after correction: 390 px root client/scroll width; 364 px Research Lab client/scroll width; zero audited controls below 44 px.

## Current-run visual evidence

- [Desktop SCI source frame](../output/research-iteration-2.13/audit/01-matson-pdyn-3wpi-desktop.png)
- [Desktop Pdyn dossier and three-replicate audit](../output/research-iteration-2.13/audit/02-matson-pdyn-dossier-desktop.png)
- [Desktop source-conflict ledger](../output/research-iteration-2.13/audit/03-matson-source-conflicts-desktop.png)
- [Mobile Research Atlas header](../output/research-iteration-2.13/audit/04-matson-pdyn-3wpi-mobile-top.png)
- [Mobile SCI source frame after overflow correction](../output/research-iteration-2.13/audit/05-matson-pdyn-3wpi-mobile-sci.png)
- [Mobile timepoint and filter controls](../output/research-iteration-2.13/audit/06-matson-pdyn-3wpi-mobile-controls.png)
- [Mobile source-local Pdyn dossier](../output/research-iteration-2.13/audit/07-matson-pdyn-dossier-mobile.png)
- [Desktop 356-record Research Explorer](../output/research-iteration-2.13/audit/08-research-overview-desktop.png)

A green automated suite and a current-run visual audit do not establish biological validity, independent scientific review or curator approval.
