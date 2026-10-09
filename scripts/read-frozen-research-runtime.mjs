import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const FROZEN_RUNTIME_RECEIPTS = Object.freeze([
  {
    "id": "micronsImportProvenanceRuntime",
    "path": "app/microns-import-provenance.js",
    "bytes": 3857,
    "sha256": "fad707fdf8e41033a4c1a50b9875cc43e008d34cfb5f2a3b097c308b4c7b0bfb"
  },
  {
    "id": "neuromorphoUniverseValidator",
    "path": "scripts/validate-neuromorpho-no-age-query-universe-0.1.mjs",
    "bytes": 18647,
    "sha256": "1c246493244d75e294675eca383bf4e0bfb44a8f664e8160ed5449b6f8367bc8"
  },
  {
    "id": "neuromorphoSwcRuntime",
    "path": "app/neuromorpho-swc-runtime.js",
    "bytes": 15619,
    "sha256": "323285854e2663a9b2e4f4fa0c6631d768d6e8ad33478c39d529744eb08e1a31"
  },
  {
    "id": "neuromorphoSwcRuntimeTest",
    "path": "tests/neuromorpho-swc-runtime.test.mjs",
    "bytes": 7240,
    "sha256": "d39ed4e91a25a653f358b35cb232f49c5ad99ca581ad2c548ba6e5d715fbb4ba"
  }
]);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Exact historical implementation receipts only; no fallback for scientific data.
export async function readFrozenResearchRuntime(input, livePath, projectRoot) {
  const live = await readFile(livePath);
  if (live.byteLength === input.bytes && sha256(live) === input.sha256) return live;
  const pinned = FROZEN_RUNTIME_RECEIPTS.find(row => ["id", "path", "bytes", "sha256"].every(key => row[key] === input[key]));
  if (!pinned) return live;
  const archived = await readFile(path.join(projectRoot, "data/iteration-runtime-snapshots", pinned.sha256, path.basename(pinned.path)));
  if (archived.byteLength !== input.bytes || sha256(archived) !== input.sha256) throw new Error("Frozen runtime archive receipt drifted");
  return archived;
}
