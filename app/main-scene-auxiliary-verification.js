import iteration from "../data/research-renderer-runtime-inputs-2.91.json" with { type: "json" };
import microns from "../data/microns-observed-cell-nucleus-reference-0.1.json" with { type: "json" };
import crosswalk from "../data/neurolucida-dat-swc-crosswalk-0.1.json" with { type: "json" };
import { sha256Hex } from "./source-local-morphology-geometry.js";

const micronsRoot = microns.assetBundle.manifest.path.slice(0, -"asset-manifest.json".length);
export const MAIN_SCENE_AUXILIARY_PATHS = Object.freeze([
  "/data/allen_cord_20um_v3_0/atlas-contours.json", "/data/allen_cord_20um_v3_0/atlas-internal-compartments.json",
  microns.assetBundle.manifest.path,
  ...["cell", "nucleus"].flatMap(name => ["positions.f32le.bin", "triangles.u32le.bin"].map(kind => `${micronsRoot}browser/${name}.${kind}`)),
  ...[crosswalk.receipts.nativeContours, crosswalk.receipts.standardizedGeometry].map(row => `/${row.path.replace(/^public\//, "")}`),
]);
const privateReads = new WeakMap();
let sequence = 0;
const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
export function mainSceneAuxiliaryExpected(path) {
  if (!MAIN_SCENE_AUXILIARY_PATHS.includes(path)) throw new Error("Main scene auxiliary: source path is not admitted");
  const rows = iteration.authoritativeInputs.filter(row => row.path === `public${path}`);
  if (rows.length !== 1) throw new Error(`Main scene auxiliary: current source receipt is missing: ${path}`);
  return Object.freeze({ path, bytes: rows[0].bytes, sha256: rows[0].sha256 });
}
function abort(signal) { if (signal?.aborted) throw new DOMException("Source read cancelled", "AbortError"); }
export async function readVerifiedMainSceneAuxiliary(path, { signal, fetchImpl = globalThis.fetch } = {}) {
  const expected = mainSceneAuxiliaryExpected(path);
  abort(signal);
  const response = await fetchImpl(path, { signal, cache: "no-store" });
  abort(signal);
  if (!response.ok) throw new Error(`Main scene auxiliary: source request failed (${response.status}): ${path}`);
  const bytes = await response.arrayBuffer();
  abort(signal);
  if (bytes.byteLength !== expected.bytes) throw new Error(`Main scene auxiliary: byte count changed: ${path}`);
  const sha256 = await sha256Hex(bytes);
  abort(signal);
  if (sha256 !== expected.sha256) throw new Error(`Main scene auxiliary: checksum changed: ${path}`);
  const token = Object.freeze({ path });
  const json = path.endsWith(".json") ? freeze(JSON.parse(new TextDecoder().decode(bytes))) : null;
  privateReads.set(token, { bytes: bytes.slice(0), json, proof: Object.freeze({ ...expected, verifiedSha256: sha256,
    verificationSequence: ++sequence, authority: "actual_auxiliary_source_bytes", scope: "pinned_asset_bytes_only" }) });
  return token;
}
function read(token) {
  const value = privateReads.get(token);
  if (!value) throw new Error("Main scene auxiliary: no private current source proof");
  return value;
}
export function mainSceneAuxiliaryProof(token) { return read(token).proof; }
export function mainSceneAuxiliaryBytes(token) { return read(token).bytes.slice(0); }
export function mainSceneAuxiliaryJson(token) {
  const json = read(token).json;
  if (!json) throw new Error("Main scene auxiliary: source is not JSON");
  return json;
}
