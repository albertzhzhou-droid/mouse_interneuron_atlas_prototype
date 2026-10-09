import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DANDI_TRACE_CONTRACT as contract, validateDandiTraceContract, verifyDandiTraceBytes, dandiTraceIdentity } from "../app/dandi-spinalcordnet-trace.js";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assert = (ok, text) => { if (!ok) throw new Error(`DANDI source validation: ${text}`); };
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
export async function validateDandiSpinalCordTracePreview() {
  validateDandiTraceContract();
  for (const receipt of [...contract.sourceReceipts, ...contract.rangeReceipts]) {
    assert(!path.isAbsolute(receipt.path) && !receipt.path.split("/").includes(".."), "source path escaped workspace");
    const bytes = await readFile(path.join(ROOT, receipt.path));
    assert(bytes.length === receipt.bytes && sha(bytes) === receipt.sha256, `source receipt changed: ${receipt.path}`);
  }
  const source = path.join(ROOT, "data/source-candidates/dandi-spinalcordnet-001469-0.250611.1844");
  const [version, asset, audit, proof] = await Promise.all(["version.json", "asset.json", "bounded-nwb-audit.json", "offline-nwb-reference-proof.json"].map(name => readFile(path.join(source, name), "utf8").then(JSON.parse)));
  assert(version.version === contract.releaseId && JSON.stringify(version.license) === JSON.stringify(contract.datasetLicense) && asset.identifier === contract.sourceAsset.id && asset.path === contract.sourceAsset.path, "immutable source metadata mismatch");
  assert(asset.digest["dandi:sha2-256"] === contract.sourceAsset.sha256Declared && asset.contentSize === contract.sourceAsset.bytesDeclared && !Object.hasOwn(asset, "license"), "asset digest, size or separately declared license changed");
  const starts = new Set();
  for (const r of contract.rangeReceipts) {
    assert(r.etag === asset.digest["dandi:dandi-etag"] && r.start % 262144 === 0 && r.start >= 0
      && r.end === Math.min(asset.contentSize - 1, r.start + 262143) && r.bytes === r.end - r.start + 1 && !starts.has(r.start), "range coverage or declared ETag changed");
    starts.add(r.start);
  }
  assert(contract.rangeReceipts.length === 15 && contract.rangeReceipts.reduce((n, r) => n + r.bytes, 0) === 3918112 && audit.rangeBytesFetched === 3918112
    && audit.wholeFileSha256Verified === false && proof.wholeFileSha256Verified === false && proof.networkReads === 0 && proof.previewExactEquality === true,
  "partial range audit was promoted to whole-file verification");
  assert(proof.regionReferencedTablePath === contract.sourceContext.electrodeTablePath && proof.seriesObjectId === contract.sourceContext.seriesObjectId
    && proof.tableObjectId === contract.sourceContext.electrodeTableObjectId && proof.sessionIdPresent === false && proof.electrodeIdsInChannelOrder.every((id, i) => String(id) === contract.electrodes[i].nativeElectrodeId)
    && proof.electrodeGroupReferences.every(p => p === contract.sourceContext.electrodeGroupPath), "native reference mapping changed");
  const payload = await verifyDandiTraceBytes(new Uint8Array(await readFile(path.join(ROOT, "public", contract.preview.url))));
  const firstNativeRows = audit.tracePreview.sourceData;
  assert(firstNativeRows.length === 3000 && firstNativeRows.every((r, i) => r[0] === payload.samples[i]), "overlapping independently saved source samples differ");
  const hierarchy = dandiTraceIdentity();
  assert(hierarchy.nodes.specimen.id === "Chronic Implant 1" && hierarchy.nodes.cell.id === null && hierarchy.nodes.section.id === null && hierarchy.geometryTransferAllowed === false, "recording specimen was promoted to a physical cell");
  return { previewBytes: contract.preview.bytes, previewSamples: 30000, previewChannels: 1, sourceRangeBytes: 3918112, fullNwbChecksumVerified: false, identifiedInterneurons: 0 };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) validateDandiSpinalCordTracePreview().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
