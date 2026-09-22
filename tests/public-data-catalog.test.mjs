import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createResearchMvpValidator, formatSchemaErrors } from "../scripts/validate-json-schema.mjs";
import { validatePublicDataCatalog } from "../scripts/validate-public-data-catalog.mjs";

const [catalog, schema] = await Promise.all([
  readFile(new URL("../data/public-data-catalog-0.4.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../schemas/public-data-catalog-0.4.schema.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("executes the public-data catalog schema and semantic validator", async () => {
  const validate = createResearchMvpValidator(schema);
  assert.equal(validate(catalog), true, formatSchemaErrors(validate.errors).join("\\n"));
  const report = await validatePublicDataCatalog();
  assert.equal(report.sourceCount, 7);
  assert.equal(report.queueCount, 21);
  assert.equal(catalog.sources.find((source) => source.id === "PDS-SPINALJ-PROCESSED").admissionStatus, "metadata_audited");
  const cano = catalog.sources.find((source) => source.id === "PDS-CANOGOMEZ-2026");
  assert.equal(cano?.admissionStatus, "metadata_audited");
  assert.equal(cano?.intakeRecordId, "PSI-CANOGOMEZ-2026-08-18");
  const canoGate = catalog.upgradeQueue.find((item) => item.id === "UPG-002");
  assert.equal(canoGate?.status, "in_progress");
  assert.match(canoGate?.scientificBoundary ?? "", /does not create REG/i);
  const russ = catalog.sources.find((source) => source.id === "PDS-RUSS-2021");
  assert.equal(russ?.admissionStatus, "metadata_audited");
  assert.equal(russ?.rights.status, "recorded");
  const russGate = catalog.upgradeQueue.find((item) => item.id === "UPG-003");
  assert.equal(russGate?.status, "in_progress");
  assert.match(russGate?.scientificBoundary ?? "", /same-cell multimodal join/i);
  const russReconciliation = catalog.upgradeQueue.find((item) => item.id === "UPG-009");
  assert.equal(russReconciliation?.status, "in_progress");
  assert.match(russReconciliation?.scientificBoundary ?? "", /no spatial coordinate/i);
  assert.match(russReconciliation?.deliverable ?? "", /two official corrections/i);
  const starmap = catalog.sources.find((source) => source.id === "PDS-STARMAP-PLUS-2023");
  assert.equal(starmap?.admissionStatus, "ready_for_metadata_audit");
  assert.equal(starmap?.content.coordinateAuthority, "SOURCE_LOCAL_OBS");
  assert.match(starmap?.content.spinalCoverage ?? "", /one coronal lumbar spinal-cord slice/i);
  const starmapGate = catalog.upgradeQueue.find((item) => item.id === "UPG-010");
  assert.equal(starmapGate?.status, "research_watch");
  assert.match(starmapGate?.scientificBoundary ?? "", /no whole-spine census/i);
  const tabulae = catalog.sources.find((source) => source.id === "PDS-TABULAE-PARALYTICA");
  assert.equal(tabulae?.admissionStatus, "metadata_audited");
  assert.equal(tabulae?.intakeRecordId, "PSI-TABULAE-PARALYTICA-2026-08-18");
  const tabulaeConditionAdapter = catalog.upgradeQueue.find((item) => item.id === "UPG-004");
  assert.equal(tabulaeConditionAdapter?.status, "in_progress");
  assert.match(tabulaeConditionAdapter?.scientificBoundary ?? "", /source-metadata-only.*no numerical analysis.*REG/i);
  const tabulaeAdmissionGate = catalog.upgradeQueue.find((item) => item.id === "UPG-011");
  assert.equal(tabulaeAdmissionGate?.status, "in_progress");
  assert.match(tabulaeAdmissionGate?.scientificBoundary ?? "", /current local session does not make a whole-spine atlas.*create REG/i);
  const tabulae3dEligibilityGate = catalog.upgradeQueue.find((item) => item.id === "UPG-012");
  assert.equal(tabulae3dEligibilityGate?.status, "research_watch");
  assert.match(tabulae3dEligibilityGate?.scientificBoundary ?? "", /does not create a 3D reconstruction.*REG/i);
  const tabulaeMultiSessionGate = catalog.upgradeQueue.find((item) => item.id === "UPG-013");
  assert.equal(tabulaeMultiSessionGate?.status, "research_watch");
  assert.match(tabulaeMultiSessionGate?.scientificBoundary ?? "", /remains source-local 2D only.*(?:does not align|cannot align).*REG/i);
  const provenanceExternalizationGate = catalog.upgradeQueue.find((item) => item.id === "UPG-014");
  assert.equal(provenanceExternalizationGate?.status, "in_progress");
  assert.match(provenanceExternalizationGate?.deliverable ?? "", /external (?:public URL|HTTPS reference)/i);
  assert.match(provenanceExternalizationGate?.scientificBoundary ?? "", /does not acquire.*embed, bundle.*REG/i);
  const feasibilityPlanner = catalog.upgradeQueue.find((item) => item.id === "UPG-015");
  assert.equal(feasibilityPlanner?.status, "in_progress");
  assert.deepEqual(feasibilityPlanner?.sourceIds, catalog.sources.map((source) => source.id));
  assert.match(feasibilityPlanner?.scientificBoundary ?? "", /same-cell relationship.*create REG/i);
  const provenanceTrace = catalog.upgradeQueue.find((item) => item.id === "UPG-016");
  assert.equal(provenanceTrace?.status, "in_progress");
  assert.deepEqual(provenanceTrace?.sourceIds, catalog.sources.map((source) => source.id));
  assert.match((provenanceTrace?.acceptanceCriteria ?? []).join(" "), /no cross-lane edge.*source acquisition.*registration/i);
  assert.match(provenanceTrace?.scientificBoundary ?? "", /does not acquire.*cross-study identity.*REG/i);
  const crossLaneAdmission = catalog.upgradeQueue.find((item) => item.id === "UPG-017");
  assert.equal(crossLaneAdmission?.status, "in_progress");
  assert.deepEqual(crossLaneAdmission?.sourceIds, catalog.sources.map((source) => source.id));
  assert.match((crossLaneAdmission?.acceptanceCriteria ?? []).join(" "), /not admitted.*cannot alter.*registration count/i);
  assert.match(crossLaneAdmission?.scientificBoundary ?? "", /does not acquire.*cross-study relation.*create REG/i);
  const sourceAdmission = catalog.upgradeQueue.find((item) => item.id === "UPG-006");
  assert.equal(sourceAdmission?.status, "in_progress");
  assert.match(sourceAdmission?.scientificBoundary ?? "", /does not authenticate.*acquire or inspect.*create REG/i);
  const sourceAssertionGate = catalog.upgradeQueue.find((item) => item.id === "UPG-018");
  assert.equal(sourceAssertionGate?.status, "in_progress");
  assert.deepEqual(sourceAssertionGate?.sourceIds, catalog.sources.map((source) => source.id));
  assert.match((sourceAssertionGate?.acceptanceCriteria ?? []).join(" "), /not locally verified.*not admitted.*0 REG/i);
  const assetAuthorizationGate = catalog.upgradeQueue.find((item) => item.id === "UPG-019");
  assert.equal(assetAuthorizationGate?.status, "in_progress");
  assert.deepEqual(assetAuthorizationGate?.sourceIds, catalog.sources.map((source) => source.id));
  assert.match((assetAuthorizationGate?.acceptanceCriteria ?? []).join(" "), /declared unacquired object.*version.*assertion identifier/i);
  assert.match(assetAuthorizationGate?.scientificBoundary ?? "", /does not authenticate.*authorize.*acquire.*create REG/i);
  const authorizationEvidenceGate = catalog.upgradeQueue.find((item) => item.id === "UPG-020");
  assert.equal(authorizationEvidenceGate?.status, "in_progress");
  assert.deepEqual(authorizationEvidenceGate?.sourceIds, catalog.sources.map((source) => source.id));
  assert.match((authorizationEvidenceGate?.acceptanceCriteria ?? []).join(" "), /fixed declared unacquired object.*authorization-plan identifier.*independent-review request/i);
  assert.match(authorizationEvidenceGate?.scientificBoundary ?? "", /does not authenticate.*authorize.*acquire.*retain.*create REG/i);
  const executionGate = catalog.upgradeQueue.find((item) => item.id === "UPG-021");
  assert.equal(executionGate?.status, "research_watch");
  assert.deepEqual(executionGate?.sourceIds, catalog.sources.map((source) => source.id));
  assert.match((executionGate?.acceptanceCriteria ?? []).join(" "), /separately authenticated independent authorization record.*exact object.*rights statement/i);
});

test("does not allow a source to silently claim project registration or internal data", () => {
  const invalid = structuredClone(catalog);
  invalid.sources[0].content.coordinateAuthority = "REG";
  invalid.sources[0].unexpectedProprietaryInput = true;
  const validate = createResearchMvpValidator(schema);
  assert.equal(validate(invalid), false);
  assert.match(formatSchemaErrors(validate.errors).join("\\n"), /additional properties|coordinateAuthority/);
});

test("keeps all queue dependencies in the public catalog", () => {
  const sourceIds = new Set(catalog.sources.map((source) => source.id));
  for (const item of catalog.upgradeQueue) {
    assert.ok(item.sourceIds.length > 0, item.id + ": needs a public source");
    assert.ok(item.sourceIds.every((sourceId) => sourceIds.has(sourceId)), item.id + ": unknown source");
    assert.ok(
      !/\bREG\b/i.test(item.scientificBoundary) || /\b(no|not|remain|without|until)\b/i.test(item.scientificBoundary),
      item.id + ": must not promise registration",
    );
  }
});

test("standalone public-data catalog validator passes", () => {
  const result = spawnSync(process.execPath, [new URL("../scripts/validate-public-data-catalog.mjs", import.meta.url).pathname], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /7 public sources and 21 versioned upgrade records/);
});
