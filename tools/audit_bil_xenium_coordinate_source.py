#!/usr/bin/env python3
"""Reconcile exact BIL cell coordinates from retained original ZIP ranges, offline.

Requires Python 3.12, numpy, numcodecs 0.16.3 and pyarrow 21.0.0.
No remote requests, geometry publication, inferred sections or cell-type assignment.
"""
import hashlib, html, io, itertools, json, math, re, sys, zipfile
from pathlib import Path
import numpy as np
import numcodecs
import pyarrow as pa
import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parent.parent
CANDIDATE = ROOT / 'data/source-candidates/bil-xenium-source-gate-20261001'
OUTPUT = ROOT / 'data/bil-xenium-coordinate-source-audit-0.1.json'
FOLDER = 'Run8_Slide2_Mus_M7_F7'

def digest(data): return hashlib.sha256(data).hexdigest()
def read_json(path): return json.loads(path.read_text())
def check(condition, reason):
    if not condition: raise ValueError(reason)

class OriginalZipRanges(io.RawIOBase):
    """Read only acquired exact original intervals; uncovered bytes fail closed."""
    def __init__(self, folder):
        receipt = read_json(folder / 'receipt.json')
        check(receipt['wholeArchiveDownloaded'] is False and receipt['wholeArchiveSha256'] is None, 'Do not claim a whole archive checksum')
        self.size = receipt['archiveBytesDeclaredAndRangeChecked']; self.pos = 0; self.ranges = []
        for r in receipt['rangeReceipts']:
            data = (ROOT / r['path']).read_bytes()
            check(len(data) == r['bytes'] == r['rangeEnd']-r['rangeStart']+1 and digest(data)==r['sha256'], 'Original range bytes changed')
            self.ranges.append((r['rangeStart'], r['rangeEnd']+1, data))
    def readable(self): return True
    def seekable(self): return True
    def tell(self): return self.pos
    def seek(self, offset, whence=0):
        self.pos = offset if whence==0 else self.pos+offset if whence==1 else self.size+offset
        check(0 <= self.pos <= self.size, 'ZIP seek outside source'); return self.pos
    def read(self, n=-1):
        if n < 0: n=self.size-self.pos
        end=min(self.size,self.pos+n); chunks=[]
        while self.pos < end:
            available=[r for r in self.ranges if r[0] <= self.pos < r[1]]
            check(available, 'Requested bytes were never acquired')
            start, stop, data=max(available,key=lambda r:r[1]); size=min(stop,end)-self.pos
            chunks.append(data[self.pos-start:self.pos-start+size]); self.pos+=size
        return b''.join(chunks)

def read_array(z, name):
    meta=json.loads(z.read(name+'/.zarray')); shape=meta['shape']; chunks=meta['chunks']; dtype=np.dtype(meta['dtype'])
    check(meta['zarr_format']==2 and meta['filters'] is None and meta['order']=='C', 'Unsupported source array layout')
    check(meta['compressor']['id']=='blosc', 'Unexpected source compression')
    array=np.zeros(shape,dtype=dtype); codec=numcodecs.get_codec(meta['compressor'])
    for indices in itertools.product(*(range(math.ceil(s/c)) for s,c in zip(shape,chunks))):
        blob=z.read(name+'/'+'.'.join(map(str,indices)))
        decoded=codec.decode(blob); chunk=np.frombuffer(decoded,dtype=dtype)
        check(chunk.size==math.prod(chunks), 'Decompressed source chunk size changed')
        chunk=chunk.reshape(chunks)
        source_slices=tuple(slice(0,min(c,s-i*c)) for s,c,i in zip(shape,chunks,indices))
        output_slices=tuple(slice(i*c,min((i+1)*c,s)) for s,c,i in zip(shape,chunks,indices))
        array[output_slices]=chunk[source_slices]
    return array

def main():
    check(numcodecs.__version__=='0.16.3' and pa.__version__=='21.0.0', 'Decoder version changed')
    schema=read_json(ROOT/'data/bil-xenium-geometry-schema-audit-0.1.json')
    experiment=read_json(ROOT/f'data/source-candidates/bil-xenium-20260929/{FOLDER}/experiment.xenium')
    with zipfile.ZipFile(OriginalZipRanges(CANDIDATE/'cells-zarr-coordinate-inputs')) as z:
        attrs=json.loads(z.read('.zattrs')); column_meta=json.loads(z.read('cell_summary/.zattrs'))
        ids=read_array(z,'cell_id'); summary=read_array(z,'cell_summary'); transform=read_array(z,'masks/homogeneous_transform')
        check(attrs['spatial_units']=='microns' and attrs['number_cells']==182698, 'Original units/count changed')
        check(ids.shape==(182698,2) and summary.shape==(182698,8), 'Original array shapes changed')
        names=column_meta['column_names']; check(len(names)==8 and len(set(names))==8,'Ambiguous coordinate fields')
        string_ids=[''.join(chr(97+int(c,16)) for c in f'{int(prefix):08x}')+'-'+str(int(suffix)) for prefix,suffix in ids]
        check(len(set(string_ids))==182698,'Duplicate source cell IDs')
        rows={cell:i for i,cell in enumerate(string_ids)}
        parquet=pq.read_table(ROOT/f'data/source-candidates/bil-xenium-geometry-20260930/{FOLDER}/cells.parquet')
        parquet_ids=parquet.column('cell_id').to_pylist(); check(len(parquet_ids)==182698 and set(parquet_ids)==set(string_ids),'Exact cell ID sets differ')
        order=np.array([rows[cell] for cell in parquet_ids],dtype=np.int64)
        pairs={'x_centroid':'cell_centroid_x','y_centroid':'cell_centroid_y','cell_area':'cell_area','nucleus_area':'nucleus_area','nucleus_count':'nucleus_count'}
        comparisons=[]
        for column,source_column in pairs.items():
            a=np.asarray(parquet.column(column).to_pylist(),dtype=np.float64);b=summary[order,names.index(source_column)]
            finite=np.isfinite(a)&np.isfinite(b);equal=(a==b)|(np.isnan(a)&np.isnan(b));delta=np.abs(a[finite]-b[finite])
            comparisons.append({'parquetColumn':column,'zarrColumn':source_column,'joinedBy':'exact source cell_id','comparedRows':len(a),'exactEqualRows':int(np.count_nonzero(equal)),'differentRows':int(np.count_nonzero(~equal)),'bothFiniteRows':int(np.count_nonzero(finite)),'bothNaNRows':int(np.count_nonzero(np.isnan(a)&np.isnan(b))),'maxAbsoluteDifferenceWhereBothFinite':float(delta.max()) if len(delta) else None})
        check(all(r['differentRows']==0 for r in comparisons if r['parquetColumn'] in ['x_centroid','y_centroid']),'Source centroid equality not proven')
        declared=transform.astype(float).tolist(); expected_scale=1/experiment['pixel_size']
        check(transform.shape==(4,4) and np.isfinite(transform).all(), 'Invalid source transform')
        transform_info={'entry':'masks/homogeneous_transform','dtype':'<f4','matrixRowMajor':declared,'scope':'source cell segmentation physical coordinates to stitched image pixels; not outline/section or atlas transform','experimentPixelSize':experiment['pixel_size'],'reciprocalPixelSize':expected_scale,'storedScaleMinusReciprocalPixelSize':float(transform[0,0])-expected_scale,'axesOrientationOrAnatomicalDirection':None}
    with zipfile.ZipFile(CANDIDATE/'analysis.zarr.zip') as z:
        check(z.testzip() is None,'Secondary analysis ZIP CRC mismatch')
        attrs_analysis=json.loads(z.read('cell_groups/.zattrs')); groupings=[]
        for i,name in enumerate(attrs_analysis['grouping_names']):
            indices=read_array(z,f'cell_groups/{i}/indices');indptr=read_array(z,f'cell_groups/{i}/indptr'); labels=attrs_analysis['group_names'][i]
            check(len(labels)==len(indptr)-1 and int(indptr[0])==0 and int(indptr[-1])==len(indices),'Cluster offsets differ')
            check(np.all(indptr[1:]>=indptr[:-1]) and np.all(indices<182698) and len(np.unique(indices))==len(indices),'Invalid automated cluster indices')
            groupings.append({'sourceName':name,'groupNames':labels,'assignedCellIndexCount':len(indices),'unassignedCellIndexCount':182698-len(indices),'clusterCellCounts':[int(v) for v in np.diff(indptr)],'isCuratedBiologicalType':False})
    current_api=read_json(CANDIDATE/'dataset-api.json')['retjson'][0]['Dataset'][0]
    check(current_api['rightsidentifier']=='CC-BY-4.0' and current_api['bildirectory'].endswith('/'+FOLDER), 'Current exact dataset rights/directory differs')
    web=(CANDIDATE/'dataset-web.html').read_text()
    check('class="license-badge" href="https://creativecommons.org/licenses/by/4.0/"' in web, 'Dataset page license not present')
    policy=(CANDIDATE/'site-distribution-policy.html').read_text()
    check('BIL Data is distributed under the Creative Commons Attribution-ShareAlike 4.0 International License.' in ' '.join(html.unescape(re.sub(r'<[^>]*>', ' ', policy)).split()), 'Site distribution policy differs')
    inputs=[]
    for p in sorted(p for p in CANDIDATE.rglob('*') if p.is_file() and p.name!='first-restricted-network-attempt.json'):
        data=p.read_bytes();inputs.append({'path':str(p.relative_to(ROOT)),'bytes':len(data),'sha256':digest(data)})
    for source in schema['sourceFiles']+schema['dependencyReceipts']:
        p=ROOT/source['path'];data=p.read_bytes();check(len(data)==source['bytes'] and digest(data)==source['sha256'],'Prior original dependency changed')
    result={'schemaVersion':'0.1.0','auditId':'bil-xenium-coordinate-source-audit-0.1','checkedDate':'2026-10-01','sourceObjectKey':'BIL:ace-pie-cot','directoryFolder':FOLDER,'collectionDoi':'10.35077/g.1196','manifestIdentity':schema['manifestIdentity'],'scope':'exact_run_original_coordinate_entries_not_section_pilot','sourceInputs':inputs,'priorSourceDependencies':schema['sourceFiles']+schema['dependencyReceipts'],'coordinateEvidence':{'sourceDeclaredUnits':'microns','sourceLocator':'cells.zarr.zip::.zattrs#/spatial_units','archiveVersion':{'major':attrs['major_version'],'minor':attrs['minor_version']},'archiveCellCount':attrs['number_cells'],'cellIdShape':list(ids.shape),'cellSummaryShape':list(summary.shape),'cellSummaryColumns':names,'exactCellIdJoinCount':182698,'duplicateCellIds':0,'missingParquetCellIds':0,'missingZarrCellIds':0,'fieldComparisons':comparisons,'cellCentroidUnitSupported':'um','parquetFilesHaveTheirOwnUnitMetadata':False,'boundaryCoordinateEqualityToZarrNotChecked':True,'sourceTransform':transform_info,'outlineToCellTransform':None,'sectionCoordinateFrame':None,'atlasRegistration':None},'secondaryAnalysis':{'zipCrcsVerified':True,'groupings':groupings,'curatedCellTypeAssignments':0,'doesNotAuthorizeInterneuronLabels':True},'fovMetadata':{'morphologyFovCount':len(read_json(CANDIDATE/'morphology-fov-locations.json')['fov_locations']),'overviewFovCount':len(read_json(CANDIDATE/'overview-scan-fov-locations.json')['fov_locations']),'doesNotEstablishSections':True},'rights':{'datasetApiLicense':'CC-BY-4.0','datasetWebLicense':'CC-BY-4.0','siteDistributionLicense':'CC-BY-SA-4.0','policyDifferenceResolved':False},'admission':{'disposition':'local_original_coordinate_audit_only','geometryViewerAdmission':False,'sectionLinkedCellNucleusGeometryCount':0,'interneuronObjects':0,'threeDimensionalCellObjects':0,'atlasRegistrations':0,'sameCellMorphologyJoins':0,'fullGoalComplete':False},'remainingGates':schema['remainingGates'],'archiveIntegrityScope':{'wholeArchiveDownloaded':False,'wholeArchiveSha256':None,'selectedEntriesReplayedFromOriginalRanges':True,'selectedEntryZipCrcsVerified':True,'unacquiredMaskOrPolygonArrayBytesClaimedVerified':False},'reader':{'numpy':np.__version__,'numcodecs':numcodecs.__version__,'pyarrow':pa.__version__}}
    rendered=json.dumps(result,ensure_ascii=False,indent=2,allow_nan=False)+'\n'
    if '--check' in sys.argv:check(OUTPUT.read_text()==rendered,'Coordinate audit differs from original-source replay')
    else:OUTPUT.write_text(rendered)
    print(json.dumps({'mode':'checked' if '--check' in sys.argv else 'wrote','exactCellIds':182698,'fieldComparisons':comparisons,'sourceInputs':len(inputs),'automatedGroupings':len(groupings),'geometryAdmission':False}))
if __name__=='__main__':main()
