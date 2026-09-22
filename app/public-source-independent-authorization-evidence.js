function text(value) { return typeof value === "string" ? value.trim() : ""; }
function byId(records, id) { return records.find((record) => record.id === id) ?? null; }
function isDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z")); }
function supported(manifest, contract) { return contract.supportedManifestFormats.find((format) => format.formatVersion === manifest?.formatVersion && format.sourceId === manifest?.sourceId) ?? null; }
function locatorValid(kind, value) { return kind.includes("url") || kind === "publisher_object_url" || kind === "dataset_landing_page" ? /^https:\/\//.test(value) : value.length > 0; }

export function buildIndependentAuthorizationEvidencePacket({ manifest, packet, catalog, assertionContract, authorizationPlanContract, contract, generatedAt }) {
  const errors = [];
  const format = supported(manifest, contract);
  const source = byId(catalog.sources ?? [], manifest?.sourceId);
  const packetId = text(packet?.packetId);
  const planId = text(packet?.planId);
  const fileId = text(packet?.fileId);
  const objectVersion = text(packet?.objectVersion);
  const reviewerRole = text(packet?.reviewerRole);
  const reviewerId = text(packet?.reviewerId);
  const evidenceState = text(packet?.evidenceState);
  const scope = text(packet?.scope);
  const locatorKind = text(packet?.locatorKind);
  const locator = text(packet?.locator);
  const curatorId = text(packet?.curatorId);
  const reviewDate = text(packet?.reviewDate);
  const selectedFile = manifest?.files?.find((file) => file.id === fileId) ?? null;
  if (!format) errors.push("the imported metadata manifest is not supported by the frozen evidence-packet composer");
  if (!source) errors.push("the imported manifest source is absent from the frozen public-source catalogue");
  if (!/^PAE-[A-Z0-9-]+-\d{4}-\d{2}-\d{2}$/.test(packetId)) errors.push("packet ID must be PAE-<MANIFEST>-YYYY-MM-DD");
  if (!/^PAV-[A-Z0-9-]+-\d{4}-\d{2}-\d{2}$/.test(planId)) errors.push("the linked authorization-plan ID must use the PAV-<MANIFEST>-YYYY-MM-DD format");
  if (!selectedFile) errors.push("the packet must name exactly one declared file ID from the imported manifest");
  if (!objectVersion) errors.push("one declared public object version is required");
  if (!contract.independentReviewerRoles.includes(reviewerRole)) errors.push("the independent reviewer role is not allowed by the frozen composer");
  if (reviewerRole !== "unresolved" && !reviewerId) errors.push("a proposed independent reviewer identifier is required unless the role is unresolved");
  if (!contract.evidenceRecordStates.includes(evidenceState)) errors.push("the evidence-record state is not allowed by the frozen composer");
  if (!contract.requestedExecutionScopes.includes(scope)) errors.push("the requested execution scope is not allowed by the frozen composer");
  if (!contract.evidenceLocatorKinds.includes(locatorKind) || !locatorValid(locatorKind, locator)) errors.push("the evidence locator must match its selected locator kind");
  if (!curatorId || !isDate(reviewDate)) errors.push("a local curator identifier and valid ISO review date are required");
  if (selectedFile?.localSha256 !== null && selectedFile?.localSha256 !== undefined) errors.push("the selected object must remain explicitly unacquired with no local checksum");
  if (!selectedFile?.sourceChecksum?.algorithm || !selectedFile?.sourceChecksum?.value) errors.push("the selected object must retain a declared source checksum for future comparison");
  if (JSON.stringify(format?.requiredReviewStageIds ?? []) !== JSON.stringify(["authority_identity_confirmation", "object_specific_terms_scope_review", "authorized_retrieval_conditions", "local_integrity_comparison", "content_scope_retention_review"])) errors.push("the frozen format must retain all five independent-review stages");
  if (assertionContract?.releaseId !== contract.assertionProvenanceReleaseId || authorizationPlanContract?.releaseId !== contract.authorizationPlanReleaseId) errors.push("the frozen predecessor contract identities do not match this evidence-packet contract");
  if (errors.length) return { errors, packet: null };
  return { errors, packet: {
    packetFormatVersion: "0.1.0", composerReleaseId: contract.releaseId, composerSchemaVersion: contract.schemaVersion, generatedAt, queueItemId: contract.queueItemId,
    packetStatus: contract.nonPromotion.packetStatus,
    importedManifest: { manifestId: manifest.manifestId, formatVersion: manifest.formatVersion, sourceId: manifest.sourceId, datasetAccession: manifest.dataset?.accession ?? null },
    publicSource: { catalogReleaseId: catalog.releaseId, sourceId: source.id, sourceTitle: source.title },
    linkedAuthorizationPlan: { planId, status: "not_authenticated_by_this_packet", composerReleaseId: authorizationPlanContract.releaseId },
    declaredObject: { fileId: selectedFile.id, stableName: selectedFile.stableName, sourceUrl: selectedFile.sourceUrl, objectVersion, declaredSourceChecksum: selectedFile.sourceChecksum, localSha256: null, status: "declared_unacquired_source_object" },
    independentReviewRequest: { reviewerRole, reviewerId: reviewerRole === "unresolved" ? null : reviewerId, evidenceState, requestedExecutionScope: scope, evidenceLocator: { kind: locatorKind, value: locator }, authorityStatus: contract.nonPromotion.authorityStatus },
    plannedReviewStages: format.requiredReviewStageIds.map((id) => ({ id, status: "planned_not_executed" })),
    activity: { type: "curator_independent_authorization_evidence_packet_preparation", curatorId, reviewDate },
    executionStatus: contract.nonPromotion.executionStatus, verificationStatus: contract.nonPromotion.verificationStatus,
    sourceObjectsAcquired: false, credentialsStored: false, sourceObjectsBundled: false, localChecksumsCalculated: false, contentInspected: false, dataRetained: false, registrationsCreated: 0,
    blockedActions: contract.nonPromotion.blockedActions, scientificBoundary: contract.scientificBoundary,
  }};
}

export function independentAuthorizationEvidencePacketFilename(packet) { return "ohri-independent-authorization-evidence-" + packet.activity.reviewDate + "-" + packet.declaredObject.fileId.toLowerCase() + ".json"; }
