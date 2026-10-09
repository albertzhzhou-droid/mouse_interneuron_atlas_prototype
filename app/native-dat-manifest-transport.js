/** Exact metadata retained in the eager index; detailed source syntax loads per file. */
export function nativeDatManifestSummary(file) {
  const summary = Object.fromEntries(Object.entries(file).filter(([key]) => !["markerSizeCorrections", "topLevelObjects"].includes(key)));
  return { ...summary, topLevelObjectCount: file.topLevelObjects.length, markerSizeCorrectionCount: file.markerSizeCorrections.length };
}

export function validateNativeDatManifestTransport(file, indexed) {
  if (!file || !Array.isArray(file.topLevelObjects) || !Array.isArray(file.markerSizeCorrections))
    throw new Error("Native contour source: incomplete per-file DAT manifest");
  const summary = Object.fromEntries(Object.entries(indexed).filter(([key]) => key !== "transport"));
  if (JSON.stringify(nativeDatManifestSummary(file)) !== JSON.stringify(summary))
    throw new Error("Native contour source: selected DAT manifest metadata differs from the pinned index");
  return file;
}
