function findById(records, id) {
  return records.find((record) => record.id === id) ?? null;
}

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"));
}

function locatorIsValid(kind, value) {
  if (kind === "publisher_object_url" || kind === "dataset_landing_page" || kind === "rights_statement_url") return /^https:\/\//.test(value);
  return value.length > 0;
}

function supportedFormat(manifest, contract) {
  return contract.supportedManifestFormats.find((format) => format.formatVersion === manifest?.formatVersion && format.sourceId === manifest?.sourceId) ?? null;
}

function checksumIsDeclared(value) {
  return value && typeof value === "object" && typeof value.algorithm === "string" && typeof value.value === "string" && value.value.length > 0;
}

export function buildPublicSourceAuthorizationPlan({ manifest, plan, catalog, admissionService, assertionContract, contract, generatedAt }) {
  const errors = [];
  const format = supportedFormat(manifest, contract);
  const source = findById(catalog.sources ?? [], manifest?.sourceId);
  const caseId = asTrimmedString(plan?.caseId);
  const linkedAssertionId = asTrimmedString(plan?.linkedAssertionId);
  const subjectReference = asTrimmedString(plan?.subjectReference);
  const objectVersion = asTrimmedString(plan?.objectVersion);
  const intendedUseScope = asTrimmedString(plan?.intendedUseScope);
  const requestedRightsDisposition = asTrimmedString(plan?.requestedRightsDisposition);
  const evidenceLocatorKind = asTrimmedString(plan?.evidenceLocatorKind);
  const evidenceLocator = asTrimmedString(plan?.evidenceLocator);
  const contentScopeDescription = asTrimmedString(plan?.contentScopeDescription);
  const curatorId = asTrimmedString(plan?.curatorId);
  const reviewDate = asTrimmedString(plan?.reviewDate);

  if (!format) errors.push("the imported metadata manifest is not supported by the frozen authorization-plan composer");
  if (!source) errors.push("the imported manifest source is absent from the frozen public-source catalogue");
  if (!Array.isArray(manifest?.files) || manifest.files.length < 1) errors.push("the imported manifest must retain at least one declared file record");
  if (!/^PAV-[A-Z0-9-]+-\d{4}-\d{2}-\d{2}$/.test(caseId)) errors.push("plan ID must be PAV-<MANIFEST>-YYYY-MM-DD");
  if (!/^PSA-[A-Z0-9-]+-\d{4}-\d{2}-\d{2}$/.test(linkedAssertionId)) errors.push("the linked assertion ID must use the PSA-<MANIFEST>-YYYY-MM-DD format");
  if (!objectVersion) errors.push("one declared public object version is required");
  if (!contract.intendedUseScopes.includes(intendedUseScope)) errors.push("the intended use scope is not allowed by the frozen composer");
  if (!contract.requestedRightsDispositions.includes(requestedRightsDisposition)) errors.push("the requested rights disposition is not allowed by the frozen composer");
  if (!contract.evidenceLocatorKinds.includes(evidenceLocatorKind) || !locatorIsValid(evidenceLocatorKind, evidenceLocator)) errors.push("the rights evidence locator must match its selected locator kind");
  if (!contentScopeDescription) errors.push("a planned content-scope description is required");
  if (!curatorId) errors.push("a local curator identifier is required for the plan activity");
  if (!isIsoDate(reviewDate)) errors.push("the review date must be a valid ISO date");

  const selectedFile = manifest?.files?.find((file) => file.id === subjectReference) ?? null;
  if (!selectedFile) errors.push("the plan must name exactly one declared file ID from the imported manifest");
  if (selectedFile && !checksumIsDeclared(selectedFile.sourceChecksum)) errors.push("the selected declared object must retain a publisher-declared source checksum for later comparison");
  if (selectedFile?.localSha256 !== null && selectedFile?.localSha256 !== undefined) errors.push("the selected object must remain explicitly unacquired with no local checksum");
  if (selectedFile && selectedFile.sourceUrl !== manifest?.files?.find((file) => file.id === subjectReference)?.sourceUrl) errors.push("the selected object URL must remain the imported manifest declaration");
  if (JSON.stringify(format?.requiredPlanStepIds ?? []) !== JSON.stringify(["object_identity_confirmation", "object_specific_rights_review", "authorized_acquisition_record", "local_checksum_verification", "content_scope_validation"])) errors.push("the frozen manifest format must retain all five required authorization and verification plan stages");
  if (contract.nonPromotion.authorizationStatus !== "not_authorized_by_this_plan" || contract.nonPromotion.verificationStatus !== "not_locally_verified") errors.push("the contract must remain non-promoting");
  if (assertionContract?.releaseId !== contract.assertionProvenanceReleaseId || admissionService?.releaseId !== contract.admissionServiceReleaseId) errors.push("the frozen predecessor contract identities do not match this plan contract");

  if (errors.length) return { errors, plan: null };
  return {
    errors,
    plan: {
      planFormatVersion: "0.1.0",
      composerReleaseId: contract.releaseId,
      composerSchemaVersion: contract.schemaVersion,
      generatedAt,
      queueItemId: contract.queueItemId,
      planStatus: contract.nonPromotion.planStatus,
      importedManifest: {
        manifestId: manifest.manifestId,
        formatVersion: manifest.formatVersion,
        sourceId: manifest.sourceId,
        datasetAccession: manifest.dataset?.accession ?? null,
      },
      publicSource: { catalogReleaseId: catalog.releaseId, sourceId: source.id, sourceTitle: source.title },
      linkedAssertion: { assertionId: linkedAssertionId, status: "not_authenticated_by_this_plan", composerReleaseId: assertionContract.releaseId },
      declaredObject: {
        fileId: selectedFile.id,
        stableName: selectedFile.stableName,
        sourceUrl: selectedFile.sourceUrl,
        objectVersion,
        declaredSourceChecksum: selectedFile.sourceChecksum,
        localSha256: null,
        status: "declared_unacquired_source_object",
      },
      intendedUse: { scope: intendedUseScope, status: "proposed_not_authorized" },
      requestedRightsReview: {
        requestedDisposition: requestedRightsDisposition,
        evidenceLocator: { kind: evidenceLocatorKind, value: evidenceLocator },
        status: contract.nonPromotion.authorizationStatus,
      },
      plannedVerificationStages: format.requiredPlanStepIds.map((id) => ({ id, status: "planned_not_executed" })),
      plannedContentScope: { description: contentScopeDescription, status: "not_inspected" },
      activity: { type: "curator_authorization_and_verification_planning", curatorId, reviewDate },
      authorizationStatus: contract.nonPromotion.authorizationStatus,
      verificationStatus: contract.nonPromotion.verificationStatus,
      sourceObjectsAcquired: false,
      sourceObjectsBundled: false,
      localChecksumsCalculated: false,
      contentInspected: false,
      registrationsCreated: 0,
      blockedActions: contract.nonPromotion.blockedActions,
      scientificBoundary: contract.scientificBoundary,
    },
  };
}

export function authorizationPlanFilename(plan) {
  return `ohri-authorization-verification-plan-${plan.activity.reviewDate}-${plan.declaredObject.fileId.toLowerCase()}.json`;
}
