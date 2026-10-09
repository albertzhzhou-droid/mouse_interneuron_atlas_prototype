import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire, registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = '/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype';
const here = path.dirname(new URL(import.meta.url).pathname);
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
    assert.ok(before.ino === after.ino && before.size === after.size && before.mtimeNs === after.mtimeNs && BigInt(position) === after.size, `Epoch drift during 4K positioned read: ${absolute} ${JSON.stringify({before:{ino:String(before.ino),size:String(before.size),mtimeNs:String(before.mtimeNs)},after:{ino:String(after.ino),size:String(after.size),mtimeNs:String(after.mtimeNs)},readBytes:position,readCalls:calls})}`);
  } finally { fs.closeSync(fd); }
  const value = { absolute, bytes: position, sha256: hash.digest('hex'), readCalls: calls, text: () => Buffer.concat(chunks).toString('utf8') };
  if (!fresh) cached.set(absolute, value);
  return value;
}
const pin = value => ({ bytes: value.bytes, sha256: value.sha256 });

const intakePath = path.join(here, 'exact-root-intake-preservation.json');
const intake = JSON.parse(readPhysical(intakePath).text());
assert.deepEqual(pin(readPhysical(intakePath)), {bytes:535839,sha256:'ef4d4cf544e8de621507b077c9b7ed5c52809c9f67fe197db0e790965c24d2ad'});
assert.deepEqual(pin(readPhysical(path.join(root,'docs/qa/2026-10-05-implementation-60/intake-preservation.json'))),pin(readPhysical(intakePath)));
const targets = new Map(intake.candidateTargets.map(item=>[item.path,item]));
const beforePath=path.join(here,'exact-intake-before-MolecularConcordanceWorkbench.tsx');
assert.deepEqual(pin(readPhysical(beforePath)),targets.get('app/MolecularConcordanceWorkbench.tsx').before);
for(const target of targets.values()) assert.deepEqual(pin(readPhysical(path.join(root,target.path))),target.after);
const physicalPath=(relative,after=false)=> !after&&targets.has(relative)
 ? (targets.get(relative).operation==='modify'?beforePath:path.join(here,'not-present-at-intake',relative))
 : path.join(root,relative);
const read=(relative,after=false)=>readPhysical(physicalPath(relative,after));
function ast(relative,after=false){return ts.createSourceFile(relative,read(relative,after).text(),ts.ScriptTarget.Latest,true,relative.endsWith('.tsx')?ts.ScriptKind.TSX:relative.endsWith('.ts')?ts.ScriptKind.TS:ts.ScriptKind.JS);}
const routeFor=pageId=>pageId==='type-compare'?'/explore/cell-types/compare':'/explore/positions';
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
  const roots = ['app/layout.tsx', 'app/explore/[...section]/page.tsx'];
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
          if (relative === 'app/ResearchCollectionPage.tsx' && specifier !== selected.specifier) excludedLazy.push({ from: relative, specifier, line: line(node), reason: `alternate pageId is not mounted on ${routeFor(pageId)}` });
          else edge(specifier, node, relative === 'app/ResearchCollectionPage.tsx' ? 'actual_mounted_page_lazy_import' : 'literal_dynamic_import_in_reachable_module');
        }
      } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require' && ts.isStringLiteral(node.arguments[0])) edge(node.arguments[0].text, node, 'literal_require');
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  roots.forEach(walk);
  assert.equal(unresolvedDynamic.length, 0, 'Unresolved dynamic import prevents exact local closure claim');
  return { route: routeFor(pageId), overlay, roots, branch: selected, paths: [...visited].sort(), edges, typeOnly, excludedLazy, externals, unresolvedDynamic };
}

const compareBefore=graph('type-compare',false),compareAfter=graph('type-compare',true);
const positionsBefore=graph('positions',false),positionsAfter=graph('positions',true);
const normalizeEdges=graph=>graph.edges.map(({line,...edge})=>edge);
const added=compareAfter.paths.filter(relative=>!compareBefore.paths.includes(relative));
const removed=compareBefore.paths.filter(relative=>!compareAfter.paths.includes(relative));
assert.deepEqual(added,['app/molecular-concordance-bookmark.js']);assert.deepEqual(removed,[]);
const newEdges=normalizeEdges(compareAfter).filter(edge=>!normalizeEdges(compareBefore).some(old=>JSON.stringify(old)===JSON.stringify(edge)));
assert.ok(newEdges.length>=1&&newEdges.length<=2);
assert.equal(newEdges.filter(edge=>edge.to==='app/molecular-concordance-bookmark.js').length,1);
assert.ok(newEdges.every(edge=>edge.from==='app/MolecularConcordanceWorkbench.tsx'&&['app/molecular-concordance-bookmark.js','app/research-explorer-index.js'].includes(edge.to)));
assert.deepEqual(positionsBefore.paths,positionsAfter.paths);assert.deepEqual(normalizeEdges(positionsBefore),normalizeEdges(positionsAfter));
const runtimeRecipe=literalArray('tools/build_research_renderer_runtime_inputs.mjs','RUNTIME_RENDERER_INPUT_PATHS');
const declaredPositions=literalArray('app/ronzano-premotor-position-source-view.js','buildPaths');
const manifest=JSON.parse(read('data/research-iteration-manifest-2.91.json').text());
const compact=JSON.parse(read('data/research-renderer-runtime-inputs-2.91.json').text());
const baseline=new Map(intake.baselineInputs.map(item=>[item.path,item]));
const expectedCanonical=new Set([...baseline.keys(),...intake.newCanonicalCandidatePaths,intake.timeline]);
assert.equal(expectedCanonical.size,2585);assert.equal(manifest.authoritativeInputs.length,2585);
assert.deepEqual([...expectedCanonical].sort(),manifest.authoritativeInputs.map(item=>item.path).sort());
const metadata=['package.json','package-lock.json','app/ronzano-premotor-position-source-view.d.ts','public/data/research_explorer_index_v1/search-index.json','public/data/research_explorer_index_v1/asset-manifest.json'];
const derivePositions=graph=>[...new Set([...graph.paths.filter(relative=>relative!=='data/research-renderer-runtime-inputs-2.91.json'),...metadata])].sort();
assert.deepEqual(derivePositions(positionsBefore),declaredPositions);assert.deepEqual(derivePositions(positionsAfter),declaredPositions);assert.equal(declaredPositions.length,40);
const source=JSON.parse(read('data/ronzano-premotor-position-reference-0.1.json').text());
const sourcePaths=['public'+source.derivedAsset.browserUrl,...source.sourceFiles.map(item=>'public'+item.browserUrl)];
assert.equal(source.sourceFiles.length,22);assert.equal(sourcePaths.length,23);
const compactPaths=compact.authoritativeInputs.map(item=>item.path);
assert.deepEqual(compactPaths,runtimeRecipe);assert.equal(compactPaths.length,198);
const canonicalByPath=new Map(manifest.authoritativeInputs.map(item=>[item.path,item]));
const beforeRuntime=intake.preimages.find(item=>item.path==='data/research-renderer-runtime-inputs-2.91.json');
assert.deepEqual(pin(read('data/research-renderer-runtime-inputs-2.91.json')),{bytes:beforeRuntime.bytes,sha256:beforeRuntime.sha256});
const threeCjs=deps.resolve('three'),threeEsm=threeCjs.replace(/three\.cjs$/,'three.module.js');
assert.ok(threeCjs!==threeEsm&&fs.existsSync(threeEsm));
const externalModules=new Map([['three',pathToFileURL(threeEsm).href],['three/examples/jsm/controls/OrbitControls.js',pathToFileURL(deps.resolve('three/examples/jsm/controls/OrbitControls.js')).href]]);
registerHooks({resolve(specifier,context,nextResolve){if(externalModules.has(specifier))return{url:externalModules.get(specifier),shortCircuit:true};assert.ok(specifier!=='three'&&!specifier.startsWith('three/'));return nextResolve(specifier,context);}});
const builds=[['app/main-scene-source-view.js','MAIN_SCENE_SOURCE_VIEW_BUILD'],['app/native-contour-source-view.js','NATIVE_CONTOUR_VIEW_BUILD'],['app/morphology-source-view.js','MORPHOLOGY_SOURCE_VIEW_RENDERER_BUILD'],['app/janelia-wt-source-view.js','JANELIA_WT_SOURCE_VIEW_BUILD'],['app/comparative-swc-view-replay.js','COMPARATIVE_SWC_VIEW_BUILD'],['app/independent-source-object-view.js','INDEPENDENT_OBJECT_VIEW_BUILD'],['app/native-contour-diagnostics.js','NATIVE_CONTOUR_DIAGNOSTIC_BUILD'],['app/ronzano-premotor-position-source-view.js','RONZANO_SOURCE_VIEW_BUILD']];
const buildConstants=[];
for(const [relative,exported]of builds){const modulePin=pin(read(relative));assert.deepEqual(modulePin,{bytes:baseline.get(relative).bytes,sha256:baseline.get(relative).sha256});const module=await import(pathToFileURL(path.join(root,relative)).href);const paths=module[exported].inputs.map(item=>item.path);assert.deepEqual(paths.filter(relative=>targets.has(relative)),[]);for(const row of module[exported].inputs)assert.deepEqual(row,compact.authoritativeInputs.find(item=>item.path===row.path));buildConstants.push({module:relative,modulePin,export:exported,count:paths.length,paths,I60OwnedPathIntersection:[]});}
assert.deepEqual(buildConstants.map(item=>item.count),[40,41,40,24,38,62,25,40]);
const auxiliaryModule='app/main-scene-auxiliary-verification.js';read(auxiliaryModule);const auxiliary=await import(pathToFileURL(path.join(root,auxiliaryModule)).href);const auxiliaryPaths=auxiliary.MAIN_SCENE_AUXILIARY_PATHS.map(relative=>'public'+relative);
const union=[...new Set([...buildConstants.flatMap(item=>item.paths),...auxiliaryPaths,...sourcePaths])].sort();assert.deepEqual(union,runtimeRecipe);
const mutable=new Set([...targets.keys(),...intake.rootOwnedExtras,intake.timeline]);
const graphCoverage=compareAfter.paths.map(relative=>{const actual=pin(read(relative,true));const row=canonicalByPath.get(relative);assert.ok(row);assert.deepEqual(actual,{bytes:row.bytes,sha256:row.sha256});if(baseline.has(relative)&&!mutable.has(relative))assert.deepEqual(actual,{bytes:baseline.get(relative).bytes,sha256:baseline.get(relative).sha256});return{path:relative,...actual,canonicalOccurrences:manifest.authoritativeInputs.filter(item=>item.path===relative).length,privateRuntimeMember:compactPaths.includes(relative),I60Owned:targets.has(relative)};});
const sourcePinsFromTransport=sourcePaths.map(relative=>{const rows=compact.authoritativeInputs.filter(item=>item.path===relative);assert.equal(rows.length,1);assert.deepEqual(rows[0],canonicalByPath.get(relative));return rows[0];});
const rootPins=[...cached.values()].filter(value=>value.absolute.startsWith(root+'/')).map(value=>({path:path.relative(root,value.absolute),...pin(value),positionedReadCalls:value.readCalls}));
for(const row of rootPins)assert.deepEqual(pin(readPhysical(path.join(root,row.path),true)),{bytes:row.bytes,sha256:row.sha256},'Observed read epoch changed: '+row.path);
console.log(JSON.stringify({iteration:'I60',status:'STATIC_SELECTED_ROUTE_CLOSURE_ONLY_NOT_FINAL_PRESERVATION',generatedAtUtc:new Date().toISOString(),runtime:{execPath:process.execPath,nodeVersion:process.version,typescriptVersion:ts.version,operation:'AST parse and read-only declared build constant evaluation; no compilation'},intakeBaseline:{path:intakePath,...pin(readPhysical(intakePath)),baselineInputs:2581,expectedCurrentCanonicalInputs:2585},parserProvenance:{path:'/private/tmp/ohri-i57-mounted-closure-review/compute-mounted-closure.mjs',bytes:24559,sha256:'29492ed891ddab6e8036eacb4417eba58565172301f1e2b8c2997edd4822f289',reusedSections:'positioned reader and TypeScript AST traversal/selected-lazy/literal arrays; old pinned main was not executed'},interpretation:'Static local module/CSS/JSON closure of the selected actual dedicated route, not executed call coverage, compilation, hydration or browser evidence.',compare:{before:compareBefore,after:compareAfter,added,removed,newEdges,coverage:graphCoverage,dtsAndTestAreCanonicalInputsNotRuntimeImports:true},positions:{before:positionsBefore,after:positionsAfter,declaredBuildPaths:declaredPositions,derivedBefore:derivePositions(positionsBefore),derivedAfter:derivePositions(positionsAfter),buildCount:40,separateSourceCount:23,originalWorkbookCount:22,authorityCount:63,membershipChangeRequired:false,sourcePinsFromTransport},privateRuntime:{runtimeRecipePath:'tools/build_research_renderer_runtime_inputs.mjs',recipePin:pin(read('tools/build_research_renderer_runtime_inputs.mjs')),transportPath:'data/research-renderer-runtime-inputs-2.91.json',transportPin:pin(read('data/research-renderer-runtime-inputs-2.91.json')),transportByteIdenticalToIntake:true,membershipCount:198,buildConstants,auxiliaryPaths,sourcePaths,exactAuthorityUnion:union,I60OwnedPathIntersection:[],membershipChangeRequired:false},rootPins,scope:{rootWrites:0,stageWrites:0,sourceOrScientificAdmissions:0,compilationsOrTests:0,networkRequests:0,browserActions:0,privateSourceProofProducersCalled:0,actualViewRenderCaptureRestoreCalls:0,finalPreservationExecuted:false},limitations:['Eight exports were evaluated solely as read-only declared build constants; no private proof or source-byte verification event was produced.','Original 23 Ronzano source bytes were not reverified by this membership audit.','Full final preservation remains blocked on parent FINAL_READY authorization; this output is not a final PASS.']},null,2));
