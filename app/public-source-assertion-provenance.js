function findById(records, id) {
  return records.find((record) => record.id === id) ?? null;
}

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function supportedFormat(manifest, admissionService) {
  return admissionService.supportedManifestFormats.find((format) => format.formatVersion === manifest?.formatVersion && format.sourceId === manifest?.sourceId) ?? null;
}

function checkScope(checkId) {
  const scopes = {
    manifest_identity: "manifest_identity",
    catalogue_source_match: "manifest_identity",
    publisher_object_url: "object_locator",
    declared_source_checksum: "declared_source_checksum",
    null_local_checksum: "local_verification_missingness",
    coordinate_metadata_or_missingness: "coordinate_metadata",
    specimen_identity: "specimen_metadata",
    source_frame_or_missingness: "coordinate_metadata",
    preprint_disclosure: "preprint_status",
    asset_level_rights_review: "asset_rights_metadata",
  };
  return scopes[checkId] ?? null;
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"));
}

function locatorIsValid(kind, value) {
  if (kind === "publisher_object_url" || kind === "dataset_landing_page") return /^https:\/\//.test(value);
  return value.length > 0;
}

export function buildPublicSourceAssertionProvenanceReceipt({ manifest, assertion, catalog, admissionService, contract, generatedAt }) {
  const errors = [];
  const format = supportedFormat(manifest, admissionService);
  if (!format) errors.push("the imported metadata manifest is not supported by the frozen release-admission service");
  const source = findById(catalog.sources ?? [], manifest?.sourceId);
  if (!source) errors.push("the imported manifest source is absent from the frozen public-source catalogue");
  if (!Array.isArray(manifest?.files) || manifest.files.length < 1) errors.push("the imported manifest must retain at least one declared file record");

  const assertionId = asTrimmedString(assertion?.assertionId);
  const checkId = asTrimmedString(assertion?.checkId);
  const sourceState = asTrimmedString(assertion?.sourceState);
  const subjectKind = asTrimmedString(assertion?.subjectKind);
  const subjectReference = asTrimmedString(assertion?.subjectReference);
  const locatorKind = asTrimmedString(assertion?.evidenceLocatorKind);
  const evidenceLocator = asTrimmedString(assertion?.evidenceLocator);
  const assertedValue = asTrimmedString(assertion?.assertedValue);
  const curatorId = asTrimmedString(assertion?.curatorId);
  const reviewDate = asTrimmedString(assertion?.reviewDate);

  if (!/^PSA-[A-Z0-9-]+-\d{4}-\d{2}-\d{2}$/.test(assertionId)) errors.push("assertion ID must be PSA-<MANIFEST>-YYYY-MM-DD");
  if (!format?.requiredChecks.includes(checkId)) errors.push("the selected assertion check is not required by this frozen manifest format");
  if (!contract.assertionSourceStates.includes(sourceState)) errors.push("the assertion source state is not allowed by the frozen composer");
  if (!contract.subjectKinds.includes(subjectKind)) errors.push("the assertion subject kind is not allowed by the frozen composer");
  if (!contract.evidenceLocatorKinds.includes(locatorKind) || !locatorIsValid(locatorKind, evidenceLocator)) errors.push("the evidence locator must match its selected provenance locator kind");
  if (!assertedValue) errors.push("an asserted metadata value or explicit unresolved value is required");
  if (!curatorId) errors.push("a local curator identifier is required for the review activity");
  if (!isIsoDate(reviewDate)) errors.push("the review date must be a valid ISO date");
  if (checkScope(checkId) === null || !contract.claimScopes.includes(checkScope(checkId))) errors.push("the selected check must map to a typed assertion scope");
  if (subjectKind === "declared_unacquired_source_object" && !manifest?.files?.some((file) => file.id === subjectReference)) errors.push("a declared unacquired subject must name one file ID from the imported manifest");
  if (subjectKind === "unknown_source_object" && subjectReference !== "unknown") errors.push("an unknown subject must use the explicit reference unknown");
  if (contract.nonPromotion.forbiddenAssertionStates.includes(sourceState)) errors.push("the assertion source state is forbidden because this build cannot locally verify, admit, authorize or register a source object");

  if (errors.length) return { errors, receipt: null };
  const selectedFile = manifest.files.find((file) => file.id === subjectReference) ?? null;
  return {
    errors,
    receipt: {
      receiptFormatVersion: "0.1.0",
      composerReleaseId: contract.releaseId,
      composerSchemaVersion: contract.schemaVersion,
      generatedAt,
      queueItemId: contract.queueItemId,
      importedManifest: {
        manifestId: manifest.manifestId,
        formatVersion: manifest.formatVersion,
        sourceId: manifest.sourceId,
        datasetAccession: manifest.dataset?.accession ?? null,
        declaredFileCount: manifest.files.length,
      },
      publicSource: {
        catalogReleaseId: catalog.releaseId,
        sourceId: source.id,
        sourceTitle: source.title,
      },
      assertion: {
        assertionId,
        checkId,
        claimScope: checkScope(checkId),
        sourceState,
        subjectKind,
        subjectReference,
        subjectStatus: subjectKind === "unknown_source_object" ? "unknown_not_acquired" : "declared_unacquired_source_object",
        evidenceLocator: { kind: locatorKind, value: evidenceLocator },
        assertedValue,
        activity: { type: "curator_provenance_transcription", curatorId, reviewDate },
        publisherObjectUrl: selectedFile?.sourceUrl ?? null,
      },
      verificationStatus: contract.nonPromotion.verificationStatus,
      admissionDecision: contract.nonPromotion.admissionDecision,
      sourceObjectsAcquired: false,
      sourceObjectsBundled: false,
      localChecksumsCalculated: false,
      registrationsCreated: 0,
      blockedActions: contract.nonPromotion.blockedActions,
      scientificBoundary: contract.scientificBoundary,
    },
  };
}

export function assertionProvenanceReceiptFilename(receipt) {
  return `ohri-assertion-provenance-${receipt.assertion.assertionId.toLowerCase()}.json`;
}
