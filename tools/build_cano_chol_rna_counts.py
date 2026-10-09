#!/usr/bin/env python3
"""Replay the exact CHOL Assay5 counts layer into bounded gene chunks.

Uses serialized Assay5 LogMaps, not guessed barcode suffixes or layer order.
Only the 923 already admitted CHOL_IN metadata rows enter the derivative.
The original counts, data and scale.data layers remain distinct.
"""
from pathlib import Path
import argparse, gzip, hashlib, json, platform, sys, warnings

ROOT = Path(__file__).resolve().parents[1]
SOURCE_NAME = 'GSE318731_P56_cholinergic_multiome.rds'
SOURCE_SHA = 'd4ad07a1e434f2ed4553738f3e1df1b395ce81b154f974c41f3ba6a9d674aed2'
SOURCE_BYTES = 127862795
SOURCE_URL = 'https://ftp.ncbi.nlm.nih.gov/geo/series/GSE318nnn/GSE318731/suppl/' + SOURCE_NAME
DOC = 'data/cano-chol-rna-counts-0.1.json'
OUT = 'public/data/cano_chol_rna_counts_v1'
CHUNK_SIZE = 256
REGISTRY = 'data/cano-gomez-p56-multiome-interneuron-registry-0.1.json'
ROSTER = 'public/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz'

def sha(b): return hashlib.sha256(b).hexdigest()
def digest(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for block in iter(lambda: f.read(1024*1024), b''): h.update(block)
    return h.hexdigest()
def ordered(v): return sha(('\n'.join(v)+'\n').encode())
def require(v, m):
    if not v: raise ValueError(m)
def ref(o):
    while o is not None and o.info.type.name == 'REF': o = o.referenced_object
    return o
def strings(o):
    o = ref(o)
    if o is None or o.info.type.name in ('NILVALUE', 'NIL'): return None
    if o.info.type.name == 'SYM': return strings(o.value)
    if o.info.type.name == 'CHAR': return None if o.value is None else o.value.decode('utf8')
    require(o.info.type.name == 'STR', 'Expected serialized string vector')
    return [strings(v) for v in o.value]
def attrs(o):
    a = ref(ref(o).attributes); result = {}
    while a is not None and a.info.type.name not in ('NILVALUE', 'NIL'):
        name = strings(a.tag); require(name not in result, 'Duplicate serialized attribute')
        result[name] = ref(a.value[0]); a = ref(a.value[1])
    return result
def named(o):
    o = ref(o); names = strings(attrs(o)['names'])
    require(len(names) == len(o.value) and len(set(names)) == len(names), 'Duplicate or malformed named vector')
    return dict(zip(names, map(ref, o.value)))
def values(o):
    o = ref(o)
    if o.info.type.name == 'STR': return strings(o)
    a = attrs(o)
    if 'levels' in a:
        levels = strings(a['levels'])
        require(all(1 <= int(i) <= len(levels) for i in o.value), 'Missing or invalid factor')
        return [levels[int(i)-1] for i in o.value]
    return o.value
def layer_map(o, layer):
    o = ref(o); a = attrs(o)
    require(strings(a['class']) == ['LogMap'], 'Expected source Assay5 LogMap')
    dims = a['dim'].value.tolist(); dn = ref(a['dimnames']).value
    names, layers = strings(dn[0]), strings(dn[1])
    require(len(dims) == 2 and dims == [len(names),len(layers)] and len(set(names)) == len(names) and all(names), 'Invalid LogMap identities')
    require(len(set(layers)) == len(layers) and layer in layers, 'Missing or duplicate LogMap layer')
    require(len(o.value) == dims[0]*dims[1] and not hasattr(o.value, 'mask'), 'Missing LogMap membership')
    membership = o.value.reshape(dims, order='F')[:,layers.index(layer)]
    return [n for n, keep in zip(names, membership) if keep], {'dimensions':dims,'layerColumn':layers.index(layer)+1,'allNamesSha256':ordered(names),'selectedNamesSha256':ordered(n for n,keep in zip(names,membership) if keep)}

def build(source, write):
    import rdata, numpy as np
    from rdata.parser import _parser
    from extract_cano_gomez_rds_metadata_stream import _table_dicts
    source = source.resolve(); before = source.stat()
    require(source.name == SOURCE_NAME and before.st_size == SOURCE_BYTES and digest(source) == SOURCE_SHA, 'Exact source filename/size/hash changed')
    with warnings.catch_warnings():
        warnings.simplefilter('ignore'); parsed = rdata.parser.parse_file(source)
    root = attrs(parsed.object)
    require(strings(root['class']) == ['Seurat'], 'Not a source Seurat object')
    assay = attrs(named(root['assays'])['RNA'])
    require(strings(assay['class']) == ['Assay5'], 'Expected source RNA Assay5')
    layers = named(assay['layers']); matrix = attrs(layers['counts'])
    require(strings(matrix['class']) == ['dgCMatrix'], 'Expected counts dgCMatrix')
    cells, cell_map = layer_map(assay['cells'], 'counts')
    genes, gene_map = layer_map(assay['features'], 'counts')
    dims = matrix['Dim'].value.tolist(); i,p,x = [matrix[k].value for k in ('i','p','x')]
    require(dims == [32285,3199] and dims == [len(genes),len(cells)], 'Exact counts dimensions or LogMap cardinality changed')
    # Source matrices have NULL Dimnames; names come from the explicit LogMaps.
    dn = [strings(v) for v in ref(matrix['Dimnames']).value]
    require(dn == [None,None] or dn == [genes,cells], 'Conflicting matrix Dimnames')
    require(len(p) == dims[1]+1 and int(p[0]) == 0 and int(p[-1]) == len(x) == len(i) and np.all(np.diff(p) >= 0), 'Invalid sparse column pointers')
    require(np.all(i >= 0) and np.all(i < dims[0]), 'Out-of-range sparse feature row')
    require(np.isfinite(x).all() and np.all(x >= 0) and np.all(x == np.floor(x)) and np.all(x <= 2**53-1), 'Counts are not safe finite nonnegative integers')
    meta = named(root['meta.data']); names = strings(attrs(root['meta.data'])['row.names'])
    require(cells == names and len(set(cells)) == 3199, 'RNA counts cell LogMap does not equal metadata row names in order')
    groups, labels = values(meta['groups']), values(meta['neuron_types'])
    count, feature = values(meta['nCount_RNA']), values(meta['nFeature_RNA'])
    require(all(len(v) == 3199 for v in (groups,labels,count,feature)), 'Metadata column length mismatch')
    sums=[]; detected=[]
    for c in range(3199):
        start,end=int(p[c]),int(p[c+1]); rows=i[start:end]; vals=x[start:end]
        require(np.all(np.diff(rows) > 0), 'Unsorted or duplicate sparse feature rows')
        sums.append(int(sum(int(v) for v in vals))); detected.append(int(np.count_nonzero(vals)))
    require(sums == list(count) and detected == list(feature), 'Counts layer sums/detection do not replay original nCount_RNA/nFeature_RNA')
    registry=json.loads((ROOT/REGISTRY).read_text()); profile_by_label={r['sourceLocalLabel']:r for r in registry['profiles']}
    selected=[c for c in range(3199) if groups[c] == 'CHOL_IN']; require(len(selected) == 923, 'CHOL_IN membership changed')
    # Independent retained 22-column roster; preserve its original row order.
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        q=Path(d)/'roster.csv';q.write_bytes(gzip.decompress((ROOT/ROSTER).read_bytes())); prior=_table_dicts(q)
    require([r['source_nucleus_id'] for r in prior] == [cells[c] for c in selected], 'Admitted roster order differs from counts columns')
    nuclei=[]
    for n,(c,row) in enumerate(zip(selected,prior)):
        profile=profile_by_label.get(labels[c]);require(profile and row['neuron_types'] == labels[c] and row['confirmed_interneuron_profile_id'] == profile['profileId'], 'Profile assignments disagree with retained roster')
        nuclei.append({'key':row['compound_nucleus_key'],'nativeId':cells[c],'profileId':profile['profileId'],'metadataRow':c+1,'countsColumn':c+1,'totalRnaCount':sums[c],'detectedFeatureCount':detected[c]})
    profiles=[]
    for profile in registry['profiles']:
        ns=[n for n in nuclei if n['profileId'] == profile['profileId']]
        require(len(ns) == profile['nucleusCount'] and ordered(n['key'] for n in ns) == profile['orderedCompoundNucleusKeysSha256'], 'Exact profile membership changed')
        profiles.append({'id':profile['profileId'],'label':profile['sourceLocalLabel'],'nucleusCount':len(ns),'orderedNucleusKeysSha256':ordered(n['key'] for n in ns)})
    # All source features, including wholly undetected features, are retained.
    dense=np.zeros((len(genes),len(selected)), dtype=np.uint32)
    require(np.all(x <= np.iinfo(np.uint32).max), 'Counts exceed derivative integer width')
    for n,c in enumerate(selected):
        start,end=int(p[c]),int(p[c+1]);dense[i[start:end],n]=x[start:end].astype(np.uint32)
    chunks=[]; files={}
    for start in range(0,len(genes),CHUNK_SIZE):
        number=start//CHUNK_SIZE; end=min(start+CHUNK_SIZE,len(genes))
        payload={'schemaVersion':'0.1.0','sourceSha256':SOURCE_SHA,'chunk':number,'nucleusCount':923,'firstFeatureRow':start+1,'features':[[j+1,genes[j],dense[j].tolist()] for j in range(start,end)]}
        plain=(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n').encode(); packed=gzip.compress(plain,mtime=0,compresslevel=9);packed=packed[:9]+b'\xff'+packed[10:]
        path=f'{OUT}/counts-{number:03d}.json.gzip';files[path]=packed
        chunks.append({'index':number,'firstFeatureRow':start+1,'featureCount':end-start,'path':path,'url':'/'+path.removeprefix('public/'),'bytes':len(packed),'sha256':sha(packed),'decodedBytes':len(plain),'decodedSha256':sha(plain)})
    after=source.stat();require((before.st_size,before.st_mtime_ns,before.st_ino)==(after.st_size,after.st_mtime_ns,after.st_ino),'Source changed during extraction')
    inputs=[{'path':f,'bytes':(ROOT/f).stat().st_size,'sha256':digest(ROOT/f)} for f in (REGISTRY,ROSTER)]
    doc={'schemaVersion':'0.1.0','source':{'accession':'GSE318731','fileName':SOURCE_NAME,'url':SOURCE_URL,'bytes':SOURCE_BYTES,'sha256':SOURCE_SHA,'matrixLocator':'assays$RNA@layers$counts','matrixClass':'dgCMatrix','assayClass':'Assay5','layer':'counts','dimensionNames':'source Assay5 cells/features LogMaps; matrix Dimnames are NULL'},
        'sourceAudit':{'dimensions':dims,'storedEntries':len(x),'storedZeros':int(np.count_nonzero(x == 0)),'cellLogMap':cell_map,'featureLogMap':gene_map,'rnaCellNamesExactlyEqualMetadataRowNamesInOrder':True,'all3199ColumnSumsMatchMetadataNCountRna':True,'all3199DetectionCountsMatchMetadataNFeatureRna':True,'sourceFileStableDuringExtraction':True},
        'scope':{'group':'CHOL_IN','profileCount':11,'nucleusCount':923,'featureCount':len(genes),'excludedOtherCholNuclei':2276,'selectedCountSum':sum(n['totalRnaCount'] for n in nuclei),'selectedDetectedEntries':int(np.count_nonzero(dense)),'unit':'source RNA counts','zeroMeaning':'Undetected in this deposited counts layer, not biological absence','normalization':'none; raw counts are sensitive to library depth','rnaCountsToMetadataNamedMappingVerified':True,'rnaAtacPairingVerified':False,'samePhysicalCellAcrossSources':False,'markerOrDifferentialExpressionClaim':False,'geometryClaim':False,'lifeStage':'P56 source dataset context only'},
        'genes':genes,'nuclei':nuclei,'profiles':profiles,'chunkSize':CHUNK_SIZE,'chunks':chunks,
        'reproduction':{'builderPath':'tools/build_cano_chol_rna_counts.py','builderSha256':digest(Path(__file__)),'sourcePath':str(source.relative_to(ROOT)) if source.is_relative_to(ROOT) else None,'inputs':inputs,'runtime':{'python':platform.python_version(),'numpy':np.__version__,'rdata':rdata.__version__,'parserSha256':digest(Path(_parser.__file__))},'definitions':['https://satijalab.github.io/seurat-object/reference/Assay5-class.html','https://stat.ethz.ch/R-manual/R-devel/library/Matrix/html/dgCMatrix-class.html']},
        'rights':'Local research derivative. Original RDS is retained once outside public/. Original GEO files and article licensing are separate; no remote publication is performed.'}
    files[DOC]=(json.dumps(doc,ensure_ascii=False,indent=2)+'\n').encode()
    for path,b in files.items():
        target=ROOT/path
        if write: target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
        else: require(target.read_bytes() == b,'Derived replay differs: '+path)
    result={'features':len(genes),'nuclei':923,'profiles':11,'chunks':len(chunks),'countSum':doc['scope']['selectedCountSum'],'selectedNonzeroEntries':doc['scope']['selectedDetectedEntries'],'totalCompressedBytes':sum(r['bytes'] for r in chunks),'allSourceColumnsReplayed':3199,'exactRetainedRosterRows':923,'mode':'write' if write else 'exact_replay'}
    print(json.dumps(result));return result

if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source-file',type=Path,required=True);p.add_argument('--site-packages',type=Path);p.add_argument('--write',action='store_true');a=p.parse_args()
    if a.site_packages: sys.path.insert(0,str(a.site_packages.resolve()))
    build(a.source_file,a.write)
