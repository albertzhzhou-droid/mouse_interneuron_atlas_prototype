export const CONNECTIVITY_ASSERTION_CATEGORIES = Object.freeze([
  { id: 'direct_monosynaptic', label: 'Direct monosynaptic', definition: 'A source explicitly supports a direct synaptic relationship. Exact cell edges additionally require both source and target cell keys.' },
  { id: 'functional_influence', label: 'Functional influence', definition: 'An intervention changes a defined output under its reported condition, including dependence controls. It does not identify a direct synaptic partner.' },
  { id: 'projection_overlap', label: 'Projection overlap', definition: 'The source explicitly reports overlap of projections. Shared positions, tracing groups or regional proximity alone do not establish this category.' },
  { id: 'computational_prediction', label: 'Computational proximity / ligand–receptor', definition: 'A declared computational prediction with its method and input scope. A prediction is not an observed synapse.' },
  { id: 'unknown', label: 'Unknown connectivity', definition: 'The admitted context does not establish one of these connectivity relations. Unknown does not mean biologically absent.' },
]);

const MVP_PATH = 'data/research-mvp-release-0.2.json';
const HAYASHI_PATH = 'data/hayashi-v2a-source-taxonomy-0.1.json';
const RONZANO_PATH = 'data/ronzano-premotor-position-reference-0.1.json';
const CLAIM_CONTEXTS = Object.freeze({
  'CLM-P02-RELAY': ['CND-P02-STAGGERED'],
  'CLM-P03-DI3-NECESSITY': ['CND-P03-ADULT-TRANSECTION'],
  'CLM-P05-KCC2-DEPENDENCE': ['CND-P05-STAGGERED', 'CND-P05-COMPLETE-T8'],
  'CLM-P08-TRANSMITTER-SWITCH': ['CND-P08-NEONATAL', 'CND-P08-ADULT'],
  'CLM-P09-MOUSE-CAUSAL': ['CND-P09-MOUSE-ACUTE-SILENCING', 'CND-P09-MOUSE-CHRONIC-SILENCING', 'CND-P09-MOUSE-ACTIVATION', 'CND-P09-MOUSE-ABLATION'],
  'CLM-P09-HUMAN-CONTEXT': ['CND-P09-HUMAN-EES'],
  'CLM-P14-V3-SPASM': ['CND-P14-S2-CHRONIC'],
  'CLM-P16-V2A-BREATHING': ['CND-P16-C2-HEMISECTION'],
});

function exact(items, id) {
  const found = items.filter((item) => item.id === id);
  if (found.length !== 1) throw new Error(`Expected one admitted source object: ${id}`);
  return found[0];
}

function locator(path, collection, id) { return `${path}#${collection}[id=${id}]`; }

function relationMissingness(figureMissing) {
  return [
    { field: 'exactSourceCellKey', status: 'not_established', reason: 'Population or tracing-group context does not identify an exact presynaptic cell.' },
    { field: 'exactTargetCellKey', status: 'not_established', reason: 'An output or target-region description does not identify an exact postsynaptic cell.' },
    { field: 'directness', status: 'not_established', reason: 'No admitted exact monosynaptic assertion or partner roster is supplied by this bounded adapter.' },
    ...(figureMissing ? [{ field: 'articleFigureLocator', status: 'not_reported_in_admitted_contract', reason: 'The existing contract supplies an article URL and exact JSON objects, but no article figure locator.' }] : []),
  ];
}

/** Display only the reviewed assertions in three existing contracts; never derive cell edges. */
export function buildConnectivityAssertionCatalog({ mvp, hayashi, ronzano }) {
  const records = [];
  for (const [claimId, conditionIds] of Object.entries(CLAIM_CONTEXTS)) {
    const claim = exact(mvp.claims, claimId);
    if (JSON.stringify([...claim.conditionIds].sort()) !== JSON.stringify([...conditionIds].sort())) throw new Error(`Unreviewed condition scope: ${claimId}`);
    for (const conditionId of conditionIds) {
      const condition = exact(mvp.conditions, conditionId);
      if (!claim.sourceIds.includes(condition.sourceId)) throw new Error(`Condition/source mismatch: ${conditionId}`);
      const source = exact(mvp.sources, condition.sourceId);
      const human = claimId === 'CLM-P09-HUMAN-CONTEXT';
      if (condition.species !== (human ? 'Homo sapiens' : 'Mus musculus')) throw new Error(`Unreviewed species context: ${conditionId}`);
      const statementIds = [...new Set([...claim.statementIds, ...condition.statementIds])];
      const statements = statementIds.map((id) => {
        const statement = exact(mvp.evidenceStatements, id);
        if (statement.sourceId !== source.id) throw new Error(`Statement/source mismatch: ${id}`);
        return statement;
      });
      records.push({
        id: `${mvp.releaseId}:${claimId}:${conditionId}`, assertionId: claimId, conditionId,
        category: human ? 'unknown' : 'functional_influence',
        classificationBasis: human ? 'Uncontrolled human association/feasibility; mouse causal substrate is not identified in participants.' : 'Existing condition-specific intervention and causal-test context; this category includes negative dependency controls.',
        title: conditionId, statement: condition.resultSummary, parentStatement: claim.statement,
        species: condition.species, lifeStage: condition.lifeStage, region: condition.injuryLevel,
        endpoint: condition.endpoint, sourceId: source.id, citation: source.citation, doi: source.doi, sourceUrl: source.sourceUrl,
        sourceReleaseId: mvp.releaseId, inputPath: MVP_PATH,
        locators: [locator(MVP_PATH, 'claims', claim.id), locator(MVP_PATH, 'conditions', condition.id), locator(MVP_PATH, 'sources', source.id), ...statementIds.map((id) => locator(MVP_PATH, 'evidenceStatements', id))],
        methods: { intervention: condition.intervention, causalTest: condition.causalTest, measurement: condition.measurement },
        // The claim's entity IDs are reference associations, never participant/cell identities.
        populationEntityContextIds: human ? [] : [...claim.entityIds], parentClaimGrades: [...claim.causalGrades],
        parentClaimGradesScope: 'Whole parent claim only; not assigned as a new grade to each condition.',
        exactSourceCellKey: null, exactTargetCellKey: null, edgeAdmission: false,
        directness: 'not_established', missingness: relationMissingness(true),
        sourceObjects: { claim, condition, source, evidenceStatements: statements },
      });
    }
  }
  for (const id of ['hayashi-2018:type-i', 'hayashi-2018:type-ii']) {
    const type = exact(hayashi.sourceReportedMajorTypes, id);
    if (type.authority !== 'source_reported_population_level' || type.sameCellProjectionTraceAvailable !== false || type.exactBarcodeAssignmentAvailable !== false) throw new Error(`Unreviewed projection scope: ${id}`);
    const source = hayashi.source.publication;
    const sourceLocators = type.sourceLocatorIds.map((key) => exact(hayashi.sourceLocators, key));
    records.push({
      id: `${hayashi.releaseId}:${id}`, assertionId: id, conditionId: null, category: 'unknown',
      classificationBasis: 'Source-reported population projection context; no exact barcode-linked projection trace or projection-overlap assertion.',
      title: `Hayashi V2a ${type.label}`, statement: `${type.networkContext}; ${type.projectionContext}`, parentStatement: null,
      species: hayashi.scope.species, lifeStage: 'Tracing age not specified in these major-type assertions', region: 'Spinal / supraspinal population context; per-cell region unknown', endpoint: 'population projection context',
      sourceId: source.id, citation: source.citation, doi: source.doi, sourceUrl: source.articleUrl,
      sourceReleaseId: hayashi.releaseId, inputPath: HAYASHI_PATH,
      locators: [locator(HAYASHI_PATH, 'sourceReportedMajorTypes', id), ...sourceLocators.map((item) => locator(HAYASHI_PATH, 'sourceLocators', item.id))],
      methods: { authority: type.authority, sourceLocatorDescriptions: sourceLocators.map((item) => item.locator), sequencingContextBoundary: 'P0 pooled sequencing context is separate; it is not assigned as the age or identity of the tracing population.' },
      populationEntityContextIds: [], parentClaimGrades: [], parentClaimGradesScope: 'No causal grade attached.',
      exactSourceCellKey: null, exactTargetCellKey: null, edgeAdmission: false,
      directness: 'not_established', missingness: relationMissingness(false),
      sourceObjects: { majorType: type, publication: source, sourceLocators },
    });
  }
  if (ronzano.relationshipBoundary.crossSourceJoinCount !== 0 || ronzano.relationshipBoundary.registrationCount !== 0 || !ronzano.missingness.some((item) => item.field === 'synapse_roster' && item.status === 'UNAVAILABLE')) throw new Error('Unreviewed tracing relationship scope');
  records.push({
    id: `${ronzano.releaseId}:pooled-tracing-context`, assertionId: 'RONZANO-81976-POOLED-TRACING-CONTEXT', conditionId: null, category: 'unknown',
    classificationBasis: 'The admitted coordinate contract identifies experimental tracing groups, without an exact synapse or partner roster.',
    title: 'Ronzano pooled LG / TA tracing context', statement: ronzano.relationshipBoundary.relationshipToMuscle, parentStatement: ronzano.source.title,
    species: ronzano.source.species.scientificName, lifeStage: `${ronzano.source.lifeStage.injection}; analysis ${ronzano.source.lifeStage.analysisInterval}`,
    region: ronzano.source.region, endpoint: 'experimental muscle tracing groups', sourceId: 'RONZANO-81976', citation: ronzano.source.citation, doi: ronzano.source.doi, sourceUrl: ronzano.source.articleUrl,
    sourceReleaseId: ronzano.releaseId, inputPath: RONZANO_PATH,
    locators: [`${RONZANO_PATH}#source.tracingContext`, `${RONZANO_PATH}#relationshipBoundary`, `${RONZANO_PATH}#missingness[field=synapse_roster]`],
    methods: { tracing: ronzano.source.tracingContext, lifeStage: ronzano.source.lifeStage, cohort: ronzano.source.cohort },
    populationEntityContextIds: [], parentClaimGrades: [], parentClaimGradesScope: 'No causal grade attached.',
    exactSourceCellKey: null, exactTargetCellKey: null, edgeAdmission: false,
    directness: 'not_established', missingness: relationMissingness(false),
    sourceObjects: { source: ronzano.source, relationshipBoundary: ronzano.relationshipBoundary, missingness: ronzano.missingness, sourceFiles: ronzano.sourceFiles },
  });
  if (new Set(records.map((row) => row.id)).size !== records.length) throw new Error('Duplicate assertion identity');
  return {
    catalogId: 'ohri-bounded-connectivity-assertions-0.1.0', version: '0.1.0',
    inputContracts: [mvp, hayashi, ronzano].map((input, i) => ({ path: [MVP_PATH, HAYASHI_PATH, RONZANO_PATH][i], releaseId: input.releaseId })),
    scope: 'Eight admitted SCI claims separated into thirteen conditions, two Hayashi population projection contexts and one Ronzano pooled tracing context. This is not a source-wide connectivity inventory.',
    countUnit: 'source assertion / condition context', cellEdgeCount: 0, synapseCount: null,
    sameCellJoinCount: 0, geometryObjectCount: 0, registrationCount: 0, categories: CONNECTIVITY_ASSERTION_CATEGORIES, records,
  };
}

export function filterConnectivityAssertions(records, filter = {}) {
  const terms = String(filter.query ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  return records.filter((row) => {
    for (const key of ['category', 'species', 'sourceId', 'lifeStage']) if (filter[key] && filter[key] !== 'all' && row[key] !== filter[key]) return false;
    const searchable = JSON.stringify({ id: row.id, assertionId: row.assertionId, conditionId: row.conditionId, title: row.title, statement: row.statement, parentStatement: row.parentStatement, species: row.species, lifeStage: row.lifeStage, region: row.region, endpoint: row.endpoint, citation: row.citation, doi: row.doi, methods: row.methods, locators: row.locators, condition: row.sourceObjects.condition, majorType: row.sourceObjects.majorType, sourceFiles: row.sourceObjects.sourceFiles }).toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

export function reconcileConnectivityAssertionSelection(visible, id) { return visible.some((row) => row.id === id) ? id : null; }

export function connectivityAssertionSummary(catalog) {
  return Object.fromEntries(CONNECTIVITY_ASSERTION_CATEGORIES.map((category) => [category.id, catalog.records.filter((row) => row.category === category.id).length]));
}

export function makeConnectivityAssertionExport(catalog, records, filter, generatedAt) {
  const ids = records.map((row) => row.id);
  if (new Set(ids).size !== ids.length) throw new Error('Export requires distinct exact assertion identities');
  for (const row of records) {
    const admitted = exact(catalog.records, row.id);
    if (JSON.stringify(admitted) !== JSON.stringify(row)) throw new Error('Export requires unchanged admitted assertion records');
    if (row.edgeAdmission || row.exactSourceCellKey !== null || row.exactTargetCellKey !== null) throw new Error('Cell edges are outside this bounded assertion export');
  }
  return {
    format: 'ohri-exact-connectivity-assertion-export', version: catalog.version, catalogId: catalog.catalogId,
    generatedAt, filter: { ...filter }, inputContracts: catalog.inputContracts, scope: catalog.scope,
    countUnit: catalog.countUnit, rowCount: records.length, cellEdgeCount: 0, synapseCount: null,
    sameCellJoinCount: 0, geometryObjectCount: 0, registrationCount: 0,
    categoryLegend: CONNECTIVITY_ASSERTION_CATEGORIES,
    records: records.map((row) => JSON.parse(JSON.stringify(row))),
  };
}

function csvCell(value) {
  const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function connectivityAssertionCsv(exportObject) {
  if (exportObject.format !== 'ohri-exact-connectivity-assertion-export' || exportObject.cellEdgeCount !== 0) throw new Error('Expected a validated assertion export');
  const fields = ['id', 'assertionId', 'conditionId', 'category', 'classificationBasis', 'statement', 'parentStatement', 'species', 'lifeStage', 'region', 'endpoint', 'methods', 'directness', 'exactSourceCellKey', 'exactTargetCellKey', 'edgeAdmission', 'populationEntityContextIds', 'parentClaimGrades', 'parentClaimGradesScope', 'missingness', 'sourceId', 'citation', 'doi', 'sourceUrl', 'sourceReleaseId', 'inputPath', 'locators', 'sourceObjects'];
  return [fields, ...exportObject.records.map((row) => fields.map((field) => row[field]))].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
