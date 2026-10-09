import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildChenDaiPlanarRoutes, CHEN_DAI_ROUTE_PATH } from '../tools/build_chen_dai_planar_routes.mjs';
export async function validateChenDaiPlanarRoutes(candidate) {
  const actual = candidate ?? JSON.parse(await readFile(new URL('../' + CHEN_DAI_ROUTE_PATH, import.meta.url)));
  assert.deepEqual(actual, await buildChenDaiPlanarRoutes(), 'Planar route metadata, exact source topology, source-plane authority or zero-join boundary drifted');
  return { routes: 2, censusExpansionCount: 0, additionalGeometryCount: 0, radiusSurfaceAllowed: false, registrationCount: 0 };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await validateChenDaiPlanarRoutes()));
