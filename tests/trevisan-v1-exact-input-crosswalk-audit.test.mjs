import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const audit = JSON.parse(readFileSync(new URL("../data/trevisan-v1-exact-input-crosswalk-audit-0.1.json", import.meta.url)));

test("all exact inputs reproduce their receipt and source conflicts stay quarantined", () => {
  for (const input of [...audit.source.receipts, ...audit.source.alternateBarcodeReceipts]) {
    const bytes = readFileSync(`${root}${input.path}`);
    assert.equal(bytes.length, input.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), input.sha256);
  }
  assert.equal(audit.samples.length, 29);
  assert.equal(new Set(audit.samples.map((row) => row.geoSampleAccession)).size, 29);
  assert.equal(audit.summary.atlasFinalBarcodeCount, 89494);
  assert.equal(audit.summary.atlasSamplePrefixCount, 23);
  assert.deepEqual(audit.summary.atlasDeclaredSampleTitlesWithoutFinalBarcodes, ["P56LR1"]);
  assert.equal(audit.nativeBarcodePayloadGroups.find((group) => group.fileCount === 28).sha256, "898cba2e06cc239f6073addb8d4366d04bf450683249cc705e8d0cbf619bfbaf");
  assert.equal(audit.summary.sourceBarcodeMissingRowsAcrossSeparateSheets, 104240);
  assert.equal(audit.summary.runtimeNucleusRosterRowsAdmitted, 0);
  assert.equal(audit.rights.publicAssetPackagingAllowed, false);
});

test("embryonic age and whole-cord parser exceptions use actual characteristics", () => {
  const embryo = audit.samples.find((row) => row.geoSampleAccession === "GSM8480605");
  assert.equal(embryo.sampleTitle, "E135HetR1");
  assert.equal(embryo.age.developmentalEpoch, "embryonic");
  assert.equal(embryo.age.value, 13.5);
  assert.equal(embryo.age.convertedToPostnatalAge, false);
  for (const sample of audit.samples.filter((row) => /Het|Ko/.test(row.sampleTitle))) {
    assert.equal(sample.characteristics.region.value, "Whole cord");
    assert.notEqual(sample.characteristics.region.value, "t");
    assert.notEqual(sample.characteristics.region.value, "o");
  }
  const representative = audit.samples.find((row) => row.sampleTitle === "P0CR1");
  assert.equal(representative.workbookRowCount, 5333);
  assert.equal(representative.barcodeMatchedRowCount, 12);
  assert.equal(representative.barcodeMissingRowCount, 5321);
  const matchedEmbryo = audit.samples.find((row) => row.sampleTitle === "E135HetR1");
  assert.equal(matchedEmbryo.workbookRowCount, 6676);
  assert.equal(matchedEmbryo.barcodeMissingRowCount, 0);
  assert.equal(matchedEmbryo.clusterAssignment, null);
  assert.equal(matchedEmbryo.finalNucleusRosterAdmission, "held_cluster_and_reuse_gate");
});

test("matrix format success cannot promote a failed biological mapping or create a cluster", () => {
  assert.equal(audit.representativeMatrix.featureRowCount, 32285);
  assert.equal(audit.representativeMatrix.barcodeColumnCount, 8000);
  assert.equal(audit.representativeMatrix.observedNonzeroEntryCount, 13241486);
  assert.equal(audit.representativeMatrix.structuralValidationPassed, true);
  assert.equal(audit.representativeMatrix.biologicalFinalRosterMappingValidated, false);
  assert.ok(audit.workbookSheets.every((sheet) => sheet.clusterLabelColumnPresent === false));
  for (const sample of audit.samples) {
    assert.equal(sample.barcodeMatchedRowCount + sample.barcodeMissingRowCount, sample.workbookRowCount);
    assert.equal(sample.clusterAssignment, null);
    assert.equal(sample.individualAnimalIdentity, null);
  }
  for (const key of ["perNucleusClusterAssignmentsValidated", "canonicalSourceProfileContribution", "sameCellJoins", "geometryObjects", "atlasRegistrations"]) assert.equal(audit.summary[key], 0);
});

test("source parser rejects unrecognized identities instead of repairing them", () => {
  const code = `from tools.audit_trevisan_v1_exact_inputs_0_1 import parse_workbook_barcode, parse_geo_samples
for sheet,value in [('Cell_Barcodes_Atlas','P56LR1_wrong'),('Cell_Barcodes_En1 expt_Rep1','AAACCCAAGACCAGCA-1-mutant'),('Cell_Barcodes_E13.5','AAACCCAAGACCAGCA-1')]:
 try:
  parse_workbook_barcode(sheet,value)
 except ValueError:
  pass
 else:
  raise AssertionError('Invalid source identity accepted')
try:
 parse_geo_samples('^SAMPLE = GSM1\\n!Sample_title = E135HetR1\\n!Sample_characteristics_ch1 = age: P135\\n')
except ValueError:
 pass
else:
 raise AssertionError('Missing characteristic accepted')
`;
  const result = spawnSync("python3", ["-c", code], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});
