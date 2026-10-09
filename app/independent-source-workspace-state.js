import { exportIndependentSourceObject, findIndependentSourceObject, listIndependentSourceObjects } from "./independent-source-objects.js";
import { independentSourceIdentityHierarchy, validateSourceIdentityHierarchy } from "./source-object-identity.js";

export const INDEPENDENT_SOURCE_PARAMETERS = Object.freeze({ source: "objectSource", object: "sourceObject", query: "objectQuery", page: "objectPage" });
const PAGE_SIZE = 25;

export function readIndependentSourceLocation(index, href) {
  const url = new URL(href, "http://localhost");
  const params = INDEPENDENT_SOURCE_PARAMETERS;
  const key = url.searchParams.get(params.object);
  const record = key ? findIndependentSourceObject(index, key) : null;
  const sourceId = url.searchParams.get(params.source) ?? record?.sourceId ?? index.sources[0]?.sourceId ?? "";
  const validSource = index.sources.some((source) => source.sourceId === sourceId);
  const query = url.searchParams.get(params.query) ?? "";
  const needle = query.trim().toLocaleLowerCase("en-US");
  const recordMatchesQuery = !record || `${record.title ?? ""} ${record.sourceObjectId} ${record.releaseId}`.toLocaleLowerCase("en-US").includes(needle);
  const pageValue = Number(url.searchParams.get(params.page) ?? 0);
  const filteredTotal = validSource ? listIndependentSourceObjects(index, { sourceId, query, offset: 0, limit: PAGE_SIZE }).total : 0;
  // Clamp before the caller multiplies by PAGE_SIZE: a safe page integer alone
  // does not guarantee that its row offset is also a safe integer.
  const lastPage = Math.min(Math.floor(Math.max(0, filteredTotal - 1) / PAGE_SIZE), Math.floor(Number.MAX_SAFE_INTEGER / PAGE_SIZE));
  const page = Number.isSafeInteger(pageValue) && pageValue >= 0 ? Math.min(pageValue, lastPage) : 0;
  return {
    sourceId,
    key,
    query,
    page,
    error: !validSource ? "Unknown source; choose an available source." : key && (!record || record.sourceId !== sourceId)
      ? "The exact object or release is unavailable. No replacement object was selected." : !recordMatchesQuery
        ? "The saved object is outside the current search results. Clear the filter or choose an exact object." : null,
  };
}

export function writeIndependentSourceLocation(href, { sourceId, key, query, page }) {
  const url = new URL(href, "http://localhost");
  const params = INDEPENDENT_SOURCE_PARAMETERS;
  for (const [name, value] of [[params.source, sourceId], [params.object, key], [params.query, query], [params.page, page ? String(page) : null]]) {
    if (value) url.searchParams.set(name, value); else url.searchParams.delete(name);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function independentSourceVisiblePayload(selectedKey, loadState) {
  return selectedKey && loadState?.key === selectedKey && loadState.status === "ready" ? loadState.payload : null;
}

/** @param {import("./independent-source-objects.js").IndependentObjectIndex | null} index */
export function independentSourceReplayExport(record, payload, viewState, applicationVersion, index = null) {
  if (!record || !payload || payload.key !== record.key || !viewState || viewState.key !== record.key) {
    throw new Error("Export requires the current verified object and its rendered view revision");
  }
  return {
    documentType: "independent-source-object-view",
    schemaVersion: "0.1.0",
    applicationVersion,
    object: exportIndependentSourceObject(record, payload.receipt).object,
    verification: payload.receipt,
    view: viewState,
    ...(index ? { sourceIdentity: independentSourceIdentityHierarchy(index, record.key) } : {}),
    scope: "Source-local object; source-specific units and missingness retained. No cross-source identity or atlas registration is implied.",
  };
}

function replayLayerPolicy(record) {
  const components = new Set((record.components ?? []).map((component) => component.id));
  switch (record.viewer.kind) {
    case "native_contours":
      if (!components.has("soma-contours")) break;
      return { required: ["source-contour-traces"], optional: components.has("derived-open-shell") ? ["derived-open-shell"] : [] };
    case "microns_mesh":
      if (record.viewer.component === "nucleus" && components.has("nucleus")) return { required: ["nucleus"], optional: [] };
      if (record.viewer.component === "cell" && components.has("cell")) return { required: ["cell", ...(components.has("nucleus") ? ["nucleus"] : [])], optional: [] };
      break;
    case "banc_swc":
      if (components.has("swc-centerline") && components.has("nucleus-point")) return { required: ["source-swc-centerline", "source-points"], optional: [] };
      break;
    case "banc_nucleus_point":
      if (components.has("nucleus-point")) return { required: ["source-points"], optional: [] };
      break;
    case "palm_detection":
      if (components.has("localization-point")) return { required: ["source-points"], optional: [] };
      break;
    case "comparative_swc":
      if (components.has("source-swc-centerline")) return { required: ["source-swc-centerline"], optional: [] };
      break;
    case "link_only":
      return { required: [], optional: [] };
    default:
      break;
  }
  throw new Error("The saved view has no admitted layer policy for this source viewer and component");
}

export function validateIndependentSourceViewReplay(index, document, applicationVersion) {
  const record = findIndependentSourceObject(index, document?.object?.key);
  if (record && Object.prototype.hasOwnProperty.call(document, "sourceIdentity")) {
    const restoredIdentity = validateSourceIdentityHierarchy(document.sourceIdentity);
    if (JSON.stringify(restoredIdentity) !== JSON.stringify(independentSourceIdentityHierarchy(index, record.key))) {
      throw new Error("The saved identity hierarchy does not match the current exact source, namespace, parent IDs or missingness");
    }
  }
  const view = document?.view;
  if (document?.documentType !== "independent-source-object-view" || document.schemaVersion !== "0.1.0"
    || document.applicationVersion !== applicationVersion || !record || view?.key !== record.key
    || document.verification?.objectKey !== record.key
    || JSON.stringify(document.object.files) !== JSON.stringify(record.files)
    || view.representation !== record.viewer.kind || !Array.isArray(view.layers)
    || view.layers.some((layer) => typeof layer.id !== "string" || typeof layer.requested !== "boolean" || typeof layer.actual !== "boolean")) {
    throw new Error("The view export does not match the current application, source object, release or file receipts");
  }
  const policy = replayLayerPolicy(record);
  const allowed = new Set([...policy.required, ...policy.optional]);
  const layerIds = new Set(view.layers.map((layer) => layer.id));
  if (layerIds.size !== view.layers.length || view.layers.some((layer) => !allowed.has(layer.id) || (layer.actual && !layer.requested))
    || policy.required.some((id) => !layerIds.has(id))) {
    throw new Error("The saved layers are duplicated, invented, missing a required source component or inconsistent with their requested state");
  }
  const vector = (value) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
  if (view.camera && (!vector(view.camera.position) || !vector(view.camera.target) || !vector(view.camera.up)
    || view.camera.projection !== "perspective" || !Number.isFinite(view.camera.fov) || view.camera.fov <= 0 || view.camera.fov >= 180
    || !Number.isFinite(view.camera.near) || view.camera.near <= 0 || !Number.isFinite(view.camera.far) || view.camera.far <= view.camera.near)) {
    throw new Error("The saved camera is invalid; no view state was applied");
  }
  if (view.displayTransform && (!vector(view.displayTransform.centerNative) || !Number.isFinite(view.displayTransform.scale) || view.displayTransform.scale <= 0
    || JSON.stringify(view.displayTransform.coordinateFrame) !== JSON.stringify(record.coordinateFrame))) {
    throw new Error("The saved display transform uses a different or invalid source frame");
  }
  if (view.status === "rendered") {
    const dimension = (value) => Number.isSafeInteger(value) && value > 0 && value <= 0xffffffff;
    if (record.viewer.kind === "link_only" || document.verification.status !== "verified" || !view.camera || !view.displayTransform
      || view.renderer?.name !== "three" || typeof view.renderer.version !== "string" || !view.renderer.version.trim()
      || !dimension(view.renderer.width) || !dimension(view.renderer.height)
      || view.layers.some((layer) => layer.actual !== layer.requested)) {
      throw new Error("A rendered view requires verified geometry, its camera/source transform and a valid THREE renderer with matching actual layers");
    }
  } else if (view.status === "text-only" || view.status === "link-only") {
    const linkOnly = record.viewer.kind === "link_only";
    if (view.status !== (linkOnly ? "link-only" : "text-only") || document.verification.status !== (linkOnly ? "link_only" : "verified")
      || view.camera !== null || view.displayTransform !== null || view.layers.some((layer) => layer.actual)
      || view.renderer?.name !== "text" || view.renderer.version !== null || view.renderer.width !== 0 || view.renderer.height !== 0) {
      throw new Error("A text/link view must match its source availability, have no rendered layers/camera/transform and use the zero-size text renderer");
    }
  } else {
    throw new Error("The saved view status is unknown; no view state was applied");
  }
  if (Object.prototype.hasOwnProperty.call(view, "clipping") && (view.status === "rendered"
    ? !view.clipping || !Array.isArray(view.clipping.globalPlanes) || view.clipping.globalPlanes.length !== 0 || view.clipping.localClippingEnabled !== false
    : view.clipping !== null)) throw new Error("The saved clipping state differs from this viewer's actual no-custom-plane policy");
  return { record, view };
}
