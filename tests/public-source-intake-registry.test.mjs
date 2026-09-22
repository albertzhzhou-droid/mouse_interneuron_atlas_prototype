import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createResearchMvpValidator, formatSchemaErrors } from "../scripts/validate-json-schema.mjs";
import { validatePublicSourceIntakeRegistry06 } from "../scripts/validate-public-source-intake-registry-0.6.mjs";

const [registry, schema] = await Promise.all([
  readFile(new URL("../data/public-source-intake-registry-0.6.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../schemas/public-source-intake-registry-0.6.schema.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("validates the multi-source public metadata intake registry", async () => {
  const validate = createResearchMvpValidator(schema);
  assert.equal(validate(registry), true, formatSchemaErrors(validate.errors).join("\n"));
  const report = await validatePublicSourceIntakeRegistry06();
  assert.equal(report.intakeCount, 3);
});

test("does not allow an intake to acquire data, authorize hosting, or grant registration", () => {
  const invalid = structuredClone(registry);
  invalid.records[1].acquisition.bundledAssetCount = 1;
  invalid.records[1].rights.publicHostingAuthorized = true;
  invalid.records[1].coordinates.projectRegistrationCount = 1;
  const validate = createResearchMvpValidator(schema);
  assert.equal(validate(invalid), false);
  assert.match(formatSchemaErrors(validate.errors).join("\n"), /bundledAssetCount|publicHostingAuthorized|projectRegistrationCount/);
});

test("retains Cano-Gomez preprint and author-space limitations", () => {
  const cano = registry.records.find((record) => record.sourceId === "PDS-CANOGOMEZ-2026");
  assert.equal(cano.studyStatus, "preprint_resource");
  assert.equal(cano.coordinates.sourceCoordinateAuthority, "AUTHOR_SPACE_OBS");
  assert.equal(cano.coordinates.projectRegistrationStatus, "not_proposed");
  assert.equal(cano.acquisition.fileHashes.length, 0);
});

test("pins one Tabulae public object header without admitting its file", () => {
  const tabulae = registry.records.find((record) => record.sourceId === "PDS-TABULAE-PARALYTICA");
  assert.equal(tabulae.auditScope, "public_object_header_metadata_only_no_candidate_file_acquired");
  assert.equal(tabulae.acquisition.status, "not_downloaded");
  assert.equal(tabulae.objectInventory.status, "one_public_object_header_observed_checksum_and_asset_rights_unresolved");
  assert.deepEqual(tabulae.objectInventory.objects[0], {
    id: "GEO-GSE234774-RNASEQ-META",
    stableName: "GSE234774_rnaseq_meta.txt.gz",
    sourceUrl: "https://ftp.ncbi.nlm.nih.gov/geo/series/GSE234nnn/GSE234774/suppl/GSE234774_rnaseq_meta.txt.gz",
    bytes: 10427632,
    contentType: "application/x-gzip",
    lastModified: "2023-09-29T21:48:10Z",
    sourceChecksum: null,
    localSha256: null,
    coordinateMetadata: "not_file_verified",
    assetRightsDecision: "unresolved_not_admitted",
  });
});

test("standalone public-source intake registry validator passes", () => {
  const result = spawnSync(process.execPath, [new URL("../scripts/validate-public-source-intake-registry-0.6.mjs", import.meta.url).pathname], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /3 metadata-only public intakes; 1 object header inventory; 0 downloaded files; 0 registrations/);
});
