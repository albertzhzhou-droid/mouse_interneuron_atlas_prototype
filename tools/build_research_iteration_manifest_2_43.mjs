#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeManifestContentSha256 } from '../scripts/build-release-manifest.mjs';
import { validateResearchIterationManifest242Snapshot, SNAPSHOT_242 } from '../scripts/validate-research-iteration-manifest-2.42-snapshot.mjs';
import { validateCanonicalResearchUpgradeRegistry } from '../scripts/validate-research-model-upgrade-registry-0.1.mjs';
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from '../scripts/validate-research-source-registry-0.1.mjs';

import { validateResearchSourceExtensions243 } from '../scripts/validate-research-source-extensions-2.43.mjs';
import { validateCanoGlutActiveIdentPackage } from '../scripts/validate-cano-gomez-glut-active-ident-0.1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MANIFEST_243_PATH = path.join(ROOT, 'data/research-iteration-manifest-2.43.json');
export const INPUTS_243 = Object.freeze([
  ['sealedIteration242', 'data/research-iteration-manifest-2.42.json'],
  ['sealedIteration242Validator', 'scripts/validate-research-iteration-manifest-2.42-snapshot.mjs'],
  ['sealedIteration242Tests', 'tests/research-iteration-manifest-2.42-snapshot.test.mjs'],
  ['iteration243Builder', 'tools/build_research_iteration_manifest_2_43.mjs'],
  ['iteration243Validator', 'scripts/validate-research-iteration-manifest-2.43.mjs'],
  ['iteration243Tests', 'tests/research-iteration-manifest-2.43.test.mjs'],
  ['iteration243Timeline', 'docs/RESEARCH_TIMELINE_2026-09-22_ITERATION_2_43.md'],
]);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function buildResearchIterationManifest243() {
  const { manifest: parent } = await validateResearchIterationManifest242Snapshot();
  const upgrades = await validateCanonicalResearchUpgradeRegistry();
  const registry = await loadResearchSourceRegistry();
  const sources = summarizeResearchSourceRegistry(registry);
  const sourceExtensions = await validateResearchSourceExtensions243(registry);
  await validateCanoGlutActiveIdentPackage();
  const manifest = structuredClone(parent);
  const inputs = [...parent.authoritativeInputs, ...INPUTS_243.map(([id, inputPath]) => ({id, scope: 'project', path: inputPath, purpose: 'Iteration 2.43 source, implementation or verification input'}))];
  if (new Set(inputs.map(i=>i.id)).size !== inputs.length || new Set(inputs.map(i=>`${i.scope}:${i.path}`)).size !== inputs.length) throw new Error('Duplicate 2.43 input identity');
  manifest.authoritativeInputs = await Promise.all(inputs.map(async input => {
    const locator = parent.inputRoots[input.scope]?.locator;
    if (!locator || path.isAbsolute(input.path) || input.path.split('/').includes('..')) throw new Error(`Invalid scoped input: ${input.id}`);
    const bytes = await readFile(path.resolve(ROOT, locator, input.path));
    return {...input, bytes: bytes.byteLength, sha256: hash(bytes)};
  }));
  const byId = new Map(manifest.authoritativeInputs.map(input=>[input.id,input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT,'package.json')));
  if (pkg.version !== '2.43.0-research.1') throw new Error('2.43 application version mismatch');
  manifest.manifestSchemaVersion = '2.43.0';
  manifest.releaseId = 'ohri-mouse-interneuron-research-iteration-2.43.0';
  manifest.releaseDate = '2026-09-22';
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = { path: SNAPSHOT_242.path, releaseId: parent.releaseId, bytes: SNAPSHOT_242.bytes, fileSha256: SNAPSHOT_242.fileSha256, contentSha256: SNAPSHOT_242.contentSha256 };
  manifest.integrity.inputCount = inputs.length;
  manifest.baseResearchRelease.note = 'Iteration 2.43 continues the sealed 2.42 working tree in place. Native source tracing, distinct source-slot labels and type-information presentation retain independent identities. Parent scientific references describe their named historical increments; current 2.43 receipts and boundaries are explicit. No full-project copy or invented cell interior is created.';
  manifest.registrySummary = {...manifest.registrySummary, canonicalSourcePackageCount:sources.sourceCount, canonicalRecordSetCount:sources.recordSetCount, bundledExactRosterCount:sources.bundledExactRosterCount, bundledExactObjectSetCount:sources.bundledExactSourceObjectSetCount, researchUpgradeCount:upgrades.upgradeCount, sourceRegistryReceipt:byId.get('researchSourceRegistry'), upgradeRegistryReceipt:byId.get('researchModelUpgradeRegistry')};
  manifest.exactReferences.sourceDetailAndLabels243 = { previousSealedIteration:'2.42', ...sourceExtensions, researchQueueLastId:upgrades.lastIncludedId, generatedIntracellularObjectCount:0, registrationCount:0, globalIdentityJoinCount:0 };
  manifest.scientificBoundaries.sourceDetailAndLabels243 = 'Native DAT contour traces remain in their source coordinate frames, with raw closure flags explicit. Source-slot labels describe assignments only and do not expand confirmed-interneuron profiles, fabricate missing metadata columns, link assays to morphology, or create cell interiors. Historical named reference counts remain scoped to their recorded increments.';
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return {manifest, bytes:Buffer.from(JSON.stringify(manifest,null,2)+'\n')};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2); if (args.length!==1 || !['--write','--check'].includes(args[0])) throw new Error('Use --write or --check');
    const built=await buildResearchIterationManifest243();
    if(args[0]==='--write') await writeFile(MANIFEST_243_PATH,built.bytes);
    else if(!(await readFile(MANIFEST_243_PATH)).equals(built.bytes)) throw new Error('2.43 manifest is stale');
    console.log(JSON.stringify({releaseId:built.manifest.releaseId,inputCount:built.manifest.integrity.inputCount,manifestContentSha256:built.manifest.manifestContentSha256}));
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
