#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { extractNativeDatContours } from "./neurolucida-native-contour-reader.mjs";
import { NATIVE_DETAIL_04_RECORDS, NATIVE_DETAIL_04_PARENT, NATIVE_DETAIL_04_PARSER } from "../app/neurolucida-native-detail-records.js";
import { NATIVE_DETAIL_04_AUDIT, NATIVE_DETAIL_04_MBF_URL, NATIVE_DETAIL_04_ZERO_FIELDS, NATIVE_DETAIL_04_FORBIDDEN, validateNativeDetail04Delta } from "../app/neurolucida-native-detail-admission.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILDER = "tools/build_neurolucida_native_contour_admission_catalog_0_4.mjs";
const READER = "tools/neurolucida-native-contour-reader.mjs";
export const NATIVE_DETAIL_04_CATALOG_PATH = "data/neurolucida-native-contour-admission-catalog-0.4.json";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
function check(condition, message) { if (!condition) throw new Error(message); }
async function receipt(projectPath) { const bytes = await readFile(path.join(ROOT, projectPath)); return { path: projectPath, bytes: bytes.length, sha256: sha256(bytes) }; }
async function pinned(projectPath, expectedBytes, expectedHash) {
  const bytes = await readFile(path.join(ROOT, projectPath));
  check(bytes.length === expectedBytes && sha256(bytes) === expectedHash, `Pinned input changed: ${projectPath}`);
  return bytes;
}

export async function buildNeurolucidaNativeContourAdmissionCatalog04() {
  const [baseBytes, auditBytes, builderReceipt, readerReceipt] = await Promise.all([
    pinned(NATIVE_DETAIL_04_PARENT.path, NATIVE_DETAIL_04_PARENT.bytes, NATIVE_DETAIL_04_PARENT.sha256),
    pinned(NATIVE_DETAIL_04_AUDIT.path, NATIVE_DETAIL_04_AUDIT.bytes, NATIVE_DETAIL_04_AUDIT.sha256), receipt(BUILDER), receipt(READER),
  ]);
  const base = JSON.parse(baseBytes);
  const independentAudit = JSON.parse(auditBytes);
  check(JSON.stringify(independentAudit.parser) === JSON.stringify(NATIVE_DETAIL_04_PARSER), "Independent parser receipt changed");
  const geometries = [];
  const addedRecords = [];
  for (const expected of NATIVE_DETAIL_04_RECORDS) {
    const [sourceBytes, apiBytes] = await Promise.all([pinned(expected.sourcePath, expected.sourceBytes, expected.sourceSha256), pinned(expected.apiPath, expected.apiBytes, expected.apiSha256)]);
    const metadata = JSON.parse(apiBytes);
    check(metadata.neuron_id === expected.neuronId && metadata.neuron_name === expected.sourceName && metadata.archive === "Todd" && metadata.species === "mouse" && metadata.reference_doi.includes(expected.doi), `NMO ${expected.neuronId} API identity mismatch`);
    const sourceContours = extractNativeDatContours(sourceBytes);
    const audit = independentAudit.records.find((record) => record.neuronId === expected.neuronId);
    const pointHash = sha256(JSON.stringify(sourceContours.map((contour) => contour.points)));
    check(sourceContours.length === 12 && pointHash === expected.pointSha256 && audit?.pointPayloadSha256 === pointHash && audit.exactOrderedPointArraysAgree === true && audit.independentSomaContourCount === 12, `NMO ${expected.neuronId} independent contour array audit failed`);
    check(sourceContours.every((contour) => contour.sourceName === expected.contourName && contour.sourceClosedFlag === false && contour.sourceProperties.CellBody === true && JSON.stringify(contour.sourcePropertyReceipts) === '[{"key":"CellBody","declaredValueCount":0,"values":[]}]'), `NMO ${expected.neuronId} exact name/property/raw flag evidence failed`);
    const source = { projectPath: expected.sourcePath, storage: "project_source_only", bytes: expected.sourceBytes, sha256: expected.sourceSha256, officialRecordUrl: `https://neuromorpho.org/api/neuron/id/${expected.neuronId}`, originalDatUrl: expected.originalDatUrl, sourcePaperDoi: expected.doi, rights: "CC BY 4.0; cite original paper, NeuroMorpho.Org RRID:SCR_002145 and Tecuatl et al. 2024 (10.1096/fba.2024-00048)", rightsUrl: "https://neuromorpho.org/useterm.jsp" };
    const hardBoundaries = ["Raw sourceClosedFlag=false is preserved. Only the exact named, presence-tagged, independently classified source objects receive the MBF cell-body closure interpretation.", "Ordered line loops only; no filled polygon, loft, surface, membrane, volume, organelle, biological measurement, standardized SWC overlay, same-cell molecular join or atlas registration is admitted.", "Other DAT tree, branch, spine-labelled and marker objects are excluded; handler counts do not establish biological spines or synapses.", expected.interpretationBoundary];
    const geometry = {
      documentType: "neurolucida_source_native_mbf_cell_body_line_loop_geometry", schemaVersion: "0.4.0", releaseId: "ohri-neurolucida-native-contour-admission-catalog-0.4.0", assetId: `NeuroMorpho:${expected.neuronId}`,
      sourceFrame: "Neurolucida_DAT_source_native_unregistered", units: "micrometre_interpreted_from_Neurolucida_semantics", registrationStatus: "unregistered", source,
      extraction: { builder: builderReceipt, reader: readerReceipt, independentAudit: { receipt: NATIVE_DETAIL_04_AUDIT, parser: NATIVE_DETAIL_04_PARSER, exactSomaContourClassificationCount: 12, exactPointArraysAgree: true, exactPointPayloadSha256: pointHash } },
      closureInterpretation: { exactSourceName: expected.contourName, rawSourceClosedFlagPreserved: true, rawSourceClosedFlagValue: false, interpretedClosed: true, requiredPresenceProperty: { key: "CellBody", declaredValueCount: 0, rawValues: [], interpretedPresence: true }, independentParserClassification: "somaContour", mbfDocumentationUrl: NATIVE_DETAIL_04_MBF_URL, scope: "File-specific soma cross-section line closure only; source name drives independent soma classification and the empty-value property is a separate evidence gate." },
      summary: { vertexCount: expected.vertexCount, sourceSomaContourObjectCount: 12, admittedMbfCellBodyContourObjectCount: 12, rawSourceClosedTrueContourObjectCount: 0, rawSourceClosedFalseContourObjectCount: 12, semanticClosedSegmentCount: expected.vertexCount, pointPayloadSha256: pointHash, ...Object.fromEntries(NATIVE_DETAIL_04_ZERO_FIELDS.map((field) => [field, 0])) },
      excludedSourceObjectInventory: audit.inventory,
      displayContract: { admittedPrimitive: "source-native MBF cell-body ordered LineLoop only", preserveSourceCoordinates: true, preserveSourcePointOrder: true, preserveDuplicateZPlanesAsSeparateObjects: true, preserveRawSourceClosedFlag: true, closeLastToFirstByMbfCellBodySemantics: true, traceRadiusRenderingUse: "forbidden", nativeDrawingWidthAuthorizesSwcDiameter: false, biologicalMeasurementUse: "not_authorized", forbiddenInferences: NATIVE_DETAIL_04_FORBIDDEN },
      contours: sourceContours.map((contour, index) => ({ ...contour, id: `nmo-${expected.neuronId}-native-contour-${index + 1}`, cellBodyPresenceProperty: { key: "CellBody", declaredValueCount: 0, rawValues: [], interpretedPresence: true }, independentParserClassification: "somaContour", semanticClass: "soma_contour_trace", interpretedClosed: true, closureBasis: "MBF cell-body semantics applied to exact source name + empty-value CellBody property + independent somaContour; raw sourceClosedFlag remains false", semanticSegmentCount: contour.vertexCount })),
    };
    const geometryBytes = jsonBytes(geometry);
    const record = {
      neuronId: expected.neuronId, assetId: `NeuroMorpho:${expected.neuronId}`, title: expected.title, admissionStatus: "admitted_mbf_cell_body_semantic_rule", source,
      apiReceipt: { projectPath: expected.apiPath, bytes: expected.apiBytes, sha256: expected.apiSha256 },
      sourceEvidence: { sourceName: metadata.neuron_name, archive: metadata.archive, species: metadata.species, cellType: metadata.cell_type, strain: metadata.strain, lifeStage: metadata.age_classification, ageScale: metadata.age_scale, minAge: metadata.min_age, maxAge: metadata.max_age, domain: metadata.domain, physicalIntegrity: metadata.physical_Integrity, attributes: metadata.attributes, standardizedSwcDiameterAvailable: expected.swcDiameterAvailable, nativeDrawingWidthAuthorizesSwcDiameter: false },
      derivedObject: { path: expected.outputPath.replace(/^public/, ""), bytes: geometryBytes.length, sha256: sha256(geometryBytes), documentType: geometry.documentType, authority: "OBS_SOURCE_NATIVE_MBF_CELL_BODY_LINE_LOOP" },
      audit: { exactSourceContourObjectCount: 12, somaNamedContourObjectCount: 12, somaNamedVertexCount: expected.vertexCount, somaNamedVertexCountsInSourceOrder: expected.vertexVector, somaNamedZInSourceOrderMicrometre: expected.zVector, somaNamedPointPayloadSha256: pointHash, sourceClosedSomaNamedContourCount: 0, sourceOpenSomaNamedContourCount: 12, emptyValueCellBodyPresencePropertyCount: 12, independentParserSomaContourCount: 12, independentParserClassification: "somaContour", auxiliaryTraceObjectCount: 0, auxiliaryTraceVertexCount: 0, fullObjectInventory: audit.inventory, independentPointArraysAgree: true },
      admission: { admittedContourObjectCount: 12, admittedVertexCount: expected.vertexCount, renderedPrimitiveCount: 12, reason: `Twelve exact ${expected.contourName} objects pass DAT checksum, raw flag, empty-value CellBody presence, independent somaContour and MBF closure gates. Non-soma objects remain excluded.` },
      viewer: { primaryLabel: "12 MBF cell-body line loops", secondaryLabel: null, primarySourceNames: [expected.contourName], secondarySourceNames: [] },
      sourceLinks: { officialRecord: source.officialRecordUrl, originalDat: source.originalDatUrl, primaryPaper: `https://doi.org/${expected.doi}`, converterRepository: NATIVE_DETAIL_04_PARSER.repository, mbfCellBodySemantics: NATIVE_DETAIL_04_MBF_URL, rights: source.rightsUrl }, hardBoundaries,
    };
    addedRecords.push(record); geometries.push({ projectPath: expected.outputPath, geometry, geometryBytes, record });
  }
  const catalog = {
    documentType: "neurolucida_native_contour_admission_delta", schemaVersion: "0.4.0", contractId: "neurolucida-native-contour-admission-catalog-0.4", releaseId: "ohri-neurolucida-native-contour-admission-catalog-0.4.0", createdDateUtc: "2026-09-22", baseCatalog: NATIVE_DETAIL_04_PARENT, independentAudit: NATIVE_DETAIL_04_AUDIT, parserAudit: NATIVE_DETAIL_04_PARSER,
    mbfCellBodySemantics: { documentationUrl: NATIVE_DETAIL_04_MBF_URL, sourceStatement: "Cell bodies are always closed shapes.", rawFalseFlagsPreserved: true, admissionScope: "Only the two checksum-pinned DAT files and their exact named, CellBody-tagged somaContour objects; no generic name, property-only or false-flag admission rule." },
    addedSummary: { admittedRecordCount: 2, admittedContourObjectCount: 24, admittedVertexCount: 2770, admittedRenderedPrimitiveCount: 24 },
    summary: { ...base.summary, auditedDatFileCount: 7, admittedRecordCount: 7, admittedContourObjectCount: 72, admittedVertexCount: 5149, admittedRenderedPrimitiveCount: 72, toddAdmittedRecordCount: 5, toddAdmittedContourObjectCount: 57, toddAdmittedVertexCount: 4674 },
    relationshipBoundary: base.relationshipBoundary, addedRecords,
  };
  validateNativeDetail04Delta(catalog);
  return { catalog, catalogBytes: jsonBytes(catalog), geometries };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildNeurolucidaNativeContourAdmissionCatalog04();
  if (process.argv.includes("--write")) {
    for (const item of result.geometries) { await mkdir(path.dirname(path.join(ROOT, item.projectPath)), { recursive: true }); await writeFile(path.join(ROOT, item.projectPath), item.geometryBytes); }
    await writeFile(path.join(ROOT, NATIVE_DETAIL_04_CATALOG_PATH), result.catalogBytes);
  }
  console.log(JSON.stringify({ catalog: { path: NATIVE_DETAIL_04_CATALOG_PATH, bytes: result.catalogBytes.length, sha256: sha256(result.catalogBytes) }, addedSummary: result.catalog.addedSummary, geometries: result.geometries.map(({ record }) => ({ neuronId: record.neuronId, ...record.derivedObject })) }, null, 2));
}
