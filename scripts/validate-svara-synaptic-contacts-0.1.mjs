import assert from "node:assert/strict";
import { open } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { SVARA_CONTACTS, verifySvaraContacts, svaraVerifiedContactData, svaraContactPair } from "../app/svara-synaptic-contacts.js";

const root = new URL("../", import.meta.url);
const hash = (bytes, algorithm = "sha256") => createHash(algorithm).update(bytes).digest("hex");
// Exact-size positional reads avoid environment-specific implicit EOF stalls.
async function read(path) {
  const file = await open(path, "r");
  try {
    const info = await file.stat(), bytes = Buffer.alloc(info.size); let at = 0;
    while (at < bytes.length) { const result = await file.read(bytes, at, Math.min(4096, bytes.length - at), at); assert.ok(result.bytesRead); at += result.bytesRead; }
    assert.equal((await file.stat()).size, bytes.length); return bytes;
  } finally { await file.close(); }
}
export async function validateSvaraSynapticContacts(doc = SVARA_CONTACTS) {
  assert.deepEqual(doc, SVARA_CONTACTS, "Canonical source document changed");
  assert.equal(doc.sourceId, "DOI:10.1016/j.celrep.2018.05.023"); assert.equal(doc.releaseId, "MPG:item_3055210:7");
  assert.deepEqual(doc.groups.map(x => x.id), ["CiD", "CoBL"]);
  assert.equal(doc.rights.freidokWrapperCovered, false); assert.equal(doc.rights.kohAnnotationVersionCovered, false);
  for (const field of ["coordinatesAvailable", "editableGeometry", "physicalCellMappingEstablished", "functionalTransmissionEstablished", "sameKohAnnotationVersionEstablished"]) assert.equal(doc.representation[field], false);
  assert.equal(doc.biologicalContext.geneticV2aAssignment, false); assert.equal(doc.biologicalContext.mouseIdentityTransfer, false);
  assert.equal(doc.interpretation.matrixUnitExplicitInWorkbook, false); assert.equal(doc.interpretation.contactAreaUnit, "µm²");
  let matrixCells = 0, contactRows = 0, distinctPairs = 0, originals = 0;
  for (const group of doc.groups) {
    assert.equal(doc.interpretation.unitLocator[group.id], `${group.contactsSource.componentId} / ${group.contactsSource.sheet}!C1: Synaptic Contact Area [µm²]`);
    const bytes = await read(new URL("public" + group.asset.url, root));
    assert.equal(bytes.length, group.asset.bytes); assert.equal(hash(bytes), group.asset.sha256);
    const proof = await verifySvaraContacts(bytes, group.id), data = svaraVerifiedContactData(proof, group.id);
    assert.deepEqual(data.summary, group.summary); assert.equal(data.schemaVersion, doc.schemaVersion);
    assert.deepEqual(data.matrix.pre, group.pre); assert.deepEqual(data.matrix.post, group.post);
    assert.equal(new Set(group.pre).size, group.pre.length); assert.equal(new Set(group.post).size, 68);
    for (const [field, source] of [["matrix", group.matrixSource], ["contacts", group.contactsSource]]) {
      for (const [key, value] of Object.entries(source)) assert.deepEqual(data[field][key], value);
      const receipt = JSON.parse(await read(new URL(`data/source-candidates/svara-contacts-20261002/${source.name}.receipt.json`, root)));
      assert.equal(receipt.sha256, source.sha256); assert.equal(receipt.md5, source.md5); assert.equal(receipt.bytes, source.bytes);
      assert.equal(receipt.status, 200); assert.equal(receipt.componentId, source.componentId);
      const original = new URL(`data/source-candidates/svara-contacts-20261002/${source.name}`, root);
      if (existsSync(original)) {
        const native = await read(original); assert.equal(native.length, source.bytes); assert.equal(hash(native), source.sha256); assert.equal(hash(native, "md5"), source.md5); originals++;
      }
    }
    assert.deepEqual(data.contacts.headers, ["Presynaptic Cell", "Postsynaptic Cell", "Synaptic Contact Area [µm²]"]);
    assert.equal(data.contacts.rows.length, group.summary.contactRows);
    for (let i = 0; i < data.contacts.rows.length; i++) {
      const row = data.contacts.rows[i]; assert.equal(row.sourceRow, i + 2);
      assert.ok(group.pre.includes(row.pre) && group.post.includes(row.post));
      assert.match(row.areaText, /^\d+(?:\.\d+)?(?:E[+-]?\d+)?$/i); assert.ok(Number(row.areaText) > 0);
    }
    let zeros = 0, positives = 0, maxError = 0;
    for (const pre of group.pre) for (const post of group.post) {
      const pair = svaraContactPair(proof, { group: group.id, pre, post });
      assert.match(pair.matrixSourceText, /^\d+(?:\.\d+)?(?:E[+-]?\d+)?$/i);
      assert.equal(Number(pair.matrixSourceText) === 0, pair.derivedContactCount === 0);
      maxError = Math.max(maxError, pair.matrixSumAbsoluteDifference);
      if (Number(pair.matrixSourceText) === 0) zeros++; else positives++;
      matrixCells++;
    }
    assert.equal(zeros, group.summary.literalZeros); assert.equal(positives, group.summary.distinctListedPairs);
    assert.ok(maxError <= Number(doc.interpretation.agreementTolerance));
    assert.equal(group.summary.missingMatrixCells, 0); assert.equal(group.summary.pairsCompared, group.pre.length * group.post.length);
    contactRows += data.contacts.rows.length; distinctPairs += positives;
  }
  assert.equal(matrixCells, 4964); assert.equal(contactRows, 734); assert.equal(distinctPairs, 516);
  return { matrixCells, contactRows, distinctListedPairs: distinctPairs, retainedOriginalWorkbooksVerified: originals };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await validateSvaraSynapticContacts()));
