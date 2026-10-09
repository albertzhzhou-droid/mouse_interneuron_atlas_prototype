# UPG-173 next source information slice

This candidate implements the already-declared UPG-173 aggregate adult lumbar Shox2/Chx10 electrophysiology lane. It uses retained exact original public source bytes and preserves the current dedicated website layout. It is a temp-only candidate; no shared project file, queue status, runtime manifest or source registry has been changed by this agent.

## Controlling scope and source gates

`docs/RESEARCH_MODEL_UPGRADE_QUEUE.md` UPG-173 and `docs/UPGRADE_COVERAGE_2026-09-29.md` explicitly call for the small Data Sheet 1 object and source-derived adult lumbar aggregate tables. The controlling queue currently says planned. The new source bytes change that next action: source identity and licence are now verified, so this bounded information adapter can be implemented and inspected.

- Exact public supplement: Figshare article 20428674, file 36551718; DOI `10.3389/fncir.2022.957084.s001`; 687,234 bytes; publisher/locally computed MD5 `cd540639b14fda1fd1149b235384b795`; SHA-256 `7ef955d8378020d95eeff07be83ad0c602699337fdb89b79f6796c3e96b845e2`.
- Primary article: DOI `10.3389/fncir.2022.957084`; PMID 35991345; PMCID PMC9385948; retained official Europe PMC full-text XML 228,780 bytes, SHA-256 `b997e9c1565ba55dd361dcf47ac315883a9d1108c55d74c48db87f70f8bb7517`.
- Exact asset metadata: public Figshare API article 20428674; 35,029 bytes; SHA-256 `ea6183d6e34233889e2900b14d980ad61edaf28f616052291bfaefac2406d865`; asset licence explicitly CC BY 4.0.

No authentication, cookie/challenge work, author contact, full large archive, source-code execution or statistical reanalysis was used. The original DOCX remains byte-identical; both rendered pages were visually inspected. Those rendered pages are reading QA, rather than website browser evidence.

## Scientific content and limits

Four supplementary tables each contain twelve membrane properties: 192 published mean ± SD summaries and 48 source-reported comparisons. The four alternative partitions refer to the same 171 recorded neuronal observations, comprising 143 Shox2 and 28 Chx10 observations. Their group counts are `[143,28]`, `[88,49,24,10]`, `[23,11,68,69]`, and `[15,20,32,25,27,52]`; do not add these partitions to create a 684-observation cohort. The article's eight reporter-by-firing counts are also retained as attributed aggregate context, with exact table-header locators.

The source reports 51 Shox2 reporter mice and 6 Chx10 reporter mice, and reuse of 60 Shox2 recordings from 28 of those Shox2 mice. This reuse is a subset. It is not an additional cohort. Individual cell-to-animal assignments, individual age and sex metadata remain unavailable in the adapter's retained scope. The source age range is 8–25 weeks and lumbar slice scope L2–L5.

All raw labels, mean/SD strings, test strings, p annotations, unit labels and table-row-column locators are retained. Normalized fAHP amplitude and F/I slope have no printed table unit and remain null. The printed Methods capacitance expression `Cm = Rin/τ` remains attributed raw text; it is not corrected or used to calculate values. The immunostaining account reports six Chx10-positive observations but lists four in the k-group sentence; the unresolved discrepancy is retained and no missing assignment is inferred.

This adapter creates zero molecular profiles, physical-cell roster rows, morphology objects, atlas coordinates, same-cell cross-source joins, REG entries, M2 admissions or M4 admissions. The k/H labels are analytical partitions. No raw trace, ABF file or Supplementary Figure 1 image is bundled in this adapter scope. No universal claim that every possible deposit lacks such material is made.

## Integration ownership

The exact list and preimages are in `UPG173_CANDIDATE_OWNERSHIP.json`. Only one current shared file is owned: `app/AdditionalResearchEvidence.tsx`. Its change adds one lazy native-details panel and one fragment entry, retaining all four existing additional workspaces and their focus/hash behaviour.

New files are the panel/helper/type/CSS, source facts and derivation receipt, exact original source cache and acquisition receipts, extractor, schema, validator and focused Node/Python source checks. Symlinks in `proposed` exist only for read-only validation; they are not patch or copy targets. `proposed/eslint-candidate.config.mjs` is QA-only and also excluded.

The existing page wrapper and SiteNavigation remain the integration context. The new panel belongs at `/explore/cell-types/additional#garcia-ramirez-physiology-panel`; no homepage, page wrapper, SiteNavigation, active Explorer index, molecular-profile registry, cell roster, frozen snapshot or source-object route is replaced.

Parent-owned closure after intake:

1. Save the one current preimage and sixteen new-path absence receipts before applying the exact candidate.
2. Add package validation command `validate:garcia-ramirez-physiology` -> `node scripts/validate-garcia-ramirez-physiology-0.1.mjs` and place it in the current research-validation chain. Ensure `tools/run_current_research_tests.mjs` discovers the focused Node test; run the source Python test explicitly if that runner does not discover Python.
3. Admit the new owned source/data/schema/tool/test/UI files to the current 2.91 implementation manifest builder, preserving all current dependency pins and frozen snapshots. The facts helper's imported data/receipt and panel CSS are runtime inputs; original DOCX/XML/metadata, extractor/schema/validator/tests and acquisition receipts are derivation/implementation evidence inputs. No new Ronzano renderer source authority is implied.
4. Add source-registry metadata only as a study-level aggregate electrophysiology source asset, with CC BY 4.0, the three exact pins, one named 171-recorded-observation denominator, separate 51/6 animal cohorts, and subset 60-recording/28-mouse reuse. Do not create a `bundled_exact` physical-cell roster or molecular profile set. If current registry conventions cannot express a pure study aggregate, retain the local panel's exact source facts and avoid inventing a registry roster type.
5. Update the current UPG-173 queue only after code/actual dedicated-route acceptance. Keep the implemented aggregate scope explicit and retain the absence of raw trace/per-cell/morphology/REG evidence. Reword the old universal missing-deposit assertion as an adapter-scope boundary. Do not count roadmap completion merely because the source intake passed.
6. Regenerate the current queue-derived registry and manifests, run the appropriate current suite, and save actual browser/download evidence.

## Reproducible validation

The extractor is network-free and pins its three input files before parsing:

```sh
python3 tools/extract_garcia_ramirez_physiology.py \
  --input-dir data/source-candidates/garcia-ramirez-physiology-20261004 \
  --output-dir /private/tmp/ohri-upg173-replay
node scripts/validate-garcia-ramirez-physiology-0.1.mjs
node --test tests/garcia-ramirez-physiology.test.mjs
python3 -m unittest tests/test_garcia_ramirez_physiology_0_1.py
```

The Python replay compares both resulting files byte-for-byte with the retained candidate, independently checks every raw original table cell and Methods locator, and rejects one changed source byte before any output. The Node validator checks schema, semantic denominators/units/admission boundaries, original file lengths and hashes, licence/MD5, derived-data hash and extractor hash. Focused counterfactual tests reject pooled denominators, filled unknown animal counts, false reuse scope, SD-to-SEM changes, invented mV, wrong source row/frame, added cell/profile/REG evidence and statistical reanalysis.

## Actual dedicated-route browser acceptance

Use the normal current website and current production-like runtime. Save exact URL, build/input pins, console errors, viewport and download bytes beside each result. Do not turn unit/SSR checks into observed browser claims.

1. At desktop 1280×900, open `/explore/cell-types/additional#garcia-ramirez-physiology-panel`. Confirm current SiteNavigation/page wrapper still present, native details auto-open, summary receives keyboard focus, and lazy panel resolves without layout or console failure. Confirm all existing additional-workspace summaries remain reachable.
2. Confirm the displayed 171 denominator, 143/28 reporter split, 8–25-week age and L2–L5 source scope. Check reporter ST1, firing ST2, k-means ST3 and hierarchical ST4 in the native selector. Each table has twelve source-property rows, correct group labels/counts, published raw mean ± SD and original test/p annotations. All alternatives still reference 171 observations.
3. Search `input resistance`, then `F/I`. Confirm one matching row and exact URL `physiologyTable`/`physiologyQuery` fields. Confirm unrelated route/query choices and fragment survive. Search `unknown-property`, confirm zero rows and clear-field guidance; clear it to restore twelve rows.
4. Open the animals/context, source statements and exact source field details. Confirm 51/6 mice and 60-from-28 prior-study reuse are separate, sex/cell-to-animal mapping are unknown, normalized fAHP and F/I units remain missing, held capacitance formula and 6-versus-4 discrepancy are readable, and no invented roster or type mapping is offered.
5. Export from ST4 with the `rheobase` search. Read the actual downloaded JSON: exactly four complete tables, all 192 summary values, 48 comparisons, named 171 denominator, three source pins/derivation receipt/rights and current selected ST4/visible-property context. Export explicitly states zero new profiles/roster/geometry/joins/REG, `actualViewCaptured:false`, and `sourceInputsFetchedDuringThisExport:false`. This is a facts export, not a private render/camera proof.
6. Load unknown `physiologyTable=ST5`, empty selector, and duplicate ST1/ST4 selectors with the panel fragment. Confirm a clear unknown/ambiguous-selection message, no fallback source table, disabled export, and explicit choice recovery. No silent default table is shown for invalid input. An absent selector defaults to the exact source reporter table ST1.
7. Keyboard-only: activate the outer summary, grouping selector, property input, export button and local table-overflow region. Verify visible focus and no keyboard trap. Close/reopen the lazy panel and reload the URL; restore the current exact source table/search from the URL. Exercise browser back/popstate with explicit history entries for ST1 and ST4.
8. At mobile 390×844, confirm controls stack, labels and all limit/source details remain readable, long source hashes wrap, the table scrolls within its labelled focusable region, and the whole page does not acquire horizontal overflow. Capture representative ST1 and ST4 narrow screenshots.
9. Verify the current molecular-profile and Explorer record counts do not increase because of this aggregate adapter. Confirm no selectable physical cell, anatomy rendering, internal structure, canonical type, source-cross-identity or atlas placement is newly exposed.

If actual route or export acceptance fails, fix the scoped implementation and repeat affected acceptance before queue completion. No approximation, synthetic trace or guessed morphology is an acceptable fallback.
