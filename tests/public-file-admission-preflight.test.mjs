import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validatePublicFileAdmissionPreflight } from "../scripts/validate-public-file-admission-preflight.mjs";

const preflight = await readFile(new URL("../data/file-admission-preflight-0.6.json", import.meta.url), "utf8").then(JSON.parse);

test("locks the zero-file, no-download public file-admission preflight", async () => {
  const report = await validatePublicFileAdmissionPreflight(preflight);
  assert.equal(report.candidateFilesAccepted, 0);
  assert.equal(preflight.automaticDownload, false);
  assert.equal(preflight.credentialStorage, false);
});

test("rejects any preflight that quietly accepts an unverified file", async () => {
  const altered = structuredClone(preflight);
  altered.candidateFilesAccepted = 1;
  await assert.rejects(() => validatePublicFileAdmissionPreflight(altered), /candidateFilesAccepted/);
});
