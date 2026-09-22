import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateTabulaeSpatialLocalSession } from "../scripts/validate-tabulae-spatial-local-session-0.1.mjs";

const session = await readFile(new URL("../data/tabulae-spatial-local-session-0.1.json", import.meta.url), "utf8").then(JSON.parse);

test("validates the 24-sample Tabulae local spatial-session contract", async () => {
  const report = await validateTabulaeSpatialLocalSession(session);
  assert.equal(report.releaseId, "ohri-tabulae-paralytica-spatial-local-session-0.1.0");
  assert.equal(report.sampleCount, 24);
  assert.equal(report.archiveBytes, 135208960);
  assert.equal(session.archive.sourceChecksum, null);
  assert.equal(session.archive.assetRightsDecision, "unresolved_not_bundled");
  assert.equal(session.localImport.automaticRemoteAcquisition, false);
  assert.equal(session.localImport.upload, false);
  assert.equal(session.localImport.persistence, "none");
});

test("rejects an invented source checksum or non-local acquisition", async () => {
  const checksum = structuredClone(session);
  checksum.archive.sourceChecksum = "a".repeat(64);
  await assert.rejects(() => validateTabulaeSpatialLocalSession(checksum), /source checksum/);
  const remote = structuredClone(session);
  remote.localImport.automaticRemoteAcquisition = true;
  await assert.rejects(() => validateTabulaeSpatialLocalSession(remote), /remote acquisition/);
});

test("implements local gzip parsing and receipt export without a remote fetch", async () => {
  const viewer = await readFile(new URL("../app/TabulaeSpatialLocalViewer.tsx", import.meta.url), "utf8");
  assert.match(viewer, /function parseVisiumPositions\(value: string\)/);
  assert.match(viewer, /function parseScaleFactors\(value: string\)/);
  assert.match(viewer, /new DecompressionStream\("gzip"\)/);
  assert.match(viewer, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(viewer, /Open public GEO archive/);
  assert.match(viewer, /not individual interneurons/);
  assert.match(viewer, /projectRegistrationCount: 0/);
  assert.doesNotMatch(viewer, /\bfetch\s*\(/);
});
