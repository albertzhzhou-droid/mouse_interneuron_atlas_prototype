#!/usr/bin/env python3
"""Actual source metadata parser and numeric failure checks, without source writes."""
import json
import struct
import unittest
import numpy as np
import audit_bil_xenium_ome_metadata as audit
from bil_xenium_ome_metadata import inspect_first_ifd

class ImageMetadataChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.receipt = json.loads((audit.CANDIDATE / 'receipt.json').read_text())
        cls.reader = audit.OriginalMetadataRanges(cls.receipt)
        cls.xml = (audit.CANDIDATE / 'first-ifd-ome.xml').read_bytes()
        cls.outlines = (audit.ROOT / f'data/source-candidates/bil-xenium-20260929/{audit.FOLDER}/coordinates.csv').read_text()
    def parse(self, mutate=None):
        def read(start, length, purpose):
            data = self.reader.read(start, length, purpose)
            return mutate(start, data, purpose) if mutate else data
        return inspect_first_ifd(read, audit.SIZE)
    def test_exact_source_first_ifd_and_xml_replay(self):
        metadata, xml = self.parse()
        self.assertEqual(metadata, self.receipt['metadata']); self.assertEqual(xml.encode(), self.xml)
        self.assertEqual(metadata['ome']['pixelsAttributes']['PhysicalSizeX'], '0.2125')
    def test_unacquired_image_tile_cannot_be_read(self):
        with self.assertRaisesRegex(ValueError, 'unacquired'):
            self.reader.read(1_000_000, 1, 'image tile')
    def test_wrong_magic_fails(self):
        with self.assertRaisesRegex(ValueError, 'TIFF/BigTIFF'):
            self.parse(lambda start, data, _purpose: data[:2] + b'xx' + data[4:] if start == 0 else data)
    def test_pointer_outside_original_file_fails(self):
        with self.assertRaisesRegex(ValueError, 'first IFD offset'):
            self.parse(lambda start, data, _purpose: data[:8] + struct.pack('<Q', audit.SIZE) if start == 0 else data)
    def test_ome_and_tiff_dimension_disagreement_fails(self):
        with self.assertRaisesRegex(ValueError, 'dimensions disagree'):
            self.parse(lambda _start, data, purpose: data.replace(b'SizeX="54030"', b'SizeX="54031"') if purpose == 'first IFD tag 270' else data)
    def test_xml_entity_declaration_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'XML entities'):
            self.parse(lambda _start, data, purpose: b'<!DOCTYPE OME>' + data[14:] if purpose == 'first IFD tag 270' else data)
    def test_centroid_bounds_do_not_round_or_clamp(self):
        matrix = np.diag([4.7058820724487305,4.7058820724487305,1,1])
        xy = np.array([[-0.01, 1], [11481.5, 1], [1, 1]])
        result = audit.cell_image_bounds(xy,matrix,54030,112160,0.2125)
        self.assertEqual(result['outsideImageCount'],2);self.assertEqual(result['insideImageCount'],1)
        self.assertLess(result['sourceMatrixImageBoundsPixels']['min'][0],0)
    def test_original_area_headers_replay_and_changed_area_fails(self):
        self.assertEqual(len(audit.outline_area_qc(self.outlines)),29)
        with self.assertRaisesRegex(ValueError, 'source header precision'):
            audit.outline_area_qc(self.outlines.replace('8490407.5','8490417.5'))
    def test_unsupported_homogeneous_transform_fails(self):
        matrix = np.eye(4);matrix[3,3] = 2
        with self.assertRaisesRegex(ValueError,'homogeneous divide'):
            audit.cell_image_bounds(np.array([[1,1]]),matrix,54030,112160,0.2125)

if __name__ == '__main__': unittest.main()
