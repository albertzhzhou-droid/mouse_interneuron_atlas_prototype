# I53 UPG-132 source-information candidate handoff

The scoped patch is `UPG132_I53_SOURCE_INFORMATION_INTEGRATION.patch`. It changes thirteen reviewed code/test files listed in `candidate-file-inventory.json`. Apply that patch against matching baselines; do not copy the entire proposed checkout, which contains read-only symlinks to existing project inputs for shadow testing. No shared project files were edited by this subagent.

## Exact additions outside the code patch

Copy from `/private/tmp/ohri-source-next-i52-russ-20261004/`:

- `derived/russ-spinal-information-adapter-0.1.json` to `data/russ-spinal-information-adapter-0.1.json`.
- `derived/russ-spinal-information-derivation-receipt-0.1.json` to `data/russ-spinal-information-derivation-receipt-0.1.json`.
- `extract_russ_spinal_information_adapter_0_1.py` to `tools/` with the same basename.
- `test_russ_spinal_information_adapter_0_1.py` to `tests/` with the same basename; its documented three RUSS_ environment parameters support relocated source/output/extractor paths.
- The input manifest plus exactly its four named files to `data/source-candidates/russ-spinal-information-20261004/`. The four are the two publisher XLSX files, source article XML and unchanged old taxonomy input copy. No exploratory workbook is required; no source workbook or matrix belongs in `public/`.

Original `data/russ-harmonized-taxonomy-crosswalk-0.1.json` must remain byte-identical. Its 69 labels, old top-three Wilcoxon markers and 65 candidate scope remain unchanged.

## Current record denominator reconciliation

The current root's base search index is 641 records, with 387 molecular profiles and 69 Russ profiles. Runtime adds 32 verified supplemental morphology records, giving the displayed 673. This candidate keeps every current base key; all 572 non-Russ base records are identical. The existing supplemental loader is unchanged, and its tests against the candidate explicitly pass the 673 merged-record assertion. See `I53_CURRENT_ROOT_RECORD_PARITY.json`.

The candidate current base index becomes asset/schema identity `1.14.0`, with 22 checked inputs. Regenerate the actual root index and compressed transport after integration; the shadow outputs are validation evidence, not a replacement for post-integration root generation. The shadow index SHA is `c1fb786da4a1624b28fbe4c9c7063eb0f108b6a12e91d082008f1c7102e17085` (12,327,624 bytes).

## Parent-owned updates and checks

1. Add the new validator to `package.json` and the current test runner/manifest checked inputs. Keep the Python source tests with explicit relocated source/extractor/output environment variables as documented in the earlier integration plan.
2. In `SRC-RUSS-2021` source registry, add this derived information asset with its verified SHA/size and primary source references. Add the 19,353 captured sequencing observation unit with explicit six-study scope if needed. Keep source population count 69, source record sets and no-roster child ref unchanged. Remove only the obsolete missingness clause that says population counts are absent; individual identities are still absent. Keep GEO object rights unverified and matrices unbundled.
3. Update upgrade/iteration docs and registries around the achieved factual information scope. This preparation does not revalidate the separate GEO cells/features pins, approve matrix redistribution or finish the broader UPG-132/M4 Goals.
4. Regenerate transport/manifest/runtime receipts and adjust active transport byte-size/content-length tests. The former active decoded/gzip sizes 10,682,233 / 269,594 are stale for this new index. Preserve historical snapshots; explicitly resolve any active reused 2.41 builder/validator assertion that still fixes 1.13/21.
5. Run root build, typecheck/lint, source/explorer/registry/denominator/manifest validators, source tests and actual browser/export cases. The source-page UI keeps `source_population` record semantics; it displays captured cells/nuclei with a named denominator. Its ten adult panels are separate shared study context. The existing ready-generation and zero-geometry authority remain unchanged.
6. Verify comparisons exported while selected/baseline/compared Russ rows appear anywhere retain the global attributed Russ context. The candidate condition covers all three. Scientific dossier JSON/CSV now contains the indexed panel facts, locators, hashes and 2,371/2,894 unresolved difference.

## Verified temporary scope

- Exact offline source replay and source-byte/extractor/output receipts pass.
- All 53 affected Node tests pass, including source/scientific contract, 69-profile completeness, ten-panel shared evidence, ready-generation dossier CSV/JSON, index validation, selection delta and the current runtime 673-record merge. Log: `I53_NODE_TESTS.log`.
- Full TypeScript no-emit check passes.
- Scoped patch dry-run applies cleanly to captured baselines.
- ESLint did not produce a completion result in two silent runs; those runs were stopped. No lint success is claimed. Browser and full release build were not run during this temporary preparation.

Source count matrix, individual GEO/nucleus roster, geometry, internal objects, same-cell joins, registrations and exact lineage admissions remain zero. Table1 N/A/blank/zero, raw individual marker strings and annotation conventions, panel raw strings/colors, cumulative pair proportions and unresolved adult source discrepancy remain retained.
