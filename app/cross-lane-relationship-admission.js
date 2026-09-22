function byId(records, id) {
  return records.find((record) => record.id === id) ?? null;
}

function unique(values) {
  return [...new Set(values)];
}

function ensureKnown(record, label) {
  if (!record) throw new Error(`${label} must name a frozen release record`);
  return record;
}

export function relationshipAdmissionKinds(contract) {
  return contract.relationshipKinds.map((kind) => ({ ...kind }));
}

export function buildCrossLaneRelationshipProposal({
  entityId,
  sourceId,
  relationKindId,
  curatorQuestion = "",
  contract,
  researchRelease,
  catalog,
  traceContract,
  generatedAt,
}) {
  const entity = ensureKnown(byId(researchRelease.entities, entityId), "research entity");
  const source = ensureKnown(byId(catalog.sources, sourceId), "public source");
  const relationKind = ensureKnown(byId(contract.relationshipKinds, relationKindId), "candidate relation kind");
  const trimmedQuestion = typeof curatorQuestion === "string" ? curatorQuestion.trim().slice(0, 600) : "";
  const requiredEvidence = unique([...contract.commonRequiredEvidence, ...relationKind.requiredEvidence]);
  const blockers = [
    "No stable source-object ID is present in this package.",
    "No asset-level rights decision for a source object is present in this package.",
    "No independent relation evidence is present in this package.",
    "No predeclared validation plan is present in this package.",
    ...relationKind.requiredEvidence.map((item) => `Required evidence is not supplied: ${item}.`),
  ];
  return {
    proposalFormatVersion: "0.1.0",
    proposalReleaseId: contract.releaseId,
    proposalSchemaVersion: contract.schemaVersion,
    generatedAt,
    queueItemId: contract.queueItemId,
    admissionDecision: "not_admitted",
    candidateRelation: {
      id: relationKind.id,
      label: relationKind.label,
      boundary: relationKind.boundary,
    },
    researchRecord: {
      releaseId: researchRelease.releaseId,
      entityId: entity.id,
      recordStatus: "synthetic_evidence_entity_not_registered_cell",
    },
    publicSourceRecord: {
      catalogReleaseId: catalog.releaseId,
      sourceId: source.id,
      sourceTitle: source.title,
      sourceAdmissionStatus: source.admissionStatus,
    },
    sourceObject: {
      status: "not_identified_or_acquired_in_this_release",
      objectId: null,
      localChecksum: null,
      assetLevelRightsDecision: null,
    },
    evidenceReadiness: requiredEvidence.map((id) => ({ id, status: "not_supplied_in_this_release" })),
    blockers,
    curatorQuestion: trimmedQuestion || null,
    parentContracts: {
      provenanceTraceReleaseId: traceContract.releaseId,
      crossLanePolicy: traceContract.crossLanePolicy,
      nonPromotionPolicy: contract.nonPromotionPolicy,
    },
    sourceObjectsAcquired: false,
    registrationsCreated: 0,
  };
}

export function crossLaneRelationshipProposalFilename(proposal) {
  return `ohri-cross-lane-proposal-${proposal.researchRecord.entityId.replaceAll(".", "-")}-${proposal.publicSourceRecord.sourceId.toLowerCase()}.json`;
}
