import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateMicronsImportProvenance } from "../app/microns-import-provenance.js";

const contract = JSON.parse(await readFile(new URL("../data/microns-observed-cell-nucleus-reference-0.1.json", import.meta.url), "utf8"));
const clippingContract = JSON.parse(await readFile(new URL("../data/microns-source-native-clipping-0.1.json", import.meta.url), "utf8"));

function fixture() {
  return {
    payload: {
      micronsObservedReference: {
        contract: structuredClone(contract),
        runtimeReceipt: {
          verificationStatus: "verified",
          sceneObjectStatus: "rendered",
        },
        requestedView: true,
        requestedComponents: {
          cellSegmentationSurface: true,
          linkedNucleusSegmentation: true,
        },
      },
    },
    state: {
      cameraPreset: "microns_observed_reference",
      layers: {
        micronsCellSurface: true,
        micronsNucleus: true,
      },
    },
  };
}

test("accepts an exact MICrONS view receipt but never trusts its imported runtime state", () => {
  const { payload, state } = fixture();
  assert.deepEqual(validateMicronsImportProvenance(payload, state, contract), {
    requestedView: true,
    cellSegmentationSurface: true,
    linkedNucleusSegmentation: true,
    runtimeReceiptTrusted: false,
  });
  payload.micronsObservedReference.runtimeReceipt.verificationStatus = "invented_verified_state";
  assert.equal(validateMicronsImportProvenance(payload, state, contract).runtimeReceiptTrusted, false);
});

test("requires immutable exact-reference provenance whenever the MICrONS camera is requested", () => {
  const { state } = fixture();
  assert.throws(() => validateMicronsImportProvenance({}, state, contract), /is required for the exact MICrONS camera preset/i);

  const ordinaryState = structuredClone(state);
  ordinaryState.cameraPreset = "home";
  assert.equal(validateMicronsImportProvenance({}, ordinaryState, contract), null);
});

test("rejects changed nucleus, manifest, transform, or same-object boundary receipts", () => {
  const mutations = [
    (value) => { value.identityChain.somaValenceTable.nucleusId = "4310"; },
    (value) => { value.assetBundle.manifest.bytes += 1; },
    (value) => { value.assetBundle.manifest.path = "/data/not-the-admitted-manifest.json"; },
    (value) => { value.coordinateContract.cellToNucleusTransformReceipt.canonicalJsonSha256 = "0".repeat(64); },
    (value) => { value.coordinateContract.displayTransformReceipt.canonicalJsonSha256 = "0".repeat(64); },
    (value) => { value.relationshipPolicy.withinAdmittedObject.samePhysicalObject = false; },
    (value) => { value.claimPermissions.membrane = true; },
  ];
  for (const mutate of mutations) {
    const { payload, state } = fixture();
    mutate(payload.micronsObservedReference.contract);
    assert.throws(
      () => validateMicronsImportProvenance(payload, state, contract),
      /does not exactly match the admitted immutable contract/i,
    );
  }
});

test("rejects disagreement between duplicated view/component request fields", () => {
  const requestedViewMismatch = fixture();
  requestedViewMismatch.payload.micronsObservedReference.requestedView = false;
  assert.throws(
    () => validateMicronsImportProvenance(requestedViewMismatch.payload, requestedViewMismatch.state, contract),
    /requestedView disagrees/i,
  );

  const componentMismatch = fixture();
  componentMismatch.payload.micronsObservedReference.requestedComponents.linkedNucleusSegmentation = false;
  assert.throws(
    () => validateMicronsImportProvenance(componentMismatch.payload, componentMismatch.state, contract),
    /requested components disagree/i,
  );
});

test("validates exact source-native clipping state but never trusts imported runtime claims", () => {
  const { payload, state } = fixture();
  const clipping = { enabled: true, axis: "z", positionNanometre: 80240, keepSide: "negative" };
  state.micronsClipping = structuredClone(clipping);
  payload.micronsObservedReference.clippingContract = structuredClone(clippingContract);
  payload.micronsObservedReference.requestedClipping = structuredClone(clipping);
  payload.micronsObservedReference.runtimeReceipt.clipping = {
    enabled: true,
    nucleusClippingPlaneCount: 99,
    generatedGeometryCount: 99,
  };
  assert.deepEqual(validateMicronsImportProvenance(payload, state, contract, clippingContract), {
    requestedView: true,
    cellSegmentationSurface: true,
    linkedNucleusSegmentation: true,
    clipping,
    runtimeReceiptTrusted: false,
  });

  payload.micronsObservedReference.requestedClipping.positionNanometre = 90000;
  assert.throws(
    () => validateMicronsImportProvenance(payload, state, contract, clippingContract),
    /outside the exact z-axis cell bounds/i,
  );
});

test("rejects active clipping without the immutable clipping contract or exact duplicated state", () => {
  const { payload, state } = fixture();
  state.micronsClipping = { enabled: true, axis: "x", positionNanometre: 246864, keepSide: "positive" };
  assert.throws(
    () => validateMicronsImportProvenance(payload, state, contract, clippingContract),
    /active MICrONS clipping requires/i,
  );
  payload.micronsObservedReference.clippingContract = structuredClone(clippingContract);
  payload.micronsObservedReference.requestedClipping = { ...state.micronsClipping, keepSide: "negative" };
  assert.throws(
    () => validateMicronsImportProvenance(payload, state, contract, clippingContract),
    /requestedClipping disagrees/i,
  );
});
