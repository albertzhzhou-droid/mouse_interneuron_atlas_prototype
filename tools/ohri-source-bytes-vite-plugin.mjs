import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import explorerTransport from "../data/research-explorer-transport-0.1.json" with { type: "json" };

export const OHRI_SOURCE_BYTES_QUERY = "?ohri-source-bytes";
export const CANO_CHOL_IN_BYTE_RECEIPT = Object.freeze({
  path: "public/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz",
  bytes: 16348,
  sha256: "1db93e5f6e52ead4f869553cf3634a82237fc3817aadb4c8187a75b81323db9a",
});
const VIRTUAL_PREFIX = "\0ohri-source-bytes:";
export const RESEARCH_EXPLORER_BYTE_RECEIPT = Object.freeze({ ...explorerTransport.transport });
const RECEIPTS = [CANO_CHOL_IN_BYTE_RECEIPT, RESEARCH_EXPLORER_BYTE_RECEIPT];

/** Emit only an exact, already admitted source file; no filesystem call survives in this module. */
export function compileOhriSourceBytesModule(projectRoot, filePath, bytes) {
  const receipt = RECEIPTS.find((item) => path.resolve(filePath) === path.resolve(projectRoot, item.path));
  if (!receipt) throw new Error("Unallowlisted OHRI source byte import");
  if (!(bytes instanceof Uint8Array) || bytes.byteLength !== receipt.bytes
      || createHash("sha256").update(bytes).digest("hex") !== receipt.sha256) {
    throw new Error("OHRI source byte receipt mismatch");
  }
  const base64 = Buffer.from(bytes).toString("base64");
  return `const binary = atob(${JSON.stringify(base64)});\nconst bytes = new Uint8Array(binary.length);\nfor (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);\nexport default bytes;\n`;
}

/** Build/dev loader. The raw gzip stays byte-identical and is embedded in the route's server bundle. */
export function ohriSourceBytesPlugin(projectRoot) {
  const allowed = RECEIPTS.map((receipt) => path.resolve(projectRoot, receipt.path));
  return {
    name: "ohri-exact-source-bytes",
    enforce: "pre",
    resolveId(source, importer) {
      const queryAt = source.indexOf("?");
      if (queryAt < 0 || !source.slice(queryAt).includes("ohri-source-bytes")) return null;
      if (source.slice(queryAt) !== OHRI_SOURCE_BYTES_QUERY) throw new Error("Invalid OHRI source byte query");
      const file = source.slice(0, queryAt);
      const resolved = path.isAbsolute(file) ? path.resolve(file) : path.resolve(importer ? path.dirname(importer.split("?")[0]) : projectRoot, file);
      if (!allowed.includes(resolved)) throw new Error("Unallowlisted OHRI source byte import");
      return VIRTUAL_PREFIX + resolved;
    },
    async load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return null;
      const file = id.slice(VIRTUAL_PREFIX.length);
      if (!allowed.includes(file)) throw new Error("Unallowlisted OHRI source byte module");
      this.addWatchFile(file);
      return compileOhriSourceBytesModule(projectRoot, file, await readFile(file));
    },
  };
}
