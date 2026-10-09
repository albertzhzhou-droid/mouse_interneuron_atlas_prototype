import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateChenDaiPlanarRoutes } from '../scripts/validate-chen-dai-planar-morphology-routes-0.1.mjs';
const pack = JSON.parse(await readFile(new URL('../data/chen-dai-planar-morphology-routes-0.1.json', import.meta.url)));
test('two exact planar routes reuse census objects with verified API/SWC/geometry and no inferred depth', async () => {
  assert.deepEqual(await validateChenDaiPlanarRoutes(), { routes: 2, censusExpansionCount: 0, additionalGeometryCount: 0, radiusSurfaceAllowed: false, registrationCount: 0 });
  assert.deepEqual(pack.routes.map(r => [r.sourceRecord.neuronId, r.topology.nodeCount, r.topology.segmentCount]), [[194468,1399,1398],[194469,960,959]]);
});
for (const [name, mutate] of [
  ['named route claims new render authority', p => p.routes[0].representationRouteId = p.routes[0].routeId],
  ['source label replaced with 3D', p => p.routes[0].renderingContract.dimensionality = '3D'],
  ['invented depth or surface', p => { p.routes[0].renderingContract.inferredZCount = 1; p.routes[0].renderingContract.radiusSurfaceAllowed = true; }],
  ['paper statistics joined to deposited object', p => p.routes[1].renderingContract.groupStatisticsJoinCount = 1],
  ['age and training condition conflated', p => { p.routes[1].sourceRecord.condition = ['Treadmill training']; p.routes[0].sourceRecord.ageRangeDays = [21,24]; }],
  ['source topology or API pointer changed', p => { p.routes[1].topology.nodeCount = 1399; p.routes[0].sourceObjects.api.pointer = '/_embedded/neuronResources/180'; }],
  ['parent specimen fabricated', p => p.routes[0].sourceRecord.parentSpecimenId = 'same-pair'],
  ['uninterpreted neurites called dendrites', p => p.routes[0].topology.unclassifiedType6Preserved = false],
]) test(`rejects ${name}`, async () => { const changed = structuredClone(pack); mutate(changed); await assert.rejects(validateChenDaiPlanarRoutes(changed), /source-plane authority|boundary drifted/); });
