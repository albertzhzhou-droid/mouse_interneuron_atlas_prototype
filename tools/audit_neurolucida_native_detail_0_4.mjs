#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { NATIVE_DETAIL_04_RECORDS, NATIVE_DETAIL_04_PARSER } from "../app/neurolucida-native-detail-records.js";
import { extractNativeDatContours } from "./neurolucida-native-contour-reader.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const check = (condition, message) => { if (!condition) throw new Error(message); };

export async function auditNativeDetail04(parserDirectory) {
  const [library, parserSource] = await Promise.all(["swcPlus_typeLibrary.js", "morphology_parser.js"].map((name) => readFile(path.join(parserDirectory, name), "utf8")));
  check(digest(library) === NATIVE_DETAIL_04_PARSER.typeLibrarySha256 && digest(parserSource) === NATIVE_DETAIL_04_PARSER.parserSha256, "Independent parser bytes do not match the pinned commit");
  const records = [];
  for (const record of NATIVE_DETAIL_04_RECORDS) {
    const bytes = await readFile(path.join(ROOT, record.sourcePath));
    check(bytes.byteLength === record.sourceBytes && digest(bytes) === record.sourceSha256, "Candidate source DAT checksum mismatch");
    const diagnosticLog = [];
    const context = vm.createContext({ console: { log: (...args) => diagnosticLog.push(args.join(" ")) }, TextDecoder, TextEncoder, DataView, Uint8Array, Float32Array, Uint32Array, Uint16Array, ArrayBuffer });
    vm.runInContext(`${library}\n${parserSource}`, context, { timeout: 10000 });
    const parser = vm.runInContext("new neurolucida_class()", context);
    const inventory = {};
    for (const name of ["propertyListFromDAT", "thumbnailFromDAT", "readContourFromDAT", "readMarkerFromDAT", "readTreeFromDAT", "readBranchFromDAT", "readSpineFromDAT", "readTextFromDAT"]) {
      inventory[name] = 0;
      const original = parser[name];
      parser[name] = function (...args) { inventory[name] += 1; return original.apply(this, args); };
    }
    parser.treeFromDAT(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), `nmo-${record.neuronId}.dat`);
    check(JSON.stringify(diagnosticLog) === JSON.stringify(["Neurolucida.DAT: ignoring thumbnail"]), "Independent parser emitted an unexpected diagnostic");
    const somaTypes = parser.getCustomTypes().somaContour;
    const somaIds = new Set((Array.isArray(somaTypes) ? somaTypes : [somaTypes]).map((type) => type.id));
    const contours = [];
    for (let index = 1; index < parser.line$.nR; index += 1) {
      const [typeId, start, count] = parser.line$.row(index);
      if (!somaIds.has(typeId)) continue;
      const properties = parser.objectProperties[start];
      const points = Array.from({ length: count }, (_, offset) => Array.from(parser.point$.row(start + offset)));
      contours.push({ sourceName: properties.name, sourceClosedFlag: properties.closed, cellBodyPresence: properties.CellBody, points });
    }
    const cleanRoom = extractNativeDatContours(bytes);
    check(contours.length === 12 && cleanRoom.length === inventory.readContourFromDAT && cleanRoom.length === contours.length, "Independent/full contour inventory disagrees");
    check(contours.every((contour) => contour.sourceName === record.contourName && contour.sourceClosedFlag === false && contour.cellBodyPresence === true), "Independent source semantics mismatch");
    check(JSON.stringify(contours.map((contour) => contour.points)) === JSON.stringify(cleanRoom.map((contour) => contour.points)), "Independent ordered coordinate arrays disagree");
    const pointPayloadSha256 = digest(JSON.stringify(contours.map((contour) => contour.points)));
    check(pointPayloadSha256 === record.pointSha256, "Independent source-point fingerprint drifted");
    records.push({ neuronId: record.neuronId, sourceSha256: record.sourceSha256,
      inventory, diagnosticLog, independentSomaContourCount: contours.length,
      vertexCount: contours.reduce((total, contour) => total + contour.points.length, 0),
      rawSourceClosedTrueCount: 0, rawSourceClosedFalseCount: contours.length,
      sourceContourNames: [record.contourName], exactOrderedPointArraysAgree: true, pointPayloadSha256,
      cellBodyPresenceCount: contours.length, sourcePropertyReceipts: cleanRoom.map((contour) => contour.sourcePropertyReceipts),
      coordinateTransformToStandardizedSwc: null, admittedNonSomaObjectCount: 0,
      excludedObjectInterpretation: "Tree, branch, spine-labelled and marker objects are audited counts only; they are not admitted native neurites, biological spines, synapses or organelles." });
  }
  return { documentType: "neurolucida_native_detail_independent_parser_audit", schemaVersion: "0.4.0", auditedDateUtc: "2026-09-22", parser: NATIVE_DETAIL_04_PARSER, records };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2];
  check(Boolean(directory), "Usage: audit_neurolucida_native_detail_0_4.mjs PINNED_PARSER_DIRECTORY [--write]");
  const audit = await auditNativeDetail04(directory);
  const bytes = Buffer.from(`${JSON.stringify(audit, null, 2)}\n`);
  const target = path.join(ROOT, "data/neurolucida-native-detail-independent-audit-0.4.json");
  if (process.argv.includes("--write")) await writeFile(target, bytes);
  else check(bytes.equals(await readFile(target)), "Independent audit receipt changed");
  console.log(JSON.stringify({ records: audit.records.map((record) => ({ neuronId: record.neuronId, contours: record.independentSomaContourCount, vertices: record.vertexCount })), bytes: bytes.byteLength, sha256: digest(bytes) }));
}
