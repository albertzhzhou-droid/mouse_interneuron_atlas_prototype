import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { authorizationPlanFilename, buildPublicSourceAuthorizationPlan } from "../app/public-source-authorization-plan.js";
import { validatePublicSourceAuthorizationPlan } from "../scripts/validate-public-source-authorization-plan-0.1.mjs";

const [catalog, admissionService, assertionContract, contract, component] = await Promise.all([
  readFile(new URL("../data/public-data-catalog-0.4.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-source-release-admission-service-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-source-assertion-provenance-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-source-authorization-plan-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/PublicSourceAuthorizationPlan.tsx", import.meta.url), "utf8"),
]);

function spinaljManifest() {
  return {
    formatVersion: "0.7.0", manifestId: "PFM-SPINALJ-2026-08-20", sourceId: "PDS-SPINALJ-PROCESSED", dataset: { accession: "Mendeley Data mkc37w4rrv.1" },
    files: [{ id: "section-1", stableName: "section-1.tif", sourceUrl: "https://data.mendeley.com/public-files/section-1.tif", sourceChecksum: { algorithm: "sha256", value: "f".repeat(64), provenance: "source_metadata" }, localSha256: null }],
  };
}

function validPlan(overrides = {}) {
  return {
    caseId: "PAV-SPINALJ-2026-08-20-2026-08-20", linkedAssertionId: "PSA-SPINALJ-2026-08-20-2026-08-20", subjectReference: "section-1", objectVersion: "Mendeley Data v1.13",
    intendedUseScope: "private_curator_review_only", requestedRightsDisposition: "request_independent_rights_review", evidenceLocatorKind: "rights_statement_url", evidenceLocator: "https://data.mendeley.com/datasets/mkc37w4rrv/1",
    contentScopeDescription: "One declared processed section image and its source metadata, after separately approved acquisition.", curatorId: "CUR-ALIAS-01", reviewDate: "2026-08-20", ...overrides,
  };
}

test("validates the non-authorizing authorization-plan composer contract", async () => {
  const report = await validatePublicSourceAuthorizationPlan();
  assert.equal(report.supportedFormatCount, 2);
  assert.equal(report.plannedStageCount, 5);
});

test("emits an object-specific plan without authorizing, acquiring or verifying a source object", () => {
  const { errors, plan } = buildPublicSourceAuthorizationPlan({ manifest: spinaljManifest(), plan: validPlan(), catalog, admissionService, assertionContract, contract, generatedAt: "2026-08-20T12:00:00.000Z" });
  assert.deepEqual(errors, []);
  assert.equal(plan.planStatus, "authorization_and_verification_plan_only");
  assert.equal(plan.authorizationStatus, "not_authorized_by_this_plan");
  assert.equal(plan.verificationStatus, "not_locally_verified");
  assert.equal(plan.declaredObject.localSha256, null);
  assert.deepEqual(plan.plannedVerificationStages.map((stage) => stage.status), Array(5).fill("planned_not_executed"));
  assert.equal(plan.sourceObjectsAcquired, false);
  assert.equal(plan.localChecksumsCalculated, false);
  assert.equal(plan.contentInspected, false);
  assert.equal(plan.registrationsCreated, 0);
  assert.equal(authorizationPlanFilename(plan), "ohri-authorization-verification-plan-2026-08-20-section-1.json");
});

test("rejects a non-manifest object, unplanned rights grant, or locally hashed source", () => {
  const wrongObject = buildPublicSourceAuthorizationPlan({ manifest: spinaljManifest(), plan: validPlan({ subjectReference: "unlisted" }), catalog, admissionService, assertionContract, contract, generatedAt: "2026-08-20T12:00:00.000Z" });
  assert.equal(wrongObject.plan, null);
  assert.match(wrongObject.errors.join(" "), /declared file ID/i);
  const promotedRights = buildPublicSourceAuthorizationPlan({ manifest: spinaljManifest(), plan: validPlan({ requestedRightsDisposition: "authorized" }), catalog, admissionService, assertionContract, contract, generatedAt: "2026-08-20T12:00:00.000Z" });
  assert.equal(promotedRights.plan, null);
  assert.match(promotedRights.errors.join(" "), /rights disposition/i);
  const hashedManifest = spinaljManifest(); hashedManifest.files[0].localSha256 = "a".repeat(64);
  const locallyHashed = buildPublicSourceAuthorizationPlan({ manifest: hashedManifest, plan: validPlan(), catalog, admissionService, assertionContract, contract, generatedAt: "2026-08-20T12:00:00.000Z" });
  assert.equal(locallyHashed.plan, null);
  assert.match(locallyHashed.errors.join(" "), /unacquired/i);
});

test("exposes local authorization-plan UI without source transfer", () => {
  assert.match(component, /Define the gate; do not acquire the object/);
  assert.match(component, /Export authorization plan/);
  assert.match(component, /PLAN ONLY.*0 REG/);
  assert.doesNotMatch(component, /fetch\(/);
  assert.doesNotMatch(component, /<input[^>]+type=.file/i);
  assert.doesNotMatch(component, /localStorage|indexedDB/i);
});
