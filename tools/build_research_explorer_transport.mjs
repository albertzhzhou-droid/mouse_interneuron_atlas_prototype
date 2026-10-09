import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { gzipSync, gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = "public/data/research_explorer_index_v1/search-index.json", transportPath = sourcePath + ".gz";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
export async function validateResearchExplorerTransport() {
  const [raw, compressed, receiptBytes, manifestBytes] = await Promise.all([sourcePath, transportPath, "data/research-explorer-transport-0.1.json", "public/data/research_explorer_index_v1/asset-manifest.json"].map((name) => readFile(path.join(root, name))));
  const receipt = JSON.parse(receiptBytes), manifest = JSON.parse(manifestBytes);
  if (receipt.source.path !== sourcePath || receipt.transport.path !== transportPath || receipt.transport.route !== "/api/source-records/search-index.json"
    || receipt.source.assetSetId !== manifest.assetSetId || receipt.scientificRecordsChanged !== false
    || raw.length !== manifest.index.bytes || digest(raw) !== manifest.index.sha256
    || receipt.source.bytes !== raw.length || receipt.source.sha256 !== digest(raw)
    || receipt.transport.bytes !== compressed.length || receipt.transport.sha256 !== digest(compressed)
    || receipt.transport.contentEncoding !== "gzip" || !gunzipSync(compressed).equals(raw)
    || !gzipSync(raw, { level: 9 }).equals(compressed)) throw new Error("Research Explorer transport bytes, source identity or lossless replay changed");
  return { sourceBytes: raw.length, encodedBytes: compressed.length, decodedSha256: digest(raw), byteReductionPercent: (1 - compressed.length / raw.length) * 100, scientificRecordsChanged: false };
}
export async function buildResearchExplorerTransport() {
  const raw = await readFile(path.join(root, sourcePath)), manifest = JSON.parse(await readFile(path.join(root, "public/data/research_explorer_index_v1/asset-manifest.json")));
  if (raw.length !== manifest.index.bytes || digest(raw) !== manifest.index.sha256) throw new Error("Canonical Research Explorer bytes do not match their source manifest");
  const compressed = gzipSync(raw, { level: 9 });
  const receipt = { schemaVersion: "0.1.0", documentType: "research_explorer_transport_receipt", source: { path: sourcePath, bytes: raw.length, sha256: digest(raw), assetSetId: manifest.assetSetId }, transport: { path: transportPath, bytes: compressed.length, sha256: digest(compressed), contentEncoding: "gzip", route: "/api/source-records/search-index.json" }, scientificRecordsChanged: false };
  await writeFile(path.join(root, transportPath), compressed); await writeFile(path.join(root, "data/research-explorer-transport-0.1.json"), JSON.stringify(receipt, null, 2) + "\n");
  return validateResearchExplorerTransport();
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) (process.argv.includes("--write") ? buildResearchExplorerTransport() : validateResearchExplorerTransport()).then((report) => console.log(JSON.stringify(report))).catch((error) => { console.error(error.message); process.exitCode = 1; });
