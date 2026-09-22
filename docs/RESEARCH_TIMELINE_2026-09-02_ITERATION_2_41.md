# Research timeline — iteration 2.41

Date: 2026-09-02  
Working label: `2.41.0-research.1`  
Parent: immutable 2.40, pinned at 206,354 bytes, file SHA-256 `5552cc8c46c35a26fbefed4090f4a2d0337eda2397639ea5eca807fdf4cf6d30` and canonical content SHA-256 `991885f465d6226ec9d23fe133238e62c32e253276b120ed54fd74a4a632b48f`  
Delivery mode: in-place localhost research upgrade followed by repository handoff; no new curator package and no full-project copy

## Outcome first

Iteration 2.41 closes the ordered queue UPG-200 → UPG-202 → UPG-201 → UPG-203 → UPG-204. It connects the interface to one verified active knowledge-base record, derives every canonical source denominator from the registry, exposes a presentation-only receipt when the selected record changes, admits the three Todd DAT `Cell Body` stacks only under a file-specific MBF semantic rule, and adds a conservative Cano-Gomez P56 multiome roster that classifies all source nuclei before admitting only exact `groups=CHOL_IN` rows.

The resulting live scope is 27 canonical sources, 34 record sets, ten exact cell/profile rosters plus one exact source-object set, 641 Research Explorer records, 387 molecular profiles and ten molecular namespaces. The native-contour catalog covers five DAT records and admits 48 source-native `LineLoop` objects / 2,379 vertices. Cano-Gomez contributes eleven source-local CHOL_IN profiles / 923 exact rostered nuclei from an all-nucleus audit of 169,345 source nuclei and 57 source-scoped groups.

These additions do not authorize a surface, membrane, biological volume, intracellular object, same-cell molecular link, cross-source canonical identity or atlas registration. The frozen curator 2.8 package and immutable 2.40 research manifest remain untouched.

## UPG-200 — one active-record loader

One tree-scoped provider now loads and verifies the Research Explorer index, resolves the canonical `focusKind:focusId` key, and publishes one active record to the search dossier, evidence card and visualization-authority panel. Every request increments a monotonic generation. A selection change synchronously hides the prior settled record; a late success or failure from an older generation cannot overwrite the current selection.

The three presentation roles no longer invoke their own index loader or independently resolve a record. This closes the old-record overwrite and content-cross-talk routes without claiming that two records are biologically related.

## UPG-202 — registry-derived denominators

The source, record-set, exact cell/profile-roster and exact source-object-set denominators are calculated from `data/research-source-registry-0.1.json`. The summary runtime is shared by the overview, Sources tab and registry panel. A stale-literal validator scans the application sources for the prior hard-coded compound displays and fails if a canonical denominator is reintroduced as a UI literal.

The four denominator units stay separate. A source-object set is not counted as a cell/profile roster, and the five-DAT native-contour catalog remains one exact source-object set rather than five cells or five types.

## UPG-201 — adjacent selection-delta receipt

After two adjacent selections both reach the verified-ready state, the interface may show a selection-delta receipt. It compares:

- the eight fixed molecular evidence slots, including status, row value, authority and exact locator;
- exact unchanged context rows only when both records share a source namespace;
- admitted cell-geometry, internal-object, fallback, registration and same-cell-link counts.

The receipt is a presentation audit only. Differences are not interpreted as development, biological transition, abundance change, molecular equivalence, morphology causation or same-cell evidence. A failed or superseded selection clears the pending comparison and creates zero relationship admissions.

## UPG-203 — Todd `Cell Body` false-flag interpretation

NMO 50424, 50394 and 50408 retain `sourceClosedFlag=false` on all 33 soma-named contours. The flag is not silently changed and is not used alone as closure authority. Each admitted object must pass all of the following file-specific gates:

1. the exact source DAT byte length and SHA-256 match;
2. the object name is exactly `Cell Body`;
3. the source object contains the empty-value `CellBody` presence property;
4. the pinned NeuroMorpho parser classifies the same ordered point array as `somaContour`;
5. the MBF documentation establishes the cell-body contour semantic used by this narrow rule.

This admits 8 loops / 427 vertices for NMO 50424, 14 / 768 for NMO 50394 and 11 / 709 for NMO 50408: 33 Todd loops / 1,904 vertices. Twelve `User Line` objects remain excluded because their biological meaning is unresolved. Combined with the two previously admitted records, the catalog contains 48 loops / 2,379 vertices across five records.

The objects remain unfilled source-native polylines. There are zero triangles, lofts, surfaces, membranes, volumes, internal structures, biological measurements, standardized-SWC overlays, same-cell joins or registrations.

## UPG-204 — Cano-Gomez stable source-local assignment roster

The Cano-Gomez pipeline receipts the three exact GEO RDS filenames, expected byte lengths, source SHA-256 values, ordered non-empty unique `meta.data` row names, contracted raw metadata columns and deterministic derivative hashes. A compound nucleus key is built as `GSE318731|exact source filename|row.name`. This key is stable inside this source audit; it is not a cross-assay, cross-source or biological same-cell assertion.

The all-nucleus audit partitions 169,345 nuclei across 57 source-scoped groups before any profile is admitted:

- only exact cholinergic rows with `groups=CHOL_IN` are confirmed, yielding 923 nuclei and eleven exact raw `neuron_types` profiles;
- 2,276 nuclei in the four exact cholinergic motor groups are excluded;
- `GABA_CSF-cN_Pkd2l1` is excluded from interneuron scope as a sensory class;
- every remaining GABA row stays ambiguous or projection-exception unresolved;
- every glutamatergic row stays projection/local-status unresolved;
- non-neuronal removal remains a source-level preprocessing statement because no per-nucleus flag is available.

The paper-reported 516 neuronal types are retained only for reconciliation. They are not treated as 516 interneuron types, forced to match the observed raw-label union or used as the interface denominator. Raw labels are preserved, including whitespace anomalies, and label tokens are not converted into markers.

The project bundles the derived all-nucleus audit, confirmed CHOL_IN nucleus roster and eleven-profile registry, not the multi-gigabyte source RDS files. The clean-room route does not claim verified cross-assay identity. Every Cano-Gomez profile has zero morphology, generated geometry, internal objects, projection assignment, same-cell links and atlas registrations.

## Files added in iteration 2.41

Active-record, dynamic-denominator and selection-delta contracts:

- `app/research-active-record.js`;
- `app/ResearchActiveRecordProvider.tsx`;
- `tests/research-active-record.test.mjs`;
- `tests/research-active-record-integration.test.mjs`;
- `app/research-source-registry-summary.js`;
- `scripts/validate-research-source-registry-denominators.mjs`;
- `tests/research-source-registry-summary.test.mjs`;
- `app/ResearchSelectionDeltaReceipt.tsx`;
- `app/research-selection-delta.js`;
- `tests/research-selection-delta.test.mjs`.

Todd 0.3 evidence and derivatives:

- `tools/build_neurolucida_native_contour_admission_catalog_0_3.mjs`;
- `data/neurolucida-native-contour-admission-catalog-0.3.json`;
- `schemas/neurolucida-native-contour-admission-catalog-0.3.schema.json`;
- `scripts/validate-neurolucida-native-contour-admission-catalog-0.3.mjs`;
- `tests/neurolucida-native-contour-admission-catalog-0.3.test.mjs`;
- the NMO 50424, 50394 and 50408 `*-mbf-cell-body-line-loops.json` derivatives under their existing source route-pack directories.

Cano-Gomez extraction, audit and registry:

- `tools/extract_cano_gomez_multiome_metadata.R`;
- `tools/extract_cano_gomez_rds_metadata.py`;
- `tools/extract_cano_gomez_rds_metadata_stream.R`;
- `tools/extract_cano_gomez_rds_metadata_stream.py`;
- `tools/cano_gomez_python_rdata_runtime-0.1.json`;
- `tools/patches/rdata-0.11.2-seurat-rds-parser.patch`;
- `tools/build_cano_gomez_p56_multiome_interneuron_registry.mjs`;
- `schemas/cano-gomez-p56-multiome-interneuron-registry-0.1.schema.json`;
- `scripts/validate-cano-gomez-p56-multiome-interneuron-registry-0.1.mjs`;
- the three Cano-Gomez extractor/registry tests and exact fixture specification;
- `public/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_all_nucleus_assignment_audit.csv.gz`;
- `public/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz`;
- `public/data/cano_gomez_p56_multiome_interneuron_v1/cano-gomez-p56-multiome-interneuron-registry-0.1.json`.

Immutable-parent and 2.41 envelope:

- `scripts/validate-research-iteration-manifest-2.40-snapshot.mjs`;
- `tests/research-iteration-manifest-2.40-snapshot.test.mjs`;
- `tools/build_research_iteration_manifest_2_41.mjs`;
- `schemas/research-iteration-manifest-2.41.schema.json`;
- `scripts/validate-research-iteration-manifest-2.41.mjs`;
- `tests/research-iteration-manifest-2.41.test.mjs`;
- `data/research-iteration-manifest-2.41.json` after the final deterministic build;
- this timeline.

## Files modified in iteration 2.41

The in-place integration modifies the existing focus consumers, Type Atlas, registry panels, Explorer builder/index/manifest, source registry and validators, native-contour runtime/viewer, upgrade queue/registry, styles, version pointers, package lock, README and current-test runner. Each modified file is captured by the 2.41 authoritative-input roster. No 2.40 manifest, 2.40 schema, 2.40 timeline or frozen curator 2.8 artifact is rewritten.

## Validation and closure record

The envelope is deliberately fail-closed. It does not contain hand-entered final file sizes or SHA-256 values for the Cano-Gomez production artifacts or the 2.41 manifest. The builder derives those receipts only after all live inputs exist and rejects any missing, duplicate, stale or mismatched input.

Iteration closure requires all of the following to pass:

- immutable 2.40 snapshot validation at the exact parent byte, file-hash, content-hash and 187-input receipts;
- deterministic Todd 0.3 rebuild and three exact derivative comparisons;
- Cano-Gomez registry schema, full audit/roster gzip receipts, 169,345-row decision partition and eleven-profile/923-nucleus checks;
- canonical source-registry validation plus zero stale denominator literals;
- byte-identical Explorer 1.13 rebuild with 21 source files, 641 records, 387 molecular profiles and ten molecular namespaces;
- UPG-200–204 completed in the deterministic 186-row upgrade registry;
- deterministic 2.41 builder `--check`, AJV 2020-12 schema validation, all 230 on-disk input receipts and mutation tests;
- the current research test suite, production build, frozen curator 2.8 verifier and live browser switching checks.

The generated manifest is intentionally absent while any production Cano-Gomez artifact, source-registry integration, upgrade status or version pointer is unfinished. Its final byte length, file SHA-256 and canonical content SHA-256 are reported by the builder and validator rather than predicted in this timeline.

## GitHub handoff boundaries

The source repository is prepared as a private research-code handoff, not as a replacement curator distribution. The owner-local `release/` directory remains Git-ignored, so a fresh clone does not contain the frozen 2.8 ZIP or companion digest and `npm run test:frozen-2.8` is expected to require those files to be supplied separately. The frozen archive is neither altered nor rebuilt in iteration 2.41.

The source checkout is currently supported on macOS and Linux only because checksum-keyed MICrONS asset filenames contain literal colon (`:`) characters that Windows filesystems cannot represent. This source-tree constraint must not be conflated with the separately archived frozen curator kit's launcher support. The root `output/` directory also remains Git-ignored because its local QA screenshots, logs and receipts are not release inputs and may contain machine-local paths; the current inventory does not establish that it contains a prohibited source object.

## File-specific rollback

Rollback is surgical and preserves both the frozen curator 2.8 package and immutable 2.40 manifest.

1. Remove only the new 2.41 manifest builder, schema, validator, test, generated manifest and this timeline. Restore the current-test runner's current pointer to 2.40, while retaining the 2.40 snapshot validator if later work still needs it.
2. Remove only the UPG-200 active-record runtime/provider/tests and restore the prior lookup sites in `AtlasPrototype.tsx`, `ResearchExplorer.tsx`, `ResearchFocusEvidencePanel.tsx` and `ResearchRecordModelReadout.tsx` to their exact 2.40 receipts.
3. Remove only the UPG-201 selection-delta runtime/component/test and its associated styles/provider wiring. Do not change the underlying eight-slot evidence contract.
4. Remove only the UPG-202 registry-summary runtime, denominator validator/test and derived-display edits. Restore the four affected UI displays to their 2.40 receipts without altering the source registry itself.
5. Remove the Todd 0.3 builder, schema, validator, test, catalog and three new geometry derivatives. Restore the native-contour runtime, viewer, route library, source registry and tests to the 2.40 catalog receipt, where the three Todd records are held at zero rendering.
6. Remove only the Cano-Gomez extraction/build/validation tools and the three production derivatives. Remove the Cano-Gomez profile record set, Type Atlas profiles and eleven Explorer records, then rebuild the registry and Explorer from the restored 2.40 inputs. Never delete or alter unrelated source files or temporary data owned by another workflow.
7. Restore UPG-200–204 to their exact pre-2.41 queue states and rebuild the upgrade registry; do not hand-edit the generated registry.
8. Restore `package.json`, `package-lock.json`, `app/layout.tsx`, `app/atlas-types.ts` and `README.md` to `2.40.0-research.1` and the 2.40 command pointers.
9. Re-run the immutable 2.40 snapshot tests and frozen curator 2.8 verifier. The rollback is complete only when their pinned receipts remain unchanged and the restored 2.40 application passes its own checks.
