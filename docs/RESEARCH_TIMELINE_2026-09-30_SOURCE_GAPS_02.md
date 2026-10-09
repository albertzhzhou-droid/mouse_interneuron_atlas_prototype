# Crozat experiment-family observation implementation

Authorization: the user requested implementation of the upgrade MD. The integrator assigned UPG-175 after precise UPG-254/253/247 source work. Historical planning words are document context. This worker owns independent source/browser/test files; package, queue, registry, main plan and shared routing remain with the integrator.

Date: 2026-09-30, America/Toronto. No public publishing, third-party messages or author requests.

## Implemented scope

The pinned [Figshare version 2](https://doi.org/10.6084/m9.figshare.29430869.v2) explicitly permits CC BY 4.0 reuse. Retrieved 24 small XLSX files, six original analysis Rmd files, the versioned API manifest and the [primary article](https://www.nature.com/articles/s42003-025-08559-x). All 32 inputs have byte counts/SHA256; deposited files also match publisher size/MD5. Sanitized HTTP headers contain date/type/length/etag/modified metadata only. Source scripts are read, never executed.

The original analysis scripts explicitly identify **23 declared tables**, covering passive/RMP, sodium/potassium/calcium currents, GABA/glycine/acetylcholine/glutamate responses, antagonist inhibition, calcium-current modulation, baseline PKD2L1/pH5/pH9, spiking, depolarization and ASIC current. Downloaded `INa.xlsx` is not substituted for the script's `InhNa.xlsx`. Other subtype/antagonist/normalized/statistics/anatomy files remain outside this declared subset; this is not whole-deposit coverage.

The parser yields **2,115 separate-table source observation rows**, retaining file ID/name/hash, native sheet/row, native label where present, raw region/condition/values, units and metric cell locators. It reads populated XML cells rather than formatting dimensions. Passive observations are correctly **Sheet2!A1:F655**; formatting down to row 1,048,571 does not create samples.

There are **220 complete condition groups** within seven explicitly labelled three-condition tables. Each family/region/native-label/condition key is unique, and paired cardinality exactly matches declared conditions. Several ionic/receptor tables lack Cell labels: their native rows remain unpaired observations. No row-order alignment, reused-label matching or equal-count matching is permitted across tables.

The independent Sources workbench now has an optional **PKD2L1 physiology · source experiment observations** section. The module/data load only when expanded. Category/table/region/search filters, 15-row pagination, raw measurements, source links, within-table condition details and filtered JSON/CSV exports are implemented. Filtering away the selected row clears details without choosing or restoring another row.

## Retained source boundaries

| Evidence | Preserved result |
| --- | --- |
| Passive | 654 deposited labels versus article n=659; no five-row imputation. |
| pH9 spiking/baseline | 35 labels: cervical10/thoracic13/lumbar12. Fig.4D agrees with35; results text says n=32. |
| Oxotremorine-M duration | Methods50s versus Fig.12 caption40s; no chosen row-level duration. |
| Tau | Native header has no unit; article µs does not establish the raw table's scale. No guessed conversion. |
| NPo | pO stays dimensionless; native Perc must equal pO×100, labelled presentation scale. |
| Animal N | Article numbers are separate context; animal/slice/recording IDs remain null. |

Mouse age3–6weeks is population context, not per-row age. Whole-deposit unique-cell count is **null**. Cross-file/family joins, morphology/function same-cell links, SBF-SEM joins, canonical type contributions, geometry and registrations all remain **zero**. No waveform synthesis, model fit or significance recomputation.

## Verification and deliverables

- Standard-library builder succeeds and regenerates JSON/CSV from pinned inputs.
- Four source test files pass **17/17**, including real barcode gates, source hashes, raw values/units, malformed region/condition/identity/value rejection, duplicate-key rejection, incomplete-pair quarantine, selection clearing, unchanged-row exports and cross-family export rejection.
- `tsc --noEmit --incremental false --pretty false`: **exit0** after integrator repairs to shared files; this worker did not hide/modify type checks.
- Integrator already verified earlier P0CR1/E13.5 source selection/filter behavior. The new Crozat expansion, pagination, details and downloads await final rendered acceptance; component existence is not browser validation.

Owned files:

- [Builder](../tools/build_crozat_experiment_family_observations_0_1.py)
- [Full bounded JSON](../data/crozat-experiment-family-observations-0.1.json) and [CSV](../data/crozat-experiment-family-observations-0.1.csv)
- [Browser](../app/CrozatExperimentObservationBrowser.tsx), [filter/pair/export helper](../app/crozat-experiment-observations.js), [tests](../tests/crozat-experiment-family-observations.test.mjs)
- Optional lazy section in the owned [Sources workbench](../app/ExactSourceAuditWorkbench.tsx); no shared route edit.

Inputs/receipts: `data/source-candidates/crozat-experiment-families-20260930/`. Browser download filenames: `crozat-v2-<filtered-row-count>-source-observations.json` and `.csv`; destination is chosen by the browser.

Current state: code and inputs frozen for integrator production build, full research checks and rendered acceptance. No live download/type-check process, no additional candidate started. Rollback only these owned files/optional section; preserve receipts and unrelated dirty changes.
