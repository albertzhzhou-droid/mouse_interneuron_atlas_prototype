export type ConnectivityAssertionCategory = 'direct_monosynaptic' | 'functional_influence' | 'projection_overlap' | 'computational_prediction' | 'unknown';

export interface ConnectivityCategoryDefinition {
  id: ConnectivityAssertionCategory;
  label: string;
  definition: string;
}

export interface ConnectivityAssertionRecord {
  id: string;
  assertionId: string;
  conditionId: string | null;
  category: ConnectivityAssertionCategory;
  classificationBasis: string;
  title: string;
  statement: string;
  parentStatement: string | null;
  species: string;
  lifeStage: string;
  region: string;
  endpoint: string;
  sourceId: string;
  citation: string;
  doi: string;
  sourceUrl: string;
  sourceReleaseId: string;
  inputPath: string;
  locators: string[];
  methods: Record<string, unknown>;
  populationEntityContextIds: string[];
  parentClaimGrades: string[];
  parentClaimGradesScope: string;
  exactSourceCellKey: null;
  exactTargetCellKey: null;
  edgeAdmission: false;
  directness: 'not_established';
  missingness: Array<{ field: string; status: string; reason: string }>;
  sourceObjects: Record<string, unknown>;
}

export interface ConnectivityAssertionCatalog {
  catalogId: string;
  version: string;
  inputContracts: Array<{ path: string; releaseId: string }>;
  scope: string;
  countUnit: string;
  cellEdgeCount: 0;
  synapseCount: null;
  sameCellJoinCount: 0;
  geometryObjectCount: 0;
  registrationCount: 0;
  categories: readonly ConnectivityCategoryDefinition[];
  records: ConnectivityAssertionRecord[];
}

export interface ConnectivityAssertionFilter {
  query?: string;
  category?: string;
  species?: string;
  sourceId?: string;
  lifeStage?: string;
}

export interface ConnectivityAssertionExport {
  format: 'ohri-exact-connectivity-assertion-export';
  version: string;
  catalogId: string;
  generatedAt: string;
  filter: Record<string, unknown>;
  inputContracts: ConnectivityAssertionCatalog['inputContracts'];
  scope: string;
  countUnit: string;
  rowCount: number;
  cellEdgeCount: 0;
  synapseCount: null;
  sameCellJoinCount: 0;
  geometryObjectCount: 0;
  registrationCount: 0;
  categoryLegend: readonly ConnectivityCategoryDefinition[];
  records: ConnectivityAssertionRecord[];
}

export const CONNECTIVITY_ASSERTION_CATEGORIES: readonly ConnectivityCategoryDefinition[];
export function buildConnectivityAssertionCatalog(inputs: { mvp: unknown; hayashi: unknown; ronzano: unknown }): ConnectivityAssertionCatalog;
export function filterConnectivityAssertions(records: readonly ConnectivityAssertionRecord[], filter?: ConnectivityAssertionFilter): ConnectivityAssertionRecord[];
export function reconcileConnectivityAssertionSelection(records: readonly ConnectivityAssertionRecord[], id: string | null): string | null;
export function connectivityAssertionSummary(catalog: ConnectivityAssertionCatalog): Record<ConnectivityAssertionCategory, number>;
export function makeConnectivityAssertionExport(catalog: ConnectivityAssertionCatalog, records: readonly ConnectivityAssertionRecord[], filter: Record<string, unknown>, generatedAt: string): ConnectivityAssertionExport;
export function connectivityAssertionCsv(exportObject: ConnectivityAssertionExport): string;
