import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { inspectNativeDat, DAT_INVENTORY_PARSER_VERSION } from "../app/neurolucida-dat-inventory.js";
import { canonicalDatAudit, datAuditPayload, datTopLevelInventory, validateNativeDatAdmission } from "../app/neurolucida-dat-file-admission.js";
import { extractNativeDatContours } from "./neurolucida-native-contour-reader.mjs";
const ROOT = fileURLToPath(new URL("../", import.meta.url)), target = "data/neurolucida-dat-file-manifest-0.1.json";
const sha = b => createHash("sha256").update(b).digest("hex");
const json = async p => JSON.parse(await readFile(path.join(ROOT, p), "utf8"));
export async function buildDatManifest({ candidatePath, python = process.env.OHRI_DAT_AUDIT_PYTHON ?? "python3" } = {}) {
  const base = await json("data/neurolucida-native-contour-admission-catalog-0.3.json"), delta = await json("data/neurolucida-native-contour-admission-catalog-0.4.json");
  const old = candidatePath ? JSON.parse(await readFile(candidatePath, "utf8")) : (await json(target)).records;
  const parserInputs = [];
  for (const p of ["app/neurolucida-dat-inventory.js", "tools/inspect_neurolucida_dat.py", "app/neurolucida-dat-file-admission.js"])
    { const b = await readFile(path.join(ROOT, p)); parserInputs.push({ path: p, bytes: b.length, sha256: sha(b) }); }
  const rows = [], pyInputs = [], audits = [];
  for (const record of [...base.records, ...delta.addedRecords]) {
    const sourcePath = record.source.projectPath ?? `public${record.source.path}`, b = await readFile(path.join(ROOT, sourcePath));
    assert.equal(b.length, record.source.bytes); assert.equal(sha(b), record.source.sha256);
    const markerSizeCorrections = old.find(r => r.neuronId === record.neuronId)?.markerSizeCorrections;
    assert.ok(Array.isArray(markerSizeCorrections), `Missing explicit marker policy ${record.neuronId}`);
    const audit = inspectNativeDat(b, { markerSizeCorrections }); audits.push(audit);
    pyInputs.push({ neuronId: record.neuronId, path: path.join(ROOT, sourcePath), markerSizeCorrections });
    const legacy = extractNativeDatContours(b);
    assert.deepEqual(legacy.map(c => [c.sourceBlockOffsetByte, c.sourceName, c.sourceClosedFlag, c.sourceColor, c.points]),
      audit.contours.map(c => [c.offsetByte, c.sourceName, c.sourceClosedFlag, c.sourceColor, c.points]), "Historical ordered contour arrays changed");
    const gbytes = await readFile(path.join(ROOT, `public${record.derivedObject.path}`));
    assert.equal(gbytes.length, record.derivedObject.bytes); assert.equal(sha(gbytes), record.derivedObject.sha256);
    const geometry = JSON.parse(gbytes);
    const publicPath = record.source.path ?? `/data/neurolucida_dat_originals_v1/nmo-${record.neuronId}.dat`;
    if (!record.source.path) {
      if (candidatePath) { await mkdir(path.dirname(path.join(ROOT, `public${publicPath}`)), { recursive: true }); await writeFile(path.join(ROOT, `public${publicPath}`), b); }
      assert.deepEqual(await readFile(path.join(ROOT, `public${publicPath}`)), b, "Original public mirror must preserve every byte");
    }
    const file = { neuronId: record.neuronId, sourceFilename: decodeURIComponent(new URL(record.source.originalDatUrl).pathname.split("/").at(-1)),
      originalDat: { projectPath: sourcePath, publicPath, url: record.source.originalDatUrl, bytes: b.length, sha256: sha(b) },
      rights: { license: "CC BY 4.0", termsUrl: "https://neuromorpho.org/useterm.jsp", verifiedDateUtc: "2026-10-02",
        attribution: { originalPaperDoi: record.source.sourcePaperDoi, repositoryRrid: "RRID:SCR_002145", repositoryPaperDoi: "10.1096/fba.2024-00048" },
        scope: "Exact original DAT and unchanged local public copy; retained source context is not a license for unrelated files." },
      parserVersion: DAT_INVENTORY_PARSER_VERSION, parserInputs, markerSizeCorrections,
      coordinateUnits: "source_reported_micrometre", coordinateFrame: "Neurolucida_DAT_source_native_unregistered",
      unitEvidenceBoundary: "Source format convention and existing admission; binary V3 DAT has no independently calibrated axis/voxel declaration. XML v4 NMF is not a binary V3 byte-layout specification.",
      topLevelObjects: datTopLevelInventory(audit), blockCounts: audit.blockCounts,
      originalContourCount: audit.contours.length, originalContourVertexCount: audit.contours.reduce((n, c) => n + c.vertexCount, 0),
      fullAuditSha256: sha(canonicalDatAudit(datAuditPayload(audit))),
      derivedGeometry: record.derivedObject,
      admittedContours: geometry.contours.map(c => ({ id: c.id, sourceBlockOffsetByte: c.sourceBlockOffsetByte,
        sourceName: c.sourceName, interpretedClosed: c.interpretedClosed, closureBasis: c.closureBasis,
        vertexCount: c.vertexCount, semanticSegmentCount: c.semanticSegmentCount })),
      independentParserComparison: { pythonReaderVersion: "ohri-independent-v3-dat-python-0.1.0", fullStructuredAuditEqual: true,
        allOrderedContourCoordinatesEqual: true, historicalContourArraysEqual: true, externalParserExecuted: false },
      interpretationBoundary: "All top-level objects and nested byte boundaries audited. Tree/branch/marker/spine/text names and counts are source syntax only; only the existing exact admitted soma line loops may render. No inferred neurites, biological spines, surfaces, membranes, volumes, intracellular objects, DAT-SWC transform, cross-record identity or registration." };
    validateNativeDatAdmission(audit, geometry, file); rows.push(file);
  }
  const temp = await mkdtemp(path.join(tmpdir(), "ohri-dat-independent-"));
  try {
    const input = path.join(temp, "input.json"), output = path.join(temp, "output.json"); await writeFile(input, JSON.stringify(pyInputs));
    const result = spawnSync(python, [path.join(ROOT, "tools/inspect_neurolucida_dat.py"), input, output], { encoding: "utf8", maxBuffer: 1024*1024 });
    assert.equal(result.status, 0, result.stderr || result.error?.message); const independent = JSON.parse(await readFile(output, "utf8"));
    for (let i = 0; i < rows.length; i++) { assert.equal(independent[i].neuronId, rows[i].neuronId);
      assert.equal(canonicalDatAudit(independent[i].audit), canonicalDatAudit(datAuditPayload(audits[i])), `Independent complete DAT audit ${rows[i].neuronId}`); }
  } finally { await rm(temp, { recursive: true, force: true }); }
  return { documentType: "neurolucida_per_file_native_dat_manifest", schemaVersion: "0.1.0", releaseId: "ohri-native-dat-file-manifest-0.1.0",
    referenceReader: { repository: delta.independentAudit.parser?.repository ?? "https://github.com/NeuroMorpho/xyz2swc",
      commit: "e07fd2d53c03945f011c335c7b643765f2d85a09", sourceSha256: "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2", sourceReadOnly: true, codeBundled: false },
    scope: "Seven exact existing mouse DAT records; no additional geometry admission or biological cell census.", records: rows };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const flag = process.argv.indexOf("--marker-candidates"), candidatePath = flag >= 0 ? process.argv[flag+1] : undefined;
  const doc = await buildDatManifest({ candidatePath }); const bytes = Buffer.from(JSON.stringify(doc, null, 2)+"\n");
  if (process.argv.includes("--write")) await writeFile(path.join(ROOT, target), bytes);
  else assert.deepEqual(bytes, await readFile(path.join(ROOT, target)), "DAT file manifest stale");
  console.log(JSON.stringify({ records: doc.records.length, topLevelObjects: doc.records.reduce((n, r) => n+r.topLevelObjects.length, 0),
    admittedLoops: doc.records.reduce((n, r) => n+r.admittedContours.length, 0), bytes: bytes.length, sha256: sha(bytes) }));
}
