// Bounded project reader for the seven explicitly manifested V3 DAT files.
// Traversal records source objects; only separately admitted contours may render.
export const DAT_INVENTORY_PARSER_VERSION = "ohri-v3-dat-inventory-0.1.0";
const TYPES = { 1: "string", 0x101: "sample", 0x103: "sampleList", 0x104: "property", 0x105: "propertyList",
  0x201: "contour", 0x202: "tree", 0x203: "branch", 0x204: "marker", 0x205: "markerList",
  0x206: "spine", 0x207: "spineList", 0x208: "text", 0x209: "subtree", 0x210: "sourcePadding",
  0x402: "description", 0x403: "thumbnail" };
const check = (ok, message) => { if (!ok) throw new Error(`DAT inventory: ${message}`); };
export function inspectNativeDat(input, { markerSizeCorrections = [] } = {}) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), end = bytes.length - 4;
  check(bytes.length >= 82 && new TextDecoder().decode(bytes.subarray(1, 12)) === "V3 DAT file", "invalid V3 header");
  check(view.getUint32(end, true) === 0xaabbccdd, "terminal marker missing");
  let at = 70, blocks = 0;
  const counts = {}, corrections = [], contours = [];
  const ensure = n => check(at + n <= end, `truncated object at ${at}`);
  const u8 = () => { ensure(1); return view.getUint8(at++); };
  const u16 = () => { ensure(2); const n = view.getUint16(at, true); at += 2; return n; };
  const f32 = () => { ensure(4); const n = view.getFloat32(at, true); at += 4; check(Number.isFinite(n), "non-finite sample/property"); return n; };
  const peek = () => at + 2 <= end ? view.getUint16(at, true) : null;
  const rgb = () => `#${[u8(), u8(), u8()].map(n => n.toString(16).padStart(2, "0")).join("")}`;
  function header(expected) {
    ensure(6); const start = at, type = u16(), size = view.getUint32(at, true); at += 4;
    check(++blocks <= 100000 && TYPES[type] && size >= 6 && start + size <= end, `unsupported/truncated block 0x${type.toString(16)} at ${start}`);
    check(expected === undefined || type === expected, `unexpected block at ${start}`);
    counts[TYPES[type]] = (counts[TYPES[type]] ?? 0) + 1;
    return { start, type, size, limit: start + size };
  }
  function string() {
    const h = header(1), payloadBytes = h.limit - at;
    const value = new TextDecoder("windows-1252").decode(bytes.subarray(at, h.limit)).replace(/\0+$/, "");
    at = h.limit; return { value, payloadBytes };
  }
  function properties() {
    const h = header(0x105), n = u16(), rows = [], seen = new Set();
    while (at < h.limit) {
      const p = header(0x104), key = string().value, declaredValueCount = u16(), values = [];
      check(!seen.has(key), `duplicate property ${key}`); seen.add(key);
      while (at < p.limit) {
        const t = u16();
        if (t === 0) values.push(f32());
        else if (t === 1 || t === 2) values.push(string().value);
        else if (t === 3) { values.push(rgb()); u8(); }
        else throw new Error(`DAT inventory: unsupported property type ${t}`);
      }
      check(at === p.limit && values.length === declaredValueCount, `property boundary/count ${key}`);
      rows.push({ key, declaredValueCount, values });
    }
    check(at === h.limit && rows.length === n, "property-list boundary/count"); return rows;
  }
  function sample() {
    const h = header(0x101), point = [f32(), f32(), f32(), f32() / 2];
    if (at < h.limit) u16();
    check(at === h.limit, "sample boundary"); return point;
  }
  function samples() {
    const h = header(0x103), n = u16(), points = [];
    while (at < h.limit) points.push(sample());
    check(at === h.limit && points.length === n, "sample-list boundary/count"); return points;
  }
  function members(limit, depth, count = null) {
    let extra = 0; const children = [];
    while (at < limit + extra || (count !== null && children.length < count)) {
      check(at < end, "list exceeds terminal marker");
      const child = object(depth); children.push(child); extra += child.sizeCorrectionBytes;
    }
    check(at === limit + extra && (count === null || children.length === count), "container boundary/count");
    return { children, extra };
  }
  function object(depth = 0) {
    check(depth < 256, "nesting limit");
    const start = at, type = peek();
    if (type === 0x105) {
      const rows = properties(); return { offsetByte: start, sourceType: "propertyList", sourceName: null,
        declaredBytes: at - start, actualBytes: at - start, sizeCorrectionBytes: 0, vertexCount: 0,
        sourcePropertyReceipts: rows, children: [] };
    }
    const h = header(), row = { offsetByte: start, sourceType: TYPES[h.type], sourceName: null,
      declaredBytes: h.size, actualBytes: null, sizeCorrectionBytes: 0, vertexCount: 0,
      sourcePropertyReceipts: [], children: [] };
    let extra = 0, ownPoints = [];
    if (h.type === 0x402 || h.type === 0x403) at = h.limit;
    else if (h.type === 0x201) {
      row.sourceName = string().value; const closed = u16(); check(closed === 0 || closed === 1, "unsupported closure flag");
      row.sourceClosedFlag = Boolean(closed); row.sourceColor = rgb(); row.sourceAlpha = u8();
      check(u16() === 0, "contour reserved field");
      if (peek() === 0x105) row.sourcePropertyReceipts = properties();
      ownPoints = samples();
      if (peek() === 0x205 && at < h.limit) { const list = object(depth + 1); row.children.push(list); extra += list.sizeCorrectionBytes; }
      contours.push({ ...row, points: ownPoints });
    } else if (h.type === 0x204) {
      row.sourceName = string().value;
      row.sourceColor = rgb(); row.sourceAlpha = u8();
      if (peek() === 0x105) row.sourcePropertyReceipts = properties();
      ownPoints = samples();
    } else if (h.type === 0x208) {
      row.sourceName = string().value; row.sourceColor = rgb(); check(u8() === 0, "text reserved byte");
      ownPoints = [sample()]; check(u16() === 0, "text reserved word");
      if (peek() === 0x105) row.sourcePropertyReceipts = properties();
    } else if (h.type === 0x206) {
      row.sourceColor = rgb(); row.sourceAlpha = u8(); check(u16() === 1, "spine source tag");
      if (peek() === 0x105) row.sourcePropertyReceipts = properties();
      row.sourceParentOffset = u16(); while (at < h.limit && peek() === 0x101) ownPoints.push(sample());
    } else if (h.type === 0x202 || h.type === 0x203 || h.type === 0x209) {
      if (h.type === 0x202) {
        row.sourcePartCode = u16(); check([0, 1, 2].includes(row.sourcePartCode), "unsupported tree part code");
        row.sourceColor = rgb(); check(u8() === 0 && u8() === 0 && u8() === 0, "tree reserved bytes");
        if (peek() === 0x105) row.sourcePropertyReceipts = properties(); ownPoints.push(sample());
      } else {
        row.sourceLeafCode = u16(); row.sourceDeclaredBranches = u16();
        if (peek() === 0x105) row.sourcePropertyReceipts = properties();
        if (peek() === 0x103) ownPoints = samples();
      }
      const nested = members(h.limit, depth + 1); row.children = nested.children; extra = nested.extra;
    } else if (h.type === 0x205 || h.type === 0x207) {
      const n = u16(), nested = members(h.limit, depth + 1, n); row.children = nested.children; extra = nested.extra;
      check(row.children.every(c => c.sourceType === (h.type === 0x205 ? "marker" : "spine")), "unsupported list member");
    } else if (h.type === 0x210) {
      check(h.size === 6 && u16() === 0, "unsupported source-padding block");
    } else throw new Error(`DAT inventory: unsupported object type ${row.sourceType}`);
    const actualExtra = at - h.limit;
    if (h.type === 0x204 && actualExtra !== 0) {
      const observed = { offsetByte: start, sourceName: row.sourceName, declaredBytes: h.size, actualBytes: at - start, sizeCorrectionBytes: actualExtra };
      const expected = markerSizeCorrections.filter(c => c.offsetByte === start);
      if (expected.length !== 1 || JSON.stringify(expected[0]) !== JSON.stringify(observed)) {
        const error = new Error(`DAT inventory: unmanifested marker size at ${start}`); error.markerSizeCorrection = observed; throw error;
      }
    }
    check(actualExtra === extra || h.type === 0x204 || (h.type === 0x210 && actualExtra === 2),
      `unexplained ${row.sourceType} boundary at ${start}: ${actualExtra}, expected ${extra}`);
    row.actualBytes = at - start; row.sizeCorrectionBytes = actualExtra;
    row.vertexCount = ownPoints.length + row.children.reduce((n, child) => n + child.vertexCount, 0);
    if (h.type === 0x201) { const contour = contours[contours.length - 1]; Object.assign(contour, row); contour.vertexCount = ownPoints.length; }
    if (actualExtra) corrections.push({ offsetByte: start, sourceType: row.sourceType, declaredBytes: h.size,
      actualBytes: row.actualBytes, sizeCorrectionBytes: actualExtra, basis: h.type === 0x204 ? "exact_file_marker_size_disagrees_with_parsed_fields" : h.type === 0x210 ? "source_padding_two_bytes_not_counted" : "nested_source_size_corrections" });
    return row;
  }
  const topLevelObjects = [];
  while (at < end) topLevelObjects.push(object(0));
  // Top-level has a fixed terminal boundary; child corrections change only container ends.
  check(at === end, "top-level byte coverage mismatch");
  check(markerSizeCorrections.length === corrections.filter(c => c.sourceType === "marker").length, "unused/duplicate marker size exception");
  return { parserVersion: DAT_INVENTORY_PARSER_VERSION, fileBytes: bytes.length, headerBytes: 70, terminalBytes: 4,
    topLevelObjects, blockCounts: counts, sizeCorrections: corrections, contours };
}
