import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { MAIN_SCENE_SOURCE_VIEW_BUILD, MAIN_SCENE_VIEW_NUMERIC_TOLERANCE, appendMainScenePngReceipt } from "../app/main-scene-source-view.js";
import { buildMainSceneRoundTripContract, appendMainSceneExportPng, createMainSceneCsvMetadataRow, MAIN_SCENE_CSV_FORMAT_VERSION } from "../app/main-scene-export.js";

// These tests verify export formatting and pixel preservation. Private source and
// actual applied-view validity are independently tested in the source-view/import suites.
const encoded = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const png = () => new Blob([encoded], { type: "image/png" });
const unavailable = (id = 108974) => ({ status: "unavailable", reason: "WebGL unavailable · 无实际视图", currentNeuronId: id });
const actual = () => ({ documentType: "main_scene_morphology_view_receipt", schemaVersion: "0.2.0", rendererBuild: structuredClone(MAIN_SCENE_SOURCE_VIEW_BUILD), source: { neuronId: 108974 } });
const settings = () => ({ view: "cell_detail", observedCellFormId: 108974, layers: { observedForm: false }, search: "Tac1 核", micronsClipping: { enabled: false } });
async function inspect(blob) {
  const bytes = Buffer.from(await blob.arrayBuffer()), text = {}, nonReceipt = [bytes.subarray(0, 8)];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const size = bytes.readUInt32BE(offset), type = bytes.toString("ascii", offset + 4, offset + 8);
    let crc = 0xffffffff;
    for (const value of bytes.subarray(offset + 4, offset + 8 + size)) {
      crc ^= value;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    if (type === "iTXt") {
      assert.equal(bytes.readUInt32BE(offset + size + 8), (crc ^ 0xffffffff) >>> 0);
      const data = bytes.subarray(offset + 8, offset + 8 + size), separator = data.indexOf(0), keyword = data.toString("utf8", 0, separator);
      assert.ok(!Object.hasOwn(text, keyword));
      assert.deepEqual([...data.subarray(separator, separator + 5)], [0, 0, 0, 0, 0]);
      text[keyword] = JSON.parse(data.toString("utf8", separator + 5));
    } else nonReceipt.push(bytes.subarray(offset, offset + size + 12));
    offset += size + 12;
  }
  assert.equal(offset, bytes.length);
  return { text, nonReceipt: Buffer.concat(nonReceipt) };
}

test("actual-view contract retains camera, source, build, layers, clipping and inspection authority", () => {
  const c = buildMainSceneRoundTripContract(actual());
  assert.equal(c.equalityUnit, "persistent_state_and_main_scene_actual_view");
  assert.equal(c.actualView.status, "fresh_verified_replay_required");
  for (const path of ["source", "rendererBuild", "sourceContext", "scientificScope", "view.request", "view.camera", "view.renderer", "view.layers", "view.clipping", "view.sourceObject", "view.inspection"])
    assert.ok(c.actualView.authoritativePaths.includes(`mainSceneView.${path}`));
  assert.ok(!c.regeneratedNonAuthoritativePaths.includes("mainSceneView"));
  assert.deepEqual(c.actualView.numericTolerance, { absolute: MAIN_SCENE_VIEW_NUMERIC_TOLERANCE, relative: MAIN_SCENE_VIEW_NUMERIC_TOLERANCE });
  assert.equal(c.actualView.freshSourceCacheMode, "no-store");
  assert.equal(c.actualView.currentPageVerificationMustAdvance, true);
  assert.equal(c.actualView.appliedViewMustMatch, true);
});

test("only runtime and source event metadata regenerate; projection aspect follows the actual viewport", () => {
  const c = buildMainSceneRoundTripContract(actual());
  for (const field of ["verifiedAt", "verificationSequence", "mainSceneVerificationSequence", "requestCacheMode"])
    assert.ok(c.regeneratedNonAuthoritativePaths.includes(`mainSceneView.geometryVerification.${field}`));
  assert.ok(c.regeneratedNonAuthoritativePaths.includes("mainSceneView.view.runtimeBinding"));
  assert.ok(!c.regeneratedNonAuthoritativePaths.includes("mainSceneView.geometryVerification.sha256"));
  assert.deepEqual(c.actualView.adaptedToCurrentViewportPaths, ["mainSceneView.view.viewport", "mainSceneView.view.camera.aspect"]);
  assert.equal(c.actualView.pixelEqualityAcrossViewportSizes, false);
});

test("unavailable views explicitly restore settings only and retain the exact requested source or null", () => {
  for (const id of [108974, 194469, 322385, null]) {
    const c = buildMainSceneRoundTripContract(unavailable(id));
    assert.equal(c.equalityUnit, "persistent_state_only");
    assert.equal(c.actualView.currentNeuronId, id);
    assert.equal(c.actualView.cameraLayersClippingAndBranchReplay, false);
    assert.ok(!Object.hasOwn(c.actualView, "authoritativePaths"));
  }
  for (const value of [undefined, {}, { status: "unavailable", reason: "missing source" }, unavailable(-1)])
    assert.throws(() => buildMainSceneRoundTripContract(value), /explicit current-source/);
});

test("CSV metadata survives zero evidence rows and cannot masquerade as a scientific entity", () => {
  const headers = ["record_kind", "export_format_version", "release_id", "entity_id", "name", "entity_kind", "geometry_status", "scientific_disclaimer", "main_scene_view_receipt_json", "main_scene_round_trip_contract_json"];
  const row = createMainSceneCsvMetadataRow(headers, { releaseId: "current", disclaimer: "Research only", sourceView: unavailable() });
  const table = [headers, row, ...[]], fields = Object.fromEntries(headers.map((key,i) => [key,row[i]]));
  assert.equal(table.length, 2); assert.equal(fields.record_kind, "viewport_metadata");
  assert.equal(fields.export_format_version, MAIN_SCENE_CSV_FORMAT_VERSION);
  for (const name of ["entity_id", "name", "entity_kind", "geometry_status"]) assert.equal(fields[name], "");
  assert.deepEqual(JSON.parse(fields.main_scene_view_receipt_json), unavailable());
  assert.equal(JSON.parse(fields.main_scene_round_trip_contract_json).actualView.status, "settings_only");
  for (const invalidHeaders of [headers.slice(1), [...headers, "entity_id"]])
    assert.throws(() => createMainSceneCsvMetadataRow(invalidHeaders, { releaseId: "current", disclaimer: "Research only", sourceView: actual() }), /headers/);
});

test("old source-view schema or build cannot receive a current actual-view export claim", () => {
  const schema = actual(); schema.schemaVersion = "0.1.0";
  const build = actual(); build.rendererBuild.inputs[0].sha256 = "f".repeat(64);
  for (const receipt of [schema, build]) assert.throws(() => buildMainSceneRoundTripContract(receipt), /different renderer build/);
});

test("fallback PNG embeds unavailable source, requested settings, current build and measured raster dimensions", async () => {
  const receipt = unavailable(), state = settings();
  const promise = appendMainSceneExportPng(png(), receipt, { exportKind: "accessible_fallback", requestedState: state, currentNeuronId: 108974 });
  state.layers.observedForm = true;
  const { text, nonReceipt } = await inspect(await promise), meta = text["ohri-png-export"];
  assert.deepEqual(nonReceipt, encoded);
  assert.deepEqual(text["ohri-source-view"], receipt);
  assert.deepEqual(meta.image, { format: "image/png", width: 1, height: 1 });
  assert.deepEqual(meta.rendererBuild, MAIN_SCENE_SOURCE_VIEW_BUILD);
  assert.equal(meta.requestedState.layers.observedForm, false);
  assert.equal(meta.requestedState.search, "Tac1 核");
  assert.equal(meta.captureAuthority.raster, "accessible_text_snapshot_only");
  assert.equal(meta.captureAuthority.actualSourceViewAvailable, false);
  assert.equal(meta.captureAuthority.requestedSettingsAreActualGeometryProof, false);
  assert.equal(meta.roundTripContract.actualView.status, "settings_only");
  assert.equal(meta.sourceViewKeyword, "ohri-source-view");
});

test("rendered PNG retains its source receipt and encoded raster; unavailable source does not become verified", async () => {
  for (const receipt of [actual(), unavailable()]) {
    const { text, nonReceipt } = await inspect(await appendMainSceneExportPng(png(), receipt,
      { exportKind: "rendered_main_scene", requestedState: settings(), currentNeuronId: 108974 }));
    assert.deepEqual(text["ohri-source-view"], receipt); assert.deepEqual(nonReceipt, encoded);
    const meta = text["ohri-png-export"];
    assert.equal(meta.exportKind, "rendered_main_scene");
    assert.equal(meta.captureAuthority.actualSourceViewAvailable, receipt.documentType === "main_scene_morphology_view_receipt");
    assert.equal(meta.captureAuthority.registrationCount, 0); assert.equal(meta.captureAuthority.crossSourceSameCellJoinCount, 0);
  }
});

test("a fallback cannot claim actual geometry, and source mismatches and absent settings reject", () => {
  const options = { exportKind: "rendered_main_scene", requestedState: settings(), currentNeuronId: 108974 };
  assert.throws(() => appendMainSceneExportPng(png(), actual(), { ...options, exportKind: "accessible_fallback" }), /current source disagree/);
  for (const receipt of [actual(), unavailable()])
    assert.throws(() => appendMainSceneExportPng(png(), receipt, { ...options, currentNeuronId: 194469 }), /current source disagree/);
  assert.throws(() => appendMainSceneExportPng(png(), unavailable(), { ...options, exportKind: "unknown" }), /unsupported PNG/);
  assert.throws(() => appendMainSceneExportPng(png(), unavailable(), { ...options, requestedState: null }), /requested settings/);
});

test("encoded dimensions override metadata; conflicting repeated receipts and malformed PNG reject", async () => {
  const first = await appendMainScenePngReceipt(png(), unavailable(), { image: { width: 9999, height: 9999 } });
  assert.deepEqual((await inspect(first)).text["ohri-png-export"].image, { format: "image/png", width: 1, height: 1 });
  await assert.rejects(() => appendMainScenePngReceipt(first, unavailable()), /already contains/);
  const badHeader = Buffer.from(encoded); badHeader.writeUInt32BE(0, 16);
  for (const bytes of [badHeader, encoded.subarray(0, -1), Buffer.concat([encoded, Buffer.from([1])])])
    await assert.rejects(() => appendMainScenePngReceipt(new Blob([bytes]), unavailable()), /PNG/);
});

test("JSON and CSV use one source capture each, and both PNG paths use the shared export metadata", async () => {
  const [atlas, scene] = await Promise.all([readFile(new URL("../app/AtlasPrototype.tsx", import.meta.url), "utf8"), readFile(new URL("../app/SceneCanvas.tsx", import.meta.url), "utf8")]);
  const json = atlas.slice(atlas.indexOf("const exportState = () => {"), atlas.indexOf("const exportCsv = () => {"));
  const csv = atlas.slice(atlas.indexOf("const exportCsv = () => {"), atlas.indexOf("const exportPng = async () => {"));
  assert.equal((json.match(/currentMainSceneViewReceipt\(\)/g) ?? []).length, 1);
  assert.equal((csv.match(/currentMainSceneViewReceipt\(\)/g) ?? []).length, 1);
  assert.match(json, /roundTripContract: buildMainSceneRoundTripContract\(mainSceneView\)/);
  assert.match(csv, /main_scene_round_trip_contract_json/);
  assert.match(atlas, /exportKind: "accessible_fallback", requestedState: persistentState, currentNeuronId: viewportMorphologyNeuronId/);
  assert.match(scene, /exportKind: "rendered_main_scene", requestedState: options.requestedState, currentNeuronId: options.currentNeuronId/);
  assert.match(scene, /receipt.source.neuronId !== options.currentNeuronId/);
  assert.match(scene, /INF ANATOMY VISIBLE.*INF ANATOMY HIDDEN/);
  assert.match(scene, /SYN NON-CELL NODES VISIBLE.*SYN NON-CELL NODES HIDDEN/);
  assert.match(scene, /"documentType" in receipt \? receipt.view.layers : null/);
  assert.match(atlas, /Download latest/);
  assert.match(atlas, /URL.revokeObjectURL\(lastExport.url\)/);
  assert.doesNotMatch(atlas, /setTimeout\(\(\) => URL.revokeObjectURL/);
});
