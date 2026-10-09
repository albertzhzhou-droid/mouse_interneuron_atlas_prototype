import disclosureJson from "../data/morphology-source-frame-disclosure-0.1.json";
import { assertMorphologyGeometrySourceFrame } from "./morphology-source-frame-runtime.js";
import type {
  MorphologyCensusRecord,
  MorphologyComparisonRecord,
  MorphologyGeometryPayload,
} from "./morphology-census-data";

export type MorphologySourceFrameDisclosure = {
  neuronId: number;
  assetId: string;
  membership: {
    collection: "census" | "supplementary";
    censusContribution: 0 | 1;
    supplementaryContribution: 0 | 1;
  };
  geometryReceipt: {
    path: string;
    bytes: number;
    sha256: string;
    rawSwcSha256: string;
    geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL";
  };
  sourceCoordinates: {
    unit: "micrometre_reported_by_source";
    sourceFrame: "NeuroMorpho_CNG_standardized_local_frame";
    boundsMicrometre: { min: [number, number, number]; max: [number, number, number] };
    extentMicrometre: [number, number, number];
    displayTransform: {
      kind: "soma_centered_uniform_scale";
      originMicrometre: [number, number, number];
      scaleViewerUnitPerMicrometre: number;
      use: "viewer_only";
    };
    viewportScaleAuthority: "camera_target_plane_source_local_only";
    sharedScaleAuthority: false;
    anatomicalOrientationAuthority: false;
    atlasRegistrationAuthority: false;
  };
  preparation: {
    species: string | string[];
    lifeStage: string;
    numericAge: {
      status: "reported" | "unavailable";
      minimum: number | null;
      maximum: number | null;
      scale: string | null;
    };
    regionLabels: string[];
    dimensionality: "2D" | "3D";
    protocol: string | null;
    slicingDirectionRaw: string | null;
    slicingThicknessMicrometre: number | null;
    sourceSectionWording: string;
    shrinkage: {
      status: "not_reported" | "reported_not_corrected" | "reported_correction_status_unresolved" | "source_text_unresolved";
      reportedRaw: string | null;
      correctedRaw: string | null;
      reportedValue: number | null;
      reportedXY: number | null;
      reportedZ: number | null;
      correctedValue: number | null;
      correctedXY: number | null;
      correctedZ: number | null;
      restoredInVivoDimensions: false;
    };
    paperPreparationContext: string | null;
    preparationContextJoinStatus: string;
    unresolvedPreparationConflict: string | null;
  };
  truncation: {
    sourceDomainVerbatim: string;
    sourcePhysicalIntegrityVerbatim: string;
    axonField: "reconstructed_source_field" | "not_reconstructed";
    moderateOrIncompleteSourceLabel: boolean;
    completeNamedDomainSourceLabel: boolean;
    wholeBiologicalAxonClaim: false;
    cutNeuriteRepairApplied: false;
    missingCoordinateInferenceApplied: false;
    biologicalAbsenceInferredFromMissingReconstruction: false;
  };
};

type MorphologySourceFrameDisclosureContract = {
  documentType: "morphology_source_frame_and_preparation_disclosure_contract";
  schemaVersion: "0.1.0";
  contractId: "morphology-source-frame-disclosure-0.1";
  releaseId: string;
  displayScalePolicy: {
    algorithmId: "camera_target_plane_source_local_scale_v1";
    sourceCoordinateUnit: "micrometre_reported_by_source";
    measurementPlane: "camera_target_depth";
    targetPixelLength: number;
    sourceLocalOnly: true;
    sharedAcrossViewports: false;
    apparentObjectSizeComparable: false;
  };
  summary: {
    frozenCensusRecordCount: number;
    supplementaryRecordCount: number;
    viewableSourceObjectCount: number;
    geometry2DCount: number;
    geometry3DCount: number;
    commonScaleAdmissionCount: number;
    inferredMissingCoordinateCount: number;
    repairedCutNeuriteCount: number;
    restoredInVivoDimensionCount: number;
    registrationCount: number;
  };
  scientificBoundary: Record<string, boolean | number>;
  records: MorphologySourceFrameDisclosure[];
  contractContentSha256: string;
};

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Morphology source-frame disclosure: ${message}`);
}

const contract = disclosureJson as unknown as MorphologySourceFrameDisclosureContract;
invariant(contract.documentType === "morphology_source_frame_and_preparation_disclosure_contract", "document identity drifted");
invariant(contract.schemaVersion === "0.1.0" && contract.contractId === "morphology-source-frame-disclosure-0.1", "contract version drifted");
invariant(contract.records.length === 149, "record denominator must remain 149");
invariant(new Set(contract.records.map((record) => record.neuronId)).size === 149, "record IDs must remain unique");
invariant(
  contract.summary.frozenCensusRecordCount === 142 &&
    contract.summary.supplementaryRecordCount === 7 &&
    contract.summary.viewableSourceObjectCount === 149 &&
    contract.summary.geometry2DCount === 2 &&
    contract.summary.geometry3DCount === 147,
  "142 + 7 membership or dimensionality denominator drifted",
);
invariant(
  contract.displayScalePolicy.algorithmId === "camera_target_plane_source_local_scale_v1" &&
    contract.displayScalePolicy.sourceCoordinateUnit === "micrometre_reported_by_source" &&
    contract.displayScalePolicy.measurementPlane === "camera_target_depth" &&
    contract.displayScalePolicy.sourceLocalOnly === true &&
    contract.displayScalePolicy.sharedAcrossViewports === false &&
    contract.displayScalePolicy.apparentObjectSizeComparable === false,
  "display scale gained shared or cross-object authority",
);
invariant(
  contract.summary.commonScaleAdmissionCount === 0 &&
    contract.summary.inferredMissingCoordinateCount === 0 &&
    contract.summary.repairedCutNeuriteCount === 0 &&
    contract.summary.restoredInVivoDimensionCount === 0 &&
    contract.summary.registrationCount === 0,
  "unsupported scale, coordinate, repair, restoration or registration claims were admitted",
);
invariant(/^[a-f0-9]{64}$/.test(contract.contractContentSha256), "content receipt is invalid");

const disclosureByNeuronId = new Map(contract.records.map((record) => [record.neuronId, record]));

export const MORPHOLOGY_SOURCE_FRAME_DISCLOSURE_CONTRACT = contract;
export const MORPHOLOGY_SOURCE_FRAME_DISCLOSURE_AUTHORITY = Object.freeze({
  path: "data/morphology-source-frame-disclosure-0.1.json",
  contractId: contract.contractId,
  releaseId: contract.releaseId,
  schemaVersion: contract.schemaVersion,
  contentSha256: contract.contractContentSha256,
  recordCount: contract.records.length,
});

export function morphologySourceFrameDisclosureFor(record: MorphologyCensusRecord | MorphologyComparisonRecord) {
  const disclosure = disclosureByNeuronId.get(record.neuronId);
  invariant(disclosure, `NMO ${record.neuronId} is outside the admitted 149-object roster`);
  invariant(disclosure.assetId === record.assetId, `NMO ${record.neuronId} asset identity drifted`);
  const membership = "comparisonMembership" in record
    ? record.comparisonMembership
    : { collection: "census", censusContribution: 1, supplementaryContribution: 0 } as const;
  invariant(
    disclosure.membership.collection === membership.collection &&
      disclosure.membership.censusContribution === membership.censusContribution &&
      disclosure.membership.supplementaryContribution === membership.supplementaryContribution,
    `NMO ${record.neuronId} membership drifted`,
  );
  invariant(
    disclosure.geometryReceipt.path === record.geometry.path &&
      disclosure.geometryReceipt.bytes === record.geometry.bytes &&
      disclosure.geometryReceipt.sha256 === record.geometry.sha256 &&
      disclosure.geometryReceipt.rawSwcSha256 === record.geometry.rawSwcSha256,
    `NMO ${record.neuronId} geometry authority receipt drifted`,
  );
  invariant(disclosure.preparation.dimensionality === record.normalizedMetadata.dimensionality, `NMO ${record.neuronId} dimensionality drifted`);
  invariant(disclosure.sourceCoordinates.sourceFrame === record.normalizedMetadata.sourceFrame, `NMO ${record.neuronId} source frame drifted`);
  return disclosure;
}

export function assertGeometryMatchesSourceFrameDisclosure(
  disclosure: MorphologySourceFrameDisclosure,
  geometry: MorphologyGeometryPayload,
) {
  return assertMorphologyGeometrySourceFrame(disclosure, geometry);
}
