import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gunzipSync, gzipSync } from "node:zlib";
import test from "node:test";
import { sha256, validateCanoGlutActiveIdent } from "../scripts/validate-cano-gomez-glut-active-ident-0.1.mjs";

const ROOT = new URL("../", import.meta.url);
const adapter = JSON.parse(await readFile(new URL("data/cano-gomez-glut-active-ident-labels-0.1.json", ROOT), "utf8"));
const sourceRoster = await readFile(new URL(adapter.artifact.path, ROOT));

function mutatedRoster(change) {
  const document = structuredClone(adapter);
  const lines = gunzipSync(sourceRoster).toString("utf8").trimEnd().split("\n");
  change(lines);
  const plain = Buffer.from(`${lines.join("\n")}\n`);
  const compressed = gzipSync(plain, { level: 9 });
  Object.assign(document.artifact, {
    compressedBytes: compressed.length,
    compressedSha256: sha256(compressed),
    uncompressedBytes: plain.length,
    uncompressedSha256: sha256(plain),
  });
  return { document, compressed };
}

test("real GLUT adapter reconciles every raw slot label, group, context, name and source-absent field", async () => {
  assert.deepEqual(await validateCanoGlutActiveIdent(adapter), {
    adapterId: "cano-gomez-p56-glut-active-ident-0.1.0", labels: 277, nuclei: 92782,
    sourceGroups: 28, confirmedInterneuronProfilesAdded: 0, metadataNeuronTypesMissing: 92782,
    artifactsVerified: 1,
  });
  assert.equal(adapter.labels.reduce((total, label) => total + label.nucleusCount, 0), 92782);
  assert.equal(adapter.contextCounts.Sex.find((entry) => entry.value === "Unassigned").count, 3958);
});

test("source checksum, named-order proof, missingness and interneuron-admission promotion fail closed", async () => {
  for (const mutate of [
    (document) => { document.source.sha256 = "0".repeat(64); },
    (document) => { document.identity.metadataNameOrderExactlyVerified = false; },
    (document) => { document.metadataNeuronTypes.sourceColumnPresent = true; },
    (document) => { document.metadataNeuronTypes.substitutionApplied = true; },
    (document) => { document.denominators.confirmedInterneuronProfilesAdded = 277; },
    (document) => { document.boundaries.crossAssayCellIdentity = true; },
  ]) {
    const document = structuredClone(adapter);
    mutate(document);
    await assert.rejects(() => validateCanoGlutActiveIdent(document), /schema failed/);
  }
});

test("reordered nucleus mappings fail even after both artifact hashes are recalculated", async () => {
  const { document, compressed } = mutatedRoster((lines) => { [lines[0], lines[1]] = [lines[1], lines[0]]; });
  await assert.rejects(() => validateCanoGlutActiveIdent(document, { rosterBytes: compressed }), /source name\/order differs/);
});

test("active.ident cannot silently fill absent metadata neuron_types", async () => {
  const { document, compressed } = mutatedRoster((lines) => {
    const row = JSON.parse(lines[0]); row.metadata_neuron_types = row.source_active_ident; lines[0] = JSON.stringify(row);
  });
  await assert.rejects(() => validateCanoGlutActiveIdent(document, { rosterBytes: compressed }), /absent metadata neuron_types was substituted/);
});

test("context edits and aggregate drift fail independently of transport checksums", async () => {
  const { document, compressed } = mutatedRoster((lines) => {
    const row = JSON.parse(lines[0]); row.Sex = "inferred"; lines[0] = JSON.stringify(row);
  });
  await assert.rejects(() => validateCanoGlutActiveIdent(document, { rosterBytes: compressed }), /source groups\/context differ/);
  const changedCount = structuredClone(adapter); changedCount.labels[0].nucleusCount += 1;
  await assert.rejects(() => validateCanoGlutActiveIdent(changedCount), /label counts\/groups\/context\/exact-key receipts differ/);
});

test("raw label normalization is detected against the ordered exact-label receipt", async () => {
  const { document, compressed } = mutatedRoster((lines) => {
    const row = JSON.parse(lines[0]); row.source_active_ident += " ";
    row.source_label_id = `cano.glut.active-ident.sha256.${sha256(row.source_active_ident).slice(0, 24)}`;
    lines[0] = JSON.stringify(row);
  });
  await assert.rejects(() => validateCanoGlutActiveIdent(document, { rosterBytes: compressed }), /unique source names\/labels changed|ordered source-label hash changed/);
});
