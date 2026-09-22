const ZIP_SHA256 = /^[a-f0-9]{64}$/;
const VERDICTS = ["accept", "revise", "unable_to_assess"];

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

export function normalizeCuratorId(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

export function normalizeZipSha256(value) {
  const normalized = String(value ?? "").trim().toLocaleLowerCase();
  return ZIP_SHA256.test(normalized) ? normalized : null;
}

export function evaluateAdjudicationReadiness(feedback, contract) {
  const records = Array.isArray(feedback) ? feedback : [];
  const minimumIndependentCurators = contract.minimumIndependentCurators;
  const curatorIds = records.map((record) => normalizeCuratorId(record.responses?.curator_id));
  const reportedZipSha256 = records.map((record) => normalizeZipSha256(record.responses?.zip_sha256));
  const allZipVerified = records.length > 0 && records.every((record) => record.responses?.zip_verified === "yes");
  const allZipSha256Valid = records.length > 0 && reportedZipSha256.every(Boolean);
  const digestValues = [...new Set(reportedZipSha256.filter(Boolean))];
  const uniqueCuratorCount = new Set(curatorIds.filter(Boolean)).size;
  const independent = records.length >= minimumIndependentCurators && uniqueCuratorCount === records.length;
  const digestMatches = allZipSha256Valid && digestValues.length === 1;
  const verdicts = records.map((record) => record.responses?.overall_verdict).filter((verdict) => VERDICTS.includes(verdict));
  const verdictCounts = Object.fromEntries(VERDICTS.map((verdict) => [verdict, verdicts.filter((item) => item === verdict).length]));
  const hasVerdictDisagreement = new Set(verdicts).size > 1;
  const blockers = [];
  if (records.length < minimumIndependentCurators) blockers.push("Fewer than the required number of independent curator records are loaded.");
  if (uniqueCuratorCount !== records.length) blockers.push("Curator identities are missing or duplicated.");
  if (!allZipVerified) blockers.push("Every loaded curator must report ZIP SHA-256 verification as yes.");
  if (!allZipSha256Valid) blockers.push("Every loaded curator must supply a 64-character ZIP SHA-256.");
  if (allZipSha256Valid && !digestMatches) blockers.push("Loaded curator records report different ZIP SHA-256 values.");
  if (verdicts.length !== records.length) blockers.push("Every loaded record must have a valid overall verdict.");
  return {
    minimumIndependentCurators,
    recordCount: records.length,
    curatorIds,
    uniqueCuratorCount,
    reportedZipSha256: digestValues,
    allZipVerified,
    allZipSha256Valid,
    digestMatches,
    independent,
    verdictCounts,
    hasVerdictDisagreement,
    blockers,
    readyForHumanAdjudication: blockers.length === 0,
  };
}

export function buildAdjudicationPacket({ feedback, feedbackContract, adjudicationContract, releaseManifest, adjudicator }) {
  const readiness = evaluateAdjudicationReadiness(feedback, adjudicationContract);
  requireCondition(readiness.readyForHumanAdjudication, "adjudication packet requires matching, ZIP-verified feedback from independent curators");
  const curatorId = normalizeCuratorId(adjudicator?.curatorId);
  const disposition = adjudicator?.disposition;
  const resolutionNotes = String(adjudicator?.resolutionNotes ?? "").trim();
  requireCondition(curatorId.length > 0, "adjudicator stable ID is required");
  requireCondition(adjudicationContract.permittedDispositions.includes(disposition), "adjudication disposition is invalid");
  requireCondition(resolutionNotes.length > 0 && resolutionNotes.length <= 10_000, "adjudication resolution notes are required and bounded");
  if (readiness.hasVerdictDisagreement && disposition === "recommend_next_private_review") {
    throw new Error("a mixed curator verdict cannot recommend the next private review without a deferral or return-for-revision disposition");
  }
  return {
    adjudicationSchemaVersion: adjudicationContract.adjudicationSchemaVersion,
    createdAt: new Date().toISOString(),
    distributionVersion: feedbackContract.distributionVersion,
    releaseId: releaseManifest.releaseId,
    releaseManifestContentSha256: releaseManifest.manifestContentSha256,
    registrationCount: 0,
    packageZipSha256: readiness.reportedZipSha256[0],
    feedbackRecords: feedback.map((record) => ({
      curatorId: normalizeCuratorId(record.responses.curator_id),
      expertise: record.responses.expertise,
      reviewDate: record.responses.review_date,
      exportedAt: record.exportedAt,
      zipVerified: record.responses.zip_verified,
      zipSha256: normalizeZipSha256(record.responses.zip_sha256),
      verdict: record.responses.overall_verdict,
      overallNotes: record.responses.overall_notes,
      responses: record.responses,
    })),
    reviewSummary: readiness,
    adjudicator: { curatorId, disposition, resolutionNotes },
    disagreementPreserved: readiness.hasVerdictDisagreement,
    boundary: adjudicationContract.boundary,
  };
}

export function validateAdjudicationPacket(packet, adjudicationContract) {
  requireCondition(packet && typeof packet === "object" && !Array.isArray(packet), "adjudication packet must be an object");
  requireCondition(packet.adjudicationSchemaVersion === adjudicationContract.adjudicationSchemaVersion, "adjudication schema version does not match contract");
  requireCondition(packet.distributionVersion === adjudicationContract.distributionVersion, "adjudication packet distribution does not match contract");
  requireCondition(packet.releaseId === adjudicationContract.workbenchReleaseId, "adjudication packet release ID does not match contract");
  requireCondition(ZIP_SHA256.test(packet.releaseManifestContentSha256 ?? ""), "adjudication packet requires a valid release-manifest SHA-256");
  requireCondition(packet.registrationCount === 0, "adjudication packet cannot claim a nonzero registration count");
  requireCondition(ZIP_SHA256.test(packet.packageZipSha256 ?? ""), "adjudication packet requires one valid package ZIP SHA-256");
  requireCondition(Array.isArray(packet.feedbackRecords) && packet.feedbackRecords.length >= adjudicationContract.minimumIndependentCurators, "adjudication packet lacks the required independent feedback records");
  const curatorIds = packet.feedbackRecords.map((record) => normalizeCuratorId(record.curatorId));
  requireCondition(new Set(curatorIds).size === packet.feedbackRecords.length && curatorIds.every(Boolean), "adjudication packet has duplicate or blank curator IDs");
  requireCondition(packet.feedbackRecords.every((record) => record.zipVerified === "yes" && record.zipSha256 === packet.packageZipSha256), "adjudication packet feedback records do not agree on the verified ZIP SHA-256");
  const verdicts = packet.feedbackRecords.map((record) => record.verdict);
  const disagreement = new Set(verdicts).size > 1;
  requireCondition(packet.disagreementPreserved === disagreement, "adjudication packet disagreement status is inconsistent with the feedback records");
  requireCondition(adjudicationContract.permittedDispositions.includes(packet.adjudicator?.disposition), "adjudication packet disposition is invalid");
  requireCondition(normalizeCuratorId(packet.adjudicator?.curatorId).length > 0, "adjudication packet requires an adjudicator stable ID");
  requireCondition(typeof packet.adjudicator?.resolutionNotes === "string" && packet.adjudicator.resolutionNotes.trim(), "adjudication packet requires resolution notes");
  requireCondition(!(disagreement && packet.adjudicator.disposition === "recommend_next_private_review"), "mixed curator verdicts cannot recommend the next private review");
  requireCondition(packet.boundary === adjudicationContract.boundary, "adjudication packet boundary does not match contract");
  return true;
}
