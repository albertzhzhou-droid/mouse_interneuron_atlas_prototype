import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import manifest from '../data/research-iteration-manifest-2.91.json' with { type: 'json' };
import runtime from '../data/research-renderer-runtime-inputs-2.91.json' with { type: 'json' };
import { buildRendererRuntimeInputs, validateRendererRuntimeInputs, RUNTIME_RENDERER_INPUT_PATHS } from '../tools/build_research_renderer_runtime_inputs.mjs';
import { MAIN_SCENE_SOURCE_VIEW_BUILD } from '../app/main-scene-source-view.js';
import { NATIVE_CONTOUR_VIEW_BUILD } from '../app/native-contour-source-view.js';
import { MORPHOLOGY_SOURCE_VIEW_RENDERER_BUILD } from '../app/morphology-source-view.js';
import { JANELIA_WT_SOURCE_VIEW_BUILD } from '../app/janelia-wt-source-view.js';
import { COMPARATIVE_SWC_VIEW_BUILD } from '../app/comparative-swc-view-replay.js';
import { INDEPENDENT_OBJECT_VIEW_BUILD } from '../app/independent-source-object-view.js';
import { NATIVE_CONTOUR_DIAGNOSTIC_BUILD } from '../app/native-contour-diagnostics.js';
import { RONZANO_SOURCE_VIEW_BUILD } from '../app/ronzano-premotor-position-source-view.js';
import ronzanoReference from '../data/ronzano-premotor-position-reference-0.1.json' with { type: 'json' };
import { MAIN_SCENE_AUXILIARY_PATHS, mainSceneAuxiliaryExpected } from '../app/main-scene-auxiliary-verification.js';

const builds = [MAIN_SCENE_SOURCE_VIEW_BUILD, NATIVE_CONTOUR_VIEW_BUILD, MORPHOLOGY_SOURCE_VIEW_RENDERER_BUILD,
  JANELIA_WT_SOURCE_VIEW_BUILD, COMPARATIVE_SWC_VIEW_BUILD, INDEPENDENT_OBJECT_VIEW_BUILD, NATIVE_CONTOUR_DIAGNOSTIC_BUILD, RONZANO_SOURCE_VIEW_BUILD];
const ronzanoSourcePaths = ['public' + ronzanoReference.derivedAsset.browserUrl,
  ...ronzanoReference.sourceFiles.map(file => 'public' + file.browserUrl)];
const canonical = new Map(manifest.authoritativeInputs.map(row => [row.path, row]));
test('compact transport covers every actual renderer dependency and auxiliary source with exact canonical pins', async () => {
  validateRendererRuntimeInputs(runtime, manifest.authoritativeInputs);
  const expected = [...new Set([...builds.flatMap(build => build.inputs.map(row => row.path)), ...MAIN_SCENE_AUXILIARY_PATHS.map(path => 'public' + path), ...ronzanoSourcePaths])].sort();
  assert.deepEqual(RUNTIME_RENDERER_INPUT_PATHS, expected);
  for (const build of builds) for (const row of build.inputs) {
    assert.deepEqual(row, canonical.get(row.path));
    const bytes = await readFile(new URL('../' + row.path, import.meta.url));
    assert.equal(bytes.length, row.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), row.sha256);
  }
  for (const path of MAIN_SCENE_AUXILIARY_PATHS) {
    const row = mainSceneAuxiliaryExpected(path), pin = canonical.get('public' + path);
    assert.deepEqual(row, { path, bytes: pin.bytes, sha256: pin.sha256 });
  }
  assert.equal(RONZANO_SOURCE_VIEW_BUILD.inputs.length, 40);
  assert.equal(ronzanoSourcePaths.length, 23);
  for (const path of ronzanoSourcePaths) {
    const pin = canonical.get(path), bytes = await readFile(new URL('../' + path, import.meta.url));
    assert.ok(pin, path);
    assert.equal(bytes.length, pin.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), pin.sha256);
  }
  assert.ok(runtime.authoritativeInputs.length < manifest.authoritativeInputs.length / 10);
});
test('missing duplicated invalid or altered pins cannot masquerade as canonical runtime inputs', () => {
  const path = RUNTIME_RENDERER_INPUT_PATHS[0];
  const inputs = manifest.authoritativeInputs;
  assert.throws(() => buildRendererRuntimeInputs(inputs.filter(row => row.path !== path)), /missing or duplicated/);
  assert.throws(() => buildRendererRuntimeInputs([...inputs, canonical.get(path)]), /missing or duplicated/);
  for (const change of [row => row.bytes = -1, row => row.sha256 = 'unknown']) {
    const bad = structuredClone(inputs); change(bad.find(row => row.path === path));
    assert.throws(() => buildRendererRuntimeInputs(bad), /invalid/);
  }
  for (const change of [copy => copy.authoritativeInputs.pop(), copy => copy.authoritativeInputs[0].sha256 = '0'.repeat(64), copy => copy.scope = 'all_scientific_sources_verified']) {
    const bad = structuredClone(runtime); change(bad);
    assert.throws(() => validateRendererRuntimeInputs(bad, inputs), /differs/);
  }
});
test('browser source-view modules no longer statically import the full audit manifest', async () => {
  for (const name of ['main-scene-source-view.js','native-contour-source-view.js','morphology-source-view.js','janelia-wt-source-view.js','comparative-swc-view-replay.js','independent-source-object-view.js','main-scene-auxiliary-verification.js','ronzano-premotor-position-source-view.js']) {
    const source = await readFile(new URL('../app/' + name, import.meta.url), 'utf8');
    assert.ok(source.includes('../data/research-renderer-runtime-inputs-2.91.json'));
    assert.equal(source.includes('../data/research-iteration-manifest-2.91.json'), false);
  }
});
