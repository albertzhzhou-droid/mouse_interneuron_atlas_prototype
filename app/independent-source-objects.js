import { validateNativeContourAdmissionCatalog } from "./neurolucida-native-contour-admission.js";

export const INDEPENDENT_SOURCE_IDS = Object.freeze({
  nativeContours: "native-contours",
  microns: "microns-phase1",
  banc: "banc-v888",
  palm: "super-clem-palm",
  microStructFormer: "microstructformer",
});

export const INDEPENDENT_OBJECT_EVIDENCE_STATES = Object.freeze([
  "observed_source_object", "derived_display", "source_reported", "source_level_only",
  "not_measured", "unavailable", "not_assessed", "not_established",
  "source_reported_absent", "rights_held",
]);

const SLOT_LABELS = Object.freeze({
  cell_geometry: "Source-local morphology", radius_surface: "Radius-derived surface",
  soma_trace: "Soma trace / outline", cell_boundary: "Cell boundary / membrane",
  nucleus: "Nucleus", organelles: "Organelles", synaptic_structures: "Synaptic structures",
  receptor_distribution: "Receptor distribution", source_frame: "Source coordinates / frame",
  reconstruction_completeness: "Reconstruction domain / completeness", relationships: "Object relationships",
});

function check(condition, message) { if (!condition) throw new Error(message); }
function immutable(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const nested of Object.values(value)) immutable(nested, seen);
  return Object.freeze(value);
}

function validPart(value) {
  return typeof value === "string" && value.length > 0 && value === value.trim() && [...value].every((character) => character.charCodeAt(0) > 31);
}

/** No numeric coercion: roots above the safe-integer limit are source strings. */
export function independentSourceObjectKey(identity) {
  const parts = [identity?.sourceId, identity?.releaseId, identity?.objectKind, identity?.sourceObjectId];
  if (!parts.every(validPart)) return null;
  try { return parts.map(encodeURIComponent).join("/"); } catch { return null; }
}

export function parseIndependentSourceObjectKey(key) {
  if (typeof key !== "string" || key.split("/").length !== 4) return null;
  try {
    const [sourceId, releaseId, objectKind, sourceObjectId] = key.split("/").map(decodeURIComponent);
    const identity = { sourceId, releaseId, objectKind, sourceObjectId };
    return independentSourceObjectKey(identity) === key ? identity : null;
  } catch { return null; }
}

function fileReceipt(id, source, { path = source.path ?? source.projectPath, algorithm = "SHA-256", digest = source.sha256, role = "source", requiredForDisplay = false, verification = "receipt_only" } = {}) {
  check(algorithm === "SHA-256" || algorithm === "MD5", "Unknown file checksum algorithm");
  check(typeof digest === "string" && new RegExp(`^[0-9a-f]{${algorithm === "SHA-256" ? 64 : 32}}$`).test(digest), `Invalid ${algorithm} receipt for ${id}`);
  check(source.bytes == null || (Number.isSafeInteger(source.bytes) && source.bytes > 0), `Invalid byte receipt for ${id}`);
  return { id, path: path ?? null, sourceUrl: source.sourceUrl ?? source.originalDatUrl ?? source.url ?? null,
    bytes: source.bytes ?? null, checksum: { algorithm, digest }, role, requiredForDisplay, verification };
}

function coverage(locator, overrides = {}) {
  return Object.entries(SLOT_LABELS).map(([id, label]) => ({ id, label,
    status: overrides[id]?.status ?? "not_assessed",
    detail: overrides[id]?.detail ?? "No exact-object assessment or display geometry is admitted; this does not establish biological absence.",
    authority: overrides[id]?.authority ?? "independent_source_object_contract",
    locator: overrides[id]?.locator ?? locator,
  }));
}

function observed(detail, locator) { return { status: "observed_source_object", detail, ...(locator ? { locator } : {}) }; }
function unavailable(detail) { return { status: "unavailable", detail }; }
function unestablished(detail) { return { status: "not_established", detail }; }

function record(identity, detail) {
  const key = independentSourceObjectKey(identity);
  check(key, "Independent object identity must contain four explicit source strings");
  check(detail.structureCoverage.every((item) => INDEPENDENT_OBJECT_EVIDENCE_STATES.includes(item.status)), "Unknown structural evidence state");
  return immutable({ ...identity, key, ...detail });
}

function count(value, unit, scopeKey, derivedFrom) { return { value, unit, scopeKey, derivedFrom }; }

/**
 * Large detection collections stay as ranges. Only the current search page is
 * materialized; no 18,358-record metadata copy or payload is bundled eagerly.
 * BIL is deliberately absent until exact versioned source inputs are admitted.
 */
export function buildIndependentSourceObjectIndex({
  nativeContourCatalog, micronsReference, bancMorphologyRoute, superClemReference,
  microStructFormerReference, nativeContourDerivedSurface = null, nativeContourCrosswalk = null,
  bancCandidateAudit = null, nativeContourSourceContext = null,
}) {
  const catalog = validateNativeContourAdmissionCatalog(nativeContourCatalog);
  const fixedRecords = [];
  const nativeRelease = catalog.releaseId;
  let nativeContexts = new Map();
  if (nativeContourSourceContext) {
    check(nativeContourSourceContext.documentType === "native_contour_source_context" && nativeContourSourceContext.contractId === "native-contour-source-context-0.1"
      && nativeContourSourceContext.recordCount === 7 && Array.isArray(nativeContourSourceContext.records) && nativeContourSourceContext.records.length === 7,
    "Native contour source-context metadata contract is unknown or incomplete");
    nativeContexts = new Map(nativeContourSourceContext.records.map((item) => [item.neuronId, item]));
    check(nativeContexts.size === 7 && catalog.records.every((item) => nativeContexts.has(String(item.neuronId))), "Native contour source-context IDs do not match the seven exact admitted records");
  }
  for (const admitted of catalog.records) {
    const identity = { sourceId: INDEPENDENT_SOURCE_IDS.nativeContours, registryId: catalog.contractId,
      releaseId: nativeRelease, objectKind: "native_contour_record", sourceObjectId: String(admitted.neuronId) };
    const inDelta = catalog.schemaVersion.startsWith("0.4") && catalog.addedRecords?.some(item => item.neuronId === admitted.neuronId);
    const locator = `data/neurolucida-native-contour-admission-catalog-${inDelta ? "0.4" : "0.3"}.json#${inDelta ? "addedRecords" : "records"}/neuronId=${admitted.neuronId}`;
    const files = [fileReceipt("source-dat", admitted.source), fileReceipt("native-contours", admitted.derivedObject, { role: "geometry", requiredForDisplay: true })];
    const components = [{ id: "soma-contours", representation: "source_native_line_loops", dimensions: 3,
      authority: admitted.derivedObject.authority, evidenceState: "observed_source_object", fileId: "native-contours" }];
    const relationships = [];
    if (nativeContourDerivedSurface?.neuronId === admitted.neuronId) {
      files.push(fileReceipt("derived-open-shell", nativeContourDerivedSurface.artifact,
        { path: nativeContourDerivedSurface.artifact.publicPath, role: "geometry", requiredForDisplay: false }));
      components.push({ id: "derived-open-shell", representation: "interpolated_uncapped_open_shell", dimensions: 3,
        authority: "DER_INTERPOLATED_SOURCE_CONTOUR_OPEN_SHELL", evidenceState: "derived_display", fileId: "derived-open-shell" });
      relationships.push({ kind: "derived_from_exact_source_contours", targetObjectId: identity.sourceObjectId,
        status: "derived_display", evidence: { locator: "data/native-contour-derived-soma-surface-0.1.json#sourceNativeContourGeometry", sourceSha256: admitted.derivedObject.sha256 }, samePhysicalObject: false });
    }
    if (nativeContourCrosswalk?.record?.neuronId === admitted.neuronId) {
      relationships.push({ kind: "same_record_frame_crosswalk", targetObjectId: identity.sourceObjectId,
        status: "derived_display", evidence: { locator: "data/neurolucida-dat-swc-crosswalk-0.1.json", releaseId: nativeContourCrosswalk.releaseId }, samePhysicalObject: false });
    }
    const sourceContext = nativeContexts.get(identity.sourceObjectId) ?? null;
    if (sourceContext) {
      const expectedName = decodeURIComponent(new URL(admitted.source.originalDatUrl).pathname.split("/").at(-1)).replace(/\.dat$/, "");
      check(sourceContext.neuronName === expectedName && sourceContext.repository === "NeuroMorpho.Org" && sourceContext.repositoryRelease === "8.6.124"
        && sourceContext.display.species === sourceContext.fields.species.value && sourceContext.display.region === sourceContext.fields.region.value.join(" / ")
        && sourceContext.sourceApiReceipt.checksum.algorithm === "SHA-256" && /^[0-9a-f]{64}$/.test(sourceContext.sourceApiReceipt.checksum.digest)
        && Number.isSafeInteger(sourceContext.sourceApiReceipt.bytes) && sourceContext.sourceApiReceipt.bytes > 0,
      "Native contour exact source metadata identity, locator or receipt mismatch");
    }
    fixedRecords.push(record(identity, {
      title: `NMO ${admitted.neuronId} · ${admitted.title}`, sourceUrl: admitted.source.officialRecordUrl,
      context: { scope: "source_native_unregistered", species: sourceContext?.display.species ?? "species unknown in contour admission",
        region: sourceContext?.display.region ?? "region unknown in contour admission", age: sourceContext?.display.age ?? "age unknown in contour admission",
        condition: sourceContext?.display.condition ?? "condition unknown in contour admission", sourceContext, license: admitted.source.rights },
      coordinateFrame: { frame: "Neurolucida_DAT_source_native_unregistered", unit: "micrometre", unitStatus: "source_reported", dimensions: 3 },
      components, relationships, files,
      counts: [count(admitted.admission.admittedContourObjectCount, "contours", `${identity.sourceId}/${nativeRelease}/${identity.sourceObjectId}`, `${locator}/admission`)],
      structureCoverage: coverage(locator, {
        soma_trace: observed(admitted.admission.reason), cell_geometry: unavailable("Source soma contours only; these traces do not supply a whole-cell reconstruction."),
        cell_boundary: { status: components.length > 1 ? "derived_display" : "not_measured", detail: components.length > 1 ? "One separately documented interpolated open shell; no observed membrane or volume." : "Source line loops do not measure a membrane or surface." },
        nucleus: unavailable("No exact-source nucleus object is admitted."), organelles: unavailable("No exact-source organelle object is admitted."),
        synaptic_structures: unavailable("No exact-source synaptic object is admitted."), source_frame: observed("Source-native coordinates; no atlas registration."),
        reconstruction_completeness: unestablished("Admission covers the exact soma contour subset; whole-cell completeness is not certified."),
        relationships: relationships.length ? { status: "derived_display", detail: "Only the separately listed record-specific derivative / frame receipts apply. No same-cell internal structure or atlas placement." } : unestablished("No admitted cross-source identity, internal-object parent relation or atlas registration."),
      }), viewer: { kind: "native_contours", neuronId: admitted.neuronId },
      admission: admitted, derivedSurfaceContract: components.length > 1 ? nativeContourDerivedSurface : null,
    }));
  }

  const microns = micronsReference;
  const micronsRelease = microns.sourceDataset.segmentationRelease;
  const micronsRoot = microns.identityChain.cellRootId;
  const micronsNucleus = microns.identityChain.somaValenceTable.nucleusId;
  check(typeof micronsRoot === "string" && typeof micronsNucleus === "string", "MICrONS source IDs must stay strings");
  const micronsRelation = { kind: "source_linked_nucleus_to_cell", parent: { sourceId: INDEPENDENT_SOURCE_IDS.microns, releaseId: micronsRelease, objectKind: "cell_root", sourceObjectId: micronsRoot },
    child: { sourceId: INDEPENDENT_SOURCE_IDS.microns, releaseId: micronsRelease, objectKind: "nucleus", sourceObjectId: micronsNucleus }, status: "source_reported", samePhysicalObject: false, sameCellContext: true,
    evidence: { locator: "data/microns-observed-cell-nucleus-reference-0.1.json#identityChain/somaValenceTable", exactSourceRow: microns.identityChain.somaValenceTable.exactSourceRow,
      filePath: microns.identityChain.somaValenceTable.path, checksum: { algorithm: "SHA-256", digest: microns.identityChain.somaValenceTable.sha256 } } };
  for (const [objectKind, sourceObjectId, selectedComponent] of [["cell_root", micronsRoot, "cell"], ["nucleus", micronsNucleus, "nucleus"]]) {
    const identity = { sourceId: INDEPENDENT_SOURCE_IDS.microns, registryId: microns.contractId, releaseId: micronsRelease, objectKind, sourceObjectId };
    const components = microns.components.filter((item) => selectedComponent === "cell" || item.assetManifestComponent === "nucleus").map((item) => ({
      id: item.assetManifestComponent, sourceObjectId: item.sourceObjectId, representation: "source_segmentation_surface", dimensions: 3,
      authority: item.authority, evidenceState: "observed_source_object", vertexCount: item.vertexCount, triangleCount: item.triangleCount,
    }));
    const locator = "data/microns-observed-cell-nucleus-reference-0.1.json";
    fixedRecords.push(record(identity, {
      title: selectedComponent === "cell" ? `MICrONS cortical cell root ${sourceObjectId}` : `MICrONS linked nucleus ${sourceObjectId}`,
      sourceUrl: microns.sourceDataset.sourcePage,
      context: { species: microns.sourceDataset.species, region: microns.sourceDataset.specimen.region, age: microns.sourceDataset.specimen.age,
        scope: "comparative_cortical_reference", license: microns.sourceDataset.rights.license, spinalIdentity: "not_established" },
      coordinateFrame: { frame: microns.coordinateContract.nativeFrame, unit: microns.coordinateContract.nativeUnits, unitStatus: "source_reported", dimensions: 3 },
      components, relationships: [micronsRelation],
      files: [fileReceipt("asset-manifest", microns.assetBundle.manifest, { role: "manifest", requiredForDisplay: true }),
        fileReceipt("parent-cell-row", microns.identityChain.somaValenceTable, { requiredForDisplay: true }),
        fileReceipt("parent-cell-row-md5", microns.identityChain.somaValenceTable, { algorithm: "MD5", digest: microns.identityChain.somaValenceTable.md5 })],
      counts: [count(1, objectKind === "cell_root" ? "cell_roots" : "nuclei", `${identity.sourceId}/${micronsRelease}/${objectKind}`, `${locator}#identityChain`)],
      structureCoverage: coverage(locator, {
        cell_geometry: selectedComponent === "cell" ? observed("Exact cortical cell source segmentation surface; not molecular membrane.") : unavailable("This selection is the nucleus surface; parent cell geometry is available through its separate root record."),
        cell_boundary: selectedComponent === "cell" ? observed("Cell segmentation boundary only; no molecular membrane claim.") : unavailable("No cell boundary belongs to this nucleus-only selection."),
        nucleus: observed("Exact source-linked nucleus segmentation surface; parent relation has a separate exact CSV-row receipt."),
        organelles: unavailable("No exact same-cell organelle geometry is admitted."), synaptic_structures: unavailable("No exact same-cell synapse points or geometry are admitted."),
        source_frame: observed("Admitted cell and nucleus share the source-native nanometre frame; no project-derived registration."),
        reconstruction_completeness: { status: "source_reported", detail: microns.sourceDataset.proofreadingBoundary },
        relationships: { status: "source_reported", detail: "Exact soma_valence_v185.csv root/nucleus row; no spinal, NeuroMorpho or atlas identity link." },
      }), viewer: { kind: "microns_mesh", component: selectedComponent }, sourceContract: microns,
    }));
  }

  const banc = bancMorphologyRoute;
  check(typeof banc.identity.rootId === "string" && typeof banc.identity.nucleusId === "string", "BANC IDs must stay source strings");
  const bancLocator = "data/banc-v888-in14a018-morphology-route-0.1.json";
  const soma = bancCandidateAudit?.objectReceipts?.nucleusAnnotationRow;
  const nucleusChecksum = soma?.md5 ?? (banc.nucleusAnnotation.sourceAsset.sha256.length === 32 ? banc.nucleusAnnotation.sourceAsset.sha256 : null);
  check(nucleusChecksum === "54a2b72cb72117fa6358962655625bb1", "BANC somas_v1 checksum identity changed");
  const annotationFile = fileReceipt("nucleus-annotation-source", { ...banc.nucleusAnnotation.sourceAsset, bytes: soma?.bytes ?? 5350459 },
    { path: null, algorithm: "MD5", digest: nucleusChecksum });
  annotationFile.algorithmEvidence = "data/banc-v888-candidate-audit-0.1.json#objectReceipts/nucleusAnnotationRow/md5";
  annotationFile.legacyFieldCorrection = "Morphology-route sourceAsset.sha256 carries the source MD5; it is not a SHA-256 digest.";
  const bancRelation = { kind: "source_same_root_nucleus_annotation", parent: { sourceId: INDEPENDENT_SOURCE_IDS.banc, releaseId: "v888", objectKind: "neuron_root", sourceObjectId: banc.identity.rootId },
    child: { sourceId: INDEPENDENT_SOURCE_IDS.banc, releaseId: "v888", objectKind: "nucleus_annotation", sourceObjectId: banc.identity.nucleusId }, status: "source_reported", samePhysicalObject: false, sameCellContext: true,
    evidence: { locator: "data/banc-v888-candidate-audit-0.1.json#objectReceipts/nucleusAnnotationRow", exactRootJoinVerified: true,
      nativeVoxelPosition: banc.nucleusAnnotation.sourceVoxelPosition, sourceFileId: banc.nucleusAnnotation.sourceAsset.dataverseFileId, checksum: annotationFile.checksum } };
  for (const [objectKind, sourceObjectId, kind] of [["neuron_root", banc.identity.rootId, "banc_swc"], ["nucleus_annotation", banc.identity.nucleusId, "banc_nucleus_point"]]) {
    const identity = { sourceId: INDEPENDENT_SOURCE_IDS.banc, registryId: banc.recordSetId, releaseId: "v888", objectKind, sourceObjectId };
    fixedRecords.push(record(identity, {
      title: `BANC v888 · ${objectKind === "neuron_root" ? `IN14A018 root ${sourceObjectId}` : `nucleus annotation ${sourceObjectId}`}`,
      sourceUrl: banc.rights.sourceUrl, context: { ...banc.biologicalScope, scope: "comparative_fly_vnc", license: banc.rights.license },
      coordinateFrame: { frame: banc.skeleton.coordinates.frame, unit: banc.skeleton.coordinates.unit, unitStatus: "source_reported", dimensions: 3 },
      components: [...(objectKind === "neuron_root" ? [{ id: "swc-centerline", representation: "source_swc_centerline", authority: "OBS_SOURCE_SWC", evidenceState: "observed_source_object", dimensions: 3, fileId: "swc" }] : []),
        { id: "nucleus-point", representation: "annotation_point", authority: "OBS_SOURCE_NUCLEUS_ANNOTATION_POINT", evidenceState: "observed_source_object", dimensions: 3 }],
      relationships: [bancRelation], files: [...(objectKind === "neuron_root" ? [fileReceipt("swc", banc.skeleton, { path: banc.skeleton.publicUrl, role: "geometry", requiredForDisplay: true })] : []), annotationFile],
      counts: [count(1, objectKind === "neuron_root" ? "neuron_roots" : "nucleus_annotation_points", `${identity.sourceId}/v888/${objectKind}`, `${bancLocator}#identity`)],
      structureCoverage: coverage(bancLocator, {
        cell_geometry: objectKind === "neuron_root" ? observed("Source SWC centerline; type 2 is uninterpreted, radius values do not create a surface.") : unavailable("Nucleus annotation point only; parent skeleton is a separate root record."),
        cell_boundary: unavailable("No cell surface or membrane segmentation is admitted."), nucleus: observed("Same-root annotation point only; no nucleus mesh, boundary or volume."),
        organelles: { status: "source_reported", detail: "Source metadata reports 31 mitochondria; no per-object coordinates or geometry are admitted." },
        synaptic_structures: unavailable("No exact same-root synaptic display objects are admitted."), source_frame: observed("Source-native nanometres; nucleus source voxels use the explicit 4 × 4 × 45 nm scale."),
        reconstruction_completeness: unestablished("Whole-neuron completeness is not certified by this admitted skeleton / point route."),
        relationships: { status: "source_reported", detail: "One exact somas_v1.parquet root-to-nucleus join; no mouse, homology or atlas registration." },
      }), viewer: { kind }, sourceContract: banc,
    }));
  }

  const palm = superClemReference;
  const micro = microStructFormerReference;
  check(Number.isSafeInteger(palm.acquisition.matRowsByColumns[1]) && palm.acquisition.matRowsByColumns[1] > 0, "Invalid PALM source column range");
  check(Object.values(micro.datasetRelease.splitCounts).reduce((sum, value) => sum + value, 0) === micro.datasetRelease.rowCount, "MicroStructFormer source split denominator mismatch");
  const collections = [
    { sourceId: INDEPENDENT_SOURCE_IDS.palm, registryId: "super-clem-palm-localization-reference-0.1", releaseId: palm.source.datasetDoi,
      objectKind: "localization_detection", count: palm.acquisition.matRowsByColumns[1], source: palm },
    ...Object.entries(micro.datasetRelease.splitCounts).map(([split, size]) => ({ sourceId: INDEPENDENT_SOURCE_IDS.microStructFormer,
      registryId: micro.contractId, releaseId: micro.datasetRelease.revisionSha, objectKind: "image_mask_row", split, count: size, source: micro })),
  ];
  const sources = [
    { id: INDEPENDENT_SOURCE_IDS.nativeContours, name: "Native contours", counts: [count(catalog.records.length, "native_contour_records", nativeRelease, "merged native-contour catalog"), count(catalog.summary.admittedContourObjectCount, "contours", nativeRelease, "catalog.summary")] },
    { id: INDEPENDENT_SOURCE_IDS.microns, name: "MICrONS Phase 1", counts: [count(1, "cell_roots", `MICrONS/${micronsRelease}`, "exact source root"), count(1, "nuclei", `MICrONS/${micronsRelease}`, "exact soma-valence row")] },
    { id: INDEPENDENT_SOURCE_IDS.banc, name: "BANC v888", counts: [count(1, "neuron_roots", "BANC/v888", "exact source root"), count(1, "nucleus_annotation_points", "BANC/v888", "exact source root/nucleus row")] },
    { id: INDEPENDENT_SOURCE_IDS.palm, name: "Super-CLEM PALM", counts: [count(palm.acquisition.matRowsByColumns[1], "localization_detections", palm.acquisition.imageId, "source MAT columns; not unique molecules or cells")] },
    { id: INDEPENDENT_SOURCE_IDS.microStructFormer, name: "MicroStructFormer", counts: [count(micro.datasetRelease.rowCount, "image_mask_rows", micro.datasetRelease.revisionSha, "dataset split counts; not unique cells")] },
  ];
  for (const source of sources) {
    source.sourceId = source.id;
    source.label = source.name;
    source.releaseId = fixedRecords.find((item) => item.sourceId === source.id)?.releaseId ?? collections.find((item) => item.sourceId === source.id)?.releaseId;
    source.objectCount = fixedRecords.filter((item) => item.sourceId === source.id).length + collections.filter((item) => item.sourceId === source.id).reduce((sum, item) => sum + item.count, 0);
    source.unit = "indexed_entries";
    source.scope = "Independent source/version; use counts for the source-specific scientific units.";
  }
  return immutable({ contractId: "independent-source-objects-1.0", sources, fixedRecords, collections });
}

function collectionRecord(collection, index) {
  const source = collection.source;
  if (collection.objectKind === "localization_detection") {
    const sourceObjectId = `${source.acquisition.imageId}:column:${index + 1}`;
    const identity = { sourceId: collection.sourceId, registryId: collection.registryId, releaseId: collection.releaseId, objectKind: collection.objectKind, sourceObjectId };
    const locator = `${source.source.sourcePath}#matrice_results/column=${index + 1}`;
    return record(identity, {
      title: `PALM ${source.acquisition.imageId} · detection column ${index + 1}`, sourceUrl: `https://doi.org/${source.source.datasetDoi}`,
      context: { acquisitionId: source.acquisition.imageId, animalId: source.acquisition.animalId, region: source.acquisition.region,
        age: source.acquisition.ageSourceLabel, scope: "acquisition_local_detection", license: source.source.license, parentNeuronIdentity: "not_established" },
      coordinateFrame: { frame: `PALM/${source.acquisition.imageId}/MAT-native-XY`, unit: null, unitStatus: "not_established", dimensions: 2, origin: "not_established", axisOrientation: "not_established" },
      components: [{ id: "localization-point", representation: "source_native_2d_detection_point", dimensions: 2, authority: "OBS_MAT_LOCALIZATION_DETECTION", evidenceState: "observed_source_object" }],
      relationships: [], files: [fileReceipt("source-mat", { path: source.source.sourcePath, bytes: source.source.fileBytes, sha256: source.source.fileSha256 }),
        fileReceipt("palm-points", { path: source.pointDataUrl, bytes: 1562267, sha256: source.pointPayloadSha256 }, { role: "geometry", requiredForDisplay: true })],
      counts: [count(1, "localization_detections", `${collection.releaseId}/${source.acquisition.imageId}`, locator)],
      structureCoverage: coverage(locator, {
        receptor_distribution: observed("One source matrix detection column. A detection is not a unique molecule, receptor cluster, cell or reconstructed structure."),
        cell_geometry: unavailable("No parent cell reconstruction is admitted."), cell_boundary: unavailable("No cell boundary is admitted."), nucleus: unavailable("No linked nucleus is admitted."),
        source_frame: unestablished("Exact 2D source XY values; physical unit, origin, axis orientation, drift correction and elapsed-time calibration are not established."),
        relationships: unestablished("No detection-to-cluster, neuron, atlas-cell or BP057 EM acquisition identity crosswalk."),
        reconstruction_completeness: unestablished("A source localization column does not establish a biological reconstruction domain."),
      }), viewer: { kind: "palm_detection", detectionIndex: index, sourceMatrixColumn: index + 1 }, sourceContract: source,
    });
  }
  const sourceObjectId = `${collection.split}:row:${index}`;
  const identity = { sourceId: collection.sourceId, registryId: collection.registryId, releaseId: collection.releaseId, objectKind: collection.objectKind, sourceObjectId };
  const releaseUrl = `https://huggingface.co/datasets/${source.datasetRelease.repository}/tree/${collection.releaseId}`;
  const externalRowViewerUrl = `https://huggingface.co/datasets/${source.datasetRelease.repository}/viewer/default/${collection.split}?row=${index}`;
  const locator = `${releaseUrl} · split ${collection.split} · row ${index}`;
  return record(identity, {
    title: `MicroStructFormer · ${collection.split} image/mask row ${index}`, sourceUrl: releaseUrl,
    context: { repository: source.datasetRelease.repository, split: collection.split, rowIndex: index, scope: "release_split_image_mask_row",
      license: source.modelAndLicense.datasetLicense, cellIdentity: "not_established", externalRowViewerUrl,
      externalRowViewerRevisionStatus: "Live viewer revision is not verified as the requested release; the primary source link pins the repository commit." },
    coordinateFrame: { frame: `${collection.releaseId}/${collection.split}/row/${index}/image-pixel`, unit: "pixel", unitStatus: "source_reported", dimensions: 2, physicalScale: "not_established" },
    components: [{ id: "image", representation: "source_2d_image_external", dimensions: 2, authority: "SOURCE_DATASET_ROW", evidenceState: "rights_held" },
      { id: "semantic-mask", representation: "source_2d_semantic_mask_external", dimensions: 2, authority: "SOURCE_DATASET_ROW", evidenceState: "rights_held" }],
    relationships: [], files: [], counts: [count(1, "image_mask_rows", `${collection.releaseId}/${collection.split}`, locator)],
    structureCoverage: coverage(locator, {
      cell_geometry: unestablished("Split-and-row-index identity only; no neuron, animal, section or per-cell object ID is exposed."),
      cell_boundary: { status: "rights_held", detail: "External image/mask pair remains link-only under the dataset license; no mask bytes or geometry are admitted." },
      organelles: { status: "source_level_only", detail: "Source semantic classes include mitochondria and related classes; this row has no admitted class-instance geometry or parent cell." },
      nucleus: unavailable("No exact nucleus object is admitted."), source_frame: { status: "source_reported", detail: "2D image pixel frame only; physical scale and serial z-stack are not established. Preview dimensions apply only to the documented preview row." },
      relationships: unestablished("No unique-cell, same-cell internal-object, serial-section or atlas identity link is exposed."),
      reconstruction_completeness: unestablished("An external image/mask row does not establish a reconstructed neuron or volume."),
    }), viewer: { kind: "link_only" }, sourceContract: source,
  });
}

export function findIndependentSourceObject(index, key) {
  const identity = parseIndependentSourceObjectKey(key);
  if (!identity || !Array.isArray(index?.fixedRecords) || !Array.isArray(index?.collections)) return null;
  const fixed = index.fixedRecords.find((item) => item.key === key);
  if (fixed) return fixed;
  for (const collection of index.collections) {
    if (collection.sourceId !== identity.sourceId || collection.releaseId !== identity.releaseId || collection.objectKind !== identity.objectKind) continue;
    const prefix = collection.objectKind === "localization_detection" ? `${collection.source.acquisition.imageId}:column:` : `${collection.split}:row:`;
    if (!identity.sourceObjectId.startsWith(prefix)) continue;
    const rawIndex = identity.sourceObjectId.slice(prefix.length);
    if (!/^(0|[1-9]\d*)$/.test(rawIndex)) continue;
    const objectIndex = Number(rawIndex) - (collection.objectKind === "localization_detection" ? 1 : 0);
    if (!Number.isSafeInteger(objectIndex) || objectIndex < 0 || objectIndex >= collection.count) continue;
    const result = collectionRecord(collection, objectIndex);
    if (result.key === key) return result;
  }
  return null;
}

export function listIndependentSourceObjects(index, { sourceId, query = "", offset = 0, limit = 50 } = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 200) throw new TypeError("Object paging requires non-negative offset and limit 1–200");
  if (!index.sources.some((source) => source.id === sourceId)) return { records: [], total: 0, offset, limit };
  const needle = String(query).trim().toLocaleLowerCase("en-US");
  const records = [];
  let total = 0;
  const collect = (item) => {
    if (needle && !`${item.title} ${item.sourceObjectId} ${item.releaseId}`.toLocaleLowerCase("en-US").includes(needle)) return;
    if (total >= offset && records.length < limit) records.push(item);
    total += 1;
  };
  index.fixedRecords.filter((item) => item.sourceId === sourceId).forEach(collect);
  for (const collection of index.collections.filter((item) => item.sourceId === sourceId)) {
    // Search the short identity/title before constructing detailed records.
    for (let objectIndex = 0; objectIndex < collection.count; objectIndex += 1) {
      const candidate = collection.objectKind === "localization_detection"
        ? `${collection.source.acquisition.imageId}:column:${objectIndex + 1} PALM ${collection.source.acquisition.imageId} · detection column ${objectIndex + 1}`
        : `${collection.split}:row:${objectIndex} MicroStructFormer · ${collection.split} image/mask row ${objectIndex}`;
      if (needle && !`${candidate} ${collection.releaseId}`.toLocaleLowerCase("en-US").includes(needle)) continue;
      if (total >= offset && records.length < limit) records.push(collectionRecord(collection, objectIndex));
      total += 1;
    }
  }
  return { records, total, offset, limit };
}

export function exportIndependentSourceObject(object, receipt = null) {
  check(object?.key === independentSourceObjectKey(object), "Cannot export an inconsistent independent object identity");
  check(receipt === null || receipt.objectKey === object.key, "Receipt belongs to a different independent source object");
  const exported = Object.fromEntries(Object.entries(object).filter(([key]) => !["admission", "sourceContract", "derivedSurfaceContract"].includes(key)));
  return { documentType: "independent_source_object_receipt", schemaVersion: "1.0.0", object: exported, runtimeReceipt: receipt,
    boundary: "Source and version scoped object; counts retain their own units and scope. Missing geometry does not establish biological absence." };
}
