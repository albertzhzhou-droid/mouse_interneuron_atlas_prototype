import pv from "../data/pv-independent-morphology-routes-0.1.json" with { type: "json" };
import census from "../data/neuromorpho-census-main-scene-index-0.1.json" with { type: "json" };
import supplement from "../data/supplementary-morphology-comparison-adapter-0.1.json" with { type: "json" };
import todd from "../data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json" with { type: "json" };

const freeze = value => { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const check = (value, message) => { if (!value) throw new Error(`Morphology record rendering policy: ${message}`); };
const declarations = new Map();
function add(row, kind, contract, index) {
  const metadata = row.sourceMetadata ?? row.normalizedMetadata ?? row.sourceRecord;
  const neuronId = row.neuronId ?? metadata.neuronId;
  const geometry = row.geometry ?? row.fidelityRecord.geometry;
  const dimensionality = metadata.dimensionality ?? geometry.dimensionality;
  const sourceDiameterAvailable = metadata.sourceDiameterAvailable ?? geometry.sourceDiameterAvailable;
  check(Number.isSafeInteger(neuronId) && !declarations.has(neuronId), "source IDs must be exact and unique");
  check(["2D", "3D"].includes(dimensionality) && typeof sourceDiameterAvailable === "boolean", "native dimension and diameter declarations are required");
  const release = kind === "todd_supplementary" ? "8.6.126" : "8.6.124";
  declarations.set(neuronId, freeze({ neuronId, kind, release, namespace: release === "8.6.126" ? "neuromorpho:8.6.126:Todd" : `neuromorpho:${metadata.archive}`,
    collection: kind === "census" ? "census" : "supplementary", dimensionality, sourceDiameterAvailable,
    sourceFrame: metadata.sourceFrame, geometry: structuredClone(geometry),
    locator: `${contract}#/${["todd_supplementary", "pv_supplementary"].includes(kind) ? "routes" : "records"}/${index}` }));
}
census.records.forEach((row, index) => add(row, "census", "data/neuromorpho-census-main-scene-index-0.1.json", index));
supplement.records.forEach((row, index) => add(row, "supplementary", "data/supplementary-morphology-comparison-adapter-0.1.json", index));
todd.routes.forEach((row, index) => add(row, "todd_supplementary", "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json", index));
pv.routes.forEach((row, index) => add(row, "pv_supplementary", "data/pv-independent-morphology-routes-0.1.json", index));
check(declarations.size === 181, "the independent 142 + 7 + 30 + 2 source roster changed");

/** Declared source metadata and the project gate only. Never an actual geometry or rendered-view proof. */
export function deriveResearchMorphologyRenderingPolicy(record) {
  if (record?.focusKind !== "morphology_record") return null;
  const match = /^NeuroMorpho:([1-9]\d*)$/.exec(record.focusId ?? "");
  const row = match ? declarations.get(Number(match[1])) : null;
  check(row && record.key === `morphology_record:${record.focusId}`, "exact source record is not admitted");
  const member = record.morphologyMembership, coordinate = record.coordinate;
  const path = row.kind === "census" ? row.geometry.path.replace("/data/neuromorpho_release_8_6_124_census_v1/", "") : row.geometry.path;
  check(record.namespace === row.namespace && member?.collection === row.collection
    && member.censusContribution === (row.kind === "census" ? 1 : 0)
    && member.supplementaryContribution === (row.kind === "census" ? 0 : 1)
    && member.geometryPath === path && member.geometrySha256 === row.geometry.sha256,
  "source namespace, membership or file declaration changed");
  check(coordinate?.geometryStatus === "OBS_STANDARDIZED_SOURCE_LOCAL" && coordinate.frame === row.sourceFrame
    && coordinate.registrationStatus === "unregistered" && coordinate.registrationCount === 0,
  "source frame or registration authority changed");
  if (row.release === "8.6.126") check(member.routeContractPath === "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json", "Todd release requires its independent route contract");
  const surfaceAllowed = row.dimensionality === "3D" && row.sourceDiameterAvailable;
  const reason = row.dimensionality === "2D" ? "source_labelled_2d_no_3d_surface" : !row.sourceDiameterAvailable ? "source_reports_no_diameter" : "requires_current_private_geometry_byte_proof";
  const archived = record.evidence.map((field, index) => ({ field, index })).filter(({ field }) => field.label === "Radius-derived surface")
    .map(({ field, index }) => ({ evidenceIndex: index, originalLabel: field.label, originalValue: field.value, originalAuthority: field.authority,
      originalLocator: field.locator, interpretation: "archived_project_rendering_declaration_not_current_permission",
      currentSurfaceAllowedAfterByteVerification: surfaceAllowed }));
  return freeze({ documentType: "research_morphology_rendering_policy", schemaVersion: "0.1.0", recordKey: record.key,
    namespace: record.namespace, repositoryRelease: row.release, membership: row.kind, censusContribution: member.censusContribution,
    declaredSource: { neuronId: row.neuronId, dimensionality: row.dimensionality, sourceDiameterAvailable: row.sourceDiameterAvailable,
      sourceFrame: row.sourceFrame, geometryPath: row.geometry.path, geometryBytes: row.geometry.bytes,
      geometrySha256: row.geometry.sha256, rawSwcSha256Declared: row.geometry.rawSwcSha256, contractLocator: row.locator },
    radiusSurface: { allowedAfterCurrentByteVerification: surfaceAllowed, reason, authority: surfaceAllowed ? "DER_AFTER_VERIFIED_OBS_INPUT" : "UNAVAILABLE",
      requirement: "source_labelled_3d_and_source_diameter_and_current_private_geometry_byte_proof", observedMembrane: false,
      thicknessInferenceAllowed: false, depthInferenceAllowed: false, planarCoordinatesChanged: false },
    actualGeometryVerification: { status: "not_included", verifiedBytes: null, reason: "This dossier policy reads canonical declarations; current source bytes require the independent private loader proof." },
    actualRenderedView: { status: "not_included", camera: null, layers: null, clipping: null },
    sameCellInternalGeometryAllowed: false, registrationCount: 0, archivedSurfaceDeclarations: archived,
    scope: "declared_source_metadata_and_project_rendering_policy_not_actual_view_or_source_byte_verification" });
}

/** Keep the retained field value and locator exact while identifying its archived project scope. */
export function researchEvidenceDisplayLabel(record, field) {
  return record.focusKind === "morphology_record" && field.label === "Radius-derived surface"
    ? "Archived radius-surface declaration" : field.label;
}
