import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  canonicalStringify,
  checkReleaseManifest,
  computeManifestContentSha256,
  resolveContainedPath,
  verifyInputHashes,
} from "../scripts/build-release-manifest.mjs";

const manifestPath = new URL("../data/release-manifest-2.8.json", import.meta.url);
const releaseManifest = JSON.parse(await readFile(manifestPath, "utf8"));
const projectPackage = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const frozenSourceTest = projectPackage.version === "2.8.0" ? test : test.skip;
const expectedCoverageLocatorCorrections = [
  { laneId: "russ-2021", axisId: "type_taxonomy", sourceLocator: "Results — Overview of harmonized neuronal cell types; Fig. 2; Supplementary Figs. 4–5; Supplementary Table 2" },
  { laneId: "russ-2021", axisId: "region_lamina_context", sourceLocator: "Results — Overview and detailed cluster validation; Fig. 2e; Fig. 4d–f; Table 1; Supplementary Fig. 9" },
  { laneId: "russ-2021", axisId: "life_stage", sourceLocator: "Results — merged postnatal datasets, Fig. 1a; adult L4 validation, Fig. 4d–f and Supplementary Fig. 9" },
  { laneId: "russ-2021", axisId: "spatial_measurement", sourceLocator: "Abstract and Results — adult in situ mapping; Fig. 2e; Fig. 4d–f; Table 1; Supplementary Fig. 9" },
  { laneId: "sathyamurthy-2018", axisId: "type_taxonomy", sourceLocator: "Results — Census of Adult Spinal Cord Neuronal Populations; Figs. 2 and 4; Table S2" },
  { laneId: "sathyamurthy-2018", axisId: "causal_mechanism", sourceLocator: "Results — snRNA-seq Following Behavior Identified Active Neurons; Fig. 5; Fig. S4" },
  { laneId: "tabulae-paralytica-2024", axisId: "causal_mechanism", sourceLocator: "Extended Data Fig. 3j–l — AAV-DTR two weeks before complete crush SCI; diphtheria toxin at eight weeks; thoracic Vsx2ON ablation and locomotor outcome. Supplementary Video 2 — ablation prevents natural recovery of walking. Separate rejuvenative gene-therapy experiment: Fig. 8; Extended Data Fig. 10; Supplementary Video 3" },
];

function sha256Text(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

frozenSourceTest("checks the reproducible public-data workbench 2.8 release lock", async () => {
  const report = await checkReleaseManifest();
  assert.equal(report.verifiedInputs.length, 57);
  assert.equal(releaseManifest.application.version, "2.8.0");
  assert.equal(releaseManifest.releaseDate, "2026-08-26");
  assert.equal(releaseManifest.application.runtime.vinext, "1.0.0-beta.6");
  assert.equal(releaseManifest.application.runtime.react, "19.2.8");
  assert.equal(releaseManifest.application.runtime.three, "0.185.1");
  assert.equal(releaseManifest.registrations.count, 0);
  assert.deepEqual(releaseManifest.registrations.records, []);
  assert.equal(releaseManifest.scientificBoundaries.measurementAllowed, false);
  assert.match(releaseManifest.scientificBoundaries.scope, /not a complete interneuron census/i);
  assert.equal(releaseManifest.publicDataWorkbench.scientificInputPolicy, "public_sources_only");
  assert.equal(releaseManifest.publicDataWorkbench.institutionalExperimentalDataUsed, false);
  assert.equal(releaseManifest.publicDataWorkbench.sourceCount, 7);
  assert.equal(releaseManifest.publicDataWorkbench.upgradeQueueCount, 21);
  assert.equal(releaseManifest.publicDataWorkbench.metadataAuditedSourceCount, 4);
  assert.equal(releaseManifest.publicDataWorkbench.spinaljMetadataAdmission, "metadata_audited_not_admitted");
  assert.equal(releaseManifest.publicDataWorkbench.spinaljDownloadedCandidateFileCount, 0);
  assert.equal(releaseManifest.publicDataWorkbench.intakeRegistry.intakeCount, 3);
  assert.equal(releaseManifest.publicDataWorkbench.intakeRegistry.objectHeaderInventoryCount, 1);
  assert.equal(releaseManifest.publicDataWorkbench.intakeRegistry.downloadedCandidateFileCount, 0);
  assert.equal(releaseManifest.publicDataWorkbench.intakeRegistry.schemaVersion, "0.7.0");
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionPreflight.candidateFilesAccepted, 0);
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionPreflight.automaticDownload, false);
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionPreflight.credentialStorage, false);
  assert.deepEqual(releaseManifest.publicDataWorkbench.fileAdmissionPreflight.sourceChecksumAlgorithms, ["sha1", "sha256"]);
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionPreflight.localSha256AtPreflight, null);
  assert.equal(releaseManifest.publicDataWorkbench.canoSpecimenPreflight.formatVersion, "0.8.0");
  assert.equal(releaseManifest.publicDataWorkbench.canoSpecimenPreflight.candidateFilesAccepted, 0);
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionComposer.releaseId, "ohri-public-file-admission-composer-0.1.0");
  assert.deepEqual(releaseManifest.publicDataWorkbench.fileAdmissionComposer.sourceIds, ["PDS-SPINALJ-PROCESSED", "PDS-CANOGOMEZ-2026"]);
  assert.deepEqual(releaseManifest.publicDataWorkbench.fileAdmissionComposer.supportedFormatVersions, ["0.7.0", "0.8.0"]);
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionComposer.fixedAdmissionDecision, "metadata_only_not_downloaded_not_registered");
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionComposer.fixedLocalSha256, null);
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionComposer.automaticRemoteAcquisition, false);
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionComposer.sourceFileUpload, false);
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionComposer.persistence, "none");
  assert.equal(releaseManifest.publicDataWorkbench.fileAdmissionComposer.localHashCalculation, false);
  assert.equal(releaseManifest.publicDataWorkbench.detachedProvenanceCrate.releaseId, "ohri-public-provenance-crate-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.detachedProvenanceCrate.roCrateVersion, "1.3");
  assert.equal(releaseManifest.publicDataWorkbench.detachedProvenanceCrate.packagingMode, "detached_metadata_document");
  assert.equal(releaseManifest.publicDataWorkbench.detachedProvenanceCrate.networkRequests, false);
  assert.equal(releaseManifest.publicDataWorkbench.detachedProvenanceCrate.sourceFileDownload, false);
  assert.equal(releaseManifest.publicDataWorkbench.detachedProvenanceCrate.sourceIds.length, 7);
  assert.ok(releaseManifest.publicDataWorkbench.detachedProvenanceCrate.sourceIds.includes("PDS-CANOGOMEZ-2026"));
  assert.equal(releaseManifest.publicDataWorkbench.evidenceFeasibilityPlanner.releaseId, "ohri-evidence-feasibility-planner-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.evidenceFeasibilityPlanner.selectedAxisLimit, 4);
  assert.equal(releaseManifest.publicDataWorkbench.evidenceFeasibilityPlanner.axisCount, 11);
  assert.equal(releaseManifest.publicDataWorkbench.evidenceFeasibilityPlanner.routeCount, 7);
  assert.deepEqual(releaseManifest.publicDataWorkbench.evidenceFeasibilityPlanner.unqualifiedAxisIds, ["same_cell_multimodal_join", "synaptic_connectivity", "project_atlas_registration"]);
  assert.equal(releaseManifest.publicDataWorkbench.evidenceFeasibilityPlanner.networkRequests, false);
  assert.equal(releaseManifest.publicDataWorkbench.evidenceFeasibilityPlanner.sourceFileDownload, false);
  assert.equal(releaseManifest.publicDataWorkbench.evidenceFeasibilityPlanner.persistence, "none");
  assert.equal(releaseManifest.publicDataWorkbench.evidenceProvenanceTrace.releaseId, "ohri-evidence-provenance-trace-0.1.0");
  assert.deepEqual(releaseManifest.publicDataWorkbench.evidenceProvenanceTrace.laneIds, ["research_evidence", "public_source_routes"]);
  assert.deepEqual(releaseManifest.publicDataWorkbench.evidenceProvenanceTrace.researchNodeKinds, ["entity", "claim", "condition", "statement", "source"]);
  assert.deepEqual(releaseManifest.publicDataWorkbench.evidenceProvenanceTrace.publicSourceNodeKinds, ["axis", "route", "public_source"]);
  assert.equal(releaseManifest.publicDataWorkbench.evidenceProvenanceTrace.networkRequests, false);
  assert.equal(releaseManifest.publicDataWorkbench.evidenceProvenanceTrace.sourceFileDownload, false);
  assert.equal(releaseManifest.publicDataWorkbench.evidenceProvenanceTrace.persistence, "none");
  assert.equal(releaseManifest.publicDataWorkbench.crossLaneRelationshipAdmission.releaseId, "ohri-cross-lane-relationship-admission-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.crossLaneRelationshipAdmission.admissionStatus, "proposal_only_not_admitted");
  assert.deepEqual(releaseManifest.publicDataWorkbench.crossLaneRelationshipAdmission.relationshipKindIds, ["molecular_label_correspondence", "source_object_derivation", "same_specimen_relation", "coordinate_transform", "same_cell_identity"]);
  assert.equal(releaseManifest.publicDataWorkbench.crossLaneRelationshipAdmission.networkRequests, false);
  assert.equal(releaseManifest.publicDataWorkbench.crossLaneRelationshipAdmission.sourceObjectAcquisition, false);
  assert.equal(releaseManifest.publicDataWorkbench.crossLaneRelationshipAdmission.persistence, "none");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceReleaseAdmissionService.releaseId, "ohri-public-source-release-admission-service-0.1.0");
  assert.deepEqual(releaseManifest.publicDataWorkbench.publicSourceReleaseAdmissionService.supportedManifestFormats, [{ formatVersion: "0.7.0", sourceId: "PDS-SPINALJ-PROCESSED" }, { formatVersion: "0.8.0", sourceId: "PDS-CANOGOMEZ-2026" }]);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceReleaseAdmissionService.admissionDecision, "not_admitted_pending_curator_object_and_rights_review");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceReleaseAdmissionService.networkRequests, false);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceReleaseAdmissionService.sourceFileDownload, false);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceReleaseAdmissionService.persistence, "none");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAssertionProvenance.releaseId, "ohri-public-source-assertion-provenance-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAssertionProvenance.queueItemId, "UPG-018");
  assert.deepEqual(releaseManifest.publicDataWorkbench.publicSourceAssertionProvenance.assertionSourceStates, ["publisher_asserted", "curator_transcribed", "unresolved"]);
  assert.deepEqual(releaseManifest.publicDataWorkbench.publicSourceAssertionProvenance.subjectKinds, ["declared_unacquired_source_object", "unknown_source_object"]);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAssertionProvenance.claimScopeCount, 8);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAssertionProvenance.verificationStatus, "not_locally_verified");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAssertionProvenance.admissionDecision, "not_admitted_pending_curator_object_and_rights_review");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAssertionProvenance.networkRequests, false);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAssertionProvenance.sourceFileDownload, false);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAssertionProvenance.persistence, "none");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAuthorizationPlan.releaseId, "ohri-public-source-authorization-plan-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAuthorizationPlan.queueItemId, "UPG-019");
  assert.deepEqual(releaseManifest.publicDataWorkbench.publicSourceAuthorizationPlan.supportedManifestFormats, [{ formatVersion: "0.7.0", sourceId: "PDS-SPINALJ-PROCESSED" }, { formatVersion: "0.8.0", sourceId: "PDS-CANOGOMEZ-2026" }]);
  assert.deepEqual(releaseManifest.publicDataWorkbench.publicSourceAuthorizationPlan.requiredPlanStepIds, ["object_identity_confirmation", "object_specific_rights_review", "authorized_acquisition_record", "local_checksum_verification", "content_scope_validation"]);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAuthorizationPlan.planStatus, "authorization_and_verification_plan_only");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAuthorizationPlan.authorizationStatus, "not_authorized_by_this_plan");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAuthorizationPlan.verificationStatus, "not_locally_verified");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAuthorizationPlan.networkRequests, false);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAuthorizationPlan.sourceFileDownload, false);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceAuthorizationPlan.persistence, "none");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.releaseId, "ohri-public-source-independent-authorization-evidence-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.queueItemId, "UPG-020");
  assert.deepEqual(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.supportedManifestFormats, [{ formatVersion: "0.7.0", sourceId: "PDS-SPINALJ-PROCESSED" }, { formatVersion: "0.8.0", sourceId: "PDS-CANOGOMEZ-2026" }]);
  assert.deepEqual(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.requiredReviewStageIds, ["authority_identity_confirmation", "object_specific_terms_scope_review", "authorized_retrieval_conditions", "local_integrity_comparison", "content_scope_retention_review"]);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.packetStatus, "independent_authorization_evidence_packet_draft_only");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.authorityStatus, "not_authenticated_by_this_packet");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.executionStatus, "not_executed_pending_independent_authorization");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.verificationStatus, "not_locally_verified");
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.networkRequests, false);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.sourceFileDownload, false);
  assert.equal(releaseManifest.publicDataWorkbench.publicSourceIndependentAuthorizationEvidence.persistence, "none");
  assert.equal(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.releaseId, "ohri-interneuron-knowledge-coverage-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.coordinateAuthority, "SOURCE_LOCAL_METADATA_ONLY");
  assert.equal(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.laneCount, 5);
  assert.deepEqual(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.laneIds, ["russ-2021", "haring-2018", "sathyamurthy-2018", "delile-2019", "tabulae-paralytica-2024"]);
  assert.equal(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.axisCount, 7);
  assert.deepEqual(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.axisIds, ["type_taxonomy", "region_lamina_context", "life_stage", "injury_state", "spatial_measurement", "causal_mechanism", "morphology"]);
  assert.deepEqual(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.crossStudyMappingStatuses, ["not_established"]);
  assert.deepEqual(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.morphologyStatuses, ["not_measured"]);
  assert.deepEqual(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.causalMechanismStatuses, [
    { laneId: "russ-2021", status: "not_measured" },
    { laneId: "haring-2018", status: "contextual" },
    { laneId: "sathyamurthy-2018", status: "contextual" },
    { laneId: "delile-2019", status: "contextual" },
    { laneId: "tabulae-paralytica-2024", status: "direct" },
  ]);
  assert.deepEqual(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.directCausalLaneIds, ["tabulae-paralytica-2024"]);
  assert.match(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.directCausalBoundary, /specific to its Vsx2ON definition.*does not establish causality for every source label.*Russ population.*project entity/i);
  assert.equal(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.sourceLocatorCount, 35);
  assert.equal(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.auditedLocatorCorrectionCount, 7);
  assert.deepEqual(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.auditedLocatorCorrections, expectedCoverageLocatorCorrections);
  assert.equal(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.sourceObjectsBundled, 0);
  assert.equal(releaseManifest.publicDataWorkbench.interneuronKnowledgeCoverage.projectRegistrationCount, 0);
  assert.equal(releaseManifest.publicDataWorkbench.russTaxonomyCrosswalk.releaseId, "ohri-russ-harmonized-taxonomy-crosswalk-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.russTaxonomyCrosswalk.coordinateAuthority, "TYPE_LEVEL");
  assert.equal(releaseManifest.publicDataWorkbench.russTaxonomyCrosswalk.populationCount, 69);
  assert.equal(releaseManifest.publicDataWorkbench.russTaxonomyCrosswalk.interneuronCandidateCount, 65);
  assert.equal(releaseManifest.publicDataWorkbench.russTaxonomyCrosswalk.exactPrototypeMappingCount, 0);
  assert.equal(releaseManifest.publicDataWorkbench.russTaxonomyCrosswalk.sourceTableBundled, false);
  assert.equal(releaseManifest.publicDataWorkbench.russReconciliationDossier.releaseId, "ohri-russ-reconciliation-dossier-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.russReconciliationDossier.authority, "PROVENANCE_RECONCILIATION_ONLY");
  assert.equal(releaseManifest.publicDataWorkbench.russReconciliationDossier.correctionCount, 2);
  assert.equal(releaseManifest.publicDataWorkbench.russReconciliationDossier.reconciliationItemCount, 3);
  assert.equal(releaseManifest.publicDataWorkbench.russReconciliationDossier.sourceTableBundled, false);
  assert.equal(releaseManifest.publicDataWorkbench.russReconciliationDossier.sourceTableContentChangeStatedByCorrections, false);
  assert.equal(releaseManifest.publicDataWorkbench.russReconciliationDossier.currentStatus, "reconciled_provenance_no_narrow_transfer");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeConditionCatalog.releaseId, "ohri-tabulae-paralytica-condition-catalog-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeConditionCatalog.authority, "SOURCE_METADATA_CONDITION_INDEX_ONLY");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeConditionCatalog.conditionCount, 8);
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeConditionCatalog.distinctSourceLabelCount, 93);
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeConditionCatalog.bundledSourceBodyCount, 0);
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeConditionCatalog.bundledProcessedMetadataCount, 0);
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalSession.releaseId, "ohri-tabulae-paralytica-spatial-local-session-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalSession.authority, "SOURCE_LOCAL_2D_SESSION_ONLY");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalSession.archiveStableName, "GSE234774_RAW.tar");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalSession.archiveBytes, 135208960);
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalSession.sourceChecksum, null);
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalSession.assetRightsDecision, "unresolved_not_bundled");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalSession.declaredSampleCount, 24);
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalSession.automaticRemoteAcquisition, false);
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalSession.upload, false);
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalSession.persistence, "none");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalComparison.releaseId, "ohri-tabulae-paralytica-spatial-local-comparison-0.1.0");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalComparison.authority, "MULTI_SESSION_SOURCE_LOCAL_2D_ONLY");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalComparison.maximumConcurrentSessions, 4);
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalComparison.crossSectionTransform, "none");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalComparison.sectionOrderAuthority, "not_established_from_section_labels");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalComparison.interSectionGeometry, "not_established");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalComparison.quantitativeComparison, "not_permitted");
  assert.equal(releaseManifest.publicDataWorkbench.tabulaeSpatialLocalComparison.sourceFilesBundled, false);
  assert.equal(releaseManifest.curatorFeedback.contractSchemaVersion, "2.8.0");
  assert.equal(releaseManifest.curatorFeedback.feedbackSchemaVersion, "2.8.0");
  assert.equal(releaseManifest.curatorFeedback.distributionVersion, "2.8.0-curator.1");
  assert.equal(releaseManifest.curatorFeedback.maximumFileBytes, 2097152);
  assert.equal(releaseManifest.curatorFeedback.minimumIndependentCuratorsForComparison, 2);
  assert.equal(releaseManifest.curatorFeedback.requiresReportedZipSha256, true);
  assert.match(releaseManifest.curatorFeedback.runtimeBoundary, /local receipt export only/i);
  assert.equal(releaseManifest.curatorAdjudication.contractSchemaVersion, "2.8.0");
  assert.equal(releaseManifest.curatorAdjudication.adjudicationSchemaVersion, "1.0.0");
  assert.equal(releaseManifest.curatorAdjudication.minimumIndependentCurators, 2);
  assert.deepEqual(releaseManifest.curatorAdjudication.permittedDispositions, ["defer_pending_evidence", "return_for_revision", "recommend_next_private_review"]);
  assert.equal(releaseManifest.curatorAdjudication.maximumPacketBytes, 2097152);
  assert.equal(releaseManifest.curatorAdjudication.readOnlyPacketImport, true);
  assert.match(releaseManifest.curatorAdjudication.runtimeBoundary, /cannot change evidence.*create a registration/i);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.geometryStatus, "INF");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.sampledPlaneCount, 15);
  assert.deepEqual(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.contourClasses, ["outer_cord", "coarse_gray_matter_row_envelope"]);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.sourceIdMajorStructureCount, 7);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalComponentCount, 408);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalPolygonCount, 408);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.explicitMissingInternalPlaneCount, 1);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalComponentCorrespondence, "plane_local_only_no_cross_plane_correspondence");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalRenderingMode, "plane_local_line_segments_only");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalDisplayColorKey, "preserved_source_identifier");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalDisplayColorAuthority, "none_project_display_only_palette");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalProjectDisplayPaletteSize, 7);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalSourceColorRetention, "exact_source_color_retained_in_user_data");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalLofting, "forbidden");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalFilling, "none");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.internalJoining, "none");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.manualBridging, "none");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.measurementAllowed, false);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.referenceAnatomy.projectRegistrationCount, 0);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.molecularTypeLandscape.coordinateAuthority, "TYPE_LEVEL");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.molecularTypeLandscape.interneuronCandidateCount, 65);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.molecularTypeLandscape.candidateScope, "non_motoneuron_interneuron_or_projection_neuron_candidates");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.molecularTypeLandscape.confirmedInterneuronCount, null);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.molecularTypeLandscape.confirmedInterneuronCountMissingReason, "not_established");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.molecularTypeLandscape.placementStatus, "unplaced");
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.molecularTypeLandscape.exactCrossStudyIdentityCount, 0);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.molecularTypeLandscape.linkedMorphologyCount, 0);
  assert.equal(releaseManifest.researchModel.referenceBackedUpgrade.laneJoinPolicy, "none_without_separate_versioned_evidence_and_review");
});

test("locks all fifty-seven required project and external authoritative inputs", () => {
  const inputPaths = releaseManifest.authoritativeInputs.map((input) => [input.scope, input.path]);
  assert.equal(inputPaths.length, 57);
  for (const required of [
      ["project", "data/research-mvp-release-0.2.json"],
      ["project", "schemas/research-mvp-release.schema.json"],
      ["project", "data/public-data-catalog-0.4.json"],
      ["project", "schemas/public-data-catalog-0.4.schema.json"],
      ["project", "data/russ-harmonized-taxonomy-crosswalk-0.1.json"],
      ["project", "schemas/russ-harmonized-taxonomy-crosswalk-0.1.schema.json"],
      ["project", "data/russ-reconciliation-dossier-0.1.json"],
      ["project", "schemas/russ-reconciliation-dossier-0.1.schema.json"],
      ["project", "data/tabulae-condition-catalog-0.1.json"],
      ["project", "schemas/tabulae-condition-catalog-0.1.schema.json"],
      ["project", "data/tabulae-spatial-local-session-0.1.json"],
      ["project", "schemas/tabulae-spatial-local-session-0.1.schema.json"],
      ["project", "data/tabulae-spatial-local-comparison-0.1.json"],
      ["project", "schemas/tabulae-spatial-local-comparison-0.1.schema.json"],
      ["project", "data/public-source-intakes/spinalj-processed-metadata-audit-0.4.json"],
      ["project", "schemas/public-source-intake.schema.json"],
      ["project", "data/public-source-intake-registry-0.7.json"],
      ["project", "schemas/public-source-intake-registry-0.7.schema.json"],
      ["project", "schemas/public-file-admission-manifest-0.7.schema.json"],
      ["project", "data/file-admission-preflight-0.7.json"],
      ["project", "schemas/public-file-admission-preflight-0.7.schema.json"],
      ["project", "schemas/public-file-admission-manifest-0.8.schema.json"],
      ["project", "data/file-admission-preflight-0.8.json"],
      ["project", "schemas/public-file-admission-preflight-0.8.schema.json"],
      ["project", "data/public-file-admission-composer-0.1.json"],
      ["project", "schemas/public-file-admission-composer-0.1.schema.json"],
      ["project", "data/public-provenance-crate-0.1.json"],
      ["project", "schemas/public-provenance-crate-0.1.schema.json"],
      ["project", "data/evidence-feasibility-planner-0.1.json"],
      ["project", "schemas/evidence-feasibility-planner-0.1.schema.json"],
      ["project", "data/evidence-provenance-trace-0.1.json"],
      ["project", "schemas/evidence-provenance-trace-0.1.schema.json"],
      ["project", "data/cross-lane-relationship-admission-0.1.json"],
      ["project", "schemas/cross-lane-relationship-admission-0.1.schema.json"],
      ["project", "data/public-source-release-admission-service-0.1.json"],
      ["project", "schemas/public-source-release-admission-service-0.1.schema.json"],
      ["project", "data/public-source-assertion-provenance-0.1.json"],
      ["project", "schemas/public-source-assertion-provenance-0.1.schema.json"],
      ["project", "data/public-source-authorization-plan-0.1.json"],
      ["project", "schemas/public-source-authorization-plan-0.1.schema.json"],
      ["project", "data/public-source-independent-authorization-evidence-0.1.json"],
      ["project", "schemas/public-source-independent-authorization-evidence-0.1.schema.json"],
      ["project", "data/interneuron-knowledge-coverage-0.1.json"],
      ["project", "schemas/interneuron-knowledge-coverage-0.1.schema.json"],
      ["project", "docs/ADR-012-REFERENCE-ANATOMY-AND-TYPE-LANES.md"],
      ["project", "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md"],
      ["project", "data/curator-feedback-contract-2.8.json"],
      ["project", "schemas/curator-feedback-contract-2.8.schema.json"],
      ["project", "data/curator-adjudication-contract-2.8.json"],
      ["project", "schemas/curator-adjudication-contract-2.8.schema.json"],
      ["scientificAuthority", "02_EVIDENCE/EVIDENCE_LEDGER.md"],
      ["scientificAuthority", "01_LITERATURE/SOURCE_MANIFEST.tsv"],
      ["project", "public/data/allen_cord_20um_v3_0/asset-manifest.json"],
      ["project", "public/data/allen_cord_20um_v3_0/atlas-internal-compartments.json"],
      ["project", "public/data/neuromorpho_release_8_6_124/asset-manifest.json"],
      ["project", "docs/RIGHTS_LEDGER.csv"],
      ["project", "package-lock.json"],
    ]) assert.ok(inputPaths.some(([scope, path]) => scope === required[0] && path === required[1]), "missing input " + required.join(":"));
  assert.ok(releaseManifest.authoritativeInputs.every((input) => /^[0-9a-f]{64}$/.test(input.sha256)));
  assert.ok(releaseManifest.authoritativeInputs.every((input) => input.bytes > 0));
});

test("pins atlas and morphology metadata without inventing registrations", () => {
  const { atlas, morphology } = releaseManifest.spatialAssets;
  assert.equal(atlas.atlas, "allen_cord_20um");
  assert.equal(atlas.atlasVersion, "3.0");
  assert.equal(atlas.atlasApiVersion, "3.0.1");
  assert.equal(atlas.manifestSha256, "bf43b0fb45fc51e7811cb551820c310c3a1468b1e175fbdb30625faf4893eb85");
  assert.deepEqual(atlas.shapeZyx, [1567, 253, 322]);
  assert.deepEqual(atlas.resolutionUmZyx, [20, 10, 10]);
  assert.equal(atlas.orientation, "asr");
  assert.equal(atlas.geometryStatus, "INF");
  assert.equal(atlas.sampledPlaneCount, 15);
  assert.equal(atlas.displayDerivative, "lofted_outer_cord_and_coarse_gray_matter_row_envelope_side_surfaces");
  assert.equal(atlas.contourPayloadPath, "public/data/allen_cord_20um_v3_0/atlas-contours.json");
  assert.equal(atlas.internalCompartments.assetId, "allen_cord_20um:3.0:internal-compartments-v1");
  assert.equal(atlas.internalCompartments.payloadInputId, "atlasInternalCompartments");
  assert.equal(atlas.internalCompartments.payloadSha256, "77da24a7a7bba373023b2c4f5a654bc0657fa27f8c021e000765ad9545ac45ed");
  assert.equal(atlas.internalCompartments.payloadPath, "public/data/allen_cord_20um_v3_0/atlas-internal-compartments.json");
  assert.equal(atlas.internalCompartments.geometryStatus, "INF");
  assert.equal(atlas.internalCompartments.sourceIdMajorStructureCount, 7);
  assert.deepEqual(atlas.internalCompartments.structureIdentifiers, [90, 100, 110, 16, 74, 75, 70]);
  assert.equal(atlas.internalCompartments.sampledPlaneCountPerStructure, 15);
  assert.equal(atlas.internalCompartments.componentConnectivity, 4);
  assert.equal(atlas.internalCompartments.componentCount, 408);
  assert.equal(atlas.internalCompartments.polygonCount, 408);
  assert.equal(atlas.internalCompartments.disconnectedComponents, "preserved_never_bridged");
  assert.equal(atlas.internalCompartments.crossPlaneComponentCorrespondence, "none");
  assert.equal(atlas.internalCompartments.crossPlaneInterpolation, "none");
  assert.equal(atlas.internalCompartments.manualGeometry, "none");
  assert.equal(atlas.internalCompartments.renderingMode, "plane_local_line_segments_only");
  assert.equal(atlas.internalCompartments.displayColorKey, "preserved_source_identifier");
  assert.equal(atlas.internalCompartments.displayColorAuthority, "none_project_display_only_palette");
  assert.equal(atlas.internalCompartments.projectDisplayPaletteSize, 7);
  assert.equal(atlas.internalCompartments.sourceColorRetention, "exact_source_color_retained_in_user_data");
  assert.equal(atlas.internalCompartments.lofting, "forbidden");
  assert.equal(atlas.internalCompartments.filling, "none");
  assert.equal(atlas.internalCompartments.joining, "none");
  assert.deepEqual(atlas.internalCompartments.missingPlanes, [{
    structureIdentifier: 74,
    structureName: "Dorsal funiculus",
    zIndex: 1470,
    missingReason: "source_mask_absent_at_sampled_plane",
  }]);
  assert.equal(atlas.internalCompartments.measurementAllowed, false);
  assert.equal(atlas.internalCompartments.namedSegmentAssignment, "pending_curation");
  assert.equal(atlas.internalCompartments.projectRegistrationCount, 0);
  assert.equal(atlas.measurementAllowed, false);
  assert.equal(atlas.namedSegmentAssignment, "pending_curation");
  assert.equal(atlas.projectRegistrationCount, 0);
  assert.deepEqual(atlas.registrationError, { missingReason: "not_applicable", value: null });

  assert.equal(morphology.repositoryRelease, "8.6.124");
  assert.equal(morphology.exemplarCount, 5);
  assert.deepEqual(morphology.exemplarNeuronIds, [104003, 108974, 109005, 242822, 260150]);
  assert.equal(morphology.geometryStatus, "OBS");
  assert.equal(morphology.registrationStatus, "unregistered");
  assert.equal(morphology.atlasTransformCount, 0);
  assert.match(morphology.selection, /not a representative sample/i);
});

test("manifestContentSha256 is canonical and excludes only itself", () => {
  assert.equal(
    computeManifestContentSha256(releaseManifest),
    releaseManifest.manifestContentSha256,
  );
  const first = {
    z: [3, { y: true, x: null }],
    a: "value",
    manifestContentSha256: "ignored-first",
  };
  const second = {
    manifestContentSha256: "ignored-second",
    a: "value",
    z: [3, { x: null, y: true }],
  };
  assert.equal(canonicalStringify(first), canonicalStringify(second).replace("ignored-second", "ignored-first"));
  assert.equal(computeManifestContentSha256(first), computeManifestContentSha256(second));
});

test("rejects lexical and symbolic-link path escapes", async (t) => {
  assert.throws(() => resolveContainedPath("/tmp/release-root", "../escape.txt"), /traversal/);
  assert.throws(() => resolveContainedPath("/tmp/release-root", "/tmp/escape.txt"), /absolute/);

  const fixtureRoot = await mkdtemp(join(tmpdir(), "release-path-test-"));
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }));
  const projectRoot = join(fixtureRoot, "project");
  const outsideRoot = join(fixtureRoot, "outside");
  await Promise.all([mkdir(projectRoot), mkdir(outsideRoot)]);
  const outsidePath = join(outsideRoot, "outside.txt");
  await writeFile(outsidePath, "outside", "utf8");
  await symlink(outsidePath, join(projectRoot, "link.txt"));

  const input = {
    id: "link",
    scope: "project",
    path: "link.txt",
    purpose: "symlink escape fixture",
    bytes: 7,
    sha256: sha256Text("outside"),
  };
  await assert.rejects(
    verifyInputHashes([input], {
      roots: { project: { root: projectRoot, allowedPaths: ["link.txt"] } },
    }),
    /symbolic link/,
  );
});

test("rejects tampered fixture contents and a tampered declared hash", async (t) => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "release-hash-test-"));
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }));
  const projectRoot = join(fixtureRoot, "project");
  const scientificAuthorityRoot = join(fixtureRoot, "authority");
  await Promise.all([mkdir(projectRoot), mkdir(scientificAuthorityRoot)]);
  await Promise.all([
    writeFile(join(projectRoot, "input.txt"), "alpha", "utf8"),
    writeFile(join(scientificAuthorityRoot, "ledger.md"), "ledger", "utf8"),
  ]);

  const roots = {
    project: { root: projectRoot, allowedPaths: ["input.txt"] },
    scientificAuthority: { root: scientificAuthorityRoot, allowedPaths: ["ledger.md"] },
  };
  const inputs = [
    {
      id: "fixture",
      scope: "project",
      path: "input.txt",
      purpose: "project fixture",
      bytes: 5,
      sha256: sha256Text("alpha"),
    },
    {
      id: "externalFixture",
      scope: "scientificAuthority",
      path: "ledger.md",
      purpose: "external fixture",
      bytes: 6,
      sha256: sha256Text("ledger"),
    },
  ];

  assert.equal((await verifyInputHashes(inputs, { roots })).length, 2);
  await writeFile(join(projectRoot, "input.txt"), "bravo", "utf8");
  await assert.rejects(verifyInputHashes(inputs, { roots }), /SHA-256 mismatch for fixture/);

  await writeFile(join(projectRoot, "input.txt"), "alpha", "utf8");
  const tamperedHash = inputs.map((input) => ({ ...input }));
  tamperedHash[0].sha256 = "0".repeat(64);
  await assert.rejects(verifyInputHashes(tamperedHash, { roots }), /SHA-256 mismatch for fixture/);
});

frozenSourceTest("standalone default and --check modes both validate the release manifest", () => {
  const scriptPath = fileURLToPath(new URL("../scripts/build-release-manifest.mjs", import.meta.url));
  for (const args of [[], ["--check"]]) {
    const result = spawnSync(process.execPath, [scriptPath, ...args], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Release manifest check passed: 57 SHA-256 inputs, 0 registrations/);
  }
});
