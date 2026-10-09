#!/usr/bin/env python3
"""Temp-only actual source dependency inventory; no original file writes."""
from pathlib import Path
import collections, datetime, hashlib, json, os, re

ROOT=Path('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype')
STAGE=Path('/private/tmp/ohri-i51-verification')
OUT=Path('/private/tmp/ohri-i53-final-preservation-20261004/I53_FINAL_RUNTIME_GRAPH.json')
CHUNK=4096
stats={'strategy':'entire_file_os_pread_4096_chunks','preadCalls':0,'bytesRead':0,'filesRead':0}
cache={};bodies={}

def read(path,fresh=False):
    path=Path(path)
    if not fresh and path in cache:return cache[path],bodies[path]
    fd=os.open(path,os.O_RDONLY);parts=[];h=hashlib.sha256();offset=0
    try:
        a=os.fstat(fd)
        while True:
            b=os.pread(fd,CHUNK,offset);stats['preadCalls']+=1
            if not b:break
            offset+=len(b);h.update(b);parts.append(b);stats['bytesRead']+=len(b)
        z=os.fstat(fd)
        if (a.st_size,a.st_mtime_ns,a.st_ino)!=(z.st_size,z.st_mtime_ns,z.st_ino) or offset!=z.st_size:raise RuntimeError('Changed during source read '+str(path))
    finally:os.close(fd)
    stats['filesRead']+=1
    cache[path]={'bytes':offset,'sha256':h.hexdigest()};bodies[path]=b''.join(parts)
    return cache[path],bodies[path]

def actual(path):return read(ROOT/path) if (ROOT/path).is_file() else (None,None)
def load(path):return json.loads(actual(path)[1])
def rec(row):return {k:row[k] for k in ['bytes','sha256']}
manifest_path='data/research-iteration-manifest-2.91.json'
epoch,body=actual(manifest_path);manifest=json.loads(body)
pins={x['path']:x for x in manifest['authoritativeInputs']}
intake=load('docs/qa/2026-10-04-implementation-53/intake-preservation.json')
before={x['path']:x for x in intake['baselineInputs']}
runtime=load('data/research-renderer-runtime-inputs-2.91.json');renderer={x['path']:x for x in runtime['authoritativeInputs']}
asset=load('public/data/research_explorer_index_v1/asset-manifest.json');asset_pins={x['path']:x for x in asset['sourceFiles']}
seeds=['app/InterneuronTypeAtlas.tsx','app/ResearchExplorer.tsx','app/research-record-presentation.js']
context=['app/layout.tsx','app/SiteNavigation.tsx','app/site-navigation.ts','app/ResearchRoutePage.tsx','app/ResearchCollectionPage.tsx',
         'app/globals.css','app/academic-interface.css','app/site-navigation.css','app/research-pages.css','app/research-information-layout.css',
         'app/explore/[...section]/page.tsx','app/research/[...section]/page.tsx','app/sources/page.tsx']
configuration=['package.json','package-lock.json','tsconfig.json','next.config.ts','eslint.config.mjs','next-env.d.ts','postcss.config.mjs','vite.config.ts']
queue=list(seeds)+[x for x in context if x.endswith('.css')]
visited=set();edges=[];external=collections.defaultdict(set);fetch_refs=[];unresolved=[]

def resolve(parent,spec):
    base=(ROOT/parent).parent/spec
    choices=[base]+[Path(str(base)+s) for s in ['.tsx','.ts','.js','.mjs','.jsx','.json','.css','.d.ts']]+[base/'index.tsx',base/'index.ts',base/'index.js']
    found=next((p for p in choices if p.is_file()),None)
    return str(found.resolve().relative_to(ROOT)) if found else None

while queue:
    parent=queue.pop(0)
    if parent in visited:continue
    visited.add(parent)
    _,content=actual(parent)
    if content is None:unresolved.append({'from':None,'specifier':parent,'kind':'seed_missing'});continue
    if Path(parent).suffix not in {'.js','.mjs','.jsx','.ts','.tsx','.css'}:continue
    text=content.decode()
    dynamic=set(re.findall(r'\bimport\s*\(\s*[\"\']([^\"\']+)[\"\']',text))
    static=set(re.findall(r'\bfrom\s*[\"\']([^\"\']+)[\"\']',text))|set(re.findall(r'\bimport\s*[\"\']([^\"\']+)[\"\']',text))
    css=set(re.findall(r'@import\s+(?:url\(\s*)?[\"\']([^\"\']+)[\"\']',text)) if parent.endswith('.css') else set()
    for kind,specs in [('static_module_import',static),('literal_dynamic_module_import',dynamic),('css_import',css)]:
        for spec in sorted(specs):
            if not spec.startswith('.'):
                external[spec.split('/')[0] if not spec.startswith('@') else '/'.join(spec.split('/')[:2])].add(parent)
                continue
            path=resolve(parent,spec);edge={'from':parent,'specifier':spec,'kind':kind,'resolvedPath':path};edges.append(edge)
            if path is None:unresolved.append(edge)
            elif path not in visited:queue.append(path)
    for value in sorted(set(re.findall(r'[\"\'`](/(?:api|data)/[^\"\'`]+)[\"\'`]',text))):
        fetch_refs.append({'from':parent,'reference':value,'dynamicTemplate':'${' in value,
                           'boundary':'Reference discovery only; runtime query branches and dynamically constructed asset URLs are not treated as exhaustive fetch validation.'})

inventory=[]
for path in sorted(visited|set(context)|set(configuration)):
    now,_=actual(path);staged,_=read(STAGE/path) if (STAGE/path).is_file() else (None,None)
    pin=pins.get(path);source=asset_pins.get(path);render=renderer.get(path)
    kind='scientific_or_contract_data' if path.endswith('.json') and path.startswith(('data/','public/data/')) else 'stylesheet' if path.endswith('.css') else 'configuration_or_package' if path in configuration else 'application_helper_or_component'
    inventory.append({'path':path,'kind':kind,'seed':path in seeds,'transitiveRuntimeImport':path in visited,'entryOrLayoutContext':path in context,
                      'actualRoot':now,'actualStage':staged,'stageByteIdentical':now==staged and now is not None,
                      'directCurrentPin':rec(pin) if pin else None,'directCurrentPinMatches':now==rec(pin) if pin else None,
                      'explorerAssetSourcePin':rec(source) if source else None,'explorerAssetSourcePinMatches':now==rec(source) if source else None,
                      'specifiedRendererPin':rec(render) if render else None,'specifiedRendererPinMatches':now==rec(render) if render else None,
                      'beforeAuthoritativeEntry':rec(before[path]) if path in before else None,
                      'beforeAbsenceRecorded':path in intake['newPathAbsence'],
                      'unrecordedBaselineIsNotAbsence':path not in before and path not in intake['newPathAbsence']})

omitted=[x for x in inventory if x['directCurrentPin'] is None and x['actualRoot'] is not None]
omitted_ui=[x for x in omitted if x['kind'] in {'application_helper_or_component','stylesheet'}]
candidate=[x['path'] for x in omitted if x['transitiveRuntimeImport'] or x['entryOrLayoutContext'] or x['kind']=='configuration_or_package']
epoch_end,_=read(ROOT/manifest_path,fresh=True)
result={'auditId':'I53-transitive-runtime-dependency-inventory-20261004','generatedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'sharedFilesModified':False,'manifestEpochStart':epoch,'manifestEpochEnd':epoch_end,'stableCheckpoint':epoch==epoch_end,
        'seeds':seeds,'UIContextBoundary':'Only import closure of the three modified frontend modules is recursively traversed. Route and layout context files are individually receipted; CSS imports are traversed. Other components imported solely by the collection router are outside this focused graph.',
        'staticGraphBoundary':'Literal relative imports and re-exports, literal lazy imports, and CSS imports. External packages are receipted through package/config files. Constructed imports and all runtime fetch variants are not inferred.',
        'summary':{'currentInputCount':len(pins),'runtimeImportedFileCount':len(visited),'totalInventoryCount':len(inventory),
                   'literalDynamicImportEdgeCount':sum(x['kind']=='literal_dynamic_module_import' for x in edges),
                   'omittedDirectCurrentPinCount':len(omitted),'omittedActiveUIHelperStyleCount':len(omitted_ui),
                   'assetSourceCoveredOmittedDataCount':sum(x['explorerAssetSourcePinMatches'] is True for x in omitted),
                   'candidateRecipeAdditionCount':len(candidate),'rootStageMismatchCount':sum(not x['stageByteIdentical'] for x in inventory),
                   'unresolvedStaticImportCount':len(unresolved)},
        'inventory':inventory,'importEdges':edges,'omittedCurrentDirectPins':omitted,'omittedActiveUIHelperStyles':omitted_ui,
        'proposedExistingRecipeAdditions':candidate,'externalPackages':{k:sorted(v) for k,v in external.items()},
        'discoveredRuntimeAssetReferences':fetch_refs,'unresolvedImports':unresolved,'readStrategy':stats,
        'recommendation':'For reproducible current release authority, admit existing dependency bytes from actual root with explicit current-file receipts and recipe inputs; no invented before byte or absence claims. Asset-manifest and renderer pin coverage are separately identified rather than being silently equated with a direct 2.91 pin.'}
OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'output':str(OUT),'summary':result['summary'],'stable':result['stableCheckpoint'],
                  'omittedUI':[x['path'] for x in omitted_ui],'recipeAdditions':candidate,
                  'rootStageMismatches':[x['path'] for x in inventory if not x['stageByteIdentical']],
                  'readStrategy':stats},ensure_ascii=False,indent=2))
