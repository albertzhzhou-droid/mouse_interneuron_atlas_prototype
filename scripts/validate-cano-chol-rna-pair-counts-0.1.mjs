import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCanoCholRnaCounts } from './validate-cano-chol-rna-counts-0.1.mjs';
import { loadCanoCholRnaPair, canoCholRnaPairReceipt, canoCholRnaPairCsv } from '../app/cano-chol-rna-counts.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function validateCanoCholRnaPairCounts({ root = ROOT } = {}) {
  const prior = await validateCanoCholRnaCounts({ root });
  const doc = JSON.parse(await readFile(path.join(root, 'data/cano-chol-rna-counts-0.1.json'), 'utf8'));
  const original = path.join(root, doc.reproduction.sourcePath);
  assert.equal((await stat(original)).size, doc.source.bytes);
  const digest = createHash('sha256'); for await (const block of createReadStream(original)) digest.update(block);
  assert.equal(digest.digest('hex'), doc.source.sha256, 'retained original RDS bytes changed');
  const fetchImpl = async (url, options) => {
    assert.equal(options.cache, 'no-store');
    const receipt = doc.chunks.find(chunk => chunk.url === url); assert.ok(receipt);
    return new Response(await readFile(path.join(root, receipt.path)));
  };
  const pairs = [];
  for (const [firstFeature, secondFeature] of [['Chat', 'Pitx2'], ['Pitx2', 'Skor2'], [doc.genes[0], doc.genes[1]]]) {
    const pair = await loadCanoCholRnaPair(doc, firstFeature, secondFeature, { fetchImpl, decompressImpl: async bytes => new Uint8Array(gunzipSync(bytes)) });
    let exportedRows = 0;
    for (const profile of doc.profiles) {
      const receipt = canoCholRnaPairReceipt(doc, pair, profile.id);
      assert.equal(receipt.currentProfile.nucleusCount, profile.nucleusCount);
      assert.equal(receipt.currentProfile.bothPositive + receipt.currentProfile.firstOnly + receipt.currentProfile.secondOnly + receipt.currentProfile.neitherPositive, profile.nucleusCount);
      assert.equal(canoCholRnaPairCsv(doc, pair, profile.id).trimEnd().split('\n').length, profile.nucleusCount + 1);
      assert.equal(receipt.interpretation.markerClassification, false); assert.equal(receipt.interpretation.registrations, 0);
      exportedRows += profile.nucleusCount;
    }
    assert.equal(exportedRows, 923); assert.ok(pair.verification.requestCount <= 2);
    const facts = canoCholRnaPairReceipt(doc, pair, doc.profiles[0].id);
    pairs.push({ firstFeature, secondFeature, verifiedChunks: pair.verification.requestCount, exportedRows, profiles: facts.profiles });
  }
  return { originalRdsSha256Verified: doc.source.sha256, originalRdsBytes: doc.source.bytes,
    sourceLayer: doc.source.matrixLocator, priorCompleteDerivativeReplay: prior,
    validatedPairs: pairs, newSourceProfiles: 0, newNucleusRosterRows: 0, geometryObjectsAdded: 0,
    registrations: 0, actualBrowserObserved: false };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await validateCanoCholRnaPairCounts()));
}
