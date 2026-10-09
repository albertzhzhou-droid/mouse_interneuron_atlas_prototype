import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';
import { parseNeuromorphoSwc } from '../app/neuromorpho-swc-runtime.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CHEN_DAI_ROUTE_PATH = 'data/chen-dai-planar-morphology-routes-0.1.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = name => readFile(path.join(root, name));
async function input(name) { const bytes = await read(name); return { value: JSON.parse(bytes), receipt: { path: name, bytes: bytes.length, sha256: sha(bytes) } }; }
async function pinned(name, bytes, digest) { const actual = await read(name); assert.equal(actual.length, bytes, name); assert.equal(sha(actual), digest, name); return actual; }
export async function buildChenDaiPlanarRoutes() {
  const census = await input('data/neuromorpho-census-main-scene-index-0.1.json');
  const universe = await input('public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json');
  assert.equal(universe.value.repositoryRelease, '8.6.124');
  const routes = [];
  for (const neuronId of [194468, 194469]) {
    const row = census.value.records.find(r => r.neuronId === neuronId), u = universe.value.records.find(r => r.neuronId === neuronId);
    assert.ok(row && u); const m = u.officialMetadata;
    assert.equal(m.neuron_id, neuronId); assert.equal(m.archive, 'Chen_Dai'); assert.equal(m.attributes, 'Diameter, 2D, Angles');
    assert.deepEqual(m.brain_region, ['spinal cord', 'lumbar', 'medial', 'lamina X']);
    assert.equal(m.min_age, '42.0'); assert.equal(m.max_age, '45.0'); assert.equal(m.age_scale, 'Day');
    assert.deepEqual(m.experiment_condition, [neuronId === 194468 ? 'Treadmill training' : 'Control']);
    assert.equal(m.slicing_direction, 'transverse'); assert.equal(Number(m.slicing_thickness), 250);
    const container = universe.value.query.pageReceipts[0];
    const apiBytes = await pinned('public' + container.path, container.bytes, container.sha256);
    const page = JSON.parse(apiBytes), index = page._embedded.neuronResources.findIndex(r => r.neuron_id === neuronId);
    assert.ok(index >= 0); assert.deepEqual(page._embedded.neuronResources[index], m);
    const s = u.sourceObject, swcBytes = await pinned('public' + s.rawSwcPath, s.rawSwcBytes, s.rawSwcSha256);
    const geomBytes = await pinned('public' + row.geometry.path, row.geometry.bytes, row.geometry.sha256), geometry = JSON.parse(geomBytes);
    assert.equal(row.geometry.dimensionality, '2D'); assert.equal(row.geometry.rawSwcSha256, s.rawSwcSha256);
    const parsed = parseNeuromorphoSwc(swcBytes, { neuronId, assetId: row.assetId, name: m.neuron_name, dimensionality: '2D', diameterAuthorized: true });
    assert.deepEqual(parsed.nodes, geometry.nodes); assert.deepEqual(parsed.segments, geometry.segments);
    assert.ok(geometry.nodes.every(n => n.every(Number.isFinite) && n[4] === 0));
    assert.equal(geometry.nodes.length, row.geometry.nodeCount); assert.equal(geometry.segments.length, row.geometry.segmentCount);
    assert.deepEqual(row.geometry.nodeTypeCounts, { 1: 3, 6: neuronId === 194468 ? 1396 : 957 });
    assert.equal(geometry.registration.registrationCount, 0);
    routes.push({
      routeId: `chen-dai-lamina-x-planar-${neuronId}`, title: `Lamina X · ${neuronId === 194468 ? 'treadmill-training' : 'control'} · exact 2D source plane`,
      representationRouteId: 'main.legacy_observed_cell_forms', authority: 'OBS_STANDARDIZED_SOURCE_LOCAL', sourceAuthority: 'NEUROMORPHO_RELEASE_8_6_124_CENSUS_CHILD', censusMembership: true,
      sourceRecord: { neuronId, assetId: row.assetId, repository: 'NeuroMorpho.Org', repositoryRelease: '8.6.124', name: m.neuron_name, archive: m.archive, species: m.species,
        lifeStage: m.age_classification, regionLabels: m.brain_region, cellTypeLabels: m.cell_type, strain: m.strain, sexRaw: m.gender,
        ageRangeDays: [Number(m.min_age), Number(m.max_age)], condition: m.experiment_condition, sourceNote: m.note,
        domain: m.domain, physicalIntegrity: m.physical_Integrity, sourceAttributes: m.attributes,
        slicingThicknessMicrometre: Number(m.slicing_thickness), slicingDirection: m.slicing_direction,
        stain: m.stain, protocol: m.protocol, reconstructionSoftware: m.reconstruction_software,
        parentAnimalId: null, parentSpecimenId: null, parentIdentityMissingReason: 'not_provided_by_official_api_schema' },
      sourceObjects: {
        api: { path: 'public' + container.path, bytes: container.bytes, sha256: container.sha256,
          queryUrl: container.url, pointer: `/_embedded/neuronResources/${index}`, objectEncoding: 'JSON.stringify of exact API object', objectSha256: sha(JSON.stringify(m)) },
        standardizedSwc: { path: 'public' + s.rawSwcPath, bytes: s.rawSwcBytes, sha256: s.rawSwcSha256, url: s.directUrl },
        geometry: { path: 'public' + row.geometry.path, bytes: row.geometry.bytes, sha256: row.geometry.sha256 },
      },
      topology: { nodeCount: geometry.nodes.length, segmentCount: geometry.segments.length, nodeTypeCounts: row.geometry.nodeTypeCounts,
        uniqueZMicrometre: [0], preservedSourceNodeCoordinates: true, sevenColumnFiniteTree: true, unclassifiedType6Preserved: true },
      renderingContract: { dimensionality: '2D', sourcePlane: 'standardized_SWC_XY',
        sourceCoordinatesChanged: false, inferredZCount: 0, extrusionAllowed: false, radiusSurfaceAllowed: false,
        registrationCount: 0, internalPrimitiveCount: 0, sameCellPhysiologyJoinCount: 0, groupStatisticsJoinCount: 0,
        anatomicalAxesEstablished: false, displayTransformUse: 'viewer_only' },
      identityBoundary: { observationUnit: 'repository_morphology_record', sameAnimalPairEstablished: false,
        independentAnimalCount: null, independentSpecimenCount: null, exactCrossSourceIdentityCount: 0 },
      sourceLinks: { officialRecord: geometry.source.officialRecordUrl, standardizedSwc: s.directUrl,
        primaryPaper: 'https://doi.org/10.1113/JP283037', rights: 'https://neuromorpho.org/useterm.jsp' },
      hardBoundaries: [
        'This is one repository-deposited morphology record in its exact 2D source plane; it is not an averaged cell type, an observed atlas placement or a 3D cell.',
        'All original standardized SWC coordinates are preserved; this exact file has z=0 throughout. No extrusion, invented depth, radius surface, membrane, volume or internal object is authorized.',
        'The source reports soma and neurites with moderate neurite integrity. SWC type 6 remains uninterpreted; no axon or dendrite identity is inferred from it.',
        'Age 42–45 days, condition, transverse plane and 250 µm preparation are repository metadata. The Male/Female field does not identify an individual sex; parent animal/specimen IDs are unavailable.',
        'The two deposited objects are independent source records, with no verified same-animal pairing. They do not represent the paper’s control n=12 and exercise n=14 dendritic-length groups.',
        'No paper-level statistics, electrophysiology, causal exercise effect, physical-cell identity, synapse or internal structure is joined to this object.',
        'The standardized XY frame is source-local. Its axes are not established anatomical axes, and viewer camera/display poses are not biological registration.',
      ],
    });
  }
  return { contractId: 'chen-dai-planar-morphology-routes-0.1', releaseId: 'ohri-chen-dai-planar-morphology-routes-0.1.0',
    schemaVersion: '0.1.0', implementationDate: '2026-10-03', repositoryRelease: '8.6.124', repositorySnapshotDate: universe.value.snapshotDate,
    inputReceipts: [census.receipt, universe.receipt], rights: universe.value.rights,
    paperContext: { doi: '10.1113/JP283037', pmid: '35848453', authority: 'repository_record_citation_and_publisher_abstract',
      url: 'https://physoc.onlinelibrary.wiley.com/doi/10.1113/JP283037', checkedDate: '2026-10-03',
      abstractScope: 'The publisher abstract describes three-week exercise beginning at P21–P24. Its dendritic-length groups are control n=12 and exercise n=14. These study groups are context only; no deposited-record-to-animal, figure, electrophysiology or group-statistic crosswalk is established.' },
    runtimeMergePolicy: { overlappingFrozenNeuronIds: [194468, 194469], supplementaryNeuronIds: [], frozenCensusRecordCount: 142,
      selectableMainSceneCount: 179, censusExpansionCount: 0, geometryCopyCount: 0 },
    routes };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pack = await buildChenDaiPlanarRoutes(); await writeFile(path.join(root, CHEN_DAI_ROUTE_PATH), JSON.stringify(pack, null, 2) + '\n');
  console.log(JSON.stringify({ path: CHEN_DAI_ROUTE_PATH, ids: pack.routes.map(r => r.sourceRecord.neuronId), additionalGeometryCount: 0 }));
}
