import canonical from "../data/dandi-spinalcordnet-trace-preview-0.1.json" with { type: "json" };
import { createSourceIdentityHierarchy } from "./source-object-identity.js";

function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
export const DANDI_TRACE_CONTRACT = freeze(canonical);
const verifiedPayloads = new WeakMap();
const assert = (ok, message) => { if (!ok) throw new Error(`DANDI native trace: ${message}`); };
const canonicalValue = value => Array.isArray(value) ? value.map(canonicalValue) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalValue(value[key])])) : value;
const same = (a, b) => JSON.stringify(canonicalValue(a)) === JSON.stringify(canonicalValue(b));
const unknown = reason => ({ status: "unknown", id: null, locator: null, reason });
const known = (id, locator) => ({ status: "known", id, locator, reason: null });

export function validateDandiTraceContract(contract = canonical) {
  assert(same(contract, canonical), "source contract differs from the pinned native declaration");
  assert(contract.preview.sha256 === "ba4bd75e9637ca171c05d43d864c633e33c52c33d679d6e144ebe54b975f40e5"
    && contract.preview.bytes === 76202 && contract.preview.sampleCount === 30000, "preview pin changed");
  return contract;
}

export function dandiTraceIdentity(contract = canonical) {
  validateDandiTraceContract(contract);
  const locator = `${contract.sourceAsset.path}#/acquisition/ElectricalSeries@${contract.sourceContext.seriesObjectId}`;
  return createSourceIdentityHierarchy({ sourceId: contract.sourceId, releaseId: contract.releaseId, namespace: contract.namespace,
    objectKind: "extracellular_electrical_series", objectId: contract.sourceContext.seriesObjectId,
    objectLocator: locator, objectLevel: "component", unit: "one extracellular electrical-series observation",
    nodes: { specimen: known(contract.sourceContext.subjectId, `${contract.sourceAsset.path}#/general/subject/subject_id`),
      section: unknown("No exact histological section ID is deposited for this in-vivo series."),
      cell: unknown("An electrode and extracellular series do not identify an isolated physical cell or interneuron."),
      component: known(contract.sourceContext.seriesObjectId, locator),
      synapse: unknown("No exact synapse ID or parent linkage is established by this series.") },
    population: unknown("The dataset title and recording location do not establish a cell-population assignment."), parentEvidence: {} });
}

export function validateDandiTracePayload(payload, contract = canonical) {
  validateDandiTraceContract(contract);
  const expected = { schemaVersion: "0.1.0", assetId: contract.sourceAsset.id, seriesObjectId: contract.sourceContext.seriesObjectId,
    dataPath: contract.preview.dataPath, sourceChannelIndex: 0, nativeElectrodeId: "0", firstSample: 0,
    sampleCount: 30000, dataType: "int16", sampleRateHz: 30000, startingTimeSeconds: 0,
    nativeAmplitudeDeclaration: contract.amplitude.nativeDeclaration };
  assert(payload && same(Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "samples")), expected), "trace identity, time, channel or amplitude declaration changed");
  assert(Array.isArray(payload.samples) && payload.samples.length === 30000
    && Array.from({ length: 30000 }, (_, i) => i).every(i => Object.hasOwn(payload.samples, i)
      && Number.isInteger(payload.samples[i]) && payload.samples[i] >= -32768 && payload.samples[i] <= 32767), "stored samples must remain dense int16 values");
  assert(Math.min(...payload.samples) === -50 && Math.max(...payload.samples) === 51, "preview range changed");
  return payload;
}

/** Verification authorizes only this complete derivative, not the partially read NWB. */
export async function verifyDandiTraceBytes(bytes, contract = canonical) {
  validateDandiTraceContract(contract);
  assert(bytes instanceof Uint8Array && bytes.length === contract.preview.bytes, "preview byte length changed");
  const owned = new Uint8Array(bytes), digest = await globalThis.crypto.subtle.digest("SHA-256", owned.buffer);
  const sha256 = Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, "0")).join("");
  assert(sha256 === contract.preview.sha256, "preview SHA-256 changed");
  const payload = validateDandiTracePayload(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(owned)), contract);
  Object.freeze(payload.samples); Object.freeze(payload.nativeAmplitudeDeclaration); Object.freeze(payload);
  verifiedPayloads.set(payload, Object.freeze({ url: contract.preview.url, bytes: owned.length, sha256, status: "runtime_derivative_bytes_verified", wholeNwbSha256Verified: false }));
  return payload;
}

export async function loadDandiTrace({ signal, fetchImpl = globalThis.fetch } = {}) {
  signal?.throwIfAborted();
  const response = await fetchImpl(canonical.preview.url, { signal });
  assert(response.ok, `preview response ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer()); signal?.throwIfAborted();
  const payload = await verifyDandiTraceBytes(bytes); signal?.throwIfAborted(); return payload;
}

function requireVerified(payload) { assert(verifiedPayloads.has(payload), "current runtime byte verification is required; imported status labels cannot authorize samples"); }
export function dandiTraceWindow(payload, firstSample, cursorOffset = 0) {
  requireVerified(payload);
  assert(Number.isInteger(firstSample) && firstSample >= 0 && firstSample <= 27000 && firstSample % 3000 === 0, "window is outside the pinned first-second preview");
  assert(Number.isInteger(cursorOffset) && cursorOffset >= 0 && cursorOffset < 3000, "cursor is outside the selected window");
  return { firstSample, sampleCount: 3000, firstTimeSeconds: firstSample / 30000, lastTimeSeconds: (firstSample + 2999) / 30000,
    cursor: { sourceSampleIndex: firstSample + cursorOffset, timeSeconds: (firstSample + cursorOffset) / 30000, storedValue: payload.samples[firstSample + cursorOffset] },
    samples: payload.samples.slice(firstSample, firstSample + 3000) };
}

export function buildDandiTraceReceipt(payload, firstSample, cursorOffset = 0, generation = 1, generatedAt = new Date().toISOString()) {
  const window = dandiTraceWindow(payload, firstSample, cursorOffset);
  assert(Number.isSafeInteger(generation) && generation > 0 && typeof generatedAt === "string" && Number.isFinite(Date.parse(generatedAt)), "runtime generation or creation time invalid");
  return { documentType: "source_native_extracellular_trace_preview_receipt", schemaVersion: "0.1.0", release: "2.91.0-research.1", generatedAt,
    contractId: canonical.contractId, sourceIdentity: dandiTraceIdentity(), sourceContext: canonical.sourceContext,
    sourceCitation: canonical.citation, sourceUrl: canonical.sourceUrl, datasetDoi: canonical.doi,
    sourceAsset: canonical.sourceAsset, datasetInventory: canonical.datasetInventory, datasetLicense: canonical.datasetLicense,
    licenseScope: canonical.licenseScope, sourceReceipts: canonical.sourceReceipts, rangeReceipts: canonical.rangeReceipts,
    acquisition: canonical.acquisition, currentLoaderReceipt: verifiedPayloads.get(payload), runtimeGeneration: generation,
    channel: canonical.electrodes[0], previewSelection: { ...window, samples: undefined, cursorOffset },
    amplitude: canonical.amplitude, coordinateScope: canonical.coordinateScope, claims: canonical.claims,
    display: { representation: "polyline_of_every_stored_sample", xAxis: "source_time_seconds", yAxis: "stored_int16_value", physicalAmplitudeRescaling: false, filtering: false, decimation: false,
      yMinimum: -52, yMaximum: 52, isolatedUnitInference: false, fullRecordingReplay: false } };
}

export function restoreDandiTraceReceipt(receipt, payload) {
  requireVerified(payload);
  assert(receipt?.documentType === "source_native_extracellular_trace_preview_receipt", "unsupported trace receipt");
  const expected = buildDandiTraceReceipt(payload, receipt.previewSelection?.firstSample, receipt.previewSelection?.cursorOffset, receipt.runtimeGeneration, receipt.generatedAt);
  // JSON omits undefined values; compare persisted values, including missingness and scientific scope.
  assert(same(receipt, expected), "source identity, bytes, time, calibration or claims changed");
  return { firstSample: receipt.previewSelection.firstSample, cursorOffset: receipt.previewSelection.cursorOffset };
}

function csvCell(value) { const text = String(value ?? ""); return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
export function dandiTraceWindowCsv(payload, firstSample) {
  const window = dandiTraceWindow(payload, firstSample);
  const header = ["dandiset", "version", "asset_id", "electrical_series_id", "subject_id", "session_id", "native_electrode_id", "source_channel_index", "source_sample_index", "source_time_seconds", "stored_int16_value", "native_declared_unit", "native_conversion", "native_offset", "physical_calibration", "preview_sha256", "whole_nwb_sha256_verified", "dataset_citation", "source_url", "dataset_license"];
  return `${[header, ...window.samples.map((value, i) => ["001469", "0.250611.1844", canonical.sourceAsset.id, canonical.sourceContext.seriesObjectId,
    canonical.sourceContext.subjectId, null, "0", 0, firstSample + i, (firstSample + i) / 30000, value, "volts", 1, 0, "unverified", canonical.preview.sha256, false,
    canonical.citation, canonical.sourceUrl, canonical.datasetLicense.join("; ")])]
    .map(row => row.map(csvCell).join(",")).join("\n")}\n`;
}
