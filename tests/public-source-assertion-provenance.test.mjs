import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { assertionProvenanceReceiptFilename, buildPublicSourceAssertionProvenanceReceipt } from "../app/public-source-assertion-provenance.js";
import { validatePublicSourceAssertionProvenance } from "../scripts/validate-public-source-assertion-provenance-0.1.mjs";

const [catalog, admissionService, contract, component] = await Promise.all([
  readFile(new URL("../data/public-data-catalog-0.4.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-source-release-admission-service-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-source-assertion-provenance-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/PublicSourceAssertionProvenance.tsx", import.meta.url), "utf8"),
]);

function spinaljManifest() {
  return {
    formatVersion: "0.7.0",
    manifestId: "PFM-SPINALJ-2026-08-20",
    sourceId: "PDS-SPINALJ-PROCESSED",
    dataset: { accession: "Mendeley Data mkc37w4rrv.1" },
    files: [{ id: "section-1", stableName: "section-1.tif", sourceUrl: "https://data.mendeley.com/public-files/section-1.tif" }],
  };
}

function validAssertion(overrides = {}) {
  return {
    assertionId: "PSA-SPINALJ-2026-08-20-2026-08-20",
    checkId: "declared_source_checksum",
    sourceState: "publisher_asserted",
    subjectKind: "declared_unacquired_source_object",
    subjectReference: "section-1",
    evidenceLocatorKind: "publisher_object_url",
    evidenceLocator: "https://data.mendeley.com/public-files/section-1.tif",
    assertedValue: "Publisher declares a SHA-256 value in source metadata; it has not been locally verified.",
    curatorId: "CUR-ALIAS-01",
    reviewDate: "2026-08-20",
    ...overrides,
  };
}

test("validates the non-promoting assertion-provenance composer contract", async () => {
  const report = await validatePublicSourceAssertionProvenance();
  assert.equal(report.claimScopeCount, 8);
  assert.equal(report.assertionStateCount, 3);
});

test("emits an evidence-located assertion receipt without acquiring or admitting a source object", () => {
  const { errors, receipt } = buildPublicSourceAssertionProvenanceReceipt({
    manifest: spinaljManifest(), assertion: validAssertion(), catalog, admissionService, contract, generatedAt: "2026-08-20T12:00:00.000Z",
  });
  assert.deepEqual(errors, []);
  assert.equal(receipt.verificationStatus, "not_locally_verified");
  assert.equal(receipt.admissionDecision, "not_admitted_pending_curator_object_and_rights_review");
  assert.equal(receipt.assertion.claimScope, "declared_source_checksum");
  assert.equal(receipt.assertion.subjectStatus, "declared_unacquired_source_object");
  assert.equal(receipt.assertion.evidenceLocator.kind, "publisher_object_url");
  assert.equal(receipt.sourceObjectsAcquired, false);
  assert.equal(receipt.sourceObjectsBundled, false);
  assert.equal(receipt.localChecksumsCalculated, false);
  assert.equal(receipt.registrationsCreated, 0);
  assert.equal(assertionProvenanceReceiptFilename(receipt), "ohri-assertion-provenance-psa-spinalj-2026-08-20-2026-08-20.json");
});

test("keeps an unresolved assertion explicit and unadmitted", () => {
  const { errors, receipt } = buildPublicSourceAssertionProvenanceReceipt({
    manifest: spinaljManifest(),
    assertion: validAssertion({
      checkId: "asset_level_rights_review",
      sourceState: "unresolved",
      subjectKind: "unknown_source_object",
      subjectReference: "unknown",
      evidenceLocatorKind: "curator_note",
      evidenceLocator: "No asset-specific determination has been recorded.",
      assertedValue: "Unresolved: no asset-level reuse decision has been verified.",
    }),
    catalog,
    admissionService,
    contract,
    generatedAt: "2026-08-20T12:00:00.000Z",
  });
  assert.deepEqual(errors, []);
  assert.equal(receipt.assertion.claimScope, "asset_rights_metadata");
  assert.equal(receipt.assertion.subjectStatus, "unknown_not_acquired");
  assert.equal(receipt.assertion.sourceState, "unresolved");
  assert.equal(receipt.admissionDecision, contract.nonPromotion.admissionDecision);
});

test("rejects a non-declared subject or a forbidden promotion state", () => {
  const nonDeclared = buildPublicSourceAssertionProvenanceReceipt({
    manifest: spinaljManifest(), assertion: validAssertion({ subjectReference: "unlisted-object" }), catalog, admissionService, contract, generatedAt: "2026-08-20T12:00:00.000Z",
  });
  assert.equal(nonDeclared.receipt, null);
  assert.match(nonDeclared.errors.join(" "), /declared unacquired subject/i);
  const promoted = buildPublicSourceAssertionProvenanceReceipt({
    manifest: spinaljManifest(), assertion: validAssertion({ sourceState: "locally_verified" }), catalog, admissionService, contract, generatedAt: "2026-08-20T12:00:00.000Z",
  });
  assert.equal(promoted.receipt, null);
  assert.match(promoted.errors.join(" "), /source state/i);
});

test("exposes local assertion provenance UI without source transfer", () => {
  assert.match(component, /Record who says what; do not admit the object/);
  assert.match(component, /Export assertion provenance/);
  assert.match(component, /UNVERIFIED.*0 REG/);
  assert.doesNotMatch(component, /fetch\(/);
  assert.doesNotMatch(component, /<input[^>]+type=.file/i);
  assert.doesNotMatch(component, /localStorage|indexedDB/i);
});
