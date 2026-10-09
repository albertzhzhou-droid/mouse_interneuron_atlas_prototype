#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "data/census-child-observed-morphology-route-0.1.json");
const INPUTS = Object.freeze({
  censusIndex: "public/data/neuromorpho_release_8_6_124_census_v1/census-index.json",
  assetManifest: "public/data/neuromorpho_release_8_6_124_census_v1/asset-manifest.json",
  dorsalHornBaseRoutePack: "data/dorsal-horn-observed-morphology-route-pack-0.1.json",
  apiSnapshot: "data/source-candidates/neuromorpho-native-detail-20260922/nmo-108978.api.json",
  originalDat: "data/source-candidates/neuromorpho-native-detail-20260922/nmo-108978.original.dat",
  nativeDetailCatalog: "data/neurolucida-native-contour-admission-catalog-0.4.json",
  nativeContourGeometry: "public/data/neurolucida_native_detail_v1/nmo-108978-soma-line-loops.json",
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readBytes = (relativePath) => readFile(path.join(ROOT, relativePath));
const readJson = async (relativePath) => JSON.parse((await readBytes(relativePath)).toString("utf8"));

function projectPath(relativePath) {
  return relativePath.startsWith("public/data/") ? `/data/${relativePath.slice("public/data/".length)}` : relativePath;
}

async function receipt(relativePath, role, extras = {}) {
  const bytes = await readBytes(relativePath);
  return { path: projectPath(relativePath), bytes: bytes.byteLength, sha256: sha256(bytes), role, ...extras };
}

export async function buildCensusChildObservedMorphologyRoute01() {
  const [census, assetManifest, dorsalHornBaseRoutePack, api, nativeCatalog, nativeContourGeometry] = await Promise.all([
    readJson(INPUTS.censusIndex),
    readJson(INPUTS.assetManifest),
    readJson(INPUTS.dorsalHornBaseRoutePack),
    readJson(INPUTS.apiSnapshot),
    readJson(INPUTS.nativeDetailCatalog),
    readJson(INPUTS.nativeContourGeometry),
  ]);
  const record = census.records.find((candidate) => candidate.neuronId === 108978);
  const admittedContour = nativeCatalog.addedRecords.find((candidate) => candidate.neuronId === 108978);
  if (!record || api.neuron_id !== 108978 || api.neuron_name !== "cell-4_16" || !admittedContour) {
    throw new Error("The pinned NMO 108978 census row, official API snapshot and native contour admission must all exist");
  }
  if (record.assetId !== "NeuroMorpho:108978"
    || record.normalizedMetadata.domain !== "Dendrites, Soma, No Axon"
    || record.normalizedMetadata.sourceDiameterAvailable !== true
    || record.morphometrics.computed.nodeCount !== 1817
    || record.morphometrics.computed.segmentCount !== 1816) {
    throw new Error("NMO 108978 census morphology authority changed");
  }
  const assetEntries = assetManifest.files.filter((candidate) => candidate.neuronId === 108978);
  if (assetEntries.length !== 2
    || !assetEntries.some((entry) => entry.kind === "lazy_geometry" && entry.sha256 === record.geometry.sha256 && entry.bytes === record.geometry.bytes)
    || !assetEntries.some((entry) => entry.kind === "standardized_swc" && entry.sha256 === record.geometry.rawSwcSha256)) {
    throw new Error("NMO 108978 census asset-manifest identity or SWC/geometry receipts changed");
  }
  if (admittedContour.admission.admittedContourObjectCount !== 12
    || admittedContour.admission.admittedVertexCount !== 2614
    || admittedContour.derivedObject.sha256 !== sha256(await readBytes(INPUTS.nativeContourGeometry))) {
    throw new Error("NMO 108978 native-contour admission or exact geometry receipt changed");
  }
  if (nativeContourGeometry.assetId !== "NeuroMorpho:108978"
    || nativeContourGeometry.sourceFrame !== "Neurolucida_DAT_source_native_unregistered"
    || nativeContourGeometry.summary.registrationCount !== 0
    || nativeContourGeometry.summary.standardizedSwcOverlayCount !== 0) {
    throw new Error("NMO 108978 native contour source-frame boundary changed");
  }

  const geometry = record.morphometrics.computed;
  const radius = geometry.radiusDerived.value;
  const apiReceipt = await receipt(INPUTS.apiSnapshot, "official_api_snapshot");
  const datReceipt = await receipt(INPUTS.originalDat, "source_native_neurolucida_dat_receipt_only");
  const nativeContourReceipt = await receipt(INPUTS.nativeContourGeometry, "source_native_mbf_cell_body_line_loop", {
    canonicalGeometrySha256: admittedContour.audit.somaNamedPointPayloadSha256,
  });
  const baseRoutePackReceipt = await receipt(INPUTS.dorsalHornBaseRoutePack, "immutable_dorsal_horn_route_pack_parent");
  const censusReceipt = await receipt(INPUTS.censusIndex, "pinned_full_census_index");
  const manifestReceipt = await receipt(INPUTS.assetManifest, "pinned_full_census_asset_manifest");
  const geometryReceipt = await receipt(`public/data/neuromorpho_release_8_6_124_census_v1/${record.geometry.path}`, "source_local_lazy_geometry", {
    canonicalGeometrySha256: geometry.canonicalGeometrySha256,
    topologySha256: geometry.topologySha256,
  });
  const swcReceipt = await receipt(`public/data/neuromorpho_release_8_6_124_census_v1/${record.geometry.rawSwcPath}`, "standardized_source_local_swc");
  const sourceFrame = record.normalizedMetadata.sourceFrame;
  const sourceDomain = api.domain;
  const paperDoi = api.reference_doi[0];
  const missingInternalEvidence = ["membrane_segmentation", "nucleus", "organelles", "synaptic_boutons", "receptor_distribution", "ultrastructure"];
  const route = {
    routeId: "mouse.sc.tac1_sp_dorsal_horn.observed.nmo_108978",
    title: "Tac1Cre / Brainbow SP-class excitatory interneuron — cell-4_16",
    authority: "OBS_STANDARDIZED_SOURCE_LOCAL",
    sourceAuthority: "NEUROMORPHO_RELEASE_8_6_124_CENSUS_CHILD",
    censusMembership: true,
    frozenLensMembership: false,
    sourceRecord: {
      repository: "NeuroMorpho.Org",
      repositoryRelease: "8.6.124",
      repositoryRrid: "RRID:SCR_002145",
      neuronId: 108978,
      assetId: record.assetId,
      neuronName: api.neuron_name,
      archive: api.archive,
      species: api.species,
      lifeStage: api.age_classification,
      sex: api.gender,
      strain: api.strain,
      regionLabels: api.brain_region,
      cellTypeLabels: api.cell_type,
      condition: api.experiment_condition,
      protocol: api.protocol,
      slicingDirection: api.slicing_direction,
      slicingThicknessMicrometre: Number(api.slicing_thickness),
      reconstructionSoftware: api.reconstruction_software,
      stain: api.stain,
      domain: api.domain,
      physicalIntegrity: api.physical_Integrity,
      sourceAttributes: api.attributes,
      sourcePaperDoi: paperDoi,
      sourcePaperPmid: api.reference_pmid[0],
      numericAge: { value: null, unit: null, missingReason: "official_repository_metadata_reports_Not Reported" },
    },
    sourceObjects: {
      censusIndex: censusReceipt,
      censusAssetManifest: manifestReceipt,
      officialApiSnapshot: apiReceipt,
      geometry: geometryReceipt,
      swc: swcReceipt,
      originalDat: datReceipt,
      nativeContourGeometry: nativeContourReceipt,
    },
    observedCellFormRecord: {
      neuronId: 108978,
      assetId: record.assetId,
      phenotype: "Substance P-expressing excitatory interneuron",
      transmitter: "excitatory",
      domain: sourceDomain,
      physicalIntegrity: api.physical_Integrity,
      sourcePaperDoi: paperDoi,
      segmentCount: geometry.segmentCount,
      geometryStatus: "OBS",
      sourceFrame,
      registrationStatus: "unregistered",
    },
    fidelityRecord: {
      neuronId: 108978,
      assetId: record.assetId,
      geometry: {
        path: geometryReceipt.path,
        bytes: geometryReceipt.bytes,
        sha256: geometryReceipt.sha256,
        rawSwcSha256: swcReceipt.sha256,
        geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL",
        sourceFrame,
        dimensionality: "3D",
        sourceDiameterAvailable: true,
        nodeCount: geometry.nodeCount,
        segmentCount: geometry.segmentCount,
      },
      axon: { sourceType2NodeCount: geometry.nodeTypeCounts["2"] ?? 0, sourceDomain, completeAxon: false },
      radiusEvidence: {
        status: "OBSERVED_SOURCE_RADIUS",
        minimumMicrometre: radius.minimumMicrometre,
        maximumMicrometre: radius.maximumMicrometre,
        meanMicrometre: radius.meanMicrometre,
        missingReason: null,
      },
      modes: {
        observedSwc: { available: true, authority: "OBS_STANDARDIZED_SOURCE_LOCAL" },
        radiusSurface: { available: true, authority: "DERIVED_FROM_OBSERVED_RADIUS", missingReason: null },
        internalStructure: { available: false, authority: "UNAVAILABLE", missingEvidence: missingInternalEvidence },
      },
    },
    geometryReceipt: {
      dimensionality: "3D",
      sourceFrame,
      registrationStatus: "unregistered",
      nodeCount: geometry.nodeCount,
      segmentCount: geometry.segmentCount,
      nodeTypeCounts: geometry.nodeTypeCounts,
      boundsMicrometre: geometry.boundsMicrometre,
      extentMicrometre: geometry.extentMicrometre,
      canonicalGeometrySha256: geometry.canonicalGeometrySha256,
      topologySha256: geometry.topologySha256,
      sourceDiameterAvailable: true,
    },
    repositoryReportedMorphometry: record.morphometrics.sourceReported,
    somaContourReceipt: {
      evidenceSource: "standardized_swc_header_and_checksum_pinned_source_native_dat",
      originalContourCount: admittedContour.audit.exactSourceContourObjectCount,
      standardizedSomaPointCount: geometry.nodeTypeCounts["1"],
      nativeContourVerticesAvailable: true,
      nativeContourLoopCount: admittedContour.admission.admittedContourObjectCount,
      nativeContourVertexCount: admittedContour.admission.admittedVertexCount,
      nativeContourGeometrySha256: nativeContourReceipt.sha256,
      correspondenceToStandardizedSomaPoints: "not_established",
      coordinateTransformToStandardizedSwcStatus: "not_established",
      overlayWithStandardizedSwcAllowed: false,
      membraneClaim: false,
    },
    nativeDatContract: {
      parsed: true,
      rendered: true,
      sourceDatBytes: admittedContour.source.bytes,
      sourceDatSha256: admittedContour.source.sha256,
      contourName: "Cell Body",
      independentParserClassification: "somaContour",
      semanticObjectCountAdmitted: admittedContour.admission.admittedContourObjectCount,
      orderedVertexCount: admittedContour.admission.admittedVertexCount,
      rawSourceClosedFlag: false,
      interpretedLineClosureAuthority: "file_specific_MBF_Cell_Body_semantics",
      sourceFrame: "Neurolucida_DAT_source_native_unregistered",
      coordinateTransformToStandardizedSwcStatus: "not_established",
      overlayWithStandardizedSwcAllowed: false,
    },
    renderingContract: {
      observedSwc: { available: true, authority: "OBS_STANDARDIZED_SOURCE_LOCAL", representationStateId: "OBS_SKELETON" },
      radiusSurface: { available: true, authority: "DERIVED_FROM_OBSERVED_RADIUS", representationStateId: "DER_RADIUS_SURFACE", membraneClaim: false, measurementUse: "forbidden", missingReason: null },
      nativeSomaContours: {
        available: true,
        authority: "OBS_SOURCE_NATIVE_MBF_CELL_BODY_LINE_LOOP",
        representationStateId: "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP",
        sourceFrame: "Neurolucida_DAT_source_native_unregistered",
        lineLoopCount: admittedContour.admission.admittedContourObjectCount,
        vertexCount: admittedContour.admission.admittedVertexCount,
        overlayWithStandardizedSwcAllowed: false,
        membraneClaim: false,
        measurementUse: "forbidden",
      },
      sameSpecimenInternalStructure: { available: false, authority: "UNAVAILABLE", representationStateId: "UNAVAILABLE", renderedPrimitiveCount: 0, missingEvidence: missingInternalEvidence },
    },
    identityBoundary: {
      markerIdentityBasis: "official_repository_cell_class_labels_and_Tac1_IRES2_Cre_D_line",
      individualMolecularAssayClaim: false,
      selectedSciEntityRelationship: "none",
      molecularProfileRelationship: "none",
      otherMorphologyRelationship: "independent_record",
      crossSourceIdentityCount: 0,
      projectRegistrationCount: 0,
      coDisplayCreatesRelationship: false,
    },
    sourceLinks: {
      officialRecord: "https://neuromorpho.org/neuron_info.jsp?neuron_name=cell-4_16",
      officialApi: "https://neuromorpho.org/api/neuron/id/108978",
      standardizedSwc: "https://neuromorpho.org/dableFiles/todd/CNG%20version/cell-4_16.CNG.swc",
      originalDat: admittedContour.source.originalDatUrl,
      primaryPaper: `https://doi.org/${paperDoi}`,
      rights: admittedContour.source.rightsUrl,
    },
    hardBoundaries: [
      "NMO 108978 is already one of the 142 pinned adult-query census records; activating this source-local route adds no census row or census denominator.",
      "The deposited class labels are Substance P-expressing and excitatory. They do not establish a same-cell molecular assay or a cross-source subtype identity.",
      "The 12 native Cell Body traces and 12 standardized type-1 soma points are independently reported representations; their equal count establishes no one-to-one vertex correspondence or coordinate transform.",
      "Source-native Neurolucida DAT contours remain in the original file frame; the standardized SWC frame is separately rendered with no overlay or registration.",
      "Dendrites Complete is the repository's domain-specific integrity label. No axon is reconstructed, which is not evidence that the biological cell lacked an axon.",
      "No same-specimen membrane segmentation, nucleus, organelles, boutons, receptor map, or ultrastructure is available; render zero internal primitives.",
      "The linked study's cohort-level radial-cell interpretation is not promoted to an exact NMO 108978 morphology subclass or physiology join.",
    ],
  };

  const dorsalHornRouteMembers = [
    ...dorsalHornBaseRoutePack.routes.map((baseRoute) => ({
      routeId: baseRoute.routeId,
      assetId: baseRoute.sourceRecord.assetId,
      censusMembership: baseRoute.censusMembership,
      frozenLensMembership: baseRoute.censusMembership,
    })),
    {
      routeId: route.routeId,
      assetId: route.sourceRecord.assetId,
      censusMembership: true,
      frozenLensMembership: false,
    },
  ];
  const contract = {
    schemaVersion: "0.1.0",
    contractId: "census-child-observed-morphology-route-0.1",
    releaseId: "ohri-census-child-observed-morphology-route-0.1.0",
    releasedAt: "2026-09-23",
    purpose: "Admit NMO 108978 as one additional selectable source-local morphology route from the already pinned 142-record adult NeuroMorpho census. Preserve separate standardized-SWC and source-native DAT frames, expose the exact 12 source-native soma traces, and keep the underlying census denominator unchanged.",
    runtimeMergePolicy: {
      censusRecordCount: census.summary.queryRecordCount,
      censusContribution: 0,
      frozenLensOverlap: false,
      selectedCensusChildRouteCount: 1,
      additionalMainSceneMorphologyCount: 1,
      censusExpansionCount: 0,
      crossSourceIdentityCount: 0,
      projectRegistrationCount: 0,
    },
    dorsalHornRouteSet: {
      parentRoutePack: baseRoutePackReceipt,
      routeCount: dorsalHornRouteMembers.length,
      censusRecordCount: census.summary.queryRecordCount,
      censusMemberCount: dorsalHornRouteMembers.filter((member) => member.censusMembership).length,
      frozenLensOverlapCount: dorsalHornRouteMembers.filter((member) => member.frozenLensMembership).length,
      supplementaryRecordCount: dorsalHornRouteMembers.filter((member) => !member.censusMembership).length,
      censusExpansionCount: 0,
      members: dorsalHornRouteMembers,
    },
    summary: {
      routeCount: 1,
      observedSwcNodeCount: geometry.nodeCount,
      observedSwcSegmentCount: geometry.segmentCount,
      sourceDiameterAvailable: true,
      nativeSomaLineLoopCount: admittedContour.admission.admittedContourObjectCount,
      nativeSomaLineLoopVertexCount: admittedContour.admission.admittedVertexCount,
      sameSpecimenInternalStructureCount: 0,
      renderedInternalPrimitiveCount: 0,
      censusExpansionCount: 0,
      crossSourceIdentityCount: 0,
      projectRegistrationCount: 0,
    },
    route,
    contractBoundaries: [
      "This route adds an independently reconstructed morphology exemplar, not a new interneuron type, sample-count claim, or census row.",
      "The dorsal-horn route roster composes the four-record 0.1 parent with this one exact census-child route; the sets overlap and are not added to the 142-record census.",
      "Source-native line loops are not a soma membrane, filled polygon, volume, or internal segmentation.",
      "Repository-reported surface and volume values remain source-reported summaries; this project derives no mesh or biological measurement from them.",
    ],
  };
  return { contract, bytes: Buffer.from(`${JSON.stringify(contract, null, 2)}\n`) };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const arg of args) if (!new Set(["--write", "--check"]).has(arg)) throw new Error(`Unknown argument: ${arg}`);
  if (args.has("--write") && args.has("--check")) throw new Error("--write and --check are mutually exclusive");
  const built = await buildCensusChildObservedMorphologyRoute01();
  if (args.has("--write")) await writeFile(OUTPUT, built.bytes);
  if (args.has("--check") && !(await readFile(OUTPUT)).equals(built.bytes)) throw new Error("Census-child morphology route is stale; run the builder with --write");
  process.stdout.write(`${JSON.stringify({ releaseId: built.contract.releaseId, routeId: built.contract.route.routeId, routeCount: built.contract.summary.routeCount, nativeSomaLineLoopCount: built.contract.summary.nativeSomaLineLoopCount, nativeSomaLineLoopVertexCount: built.contract.summary.nativeSomaLineLoopVertexCount, censusExpansionCount: built.contract.summary.censusExpansionCount, wrote: args.has("--write"), checked: args.has("--check") })}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
