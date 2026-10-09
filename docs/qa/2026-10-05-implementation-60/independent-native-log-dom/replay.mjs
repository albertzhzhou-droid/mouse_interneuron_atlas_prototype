import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const CANONICAL = '/data/research_explorer_index_v1/search-index.json';
export const API = '/api/source-records/search-index.json';
export const ORIGINAL = Object.freeze({
  plain: { bytes: 12327624, sha256: 'c1fb786da4a1624b28fbe4c9c7063eb0f108b6a12e91d082008f1c7102e17085' },
  gzip: { bytes: 628095, sha256: '715236a44109be7bcd209c589d88342a7df9fbb4a2bbfc18f5d3f6ddbaac436b' },
});
export const FAULT = Object.freeze({
  plain: { bytes: 12327624, sha256: 'd6e8b386b3c9ff8cd785174d419116a07b78779e2fd60abbaf5eb4760e581552' },
  gzip: { bytes: 626119, sha256: 'b69d9d989646c542c1efcf001201910ed9680db001d5e9a41092fe07b2cfb6a6' },
});
const SOURCE_PINS = { gzip: { path: 'public/data/research_explorer_index_v1/search-index.json.gz', ...ORIGINAL.gzip }, decoded: { path: 'public/data/research_explorer_index_v1/search-index.json', ...ORIGINAL.plain } };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const COMPARE_KEYS = ['compareVersion', 'compareIndex', 'compareKeys', 'compareAnchor', 'compareQuery', 'compareNamespace', 'comparePage'];
const HEADING = 'Compare exact marker strings around an anchor record';
export function instant(value) {
  assert.ok(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T| ).*(?:Z|[+]00:00| UTC)$/.test(value), 'Explicit original UTC instant required');
  const ms = Date.parse(value); assert.ok(Number.isFinite(ms)); return ms;
}
export function bracket(value) {
  assert.ok(value && typeof value.startUTC === 'string' && typeof value.endUTC === 'string', 'Original startUTC/endUTC bracket required');
  const range = [instant(value.startUTC), instant(value.endUTC)]; assert.ok(range[0] <= range[1], 'Reversed bracket'); return range;
}
export function indexLog(text) {
  assert.ok(typeof text === 'string' && text.length && text.endsWith('\n'), 'Complete frozen LF log required');
  let last = -Infinity; const requests = new Map(), entries = [];
  for (const [i, line] of text.slice(0, -1).split('\n').entries()) {
    assert.ok(line.length, 'Empty log line'); const row = JSON.parse(line), ms = instant(row.time);
    assert.ok(ms >= last, 'Log UTC order regressed'); last = ms;
    const item = { ...row, ms, line: i + 1 }; entries.push(item);
    if (!Object.hasOwn(row, 'requestId')) continue;
    assert.ok(Number.isSafeInteger(row.requestId) && row.requestId > 0);
    if (row.event === 'request_start') { assert.ok(!requests.has(row.requestId), 'Request ID reused across proxy runs'); requests.set(row.requestId, []); }
    const events = requests.get(row.requestId); assert.ok(events, 'Event without request_start');
    if (events.length) for (const key of ['method', 'requestedTarget', 'requestOwner']) assert.equal(row[key], events[0][key], `Request changed ${key}`);
    events.push(item);
  }
  return { entries, requests };
}
function one(events, name, required = true) {
  const found = events.filter(row => row.event === name); assert.ok(found.length <= 1, `Duplicate ${name}`);
  if (required) assert.equal(found.length, 1, `Missing ${name}`); return found[0];
}
function values(headers, name) {
  assert.ok(Array.isArray(headers) && headers.length % 2 === 0);
  const found = []; for (let i = 0; i < headers.length; i += 2) if (headers[i].toLowerCase() === name) found.push(headers[i + 1]); return found;
}
export function originalFormat(status, headers) {
  assert.equal(status, 200, '304/partial/error cannot establish full original transport');
  assert.deepEqual(values(headers, 'content-type').map(v => v.toLowerCase()), ['application/json; charset=utf-8']);
  assert.deepEqual(values(headers, 'transfer-encoding'), []);
  const encoding = values(headers, 'content-encoding').map(v => v.toLowerCase());
  const format = encoding.length ? 'gzip' : 'plain';
  if (encoding.length) assert.deepEqual(encoding, ['gzip'], 'Unsupported/duplicate encoding');
  assert.deepEqual(values(headers, 'content-length'), [String(ORIGINAL[format].bytes)]); return format;
}
function configValue(doc) {
  const input = doc.config ?? doc;
  assert.equal(input.schemaVersion, 1); assert.ok(input.rules && !Array.isArray(input.rules));
  const rules = {};
  for (const [target, rule] of Object.entries(input.rules)) {
    assert.ok([CANONICAL, API].includes(target)); assert.ok(['pass', 'delay', 'decoded_checksum_fault'].includes(rule.mode));
    const allowed = rule.mode === 'delay' ? ['mode', 'delayMs'] : ['mode']; assert.ok(Object.keys(rule).every(key => allowed.includes(key)));
    if (rule.mode === 'delay') { const delayMs = rule.delayMs ?? 12000; assert.ok(Number.isSafeInteger(delayMs) && delayMs >= 1 && delayMs <= 12000); rules[target] = { mode: 'delay', delayMs }; }
    else rules[target] = { mode: rule.mode };
  }
  assert.equal((rules[API] ?? { mode: 'pass' }).mode, 'pass', 'This native replay owns no API measurement phase');
  return { schemaVersion: 1, rules };
}
function owned(indexed, requestId, config, mode, used) {
  assert.ok(Number.isSafeInteger(requestId) && requestId > 0 && !used.has(requestId), 'Missing/reused explicit phase request ID'); used.add(requestId);
  const events = indexed.requests.get(requestId); assert.ok(events, 'Explicit request absent');
  assert.equal(events[0].method, 'GET'); assert.equal(events[0].requestedTarget, CANONICAL); assert.equal(events[0].requestOwner, 'canonical_provider_route');
  assert.deepEqual(events[0].originalSourcePins, SOURCE_PINS, 'Request source authority descriptors differ');
  const rule = one(events, 'rule_selected'); assert.equal(rule.configSha256, sha(JSON.stringify(config))); assert.deepEqual(rule.rule, config.rules[CANONICAL] ?? { mode: 'pass' }); assert.equal(rule.rule.mode, mode);
  assert.deepEqual(events[0].localListen, { host: '127.0.0.1', port: 3005 }); assert.deepEqual(events[0].upstream, { host: '127.0.0.1', port: 3004 });
  return events;
}
export function transport(events, kind) {
  for (const name of ['downstream_disconnect', 'local_response', 'controlled_fault_rejected', 'configuration_or_target_error', 'upstream_error', 'upstream_body_error', 'upstream_incomplete']) assert.ok(!one(events, name, false), `${name} cannot establish successful checksum transport`);
  const start = one(events, 'upstream_start'), headers = one(events, 'upstream_headers'), complete = one(events, 'upstream_body_complete'), finish = one(events, 'response_finished');
  const format = originalFormat(headers.statusCode, headers.headers), source = ORIGINAL[format], served = kind === 'fault' ? FAULT[format] : source;
  assert.equal(start.upstreamTarget, CANONICAL); assert.equal(headers.upstreamTarget, CANONICAL); assert.equal(complete.upstreamTarget, CANONICAL);
  assert.equal(start.controlledBodySubstitution, kind === 'fault'); assert.equal(finish.statusCode, 200); assert.equal(finish.browserConsumptionEstablished, false);
  assert.ok(start.line < headers.line && headers.line < complete.line && complete.line < finish.line, 'Actual event order differs');
  for (const row of [complete, finish]) { assert.equal(row.upstreamReceivedBytes, source.bytes); assert.equal(row.upstreamReceivedBodySha256, source.sha256); }
  assert.equal(finish.handedToResponseBytes, served.bytes); assert.equal(finish.handedToResponseBodySha256, served.sha256);
  if (kind === 'fault') {
    const ready = one(events, 'controlled_body_ready'); assert.ok(complete.line < ready.line && ready.line < finish.line);
    assert.equal(ready.upstreamTarget, CANONICAL); assert.equal(ready.responseBodyFormat, format === 'plain' ? 'plain_canonical_json' : 'http_gzip_json');
    assert.equal(ready.originalUpstreamBytes, source.bytes); assert.equal(ready.originalUpstreamSha256, source.sha256);
    assert.deepEqual(ready.originalSourcePins, SOURCE_PINS); assert.deepEqual(ready.originalWireSourcePin, format === 'gzip' ? SOURCE_PINS.gzip : SOURCE_PINS.decoded);
    assert.equal(ready.controlledBodyBytes, served.bytes); assert.equal(ready.controlledBodySha256, served.sha256);
    assert.equal(ready.controlledDecodedBytes, ORIGINAL.plain.bytes); assert.equal(ready.controlledDecodedSha256, FAULT.plain.sha256);
    assert.deepEqual(ready.mutation, { offset: 12327623, originalByte: 10, replacementByte: 32, changedByteCount: 1, validJsonValuesUnchanged: true });
    assert.equal(ready.browserConsumptionEstablished, false); assert.equal(complete.handedToResponseBytes, 0); assert.equal(complete.handedToResponseBodySha256, sha(''));
    const expectedHeaders = [...headers.headers];
    if (format === 'gzip') for (let i = 0; i < expectedHeaders.length; i += 2) if (expectedHeaders[i].toLowerCase() === 'content-length') expectedHeaders[i + 1] = String(served.bytes);
    assert.deepEqual(ready.headers, expectedHeaders); assert.deepEqual(finish.headers, expectedHeaders);
  } else {
    assert.ok(!one(events, 'controlled_body_ready', false)); assert.deepEqual(finish.headers, headers.headers);
    assert.equal(complete.handedToResponseBytes, source.bytes); assert.equal(complete.handedToResponseBodySha256, source.sha256);
  }
  return { format, start, finish, source, served, requestId: events[0].requestId, lines: [events[0].line, events.at(-1).line] };
}
export function expectedView(url, records) {
  const parsed = new URL(url); assert.equal(parsed.origin, 'http://127.0.0.1:3005'); assert.equal(parsed.pathname, '/explore/cell-types/compare');
  const params = parsed.searchParams; for (const key of COMPARE_KEYS) assert.ok(params.getAll(key).length <= 1, 'Duplicate qualified bookmark field');
  assert.equal(params.get('compareVersion'), '1'); assert.equal(params.get('compareIndex'), ORIGINAL.plain.sha256); assert.ok(params.has('compareKeys'));
  const selected = JSON.parse(params.get('compareKeys')); assert.ok(Array.isArray(selected) && selected.length >= 2 && selected.length <= 4 && new Set(selected).size === selected.length, 'Exact qualified old basket required');
  const byKey = new Map(records.map(row => [row.key, row])); assert.equal(byKey.size, records.length);
  assert.ok(selected.every(key => typeof key === 'string' && key.startsWith('molecular_profile:') && byKey.has(key)));
  const anchor = params.get('compareAnchor'); assert.ok(selected.includes(anchor));
  const query = params.get('compareQuery') ?? '', namespace = params.get('compareNamespace') ?? '', rawPage = params.get('comparePage') ?? '0';
  assert.ok(query.length <= 180 && /^(?:0|[1-9]\d*)$/.test(rawPage)); const page = Number(rawPage); assert.ok(Number.isSafeInteger(page));
  if (namespace) assert.ok(records.some(row => row.namespace === namespace));
  const needle = query.toLocaleLowerCase('en-US');
  const matches = records.filter(row => (!namespace || row.namespace === namespace) && `${row.title} ${row.focusId} ${row.searchTerms.join(' ')}`.toLocaleLowerCase('en-US').includes(needle)).length;
  assert.ok(page < Math.max(1, Math.ceil(matches / 12)), 'Invalid qualified page');
  return { url, selected, anchor, query, namespace, page, pages: Math.max(1, Math.ceil(matches / 12)), byKey };
}
function anchorControl(doc) {
  const matches = doc.controls.filter(row => row.tag.toLowerCase() === 'select' && row.label.startsWith('Anchor record'));
  assert.ok(matches.length <= 1, 'Ambiguous scoped anchor control'); return matches[0];
}
export function assertDom(doc, state, expected) {
  assert.equal(doc.url, expected.url, 'Native URL changed from the exact qualified address');
  bracket(doc.toolCaptureWindowUTC); assert.ok(typeof doc.sectionText === 'string' && doc.sectionText.includes(HEADING), 'Workbench scope/heading absent');
  assert.ok(Array.isArray(doc.controls) && Array.isArray(doc.comparisons) && Array.isArray(doc.alerts) && Array.isArray(doc.statuses));
  assert.ok(typeof doc.selections === 'string', 'Original scoped selection text required even when empty');
  assert.ok(doc.controls.every(row => typeof row.tag === 'string' && typeof row.label === 'string' && typeof row.text === 'string'), 'Scoped controls must retain actual strings');
  const anchor = anchorControl(doc), selected = anchor?.options?.map(row => row.value) ?? [];
  const exports = doc.controls.filter(row => /^(?:Export evidence JSON|Export comparison CSV)/.test(row.text));
  const links = doc.controls.filter(row => row.text.trim() === 'Link to this comparison');
  const adds = doc.controls.filter(row => row.tag.toLowerCase() === 'button' && /Add to comparison/.test(row.text));
  if (state === 'waiting' || state === 'unavailable') {
    assert.deepEqual(selected, [], 'Old basket still in scoped anchor'); assert.equal(doc.comparisons.length, 0, 'Old report remained');
    assert.ok(exports.every(row => row.disabled === true), 'Scientific export still enabled'); assert.equal(links.length, 0, 'Comparison link still present');
    assert.ok(adds.every(row => row.disabled === true), 'Add still active before verified source');
    assert.ok(!/Remove\s/.test(doc.selections ?? ''), 'Old selection controls/text remain');
    if (state === 'waiting') { assert.deepEqual(doc.alerts, []); assert.ok(doc.statuses.some(text => /Waiting for the checksum-verified source index/.test(text))); }
    else assert.ok(doc.alerts.some(text => text.trim() === 'Research index checksum does not match the pinned manifest'), 'Actual decoded SHA failure alert absent;502/304/bookmark failure is separate');
  } else {
    assert.equal(state, 'ready'); assert.deepEqual(doc.alerts, []); assert.deepEqual(selected, expected.selected, 'Exact fullkey basket/order differs'); assert.equal(anchor.value, expected.anchor);
    assert.equal(doc.comparisons.length, expected.selected.length - 1); const a = expected.byKey.get(expected.anchor);
    assert.deepEqual(doc.comparisons.map(row => row.heading), expected.selected.filter(key => key !== expected.anchor).map(key => `${a.title} → ${expected.byKey.get(key).title}`));
    assert.equal(exports.length, 2); assert.ok(exports.every(row => row.disabled === false)); assert.equal(links.length, 1); assert.equal(new URL(links[0].href, doc.url).href, expected.url);
    assert.match(doc.sectionText, /387 source profiles across 10 namespaces/);
    const query = doc.controls.filter(row => row.label.startsWith('Search label, ID or source marker')); assert.equal(query.length, 1); assert.equal(query[0].value, expected.query);
    const namespace = doc.controls.filter(row => row.label.startsWith('Source namespace')); assert.equal(namespace.length, 1); assert.equal(namespace[0].value, expected.namespace);
    assert.ok(typeof doc.pages === 'string' && doc.pages.includes(`page ${expected.page + 1} / ${expected.pages}`));
  }
  return { state, selectedKeys: selected, anchor: anchor?.value ?? null, reportPairs: doc.comparisons.length, enabledExports: exports.filter(row => !row.disabled).length, enabledAdds: adds.filter(row => !row.disabled).length };
}
function action(value, loadJson) {
  assert.ok(value && typeof value.evidencePath === 'string' && value.ownerEvidence?.trim(), 'Original native action and explicit isolated-operation ownership required');
  const doc = loadJson(value.evidencePath); assert.ok(typeof doc.name === 'string' && doc.name.trim() && !doc.error, 'Native action failed/unnamed');
  assert.deepEqual(value.windowUTC, { startUTC: doc.startUTC, endUTC: doc.endUTC }, 'Sidecar changed native action bracket'); return bracket(doc);
}
/** Supplemental cache observation only; it cannot substitute for the main full200 phase. */
export function replayCachedDelay(observation, indexed, loadJson, records) {
  assert.equal(observation.kind, 'canonical_delay_cached_304_supplemental');
  const expected = expectedView(observation.qualifiedUrl, records), config = configValue(loadJson(observation.configPath));
  const events = owned(indexed, observation.requestId, config, 'delay', new Set()), trigger = action(observation.action, loadJson);
  for (const name of ['downstream_disconnect', 'local_response', 'controlled_fault_rejected', 'configuration_or_target_error', 'upstream_error', 'upstream_body_error', 'upstream_incomplete']) assert.ok(!one(events, name, false), `${name} cannot establish successful cached revalidation`);
  const pending = capture(observation.waiting, loadJson, 'waiting', expected), ready = capture(observation.ready, loadJson, 'ready', expected);
  const schedule = one(events, 'delay_scheduled'), start = one(events, 'upstream_start'), headers = one(events, 'upstream_headers'), complete = one(events, 'upstream_body_complete'), finish = one(events, 'response_finished');
  assert.equal(schedule.delayMs, config.rules[CANONICAL].delayMs); assert.equal(start.upstreamTarget, CANONICAL); assert.equal(start.controlledBodySubstitution, false);
  assert.equal(headers.statusCode, 304); assert.equal(finish.statusCode, 304); assert.deepEqual(finish.headers, headers.headers);
  assert.ok(start.line < headers.line && headers.line < complete.line && complete.line < finish.line);
  for (const row of [complete, finish]) { assert.equal(row.upstreamReceivedBytes, 0); assert.equal(row.handedToResponseBytes, 0); assert.equal(row.upstreamReceivedBodySha256, sha('')); assert.equal(row.handedToResponseBodySha256, sha('')); }
  assert.equal(finish.browserConsumptionEstablished, false);
  assert.ok(!one(events, 'controlled_body_ready', false) && !one(events, 'controlled_fault_rejected', false) && !one(events, 'local_response', false) && !one(events, 'downstream_disconnect', false));
  assert.ok(events[0].ms >= trigger[0] && trigger[1] <= pending.range[0] && events[0].ms <= pending.range[0]);
  assert.ok(schedule.ms <= pending.range[0] && pending.range[1] < schedule.ms + schedule.delayMs && pending.range[1] < start.ms);
  assert.ok(start.ms >= schedule.ms + schedule.delayMs && finish.ms <= ready.range[0]);
  return { status: 'PASS_SUPPLEMENTAL_DELAY_CACHE_REVALIDATION_DOM_ONLY', kind: observation.kind, requestId: observation.requestId, waiting: pending, ready,
    upstreamStatus: 304, upstreamBodyBytes: 0, newFull200SourceTransferEstablished: false, cachedBodySha256EstablishedByProxy: false, fulfillsMainFull200DelayAcceptance: false, browserConsumptionInferredFromProxy: false };
}
function capture(value, loadJson, state, expected) {
  assert.ok(value?.path); const doc = loadJson(value.path); assert.ok(doc.toolCaptureWindowUTC);
  assert.deepEqual(value.windowUTC, doc.toolCaptureWindowUTC, 'Sidecar changed original embedded capture bracket');
  const range = bracket(doc.toolCaptureWindowUTC); return { range, state: assertDom(doc, state, expected), path: value.path };
}
export function replayManifest(manifest, text, loadJson, records) {
  assert.equal(manifest.schemaVersion, 1); assert.equal(manifest.status, 'NATIVE_READY', 'Preparation is not native-ready');
  assert.equal(manifest.phases.length, 2); assert.equal(manifest.phases[1].kind, 'canonical_checksum_failure_recovery');
  const cachedDelay = manifest.phases[0].kind === 'canonical_delay_cached_304_supplemental';
  assert.equal(manifest.scope, cachedDelay ? 'canonical_fault_recovery_with_cached_delay_supplemental' : 'canonical_full200_delay_and_fault_recovery');
  assert.ok(cachedDelay || manifest.phases[0].kind === 'canonical_delay_readiness');
  const expected = expectedView(manifest.qualifiedUrl, records), indexed = indexLog(text), used = new Set();
  const delayed = manifest.phases[0], config = configValue(loadJson(delayed.configPath));
  const d = owned(indexed, delayed.requestId, config, 'delay', used), trigger = action(delayed.action, loadJson);
  let pending, ready, delayResult;
  if (cachedDelay) {
    assert.equal(delayed.qualifiedUrl, manifest.qualifiedUrl);
    delayResult = replayCachedDelay(delayed, indexed, loadJson, records); pending = delayResult.waiting; ready = delayResult.ready;
  } else {
    pending = capture(delayed.waiting, loadJson, 'waiting', expected); ready = capture(delayed.ready, loadJson, 'ready', expected); const success = transport(d, 'original');
    const scheduled = one(d, 'delay_scheduled'); assert.equal(scheduled.delayMs, config.rules[CANONICAL].delayMs);
    assert.ok(d[0].ms >= trigger[0] && d[0].ms <= pending.range[0]); assert.ok(trigger[1] <= pending.range[0]);
    assert.ok(scheduled.ms <= pending.range[0] && pending.range[1] < scheduled.ms + scheduled.delayMs && pending.range[1] < success.start.ms, 'Waiting DOM not entirely within actual held interval');
    assert.ok(success.start.ms >= scheduled.ms + scheduled.delayMs, 'Upstream contacted before bounded delay'); assert.ok(success.finish.ms <= ready.range[0], 'Ready capture predates actual full200 bytes');
    delayResult = { kind: delayed.kind, requestId: delayed.requestId, format: success.format, waiting: pending, ready, source: success.source, fulfillsMainFull200DelayAcceptance: true };
  }
  const failed = manifest.phases[1]; const before = capture(failed.before, loadJson, 'ready', expected);
  assert.equal(failed.before.path, delayed.ready.path, 'Old-ready baseline must be the prior source-bound native ready capture');
  const faultConfig = configValue(loadJson(failed.faultConfigPath)), retryConfig = configValue(loadJson(failed.retryConfigPath));
  const f = owned(indexed, failed.faultRequestId, faultConfig, 'decoded_checksum_fault', used), r = owned(indexed, failed.retryRequestId, retryConfig, 'pass', used);
  const faultAction = action(failed.faultAction, loadJson), retryAction = action(failed.retryAction, loadJson), fault = transport(f, 'fault'), retry = transport(r, 'original');
  const unavailable = capture(failed.unavailable, loadJson, 'unavailable', expected), restored = capture(failed.restored, loadJson, 'ready', expected);
  assert.ok(before.range[1] <= faultAction[0]); assert.ok(f[0].ms >= faultAction[0] && f[0].ms <= unavailable.range[0]);
  assert.ok(faultAction[1] <= unavailable.range[0] && fault.finish.ms <= unavailable.range[0], 'Failure DOM predates completed controlled body/action');
  assert.ok(unavailable.range[1] <= retryAction[0]); assert.ok(r[0].ms >= retryAction[0] && r[0].ms <= restored.range[0]);
  assert.ok(retryAction[1] <= restored.range[0] && retry.finish.ms <= restored.range[0], 'Recovery DOM predates fresh full200 original response/action');
  assert.ok(r[0].ms > fault.finish.ms, 'Recovery request is not a fresh request after failure');
  const nonClaims = [...indexed.requests].filter(([id]) => !used.has(id)).map(([requestId, events]) => ({ requestId, target: events[0].requestedTarget, routeOwner: events[0].requestOwner,
    classification: one(events, 'controlled_fault_rejected', false) ? 'controlled_source_or_header_rejected_not_decoded_sha' : one(events, 'response_finished', false)?.statusCode === 304 ? 'cache_304_not_fresh_full200' : events[0].requestedTarget === API ? 'api_measurement_not_claimed' : 'unowned_request_not_claimed' }));
  const declared = manifest.unownedCanonicalRequests;
  assert.ok(Array.isArray(declared), 'Explicit unowned canonical request disposition required');
  assert.equal(new Set(declared.map(row => row.requestId)).size, declared.length);
  assert.ok(declared.every(row => Number.isSafeInteger(row.requestId) && row.reason?.trim()));
  assert.deepEqual(declared.map(row => row.requestId).sort((a, b) => a - b), nonClaims.filter(row => row.target === CANONICAL).map(row => row.requestId).sort((a, b) => a - b), 'Unowned canonical request hidden or inferred');
  return { status: cachedDelay ? 'PASS_CANONICAL_FAULT_RECOVERY_WITH_SUPPLEMENTAL_CACHED_DELAY' : 'PASS_SCOPED_CANONICAL_NATIVE_LOG_DOM_REPLAY', scope: manifest.scope, phases: [
    delayResult,
    { kind: failed.kind, faultRequestId: failed.faultRequestId, retryRequestId: failed.retryRequestId, faultFormat: fault.format, retryFormat: retry.format, before, unavailable, restored, original: retry.source, controlled: fault.served }],
    nonClaims, exactRequestIds: [...used], mainFull200DelayAcceptanceEstablished: !cachedDelay, apiNativePhasesClaimed: 0, routeOwnerIsInitiator: false, proxyBytesEstablishBrowserConsumption: false,
    evidenceBoundary: 'Proxy transport and original native DOM/action timing correlation only. Scientific report/export fidelity is independently replayed by the source peer; no new science/count/identity/geometry admission.' };
}

function physicalPin(filename) {
  const fd = fs.openSync(filename, 'r'), chunks = [], hash = createHash('sha256'); let offset = 0;
  try { const before = fs.fstatSync(fd, { bigint: true }); for (;;) { const block = Buffer.alloc(4096), count = fs.readSync(fd, block, 0, block.length, offset); if (!count) break; const part = block.subarray(0, count); chunks.push(part); hash.update(part); offset += count; }
    const after = fs.fstatSync(fd, { bigint: true }); assert.ok(before.ino === after.ino && before.mtimeNs === after.mtimeNs && before.size === after.size && BigInt(offset) === after.size, 'Physical input changed during positioned read');
  } finally { fs.closeSync(fd); }
  return { path: filename, bytes: offset, sha256: hash.digest('hex'), text: Buffer.concat(chunks).toString('utf8') };
}
/** Only root's explicit later native-ready instruction authorizes CLI execution against actual files. */
export function run(manifestPath, outputPath) {
  assert.ok(path.resolve(outputPath).startsWith('/private/tmp/ohri-i60-native-live-replay/'), 'Output is temp-only');
  const pins = new Map(); const read = filename => { const absolute = path.resolve(filename); if (!pins.has(absolute)) pins.set(absolute, physicalPin(absolute)); return pins.get(absolute); };
  const load = filename => JSON.parse(read(filename).text), manifest = load(manifestPath); assert.equal(manifest.status, 'NATIVE_READY');
  assert.equal(manifest.proxyPreparationSeal.sha256, '4995caf3889089a99ee6db53401b127f6587b8d065339c495f4ccbd82f3e76b8');
  const sealPin = read(manifest.proxyPreparationSeal.path); assert.equal(sealPin.bytes, manifest.proxyPreparationSeal.bytes); assert.equal(sealPin.sha256, manifest.proxyPreparationSeal.sha256);
  for (const item of JSON.parse(sealPin.text).files) { const got = read(item.path); assert.equal(got.bytes, item.bytes); assert.equal(got.sha256, item.sha256); }
  const log = read(manifest.frozenLog.path); assert.equal(log.bytes, manifest.frozenLog.bytes); assert.equal(log.sha256, manifest.frozenLog.sha256);
  assert.ok(path.resolve(manifest.originalProxyLog.path).startsWith('/private/tmp/ohri-i60-index-native-proxy/'), 'Original log must be the owned private proxy log');
  const originalLog = read(manifest.originalProxyLog.path); assert.equal(originalLog.bytes, manifest.originalProxyLog.bytes); assert.equal(originalLog.sha256, manifest.originalProxyLog.sha256);
  assert.equal(originalLog.bytes, log.bytes); assert.equal(originalLog.sha256, log.sha256, 'Frozen copy differs from original stopped log');
  assert.ok(Array.isArray(manifest.supportingEvidencePaths), 'Preserve metadata/restart and unsuccessful-attempt evidence explicitly');
  for (const filename of manifest.supportingEvidencePaths) read(filename);
  const source = read(manifest.sourceIndex.path); assert.equal(source.bytes, ORIGINAL.plain.bytes); assert.equal(source.sha256, ORIGINAL.plain.sha256);
  const records = JSON.parse(source.text).records.filter(row => row.focusKind === 'molecular_profile'); assert.equal(records.length, 387); assert.equal(new Set(records.map(row => row.namespace)).size, 10);
  const report = replayManifest(manifest, log.text, load, records);
  for (const item of pins.values()) { const fresh = physicalPin(item.path); assert.equal(fresh.bytes, item.bytes); assert.equal(fresh.sha256, item.sha256, 'Input epoch changed after replay'); }
  const receipt = { ...report, inputPins: [...pins.values()].map(({ text, ...pin }) => pin), manifestPath, frozenLogSha256: log.sha256 };
  fs.writeFileSync(outputPath, JSON.stringify(receipt, null, 2) + '\n'); return receipt;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 4, 'Usage: replay.mjs native-manifest.json /private/tmp/ohri-i60-native-live-replay/receipt.json');
  const result = run(process.argv[2], process.argv[3]); process.stdout.write(JSON.stringify({ status: result.status, phases: result.phases.length, requestIds: result.exactRequestIds, apiNativePhasesClaimed: 0 }) + '\n');
}
