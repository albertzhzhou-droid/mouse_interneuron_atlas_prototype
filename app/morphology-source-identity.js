import disclosure from "../data/morphology-source-frame-disclosure-0.1.json" with { type: "json" };
import supplementary from "../data/supplementary-morphology-comparison-adapter-0.1.json" with { type: "json" };
import { createSourceIdentityHierarchy, resolveSourceRelationship } from "./source-object-identity.js";

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]));
  return value;
}
const same = (a, b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
const check = (ok, message) => { if (!ok) throw new Error(`Morphology source identity: ${message}`); };
const missing = (reason) => ({ status: "unknown", id: null, locator: null, reason });
const censusNamespace = "neuromorpho:8.6.124:adult-mouse-spinal-interneuron-census-v1";
check(disclosure.contractId === "morphology-source-frame-disclosure-0.1" && disclosure.records.length === 149
  && disclosure.contractContentSha256 === "cd6b85eb5961e49667bdc126b0230fba35db534fdcc2c8008d5655893978a8ad"
  && supplementary.sourceCensus.assetSetId === censusNamespace && supplementary.records.length === 7,
"the pinned 142 + 7 identity roster changed");

/** The repository observation is known; its physical cell, animal and section are not supplied by this roster. */
export function morphologySourceIdentityHierarchy(record) {
  const matches = disclosure.records.filter(row => row.neuronId === record?.neuronId);
  check(matches.length === 1, "exact object is outside the pinned 149-record roster");
  const canonical = matches[0], membership = record.comparisonMembership;
  check(record.assetId === canonical.assetId && same(canonical.membership, {
    collection: membership?.collection, censusContribution: membership?.censusContribution,
    supplementaryContribution: membership?.supplementaryContribution,
  }), "object or frozen collection membership changed");
  check(record.geometry?.available === true && ["path", "bytes", "sha256", "rawSwcSha256"].every(name => record.geometry[name] === canonical.geometryReceipt[name]),
    "source geometry/file receipt differs from the exact admitted object");
  check(record.normalizedMetadata?.sourceFrame === canonical.sourceCoordinates.sourceFrame
    && record.normalizedMetadata?.dimensionality === canonical.preparation.dimensionality,
  "source frame or dimensionality changed");
  let namespace, locator;
  if (membership.collection === "census") {
    check(["routeId", "routeContractPath", "routeContractSha256", "routeAssetManifestPath", "routeAssetManifestSha256"].every(name => membership[name] === null),
      "frozen census cannot acquire supplementary route identity");
    namespace = censusNamespace;
    locator = `public/data/neuromorpho_release_8_6_124_census_v1/census-index.json#records/neuronId=${record.neuronId}`;
  } else {
    const selected = supplementary.records.filter(row => row.neuronId === record.neuronId);
    check(selected.length === 1 && same(selected[0].comparisonMembership, membership), "exact supplementary route/release receipt changed");
    namespace = selected[0].geometry.sourceAssetSetId;
    check(typeof namespace === "string" && namespace.startsWith("neuromorpho:8.6.124:"), "supplementary namespace is not the pinned source release");
    locator = `data/supplementary-morphology-comparison-adapter-0.1.json#records/neuronId=${record.neuronId}`;
  }
  const reportedRelease = record.officialMetadata?.repositoryRelease;
  check(reportedRelease === undefined || reportedRelease === "8.6.124", "record release differs from the admitted observation");
  check([record.officialMetadata?.neuron_id, record.officialMetadata?.neuronId].every(id => id === undefined || id === record.neuronId),
    "the official native ID differs from the selected observation");
  check(record.geometry.sourceAssetSetId === undefined || record.geometry.sourceAssetSetId === namespace,
    "geometry namespace differs from the exact source collection");
  check([record.missingness?.specimenId, record.missingness?.donorId].every(field => field === undefined || field.value === null),
    "the admitted roster cannot acquire a physical specimen or donor identifier");
  const nativeId = String(record.neuronId);
  return createSourceIdentityHierarchy({ sourceId: "NeuroMorpho.Org", releaseId: "8.6.124", namespace,
    objectKind: "swc_reconstruction", objectId: nativeId, objectLevel: "component",
    objectLocator: locator, unit: "repository_morphology_record",
    nodes: {
      specimen: missing("The official API roster retains no stable physical specimen or donor ID; age, strain and archive are source context."),
      section: missing("Slicing direction, thickness and region do not identify an exact physical section."),
      cell: missing("The repository neuron ID identifies this deposited reconstruction; no independent physical-cell identifier or experimental parent chain is retained."),
      component: { status: "known", id: nativeId, locator, reason: null },
      synapse: missing("The SWC observation has no exact synapse identity or parent linkage."),
    }, population: missing("Source labels, archive, DOI and comparison membership do not establish a source-population assignment."), parentEvidence: {} });
}

export function morphologyComparisonSourceRelationships(records) {
  check(Array.isArray(records) && records.length >= 2 && records.length <= 4, "a comparison requires two to four exact observations");
  const identities = records.map(morphologySourceIdentityHierarchy);
  check(new Set(identities.map(row => row.key)).size === identities.length, "comparison identities must be unique");
  return identities.flatMap((left, i) => identities.slice(i + 1).map(right => resolveSourceRelationship(left, right)));
}

/** Exported/imported declarations cannot promote co-display to identity or rewrite known/unknown hierarchy nodes. */
export function validateMorphologyComparisonIdentityReceipt(receipt) {
  const records = receipt?.sourceObjects?.map(row => ({ neuronId: row.neuronId, assetId: row.assetId,
    comparisonMembership: row.membership, geometry: { ...row.geometry, available: true },
    normalizedMetadata: { sourceFrame: row.sourceFrame, dimensionality: row.dimensionality } }));
  check(receipt?.relationshipClass === "co_display_only" && Array.isArray(records), "comparison relationship declaration changed");
  const expected = records.map(morphologySourceIdentityHierarchy);
  check(receipt.sourceObjects.every((row, index) => same(row.sourceIdentity, expected[index])), "saved source identity or its missingness changed");
  check(same(receipt.sourceRelationships, morphologyComparisonSourceRelationships(records)), "pairwise source relationships or endpoints changed");
  return true;
}
