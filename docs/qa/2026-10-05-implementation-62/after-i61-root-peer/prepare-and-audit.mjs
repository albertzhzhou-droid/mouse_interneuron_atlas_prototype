import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ts from '/private/tmp/ohri-i51-lock-dependencies/node_modules/typescript/lib/typescript.js';

const root = '/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype';
const here = path.dirname(new URL(import.meta.url).pathname);
assert.ok(fs.realpathSync(here).startsWith('/private/tmp/'));
const candidate = '/private/tmp/ohri-i62-source-information-navigation-candidate';
const rebase = '/private/tmp/ohri-i62-after-i61-rebase-20261005';
const inputs = new Map();
const epoch = s => ({ dev: String(s.dev), ino: String(s.ino), size: String(s.size), mtimeNs: String(s.mtimeNs) });
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
function read(file) {
  if (inputs.has(file)) return inputs.get(file);
  const pa = fs.statSync(file,{bigint:true});
  const fd = fs.openSync(file,'r'); const blocks=[]; const hash=createHash('sha256'); let n=0;
  try {
    const before=fs.fstatSync(fd,{bigint:true}); assert.ok(same(epoch(pa),epoch(before)),'Path/fd epoch mismatch '+file);
    while (BigInt(n)<before.size) {
      const b=Buffer.alloc(Math.min(4096,Number(before.size-BigInt(n)))); const got=fs.readSync(fd,b,0,b.length,n);
      assert.ok(got>0,'Unexpected EOF '+file); n+=got;blocks.push(b.subarray(0,got));hash.update(b.subarray(0,got));
    }
    const after=fs.fstatSync(fd,{bigint:true}), pb=fs.statSync(file,{bigint:true});
    assert.ok(same(epoch(before),epoch(after)) && same(epoch(after),epoch(pb)) && after.size===BigInt(n),'Read epoch drift '+file);
  } finally { fs.closeSync(fd); }
  const body=Buffer.concat(blocks); const value={path:file,bytes:n,sha256:hash.digest('hex'),epoch:epoch(pa),body}; inputs.set(file,value);return value;
}
const pin=({body,...v})=>v;
const json=file=>JSON.parse(read(file).body.toString('utf8'));
function write(relative,body) {
  const dest=path.join(here,relative); assert.ok(dest.startsWith(here+'/'));
  fs.mkdirSync(path.dirname(dest),{recursive:true}); assert.ok(fs.realpathSync(path.dirname(dest)).startsWith(here+'/') || fs.realpathSync(path.dirname(dest))===here);
  fs.writeFileSync(dest,body,{flag:'wx'});
}
const sealed = json(rebase+'/I62_AFTER_I61_REBASE_SEAL.json');
const initialSeal=json(candidate+'/qa/I62_CANDIDATE_SEAL_AND_VALIDATION_RECEIPT.json');
const prep=json(rebase+'/I62_AFTER_I61_REBASE_PREPARATION.json');
const actualIntake=json(root+'/docs/qa/2026-10-05-implementation-61/intake-preservation.json');
const actualApply=json(root+'/docs/qa/2026-10-05-implementation-61/actual-apply-receipt.json');
assert.equal(actualApply.actualApplyExitCode,0);
assert.equal(sealed.targets.length,4); assert.equal(prep.queuedI61Afterimages.length,19);
const targets=sealed.targets, overlay=new Map();
for (const target of targets) {
  const after=read(candidate+'/proposed/'+target.path);
  assert.equal(after.bytes,target.after.bytes,target.path);assert.equal(after.sha256,target.after.sha256,target.path);
  const initial=initialSeal.files.find(v=>v.path===target.path);assert.deepEqual(initial.after,target.after);
  if (target.before) {
    const current=read(root+'/'+target.path);assert.equal(current.bytes,target.before.bytes);assert.equal(current.sha256,target.before.sha256);
  } else assert.equal(fs.existsSync(root+'/'+target.path),false,target.path+' must remain absent');
  overlay.set(target.path,candidate+'/proposed/'+target.path);
}
const originalPatch=read(candidate+'/I62_SOURCE_INFORMATION_NAVIGATION_CANDIDATE.patch');
assert.equal(originalPatch.bytes,sealed.patch.bytes);assert.equal(originalPatch.sha256,sealed.patch.sha256);
assert.equal(read(sealed.patch.path).sha256,originalPatch.sha256);
const i61Actual=[];
for(const input of prep.queuedI61Afterimages) {
  const current=read(root+'/'+input.path);assert.equal(current.bytes,input.after.bytes,input.path);assert.equal(current.sha256,input.after.sha256,input.path);
  i61Actual.push({logicalPath:input.path,...pin(current)});
}
const sourceId='SRC-GARCIA-RAMIREZ-2022', setId='RS-GARCIA-RAMIREZ-ADULT-SPINAL-AGGREGATE-PHYSIOLOGY';
const registry=json(root+'/data/research-source-registry-0.1.json');
assert.equal(registry.sources.length,32);assert.equal(registry.sources.flatMap(s=>s.recordSets).length,42);
const owner=registry.sources.find(s=>s.id===sourceId), set=owner.recordSets.find(s=>s.recordSetId===setId);
const projected=json(rebase+'/queued-i61-afterimages/data/research-source-registry-0.1.json');
assert.deepEqual(registry,projected);
assert.equal(set.includedRecordCount.value,1);assert.equal(set.unitOfObservation,'source_study_aggregate_information_adapter');
assert.equal(set.sourceInformationRef.href,'/explore/cell-types/additional#garcia-ramirez-physiology-panel');
assert.equal(owner.assets.length,4);
const destinationAssets=owner.assets.map(asset=>{
  const actual=read(root+'/'+asset.path);assert.equal(actual.bytes,asset.integrity.bytes);assert.equal(actual.sha256,asset.integrity.sha256);
  return {id:asset.id,accession:asset.accession,kind:asset.kind,...pin(actual)};
});
const facts=json(root+'/'+set.dataPath);
assert.equal(facts.studyScope.recordedPool.value,171);
assert.deepEqual(facts.tables.map(t=>t.groupCountSum),[171,171,171,171]);
assert.equal(facts.studyScope.recordedPool.independentAnimalCount,null);assert.equal(facts.studyScope.recordedPool.cellToAnimalMapping,null);
const declaredInfo=registry.sources.flatMap(s=>s.recordSets.filter(r=>Object.hasOwn(r,'sourceInformationRef')).map(r=>({source:s.id,set:r.recordSetId})));
assert.deepEqual(declaredInfo,[{source:sourceId,set:setId}]);
assert.equal(registry.sources.flatMap(s=>s.recordSets).filter(r=>r.childRosterRef.status==='bundled_exact').length,13);
assert.equal(registry.sources.flatMap(s=>s.recordSets).filter(r=>r.sourceObjectSetRef?.status==='bundled_exact').length,4);
const ui=read(overlay.get('app/ResearchSourceRegistry.tsx')).body.toString('utf8');
const parentUI=read(root+'/app/ResearchSourceRegistry.tsx').body.toString('utf8');
const stripped=ui.replace('import Link from "next/link";\n','').replace('import { getSourceRecordSetInformation } from "./research-source-information-navigation.js";\n','').replace(/\nfunction SourceInformationNavigation\([\s\S]+?\n}\n(?=\nfunction integrityText)/,'').replace('                  {!recordSetError && <SourceInformationNavigation sourceId={selected.id} recordSet={recordSet} />}\n','');
assert.equal(stripped,parentUI,'Original dossier/URL/provider/science markup must be exactly retained');
assert.match(ui,/prefetch=\{false\}/);assert.match(read(root+'/app/AdditionalResearchEvidence.tsx').body.toString('utf8'),/id="garcia-ramirez-physiology-panel"/);

const physical=(relative,ov)=>ov.get(relative)??root+'/'+relative;
function graph(page,ov) {
  const paths=new Set(),edges=[],erasedTypes=[],excludedLazy=[],external=[];
  function resolve(from,spec) {
    const base=path.posix.normalize(path.posix.join(path.posix.dirname(from),spec));assert.ok(!base.startsWith('../'));
    const found=[base,...['.tsx','.ts','.js','.mjs','.json','.css'].map(s=>base+s)].find(p=>fs.existsSync(physical(p,ov)));
    assert.ok(found,from+':'+spec);return found;
  }
  function walk(relative) {
    if(paths.has(relative))return;paths.add(relative);const text=read(physical(relative,ov)).body.toString('utf8');
    if(relative.endsWith('.json'))return;
    if(relative.endsWith('.css')){for(const m of text.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g))if(m[1].startsWith('.')){const to=resolve(relative,m[1]);edges.push({from:relative,to,kind:'css_import'});walk(to);}return;}
    const tree=ts.createSourceFile(relative,text,ts.ScriptTarget.Latest,true),line=node=>tree.getLineAndCharacterOfPosition(node.getStart(tree)).line+1;
    function edge(spec,node,kind) {if(!spec.startsWith('.')){external.push({from:relative,spec,kind,line:line(node)});return;}const to=resolve(relative,spec);edges.push({from:relative,to,kind,line:line(node)});walk(to);}
    function visit(node) {
      if(ts.isImportDeclaration(node)) {const clause=node.importClause,named=clause?.namedBindings&&ts.isNamedImports(clause.namedBindings)?clause.namedBindings.elements:null;if(clause?.isTypeOnly||clause&&!clause.name&&named?.length&&named.every(e=>e.isTypeOnly))erasedTypes.push({from:relative,spec:node.moduleSpecifier.text});else edge(node.moduleSpecifier.text,node,clause?'value_import':'side_effect_import');}
      else if(ts.isExportDeclaration(node)&&node.moduleSpecifier){const named=node.exportClause&&ts.isNamedExports(node.exportClause)?node.exportClause.elements:null;if(node.isTypeOnly||named?.length&&named.every(e=>e.isTypeOnly))erasedTypes.push({from:relative,spec:node.moduleSpecifier.text});else edge(node.moduleSpecifier.text,node,'value_reexport');}
      else if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword){assert.ok(ts.isStringLiteral(node.arguments[0]));const spec=node.arguments[0].text;const selected=page==='sources'?'./ResearchSourceRegistry':'./RonzanoPremotorPositionViewer';if(relative==='app/ResearchCollectionPage.tsx'&&spec!==selected)excludedLazy.push({from:relative,spec});else edge(spec,node,'selected_literal_lazy_import');}
      ts.forEachChild(node,visit);
    }
    visit(tree);
  }
  ['app/layout.tsx',page==='sources'?'app/sources/page.tsx':'app/explore/[...section]/page.tsx'].forEach(walk);
  return {page,paths:[...paths].sort(),edges,erasedTypes,excludedLazy,external};
}
const sourcesBefore=graph('sources',new Map()),sourcesAfter=graph('sources',overlay),positionsBefore=graph('positions',new Map()),positionsAfter=graph('positions',overlay);
assert.equal(sourcesBefore.paths.length,109);assert.equal(sourcesAfter.paths.length,110);
assert.deepEqual(sourcesAfter.paths.filter(p=>!sourcesBefore.paths.includes(p)),['app/research-source-information-navigation.js']);
assert.deepEqual(sourcesBefore.paths.filter(p=>!sourcesAfter.paths.includes(p)),[]);assert.deepEqual(positionsBefore.paths,positionsAfter.paths);
function array(relative,name) {
  const tree=ts.createSourceFile(relative,read(root+'/'+relative).body.toString('utf8'),ts.ScriptTarget.Latest,true);let arr;
  function visit(node){if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.name.text===name)arr=ts.isArrayLiteralExpression(node.initializer)?node.initializer:ts.isCallExpression(node.initializer)?node.initializer.arguments.find(ts.isArrayLiteralExpression):null;ts.forEachChild(node,visit);}visit(tree);assert.ok(arr);return arr.elements.map(n=>{assert.ok(ts.isStringLiteral(n));return n.text;});
}
const compact=array('tools/build_research_renderer_runtime_inputs.mjs','RUNTIME_RENDERER_INPUT_PATHS');assert.equal(compact.length,198);
assert.deepEqual(json(root+'/data/research-renderer-runtime-inputs-2.91.json').authoritativeInputs.map(v=>v.path),compact);assert.deepEqual(compact.filter(p=>overlay.has(p)),[]);
const positionsBuild=[...new Set([...positionsAfter.paths.filter(p=>p!=='data/research-renderer-runtime-inputs-2.91.json'),'package.json','package-lock.json','app/ronzano-premotor-position-source-view.d.ts','public/data/research_explorer_index_v1/search-index.json','public/data/research_explorer_index_v1/asset-manifest.json'])].sort();
assert.equal(positionsBuild.length,40);assert.deepEqual(positionsBuild,array('app/ronzano-premotor-position-source-view.js','buildPaths'));
const positionSources=json(root+'/data/ronzano-premotor-position-reference-0.1.json');assert.equal(positionSources.sourceFiles.length,22);
const privatePrior=json('/private/tmp/ohri-i61-parent-addon-independent-review-20261005/I61_PRIVATE_MEMBERSHIP_REVIEW.json');
const scopes=privatePrior.scopes.map(s=>{const actual=read(root+'/'+s.module);assert.equal(actual.bytes,s.bytes);assert.equal(actual.sha256,s.sha256);assert.deepEqual(s.paths.filter(p=>overlay.has(p)),[]);return {module:s.module,export:s.export,count:s.count,paths:s.paths,exactByteUnchanged:true,producer:pin(actual),i62Intersection:[]};});assert.equal(scopes.length,8);
const layout=sealed.layoutPins.map(p=>{const a=read(p.path);assert.equal(a.bytes,p.bytes);assert.equal(a.sha256,p.sha256);return pin(a);});

// Entirely physical temporary test shadow, never a project/source symlink.
assert.ok(sourcesAfter.paths.includes('package.json'));
for(const relative of sourcesAfter.paths)write('shadow/'+relative,read(physical(relative,overlay)).body);
for(const relative of ['app/AdditionalResearchEvidence.tsx','app/garcia-ramirez-physiology.js',set.dataPath,...owner.assets.map(a=>a.path)]) {
  if(!fs.existsSync(here+'/shadow/'+relative))write('shadow/'+relative,read(root+'/'+relative).body);
}
for(const relative of ['tests/research-source-information-navigation.test.mjs','app/research-source-information-navigation.d.ts'])write('shadow/'+relative,read(candidate+'/proposed/'+relative).body);
assert.equal(fs.existsSync(here+'/shadow/node_modules'),false);assert.ok(fs.realpathSync(here+'/shadow').startsWith('/private/tmp/'));fs.symlinkSync('/private/tmp/ohri-i51-lock-dependencies/node_modules',here+'/shadow/node_modules');
for(const input of inputs.values())assert.deepEqual(epoch(fs.statSync(input.path,{bigint:true})),input.epoch,'Overall input epoch drift '+input.path);
const receipt={status:'PASS_READ_ONLY_ACTUAL_I61_ROOT_FIRST_I62_PREPARATION_NOT_INTAKE',generatedAtUtc:new Date().toISOString(),candidatePatch:pin(originalPatch),candidateTargets:targets,i61Actual19:i61Actual,actualI61ApplyReceipt:pin(read(root+'/docs/qa/2026-10-05-implementation-61/actual-apply-receipt.json')),sources:{before:sourcesBefore,after:sourcesAfter,addedRuntimePaths:['app/research-source-information-navigation.js']},positions:{before:positionsBefore,after:positionsAfter,buildPaths:positionsBuild,buildCount:40,sourceVerificationCount:23,originalWorkbookCount:22},compact:{count:198,paths:compact,i62Intersection:[]},privateScopes:scopes,layoutPins:layout,destination:{sourceId,recordSetId:setId,reference:set.sourceInformationRef,assets:destinationAssets,onlyInformationAdapterCount:1,sharedObservationPool:171,alternativePartitions:4,independentAnimalCount:null,cellToAnimalMapping:null},science:{sources:32,recordSets:42,bundledExactRosters:13,bundledExactObjectSets:4,newProfiles:0,newCells:0,newGeometry:0,newJoins:0,newREG:0,newM2:0,newM4:0},priorRegistryAndUiPreserved:true,rootEdits:0,stageEdits:0,network:0,browser:0,privateAuthorityFunctionsInvoked:0,sourceParsersExecuted:0,acceptedI61CheckpointNotYetRequiredOrClaimed:true,i62Intake:false,nativeAcceptance:false,inputPins:[...inputs.values()].map(pin)};
write('I62_ACTUAL_I61_ROOT_FIRST_INDEPENDENT_PREPARATION.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,inputs:inputs.size,bytes:[...inputs.values()].reduce((n,p)=>n+p.bytes,0),sourceClosure:'109→110',addedRuntimePath:'app/research-source-information-navigation.js',runtime:198,positions:'40+23',privateScopes:8,i61Actual19Exact:true,rootEdits:0}));
