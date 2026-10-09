"""Independent bounded DAT audit. Does not import or execute the JS reader."""
import json
import math
from pathlib import Path
import struct
import sys

KINDS = {1: 'string', 257: 'sample', 259: 'sampleList', 260: 'property', 261: 'propertyList',
         513: 'contour', 514: 'tree', 515: 'branch', 516: 'marker', 517: 'markerList',
         518: 'spine', 519: 'spineList', 520: 'text', 521: 'subtree', 528: 'sourcePadding',
         1026: 'description', 1027: 'thumbnail'}


class Reader:
    def __init__(self, data, exceptions):
        self.data, self.pos, self.stop = data, 70, len(data) - 4
        assert len(data) >= 82 and data[1:12] == b'V3 DAT file'
        assert data[-4:] == b'\xdd\xcc\xbb\xaa'
        self.exceptions = {r['offsetByte']: r for r in exceptions}
        assert len(self.exceptions) == len(exceptions)
        self.counts, self.corrections, self.contours = {}, [], []

    def number(self, fmt):
        size = struct.calcsize(fmt)
        assert self.pos + size <= self.stop, ('truncated', self.pos)
        value = struct.unpack_from(fmt, self.data, self.pos)[0]
        self.pos += size
        assert not isinstance(value, float) or math.isfinite(value)
        return value

    def word(self):
        return self.number('<H')

    def peek(self):
        return struct.unpack_from('<H', self.data, self.pos)[0] if self.pos + 2 <= self.stop else None

    def block(self, expected=None):
        start = self.pos
        kind, size = self.word(), self.number('<I')
        assert kind in KINDS and size >= 6 and start + size <= self.stop, ('block', start, kind, size)
        assert expected is None or kind == expected, ('type', start, kind, expected)
        self.counts[KINDS[kind]] = self.counts.get(KINDS[kind], 0) + 1
        assert sum(self.counts.values()) < 100000
        return start, kind, size, start + size

    def string(self):
        _, _, _, end = self.block(1)
        value = self.data[self.pos:end].decode('cp1252').rstrip('\0')
        self.pos = end
        return value

    def color(self):
        return '#' + ''.join(f'{self.number("<B"):02x}' for _ in range(3))

    def properties(self):
        _, _, _, end = self.block(261)
        declared, rows, keys = self.word(), [], set()
        while self.pos < end:
            _, _, _, pend = self.block(260)
            key, n = self.string(), self.word()
            assert key not in keys, ('duplicate property', key)
            keys.add(key)
            values = []
            while self.pos < pend:
                tag = self.word()
                if tag == 0:
                    values.append(self.number('<f'))
                elif tag in (1, 2):
                    values.append(self.string())
                elif tag == 3:
                    values.append(self.color())
                    self.number('<B')
                else:
                    raise ValueError(('property tag', tag))
            assert self.pos == pend and len(values) == n
            rows.append(dict(key=key, declaredValueCount=n, values=values))
        assert self.pos == end and len(rows) == declared
        return rows

    def sample(self):
        _, _, _, end = self.block(257)
        p = [self.number('<f') for _ in range(4)]
        p[3] /= 2
        if self.pos < end:
            self.word()
        assert self.pos == end
        return p

    def samples(self):
        _, _, _, end = self.block(259)
        declared, rows = self.word(), []
        while self.pos < end:
            rows.append(self.sample())
        assert self.pos == end and len(rows) == declared
        return rows

    def children(self, end, depth, n=None):
        rows, excess = [], 0
        while self.pos < end + excess or (n is not None and len(rows) < n):
            assert self.pos < self.stop
            child = self.object(depth)
            excess += child['sizeCorrectionBytes']
            rows.append(child)
        assert self.pos == end + excess and (n is None or len(rows) == n)
        return rows, excess

    def object(self, depth=0):
        assert depth < 256
        start = self.pos
        if self.peek() == 261:
            properties = self.properties()
            return dict(offsetByte=start, sourceType='propertyList', sourceName=None,
                        declaredBytes=self.pos-start, actualBytes=self.pos-start, sizeCorrectionBytes=0,
                        vertexCount=0, sourcePropertyReceipts=properties, children=[])
        start, kind, size, end = self.block()
        row = dict(offsetByte=start, sourceType=KINDS[kind], sourceName=None, declaredBytes=size,
                   actualBytes=None, sizeCorrectionBytes=0, vertexCount=0, sourcePropertyReceipts=[], children=[])
        points, excess = [], 0
        if kind in (1026, 1027):
            self.pos = end
        elif kind == 513:
            row['sourceName'] = self.string()
            flag = self.word()
            assert flag in (0, 1)
            row.update(sourceClosedFlag=bool(flag), sourceColor=self.color(), sourceAlpha=self.number('<B'))
            assert self.word() == 0
            if self.peek() == 261:
                row['sourcePropertyReceipts'] = self.properties()
            points = self.samples()
            if self.pos < end and self.peek() == 517:
                child = self.object(depth+1)
                row['children'].append(child)
                excess += child['sizeCorrectionBytes']
        elif kind == 516:
            row.update(sourceName=self.string(), sourceColor=self.color(), sourceAlpha=self.number('<B'))
            if self.peek() == 261:
                row['sourcePropertyReceipts'] = self.properties()
            points = self.samples()
        elif kind == 520:
            row.update(sourceName=self.string(), sourceColor=self.color())
            assert self.number('<B') == 0
            points.append(self.sample())
            assert self.word() == 0
            if self.peek() == 261:
                row['sourcePropertyReceipts'] = self.properties()
        elif kind == 518:
            row.update(sourceColor=self.color(), sourceAlpha=self.number('<B'))
            assert self.word() == 1
            if self.peek() == 261:
                row['sourcePropertyReceipts'] = self.properties()
            row['sourceParentOffset'] = self.word()
            while self.pos < end and self.peek() == 257:
                points.append(self.sample())
        elif kind in (514, 515, 521):
            if kind == 514:
                row['sourcePartCode'] = self.word()
                assert row['sourcePartCode'] in (0, 1, 2)
                row['sourceColor'] = self.color()
                assert [self.number('<B') for _ in range(3)] == [0, 0, 0]
                if self.peek() == 261:
                    row['sourcePropertyReceipts'] = self.properties()
                points.append(self.sample())
            else:
                row.update(sourceLeafCode=self.word(), sourceDeclaredBranches=self.word())
                if self.peek() == 261:
                    row['sourcePropertyReceipts'] = self.properties()
                if self.peek() == 259:
                    points = self.samples()
            row['children'], excess = self.children(end, depth+1)
        elif kind in (517, 519):
            n = self.word()
            row['children'], excess = self.children(end, depth+1, n)
            assert all(c['sourceType'] == ('marker' if kind == 517 else 'spine') for c in row['children'])
        elif kind == 528:
            assert size == 6 and self.word() == 0
        else:
            raise ValueError(('unsupported object', kind))
        delta = self.pos - end
        if kind == 516 and delta:
            observed = dict(offsetByte=start, sourceName=row['sourceName'], declaredBytes=size,
                            actualBytes=self.pos-start, sizeCorrectionBytes=delta)
            assert self.exceptions.get(start) == observed, ('unmanifested marker', observed)
        assert delta == excess or kind == 516 or (kind == 528 and delta == 2), ('boundary', start, delta, excess)
        row.update(actualBytes=self.pos-start, sizeCorrectionBytes=delta,
                   vertexCount=len(points)+sum(c['vertexCount'] for c in row['children']))
        if kind == 513:
            self.contours.append({**row, 'points': points, 'vertexCount': len(points)})
        if delta:
            basis = 'exact_file_marker_size_disagrees_with_parsed_fields' if kind == 516 else 'source_padding_two_bytes_not_counted' if kind == 528 else 'nested_source_size_corrections'
            self.corrections.append(dict(offsetByte=start, sourceType=KINDS[kind], declaredBytes=size,
                                         actualBytes=row['actualBytes'], sizeCorrectionBytes=delta, basis=basis))
        return row

    def inspect(self):
        top = []
        while self.pos < self.stop:
            top.append(self.object())
        assert self.pos == self.stop and len(self.exceptions) == sum(c['sourceType'] == 'marker' for c in self.corrections)
        return dict(fileBytes=len(self.data), headerBytes=70, terminalBytes=4,
                    topLevelObjects=top, blockCounts=self.counts, sizeCorrections=self.corrections, contours=self.contours)


if __name__ == '__main__':
    inputs = json.loads(Path(sys.argv[1]).read_text())
    rows = [dict(neuronId=r['neuronId'], audit=Reader(Path(r['path']).read_bytes(), r['markerSizeCorrections']).inspect()) for r in inputs]
    Path(sys.argv[2]).write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':'), allow_nan=False)+'\n')
