"""Bounded first-IFD TIFF metadata reader; never reads image tiles or strips."""
import struct
import xml.etree.ElementTree as ET

TYPE_BYTES = {1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4,
              10: 8, 11: 4, 12: 8, 13: 4, 16: 8, 17: 8, 18: 8}
SAFE_TAGS = {256, 257, 258, 259, 262, 270, 274, 277, 282, 283, 296, 322, 323, 330, 339}

def require(value, reason):
    if not value:
        raise ValueError(reason)

def inspect_first_ifd(read, file_size):
    """read(start,length,purpose) must enforce byte bounds and source receipts."""
    header = read(0, 16, 'TIFF header')
    require(header[:2] in (b'II', b'MM'), 'Unsupported TIFF byte order')
    endian = '<' if header[:2] == b'II' else '>'
    magic = struct.unpack(endian + 'H', header[2:4])[0]
    require(magic in (42, 43), 'Not a TIFF/BigTIFF header')
    big = magic == 43
    if big:
        require(struct.unpack(endian + 'HH', header[4:8]) == (8, 0), 'Unsupported BigTIFF offsets')
    offset = struct.unpack(endian + ('Q' if big else 'I'), header[8:16] if big else header[4:8])[0]
    count_size, entry_size, inline_size = (8, 20, 8) if big else (2, 12, 4)
    require((16 if big else 8) <= offset < file_size, 'Invalid first IFD offset')
    count = struct.unpack(endian + ('Q' if big else 'H'), read(offset, count_size, 'first IFD entry count'))[0]
    require(0 < count <= 4096, 'IFD entry count exceeds metadata scope')
    table = read(offset + count_size, count * entry_size + inline_size, 'first IFD entries and next pointer')
    tags, declarations = {}, []
    for i in range(count):
        entry = table[i * entry_size:(i + 1) * entry_size]
        tag, kind = struct.unpack(endian + 'HH', entry[:4])
        number = struct.unpack(endian + ('Q' if big else 'I'), entry[4:12] if big else entry[4:8])[0]
        raw = entry[12:20] if big else entry[8:12]
        require(tag not in tags, 'Duplicate first-IFD tag')
        tags[tag] = None
        require(kind in TYPE_BYTES and number > 0, 'Unsupported TIFF tag layout')
        size = TYPE_BYTES[kind] * number
        declarations.append({'tag': tag, 'type': kind, 'count': number})
        if tag not in SAFE_TAGS:
            continue
        require(size <= 1_000_000, 'Selected metadata tag exceeds budget')
        if size <= inline_size:
            data = raw[:size]
        else:
            pointer = struct.unpack(endian + ('Q' if big else 'I'), raw)[0]
            require(0 <= pointer <= file_size - size, 'Metadata pointer outside source file')
            data = read(pointer, size, f'first IFD tag {tag}')
        if kind == 2:
            require(data.endswith(b'\0'), 'TIFF ASCII metadata lacks terminator')
            value = data[:-1].decode('utf-8', errors='strict')
        elif kind in (5, 10):
            pairs = struct.unpack(endian + ('I' if kind == 5 else 'i') * (number * 2), data)
            require(all(pairs[j + 1] for j in range(0, len(pairs), 2)), 'Invalid TIFF rational denominator')
            value = [{'numerator': pairs[j], 'denominator': pairs[j + 1]} for j in range(0, len(pairs), 2)]
        else:
            formats = {1: 'B', 3: 'H', 4: 'I', 6: 'b', 7: 'B', 8: 'h', 9: 'i', 11: 'f', 12: 'd', 13: 'I', 16: 'Q', 17: 'q', 18: 'Q'}
            value = list(struct.unpack(endian + formats[kind] * number, data))
        tags[tag] = value
    require(tags.get(270), 'First IFD has no OME ImageDescription')
    xml = tags[270]
    require('<!DOCTYPE' not in xml.upper() and '<!ENTITY' not in xml.upper(), 'XML entities are outside metadata scope')
    root = ET.fromstring(xml)
    ns = '{http://www.openmicroscopy.org/Schemas/OME/2016-06}'
    require(root.tag == ns + 'OME', 'Unsupported OME namespace')
    images = root.findall(ns + 'Image')
    require(len(images) == 1, 'Exactly one OME image required for this run')
    image = images[0]; pixels = image.find(ns + 'Pixels')
    require(pixels is not None, 'OME Pixels declaration missing')
    require(tags[256] == [int(pixels.attrib['SizeX'])] and tags[257] == [int(pixels.attrib['SizeY'])], 'OME/IFD dimensions disagree')
    next_ifd = struct.unpack(endian + ('Q' if big else 'I'), table[-inline_size:])[0]
    require(next_ifd == 0 or 0 < next_ifd < file_size, 'Next IFD pointer outside source file')
    require(all(0 < v < file_size for v in tags.get(330, [])), 'SubIFD pointer outside source file')
    metadata = {'tiffFormat': 'BigTIFF' if big else 'TIFF', 'byteOrder': 'little' if endian == '<' else 'big',
                'firstIfdOffset': offset, 'firstIfdEntryCount': count,
                'nextIfdOffsetDeclared': next_ifd,
                'firstIfdTags': {str(k): v for k, v in tags.items() if v is not None and k != 270},
                'allFirstIfdTagDeclarations': declarations,
                'ome': {'rootAttributes': dict(root.attrib), 'imageAttributes': dict(image.attrib),
                        'pixelsAttributes': dict(pixels.attrib),
                        'channels': [dict(c.attrib) for c in pixels.findall(ns + 'Channel')],
                        'tiffData': [dict(t.attrib) for t in pixels.findall(ns + 'TiffData')],
                        'planes': [dict(p.attrib) for p in pixels.findall(ns + 'Plane')]},
                'imagePixelsRead': False, 'otherIfdsReplayed': False, 'pyramidPixelsVerified': False}
    return metadata, xml
