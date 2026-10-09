import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire, registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
const root = '/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype';
const candidate = '/private/tmp/ohri-i57-explorer-keyboard-candidate';
const out = '/private/tmp/ohri-i57-mounted-closure-review';
const deps = createRequire('/private/tmp/ohri-i51-lock-dependencies/qa-entry.cjs');
const ts = deps('typescript');
const cached = new Map();
function readPhysical(absolute, fresh = false) {
  if (!fresh && cached.has(absolute)) return cached.get(absolute);
  const fd = fs.openSync(absolute, 'r');
  const before = fs.fstatSync(fd, { bigint: true }), chunks = [], hash = createHash('sha256');
  let position = 0, calls = 0;
  try {
    for (;;) {
      const buffer = Buffer.alloc(4096), count = fs.readSync(fd, buffer, 0, buffer.length, position); calls++;
      if (!count) break;
      const chunk = buffer.subarray(0, count); chunks.push(chunk); hash.update(chunk); position += count;
    }
    const after = fs.fstatSync(fd, { bigint: true });
    assert.ok(before.ino === after.ino && before.size === after.size && before.mtimeNs === after.mtimeNs && BigInt(position) === after.size, `Epoch drift during 4K positioned read: ${absolute}`);
  } finally { fs.closeSync(fd); }
  const value = { absolute, bytes: position, sha256: hash.digest('hex'), readCalls: calls, text: () => Buffer.concat(chunks).toString('utf8') };
  if (!fresh) cached.set(absolute, value);
  return value;
}
const pin = value => ({ bytes: value.bytes, sha256: value.sha256 });
const ownership = JSON.parse(readPhysical(path.join(candidate, 'ownership.json')).text());
assert.deepEqual(pin(readPhysical(ownership.patch.path)), { bytes: ownership.patch.bytes, sha256: ownership.patch.sha256 }, 'Sealed candidate patch drift');
const targets = new Map(ownership.integrationTargets.map(item => [item.path, item]));
const actualRootTargetPins = [];
const targetStates = [];
for (const [relative, item] of targets) {
  assert.deepEqual(pin(readPhysical(path.join(candidate, 'proposed', relative))), item.after);
  if (item.before) assert.deepEqual(pin(readPhysical(path.join(candidate, 'qa/preimages', relative))), item.before, `Sealed I57 preimage changed: ${relative}`);
  const exists = fs.existsSync(path.join(root, relative));
  const current = exists ? pin(readPhysical(path.join(root, relative))) : null;
  const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const state = equals(current, item.after) ? 'sealed_after' : equals(current, item.before) ? 'sealed_before_or_absent' : 'unexpected';
  assert.notEqual(state, 'unexpected', `Current root is neither sealed I57 preimage nor after: ${relative}`);
  targetStates.push(state);
  actualRootTargetPins.push({ path: relative, state, pin: current });
}
assert.equal(new Set(targetStates).size, 1, 'Partial I57 intake epoch');
const rootIntegrationState = targetStates[0];
const physicalPath = (relative, overlay) => path.join(targets.has(relative) ? path.join(candidate, overlay ? 'proposed' : 'qa/preimages') : root, relative);
const read = (relative, overlay = false) => readPhysical(physicalPath(relative, overlay));
function ast(relative, overlay = false) {
  return ts.createSourceFile(relative, read(relative, overlay).text(), ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : relative.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
}
function literalArray(relative, binding) {
  let result;
  const source = ast(relative);
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === binding) {
      const init = node.initializer;
      const array = ts.isArrayLiteralExpression(init) ? init : ts.isCallExpression(init) ? init.arguments.find(ts.isArrayLiteralExpression) : null;
      if (array) result = array.elements.map(element => { assert.ok(ts.isStringLiteral(element), `Nonliteral member: ${relative}:${binding}`); return element.text; });
    }
    ts.forEachChild(node, visit);
  }
  visit(source); assert.ok(result, `Missing array ${relative}:${binding}`); return result;
}
function branchProof(pageId) {
  const source = ast('app/ResearchCollectionPage.tsx'), lazy = new Map(), cases = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(source) === 'lazy') {
      const imports = [];
      const findImport = child => { if (ts.isCallExpression(child) && child.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(child.arguments[0])) imports.push(child.arguments[0].text); ts.forEachChild(child, findImport); };
      findImport(node.initializer); assert.equal(imports.length, 1); lazy.set(node.name.text, imports[0]);
    }
    if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression) && node.expression.text === pageId) cases.push(node);
    ts.forEachChild(node, visit);
  }
  visit(source); assert.equal(cases.length, 1, `Unique pageId case missing: ${pageId}`);
  const components = [];
  const collect = node => { if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) { const name = node.tagName.getText(source); if (lazy.has(name)) components.push({ component: name, specifier: lazy.get(name), line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 }); } ts.forEachChild(node, collect); };
  collect(cases[0]); assert.equal(components.length, 1);
  return { pageId, branchLine: source.getLineAndCharacterOfPosition(cases[0].getStart(source)).line + 1, ...components[0] };
}
function graph(pageId, overlay) {
  const selected = branchProof(pageId);
  const roots = ['app/layout.tsx', pageId === 'explorer' ? 'app/research/[...section]/page.tsx' : 'app/explore/[...section]/page.tsx'];
  const visited = new Set(), edges = [], typeOnly = [], excludedLazy = [], externals = [], unresolvedDynamic = [];
  function resolve(from, specifier) {
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
    assert.ok(!base.startsWith('../') && !path.posix.isAbsolute(base), `Unsafe local import: ${from} -> ${specifier}`);
    for (const relative of [base, ...['.tsx', '.ts', '.js', '.mjs', '.json', '.css'].map(ext => base + ext), ...['tsx', 'ts', 'js'].map(ext => `${base}/index.${ext}`)]) if (fs.existsSync(physicalPath(relative, overlay))) return relative;
    throw new Error(`Unresolved local mounted edge: ${from} -> ${specifier}`);
  }
  function walk(relative) {
    if (visited.has(relative)) return; visited.add(relative);
    if (relative.endsWith('.json')) { read(relative, overlay); return; }
    if (relative.endsWith('.css')) {
      for (const match of read(relative, overlay).text().matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) {
        if (match[1].startsWith('.')) { const to = resolve(relative, match[1]); edges.push({ from: relative, to, kind: 'CSS_import' }); walk(to); }
        else externals.push({ from: relative, specifier: match[1], kind: 'CSS_external_import' });
      }
      return;
    }
    const source = ast(relative, overlay);
    const line = node => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    function edge(specifier, node, kind) {
      if (!specifier.startsWith('.')) { externals.push({ from: relative, specifier, line: line(node), kind }); return; }
      const to = resolve(relative, specifier); edges.push({ from: relative, to, line: line(node), kind }); walk(to);
    }
    function visit(node) {
      if (ts.isImportDeclaration(node)) {
        const clause = node.importClause, bindings = clause?.namedBindings;
        const named = bindings && ts.isNamedImports(bindings) ? bindings.elements : null;
        if (clause?.isTypeOnly || clause && !clause.name && named?.length && named.every(item => item.isTypeOnly)) typeOnly.push({ from: relative, specifier: node.moduleSpecifier.text, line: line(node), reason: 'explicit type-only import is erased from runtime module graph' });
        else edge(node.moduleSpecifier.text, node, clause ? 'value_import' : 'side_effect_import');
      } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        const named = node.exportClause && ts.isNamedExports(node.exportClause) ? node.exportClause.elements : null;
        if (node.isTypeOnly || named?.length && named.every(item => item.isTypeOnly)) typeOnly.push({ from: relative, specifier: node.moduleSpecifier.text, line: line(node), reason: 'explicit type-only reexport' });
        else edge(node.moduleSpecifier.text, node, 'value_reexport');
      } else if (ts.isImportEqualsDeclaration(node)) {
        if (node.isTypeOnly) typeOnly.push({ from: relative, line: line(node), reason: 'type-only import equals' });
        else if (ts.isExternalModuleReference(node.moduleReference) && ts.isStringLiteral(node.moduleReference.expression)) edge(node.moduleReference.expression.text, node, 'import_equals');
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        if (!ts.isStringLiteral(node.arguments[0])) unresolvedDynamic.push({ from: relative, line: line(node), expression: node.getText(source) });
        else {
          const specifier = node.arguments[0].text;
          if (relative === 'app/ResearchCollectionPage.tsx' && specifier !== selected.specifier) excludedLazy.push({ from: relative, specifier, line: line(node), reason: `alternate pageId is not mounted on ${pageId === 'explorer' ? '/research/explorer' : '/explore/positions'}` });
          else edge(specifier, node, relative === 'app/ResearchCollectionPage.tsx' ? 'actual_mounted_page_lazy_import' : 'literal_dynamic_import_in_reachable_module');
        }
      } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require' && ts.isStringLiteral(node.arguments[0])) edge(node.arguments[0].text, node, 'literal_require');
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  roots.forEach(walk);
  assert.equal(unresolvedDynamic.length, 0, 'Unresolved dynamic import prevents exact local closure claim');
  return { route: pageId === 'explorer' ? '/research/explorer' : '/explore/positions', overlay, roots, branch: selected, paths: [...visited].sort(), edges, typeOnly, excludedLazy, externals, unresolvedDynamic };
}
const explorerBefore = graph('explorer', false), explorerAfter = graph('explorer', true);
const positionsBefore = graph('positions', false), positionsAfter = graph('positions', true);
const normalizeEdges = graph => graph.edges.map(({ line, ...edge }) => edge);
const coreRecipe = literalArray('tools/build_research_iteration_manifest_2_91.mjs', 'CORE_INPUTS_291');
const runtimeRecipe = literalArray('tools/build_research_renderer_runtime_inputs.mjs', 'RUNTIME_RENDERER_INPUT_PATHS');
const declaredPositions = literalArray('app/ronzano-premotor-position-source-view.js', 'buildPaths');
const manifest = JSON.parse(read('data/research-iteration-manifest-2.91.json').text());
const compact = JSON.parse(read('data/research-renderer-runtime-inputs-2.91.json').text());
const canonicalPaths = new Set(manifest.authoritativeInputs.map(row => row.path));
const core = new Set(coreRecipe), compactPaths = compact.authoritativeInputs.map(row => row.path);
const newPaths = ownership.integrationTargets.filter(item => item.operation === 'add').map(item => item.path);
const reused = ['app/useSourceListRovingFocus.ts', 'app/source-list-roving-focus.js', 'app/source-list-roving-focus.d.ts', 'app/source-list-keyboard.css'];
const positionsMetadata = ['package.json', 'package-lock.json', 'app/ronzano-premotor-position-source-view.d.ts', 'public/data/research_explorer_index_v1/search-index.json', 'public/data/research_explorer_index_v1/asset-manifest.json'];
for (const relative of [...reused, ...positionsMetadata]) read(relative);
for (const expected of ownership.reusedInputsUntouched) assert.deepEqual(pin(read(expected.path)), { bytes: expected.bytes, sha256: expected.sha256 });
const derivePositions = graph => [...new Set([...graph.paths.filter(relative => relative !== 'data/research-renderer-runtime-inputs-2.91.json'), ...positionsMetadata])].sort();
const source = JSON.parse(read('data/ronzano-premotor-position-reference-0.1.json').text());
const ronzanoSources = ['public' + source.derivedAsset.browserUrl, ...source.sourceFiles.map(row => 'public' + row.browserUrl)];
assert.equal(runtimeRecipe.length, 198); assert.deepEqual(compactPaths, runtimeRecipe);
assert.deepEqual(positionsBefore.paths, positionsAfter.paths); assert.deepEqual(normalizeEdges(positionsBefore), normalizeEdges(positionsAfter));
assert.equal(derivePositions(positionsAfter).length, 40); assert.deepEqual(derivePositions(positionsAfter), declaredPositions);
assert.equal(ronzanoSources.length, 23);
const explorerNewEdges = normalizeEdges(explorerAfter).filter(edge => !normalizeEdges(explorerBefore).some(before => JSON.stringify(before) === JSON.stringify(edge)));
const explorerAdded = explorerAfter.paths.filter(relative => !explorerBefore.paths.includes(relative));
assert.deepEqual(explorerAdded, ['app/ResearchExplorerResultGroup.tsx', 'app/source-list-keyboard.css', 'app/source-list-roving-focus.js', 'app/useSourceListRovingFocus.ts']);
assert.equal(explorerAfter.typeOnly.some(edge => edge.from === 'app/ResearchExplorerResultGroup.tsx' && edge.specifier === './ResearchExplorer'), true);
for (const path of reused) assert.ok(canonicalPaths.has(path) && runtimeRecipe.includes(path), `Reused I26 input already pinned in both inventories: ${path}`);
for (const path of newPaths) assert.ok(manifest.authoritativeInputs.filter(row => row.path === path).length <= 1);
assert.ok(canonicalPaths.has('app/ResearchExplorer.tsx'));
// Independently compute the existing compact contract union. These are only
// read-only build constants; no private proof producer/render/restore is called.
const threeCjs = deps.resolve('three');
const threeEsm = threeCjs.replace(/three\.cjs$/, 'three.module.js');
assert.ok(threeCjs !== threeEsm && fs.existsSync(threeEsm));
const externalModules = new Map([
  ['three', pathToFileURL(threeEsm).href],
  ['three/examples/jsm/controls/OrbitControls.js', pathToFileURL(deps.resolve('three/examples/jsm/controls/OrbitControls.js')).href],
]);
registerHooks({ resolve(specifier, context, nextResolve) {
  if (externalModules.has(specifier)) return { url: externalModules.get(specifier), shortCircuit: true };
  assert.ok(specifier !== 'three' && !specifier.startsWith('three/'), `Unexpected dependency must be resolved before registering hooks: ${specifier}`);
  return nextResolve(specifier, context);
} });
const builds = [
  ['app/main-scene-source-view.js', 'MAIN_SCENE_SOURCE_VIEW_BUILD'],
  ['app/native-contour-source-view.js', 'NATIVE_CONTOUR_VIEW_BUILD'],
  ['app/morphology-source-view.js', 'MORPHOLOGY_SOURCE_VIEW_RENDERER_BUILD'],
  ['app/janelia-wt-source-view.js', 'JANELIA_WT_SOURCE_VIEW_BUILD'],
  ['app/comparative-swc-view-replay.js', 'COMPARATIVE_SWC_VIEW_BUILD'],
  ['app/independent-source-object-view.js', 'INDEPENDENT_OBJECT_VIEW_BUILD'],
  ['app/native-contour-diagnostics.js', 'NATIVE_CONTOUR_DIAGNOSTIC_BUILD'],
  ['app/ronzano-premotor-position-source-view.js', 'RONZANO_SOURCE_VIEW_BUILD'],
];
const buildConstants = [];
for (const [relative, exported] of builds) {
  const modulePin = pin(read(relative));
  const module = await import(pathToFileURL(path.join(root, relative)).href);
  const paths = module[exported].inputs.map(row => row.path);
  buildConstants.push({ module: relative, modulePin, export: exported, count: paths.length, paths, I57PathIntersection: paths.filter(relative => targets.has(relative)) });
  assert.deepEqual(paths.filter(relative => targets.has(relative)), []);
}
const auxiliary = await import(pathToFileURL(path.join(root, 'app/main-scene-auxiliary-verification.js')).href);
read('app/main-scene-auxiliary-verification.js');
const auxiliaryPaths = auxiliary.MAIN_SCENE_AUXILIARY_PATHS.map(relative => 'public' + relative);
const union = [...new Set([...buildConstants.flatMap(build => build.paths), ...auxiliaryPaths, ...ronzanoSources])].sort();
assert.deepEqual(union, runtimeRecipe);
const sourceInputPinsFromTransport = ronzanoSources.map(relative => {
  const rows = compact.authoritativeInputs.filter(row => row.path === relative);
  assert.equal(rows.length, 1);
  return rows[0];
});
const overlayPins = ownership.integrationTargets.map(item => ({ path: item.path, ...item.after }));
const sharedGraphCoverage = explorerAfter.paths.map(relative => ({ path: relative, origin: targets.has(relative) ? 'sealed_I57_overlay' : 'current_root', ...pin(read(relative, true)), currentCanonicalCount: manifest.authoritativeInputs.filter(row => row.path === relative).length, coreLiteralCount: coreRecipe.filter(row => row === relative).length, compactRuntimeCount: runtimeRecipe.filter(row => row === relative).length }));
const missingExistingCanonical = sharedGraphCoverage.filter(row => row.origin === 'current_root' && row.currentCanonicalCount !== 1);
assert.deepEqual(missingExistingCanonical, []);
const canonicalCurrentPinMismatches = sharedGraphCoverage.filter(row => {
  const canonical = manifest.authoritativeInputs.find(input => input.path === row.path);
  return canonical && (canonical.bytes !== row.bytes || canonical.sha256 !== row.sha256);
});
assert.deepEqual(canonicalCurrentPinMismatches, []);
for (const actual of actualRootTargetPins) {
  const canonical = manifest.authoritativeInputs.find(input => input.path === actual.path);
  if (canonical && actual.pin) assert.deepEqual({ bytes: canonical.bytes, sha256: canonical.sha256 }, actual.pin, `Canonical actual I57 target pin drift: ${actual.path}`);
}
const rootPins = [...cached.values()].filter(value => value.absolute.startsWith(root + '/')).map(value => ({ path: path.relative(root, value.absolute), ...pin(value), positionedReadCalls: value.readCalls }));
for (const row of rootPins) assert.deepEqual(pin(readPhysical(path.join(root, row.path), true)), { bytes: row.bytes, sha256: row.sha256 }, `Root changed during closure audit: ${row.path}`);
const receipt = {
  status: 'PASS_READ_ONLY_I57_MOUNTED_AST_CLOSURE', generatedAtUtc: new Date().toISOString(), root, candidate, sharedRootWrites: 0, sourceAdmissionsChanged: false,
  interpretation: 'Exact local runtime module/CSS closure of the selected dedicated route: all explicit value/side-effect imports/reexports/literal require are included, type-only imports are erased, only the pageId-selected Collection lazy branch is traversed. No bundle-size, executed-call coverage or native browser result is claimed.',
  sealedCandidate: { ownership: { path: path.join(candidate, 'ownership.json'), ...pin(readPhysical(path.join(candidate, 'ownership.json'))) }, patch: { ...ownership.patch }, targets: ownership.integrationTargets, baselinePhysicalSource: 'candidate/qa/preimages for modified Explorer; all other runtime paths from exact current root', currentRootIntegrationState: rootIntegrationState, actualRootTargetPins },
  currentRecipe: { path: 'tools/build_research_iteration_manifest_2_91.mjs', ...pin(read('tools/build_research_iteration_manifest_2_91.mjs')), explicitLiteralCount: coreRecipe.length, canonicalManifestPath: 'data/research-iteration-manifest-2.91.json', canonicalManifestPin: pin(read('data/research-iteration-manifest-2.91.json')), canonicalCount: manifest.authoritativeInputs.length, explicitNewTargetMembership: newPaths.map(relative => ({ path: relative, coreLiteralCount: coreRecipe.filter(row => row === relative).length, canonicalCount: manifest.authoritativeInputs.filter(row => row.path === relative).length })) },
  explorer: { baseline: explorerBefore, proposed: explorerAfter, baselineCount: explorerBefore.paths.length, proposedCount: explorerAfter.paths.length, addedRuntimePaths: explorerAdded, removedRuntimePaths: explorerBefore.paths.filter(relative => !explorerAfter.paths.includes(relative)), newEdges: explorerNewEdges, coverage: sharedGraphCoverage, missingExistingCanonical, canonicalCurrentPinMismatches },
  canonicalAdvice: { modifyAndRepin: ['app/ResearchExplorer.tsx'], requiredExplicitNewPins: newPaths, missingExplicitNewPinsAtReadEpoch: newPaths.filter(relative => !coreRecipe.includes(relative)), alreadyPinnedReusedInputs: reused.map(relative => ({ path: relative, currentCanonicalCount: manifest.authoritativeInputs.filter(row => row.path === relative).length, coreLiteralCount: coreRecipe.filter(row => row === relative).length, compactRuntimeCount: runtimeRecipe.filter(row => row === relative).length, ...pin(read(relative)) })), recipeFileItselfMustRepin: true, documentationInputsParentOwned: true, noUnrelatedExistingInputRemoval: true },
  positions: { baseline: positionsBefore, proposed: positionsAfter, samePathSet: true, sameStaticReachableModuleEdgeSet: true, derivedBuildPaths: derivePositions(positionsAfter), declaredBuildPaths: declaredPositions, buildCount: 40, sourcePaths: ronzanoSources, sourceInputPinsFromCurrentTransport: sourceInputPinsFromTransport, sourceOriginalByteVerificationRepeated: false, sourceCount: 23, totalAuthorityInputCount: 63, mandatoryAddition: [], mandatoryRemoval: [], I57ModuleTraversal: [], selfTransportExcludedFromOwnHash: true, metadataVerificationInputsAreSeparateFromRuntimeImports: positionsMetadata, privateAuthorityChangeJustified: false },
  compactRuntime: { recipePath: 'tools/build_research_renderer_runtime_inputs.mjs', recipePin: pin(read('tools/build_research_renderer_runtime_inputs.mjs')), transportPath: 'data/research-renderer-runtime-inputs-2.91.json', transportPin: pin(read('data/research-renderer-runtime-inputs-2.91.json')), recipeCount: runtimeRecipe.length, currentCompactCount: compact.authoritativeInputs.length, exactExistingAuthorityUnion: union, buildConstants, auxiliaryPaths, sourcePaths: ronzanoSources, membershipChangeRequiredForI57: false, proposedMembershipCount: 198, I57OverlayTargetsInAnyDeclaredPrivateBuild: [], advice: 'Retain exact198membership and existing40Positions+23source authority. Reused I26 files already occur in the current recipe. Explorer UI/new ResultGroup are not part of the selected Positions lazy branch or any declared private renderer build. Normal canonical/hash regeneration may change shared metadata bytes independently of membership.' },
  rootInputEpochPins: rootPins, overlayInputPins: overlayPins, positionedReadContract: 'Explicit-position4096-byte fs.readSync, inode/size/mtime verified per read, all closure/recipe/root data pin reads rechecked at audit end',
  validationPerformed: ['sealed3path overlay pins, saved preimage pins, and consistent actual root before/after intake epoch checked', 'actualroute pageId/lazybranch structuralAST checked', 'baseline/overlay Explorer closure computed', 'baseline/overlay Positions closure and declared40paths equality checked', 'eight current private build-constant scopes+auxiliary+23Ronzano source inputs union exactly198 recipe', 'all existing Explorer runtime closure paths exactly1current canonical row', 'no I57 peer tests/native GUI tests/source proof producer executed'],
  limitations: ['Static reachable module closure is not native hydration/focus or per-call execution evidence', 'Explicit type-only imports excluded; metadata .d.ts/build verification inputs may remain separately pinned without becoming runtime imports', 'Other pageId lazy branches excluded; changing their files alone does not expand Positions authority', 'No original scientific asset admissions/counts/geometry were changed or fetched', 'Root current manifest may still be in its parent-owned finalization stage; this receipt pins the exact read epoch rather than claiming full root acceptance'],
};
const receiptPath = path.join(out, 'I57_MOUNTED_AST_CLOSURE_REVIEW.json');
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
const result = readPhysical(receiptPath, true);
console.log(JSON.stringify({ receipt: { path: receiptPath, ...pin(result) }, explorerBaseline: explorerBefore.paths.length, explorerOverlay: explorerAfter.paths.length, addedExplorerPaths: explorerAdded, canonicalAdditions: newPaths, missingExistingCanonical, positionsBuild: 40, positionsSource: 23, compactMembership: 198, membershipChangeRequired: false, rootWrites: 0 }, null, 2));
