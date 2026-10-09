import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { CANONICAL, API, ORIGINAL, FAULT, indexLog, transport, expectedView, assertDom, replayManifest, replayCachedDelay, instant } from './replay.mjs';

const records = JSON.parse(fs.readFileSync('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype/public/data/research_explorer_index_v1/search-index.json')).records.filter(row => row.focusKind === 'molecular_profile');
const selected = records.slice(0, 2).map(row => row.key), anchor = selected[0];
const url = new URL('http://127.0.0.1:3005/explore/cell-types/compare');
url.searchParams.set('compareVersion', '1'); url.searchParams.set('compareIndex', ORIGINAL.plain.sha256); url.searchParams.set('compareKeys', JSON.stringify(selected)); url.searchParams.set('compareAnchor', anchor);
const URL_VALUE = url.href, expected = expectedView(URL_VALUE, records), sha = value => createHash('sha256').update(value).digest('hex');
const SOURCE_PINS = { gzip: { path: 'public/data/research_explorer_index_v1/search-index.json.gz', ...ORIGINAL.gzip }, decoded: { path: 'public/data/research_explorer_index_v1/search-index.json', ...ORIGINAL.plain } };
const utc = ms => new Date(Date.parse('2026-10-05T08:00:00.000Z') + ms).toISOString();
const clock = (start, end) => ({ startUTC: utc(start), endUTC: utc(end) });
const clone = value => structuredClone(value);
function config(mode) { return { schemaVersion: 1, rules: { [API]: { mode: 'pass' }, [CANONICAL]: mode === 'delay' ? { mode, delayMs: 12000 } : { mode } } }; }
function header(format) { return ['Content-Type', 'application/json; charset=utf-8', ...(format === 'gzip' ? ['Content-Encoding', 'gzip'] : []), 'Content-Length', String(ORIGINAL[format].bytes), 'ETag', 'original-validator', 'Cache-Control', 'public, max-age=3600']; }
function sourceFields(format, forwarded) { return { upstreamReceivedBytes: ORIGINAL[format].bytes, upstreamReceivedBodySha256: ORIGINAL[format].sha256, handedToResponseBytes: forwarded.bytes, handedToResponseBodySha256: forwarded.sha256 }; }
function request(id, mode, format, start, upstreamAt = start + 2) {
  const rows = [], add = (event, time, extra = {}) => rows.push({ time: utc(time), requestId: id, method: 'GET', requestedTarget: CANONICAL, requestOwner: 'canonical_provider_route', event, ...extra });
  add('request_start', start, { localListen: { host: '127.0.0.1', port: 3005 }, upstream: { host: '127.0.0.1', port: 3004 }, originalSourcePins: clone(SOURCE_PINS) });
  add('rule_selected', start + 1, { rule: config(mode).rules[CANONICAL], configSha256: sha(JSON.stringify(config(mode))) });
  if (mode === 'delay') add('delay_scheduled', start + 2, { delayMs: 12000 });
  add('upstream_start', upstreamAt, { upstreamTarget: CANONICAL, controlledBodySubstitution: mode === 'decoded_checksum_fault' });
  add('upstream_headers', upstreamAt + 1, { upstreamTarget: CANONICAL, statusCode: 200, headers: header(format) });
  add('upstream_body_complete', upstreamAt + 2, { upstreamTarget: CANONICAL, ...sourceFields(format, mode === 'decoded_checksum_fault' ? { bytes: 0, sha256: sha('') } : ORIGINAL[format]) });
  const servedHeaders = header(format); if (mode === 'decoded_checksum_fault' && format === 'gzip') servedHeaders[servedHeaders.findIndex(value => value === 'Content-Length') + 1] = String(FAULT.gzip.bytes);
  if (mode === 'decoded_checksum_fault') add('controlled_body_ready', upstreamAt + 3, {
    upstreamTarget: CANONICAL, responseBodyFormat: format === 'plain' ? 'plain_canonical_json' : 'http_gzip_json', originalSourcePins: clone(SOURCE_PINS), originalWireSourcePin: clone(format === 'gzip' ? SOURCE_PINS.gzip : SOURCE_PINS.decoded), originalUpstreamBytes: ORIGINAL[format].bytes, originalUpstreamSha256: ORIGINAL[format].sha256,
    controlledBodyBytes: FAULT[format].bytes, controlledBodySha256: FAULT[format].sha256, controlledDecodedBytes: ORIGINAL.plain.bytes, controlledDecodedSha256: FAULT.plain.sha256,
    mutation: { offset: 12327623, originalByte: 10, replacementByte: 32, changedByteCount: 1, validJsonValuesUnchanged: true }, headers: servedHeaders, browserConsumptionEstablished: false,
  });
  add('response_finished', upstreamAt + 4, { statusCode: 200, headers: servedHeaders, ...sourceFields(format, mode === 'decoded_checksum_fault' ? FAULT[format] : ORIGINAL[format]), browserConsumptionEstablished: false });
  return rows;
}
const control = (tag, text, label = '', value = '', extra = {}) => ({ tag, text, label, value, disabled: false, href: null, options: [], ...extra });
function doc(state, range) {
  const value = { name: `synthetic-${state}`, url: URL_VALUE, toolCaptureWindowUTC: range, sectionText: 'UPG106 Compare exact marker strings around an anchor record', controls: [], comparisons: [], alerts: [], statuses: [], selections: '', pages: '' };
  if (state === 'waiting') value.statuses = ['Waiting for the checksum-verified source index…'];
  else if (state === 'unavailable') value.alerts = ['Research index checksum does not match the pinned manifest'];
  else {
    value.sectionText += ' 387 source profiles across 10 namespaces';
    value.controls = [control('SELECT', '', 'Anchor record', anchor, { options: selected.map(key => ({ value: key, text: expected.byKey.get(key).title, selected: key === anchor })) }),
      control('INPUT', '', 'Search label, ID or source marker', ''), control('SELECT', '', 'Source namespace', ''),
      control('BUTTON', 'Export evidence JSON'), control('BUTTON', 'Export comparison CSV'), control('A', 'Link to this comparison', '', '', { href: url.pathname + url.search })];
    value.comparisons = [{ heading: `${expected.byKey.get(anchor).title} → ${expected.byKey.get(selected[1]).title}`, table: [], receipts: [] }];
    value.selections = `Remove ${expected.byKey.get(anchor).title}`; value.pages = `387 matches · page 1 / ${Math.ceil(387 / 12)}`;
  }
  return value;
}
function fixture(format = 'gzip') {
  const documents = { 'delay-config': config('delay'), 'fault-config': config('decoded_checksum_fault'), 'retry-config': config('pass'),
    'delay-action': { name: 'fresh-load-qualified-address', ...clock(0, 20), error: null }, 'fault-action': { name: 'hard-fresh-reload-for-fault', ...clock(14000, 14020), error: null }, 'retry-action': { name: 'hard-fresh-reload-for-pass', ...clock(16000, 16020), error: null },
    waiting: doc('waiting', clock(1000, 1100)), ready: doc('ready', clock(13000, 13100)), unavailable: doc('unavailable', clock(15000, 15100)), restored: doc('ready', clock(17000, 17100)) };
  const action = key => ({ evidencePath: key, windowUTC: { startUTC: documents[key].startUTC, endUTC: documents[key].endUTC }, ownerEvidence: 'Synthetic isolated native operation witness only.' });
  const capture = key => ({ path: key, windowUTC: documents[key].toolCaptureWindowUTC });
  const manifest = { schemaVersion: 1, status: 'NATIVE_READY', scope: 'canonical_full200_delay_and_fault_recovery', qualifiedUrl: URL_VALUE, unownedCanonicalRequests: [], phases: [
    { kind: 'canonical_delay_readiness', configPath: 'delay-config', requestId: 1, action: action('delay-action'), waiting: capture('waiting'), ready: capture('ready') },
    { kind: 'canonical_checksum_failure_recovery', faultConfigPath: 'fault-config', retryConfigPath: 'retry-config', faultRequestId: 2, retryRequestId: 3, before: capture('ready'), faultAction: action('fault-action'), retryAction: action('retry-action'), unavailable: capture('unavailable'), restored: capture('restored') } ] };
  const rows = [...request(1, 'delay', format, 10, 12012), ...request(2, 'decoded_checksum_fault', format, 14005), ...request(3, 'pass', format, 16005)].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  return { documents, manifest, rows };
}
function replay(f) { return replayManifest(f.manifest, f.rows.map(row => JSON.stringify(row)).join('\n') + '\n', key => f.documents[key], records); }
function rejects(change, format) { const f = fixture(format); change(f); assert.throws(() => replay(f)); }

test('exact current proxy event fields replay plain and gzip canonical phases with no API claim', () => {
  for (const format of ['plain', 'gzip']) { const result = replay(fixture(format)); assert.equal(result.phases.length, 2); assert.deepEqual(result.exactRequestIds, [1, 2, 3]); assert.equal(result.apiNativePhasesClaimed, 0); assert.equal(result.proxyBytesEstablishBrowserConsumption, false); }
});
test('preparation status and extra/API phases cannot pass native-ready scope', () => {
  rejects(f => f.manifest.status = 'PREPARATION_NOT_NATIVE_READY'); rejects(f => f.manifest.phases.push(f.manifest.phases[0])); rejects(f => f.manifest.phases[0].kind = 'api_delay');
});
test('explicit request IDs cannot be reused, absent, API-owned or target aliases', () => {
  rejects(f => f.manifest.phases[1].retryRequestId = 1); rejects(f => f.manifest.phases[0].requestId = 999);
  rejects(f => { for (const row of f.rows.filter(row => row.requestId === 1)) { row.requestedTarget = API; row.requestOwner = 'compressed_api_route'; } });
  rejects(f => { for (const row of f.rows.filter(row => row.requestId === 1)) row.requestedTarget += '?fresh=1'; });
});
test('original UTC brackets are mandatory and sidecar cannot alter capture/action clocks', () => {
  rejects(f => delete f.documents.waiting.toolCaptureWindowUTC); rejects(f => f.manifest.phases[0].waiting.windowUTC = clock(999, 1100));
  rejects(f => delete f.manifest.phases[0].action.evidencePath); rejects(f => f.documents['fault-action'].error = 'failed locator');
  rejects(f => f.manifest.phases[1].retryAction.windowUTC = clock(15000, 16020));
});
test('waiting capture must be after request/action and wholly before deadline and upstream I/O', () => {
  rejects(f => { f.documents.waiting.toolCaptureWindowUTC = clock(5, 100); f.manifest.phases[0].waiting.windowUTC = f.documents.waiting.toolCaptureWindowUTC; });
  rejects(f => { f.documents.waiting.toolCaptureWindowUTC = clock(11000, 12013); f.manifest.phases[0].waiting.windowUTC = f.documents.waiting.toolCaptureWindowUTC; });
  rejects(f => f.rows.find(row => row.event === 'upstream_start' && row.requestId === 1).time = utc(12000));
});
test('ready/failure/recovery captures cannot precede completion of their own distinct request', () => {
  rejects(f => { f.documents.ready.toolCaptureWindowUTC = clock(12010, 12011); f.manifest.phases[0].ready.windowUTC = f.documents.ready.toolCaptureWindowUTC; f.manifest.phases[1].before.windowUTC = f.documents.ready.toolCaptureWindowUTC; });
  rejects(f => { f.documents.unavailable.toolCaptureWindowUTC = clock(14006, 14007); f.manifest.phases[1].unavailable.windowUTC = f.documents.unavailable.toolCaptureWindowUTC; });
  rejects(f => { f.documents.restored.toolCaptureWindowUTC = clock(16006, 16007); f.manifest.phases[1].restored.windowUTC = f.documents.restored.toolCaptureWindowUTC; });
});
test('wrong original/controlled/decode body fields and changed gzip headers cannot establish fault', () => {
  rejects(f => f.rows.find(row => row.event === 'controlled_body_ready').controlledDecodedSha256 = ORIGINAL.plain.sha256);
  rejects(f => f.rows.find(row => row.event === 'controlled_body_ready').mutation.changedByteCount = 2);
  rejects(f => f.rows.find(row => row.event === 'response_finished' && row.requestId === 2).handedToResponseBodySha256 = ORIGINAL.gzip.sha256);
  rejects(f => f.rows.find(row => row.event === 'controlled_body_ready').headers.push('X-Forged', '1'));
  rejects(f => f.rows.find(row => row.event === 'controlled_body_ready').originalWireSourcePin.sha256 = FAULT.gzip.sha256);
});
test('304,502/source rejection and disconnect are failures rather than decoded checksum evidence', () => {
  rejects(f => f.rows.find(row => row.event === 'upstream_headers' && row.requestId === 2).statusCode = 304);
  rejects(f => f.rows.find(row => row.event === 'response_finished' && row.requestId === 2).statusCode = 502);
  rejects(f => { const base = f.rows.find(row => row.requestId === 2); f.rows.splice(f.rows.findIndex(row => row.requestId === 3), 0, { ...base, time: utc(14019), event: 'controlled_fault_rejected' }); });
  rejects(f => { const base = f.rows.find(row => row.requestId === 3); f.rows.push({ ...base, time: utc(16099), event: 'downstream_disconnect' }); });
});
test('partial frozen log, duplicate IDs/events, wrong owner and regressed time reject', () => {
  assert.throws(() => indexLog(JSON.stringify(fixture().rows[0])));
  rejects(f => f.rows.splice(1, 0, { ...f.rows[0] })); rejects(f => f.rows[1].requestOwner = 'compressed_api_route');
  rejects(f => f.rows[1].time = utc(0)); rejects(f => f.rows.splice(4, 0, { ...f.rows[4] }));
});
test('config must match each actual request mode/hash and API must remain pass', () => {
  rejects(f => f.documents['retry-config'].rules[API] = { mode: 'delay', delayMs: 1 });
  rejects(f => f.rows.find(row => row.event === 'rule_selected' && row.requestId === 3).configSha256 = '0'.repeat(64));
  rejects(f => f.documents['fault-config'].rules[CANONICAL].mode = 'pass');
});
test('waiting/unavailable cannot retain basket/report/Remove/enabled Add/export/link', () => {
  rejects(f => f.documents.waiting.controls.push(control('BUTTON', 'Add to comparison')));
  rejects(f => f.documents.unavailable.controls.push(control('BUTTON', 'Export evidence JSON')));
  rejects(f => f.documents.unavailable.comparisons.push({ heading: 'old report' }));
  rejects(f => f.documents.unavailable.controls.push(control('A', 'Link to this comparison', '', '', { href: URL_VALUE })));
  rejects(f => f.documents.waiting.selections = 'Remove old source');
  rejects(f => f.documents.unavailable.controls.push(control('SELECT', '', 'Anchor record', selected[0], { options: [{ value: selected[0] }] })));
});
test('unavailable needs exact source checksum error; bookmark,502 or byte-count errors are insufficient', () => {
  for (const text of ['Research index request failed (502)', 'Research index byte count/checksum does not match the pinned manifest', 'This comparison bookmark does not match the current checksum-verified source index.']) rejects(f => f.documents.unavailable.alerts = [text]);
});
test('ready must preserve exact URL/current fullkeys/anchor/order/report/link/exports/filter page', () => {
  rejects(f => f.documents.restored.url += '#different'); rejects(f => f.documents.restored.controls[0].options.reverse());
  rejects(f => f.documents.restored.controls[0].value = selected[1]); rejects(f => f.documents.restored.comparisons[0].heading = 'foreign → source');
  rejects(f => f.documents.restored.controls.find(row => row.text === 'Export evidence JSON').disabled = true);
  rejects(f => f.documents.restored.controls.find(row => row.text === 'Link to this comparison').href += '#different');
  rejects(f => f.documents.restored.pages = 'page 2 / 33'); rejects(f => f.documents.restored.controls.find(row => row.label === 'Source namespace').value = 'foreign');
});
test('qualified authority rejects stale/duplicate/foreign keys and invalid namespace/page/anchor', () => {
  for (const change of [p => p.set('compareIndex', '0'.repeat(64)), p => p.append('compareVersion', '1'), p => p.set('compareKeys', JSON.stringify([selected[0], selected[0]])), p => p.set('compareKeys', JSON.stringify([selected[0], 'molecular_profile:foreign'])), p => p.set('compareAnchor', 'molecular_profile:foreign'), p => p.set('compareNamespace', 'foreign'), p => p.set('comparePage', '33')]) {
    const changed = new URL(URL_VALUE); change(changed.searchParams); assert.throws(() => expectedView(changed.href, records));
  }
});
test('source-bound prior ready baseline and failure→fresh retry action ordering cannot be replaced', () => {
  rejects(f => f.manifest.phases[1].before.path = 'restored'); rejects(f => { f.documents['retry-action'].startUTC = utc(14900); f.manifest.phases[1].retryAction.windowUTC.startUTC = utc(14900); });
  rejects(f => { const row = f.rows.find(row => row.event === 'request_start' && row.requestId === 3); row.time = utc(14014); f.rows.sort((a, b) => Date.parse(a.time) - Date.parse(b.time)); });
});
test('extra canonical requests require explicit dispositions; API is recorded only as nonclaimed', () => {
  const f = fixture(); const extra = request(4, 'pass', 'plain', 18000); f.rows.push(...extra);
  assert.throws(() => replay(f)); f.manifest.unownedCanonicalRequests = [{ requestId: 4, reason: 'Explicit synthetic unrelated canonical observation.' }];
  const result = replay(f); assert.equal(result.nonClaims.length, 1);
  for (const row of extra) { row.requestedTarget = API; row.requestOwner = 'compressed_api_route'; }
  f.manifest.unownedCanonicalRequests = []; const withApi = replay(f); assert.equal(withApi.apiNativePhasesClaimed, 0); assert.equal(withApi.nonClaims[0].classification, 'api_measurement_not_claimed');
});
test('actual-shaped delayed304 can be supplemental waiting→ready but cannot replace main full200 proof', () => {
  const f = fixture(), empty = { bytes: 0, sha256: sha('') };
  for (const row of f.rows.filter(row => row.requestId === 1)) {
    if (row.event === 'upstream_headers' || row.event === 'response_finished') { row.statusCode = 304; row.headers = ['ETag', 'original-validator', 'Content-Encoding', 'gzip']; }
    if (row.event === 'upstream_body_complete' || row.event === 'response_finished') Object.assign(row, { upstreamReceivedBytes: 0, upstreamReceivedBodySha256: empty.sha256, handedToResponseBytes: 0, handedToResponseBodySha256: empty.sha256 });
  }
  const observation = { ...f.manifest.phases[0], kind: 'canonical_delay_cached_304_supplemental', qualifiedUrl: URL_VALUE };
  const indexed = indexLog(f.rows.map(row => JSON.stringify(row)).join('\n') + '\n');
  const report = replayCachedDelay(observation, indexed, key => f.documents[key], records);
  assert.equal(report.newFull200SourceTransferEstablished, false); assert.equal(report.cachedBodySha256EstablishedByProxy, false); assert.equal(report.fulfillsMainFull200DelayAcceptance, false);
  assert.throws(() => replay(f));
  f.manifest.scope = 'canonical_fault_recovery_with_cached_delay_supplemental'; f.manifest.phases[0] = observation;
  const scoped = replay(f); assert.equal(scoped.status, 'PASS_CANONICAL_FAULT_RECOVERY_WITH_SUPPLEMENTAL_CACHED_DELAY'); assert.equal(scoped.mainFull200DelayAcceptanceEstablished, false);
  assert.equal(scoped.apiNativePhasesClaimed, 0);
  const bad = clone(f); bad.rows.find(row => row.requestId === 1 && row.event === 'response_finished').handedToResponseBodySha256 = ORIGINAL.gzip.sha256;
  assert.throws(() => replayCachedDelay(observation, indexLog(bad.rows.map(row => JSON.stringify(row)).join('\n') + '\n'), key => bad.documents[key], records));
});
test('raw UTC tool strings are accepted without rewriting while timezone-free or local clocks reject', () => {
  assert.equal(instant('2026-10-05 08:00:00 UTC'), instant('2026-10-05T08:00:00.000Z'));
  assert.throws(() => instant('2026-10-05 08:00:00')); assert.throws(() => instant('2026-10-05T08:00:00-04:00'));
  const f = fixture(); f.documents.restored.controls.find(row => row.label === 'Source namespace').label += ' All source namespaces'; assert.equal(replay(f).phases.length, 2);
});
test('source descriptors and zero forwarded hash at fault gate cannot be relabelled or omitted', () => {
  rejects(f => delete f.rows.find(row => row.event === 'request_start' && row.requestId === 2).originalSourcePins);
  rejects(f => f.rows.find(row => row.event === 'controlled_body_ready').originalWireSourcePin.path = '/different-source');
  rejects(f => f.rows.find(row => row.event === 'controlled_body_ready').originalSourcePins.decoded.sha256 = FAULT.plain.sha256);
  rejects(f => f.rows.find(row => row.event === 'upstream_body_complete' && row.requestId === 2).handedToResponseBodySha256 = FAULT.gzip.sha256);
});
test('cached304 supplemental rejects the same stream/config/error event family as complete transport', () => {
  for (const event of ['upstream_error', 'upstream_body_error', 'upstream_incomplete', 'configuration_or_target_error', 'downstream_disconnect', 'local_response', 'controlled_fault_rejected']) {
    const f = fixture(); f.manifest.scope = 'canonical_fault_recovery_with_cached_delay_supplemental';
    f.manifest.phases[0].kind = 'canonical_delay_cached_304_supplemental'; f.manifest.phases[0].qualifiedUrl = URL_VALUE;
    for (const row of f.rows.filter(row => row.requestId === 1)) {
      if (row.event === 'upstream_headers' || row.event === 'response_finished') { row.statusCode = 304; row.headers = ['ETag', 'original-validator']; }
      if (row.event === 'upstream_body_complete' || row.event === 'response_finished') Object.assign(row, { upstreamReceivedBytes: 0, upstreamReceivedBodySha256: sha(''), handedToResponseBytes: 0, handedToResponseBodySha256: sha('') });
    }
    const original = f.rows.find(row => row.requestId === 1); f.rows.push({ ...original, event, time: utc(12015) }); f.rows.sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
    assert.throws(() => replay(f));
  }
});
