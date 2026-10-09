function invariant(ok, message) { if (!ok) throw new Error(`Morphology source-frame disclosure: ${message}`); }
function sameJsonValue(left, right) {
  if (left === null || right === null) return left === right;
  if (typeof left !== typeof right) return false;
  if (typeof left === "number") return Number.isFinite(left) && Number.isFinite(right) && left === right;
  if (["string", "boolean"].includes(typeof left)) return left === right;
  if (typeof left !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && Array.from({ length: left.length }, (_, i) => i).every(i => Object.hasOwn(left, i) && Object.hasOwn(right, i) && sameJsonValue(left[i], right[i]));
  }
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every(key => Object.hasOwn(right, key) && sameJsonValue(left[key], right[key]));
}

/** Compare exact JSON values. JSON property insertion order carries no coordinate authority. */
export function assertMorphologyGeometrySourceFrame(disclosure, geometry) {
  const id = disclosure.neuronId, computed = geometry.morphometrics?.computedFromStandardizedSwc;
  invariant(geometry.neuronId === id && geometry.assetId === disclosure.assetId, `NMO ${id} geometry identity drifted`);
  invariant(geometry.geometryStatus === disclosure.geometryReceipt.geometryStatus, `NMO ${id} geometry status drifted`);
  invariant(geometry.units === disclosure.sourceCoordinates.unit, `NMO ${id} coordinate unit drifted`);
  invariant(geometry.sourceFrame === disclosure.sourceCoordinates.sourceFrame, `NMO ${id} source frame drifted`);
  invariant(geometry.registration?.status === "unregistered" && geometry.registration?.registrationCount === 0
    && geometry.registration?.atlasTransform?.value === null && geometry.registration?.atlasPlacement?.value === null,
  `NMO ${id} gained registration or atlas placement`);
  invariant(computed, `NMO ${id} computed geometry receipt is unavailable`);
  invariant(sameJsonValue(computed.boundsMicrometre, disclosure.sourceCoordinates.boundsMicrometre), `NMO ${id} source bounds drifted`);
  invariant(sameJsonValue(computed.extentMicrometre, disclosure.sourceCoordinates.extentMicrometre), `NMO ${id} source extent drifted`);
  invariant(sameJsonValue(geometry.displayTransform, disclosure.sourceCoordinates.displayTransform), `NMO ${id} display transform drifted`);
  invariant(disclosure.preparation.dimensionality === "2D" ? computed.extentMicrometre[2] === 0 : computed.extentMicrometre[2] > 0,
    `NMO ${id} ${disclosure.preparation.dimensionality === "2D" ? "2D source object gained inferred z depth" : "3D source object lost observed z depth"}`);
  return true;
}
