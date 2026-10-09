import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateBilXeniumMetadata } from "../app/bil-xenium-source-metadata.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

export async function validateBilXeniumMetadataSources(snapshot) {
  const adapter = snapshot ?? JSON.parse(await readFile(new URL("../data/bil-xenium-source-metadata-0.1.json", import.meta.url), "utf8"));
  const counts = validateBilXeniumMetadata(adapter);
  const receipt = JSON.parse(await readFile(resolve(ROOT, adapter.acquisition.receiptPath), "utf8"));
  const paths = new Set();
  let bytes = 0;
  let coreBytes = 0;
  let coreFiles = 0;
  for (const file of receipt.files) {
    if (paths.has(file.path) || !file.path.startsWith("data/source-candidates/bil-xenium-20260929/") || file.path.split("/").includes("..")) throw new Error("BIL source receipt has duplicate or unsafe paths");
    paths.add(file.path);
    const raw = await readFile(resolve(ROOT, file.path));
    if (raw.length !== file.bytes || createHash("sha256").update(raw).digest("hex") !== file.sha256) throw new Error(`BIL source checksum mismatch: ${file.path}`);
    bytes += raw.length;
    if (/(?:experiment\.xenium|metrics_summary\.csv|gene_panel\.json|\.xlsx)$/.test(file.path)) { coreBytes += raw.length; coreFiles += 1; }
  }
  if (bytes !== receipt.totalBytes || bytes !== adapter.acquisition.inputBytes || receipt.files.length !== adapter.acquisition.inputFileCount || coreBytes !== adapter.acquisition.coreInputBytes || coreFiles !== adapter.acquisition.coreInputFileCount) throw new Error("BIL source acquisition denominator mismatch");
  const byPath = new Map(receipt.files.map((file) => [file.path, file]));
  for (const run of adapter.runs) {
    for (const file of run.sourceFiles) {
      const original = byPath.get(file.path);
      if (!original || original.sha256 !== file.sha256 || original.bytes !== file.bytes || original.url !== file.url) throw new Error("BIL normalized source receipt mismatch");
    }
    const manifest = JSON.parse(await readFile(resolve(ROOT, run.sourceFiles[0].path), "utf8"));
    if (manifest.num_cells !== run.rawSegmentedCellCount || manifest.analysis_sw_version !== run.processing.analysisSoftware || manifest.segmentation_stain !== run.processing.stain || manifest.pixel_size !== run.processing.pixelSizeUm || Object.entries(run.manifestIdentity).some(([key, value]) => manifest[key] !== value)) throw new Error("BIL normalized run identity or processing mismatch");
    const metricLines = (await readFile(resolve(ROOT, run.sourceFiles[1].path), "utf8")).trim().split(/\r?\n/);
    if (metricLines.length !== 2 || metricLines.some((line) => line.includes('"'))) throw new Error("BIL metrics require source schema review");
    const metricHeaders = metricLines[0].split(",");
    const metricValues = metricLines[1].split(",");
    const metric = Object.fromEntries(metricHeaders.map((key, index) => [key, metricValues[index]]));
    if (Number(metric.num_cells_detected) !== run.rawSegmentedCellCount || ["boundary", "interior", "nuc_expansion"].some((method) => Number(metric[`segmented_cell_${method}_count`]) !== run.processing.methodCounts[method])) throw new Error("BIL source method metrics mismatch");
    const api = JSON.parse(await readFile(resolve(ROOT, run.sourceFiles[2].path), "utf8"));
    const dataset = api.retjson[0].Dataset[0];
    if (api.bildid !== run.bildid || dataset.rightsidentifier !== run.rights.apiIdentifier || dataset.rights !== run.rights.apiText || dataset.rightsuri !== run.rights.apiUri || JSON.stringify(api.retjson[0].Specimen) !== JSON.stringify(run.apiSpecimens)) throw new Error("BIL normalized specimen or rights mismatch");
    const names = new Set();
    for (const outline of run.outlineCandidates) {
      const path = `data/source-candidates/bil-xenium-20260929/${run.directoryFolder}/${outline.fileName}`;
      if (!byPath.has(path)) throw new Error("BIL outline candidate is not checksum-pinned");
      const lines = (await readFile(resolve(ROOT, path), "utf8")).trim().split(/\r?\n/);
      const header = lines.indexOf("Selection,X,Y");
      if (header < 0) throw new Error("BIL outline schema changed");
      const rows = lines.slice(header + 1).filter(Boolean);
      const labels = [...new Set(rows.map((line) => line.split(",")[0]))].sort();
      if (rows.length !== outline.vertexRowCount || JSON.stringify(labels) !== JSON.stringify(outline.selectionNames) || outline.cellIdColumnPresent !== false || outline.coordinateUnitsDeclared !== false || outline.cellFrameTransformDeclared !== false) throw new Error("BIL source outline metadata mismatch");
      labels.filter((label) => /^(?:Cervical|Thoracic|Lumbar|Sacral)_/.test(label)).forEach((label) => names.add(label));
    }
    if (JSON.stringify([...names].sort()) !== JSON.stringify(run.namedOutlineLabels)) throw new Error("BIL normalized outline names mismatch");
  }
  return { ...counts, inputFiles: receipt.files.length, inputBytes: bytes, coreInputFiles: coreFiles, coreInputBytes: coreBytes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateBilXeniumMetadataSources().then((value) => console.log(JSON.stringify(value))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
