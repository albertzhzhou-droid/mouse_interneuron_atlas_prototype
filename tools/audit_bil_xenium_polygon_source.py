#!/usr/bin/env python3
"""Replay retained original ZIP intervals and compare every boundary vertex offline.

Use the same numpy/numcodecs/pyarrow versions as I21. No requests, tolerance,
coordinate conversion, display derivative, section inference or admission.
"""
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys
import zipfile
import numpy as np
import numcodecs
import pyarrow as pa
import pyarrow.parquet as pq
from audit_bil_xenium_coordinate_source import OriginalZipRanges, read_array, check

ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT / 'data/source-candidates/bil-xenium-polygons-20261002'
OUTPUT = ROOT / 'data/bil-xenium-polygon-source-audit-0.1.json'
FOLDER = 'Run8_Slide2_Mus_M7_F7'

def load(p): return json.loads(p.read_text())
def pin(p):
    b=p.read_bytes();return {'path':str(p.relative_to(ROOT)), 'bytes':len(b), 'sha256':hashlib.sha256(b).hexdigest()}
def verify(row):
    p=ROOT/row.get('path',row.get('extractedPath')); b=p.read_bytes()
    check(len(b)==row['bytes'] and hashlib.sha256(b).hexdigest()==row['sha256'], 'Pinned original input changed')
    return b

class PolygonRanges(OriginalZipRanges):
    def __init__(self):
        super().__init__(ROOT/'data/source-candidates/bil-xenium-source-gate-20261001/cells-zarr-coordinate-inputs')
        receipt=load(DIR/'receipt.json')
        check(receipt['sourceObjectKey']=='BIL:ace-pie-cot' and receipt['directoryFolder']==FOLDER and receipt['archiveBytesDeclaredAndRangeChecked']==self.size and receipt['sourceUrl']=='https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/'+FOLDER+'/cells.zarr.zip', 'Exact polygon archive identity differs')
        check(receipt['wholeArchiveDownloaded'] is False and receipt['wholeArchiveSha256'] is None and receipt['doesNotAuthorizeGeometry'] is True, 'Partial archive admission overclaim')
        for row in receipt['rangeReceipts']:
            b=verify(row);check(len(b)==row['rangeEnd']-row['rangeStart']+1, 'Interval size differs')
            self.ranges.append((row['rangeStart'],row['rangeEnd']+1,b))

def compare_boundary(z, index, ids, attrs, parquet_path):
    base=f'polygon_sets/{index}'; name=attrs['polygon_set_names'][index]
    arrays={k:read_array(z,base+'/'+k) for k in ['vertices','num_vertices','cell_index','method']}
    vertices=arrays['vertices']; counts=arrays['num_vertices']; parents=arrays['cell_index']; methods=arrays['method']
    polygons=len(counts)
    check(vertices.shape==(polygons,50) and counts.shape==parents.shape==methods.shape==(polygons,), 'Polygon array shapes differ')
    check(np.all((counts>=4)&(counts<=25)) and np.all(parents<len(ids)) and np.all(methods<len(attrs['segmentation_methods'])), 'Invalid source polygon count/parent/method')
    points=vertices.reshape((polygons,25,2)); active=np.arange(25)[None,:]<counts[:,None]
    expected=points[active]
    check(np.isfinite(expected).all(), 'Nonfinite original active polygon coordinate')
    closure=np.all(points[:,0,:]==points[np.arange(polygons),counts-1,:],axis=1)
    table=pq.read_table(parquet_path)
    check(table.column_names==['cell_id','vertex_x','vertex_y','label_id'], 'Boundary schema changed')
    labels=table.column('label_id').combine_chunks().to_numpy()
    expected_labels=np.repeat(np.arange(1,polygons+1),counts)
    label_mismatch=int(np.count_nonzero(labels!=expected_labels)) if len(labels)==len(expected_labels) else None
    check(label_mismatch==0, 'Source per-file label_id-to-polygon-row mapping differs')
    dictionary=table.column('cell_id').combine_chunks().dictionary_encode()
    dictionary_ids=dictionary.dictionary.to_pylist(); dictionary_codes={cell:i for i,cell in enumerate(dictionary_ids)}
    check(set(dictionary_ids).issubset(set(ids)), 'Unknown boundary parent cell')
    check(all(ids[int(i)] in dictionary_codes for i in parents), 'Exact full-string parent cell ID differs')
    parent_codes=np.array([dictionary_codes[ids[int(i)]] for i in parents],dtype=np.int32)
    parent_mismatch=int(np.count_nonzero(dictionary.indices.to_numpy()!=np.repeat(parent_codes,counts)))
    check(parent_mismatch==0, 'Exact full-string parent cell ID differs')
    axis=[]
    for j,column in enumerate(['vertex_x','vertex_y']):
        source=table.column(column).combine_chunks().to_numpy()
        check(len(source)==len(expected), 'Native active vertex row count differs')
        difference=int(np.count_nonzero(source!=expected[:,j]))
        axis.append({'parquetColumn':column,'comparedVertexRows':len(source),'exactEqualRows':len(source)-difference,'differentRows':difference,'maxAbsoluteDifference':float(np.max(np.abs(source.astype(np.float64)-expected[:,j].astype(np.float64)))),'parquetDtype':str(source.dtype),'zarrDtype':str(vertices.dtype),'comparison':'native values; no cast to float32, rounding, tolerance, reordering or inferred transform'})
    check(all(r['differentRows']==0 for r in axis), 'Original boundary coordinate equality not proven')
    sample=[]
    for i in sorted(set([0,min(1,polygons-1),polygons-1])):
        sample.append({'polygonIndexZeroBased':i,'perFileLabelId':i+1,'cellIndexZeroBased':int(parents[i]),'cellId':ids[int(parents[i])],'numVerticesIncludingClosure':int(counts[i]),'methodIndex':int(methods[i]),'methodNativeLabel':attrs['segmentation_methods'][int(methods[i])],'firstVertexNativeXY':points[i,0].astype(float).tolist(),'lastVertexNativeXY':points[i,int(counts[i])-1].astype(float).tolist()})
    layout={k:json.loads(z.read(base+'/'+k+'/.zarray')) for k in arrays}
    result={'polygonSetIndex':index,'polygonSetName':name,'sourceDisplayName':attrs['polygon_set_display_names'][index],'sourceDescription':attrs['polygon_set_descriptions'][index],'arrayLayouts':layout,'polygonCount':polygons,'activeVertexRows':int(counts.sum()),'closedExactlyPolygonCount':int(np.count_nonzero(closure)),'openPolygonCount':int(np.count_nonzero(~closure)),'perFileLabelJoinRule':'label_id equals polygon index zero based plus one; separately for each boundary file','differentLabelRows':label_mismatch,'parentCellIdJoinRule':'polygon cell_index points to original cell_id array; full-string cell_id compared on every Parquet vertex row','differentParentCellIdRows':parent_mismatch,'uniqueParentCellCount':len(set(parents.tolist())),'vertexCountDistribution':{str(k):int(v) for k,v in sorted(Counter(counts.tolist()).items())},'methodCounts':{attrs['segmentation_methods'][k]:int(v) for k,v in sorted(Counter(methods.tolist()).items())},'coordinateComparisons':axis,'nativeCoordinateBounds':{'min':expected.min(axis=0).astype(float).tolist(),'max':expected.max(axis=0).astype(float).tolist()},'samplePolygons':sample,'paddedCoordinatesExcludedFromRowComparison':True,'paddedSlots':int(polygons*25-counts.sum())}
    check(result['openPolygonCount']==0, 'Original polygon closure differs')
    return result,parents,methods

def main():
    check(numcodecs.__version__=='0.16.3' and pa.__version__=='21.0.0', 'Pinned source decoder changed')
    coordinate_path=ROOT/'data/bil-xenium-coordinate-source-audit-0.1.json';schema_path=ROOT/'data/bil-xenium-geometry-schema-audit-0.1.json'
    coordinate=load(coordinate_path);schema=load(schema_path)
    dependencies=[pin(coordinate_path),pin(schema_path),*coordinate['sourceInputs'],*coordinate['priorSourceDependencies']]
    seen={};dependencies=[seen.setdefault(r['path'],r) for r in dependencies if r['path'] not in seen]
    for row in dependencies:verify(row)
    receipt=load(DIR/'receipt.json');verify(receipt['priorCoordinateReceipt'])
    check(len(receipt['selectedEntryReceipts'])==163 and receipt['rangeTransferBytes']<=receipt['rangeBudgetBytes']==52_000_000, 'Polygon range inventory or budget differs')
    with zipfile.ZipFile(PolygonRanges()) as z:
        selected=sorted(i.filename for i in z.infolist() if i.filename.startswith('polygon_sets/'))
        check(selected==sorted(r['entry'] for r in receipt['selectedEntryReceipts']), 'Incomplete original polygon inventory')
        for row in receipt['selectedEntryReceipts']:
            b=z.read(row['entry']);check(b==verify(row) and f'{z.getinfo(row["entry"]).CRC:08x}'==row['centralDirectoryCrc32'] and row['entryCrcVerifiedByZipReader'] is True,'Selected entry differs from original ZIP ranges/CRC')
        attrs=json.loads(z.read('.zattrs')); ids_array=read_array(z,'cell_id')
        check(attrs['polygon_set_names']==['nucleus','cell'] and attrs['spatial_units']=='microns' and attrs['number_cells']==182698, 'Original units/set semantics/count differ')
        ids=[''.join(chr(97+int(c,16)) for c in f'{int(prefix):08x}')+'-'+str(int(suffix)) for prefix,suffix in ids_array]
        check(len(ids)==len(set(ids))==182698, 'Unique original cell roster changed')
        raw=ROOT/f'data/source-candidates/bil-xenium-geometry-20260930/{FOLDER}'
        nucleus,nucleus_parents,nucleus_methods=compare_boundary(z,0,ids,attrs,raw/'nucleus_boundaries.parquet')
        cell,cell_parents,cell_methods=compare_boundary(z,1,ids,attrs,raw/'cell_boundaries.parquet')
    cells=pq.read_table(raw/'cells.parquet');order={s:i for i,s in enumerate(ids)}
    target=np.array([order[s] for s in cells.column('cell_id').to_pylist()])
    counted=np.bincount(nucleus_parents,minlength=len(ids)); reported=cells.column('nucleus_count').combine_chunks().to_numpy()
    counts_different=int(np.count_nonzero(counted[target]!=reported));check(counts_different==0,'Source nucleus_count-to-polygon-parent aggregation differs')
    check(len(np.unique(cell_parents))==len(ids),'Cell polygon parent coverage differs')
    method_by_cell=np.zeros(len(ids),dtype=np.uint32);method_by_cell[cell_parents]=cell_methods
    native_methods=cells.column('segmentation_method').to_pylist()
    method_different=sum(native!=attrs['segmentation_methods'][int(method_by_cell[i])] for native,i in zip(native_methods,target))
    check(method_different==0,'Source cell segmentation method differs')
    multiple=np.bincount(counted); zero=int(np.count_nonzero(counted==0)); multi=int(np.count_nonzero(counted>1))
    distinct_labels=load(schema_path)['idJoins']['crossFileLabelIdDifferentCellCount']
    result={'schemaVersion':'0.1.0','auditId':'bil-xenium-polygon-source-audit-0.1','checkedDate':'2026-10-02','sourceObjectKey':'BIL:ace-pie-cot','directoryFolder':FOLDER,'collectionDoi':coordinate['collectionDoi'],'manifestIdentity':coordinate['manifestIdentity'],'scope':'exact_run_original_polygon_coordinate_audit_not_section_pilot','sourceInputs':[pin(p) for p in sorted(DIR.iterdir()) if p.is_file()],'priorSourceDependencies':dependencies,'formatDocumentation':{'reviewedUrl':'https://www.10xgenomics.com/support/software/xenium-onboard-analysis/2.0/analysis/outputs/xoa-output-zarr','reviewedDate':'2026-10-02','reviewedVersion':'XOA 2.0 polygon_sets format description; exact source layouts independently replayed','retainedRemoteHtml':False,'interpretation':'Polygon coordinates are physical micrometres; polygon_sets cell_index identifies parent source cell; polygon boundaries simplify segmentation masks and are visualization approximations.'},'coordinateEvidence':{'sourceDeclaredUnits':'microns','sourceLocator':'cells.zarr.zip::.zattrs#/spatial_units','archiveVersion':coordinate['coordinateEvidence']['archiveVersion'],'archiveCellCount':len(ids),'boundaryPhysicalUnitSupported':'um','parquetFilesHaveTheirOwnUnitMetadata':False,'boundaryCoordinateEqualityToZarrChecked':True,'polygonSets':[nucleus,cell],'outlineToCellTransform':None,'sectionCoordinateFrame':None,'atlasRegistration':None,'anatomicalAxisOrientation':None,'observedMembraneOrThreeDimensionalAnatomyEstablished':False},'parentEvidence':{'exactCellIdRosterCount':len(ids),'sourceNucleusCountComparedCells':len(ids),'differentNucleusCountCells':counts_different,'cellsWithoutNucleusPolygon':zero,'cellsWithMultipleNucleusPolygons':multi,'nucleusCountDistribution':{str(i):int(n) for i,n in enumerate(multiple) if n},'cellSegmentationMethodComparedCells':len(ids),'differentCellSegmentationMethodCells':method_different,'nucleusMethodsRemainSeparateFromParentCellMethods':True,'crossFileSharedLabelIdsPointingToDifferentCells':distinct_labels,'crossFileLabelIdsMustNotBeJoinKeys':True},'rights':coordinate['rights'],'admission':{'disposition':'local_original_polygon_audit_only','geometryViewerAdmission':False,'sectionLinkedCellNucleusGeometryCount':0,'interneuronObjects':0,'threeDimensionalCellObjects':0,'atlasRegistrations':0,'sameCellMorphologyJoins':0,'fullGoalComplete':False},'remainingGates':coordinate['remainingGates'],'archiveIntegrityScope':{'wholeArchiveDownloaded':False,'wholeArchiveSha256':None,'selectedPolygonEntries':len(selected),'selectedPolygonEntryPayloadBytes':sum(r['bytes'] for r in receipt['selectedEntryReceipts']),'selectedLocalIntervalBytes':receipt['rangeTransferBytes'],'selectedEntriesReplayedFromOriginalRanges':True,'selectedEntryZipCrcsVerified':True,'unacquiredMaskArrayBytesClaimedVerified':False,'renderedGeometryBytesClaimedVerified':False},'reader':{'numpy':np.__version__,'numcodecs':numcodecs.__version__,'pyarrow':pa.__version__}}
    rendered=json.dumps(result,ensure_ascii=False,indent=2,allow_nan=False)+'\n'
    if '--check' in sys.argv:check(OUTPUT.read_text()==rendered,'Polygon audit differs from original-source replay')
    else:OUTPUT.write_text(rendered)
    print(json.dumps({'mode':'checked' if '--check' in sys.argv else 'wrote','polygonGroups':nucleus['polygonCount']+cell['polygonCount'],'vertexRows':nucleus['activeVertexRows']+cell['activeVertexRows'],'sourceInputs':len(result['sourceInputs']),'priorDependencies':len(dependencies),'differentCoordinateRows':sum(r['differentRows'] for s in [nucleus,cell] for r in s['coordinateComparisons']),'geometryAdmission':False}))

if __name__=='__main__':main()
