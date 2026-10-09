import {
  defaultMicronsClipState,
  validateMicronsClipState,
} from "./microns-source-native-clipping.js";

function isPlainRecord(value) {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainRecord(value)) {
    return `{${Object.keys(value).sort((left, right) => left.localeCompare(right)).map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** @param {typeof import("../data/microns-source-native-clipping-0.1.json") | null} admittedClippingContract */
export function validateMicronsImportProvenance(payload, state, admittedContract, admittedClippingContract = null) {
  const requestedView = state.cameraPreset === "microns_observed_reference";
  const reference = payload.micronsObservedReference;
  if (reference === undefined) {
    if (requestedView) throw new Error("micronsObservedReference is required for the exact MICrONS camera preset");
    return null;
  }
  if (!isPlainRecord(reference)) throw new Error("micronsObservedReference must be an object");
  if (!isPlainRecord(reference.contract)) throw new Error("micronsObservedReference.contract must be an object");
  if (canonicalJson(reference.contract) !== canonicalJson(admittedContract)) {
    throw new Error("micronsObservedReference.contract does not exactly match the admitted immutable contract");
  }
  if (typeof reference.requestedView !== "boolean" || reference.requestedView !== requestedView) {
    throw new Error("micronsObservedReference.requestedView disagrees with state.cameraPreset");
  }
  if (!isPlainRecord(reference.requestedComponents)) {
    throw new Error("micronsObservedReference.requestedComponents must be an object");
  }
  const requestedComponents = reference.requestedComponents;
  if (
    typeof requestedComponents.cellSegmentationSurface !== "boolean"
    || typeof requestedComponents.linkedNucleusSegmentation !== "boolean"
  ) {
    throw new Error("micronsObservedReference requested component values must be booleans");
  }
  if (
    requestedComponents.cellSegmentationSurface !== state.layers.micronsCellSurface
    || requestedComponents.linkedNucleusSegmentation !== state.layers.micronsNucleus
  ) {
    throw new Error("micronsObservedReference requested components disagree with state.layers");
  }
  let clipping = null;
  if (admittedClippingContract) {
    const stateClipping = state.micronsClipping === undefined
      ? defaultMicronsClipState(admittedClippingContract)
      : validateMicronsClipState(state.micronsClipping, admittedClippingContract);
    if (reference.clippingContract !== undefined && canonicalJson(reference.clippingContract) !== canonicalJson(admittedClippingContract)) {
      throw new Error("micronsObservedReference.clippingContract does not exactly match the admitted immutable clipping contract");
    }
    if (reference.requestedClipping !== undefined) {
      const requestedClipping = validateMicronsClipState(reference.requestedClipping, admittedClippingContract);
      if (canonicalJson(requestedClipping) !== canonicalJson(stateClipping)) {
        throw new Error("micronsObservedReference.requestedClipping disagrees with state.micronsClipping");
      }
    }
    if (stateClipping.enabled && (reference.clippingContract === undefined || reference.requestedClipping === undefined)) {
      throw new Error("active MICrONS clipping requires its immutable contract and exact requested state");
    }
    clipping = stateClipping;
  }
  return {
    requestedView,
    cellSegmentationSurface: requestedComponents.cellSegmentationSurface,
    linkedNucleusSegmentation: requestedComponents.linkedNucleusSegmentation,
    ...(admittedClippingContract ? { clipping } : {}),
    runtimeReceiptTrusted: false,
  };
}
