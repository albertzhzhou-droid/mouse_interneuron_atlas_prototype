import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validatePublicFileAdmissionManifest08 } from "../scripts/validate-public-file-admission-manifest-0.8.mjs";
import { validatePublicFileAdmissionPreflight08 } from "../scripts/validate-public-file-admission-preflight-0.8.mjs";

function manifest() {
  return {
    formatVersion: "0.8.0",
    manifestId: "PFM-CANOGOMEZ-2026-08-18",
    sourceId: "PDS-CANOGOMEZ-2026",
    dataset: { accession: "GSE318731 / BIL DOI 10.35077/g.1196", version: "2026 preprint resource", landingPageUrl: "https://www.biorxiv.org/content/10.64898/2026.06.11.731752v1", preprintStatus: "preprint_resource", rightsDecision: "recorded_for_file" },
    reviewDate: "2026-08-18",
    specimens: [{ specimenId: "source-specimen-opaque-1", animalId: null, sex: "not_reported", spinalRegion: "lumbar", assay: "Xenium spatial transcriptomics", sourceFrame: "source-local author frame", coordinateUnit: null, axisOrder: null, axisDirection: null, coordinateOrigin: null, pixelOrVoxelScale: null, missingReason: "fixture only; no public file header or object record has been admitted" }],
    files: [{ id: "source-object-opaque-1", stableName: "candidate-spatial-object", sourceUrl: "https://doi.brainimagelibrary.org/doi/10.35077/g.1196", bytes: 1234, format: "application/octet-stream", modality: "Xenium spatial transcriptomics", specimenIds: ["source-specimen-opaque-1"], sourceChecksum: { algorithm: "sha256", value: "a".repeat(64), provenance: "source_metadata" }, localSha256: null, rightsDecision: "recorded_for_file" }],
    admissionDecision: "metadata_only_not_downloaded_not_registered",
  };
}

test("accepts only a specimen-aware, preprint-bounded metadata manifest", async () => {
  assert.deepEqual(await validatePublicFileAdmissionManifest08(manifest()), { manifestId: "PFM-CANOGOMEZ-2026-08-18", specimenCount: 1, fileCount: 1 });
});

test("rejects undeclared specimens and a local hash before acquisition", async () => {
  const undeclared = manifest();
  undeclared.files[0].specimenIds = ["missing-specimen"];
  await assert.rejects(() => validatePublicFileAdmissionManifest08(undeclared), /undeclared specimen/);
  const localHash = manifest();
  localHash.files[0].localSha256 = "b".repeat(64);
  await assert.rejects(() => validatePublicFileAdmissionManifest08(localHash), /localSha256|local SHA-256/);
});

test("locks the zero-file, specimen-aware Cano-Gomez preflight", async () => {
  const preflight = JSON.parse(await readFile(new URL("../data/file-admission-preflight-0.8.json", import.meta.url), "utf8"));
  const report = await validatePublicFileAdmissionPreflight08(preflight);
  assert.equal(report.candidateFilesAccepted, 0);
  assert.equal(preflight.nextQueueItem, "UPG-002B");
  assert.equal(preflight.automaticDownload, false);
});
