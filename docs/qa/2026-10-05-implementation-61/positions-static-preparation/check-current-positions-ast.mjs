import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from '/private/tmp/ohri-i51-lock-dependencies/node_modules/typescript/lib/typescript.js';
const root = '/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype';
const out = path.dirname(new URL(import.meta.url).pathname), paths = new Set(), edges = [], erasedTypes = [], excludedLazy = [], external = [];
function resolve(from, specifier) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
  const result = [base, ...['.tsx', '.ts', '.js', '.mjs', '.json', '.css'].map(suffix => base + suffix)].find(relative => fs.existsSync(root + '/' + relative));
  assert.ok(result, `Missing current import ${from}:${specifier}`); return result;
}
function walk(relative) {
  if (paths.has(relative)) return; paths.add(relative);
  if (relative.endsWith('.json')) return; // Existing metadata membership only; no scientific bytes reread.
  const text = fs.readFileSync(root + '/' + relative, 'utf8');
  if (relative.endsWith('.css')) { for (const match of text.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) if (match[1].startsWith('.')) { const to = resolve(relative, match[1]); edges.push({ from: relative, to, kind: 'css_import' }); walk(to); } return; }
  const tree = ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true), line = node => tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
  function edge(specifier, node, kind) { if (!specifier.startsWith('.')) { external.push({ from: relative, specifier, kind, line: line(node) }); return; } const to = resolve(relative, specifier); edges.push({ from: relative, to, kind, line: line(node) }); walk(to); }
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause, named = clause?.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements : null;
      if (clause?.isTypeOnly || clause && !clause.name && named?.length && named.every(element => element.isTypeOnly)) erasedTypes.push({ from: relative, specifier: node.moduleSpecifier.text, line: line(node) });
      else edge(node.moduleSpecifier.text, node, clause ? 'value_import' : 'side_effect_import');
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      if (node.isTypeOnly) erasedTypes.push({ from: relative, specifier: node.moduleSpecifier.text, line: line(node) }); else edge(node.moduleSpecifier.text, node, 'value_export');
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      assert.ok(ts.isStringLiteral(node.arguments[0])); const specifier = node.arguments[0].text;
      if (relative === 'app/ResearchCollectionPage.tsx' && specifier !== './RonzanoPremotorPositionViewer') excludedLazy.push({ from: relative, specifier, line: line(node), reason: 'Unselected non-Positions route branch' }); else edge(specifier, node, 'selected_lazy_import');
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
}
['app/layout.tsx', 'app/explore/[...section]/page.tsx'].forEach(walk);
const actual = [...paths].sort();
const prior = JSON.parse(fs.readFileSync('/private/tmp/ohri-i61-native-acceptance-preparation-20261005/I61_CURRENT_OVERLAY_MOUNTED_CLOSURE_PREPARATION.json', 'utf8')).scenarios.find(scenario => scenario.name === 'positions_only').after.paths;
assert.deepEqual(actual, prior);
const build = [...new Set([...actual.filter(relative => relative !== 'data/research-renderer-runtime-inputs-2.91.json'), 'package.json', 'package-lock.json', 'app/ronzano-premotor-position-source-view.d.ts', 'public/data/research_explorer_index_v1/search-index.json', 'public/data/research_explorer_index_v1/asset-manifest.json'])].sort();
const tree = ts.createSourceFile('source-view.js', fs.readFileSync(root + '/app/ronzano-premotor-position-source-view.js', 'utf8'), ts.ScriptTarget.Latest, true); let declared;
function visit(node) { if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'buildPaths') { assert.ok(ts.isArrayLiteralExpression(node.initializer)); declared = node.initializer.elements.map(element => { assert.ok(ts.isStringLiteral(element)); return element.text; }); } ts.forEachChild(node, visit); }
visit(tree); assert.equal(build.length, 40); assert.deepEqual(build, declared);
const result = { status: 'PASS_ACTUAL_CURRENT_I61_POSITIONS_AST_MEMBERSHIP_NOT_RENDER_OR_SOURCE_PROOF', currentMountedRuntimePathCount: actual.length, currentMountedPaths: actual, exactPriorProjectedMembership: true, derivedBuildPaths: build, buildCount: 40, separateSourceVerificationCount: 23, edges, erasedTypes, excludedLazy, external, addedPaths: [], removedPaths: [], noScientificJsonOrOriginalWorkbookReadInTraversal: true, noFullTreeHash: true, noPrivateProducerImport: true, rootWrites: 0, stageWrites: 0, nativeAcceptanceExecuted: false };
fs.writeFileSync(out + '/I61_CURRENT_ACTUAL_POSITIONS_MOUNTED_AST_CHECK.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, mountedPaths: actual.length, privateBuild: 40, separateSourceInputs: 23, membershipChange: false }));
