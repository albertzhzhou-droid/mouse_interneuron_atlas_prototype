import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import {
  collectMicronsSemanticErrors,
  parseLegacyMeshFragment,
  validateMicronsObservedCellNucleusReference,
} from "../scripts/validate-microns-observed-cell-nucleus-reference-0.1.mjs";

const CONTRACT_URL = new URL("../data/microns-observed-cell-nucleus-reference-0.1.json", import.meta.url);
const ASSET_MANIFEST_URL = new URL("../public/data/microns_phase1_v185_4_root_648518346349516051_v1/asset-manifest.json", import.meta.url);
const SCHEMATIC_CONTRACT_URL = new URL("../data/cross-region-internal-reference-0.1.json", import.meta.url);
const SCENE_URL = new URL("../app/SceneCanvas.tsx", import.meta.url);
const PROTOTYPE_URL = new URL("../app/AtlasPrototype.tsx", import.meta.url);
const PANEL_URL = new URL("../app/InternalStructureReferencePanel.tsx", import.meta.url);
const RELEASE_MANIFEST_URL = new URL("../data/research-iteration-manifest-2.50.json", import.meta.url);
const [contract, assetManifest, schematicContract, scene, prototype, panel] = await Promise.all([
  readFile(CONTRACT_URL, "utf8").then(JSON.parse),
  readFile(ASSET_MANIFEST_URL, "utf8").then(JSON.parse),
  readFile(SCHEMATIC_CONTRACT_URL, "utf8").then(JSON.parse),
  readFile(SCENE_URL, "utf8"),
  readFile(PROTOTYPE_URL, "utf8"),
  readFile(PANEL_URL, "utf8"),
]);

test("admits one exact MICrONS cell surface and linked nucleus with zero cross-region joins", async () => {
  assert.equal(contract.upgradeId, "UPG-111");
  assert.equal(contract.upgradePhase, "A");
  assert.deepEqual(await validateMicronsObservedCellNucleusReference(), {
    releaseId: "ohri-microns-observed-cell-nucleus-reference-0.1.0",
    rootId: "648518346349516051",
    nucleusId: "4309",
    admittedComponentCount: 2,
    sourceFragmentCount: 97,
    vertexCount: 385064,
    triangleCount: 727788,
    crossRegionJoinCount: 0,
    registrationCount: 0,
  });
});

test("browser arrays expose exact native-coordinate counts and checksum receipts", () => {
  const cell = assetManifest.components.find((component) => component.componentName === "cell");
  const nucleus = assetManifest.components.find((component) => component.componentName === "nucleus");
  assert.deepEqual({
    positionsPath: cell.browserGeometry.positions.path,
    positionsSha256: cell.browserGeometry.positions.sha256,
    trianglesPath: cell.browserGeometry.triangles.path,
    trianglesSha256: cell.browserGeometry.triangles.sha256,
    vertexCount: cell.browserGeometry.vertexCount,
    triangleCount: cell.browserGeometry.triangleCount,
  }, {
    positionsPath: "/data/microns_phase1_v185_4_root_648518346349516051_v1/browser/cell.positions.f32le.bin",
    positionsSha256: "0eeb79d91607afff797be1a81a8c1378a66689373ef7df499a4c0a2aba243fda",
    trianglesPath: "/data/microns_phase1_v185_4_root_648518346349516051_v1/browser/cell.triangles.u32le.bin",
    trianglesSha256: "b72fee4500fdf85b389897a623cde3f30289fff6c52e04b4e135ede2ebad9c62",
    vertexCount: 372382,
    triangleCount: 704444,
  });
  assert.deepEqual({
    positionsPath: nucleus.browserGeometry.positions.path,
    positionsSha256: nucleus.browserGeometry.positions.sha256,
    trianglesPath: nucleus.browserGeometry.triangles.path,
    trianglesSha256: nucleus.browserGeometry.triangles.sha256,
    vertexCount: nucleus.browserGeometry.vertexCount,
    triangleCount: nucleus.browserGeometry.triangleCount,
  }, {
    positionsPath: "/data/microns_phase1_v185_4_root_648518346349516051_v1/browser/nucleus.positions.f32le.bin",
    positionsSha256: "9fbe8c12ce08586ca45f91dfee1043d3a904a873adf93ee0e57b4eee627a9efb",
    trianglesPath: "/data/microns_phase1_v185_4_root_648518346349516051_v1/browser/nucleus.triangles.u32le.bin",
    trianglesSha256: "e6561a5e266d34da2d7d9b7d21ad4819b74e97cebf81b8ed76e7f805f8baefb5",
    vertexCount: 12682,
    triangleCount: 23344,
  });
  for (const component of [cell, nucleus]) {
    assert.equal(component.browserGeometry.coordinateUnits, "nanometre");
    assert.equal(component.browserGeometry.derivation.vertexWelding, false);
    assert.equal(component.browserGeometry.derivation.smoothing, false);
    assert.equal(component.browserGeometry.derivation.repair, false);
    assert.equal(component.browserGeometry.derivation.decimation, false);
    assert.equal(component.browserGeometry.derivation.coordinateTransformApplied, false);
  }
});

test("the active Research MVP snapshot pins both MICrONS contract and asset manifest", async () => {
  const releaseManifest = JSON.parse(await readFile(RELEASE_MANIFEST_URL, "utf8"));
  const pins = new Map(releaseManifest.authoritativeInputs.map((input) => [input.id, input]));
  assert.ok(pins.has("micronsObservedReferenceContract"));
  assert.ok(pins.has("micronsObservedReferenceAssetManifest"));
  for (const pin of releaseManifest.authoritativeInputs) {
    const root = pin.scope === "scientificAuthority"
      ? new URL("../../interneuron_sci_review/", import.meta.url)
      : new URL("../", import.meta.url);
    const bytes = await readFile(new URL(pin.path, root));
    assert.equal(pin.bytes, bytes.byteLength);
    assert.equal(pin.sha256, createHash("sha256").update(bytes).digest("hex"));
  }
  assert.equal(releaseManifest.integrity.inputCount, releaseManifest.authoritativeInputs.length);
  assert.equal(releaseManifest.manifestContentSha256, computeManifestContentSha256(releaseManifest));
  assert.equal(releaseManifest.exactReferences.micronsObservedCellNucleus.cellRootId, "648518346349516051");
  assert.equal(releaseManifest.exactReferences.micronsObservedCellNucleus.nucleusId, "4309");
  assert.equal(releaseManifest.exactReferences.micronsObservedCellNucleus.projectRegistrationCount, 0);
});

test("a raw legacy fragment parses to its pinned fragment-local counts", async () => {
  const firstReceipt = assetManifest.components[0].sourceFragments.receipts[0];
  const fragmentUrl = new URL(`../public${firstReceipt.path}`, import.meta.url);
  const parsed = parseLegacyMeshFragment(await readFile(fragmentUrl), firstReceipt.fragment);
  assert.equal(parsed.vertexCount, firstReceipt.vertexCount);
  assert.equal(parsed.triangleCount, firstReceipt.triangleCount);
  assert.equal(parsed.positions.byteLength, firstReceipt.vertexCount * 3 * 4);
  assert.equal(parsed.indices.byteLength, firstReceipt.triangleCount * 3 * 4);
});

test("semantic gate rejects membrane, organelle, spinal-identity and transform promotion", () => {
  const altered = structuredClone(contract);
  altered.components[0].membraneClaim = true;
  altered.claimPermissions.membrane = true;
  altered.claimPermissions.mitochondria = true;
  altered.relationshipPolicy.crossRegionRelationships[0].samePhysicalObject = true;
  altered.relationshipPolicy.crossRegionRelationships[0].joinedEntityIds = ["NeuroMorpho:104003"];
  altered.relationshipPolicy.crossRegionRelationships[0].joinCount = 1;
  altered.coordinateContract.displayTransformReceipt.canonical.scaleViewerUnitPerNanometre = 1;
  const errors = collectMicronsSemanticErrors(altered).join("\n");
  assert.match(errors, /membrane claim/i);
  assert.match(errors, /mitochondria must remain forbidden/i);
  assert.match(errors, /same-object claim/i);
  assert.match(errors, /gained a join/i);
  assert.match(errors, /display-only transform drifted/i);
});

test("validator fails closed when a browser geometry byte no longer matches the receipt", async () => {
  const cellPositionsUrl = new URL("../public/data/microns_phase1_v185_4_root_648518346349516051_v1/browser/cell.positions.f32le.bin", import.meta.url);
  await assert.rejects(
    validateMicronsObservedCellNucleusReference({
      read: async (url, encoding) => {
        const value = await readFile(url, encoding);
        if (String(url) !== String(cellPositionsUrl) || encoding) return value;
        const altered = Buffer.from(value);
        altered[altered.length - 1] ^= 0x01;
        return altered;
      },
    }),
    /cell browser positions SHA-256 receipt mismatch/,
  );
});

test("observed admission does not promote the unavailable internal-evidence route", () => {
  assert.equal(schematicContract.authority, "UNAVAILABLE_OBJECT_GEOMETRY");
  assert.equal(schematicContract.sourceDerivedGeometryCount, 0);
  assert.equal(schematicContract.renderedPrimitiveCount, 0);
  assert.equal(schematicContract.missingEvidencePolicy, "zero_primitives");
  assert.equal(schematicContract.samePhysicalObject, false);
  assert.ok(schematicContract.sources.every((source) => source.exactObjectAdmittedToThisMode === false));
  assert.ok(schematicContract.components.every((component) => (
    component.sourceGeometryUsed === false && component.rendered === false
  )));
});

test("viewer wires a checksum-gated, component-toggleable MICrONS scene without a spinal join", () => {
  assert.match(scene, /view !== "microns_observed_reference"/);
  assert.match(scene, /fetchVerifiedMicronsBuffer/);
  assert.match(scene, /MICrONS asset-manifest SHA-256 mismatch/);
  assert.match(scene, /micronsReferenceRoot\.scale\.setScalar/);
  assert.match(scene, /coordinateTransformAppliedToBuffer: false/);
  assert.match(scene, /normalGeneration: false/);
  assert.match(scene, /membraneClaim: false/);
  assert.match(scene, /context\.micronsCellRoot\.visible = micronsReferenceActive && showMicronsCellSurface/);
  assert.match(scene, /context\.micronsNucleusRoot\.visible = micronsReferenceActive && showMicronsNucleus/);
  assert.match(scene, /publishMicronsRuntime/);
  assert.match(scene, /verificationStatus: "verified"/);
  assert.match(scene, /verifiedAssetReceipt/);
  assert.match(scene, /expectedSha256: manifestReceipt\.sha256/);
  assert.match(scene, /verifiedSha256: verifiedManifestSha256/);
  assert.match(scene, /verifiedSha256: cellPositions\.verifiedSha256/);
  assert.match(scene, /verifiedSha256: nucleusTriangles\.verifiedSha256/);
  assert.match(scene, /reason: error\.message\.slice\(0, 240\)/);
  assert.match(scene, /verificationStatus: "idle"/);
  assert.match(prototype, /"microns_observed_reference"/);
  assert.match(prototype, /Observed EM cell \+ nucleus/);
  assert.match(prototype, /micronsObservedReference:\s*\{/);
  assert.match(prototype, /runtimeReceipt: micronsRuntime/);
  assert.match(prototype, /micronsMembraneClaim: false/);
  assert.match(panel, /Segmentation surface ≠ membrane measurement/);
  assert.match(panel, /False · co-display only · 0 joins/);
});
