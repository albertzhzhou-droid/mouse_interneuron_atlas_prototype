#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeManifestContentSha256 } from './build-release-manifest.mjs';

export const SNAPSHOT_242 = Object.freeze({
  path: 'data/research-iteration-manifest-2.42.json',
  bytes: 258137,
  fileSha256: 'c97fbe2ba279a6f97cc57ddf627c73218f712bddd22ae28e2383b65183b2c530',
  contentSha256: 'ec6045dfe9ed94a2031d1f630bbdba5fdc48baa620c428a4b388c7ddc18a4b7b',
});
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function validateResearchIterationManifest242Snapshot(override = null) {
  const bytes = await readFile(path.join(ROOT, SNAPSHOT_242.path));
  const manifest = override ?? JSON.parse(bytes);
  if (bytes.byteLength !== SNAPSHOT_242.bytes || createHash('sha256').update(bytes).digest('hex') !== SNAPSHOT_242.fileSha256) throw new Error('Immutable 2.42 file receipt changed');
  if (manifest.manifestContentSha256 !== SNAPSHOT_242.contentSha256 || computeManifestContentSha256(manifest) !== SNAPSHOT_242.contentSha256) throw new Error('Immutable 2.42 content receipt changed');
  if (manifest.application.version !== '2.42.0-research.1' || manifest.integrity.inputCount !== 264 || manifest.authoritativeInputs.length !== 264) throw new Error('Immutable 2.42 identity or input count changed');
  const parentBytes = await readFile(path.join(ROOT, manifest.parentIterationManifest.path));
  if (createHash('sha256').update(parentBytes).digest('hex') !== manifest.parentIterationManifest.fileSha256) throw new Error('Immutable 2.42 parent file changed');
  return { releaseId: manifest.releaseId, inputCount: 264, manifest };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest242Snapshot().then(({ releaseId, inputCount }) => console.log(JSON.stringify({ releaseId, inputCount }))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
