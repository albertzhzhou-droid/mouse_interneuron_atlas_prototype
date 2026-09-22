import assert from "node:assert/strict";
import test from "node:test";
import { validatePublicFileAdmissionManifest } from "../scripts/validate-public-file-admission-manifest.mjs";

function validManifest() {
  return { formatVersion: "0.6.0", manifestId: "PFM-SPINALJ-2026-08-18", sourceId: "PDS-SPINALJ-PROCESSED", dataset: { accession: "10.17632/mkc37w4rrv.1", version: "1", landingPageUrl: "https://data.mendeley.com/datasets/mkc37w4rrv/1", rightsDecision: "recorded_for_file" }, reviewDate: "2026-08-18", files: [{ id: "opaque-public-file-id", stableName: "processed-section-example.tif", sourceUrl: "https://data.mendeley.com/datasets/mkc37w4rrv/1", bytes: 1234, format: "image/tiff", sha256: "a".repeat(64), rightsDecision: "recorded_for_file", coordinates: { unit: null, axisOrder: null, origin: null, missingReason: "source file header not yet inspected" } }], admissionDecision: "metadata_only_not_downloaded_not_registered" };
}

test("accepts only a file-level metadata manifest that remains unacquired and unregistered", async () => {
  const report = await validatePublicFileAdmissionManifest(validManifest());
  assert.equal(report.fileCount, 1);
});

test("rejects absent checksum, file rights or coordinate missingness", async () => {
  const invalid = validManifest();
  invalid.files[0].sha256 = "";
  await assert.rejects(() => validatePublicFileAdmissionManifest(invalid), /sha256/);
  const coordinates = validManifest();
  coordinates.files[0].coordinates.missingReason = null;
  await assert.rejects(() => validatePublicFileAdmissionManifest(coordinates), /missingReason/);
});
