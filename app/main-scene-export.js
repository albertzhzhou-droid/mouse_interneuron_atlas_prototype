import { MAIN_SCENE_SOURCE_VIEW_BUILD, MAIN_SCENE_VIEW_NUMERIC_TOLERANCE, mainSceneViewEqual, appendMainScenePngReceipt } from "./main-scene-source-view.js";

function check(value, message) { if (!value) throw new Error(`Main scene export: ${message}`); }
export const MAIN_SCENE_CSV_FORMAT_VERSION = "1.0.0";

/** A separately typed metadata row also survives an empty scientific result set. */
export function createMainSceneCsvMetadataRow(headers, { releaseId, disclaimer, sourceView }) {
  const values = { record_kind: "viewport_metadata", export_format_version: MAIN_SCENE_CSV_FORMAT_VERSION,
    release_id: releaseId, scientific_disclaimer: disclaimer, main_scene_view_receipt_json: JSON.stringify(sourceView),
    main_scene_round_trip_contract_json: JSON.stringify(buildMainSceneRoundTripContract(sourceView)) };
  check(new Set(headers).size === headers.length && Object.keys(values).every(key => headers.includes(key)), "CSV metadata headers are incomplete or duplicated");
  return headers.map(header => values[header] ?? "");
}

/** Describes the existing importer and applied-view verifier, not pixel equality. */
export function buildMainSceneRoundTripContract(receipt) {
  const actual = receipt?.documentType === "main_scene_morphology_view_receipt";
  if (actual) {
    check(receipt.schemaVersion === "0.2.0" && mainSceneViewEqual(receipt.rendererBuild, MAIN_SCENE_SOURCE_VIEW_BUILD), "the actual view belongs to a different renderer build");
  } else {
    check(receipt?.status === "unavailable" && typeof receipt.reason === "string" && receipt.reason.length > 0
      && (receipt.currentNeuronId === null || Number.isSafeInteger(receipt.currentNeuronId) && receipt.currentNeuronId > 0), "an explicit current-source unavailable receipt is required");
  }
  return {
    schemaVersion: "1.0.0",
    equalityUnit: actual ? "persistent_state_and_main_scene_actual_view" : "persistent_state_only",
    excludedTopLevelFields: ["exportedAt"],
    regeneratedNonAuthoritativePaths: [
      "state.url", "morphologyFidelity.runtimeReceipt", "micronsObservedReference.runtimeReceipt",
      ...(actual ? ["mainSceneView.generatedAt", "mainSceneView.geometryVerification.verifiedAt",
        "mainSceneView.geometryVerification.verificationSequence", "mainSceneView.geometryVerification.mainSceneVerificationSequence",
        "mainSceneView.geometryVerification.requestCacheMode", "mainSceneView.auxiliaryAssets[*].verifiedAt",
        "mainSceneView.auxiliaryAssets[*].verificationSequence", "mainSceneView.auxiliaryAssets[*].requestCacheMode",
        "mainSceneView.view.runtimeBinding"] : []),
    ],
    persistentState: { path: "state", urlIsInformational: true,
      entityLayerNormalization: "Actual-view imports accept the saved requested or effective entity visibility; requested and effective layers remain separate in the view receipt." },
    actualView: actual ? {
      status: "fresh_verified_replay_required", receiptPath: "mainSceneView", receiptSchemaVersion: receipt.schemaVersion,
      authoritativePaths: ["mainSceneView.documentType", "mainSceneView.schemaVersion", "mainSceneView.applicationVersion",
        "mainSceneView.rendererBuild", "mainSceneView.source", "mainSceneView.sourceContext", "mainSceneView.scientificScope",
        "mainSceneView.geometryVerification", "mainSceneView.auxiliaryAssets[*]",
        "mainSceneView.view.request", "mainSceneView.view.camera", "mainSceneView.view.renderer",
        "mainSceneView.view.clipping", "mainSceneView.view.layers", "mainSceneView.view.sourceObject", "mainSceneView.view.inspection"],
      freshSourceCacheMode: "no-store", currentPageVerificationMustAdvance: true,
      appliedViewMustMatch: true, numericTolerance: { absolute: MAIN_SCENE_VIEW_NUMERIC_TOLERANCE, relative: MAIN_SCENE_VIEW_NUMERIC_TOLERANCE },
      adaptedToCurrentViewportPaths: ["mainSceneView.view.viewport", "mainSceneView.view.camera.aspect"],
      pixelEqualityAcrossViewportSizes: false,
    } : { status: "settings_only", receiptPath: "mainSceneView", currentNeuronId: receipt.currentNeuronId,
      reason: receipt.reason, cameraLayersClippingAndBranchReplay: false },
  };
}

/** Both export paths retain the same source-view keyword; extra metadata describes the raster. */
export function appendMainSceneExportPng(blob, receipt, { exportKind, requestedState, currentNeuronId }) {
  check(["rendered_main_scene", "accessible_fallback"].includes(exportKind), "unsupported PNG export kind");
  check(receipt?.documentType === "main_scene_morphology_view_receipt"
    ? exportKind === "rendered_main_scene" && receipt.source.neuronId === currentNeuronId
    : receipt?.status === "unavailable" && receipt.currentNeuronId === currentNeuronId, "PNG and current source disagree");
  check(requestedState && typeof requestedState === "object" && !Array.isArray(requestedState), "requested settings are unavailable");
  const roundTripContract = buildMainSceneRoundTripContract(receipt);
  const metadata = {
    documentType: "main_scene_png_export_receipt", schemaVersion: "0.1.0",
    applicationVersion: MAIN_SCENE_SOURCE_VIEW_BUILD.applicationVersion,
    rendererBuild: MAIN_SCENE_SOURCE_VIEW_BUILD, exportedAt: new Date().toISOString(),
    exportKind, currentNeuronId, sourceViewKeyword: "ohri-source-view",
    requestedState: structuredClone(requestedState), roundTripContract,
    captureAuthority: {
      raster: exportKind === "accessible_fallback" ? "accessible_text_snapshot_only" : "actual_main_scene_pixels_with_disclosure_footer",
      requestedSettingsAreActualGeometryProof: false,
      actualSourceViewAvailable: receipt.documentType === "main_scene_morphology_view_receipt",
      pixelEqualityAcrossViewportSizes: false, registrationCount: 0, crossSourceSameCellJoinCount: 0,
    },
  };
  return appendMainScenePngReceipt(blob, receipt, metadata);
}
