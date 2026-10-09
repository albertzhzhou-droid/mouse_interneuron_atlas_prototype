import { findIndependentSourceObject } from "./independent-source-objects.js";
import { findCanoCholInProfile } from "./cano-chol-in-nucleus-roster.js";

export const SOURCE_RELATION_TYPES = Object.freeze(["same_physical_object", "same_section", "same_source_population", "co_display_only"]);
export const SOURCE_IDENTITY_LEVELS = Object.freeze(["specimen", "section", "cell", "component", "synapse"]);
const STATES = new Set(["known", "unknown", "ambiguous", "not_applicable"]);
const text = (value) => typeof value === "string" && value.length > 0 && value === value.trim()
  && [...value].every((character) => character.charCodeAt(0) > 31 && character.charCodeAt(0) !== 127);
const check = (condition, message) => { if (!condition) throw new Error(`Source identity: ${message}`); };
function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
function encoded(parts) { return parts.map((part) => encodeURIComponent(part)).join("/"); }

/** IDs stay strings; namespace is a source record-set, never a display label. */
export function sourceNamespacedObjectKey(identity) {
  const parts = [identity?.sourceId, identity?.releaseId, identity?.namespace, identity?.objectKind, identity?.objectId];
  if (!parts.every(text)) return null;
  try { return `source-object/v1/${encoded(parts)}`; } catch { return null; }
}

function node(input, level) {
  check(input && STATES.has(input.status), `${level} requires an explicit missingness state`);
  if (input.status === "known") {
    check(text(input.id) && text(input.locator), `${level} known ID needs a source string and exact locator`);
    check(input.reason === null || input.reason === undefined, `${level} known ID cannot carry a missingness reason`);
  } else {
    check(input.id === null && text(input.reason), `${level} missing/ambiguous ID must stay null with a reason`);
    check(input.locator === null || input.locator === undefined || text(input.locator), `${level} locator is invalid`);
  }
  return { status: input.status, id: input.id, locator: input.locator ?? null, reason: input.reason ?? null };
}

/** This is an identity/evidence contract, not an admission, registration or geometry generator. */
export function createSourceIdentityHierarchy(input) {
  const identity = { sourceId: input?.sourceId, releaseId: input?.releaseId, namespace: input?.namespace, objectKind: input?.objectKind, objectId: input?.objectId };
  const baseKey = sourceNamespacedObjectKey(identity);
  check(baseKey && text(input.objectLocator) && text(input.unit), "primary object scope, source locator and unit are required");
  check([...SOURCE_IDENTITY_LEVELS, "population"].includes(input.objectLevel), "primary object level must be explicit");
  const nodes = Object.fromEntries(SOURCE_IDENTITY_LEVELS.map((level) => [level, node(input.nodes?.[level], level)]));
  const population = node(input.population, "population");
  const primary = input.objectLevel === "population" ? population : nodes[input.objectLevel];
  check(primary.status === "known" && primary.id === identity.objectId, "primary native ID must match its explicit hierarchy level");
  const ancestorLevels = input.objectLevel === "population" ? [] : SOURCE_IDENTITY_LEVELS.slice(0, SOURCE_IDENTITY_LEVELS.indexOf(input.objectLevel));
  const key = `${baseKey}/scope/${encodeURIComponent(JSON.stringify(ancestorLevels.map((level) => [level, nodes[level].status, nodes[level].id])))}`;
  const parents = {};
  for (let index = 0; index < SOURCE_IDENTITY_LEVELS.length; index += 1) {
    const level = SOURCE_IDENTITY_LEVELS[index], current = nodes[level];
    const ancestors = SOURCE_IDENTITY_LEVELS.slice(0, index);
    const context = ancestors.map((name) => [name, nodes[name].status, nodes[name].id]);
    // Unknown parents are explicit tokens, not silently skipped hierarchy levels.
    current.key = current.status === "known" ? `source-node/v1/${encoded([identity.sourceId, identity.releaseId, identity.namespace, JSON.stringify(context), level, current.id])}` : null;
    if (index === 0) { parents[level] = { key: null, status: "not_applicable", reason: "Specimen is the root level; no parent is asserted." }; continue; }
    const parentLevel = SOURCE_IDENTITY_LEVELS[index - 1], parent = nodes[parentLevel];
    const support = input.parentEvidence?.[level];
    if (current.status === "known" && parent.status === "known" && support) {
      check(text(support.locator) && support.childId === current.id && support.parentId === parent.id && support.childLevel === level && support.parentLevel === parentLevel
        && support.sourceId === identity.sourceId && support.releaseId === identity.releaseId && support.namespace === identity.namespace,
      `${level} parent evidence does not bind the exact source, version, parent and child`);
      parents[level] = { key: parent.key, status: "source_reported", locator: support.locator, parentId: parent.id, childId: current.id };
    } else {
      check(!support, `${level} cannot retain a parent proof after its child or parent becomes missing`);
      parents[level] = { key: null, status: "not_established", reason: current.status !== "known" ? current.reason : parent.status !== "known" ? parent.reason : "No exact source parent/child linkage is retained." };
    }
  }
  return freeze({ documentType: "source_identity_hierarchy", schemaVersion: "0.1.0", ...identity, key,
    objectLocator: input.objectLocator, objectLevel: input.objectLevel, unit: input.unit, nodes, population, parents,
    parentEvidence: structuredClone(input.parentEvidence ?? {}),
    authority: "source_scoped_identity_metadata_only", geometryTransferAllowed: false, registrationCount: 0 });
}

export function validateSourceIdentityHierarchy(hierarchy) {
  const expected = createSourceIdentityHierarchy(hierarchy);
  check(JSON.stringify(hierarchy) === JSON.stringify(expected), "hierarchy keys, parent links or authority were changed");
  return expected;
}

const QC = Object.freeze({
  same_physical_object: ["exactObjectMappingVerified", "specimenIdentityVerified", "sourceFileReceiptsVerified"],
  same_section: ["exactSectionMappingVerified", "specimenIdentityVerified", "sourceFileReceiptsVerified"],
  same_source_population: ["exactPopulationAssignmentVerified", "sourceFileReceiptsVerified"],
});

/**
 * verifiedSourceEvidence is supplied by the trusted source adapter after its own
 * source-file/row QC, never by an imported user proposal. Changing an enum or
 * adding labels/markers/DOIs cannot manufacture an entry in this registry.
 */
export function resolveSourceRelationship(left, right, requested = "co_display_only", evidence = null, verifiedSourceEvidence = []) {
  left = validateSourceIdentityHierarchy(left); right = validateSourceIdentityHierarchy(right);
  check(SOURCE_RELATION_TYPES.includes(requested), "unknown relation type");
  const base = { documentType: "source_object_relationship", schemaVersion: "0.1.0", type: requested, leftKey: left.key, rightKey: right.key,
    grantsGeometryTransfer: false, sameCellInternalAdmission: false, registrationCount: 0 };
  if (requested === "co_display_only") {
    check(evidence === null, "co-display cannot carry an identity proof or silently promote it");
    return freeze({ ...base, evidence: null, qc: { status: "not_an_identity_assertion" }, reason: "Independent source objects. No physical object, section or population identity is asserted." });
  }
  check(evidence && text(evidence.id), "an identity relation needs independently verified source evidence");
  const found = verifiedSourceEvidence.filter((item) => item.id === evidence.id);
  check(found.length === 1 && JSON.stringify(found[0]) === JSON.stringify(evidence), "identity evidence is missing, changed or ambiguous in the verified source registry");
  check(evidence.type === requested && evidence.leftKey === left.key && evidence.rightKey === right.key && text(evidence.locator), "evidence type, endpoints or locator do not match the requested relation");
  check(QC[requested].every((name) => evidence.qc?.[name] === true), "the relation-specific source QC is incomplete");
  check(Array.isArray(evidence.sourceReceipts) && evidence.sourceReceipts.length > 0 && evidence.sourceReceipts.every((receipt) => text(receipt.path)
    && Number.isSafeInteger(receipt.bytes) && receipt.bytes > 0 && receipt.status === "verified"
    && ((receipt.algorithm === "SHA-256" && /^[a-f0-9]{64}$/.test(receipt.digest)) || (receipt.algorithm === "MD5" && /^[a-f0-9]{32}$/.test(receipt.digest)))), "identity proof needs verified exact source-file receipts");
  const requiredLevels = requested === "same_physical_object" ? ["specimen", "section", "cell"] : requested === "same_section" ? ["specimen", "section"] : [];
  for (const [side, hierarchy] of [["left", left], ["right", right]]) {
    const binding = evidence.bindings?.[side];
    check(binding && binding.sourceId === hierarchy.sourceId && binding.releaseId === hierarchy.releaseId && binding.namespace === hierarchy.namespace
      && binding.objectKind === hierarchy.objectKind && binding.objectId === hierarchy.objectId, "proof source/release/namespace/object binding was changed");
    for (const level of requiredLevels) {
      check(hierarchy.nodes[level].status === "known" && binding[level] === hierarchy.nodes[level].id, `${level} identity is missing or does not match the independent proof`);
      if (level !== "specimen") check(hierarchy.parents[level].status === "source_reported", `${level} has no exact source-supported parent chain`);
    }
    if (requested === "same_source_population") check(hierarchy.population.status === "known" && binding.population === hierarchy.population.id, "exact source-population assignment is missing or changed");
  }
  if (requested === "same_source_population") check(left.sourceId === right.sourceId && left.releaseId === right.releaseId && left.namespace === right.namespace
    && left.population.id === right.population.id, "a same-source population cannot merge releases, namespaces or different source populations");
  if (requested === "same_physical_object") check(evidence.qc.samePhysicalObjectNotMerelyParentChild === true, "belonging to the same cell does not make a cell and its nucleus the same physical object");
  if (requested === "same_physical_object" && left.sourceId === right.sourceId && left.releaseId === right.releaseId && left.namespace === right.namespace
      && left.nodes.cell.id === right.nodes.cell.id && left.objectId !== right.objectId) {
    const rootAndComponent = (root, component) => root.objectId === root.nodes.cell.id && component.objectId === component.nodes.component.id
      && component.parents.component.status === "source_reported";
    check(!rootAndComponent(left, right) && !rootAndComponent(right, left), "an exact parent cell and its distinct source component are not the same physical object");
  }
  return freeze({ ...base, evidence: structuredClone(evidence), qc: { status: "source_verified_for_this_relation_only" },
    reason: "Only the exact source relation is supported. Frame transforms, geometry reuse, complete anatomy and internal-layer admission require separate evidence." });
}

const missing = (reason) => ({ status: "unknown", id: null, locator: null, reason });
const known = (id, locator) => ({ status: "known", id, locator, reason: null });

/** Read canonical admitted records, rather than accepting rewritten UI identities. */
export function independentSourceIdentityHierarchy(index, key) {
  const record = findIndependentSourceObject(index, key);
  check(record, "exact source object/release is unavailable; no replacement hierarchy was created");
  const nodes = Object.fromEntries(SOURCE_IDENTITY_LEVELS.map((level) => [level, missing(`No exact ${level} ID is retained for this source object.`)]));
  const parentEvidence = {};
  let locator = record.structureCoverage[0].locator;
  if (record.sourceId === "microns-phase1" || record.sourceId === "banc-v888") {
    const relation = record.relationships.find((item) => item.sameCellContext === true);
    check(relation && relation.parent.sourceId === record.sourceId && relation.child.sourceId === record.sourceId
      && relation.parent.releaseId === record.releaseId && relation.child.releaseId === record.releaseId && text(relation.evidence.locator), "canonical cell/component parent scope is inconsistent");
    nodes.cell = known(relation.parent.sourceObjectId, relation.evidence.locator);
    if (record.objectKind === relation.child.objectKind) {
      nodes.component = known(relation.child.sourceObjectId, relation.evidence.locator);
      parentEvidence.component = { sourceId: record.sourceId, releaseId: record.releaseId, namespace: record.registryId,
        parentLevel: "cell", childLevel: "component", parentId: relation.parent.sourceObjectId, childId: relation.child.sourceObjectId, locator: relation.evidence.locator };
    }
    locator = relation.evidence.locator;
  } else {
    nodes.component = known(record.sourceObjectId, locator);
    if (record.sourceId === "super-clem-palm") nodes.specimen = known(record.sourceContract.acquisition.animalId, "data/super-clem-palm-localization-reference-0.1.json#acquisition/animalId");
  }
  return createSourceIdentityHierarchy({ sourceId: record.sourceId, releaseId: record.releaseId, namespace: record.registryId,
    objectKind: record.objectKind, objectId: record.sourceObjectId, objectLocator: locator,
    objectLevel: ["cell_root", "neuron_root"].includes(record.objectKind) ? "cell" : "component",
    unit: record.counts[0].unit, nodes, parentEvidence,
    population: missing("A class label, marker, shared study or root ID is not an exact source-population assignment.") });
}

function verifiedCanoProfile(registry, roster, profileId) {
  const profile = findCanoCholInProfile(registry, profileId);
  check(profile && roster?.registryReleaseId === registry.releaseId && roster.verification?.status === "verified"
    && roster.verification.uncompressedVerification === "runtime_sha256_verified"
    && roster.verification.uncompressedBytes === 428897
    && roster.verification.uncompressedSha256 === "2ec453defffb0a1a8ac7de27b3189d56059571166dd984f73356b5cdf0eaccb7"
    && roster.rows.length === 923 && roster.rows.filter((row) => row.profileId === profileId).length === profile.nucleusCount
    && roster.rows.filter((row) => row.profileId === profileId).every((row) => row.raw.groups === "CHOL_IN"
      && row.raw.neuron_types === profile.sourceLocalLabel && row.raw.confirmed_interneuron_profile_id === profileId),
  "Cano hierarchy requires the current runtime-verified roster and exact source profile");
  return profile;
}

/** A nucleus assignment is not a physical cell ID or an animal ID. */
export function canoSourceIdentityHierarchy(registry, roster, profileId, rowKey = null) {
  const profile = verifiedCanoProfile(registry, roster, profileId);
  const row = rowKey === null ? null : roster.rows.find((item) => item.key === rowKey && item.profileId === profileId);
  check(rowKey === null || row, "Cano row does not belong to the exact selected source profile");
  const nodes = Object.fromEntries(SOURCE_IDENTITY_LEVELS.map((level) => [level, missing(`No exact ${level} identity is established by this source metadata-row assignment.`)]));
  if (row) nodes.component = known(row.key, row.sourceLocator);
  const locator = `data/cano-gomez-p56-multiome-interneuron-registry-0.1.json#profiles/profileId=${encodeURIComponent(profile.profileId)}`;
  return createSourceIdentityHierarchy({ sourceId: registry.datasetId, releaseId: registry.releaseId,
    namespace: profile.sourceFileName, objectKind: row ? "nucleus_assignment" : "source_profile", objectId: row?.key ?? profile.profileId,
    objectLevel: row ? "component" : "population",
    objectLocator: row?.sourceLocator ?? locator, unit: row ? "source_local_nucleus_assignment" : "source_profile_aggregate",
    nodes, population: known(profile.profileId, locator) });
}

/** Construct only the source-population assertion actually checked by this roster. */
export function canoSourcePopulationEvidence(registry, roster, profileId, leftRowKey = null, rightRowKey = null) {
  verifiedCanoProfile(registry, roster, profileId);
  const left = canoSourceIdentityHierarchy(registry, roster, profileId, leftRowKey), right = canoSourceIdentityHierarchy(registry, roster, profileId, rightRowKey);
  const binding = (hierarchy) => Object.fromEntries(["sourceId", "releaseId", "namespace", "objectKind", "objectId"].map((name) => [name, hierarchy[name]]).concat([["population", hierarchy.population.id]]));
  return freeze({ id: `cano-profile-assignment/${encoded([profileId, left.objectId, right.objectId])}`,
    type: "same_source_population", leftKey: left.key, rightKey: right.key,
    locator: left.population.locator, bindings: { left: binding(left), right: binding(right) },
    qc: { exactPopulationAssignmentVerified: true, sourceFileReceiptsVerified: true },
    sourceReceipts: [{ path: `${roster.verification.url}#representation=decoded-csv`, bytes: roster.verification.uncompressedBytes,
      algorithm: "SHA-256", digest: roster.verification.uncompressedSha256, status: "verified", representation: "runtime_decoded_csv" }],
    boundary: "Deposited source metadata-row assignment only. No same physical cell, animal, cell geometry or cross-assay identity is established." });
}
