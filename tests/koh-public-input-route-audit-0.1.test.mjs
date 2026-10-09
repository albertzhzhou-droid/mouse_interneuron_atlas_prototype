import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateKohPublicInputRouteAudit } from "../scripts/validate-koh-public-input-route-audit-0.1.mjs";

const [audit, zenodoAudit, supplementAudit] = await Promise.all([
  readFile(new URL("../data/koh-public-input-route-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/koh-zenodo-supporting-code-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/koh-spinal-supplemental-file-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("Koh direct public routes remain code/supplement-only and the Svara archives remain candidates", () => {
  const result = validateKohPublicInputRouteAudit(audit, { zenodoAudit, supplementAudit });
  assert.equal(result.directKohRoutesChecked, 4);
  assert.equal(result.githubSourceFilesVisible, 2);
  assert.equal(result.upstreamSupplementCandidates, 3);
  assert.equal(result.exactRequiredInputsPubliclyVerified, false);
  assert.equal(result.followUpResearchUpgradeId, "UPG-250");
  assert.equal(result.geometryAdmitted, 0);
  assert.equal(result.mouseDenominatorDelta, 0);
});

test("Koh public-route audit rejects promoting a linked Svara ZIP to the exact Knossos input", () => {
  const altered = structuredClone(audit);
  altered.upstreamDatasetCandidate.exactKohKnossosAnnotationMatchEstablished = true;
  assert.throws(() => validateKohPublicInputRouteAudit(altered), /upstream candidate and unresolved exact-file gate changed/);
});

test("Koh public-route audit rejects an absence-wide claim or unauthorized geometry", () => {
  const universalAbsence = structuredClone(audit);
  universalAbsence.findings.scopeIsNotUniversalAbsenceClaim = false;
  assert.throws(() => validateKohPublicInputRouteAudit(universalAbsence), /beyond their bounded scope/);

  const geometry = structuredClone(audit);
  geometry.rightsAndAdmission.geometryAdmitted = 1;
  assert.throws(() => validateKohPublicInputRouteAudit(geometry), /no-admission boundary/);
});
