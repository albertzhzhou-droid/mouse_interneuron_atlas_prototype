"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import delileDevelopmentalTaxonomyJson from "../data/delile-developmental-interneuron-taxonomy-0.1.json";
import sathyamurthySourceTaxonomyJson from "../data/sathyamurthy-source-taxonomy-0.1.json";
import {
  alkaslasiCholinergicSourceTaxonomy,
  canoGomezP56MultiomeInterneuronRegistry,
  crozatPkd2l1FunctionalProfile,
  dmrt3Di6SourceTaxonomy,
  haringDorsalHornSourceTaxonomy,
  hayashiV2aSourceTaxonomy,
  roomeDilSourceTaxonomy,
  russHarmonizedTaxonomyCrosswalk,
} from "./atlas-types";
import CanoGomezGlutLabelBrowser from "./CanoGomezGlutLabelBrowser";
import glutSourceLabels from "../data/cano-gomez-glut-active-ident-labels-0.1.json";
import ResearchRecordEvidenceFingerprint, { type EvidenceFingerprintAxis } from "./ResearchRecordEvidenceFingerprint";
import SourceRecordDeltaInspector, { type SourceRecordDeltaDisplayRow } from "./SourceRecordDeltaInspector";
import { buildSourceRecordDelta } from "./source-record-delta.js";

type HaringTaxonomy = typeof haringDorsalHornSourceTaxonomy;
type HaringProfile = HaringTaxonomy["profiles"][number];
type AlkaslasiTaxonomy = typeof alkaslasiCholinergicSourceTaxonomy;
type AlkaslasiProfile = AlkaslasiTaxonomy["profiles"][number];
type RoomeTaxonomy = typeof roomeDilSourceTaxonomy;
type RoomeProfile = RoomeTaxonomy["profiles"][number];
type DelileTaxonomy = typeof delileDevelopmentalTaxonomyJson;
type DelileProfile = DelileTaxonomy["profiles"][number];
type CanoGomezContextField = {
  field: "anatomy" | "source" | "Sex";
  status: string;
  missingCount: number;
  emptyCount: number;
  counts: Array<{ value: string; count: number }>;
};
type CanoGomezProfile = {
  profileId: string;
  recordKind: string;
  unitOfObservation: string;
  sourceObjectId: "cholinergic";
  sourceFileName: string;
  sourceGroup: "CHOL_IN";
  sourceLocalLabel: string;
  nucleusCount: number;
  assignmentAuthority: string;
  stableIdentityField: string;
  orderedCompoundNucleusKeysSha256: string;
  contextFieldCounts: CanoGomezContextField[];
  markerEvidenceStatus: string;
  geometryAuthority: {
    geometryObjectCount: number;
    internalStructureObjectCount: number;
    sameCellLinkCount: number;
    atlasRegistrationCount: number;
  };
  rosterLink: { artifactFileName: string; idField: string; filterField: string; filterEquals: string };
};
type CanoGomezRegistry = {
  releaseId: string;
  datasetId: "GSE318731";
  lifeStage: "P56";
  identityAuthority: { mode: string; crossAssayCellIdentityVerified: boolean; sameCellAssertionAdmitted: false; boundary: string };
  metadataFieldCoverage: { boundary: string };
  sourceReferences: {
    dataRepository: { url: string };
    publication: { doi: string; articleUrl: string; rightsBoundary: string };
  };
  denominatorReconciliation: {
    sourceTotalNucleusCount: number;
    confirmedInterneuronNucleusCount: number;
    confirmedInterneuronProfileCount: number;
    paperReportedNeuronTypeCount: number;
  };
  sourceObjects: Array<{ objectId: string; sourceRdsBytes: number; sourceRdsSha256: string }>;
  artifacts: Array<{ artifactKind: string; rowCount: number; compressedSha256: string }>;
  profiles: CanoGomezProfile[];
  hardBoundaries: string[];
};
type SourceNamespace =
  | "russ-2021"
  | "sathyamurthy-2018"
  | "hayashi-2018:GSE108788"
  | "haring-2018:GSE103840"
  | "alkaslasi-2021:GSE167597"
  | "iglesias-gonzalez-2021:gse185731:mmusculus"
  | "roome-2026:GSE291462"
  | "delile-2019:E-MTAB-7320"
  | "crozat-2025:figshare-29430869-v2"
  | "cano-gomez-2026:GSE318731";
type TypeProfile = {
  id: string;
  namespace: SourceNamespace;
  parentSourceId: string;
  recordKind: string;
  unitOfObservation: string;
  assignmentAuthority: string;
  cellRosterAvailability: string;
  canonicalIdentityStatus: "not_established";
  sourceLabel: string;
  rawLabels: string[];
  sourceName: string;
  sourceAccession: string;
  sourceUrl: string;
  articleUrl: string;
  regionClass: string;
  transmitterClass: string;
  projectUseClass: string;
  markers: string[];
  lifeStage: string;
  spinalScope: string;
  spatialDomainContext: string;
  rostrocaudalContext: string;
  majorTypeContext: string;
  profileAuthority: string;
  samplingCount: number | null;
  samplingUnit: string | null;
  samplingBoundary: string;
  putativeCellType: string;
  putativeStatus: string;
  activityEvidence: Array<{ context: string; finding: string; sourceLocatorIds: string[]; interpretationBoundary: string }>;
  locatorIds: string[];
  missingEvidence: Record<string, string>;
  lineageHints: Array<{ target: string; status: string; evidence: string; boundary: string }>;
  identificationRuleIds: string[];
  haringDetail: HaringProfile | null;
  roomeDetail?: RoomeProfile | null;
  delileDetail?: DelileProfile | null;
  canoGomezDetail?: CanoGomezProfile | null;
};

type HayashiProfile = {
  id: string;
  sourceLocalLabel: string;
  samplingCount: { value: number; unit: string; interpretation: string };
  markerPanel: string[];
  spatialDomainContext: string;
  rostrocaudalContext: string;
  majorTypeMembership: string;
  chx10LowContext: string;
  projectUseClass: string;
  fieldLocatorIds: string[];
};

type HayashiTaxonomy = {
  releaseId: string;
  source: {
    publication: { citation: string; doi: string; articleUrl: string; reuseStatus: string; rightsBoundary: string };
    geo: {
      accession: string;
      recordUrl: string;
      sampleAccession: string;
      sraStudyAccession: string;
      bioProjectAccession: string;
      sampleFrame: {
        sourceAnimalCount: number;
        prePoolingFACSCollectedCellCountByRegion: { cervical: number; lumbar: number };
        pooledLibraryCount: number;
        independentLibraryCount: number;
        tenXChemistry: string;
        animalResolvedReplicateCount: number;
        cellsProcessedApproximate: number;
        qcRetainedCellCount: number;
        articleAssignedCervicalCellCount: number;
        articleAssignedLumbarCellCount: number;
        articleRegionAssignmentMethod: string;
        cellRegionAssignmentAvailableInGeoMatrix: boolean;
        interpretationBoundary: string;
      };
      countMatrixAsset: {
        fileName: string;
        compressedBytes: number;
        compressedSha256: string;
        uncompressedBytes: number;
        uncompressedSha256: string;
        geneRowCount: number;
        cellBarcodeColumnCount: number;
        geneInclusionRule: string;
        matrixReanalysis: {
          countingRule: string;
          v2aMarkerPanel: string[];
          v2aMarkerPositiveBarcodeCount: number;
          v2aMarkerPositivePercentage: number;
          articleReportedV2aMarkerPositivePercentage: number;
          slc17a6PositiveBarcodeCount: number;
          slc17a6PositivePercentage: number;
          articleReportedSlc17a6PositivePercentage: number;
          reproducibilityStatus: string;
          interpretationBoundary: string;
        };
        clusterAnnotationColumnAvailable: boolean;
        majorTypeAnnotationColumnAvailable: boolean;
        spinalRegionAnnotationColumnAvailable: boolean;
        sourceFileBundled: boolean;
        derivedFactualMetadataBundled: boolean;
        reuseStatus: string;
        rightsBoundary: string;
      };
    };
  };
  scope: {
    species: string;
    lifeStage: string;
    spinalRegion: string;
    reportedClusterCount: number;
    reportedQcRetainedCellCount: number;
    exactCrossSourceIdentityCount: number;
    projectRegistrationCount: number;
  };
  sourceReportedMajorTypes: Array<{
    id: string;
    label: string;
    chx10Context: string;
    networkContext: string;
    projectionContext: string;
    projectUseClass: string;
    authority: string;
    exactBarcodeAssignmentAvailable: boolean;
  }>;
  sourceLocators: Array<{ id: string; locator: string; supportsFields: string[]; evidenceStatus: string }>;
  profiles: HayashiProfile[];
  globalMissingEvidence: Record<string, string>;
  hardBoundaries: string[];
};

type SathyProfile = {
  id: string;
  sourceLocalLabel: string;
  rawLabels: string[];
  regionClass: string;
  transmitterClass: string;
  projectUseClass: string;
  samplingCount: { value: number; unit: string; interpretation: string };
  putativeCellTypeLabel: string;
  putativeAssignmentStatus: string;
  figure4Markers: string[];
  activityEvidence: Array<{ context: string; finding: string; sourceLocatorIds: string[]; interpretationBoundary: string }>;
  missingEvidence: Record<string, string>;
  fieldLocators: Record<string, string | string[]>;
};

type SathyLineageMapping = {
  sourceProfileId: string;
  candidateTargetNamespace: string;
  candidateTargetLabel: string;
  mappingStatus: string;
  basis: string;
  sourceLocatorIds: string[];
  reason: string;
  notEstablished: string;
};

type SathyTaxonomy = {
  releaseId: string;
  releaseDate: string;
  source: {
    publication: {
      citation: string;
      doi: string;
      articleUrl: string;
      license: { id: string; url: string; appliesTo: string; rightsBoundary: string };
    };
    geo: {
      accession: string;
      recordUrl: string;
      sampleFrame: {
        strain: string;
        ageWeeks: string;
        sex: string;
        conditionSexBreakdown: Record<"baseline" | "formalin" | "rotarod", { malePooledSamples: number; femalePooledSamples: number }>;
        geoAccessionCount: number;
        independentDropSeqSampleCount: number;
        baselineIndependentSampleCount: number;
        formalinIndependentSampleCount: number;
        rotarodIndependentSampleCount: number;
        formalinSequencingReactionCount: number;
        micePerPooledSample: number;
        derivedMouseCountFromReportedPooling: number;
        sourceLocatorIds: string[];
        interpretationBoundary: string;
      };
      clusterMetadataAsset: {
        sha256: string;
        bytes: number;
        sourceFileBundled: boolean;
        derivedFactualMetadataBundled: boolean;
        reuseStatus: string;
      };
    };
  };
  scope: {
    species: string;
    lifeStage: string;
    spinalRegion: string;
    modality: string;
    reportedClusterCount: number;
    displayedProfileCount: number;
    reportedNeuronalNucleiCount: number;
    observedAssignedNeuronalNucleiCount: number;
    samplingCountInterpretation: string;
    displayedNonMotorNeuronUnresolvedCount: number;
    displayedMotorNeuronContextCount: number;
    exactCrossSourceIdentityCount: number;
    projectRegistrationCount: number;
  };
  sourceLocators: Array<{ id: string; locator: string; supportsFields: string[]; evidenceStatus: string }>;
  profiles: SathyProfile[];
  candidateLineageMappings: SathyLineageMapping[];
  hardBoundaries: string[];
};

const sathyTaxonomy = sathyamurthySourceTaxonomyJson as unknown as SathyTaxonomy;
const hayashiTaxonomy = hayashiV2aSourceTaxonomy as unknown as HayashiTaxonomy;
const haringTaxonomy = haringDorsalHornSourceTaxonomy;
const alkaslasiTaxonomy = alkaslasiCholinergicSourceTaxonomy;
const crozatProfileContract = crozatPkd2l1FunctionalProfile;
const dmrt3Taxonomy = dmrt3Di6SourceTaxonomy;
const roomeTaxonomy = roomeDilSourceTaxonomy;
const delileTaxonomy = delileDevelopmentalTaxonomyJson as DelileTaxonomy;
const canoGomezRegistry = canoGomezP56MultiomeInterneuronRegistry as unknown as CanoGomezRegistry;
const canoGomezConfirmedNucleusCount = canoGomezRegistry.profiles.reduce((total, profile) => total + profile.nucleusCount, 0);
if (canoGomezRegistry.datasetId !== "GSE318731"
  || canoGomezRegistry.profiles.length !== 11
  || new Set(canoGomezRegistry.profiles.map((profile) => profile.profileId)).size !== canoGomezRegistry.profiles.length
  || canoGomezRegistry.profiles.length !== canoGomezRegistry.denominatorReconciliation.confirmedInterneuronProfileCount
  || canoGomezConfirmedNucleusCount !== canoGomezRegistry.denominatorReconciliation.confirmedInterneuronNucleusCount
  || canoGomezRegistry.profiles.some((profile) => profile.sourceGroup !== "CHOL_IN"
    || profile.markerEvidenceStatus !== "NOT_EXTRACTED_NO_LABEL_TOKEN_INFERENCE"
    || Object.values(profile.geometryAuthority).some((count) => count !== 0))) {
  throw new Error("Cano-Gomez confirmed CHOL_IN registry boundary is invalid");
}
type SourceFilter = "all" | SourceNamespace;
type RegionFilter = "all" | "dorsal" | "mid" | "ventral" | "central" | "not_established";
type TransmitterFilter = "all" | "excitatory" | "inhibitory" | "mixed" | "cholinergic" | "not_established";
type InitialParam = string | string[] | undefined;

function prettify(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function transmitterDisplay(profile: TypeProfile) {
  return profile.namespace === "crozat-2025:figshare-29430869-v2"
    ? "Inhibitory / GABAergic"
    : profile.namespace === "delile-2019:E-MTAB-7320"
      ? "Not established by the source contract"
    : profile.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus"
      ? "Inhibitory · dual GABAergic/glycinergic population context"
    : prettify(profile.transmitterClass);
}

function samplingCountDisplay(profile: TypeProfile) {
  if (profile.namespace === "crozat-2025:figshare-29430869-v2") return "Multiple experiment-specific N/n";
  return profile.samplingCount === null
    ? "Not retained"
    : `${profile.samplingCount.toLocaleString("en-US")} ${profile.samplingUnit}`;
}

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function normalizeRegion(value: string) {
  if (value === "deep_dorsal_or_mid") return "mid";
  return value;
}

function normalizeTransmitter(value: string) {
  if (value === "mixed_cluster") return "mixed";
  if (value === "cholinergic_predominantly_excitatory") return "cholinergic";
  if (value === "inhibitory_reported") return "inhibitory";
  return value;
}

function alkaslasiProminentLabels(sourceLocalLabel: string) {
  const labels = (alkaslasiTaxonomy.articleFigure5aMarkerContext.prominentLabelsByProfile as Record<string, string[]>)[sourceLocalLabel];
  if (!labels) throw new Error(`Alkaslasi Figure 5a marker context is unavailable for ${sourceLocalLabel}`);
  return labels;
}

function locatorIds(fieldLocators: Record<string, string | string[]>) {
  return Array.from(new Set(Object.values(fieldLocators).flatMap((value) => Array.isArray(value) ? value : [value])));
}

function mappingProfileId(mapping: SathyLineageMapping) {
  return mapping.sourceProfileId;
}

function normalizeLineageMapping(mapping: SathyLineageMapping) {
  return {
    target: mapping.candidateTargetLabel,
    status: mapping.mappingStatus,
    evidence: `${mapping.reason} Basis: ${prettify(mapping.basis)}.`,
    boundary: mapping.notEstablished,
  };
}

function buildProfiles(): TypeProfile[] {
  const russGroupById = new Map(russHarmonizedTaxonomyCrosswalk.groups.map((group) => [group.id, group]));
  const russProfiles: TypeProfile[] = russHarmonizedTaxonomyCrosswalk.populations.map((population) => {
    const group = russGroupById.get(population.groupId)!;
    const crosswalks = russHarmonizedTaxonomyCrosswalk.prototypeCrosswalks
      .filter((mapping) => mapping.candidatePopulationLabels.includes(population.label))
      .map((mapping) => ({
        target: mapping.entityId,
        status: mapping.mappingStatus,
        evidence: mapping.reason,
        boundary: mapping.notEstablished,
      }));
    return {
      id: `russ-2021:${population.label}`,
      namespace: "russ-2021",
      parentSourceId: "SRC-RUSS-2021",
      recordKind: "harmonized_population",
      unitOfObservation: "source_population",
      assignmentAuthority: "published_harmonized_taxonomy",
      cellRosterAvailability: "no_roster_retained",
      canonicalIdentityStatus: "not_established",
      sourceLabel: population.label,
      rawLabels: [population.label],
      sourceName: "Russ harmonized postnatal taxonomy",
      sourceAccession: "GSE158380",
      sourceUrl: russHarmonizedTaxonomyCrosswalk.source.processedCounts.recordUrl,
      articleUrl: russHarmonizedTaxonomyCrosswalk.source.publication.articleUrl,
      regionClass: normalizeRegion(group.regionClass),
      transmitterClass: normalizeTransmitter(group.transmitterClass),
      projectUseClass: group.interneuronCandidate ? "source_local_interneuron_or_projection_candidate" : "source_context_not_interneuron_candidate",
      markers: population.primaryMarkers,
      lifeStage: russHarmonizedTaxonomyCrosswalk.scope.lifeStage,
      spinalScope: group.sourceScope,
      spatialDomainContext: normalizeRegion(group.regionClass),
      rostrocaudalContext: "not_retained_in_this_profile",
      majorTypeContext: "not_established",
      profileAuthority: "source_population_not_canonical_identity",
      samplingCount: null,
      samplingUnit: null,
      samplingBoundary: "No cell count is retained in this derived type-level record; absence of a count is not zero abundance.",
      putativeCellType: group.label,
      putativeStatus: "source_group_context_not_exact_identity",
      activityEvidence: [],
      locatorIds: ["Russ Results/Fig. 2", "Supplementary Table 1"],
      missingEvidence: {
        morphology: "not_linked",
        cellCoordinates: "not_available_in_this_record",
        sciContext: "not_established",
        atlasRegistration: "not_established",
        electrophysiology: "not_linked_in_this_record",
        projectionTarget: "not_established",
        synapticConnectivity: "not_linked_in_this_record",
        crossSourceSameCellIdentityLink: "not_established",
        internalStructure: "not_linked_in_this_record",
      },
      lineageHints: crosswalks,
      identificationRuleIds: [],
      haringDetail: null,
    };
  });

  const sathyProfiles: TypeProfile[] = sathyTaxonomy.profiles.map((profile) => ({
    id: profile.id,
    namespace: "sathyamurthy-2018",
    parentSourceId: "SRC-SATHYAMURTHY-2018",
    recordKind: "reported_cluster",
    unitOfObservation: "nucleus",
    assignmentAuthority: "checksum_pinned_cluster_metadata",
    cellRosterAvailability: "exact_remote_roster_not_bundled",
    canonicalIdentityStatus: "not_established",
    sourceLabel: profile.sourceLocalLabel,
    rawLabels: profile.rawLabels,
    sourceName: "Sathyamurthy adult lumbar snRNA-seq",
    sourceAccession: sathyTaxonomy.source.geo.accession,
    sourceUrl: sathyTaxonomy.source.geo.recordUrl,
    articleUrl: sathyTaxonomy.source.publication.articleUrl,
    regionClass: normalizeRegion(profile.regionClass),
    transmitterClass: normalizeTransmitter(profile.transmitterClass),
    projectUseClass: profile.projectUseClass,
    markers: profile.figure4Markers,
    lifeStage: sathyTaxonomy.scope.lifeStage,
    spinalScope: sathyTaxonomy.scope.spinalRegion,
    spatialDomainContext: normalizeRegion(profile.regionClass),
    rostrocaudalContext: "lumbar_only_source_scope",
    majorTypeContext: "not_established",
    profileAuthority: "source_putative_not_exact_identity",
    samplingCount: profile.samplingCount.value,
    samplingUnit: profile.samplingCount.unit,
    samplingBoundary: "Assigned nuclei in the checksum-pinned processed GEO cluster metadata; not biological prevalence, abundance, or population frequency.",
    putativeCellType: profile.putativeCellTypeLabel,
    putativeStatus: profile.putativeAssignmentStatus,
    activityEvidence: profile.activityEvidence,
    locatorIds: locatorIds(profile.fieldLocators),
    missingEvidence: { ...profile.missingEvidence, internalStructure: "not_linked_to_sequenced_nuclei" },
    lineageHints: sathyTaxonomy.candidateLineageMappings
      .filter((mapping) => mappingProfileId(mapping) === profile.id)
      .map(normalizeLineageMapping),
    identificationRuleIds: [],
    haringDetail: null,
  }));

  const hayashiProfiles: TypeProfile[] = hayashiTaxonomy.profiles.map((profile) => ({
    id: profile.id,
    namespace: "hayashi-2018:GSE108788",
    parentSourceId: "SRC-HAYASHI-2018",
    recordKind: "article_reported_cluster",
    unitOfObservation: "cell",
    assignmentAuthority: "article_figure_transcription",
    cellRosterAvailability: "cluster_to_barcode_map_unavailable",
    canonicalIdentityStatus: "not_established",
    sourceLabel: profile.sourceLocalLabel,
    rawLabels: [profile.sourceLocalLabel],
    sourceName: "Hayashi neonatal V2a source clusters",
    sourceAccession: hayashiTaxonomy.source.geo.accession,
    sourceUrl: hayashiTaxonomy.source.geo.recordUrl,
    articleUrl: hayashiTaxonomy.source.publication.articleUrl,
    regionClass: "ventral",
    transmitterClass: "excitatory",
    projectUseClass: profile.projectUseClass,
    markers: profile.markerPanel,
    lifeStage: hayashiTaxonomy.scope.lifeStage,
    spinalScope: hayashiTaxonomy.scope.spinalRegion,
    spatialDomainContext: profile.spatialDomainContext,
    rostrocaudalContext: profile.rostrocaudalContext,
    majorTypeContext: `${profile.majorTypeMembership} · Chx10-low ${profile.chx10LowContext}`,
    profileAuthority: "article_reported_cluster_without_public_barcode_map",
    samplingCount: profile.samplingCount.value,
    samplingUnit: profile.samplingCount.unit,
    samplingBoundary: `Cell count transcribed from primary-article Figure 6. The checksum-pinned GEO matrix has ${hayashiTaxonomy.source.geo.countMatrixAsset.cellBarcodeColumnCount.toLocaleString("en-US")} barcodes but no public cluster-to-barcode map, so the count cannot be regenerated from the bare matrix alone and is not prevalence.`,
    putativeCellType: `${profile.sourceLocalLabel} · P0 V2a transcriptomic subgroup`,
    putativeStatus: "source_reported_cluster_not_canonical_identity",
    activityEvidence: [],
    locatorIds: profile.fieldLocatorIds,
    missingEvidence: {
      morphology: hayashiTaxonomy.globalMissingEvidence.singleCellMorphology,
      cellCoordinates: hayashiTaxonomy.globalMissingEvidence.cellCoordinates,
      sciContext: hayashiTaxonomy.globalMissingEvidence.sciContext,
      atlasRegistration: hayashiTaxonomy.globalMissingEvidence.atlasRegistration,
      electrophysiology: "not_linked_to_sequenced_barcodes",
      projectionTarget: hayashiTaxonomy.globalMissingEvidence.sameCellProjectionTracing,
      synapticConnectivity: hayashiTaxonomy.globalMissingEvidence.synapticConnectivity,
      crossSourceSameCellIdentityLink: hayashiTaxonomy.globalMissingEvidence.exactCrossSourceIdentity,
      internalStructure: "not_linked_to_sequenced_barcodes",
    },
    lineageHints: [],
    identificationRuleIds: [],
    haringDetail: null,
  }));

  const haringProfiles: TypeProfile[] = haringTaxonomy.profiles.map((profile) => {
    const markerSummary = profile.specificMarkerSummary;
    const markers = [markerSummary.mainMarker, markerSummary.coMarker1, markerSummary.coMarker2]
      .filter((marker): marker is NonNullable<typeof marker> => marker !== null)
      .map((marker) => marker.raw);
    return {
      id: `haring-2018:GSE103840:${profile.sourceLocalLabel}`,
      namespace: "haring-2018:GSE103840",
      parentSourceId: "SRC-HARING-2018",
      recordKind: "final_source_type",
      unitOfObservation: "cell",
      assignmentAuthority: "checksum_pinned_matrix_standard_name",
      cellRosterAvailability: "exact_remote_roster_not_bundled",
      canonicalIdentityStatus: "not_established",
      sourceLabel: profile.sourceLocalLabel,
      rawLabels: [profile.barcodeMetadataSummary.rawClusterName, profile.table8SourceLocalLabel],
      sourceName: "Häring 17–28-day dorsal-horn source clusters",
      sourceAccession: haringTaxonomy.source.geo.accession,
      sourceUrl: haringTaxonomy.source.geo.recordUrl,
      articleUrl: haringTaxonomy.source.publication.articleUrl,
      regionClass: profile.regionClass,
      transmitterClass: profile.transmitterClass,
      projectUseClass: profile.projectUseClass,
      markers,
      lifeStage: haringTaxonomy.scope.lifeStage,
      spinalScope: haringTaxonomy.scope.spinalRegion,
      spatialDomainContext: `${profile.regionClass}_horn_source_region`,
      rostrocaudalContext: "dorsal-horn sampling scope; cervical population-level spatial context",
      majorTypeContext: `${profile.molecularClass} source-standard family`,
      profileAuthority: "checksum_pinned_source_cluster_and_cell_column_assignment",
      samplingCount: profile.samplingCount.value,
      samplingUnit: profile.samplingCount.unit,
      samplingBoundary: "Exact cells assigned to this standardized label in the checksum-pinned matrix and reconciled to Supplementary Table 4; this is a sampling count, not prevalence or an animal denominator.",
      putativeCellType: `${profile.sourceLocalLabel} · 17–28-day (P17–P28) dorsal-horn molecular cluster`,
      putativeStatus: profile.interneuronIdentityStatus,
      activityEvidence: [],
      locatorIds: Array.from(new Set([...profile.fieldLocatorIds, ...profile.barcodeMetadataSummary.sourceLocatorIds])),
      missingEvidence: {
        morphology: profile.missingEvidence.morphology,
        cellCoordinates: profile.missingEvidence.cellCoordinates,
        sciContext: profile.missingEvidence.sciContext,
        atlasRegistration: profile.missingEvidence.atlasTransform,
        electrophysiology: profile.missingEvidence.electrophysiology,
        projectionTarget: profile.missingEvidence.projectionTargets,
        synapticConnectivity: profile.missingEvidence.synapticConnectivity,
        crossSourceSameCellIdentityLink: profile.missingEvidence.sameCellCrossModalLinks,
        internalStructure: "not_measured",
      },
      lineageHints: [],
      identificationRuleIds: profile.identificationRuleIds,
      haringDetail: profile,
    };
  });
  const alkaslasiProfiles: TypeProfile[] = alkaslasiTaxonomy.profiles.map((profile) => ({
    id: profile.id,
    namespace: "alkaslasi-2021:GSE167597",
    parentSourceId: "SRC-ALKASLASI-2021",
    recordKind: "reported_cluster",
    unitOfObservation: "nucleus",
    assignmentAuthority: "checksum_pinned_annotation_object",
    cellRosterAvailability: "exact_remote_roster_not_bundled",
    canonicalIdentityStatus: "not_established",
    sourceLabel: profile.sourceLocalLabel,
    rawLabels: profile.rawSourceLabels,
    sourceName: "Alkaslasi adult cholinergic source clusters",
    sourceAccession: alkaslasiTaxonomy.source.geo.accession,
    sourceUrl: alkaslasiTaxonomy.source.geo.recordUrl,
    articleUrl: alkaslasiTaxonomy.source.publication.articleUrl,
    regionClass: profile.regionClass,
    transmitterClass: profile.transmitterClass,
    projectUseClass: profile.projectUseClass,
    markers: [...new Set([
      ...profile.markerPanel,
      ...alkaslasiProminentLabels(profile.sourceLocalLabel),
    ])],
    lifeStage: profile.lifeStage,
    spinalScope: profile.spinalScope,
    spatialDomainContext: profile.articleSpatialContext.value,
    rostrocaudalContext: profile.rostrocaudalContext,
    majorTypeContext: "adult cholinergic interneuron I1-I8 source taxonomy",
    profileAuthority: "checksum_pinned_source_annotation_plus_article_marker_context",
    samplingCount: profile.samplingCount.value,
    samplingUnit: profile.samplingCount.unit,
    samplingBoundary: "Exact nuclei assigned to this I1-I8 source label in the checksum-pinned GEO annotation object. Chat-Cre/Sun1 reporter history and FACS enrichment prohibit biological prevalence, abundance, or unbiased-census claims.",
    putativeCellType: profile.putativeCellTypeLabel,
    putativeStatus: profile.putativeAssignmentStatus,
    activityEvidence: [],
    locatorIds: locatorIds(profile.fieldLocators),
    missingEvidence: {
      morphology: profile.missingEvidence.morphology,
      cellCoordinates: profile.missingEvidence.cellCoordinates,
      sciContext: profile.missingEvidence.sciContext,
      atlasRegistration: profile.missingEvidence.atlasRegistration,
      electrophysiology: profile.missingEvidence.electrophysiology,
      projectionTarget: profile.missingEvidence.projectionTarget,
      synapticConnectivity: profile.missingEvidence.synapticConnectivity,
      crossSourceSameCellIdentityLink: profile.missingEvidence.crossSourceSameCellIdentityLink,
      internalStructure: profile.missingEvidence.intracellularStructures,
    },
    lineageHints: [],
    identificationRuleIds: [],
    haringDetail: null,
  }));
  const dmrt3Profiles: TypeProfile[] = dmrt3Taxonomy.profiles.map((profile) => ({
    id: profile.id,
    namespace: "iglesias-gonzalez-2021:gse185731:mmusculus",
    parentSourceId: profile.parentSourceId,
    recordKind: profile.recordKind,
    unitOfObservation: profile.unitOfObservation,
    assignmentAuthority: "pinned_executed_author_notebook_group_summary",
    cellRosterAvailability: "group_summary_only_no_per_well_M1_to_M6_roster",
    canonicalIdentityStatus: "not_established",
    sourceLabel: profile.sourceLocalLabel,
    rawLabels: [profile.sourceLocalLabel],
    sourceName: "Iglesias González embryonic Dmrt3/dI6 source groups",
    sourceAccession: dmrt3Taxonomy.source.geo.accession,
    sourceUrl: dmrt3Taxonomy.source.geo.seriesUrl,
    articleUrl: dmrt3Taxonomy.source.publication.articleUrl,
    regionClass: "not_established",
    transmitterClass: "inhibitory",
    projectUseClass: "source_local_embryonic_dmrt3_di6_group",
    markers: profile.markerPanel,
    lifeStage: dmrt3Taxonomy.scope.lifeStage,
    spinalScope: dmrt3Taxonomy.scope.sampledRegion,
    spatialDomainContext: "Dmrt3-lineage dI6 source context without cell coordinates",
    rostrocaudalContext: "not retained in the source group summary",
    majorTypeContext: `${profile.articleTemporalPhase} apparent birth-order group · anchors ${profile.articleTemporalAnchorGenes.join(" · ")}`,
    profileAuthority: "pinned_executed_notebook_group_summary_without_exported_per_well_roster",
    samplingCount: profile.samplingCount,
    samplingUnit: profile.samplingUnit,
    samplingBoundary: "Exact M1–M6 group count from the pinned executed authors' notebook. All cells derive from one library pooled from three E14.5 embryos; the source does not export the per-well M-group roster, animal-level replicates, prevalence, or an adult-type denominator.",
    putativeCellType: `${profile.sourceLocalLabel} · embryonic Dmrt3/dI6 study-local transcriptomic group`,
    putativeStatus: profile.putativeAssignmentStatus,
    activityEvidence: [],
    locatorIds: profile.locatorIds,
    missingEvidence: {
      morphology: dmrt3Taxonomy.globalMissingEvidence.morphology,
      cellCoordinates: dmrt3Taxonomy.globalMissingEvidence.cellCoordinates,
      sciContext: dmrt3Taxonomy.globalMissingEvidence.sciContext,
      atlasRegistration: dmrt3Taxonomy.globalMissingEvidence.atlasRegistration,
      electrophysiology: dmrt3Taxonomy.globalMissingEvidence.electrophysiology,
      projectionTarget: dmrt3Taxonomy.globalMissingEvidence.projectionTarget,
      synapticConnectivity: dmrt3Taxonomy.globalMissingEvidence.synapticConnectivity,
      crossSourceSameCellIdentityLink: dmrt3Taxonomy.globalMissingEvidence.crossSourceSameCellIdentity,
      internalStructure: dmrt3Taxonomy.globalMissingEvidence.internalStructure,
    },
    lineageHints: [],
    identificationRuleIds: [],
    haringDetail: null,
  }));
  const roomeProfiles: TypeProfile[] = roomeTaxonomy.profiles.map((profile) => ({
    id: profile.id,
    namespace: "roome-2026:GSE291462",
    parentSourceId: "SRC-ROOME-2026",
    recordKind: "source_reported_refined_dil_type",
    unitOfObservation: "captured_dil_cell_summary",
    assignmentAuthority: "checksum_pinned_table_s6_roster_and_table_s7_differential_rows",
    cellRosterAvailability: "type_aggregate_only_full_rds_link_only",
    canonicalIdentityStatus: "not_established",
    sourceLabel: profile.sourceLocalLabel,
    rawLabels: [profile.sourceLocalLabel],
    sourceName: "Roome embryonic dorsal-horn refined dIL taxonomy",
    sourceAccession: roomeTaxonomy.source.geo.superSeries,
    sourceUrl: roomeTaxonomy.source.geo.seriesUrl,
    articleUrl: roomeTaxonomy.source.publication.articleUrl,
    regionClass: "dorsal",
    transmitterClass: profile.transmitterClass === "inhibitory_family_context" ? "inhibitory" : "excitatory",
    projectUseClass: "source_local_embryonic_dorsal_horn_refined_type",
    markers: profile.displayFeatures.map((feature) => feature.gene),
    lifeStage: roomeTaxonomy.scope.lifeStages.join(" and "),
    spinalScope: roomeTaxonomy.scope.sampledRegions.join(" · "),
    spatialDomainContext: "embryonic dorsal-horn dIL source context without a same-cell coordinate",
    rostrocaudalContext: "cervical_thoracic_lumbosacral_pooled_source_context",
    majorTypeContext: `${profile.family} source family · ${profile.transmitterClass}`,
    profileAuthority: "source_local_table_s6_type_metrics_plus_table_s7_positive_differential_features",
    samplingCount: profile.frequency,
    samplingUnit: "captured refined dIL cells",
    samplingBoundary: `Exact Table S6 captured-cell count within ${roomeTaxonomy.scope.refinedDilCellCount.toLocaleString("en-US")} refined dIL cells; ${profile.percentOfDil.toFixed(4)}% of the study's captured dIL denominator, not biological prevalence or an independent-animal estimate.`,
    putativeCellType: `${profile.sourceLocalLabel} · embryonic dorsal-horn refined dIL type`,
    putativeStatus: "source_reported_refined_type_not_cross_study_identity",
    activityEvidence: [],
    locatorIds: profile.sourceLocators,
    missingEvidence: {
      morphology: profile.missingEvidence.morphology,
      cellCoordinates: "not_linked_to_same_scrna_cell",
      sciContext: profile.missingEvidence.sciContext,
      atlasRegistration: profile.missingEvidence.atlasRegistration,
      electrophysiology: profile.missingEvidence.electrophysiology,
      projectionTarget: profile.missingEvidence.projectionTarget,
      synapticConnectivity: profile.missingEvidence.synapticConnectivity,
      crossSourceSameCellIdentityLink: profile.missingEvidence.crossSourceSameCellIdentity,
      internalStructure: profile.missingEvidence.internalStructure,
    },
    lineageHints: [],
    identificationRuleIds: [],
    haringDetail: null,
    roomeDetail: profile,
  }));
  const delileProfiles: TypeProfile[] = delileTaxonomy.profiles.map((profile) => ({
    id: profile.id,
    namespace: "delile-2019:E-MTAB-7320",
    parentSourceId: "SRC-DELILE-2019",
    recordKind: "source_reported_developmental_fine_subtype",
    unitOfObservation: "annotated_source_cell_aggregate",
    assignmentAuthority: profile.assignmentAuthority,
    cellRosterAvailability: "remote_per_cell_annotation_link_only_not_bundled",
    canonicalIdentityStatus: "not_established",
    sourceLabel: profile.sourceLocalLabel,
    rawLabels: [profile.sourceLocalLabel, profile.cardinalClass],
    sourceName: "Delile embryonic spinal-cord fine-subtype taxonomy",
    sourceAccession: delileTaxonomy.source.biostudies.accession,
    sourceUrl: delileTaxonomy.source.biostudies.studyUrl,
    articleUrl: delileTaxonomy.source.publication.articleUrl,
    regionClass: "not_established",
    transmitterClass: "not_established",
    projectUseClass: "source_local_embryonic_interneuron_fine_subtype",
    markers: [],
    lifeStage: "E9.5–E13.5",
    spinalScope: delileTaxonomy.scope.sampledRegions.join(" · "),
    spatialDomainContext: `source_DV_field_observed_for_${profile.dvObservedCellCount}_of_${profile.cellCount}_cells_without_physical_coordinates`,
    rostrocaudalContext: "cervical_and_thoracic_source_scope_without_per_cell_segment_coordinates",
    majorTypeContext: `${profile.cardinalClass} source cardinal class · ${profile.sourceLocalLabel} fine subtype`,
    profileAuthority: "checksum_pinned_authors_annotation_table_Neuron_subtypes_column",
    samplingCount: profile.cellCount,
    samplingUnit: "captured fine-subtype cells",
    samplingBoundary: `Exact cells carrying Neuron_subtypes=${profile.sourceLocalLabel} in the pinned authors' annotation table; ${profile.percentOfFineSubtypeInterneuronCells.toFixed(6)}% of the ${delileTaxonomy.scope.fineSubtypeInterneuronCellCount.toLocaleString("en-US")} fine-subtype-cell denominator, not animal-resolved prevalence or a cross-study type frequency.`,
    putativeCellType: `${profile.sourceLocalLabel} · ${profile.cardinalClass} embryonic spinal interneuron fine subtype`,
    putativeStatus: "source_reported_fine_subtype_not_cross_study_identity",
    activityEvidence: [],
    locatorIds: profile.sourceLocators,
    missingEvidence: {
      morphology: profile.missingEvidence.morphology,
      cellCoordinates: "source_DV_and_pseudotime_fields_are_not_physical_coordinates",
      sciContext: profile.missingEvidence.sciContext,
      atlasRegistration: profile.missingEvidence.atlasRegistration,
      electrophysiology: profile.missingEvidence.electrophysiology,
      projectionTarget: profile.missingEvidence.projectionTarget,
      synapticConnectivity: profile.missingEvidence.synapticConnectivity,
      crossSourceSameCellIdentityLink: profile.missingEvidence.crossSourceSameCellIdentity,
      internalStructure: profile.missingEvidence.internalStructure,
    },
    lineageHints: [],
    identificationRuleIds: [],
    haringDetail: null,
    delileDetail: profile,
  }));
  const crozatSourceProfile = crozatProfileContract.profile;
  const crozatProfiles: TypeProfile[] = [{
    id: crozatSourceProfile.id,
    namespace: "crozat-2025:figshare-29430869-v2",
    parentSourceId: crozatSourceProfile.parentSourceId,
    recordKind: crozatSourceProfile.recordKind,
    unitOfObservation: crozatSourceProfile.unitOfObservation,
    assignmentAuthority: crozatSourceProfile.assignmentAuthority,
    cellRosterAvailability: crozatSourceProfile.cellRosterAvailability,
    canonicalIdentityStatus: "not_established",
    sourceLabel: crozatSourceProfile.sourceLocalLabel,
    rawLabels: crozatSourceProfile.rawLabels,
    sourceName: "Crozat mouse PKD2L1 CSF-contacting-neuron source profile",
    sourceAccession: crozatProfileContract.source.figshare.doi,
    sourceUrl: crozatProfileContract.source.figshare.landingPageUrl,
    articleUrl: crozatProfileContract.source.publication.articleUrl,
    regionClass: "central",
    transmitterClass: "inhibitory",
    projectUseClass: crozatSourceProfile.projectUseClass,
    markers: crozatSourceProfile.markerPanel,
    lifeStage: crozatProfileContract.scope.lifeStage,
    spinalScope: crozatProfileContract.scope.spinalRegion,
    spatialDomainContext: "central_canal_contacting_predominantly_ventral_population_context",
    rostrocaudalContext: "cervical_thoracic_lumbar_segment_specific_source_evidence",
    majorTypeContext: "marker_defined_csf_contacting_functional_population",
    profileAuthority: "primary_article_plus_checksum_pinned_figshare_tables",
    samplingCount: null,
    samplingUnit: null,
    samplingBoundary: crozatSourceProfile.samplingBoundary,
    putativeCellType: crozatSourceProfile.putativeCellTypeLabel,
    putativeStatus: crozatSourceProfile.putativeAssignmentStatus,
    activityEvidence: crozatSourceProfile.activityEvidence,
    locatorIds: crozatSourceProfile.locatorIds,
    missingEvidence: crozatSourceProfile.missingEvidence,
    lineageHints: [],
    identificationRuleIds: [],
    haringDetail: null,
  }];
  const canoGomezProfiles: TypeProfile[] = canoGomezRegistry.profiles.map((profile) => ({
    id: profile.profileId,
    namespace: "cano-gomez-2026:GSE318731",
    parentSourceId: "SRC-CANOGOMEZ-2026",
    recordKind: profile.recordKind,
    unitOfObservation: profile.unitOfObservation,
    assignmentAuthority: profile.assignmentAuthority,
    cellRosterAvailability: "exact_bundled_profile_and_nucleus_roster",
    canonicalIdentityStatus: "not_established",
    sourceLabel: profile.sourceLocalLabel,
    rawLabels: [profile.sourceLocalLabel, profile.sourceGroup],
    sourceName: "Cano-Gomez P56 spinal-cord multiome confirmed CHOL_IN profiles",
    sourceAccession: canoGomezRegistry.datasetId,
    sourceUrl: canoGomezRegistry.sourceReferences.dataRepository.url,
    articleUrl: canoGomezRegistry.sourceReferences.publication.articleUrl,
    regionClass: "not_established",
    transmitterClass: "cholinergic",
    projectUseClass: "source_local_p56_chol_in_confirmed_interneuron_profile",
    markers: [],
    lifeStage: canoGomezRegistry.lifeStage,
    spinalScope: "mouse spinal cord",
    spatialDomainContext: "source_context_counts_only_no_cell_coordinates",
    rostrocaudalContext: "source_context_counts_only_no_atlas_registration",
    majorTypeContext: "source-explicit CHOL_IN assignment",
    profileAuthority: `${canoGomezRegistry.identityAuthority.mode} · ${profile.assignmentAuthority}`,
    samplingCount: profile.nucleusCount,
    samplingUnit: "source-assigned nuclei",
    samplingBoundary: `Exact source-local nuclei selected by groups=CHOL_IN from the bundled confirmed roster. This count is not biological prevalence, an animal denominator, or a cross-study type count. The paper-reported ${canoGomezRegistry.denominatorReconciliation.paperReportedNeuronTypeCount} neuronal types are not used as an interneuron denominator.`,
    putativeCellType: `${profile.sourceGroup} source-explicit interneuron profile`,
    putativeStatus: "confirmed_interneuron_scope_only_canonical_type_identity_not_established",
    activityEvidence: [],
    locatorIds: [
      `${canoGomezRegistry.releaseId} · profiles[profileId=${profile.profileId}]`,
      `${profile.rosterLink.artifactFileName} · ${profile.rosterLink.filterField}=${profile.rosterLink.filterEquals}`,
      `${profile.sourceFileName} · groups=${profile.sourceGroup} · neuron_types=${JSON.stringify(profile.sourceLocalLabel)}`,
    ],
    missingEvidence: {
      morphology: "source_schema_no_field",
      cellCoordinates: "source_schema_no_field",
      sciContext: "not_measured_by_study",
      atlasRegistration: "no_admitted_transform",
      electrophysiology: "not_measured_by_study",
      projectionTarget: "relationship_not_established",
      synapticConnectivity: "relationship_not_established",
      crossSourceSameCellIdentityLink: "relationship_not_established",
      internalStructure: "source_schema_no_field",
    },
    lineageHints: [],
    identificationRuleIds: [],
    haringDetail: null,
    canoGomezDetail: profile,
  }));
  return [...russProfiles, ...sathyProfiles, ...hayashiProfiles, ...haringProfiles, ...alkaslasiProfiles, ...dmrt3Profiles, ...roomeProfiles, ...delileProfiles, ...crozatProfiles, ...canoGomezProfiles];
}

const PROFILES = buildProfiles();
const PROFILE_BY_ID = new Map(PROFILES.map((profile) => [profile.id, profile]));
const SOURCE_NAMESPACE_COUNT = new Set(PROFILES.map((profile) => profile.namespace)).size;
const SOURCE_PROFILE_COUNTS = PROFILES.reduce((counts, profile) => {
  counts.set(profile.namespace, (counts.get(profile.namespace) ?? 0) + 1);
  return counts;
}, new Map<SourceNamespace, number>());
const RUSS_CANDIDATE_PROFILE_COUNT = PROFILES.filter((profile) => profile.namespace === "russ-2021" && profile.projectUseClass === "source_local_interneuron_or_projection_candidate").length;

function sourceProfileCount(namespace: SourceNamespace) {
  return SOURCE_PROFILE_COUNTS.get(namespace) ?? 0;
}

function firstParam(value: InitialParam) {
  return Array.isArray(value) ? value[0] : value;
}

function initialUrlState(initialSelected?: InitialParam, initialComparison?: InitialParam) {
  const params = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const requested = firstParam(initialSelected) ?? params?.get("type") ?? null;
  const selectedId = requested && PROFILE_BY_ID.has(requested) ? requested : "sathyamurthy-2018:DE-1";
  const comparisonIds = (firstParam(initialComparison) ?? params?.get("typeCompare") ?? "")
    .split(",")
    .filter((id, index, all) => PROFILE_BY_ID.has(id) && all.indexOf(id) === index)
    .slice(0, 4);
  const requestedBaseline = params?.get("typeBaseline") ?? null;
  const baselineId = requestedBaseline && PROFILE_BY_ID.has(requestedBaseline) && requestedBaseline !== selectedId
    ? requestedBaseline
    : null;
  return { selectedId, comparisonIds, baselineId };
}

function updateTypeComparisonUrl(comparisonIds: string[]) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (comparisonIds.length) url.searchParams.set("typeCompare", comparisonIds.join(","));
  else url.searchParams.delete("typeCompare");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function updateTypeBaselineUrl(baselineId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (baselineId) url.searchParams.set("typeBaseline", baselineId);
  else url.searchParams.delete("typeBaseline");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function evidenceStatus(profile: TypeProfile, key: string) {
  return profile.missingEvidence[key] ?? "not_established";
}

function markerDisplay(profile: TypeProfile) {
  if (profile.markers.length) return profile.markers.join(" · ");
  if (profile.namespace === "cano-gomez-2026:GSE318731") {
    return "Not established · source-label tokens are not interpreted as markers";
  }
  return "Not retained in this record";
}

function projectScopeLabel(profile: TypeProfile) {
  if (profile.projectUseClass === "source_local_non_motor_neuron_unresolved") {
    return "Non-motor spinal neuron · local interneuron versus projection neuron unresolved";
  }
  if (profile.projectUseClass === "motor_neuron_context") return "Motor-neuron context only";
  if (profile.projectUseClass === "source_local_interneuron_or_projection_candidate") {
    return "Source-local interneuron or projection-neuron candidate";
  }
  if (profile.projectUseClass === "v2a_cluster_mixed_local_and_supraspinal_projection_context") {
    return "P0 V2a cluster · mixed local-interneuron and supraspinal-projection context";
  }
  if (profile.projectUseClass === "source_local_dorsal_neuron_type_context") {
    return "Source-local dorsal-horn neuronal cluster · local-interneuron versus projection-neuron status unresolved";
  }
  if (profile.projectUseClass === "source_local_cholinergic_interneuron_cluster") {
    return "Source-local adult cholinergic interneuron cluster · enriched technical cohort, not prevalence";
  }
  if (profile.projectUseClass === "source_local_marker_defined_spinal_interneuron_population") {
    return "Source-local PKD2L1-positive spinal interneuron population · experiment-family evidence, not one canonical cell or type split";
  }
  if (profile.projectUseClass === "source_local_embryonic_dmrt3_di6_group") {
    return "Source-local embryonic Dmrt3/dI6 group · one pooled library, not an adult canonical type or animal-level replicate";
  }
  if (profile.projectUseClass === "source_local_embryonic_dorsal_horn_refined_type") {
    return "Source-local embryonic dorsal-horn refined dIL type · exact molecular record, no linked morphology or internal object";
  }
  if (profile.projectUseClass === "source_local_embryonic_interneuron_fine_subtype") {
    return "Source-local E9.5–E13.5 spinal interneuron fine subtype · exact annotation count, no inferred transmitter, morphology, internal object or atlas position";
  }
  if (profile.projectUseClass === "source_local_p56_chol_in_confirmed_interneuron_profile") {
    return "Source-local P56 CHOL_IN profile · confirmed by the exact deposited group assignment, without canonical cross-study identity, geometry or internal structure";
  }
  return prettify(profile.projectUseClass);
}

const SOURCE_BADGES: Record<SourceNamespace, string> = {
  "russ-2021": "RUSS",
  "sathyamurthy-2018": "SATHY",
  "hayashi-2018:GSE108788": "HAYASHI P0",
  "haring-2018:GSE103840": "HÄRING P17–P28",
  "alkaslasi-2021:GSE167597": "ALKASLASI ADULT",
  "iglesias-gonzalez-2021:gse185731:mmusculus": "DMRT3/dI6 E14.5",
  "roome-2026:GSE291462": "ROOME E14.5/E16.5",
  "delile-2019:E-MTAB-7320": "DELILE E9.5–E13.5",
  "crozat-2025:figshare-29430869-v2": "CROZAT PKD2L1",
  "cano-gomez-2026:GSE318731": "CANO-GOMEZ P56",
};

function profileSourceBadge(profile: TypeProfile) {
  return SOURCE_BADGES[profile.namespace] ?? `UNKNOWN SOURCE · ${String(profile.namespace)}`;
}

function canoContextFieldSummary(profile: CanoGomezProfile, field: "anatomy" | "source" | "Sex") {
  const context = profile.contextFieldCounts.find((candidate) => candidate.field === field);
  if (!context) return `${field}: source field unavailable`;
  const values = context.counts.map((item) => `${JSON.stringify(item.value)}=${item.count.toLocaleString("en-US")}`);
  return [
    `${field}: ${context.status}`,
    ...values,
    `missing=${context.missingCount.toLocaleString("en-US")}`,
    `empty=${context.emptyCount.toLocaleString("en-US")}`,
  ].join(" · ");
}

function resolveLocator(profile: TypeProfile, id: string) {
  const records = profile.namespace === "sathyamurthy-2018"
    ? sathyTaxonomy.sourceLocators
    : profile.namespace === "hayashi-2018:GSE108788"
      ? hayashiTaxonomy.sourceLocators
      : profile.namespace === "haring-2018:GSE103840"
        ? haringTaxonomy.sourceLocators
        : profile.namespace === "alkaslasi-2021:GSE167597"
          ? alkaslasiTaxonomy.sourceLocators
          : profile.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus"
            ? dmrt3Taxonomy.sourceLocators
          : profile.namespace === "crozat-2025:figshare-29430869-v2"
            ? crozatProfileContract.sourceLocators
        : [];
  const record = records.find((locator) => locator.id === id);
  return record ? `${id} · ${record.locator}` : id;
}

const COMPARISON_ROWS: Array<[string, (profile: TypeProfile) => string]> = [
  ["Canonical parent source", (profile) => profile.parentSourceId],
  ["Source namespace", (profile) => profile.namespace],
  ["Record kind", (profile) => prettify(profile.recordKind)],
  ["Observation unit", (profile) => prettify(profile.unitOfObservation)],
  ["Assignment authority", (profile) => prettify(profile.assignmentAuthority)],
  ["Cell roster", (profile) => prettify(profile.cellRosterAvailability)],
  ["Canonical identity", (profile) => prettify(profile.canonicalIdentityStatus)],
  ["Source-local label", (profile) => profile.sourceLabel],
  ["Region class", (profile) => prettify(profile.regionClass)],
  ["Transmitter class", transmitterDisplay],
  ["Figure/source markers", markerDisplay],
  ["Life stage", (profile) => profile.lifeStage],
  ["Spinal scope", (profile) => profile.spinalScope],
  ["Spatial-domain context", (profile) => prettify(profile.spatialDomainContext)],
  ["Rostrocaudal context", (profile) => prettify(profile.rostrocaudalContext)],
  ["Major-type context", (profile) => prettify(profile.majorTypeContext)],
  ["Identification rules", (profile) => profile.identificationRuleIds.length
    ? profile.identificationRuleIds.map((id) => {
      const rule = haringTaxonomy.identificationRules.find((candidate) => candidate.id === id);
      return rule ? `${rule.rawCombination.value} → ${rule.sourceClusterName.value}` : id;
    }).join(" · ")
    : "Not retained"],
  ["Profile authority", (profile) => prettify(profile.profileAuthority)],
  ["Dataset sampling count", samplingCountDisplay],
  ["Putative assignment", (profile) => `${profile.putativeCellType} · ${prettify(profile.putativeStatus)}`],
  ["Lineage / entity hints", (profile) => profile.lineageHints.length ? profile.lineageHints.map((hint) => `${hint.target}: ${prettify(hint.status)}`).join(" · ") : "Not established"],
  ["Morphology", (profile) => prettify(evidenceStatus(profile, "morphology"))],
  ["Cell coordinates", (profile) => prettify(evidenceStatus(profile, "cellCoordinates"))],
  ["SCI context", (profile) => prettify(evidenceStatus(profile, "sciContext"))],
  ["Atlas registration", (profile) => prettify(evidenceStatus(profile, "atlasRegistration"))],
  ["Electrophysiology", (profile) => prettify(evidenceStatus(profile, "electrophysiology"))],
  ["Projection target", (profile) => prettify(evidenceStatus(profile, "projectionTarget"))],
  ["Synaptic connectivity", (profile) => prettify(evidenceStatus(profile, "synapticConnectivity"))],
  ["Internal structure", (profile) => prettify(evidenceStatus(profile, "internalStructure"))],
  ["Cross-source same-cell identity link", (profile) => prettify(evidenceStatus(profile, "crossSourceSameCellIdentityLink"))],
];

function sourceRegionDeltaValue(profile: TypeProfile) {
  if (profile.namespace === "cano-gomez-2026:GSE318731" && profile.canoGomezDetail) {
    return profile.canoGomezDetail.contextFieldCounts
      .map((context) => canoContextFieldSummary(profile.canoGomezDetail!, context.field))
      .join(" | ");
  }
  if (profile.namespace === "delile-2019:E-MTAB-7320" && profile.delileDetail) {
    return `DV observed ${profile.delileDetail.dvObservedCellCount}/${profile.delileDetail.cellCount} cells · pseudotime observed ${profile.delileDetail.pseudotimeObservedCellCount}/${profile.delileDetail.cellCount} cells; neither field is a physical coordinate`;
  }
  const alkaslasi = alkaslasiTaxonomy.profiles.find((candidate) => candidate.id === profile.id);
  if (alkaslasi) {
    const counts = alkaslasi.sampleRegionMembership.counts;
    return `Cervical ${counts.Cervical} · Thoracic ${counts.Thoracic} · Lumbar ${counts.Lumbar} sampled nuclei; membership, not coordinates`;
  }
  return `${prettify(profile.spatialDomainContext)} · ${prettify(profile.rostrocaudalContext)}`;
}

function sourceTemporalDeltaValue(profile: TypeProfile) {
  if (profile.namespace === "delile-2019:E-MTAB-7320" && profile.delileDetail) {
    return profile.delileDetail.timepointCellCounts
      .map((item) => `${item.lifeStage} ${item.cellCount}`)
      .join(" · ");
  }
  return profile.lifeStage;
}

const SOURCE_RECORD_DELTA_ROWS: readonly SourceRecordDeltaDisplayRow<TypeProfile>[] = [
  { id: "parent-source", label: "Canonical parent source", read: (profile) => profile.parentSourceId },
  { id: "namespace", label: "Source namespace", read: (profile) => profile.namespace },
  { id: "record-kind", label: "Record kind", read: (profile) => prettify(profile.recordKind) },
  { id: "observation-unit", label: "Observation unit", read: (profile) => prettify(profile.unitOfObservation) },
  { id: "assignment-authority", label: "Assignment authority", read: (profile) => prettify(profile.assignmentAuthority) },
  { id: "cell-roster", label: "Cell roster", read: (profile) => prettify(profile.cellRosterAvailability) },
  { id: "source-label", label: "Source-local label", read: (profile) => profile.sourceLabel },
  { id: "region", label: "Source-region evidence", read: sourceRegionDeltaValue },
  { id: "transmitter", label: "Transmitter class", read: transmitterDisplay },
  { id: "markers", label: "Figure/source markers", read: markerDisplay },
  { id: "life-stage", label: "Life stage", read: (profile) => profile.lifeStage },
  { id: "source-temporal-evidence", label: "Source temporal evidence", read: sourceTemporalDeltaValue },
  { id: "spinal-scope", label: "Spinal scope", read: (profile) => profile.spinalScope },
  { id: "major-type", label: "Source class context", read: (profile) => prettify(profile.majorTypeContext) },
  { id: "sampling-count", label: "Dataset sampling count", read: samplingCountDisplay },
  { id: "putative-assignment", label: "Putative assignment", read: (profile) => `${profile.putativeCellType} · ${prettify(profile.putativeStatus)}` },
  { id: "morphology", label: "Morphology", read: (profile) => prettify(evidenceStatus(profile, "morphology")) },
  { id: "cell-coordinates", label: "Cell coordinates", read: (profile) => prettify(evidenceStatus(profile, "cellCoordinates")) },
  { id: "sci-context", label: "SCI context", read: (profile) => prettify(evidenceStatus(profile, "sciContext")) },
  { id: "atlas-registration", label: "Atlas registration", read: (profile) => prettify(evidenceStatus(profile, "atlasRegistration")) },
  { id: "electrophysiology", label: "Electrophysiology", read: (profile) => prettify(evidenceStatus(profile, "electrophysiology")) },
  { id: "projection-target", label: "Projection target", read: (profile) => prettify(evidenceStatus(profile, "projectionTarget")) },
  { id: "synaptic-connectivity", label: "Synaptic connectivity", read: (profile) => prettify(evidenceStatus(profile, "synapticConnectivity")) },
  { id: "internal-structure", label: "Internal structure", read: (profile) => prettify(evidenceStatus(profile, "internalStructure")) },
  { id: "same-cell-link", label: "Cross-source same-cell link", read: (profile) => prettify(evidenceStatus(profile, "crossSourceSameCellIdentityLink")) },
];

export default function InterneuronTypeAtlas({
  initialSelected,
  initialComparison,
  selectedFocusId,
  onSelectedFocusChange,
  onNotice,
}: {
  initialSelected?: InitialParam;
  initialComparison?: InitialParam;
  selectedFocusId?: string | null;
  onSelectedFocusChange?: (focusId: string) => void;
  onNotice: (notice: string) => void;
}) {
  const initial = initialUrlState(initialSelected, initialComparison);
  const [query, setQuery] = useState("");
  const [showGlutLabels, setShowGlutLabels] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [transmitterFilter, setTransmitterFilter] = useState<TransmitterFilter>("all");
  const [internalSelectedId, setInternalSelectedId] = useState(initial.selectedId);
  const [comparisonIds, setComparisonIds] = useState(initial.comparisonIds);
  const [baselineId, setBaselineId] = useState<string | null>(initial.baselineId);
  const selectedId = selectedFocusId && PROFILE_BY_ID.has(selectedFocusId)
    ? selectedFocusId
    : internalSelectedId;
  const profileListRef = useRef<HTMLDivElement>(null);
  const dossierRef = useRef<HTMLElement>(null);
  const profileRefs = useRef(new Map<string, HTMLButtonElement>());
  const priorSelectedIdRef = useRef(selectedId);
  const selected = PROFILE_BY_ID.get(selectedId) ?? PROFILES[0];

  useEffect(() => {
    const restore = () => {
      const next = initialUrlState();
      setComparisonIds(next.comparisonIds);
      setBaselineId(next.baselineId);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    const priorId = priorSelectedIdRef.current;
    if (priorId !== selectedId && PROFILE_BY_ID.has(priorId)) {
      setBaselineId(priorId);
      updateTypeBaselineUrl(priorId);
    }
    priorSelectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const list = profileListRef.current;
      const profile = profileRefs.current.get(selectedId);
      if (!list || !profile) return;
      const listRect = list.getBoundingClientRect();
      const profileRect = profile.getBoundingClientRect();
      const profileTop = profileRect.top - listRect.top + list.scrollTop;
      const profileBottom = profileTop + profileRect.height;
      const visibleTop = list.scrollTop;
      const visibleBottom = visibleTop + list.clientHeight;
      if (profileTop < visibleTop || profileBottom > visibleBottom) {
        list.scrollTop = Math.max(0, profileTop);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedId]);

  const matching = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return PROFILES.filter((profile) => (
      (sourceFilter === "all" || profile.namespace === sourceFilter)
      && (regionFilter === "all" || profile.regionClass === regionFilter)
      && (transmitterFilter === "all" || profile.transmitterClass === transmitterFilter)
      && (!normalized || [
        profile.sourceLabel,
        profile.rawLabels.join(" "),
        profile.markers.join(" "),
        profile.putativeCellType,
        profile.sourceName,
        profile.sourceAccession,
        profile.lifeStage,
        profile.spinalScope,
        profile.spatialDomainContext,
        profile.rostrocaudalContext,
        profile.majorTypeContext,
        profile.profileAuthority,
        profile.lineageHints.map((hint) => hint.target).join(" "),
      ].join(" ").toLowerCase().includes(normalized))
    ));
  }, [query, regionFilter, sourceFilter, transmitterFilter]);

  const selectProfile = (id: string) => {
    setInternalSelectedId(id);
    onSelectedFocusChange?.(id);
  };

  const toggleComparison = (id: string) => {
    const next = comparisonIds.includes(id)
      ? comparisonIds.filter((item) => item !== id)
      : comparisonIds.length < 4
        ? [...comparisonIds, id]
        : comparisonIds;
    setComparisonIds(next);
    updateTypeComparisonUrl(next);
    onNotice(next.length === comparisonIds.length && !comparisonIds.includes(id)
      ? "Type comparison is limited to four source records"
      : `${next.length} source type record${next.length === 1 ? "" : "s"} selected for comparison`);
  };

  const handleProfileKeys = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || !matching.length) return;
    event.preventDefault();
    const index = matching.findIndex((profile) => profile.id === id);
    const next = event.key === "Home"
      ? matching[0]
      : event.key === "End"
        ? matching[matching.length - 1]
        : matching[(index + (event.key === "ArrowDown" ? 1 : -1) + matching.length) % matching.length];
    selectProfile(next.id);
    profileRefs.current.get(next.id)?.focus();
  };

  const selectedLocatorText = selected.locatorIds.map((id) => resolveLocator(selected, id));
  const comparison = comparisonIds.map((id) => PROFILE_BY_ID.get(id)).filter((profile): profile is TypeProfile => Boolean(profile));
  const baseline = baselineId && baselineId !== selected.id ? PROFILE_BY_ID.get(baselineId) ?? null : null;
  const sathyNonMotorUnresolved = sathyTaxonomy.profiles.filter((profile) => profile.projectUseClass === "source_local_non_motor_neuron_unresolved").length;
  const sampleFrame = sathyTaxonomy.source.geo.sampleFrame;
  const hayashiSampleFrame = hayashiTaxonomy.source.geo.sampleFrame;
  const hayashiMatrix = hayashiTaxonomy.source.geo.countMatrixAsset;
  const haringSampleFrame = haringTaxonomy.source.geo.sampleFrame;
  const haringMatrix = haringTaxonomy.source.geo.countMatrixAsset;
  const alkaslasiSampleFrame = alkaslasiTaxonomy.source.geo.sampleFrame;
  const alkaslasiAnnotation = alkaslasiTaxonomy.source.geo.annotationAsset;
  const selectedAlkaslasi = alkaslasiTaxonomy.profiles.find((profile): profile is AlkaslasiProfile => profile.id === selected.id);
  const selectedRoome = selected.namespace === "roome-2026:GSE291462" ? selected.roomeDetail ?? null : null;
  const selectedDelile = selected.namespace === "delile-2019:E-MTAB-7320" ? selected.delileDetail ?? null : null;
  const selectedCanoGomez = selected.namespace === "cano-gomez-2026:GSE318731" ? selected.canoGomezDetail ?? null : null;
  const selectedHaringRules = selected.identificationRuleIds
    .map((id) => haringTaxonomy.identificationRules.find((rule) => rule.id === id))
    .filter((rule): rule is HaringTaxonomy["identificationRules"][number] => Boolean(rule));
  const rovingProfileId = matching.some((profile) => profile.id === selected.id) ? selected.id : matching[0]?.id;
  const selectedCrozatAnatomy = selected.namespace === "crozat-2025:figshare-29430869-v2"
    ? crozatProfileContract.derivedEvidence.anatomyContext.fieldOfViewAndCellTotals
    : null;
  const selectedRegionFingerprint = selectedDelile
    ? `DV observed ${selectedDelile.dvObservedCellCount}/${selectedDelile.cellCount} cells · pseudotime observed ${selectedDelile.pseudotimeObservedCellCount}/${selectedDelile.cellCount} cells; source annotation fields, not physical coordinates or a trajectory`
    : selectedAlkaslasi
    ? `Cervical ${selectedAlkaslasi.sampleRegionMembership.counts.Cervical} · Thoracic ${selectedAlkaslasi.sampleRegionMembership.counts.Thoracic} · Lumbar ${selectedAlkaslasi.sampleRegionMembership.counts.Lumbar} sampled nuclei; source membership, not coordinates`
    : selectedCrozatAnatomy
      ? `${selectedCrozatAnatomy.map((item) => `${prettify(item.segment)} ${item.cellCount.toLocaleString()} cells / ${item.fieldOfViewCount} fields`).join(" · ")}; aggregate source evidence, not cell coordinates`
    : selectedCanoGomez
      ? selectedCanoGomez.contextFieldCounts.map((context) => canoContextFieldSummary(selectedCanoGomez, context.field)).join(" | ")
    : `${selected.spatialDomainContext} · ${selected.rostrocaudalContext}`;
  const selectedFingerprintAxes: EvidenceFingerprintAxis[] = [
    {
      label: "Source profile",
      status: selected.namespace === "crozat-2025:figshare-29430869-v2"
        ? "Marker-defined population with checksum-pinned anatomy and electrophysiology tables"
        : selected.namespace === "cano-gomez-2026:GSE318731"
          ? "Exact bundled nucleus roster selected only by source groups=CHOL_IN; label tokens are not marker evidence"
        : selected.namespace === "delile-2019:E-MTAB-7320"
          ? "Exact source-local fine-subtype count and E9.5–E13.5 timepoint distribution from the pinned authors' annotation table"
        : selected.namespace === "roome-2026:GSE291462"
          ? "Exact Table S6 type metrics plus Table S7 source-row differential features"
        : selected.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus"
          ? "Pinned executed-notebook group summary; per-well M1–M6 roster not exported"
        : selected.namespace === "hayashi-2018:GSE108788"
        ? "Article-reported cluster and count; public matrix receipt"
        : selected.namespace === "haring-2018:GSE103840"
          ? "Direct cell assignment, source labels, identification rules, and marker cells"
          : selected.namespace === "alkaslasi-2021:GSE167597"
            ? "Checksum-pinned cluster assignment and article marker context"
            : "Direct source-local label and markers",
      tone: "observed",
    },
    {
      label: "Anatomy context",
      status: selectedRegionFingerprint,
      tone: selectedCrozatAnatomy ? "observed" : "context",
    },
    { label: "Morphology", status: evidenceStatus(selected, "morphology"), tone: "missing" },
    { label: "Cell coordinates", status: evidenceStatus(selected, "cellCoordinates"), tone: "missing" },
    { label: "SCI context", status: evidenceStatus(selected, "sciContext"), tone: "missing" },
    { label: "Atlas registration", status: evidenceStatus(selected, "atlasRegistration"), tone: "missing" },
    {
      label: "Electrophysiology",
      status: evidenceStatus(selected, "electrophysiology"),
      tone: selected.activityEvidence.length && evidenceStatus(selected, "electrophysiology").startsWith("observed_") ? "observed" : "missing",
    },
    { label: "Projection target", status: evidenceStatus(selected, "projectionTarget"), tone: "missing" },
    { label: "Synaptic connectivity", status: evidenceStatus(selected, "synapticConnectivity"), tone: "missing" },
    { label: "Internal structure", status: evidenceStatus(selected, "internalStructure"), tone: "missing" },
    { label: "Cross-source same-cell link", status: evidenceStatus(selected, "crossSourceSameCellIdentityLink"), tone: "missing" },
  ];
  const selectedIdentityBoundary = [
    `Identity authority: ${prettify(selected.putativeStatus)}.`,
    selected.projectUseClass === "source_local_non_motor_neuron_unresolved"
      ? "This non-motor profile is unresolved between local-interneuron and projection-neuron status."
      : "",
    selected.namespace === "hayashi-2018:GSE108788"
      ? "This cluster mixes Type I local-interneuron and Type II supraspinal-projection context; no public barcode map resolves either class per cell."
      : "",
    selected.namespace === "haring-2018:GSE103840"
      ? "The deposited cell-to-cluster assignment is exact within GSE103840, but local-interneuron versus projection-neuron status is not resolved per profile."
      : "",
    selected.namespace === "alkaslasi-2021:GSE167597"
      ? "The deposited I1–I8 assignment is exact within GSE167597, but the enriched technical sample cannot establish prevalence and its sample-region field is not a coordinate."
      : "",
    selected.namespace === "crozat-2025:figshare-29430869-v2"
      ? "This is one source-local marker-defined population. Segment, firing pattern, quadrant and experiment-family rows are not separate cell types, and reused local cell labels do not create a global per-cell join."
      : "",
    selected.namespace === "cano-gomez-2026:GSE318731"
      ? `This profile is admitted only because the exact deposited groups field equals CHOL_IN. Its ${selected.samplingCount?.toLocaleString("en-US")} nuclei are addressable through the bundled source-local roster, but ${canoGomezRegistry.identityAuthority.mode} does not establish a canonical type, cross-source same cell, geometry, internal structure or atlas registration. Label tokens are not interpreted as markers.`
      : "",
    selected.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus"
      ? "M1–M6 are embryonic study-local groups derived in one executed notebook from a single pooled library. The loom exposes neither an M-group roster nor scalar pseudotime, so no well, animal, adult type, morphology, coordinate, physiology, or internal object may be inferred."
      : "",
    selected.namespace === "roome-2026:GSE291462"
      ? "This is one exact Table S6 molecular type record. Its captured-cell count, composition, cluster QC and Table S7 differential features do not provide a same-cell 3D form, internal structure, spatial coordinate, physiology, synapse or cross-study identity."
      : "",
    selected.namespace === "delile-2019:E-MTAB-7320"
      ? `This is one exact source-local Neuron_subtypes record in the embryonic E9.5–E13.5 atlas. The source spelling ${selected.sourceLabel.startsWith("dl") ? "dl" : selected.sourceLabel.split(".")[0]} is preserved. DV and pseudotime are annotation fields, not xyz coordinates, an atlas transform or an observed same-cell trajectory; transmitter identity is not established by this compact contract.`
      : "",
    "Source label and marker context do not establish a canonical lineage, same cell, morphology, SCI entity, or atlas position.",
    `Count boundary: ${selected.samplingBoundary}`,
  ].filter(Boolean).join(" ");

  return (
    <section className="type-evidence-atlas" aria-labelledby="type-evidence-heading">
      <div className="type-evidence-heading">
        <div>
          <span>UPG-082 / UPG-109 / UPG-117 / UPG-172 / UPG-174 / UPG-180 / UPG-185 / UPG-204 · {SOURCE_NAMESPACE_COUNT} SOURCE NAMESPACES · RECORD GRANULARITY EXPLICIT</span>
          <h3 id="type-evidence-heading">Spinal neuron type evidence atlas</h3>
          <p>
            {PROFILES.length.toLocaleString("en-US")} source profiles across {SOURCE_NAMESPACE_COUNT} independent study namespaces.
            Browse each record&apos;s sampling context, marker evidence and observed properties. These are source-local labels, not a deduplicated count of biological types.
          </p>
        </div>
        <div className="type-evidence-zero" role="note"><strong>0</strong><span>exact cross-study identities · linked morphologies · registrations</span></div>
      </div>

      <details className="type-collection-disclosure">
        <summary>Study coverage and sampling denominators · {SOURCE_NAMESPACE_COUNT} sources</summary>
          <p>
            {PROFILES.length.toLocaleString("en-US")} source profiles: {sourceProfileCount("russ-2021")} Russ + {sourceProfileCount("sathyamurthy-2018")} Sathyamurthy + {sourceProfileCount("hayashi-2018:GSE108788")} Hayashi P0 V2a + {sourceProfileCount("haring-2018:GSE103840")} Häring P17–P28 dorsal-horn + {sourceProfileCount("alkaslasi-2021:GSE167597")} Alkaslasi adult cholinergic clusters + {sourceProfileCount("iglesias-gonzalez-2021:gse185731:mmusculus")} embryonic Dmrt3/dI6 groups + {sourceProfileCount("roome-2026:GSE291462")} Roome embryonic refined dIL types + {sourceProfileCount("delile-2019:E-MTAB-7320")} Delile E9.5–E13.5 fine subtypes + {sourceProfileCount("crozat-2025:figshare-29430869-v2")} Crozat PKD2L1 functional population + {sourceProfileCount("cano-gomez-2026:GSE318731")} Cano-Gomez P56 source-explicit CHOL_IN profiles.
            This arithmetic is not a deduplicated biological type count, and not every record is a confirmed local interneuron.
          </p>
      <div className="type-source-summary" aria-label="Type source summary">
        <article><span>RUSS 2021</span><strong>{sourceProfileCount("russ-2021")}</strong><p>source populations · {RUSS_CANDIDATE_PROFILE_COUNT} project-designated interneuron/projection candidates</p></article>
        <article><span>SATHYAMURTHY 2018</span><strong>{sourceProfileCount("sathyamurthy-2018")}</strong><p>adult lumbar neuronal clusters · {sathyNonMotorUnresolved} non-motor records unresolved as local interneuron versus projection neuron + VC-2 motor context</p></article>
        <article><span>HAYASHI 2018 · P0 V2a</span><strong>{hayashiTaxonomy.scope.reportedClusterCount}</strong><p>article-reported clusters · every cluster mixes Type I and Type II context · no public cluster-to-barcode map</p></article>
        <article><span>HÄRING 2018 · P17–P28</span><strong>{haringTaxonomy.scope.reportedClusterCount}</strong><p>15 Glut + 15 Gaba source clusters · exact matrix cell assignments and Table 4 counts · zero exact cross-source identities</p></article>
        <article><span>ALKASLASI 2021 · ADULT CHOLINERGIC</span><strong>{alkaslasiTaxonomy.scope.displayedProfileCount}</strong><p>I1–I8 source clusters · {alkaslasiTaxonomy.scope.sourceInterneuronNucleusCount.toLocaleString()} annotated nuclei · exact remote roster not bundled</p></article>
        <article><span>IGLESIAS GONZÁLEZ 2021 · E14.5 DMRT3/dI6</span><strong>{dmrt3Taxonomy.scope.displayedProfileCount}</strong><p>M1–M6 study-local groups · {dmrt3Taxonomy.scope.di6LineageRetainedCellCount} retained dI6-lineage cells · per-well group roster not exported</p></article>
        <article><span>ROOME 2026 · E14.5/E16.5 DORSAL HORN</span><strong>{roomeTaxonomy.scope.refinedTypeCount}</strong><p>exact Table S6 refined dIL types · {roomeTaxonomy.scope.refinedDilCellCount.toLocaleString()} captured dIL cells · Table S7 source-row differential evidence · zero linked 3D forms</p></article>
        <article><span>DELILE 2019 · E9.5–E13.5</span><strong>{delileTaxonomy.scope.fineSubtypeProfileCount}</strong><p>exact source-local fine subtypes across {delileTaxonomy.scope.fineSubtypeInterneuronCellCount.toLocaleString()} captured cells · <code>dl</code> spelling preserved · transmitter not established · zero linked 3D forms</p></article>
        <article><span>CROZAT 2025 · PKD2L1 CSF-cN</span><strong>{sourceProfileCount("crozat-2025:figshare-29430869-v2")}</strong><p>marker-defined population · cervical/thoracic/lumbar anatomy and electrophysiology · {crozatProfileContract.quarantinedConflicts.length} quarantined source conflicts · zero global cell joins or geometry</p></article>
        <article><span>CANO-GOMEZ 2026 · P56 MULTIOME</span><strong>{canoGomezRegistry.denominatorReconciliation.confirmedInterneuronProfileCount}</strong><p>source-explicit CHOL_IN profiles · {canoGomezRegistry.denominatorReconciliation.confirmedInterneuronNucleusCount.toLocaleString("en-US")} exact rostered nuclei · zero label-token marker inference, geometry, internal objects or registrations</p></article>
        <article><span>POOLED SAMPLE FRAME</span><strong>{sampleFrame.independentDropSeqSampleCount}</strong><p>independent pooled Drop-Seq samples · {sampleFrame.baselineIndependentSampleCount} baseline + {sampleFrame.formalinIndependentSampleCount} formalin + {sampleFrame.rotarodIndependentSampleCount} rotarod · {sampleFrame.geoAccessionCount} GEO accessions are not replicates</p></article>
        <article><span>HAYASHI DENOMINATOR</span><strong>{hayashiSampleFrame.sourceAnimalCount} → {hayashiSampleFrame.pooledLibraryCount} → {hayashiSampleFrame.qcRetainedCellCount.toLocaleString("en-US")}</strong><p>P0 neonates → pooled 10x library → QC-retained cells · {hayashiSampleFrame.animalResolvedReplicateCount} animal-resolved transcriptomic replicates</p></article>
        <article><span>HÄRING DENOMINATOR</span><strong>{haringSampleFrame.sourceAnimalCount} → {haringSampleFrame.cellSamplingCount.toLocaleString("en-US")}</strong><p>source animals → sampled single cells/GSMs · cell-column metadata are not animal prevalence</p></article>
        <article><span>ALKASLASI DENOMINATORS</span><strong>{alkaslasiSampleFrame.sourceAnimalCount} → {alkaslasiSampleFrame.processingReplicateCount} → {alkaslasiSampleFrame.geoSampleCount}</strong><p>mice → processing replicates → GEO samples · {alkaslasiSampleFrame.matchingRegionMousePoolSize}-mouse first-stage region pools and {alkaslasiSampleFrame.processingReplicateMouseCount} mice per processing replicate · {alkaslasiTaxonomy.scope.sourceTotalQcRetainedNucleusCount.toLocaleString()} QC nuclei are not animals</p></article>
        <article><span>DMRT3/dI6 DENOMINATORS</span><strong>{dmrt3Taxonomy.scope.depositedMouseWellCount} → {dmrt3Taxonomy.scope.qcRetainedCellCount} → {dmrt3Taxonomy.scope.di6LineageRetainedCellCount}</strong><p>deposited wells → executed-notebook QC cells → retained dI6-lineage cells · {dmrt3Taxonomy.scope.sourceEmbryoCount} E14.5 embryos pooled into {dmrt3Taxonomy.scope.independentLibraryCount} library</p></article>
        <article><span>ROOME DENOMINATORS</span><strong>{roomeTaxonomy.scope.biologicalLitterPoolCount} → {roomeTaxonomy.scope.retainedTechnicalOutputCount} → {roomeTaxonomy.scope.refinedDilCellCount.toLocaleString("en-US")}</strong><p>biological litter pools → retained technical outputs → refined dIL cells · technical outputs are not biological replicates</p></article>
        <article><span>DELILE DENOMINATORS</span><strong>{delileTaxonomy.scope.totalMetadataCellCount.toLocaleString("en-US")} → {delileTaxonomy.scope.sourceDefinedNeuronCellCount.toLocaleString("en-US")} → {delileTaxonomy.scope.sourceTypedNonmotorNeuronCellCount.toLocaleString("en-US")} → {delileTaxonomy.scope.fineSubtypeInterneuronCellCount.toLocaleString("en-US")}</strong><p>annotated cells → source-defined neurons → typed non-motor neurons → fine-subtype cells · {delileTaxonomy.scope.cardinalOnlyInterneuronCellCount} cells remain cardinal-only · animal denominator unresolved</p></article>
        <article><span>CANO-GOMEZ DENOMINATORS</span><strong>{canoGomezRegistry.denominatorReconciliation.sourceTotalNucleusCount.toLocaleString("en-US")} → {canoGomezRegistry.denominatorReconciliation.confirmedInterneuronNucleusCount.toLocaleString("en-US")}</strong><p>all P56 multiome nuclei → exact groups=CHOL_IN admissions · paper-reported {canoGomezRegistry.denominatorReconciliation.paperReportedNeuronTypeCount} neuronal types are not an interneuron denominator</p></article>
        <article><span>SAMPLED NUCLEI</span><strong>{sathyTaxonomy.scope.observedAssignedNeuronalNucleiCount.toLocaleString()}</strong><p>Sathyamurthy cluster assignments · dataset sampling only, never prevalence</p></article>
        <article><span>COORDINATE AUTHORITY</span><strong>TYPE</strong><p>source-local labels only · no cell xyz, atlas transform or segment placement</p></article>
      </div>
      </details>

      <div className="type-current-record-bar" aria-label="Selected source profile">
        <div><span>{profileSourceBadge(selected)}</span><strong>{selected.sourceLabel}</strong><small>{samplingCountDisplay(selected)} · {selected.lifeStage}</small></div>
        <div>
          <button type="button" onClick={() => { setSourceFilter(selected.namespace); setQuery(""); setRegionFilter("all"); setTransmitterFilter("all"); }}>Browse this source</button>
          <button type="button" onClick={() => dossierRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Go to selected evidence</button>
        </div>
      </div>

      <details className="type-source-labels-disclosure" onToggle={(event) => setShowGlutLabels(event.currentTarget.open)}>
        <summary>Cano-Gomez GLUT source assignments · {glutSourceLabels.denominators.sourceLabelCount} labels · separate from confirmed CHOL_IN profiles</summary>
        {showGlutLabels && <CanoGomezGlutLabelBrowser />}
      </details>

      <details className="type-classification-boundaries">
        <summary>Source-level classification limits · collapsed</summary>
        <div>
          <p className="type-classification-boundary" role="note">
            <strong>Sathyamurthy classification gate:</strong> the {sathyNonMotorUnresolved} non-motor profiles are not confirmed interneurons.
            Their local-interneuron versus projection-neuron status is unresolved; VC-2 is retained only as motor-neuron context.
          </p>
          <p className="type-classification-boundary" role="note">
            <strong>Hayashi evidence gate:</strong> Figure 6 reports {hayashiTaxonomy.scope.reportedClusterCount} clusters and exact cluster counts, while the public GEO matrix
            contains only gene counts and {hayashiMatrix.cellBarcodeColumnCount.toLocaleString("en-US")} barcodes. Type I/II, cluster and cervical/lumbar assignments are therefore shown as
            article-level evidence—not as deposited per-cell metadata. Type II remains projection-neuron context outside local-interneuron counts.
          </p>
          <p className="type-classification-boundary" role="note">
            <strong>Häring evidence gate:</strong> the checksum-pinned matrix directly retains {haringSampleFrame.cellSamplingCount.toLocaleString("en-US")} cell-column assignments to {haringTaxonomy.scope.reportedClusterCount}
            standardized labels from cells aged 17–28 days (conventionally P17–P28; GEO/SRA source text “3–4 week mice”).
            The source does not assert an adult, juvenile or young-adult category. These are source-local dorsal-horn neuronal clusters—not {haringTaxonomy.scope.reportedClusterCount} registered 3D cells,
            canonical cross-study identities, or project-confirmed local interneuron populations. Population spatial evidence is cervical, {haringTaxonomy.spatialEvidence.sourceAnimalCount}-animal and {haringTaxonomy.spatialEvidence.sectionCount}-section context only.
          </p>
          <p className="type-classification-boundary" role="note">
            <strong>Alkaslasi evidence gate:</strong> I1–I8 are exact source-local assignments from a checksum-pinned remote annotation object.
            Chat-Cre/Sun1 reporter history and GFP-positive FACS enrichment prohibit population-prevalence claims. Cervical, Thoracic and deposited <code>Lumbar</code>
            are sample-membership fields—not xyz, segment, lamina or registration. The {alkaslasiTaxonomy.scope.sourceInterneuronNucleusCount.toLocaleString("en-US")}-row nucleus roster remains remote and unbundled.
          </p>
          <p className="type-classification-boundary" role="note">
            <strong>Crozat evidence gate:</strong> PKD2L1+ CSF-contacting neurons are retained as one marker-defined functional population.
            Cervical/thoracic/lumbar, tonic/single-spike and quadrant rows stay nested evidence—not new types. Four denominator, coverage or inferential conflicts remain quarantined,
            and the public tables create no raw trace, morphology, atlas coordinate, internal structure or global per-cell join.
          </p>
          <p className="type-classification-boundary" role="note">
            <strong>Dmrt3/dI6 evidence gate:</strong> M1–M6 and the apparent birth-order interpretation are source-local notebook outputs from {dmrt3Taxonomy.scope.independentLibraryCount} library pooled from {dmrt3Taxonomy.scope.sourceEmbryoCount} E14.5 embryos.
            The processed loom contains neither per-well M-group assignments nor scalar pseudotime. The compact adapter retains exact group counts and markers but reconstructs no roster, trajectory, adult type, coordinate, morphology, physiology, or 3D object.
          </p>
          <p className="type-classification-boundary" role="note">
            <strong>Roome evidence gate:</strong> Table S6 supplies an exact {roomeTaxonomy.scope.refinedTypeCount}-type roster, captured-cell counts, composition and cluster QC. Table S7 supplies {roomeTaxonomy.signatureMethod.sourceRowsPerLabel} differential rows per source label;
            the {roomeTaxonomy.signatureMethod.displayedFeatureCountPerProfile} visible genes are positive differential features meeting declared thresholds, not canonical markers. {roomeTaxonomy.anomalies.excelCoercedGeneCellCount} apparent Excel-date gene cells remain quarantined. scRNA and Xenium are different cells, so the taxonomy creates no same-cell coordinate, morphology, internal object or 3D form.
          </p>
          <p className="type-classification-boundary" role="note">
            <strong>Delile evidence gate:</strong> the {delileTaxonomy.scope.fineSubtypeProfileCount} <code>Neuron_subtypes</code> labels and their {delileTaxonomy.scope.fineSubtypeInterneuronCellCount.toLocaleString("en-US")} captured-cell counts are source-local to the embryonic E9.5–E13.5 annotation object. The source spelling <code>dl</code> is preserved and is not normalized to <code>dI</code>. DV and pseudotime remain annotation fields—not physical coordinates, an atlas transform or an observed same-cell trajectory. The compact contract establishes no transmitter, adult identity, SCI identity, morphology, physiology, internal object or cross-source same-cell join.
          </p>
          <p className="type-classification-boundary" role="note">
            <strong>Cano-Gomez evidence gate:</strong> exactly {canoGomezRegistry.denominatorReconciliation.confirmedInterneuronProfileCount} profiles and {canoGomezRegistry.denominatorReconciliation.confirmedInterneuronNucleusCount.toLocaleString("en-US")} nuclei are admitted because their unmodified source <code>groups</code> value is <code>CHOL_IN</code>. Motor, sensory-scope, glutamatergic projection/local-unresolved and remaining GABA ambiguous/projection-exception records stay excluded. The reported {canoGomezRegistry.denominatorReconciliation.paperReportedNeuronTypeCount} neuronal types are not treated as interneurons; raw label tokens are not converted into markers, and no geometry, internal object, registration or same-cell link is created.
          </p>
        </div>
      </details>

      <div className="type-evidence-controls">
        <label>Search label, marker, family or accession
          <input type="search" value={query} maxLength={160} placeholder="e.g. Vsx2, Gaba1, dl1.1, Piezo2, GSE318731" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>Source namespace
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}>
            <option value="all">All {SOURCE_NAMESPACE_COUNT} sources · no merge</option>
            <option value="russ-2021">Russ 2021 · {sourceProfileCount("russ-2021")}</option>
            <option value="sathyamurthy-2018">Sathyamurthy 2018 · {sourceProfileCount("sathyamurthy-2018")}</option>
            <option value="hayashi-2018:GSE108788">Hayashi 2018 · {sourceProfileCount("hayashi-2018:GSE108788")} P0 V2a clusters</option>
            <option value="haring-2018:GSE103840">Häring 2018 · {sourceProfileCount("haring-2018:GSE103840")} P17–P28 dorsal-horn clusters</option>
            <option value="alkaslasi-2021:GSE167597">Alkaslasi 2021 · {sourceProfileCount("alkaslasi-2021:GSE167597")} adult cholinergic clusters</option>
            <option value="iglesias-gonzalez-2021:gse185731:mmusculus">Iglesias González 2021 · {sourceProfileCount("iglesias-gonzalez-2021:gse185731:mmusculus")} embryonic Dmrt3/dI6 groups</option>
            <option value="roome-2026:GSE291462">Roome 2026 · {sourceProfileCount("roome-2026:GSE291462")} embryonic refined dIL types</option>
            <option value="delile-2019:E-MTAB-7320">Delile 2019 · {sourceProfileCount("delile-2019:E-MTAB-7320")} E9.5–E13.5 fine subtypes</option>
            <option value="crozat-2025:figshare-29430869-v2">Crozat 2025 · {sourceProfileCount("crozat-2025:figshare-29430869-v2")} PKD2L1 functional population</option>
            <option value="cano-gomez-2026:GSE318731">Cano-Gomez 2026 · {sourceProfileCount("cano-gomez-2026:GSE318731")} P56 CHOL_IN profiles</option>
          </select>
        </label>
        <label>Region class
          <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value as RegionFilter)}>
            <option value="all">All source regions</option><option value="dorsal">Dorsal</option><option value="mid">Deep dorsal / mid</option><option value="ventral">Ventral</option><option value="central">Central</option><option value="not_established">Not established</option>
          </select>
        </label>
        <label>Transmitter class
          <select value={transmitterFilter} onChange={(event) => setTransmitterFilter(event.target.value as TransmitterFilter)}>
            <option value="all">All source classes</option><option value="excitatory">Excitatory</option><option value="inhibitory">Inhibitory</option><option value="mixed">Mixed cluster</option><option value="cholinergic">Cholinergic</option><option value="not_established">Not established</option>
          </select>
        </label>
        <button type="button" onClick={() => {
          downloadJson({
            release: "ohri-interneuron-type-evidence-atlas-0.1",
            exportedAt: new Date().toISOString(),
            selected,
            sourceRecordDelta: baseline ? buildSourceRecordDelta({
              oldRecord: { id: baseline.id, label: baseline.sourceLabel, namespace: baseline.namespace, value: baseline },
              currentRecord: { id: selected.id, label: selected.sourceLabel, namespace: selected.namespace, value: selected },
              rows: SOURCE_RECORD_DELTA_ROWS,
            }) : null,
            comparison,
            sourceReleases: [russHarmonizedTaxonomyCrosswalk.releaseId, sathyTaxonomy.releaseId, hayashiTaxonomy.releaseId, haringTaxonomy.releaseId, alkaslasiTaxonomy.releaseId, dmrt3Taxonomy.releaseId, roomeTaxonomy.releaseId, delileTaxonomy.releaseId, crozatProfileContract.releaseId, canoGomezRegistry.releaseId],
            sathyamurthySampleFrame: sampleFrame,
            hayashiSampleFrame,
            hayashiMatrixReceipt: {
              fileName: hayashiMatrix.fileName,
              compressedBytes: hayashiMatrix.compressedBytes,
              compressedSha256: hayashiMatrix.compressedSha256,
              geneRowCount: hayashiMatrix.geneRowCount,
              cellBarcodeColumnCount: hayashiMatrix.cellBarcodeColumnCount,
              sourceFileBundled: hayashiMatrix.sourceFileBundled,
              matrixReanalysis: hayashiMatrix.matrixReanalysis,
            },
            haringSampleFrame,
            haringMatrixReceipt: {
              fileName: haringMatrix.fileName,
              bytes: haringMatrix.bytes,
              sha256: haringMatrix.sha256,
              worksheetName: haringMatrix.worksheetName,
              ooxmlDimension: haringMatrix.ooxmlDimension,
              geneRowCount: haringMatrix.geneRowCount,
              cellColumnCount: haringMatrix.cellColumnCount,
              metadataRows: haringMatrix.metadataRows,
              ageDaysRange: haringMatrix.ageDaysRange,
              sexCodeCellCounts: haringMatrix.sexCodeCellCounts,
              strainCellCounts: haringMatrix.strainCellCounts,
              sourceFileBundled: haringMatrix.sourceFileBundled,
            },
            alkaslasiSampleFrame,
            alkaslasiAnnotationReceipt: {
              fileName: alkaslasiAnnotation.fileName,
              compressedBytes: alkaslasiAnnotation.compressedBytes,
              compressedSha256: alkaslasiAnnotation.compressedSha256,
              sourceFileBundled: alkaslasiAnnotation.sourceFileBundled,
              exactNucleusRosterBundled: alkaslasiAnnotation.exactNucleusRosterBundled,
              reuseStatus: alkaslasiAnnotation.reuseStatus,
            },
            delileAnnotationReceipt: {
              accession: delileTaxonomy.source.biostudies.accession,
              fileName: delileTaxonomy.source.annotatedMetadataObject.fileName,
              bytes: delileTaxonomy.source.annotatedMetadataObject.bytes,
              sha256: delileTaxonomy.source.annotatedMetadataObject.sha256,
              pinnedCommit: delileTaxonomy.source.repository.pinnedCommit,
              sourceFileBundled: delileTaxonomy.source.annotatedMetadataObject.sourceFileBundled,
              derivedFactualContractBundled: delileTaxonomy.source.repository.derivedFactualContractBundled,
              rightsStatus: delileTaxonomy.source.repository.rightsStatus,
            },
            crozatFigshareReceipt: {
              articleId: crozatProfileContract.source.figshare.articleId,
              version: crozatProfileContract.source.figshare.version,
              fileCount: crozatProfileContract.source.figshare.fileCount,
              totalBytes: crozatProfileContract.source.figshare.totalBytes,
              license: crozatProfileContract.source.figshare.license,
              keyFiles: crozatProfileContract.source.figshare.keyFiles,
              quarantinedConflicts: crozatProfileContract.quarantinedConflicts,
            },
            canoGomezRegistryReceipt: {
              datasetId: canoGomezRegistry.datasetId,
              identityAuthority: canoGomezRegistry.identityAuthority,
              denominatorReconciliation: canoGomezRegistry.denominatorReconciliation,
              artifacts: canoGomezRegistry.artifacts,
              sourceObjects: canoGomezRegistry.sourceObjects,
            },
            exactCrossStudyIdentityCount: 0,
            projectRegistrationCount: 0,
          }, "ohri-interneuron-type-evidence-atlas-selection-0.1.json");
          onNotice("Type dossier exported · source namespaces preserved · no source matrices included");
        }}>Export dossier</button>
      </div>

      <p className="type-result-count" role="status">{matching.length} of {PROFILES.length} source records match · filtered absence is not biological absence</p>
      <div className="type-evidence-workspace">
        <div ref={profileListRef} className="type-profile-list" role="listbox" aria-label="Source-local type profiles">
          {matching.map((profile) => (
            <button
              type="button"
              role="option"
              aria-selected={selected.id === profile.id}
              tabIndex={rovingProfileId === profile.id ? 0 : -1}
              key={profile.id}
              ref={(node) => { if (node) profileRefs.current.set(profile.id, node); else profileRefs.current.delete(profile.id); }}
              className={selected.id === profile.id ? "selected" : ""}
              onClick={() => selectProfile(profile.id)}
              onKeyDown={(event) => handleProfileKeys(event, profile.id)}
            >
              <span>{profileSourceBadge(profile)} · {prettify(profile.regionClass)}</span>
              <strong>{profile.sourceLabel}</strong>
              <em>{markerDisplay(profile)}</em>
              <small>{transmitterDisplay(profile)} · {profile.namespace === "crozat-2025:figshare-29430869-v2"
                ? "multiple experiment-specific N/n"
                : profile.samplingCount === null
                  ? "count not retained"
                  : `${profile.samplingCount} sampled ${profile.samplingUnit}`}</small>
            </button>
          ))}
          {!matching.length && <p className="type-empty">No source label matches these filters. This is not evidence that a biological population is absent.</p>}
        </div>

        <article ref={dossierRef} className="type-dossier" aria-label={`Source-record dossier for ${selected.sourceLabel}`}>
          <header>
            <div><span>{profileSourceBadge(selected)} · SELECTED SOURCE RECORD</span><p>Source-local evidence; comparison does not merge identities.</p></div>
            <button
              type="button"
              aria-pressed={comparisonIds.includes(selected.id)}
              disabled={!comparisonIds.includes(selected.id) && comparisonIds.length >= 4}
              onClick={() => toggleComparison(selected.id)}
            >{comparisonIds.includes(selected.id) ? "Remove from compare" : "Add to compare"}</button>
          </header>

          <ResearchRecordEvidenceFingerprint
            recordId={selected.id}
            sourceLabel={selected.sourceLabel}
            namespace={`${profileSourceBadge(selected)} · ${selected.sourceAccession}`}
            observationUnit={selected.unitOfObservation}
            samplingCount={selected.samplingCount}
            samplingUnit={selected.samplingUnit}
            samplingSummary={selected.namespace === "crozat-2025:figshare-29430869-v2" ? "Multiple experiment-specific N/n" : null}
            markers={selected.markers}
            regionContext={selectedRegionFingerprint}
            lifeStage={selected.lifeStage}
            transmitterContext={transmitterDisplay(selected)}
            axes={selectedFingerprintAxes}
            recordBoundary={selectedIdentityBoundary}
          />
          {baseline && <SourceRecordDeltaInspector
            oldRecord={{ id: baseline.id, label: baseline.sourceLabel, namespace: baseline.namespace, value: baseline }}
            currentRecord={{ id: selected.id, label: selected.sourceLabel, namespace: selected.namespace, value: selected }}
            rows={SOURCE_RECORD_DELTA_ROWS}
          />}
          <details className="type-record-metadata">
            <summary>Source metadata and assignment details</summary>
            <dl className="type-dossier-grid">
              <div><dt>Canonical parent source</dt><dd>{selected.parentSourceId}</dd></div>
              <div><dt>Source namespace</dt><dd>{selected.namespace}</dd></div>
              <div><dt>Record kind</dt><dd>{prettify(selected.recordKind)}</dd></div>
              <div><dt>Observation unit</dt><dd>{prettify(selected.unitOfObservation)}</dd></div>
              <div><dt>Assignment authority</dt><dd>{prettify(selected.assignmentAuthority)}</dd></div>
              <div><dt>Cell roster</dt><dd>{prettify(selected.cellRosterAvailability)}</dd></div>
              <div><dt>Canonical identity</dt><dd>{prettify(selected.canonicalIdentityStatus)}</dd></div>
              <div><dt>Accession</dt><dd>{selected.sourceAccession}</dd></div>
              <div><dt>Region class</dt><dd>{prettify(selected.regionClass)}</dd></div>
              <div><dt>Transmitter class</dt><dd>{transmitterDisplay(selected)}</dd></div>
              <div><dt>Life stage</dt><dd>{selected.lifeStage}</dd></div>
              <div><dt>Spinal scope</dt><dd>{selected.spinalScope}</dd></div>
              <div><dt>Spatial-domain context</dt><dd>{prettify(selected.spatialDomainContext)}</dd></div>
              <div><dt>Rostrocaudal context</dt><dd>{prettify(selected.rostrocaudalContext)}</dd></div>
              <div><dt>Source class context</dt><dd>{prettify(selected.majorTypeContext)}</dd></div>
              <div><dt>Profile authority</dt><dd>{prettify(selected.profileAuthority)}</dd></div>
              <div><dt>Project use class</dt><dd>{projectScopeLabel(selected)}</dd></div>
              <div><dt>Sampling count</dt><dd>{samplingCountDisplay(selected)}</dd></div>
              <div><dt>Figure/source markers</dt><dd>{markerDisplay(selected)}</dd></div>
              <div><dt>Raw source label(s)</dt><dd>{selected.rawLabels.join(" · ")}</dd></div>
            </dl>
          </details>
          {selected.namespace === "sathyamurthy-2018" && <aside className="type-sample-frame" aria-label="Sathyamurthy source sample frame">
            <div>
              <span>INDEPENDENT POOLED SAMPLES</span>
              <strong>{sampleFrame.independentDropSeqSampleCount}</strong>
              <p>{sampleFrame.baselineIndependentSampleCount} baseline ({sampleFrame.conditionSexBreakdown.baseline.malePooledSamples} male / {sampleFrame.conditionSexBreakdown.baseline.femalePooledSamples} female) · {sampleFrame.formalinIndependentSampleCount} formalin ({sampleFrame.conditionSexBreakdown.formalin.malePooledSamples} male / {sampleFrame.conditionSexBreakdown.formalin.femalePooledSamples} female) · {sampleFrame.rotarodIndependentSampleCount} rotarod ({sampleFrame.conditionSexBreakdown.rotarod.malePooledSamples} male / {sampleFrame.conditionSexBreakdown.rotarod.femalePooledSamples} female)</p>
            </div>
            <div>
              <span>REPORTED POOLING</span>
              <strong>{sampleFrame.micePerPooledSample} mice / sample</strong>
              <p>{sampleFrame.derivedMouseCountFromReportedPooling} mice derived from reported pooling · no profile-specific animal denominator</p>
            </div>
            <div>
              <span>ACCESSION BOUNDARY</span>
              <strong>{sampleFrame.geoAccessionCount} GEO accessions</strong>
              <p>{sampleFrame.formalinSequencingReactionCount} formalin sequencing reactions came from {sampleFrame.formalinIndependentSampleCount} biological replicates</p>
            </div>
            <p>{sampleFrame.interpretationBoundary}</p>
          </aside>}
          {selected.namespace === "hayashi-2018:GSE108788" && <aside className="type-sample-frame" aria-label="Hayashi source sample frame">
            <div>
              <span>EXPERIMENTAL-UNIT FLOW</span>
              <strong>{hayashiSampleFrame.sourceAnimalCount} neonates → {hayashiSampleFrame.pooledLibraryCount} library → {hayashiSampleFrame.qcRetainedCellCount} cells</strong>
              <p>{hayashiSampleFrame.prePoolingFACSCollectedCellCountByRegion.cervical.toLocaleString()} cervical + {hayashiSampleFrame.prePoolingFACSCollectedCellCountByRegion.lumbar.toLocaleString()} lumbar cells collected → approximately {hayashiSampleFrame.cellsProcessedApproximate.toLocaleString()} processed · {hayashiSampleFrame.tenXChemistry} · {hayashiSampleFrame.animalResolvedReplicateCount} animal-resolved transcriptomic replicates after pooling</p>
            </div>
            <div>
              <span>ARTICLE REGION ANALYSIS</span>
              <strong>{hayashiSampleFrame.articleAssignedCervicalCellCount} cervical · {hayashiSampleFrame.articleAssignedLumbarCellCount} lumbar</strong>
              <p>{hayashiSampleFrame.articleRegionAssignmentMethod}</p>
            </div>
            <div>
              <span>PUBLIC MATRIX COLUMNS</span>
              <strong>Counts only</strong>
              <p>Cluster: {String(hayashiMatrix.clusterAnnotationColumnAvailable)} · Type I/II: {String(hayashiMatrix.majorTypeAnnotationColumnAvailable)} · spinal region: {String(hayashiMatrix.spinalRegionAnnotationColumnAvailable)}</p>
            </div>
            <p>{hayashiSampleFrame.interpretationBoundary}</p>
          </aside>}
          {selected.namespace === "haring-2018:GSE103840" && selected.haringDetail && <aside className="type-sample-frame" aria-label="Häring source sample frame and selected-profile cell-column metadata">
            <div>
              <span>EXPERIMENTAL-UNIT BOUNDARY</span>
              <strong>{haringSampleFrame.sourceAnimalCount} source animals → {haringSampleFrame.cellSamplingCount.toLocaleString()} sampled cells</strong>
              <p>{haringSampleFrame.selectionCohorts.map((cohort) => `${cohort.animalCount} ${cohort.selection}`).join(" · ")} · source age text: {haringSampleFrame.sourceAgeText} · broad category: not source-asserted</p>
            </div>
            <div>
              <span>CURATION FLOW · DISTINCT PIPELINE STAGES</span>
              <strong>{haringTaxonomy.curationFlow.initialPostQcNeuronCount.toLocaleString()} post-QC → −{haringTaxonomy.curationFlow.excludedCellCount} exclude → {haringTaxonomy.curationFlow.finalCellCount.toLocaleString()} final</strong>
              <p>{haringTaxonomy.curationFlow.initialBackspinClusterCount} initial BackSPIN clusters → {haringTaxonomy.curationFlow.finalTypeCount} final types · {haringTaxonomy.curationFlow.finalGlutCellCount} Glut-group + {haringTaxonomy.curationFlow.finalGabaCellCount} Gaba-group cells</p>
            </div>
            <div>
              <span>SELECTED PROFILE · MATRIX CELLS</span>
              <strong>{selected.haringDetail.barcodeMetadataSummary.cellCount} exact cell columns · P{selected.haringDetail.barcodeMetadataSummary.ageDays.minimum}–P{selected.haringDetail.barcodeMetadataSummary.ageDays.maximum}</strong>
              <p>Age counts: {selected.haringDetail.barcodeMetadataSummary.ageDays.countsByAge.map((item) => `P${item.ageDays}:${item.count}`).join(" · ")}</p>
            </div>
            <div>
              <span>DEPOSITED SEX CODES · CELLS</span>
              <strong>code 0: {selected.haringDetail.barcodeMetadataSummary.sexCodeCounts["0"]} · code 1: {selected.haringDetail.barcodeMetadataSummary.sexCodeCounts["1"]}</strong>
              <p>Header: <code>{selected.haringDetail.barcodeMetadataSummary.sexCodeCounts.depositedCodeHeader}</code>. Codes are retained as deposited and are not independent-animal sex counts.</p>
            </div>
            <div>
              <span>STRAIN / SELECTION LABELS · CELLS</span>
              <strong>C57bl6 {selected.haringDetail.barcodeMetadataSummary.strainCellCounts.C57bl6} · vGat {selected.haringDetail.barcodeMetadataSummary.strainCellCounts["vGat-Cre-tdTomato"]} · vGlut2 {selected.haringDetail.barcodeMetadataSummary.strainCellCounts["vGlut2-eGFP"]}</strong>
              <p>Cell-column labels describe sampled cells, not donor prevalence or independent replication.</p>
            </div>
            <div>
              <span>POPULATION SPATIAL CONTEXT</span>
              <strong>{selected.haringDetail.spatialContext.sourceAnimalCount} animals · {selected.haringDetail.spatialContext.sectionCount} cervical sections</strong>
              <p>{selected.haringDetail.spatialContext.interpretationBoundary}</p>
            </div>
            <p>{haringSampleFrame.interpretationBoundary}</p>
          </aside>}
          {selected.namespace === "alkaslasi-2021:GSE167597" && selectedAlkaslasi && <aside className="type-sample-frame" aria-label="Alkaslasi source sample frame and selected-profile annotation metadata">
            <div>
              <span>EXPERIMENTAL-UNIT FLOW</span>
              <strong>{alkaslasiSampleFrame.sourceAnimalCount} mice → {alkaslasiSampleFrame.processingReplicateCount} processing replicates → {alkaslasiSampleFrame.geoSampleCount} GEO samples</strong>
              <p>{alkaslasiSampleFrame.femaleAnimalCount} female + {alkaslasiSampleFrame.maleAnimalCount} male · {alkaslasiSampleFrame.ageWeeks} weeks old · matching regions first pooled from {alkaslasiSampleFrame.matchingRegionMousePoolSize} mice · {alkaslasiSampleFrame.processingReplicateMouseCount} mice per processing replicate</p>
            </div>
            <div>
              <span>SOURCE PIPELINE DENOMINATORS</span>
              <strong>{alkaslasiTaxonomy.scope.sourceTotalQcRetainedNucleusCount.toLocaleString()} QC → {alkaslasiTaxonomy.scope.sourceCholinergicNucleusCount.toLocaleString()} cholinergic → {alkaslasiTaxonomy.scope.sourceInterneuronNucleusCount.toLocaleString()} I1–I8</strong>
              <p>Distinct analysis levels; none is an animal denominator or biological prevalence estimate.</p>
            </div>
            <div>
              <span>SELECTED PROFILE · SAMPLE MEMBERSHIP</span>
              <strong>Cervical {selectedAlkaslasi.sampleRegionMembership.counts.Cervical} · Thoracic {selectedAlkaslasi.sampleRegionMembership.counts.Thoracic} · <code>Lumbar</code> {selectedAlkaslasi.sampleRegionMembership.counts.Lumbar}</strong>
              <p>{selectedAlkaslasi.sampleRegionMembership.boundary}</p>
            </div>
            <div>
              <span>SELECTED PROFILE · DEPOSITED SEX FIELD</span>
              <strong>M {selectedAlkaslasi.depositedSexFieldMembership.counts.M} · F {selectedAlkaslasi.depositedSexFieldMembership.counts.F} · NA {selectedAlkaslasi.depositedSexFieldMembership.counts.NA}</strong>
              <p>{selectedAlkaslasi.depositedSexFieldMembership.boundary}</p>
            </div>
            <div>
              <span>REMOTE OBJECT RECEIPT</span>
              <strong>{alkaslasiAnnotation.compressedBytes.toLocaleString()} bytes · roster bundled {String(alkaslasiAnnotation.exactNucleusRosterBundled)}</strong>
              <p>SHA-256 <code>{alkaslasiAnnotation.compressedSha256}</code></p>
            </div>
            <p>{alkaslasiSampleFrame.interpretationBoundary}</p>
          </aside>}
          {selected.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus" && <aside className="type-sample-frame" aria-label="Dmrt3 dI6 pooled source frame and selected group summary">
            <div>
              <span>EXPERIMENTAL-UNIT FLOW</span>
              <strong>{dmrt3Taxonomy.scope.sourceEmbryoCount} E14.5 embryos → {dmrt3Taxonomy.scope.poolCount} pool → {dmrt3Taxonomy.scope.independentLibraryCount} library</strong>
              <p>{dmrt3Taxonomy.scope.animalResolvedReplicateCount} animal-resolved transcriptomic replicates after pooling · no animal-level M1–M6 denominator</p>
            </div>
            <div>
              <span>EXECUTED-NOTEBOOK LINEAGE</span>
              <strong>{dmrt3Taxonomy.scope.depositedMouseWellCount} wells → {dmrt3Taxonomy.scope.qcRetainedCellCount} QC → {dmrt3Taxonomy.scope.di6LineageRetainedCellCount} dI6</strong>
              <p>M1 {dmrt3Taxonomy.profiles[0].samplingCount} · M2 {dmrt3Taxonomy.profiles[1].samplingCount} · M3 {dmrt3Taxonomy.profiles[2].samplingCount} · M4 {dmrt3Taxonomy.profiles[3].samplingCount} · M5 {dmrt3Taxonomy.profiles[4].samplingCount} · M6 {dmrt3Taxonomy.profiles[5].samplingCount}</p>
            </div>
            <div>
              <span>SELECTED GROUP</span>
              <strong>{selected.sourceLabel} · {selected.samplingCount} retained cells · {prettify(selected.majorTypeContext)}</strong>
              <p>{selected.markers.join(" · ")} · source-local top-marker summary, not a necessary-and-sufficient diagnostic panel</p>
            </div>
            <div>
              <span>ROSTER / TRAJECTORY BOUNDARY</span>
              <strong>Group summary only</strong>
              <p>Per-well M1–M6 assignments and scalar pseudotime are absent from the loom and are not reconstructed.</p>
            </div>
            <div>
              <span>QC CONFLICT · QUARANTINED</span>
              <strong>Methods ≠ executed notebook</strong>
              <p>Executed thresholds and 5,000 HVGs govern the derivative; the Methods thresholds, normalize_total step and 2,000-HVG statement remain visible without harmonization.</p>
            </div>
            <p>{dmrt3Taxonomy.analysisLineage.transformationAuthority.interpretationBoundary}</p>
          </aside>}
          {selected.namespace === "roome-2026:GSE291462" && selectedRoome && <aside
            className="type-sample-frame"
            aria-label="Roome refined dIL selected-record metrics and evidence boundary"
            data-source-profile-id={selected.id}
            data-admitted-geometry-count="0"
          >
            <div>
              <span>SELECTED TYPE · TABLE S6</span>
              <strong>{selectedRoome.sourceLocalLabel} · {selectedRoome.frequency.toLocaleString()} captured cells</strong>
              <p>{selectedRoome.percentOfDil.toFixed(4)}% of {roomeTaxonomy.scope.refinedDilCellCount.toLocaleString()} refined dIL cells · source row {selectedRoome.sourceRow}</p>
            </div>
            <div>
              <span>TYPE-SPECIFIC CLUSTER QC</span>
              <strong>{selectedRoome.meanGenesPerCell.toFixed(1)} mean genes / cell</strong>
              <p>silhouette {selectedRoome.meanSilhouetteScore.toFixed(4)} · LISI {selectedRoome.meanLisiScore.toFixed(4)} · algorithmic cluster metrics, not morphology fidelity</p>
            </div>
            <div>
              <span>POSITIVE DIFFERENTIAL FEATURES · TABLE S7</span>
              <strong>{selectedRoome.displayFeatures.map((feature) => feature.gene).join(" · ")}</strong>
              <p>Top 6 of {selectedRoome.differentialFeatureAudit.positiveDisplayCandidateCount} rows meeting declared display thresholds · each feature keeps its exact source row</p>
            </div>
            <div>
              <span>SOURCE-ROW / QUARANTINE AUDIT</span>
              <strong>{selectedRoome.differentialFeatureAudit.retainedTextGeneRowCount} text-gene rows · {selectedRoome.differentialFeatureAudit.quarantinedGeneRowCount} quarantined</strong>
              <p>{selectedRoome.differentialFeatureAudit.sourceRowCount} deposited differential rows for this label · file-wide Excel-coercion quarantine {roomeTaxonomy.anomalies.excelCoercedGeneCellCount}</p>
            </div>
            <div>
              <span>3D / INTERNAL MODEL STATE</span>
              <strong>0 admitted type-specific geometry · 0 internal objects</strong>
              <p>No generic soma, neurite, pseudo-depth, organelle or cross-source morphology is substituted for this molecular record.</p>
            </div>
            <p>{roomeTaxonomy.denominatorBoundary}</p>
          </aside>}
          {selected.namespace === "delile-2019:E-MTAB-7320" && selectedDelile && <aside
            className="type-sample-frame"
            aria-label={`Delile ${selectedDelile.sourceLocalLabel} exact source-record evidence`}
            data-source-profile-id={selected.id}
            data-source-cell-count={selectedDelile.cellCount}
            data-admitted-geometry-count="0"
            data-admitted-internal-structure-count="0"
            data-project-registration-count="0"
          >
            <div>
              <span>SELECTED FINE SUBTYPE · EXACT SOURCE COUNT</span>
              <strong>{selectedDelile.sourceLocalLabel} · {selectedDelile.cellCount.toLocaleString()} captured cells</strong>
              <p>{selectedDelile.percentOfFineSubtypeInterneuronCells.toFixed(6)}% of {delileTaxonomy.scope.fineSubtypeInterneuronCellCount.toLocaleString()} fine-subtype interneuron cells · cardinal class {selectedDelile.cardinalClass}</p>
            </div>
            <div>
              <span>SELECTED SUBTYPE · TIMEPOINT DISTRIBUTION</span>
              <strong>{selectedDelile.timepointCellCounts.map((item) => `${item.lifeStage}:${item.cellCount}`).join(" · ")}</strong>
              <p>Exact source-table cell counts across embryonic E9.5–E13.5; they are not longitudinal observations of the same cells.</p>
            </div>
            <div>
              <span>DV / PSEUDOTIME FIELD COVERAGE</span>
              <strong>DV {selectedDelile.dvObservedCellCount}/{selectedDelile.cellCount} · pseudotime {selectedDelile.pseudotimeObservedCellCount}/{selectedDelile.cellCount}</strong>
              <p>Observed annotation-field coverage only. DV is not xyz and pseudotime is not a physical coordinate or observed same-cell trajectory.</p>
            </div>
            <div>
              <span>3D / INTERNAL MODEL STATE</span>
              <strong>{delileTaxonomy.scope.admittedGeometryCount} geometry · {delileTaxonomy.scope.admittedInternalStructureCount} internal objects · {delileTaxonomy.scope.projectRegistrationCount} registrations</strong>
              <p>No generic soma, neurite, organelle, pseudo-depth or cross-source morphology is substituted for this molecular record.</p>
            </div>
            <p>{delileTaxonomy.denominatorBoundary}</p>
          </aside>}
          {selected.namespace === "cano-gomez-2026:GSE318731" && selectedCanoGomez && <aside
            className="type-sample-frame"
            aria-label={`Cano-Gomez ${selectedCanoGomez.sourceLocalLabel} exact source-record evidence`}
            data-source-profile-id={selected.id}
            data-source-nucleus-count={selectedCanoGomez.nucleusCount}
            data-admitted-geometry-count={selectedCanoGomez.geometryAuthority.geometryObjectCount}
            data-admitted-internal-structure-count={selectedCanoGomez.geometryAuthority.internalStructureObjectCount}
            data-same-cell-link-count={selectedCanoGomez.geometryAuthority.sameCellLinkCount}
            data-project-registration-count={selectedCanoGomez.geometryAuthority.atlasRegistrationCount}
          >
            <div>
              <span>SELECTED PROFILE · EXACT SOURCE ROSTER</span>
              <strong><code>{selectedCanoGomez.sourceLocalLabel}</code> · {selectedCanoGomez.nucleusCount.toLocaleString("en-US")} nuclei</strong>
              <p><code>{selectedCanoGomez.sourceGroup}</code> · {prettify(selectedCanoGomez.assignmentAuthority)} · stable field <code>{selectedCanoGomez.stableIdentityField}</code></p>
            </div>
            {selectedCanoGomez.contextFieldCounts.map((context) => <div key={`${selected.id}-${context.field}`}>
              <span>PROFILE CONTEXT COUNTS · <code>{context.field}</code></span>
              <strong>{context.counts.length} retained value{context.counts.length === 1 ? "" : "s"} · {context.missingCount.toLocaleString("en-US")} missing · {context.emptyCount.toLocaleString("en-US")} empty</strong>
              <p>{context.counts.length ? context.counts.map((item) => `${JSON.stringify(item.value)}=${item.count.toLocaleString("en-US")}`).join(" · ") : "No non-empty value count was retained."}</p>
            </div>)}
            <div>
              <span>IDENTITY AUTHORITY</span>
              <strong>{canoGomezRegistry.identityAuthority.mode}</strong>
              <p>Cross-assay identity verified: {String(canoGomezRegistry.identityAuthority.crossAssayCellIdentityVerified)} · same-cell assertion admitted: {String(canoGomezRegistry.identityAuthority.sameCellAssertionAdmitted)}</p>
            </div>
            <div>
              <span>MARKER EVIDENCE</span>
              <strong>{selectedCanoGomez.markerEvidenceStatus}</strong>
              <p>The exact raw label is preserved, including whitespace anomalies. Its tokens are not split, normalized or promoted into marker evidence.</p>
            </div>
            <div>
              <span>3D / INTERNAL MODEL STATE</span>
              <strong>{selectedCanoGomez.geometryAuthority.geometryObjectCount} geometry · {selectedCanoGomez.geometryAuthority.internalStructureObjectCount} internal objects · {selectedCanoGomez.geometryAuthority.atlasRegistrationCount} registrations</strong>
              <p>No generic soma, neurite, organelle, pseudo-depth or cross-source morphology is substituted for this exact molecular record.</p>
            </div>
            <p>{canoGomezRegistry.identityAuthority.boundary}</p>
          </aside>}

          <div className="type-context-grid">
            {selected.namespace === "haring-2018:GSE103840" && selected.haringDetail ? <>
              <section>
                <h5>Signed identification rule(s) · Supplementary Table 5</h5>
                {selectedHaringRules.map((rule) => <div key={rule.id}>
                  <strong>{rule.rawCombination.value} → {rule.sourceClusterName.value}</strong>
                  <p>{rule.components.map((component) => `${component.polarity === "positive" ? "+" : "−"}${component.gene}`).join(" · ")}</p>
                  <small>{prettify(rule.targetMappingStatus)} · staining {rule.staining.value} · {rule.rawCombination.locator.sheet}!{rule.rawCombination.locator.cell}</small>
                </div>)}
              </section>
              <section>
                <h5>Specific-marker cells · Supplementary Table 8</h5>
                <div>
                  <strong>{[selected.haringDetail.specificMarkerSummary.mainMarker, selected.haringDetail.specificMarkerSummary.coMarker1, selected.haringDetail.specificMarkerSummary.coMarker2].filter(Boolean).map((marker) => marker?.raw).join(" · ")}</strong>
                  <p>Standard label {selected.haringDetail.table8SourceLocalLabel} · deposited raw cluster <code>{selected.haringDetail.barcodeMetadataSummary.rawClusterName}</code></p>
                  <small>{selected.haringDetail.barcodeMetadataSummary.rawClusterNameContext}</small>
                </div>
              </section>
            </> : selected.namespace === "hayashi-2018:GSE108788" ? <>
              <section>
                <h5>Source-reported major-type framework</h5>
                {hayashiTaxonomy.sourceReportedMajorTypes.map((majorType) => <div key={majorType.id}>
                  <strong>{majorType.label} · {prettify(majorType.chx10Context)}</strong>
                  <p>{prettify(majorType.networkContext)} · {prettify(majorType.projectionContext)}</p>
                  <small>{prettify(majorType.authority)} · exact barcode assignment: {String(majorType.exactBarcodeAssignmentAvailable)}</small>
                </div>)}
              </section>
              <section>
                <h5>Cluster-to-type boundary</h5>
                <div><strong>Every cluster is mixed</strong><p>{prettify(selected.majorTypeContext)}</p><small>Type II is supraspinal projection context and is excluded from confirmed local-interneuron counts. Population-level tracing is not a same-cell link to sequenced barcodes.</small></div>
              </section>
            </> : selected.namespace === "alkaslasi-2021:GSE167597" && selectedAlkaslasi ? <>
              <section>
                <h5>Article marker evidence · not per-nucleus expression</h5>
                {selectedAlkaslasi.markerEvidence.map((claim, index) => <div key={`${claim.evidenceStatus}-${index}`}>
                  <strong>{claim.positiveMarkers.map((marker) => `+${marker}`).join(" · ")}{claim.negativeMarkers.length ? ` · ${claim.negativeMarkers.map((marker) => `−${marker}`).join(" · ")}` : ""}</strong>
                  <p>{claim.claim}</p>
                  <small>{claim.boundary}</small>
                </div>)}
                <div>
                  <strong>Figure 5a prominent labels · {alkaslasiProminentLabels(selectedAlkaslasi.sourceLocalLabel).join(" · ")}</strong>
                  <p>Displayed source-figure labels for {selectedAlkaslasi.sourceLocalLabel}; shared labels are retained.</p>
                  <small>{alkaslasiTaxonomy.articleFigure5aMarkerContext.boundary}</small>
                </div>
              </section>
              <section>
                <h5>Retained source anomaly and I8 caution</h5>
                {alkaslasiTaxonomy.sourceObjectAudit.rawSourceAnomalies.map((anomaly) => <div key={`${anomaly.field}-${anomaly.rawValue}`}><strong><code>{anomaly.rawValue}</code> · preserved verbatim</strong><p>{anomaly.kind}</p><small>{anomaly.boundary}</small></div>)}
                <div><strong>{alkaslasiTaxonomy.sourceObjectAudit.skeletalLabelConflicts.length} excluded skeletal-label conflicts · preserved, not repaired</strong><p>{alkaslasiTaxonomy.sourceObjectAudit.skeletalLabelConflicts.map((conflict) => `${conflict.newnames}/${conflict.skeletaltypes} at row ${conflict.sourceRowIndex}`).join(" · ")}</p><small>These source-object conflicts are outside the I1–I8 subset and do not change its {alkaslasiTaxonomy.scope.sourceInterneuronNucleusCount.toLocaleString("en-US")}-nucleus denominator.</small></div>
                {selectedAlkaslasi.i8ArticleCaution && <div><strong>I8 evidence sequence</strong><p>{selectedAlkaslasi.i8ArticleCaution}</p><small>No universal canonical identity is created.</small></div>}
              </section>
            </> : selected.namespace === "roome-2026:GSE291462" && selectedRoome ? <>
              <section>
                <h5>Type-specific positive differential features</h5>
                {selectedRoome.displayFeatures.map((feature) => <div key={`${selected.id}-${feature.sourceRow}`}>
                  <strong>{feature.rank}. {feature.gene} · Δ detection {(feature.prevalenceDelta * 100).toFixed(1)} pp</strong>
                  <p>avg log2FC {feature.avgLog2Fc.toFixed(3)} · pct.1 {(feature.pct1 * 100).toFixed(1)}% · pct.2 {(feature.pct2 * 100).toFixed(1)}%</p>
                  <small>adjusted P {feature.adjustedPValue.toExponential(2)} · Table S7 row {feature.sourceRow}</small>
                </div>)}
              </section>
              <section>
                <h5>Record completeness · fail closed</h5>
                <div><strong>Molecular metrics available</strong><p>Count, composition, mean genes, silhouette, LISI and {selectedRoome.displayFeatures.length} thresholded differential features are record-specific.</p><small>Table S6 {selectedRoome.sourceRange} · {selectedRoome.differentialFeatureAudit.sourceRowCount} Table S7 rows hashed as {selectedRoome.differentialFeatureAudit.canonicalSourceRowsSha256.slice(0, 16)}…</small></div>
                <div><strong>Geometry and internal structure unavailable</strong><p>Morphology, whole-cell geometry, axon/dendrite topology, synapses, physiology and internal structure are not measured by this type contract.</p><small>Missing evidence is shown as missing; it is not biological absence.</small></div>
              </section>
            </> : selected.namespace === "delile-2019:E-MTAB-7320" && selectedDelile ? <>
              <section>
                <h5>Source denominator lineage</h5>
                <div>
                  <strong>{delileTaxonomy.scope.totalMetadataCellCount.toLocaleString()} annotated → {delileTaxonomy.scope.sourceDefinedNeuronCellCount.toLocaleString()} neurons → {delileTaxonomy.scope.sourceTypedNonmotorNeuronCellCount.toLocaleString()} typed non-motor</strong>
                  <p>{delileTaxonomy.scope.fineSubtypeInterneuronCellCount.toLocaleString()} fine-subtype cells · {delileTaxonomy.scope.cardinalOnlyInterneuronCellCount} cardinal-only cells · {delileTaxonomy.scope.motorNeuronExcludedCellCount.toLocaleString()} MN and {delileTaxonomy.scope.nullNeuronExcludedCellCount.toLocaleString()} Null_Neuron rows retained in provenance but excluded from the displayed fine-subtype denominator</p>
                  <small>{delileTaxonomy.scope.biologicalAnimalCountMissingReason}</small>
                </div>
              </section>
              <section>
                <h5>Source-bound identity and model limit</h5>
                <div>
                  <strong><code>{selectedDelile.sourceLocalLabel}</code> within source cardinal class <code>{selectedDelile.cardinalClass}</code></strong>
                  <p>The <code>Neuron_subtypes</code> assignment is exact within the pinned table. No marker panel or transmitter class is supplied by this compact contract.</p>
                  <small>The source spelling <code>dl</code> is preserved. This record is not an adult identity, canonical cross-study type, morphology, internal object or atlas placement.</small>
                </div>
              </section>
            </> : selected.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus" ? <>
              <section>
                <h5>Study-local temporal evidence</h5>
                <div>
                  <strong>{prettify(selected.majorTypeContext)}</strong>
                  <p>{selected.sourceLabel} top markers: {selected.markers.join(" · ")}</p>
                  <small>Apparent birth order is source-level interpretation; the public loom exports no scalar pseudotime.</small>
                </div>
              </section>
              <section>
                <h5>Executed-notebook authority and conflict</h5>
                <div>
                  <strong>{dmrt3Taxonomy.source.repository.pinnedCommit.slice(0, 12)} · {dmrt3Taxonomy.qualityControl.reconciliationStatus.replaceAll("_", " ")}</strong>
                  <p>{dmrt3Taxonomy.quarantinedConflicts[0].executedNotebookDescription}</p>
                  <small>{dmrt3Taxonomy.quarantinedConflicts[0].interpretationBoundary}</small>
                </div>
              </section>
            </> : selected.namespace === "cano-gomez-2026:GSE318731" && selectedCanoGomez ? <>
              <section>
                <h5>Exact source-local assignment</h5>
                <div>
                  <strong><code>groups={selectedCanoGomez.sourceGroup}</code> · {selectedCanoGomez.nucleusCount.toLocaleString("en-US")} rostered nuclei</strong>
                  <p>Profile ID <code>{selectedCanoGomez.profileId}</code> · ordered compound-key receipt <code>{selectedCanoGomez.orderedCompoundNucleusKeysSha256}</code></p>
                  <small>This confirms source-local interneuron scope only; it does not establish a canonical biological type across studies.</small>
                </div>
              </section>
              <section>
                <h5>Marker and model limits</h5>
                <div>
                  <strong>Markers not established · no label-token inference</strong>
                  <p><code>{JSON.stringify(selectedCanoGomez.sourceLocalLabel)}</code> is preserved as one raw source label, not parsed into gene markers.</p>
                  <small>{canoGomezRegistry.hardBoundaries.at(-1)}</small>
                </div>
                <div>
                  <strong>0 geometry · 0 internal structures · 0 same-cell links · 0 registrations</strong>
                  <p>The molecular receipt never authorizes a generic cell form or intracellular reconstruction.</p>
                  <small>{canoGomezRegistry.hardBoundaries.find((boundary) => boundary.includes("admits no morphology"))}</small>
                </div>
              </section>
            </> : <>
              <section><h5>Cross-lineage hints · not established</h5>{selected.lineageHints.length ? selected.lineageHints.map((hint) => <div key={`${hint.target}-${hint.status}`}><strong>{hint.target} · {prettify(hint.status)}</strong><p>{hint.evidence}</p><small>{hint.boundary}</small></div>) : <p>No candidate relationship is admitted for this record.</p>}</section>
              <section><h5>Activity and electrophysiology evidence</h5>{selected.activityEvidence.length ? selected.activityEvidence.map((item) => <div key={`${item.context}-${item.finding}`}><strong>{prettify(item.context)}</strong><p>{item.finding}</p><small>{item.interpretationBoundary}</small></div>) : <p>No activity or electrophysiology evidence is retained in this profile.</p>}</section>
            </>}
          </div>

          <details className="type-source-details">
            <summary>Field locators and technical provenance</summary>
            <ul>{selectedLocatorText.map((locator) => <li key={locator}>{locator}</li>)}</ul>
            {selected.namespace === "sathyamurthy-2018" && <>
              <p>Cluster metadata SHA-256 <code>{sathyTaxonomy.source.geo.clusterMetadataAsset.sha256}</code> · source file bundled: {String(sathyTaxonomy.source.geo.clusterMetadataAsset.sourceFileBundled)} · derived factual metadata bundled: {String(sathyTaxonomy.source.geo.clusterMetadataAsset.derivedFactualMetadataBundled)}</p>
              <p>Sample-frame locators: {sampleFrame.sourceLocatorIds.map((id) => {
                const record = sathyTaxonomy.sourceLocators.find((locator) => locator.id === id);
                return record ? `${id} · ${record.locator}` : id;
              }).join(" | ")}</p>
              <p>Reuse status: {prettify(sathyTaxonomy.source.geo.clusterMetadataAsset.reuseStatus)}. Article license: {sathyTaxonomy.source.publication.license.id}, article only.</p>
            </>}
            {selected.namespace === "hayashi-2018:GSE108788" && <>
              <p>Count matrix <code>{hayashiMatrix.fileName}</code> · {hayashiMatrix.compressedBytes.toLocaleString()} compressed bytes · SHA-256 <code>{hayashiMatrix.compressedSha256}</code>.</p>
              <p>{hayashiMatrix.geneRowCount.toLocaleString()} unique gene rows × {hayashiMatrix.cellBarcodeColumnCount.toLocaleString()} unique barcode columns · {hayashiMatrix.uncompressedBytes.toLocaleString()} uncompressed bytes. Cluster, Type I/II and spinal-region annotation columns are absent.</p>
              <p><strong>Independent matrix check:</strong> {hayashiMatrix.matrixReanalysis.v2aMarkerPositiveBarcodeCount}/{hayashiMatrix.cellBarcodeColumnCount} ({hayashiMatrix.matrixReanalysis.v2aMarkerPositivePercentage}%) barcodes are positive for at least one retained V2a marker; the article reports {hayashiMatrix.matrixReanalysis.articleReportedV2aMarkerPositivePercentage}%. {hayashiMatrix.matrixReanalysis.slc17a6PositiveBarcodeCount}/{hayashiMatrix.cellBarcodeColumnCount} ({hayashiMatrix.matrixReanalysis.slc17a6PositivePercentage}%) are Slc17a6-positive; the article reports {hayashiMatrix.matrixReanalysis.articleReportedSlc17a6PositivePercentage}%.</p>
              <p>{hayashiMatrix.matrixReanalysis.interpretationBoundary}</p>
              <p>Source file bundled: {String(hayashiMatrix.sourceFileBundled)} · derived factual metadata bundled: {String(hayashiMatrix.derivedFactualMetadataBundled)} · reuse status: {prettify(hayashiMatrix.reuseStatus)}.</p>
              <p>{hayashiMatrix.rightsBoundary}</p>
            </>}
            {selected.namespace === "haring-2018:GSE103840" && selected.haringDetail && <>
              <p>Count matrix <code>{haringMatrix.fileName}</code> · {haringMatrix.bytes.toLocaleString()} bytes · SHA-256 <code>{haringMatrix.sha256}</code>.</p>
              <p>Sheet <code>{haringMatrix.worksheetName}</code> · dimension <code>{haringMatrix.ooxmlDimension}</code> · {haringMatrix.geneRowCount.toLocaleString()} gene rows × {haringMatrix.cellColumnCount.toLocaleString()} cell columns. Raw-cluster and standardized-label assignments are directly present.</p>
              <p><strong>Selected-profile count locators:</strong> label {selected.haringDetail.samplingCount.sourceLabelLocator.sheet}!{selected.haringDetail.samplingCount.sourceLabelLocator.cell} · count {selected.haringDetail.samplingCount.sourceCountLocator.sheet}!{selected.haringDetail.samplingCount.sourceCountLocator.cell}.</p>
              <p><strong>Matrix metadata boundary:</strong> P{haringMatrix.ageDaysRange.minimum}–P{haringMatrix.ageDaysRange.maximum}; deposited sex codes 0={haringMatrix.sexCodeCellCounts.code0.toLocaleString()} and 1={haringMatrix.sexCodeCellCounts.code1.toLocaleString()}; strain/selection cell columns C57bl6={haringMatrix.strainCellCounts.C57bl6}, vGat-Cre-tdTomato={haringMatrix.strainCellCounts.vGatCreTdTomato}, vGlut2-eGFP={haringMatrix.strainCellCounts.vGlut2EGfp}. These are cell-column counts, not animal prevalence.</p>
              <p>{haringMatrix.interpretationBoundary}</p>
              <p><strong>Retained source discrepancies · no silent repair:</strong> {haringTaxonomy.sourceDiscrepancies.map((discrepancy) => `${prettify(discrepancy.axis)} — ${discrepancy.sourceValues.join(" ↔ ")} — ${discrepancy.projectDecision}`).join(" · ")}</p>
              <p>Source file bundled: {String(haringMatrix.sourceFileBundled)} · derived factual metadata bundled: {String(haringMatrix.derivedFactualMetadataBundled)} · reuse status: {prettify(haringMatrix.reuseStatus)}.</p>
              <p>{haringMatrix.rightsBoundary}</p>
            </>}
            {selected.namespace === "alkaslasi-2021:GSE167597" && selectedAlkaslasi && <>
              <p><strong>Publication identity boundary:</strong> DOI <code>{alkaslasiTaxonomy.source.publication.doi}</code> · authoritative PMID <code>{alkaslasiTaxonomy.source.publication.pmid}</code>. GEO currently displays PMID <code>{alkaslasiTaxonomy.source.geo.displayedCitationPmid}</code>; {alkaslasiTaxonomy.source.geo.citationLinkBoundary}</p>
              <p>Annotation object <code>{alkaslasiAnnotation.fileName}</code> · {alkaslasiAnnotation.compressedBytes.toLocaleString()} compressed bytes · SHA-256 <code>{alkaslasiAnnotation.compressedSha256}</code>.</p>
              <p>{alkaslasiTaxonomy.sourceObjectAudit.sourceRowCount.toLocaleString()} contiguous source rows · {alkaslasiTaxonomy.sourceObjectAudit.uniqueBarcodeCount.toLocaleString()} unique barcodes · I1–I8 aggregate receipt <code>{alkaslasiTaxonomy.sourceObjectAudit.profileAggregateTupleReceipt.sha256}</code>.</p>
              <p>Source file bundled: {String(alkaslasiAnnotation.sourceFileBundled)} · exact nucleus roster bundled: {String(alkaslasiAnnotation.exactNucleusRosterBundled)} · derived factual metadata bundled: {String(alkaslasiAnnotation.derivedFactualMetadataBundled)} · reuse status: {prettify(alkaslasiAnnotation.reuseStatus)}.</p>
              <p>{alkaslasiAnnotation.rightsBoundary}</p>
            </>}
            {selected.namespace === "iglesias-gonzalez-2021:gse185731:mmusculus" && <>
              <p><strong>Pinned source lineage:</strong> GEO <code>{dmrt3Taxonomy.source.geo.accession}</code> · authors&apos; commit <code>{dmrt3Taxonomy.source.repository.pinnedCommit}</code> · tree <code>{dmrt3Taxonomy.source.repository.commitTree}</code>.</p>
              <p>Processed loom <code>{dmrt3Taxonomy.source.geo.processedObject.fileName}</code> · {dmrt3Taxonomy.source.geo.processedObject.compressedBytes.toLocaleString()} bytes · SHA-256 <code>{dmrt3Taxonomy.source.geo.processedObject.compressedSha256}</code>.</p>
              <p>Executed notebook <code>{dmrt3Taxonomy.source.repository.sourceFiles[1].path}</code> · {dmrt3Taxonomy.source.repository.sourceFiles[1].bytes.toLocaleString()} bytes · SHA-256 <code>{dmrt3Taxonomy.source.repository.sourceFiles[1].sha256}</code> · Git blob <code>{dmrt3Taxonomy.source.repository.sourceFiles[1].gitBlobSha1}</code>.</p>
              <p><strong>Methods-versus-execution conflict:</strong> {dmrt3Taxonomy.quarantinedConflicts[0].methodsDescription} {dmrt3Taxonomy.quarantinedConflicts[0].executedNotebookDescription}</p>
              <p>{dmrt3Taxonomy.source.repository.reuseBoundary}</p>
            </>}
            {selected.namespace === "roome-2026:GSE291462" && selectedRoome && <>
              <p><strong>Pinned source lineage:</strong> DOI <code>{roomeTaxonomy.source.publication.doi}</code> · PMC <code>{roomeTaxonomy.source.publication.pmcid}</code> · GEO <code>{roomeTaxonomy.source.geo.superSeries}</code>.</p>
              <p>Table S6 <code>{roomeTaxonomy.source.tables[0].fileName}</code> · {roomeTaxonomy.source.tables[0].bytes.toLocaleString()} bytes · SHA-256 <code>{roomeTaxonomy.source.tables[0].sha256}</code>.</p>
              <p>Table S7 <code>{roomeTaxonomy.source.tables[1].fileName}</code> · {roomeTaxonomy.source.tables[1].bytes.toLocaleString()} bytes · SHA-256 <code>{roomeTaxonomy.source.tables[1].sha256}</code>.</p>
              <p><strong>Selected row receipts:</strong> {selectedRoome.sourceLocators.join(" · ")}</p>
              <p><strong>Full differential evidence:</strong> {roomeTaxonomy.derivation.sourceRowCount.toLocaleString()} source rows · {roomeTaxonomy.derivation.retainedTextGeneRowCount.toLocaleString()} text-gene rows · {roomeTaxonomy.derivation.quarantinedGeneCellCount} quarantined cells · SHA-256 <code>{roomeTaxonomy.derivation.fullFeatureEvidenceSha256}</code>.</p>
              <p>{roomeTaxonomy.signatureMethod.interpretationBoundary}</p>
              <p>{roomeTaxonomy.source.geo.packagePolicy}</p>
            </>}
            {selected.namespace === "delile-2019:E-MTAB-7320" && selectedDelile && <>
              <p><strong>Pinned source lineage:</strong> DOI <code>{delileTaxonomy.source.publication.doi}</code> · BioStudies/ArrayExpress <code>{delileTaxonomy.source.biostudies.accession}</code> · authors&apos; commit <code>{delileTaxonomy.source.repository.pinnedCommit}</code>.</p>
              <p>Annotation object <code>{delileTaxonomy.source.annotatedMetadataObject.repositoryPath}</code> · {delileTaxonomy.source.annotatedMetadataObject.bytes.toLocaleString()} bytes · SHA-256 <code>{delileTaxonomy.source.annotatedMetadataObject.sha256}</code> · {delileTaxonomy.source.annotatedMetadataObject.rowCount.toLocaleString()} rows × {delileTaxonomy.source.annotatedMetadataObject.columnCount} columns.</p>
              <p><strong>Selected subtype locators:</strong> {selectedDelile.sourceLocators.join(" · ")}</p>
              <p><strong>Embryonic scope:</strong> {delileTaxonomy.scope.lifeStages.join(" · ")} · {delileTaxonomy.scope.sampledRegions.join(" · ")} · {delileTaxonomy.scope.sourceStageReplicateLabelCount} stage-replicate labels · biological animal count not resolved.</p>
              <p>Source table bundled: {String(delileTaxonomy.source.annotatedMetadataObject.sourceFileBundled)} · compact factual derivative bundled: {String(delileTaxonomy.source.repository.derivedFactualContractBundled)} · license: {delileTaxonomy.source.repository.license}.</p>
              <p>{delileTaxonomy.source.repository.reuseBoundary}</p>
              <p>{delileTaxonomy.joinPolicy.boundary}</p>
            </>}
            {selected.namespace === "crozat-2025:figshare-29430869-v2" && <>
              <p><strong>Figshare version receipt:</strong> article {crozatProfileContract.source.figshare.articleId} version {crozatProfileContract.source.figshare.version} · {crozatProfileContract.source.figshare.fileCount} files · {crozatProfileContract.source.figshare.totalBytes.toLocaleString()} bytes · {crozatProfileContract.source.figshare.license.name}.</p>
              <p><strong>Pinned evidence objects:</strong> {crozatProfileContract.source.figshare.keyFiles.map((file) => `${file.fileName} (${file.bytes.toLocaleString()} bytes; ${file.publisherMd5})`).join(" · ")}</p>
              <p><strong>Quarantined source conflicts:</strong> {crozatProfileContract.quarantinedConflicts.map((item) => `${prettify(item.id)} — ${item.detail}`).join(" · ")}</p>
              <p>{crozatProfileContract.source.figshare.sourceFileBoundary}</p>
              <p>{crozatProfileContract.joinPolicy.withinExperimentFamilyPairing}</p>
            </>}
            {selected.namespace === "cano-gomez-2026:GSE318731" && selectedCanoGomez && <>
              <p><strong>Pinned source lineage:</strong> GEO <code>{canoGomezRegistry.datasetId}</code> · DOI <code>{canoGomezRegistry.sourceReferences.publication.doi}</code> · registry <code>{canoGomezRegistry.releaseId}</code>.</p>
              <p><strong>Selected roster locator:</strong> <code>{selectedCanoGomez.rosterLink.artifactFileName}</code> · <code>{selectedCanoGomez.rosterLink.filterField}={selectedCanoGomez.rosterLink.filterEquals}</code> · ID field <code>{selectedCanoGomez.rosterLink.idField}</code>.</p>
              <p><strong>Source RDS receipt:</strong> {selectedCanoGomez.sourceFileName} · {canoGomezRegistry.sourceObjects.find((source) => source.objectId === selectedCanoGomez.sourceObjectId)?.sourceRdsBytes.toLocaleString("en-US")} bytes · SHA-256 <code>{canoGomezRegistry.sourceObjects.find((source) => source.objectId === selectedCanoGomez.sourceObjectId)?.sourceRdsSha256}</code>.</p>
              <p><strong>Bundled exact roster receipt:</strong> {canoGomezRegistry.artifacts.find((artifact) => artifact.artifactKind === "confirmed_interneuron_nucleus_roster")?.rowCount.toLocaleString("en-US")} rows · SHA-256 <code>{canoGomezRegistry.artifacts.find((artifact) => artifact.artifactKind === "confirmed_interneuron_nucleus_roster")?.compressedSha256}</code>.</p>
              <p>{canoGomezRegistry.metadataFieldCoverage.boundary}</p>
              <p>{canoGomezRegistry.sourceReferences.publication.rightsBoundary}</p>
            </>}
          </details>
          <div className="type-source-links">
            <a href={selected.articleUrl} target="_blank" rel="noreferrer">Primary article ↗</a>
            <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Public source record · {selected.sourceAccession} ↗</a>
          </div>
        </article>
      </div>

      <section className="type-comparison" aria-labelledby="type-comparison-heading">
        <div><span>STRUCTURED COMPARISON · NO POOLING</span><h4 id="type-comparison-heading">Compare 2–4 source records</h4><p>Shared rows support inspection only. Counts, labels and markers remain source-local.</p></div>
        <div className="type-comparison-picks">
          {comparison.map((profile) => <button type="button" key={profile.id} onClick={() => toggleComparison(profile.id)}><span>{profile.namespace}</span><strong>{profile.sourceLabel}</strong><em>Remove</em></button>)}
          {comparison.length < 2 && <p>Select at least two profiles from their dossiers. Up to four records can be compared.</p>}
        </div>
        {comparison.length >= 2 && <div
          className="type-comparison-table-wrap"
          role="region"
          aria-label="Scrollable type comparison"
          // Keyboard focus is intentional: the wide comparison can be scrolled without a pointer.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
        >
          <table className="type-comparison-table">
            <thead><tr><th scope="col">Dimension</th>{comparison.map((profile) => <th scope="col" key={profile.id}>{profile.sourceLabel}<small>{profile.namespace}</small></th>)}</tr></thead>
            <tbody>{COMPARISON_ROWS.map(([label, read]) => <tr key={label}><th scope="row">{label}</th>{comparison.map((profile) => <td key={profile.id}>{read(profile)}</td>)}</tr>)}</tbody>
          </table>
        </div>}
      </section>

      <details className="type-global-boundaries">
        <summary>Global scientific boundaries</summary>
        <ul>
          {russHarmonizedTaxonomyCrosswalk.hardBoundaries.map((boundary) => <li key={`russ-${boundary}`}>{boundary}</li>)}
          {sathyTaxonomy.hardBoundaries.map((boundary) => <li key={`sathy-${boundary}`}>{boundary}</li>)}
          {hayashiTaxonomy.hardBoundaries.map((boundary) => <li key={`hayashi-${boundary}`}>{boundary}</li>)}
          {haringTaxonomy.hardBoundaries.map((boundary) => <li key={`haring-${boundary}`}>{boundary}</li>)}
          {alkaslasiTaxonomy.hardBoundaries.map((boundary) => <li key={`alkaslasi-${boundary}`}>{boundary}</li>)}
          {dmrt3Taxonomy.hardBoundaries.map((boundary) => <li key={`dmrt3-${boundary}`}>{boundary}</li>)}
          {roomeTaxonomy.hardBoundaries.map((boundary) => <li key={`roome-${boundary}`}>{boundary}</li>)}
          {crozatProfileContract.hardBoundaries.map((boundary) => <li key={`crozat-${boundary}`}>{boundary}</li>)}
          {canoGomezRegistry.hardBoundaries.map((boundary) => <li key={`cano-gomez-${boundary}`}>{boundary}</li>)}
        </ul>
      </details>
    </section>
  );
}
