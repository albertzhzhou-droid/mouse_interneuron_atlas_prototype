const CANONICAL_NEURITE_SOURCE_TYPES = Object.freeze([2, 3, 4]);
const UNAVAILABLE_NUMERIC_KEYS = Object.freeze([
  "nodeCount",
  "segmentCount",
  "cableLengthMicrometre",
  "terminalNodeCount",
  "bifurcationNodeCount",
  "maximumCentrifugalBranchOrder",
  "maximumRootEuclideanDistanceMicrometre",
  "shollProfile",
]);

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function isSortedUniquePositiveIntegerArray(value, { allowEmpty = true } = {}) {
  return Array.isArray(value)
    && (allowEmpty || value.length > 0)
    && value.every((item, index) => Number.isInteger(item)
      && item > 0
      && (index === 0 || item > value[index - 1]));
}

function validateShollProfile(profile, label) {
  check(Array.isArray(profile), `${label} Sholl profile is missing or malformed`);
  profile.forEach((point, index) => {
    check(
      point?.radiusMicrometre === (index + 1) * 10
      && Number.isInteger(point.intersectionCount)
      && point.intersectionCount >= 0,
      `${label} Sholl profile is malformed at shell ${index + 1}`,
    );
  });
}

function validateType1Domain(domain, topology, label) {
  check(domain.semanticStatus === "standardized_soma_samples_not_contour", `${label} source type 1 gained contour semantics`);
  check(Number.isInteger(domain.nodeCount) && domain.nodeCount > 0, `${label} source type 1 node count is invalid`);
  check(Number.isInteger(domain.segmentCount) && domain.segmentCount >= 0, `${label} source type 1 segment count is invalid`);
  check(
    isSortedUniquePositiveIntegerArray(domain.standardizedSomaSampleNodeIds, { allowEmpty: false })
    && domain.standardizedSomaSampleNodeIds.length === domain.nodeCount,
    `${label} source type 1 sample IDs are missing or malformed`,
  );
  check(
    isSortedUniquePositiveIntegerArray(domain.rootNodeIds, { allowEmpty: false })
    && domain.rootNodeIds.length === 1
    && domain.rootNodeIds[0] === topology.rootNodeId
    && domain.standardizedSomaSampleNodeIds.includes(topology.rootNodeId),
    `${label} source type 1 exact root membership is malformed`,
  );
  check(
    domain.neuriteMetrics?.status === "UNAVAILABLE"
    && domain.neuriteMetrics?.biologicalAbsenceClaim === false
    && typeof domain.neuriteMetrics?.reasonCode === "string",
    `${label} source type 1 neurite metrics did not fail closed`,
  );
  check(
    !("cableLengthMicrometre" in domain) && !("shollProfile" in domain),
    `${label} source type 1 gained contour-like cable or Sholl metrics`,
  );
}

function validateNeuriteDomain(domain, label) {
  check(Number.isInteger(domain.sourceType) && domain.sourceType >= 0 && domain.sourceType !== 1, `${label} neurite source type is invalid`);
  check(typeof domain.interpretation === "string" && domain.interpretation.length > 0, `${label} neurite interpretation is missing`);
  check(typeof domain.semanticStatus === "string" && domain.semanticStatus.length > 0, `${label} neurite semantic status is missing`);
  for (const key of [
    "nodeCount",
    "segmentCount",
    "terminalNodeCount",
    "bifurcationNodeCount",
    "maximumCentrifugalBranchOrder",
    "zeroLengthSegmentCount",
  ]) check(Number.isInteger(domain[key]) && domain[key] >= 0, `${label} ${key} is invalid`);
  for (const key of ["cableLengthMicrometre", "maximumRootEuclideanDistanceMicrometre"]) {
    check(Number.isFinite(domain[key]) && domain[key] >= 0, `${label} ${key} is invalid`);
  }
  check(
    isSortedUniquePositiveIntegerArray(domain.landmarkNodeIds?.bifurcationNodeIds)
    && domain.landmarkNodeIds.bifurcationNodeIds.length === domain.bifurcationNodeCount,
    `${label} bifurcation landmark IDs are missing or malformed`,
  );
  check(
    isSortedUniquePositiveIntegerArray(domain.landmarkNodeIds?.terminalNodeIds)
    && domain.landmarkNodeIds.terminalNodeIds.length === domain.terminalNodeCount,
    `${label} terminal landmark IDs are missing or malformed`,
  );
  validateShollProfile(domain.shollProfile, label);
}

function validateAvailability(availability, domains, label) {
  check(Array.isArray(availability), `${label} canonical neurite availability is missing or malformed`);
  check(
    availability.length === CANONICAL_NEURITE_SOURCE_TYPES.length
    && availability.every((item, index) => item?.sourceType === CANONICAL_NEURITE_SOURCE_TYPES[index]),
    `${label} canonical neurite availability must cover exactly source types 2, 3 and 4`,
  );
  availability.forEach((item) => {
    check(typeof item.interpretation === "string" && item.interpretation.length > 0, `${label} source type ${item.sourceType} availability interpretation is missing`);
    const domainIndex = domains.findIndex((domain) => domain.sourceType === item.sourceType);
    if (domainIndex >= 0) {
      check(
        item.status === "PRESENT" && item.sourceTypeDomainIndex === domainIndex,
        `${label} source type ${item.sourceType} present-domain pointer is malformed`,
      );
      return;
    }
    check(item.status === "UNAVAILABLE", `${label} absent source type ${item.sourceType} must be unavailable`);
    check(
      item.reasonCode === "source_type_not_present_in_deposited_geometry"
      && item.biologicalAbsenceClaim === false,
      `${label} absent source type ${item.sourceType} gained a biological-zero claim`,
    );
    check(
      !UNAVAILABLE_NUMERIC_KEYS.some((key) => Object.hasOwn(item, key)),
      `${label} absent source type ${item.sourceType} was padded with morphology values`,
    );
  });
}

/**
 * Runtime fail-closed guard for the checksum-pinned browser payload. It is
 * intentionally narrower than the release validator, but rejects every field
 * that the UI uses to express membership, availability, and type-1 authority.
 */
export function validateMorphologyTopologyPayload(payload, expected) {
  check(Number.isInteger(expected?.recordCount) && expected.recordCount > 0, "Topology-detail expected record denominator is invalid");
  check(Number.isInteger(expected?.frozenCensusRecordCount), "Topology-detail expected frozen denominator is invalid");
  check(Number.isInteger(expected?.supplementaryRecordCount), "Topology-detail expected supplementary denominator is invalid");
  check(
    expected.frozenCensusRecordCount + expected.supplementaryRecordCount === expected.recordCount,
    "Topology-detail expected membership denominators do not sum to the record denominator",
  );
  check(Array.isArray(payload?.records) && payload.records.length === expected.recordCount, "Topology-detail record denominator does not match the pinned contract");

  const ids = payload.records.map((record) => record?.neuronId);
  check(
    ids.every((neuronId, index) => Number.isInteger(neuronId) && neuronId > 0 && (index === 0 || neuronId > ids[index - 1])),
    "Topology-detail neuron identities are not unique positive sorted integers",
  );
  let frozenCensusRecordCount = 0;
  let supplementaryRecordCount = 0;

  for (const record of payload.records) {
    const label = `Topology-detail record ${record.neuronId}`;
    check(record.assetId === `NeuroMorpho:${record.neuronId}`, `${label} asset identity is malformed`);
    check(record.geometryReceipt?.registrationCount === 0, `${label} changed its source-frame authority`);
    const membership = record.membership;
    check(
      membership?.collection === "frozen_census" || membership?.collection === "supplementary",
      `${label} has an unknown membership collection`,
    );
    if (membership.collection === "frozen_census") frozenCensusRecordCount += 1;
    else supplementaryRecordCount += 1;
    const expectedMembership = membership.collection === "frozen_census"
      ? [1, 0, true]
      : [0, 1, false];
    check(
      membership.combinedCensusClaim === false
      && membership.frozenCensusContribution === expectedMembership[0]
      && membership.supplementaryContribution === expectedMembership[1]
      && membership.frozenCensusMembership === expectedMembership[2],
      `${label} changed its frozen-census membership`,
    );

    const topology = record.topology;
    check(topology && typeof topology === "object", `${label} topology is missing or malformed`);
    check(Number.isInteger(topology.rootNodeId) && topology.rootNodeId > 0, `${label} exact root node is missing or malformed`);
    check(
      isSortedUniquePositiveIntegerArray(topology.landmarks?.rootNodeIds, { allowEmpty: false })
      && topology.landmarks.rootNodeIds.length === 1
      && topology.landmarks.rootNodeIds[0] === topology.rootNodeId,
      `${label} has no exact single root landmark`,
    );
    check(isSortedUniquePositiveIntegerArray(topology.landmarks?.bifurcationNodeIds), `${label} bifurcation landmarks are missing or malformed`);
    check(isSortedUniquePositiveIntegerArray(topology.landmarks?.terminalNodeIds), `${label} terminal landmarks are missing or malformed`);
    check(/^[0-9a-f]{64}$/.test(topology.landmarks?.landmarkReceiptSha256 ?? ""), `${label} landmark receipt is missing or malformed`);

    const domains = topology.sourceTypeDomains;
    check(Array.isArray(domains) && domains.length >= 2, `${label} source-type domains are missing or malformed`);
    check(
      domains.every((domain, index) => Number.isInteger(domain?.sourceType)
        && domain.sourceType >= 0
        && (index === 0 || domain.sourceType > domains[index - 1].sourceType)),
      `${label} source-type domains are duplicated, unsorted, or malformed`,
    );
    const type1Domains = domains.filter((domain) => domain.sourceType === 1);
    check(type1Domains.length === 1, `${label} must retain exactly one source type 1 sample domain`);
    validateType1Domain(type1Domains[0], topology, label);
    domains.filter((domain) => domain.sourceType !== 1).forEach((domain) => {
      validateNeuriteDomain(domain, `${label} source type ${domain.sourceType}`);
    });
    validateAvailability(topology.canonicalNeuriteTypeAvailability, domains, label);
  }

  check(frozenCensusRecordCount === expected.frozenCensusRecordCount, "Topology-detail frozen-census membership denominator drifted");
  check(supplementaryRecordCount === expected.supplementaryRecordCount, "Topology-detail supplementary membership denominator drifted");
  return payload;
}

