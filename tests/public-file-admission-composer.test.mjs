import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validatePublicFileAdmissionComposer } from "../scripts/validate-public-file-admission-composer-0.1.mjs";

const [composer, component] = await Promise.all([
  readFile(new URL("../data/public-file-admission-composer-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/PublicFileAdmissionManifestComposer.tsx", import.meta.url), "utf8"),
]);

test("locks the two schema-shaped public metadata manifest formats", async () => {
  const report = await validatePublicFileAdmissionComposer(composer);
  assert.equal(report.formatCount, 2);
  assert.deepEqual(report.sourceIds, ["PDS-SPINALJ-PROCESSED", "PDS-CANOGOMEZ-2026"]);
  assert.equal(composer.localRuntime.automaticRemoteAcquisition, false);
  assert.equal(composer.localRuntime.sourceFileUpload, false);
  assert.equal(composer.localRuntime.persistentStorage, "none");
  assert.equal(composer.localRuntime.localHashCalculation, false);
});

test("rejects a composer contract that quietly permits acquisition or registration", async () => {
  const altered = structuredClone(composer);
  altered.localRuntime.automaticRemoteAcquisition = true;
  await assert.rejects(() => validatePublicFileAdmissionComposer(altered), /must not acquire/);
});

test("exposes only local metadata entry and browser JSON export in the UI", () => {
  assert.match(component, /buildSpinaljAdmissionManifest/);
  assert.match(component, /buildCanoAdmissionManifest/);
  assert.match(component, /metadata_only_not_downloaded_not_registered/);
  assert.match(component, /local SHA-256/i);
  assert.match(component, /Export file-admission manifest/);
  assert.doesNotMatch(component, /\bfetch\s*\(/);
  assert.doesNotMatch(component, /localStorage|sessionStorage|<input[^>]+type=["']file/i);
});
