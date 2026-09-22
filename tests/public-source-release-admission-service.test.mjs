import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { admissionReviewReceiptFilename, evaluatePublicSourceAdmissionManifest } from "../app/public-source-release-admission.js";
import { validatePublicSourceReleaseAdmissionService } from "../scripts/validate-public-source-release-admission-service-0.1.mjs";

const [service, catalog, spinalj, cano, component] = await Promise.all([
  readFile(new URL("../data/public-source-release-admission-service-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-data-catalog-0.4.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/file-admission-preflight-0.7.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/file-admission-preflight-0.8.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/PublicSourceReleaseAdmissionReview.tsx", import.meta.url), "utf8"),
]);

function spinaljManifest() {
  return {formatVersion:"0.7.0",manifestId:"PFM-SPINALJ-2026-08-20",sourceId:"PDS-SPINALJ-PROCESSED",dataset:{accession:"Mendeley Data mkc37w4rrv.1",version:"v1",landingPageUrl:"https://data.mendeley.com/datasets/mkc37w4rrv/1",rightsDecision:"recorded_for_file"},reviewDate:"2026-08-20",files:[{id:"section-1",stableName:"section-1.tif",sourceUrl:"https://data.mendeley.com/public-files/section-1.tif",bytes:10,format:"TIFF",sourceChecksum:{algorithm:"sha256",value:"a".repeat(64),provenance:"source_metadata"},localSha256:null,rightsDecision:"recorded_for_file",coordinates:{unit:"um",axisOrder:"xy",origin:"top-left",missingReason:null}}],admissionDecision:"metadata_only_not_downloaded_not_registered"};
}

function canoManifest() {
  return {formatVersion:"0.8.0",manifestId:"PFM-CANOGOMEZ-2026-08-20",sourceId:"PDS-CANOGOMEZ-2026",dataset:{accession:"GSE318731 / BIL DOI 10.35077/g.1196",version:"2026",landingPageUrl:"https://www.biorxiv.org/content/10.64898/2026.06.11.731752v1",preprintStatus:"preprint_resource",rightsDecision:"recorded_for_file"},reviewDate:"2026-08-20",specimens:[{specimenId:"x-1",animalId:"animal-1",sex:"female",spinalRegion:"lumbar",assay:"Xenium spatial transcriptomics",sourceFrame:"author-space",coordinateUnit:"um",axisOrder:"xy",axisDirection:"right-anterior",coordinateOrigin:"top-left",pixelOrVoxelScale:"1 um",missingReason:null}],files:[{id:"xenium-1",stableName:"xenium-1.h5ad",sourceUrl:"https://example.org/xenium-1.h5ad",bytes:10,format:"H5AD",modality:"Xenium spatial transcriptomics",specimenIds:["x-1"],sourceChecksum:{algorithm:"sha1",value:"a".repeat(40),provenance:"source_metadata"},localSha256:null,rightsDecision:"recorded_for_file"}],admissionDecision:"metadata_only_not_downloaded_not_registered"};
}

test("validates the deterministic local source-admission service contract", async () => {
  const report = await validatePublicSourceReleaseAdmissionService();
  assert.equal(report.formatCount, 2);
  assert.equal(report.decision, "not_admitted_pending_curator_object_and_rights_review");
  assert.equal(spinalj.automaticDownload, false);
  assert.equal(cano.automaticDownload, false);
});

test("reviews complete metadata without promoting the SpinalJ source object", () => {
  const receipt = evaluatePublicSourceAdmissionManifest({manifest: spinaljManifest(), catalog, contract: service, generatedAt:"2026-08-20T00:00:00.000Z"});
  assert.equal(receipt.metadataCompleteness, "metadata_complete_for_curator_review_only");
  assert.equal(receipt.admissionDecision, "not_admitted_pending_curator_object_and_rights_review");
  assert.equal(receipt.sourceObjectsAcquired, false);
  assert.equal(receipt.localChecksumsCalculated, false);
  assert.equal(receipt.registrationsCreated, 0);
  assert.ok(receipt.checks.some((check) => check.id === "asset_level_rights_review" && check.status === "requires_independent_curator_review"));
  assert.equal(admissionReviewReceiptFilename(receipt), "ohri-admission-review-pfm-spinalj-2026-08-20.json");
});

test("retains Cano-Gomez specimen and preprint limits in an unadmitted receipt", () => {
  const receipt = evaluatePublicSourceAdmissionManifest({manifest: canoManifest(), catalog, contract: service, generatedAt:"2026-08-20T00:00:00.000Z"});
  assert.ok(receipt.checks.some((check) => check.id === "specimen_identity" && check.status === "recorded"));
  assert.ok(receipt.checks.some((check) => check.id === "source_frame_or_missingness" && check.status === "recorded"));
  assert.ok(receipt.checks.some((check) => check.id === "preprint_disclosure" && check.status === "recorded"));
  assert.equal(receipt.admissionDecision, service.admissionDecision);
});

test("rejects unsupported sources and does not expose source fetching", () => {
  assert.throws(() => evaluatePublicSourceAdmissionManifest({manifest:{...spinaljManifest(),sourceId:"PDS-RUSS-2021"},catalog,contract:service,generatedAt:"2026-08-20T00:00:00.000Z"}), /not supported/);
  assert.match(component, /RELEASE-ADMISSION REVIEW/);
  assert.match(component, /Metadata complete is not data admission/);
  assert.match(component, /Export not-admitted review receipt/);
  assert.doesNotMatch(component, /fetch\(/);
  assert.doesNotMatch(component, /<input[^>]+type=.file/i);
});
