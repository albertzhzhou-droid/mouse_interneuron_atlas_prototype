import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { SOURCE_PINS, verifyOriginalGzip, validateFaultFixture, writePrivateFileAtomic } from './proxy.mjs';

const root = '/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype';
const directory = '/private/tmp/ohri-i60-index-native-proxy';
assert.equal(process.argv.length, 2, 'This preparer accepts no path/source override');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const originalGzip = fs.readFileSync(path.join(root, SOURCE_PINS.gzip.path));
const originalDecoded = verifyOriginalGzip(originalGzip);
const canonical = fs.readFileSync(path.join(root, SOURCE_PINS.decoded.path));
assert.ok(canonical.equals(originalDecoded), 'Original JSON and original gzip decode must be identical');
const faultDecoded = Buffer.from(originalDecoded); faultDecoded[faultDecoded.length - 1] = 32;
const faultBody = gzipSync(faultDecoded, { level: 9 });
const proof = validateFaultFixture(faultBody, originalGzip);
const sourceFiles = [SOURCE_PINS.gzip.path, SOURCE_PINS.decoded.path,
  'app/api/source-records/search-index.json/route.ts', 'app/research-explorer-index.js',
  'data/research-explorer-transport-0.1.json', 'public/data/research_explorer_index_v1/asset-manifest.json'];
const sourcePins = sourceFiles.map(relative => { const bytes = fs.readFileSync(path.join(root, relative)); return { path: relative, bytes: bytes.length, sha256: sha(bytes) }; });
function writePrivate(name, bytes) {
  writePrivateFileAtomic(path.join(directory, name), Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes));
}
writePrivate('decoded-checksum-fault.json.gz', faultBody);
writePrivate('decoded-checksum-fault.json', faultDecoded);
const receipt = { status: 'OFFLINE_FIXTURE_PREPARATION_ONLY', sourcePins, fixture: { path: `${directory}/decoded-checksum-fault.json.gz`, ...proof },
  plainFixture: { path: `${directory}/decoded-checksum-fault.json`, bytes: faultDecoded.length, sha256: sha(faultDecoded), mutation: proof.mutation },
  scope: 'Only a temp gzip fixture was produced. No source JSON/index/metadata edit; no server/socket/browser request or actual failure observation.',
  loaderReason: 'The API uses Content-Encoding:gzip. fetch arrayBuffer exposes decoded bytes. The loader compares decoded byte count then SHA against the canonical manifest before JSON parse/selection.' };
writePrivate('fixture-preparation-receipt.json', JSON.stringify(receipt, null, 2) + '\n');
process.stdout.write(JSON.stringify({ status: receipt.status, controlledBodyBytes: faultBody.length, controlledBodySha256: sha(faultBody), controlledDecodedSha256: proof.controlledDecodedSha256 }) + '\n');
