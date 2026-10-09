#!/usr/bin/env python3
"""Expose exact retained GABA metadata assignments without classifying cells."""
from collections import Counter, defaultdict
from pathlib import Path
import argparse, gzip, hashlib, json, tempfile
from extract_cano_gomez_rds_metadata_stream import _table_dicts

ROOT = Path(__file__).resolve().parents[1]
SOURCE_NAME = 'GSE318731_P56_gabaergic_multiome.rds'
SOURCE_SHA = '700361c804806b521bb01aa58c263cd01b189fe03d3299aeef5806839a4f5f31'
META = 'data/source-extractions/cano-gomez-p56/GSE318731_P56_gabaergic_multiome.metadata.csv.gz'
AUDIT = 'data/source-extractions/cano-gomez-p56/GSE318731_P56_gabaergic_multiome.audit.json'
DATA = 'data/cano-gomez-gaba-source-labels-0.1.json'
ROSTER = 'public/data/cano_gomez_gaba_source_labels_v1/GSE318731_P56_gabaergic_metadata_assignments.jsonl.gzip'
FIELDS = ('nucleus_id', 'transmitter_class', 'group', 'neuron_type', 'source', 'anatomy', 'sex')
def sha(b): return hashlib.sha256(b).hexdigest()
def ordered(values): return sha(('\n'.join(values)+'\n').encode())
def counts(values):
    c=Counter(values)
    return [{'value':v,'count':c[v]} for v in sorted(c,key=lambda v:(v is not None,(v or '').encode()))]
def label_id(v): return 'cano.gaba.metadata-label.sha256.'+sha(v.encode())[:24]

def build():
    compressed=(ROOT/META).read_bytes(); plain=gzip.decompress(compressed)
    audit=json.loads((ROOT/AUDIT).read_text()); prior=audit['output']['metadataCsvGzip']
    if (audit['sourceSha256']!=SOURCE_SHA or audit['sourceBytes']!=1646402816 or
        audit['authorityMode']!='BASE_R_STREAM_META_DATA_ROW_ONLY' or audit['crossAssayCellIdentityVerified'] is not False or
        len(compressed)!=prior['compressedBytes'] or sha(compressed)!=prior['compressedSha256'] or
        len(plain)!=prior['uncompressedBytes'] or sha(plain)!=prior['uncompressedSha256']):
        raise ValueError('Exact retained source extraction or identity authority changed')
    with tempfile.TemporaryDirectory(prefix='ohri-gaba-source-labels-') as d:
        p=Path(d)/'source.csv';p.write_bytes(plain); rows=_table_dicts(p)
    if len(rows)!=73364 or any(tuple(row)!=FIELDS for row in rows): raise ValueError('Source width or row count changed')
    names=[row['nucleus_id'] for row in rows]
    if len(set(names))!=73364 or any(not n or '|' in n or '\n' in n for n in names): raise ValueError('Invalid source row names')
    if ordered(names)!=audit['identityChecks']['orderedMetadataRowNamesSha256']: raise ValueError('Source name order changed')
    grouped=defaultdict(list); roster=[]
    for index,row in enumerate(rows,1):
        if row['transmitter_class']!='GABA' or not row['neuron_type'] or not row['group']: raise ValueError('Source assignment missing')
        if row['source'] is not None or row['sex'] is not None: raise ValueError('Absent source/Sex fields were substituted')
        item={'sourceRow':index,'key':'GSE318731|'+SOURCE_NAME+'|'+row['nucleus_id'],'labelId':label_id(row['neuron_type']),'raw':row}
        roster.append(item);grouped[row['neuron_type']].append(item)
    labels=[{'id':label_id(v),'rawLabel':v,'nucleusCount':len(grouped[v]),
        'groupCounts':counts(r['raw']['group'] for r in grouped[v]),
        'contextCounts':{f:counts(r['raw'][f] for r in grouped[v]) for f in ('anatomy','source','sex')},
        'orderedCompoundNucleusKeysSha256':ordered(r['key'] for r in grouped[v])}
        for v in sorted(grouped,key=lambda v:v.encode())]
    if len(labels)!=204 or len({r['group'] for r in rows})!=24: raise ValueError('Source label/group count changed')
    raw=b''.join((json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n').encode() for r in roster)
    packed=gzip.compress(raw,compresslevel=9,mtime=0)
    # Gzip OS byte differs between Python versions; canonicalize the transport header.
    packed=packed[:9]+b'\xff'+packed[10:]
    inputs=[{'path':f,'bytes':len((ROOT/f).read_bytes()),'sha256':sha((ROOT/f).read_bytes())} for f in (META,AUDIT)]
    source={'accession':'GSE318731','fileName':SOURCE_NAME,'bytes':1646402816,'sha256':SOURCE_SHA,'url':audit['sourcePublicUrl'],'lifeStage':'P56','lifeStageScope':'source_dataset_context_not_per_nucleus_measurement','slot':'meta.data','labelColumn':'neuron_types','groupColumn':'groups','authorityMode':audit['authorityMode'],'originalRdsReacquiredThisIteration':False}
    document={'schemaVersion':'0.1.0','adapterId':'cano-gomez-p56-gaba-metadata-labels-0.1.0','parentSourceId':'SRC-CANOGOMEZ-2026','source':source,
        'identity':{'stableKeyExpression':'GSE318731|exact source filename|meta.data row.name','uniqueNonemptyNameCount':73364,'orderedSourceNucleusNamesSha256':ordered(names),'crossAssayCellIdentityVerified':False},
        'denominators':{'nucleusCount':73364,'sourceLabelCount':204,'sourceGroupCount':24,'confirmedInterneuronProfilesAdded':0},
        'sourceFields':{'source':{'sourceColumnPresent':False,'missingCount':73364,'reason':'source_meta_data_column_absent'},'sex':{'rawSourceColumn':'Sex','sourceColumnPresent':False,'missingCount':73364,'reason':'source_meta_data_column_absent'},'anatomy':{'sourceColumnPresent':True,'missingCount':sum(r['anatomy'] is None for r in rows)}},
        'groupCounts':counts(r['group'] for r in rows),'contextCounts':{f:counts(r[f] for r in rows) for f in ('anatomy','source','sex')},'labels':labels,
        'artifact':{'path':ROSTER,'publicUrl':'/'+ROSTER.removeprefix('public/'),'rowCount':73364,'compressedBytes':len(packed),'compressedSha256':sha(packed),'uncompressedBytes':len(raw),'uncompressedSha256':sha(raw),'rowOrder':'exact retained meta.data row.name order','contentEncoding':'gzip'},
        'reproduction':{'builderPath':'tools/build_cano_gomez_gaba_source_labels.py','builderSha256':sha(Path(__file__).read_bytes()),'inputs':inputs},
        'boundaries':{'confirmedInterneuronAdmission':False,'markerInferenceFromLabelTokens':False,'crossAssayCellIdentity':False,'crossSourceIdentity':False,'geometry':False,'internalStructures':False,'atlasRegistration':False,'donorIdentity':False,'sectionIdentity':False,
            'displayScope':'204 raw neuron_types labels from 73,364 GABA metadata rows; source groups and anatomical regions remain unmodified. No source-local interneuron or projection classification is added.',
            'rights':'Project-authored factual derivative for the local research application. Original GEO RDS remains unbundled and link-only; article license is not generalized to source RDS. Public redistribution requires separate review.'}}
    return document,packed

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    doc,packed=build();b=(json.dumps(doc,ensure_ascii=False,indent=2)+'\n').encode()
    if args.write:
        (ROOT/ROSTER).parent.mkdir(parents=True,exist_ok=True);(ROOT/ROSTER).write_bytes(packed);(ROOT/DATA).write_bytes(b)
    elif (ROOT/DATA).read_bytes()!=b or (ROOT/ROSTER).read_bytes()!=packed: raise ValueError('Deterministic derivative replay mismatch')
    print(json.dumps({'rows':73364,'labels':204,'groups':24,'summaryBytes':len(b),'rosterBytes':len(packed),'exactRetainedInputReplay':True}))
