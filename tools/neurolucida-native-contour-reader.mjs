// Project contour-block reader. Preserves raw flags/properties and source order; it makes no closure or biological-surface decision.

const TYPE = Object.freeze({
  string: 0x0001,
  sample: 0x0101,
  sampleList: 0x0103,
  property: 0x0104,
  propertyList: 0x0105,
  contour: 0x0201,
});

function check(condition, message) {
  if (!condition) throw new Error(message);
}

class DatCursor {
  constructor(bytes, position = 0) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.position = position;
  }

  ensure(length, label) {
    check(this.position + length <= this.bytes.byteLength, `${label} exceeds DAT byte bounds`);
  }

  uint8() { this.ensure(1, "uint8"); const value = this.view.getUint8(this.position); this.position += 1; return value; }
  uint16() { this.ensure(2, "uint16"); const value = this.view.getUint16(this.position, true); this.position += 2; return value; }
  uint32() { this.ensure(4, "uint32"); const value = this.view.getUint32(this.position, true); this.position += 4; return value; }
  float32() { this.ensure(4, "float32"); const value = this.view.getFloat32(this.position, true); this.position += 4; return value; }
  peekUint16(offset = 0) { this.ensure(offset + 2, "peekUint16"); return this.view.getUint16(this.position + offset, true); }

  blockHeader(expectedType = null) {
    const start = this.position;
    const type = this.uint16();
    const size = this.uint32();
    check(size >= 6, `Invalid DAT block size ${size} at byte ${start}`);
    const end = start + size;
    check(end <= this.bytes.byteLength, `DAT block at byte ${start} exceeds file bounds`);
    if (expectedType !== null) check(type === expectedType, `Expected DAT block 0x${expectedType.toString(16)}, got 0x${type.toString(16)} at byte ${start}`);
    return { start, type, size, end };
  }
}

function readString(cursor) {
  const block = cursor.blockHeader(TYPE.string);
  let value = new TextDecoder("windows-1252").decode(cursor.bytes.subarray(cursor.position, block.end));
  cursor.position = block.end;
  while (value.endsWith(String.fromCharCode(0))) value = value.slice(0, -1);
  return value;
}

function readColor(cursor) {
  return `#${[cursor.uint8(), cursor.uint8(), cursor.uint8()].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function readProperty(cursor) {
  const block = cursor.blockHeader(TYPE.property);
  const key = readString(cursor);
  const declaredValueCount = cursor.uint16();
  const values = [];
  while (cursor.position < block.end) {
    const dataType = cursor.uint16();
    if (dataType === 0) values.push(cursor.float32());
    else if (dataType === 1 || dataType === 2) values.push(readString(cursor));
    else if (dataType === 3) { values.push(readColor(cursor)); cursor.uint8(); }
    else throw new Error(`Unsupported DAT property value type ${dataType} for ${key}`);
  }
  check(cursor.position === block.end && declaredValueCount === values.length, `Property ${key} did not match its declared boundary/count`);
  return { key, declaredValueCount, values, interpretedValue: values.length > 1 ? values : values[0] ?? true };
}

function readPropertyList(cursor) {
  const block = cursor.blockHeader(TYPE.propertyList);
  const declaredCount = cursor.uint16();
  const sourceProperties = {};
  const sourcePropertyReceipts = [];
  while (cursor.position < block.end) {
    check(cursor.peekUint16() === TYPE.property, `Unexpected DAT property-list member at byte ${cursor.position}`);
    const property = readProperty(cursor);
    sourceProperties[property.key] = property.interpretedValue;
    sourcePropertyReceipts.push({ key: property.key, declaredValueCount: property.declaredValueCount, values: property.values });
  }
  check(sourcePropertyReceipts.length === declaredCount, "DAT property-list count mismatch");
  return { sourceProperties, sourcePropertyReceipts };
}

function readSample(cursor) {
  const block = cursor.blockHeader(TYPE.sample);
  check(block.end - cursor.position >= 16, "DAT sample lacks x/y/z/diameter fields");
  const point = [cursor.float32(), cursor.float32(), cursor.float32(), cursor.float32() * 0.5];
  check(point.every(Number.isFinite), "DAT sample contains a non-finite coordinate or drawing radius");
  if (cursor.position < block.end) cursor.uint16();
  check(cursor.position === block.end, "DAT sample contains unsupported trailing bytes");
  return point;
}

function readSampleList(cursor) {
  const block = cursor.blockHeader(TYPE.sampleList);
  const declaredCount = cursor.uint16();
  const points = [];
  while (cursor.position < block.end) {
    check(cursor.peekUint16() === TYPE.sample, `Unexpected DAT sample-list member at byte ${cursor.position}`);
    points.push(readSample(cursor));
  }
  check(points.length === declaredCount, "DAT sample-list count mismatch");
  return points;
}

function boundsOf(points) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const point of points) for (let axis = 0; axis < 3; axis += 1) {
    min[axis] = Math.min(min[axis], point[axis]);
    max[axis] = Math.max(max[axis], point[axis]);
  }
  return { min, max };
}

function readContour(cursor, ordinal) {
  const block = cursor.blockHeader(TYPE.contour);
  const sourceName = readString(cursor);
  const rawClosedValue = cursor.uint16();
  check(rawClosedValue === 0 || rawClosedValue === 1, "Unsupported source closed flag value");
  const sourceClosedFlag = rawClosedValue === 1;
  const sourceColor = readColor(cursor);
  cursor.uint8();
  check(cursor.uint16() === 0, `Contour ${ordinal} has an unsupported non-zero reserved field`);
  const properties = cursor.peekUint16() === TYPE.propertyList
    ? readPropertyList(cursor)
    : { sourceProperties: {}, sourcePropertyReceipts: [] };
  check(cursor.peekUint16() === TYPE.sampleList, `Contour ${ordinal} has no sample list`);
  const points = readSampleList(cursor);
  check(cursor.position <= block.end, `Contour ${ordinal} exceeds its declared block`);
  cursor.position = block.end;
  return {
    id: `source-native-contour-${ordinal}`,
    sourceName,
    sourceClosedFlag,
    sourceColor,
    ...properties,
    vertexCount: points.length,
    zValuesMicrometre: [...new Set(points.map((point) => point[2]))].sort((a, b) => a - b),
    boundsMicrometre: boundsOf(points),
    sourceBlockOffsetByte: block.start,
    sourceBlockSizeByte: block.size,
    pointColumns: ["x_micrometre", "y_micrometre", "z_micrometre", "trace_radius_micrometre"],
    points,
  };
}

export function extractNativeDatContours(bytes) {
  check(new TextDecoder("windows-1252").decode(bytes.subarray(1, 12)) === "V3 DAT file", "Neurolucida V3 DAT header token is missing");
  check(bytes.readUInt32LE(bytes.byteLength - 4) === 0xaabbccdd, "Neurolucida DAT terminal marker changed");
  const contours = [];
  const end = bytes.byteLength - 4;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 70; offset <= end - 12; offset += 1) {
    if (view.getUint16(offset, true) !== TYPE.contour) continue;
    const size = view.getUint32(offset + 2, true);
    if (size < 12 || offset + size > end) continue;
    const probe = new DatCursor(bytes, offset + 6);
    if (probe.peekUint16() !== TYPE.string) continue;
    let sourceName;
    try { sourceName = readString(probe); } catch { continue; }
    if (!sourceName) continue;
    try {
      const cursor = new DatCursor(bytes, offset);
      contours.push(readContour(cursor, contours.length + 1));
      offset = cursor.position - 1;
    } catch {
      continue;
    }
  }
  return contours;
}

