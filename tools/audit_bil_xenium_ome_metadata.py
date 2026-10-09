#!/usr/bin/env python3
"""Offline exact-run metadata, cell-image bounds and named-outline area QC."""
import csv
import hashlib
import io
import json
import math
from pathlib import Path
import sys
import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq
from bil_xenium_ome_metadata import inspect_first_ifd, require

ROOT = Path(__file__).resolve().parent.parent
CANDIDATE = ROOT / 'data/source-candidates/bil-xenium-ome-20261002'
OUTPUT = ROOT / 'data/bil-xenium-image-metadata-audit-0.1.json'
FOLDER = 'Run8_Slide2_Mus_M7_F7'
URL = 'https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/' + FOLDER + '/morphology.ome.tif'
SIZE = 25_611_493_268

def digest(data): return hashlib.sha256(data).hexdigest()
def read_json(path): return json.loads(path.read_text())
def file_receipt(path):
    data = path.read_bytes()
    return {'path': str(path.relative_to(ROOT)), 'bytes': len(data), 'sha256': digest(data)}

class OriginalMetadataRanges:
    def __init__(self, receipt):
        require(receipt['sourceUrl'] == URL and receipt['sourceBytesDeclaredAndRangeChecked'] == SIZE, 'Wrong image source')
        require(receipt['wholeFileDownloaded'] is False and receipt['wholeFileSha256'] is None, 'No whole-image attestation permitted')
        require(sum(r['bytes'] for r in receipt['rangeReceipts']) == receipt['rangeTransferBytes'] <= 2_000_000, 'Metadata byte budget differs')
        require(len({r['responseHeaders']['ETag'] for r in receipt['rangeReceipts']}) == 1, 'Image versions differ across intervals')
        self.ranges = []
        for row in receipt['rangeReceipts']:
            data = (ROOT / row['path']).read_bytes()
            require(row['httpStatus'] == 206 and row['responseHeaders']['Content-Range'] == f"bytes {row['rangeStart']}-{row['rangeEnd']}/{SIZE}", 'Original HTTP206 interval differs')
            require(len(data) == row['bytes'] == row['rangeEnd'] - row['rangeStart'] + 1 and digest(data) == row['sha256'], 'Original metadata bytes changed')
            self.ranges.append((row['rangeStart'], row['rangeEnd'] + 1, data))
    def read(self, start, length, _purpose):
        for first, end, data in self.ranges:
            if first <= start and start + length <= end:
                return data[start - first:start - first + length]
        raise ValueError('Metadata request covers unacquired source bytes')

def outline_area_qc(text):
    rows = list(csv.reader(io.StringIO(text)))
    require(rows[0][0] == '#Selection names:' and rows[1][0].startswith('#Areas (µm^2):') and rows[2] == ['Selection', 'X', 'Y'], 'Original outline CSV header differs')
    names = [s.strip() for s in rows[0][1].split(',')]
    areas = [float(s) for s in rows[1][0].split(':', 1)[1].split(',')]
    require(len(names) == len(areas) == len(set(names)) == 29, 'Original outline name/area inventory differs')
    groups = {name: [] for name in names}
    for name, x, y in rows[3:]:
        require(name in groups and math.isfinite(float(x)) and math.isfinite(float(y)), 'Invalid original outline coordinate')
        groups[name].append((float(x), float(y)))
    result = []
    for name, declared in zip(names, areas):
        points = groups[name]
        require(len(points) >= 4 and points[0] == points[-1], 'Original outline not closed')
        origin = points[0]
        relative = [(x - origin[0], y - origin[1]) for x, y in points]
        computed = abs(math.fsum(a[0] * b[1] - b[0] * a[1] for a, b in zip(relative, relative[1:] + relative[:1]))) / 2
        result.append({'sourceName': name, 'vertexRows': len(points), 'closed': True, 'sourceHeaderAreaUm2': declared,
                       'shoelaceAreaNativeXY': computed, 'computedMinusHeaderArea': computed - declared,
                       'roundedToHeaderOneDecimalAgrees': round(computed, 1) == declared})
    require(all(row['roundedToHeaderOneDecimalAgrees'] for row in result), 'Outline area does not reproduce source header precision')
    return result

def cell_image_bounds(xy, matrix, width, height, physical_size):
    require(xy.ndim == 2 and xy.shape[1] == 2 and np.isfinite(xy).all(), 'Nonfinite source cell centroids')
    require(matrix.shape == (4, 4) and np.isfinite(matrix).all(), 'Invalid source physical-to-image matrix')
    homogeneous = np.column_stack([xy, np.zeros(len(xy)), np.ones(len(xy))])
    image = homogeneous @ matrix.T
    require(np.all(image[:, 3] == 1), 'Source transform requires an unsupported homogeneous divide')
    native = image[:, :2]
    outside = np.any((native < 0) | (native >= np.array([width, height])), axis=1)
    exact_scale_pixels = xy / physical_size
    return {'centroidCount': len(xy), 'finiteCentroidCount': len(xy), 'insideImageCount': int(np.count_nonzero(~outside)),
            'outsideImageCount': int(np.count_nonzero(outside)), 'physicalCentroidBoundsUm': {'min': xy.min(axis=0).tolist(), 'max': xy.max(axis=0).tolist()},
            'sourceMatrixImageBoundsPixels': {'min': native.min(axis=0).tolist(), 'max': native.max(axis=0).tolist()},
            'domain': '0 <= x < SizeX and 0 <= y < SizeY; continuous source pixel coordinates, no rounding or clamping',
            'maxAbsStoredMatrixVsExactCalibrationPixels': np.abs(native - exact_scale_pixels).max(axis=0).tolist(),
            'maskOverlapOrPixelAlignmentVerified': False, 'doesNotAssignSections': True}

def main():
    require(pa.__version__ == '21.0.0', 'Parquet decoder version changed')
    receipt = read_json(CANDIDATE / 'receipt.json')
    metadata, xml = inspect_first_ifd(OriginalMetadataRanges(receipt).read, SIZE)
    require(metadata == receipt['metadata'], 'Metadata differs from original range replay')
    require((CANDIDATE / 'first-ifd-ome.xml').read_bytes() == xml.encode('utf-8'), 'Extracted XML differs from source bytes')
    pixels = metadata['ome']['pixelsAttributes']
    experiment_path = ROOT / f'data/source-candidates/bil-xenium-20260929/{FOLDER}/experiment.xenium'
    outline_path = experiment_path.parent / 'coordinates.csv'
    experiment = read_json(experiment_path)
    require(experiment['images']['morphology_filepath'] == 'morphology.ome.tif', 'Manifest image path differs')
    require(float(pixels['PhysicalSizeX']) == float(pixels['PhysicalSizeY']) == experiment['pixel_size'] and float(pixels['PhysicalSizeZ']) == experiment['z_step_size'], 'OME/run calibration disagreement')
    require(pixels['PhysicalSizeXUnit'] == pixels['PhysicalSizeYUnit'] == pixels['PhysicalSizeZUnit'] == 'µm', 'OME physical unit differs')
    coordinates = read_json(ROOT / 'data/bil-xenium-coordinate-source-audit-0.1.json')
    schema = read_json(ROOT / 'data/bil-xenium-geometry-schema-audit-0.1.json')
    require(coordinates['sourceObjectKey'] == schema['sourceObjectKey'] == 'BIL:ace-pie-cot', 'Original coordinate source differs')
    dependency_rows = coordinates['sourceInputs'] + coordinates['priorSourceDependencies']
    dependencies = {row['path']: {key: row[key] for key in ('path', 'bytes', 'sha256')} for row in dependency_rows}
    for row in dependencies.values():
        require(file_receipt(ROOT / row['path']) == row, 'Prior exact source dependency changed')
    cells_path = ROOT / f'data/source-candidates/bil-xenium-geometry-20260930/{FOLDER}/cells.parquet'
    table = pq.read_table(cells_path, columns=['cell_id', 'x_centroid', 'y_centroid'])
    ids = table.column('cell_id').to_pylist()
    require(len(ids) == len(set(ids)) == 182698, 'Exact source cell roster changed')
    xy = np.column_stack([table.column(c).to_numpy() for c in ('x_centroid', 'y_centroid')])
    matrix = np.asarray(coordinates['coordinateEvidence']['sourceTransform']['matrixRowMajor'], dtype=np.float64)
    bounds = cell_image_bounds(xy, matrix, int(pixels['SizeX']), int(pixels['SizeY']), experiment['pixel_size'])
    outlines = outline_area_qc(outline_path.read_text())
    inputs = [file_receipt(p) for p in sorted(CANDIDATE.iterdir()) if p.is_file()]
    for p in [experiment_path, outline_path, ROOT / 'data/bil-xenium-coordinate-source-audit-0.1.json', ROOT / 'data/bil-xenium-geometry-schema-audit-0.1.json']:
        dependencies[str(p.relative_to(ROOT))] = file_receipt(p)
    result = {'schemaVersion': '0.1.0', 'auditId': 'bil-xenium-image-metadata-audit-0.1', 'checkedDate': '2026-10-02',
              'sourceObjectKey': 'BIL:ace-pie-cot', 'directoryFolder': FOLDER, 'manifestIdentity': schema['manifestIdentity'],
              'scope': 'exact_run_original_image_metadata_and_numeric_consistency_not_pixel_alignment_or_section_pilot',
              'sourceInputs': inputs, 'priorSourceDependencies': sorted(dependencies.values(), key=lambda r: r['path']),
              'imageMetadata': metadata, 'sourceUrl': URL,
              'calibration': {'sourcePixelSizeXYUm': experiment['pixel_size'], 'sourceZStepUm': experiment['z_step_size'],
                              'omeAndManifestExactAgreement': True, 'storedSourcePhysicalToImageMatrix': matrix.tolist(),
                              'storedScaleMinusExactReciprocal': float(matrix[0, 0]) - 1 / experiment['pixel_size'],
                              'anatomicalAxisDirections': None, 'imageToNamedOutlineTransform': None,
                              'zPlaneCenterIndexSpanUm': (int(pixels['SizeZ']) - 1) * experiment['z_step_size'], 'sectionThicknessUm': None},
              'cellImageBounds': bounds,
              'outlineAreaConsistency': {'sourceHeaderUnit': 'µm^2', 'comparison': 'shoelace area at native double CSV precision, rounded to the header one decimal',
                                         'outlineCount': len(outlines), 'allHeaderAreasReproduced': True, 'outlines': outlines,
                                         'supportsDimensionalConsistencyOnly': True, 'commonOriginOrOrientationVerified': False,
                                         'cellToSectionAssignments': 0, 'donorAssignments': 0},
              'integrityScope': {'rangeTransferBytes': receipt['rangeTransferBytes'], 'rangeBudgetBytes': receipt['rangeBudgetBytes'],
                                 'rangeCount': len(receipt['rangeReceipts']), 'sourceBytesDeclaredAndRangeChecked': SIZE,
                                 'allSelectedMetadataReplayed': True, 'wholeFileDownloaded': False, 'wholeFileSha256': None,
                                 'imagePixelsRead': False, 'otherIfdsReplayed': False, 'pyramidPixelsVerified': False},
              'admission': {'disposition': 'local_original_image_metadata_audit_only', 'geometryViewerAdmission': False,
                            'sectionLinkedCellNucleusGeometryCount': 0, 'interneuronObjects': 0, 'threeDimensionalCellObjects': 0,
                            'atlasRegistrations': 0, 'sameCellMorphologyJoins': 0, 'fullGoalComplete': False},
              'remainingGates': schema['remainingGates'],
              'formatDocumentation': {'reviewedUrl': 'https://docs.openmicroscopy.org/ome-model/6.2.2/ome-tiff/specification.html',
                                      'scope': 'generic OME TIFF metadata interpretation; actual values are from exact-run retained bytes'},
              'reader': {'numpy': np.__version__, 'pyarrow': pa.__version__}}
    rendered = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    if '--check' in sys.argv:
        require(OUTPUT.read_text() == rendered, 'Image metadata audit differs from original source replay')
    else:
        OUTPUT.write_text(rendered)
    print(json.dumps({'mode': 'checked' if '--check' in sys.argv else 'wrote', 'metadataRangeBytes': receipt['rangeTransferBytes'],
                      'originalMetadataInputs': len(inputs), 'sourceDependencies': len(dependencies), 'cellBounds': bounds,
                      'outlineHeaderAreasReproduced': len(outlines), 'geometryAdmission': False}))

if __name__ == '__main__': main()
