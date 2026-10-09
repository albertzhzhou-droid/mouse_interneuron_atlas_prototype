const RECEIPTS = Object.freeze({
  nativeDat: Object.freeze({
    path: "public/data/premotor_comparison_observed_morphology_route_pack_v1/original/nmo-45718.dat",
    bytes: 343774,
    sha256: "ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415",
  }),
  sourceSwc: Object.freeze({
    path: "public/data/premotor_comparison_observed_morphology_route_pack_v1/swc/nmo-45718.swc",
    bytes: 214337,
    sha256: "c8926708a1350c58124c47ebee8167820b8e0bd568bcb676e90e34f3ca6dfaee",
  }),
  nativeContours: Object.freeze({
    path: "public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json",
    bytes: 45606,
    sha256: "a0aa80ce0f12b08cfe61b2862f1b3a29f67a1105a722b0dceda2fd3b25e898e8",
  }),
  standardizedGeometry: Object.freeze({
    path: "public/data/premotor_comparison_observed_morphology_route_pack_v1/geometry/nmo-45718.json",
    bytes: 615468,
    sha256: "c5193dbca4f17bb945a034196dd7dee130096502c71e01b6e5aedacfcade8865",
    canonicalGeometrySha256: "08514c7c924c2b1ff444eb45f43e89ab1633bce64dc1618be148617e80de52a3",
  }),
});

const DAT_Z = Object.freeze([-29, -31, -33, -35, -37, -39, -41]);
const SWC_NODE_IDS = Object.freeze([2, 3, 4, 5, 6, 7, 8]);
const PRIMARY_FIT_INDICES = Object.freeze([0, 1, 2, 3, 4]);
const PRIMARY_HELD_OUT_INDICES = Object.freeze([5, 6]);
const SENSITIVITY_FIT_INDICES = Object.freeze([0, 2, 4, 6]);
const SENSITIVITY_HELD_OUT_INDICES = Object.freeze([1, 3, 5]);
const MAXIMUM_REFERENCE_SCREEN_MICROMETRE = 0.01;
const EXPECTED_TRANSFORM = Object.freeze({
  a: -0.9697188756534569,
  b: -0.21747445980265825,
  zOffsetMicrometre: 29,
});

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 1e-10) {
  return Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function same(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function validateReceipts(contract) {
  check(contract?.contractId === "neurolucida-dat-swc-coordinate-crosswalk-0.1", "DAT↔SWC crosswalk contract identity changed");
  check(contract?.record?.repository === "NeuroMorpho.Org" && contract.record.neuronId === 45718
    && contract.record.assetId === "NeuroMorpho:45718", "DAT↔SWC crosswalk must remain scoped to the exact NMO 45718 record");
  for (const [key, expected] of Object.entries(RECEIPTS)) {
    const actual = contract.receipts?.[key];
    check(isRecord(actual) && actual.path === expected.path && actual.bytes === expected.bytes && actual.sha256 === expected.sha256,
      `NMO 45718 ${key} source receipt changed`);
    if (expected.canonicalGeometrySha256) {
      check(actual.canonicalGeometrySha256 === expected.canonicalGeometrySha256, "NMO 45718 canonical geometry receipt changed");
    }
  }
}

function centroid(contour) {
  check(Array.isArray(contour.points) && contour.points.length === contour.vertexCount && contour.points.length > 0,
    `Contour ${contour.id ?? "(unknown)"} point count is invalid`);
  let x = 0;
  let y = 0;
  const z = contour.points[0]?.[2];
  for (const point of contour.points) {
    check(Array.isArray(point) && point.length === 4 && point.every(Number.isFinite), `Contour ${contour.id} has an invalid point`);
    check(point[2] === z, `NMO 45718 contour ${contour.id} is not a single source-Z level`);
    x += point[0] / contour.points.length;
    y += point[1] / contour.points.length;
  }
  return { x, y, z };
}

function fitReflectedSimilarity(source, target, indices) {
  const sourceXMean = indices.reduce((sum, i) => sum + source[i].x / indices.length, 0);
  const sourceYMean = indices.reduce((sum, i) => sum + source[i].y / indices.length, 0);
  const targetXMean = indices.reduce((sum, i) => sum + target[i].x / indices.length, 0);
  const targetYMean = indices.reduce((sum, i) => sum + target[i].y / indices.length, 0);
  let denominator = 0;
  let aNumerator = 0;
  let bNumerator = 0;
  for (const index of indices) {
    const dx = source[index].x - sourceXMean;
    const dy = source[index].y - sourceYMean;
    const tx = target[index].x - targetXMean;
    const ty = target[index].y - targetYMean;
    denominator += dx * dx + dy * dy;
    aNumerator += dx * tx - dy * ty;
    bNumerator += dy * tx + dx * ty;
  }
  check(denominator > 0, "NMO 45718 crosswalk fit landmarks are degenerate");
  return {
    a: aNumerator / denominator,
    b: bNumerator / denominator,
    sourceXMean,
    sourceYMean,
    targetXMean,
    targetYMean,
    zOffsetMicrometre: 29,
  };
}

function fitProperRotation(source, target, indices) {
  const sourceXMean = indices.reduce((sum, i) => sum + source[i].x / indices.length, 0);
  const sourceYMean = indices.reduce((sum, i) => sum + source[i].y / indices.length, 0);
  const targetXMean = indices.reduce((sum, i) => sum + target[i].x / indices.length, 0);
  const targetYMean = indices.reduce((sum, i) => sum + target[i].y / indices.length, 0);
  let denominator = 0;
  let cosineNumerator = 0;
  let sineNumerator = 0;
  for (const index of indices) {
    const dx = source[index].x - sourceXMean;
    const dy = source[index].y - sourceYMean;
    const tx = target[index].x - targetXMean;
    const ty = target[index].y - targetYMean;
    denominator += dx * dx + dy * dy;
    cosineNumerator += dx * tx + dy * ty;
    sineNumerator += dx * ty - dy * tx;
  }
  return {
    cosine: cosineNumerator / denominator,
    sine: sineNumerator / denominator,
    sourceXMean,
    sourceYMean,
    targetXMean,
    targetYMean,
  };
}

function transformPoint(point, transform) {
  const x = point[0] - transform.sourceXMean;
  const y = point[1] - transform.sourceYMean;
  return [
    transform.a * x + transform.b * y + transform.targetXMean,
    transform.b * x - transform.a * y + transform.targetYMean,
    point[2] + transform.zOffsetMicrometre,
  ];
}

function reflectedResiduals(source, target, transform) {
  return source.map((point, index) => {
    const mapped = transformPoint([point.x, point.y, point.z], transform);
    return Math.hypot(mapped[0] - target[index].x, mapped[1] - target[index].y);
  });
}

function rotationResiduals(source, target, transform) {
  return source.map((point, index) => {
    const x = point.x - transform.sourceXMean;
    const y = point.y - transform.sourceYMean;
    const mappedX = transform.cosine * x - transform.sine * y + transform.targetXMean;
    const mappedY = transform.sine * x + transform.cosine * y + transform.targetYMean;
    return Math.hypot(mappedX - target[index].x, mappedY - target[index].y);
  });
}

function summarizeResiduals(residuals, indices) {
  const selected = indices.map((index) => residuals[index]);
  return {
    count: selected.length,
    rmsMicrometre: Math.sqrt(selected.reduce((sum, value) => sum + value * value, 0) / selected.length),
    maximumMicrometre: Math.max(...selected),
    valuesMicrometre: selected,
  };
}

function validateSourceRecords(contourPayload, geometryPayload) {
  check(isRecord(contourPayload) && contourPayload.assetId === "NeuroMorpho:45718"
    && contourPayload.sourceFrame === "Neurolucida_DAT_source_native_unregistered"
    && contourPayload.units === "micrometre_interpreted_from_Neurolucida_semantics",
  "NMO 45718 source-native contour identity or frame changed");
  check(isRecord(geometryPayload) && geometryPayload.assetId === "NeuroMorpho:45718" && geometryPayload.neuronId === 45718
    && geometryPayload.sourceFrame === "NeuroMorpho_CNG_standardized_local_frame"
    && geometryPayload.units === "micrometre_reported_by_source"
    && geometryPayload.registration?.status === "unregistered" && geometryPayload.registration?.registrationCount === 0,
  "NMO 45718 standardized geometry identity, frame, units or registration boundary changed");
  check(Array.isArray(contourPayload.contours) && contourPayload.contours.length === 8, "NMO 45718 native contour inventory changed");
  const somaContours = contourPayload.contours.filter((contour) => contour.sourceName === "Soma 1");
  check(somaContours.length === 7 && somaContours.every((contour) => contour.sourceClosedFlag === true && contour.interpretedClosed === true),
    "NMO 45718 Soma 1 contour set no longer has seven source-closed loops");
  check(contourPayload.contours.at(-1)?.sourceName === "Cell Body" && contourPayload.contours.at(-1)?.sourceClosedFlag === false,
    "NMO 45718 legacy Cell Body closure exception must remain separate");
  check(same(somaContours.map((contour) => contour.vertexCount), [21, 30, 40, 37, 50, 40, 34]), "NMO 45718 Soma 1 vertex inventory changed");
  check(Array.isArray(geometryPayload.nodes) && geometryPayload.nodes.length === 5636
    && Array.isArray(geometryPayload.segments) && geometryPayload.segments.length === 5635,
  "NMO 45718 standardized SWC geometry node/segment inventory changed");
  const somaNodes = geometryPayload.nodes.filter((node) => Array.isArray(node) && node[1] === 1).toSorted((left, right) => left[0] - right[0]);
  check(same(somaNodes.map((node) => node[0]), [1, 2, 3, 4, 5, 6, 7, 8]), "NMO 45718 type-1 SWC node inventory changed");
  check(same(geometryPayload.swc?.nodeTypeCounts, { "1": 8, "2": 4237, "3": 1391 }), "NMO 45718 SWC type counts changed");
  return { somaContours, somaNodes: somaNodes.slice(1) };
}

function calculateAudit(contours, nodes) {
  const source = contours.map((contour) => centroid(contour));
  const target = nodes.map((node) => ({ x: node[2], y: node[3], z: node[4], nodeId: node[0] }));
  check(same(source.map((point) => point.z), DAT_Z), "NMO 45718 source contour z ordering changed");
  check(same(target.map((point) => point.nodeId), SWC_NODE_IDS) && same(target.map((point) => point.z), [0, -2, -4, -6, -8, -10, -12]),
    "NMO 45718 standardized soma-node ordering changed");
  check(source.every((point, index) => close(point.z - target[index].z, -29, 1e-12)), "NMO 45718 DAT/SWC z offset is not constant at 29 µm");

  const primary = fitReflectedSimilarity(source, target, PRIMARY_FIT_INDICES);
  const primaryResiduals = reflectedResiduals(source, target, primary);
  const sensitivity = fitReflectedSimilarity(source, target, SENSITIVITY_FIT_INDICES);
  const sensitivityResiduals = reflectedResiduals(source, target, sensitivity);
  const proper = fitProperRotation(source, target, PRIMARY_FIT_INDICES);
  const properResiduals = rotationResiduals(source, target, proper);
  const scale = Math.hypot(primary.a, primary.b);
  const primaryHeldOut = summarizeResiduals(primaryResiduals, PRIMARY_HELD_OUT_INDICES);
  const sensitivityHeldOut = summarizeResiduals(sensitivityResiduals, SENSITIVITY_HELD_OUT_INDICES);
  const properPrimaryHeldOut = summarizeResiduals(properResiduals, PRIMARY_HELD_OUT_INDICES);
  check(close(primary.a, EXPECTED_TRANSFORM.a, 2e-12) && close(primary.b, EXPECTED_TRANSFORM.b, 2e-12)
    && primary.zOffsetMicrometre === EXPECTED_TRANSFORM.zOffsetMicrometre,
  "NMO 45718 primary same-record transform no longer matches its independently audited fit");
  check(primaryHeldOut.maximumMicrometre <= MAXIMUM_REFERENCE_SCREEN_MICROMETRE
    && sensitivityHeldOut.maximumMicrometre <= MAXIMUM_REFERENCE_SCREEN_MICROMETRE
    && properPrimaryHeldOut.maximumMicrometre > MAXIMUM_REFERENCE_SCREEN_MICROMETRE,
  "NMO 45718 transform no longer passes the display-consistency screen or reflection model selection");
  return {
    transform: { ...primary, scale, determinant: -(primary.a * primary.a + primary.b * primary.b) },
    correspondence: {
      method: "same-record ordered source-closed Soma 1 contours paired by consecutive 2 µm z levels to standardized SWC type-1 nodes; correspondence is a project-derived audit, not source-deposited point identity",
      sourceContourIds: contours.map((contour) => contour.id),
      sourceNodeIds: target.map((node) => node.nodeId),
      sourceZMicrometre: source.map((point) => point.z),
      standardizedZMicrometre: target.map((point) => point.z),
      zOffsetMicrometre: 29,
      sourceVertexCount: contours.reduce((sum, contour) => sum + contour.vertexCount, 0),
    },
    validation: {
      model: "2D reflection + rotation + uniform scale + translation; independent z translation",
      primaryFit: {
        fitContourIndicesZeroBased: [...PRIMARY_FIT_INDICES],
        heldOutContourIndicesZeroBased: [...PRIMARY_HELD_OUT_INDICES],
        fitNodeIds: PRIMARY_FIT_INDICES.map((index) => target[index].nodeId),
        heldOutNodeIds: PRIMARY_HELD_OUT_INDICES.map((index) => target[index].nodeId),
        training: summarizeResiduals(primaryResiduals, PRIMARY_FIT_INDICES),
        heldOut: primaryHeldOut,
      },
      alternatingSensitivity: {
        fitContourIndicesZeroBased: [...SENSITIVITY_FIT_INDICES],
        heldOutContourIndicesZeroBased: [...SENSITIVITY_HELD_OUT_INDICES],
        fitNodeIds: SENSITIVITY_FIT_INDICES.map((index) => target[index].nodeId),
        heldOutNodeIds: SENSITIVITY_HELD_OUT_INDICES.map((index) => target[index].nodeId),
        heldOut: sensitivityHeldOut,
      },
      properRotationAlternative: {
        heldOut: properPrimaryHeldOut,
        rejected: true,
        rejectionReason: "A proper-rotation-only model fails the predeclared 0.01 µm display-consistency screen on primary held-out points; this supports the reflection family for this record only.",
      },
      displayConsistencyScreen: {
        maximumHeldOutResidualMicrometre: MAXIMUM_REFERENCE_SCREEN_MICROMETRE,
        designation: "last-place digitization consistency screen only; not measurement accuracy, biological tolerance, anatomical truth or generalizable registration confidence",
        passed: true,
      },
    },
  };
}

export function buildNmo45718DatSwcCrosswalkAudit(contourPayload, geometryPayload) {
  const { somaContours, somaNodes } = validateSourceRecords(contourPayload, geometryPayload);
  return calculateAudit(somaContours, somaNodes);
}

export function validateNmo45718DatSwcCrosswalk(contract, contourPayload, geometryPayload) {
  validateReceipts(contract);
  const calculated = buildNmo45718DatSwcCrosswalkAudit(contourPayload, geometryPayload);
  check(contract.sourceFrames?.nativeDat === "Neurolucida_DAT_source_native_unregistered"
    && contract.sourceFrames?.standardizedSwc === "NeuroMorpho_CNG_standardized_local_frame",
  "NMO 45718 crosswalk source-frame pair changed");
  check(same(contract.correspondence, calculated.correspondence), "NMO 45718 crosswalk correspondence receipt does not reproduce");
  check(same(contract.validation, calculated.validation), "NMO 45718 crosswalk validation receipt does not reproduce");
  check(same(contract.transform, calculated.transform), "NMO 45718 crosswalk transform receipt does not reproduce");

  const somaContours = contourPayload.contours
    .filter((contour) => contour.sourceName === "Soma 1")
    .map((contour) => ({
      id: contour.id,
      sourceName: contour.sourceName,
      vertexCount: contour.vertexCount,
      points: contour.points.map((point) => transformPoint(point, calculated.transform)),
    }));
  const skeletonSegments = geometryPayload.segments.map((segment, index) => {
    check(Array.isArray(segment) && segment.length === 10 && segment.slice(0, 9).every(Number.isFinite),
      `NMO 45718 standardized segment ${index} is invalid`);
    return segment;
  });
  return {
    neuronId: 45718,
    assetId: "NeuroMorpho:45718",
    authority: "OBS_SAME_RECORD_COORDINATE_CROSSWALK",
    sourceFrames: contract.sourceFrames,
    transform: calculated.transform,
    validation: calculated.validation,
    correspondence: calculated.correspondence,
    somaContours,
    skeletonSegments,
    excludedContourIds: [contourPayload.contours.at(-1).id],
    boundaries: {
      sameRecordOnly: true,
      atlasRegistrationCount: 0,
      surfaceCount: 0,
      meshCount: 0,
      volumeCount: 0,
      internalStructureObjectCount: 0,
      biologicalMeasurementCount: 0,
      inferredAnatomyCount: 0,
      sameCellInternalStructureClaim: false,
      cellBodyContourJoined: false,
    },
  };
}

export const NMO_45718_DAT_SWC_CROSSWALK_RECEIPTS = RECEIPTS;
