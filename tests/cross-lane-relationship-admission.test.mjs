import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildCrossLaneRelationshipProposal,
  crossLaneRelationshipProposalFilename,
  relationshipAdmissionKinds,
} from "../app/cross-lane-relationship-admission.js";
import { validateCrossLaneRelationshipAdmission } from "../scripts/validate-cross-lane-relationship-admission-0.1.mjs";

const [contract, research, catalog, trace, component] = await Promise.all([
  readFile(new URL("../data/cross-lane-relationship-admission-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/research-mvp-release-0.2.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-data-catalog-0.4.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/evidence-provenance-trace-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/CrossLaneRelationshipAdmission.tsx", import.meta.url), "utf8"),
]);

test("validates the non-promoting relationship-admission contract", async () => {
  const report = await validateCrossLaneRelationshipAdmission();
  assert.equal(report.relationshipKindCount, 5);
  assert.equal(report.admissionStatus, "proposal_only_not_admitted");
});

test("exposes fixed relationship kinds with coordinate and identity-specific proof requirements", () => {
  const kinds = relationshipAdmissionKinds(contract);
  assert.deepEqual(kinds.map((item) => item.id), ["molecular_label_correspondence", "source_object_derivation", "same_specimen_relation", "coordinate_transform", "same_cell_identity"]);
  assert.ok(kinds.find((item) => item.id === "coordinate_transform").requiredEvidence.includes("held_out_physical_space_error"));
  assert.ok(kinds.find((item) => item.id === "same_cell_identity").requiredEvidence.includes("persistent_cell_identifier_or_paired_measurement"));
});

test("exports a proposal that remains not admitted even with a curator question", () => {
  const proposal = buildCrossLaneRelationshipProposal({
    entityId: "mouse.sc.vsx2_hoxa10",
    sourceId: "PDS-RUSS-2021",
    relationKindId: "molecular_label_correspondence",
    curatorQuestion: "Which independently pinned object could test this label correspondence?",
    contract,
    researchRelease: research,
    catalog,
    traceContract: trace,
    generatedAt: "2026-08-20T00:00:00.000Z",
  });
  assert.equal(proposal.admissionDecision, "not_admitted");
  assert.equal(proposal.sourceObjectsAcquired, false);
  assert.equal(proposal.registrationsCreated, 0);
  assert.equal(proposal.sourceObject.objectId, null);
  assert.ok(proposal.blockers.some((item) => /No stable source-object ID/.test(item)));
  assert.equal(crossLaneRelationshipProposalFilename(proposal), "ohri-cross-lane-proposal-mouse-sc-vsx2_hoxa10-pds-russ-2021.json");
});

test("refuses unknown frozen records and relationship kinds", () => {
  const args = {
    entityId: "unknown",
    sourceId: "PDS-RUSS-2021",
    relationKindId: "same_cell_identity",
    contract,
    researchRelease: research,
    catalog,
    traceContract: trace,
    generatedAt: "2026-08-20T00:00:00.000Z",
  };
  assert.throws(() => buildCrossLaneRelationshipProposal(args), /research entity/);
  assert.throws(() => buildCrossLaneRelationshipProposal({ ...args, entityId: "mouse.sc.vsx2_hoxa10", relationKindId: "anything" }), /candidate relation kind/);
});

test("renders the explicit not-admitted boundary without fetch or upload", () => {
  assert.match(component, /CROSS-LANE ADMISSION GATE/);
  assert.match(component, /Describe the missing evidence; do not create the edge/);
  assert.match(component, /Export not-admitted proposal/);
  assert.doesNotMatch(component, /fetch\(/);
  assert.doesNotMatch(component, /<input[^>]+type=.file/i);
});
