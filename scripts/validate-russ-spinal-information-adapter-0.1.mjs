#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRussSpinalInformationAdapter } from "../app/russ-spinal-information-adapter.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = "data/source-candidates/russ-spinal-information-20261004";
const ADAPTER_PATH = "data/russ-spinal-information-adapter-0.1.json";
const RECEIPT_PATH = "data/russ-spinal-information-derivation-receipt-0.1.json";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const check = (condition, message) => { if (!condition) throw new Error(`Russ source validation: ${message}`); };
const load = async (root, name) => { const bytes = await readFile(path.join(root, name)); return { bytes, value: JSON.parse(bytes) }; };

export async function validateRussSpinalInformationFiles({ root = PROJECT_ROOT, pythonExecutable = process.env.RUSS_PYTHON_EXECUTABLE ?? "python3" } = {}) {
  const [adapter, taxonomy, receipt, manifest] = await Promise.all([
    load(root, ADAPTER_PATH), load(root, "data/russ-harmonized-taxonomy-crosswalk-0.1.json"),
    load(root, RECEIPT_PATH), load(root, `${SOURCE_PATH}/russ-information-inputs-manifest-0.1.json`),
  ]);
  validateRussSpinalInformationAdapter(adapter.value, taxonomy.value);
  check(receipt.value.outputs.length === 1 && receipt.value.outputs[0].fileName === path.basename(ADAPTER_PATH), "exact derived output declaration required");
  check(receipt.value.outputs[0].bytes === adapter.bytes.length && receipt.value.outputs[0].sha256 === sha256(adapter.bytes), "derived output bytes/hash changed");
  check(receipt.value.inputManifest.sha256 === sha256(manifest.bytes) && adapter.value.derivation.inputManifestSha256 === sha256(manifest.bytes), "input-manifest hash changed");
  check(JSON.stringify(manifest.value.inputs) === JSON.stringify(adapter.value.source.inputs) && JSON.stringify(receipt.value.inputs) === JSON.stringify(adapter.value.source.inputs), "source role/pin declarations changed");
  check(JSON.stringify(receipt.value.scientificAdmissionBoundary) === JSON.stringify(adapter.value.admissionBoundary), "admission receipt changed");
  for (const input of Object.values(manifest.value.inputs)) {
    check(path.basename(input.fileName) === input.fileName, "source input must be a local basename");
    const bytes = await readFile(path.join(root, SOURCE_PATH, input.fileName));
    check(bytes.length === input.bytes && sha256(bytes) === input.sha256, `source bytes/hash changed: ${input.fileName}`);
  }
  check(sha256(taxonomy.bytes) === adapter.value.source.inputs.existing_taxonomy.sha256, "shared original taxonomy changed");
  const extractorPath = path.join(root, "tools", adapter.value.derivation.extractorFile);
  const extractorBytes = await readFile(extractorPath);
  check(receipt.value.extractor.fileName === path.basename(extractorPath) && receipt.value.extractor.bytes === extractorBytes.length && receipt.value.extractor.sha256 === sha256(extractorBytes), "extractor byte receipt changed");
  const replay = spawnSync(pythonExecutable, [extractorPath, "--input-dir", path.join(root, SOURCE_PATH), "--output-dir", path.join(root, "data"), "--check"], { encoding: "utf8", timeout: 60000 });
  check(!replay.error && replay.status === 0, `offline exact-source replay failed: ${replay.error?.message ?? replay.stderr.trim()}`);
  return {
    adapterPath: ADAPTER_PATH, adapterBytes: adapter.bytes.length, adapterSha256: sha256(adapter.bytes),
    sourceInputCount: 4, table1PopulationRows: 69, studyCountFields: 414, sourceStudyTotals: adapter.value.sequencingDenominator.studies.map((study) => study.value),
    capturedSequencingDenominator: 19353, rawAdultPanelCount: 10, adultPanelCountedCellSum: 2371,
    articleAdultCountedCells: 2894, adultDiscrepancyResolved: false, exactSourceReplay: "passed",
    originalTaxonomyUnchanged: true, geometryObjectCount: 0, atlasRegistrationCount: 0, exactLineageAssignmentCount: 0,
    geoCellRosterAdmitted: false, countMatrixBundled: false, broaderUpgradeCompletionClaimed: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await validateRussSpinalInformationFiles())); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
