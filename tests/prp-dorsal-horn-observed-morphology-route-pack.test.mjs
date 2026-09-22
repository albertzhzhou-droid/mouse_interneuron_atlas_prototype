import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validatePrpAssetInventory, validatePrpDorsalHornObservedMorphologyRoutePack } from "../scripts/validate-prp-dorsal-horn-observed-morphology-route-pack-0.1.mjs";

const contract = JSON.parse(
  await readFile(new URL("../data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json", import.meta.url), "utf8"),
);

test("pins exact nNOS/PrP and galanin/PrP routes without census or semantic expansion", async () => {
  assert.deepEqual(await validatePrpDorsalHornObservedMorphologyRoutePack(), {
    releaseId: "ohri-prp-dorsal-horn-observed-morphology-route-pack-0.1.0",
    routeCount: 2,
    uniqueMainSceneNeuronCount: 12,
    namedRouteCount: 9,
    censusRecordCount: 142,
    censusExpansionCount: 0,
    sourceDiameterAvailableCount: 2,
    observedAxonRouteCount: 2,
    sourceCompleteAxonCount: 0,
    nativeDatSemanticAdmissionCount: 0,
    sameCellElectrophysiologyJoinCount: 0,
    internalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });

  assert.deepEqual(
    contract.routes.map((route) => [route.routeId, route.sourceObjects.swc.sha256, route.sourceObjects.originalDat.sha256]),
    [
      ["mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394", "adeb2b0c6934ae07f32d54e8fcaebc8cee29429d884e44692756ee15da8a00d2", "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109"],
      ["mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408", "452c2b3d76d9680318470ba16b5c271a403018a1c6dcedaa94b68f1fdec6c470", "78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2"],
    ],
  );
});

test("rejects route/order drift and geometry/topology drift", async () => {
  const order = structuredClone(contract);
  order.routes.reverse();
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(order), /IDs or order|route IDs or order/i);

  const geometry = structuredClone(contract);
  geometry.routes[0].geometryReceipt.nodeCount += 1;
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(geometry), /geometry counts/i);

  const topology = structuredClone(contract);
  topology.routes[1].geometryReceipt.topologySha256 = "0".repeat(64);
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(topology), /topology drifted/i);
});

test("rejects DAT semantics, complete axons, invented internals, physiology, identity and registration", async () => {
  const dat = structuredClone(contract);
  dat.routes[0].nativeDatContract.parsed = true;
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(dat), /parsed|DAT semantics|constant/i);

  const axon = structuredClone(contract);
  axon.routes[1].fidelityRecord.axon.completeAxon = true;
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(axon), /complete axon/i);

  const internals = structuredClone(contract);
  internals.routes[0].renderingContract.sameSpecimenInternalStructure.renderedPrimitiveCount = 1;
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(internals), /renderedPrimitiveCount|internals|constant/i);

  const physiology = structuredClone(contract);
  physiology.routes[1].identityBoundary.sameCellElectrophysiologyJoinStatus = "joined";
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(physiology), /sameCellElectrophysiologyJoinStatus|physiology|constant/i);

  const identity = structuredClone(contract);
  identity.routes[0].identityBoundary.selectedSciEntityRelationship = "same_cell";
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(identity), /selectedSciEntityRelationship|identity relationship|constant/i);

  const registered = structuredClone(contract);
  registered.routes[0].identityBoundary.projectRegistrationCount = 1;
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(registered), /projectRegistrationCount|registration|constant/i);
});

test("preserves raw Swiss-Webster spacing, invalid weight bounds and non-exclusive marker evidence", async () => {
  const strain = structuredClone(contract);
  strain.routes[0].sourceRecord.repositoryStrainRaw = "Swiss-Webster";
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(strain), /trailing space|normalized away/i);

  const weight = structuredClone(contract);
  weight.routes[1].sourceRecord.repositoryWeightGrams.maximum = 27;
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(weight), /27-to-15 gram|weight/i);

  const markerNegative = structuredClone(contract);
  markerNegative.routes[0].sourceRecord.cellTypeLabels[0] = "galanin-negative";
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(markerNegative), /marker labels|exclusivity|marker-negative/i);

  const routeNonExclusivity = structuredClone(contract);
  routeNonExclusivity.routes[1].hardBoundaries = routeNonExclusivity.routes[1].hardBoundaries.map((boundary) => boundary.replace("nNOS negativity", "nNOS status"));
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(routeNonExclusivity), /marker non-exclusivity/i);

  const packNonExclusivity = structuredClone(contract);
  packNonExclusivity.packBoundaries = packNonExclusivity.packBoundaries.map((boundary) => boundary.replace("does not establish galanin-negative", "establishes galanin-negative"));
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(packNonExclusivity), /pack-level marker non-exclusivity/i);
});

test("keeps PrP as promoter context, separates preparation stages and excludes paper assets", async () => {
  const promoter = structuredClone(contract);
  promoter.packBoundaries = promoter.packBoundaries.map((boundary) => boundary.replace("not a claim of endogenous PrP protein abundance", "a claim of endogenous PrP protein abundance"));
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(promoter), /endogenous protein abundance|PrP-promoter wording/i);

  const preparation = structuredClone(contract);
  preparation.routes[0].hardBoundaries = preparation.routes[0].hardBoundaries.map((boundary) => boundary.replace("a separate recovery stage", "the same preparation stage"));
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(preparation), /preparation-stage separation/i);

  const pca = structuredClone(contract);
  pca.routes[1].geometryReceipt.repositoryMorphometry.equivalentToSwcBounds = true;
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(pca), /equivalentToSwcBounds|conflated|constant/i);

  const paperAssets = structuredClone(contract);
  paperAssets.packBoundaries = paperAssets.packBoundaries.map((boundary) => boundary.replace("no paper text, figure, PDF, or microscopy panel is bundled", "the paper PDF is bundled"));
  await assert.rejects(() => validatePrpDorsalHornObservedMorphologyRoutePack(paperAssets), /PDF\/figure exclusion|paper PDF/i);
});


test("admits only the two independently pinned native 0.3 derivatives beside the frozen PrP inventory", async () => {
  const assetRoot = new URL("../public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/", import.meta.url);
  const [manifestBytes, catalog] = await Promise.all([
    readFile(new URL("asset-manifest.json", assetRoot)),
    readFile(new URL("../data/neurolucida-native-contour-admission-catalog-0.3.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const extensions = ["native-contours/nmo-50394-mbf-cell-body-line-loops.json", "native-contours/nmo-50408-mbf-cell-body-line-loops.json"];
  const assetFiles = ["asset-manifest.json", ...manifest.files.map((file) => file.path), ...extensions];
  const sources = new Map(await Promise.all(extensions.map(async (relative) => [relative, await readFile(new URL(relative, assetRoot))])));
  const readAsset = async (relative) => {
    assert.ok(sources.has(relative), `Unexpected extension read: ${relative}`);
    return sources.get(relative);
  };
  const args = { manifest, catalog, assetFiles, readAsset };
  await validatePrpAssetInventory(args);
  assert.equal(manifest.files.length, 10);
  assert.equal(manifest.summary.nativeDatSemanticAdmissionCount, 0);

  for (const unexpected of ["native-contours/unadmitted-cell.json", "native-contours/figure.png", "paper.pdf"]) {
    await assert.rejects(() => validatePrpAssetInventory({ ...args, assetFiles: [...assetFiles, unexpected] }), /unmanifested or missing file/);
  }
  await assert.rejects(() => validatePrpAssetInventory({ ...args, assetFiles: assetFiles.filter((file) => file !== extensions[0]) }), /unmanifested or missing file/);

  const redirectedCatalog = structuredClone(catalog);
  redirectedCatalog.records.find((record) => record.neuronId === 50394).derivedObject.path = "/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/other.json";
  await assert.rejects(() => validatePrpAssetInventory({ ...args, catalog: redirectedCatalog }), /catalog path drifted/);

  for (const relative of extensions) {
    const tampered = Buffer.from(sources.get(relative));
    tampered[tampered.length - 2] ^= 1;
    await assert.rejects(() => validatePrpAssetInventory({ ...args,
      readAsset: async (file) => file === relative ? tampered : readAsset(file),
    }), /SHA-256 drifted/);
  }
  assert.deepEqual(await readFile(new URL("asset-manifest.json", assetRoot)), manifestBytes, "frozen manifest remains byte-for-byte unchanged");
});
