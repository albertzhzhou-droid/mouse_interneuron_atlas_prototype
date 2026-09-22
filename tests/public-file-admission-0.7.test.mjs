import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validatePublicFileAdmissionManifest07 } from "../scripts/validate-public-file-admission-manifest-0.7.mjs";
import { validatePublicFileAdmissionPreflight07 } from "../scripts/validate-public-file-admission-preflight-0.7.mjs";

function sourceSha1Manifest() {
  return {
    formatVersion: "0.7.0",
    manifestId: "PFM-SPINALJ-2026-08-18",
    sourceId: "PDS-SPINALJ-PROCESSED",
    dataset: { accession: "10.17632/mkc37w4rrv.1", version: "1", landingPageUrl: "https://data.mendeley.com/datasets/mkc37w4rrv/1", rightsDecision: "recorded_for_file" },
    reviewDate: "2026-08-18",
    files: [{
      id: "publisher-file-id",
      stableName: "processed-section-example.tif",
      sourceUrl: "https://data.mendeley.com/datasets/mkc37w4rrv/1",
      bytes: 1234,
      format: "image/tiff",
      sourceChecksum: { algorithm: "sha1", value: "a".repeat(40), provenance: "source_metadata" },
      localSha256: null,
      rightsDecision: "recorded_for_file",
      coordinates: { unit: null, axisOrder: null, origin: null, missingReason: "source file header not inspected" },
    }],
    admissionDecision: "metadata_only_not_downloaded_not_registered",
  };
}

test("accepts a declared source SHA-1 without pretending it is a local SHA-256", async () => {
  const report = await validatePublicFileAdmissionManifest07(sourceSha1Manifest());
  assert.deepEqual(report.algorithms, ["sha1"]);
});

test("rejects relabeling a source checksum as a locally computed SHA-256", async () => {
  const manifest = sourceSha1Manifest();
  manifest.files[0].localSha256 = "b".repeat(64);
  await assert.rejects(() => validatePublicFileAdmissionManifest07(manifest), /localSha256/);
});

test("locks the zero-file source-checksum-aware preflight", async () => {
  const preflight = JSON.parse(await readFile(new URL("../data/file-admission-preflight-0.7.json", import.meta.url), "utf8"));
  const report = await validatePublicFileAdmissionPreflight07(preflight);
  assert.equal(report.candidateFilesAccepted, 0);
  assert.equal(preflight.nextQueueItem, "UPG-001B");
});
