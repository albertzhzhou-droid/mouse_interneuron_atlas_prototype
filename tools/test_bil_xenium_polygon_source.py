#!/usr/bin/env python3
"""Independent negative checks against retained source arrays; no original writes."""
import unittest
from unittest.mock import patch
import zipfile
import numpy as np
import pyarrow as pa
import audit_bil_xenium_polygon_source as audit

class PolygonSourceFailures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with zipfile.ZipFile(audit.PolygonRanges()) as z:
            cls.attrs=audit.json.loads(z.read('.zattrs'))
            ids=audit.read_array(z,'cell_id')
            cls.ids=[''.join(chr(97+int(c,16)) for c in f'{int(prefix):08x}')+'-'+str(int(suffix)) for prefix,suffix in ids]
            # Source first cell, all actual active vertices. Keep its original float32 data.
            cls.arrays={k:audit.read_array(z,'polygon_sets/1/'+k)[:1].copy() for k in ['vertices','num_vertices','cell_index','method']}
        n=int(cls.arrays['num_vertices'][0]);xy=cls.arrays['vertices'][0,:2*n].reshape(n,2)
        cell=cls.ids[int(cls.arrays['cell_index'][0])]
        cls.table=pa.table({'cell_id':[cell]*n,'vertex_x':pa.array(xy[:,0]),'vertex_y':pa.array(xy[:,1]),'label_id':[1]*n})
    def compare(self, arrays=None, table=None):
        class MetadataReader:
            def read(self, name):
                field=name.split('/')[-2]
                return audit.json.dumps({'shape':[1,50] if field=='vertices' else [1]})
        arrays=self.arrays if arrays is None else arrays
        with patch.object(audit,'read_array',side_effect=lambda _z,name:arrays[name.split('/')[-1]]), patch.object(audit.pq,'read_table',return_value=self.table if table is None else table):
            return audit.compare_boundary(MetadataReader(),1,self.ids,self.attrs,None)
    def test_exact_native_subset_passes(self):
        result,_,_=self.compare();self.assertEqual(result['coordinateComparisons'][0]['differentRows'],0)
    def test_sub_float32_rounding_difference_is_not_hidden(self):
        original=self.table.column('vertex_x').combine_chunks().to_numpy().astype(np.float64)
        original[0]=np.nextafter(original[0],np.inf)
        table=self.table.set_column(1,'vertex_x',pa.array(original))
        with self.assertRaisesRegex(ValueError,'coordinate equality'):self.compare(table=table)
    def test_valid_but_wrong_parent_is_not_joined_by_polygon_label(self):
        arrays={k:v.copy() for k,v in self.arrays.items()};arrays['cell_index'][0]=1
        with self.assertRaisesRegex(ValueError,'parent cell ID'):self.compare(arrays=arrays)
    def test_wrong_numeric_label_cannot_substitute_for_source_mapping(self):
        table=self.table.set_column(3,'label_id',pa.array([2]*self.table.num_rows))
        with self.assertRaisesRegex(ValueError,'label_id'):self.compare(table=table)
    def test_unacquired_mask_read_fails(self):
        with zipfile.ZipFile(audit.PolygonRanges()) as z:
            name=next(n for n in z.namelist() if n.startswith('masks/0/') and not n.endswith(('.zarray','.zattrs')))
            with self.assertRaisesRegex(ValueError,'never acquired'):z.read(name)
    def test_selected_polygon_zip_crc_detects_mutated_payload(self):
        reader=audit.PolygonRanges()
        with zipfile.ZipFile(reader) as z:
            info=z.getinfo('polygon_sets/1/vertices/0.0')
            start=info.header_offset
            index=next(i for i,(s,e,_b) in enumerate(reader.ranges) if s==start)
            s,e,b=reader.ranges[index]; damaged=bytearray(b);damaged[-1]^=1;reader.ranges[index]=(s,e,bytes(damaged))
            with self.assertRaisesRegex(zipfile.BadZipFile,'CRC'):z.read(info.filename)

if __name__=='__main__':unittest.main()
