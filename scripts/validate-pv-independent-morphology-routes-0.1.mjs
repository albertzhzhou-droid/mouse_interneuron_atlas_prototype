import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { buildPvIndependentRoutes, PV_ROUTE_PATH } from "../tools/build_pv_independent_routes.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export async function validatePvIndependentRoutes(pack) {
  const expected = await buildPvIndependentRoutes();
  pack ??= JSON.parse(await readFile(path.join(root, PV_ROUTE_PATH)));
  assert.deepEqual(pack, expected.pack, "PV independent source contract changed");
  for (const asset of expected.assets) assert.deepEqual(await readFile(path.join(root, asset.path)), asset.bytes, `PV exact derivative changed: ${asset.path}`);
  return { routes: 2, ids: [170034, 118824], nodes: [1681, 540], segments: [1680, 539], censusContribution: 0, internalObjects: 0, pairedExperiment: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await validatePvIndependentRoutes()));
