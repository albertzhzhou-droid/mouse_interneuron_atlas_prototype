import { independentSourceObjectKey, INDEPENDENT_SOURCE_IDS } from "./independent-source-objects.js";
import { validateNativeContourGeometry } from "./neurolucida-native-contour-admission.js";
import { validateNativeContourDerivedSomaSurface } from "./native-contour-derived-soma-surface.js";
import { parseBancV888IN14A018Swc, computeBancV888SwcBounds } from "./banc-v888-in14a018-morphology-route.js";

function check(condition, message) { if (!condition) throw new Error(message); }
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
const ownedPayloads = new WeakMap();
let verificationSequence = 0;
function immutable(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) immutable(nested);
    Object.freeze(value);
  }
  return value;
}
export function assertVerifiedIndependentSourcePayload(object, payload) {
  checkIdentity(object);
  const proof = ownedPayloads.get(payload);
  check(proof && Object.isFrozen(payload) && payload.key === object.key && proof.objectSnapshot === JSON.stringify(object),
    "The exact current private independent-source producer proof is required; cloned or changed payloads are rejected");
  return proof.event;
}
function checkFrame(frame, expected) {
  check(frame.frame === expected.frame && frame.unit === expected.unit && frame.unitStatus === expected.unitStatus && frame.dimensions === expected.dimensions,
    "Selected object coordinate frame / units / dimensions disagree with the admitted source contract");
}

function checkNucleusParentRelationship(object) {
  const isMicrons = object.viewer.kind === "microns_mesh";
  const source = object.sourceContract;
  const sourceId = isMicrons ? INDEPENDENT_SOURCE_IDS.microns : INDEPENDENT_SOURCE_IDS.banc;
  const releaseId = isMicrons ? source.sourceDataset.segmentationRelease : "v888";
  const parentId = isMicrons ? source.identityChain.cellRootId : source.identity.rootId;
  const childId = isMicrons ? source.identityChain.somaValenceTable.nucleusId : source.identity.nucleusId;
  const kind = isMicrons ? "source_linked_nucleus_to_cell" : "source_same_root_nucleus_annotation";
  const relations = object.relationships?.filter((relation) => relation.kind === kind) ?? [];
  check(relations.length === 1, "The independent exact nucleus-parent relationship is missing or duplicated");
  const relation = relations[0];
  check(independentSourceObjectKey(relation.parent) === independentSourceObjectKey({ sourceId, releaseId, objectKind: isMicrons ? "cell_root" : "neuron_root", sourceObjectId: parentId })
    && independentSourceObjectKey(relation.child) === independentSourceObjectKey({ sourceId, releaseId, objectKind: isMicrons ? "nucleus" : "nucleus_annotation", sourceObjectId: childId })
    && relation.status === "source_reported" && relation.samePhysicalObject === false && relation.sameCellContext === true,
  "The independent nucleus-parent relationship source / version / native IDs or semantics mismatch");
  const evidence = relation.evidence;
  if (isMicrons) {
    const table = source.identityChain.somaValenceTable;
    check(evidence?.locator === "data/microns-observed-cell-nucleus-reference-0.1.json#identityChain/somaValenceTable"
      && evidence.exactSourceRow === table.exactSourceRow && evidence.filePath === table.path
      && same(evidence.checksum, { algorithm: "SHA-256", digest: table.sha256 }), "MICrONS independent parent relationship row / checksum evidence mismatch");
  } else {
    const annotationFile = object.files.find((file) => file.id === "nucleus-annotation-source");
    check(evidence?.locator === "data/banc-v888-candidate-audit-0.1.json#objectReceipts/nucleusAnnotationRow"
      && evidence.exactRootJoinVerified === true && evidence.sourceFileId === source.nucleusAnnotation.sourceAsset.dataverseFileId
      && same(evidence.nativeVoxelPosition, source.nucleusAnnotation.sourceVoxelPosition)
      && same(evidence.checksum, annotationFile?.checksum) && evidence.checksum.algorithm === "MD5",
    "BANC independent parent relationship join / checksum evidence mismatch");
  }
}

function checkIdentity(object) {
  check(object?.key && object.key === independentSourceObjectKey(object), "Independent source object key is invalid");
  const kind = object.viewer?.kind;
  const source = object.sourceContract;
  if (kind === "native_contours") {
    check(object.sourceId === INDEPENDENT_SOURCE_IDS.nativeContours && object.objectKind === "native_contour_record"
      && object.sourceObjectId === String(object.admission?.neuronId), "Native contour object identity mismatch");
    checkFrame(object.coordinateFrame, { frame: "Neurolucida_DAT_source_native_unregistered", unit: "micrometre", unitStatus: "source_reported", dimensions: 3 });
  } else if (kind === "microns_mesh") {
    const component = object.viewer.component;
    check(source && object.sourceId === INDEPENDENT_SOURCE_IDS.microns && object.releaseId === source.sourceDataset.segmentationRelease
      && ((component === "cell" && object.objectKind === "cell_root" && object.sourceObjectId === source.identityChain.cellRootId)
        || (component === "nucleus" && object.objectKind === "nucleus" && object.sourceObjectId === source.identityChain.somaValenceTable.nucleusId)), "MICrONS object identity mismatch");
    checkFrame(object.coordinateFrame, { frame: source.coordinateContract.nativeFrame, unit: source.coordinateContract.nativeUnits, unitStatus: "source_reported", dimensions: 3 });
    checkNucleusParentRelationship(object);
  } else if (kind === "banc_swc" || kind === "banc_nucleus_point") {
    check(source && object.sourceId === INDEPENDENT_SOURCE_IDS.banc && object.releaseId === "v888" && source.identity.materialization === "v888"
      && ((kind === "banc_swc" && object.objectKind === "neuron_root" && object.sourceObjectId === source.identity.rootId)
        || (kind === "banc_nucleus_point" && object.objectKind === "nucleus_annotation" && object.sourceObjectId === source.identity.nucleusId)), "BANC object identity mismatch");
    checkFrame(object.coordinateFrame, { frame: source.skeleton.coordinates.frame, unit: source.skeleton.coordinates.unit, unitStatus: "source_reported", dimensions: 3 });
    checkNucleusParentRelationship(object);
  } else if (kind === "palm_detection") {
    const index = object.viewer.detectionIndex;
    check(source && object.sourceId === INDEPENDENT_SOURCE_IDS.palm && object.releaseId === source.source.datasetDoi
      && object.objectKind === "localization_detection" && Number.isSafeInteger(index) && index >= 0 && index < source.acquisition.matRowsByColumns[1]
      && object.sourceObjectId === `${source.acquisition.imageId}:column:${index + 1}`, "PALM acquisition / detection identity mismatch");
    checkFrame(object.coordinateFrame, { frame: `PALM/${source.acquisition.imageId}/MAT-native-XY`, unit: null, unitStatus: "not_established", dimensions: 2 });
  } else if (kind === "link_only") {
    const { split, rowIndex } = object.context;
    check(source && object.sourceId === INDEPENDENT_SOURCE_IDS.microStructFormer && object.releaseId === source.datasetRelease.revisionSha
      && object.objectKind === "image_mask_row" && Number.isSafeInteger(rowIndex) && rowIndex >= 0 && rowIndex < source.datasetRelease.splitCounts[split]
      && object.sourceObjectId === `${split}:row:${rowIndex}`, "MicroStructFormer release / split / row identity mismatch");
    checkFrame(object.coordinateFrame, { frame: `${object.releaseId}/${split}/row/${rowIndex}/image-pixel`, unit: "pixel", unitStatus: "source_reported", dimensions: 2 });
  } else {
    throw new Error("Unknown independent source object viewer kind; no fallback geometry is allowed");
  }
}

export async function verifyIndependentSourceObjectAsset(bytes, receipt, { digestImpl = globalThis.crypto?.subtle } = {}) {
  check(bytes instanceof ArrayBuffer, "Object asset must be decoded as exact bytes");
  check(Number.isSafeInteger(receipt?.bytes) && receipt.bytes > 0 && bytes.byteLength === receipt.bytes, `Object asset byte-length mismatch: ${receipt?.id ?? "unknown"}`);
  check(receipt.checksum?.algorithm === "SHA-256", "Runtime display verification requires an actual SHA-256 receipt; source MD5 receipts remain separately labelled");
  check(/^[0-9a-f]{64}$/.test(receipt.checksum.digest), "Invalid SHA-256 receipt");
  check(digestImpl, "SHA-256 verification is unavailable; geometry is withheld");
  const digest = await digestImpl.digest("SHA-256", bytes);
  const actual = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
  check(actual === receipt.checksum.digest, `Object asset SHA-256 mismatch: ${receipt.id}`);
  return { fileId: receipt.id, path: receipt.path, bytes: bytes.byteLength, checksum: { algorithm: "SHA-256", digest: actual }, status: "verified" };
}

function manifestFile(id, source) {
  return { id, path: source.path, bytes: source.bytes, checksum: { algorithm: "SHA-256", digest: source.sha256 } };
}

function bufferFloat32(bytes) {
  const view = new DataView(bytes);
  const values = new Float32Array(bytes.byteLength / 4);
  for (let index = 0; index < values.length; index += 1) {
    values[index] = view.getFloat32(index * 4, true);
    check(Number.isFinite(values[index]), "Source mesh contains a non-finite position");
  }
  return values;
}

function bufferUint32(bytes, vertexCount) {
  const view = new DataView(bytes);
  const values = new Uint32Array(bytes.byteLength / 4);
  for (let index = 0; index < values.length; index += 1) {
    values[index] = view.getUint32(index * 4, true);
    check(values[index] < vertexCount, "Source mesh triangle index exceeds its exact vertex range");
  }
  return values;
}

function meshBounds(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let offset = 0; offset < positions.length; offset += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], positions[offset + axis]);
      max[axis] = Math.max(max[axis], positions[offset + axis]);
    }
  }
  return { min, max };
}

function validatedBancNucleus(object) {
  const source = object.sourceContract;
  const annotation = source.nucleusAnnotation;
  check(annotation.rootId === source.identity.rootId && annotation.nucleusId === source.identity.nucleusId && annotation.exactAnnotationRowCount === 1,
    "BANC nucleus annotation is not the exact selected root relation");
  const converted = annotation.sourceVoxelPosition.map((value, axis) => value * annotation.sourceVoxelResolutionNanometres[axis]);
  check(same(converted, annotation.positionNanometres) && converted.every(Number.isFinite), "BANC nucleus point units / coordinate conversion mismatch");
  check(annotation.surfaceOrVolumeAdmitted === false, "BANC nucleus annotation must remain a point");
  return { position: converted, componentId: "nucleus-point", sourceObjectId: annotation.nucleusId,
    authority: "OBS_SOURCE_NUCLEUS_ANNOTATION_POINT", representation: "annotation_point" };
}

/**
 * Geometry is returned only after the complete selected request passes. Errors
 * never return a partial cell, old payload or a substitute shape. Fetch is
 * injectable for real-byte tests and honours the caller's cancellation signal.
 */
export async function loadIndependentSourceObject(object, {
  fetchImpl = globalThis.fetch, signal, includeDerivedShell = false, forceReload = false,
} = {}) {
  checkIdentity(object);
  const verifiedFiles = [];
  const embeddedAssetIdentities = [];
  const result = { key: object.key, kind: object.viewer.kind, points: [], edges: [], meshes: [], contours: [] };
  const read = async (file) => {
    check(!signal?.aborted, "Independent object request was cancelled");
    check(typeof fetchImpl === "function" && typeof file.path === "string" && file.path.startsWith("/data/"), "Exact local object asset path is unavailable");
    const response = await fetchImpl(file.path, { signal, cache: forceReload ? "no-store" : "default" });
    check(response.ok, `Object asset request failed (${response.status})`);
    const bytes = (await response.arrayBuffer()).slice(0);
    verifiedFiles.push(await verifyIndependentSourceObjectAsset(bytes, file));
    check(!signal?.aborted, "Independent object request was cancelled");
    return bytes;
  };
  const byId = (id) => {
    const found = object.files.find((file) => file.id === id);
    check(found, `Missing exact object asset receipt: ${id}`);
    return found;
  };
  if (object.viewer.kind === "native_contours") {
    const bytes = await read(byId("native-contours"));
    const payload = validateNativeContourGeometry(JSON.parse(new TextDecoder().decode(bytes)), object.admission);
    embeddedAssetIdentities.push({ fileId: "native-contours", assetId: payload.assetId, releaseId: payload.releaseId, schemaVersion: payload.schemaVersion, documentType: payload.documentType });
    check(payload.sourceFrame === object.coordinateFrame.frame, "Native contour frame mismatch");
    check(payload.contours.every((contour) => contour.points.every((point) => point.length >= 3 && point.slice(0, 3).every(Number.isFinite))), "Native contours contain invalid coordinates");
    result.contours = payload.contours;
    if (includeDerivedShell && object.derivedSurfaceContract) {
      const shellBytes = await read(byId("derived-open-shell"));
      const shell = validateNativeContourDerivedSomaSurface(JSON.parse(new TextDecoder().decode(shellBytes)), payload,
        { nativeContourGeometry: object.derivedSurfaceContract.sourceNativeContourGeometry });
      embeddedAssetIdentities.push({ fileId: "derived-open-shell", assetId: shell.assetId, releaseId: shell.releaseId, schemaVersion: shell.schemaVersion, documentType: shell.documentType });
      check(shell.sourceFrame === object.coordinateFrame.frame, "Derived open-shell coordinate frame mismatch");
      result.meshes.push({ componentId: "derived-open-shell", authority: "DER_INTERPOLATED_SOURCE_CONTOUR_OPEN_SHELL", representation: "interpolated_uncapped_open_shell",
        positions: new Float32Array(shell.geometry.rings.flatMap((ring) => ring.pointsMicrometre.flat())), triangles: new Uint32Array(shell.geometry.triangleIndices) });
    }
  } else if (object.viewer.kind === "microns_mesh") {
    const source = object.sourceContract;
    const manifest = JSON.parse(new TextDecoder().decode(await read(byId("asset-manifest"))));
    check(manifest.documentType === "microns_observed_cell_nucleus_asset_manifest" && manifest.sourceRelease === object.releaseId
      && manifest.rootId === source.identityChain.cellRootId && manifest.nucleusId === source.identityChain.somaValenceTable.nucleusId && manifest.admittedComponentCount === 2,
    "MICrONS manifest object / version identity mismatch");
    embeddedAssetIdentities.push({ fileId: "asset-manifest", assetId: manifest.assetId, releaseId: manifest.sourceRelease, metadataDepositVersion: manifest.metadataDepositVersion, schemaVersion: manifest.schemaVersion });
    const table = new TextDecoder().decode(await read(byId("parent-cell-row")));
    const exactRow = source.identityChain.somaValenceTable.exactSourceRow;
    check(table.split(/\r?\n/).filter((line) => line === exactRow).length === 1, "MICrONS exact parent-cell / nucleus source row is missing or duplicated");
    for (const selected of object.components) {
      const component = manifest.components.find((item) => item.componentName === selected.id);
      check(component?.objectId === selected.sourceObjectId, "MICrONS mesh component native ID mismatch");
      const geometry = component.browserGeometry;
      check(geometry?.format === "parallel_binary_arrays_v1" && geometry.coordinateFrame === object.coordinateFrame.frame && geometry.coordinateUnits === object.coordinateFrame.unit,
        "MICrONS mesh frame / units mismatch");
      check(geometry.positions.scalarType === "float32_little_endian" && geometry.triangles.scalarType === "uint32_little_endian"
        && geometry.positions.tupleSize === 3 && geometry.triangles.tupleSize === 3 && geometry.triangles.indexing === "zero_based_global_vertex_index"
        && geometry.vertexCount === selected.vertexCount && geometry.triangleCount === selected.triangleCount
        && geometry.positions.bytes === geometry.vertexCount * 12 && geometry.triangles.bytes === geometry.triangleCount * 12
        && geometry.derivation.coordinateTransformApplied === false, "MICrONS mesh representation / count contract mismatch");
      const positions = bufferFloat32(await read(manifestFile(`${selected.id}-positions`, geometry.positions)));
      const triangles = bufferUint32(await read(manifestFile(`${selected.id}-triangles`, geometry.triangles)), selected.vertexCount);
      check(same(meshBounds(positions), geometry.boundsNanometre), "MICrONS source mesh bounds disagree with the pinned frame receipt");
      result.meshes.push({ componentId: selected.id, sourceObjectId: selected.sourceObjectId, authority: selected.authority,
        representation: selected.representation, positions, triangles });
    }
  } else if (object.viewer.kind === "banc_swc") {
    const parsed = parseBancV888IN14A018Swc(new TextDecoder().decode(await read(byId("swc"))));
    const skeleton = object.sourceContract.skeleton;
    check(parsed.nodes.length === skeleton.nodeCount && parsed.edges.length === skeleton.segmentCount
      && same(parsed.nodeTypeCodes, skeleton.nodeTypeCodes), "BANC SWC node / segment / type contract mismatch");
    check(same(computeBancV888SwcBounds(parsed.nodes), skeleton.coordinates.boundsNanometres), "BANC SWC frame / bounds mismatch");
    result.edges = parsed.edges.map(([from, to]) => [[from.x, from.y, from.z], [to.x, to.y, to.z]]);
    result.points = [validatedBancNucleus(object)];
  } else if (object.viewer.kind === "banc_nucleus_point") {
    result.points = [validatedBancNucleus(object)];
  } else if (object.viewer.kind === "palm_detection") {
    const source = object.sourceContract;
    const payload = JSON.parse(new TextDecoder().decode(await read(byId("palm-points"))));
    check(payload.source?.fileSha256 === source.source.fileSha256 && payload.source?.datasetDoi === source.source.datasetDoi
      && payload.acquisition?.imageId === source.acquisition.imageId && payload.acquisition?.animalId === source.acquisition.animalId
      && payload.matrix?.variableName === source.acquisition.matVariableName && same(payload.matrix.sourceShapeRowsByColumns, source.acquisition.matRowsByColumns)
      && payload.matrix.detectionCount === source.acquisition.matRowsByColumns[1] && payload.matrix.detections.length === source.acquisition.matRowsByColumns[1]
      && same(payload.matrix.outputColumns, ["frame", "x", "y"]), "PALM acquisition / matrix identity mismatch");
    const row = payload.matrix.detections[object.viewer.detectionIndex];
    check(Array.isArray(row) && row.length === 3 && row.every(Number.isFinite) && Number.isInteger(row[0]) && row[0] >= 1,
      "PALM selected source column has invalid coordinates / frame index");
    result.points = [{ position: [row[1], row[2]], frameIndex: row[0], sourceMatrixColumn: object.viewer.sourceMatrixColumn,
      componentId: "localization-point", authority: "OBS_MAT_LOCALIZATION_DETECTION", representation: "source_native_2d_detection_point" }];
  }
  check(!signal?.aborted, "Independent object request was cancelled");
  result.receipt = {
    documentType: "independent_source_object_runtime_receipt", objectKey: object.key, sourceId: object.sourceId, releaseId: object.releaseId,
    objectKind: object.objectKind, sourceObjectId: object.sourceObjectId, status: object.viewer.kind === "link_only" ? "link_only" : "verified",
    coordinateFrame: object.coordinateFrame, verifiedFiles, embeddedAssetIdentities, sourceOnlyFiles: object.files.filter((file) => !verifiedFiles.some((verified) => verified.fileId === file.id)),
    displayed: { pointCount: result.points.length, edgeCount: result.edges.length, meshCount: result.meshes.length, contourCount: result.contours.length },
    relationships: object.relationships,
    verificationScope: object.viewer.kind === "banc_nucleus_point"
      ? "Source-contract identity, independent parent relation and voxel-to-nanometre point conversion; the source annotation file MD5 is retained without fetching its bytes."
      : object.viewer.kind === "link_only" ? "Exact release / split / row reference identity only; no row asset bytes or live viewer revision verified."
        : "Listed runtime SHA-256 bytes and selected representation/frame contracts; source-only receipts are separately listed.",
    geometryScope: object.viewer.kind === "link_only" ? "No local image/mask bytes or geometry; exact external row reference only." : "Exact selected source object representations only; no fallback shapes, biological measurements or atlas registration.",
  };
  const event = immutable({ verificationSequence: ++verificationSequence, verifiedAt: new Date().toISOString(),
    requestCacheMode: forceReload ? "no-store" : "default", verifiedFileCount: verifiedFiles.length,
    authority: object.viewer.kind === "link_only" ? "exact_row_reference_only_no_geometry_or_bytes"
      : verifiedFiles.length ? "verified_selected_runtime_source_bytes" : "source_contract_only_no_runtime_asset_bytes" });
  result.receipt = immutable(structuredClone({ ...result.receipt, runtimeVerification: event }));
  result.points = immutable(result.points); result.edges = immutable(result.edges); result.contours = immutable(result.contours);
  // Typed arrays cannot be frozen. Private copies stay inside these accessors;
  // callers receive independent buffers and cannot alter the producer geometry.
  result.meshes = Object.freeze(result.meshes.map(mesh => {
    const positions = mesh.positions.slice(), triangles = mesh.triangles.slice();
    const { positions: _positions, triangles: _triangles, ...metadata } = mesh;
    void _positions; void _triangles;
    return Object.freeze({ ...metadata, get positions() { return positions.slice(); }, get triangles() { return triangles.slice(); } });
  }));
  Object.freeze(result);
  ownedPayloads.set(result, { objectSnapshot: JSON.stringify(object), event: result.receipt.runtimeVerification });
  return result;
}
