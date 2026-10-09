# UPG-047 bounded connection-evidence display

Date: 2026-09-30. Scope: independently implemented display/helper/export/tests; shared route, upgrade queue, registry, main plan and release manifest remain integration-owner files.

This display reads only three already admitted contracts: `research-mvp-release-0.2.json`, `hayashi-v2a-source-taxonomy-0.1.json`, and `ronzano-premotor-position-reference-0.1.json`. No new source discovery, download, biological inference, tracing reconstruction, cell partner or geometry was added.

## Implemented behavior

- `app/ConnectivityAssertionWorkbench.tsx` is a default, no-props component, ready for a lazy Overview import. Its helper is `app/connectivity-assertions.js` with `app/connectivity-assertions.d.ts`; its independent styles are `app/connectivity-assertion-workbench.css` plus the existing source-audit base stylesheet.
- The bounded catalog contains 16 source assertion contexts: eight existing SCI claims split into their 13 exact experimental conditions (12 functional influence, one human association/feasibility of unknown connectivity), two Hayashi major-type projection contexts, and one Ronzano pooled tracing context. Repeated conditions are assertions, not independent neurons, animals, synapses or additional publications.
- The five-category legend distinguishes direct monosynaptic, functional influence, projection overlap, computational proximity/ligand–receptor, and unknown connectivity. Current exact-source/target cell edges are zero; synapse count is unknown. Zero direct monosynaptic, projection-overlap and computational-prediction category rows describe this adapter's three-contract scope, not biological absence or the complete source literature.
- Each SCI condition displays its own existing `resultSummary`, intervention, causal test, measurement, injury, age, species, control and original missingness. The complete-T8 CLP290 negative result is not relabeled by the parent staggered-lesion positive claim. Original parent grades remain parent-scoped; no new per-condition causal grades are assigned. Neonatal/adult transmitter experiments and all four P09 mouse manipulations remain separate.
- The human P09 association retains its original source claim but has no assigned mouse population identity or causal cell edge. Hayashi's P0 pooled-sequencing age is not transferred to its separate population tracing context. Ronzano's delta-G rabies context and coordinate-file receipts remain tracing-group context; no coordinate proximity or group membership generates a connection.
- Category, source, species, age and text/method/locator filters are available. Filtering away a selected assertion clears the detail panel, highlight and selected export; no fallback selection occurs.
- Filtered JSON/CSV and selected JSON contain unchanged admitted source objects, exact contract/claim/condition/statement locators, article URLs, methods, missingness and the category explanation. Duplicate, unknown or modified records are rejected before export. Browser filenames use `connectivity-N-exact-assertion-contexts.json` / `.csv`.

## Completion boundary

The existing-data display and exact export gap is addressed. The missing biological inputs remain missing: no exact source/target cell keys or synapse roster, no admitted direct monosynaptic assertion in this adapter, no explicit projection-overlap assertion, no computational prediction contract and no source-to-source cell join. UPG-047 must not be presented as completion of a connectome, synapse dataset, direct partner map or all upstream scientific requirements.

## Verification

Targeted verification: `node --test tests/connectivity-assertions.test.mjs` passed 6/6; lint passed for the new component, helper, declarations and tests. TypeScript reported no errors in these files; the latest complete check was temporarily blocked by the concurrently created `AdditionalResearchEvidence.tsx` importing the not-yet-present `AtlasSamplingSensitivityPanel`. Parent integration owns the completed TypeScript rerun, rendered browser checks and complete release validation after the lazy route is added.
