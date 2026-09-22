function byId(records, id) {
  return records.find((record) => record.id === id) ?? null;
}

function unique(values) {
  return [...new Set(values)];
}

function isHttpsUrl(value) {
  return typeof value === "string" && /^https:\/\//.test(value);
}

function manifestHasValidDeclaredChecksum(file) {
  return file?.localSha256 === null
    && file?.sourceChecksum?.provenance === "source_metadata"
    && (file.sourceChecksum.algorithm === "sha1" || file.sourceChecksum.algorithm === "sha256")
    && typeof file.sourceChecksum.value === "string"
    && ((file.sourceChecksum.algorithm === "sha1" && /^[a-f0-9]{40}$/.test(file.sourceChecksum.value))
      || (file.sourceChecksum.algorithm === "sha256" && /^[a-f0-9]{64}$/.test(file.sourceChecksum.value)));
}

function genericCoordinatesCompleteOrExplained(file) {
  const coordinates = file?.coordinates;
  return Boolean(coordinates && ((coordinates.unit && coordinates.axisOrder && coordinates.origin)
    || (typeof coordinates.missingReason === "string" && coordinates.missingReason.trim())));
}

function specimenMetadataCompleteOrExplained(specimen) {
  const coordinateValues = [specimen?.coordinateUnit, specimen?.axisOrder, specimen?.axisDirection, specimen?.coordinateOrigin, specimen?.pixelOrVoxelScale];
  return Boolean(specimen?.specimenId && specimen?.spinalRegion && specimen?.assay && specimen?.sourceFrame
    && ((specimen.animalId && coordinateValues.every(Boolean)) || (typeof specimen.missingReason === "string" && specimen.missingReason.trim())));
}

function reviewCheck(id, status, detail) {
  return { id, status, detail };
}

export function evaluatePublicSourceAdmissionManifest({ manifest, catalog, contract, generatedAt }) {
  const format = contract.supportedManifestFormats.find((candidate) => candidate.formatVersion === manifest?.formatVersion && candidate.sourceId === manifest?.sourceId);
  if (!format) throw new Error("manifest format and source are not supported by the frozen admission service");
  const source = byId(catalog.sources, manifest.sourceId);
  if (!source) throw new Error("manifest source is not in the frozen public-source catalogue");
  if (!Array.isArray(manifest.files) || manifest.files.length < 1) throw new Error("manifest must contain at least one metadata file record");
  const validObjectUrls = manifest.files.every((file) => isHttpsUrl(file.sourceUrl));
  const declaredChecksums = manifest.files.every(manifestHasValidDeclaredChecksum);
  const localChecksumsAbsent = manifest.files.every((file) => file.localSha256 === null);
  const baseChecks = [
    reviewCheck("manifest_identity", typeof manifest.manifestId === "string" && manifest.manifestId.length > 0 ? "recorded" : "missing_or_explicitly_unresolved", "A local metadata manifest identifier is present; it is not a source-object identifier."),
    reviewCheck("catalogue_source_match", "recorded", `Manifest source ${manifest.sourceId} matches the frozen catalogue record.`),
    reviewCheck("publisher_object_url", validObjectUrls ? "recorded" : "missing_or_explicitly_unresolved", "Publisher object URLs are declared metadata only; the browser did not contact them."),
    reviewCheck("declared_source_checksum", declaredChecksums ? "recorded" : "missing_or_explicitly_unresolved", "Checksum values are publisher/source metadata, not local verification."),
    reviewCheck("null_local_checksum", localChecksumsAbsent ? "recorded" : "missing_or_explicitly_unresolved", "No local source object was acquired or hashed."),
    reviewCheck("asset_level_rights_review", "requires_independent_curator_review", `Catalogue rights status is ${source.rights.status}; this service cannot grant an asset-level reuse decision.`),
  ];
  const sourceSpecificChecks = manifest.formatVersion === "0.8.0"
    ? [
      reviewCheck("specimen_identity", Array.isArray(manifest.specimens) && manifest.specimens.every((specimen) => specimen?.specimenId) ? "recorded" : "missing_or_explicitly_unresolved", "Specimen identifiers stay source-local and do not establish a project relationship."),
      reviewCheck("source_frame_or_missingness", Array.isArray(manifest.specimens) && manifest.specimens.every(specimenMetadataCompleteOrExplained) ? "recorded" : "missing_or_explicitly_unresolved", "Source-frame fields or their declared missingness are retained; no transform is created."),
      reviewCheck("preprint_disclosure", manifest.dataset?.preprintStatus === "preprint_resource" ? "recorded" : "missing_or_explicitly_unresolved", "Preprint status is required and remains visible."),
    ]
    : [
      reviewCheck("coordinate_metadata_or_missingness", manifest.files.every(genericCoordinatesCompleteOrExplained) ? "recorded" : "missing_or_explicitly_unresolved", "Coordinates remain source metadata or explicit missingness; no registration is created."),
    ];
  const checks = [...baseChecks, ...sourceSpecificChecks];
  return {
    receiptFormatVersion: "0.1.0",
    serviceReleaseId: contract.releaseId,
    serviceSchemaVersion: contract.schemaVersion,
    generatedAt,
    queueItemId: contract.queueItemId,
    manifest: {
      manifestId: manifest.manifestId,
      formatVersion: manifest.formatVersion,
      reviewDate: manifest.reviewDate,
      sourceId: manifest.sourceId,
      datasetAccession: manifest.dataset?.accession ?? null,
      datasetVersion: manifest.dataset?.version ?? null,
      declaredFileCount: manifest.files.length,
    },
    publicSource: {
      catalogReleaseId: catalog.releaseId,
      sourceId: source.id,
      sourceTitle: source.title,
      catalogRightsStatus: source.rights.status,
    },
    checks,
    declaredChecksumAlgorithms: unique(manifest.files.map((file) => file.sourceChecksum?.algorithm).filter(Boolean)),
    metadataCompleteness: contract.reviewSemantics.metadataCompleteStatus,
    admissionDecision: contract.admissionDecision,
    pendingActions: [
      "Independent curator confirmation of the exact source object and its asset-level rights.",
      "Independent verification of publisher metadata against the intended source object before any authorized acquisition.",
      "A separately authorized release decision after object-level provenance and rights checks.",
    ],
    blockedActions: contract.reviewSemantics.blockedActions,
    sourceObjectsAcquired: false,
    sourceObjectsBundled: false,
    localChecksumsCalculated: false,
    registrationsCreated: 0,
    scientificBoundary: contract.scientificBoundary,
  };
}

export function admissionReviewReceiptFilename(receipt) {
  return `ohri-admission-review-${String(receipt.manifest.manifestId).toLowerCase()}.json`;
}
