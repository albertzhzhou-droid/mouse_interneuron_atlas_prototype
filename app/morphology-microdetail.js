export const MORPHOLOGY_MICRODETAIL_AXIS_ORDER = [
  "centerline_topology",
  "neurite_type_annotations",
  "axon_field",
  "diameter_input",
  "radius_derived_surface",
  "soma_contour",
  "plasma_membrane",
  "nucleus",
  "organelles",
  "synaptic_boutons",
  "receptor_distribution",
  "synaptic_partners",
  "atlas_placement",
];

export const MORPHOLOGY_MICRODETAIL_INTERNAL_AXIS_IDS = [
  "soma_contour",
  "plasma_membrane",
  "nucleus",
  "organelles",
  "synaptic_boutons",
  "receptor_distribution",
  "synaptic_partners",
];

const AXIS_LABELS = {
  centerline_topology: "Centreline topology",
  neurite_type_annotations: "SWC neurite types",
  axon_field: "Axon field",
  diameter_input: "Diameter / radius input",
  radius_derived_surface: "Radius-derived display surface",
  soma_contour: "Soma contour",
  plasma_membrane: "Plasma membrane",
  nucleus: "Nucleus",
  organelles: "Organelles",
  synaptic_boutons: "Synaptic boutons",
  receptor_distribution: "Receptor distribution",
  synaptic_partners: "Synaptic partners",
  atlas_placement: "Atlas placement",
};

const SHA256 = /^(?!0{64}$)[a-f0-9]{64}$/;
const INTERNAL_CONTRACT_LOCATOR = "data/morphology-matrix-contract-0.1.json#internalDetailGate";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function attributeTokens(record) {
  return String(record.normalizedMetadata?.attributes ?? "").split(",").map((value) => value.trim()).filter(Boolean);
}

function hasPositiveRadiusReceipt(value) {
  return value && [value.minimumMicrometre, value.maximumMicrometre, value.meanMicrometre]
    .every((candidate) => Number.isFinite(Number(candidate)) && Number(candidate) > 0);
}

function topologyReceiptIsAdmitted(record) {
  const computed = record.morphometrics?.computed ?? {};
  return record.geometry?.available === true
    && typeof record.geometry.path === "string"
    && record.geometry.path.length > 0
    && Number.isInteger(record.geometry.bytes)
    && record.geometry.bytes > 0
    && SHA256.test(record.geometry.sha256 ?? "")
    && SHA256.test(record.geometry.rawSwcSha256 ?? "")
    && record.geometry.rawSwcSha256 === computed.rawSwcSha256
    && SHA256.test(computed.canonicalGeometrySha256 ?? "")
    && SHA256.test(computed.topologySha256 ?? "")
    && record.qc?.status === "passed"
    && Number.isInteger(computed.nodeCount)
    && computed.nodeCount > 0
    && Number.isInteger(computed.segmentCount)
    && computed.segmentCount > 0;
}

function unavailable(id, basis, sourceField, sourceLocator = INTERNAL_CONTRACT_LOCATOR, limitation = "No primitive or biological assertion is generated.") {
  return {
    id,
    label: AXIS_LABELS[id],
    status: "UNAVAILABLE",
    authority: "NONE",
    sourceField,
    sourceLocator,
    basis,
    limitation,
  };
}

function observed(id, basis, limitation, sourceField, sourceLocator) {
  return {
    id,
    label: AXIS_LABELS[id],
    status: "OBS",
    authority: "OBS_STANDARDIZED_SOURCE_LOCAL",
    sourceField,
    sourceLocator,
    basis,
    limitation,
  };
}

export function buildMorphologyMicrodetailCoverage(record) {
  assert(record && Number.isInteger(record.neuronId), "Morphology record is required");
  const officialRecordUrl = `https://neuromorpho.org/api/neuron/id/${record.neuronId}`;
  const geometryLocator = record.geometry?.path ?? officialRecordUrl;
  const computed = record.morphometrics?.computed ?? {};
  const nodeTypeCounts = computed.nodeTypeCounts ?? {};
  const topologyAdmitted = topologyReceiptIsAdmitted(record);
  const conflicts = [];
  if (!topologyAdmitted) conflicts.push("topology_receipt_or_qc_not_admitted");

  const axonNodeCount = Number(nodeTypeCounts["2"] ?? 0);
  const domainTokens = String(record.normalizedMetadata?.domain ?? "").split(",").map((value) => value.trim());
  const domainReportsAxon = domainTokens.includes("Axon");
  const axonReceiptConsistent = topologyAdmitted && domainReportsAxon === (axonNodeCount > 0);
  if (topologyAdmitted && !axonReceiptConsistent) conflicts.push("axon_domain_and_source_type_conflict");

  const tokens = attributeTokens(record);
  const sourceDiameterFlag = record.normalizedMetadata?.sourceDiameterAvailable === true;
  const attributeReportsDiameter = tokens.includes("Diameter");
  const attributeReportsNoDiameter = tokens.includes("No Diameter");
  const radiusDerived = computed.radiusDerived ?? {};
  const diameterObservedConsistent = topologyAdmitted
    && sourceDiameterFlag
    && attributeReportsDiameter
    && !attributeReportsNoDiameter
    && hasPositiveRadiusReceipt(radiusDerived.value)
    && radiusDerived.missingReason === null;
  const diameterUnavailableConsistent = topologyAdmitted
    && !sourceDiameterFlag
    && attributeReportsNoDiameter
    && !attributeReportsDiameter
    && radiusDerived.value === null
    && radiusDerived.missingReason === "official_attributes_report_no_diameter";
  if (topologyAdmitted && !diameterObservedConsistent && !diameterUnavailableConsistent) conflicts.push("diameter_authority_conflict_fail_closed");

  const transformMissing = record.missingness?.atlasTransform;
  const placementMissing = record.missingness?.atlasPlacement;
  const atlasInputsAbsent = record.normalizedMetadata?.registrationStatus === "unregistered"
    && transformMissing?.value == null
    && placementMissing?.value == null
    && typeof transformMissing?.missingReason === "string"
    && typeof placementMissing?.missingReason === "string";
  if (!atlasInputsAbsent) conflicts.push("atlas_registration_or_placement_conflict_fail_closed");

  const topologyAxis = topologyAdmitted
    ? observed(
      "centerline_topology",
      "Checksum-pinned standardized SWC nodes, parent links, and exact segment coordinates.",
      "Constant-width viewer strokes are display aids; no membrane is observed.",
      "geometry.{path,bytes,sha256,rawSwcSha256}; qc.status; morphometrics.computed.{nodeCount,segmentCount,topologySha256}",
      geometryLocator,
    )
    : unavailable(
      "centerline_topology",
      "topology_receipt_or_qc_not_admitted",
      "geometry; qc; morphometrics.computed topology receipt",
      officialRecordUrl,
      "The record fails closed; no centreline primitive is authorized by this coverage receipt.",
    );
  const neuriteTypeAxis = topologyAdmitted
    ? observed(
      "neurite_type_annotations",
      "Deposited SWC source-type codes are preserved per node and segment.",
      "Source type 6 remains uninterpreted; type labels do not establish molecular identity.",
      "morphometrics.computed.nodeTypeCounts; geometry node/segment sourceType",
      geometryLocator,
    )
    : unavailable("neurite_type_annotations", "topology_receipt_required", "morphometrics.computed.nodeTypeCounts; geometry sourceType", officialRecordUrl);
  const axonAxis = axonReceiptConsistent && axonNodeCount > 0
    ? observed(
      "axon_field",
      `${axonNodeCount.toLocaleString("en-US")} deposited source type-2 nodes in this reconstruction.`,
      `${record.normalizedMetadata.physicalIntegrity}; the axon field is never claimed complete.`,
      "normalizedMetadata.domain; morphometrics.computed.nodeTypeCounts['2']; normalizedMetadata.physicalIntegrity",
      geometryLocator,
    )
    : unavailable(
      "axon_field",
      axonReceiptConsistent ? "axon_not_reconstructed_in_deposited_domain" : "axon_receipt_conflict_fail_closed",
      "normalizedMetadata.domain; morphometrics.computed.nodeTypeCounts['2']",
      officialRecordUrl,
      "No axon primitive is added beyond an admitted source type-2 field; unavailable is not biological absence.",
    );
  const diameterAxis = diameterObservedConsistent
    ? observed(
      "diameter_input",
      "Official attributes report Diameter and the admitted radius summary is positive and complete.",
      "Cross-paper shrinkage and acquisition are not harmonized.",
      "normalizedMetadata.{attributes,sourceDiameterAvailable}; morphometrics.computed.radiusDerived",
      geometryLocator,
    )
    : unavailable(
      "diameter_input",
      diameterUnavailableConsistent ? "official_attributes_report_no_diameter" : "diameter_authority_conflict_fail_closed",
      "normalizedMetadata.{attributes,sourceDiameterAvailable}; morphometrics.computed.radiusDerived",
      officialRecordUrl,
      "Numeric placeholder radii cannot authorize calibre or a surface.",
    );
  const radiusSurfaceAxis = diameterObservedConsistent ? {
    id: "radius_derived_surface",
    label: AXIS_LABELS.radius_derived_surface,
    status: "DERIVED",
    authority: "DERIVED_FROM_OBSERVED_RADIUS",
    sourceField: "normalizedMetadata.{attributes,sourceDiameterAvailable}; morphometrics.computed.radiusDerived; radiusGate.algorithmId",
    sourceLocator: geometryLocator,
    basis: "Open six-sided tapered frusta can be generated from exact endpoint radii on request.",
    limitation: "Display derivative only; not an observed membrane or true soma surface.",
  } : unavailable(
    "radius_derived_surface",
    diameterUnavailableConsistent ? "source_diameter_required_and_unavailable" : "diameter_authority_conflict_fail_closed",
    "normalizedMetadata.{attributes,sourceDiameterAvailable}; morphometrics.computed.radiusDerived",
    officialRecordUrl,
    "The radius-derived renderer receives zero authorized primitives.",
  );

  const somaNodeCount = Number(nodeTypeCounts["1"] ?? 0);
  const somaSurfaceScalar = record.morphometrics?.sourceReported?.somaSurface?.value;
  const internalAxes = [
    unavailable(
      "soma_contour",
      `standardized_type1_samples_${somaNodeCount}_and_source_soma_surface_scalar_${somaSurfaceScalar ?? "missing"}_do_not_define_a_contour`,
      "morphometrics.computed.nodeTypeCounts['1']; morphometrics.sourceReported.somaSurface; internalDetailGate",
    ),
    unavailable("plasma_membrane", "no_same_specimen_membrane_segmentation_admitted", "internalDetailGate.missingEvidence[membrane_segmentation]"),
    unavailable("nucleus", "no_same_specimen_nucleus_object_admitted", "internalDetailGate.missingEvidence[nucleus]"),
    unavailable("organelles", "no_same_specimen_organelle_object_admitted", "internalDetailGate.missingEvidence[organelles]"),
    unavailable(
      "synaptic_boutons",
      `no_same_specimen_bouton_annotation_admitted_even_when_source_type2_nodes_${axonNodeCount}`,
      "morphometrics.computed.nodeTypeCounts['2']; internalDetailGate.missingEvidence[synaptic_boutons]",
    ),
    unavailable(
      "receptor_distribution",
      "source_cell_labels_or_stains_do_not_establish_a_same_specimen_receptor_map",
      "normalizedMetadata.cellType; internalDetailGate.missingEvidence[receptor_distribution]",
    ),
    unavailable(
      "synaptic_partners",
      `no_same_specimen_partner_or_connectivity_object_admitted_even_when_source_type2_nodes_${axonNodeCount}`,
      "morphometrics.computed.nodeTypeCounts['2']; internalDetailGate",
    ),
  ];
  const atlasAxis = unavailable(
    "atlas_placement",
    atlasInputsAbsent
      ? `transform_${transformMissing.missingReason}; placement_${placementMissing.missingReason}`
      : "atlas_registration_or_placement_conflict_fail_closed",
    "normalizedMetadata.registrationStatus; missingness.{atlasTransform,atlasPlacement}",
    officialRecordUrl,
    "No source-local SWC is placed, measured, or compared in atlas coordinates.",
  );

  const axes = [topologyAxis, neuriteTypeAxis, axonAxis, diameterAxis, radiusSurfaceAxis, ...internalAxes, atlasAxis];
  assert(axes.map((axis) => axis.id).join("|") === MORPHOLOGY_MICRODETAIL_AXIS_ORDER.join("|"), "Micro-detail axis order drifted");
  return {
    schemaVersion: "0.1.0",
    neuronId: record.neuronId,
    assetId: record.assetId,
    coverageStatus: conflicts.length ? "conflict_fail_closed" : "verified",
    admissionConflicts: conflicts,
    relationshipClass: "same_source_record_only",
    registrationCount: atlasInputsAbsent ? 0 : null,
    sameSpecimenInternalPrimitiveCount: 0,
    sourceRecordLocators: {
      officialRecordUrl,
      geometryPath: record.geometry?.path ?? null,
      rawSwcPath: record.geometry?.rawSwcPath ?? null,
      dois: record.sourcePaper?.dois ?? [],
      pmids: record.sourcePaper?.pmids ?? [],
    },
    axes,
  };
}
