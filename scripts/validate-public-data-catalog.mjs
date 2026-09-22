import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  createResearchMvpValidator,
  formatSchemaErrors,
} from "./validate-json-schema.mjs";

const CATALOG_URL = new URL("../data/public-data-catalog-0.4.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-data-catalog-0.4.schema.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validatePublicDataCatalog() {
  const [catalog, schema] = await Promise.all([
    readFile(CATALOG_URL, "utf8").then(JSON.parse),
    readFile(SCHEMA_URL, "utf8").then(JSON.parse),
  ]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];

  if (!validate(catalog)) errors.push(...formatSchemaErrors(validate.errors));
  check(catalog.scientificInputPolicy === "public_sources_only", "scientific input policy must remain public_sources_only", errors);
  check(catalog.institutionalExperimentalDataUsed === false, "institutional experimental data must remain false", errors);
  check(catalog.networkAtReviewRuntime === false, "review runtime must not require network access", errors);

  const sourceIds = new Set();
  for (const source of catalog.sources ?? []) {
    check(!sourceIds.has(source.id), "duplicate public-source ID " + source.id, errors);
    sourceIds.add(source.id);
    check(source.content?.coordinateAuthority !== "REG", source.id + ": public catalog must not grant REG", errors);
    check(source.provenance?.sourceUrl?.startsWith("https://"), source.id + ": source URL must use HTTPS", errors);
    check(!/internal|unpublished|physical specimen/i.test(source.admissibleUse ?? ""), source.id + ": admissible use violates public-data policy", errors);
  }

  const queueIds = new Set();
  for (const item of catalog.upgradeQueue ?? []) {
    check(!queueIds.has(item.id), "duplicate upgrade ID " + item.id, errors);
    queueIds.add(item.id);
    for (const sourceId of item.sourceIds ?? []) {
      check(sourceIds.has(sourceId), item.id + ": unknown source ID " + sourceId, errors);
    }
    const boundary = item.scientificBoundary ?? "";
    check(
      !/\bREG\b/i.test(boundary) || /\b(no|not|remain|without|until)\b/i.test(boundary),
      item.id + ": queue boundary must not promise REG",
      errors,
    );
  }

  check((catalog.sources ?? []).some((source) => source.id === "PDS-SPINALJ-PROCESSED"), "SpinalJ P0 benchmark is missing", errors);
  check((catalog.sources ?? []).some((source) => source.id === "PDS-CANOGOMEZ-2026"), "Cano-Gomez spatial audit is missing", errors);
  check((catalog.sources ?? []).some((source) => source.id === "PDS-RUSS-2021"), "Russ taxonomy source is missing", errors);
  check((catalog.sources ?? []).some((source) => source.id === "PDS-STARMAP-PLUS-2023"), "STARmap PLUS spatial source lead is missing", errors);
  check((catalog.sources ?? []).some((source) => source.id === "PDS-TABULAE-PARALYTICA"), "Tabulae injury source is missing", errors);
  const spinalj = (catalog.sources ?? []).find((source) => source.id === "PDS-SPINALJ-PROCESSED");
  check(spinalj?.admissionStatus === "metadata_audited", "SpinalJ source must record the completed metadata audit", errors);
  check(spinalj?.intakeRecordId === "PSI-SPINALJ-PROCESSED-2026-08-18", "SpinalJ source must link its metadata intake", errors);
  const spinaljQueue = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-001");
  check(spinaljQueue?.status === "in_progress", "UPG-001 must disclose its in-progress metadata-audit stage", errors);
  const cano = (catalog.sources ?? []).find((source) => source.id === "PDS-CANOGOMEZ-2026");
  check(cano?.admissionStatus === "metadata_audited", "Cano-Gomez source must record the completed metadata audit", errors);
  check(cano?.intakeRecordId === "PSI-CANOGOMEZ-2026-08-18", "Cano-Gomez source must link its metadata intake", errors);
  const canoQueue = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-002");
  check(canoQueue?.status === "in_progress", "UPG-002 must disclose the specimen-and-file inventory stage", errors);
  check(/does not create REG/i.test(canoQueue?.scientificBoundary ?? ""), "UPG-002 must forbid registration from the reported method", errors);
  const russ = (catalog.sources ?? []).find((source) => source.id === "PDS-RUSS-2021");
  check(russ?.admissionStatus === "metadata_audited", "Russ source must record the pinned type-level metadata audit", errors);
  check(russ?.rights?.status === "recorded", "Russ source must retain its attributed derived-metadata rights record", errors);
  const russQueue = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-003");
  check(russQueue?.status === "in_progress", "UPG-003 must disclose the in-progress 69-population crosswalk", errors);
  check(/same-cell multimodal join/i.test(russQueue?.scientificBoundary ?? ""), "UPG-003 must forbid same-cell multimodal inference", errors);
  const russReconciliation = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-009");
  check(russReconciliation?.status === "in_progress", "UPG-009 must disclose the released reconciliation-dossier stage", errors);
  check(/creates no spatial coordinate/i.test(russReconciliation?.scientificBoundary ?? ""), "UPG-009 must retain its no-coordinate boundary", errors);
  check(/two official corrections/i.test(russReconciliation?.deliverable ?? ""), "UPG-009 must name the two official correction records", errors);
  const starmap = (catalog.sources ?? []).find((source) => source.id === "PDS-STARMAP-PLUS-2023");
  check(starmap?.admissionStatus === "ready_for_metadata_audit", "STARmap PLUS must remain a metadata-only source lead", errors);
  check(starmap?.content?.coordinateAuthority === "SOURCE_LOCAL_OBS", "STARmap PLUS must remain source-local coordinates", errors);
  check(/one coronal lumbar spinal-cord slice/i.test(starmap?.content?.spinalCoverage ?? ""), "STARmap PLUS must retain its one-slice coverage boundary", errors);
  const starmapQueue = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-010");
  check(starmapQueue?.status === "research_watch", "UPG-010 must remain a research-watch eligibility audit", errors);
  check(/creates no whole-spine census/i.test(starmapQueue?.scientificBoundary ?? ""), "UPG-010 must forbid whole-spine extrapolation", errors);
  const tabulae = (catalog.sources ?? []).find((source) => source.id === "PDS-TABULAE-PARALYTICA");
  check(tabulae?.admissionStatus === "metadata_audited", "Tabulae source must remain metadata audited", errors);
  check(tabulae?.intakeRecordId === "PSI-TABULAE-PARALYTICA-2026-08-18", "Tabulae source must link its metadata intake", errors);
  const tabulaeConditionAdapter = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-004");
  check(tabulaeConditionAdapter?.status === "in_progress", "UPG-004 must disclose the released metadata-only condition-index stage", errors);
  check(/source-metadata-only.*no numerical analysis.*REG/i.test(tabulaeConditionAdapter?.scientificBoundary ?? ""), "UPG-004 must forbid analysis and REG from a series-label index", errors);
  const tabulaeAdmissionGate = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-011");
  check(tabulaeAdmissionGate?.status === "in_progress", "UPG-011 must disclose the local-session implementation stage", errors);
  check(/current local session does not make a whole-spine atlas.*create REG/i.test(tabulaeAdmissionGate?.scientificBoundary ?? ""), "UPG-011 must forbid whole-spine extrapolation and REG", errors);
  const tabulae3dEligibilityGate = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-012");
  check(tabulae3dEligibilityGate?.status === "research_watch", "UPG-012 must remain a cross-section eligibility research watch", errors);
  check(/does not create a 3D reconstruction.*REG/i.test(tabulae3dEligibilityGate?.scientificBoundary ?? ""), "UPG-012 must forbid 3D reconstruction and REG", errors);
  const tabulaeMultiSessionGate = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-013");
  check(tabulaeMultiSessionGate?.status === "research_watch", "UPG-013 must remain a source-local interpretation research watch", errors);
  check(/remains source-local 2D only.*(?:does not align|cannot align).*REG/i.test(tabulaeMultiSessionGate?.scientificBoundary ?? ""), "UPG-013 must forbid alignment, analysis promotion and REG", errors);
  const provenanceExternalizationGate = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-014");
  check(provenanceExternalizationGate?.status === "in_progress", "UPG-014 must disclose the implemented detached metadata-export stage", errors);
  check(/external (?:public URL|HTTPS reference)/i.test(provenanceExternalizationGate?.deliverable ?? ""), "UPG-014 must retain an external-reference-only deliverable", errors);
  check(/does not acquire.*embed, bundle.*REG/i.test(provenanceExternalizationGate?.scientificBoundary ?? ""), "UPG-014 must forbid acquisition, embedding, bundling and REG", errors);
  const feasibilityPlanner = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-015");
  check(feasibilityPlanner?.status === "in_progress", "UPG-015 must disclose the implemented feasibility-planning stage", errors);
  check(JSON.stringify(feasibilityPlanner?.sourceIds) === JSON.stringify((catalog.sources ?? []).map((source) => source.id)), "UPG-015 must cover every catalogued public source", errors);
  check(/same-cell relationship.*create REG/i.test(feasibilityPlanner?.scientificBoundary ?? ""), "UPG-015 must forbid false joins and REG", errors);
  const provenanceTrace = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-016");
  check(provenanceTrace?.status === "in_progress", "UPG-016 must disclose the implemented two-lane provenance-trace stage", errors);
  check(JSON.stringify(provenanceTrace?.sourceIds) === JSON.stringify((catalog.sources ?? []).map((source) => source.id)), "UPG-016 must cover every catalogued public source", errors);
  check(/no cross-lane edge.*source acquisition.*registration/i.test((provenanceTrace?.acceptanceCriteria ?? []).join(" ")), "UPG-016 must preserve its no-join/no-acquisition/no-registration boundary", errors);
  check(/does not acquire.*cross-study identity.*REG/i.test(provenanceTrace?.scientificBoundary ?? ""), "UPG-016 must forbid acquisition, cross-study identity and REG", errors);
  const crossLaneAdmission = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-017");
  check(crossLaneAdmission?.status === "in_progress", "UPG-017 must remain an implemented, non-promoting relationship-admission gate", errors);
  check(JSON.stringify(crossLaneAdmission?.sourceIds) === JSON.stringify((catalog.sources ?? []).map((source) => source.id)), "UPG-017 must cover every catalogued public source", errors);
  check(/not admitted.*cannot alter.*registration count/i.test((crossLaneAdmission?.acceptanceCriteria ?? []).join(" ")), "UPG-017 must retain the non-promoting review boundary", errors);
  check(/does not acquire.*cross-study relation.*create REG/i.test(crossLaneAdmission?.scientificBoundary ?? ""), "UPG-017 must forbid acquisition, relationship promotion and REG", errors);
  const sourceAdmission = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-006");
  check(sourceAdmission?.status === "in_progress", "UPG-006 must remain an implemented metadata-only admission review", errors);
  check(/does not authenticate.*acquire or inspect.*create REG/i.test(sourceAdmission?.scientificBoundary ?? ""), "UPG-006 must retain the no-authentication, no-acquisition and no-REG boundary", errors);
  const sourceAssertionGate = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-018");
  check(sourceAssertionGate?.status === "in_progress", "UPG-018 must disclose the implemented provenance-attribution composer", errors);
  check(JSON.stringify(sourceAssertionGate?.sourceIds) === JSON.stringify((catalog.sources ?? []).map((source) => source.id)), "UPG-018 must cover every catalogued public source", errors);
  check(/not locally verified.*not admitted.*0 REG/i.test((sourceAssertionGate?.acceptanceCriteria ?? []).join(" ")), "UPG-018 must retain the not-verified, not-admitted and 0-REG boundary", errors);
  check(/does not acquire.*source-to-project relationship.*REG/i.test(sourceAssertionGate?.scientificBoundary ?? ""), "UPG-018 must forbid acquisition, attribution promotion and REG", errors);
  const assetAuthorizationGate = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-019");
  check(assetAuthorizationGate?.status === "in_progress", "UPG-019 must identify the implemented authorization-plan composer", errors);
  check(JSON.stringify(assetAuthorizationGate?.sourceIds) === JSON.stringify((catalog.sources ?? []).map((source) => source.id)), "UPG-019 must cover every catalogued public source", errors);
  check(/declared unacquired object.*version.*assertion identifier/i.test((assetAuthorizationGate?.acceptanceCriteria ?? []).join(" ")), "UPG-019 must require a fixed declared object, version and linked assertion", errors);
  check(/does not authenticate.*authorize.*acquire.*create REG/i.test(assetAuthorizationGate?.scientificBoundary ?? ""), "UPG-019 must remain non-authorizing and forbid acquisition and REG", errors);
  const authorizationEvidenceGate = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-020");
  check(authorizationEvidenceGate?.status === "in_progress", "UPG-020 must identify the implemented independent authorization-evidence composer", errors);
  check(JSON.stringify(authorizationEvidenceGate?.sourceIds) === JSON.stringify((catalog.sources ?? []).map((source) => source.id)), "UPG-020 must cover every catalogued public source", errors);
  check(/fixed declared unacquired object.*authorization-plan identifier.*independent-review request/i.test((authorizationEvidenceGate?.acceptanceCriteria ?? []).join(" ")), "UPG-020 must require a fixed object, plan link and independent-review request", errors);
  check(/does not authenticate.*authorize.*acquire.*retain.*create REG/i.test(authorizationEvidenceGate?.scientificBoundary ?? ""), "UPG-020 must remain non-authorizing and forbid acquisition, retention and REG", errors);
  const executionGate = (catalog.upgradeQueue ?? []).find((item) => item.id === "UPG-021");
  check(executionGate?.status === "research_watch", "UPG-021 must remain a separately approved execution research watch", errors);
  check(JSON.stringify(executionGate?.sourceIds) === JSON.stringify((catalog.sources ?? []).map((source) => source.id)), "UPG-021 must cover every catalogued public source", errors);
  check(/separately authenticated independent authorization record.*exact object.*rights statement/i.test((executionGate?.acceptanceCriteria ?? []).join(" ")), "UPG-021 must require a separately authenticated object-specific authorization record", errors);
  check(/does not authenticate authorization.*acquire.*retain.*create REG/i.test(executionGate?.scientificBoundary ?? ""), "UPG-021 must remain design-only and forbid authorization, acquisition, retention and REG", errors);

  if (errors.length) throw new Error("Public-data catalog validation failed:\\n" + errors.map((item) => "- " + item).join("\\n"));
  return {
    releaseId: catalog.releaseId,
    sourceCount: catalog.sources.length,
    queueCount: catalog.upgradeQueue.length,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  try {
    const result = await validatePublicDataCatalog();
    console.log("Public-data catalog validation passed: " + result.releaseId);
    console.log(result.sourceCount + " public sources and " + result.queueCount + " versioned upgrade records");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
