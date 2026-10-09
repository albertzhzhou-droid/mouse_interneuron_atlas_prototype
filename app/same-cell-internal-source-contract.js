import { validateSourceIdentityHierarchy } from "./source-object-identity.js";

export const SAME_CELL_INTERNAL_SOURCE_FIELDS = Object.freeze([
  ["doi", "Publication / deposit DOI"], ["repository_object", "Exact repository object URI"],
  ["specimen", "Stable source specimen identity"], ["cell", "Stable source cell identity"],
  ["geometry_version", "Geometry object and pinned version"], ["modality", "Source imaging modality"],
  ["voxel_resolution", "Physical voxel resolution"], ["bounding_box", "Source bounding box"],
  ["coordinate_frame", "Physical source coordinate frame"], ["rights", "File-specific reuse rights"],
  ["byte_receipts", "Current exact geometry / raw byte receipts"], ["same_cell_join", "Independent same-specimen / same-cell linkage"],
  ["raw_segmentation_qc", "Original-volume and segmentation QC"],
].map(([id, label]) => Object.freeze({ id, label })));

const text = (value) => typeof value === "string" && value.length > 0 && value === value.trim();
const vector = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const PHYSICAL_UNITS = new Set(["nanometre", "micrometre"]);
const INTERNAL_MODALITIES = new Set(["serial_volume_em", "electron_microscopy_segmentation", "serial_fluorescence_volume", "correlative_volume_microscopy"]);
const STRUCTURE_KINDS = new Set(["nucleus", "organelle", "synaptic_structure", "receptor_distribution"]);
function https(value) { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !!url.hostname; } catch { return false; } }
function hierarchy(value) { try { return validateSourceIdentityHierarchy(value); } catch { return null; } }
function validReceipt(receipt) {
  return receipt && text(receipt.path) && Number.isSafeInteger(receipt.bytes) && receipt.bytes > 0 && receipt.status === "verified"
    && ((receipt.algorithm === "SHA-256" && /^[a-f0-9]{64}$/.test(receipt.digest)) || (receipt.algorithm === "MD5" && /^[a-f0-9]{32}$/.test(receipt.digest)));
}
function physicalFrame(frame, identity) {
  return frame && text(frame.id) && frame.dimensions === 3 && PHYSICAL_UNITS.has(frame.unit)
    && Array.isArray(frame.axisOrder) && frame.axisOrder.length === 3 && [...frame.axisOrder].sort().join("") === "xyz"
    && Array.isArray(frame.axisDirections) && frame.axisDirections.length === 3 && frame.axisDirections.every((value) => value === -1 || value === 1)
    && vector(frame.origin) && frame.sourceId === identity?.sourceId && frame.releaseId === identity?.releaseId && frame.namespace === identity?.namespace
    && text(frame.locator);
}

/**
 * verifiedEvidence and runtimeReceipts are supplied only by a trusted source
 * adapter / loader. Imported JSON and user-entered QC flags are proposals and
 * cannot populate those collections. This gate grants no atlas transform.
 */
export function evaluateSameCellInternalSource({ targetHierarchy = null, targetCoordinateFrame = null, candidate = null, requiredStructureKind = null, verifiedEvidence = [], runtimeReceipts = [] } = {}) {
  const target = hierarchy(targetHierarchy), object = hierarchy(candidate?.hierarchy);
  const checks = [];
  const add = (id, passed, reason, locator = null) => checks.push(Object.freeze({ id,
    label: SAME_CELL_INTERNAL_SOURCE_FIELDS.find((field) => field.id === id).label,
    status: passed ? "passed" : "unavailable", reason, locator }));
  const known = (identity, level) => identity?.nodes[level]?.status === "known" && text(identity.nodes[level].id);
  add("doi", text(candidate?.doi) && /^10\.\d{4,9}\/\S+$/i.test(candidate.doi),
    "An exact DOI is required; a shared publication is not cell linkage.", candidate?.doi ? `https://doi.org/${candidate.doi}` : null);
  add("repository_object", https(candidate?.repositoryObjectUri), "A landing page alone cannot identify the exact geometry object.", candidate?.repositoryObjectUri ?? null);
  add("specimen", known(target, "specimen") && known(object, "specimen") && text(candidate?.specimenId)
    && candidate.specimenId === object.nodes.specimen.id,
  "Both target and component need stable specimen IDs from their own source scope; age, region and filenames do not supply one.", object?.nodes.specimen.locator ?? null);
  add("cell", known(target, "cell") && target?.objectLevel === "cell" && known(object, "cell")
    && ["component", "synapse"].includes(object?.objectLevel) && text(candidate?.cellId) && candidate.cellId === object.nodes.cell.id
    && STRUCTURE_KINDS.has(candidate?.structureKind) && (requiredStructureKind === null || candidate.structureKind === requiredStructureKind)
    && object.parents.component.status === "source_reported" && (object.objectLevel !== "synapse" || object.parents.synapse.status === "source_reported"),
  "The selected target must be a cell, with an exact source parent chain and structure kind for this distinct internal component.", object?.parents.component.locator ?? null);
  add("geometry_version", text(candidate?.geometryId) && text(candidate?.geometryVersion) && text(candidate?.geometryLocator)
    && text(candidate?.releaseId) && candidate.releaseId === object?.releaseId,
  "The geometry ID and version must bind the component's retained source release.", candidate?.geometryLocator ?? null);
  add("modality", INTERNAL_MODALITIES.has(candidate?.modality), "Only an explicitly declared volume-imaging modality can support this internal 3D gate; 2D outlines and point detections remain separate.");
  const frame = candidate?.coordinateFrame;
  const validFrame = physicalFrame(frame, object) && physicalFrame(targetCoordinateFrame, target)
    && frame.sourceId === targetCoordinateFrame.sourceId && frame.releaseId === targetCoordinateFrame.releaseId
    && frame.namespace === targetCoordinateFrame.namespace && frame.id === targetCoordinateFrame.id
    && frame.unit === targetCoordinateFrame.unit && same(frame.axisOrder, targetCoordinateFrame.axisOrder)
    && same(frame.axisDirections, targetCoordinateFrame.axisDirections) && same(frame.origin, targetCoordinateFrame.origin);
  add("coordinate_frame", validFrame, "The exact target and component physical frames, units, axes, direction and origin must agree. Display centering or an unverified transform cannot satisfy this gate.", frame?.locator ?? null);
  add("voxel_resolution", vector(candidate?.voxelResolution?.values) && candidate.voxelResolution.values.every((value) => value > 0)
    && PHYSICAL_UNITS.has(candidate.voxelResolution.unit) && candidate.voxelResolution.unit === frame?.unit && text(candidate.voxelResolution.locator),
  "All three physical voxel scales and their source locator are required; pixels or invented depth are insufficient.", candidate?.voxelResolution?.locator ?? null);
  const box = candidate?.boundingBox;
  add("bounding_box", vector(box?.min) && vector(box?.max) && box.min.every((value, axis) => value < box.max[axis])
    && box.frameId === frame?.id && PHYSICAL_UNITS.has(box.unit) && box.unit === frame?.unit && text(box.locator),
  "A non-degenerate source bounding box must use the exact physical frame and units.", box?.locator ?? null);
  const rights = candidate?.rights;
  add("rights", rights?.status === "verified_file_reuse" && text(rights.license) && https(rights.termsUri)
    && rights.objectUri === candidate?.repositoryObjectUri && text(rights.locator),
  "Reuse rights must cover this exact source object, not merely its article or software.", rights?.locator ?? null);
  const receipts = [candidate?.geometryReceipt, ...(Array.isArray(candidate?.rawReceipts) ? candidate.rawReceipts : [])];
  const verifiedBytes = receipts.length > 1 && receipts.every(validReceipt)
    && new Set(receipts.map((receipt) => receipt.path)).size === receipts.length
    && receipts.every((receipt) => runtimeReceipts.filter((current) => same(current, receipt)).length === 1);
  add("byte_receipts", verifiedBytes, "The current loader must independently verify every exact geometry and original-volume/segmentation receipt; declared hashes and repeated receipts are insufficient.");
  const proof = candidate?.sameCellJoinEvidence;
  const candidates = proof?.id ? verifiedEvidence.filter((entry) => entry.id === proof.id) : [];
  const { sameCellJoinEvidence: ignoredProof, ...snapshot } = candidate ?? {};
  void ignoredProof;
  const boundProof = candidates.length === 1 && same(candidates[0], proof) && text(proof?.locator)
    && proof?.relation === "source_reported_component_of_exact_cell" && proof.targetKey === target?.key && proof.componentKey === object?.key
    && same(proof.candidateContract, snapshot) && same(proof.targetHierarchy, target) && same(proof.targetCoordinateFrame, targetCoordinateFrame)
    && Array.isArray(proof.sourceReceipts) && proof.sourceReceipts.length > 0 && proof.sourceReceipts.every(validReceipt)
    && proof.sourceReceipts.every((receipt) => runtimeReceipts.filter((current) => same(current, receipt)).length === 1);
  add("same_cell_join", boundProof && proof?.qc?.sameSpecimenVerified === true && proof.qc.sameCellVerified === true
    && proof.qc.notPopulationMarkerOrColocationOnly === true && proof.qc.geometryVersionAndBoundsVerified === true && proof.qc.assetRightsVerified === true,
  "Only an independently verified, unambiguous source linkage bound to both exact identities and all source fields can open this gate. A cell and its component remain distinct objects.", proof?.locator ?? null);
  add("raw_segmentation_qc", boundProof && proof?.qc?.originalVolumeSlicesChecked === true && proof.qc.segmentationMatchesRawSource === true
    && text(proof.qc.method) && text(proof.qc.methodVersion) && text(proof.qc.locator),
  "Original source slices must independently support the retained segmentation; a plausible rendering cannot replace raw-data QC.", proof?.qc?.locator ?? null);
  const eligible = checks.every((check) => check.status === "passed");
  return Object.freeze({ documentType: "same_cell_internal_source_gate", schemaVersion: "0.1.0", upgradeId: "UPG-118",
    targetKey: target?.key ?? null, componentKey: object?.key ?? null, eligible,
    internalLayerStatus: eligible ? "Eligible_for_source_local_renderer" : "Unavailable", checks: Object.freeze(checks),
    missingRequiredFields: Object.freeze(checks.filter((check) => check.status !== "passed").map((check) => check.id)),
    geometryObjectsAdmittedByThisEvaluation: 0, registrationsCreated: 0, crossSourceIdentityCreated: false,
    boundary: "Source-local eligibility only. The renderer still verifies its active bytes and geometry. No complete-cell, membrane, atlas transform, measurement or biological absence is inferred." });
}
