import releaseJson from "../data/atlas-release-0.1.json";
import benchmarkJson from "../data/benchmark-snapshot-2026-08-17.json";
import publicDataCatalogJson from "../data/public-data-catalog-0.4.json";
import publicSourceIntakeRegistryJson from "../data/public-source-intake-registry-0.7.json";
import russHarmonizedTaxonomyCrosswalkJson from "../data/russ-harmonized-taxonomy-crosswalk-0.1.json";
import russReconciliationDossierJson from "../data/russ-reconciliation-dossier-0.1.json";
import tabulaeConditionCatalogJson from "../data/tabulae-condition-catalog-0.1.json";
import tabulaeSpatialLocalSessionJson from "../data/tabulae-spatial-local-session-0.1.json";
import tabulaeSpatialLocalComparisonJson from "../data/tabulae-spatial-local-comparison-0.1.json";
import publicFileAdmissionComposerJson from "../data/public-file-admission-composer-0.1.json";
import publicProvenanceCrateJson from "../data/public-provenance-crate-0.1.json";
import evidenceFeasibilityPlannerJson from "../data/evidence-feasibility-planner-0.1.json";
import evidenceProvenanceTraceJson from "../data/evidence-provenance-trace-0.1.json";
import crossLaneRelationshipAdmissionJson from "../data/cross-lane-relationship-admission-0.1.json";
import publicSourceReleaseAdmissionServiceJson from "../data/public-source-release-admission-service-0.1.json";
import publicSourceAssertionProvenanceJson from "../data/public-source-assertion-provenance-0.1.json";
import publicSourceAuthorizationPlanJson from "../data/public-source-authorization-plan-0.1.json";
import publicSourceIndependentAuthorizationEvidenceJson from "../data/public-source-independent-authorization-evidence-0.1.json";
import interneuronKnowledgeCoverageJson from "../data/interneuron-knowledge-coverage-0.1.json";
import matsonNeuronalSciTimecourseJson from "../data/matson-neuronal-sci-timecourse-0.1.json";
import hayashiV2aSourceTaxonomyJson from "../data/hayashi-v2a-source-taxonomy-0.1.json";
import haringDorsalHornSourceTaxonomyJson from "../data/haring-dorsal-horn-source-taxonomy-0.1.json";
import alkaslasiCholinergicSourceTaxonomyJson from "../data/alkaslasi-cholinergic-source-taxonomy-0.1.json";
import crozatPkd2l1FunctionalProfileJson from "../data/crozat-pkd2l1-functional-profile-0.1.json";
import dmrt3Di6SourceTaxonomyJson from "../data/dmrt3-di6-source-taxonomy-0.1.json";
import roomeDilSourceTaxonomyJson from "../data/roome-dil-source-taxonomy-0.1.json";
import delileDevelopmentalInterneuronTaxonomyJson from "../data/delile-developmental-interneuron-taxonomy-0.1.json";
import publicWorkbenchManifestJson from "../data/release-manifest-2.8.json";
import curatorFeedbackContractJson from "../data/curator-feedback-contract-2.8.json";
import curatorAdjudicationContractJson from "../data/curator-adjudication-contract-2.8.json";
import researchManifestJson from "../data/research-iteration-manifest-2.50.json";
import researchMvpJson from "../data/research-mvp-release-0.2.json";
import observedCellFormLensJson from "../data/observed-cell-form-lens-0.1.json";
import morphologyFidelityContractJson from "../data/morphology-fidelity-contract-0.1.json";
import grpDorsalHornObservedMorphologyJson from "../data/grp-dorsal-horn-observed-morphology-0.1.json";
import dorsalHornObservedMorphologyRoutePackJson from "../data/dorsal-horn-observed-morphology-route-pack-0.1.json";
import functionalClassObservedMorphologyRoutePackJson from "../data/functional-class-observed-morphology-route-pack-0.1.json";
import prpDorsalHornObservedMorphologyRoutePackJson from "../data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json";
import premotorComparisonObservedMorphologyRoutePackJson from "../data/premotor-comparison-observed-morphology-route-pack-0.1.json";
import neurolucidaSourceNativeSomaContourTraceJson from "../data/neurolucida-source-native-soma-contour-trace-0.1.json";
import neurolucidaNativeContourAdmissionCatalogJson from "../data/neurolucida-native-contour-admission-catalog-0.3.json";
import nativeDeltaJson from "../data/neurolucida-native-contour-admission-catalog-0.4.json";
import evidenceAware3dRepresentationContractJson from "../data/evidence-aware-3d-representation-contract-0.5.json";
import crossRegionInternalReferenceJson from "../data/cross-region-internal-reference-0.1.json";
import micronsObservedCellNucleusReferenceJson from "../data/microns-observed-cell-nucleus-reference-0.1.json";
import micronsSourceNativeClippingJson from "../data/microns-source-native-clipping-0.1.json";
import pkd2l1SbfsemVideoReferenceJson from "../data/pkd2l1-sbfsem-video-reference-0.1.json";
import spinalInhibitoryInterneuronVolumeEmReferenceJson from "../data/spinal-inhibitory-interneuron-volume-em-reference-0.1.json";
import bancV888ComparativeInternalReferenceJson from "../data/banc-v888-comparative-internal-reference-0.1.json";
import bancV888CandidateAuditJson from "../data/banc-v888-candidate-audit-0.1.json";
import canoGomezP56MultiomeInterneuronRegistryJson from "../data/cano-gomez-p56-multiome-interneuron-registry-0.1.json";
import researchSourceRegistryJson from "../data/research-source-registry-0.1.json";
import researchModelUpgradeRegistryJson from "../data/research-model-upgrade-registry-0.1.json";
import ronzanoPremotorPositionReferenceJson from "../data/ronzano-premotor-position-reference-0.1.json";
import { deriveResearchSourceRegistrySummary } from "./research-source-registry-summary.js";

export type GeometryStatus = "OBS" | "REG" | "INF" | "SCH" | "SYN";
export type Transmitter =
  | "excitatory"
  | "inhibitory"
  | "mixed_or_unspecified"
  | "state_dependent";

export type AtlasEntity = {
  id: string;
  order: number;
  name: string;
  shortLabel: string;
  entityKind: string;
  classificationAxes: string[];
  transmitter: Transmitter;
  markers: string[];
  segmentGroup: "cervical" | "thoracic" | "lumbar" | "sacral";
  segmentLabel: string;
  lamina: string;
  laterality: string;
  endpoint: "locomotion" | "breathing" | "spasm";
  injuryType: string;
  injuryContext: string;
  geometry: {
    status: GeometryStatus;
    pathStatus: GeometryStatus;
    schematicPosition: [number, number, number];
    seed: number;
  };
  claimGrades: string[];
  endpointLevels: string[];
  allowedClaim: string;
  notEstablished: string;
  negativeFindings: string[];
  ledgerId: string;
  fullTextStatus: string;
  citation: string;
  doi: string;
  sourceUrl: string;
  humanCausalEvidence?: boolean;
};

export type AtlasRelease = Omit<typeof releaseJson, "entities"> & {
  entities: AtlasEntity[];
};

export type BenchmarkResource = (typeof benchmarkJson.resources)[number];

export const atlasRelease = releaseJson as AtlasRelease;
export const benchmarkSnapshot = benchmarkJson;
export const publicDataCatalog = publicDataCatalogJson;
export const publicSourceIntakes = publicSourceIntakeRegistryJson.records;
export const publicSourceIntakeRegistry = publicSourceIntakeRegistryJson;
export const russHarmonizedTaxonomyCrosswalk = russHarmonizedTaxonomyCrosswalkJson;
export const russReconciliationDossier = russReconciliationDossierJson;
export const tabulaeConditionCatalog = tabulaeConditionCatalogJson;
export const tabulaeSpatialLocalSession = tabulaeSpatialLocalSessionJson;
export const tabulaeSpatialLocalComparison = tabulaeSpatialLocalComparisonJson;
export const publicFileAdmissionComposer = publicFileAdmissionComposerJson;
export const publicProvenanceCrate = publicProvenanceCrateJson;
export const evidenceFeasibilityPlanner = evidenceFeasibilityPlannerJson;
export const evidenceProvenanceTrace = evidenceProvenanceTraceJson;
export const crossLaneRelationshipAdmission = crossLaneRelationshipAdmissionJson;
export const publicSourceReleaseAdmissionService = publicSourceReleaseAdmissionServiceJson;
export const publicSourceAssertionProvenance = publicSourceAssertionProvenanceJson;
export const publicSourceAuthorizationPlan = publicSourceAuthorizationPlanJson;
export const publicSourceIndependentAuthorizationEvidence = publicSourceIndependentAuthorizationEvidenceJson;
export const interneuronKnowledgeCoverage = interneuronKnowledgeCoverageJson;
export const matsonNeuronalSciTimecourse = matsonNeuronalSciTimecourseJson;
export const hayashiV2aSourceTaxonomy = hayashiV2aSourceTaxonomyJson;
export const haringDorsalHornSourceTaxonomy = haringDorsalHornSourceTaxonomyJson;
export const alkaslasiCholinergicSourceTaxonomy = alkaslasiCholinergicSourceTaxonomyJson;
export const crozatPkd2l1FunctionalProfile = crozatPkd2l1FunctionalProfileJson;
export const dmrt3Di6SourceTaxonomy = dmrt3Di6SourceTaxonomyJson;
export const roomeDilSourceTaxonomy = roomeDilSourceTaxonomyJson;
export const delileDevelopmentalInterneuronTaxonomy = delileDevelopmentalInterneuronTaxonomyJson;
export const publicWorkbenchManifest = publicWorkbenchManifestJson;
export const curatorFeedbackContract = curatorFeedbackContractJson;
export const curatorAdjudicationContract = curatorAdjudicationContractJson;
export const researchMvpManifest = researchManifestJson;
export const researchMvpRelease = researchMvpJson;
export const observedCellFormLens = observedCellFormLensJson;
export const morphologyFidelityContract = morphologyFidelityContractJson;
export const grpDorsalHornObservedMorphology = grpDorsalHornObservedMorphologyJson;
export const dorsalHornObservedMorphologyRoutePack = dorsalHornObservedMorphologyRoutePackJson;
export const functionalClassObservedMorphologyRoutePack = functionalClassObservedMorphologyRoutePackJson;
export const prpDorsalHornObservedMorphologyRoutePack = prpDorsalHornObservedMorphologyRoutePackJson;
export const premotorComparisonObservedMorphologyRoutePack = premotorComparisonObservedMorphologyRoutePackJson;
export const neurolucidaSourceNativeSomaContourTrace = neurolucidaSourceNativeSomaContourTraceJson;
export const neurolucidaNativeContourAdmissionCatalog = { ...nativeDeltaJson, baseCatalogSnapshot: neurolucidaNativeContourAdmissionCatalogJson, records: [...neurolucidaNativeContourAdmissionCatalogJson.records, ...nativeDeltaJson.addedRecords] };
export const evidenceAware3dRepresentationContract = evidenceAware3dRepresentationContractJson;
export const micronsSourceNativeClipping = micronsSourceNativeClippingJson;
export const pkd2l1SbfsemVideoReference = pkd2l1SbfsemVideoReferenceJson;
export const spinalInhibitoryInterneuronVolumeEmReference = spinalInhibitoryInterneuronVolumeEmReferenceJson;
export const bancV888ComparativeInternalReference = bancV888ComparativeInternalReferenceJson;
export const bancV888CandidateAudit = bancV888CandidateAuditJson;
export const canoGomezP56MultiomeInterneuronRegistry = canoGomezP56MultiomeInterneuronRegistryJson;

for (const route of dorsalHornObservedMorphologyRoutePackJson.routes.filter((candidate) => candidate.censusMembership)) {
  const frozenForm = observedCellFormLensJson.records.find((record) => record.neuronId === route.sourceRecord.neuronId);
  const frozenFidelity = morphologyFidelityContractJson.records.find((record) => record.neuronId === route.sourceRecord.neuronId);
  if (!frozenForm || JSON.stringify(frozenForm) !== JSON.stringify(route.observedCellFormRecord)) {
    throw new Error(`Dorsal-horn route NMO ${route.sourceRecord.neuronId} does not exactly reuse its frozen cell-form record`);
  }
  if (!frozenFidelity || JSON.stringify(frozenFidelity) !== JSON.stringify(route.fidelityRecord)) {
    throw new Error(`Dorsal-horn route NMO ${route.sourceRecord.neuronId} does not exactly reuse its frozen fidelity record`);
  }
}

const supplementaryDorsalHornRoutes = dorsalHornObservedMorphologyRoutePackJson.routes.filter((route) => !route.censusMembership);
const supplementaryFunctionalClassRoutes = functionalClassObservedMorphologyRoutePackJson.routes.filter((route) => !route.censusMembership);
const supplementaryPrpDorsalHornRoutes = prpDorsalHornObservedMorphologyRoutePackJson.routes.filter((route) => !route.censusMembership);
const supplementaryPremotorComparisonRoutes = premotorComparisonObservedMorphologyRoutePackJson.routes.filter((route) => !route.censusMembership);
if (supplementaryFunctionalClassRoutes.length !== functionalClassObservedMorphologyRoutePackJson.routes.length) {
  throw new Error("Functional-class route pack unexpectedly claims frozen census membership");
}
if (supplementaryPrpDorsalHornRoutes.length !== prpDorsalHornObservedMorphologyRoutePackJson.routes.length) {
  throw new Error("PrP dorsal-horn route pack unexpectedly claims frozen census membership");
}
if (supplementaryPremotorComparisonRoutes.length !== premotorComparisonObservedMorphologyRoutePackJson.routes.length) {
  throw new Error("Premotor comparison route pack unexpectedly claims frozen census membership");
}
export const observedCellFormRecords = [
  ...observedCellFormLensJson.records,
  grpDorsalHornObservedMorphologyJson.observedCellFormRecord,
  ...supplementaryDorsalHornRoutes.map((route) => route.observedCellFormRecord),
  ...supplementaryFunctionalClassRoutes.map((route) => route.observedCellFormRecord),
  ...supplementaryPrpDorsalHornRoutes.map((route) => route.observedCellFormRecord),
  ...supplementaryPremotorComparisonRoutes.map((route) => route.observedCellFormRecord),
];
export const morphologyFidelityRecords = [
  ...morphologyFidelityContractJson.records,
  grpDorsalHornObservedMorphologyJson.fidelityRecord,
  ...supplementaryDorsalHornRoutes.map((route) => route.fidelityRecord),
  ...supplementaryFunctionalClassRoutes.map((route) => route.fidelityRecord),
  ...supplementaryPrpDorsalHornRoutes.map((route) => route.fidelityRecord),
  ...supplementaryPremotorComparisonRoutes.map((route) => route.fidelityRecord),
];

const currentPremotorComparisonWarnings = premotorComparisonObservedMorphologyRoutePackJson.routes[0].hardBoundaries
  .filter((boundary) => !boundary.includes("has no validated parser or admitted semantic objects"))
  .filter((boundary) => !boundary.includes("original contour vertices are unavailable"))
  .concat(
    "The checksum-pinned Neurolucida DAT has now been parsed for NMO 45718 and independently cross-checked. Exactly eight source-labelled soma contour objects with 275 ordered vertices are admitted as source-native line traces only. No other DAT annotation is promoted to a bouton, contact, synapse, membrane, surface, volume, or internal structure.",
    "The standardized SWC header states that 8 original soma contours were averaged into 8 type-1 soma points. The separately checksum-gated DAT viewer now preserves the 275 source-native contour vertices, but no DAT-to-SWC coordinate transform or vertex correspondence is established. The SWC points and DAT traces are not a membrane, nucleus, or volumetric soma segmentation.",
  );

export const observedMorphologyRoutes = [
  {
    routeId: grpDorsalHornObservedMorphologyJson.routeId,
    contractId: grpDorsalHornObservedMorphologyJson.contractId,
    releaseId: grpDorsalHornObservedMorphologyJson.releaseId,
    title: grpDorsalHornObservedMorphologyJson.title,
    authority: grpDorsalHornObservedMorphologyJson.authority,
    sourceAuthority: "NEUROMORPHO_RELEASE_8_6_124_CENSUS_CHILD",
    censusMembership: true,
    sourceRecord: grpDorsalHornObservedMorphologyJson.sourceRecord,
    sourceObjects: grpDorsalHornObservedMorphologyJson.sourceObjects,
    observedCellFormRecord: grpDorsalHornObservedMorphologyJson.observedCellFormRecord,
    fidelityRecord: grpDorsalHornObservedMorphologyJson.fidelityRecord,
    renderingContract: grpDorsalHornObservedMorphologyJson.renderingContract,
    identityBoundary: grpDorsalHornObservedMorphologyJson.identityBoundary,
    sourceLinks: {
      ...grpDorsalHornObservedMorphologyJson.sourceLinks,
      standardizedSwc: null,
    },
    warnings: grpDorsalHornObservedMorphologyJson.hardBoundaries,
  },
  ...dorsalHornObservedMorphologyRoutePackJson.routes.map((route) => ({
    routeId: route.routeId,
    contractId: dorsalHornObservedMorphologyRoutePackJson.contractId,
    releaseId: dorsalHornObservedMorphologyRoutePackJson.releaseId,
    title: route.title,
    authority: route.authority,
    sourceAuthority: route.sourceAuthority,
    censusMembership: route.censusMembership,
    sourceRecord: route.sourceRecord,
    sourceObjects: route.sourceObjects,
    observedCellFormRecord: route.observedCellFormRecord,
    fidelityRecord: route.fidelityRecord,
    renderingContract: route.renderingContract,
    identityBoundary: route.identityBoundary,
    sourceLinks: route.sourceLinks,
    warnings: route.hardBoundaries,
  })),
  ...functionalClassObservedMorphologyRoutePackJson.routes.map((route) => ({
    routeId: route.routeId,
    contractId: functionalClassObservedMorphologyRoutePackJson.contractId,
    releaseId: functionalClassObservedMorphologyRoutePackJson.releaseId,
    title: route.title,
    authority: route.authority,
    sourceAuthority: route.sourceAuthority,
    censusMembership: route.censusMembership,
    sourceRecord: route.sourceRecord,
    sourceObjects: route.sourceObjects,
    observedCellFormRecord: route.observedCellFormRecord,
    fidelityRecord: route.fidelityRecord,
    nativeDatContract: route.nativeDatContract,
    renderingContract: route.renderingContract,
    identityBoundary: route.identityBoundary,
    sourceLinks: route.sourceLinks,
    warnings: route.hardBoundaries,
  })),
  ...prpDorsalHornObservedMorphologyRoutePackJson.routes.map((route) => ({
    routeId: route.routeId,
    contractId: prpDorsalHornObservedMorphologyRoutePackJson.contractId,
    releaseId: prpDorsalHornObservedMorphologyRoutePackJson.releaseId,
    title: route.title,
    authority: route.authority,
    sourceAuthority: route.sourceAuthority,
    censusMembership: route.censusMembership,
    sourceRecord: route.sourceRecord,
    sourceObjects: route.sourceObjects,
    observedCellFormRecord: route.observedCellFormRecord,
    fidelityRecord: route.fidelityRecord,
    nativeDatContract: route.nativeDatContract,
    renderingContract: route.renderingContract,
    identityBoundary: route.identityBoundary,
    sourceLinks: route.sourceLinks,
    warnings: route.hardBoundaries,
  })),
  ...premotorComparisonObservedMorphologyRoutePackJson.routes.map((route) => ({
    routeId: route.routeId,
    contractId: premotorComparisonObservedMorphologyRoutePackJson.contractId,
    releaseId: premotorComparisonObservedMorphologyRoutePackJson.releaseId,
    title: route.title,
    authority: route.authority,
    sourceAuthority: route.sourceAuthority,
    censusMembership: route.censusMembership,
    sourceRecord: route.sourceRecord,
    sourceObjects: route.sourceObjects,
    observedCellFormRecord: route.observedCellFormRecord,
    fidelityRecord: route.fidelityRecord,
    nativeDatContract: route.nativeDatContract,
    renderingContract: route.renderingContract,
    identityBoundary: route.identityBoundary,
    sourceLinks: route.sourceLinks,
    warnings: currentPremotorComparisonWarnings,
  })),
];
export const observedMorphologyRouteByNeuronId = new Map(
  observedMorphologyRoutes.map((route) => [route.sourceRecord.neuronId, route]),
);

const expectedActiveMorphologyIds = [45674, 45718, 50394, 50408, 50424, 104003, 108974, 109005, 109021, 170035, 242822, 249676, 260150];
const activeMorphologyIds = observedCellFormRecords.map((record) => record.neuronId).sort((a, b) => a - b);
if (JSON.stringify(activeMorphologyIds) !== JSON.stringify(expectedActiveMorphologyIds)) {
  throw new Error(`Active main-scene morphology identities drifted: ${activeMorphologyIds.join(", ")}`);
}
for (const [label, values] of [
  ["neuron ID", observedCellFormRecords.map((record) => String(record.neuronId))],
  ["asset ID", observedCellFormRecords.map((record) => record.assetId)],
  ["geometry path", morphologyFidelityRecords.map((record) => record.geometry.path)],
] as const) {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate active morphology ${label}`);
}
export const crossRegionInternalReference = crossRegionInternalReferenceJson;
export const micronsObservedCellNucleusReference = micronsObservedCellNucleusReferenceJson;
export const researchSourceRegistry = researchSourceRegistryJson;
export const researchSourceRegistrySummary = deriveResearchSourceRegistrySummary(researchSourceRegistryJson);
export const researchModelUpgradeRegistry = researchModelUpgradeRegistryJson;
export const ronzanoPremotorPositionReference = ronzanoPremotorPositionReferenceJson;

export type ResearchMvpRelease = typeof researchMvpJson;
export type ObservedCellFormLens = typeof observedCellFormLensJson;
export type ObservedCellFormRecord = (typeof observedCellFormRecords)[number];
export type MorphologyFidelityContract = typeof morphologyFidelityContractJson;
export type MorphologyFidelityRecord = (typeof morphologyFidelityRecords)[number];
export type GrpDorsalHornObservedMorphology = typeof grpDorsalHornObservedMorphologyJson;
export type DorsalHornObservedMorphologyRoutePack = typeof dorsalHornObservedMorphologyRoutePackJson;
export type FunctionalClassObservedMorphologyRoutePack = typeof functionalClassObservedMorphologyRoutePackJson;
export type PrpDorsalHornObservedMorphologyRoutePack = typeof prpDorsalHornObservedMorphologyRoutePackJson;
export type PremotorComparisonObservedMorphologyRoutePack = typeof premotorComparisonObservedMorphologyRoutePackJson;
export type NeurolucidaSourceNativeSomaContourTrace = typeof neurolucidaSourceNativeSomaContourTraceJson;
export type NeurolucidaNativeContourAdmissionCatalog = typeof neurolucidaNativeContourAdmissionCatalog;
export type ObservedMorphologyRoute = (typeof observedMorphologyRoutes)[number];
export type EvidenceAware3dRepresentationContract = typeof evidenceAware3dRepresentationContractJson;
export type CrossRegionInternalReference = typeof crossRegionInternalReferenceJson;
export type MicronsObservedCellNucleusReference = typeof micronsObservedCellNucleusReferenceJson;
export type ResearchSourceRegistry = typeof researchSourceRegistryJson;
export type ResearchModelUpgradeRegistry = typeof researchModelUpgradeRegistryJson;
export type RonzanoPremotorPositionReference = typeof ronzanoPremotorPositionReferenceJson;
export type ResearchSourceRecord = ResearchSourceRegistry["sources"][number];
export type PublicDataCatalog = typeof publicDataCatalogJson;
export type PublicDataCatalogSource = PublicDataCatalog["sources"][number];
export type PublicDataQueueItem = PublicDataCatalog["upgradeQueue"][number];
export type PublicSourceIntake = (typeof publicSourceIntakes)[number];
export type RussHarmonizedTaxonomyCrosswalk = typeof russHarmonizedTaxonomyCrosswalkJson;
export type RussReconciliationDossier = typeof russReconciliationDossierJson;
export type TabulaeConditionCatalog = typeof tabulaeConditionCatalogJson;
export type TabulaeSpatialLocalSession = typeof tabulaeSpatialLocalSessionJson;
export type TabulaeSpatialLocalComparison = typeof tabulaeSpatialLocalComparisonJson;
export type PublicFileAdmissionComposer = typeof publicFileAdmissionComposerJson;
export type PublicProvenanceCrate = typeof publicProvenanceCrateJson;
export type EvidenceFeasibilityPlanner = typeof evidenceFeasibilityPlannerJson;
export type EvidenceProvenanceTrace = typeof evidenceProvenanceTraceJson;
export type CrossLaneRelationshipAdmission = typeof crossLaneRelationshipAdmissionJson;
export type PublicSourceReleaseAdmissionService = typeof publicSourceReleaseAdmissionServiceJson;
export type PublicSourceAssertionProvenance = typeof publicSourceAssertionProvenanceJson;
export type PublicSourceAuthorizationPlan = typeof publicSourceAuthorizationPlanJson;
export type PublicSourceIndependentAuthorizationEvidence = typeof publicSourceIndependentAuthorizationEvidenceJson;
export type InterneuronKnowledgeCoverage = typeof interneuronKnowledgeCoverageJson;
export type MatsonNeuronalSciTimecourse = typeof matsonNeuronalSciTimecourseJson;
export type HayashiV2aSourceTaxonomy = typeof hayashiV2aSourceTaxonomyJson;
export type HaringDorsalHornSourceTaxonomy = typeof haringDorsalHornSourceTaxonomyJson;
export type AlkaslasiCholinergicSourceTaxonomy = typeof alkaslasiCholinergicSourceTaxonomyJson;
export type Dmrt3Di6SourceTaxonomy = typeof dmrt3Di6SourceTaxonomyJson;
export type RoomeDilSourceTaxonomy = typeof roomeDilSourceTaxonomyJson;
export type DelileDevelopmentalInterneuronTaxonomy = typeof delileDevelopmentalInterneuronTaxonomyJson;
export type RussTaxonomyGroup = RussHarmonizedTaxonomyCrosswalk["groups"][number];
export type RussTaxonomyPopulation = RussHarmonizedTaxonomyCrosswalk["populations"][number];
export const PUBLIC_DATA_ADMISSION_STATUSES = [
  "bundled_local",
  "ready_for_metadata_audit",
  "metadata_audited",
  "ready_for_adapter",
] as const;
export type PublicDataAdmissionStatus = (typeof PUBLIC_DATA_ADMISSION_STATUSES)[number];

export function effectivePublicDataAdmissionStatus(source: PublicDataCatalogSource): PublicDataAdmissionStatus {
  return publicSourceIntakes.some((intake) => intake.sourceId === source.id)
    ? "metadata_audited"
    : source.admissionStatus;
}
export type ResearchEntity = ResearchMvpRelease["entities"][number];
export type ResearchClaim = ResearchMvpRelease["claims"][number];
export type ResearchCondition = ResearchMvpRelease["conditions"][number];
export type ResearchStatement = ResearchMvpRelease["evidenceStatements"][number];

export const TRANSMITTER_COLORS: Record<Transmitter, string> = {
  excitatory: "#0072B2",
  inhibitory: "#D55E00",
  mixed_or_unspecified: "#6F5A8A",
  state_dependent: "#CC79A7",
};

export const STATUS_LABELS: Record<GeometryStatus, string> = {
  OBS: "Observed",
  REG: "Registered",
  INF: "Inferred",
  SCH: "Schematic",
  SYN: "Synthetic",
};
