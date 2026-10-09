const check = (ok, message) => { if (!ok) throw new Error(`DAT admission: ${message}`); };
export function canonicalDatAudit(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalDatAudit).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalDatAudit(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}
export function datAuditPayload(audit) {
  return Object.fromEntries(Object.entries(audit).filter(([key]) => key !== "parserVersion"));
}
export function datTopLevelInventory(audit) {
  return audit.topLevelObjects.map(({ children, ...row }) => {
    const nestedObjectCounts = {};
    const visit = child => { nestedObjectCounts[child.sourceType] = (nestedObjectCounts[child.sourceType] ?? 0) + 1; child.children.forEach(visit); };
    children.forEach(visit);
    return { ...row, nestedObjectCounts };
  });
}
export function validateNativeDatAdmission(audit, geometry, file) {
  check(audit.parserVersion === file.parserVersion && audit.fileBytes === file.originalDat.bytes, "parser/file version changed");
  check(canonicalDatAudit(datTopLevelInventory(audit)) === canonicalDatAudit(file.topLevelObjects), "top-level object inventory changed");
  check(canonicalDatAudit(audit.blockCounts) === canonicalDatAudit(file.blockCounts), "full nested block counts changed");
  check(geometry.contours.length === file.admittedContours.length, "admitted contour count changed");
  const used = new Set();
  for (let i = 0; i < geometry.contours.length; i += 1) {
    const contour = geometry.contours[i], expected = file.admittedContours[i];
    const raw = audit.contours.filter(c => c.offsetByte === expected.sourceBlockOffsetByte);
    check(raw.length === 1 && !used.has(expected.sourceBlockOffsetByte), "duplicate/missing exact contour identity");
    used.add(expected.sourceBlockOffsetByte);
    check(contour.id === expected.id && contour.sourceBlockOffsetByte === expected.sourceBlockOffsetByte
      && contour.sourceName === expected.sourceName && raw[0].sourceName === contour.sourceName
      && contour.sourceColor === raw[0].sourceColor && contour.sourceClosedFlag === raw[0].sourceClosedFlag
      && contour.interpretedClosed === expected.interpretedClosed && contour.closureBasis === expected.closureBasis
      && contour.vertexCount === expected.vertexCount && contour.semanticSegmentCount === expected.semanticSegmentCount
      && contour.semanticClass === "soma_contour_trace", "exact per-file contour semantics changed");
    check(canonicalDatAudit(contour.points) === canonicalDatAudit(raw[0].points), "derived ordered coordinates differ from original DAT");
    if (contour.sourcePropertyReceipts) check(canonicalDatAudit(contour.sourcePropertyReceipts) === canonicalDatAudit(raw[0].sourcePropertyReceipts), "source property receipts changed");
  }
  return geometry;
}
