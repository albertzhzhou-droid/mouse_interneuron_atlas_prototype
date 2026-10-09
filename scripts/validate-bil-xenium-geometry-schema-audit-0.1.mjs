import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateBilXeniumGeometrySchemaAudit } from "../app/bil-xenium-geometry-schema-audit.js";
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));

export async function validateBilXeniumGeometrySchemaAuditSources(snapshot) {
  const audit = snapshot ?? await readJson("data/bil-xenium-geometry-schema-audit-0.1.json");
  const metadata = await readJson("data/bil-xenium-source-metadata-0.1.json");
  const summary = validateBilXeniumGeometrySchemaAudit(audit, metadata);
  const paths = new Set();
  for (const file of [...audit.sourceFiles, ...audit.dependencyReceipts]) {
    if (paths.has(file.path) || file.path.startsWith("/") || file.path.split("/").includes("..")) throw new Error("BIL schema audit unsafe/duplicate source path");
    paths.add(file.path);
    const data = await readFile(resolve(ROOT, file.path));
    if (data.length !== file.bytes || createHash("sha256").update(data).digest("hex") !== file.sha256) throw new Error(`BIL geometry schema source bytes changed: ${file.path}`);
    if (file.path.endsWith(".parquet") && (data.subarray(0, 4).toString() !== "PAR1" || data.subarray(-4).toString() !== "PAR1")) throw new Error("Not a complete Parquet file");
  }
  const acquisition = await readJson("data/source-candidates/bil-xenium-geometry-20260930/receipt.json");
  const run = metadata.runs.find((item) => item.sourceObjectKey === audit.sourceObjectKey);
  if (acquisition.files.length !== 3 || acquisition.totalBytes !== audit.totalSourceBytes || acquisition.sourceObjectKey !== run.sourceObjectKey || JSON.stringify(acquisition.manifestIdentity) !== JSON.stringify(run.manifestIdentity) || JSON.stringify(acquisition.rights) !== JSON.stringify(run.rights) || acquisition.geometryViewerAdmission !== false || acquisition.sectionLinkedCellObjects !== 0) throw new Error("BIL acquisition scope/rights/identity changed");
  for (const file of audit.sourceFiles) {
    const rawReceipt = acquisition.files.find((item) => item.path === file.path);
    if (!rawReceipt || ["path", "url", "bytes", "sha256"].some((key) => file[key] !== rawReceipt[key])) throw new Error("BIL table audit differs from acquisition receipt");
  }
  const listing = acquisition.frozenListing;
  const listingBytes = await readFile(resolve(ROOT, listing.path));
  if (listingBytes.length !== listing.bytes || createHash("sha256").update(listingBytes).digest("hex") !== listing.sha256) throw new Error("BIL acquisition listing receipt changed");
  return { ...summary, sourceFiles: audit.sourceFiles.length, dependencyFiles: audit.dependencyReceipts.length, geometryViewerAdmission: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) validateBilXeniumGeometrySchemaAuditSources().then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
