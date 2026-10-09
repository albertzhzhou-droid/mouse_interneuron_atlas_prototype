import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { crozatObservationCsv, crozatWithinFamilyPairs, filterCrozatObservations, makeCrozatObservationExport, reconcileCrozatSelection } from "../app/crozat-experiment-observations.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const audit = JSON.parse(readFileSync(new URL("../data/crozat-experiment-family-observations-0.1.json", import.meta.url)));
const family = (id) => audit.families.find((row) => row.id === id);

test("all declared inputs match the versioned source manifest and observation locators", () => {
  for (const receipt of audit.source.receipts) {
    const bytes = readFileSync(root + receipt.path);
    assert.equal(bytes.length, receipt.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), receipt.sha256);
    if (receipt.publisherMd5) assert.equal(createHash("md5").update(bytes).digest("hex"), receipt.publisherMd5);
  }
  assert.equal(audit.source.version, 2);
  assert.equal(audit.source.license.name, "CC BY 4.0");
  assert.equal(audit.summary.adapterTableCount, 23);
  assert.equal(audit.summary.observationRowCount, 2115);
  assert.equal(audit.summary.completeWithinTablePairGroupCount, 220);
  assert.equal(family("passive").sheet, "Sheet2");
  assert.deepEqual(family("passive").observations[0].cellLocators, { Rs: "Sheet2!C2", Rm: "Sheet2!D2", Cm: "Sheet2!E2", Tau: "Sheet2!F2" });
  assert.deepEqual(audit.scope.unmappedDownloadedFileIds, [56062547]);
});

test("actual passive and pH sample discrepancies remain visible without animal/row imputation", () => {
  assert.equal(family("passive").sourceLocalLabelCount, 654);
  assert.equal(family("passive").articleSampleN, 659);
  assert.equal(family("passive").articleVersusDepositSampleCountAgrees, false);
  assert.equal(family("rmp").sourceLocalLabelCount, 125);
  assert.equal(family("ph9-spiking").sourceLocalLabelCount, 35);
  assert.deepEqual(family("ph9-spiking").labelCountsByRegion, { cervical: 10, thoracic: 13, lumbar: 12 });
  assert.equal(family("ph9-spiking").articleSampleN, 32);
  assert.equal(family("passive").metrics.find((field) => field.field === "Tau").unit, null);
  assert.equal(family("passive").observations[0].values.Tau, 0.136543);
  for (const row of audit.families.flatMap((f) => f.observations)) {
    assert.equal(row.globallyStableCellId, null); assert.equal(row.animalId, null);
    assert.equal(row.sliceId, null); assert.equal(row.recordingFileId, null);
  }
  for (const name of ["crossExperimentFamilyJoinCount", "sameCellMorphologyJoinCount", "pkd2l1SbfSemIdentityJoinCount", "canonicalTypeContribution", "geometryCount", "registrationAdmissionCount"]) assert.equal(audit.summary[name], 0);
  assert.equal(audit.summary.depositWideUniqueCellCount, null);
});

test("same-table conditions pair exactly, while source-row labels and reused cross-family integers cannot pair", () => {
  const baclofen = family("cav-baclofen");
  const row = baclofen.observations[0];
  const pairs = crozatWithinFamilyPairs(baclofen, row);
  assert.deepEqual(pairs.map((item) => item.conditionRaw), ["CTR", "BCL", "WASH"]);
  assert.ok(pairs.every((item) => item.familyId === row.familyId && item.region === row.region && item.sourceCellLabel === row.sourceCellLabel));
  assert.equal(crozatWithinFamilyPairs(family("cav-oxotremorine"), row).length, 0);
  assert.equal(crozatWithinFamilyPairs(family("kv-control"), family("kv-control").observations[0]).length, 0);
  assert.equal(family("kv-control").sourceLocalLabelCount, null);
  assert.equal(family("nav-control").observations[0].sourceCellLabel, null);
  const npo = family("ph9-npo").observations[0];
  assert.ok(Math.abs(npo.values.Perc - npo.values.pO * 100) < 1e-9);
  assert.equal(family("ph9-npo").metrics.find((metric) => metric.field === "pO").unit, "dimensionless");
});

test("filtering clears details and exports preserve the exact observed rows and measurement units", () => {
  const rows = filterCrozatObservations(audit.families, { familyId: "ph9-spiking", region: "thoracic" });
  assert.equal(rows.length, 39);
  assert.equal(reconcileCrozatSelection(rows, rows[0].id), rows[0].id);
  assert.equal(reconcileCrozatSelection(rows, family("rmp").observations[0].id), null);
  assert.equal(reconcileCrozatSelection(filterCrozatObservations(audit.families), null), null);
  const exported = makeCrozatObservationExport(audit, rows, { region: "thoracic" }, "2026-09-30T00:00:00Z");
  assert.equal(exported.rowCount, 39); assert.equal(exported.depositWideUniqueCellCount, null);
  assert.ok(crozatObservationCsv(rows).includes("Hz"));
  assert.ok(crozatObservationCsv(rows).includes("Sheet1!D"));
  assert.throws(() => makeCrozatObservationExport(audit, rows, {}, "today", "cross_family"), /Cross-file/);
  assert.throws(() => makeCrozatObservationExport(audit, [rows[0], rows[0]], {}, "today"), /distinct/);
  assert.throws(() => makeCrozatObservationExport(audit, [{ ...rows[0], values: { Freq: 99 } }], {}, "today"), /unchanged/);
});

test("the actual parser rejects malformed region/condition/identity and isolates incomplete pairs", () => {
  const code = `from tools.build_crozat_experiment_family_observations_0_1 import parse_family, SPECS
cfg=next(s for s in SPECS if s['id']=='cav-baclofen')
headers={'A':'Cell','B':'Level','C':'Cond','D':'Dens'}
valid={'A':1,'B':'Cerv','C':'CTR','D':-50}
for bad in [dict(valid,B='Whole cord'),dict(valid,C='control'),dict(valid,A='1'),dict(valid,D=float('nan'))]:
 try: parse_family(cfg,[('native',[(1,headers),(2,bad)])])
 except ValueError: pass
 else: raise AssertionError('Malformed source accepted')
try: parse_family(cfg,[('native',[(1,headers),(2,valid),(3,valid)])])
except ValueError: pass
else: raise AssertionError('Duplicate identity accepted')
out=parse_family(cfg,[('native',[(1,headers),(2,valid)])])
assert out['completePairGroupCount']==0
assert out['quarantined'][0]['reason']=='incomplete_condition_cardinality'
`;
  const result = spawnSync("python3", ["-c", code], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});
