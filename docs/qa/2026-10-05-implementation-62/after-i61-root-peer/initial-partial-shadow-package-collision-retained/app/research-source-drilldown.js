import registry from '../data/research-source-registry-0.1.json' with { type: 'json' };
import dorsal from '../data/census-child-observed-morphology-route-0.1.json' with { type: 'json' };
import functional from '../data/functional-class-observed-morphology-route-pack-0.1.json' with { type: 'json' };
import prp from '../data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json' with { type: 'json' };
import premotor from '../data/premotor-comparison-observed-morphology-route-pack-0.1.json' with { type: 'json' };
import nativeBase from '../data/neurolucida-native-contour-admission-catalog-0.3.json' with { type: 'json' };
import nativeDelta from '../data/neurolucida-native-contour-admission-catalog-0.4.json' with { type: 'json' };
import cano from '../data/cano-gomez-p56-multiome-interneuron-registry-0.1.json' with { type: 'json' };
import glut from '../data/cano-gomez-glut-active-ident-labels-0.1.json' with { type: 'json' };
import delile from '../data/delile-developmental-interneuron-taxonomy-0.1.json' with { type: 'json' };
import roome from '../data/roome-dil-source-taxonomy-0.1.json' with { type: 'json' };
import microns from '../data/microns-observed-cell-nucleus-reference-0.1.json' with { type: 'json' };
import todd from '../data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json' with { type: 'json' };
import banc from '../data/banc-v888-in14a018-morphology-route-0.1.json' with { type: 'json' };

const fail = message => { throw new Error(`Source record-set navigation: ${message}`); };
const copy = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const entry = (id, label, pathname, values = {}, hash = '') => ({ id, label, pathname, values, hash });
const morphology = (id, title = id, native = false) => {
  const neuronId = /^NeuroMorpho:([1-9][0-9]*)$/.exec(id)?.[1];
  if (!neuronId) fail('exact NeuroMorpho source observation ID is required');
  return native
    ? entry(id, title, '/objects', { objectSource: 'native-contours', sourceObject: `native-contours/ohri-neurolucida-native-contour-admission-catalog-0.4.0/native_contour_record/${neuronId}` })
    : entry(id, title, '/workspace', { focusKind: 'morphology_record', focusId: id, cellForm: neuronId, observedForm: '1', view: 'cell_detail', panel: 'structure' });
};
const profile = row => entry(row.profileId ?? row.id, row.sourceLocalLabel, '/explore/cell-types', {
  focusKind: 'molecular_profile', focusId: row.profileId ?? row.id, type: row.profileId ?? row.id,
});
const source124 = 'SRC-NEUROMORPHO-8-6-124';
const plans = {
  'RS-NEUROMORPHO-RECONSTRUCTIONS': { source: source124, path: 'public/data/neuromorpho_release_8_6_124_census_v1/census-index.json', field: 'assetId', count: 142, navigationEntryCount: 1, entries: () => [entry('frozen-census-142', 'Open the 142-record frozen adult matrix', '/explore/morphology/viewer', { morphologyView: 'matrix' })] },
  'RS-NEUROMORPHO-DORSAL-HORN-ROUTE-PACK': { source: source124, path: 'data/census-child-observed-morphology-route-0.1.json', field: 'dorsalHornRouteSet.members[].assetId', count: 5, entries: () => dorsal.dorsalHornRouteSet.members.map(row => morphology(row.assetId)) },
  'RS-NEUROMORPHO-FUNCTIONAL-CLASS-ROUTE-PACK': { source: source124, path: 'data/functional-class-observed-morphology-route-pack-0.1.json', field: 'routes[].sourceRecord.assetId', count: 2, entries: () => functional.routes.map(row => morphology(row.sourceRecord.assetId, row.title)) },
  'RS-NEUROMORPHO-PRP-DORSAL-HORN-ROUTE-PACK': { source: source124, path: 'data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json', field: 'routes[].sourceRecord.assetId', count: 2, entries: () => prp.routes.map(row => morphology(row.sourceRecord.assetId, row.title)) },
  'RS-NEUROMORPHO-PREMOTOR-COMPARISON-ROUTE-PACK': { source: source124, path: 'data/premotor-comparison-observed-morphology-route-pack-0.1.json', field: 'routes[].sourceRecord.assetId', count: 1, entries: () => premotor.routes.map(row => morphology(row.sourceRecord.assetId, row.title)) },
  'RS-NEUROMORPHO-NATIVE-CONTOUR-ADMISSION-CATALOG': { source: source124, kind: 'sourceObjectSetRef', path: 'data/neurolucida-native-contour-admission-catalog-0.3.json', field: 'records[].assetId', count: 5, entries: () => nativeBase.records.map(row => morphology(row.assetId, `${row.assetId} · original DAT traces`, true)) },
  'RS-NEUROMORPHO-NATIVE-CONTOUR-DELTA-04': { source: source124, kind: 'sourceObjectSetRef', path: 'data/neurolucida-native-contour-admission-catalog-0.4.json', field: 'addedRecords[].assetId', count: 2, entries: () => nativeDelta.addedRecords.map(row => morphology(row.assetId, `${row.assetId} · original DAT traces`, true)) },
  'RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES': { source: 'SRC-CANOGOMEZ-2026', path: 'public/data/cano_gomez_p56_multiome_interneuron_v1/cano-gomez-p56-multiome-interneuron-registry-0.1.json', field: 'profiles[].profileId', count: 11, entries: () => cano.profiles.map(row => ({ ...profile(row), label: `${row.sourceLocalLabel} · ${row.nucleusCount} source-assigned nuclei` })) },
  'RS-CANOGOMEZ-GLUT-ACTIVE-IDENT-LABELS': { source: 'SRC-CANOGOMEZ-2026', path: 'public/data/cano_gomez_glut_active_ident_v1/GSE318731_P56_glutamatergic_active_ident_assignments.jsonl.gz', field: 'compound_nucleus_key', count: 277, navigationEntryCount: 2, entries: () => [entry('cano-glut-source-labels', `Open ${glut.denominators.sourceLabelCount} aggregate raw GLUT-label summaries; these are not nucleus rows`, '/explore/cell-types', { sourcePanel: 'glut' }, '#cano-glut-source-labels'), entry('cano-glut-assignment-rows', `Read all ${glut.denominators.nucleusCount.toLocaleString('en-US')} deposited assignment rows (.jsonl.gz)`, glut.artifact.publicUrl)] },
  'RS-DELILE-FINE-SUBTYPES': { source: 'SRC-DELILE-2019', path: 'data/delile-developmental-interneuron-taxonomy-0.1.json', field: 'profiles[].id', count: 51, entries: () => delile.profiles.map(profile) },
  'RS-MICRONS-EXACT-CELL-NUCLEUS': { source: 'SRC-MICRONS-PHASE1-V185-4', path: 'data/microns-observed-cell-nucleus-reference-0.1.json', field: 'identityChain.somaValenceTable.nucleusId', count: 2, entries: () => [entry(microns.identityChain.cellRootId, `Cortical cell root ${microns.identityChain.cellRootId}`, '/objects', { objectSource: 'microns-phase1', sourceObject: `microns-phase1/v185.4/cell_root/${microns.identityChain.cellRootId}` }), entry(String(microns.identityChain.somaValenceTable.nucleusId), `Source-linked nucleus ${microns.identityChain.somaValenceTable.nucleusId}`, '/objects', { objectSource: 'microns-phase1', sourceObject: `microns-phase1/v185.4/nucleus/${microns.identityChain.somaValenceTable.nucleusId}` })] },
  'RS-RONZANO-PREMOTOR-POSITIONS': { source: 'SRC-RONZANO-2022-81976', path: 'public/data/ronzano_premotor_positions_v1/positions.json', field: 'sourceFileId+sourceRow', count: 31878, navigationEntryCount: 2, entries: () => [entry('raw', 'Raw coordinate representation · 14,484 rows', '/explore/positions', { positionFrame: 'raw' }), entry('normalized', 'Normalized coordinate representation · 17,394 rows', '/explore/positions', { positionFrame: 'normalized' })] },
  'RS-ROOME-REFINED-DIL-TYPES': { source: 'SRC-ROOME-2026', path: 'data/roome-dil-source-taxonomy-0.1.json', field: 'profiles[].id', count: 157, entries: () => roome.profiles.map(profile) },
  'RS-NEUROMORPHO-8-6-126-TODD-NTS-ROUTES': { source: 'SRC-NEUROMORPHO-8-6-126-TODD-NTS', path: 'data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json', field: 'routes[].sourceRecord.assetId', count: 30, entries: () => todd.routes.map(row => morphology(row.sourceRecord.assetId, row.title)) },
  'RS-BANC-V888-IN14A018-MORPHOLOGY': { source: 'SRC-BANC-V888-IN14A018', path: 'data/banc-v888-in14a018-morphology-route-0.1.json', field: 'identity.rootId', count: 1, entries: () => [entry(banc.identity.rootId, `Fly VNC ${banc.identity.cellType} · root ${banc.identity.rootId}`, '/objects', { objectSource: 'banc-v888', sourceObject: `banc-v888/v888/neuron_root/${banc.identity.rootId}` })] },
};

export function getSourceRecordSetNavigation(sourceId, recordSetId, declaredRecordSet = undefined) {
  const source = registry.sources.find(row => row.id === sourceId);
  if (!source) fail('unknown canonical source');
  const recordSet = source.recordSets.find(row => row.recordSetId === recordSetId);
  if (!recordSet) fail('record set is not owned by this source');
  if (declaredRecordSet !== undefined && !same(declaredRecordSet, recordSet)) fail('current record-set declaration changed');
  const refKind = recordSet.childRosterRef.status === 'bundled_exact' ? 'childRosterRef' : recordSet.sourceObjectSetRef?.status === 'bundled_exact' ? 'sourceObjectSetRef' : null;
  const boundary = 'Navigation uses declared source metadata only. The destination verifies its own source files and rendering permissions. No new profile, physical-cell identity, geometry, internal object or registration is admitted.';
  const base = { schemaVersion: '0.1.0', registryReleaseId: registry.releaseId, sourceId, recordSetId, recordKind: recordSet.recordKind, unitOfObservation: recordSet.unitOfObservation, includedRecordCount: copy(recordSet.includedRecordCount), sourceObjectSetReference: recordSet.sourceObjectSetRef ? copy(recordSet.sourceObjectSetRef) : null, authority: 'declared_metadata_navigation_only', boundary, newAdmissionCount: 0, crossSourceIdentityJoinCount: 0, registrationCount: 0 };
  if (!refKind) return { ...base, status: 'unavailable', reference: copy(recordSet.childRosterRef), entries: [], reason: recordSet.childRosterRef.missingReason ?? 'No exact bundled roster or source-object set is declared.' };
  const plan = plans[recordSetId], reference = recordSet[refKind];
  if (!plan || plan.source !== sourceId || (plan.kind ?? 'childRosterRef') !== refKind || reference.path !== plan.path || reference.idField !== plan.field || recordSet.includedRecordCount.value !== plan.count) fail('exact source/ref/denominator navigation contract changed');
  const rows = plan.entries();
  if (rows.length !== (plan.navigationEntryCount ?? plan.count)) fail('exact source navigation membership count changed');
  if (new Set(rows.map(row => row.id)).size !== rows.length || rows.some(row => typeof row.id !== 'string' || !row.id || typeof row.label !== 'string' || !row.label)) fail('exact native navigation IDs must be unique and labelled');
  const profilePrefixes = { 'SRC-CANOGOMEZ-2026': 'cano.gomez.p56.chol_in.sha256.', 'SRC-DELILE-2019': 'delile-2019:E-MTAB-7320:', 'SRC-ROOME-2026': 'roome-2026:GSE291462:' };
  for (const row of rows) {
    if (row.values.focusKind === 'molecular_profile' && !row.id.startsWith(profilePrefixes[sourceId] ?? '\u0000')) fail('profile is outside the exact source namespace');
  }
  if (rows.some(row => row.values.focusKind === 'molecular_profile') && rows.length !== plan.count) fail('exact profile roster count changed');
  const entries = rows.map(row => {
    const params = new URLSearchParams(row.values);
    const download = row.pathname.startsWith('/data/');
    if (!download) { params.set('fromSource', sourceId); params.set('fromRecordSet', recordSetId); }
    return { id: row.id, label: row.label, href: download ? row.pathname : `${row.pathname}?${params}${row.hash}`, sourceId, recordSetId, download }; 
  });
  return { ...base, status: 'available', referenceKind: refKind, reference: copy(reference), entries, reason: null };
}

export function sourceDrilldownReceipt(sourceId, recordSetId) {
  const navigation = getSourceRecordSetNavigation(sourceId, recordSetId);
  const source = registry.sources.find(row => row.id === sourceId);
  return { ...navigation, sourceCitation: copy(source.citation), rights: copy(source.rights), requestedSourcePage: `/sources?${new URLSearchParams({ source: sourceId, recordSet: recordSetId })}#${recordSetId}`, renderedViewCaptured: false, sourceBytesVerifiedByThisReceipt: false };
}

export function writeSourceRegistryLocation(href, values) {
  const url = new URL(href, 'http://localhost');
  const allowed = new Set(['source', 'recordSet', 'sourceQuery', 'sourceLane', 'sourceSpecies', 'sourceStage', 'sourceAdmission']);
  for (const [key, value] of Object.entries(values)) {
    if (!allowed.has(key)) fail('cannot write a parameter outside the source registry');
    if (value === null || value === '' || value === 'all') url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function readSourceRegistryRecordSetSelection(params, sourceId) {
  const requests = params.getAll('recordSet');
  if (!requests.length) return { recordSetId: null, error: null };
  const source = registry.sources.find(row => row.id === sourceId);
  if (new Set(requests).size !== 1 || !source?.recordSets.some(row => row.recordSetId === requests[0])) return { recordSetId: null, error: 'The requested record set is unknown, ambiguous or not owned by this source. No replacement record set was opened.' };
  return { recordSetId: requests[0], error: null };
}

export function readSourceRegistrySelection(params) {
  const requests = params.getAll('source');
  if (!requests.length) return { sourceId: registry.sources[0].id, error: null };
  const owners = requests.map(request => registry.sources.filter(row => row.id === request || row.aliases.includes(request)));
  if (owners.some(rows => rows.length !== 1) || new Set(owners.map(rows => rows[0]?.id)).size !== 1) return { sourceId: null, error: 'The requested source is unknown or ambiguous. No replacement source was selected.' };
  return { sourceId: owners[0][0].id, error: null };
}
