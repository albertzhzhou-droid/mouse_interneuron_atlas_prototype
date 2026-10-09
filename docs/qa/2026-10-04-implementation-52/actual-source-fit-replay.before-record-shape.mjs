/**
 * Replays captured DOM view documents against exact current files and private
 * source producers. Projection checks use those captured cameras, not a newly
 * computed fit and not a synthetic view document. No WebGL/pixel claim is made.
 *
 * node docs/qa/2026-10-04-implementation-52/actual-source-fit-replay.mjs \
 *   --verification-root /private/tmp/ohri-i51-verification \
 *   --out docs/qa/2026-10-04-implementation-52/actual-source-fit-replay.json
 *
 * --root and --receipt-dir override the original tree and capture directory.
 * --restore-pair saved.json:restored.json and --resize-pair before.json:after.json
 * may be repeated when names alone leave multiple possible pairings.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const TOLERANCE = 1e-8;
const PROJECTION_TOLERANCE = 1e-7;
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b)
  && Math.abs(a - b) <= Math.max(TOLERANCE, Math.abs(b) * TOLERANCE);

function argumentsFor(args) {
  const options = { root: path.resolve(SCRIPT_DIRECTORY, "../../.."), receiptDir: SCRIPT_DIRECTORY,
    verificationRoot: null, out: null, restorePairs: [], resizePairs: [] };
  const values = new Map([["--root", "root"], ["--receipt-dir", "receiptDir"],
    ["--verification-root", "verificationRoot"], ["--out", "out"]]);
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--help") { options.help = true; continue; }
    assert.ok(values.has(argument) || ["--restore-pair", "--resize-pair"].includes(argument), `Unknown option ${argument}`);
    const value = args[++index]; assert.ok(value && !value.startsWith("--"), `${argument} requires a value`);
    if (values.has(argument)) options[values.get(argument)] = path.resolve(value);
    else {
      const names = value.split(":");
      assert.equal(names.length, 2, `${argument} requires filename.json:filename.json`);
      assert.ok(names.every(name => name === path.basename(name) && /^actual-main-view-.+\.json$/.test(name)), "Pair names must identify captures in the receipt directory");
      options[argument === "--restore-pair" ? "restorePairs" : "resizePairs"].push(names);
    }
  }
  options.verificationRoot ??= options.root;
  return options;
}

function stableBytes(filename) {
  const before = fs.statSync(filename), bytes = fs.readFileSync(filename), after = fs.statSync(filename);
  assert.equal(before.size, after.size, `${filename}: size changed during read`);
  assert.equal(before.mtimeMs, after.mtimeMs, `${filename}: timestamp changed during read`);
  assert.equal(bytes.length, after.size, `${filename}: incomplete read`);
  return bytes;
}
function jsonAt(root, relative) { return JSON.parse(stableBytes(path.join(root, relative))); }
function safeRelative(relative) {
  assert.ok(typeof relative === "string" && relative.length > 0 && !path.isAbsolute(relative)
    && relative.split(/[\\/]/).every(part => part !== ".." && part !== ""), `Unsupported file path ${relative}`);
  return relative;
}
function checkFile(root, relative, expected) {
  const bytes = stableBytes(path.join(root, safeRelative(relative)));
  assert.equal(bytes.length, expected.bytes, `${relative}: byte count drift`);
  assert.equal(digest(bytes), expected.sha256, `${relative}: SHA-256 drift`);
}
function canonicalAuxiliary(proof) { const copy = { ...proof }; delete copy.verificationSequence; return copy; }
function poseEqual(first, second) {
  const omitAspect = value => { const camera = structuredClone(value); delete camera.aspect; return camera; };
  const compare = (a, b) => typeof a === "number" && typeof b === "number" ? close(a, b)
    : a && b && typeof a === "object" && typeof b === "object"
      ? Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.hasOwn(b, key) && compare(a[key], b[key])) : a === b;
  return compare(omitAspect(first), omitAspect(second));
}
function sameNumbers(first, second, label) {
  assert.equal(first.length, second.length, `${label}: vector shape changed`);
  assert.ok(first.every((value, axis) => close(value, second[axis])), `${label}: value drift`);
}
function filenameTokens(name) { return name.replace(/\.json$/, "").toLowerCase().split(/[-_]+/); }
function pairingKey(name) {
  const layout = new Set(["desktop", "narrow", "wide", "tall", "resize", "resized", "390", "1280", "restored", "restore"]);
  return filenameTokens(name).filter(token => !layout.has(token)).join("-");
}
function filenameKind(name) {
  const tokens = filenameTokens(name);
  if (tokens.includes("restored") || tokens.includes("restore")) return "restored";
  if (tokens.includes("inspection")) return "inspection";
  if (tokens.includes("user")) return "user";
  return tokens.find(token => ["default", "fit", "home"].includes(token)) ?? "other";
}

async function main() {
  const options = argumentsFor(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node actual-source-fit-replay.mjs [--root PATH] [--verification-root PATH] [--receipt-dir PATH] [--out PATH] [--restore-pair saved.json:restored.json] [--resize-pair before.json:after.json]");
    return;
  }
  const importFile = relative => import(pathToFileURL(path.join(options.verificationRoot, relative)).href);
  const [THREE, source, view, auxiliary, geometryTools, crosswalkTools] = await Promise.all([
    importFile("node_modules/three/build/three.module.js"), importFile("app/main-scene-morphology-verification.js"),
    importFile("app/main-scene-source-view.js"), importFile("app/main-scene-auxiliary-verification.js"),
    importFile("app/source-local-morphology-geometry.js"), importFile("app/neurolucida-dat-swc-crosswalk.js"),
  ]);
  const census = jsonAt(options.root, "data/neuromorpho-census-main-scene-index-0.1.json");
  const supplement = jsonAt(options.root, "data/supplementary-morphology-comparison-adapter-0.1.json");
  const todd = jsonAt(options.root, "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json");
  const pv = jsonAt(options.root, "data/pv-independent-morphology-routes-0.1.json");
  function recordFor(row, supplementary = false) {
    const metadata = supplementary ? row.normalizedMetadata : row.sourceMetadata;
    const counts = supplementary ? row.morphometrics.computed : row.geometry;
    const geometry = { ...row.geometry, geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL", sourceFrame: metadata.sourceFrame,
      dimensionality: metadata.dimensionality, sourceDiameterAvailable: metadata.sourceDiameterAvailable,
      nodeCount: counts.nodeCount, segmentCount: counts.segmentCount };
    return { neuronId: row.neuronId, assetId: row.assetId, geometry,
      axon: { sourceDomain: metadata.domain, sourceType2NodeCount: counts.nodeTypeCounts["2"] ?? 0, completeAxon: false },
      modes: { observedSwc: { available: true }, radiusSurface: { available: geometry.dimensionality === "3D" && geometry.sourceDiameterAvailable }, internalStructure: { available: false } } };
  }
  const records = [...census.records.map(row => recordFor(row)), ...supplement.records.map(row => recordFor(row, true)),
    ...todd.routes.map(row => row.fidelityRecord), ...pv.routes.map(row => row.fidelityRecord)];
  assert.equal(records.length, 181, "Expected the current exact 142 + 7 + 30 + 2 source roster");
  assert.equal(new Set(records.map(record => record.neuronId)).size, 181, "Duplicate exact source identity");
  const recordMap = new Map(records.map(record => [record.neuronId, record]));
  const actualFetch = async (url, request) => {
    assert.equal(request.cache, "no-store", `Fresh private source read required: ${url}`);
    const bytes = stableBytes(path.join(options.root, safeRelative(`public${url}`)));
    return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  };
  const filenames = fs.readdirSync(options.receiptDir).filter(name => /^actual-main-view-.+\.json$/.test(name)).sort();
  assert.ok(filenames.length > 0, "No actual-main-view-*.json captures are present; capture the current browser views first");
  const output = { scope: "independent current-file/private-producer replay and source-buffer projection into actual captured DOM cameras",
    root: options.root, verificationRoot: options.verificationRoot, receiptDirectory: options.receiptDir,
    rendererRevision: THREE.REVISION, currentRosterCount: records.length,
    projectionTolerance: PROJECTION_TOLERANCE, pixelComparisonPerformed: false,
    reconstructionCompleteBiologicalCellClaim: false, registrationCount: 0,
    inputFileComparisonCount: 0, buildPinChecks: 0, geometryChecks: 0, auxiliaryFileChecks: 0,
    fitReceiptsChecked: 0, receipts: [], restorePairs: [], resizePairs: [], unpairedProtectedViews: [], errors: [], mismatchCount: 0 };
  const documents = new Map(), successful = new Set();
  const colors = { 1: 0xffffff, 2: 0xaaaaaa, 3: 0x88bb99, 4: 0x77cc88, unknown: 0xccbb99 };
  function stats() { return { total: 0, cropped: 0, outsideXY: 0, outsideDepth: 0, nonFinite: 0, maximumAbsoluteNdc: [0, 0, 0] }; }
  function projectPoint(point, camera, result) {
    const values = point.clone().project(camera).toArray(); result.total++;
    if (!values.every(Number.isFinite)) { result.nonFinite++; result.cropped++; return; }
    const xy = Math.abs(values[0]) > 1 + PROJECTION_TOLERANCE || Math.abs(values[1]) > 1 + PROJECTION_TOLERANCE;
    const depth = Math.abs(values[2]) > 1 + PROJECTION_TOLERANCE;
    if (xy) result.outsideXY++; if (depth) result.outsideDepth++; if (xy || depth) result.cropped++;
    values.forEach((value, axis) => { result.maximumAbsoluteNdc[axis] = Math.max(result.maximumAbsoluteNdc[axis], Math.abs(value)); });
  }
  function projectBox(box, camera) {
    const result = stats();
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z])
      projectPoint(new THREE.Vector3(x, y, z), camera, result);
    return result;
  }
  function projectBuffers(root, camera, predicate) {
    const result = stats(); root.updateMatrixWorld(true);
    root.traverse(object => {
      if (!predicate(object)) return;
      const positions = object.geometry?.getAttribute("position"); if (!positions) return;
      for (let index = 0; index < positions.count; index++)
        projectPoint(new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld), camera, result);
    });
    return result;
  }
  function compareFiles(relative, expected) {
    checkFile(options.root, relative, expected); output.inputFileComparisonCount++;
    if (options.verificationRoot !== options.root) { checkFile(options.verificationRoot, relative, expected); output.inputFileComparisonCount++; }
  }
  for (const name of filenames) {
    let root = null;
    try {
      const bytes = stableBytes(path.join(options.receiptDir, name)), document = JSON.parse(bytes);
      documents.set(name, document);
      const record = recordMap.get(document.source?.neuronId); assert.ok(record, `${name}: unknown source record`);
      const geometry = await source.readVerifiedMainSceneMorphology(record, { fetchImpl: actualFetch, forceReload: true });
      const privateProof = source.mainSceneMorphologyVerification(record, geometry);
      view.validateMainSceneSourceViewReplay(record, geometry, document, THREE.REVISION);
      for (const pin of document.rendererBuild.inputs) { compareFiles(pin.path, pin); output.buildPinChecks++; }
      compareFiles(`public${document.source.path}`, document.source); output.geometryChecks++;
      const tokens = [];
      for (const pin of document.auxiliaryAssets) {
        compareFiles(`public${pin.path}`, pin); output.auxiliaryFileChecks++;
        const token = await auxiliary.readVerifiedMainSceneAuxiliary(pin.path, { fetchImpl: actualFetch }); tokens.push(token);
        assert.deepEqual(canonicalAuxiliary(auxiliary.mainSceneAuxiliaryProof(token)), canonicalAuxiliary(pin), `${name}: current auxiliary proof mismatch`);
      }
      // Validate the original captured view against this independent producer;
      // the resulting descriptor is never labelled a newly observed WebGL view.
      view.captureMainSceneSourceView(record, geometry, document.view, tokens, THREE.REVISION);
      const saved = document.view.camera;
      const camera = new THREE.PerspectiveCamera(saved.fov, saved.aspect, saved.near, saved.far);
      camera.zoom = saved.zoom; camera.filmGauge = saved.filmGauge; camera.filmOffset = saved.filmOffset;
      camera.position.fromArray(saved.position); camera.up.fromArray(saved.up);
      camera.lookAt(new THREE.Vector3().fromArray(saved.target)); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
      const actualQuaternion = new THREE.Quaternion().fromArray(saved.quaternion);
      assert.ok(close(Math.abs(actualQuaternion.dot(camera.quaternion)), 1), `${name}: captured quaternion disagrees with camera pose`);
      root = new THREE.Group(); root.position.x = -4.4;
      const object = new THREE.Group(); root.add(object);
      object.add(geometryTools.createObservedSwcCenterlines(geometry, { colors }),
        geometryTools.createObservedTopologyLandmarks(geometry, { markerSizeViewer: 0.052 }));
      if (document.view.request.mode === "radius_surface") {
        assert.equal(record.modes.radiusSurface.available, true, `${name}: DER is not authorized`);
        object.add(geometryTools.createRadiusDerivedSurface(geometry, { colors, radialSegments: 6 }));
      }
      root.updateMatrixWorld(true);
      const sourceBounds = new THREE.Box3().setFromObject(object);
      sameNumbers(sourceBounds.min.toArray(), document.view.sourceObject.bounds.minimum, `${name} actual minimum bounds`);
      sameNumbers(sourceBounds.max.toArray(), document.view.sourceObject.bounds.maximum, `${name} actual maximum bounds`);
      sameNumbers(object.matrixWorld.toArray(), document.view.sourceObject.worldMatrix, `${name} actual source transform`);
      const sourceNodes = stats();
      for (const node of geometry.nodes) {
        const point = new THREE.Vector3(...node.slice(2, 5).map((value, axis) =>
          Math.fround((value - geometry.displayTransform.originMicrometre[axis]) * geometry.displayTransform.scaleViewerUnitPerMicrometre)));
        projectPoint(point.applyMatrix4(object.matrixWorld), camera, sourceNodes);
      }
      const projected = { sourceObjectBoundsCorners: projectBox(sourceBounds, camera), sourceNodes,
        centerlineBufferPositions: projectBuffers(root, camera, drawable => drawable.name.startsWith("observed-swc-source-type-")),
        derivedSurfaceBufferPositions: projectBuffers(root, camera, drawable => drawable.name.startsWith("radius-derived-source-type-")),
        topologyBufferPositions: projectBuffers(root, camera, drawable => drawable.userData.representation === geometryTools.TOPOLOGY_LANDMARK_REPRESENTATION),
        mappedDatVertices: stats(), unionBoundsCorners: null };
      assert.equal(projected.centerlineBufferPositions.total, geometry.segments.length * 2, `${name}: source-centerline buffer inventory mismatch`);
      assert.ok(projected.topologyBufferPositions.total > 0, `${name}: source topology markers were not projected`);
      if (document.view.request.mode === "radius_surface") assert.ok(projected.derivedSurfaceBufferPositions.total > 0, `${name}: DER mesh buffers were not projected`);
      const union = sourceBounds.clone();
      if (document.view.layers.datContours) {
        assert.equal(record.neuronId, 45718, `${name}: mapped DAT belongs only to exact NMO 45718`);
        const contourPath = `/${crosswalkTools.NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS.nativeContours.path.replace(/^public\//, "")}`;
        const standardizedPath = `/${crosswalkTools.NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS.standardizedGeometry.path.replace(/^public\//, "")}`;
        const tokenFor = assetPath => tokens.find(token => token.path === assetPath);
        assert.ok(tokenFor(contourPath) && tokenFor(standardizedPath), `${name}: missing mapped DAT private source assets`);
        const mapped = crosswalkTools.validateNmo45718DatSwcCrosswalk(jsonAt(options.root, "data/neurolucida-dat-swc-crosswalk-0.1.json"),
          auxiliary.mainSceneAuxiliaryJson(tokenFor(contourPath)), auxiliary.mainSceneAuxiliaryJson(tokenFor(standardizedPath)));
        const points = mapped.somaContours.flatMap(contour => contour.points.map(point =>
          new THREE.Vector3(...point.slice(0, 3).map((value, axis) =>
            Math.fround((value - geometry.displayTransform.originMicrometre[axis]) * geometry.displayTransform.scaleViewerUnitPerMicrometre)))
            .applyMatrix4(object.matrixWorld)));
        assert.equal(points.length, 252, `${name}: mapped DAT vertex inventory drift`);
        for (const point of points) { projectPoint(point, camera, projected.mappedDatVertices); union.expandByPoint(point); }
      }
      projected.unionBoundsCorners = projectBox(union, camera);
      const kind = filenameKind(name), fitRequired = ["default", "fit", "home"].includes(kind);
      if (fitRequired) {
        assert.equal(document.view.request.view, "cell_detail", `${name}: fit-labelled capture is outside the source-detail view`);
        assert.equal(document.view.layers.morphology, true, `${name}: fit-labelled source is hidden`);
        for (const [label, result] of Object.entries(projected)) assert.equal(result.cropped, 0, `${name}: ${label} is cropped in the actual captured fit`);
        output.fitReceiptsChecked++;
      }
      output.receipts.push({ file: name, bytes: bytes.length, sha256: digest(bytes), neuronId: record.neuronId, mode: document.view.request.mode,
        kind, completeFitRequired: fitRequired, completeFitProved: fitRequired, buildInputCount: document.rendererBuild.inputs.length,
        geometrySha256: document.source.sha256, auxiliaryAssetCount: tokens.length, cacheMode: document.geometryVerification.requestCacheMode,
        verifiedAt: document.geometryVerification.verifiedAt, mainSceneVerificationSequence: document.geometryVerification.mainSceneVerificationSequence,
        independentProducerSequence: privateProof.geometryVerification.mainSceneVerificationSequence,
        viewport: document.view.viewport, camera: document.view.camera, projection: projected });
      successful.add(name);
    } catch (error) { output.errors.push({ file: name, error: error instanceof Error ? error.message : String(error) }); }
    finally {
      root?.traverse(object => {
        object.geometry?.dispose();
        for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) material.dispose();
      });
    }
  }
  const automaticResize = [], automaticRestore = [];
  const successfulNames = filenames.filter(name => successful.has(name));
  const explicitRestored = new Set(options.restorePairs.map(pair => pair[1]));
  const explicitResizeNames = new Set(options.resizePairs.flat());
  const grouped = new Map();
  for (const name of successfulNames) {
    const document = documents.get(name), key = `${document.source.neuronId}:${document.view.request.mode}:${pairingKey(name)}`;
    if (!grouped.has(key)) grouped.set(key, []); grouped.get(key).push(name);
  }
  for (const names of grouped.values()) {
    const protectedViews = names.filter(name => ["user", "inspection"].includes(filenameKind(name)) && !explicitResizeNames.has(name));
    if (protectedViews.length === 2) automaticResize.push(protectedViews);
    else if (protectedViews.length > 2) output.errors.push({ pair: names, error: "Ambiguous protected resize capture group; provide explicit --resize-pair arguments" });
    const restored = names.filter(name => filenameKind(name) === "restored" && !explicitRestored.has(name));
    for (const restoredName of restored) {
      const candidates = names.filter(name => ["default", "fit", "home"].includes(filenameKind(name)));
      if (candidates.length === 1) automaticRestore.push([candidates[0], restoredName]);
      else if (candidates.length > 1) {
        output.errors.push({ file: restoredName, error: "Ambiguous default/restored capture group; provide an explicit --restore-pair" });
      }
    }
  }
  const deduplicate = pairs => [...new Map(pairs.map(pair => [pair.join(":"), pair])).values()];
  for (const pair of deduplicate([...options.restorePairs, ...automaticRestore])) {
    try {
      assert.ok(pair.every(name => successful.has(name)), "Restore pair includes a missing or failed capture");
      const [saved, restored] = pair.map(name => documents.get(name));
      assert.equal(saved.source.neuronId, restored.source.neuronId, "Restore pair changed exact source identity");
      assert.equal(saved.source.sha256, restored.source.sha256, "Restore pair changed exact source bytes");
      view.assertMainSceneSourceViewApplied(saved, restored);
      assert.equal(restored.geometryVerification.requestCacheMode, "no-store", "Actual restore was not fresh");
      assert.ok(restored.geometryVerification.mainSceneVerificationSequence > saved.geometryVerification.mainSceneVerificationSequence,
        "Actual restore source sequence did not advance within this capture series");
      assert.notEqual(restored.geometryVerification.verifiedAt, saved.geometryVerification.verifiedAt, "Actual restore reused the saved verification timestamp");
      assert.ok(Date.parse(restored.geometryVerification.verifiedAt) >= Date.parse(saved.geometryVerification.verifiedAt), "Actual restore predates its saved view");
      assert.ok(poseEqual(saved.view.camera, restored.view.camera), "Actual restore camera changed beyond allowed viewport aspect");
      output.restorePairs.push({ files: pair, samePoseExceptAspect: true, freshNoStore: true,
        savedSourceSequence: saved.geometryVerification.mainSceneVerificationSequence, restoredSourceSequence: restored.geometryVerification.mainSceneVerificationSequence,
        completeFitClaim: false });
    } catch (error) { output.errors.push({ pair, error: error instanceof Error ? error.message : String(error) }); }
  }
  const resizedNames = new Set();
  for (const pair of deduplicate([...options.resizePairs, ...automaticResize])) {
    try {
      assert.ok(pair.every(name => successful.has(name)), "Resize pair includes a missing or failed capture");
      const [before, after] = pair.map(name => documents.get(name));
      assert.equal(before.source.neuronId, after.source.neuronId, "Resize changed exact source identity");
      assert.equal(before.source.sha256, after.source.sha256, "Resize changed exact source bytes");
      assert.equal(before.view.request.mode, after.view.request.mode, "Resize changed source display mode");
      assert.deepEqual(before.view.inspection, after.view.inspection, "Resize changed the inspected source node or dimming");
      assert.ok(poseEqual(before.view.camera, after.view.camera), "User/inspection resize changed camera pose beyond aspect");
      assert.notEqual(before.view.camera.aspect, after.view.camera.aspect, "Resize pair has unchanged viewport aspect");
      pair.forEach(name => resizedNames.add(name));
      output.resizePairs.push({ files: pair, samePoseExceptAspect: true, sameExactSource: true, sameInspection: true, completeFitClaim: false });
    } catch (error) { output.errors.push({ pair, error: error instanceof Error ? error.message : String(error) }); }
  }
  output.unpairedProtectedViews = successfulNames.filter(name => ["user", "inspection", "restored"].includes(filenameKind(name))
    && !resizedNames.has(name) && !output.restorePairs.some(pair => pair.files.includes(name)));
  output.mismatchCount = output.errors.length;
  const result = JSON.stringify(output, null, 2) + "\n";
  if (options.out) { fs.mkdirSync(path.dirname(options.out), { recursive: true }); fs.writeFileSync(options.out, result); }
  process.stdout.write(result);
  if (output.mismatchCount) process.exitCode = 1;
}

await main().catch(error => {
  process.stderr.write(`Actual source fit replay failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
