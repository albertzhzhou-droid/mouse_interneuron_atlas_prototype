import test from 'node:test';
import assert from 'node:assert/strict';
import { Writable, PassThrough } from 'node:stream';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { loadVerifiedResearchExplorerIndex, researchExplorerLoadingReceipt } from '/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype/app/research-explorer-index.js';
import { LISTEN, UPSTREAM, CONTROLLED_PATHS, validateConfig, ruleForRequest, makeHandler, loggedHeaders, parseArguments, readPrivateConfig, createPrivateLogger, privateWebTarget, INDEX_PATH, SOURCE_PINS, validateFaultFixture, verifyOriginalGzip, validateGzipHeaders, faultResponseHeaders, writePrivateConfigAtomic, readFaultFixture, CANONICAL_PATH, validatePlainFaultFixture, validatePlainHeaders, writePrivateFileAtomic, controlledResponseFormat } from './proxy.mjs';

const CHAT = INDEX_PATH, PITX2 = INDEX_PATH, SAME = INDEX_PATH;
const ORIGINAL = fs.readFileSync('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype/' + SOURCE_PINS.gzip.path);
const FAULT = fs.readFileSync('/private/tmp/ohri-i60-index-native-proxy/decoded-checksum-fault.json.gz');
const PLAIN_ORIGINAL = gunzipSync(ORIGINAL), PLAIN_FAULT = gunzipSync(FAULT);
const PLAIN_HEADERS = ['Content-Type', 'application/json; charset=utf-8', 'Content-Length', String(PLAIN_ORIGINAL.length), 'ETag', 'original-canonical', 'Vary', 'Accept-Encoding'];
const API_HEADERS = ['Content-Type', 'application/json; charset=utf-8', 'Content-Encoding', 'gzip', 'Content-Length', String(ORIGINAL.length), 'Cache-Control', 'public, max-age=0, must-revalidate, no-transform', 'X-Content-Type-Options', 'nosniff', 'Date', 'mock-source-date'];
const tick = () => new Promise(resolve => setImmediate(resolve));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const empty = () => ({ schemaVersion: 1, rules: {} });
class Response extends Writable {
  constructor() { super(); this.chunks = []; this.statusCode = 200; this.headersSent = false; }
  _write(chunk, encoding, callback) { this.chunks.push(Buffer.from(chunk)); callback(); }
  writeHead(status, message, headers) { this.statusCode = status; this.statusMessage = typeof message === 'string' ? message : null; this.headers = [...(headers ?? message)]; this.headersSent = true; }
  body() { return Buffer.concat(this.chunks); }
}
function incoming(target = CHAT, method = 'GET', body = Buffer.alloc(0), headers = ['Host', '127.0.0.1:3005', 'Cache-Control', 'no-cache']) {
  const req = new PassThrough(); req.method = method; req.url = target; req.rawHeaders = [...headers]; req.headers = {};
  req.end(body); return req;
}
function harness(config = empty(), faultFixture = FAULT) {
  const calls = [], logs = [], timers = [];
  let current = config, configReads = 0;
  const handler = makeHandler({
    loadConfig: () => { configReads++; return current; }, loadFaultFixture: (target, format) => format === 'plain_canonical_json' ? PLAIN_FAULT : faultFixture, log: value => logs.push(value), now: () => 'mock-time',
    setTimer: (callback, ms) => { const timer = { callback, ms, cleared: false }; timers.push(timer); return timer; },
    clearTimer: timer => { timer.cleared = true; },
    request: options => {
      const chunks = [], req = new Writable({ write(chunk, encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); } });
      calls.push({ options, req, requestBody: () => Buffer.concat(chunks) }); return req;
    }
  });
  return { calls, logs, timers, handler, configReads: () => configReads, setConfig: value => { current = value; },
    begin: (target, method, body, headers) => { const req = incoming(target, method, body, headers), res = new Response(); handler(req, res); return { req, res }; },
    runTimer: (index = 0, force = false) => { const timer = timers[index]; if (!timer.cleared || force) timer.callback(); },
    respond: (index, body, headers = ['Content-Type', 'application/octet-stream', 'Content-Length', String(body.length)], status = 200) => {
      const response = new PassThrough(); response.statusCode = status; response.statusMessage = status === 200 ? 'OK' : 'Other'; response.rawHeaders = [...headers];
      calls[index].req.emit('response', response); response.end(body); return response;
    }
  };
}
async function finish(res) { if (!res.writableFinished) await once(res, 'finish'); }

test('fixed endpoints and exact bounded config cannot select public hosts or arbitrary files', () => {
  assert.deepEqual(LISTEN, { host: '127.0.0.1', port: 3005 }); assert.deepEqual(UPSTREAM, { host: '127.0.0.1', port: 3004 });
  assert.throws(() => parseArguments(['--host', '0.0.0.0'])); assert.throws(() => parseArguments(['--upstream', 'https://example.com']));
  for (const rules of [{ '/data/other.gzip': { mode: 'delay' } }, { [CHAT]: { mode: 'delay', delayMs: 12001 } }, { [CHAT]: { mode: 'delay', delayMs: -1 } }, { [CHAT]: { mode: 'decoded_checksum_fault', replacementPath: '/etc/passwd' } }, { [CHAT]: { mode: 'wrong_chunk' } }, { [CHAT]: { mode: '404' } }]) assert.throws(() => validateConfig({ schemaVersion: 1, rules }));
  assert.equal(validateConfig({ schemaVersion: 1, rules: { [CHAT]: { mode: 'delay' } } }).rules[CHAT].delayMs, 12000);
});

test('default forwarding preserves raw gzip payload, response headers and fixed request headers', async () => {
  const h = harness(), { res } = h.begin(CHAT); const body = gzipSync(Buffer.from('{"fixture":"not-scientific-source"}'));
  const headers = ['Content-Type', 'application/gzip', 'Content-Length', String(body.length), 'Content-Encoding', 'gzip', 'ETag', '"unaltered"', 'Cache-Control', 'max-age=0'];
  h.respond(0, body, headers); await finish(res);
  assert.deepEqual(res.body(), body); assert.deepEqual(res.headers, headers);
  assert.deepEqual(h.calls[0].options.headers, ['Host', '127.0.0.1:3005', 'Cache-Control', 'no-cache']);
  assert.deepEqual([h.calls[0].options.hostname, h.calls[0].options.port, h.calls[0].options.path], ['127.0.0.1', 3004, CHAT]);
  const complete = h.logs.find(row => row.event === 'upstream_body_complete'); assert.equal(complete.upstreamReceivedBodySha256, sha(body)); assert.equal(complete.handedToResponseBodySha256, sha(body));
  assert.equal(h.logs.at(-1).browserConsumptionEstablished, false); assert.equal(h.logs.filter(row => row.event === 'downstream_disconnect').length, 0);
});

test('ordinary POST/path/query forwarding does not change request or response bodies', async () => {
  const h = harness(), raw = Buffer.from([0, 255, 1, 2]), { res } = h.begin('/api/source-action?q=original', 'POST', raw);
  await tick(); assert.deepEqual(h.calls[0].requestBody(), raw); assert.equal(h.calls[0].options.path, '/api/source-action?q=original');
  h.respond(0, raw); await finish(res); assert.deepEqual(res.body(), raw);
});

test('exact12s delay contacts no upstream early then forwards originals unchanged', async () => {
  const h = harness({ schemaVersion: 1, rules: { [CHAT]: { mode: 'delay', delayMs: 12000 } } }), { res } = h.begin(CHAT);
  assert.equal(h.calls.length, 0); assert.equal(h.timers[0].ms, 12000); assert.ok(h.logs.some(row => row.event === 'delay_scheduled'));
  h.runTimer(); assert.equal(h.calls.length, 1); const body = gzipSync(Buffer.from('original fixture'));
  h.respond(0, body); await finish(res); assert.deepEqual(res.body(), body);
});

test('downstream close cancels delayed I/O and a late timer cannot revive it', async () => {
  const h = harness({ schemaVersion: 1, rules: { [CHAT]: { mode: 'delay' } } }), { res } = h.begin(CHAT);
  res.destroy(); await tick(); assert.equal(h.timers[0].cleared, true); h.runTimer(0, true);
  assert.equal(h.calls.length, 0); assert.equal(h.logs.filter(row => row.event === 'downstream_disconnect').length, 1);
  assert.ok(!h.logs.some(row => row.event === 'response_finished')); assert.equal(res.body().length, 0);
});

test('incoming request abort cancels its pending timer independently', async () => {
  const h = harness({ schemaVersion: 1, rules: { [PITX2]: { mode: 'delay' } } }), { req, res } = h.begin(PITX2);
  req.emit('aborted'); h.runTimer(0, true); assert.equal(h.calls.length, 0); assert.equal(h.timers[0].cleared, true);
  assert.equal(h.logs.find(row => row.event === 'downstream_disconnect').reason, 'incoming_request_aborted'); res.destroy(); await tick();
});

test('downstream cancellation destroys started upstream and later data produces no result', async () => {
  const h = harness(), { res } = h.begin(CHAT); res.destroy(); await tick();
  assert.equal(h.calls[0].req.destroyed, true);
  const upstream = h.respond(0, Buffer.from('late bytes')); await tick(); assert.equal(upstream.destroyed, true);
  assert.equal(res.body().length, 0); assert.ok(!h.logs.some(row => row.event === 'response_finished'));
});

test('query/nearby URLs and HEAD never trigger exact GET API index rule', () => {
  const config = validateConfig({ schemaVersion: 1, rules: { [CHAT]: { mode: 'decoded_checksum_fault' } } });
  for (const [method, target] of [['GET', CHAT + '?probe=1'], ['GET', CHAT + '/suffix'], ['HEAD', CHAT], ['GET', '/__proxy/config.json']]) assert.equal(ruleForRequest(method, target, config).mode, 'pass');
  assert.throws(() => ruleForRequest('GET', 'http://example.com/data', config));
});

test('private configuration reloads per request and does not retroactively change an old request', async () => {
  const h = harness(), first = h.begin(CHAT); h.setConfig({ schemaVersion: 1, rules: { [CHAT]: { mode: 'delay' } } }); const second = h.begin(CHAT);
  assert.equal(h.configReads(), 2); assert.equal(h.calls.length, 1); assert.equal(h.timers.length, 1);
  h.respond(0, Buffer.from('first')); await finish(first.res); assert.equal(second.res.body().length, 0);
  assert.deepEqual(h.logs.filter(row => row.event === 'rule_selected').map(row => row.rule.mode), ['pass', 'delay']);
  assert.deepEqual(h.logs.filter(row => row.event === 'request_start').map(row => row.requestId), [1, 2]); second.res.destroy(); await tick();
});

test('invalid configuration and upstream errors withhold bytes through explicit local responses', async () => {
  const bad = harness({ schemaVersion: 1, rules: { '/not-allowed': { mode: 'decoded_checksum_fault' } } }), a = bad.begin(CHAT); await finish(a.res);
  assert.equal(a.res.statusCode, 503); assert.equal(bad.calls.length, 0);
  const h = harness(), b = h.begin(CHAT); h.calls[0].req.emit('error', new Error('synthetic local failure')); await finish(b.res);
  assert.equal(b.res.statusCode, 502); assert.equal(b.res.body().toString(), 'Upstream unavailable\n');
});

test('logging redacts sensitive values without changing forwarded raw headers', async () => {
  const headers = ['Host', '127.0.0.1:3005', 'Cookie', 'test-secret', 'Authorization', 'synthetic-token'];
  assert.deepEqual(loggedHeaders(headers), ['Host', '127.0.0.1:3005', 'Cookie', '[redacted]', 'Authorization', '[redacted]']);
  const h = harness(), { res } = h.begin('/ordinary', 'GET', undefined, headers); assert.deepEqual(h.calls[0].options.headers, headers);
  h.respond(0, Buffer.from('fixture')); await finish(res); assert.ok(!JSON.stringify(h.logs).includes('test-secret'));
});

test('private config/logger reject symlinks and keep their files restricted in temp', () => {
  const directory = fs.mkdtempSync('/private/tmp/ohri-i60-index-native-proxy/logic-');
  try {
    const config = path.join(directory, 'config.json'); fs.writeFileSync(config, JSON.stringify(empty())); assert.deepEqual(readPrivateConfig(config), empty());
    const missing = path.join(directory, 'missing.json'); assert.deepEqual(readPrivateConfig(missing), empty());
    const link = path.join(directory, 'link.json'); fs.symlinkSync(config, link); assert.throws(() => readPrivateConfig(link)); assert.throws(() => createPrivateLogger(link));
    const logfile = path.join(directory, 'requests.jsonl'), logger = createPrivateLogger(logfile); logger.write({ fixture: true }); logger.close(); logger.close();
    assert.equal(fs.statSync(logfile).mode & 0o777, 0o600); assert.deepEqual(JSON.parse(fs.readFileSync(logfile)), { fixture: true });
    assert.throws(() => createPrivateLogger(logfile), /EEXIST/);
    assert.deepEqual(JSON.parse(fs.readFileSync(logfile)), { fixture: true });
    assert.throws(() => readPrivateConfig('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype/package.json'));
  } finally { fs.rmSync(directory, { recursive: true }); }
});

test('private helper/config/log paths are never forwarded as web filesystem routes', async () => {
  for (const target of ['/private/tmp/ohri-i60-index-native-proxy/config.json', '/@fs/private/tmp/ohri-i60-index-native-proxy/requests.jsonl', '/@fs' + encodeURIComponent('/private/tmp/ohri-i60-index-native-proxy/config.json')]) {
    assert.equal(privateWebTarget(target), true);
    const h = harness(), { res } = h.begin(target); await finish(res);
    assert.equal(res.statusCode, 404); assert.equal(h.calls.length, 0); assert.equal(res.body().toString(), 'Not found\n');
  }
  assert.equal(privateWebTarget('/data/cano_chol_rna_counts_v1/counts-093.json.gzip'), false);
});

test('actual pinned fixture changes exactly one final whitespace byte and preserves all JSON values', () => {
  assert.equal(CONTROLLED_PATHS.length, 2); assert.equal(CONTROLLED_PATHS[1], CANONICAL_PATH); assert.equal(CONTROLLED_PATHS[0], INDEX_PATH);
  const originalDecoded = verifyOriginalGzip(ORIGINAL), faultDecoded = gunzipSync(FAULT);
  const proof = validateFaultFixture(FAULT, ORIGINAL);
  assert.equal(originalDecoded.length, 12327624); assert.equal(faultDecoded.length, 12327624);
  assert.equal(sha(originalDecoded), SOURCE_PINS.decoded.sha256); assert.notEqual(sha(faultDecoded), SOURCE_PINS.decoded.sha256);
  assert.equal(proof.mutation.changedByteCount, 1); assert.equal(proof.mutation.offset, 12327623);
  assert.ok(faultDecoded.subarray(0, -1).equals(originalDecoded.subarray(0, -1)));
  assert.deepEqual(JSON.parse(faultDecoded), JSON.parse(originalDecoded));
  assert.throws(() => validateFaultFixture(ORIGINAL, ORIGINAL));
  const changed = Buffer.from(originalDecoded); changed[0] = 32; changed[changed.length - 1] = 32;
  assert.throws(() => validateFaultFixture(gzipSync(changed), ORIGINAL));
  assert.throws(() => validateFaultFixture(gzipSync(Buffer.from('{} ')), ORIGINAL));
  assert.throws(() => validateFaultFixture(Buffer.from('not gzip'), ORIGINAL));
});

test('decoded fault waits for complete verified original gzip before changing only Content-Length', async () => {
  const h = harness({ schemaVersion: 1, rules: { [INDEX_PATH]: { mode: 'decoded_checksum_fault' } } }), { res } = h.begin();
  assert.equal(h.calls[0].options.path, INDEX_PATH);
  const response = new PassThrough(); response.statusCode = 200; response.statusMessage = 'OK'; response.rawHeaders = API_HEADERS;
  h.calls[0].req.emit('response', response); response.write(ORIGINAL.subarray(0, 300)); await tick();
  assert.equal(res.headersSent, false); assert.equal(res.body().length, 0);
  response.end(ORIGINAL.subarray(300)); await finish(res);
  assert.deepEqual(res.body(), FAULT);
  assert.deepEqual(res.headers, faultResponseHeaders(API_HEADERS, FAULT.length));
  for (let i = 0; i < API_HEADERS.length; i += 2) if (API_HEADERS[i].toLowerCase() !== 'content-length') assert.equal(res.headers[i + 1], API_HEADERS[i + 1]);
  const ready = h.logs.find(row => row.event === 'controlled_body_ready');
  assert.equal(ready.originalUpstreamSha256, SOURCE_PINS.gzip.sha256); assert.equal(ready.controlledBodySha256, sha(FAULT));
  assert.equal(ready.controlledDecodedSha256, sha(gunzipSync(FAULT))); assert.equal(ready.controlledDecodedBytes, SOURCE_PINS.decoded.bytes);
  const finished = h.logs.find(row => row.event === 'response_finished');
  assert.equal(finished.upstreamReceivedBytes, ORIGINAL.length); assert.equal(finished.upstreamReceivedBodySha256, sha(ORIGINAL));
  assert.equal(finished.handedToResponseBytes, FAULT.length); assert.equal(finished.handedToResponseBodySha256, sha(FAULT));
  assert.equal(finished.browserConsumptionEstablished, false);
});

test('decoded fault rejects stale, short, oversized or wrong original gzip without serving the fixture', async () => {
  const bodies = [Buffer.from(ORIGINAL), ORIGINAL.subarray(0, -1), Buffer.concat([ORIGINAL, Buffer.from([0])])]; bodies[0][10] ^= 1;
  for (const body of bodies) {
    const h = harness({ schemaVersion: 1, rules: { [INDEX_PATH]: { mode: 'decoded_checksum_fault' } } }), { res } = h.begin();
    h.respond(0, body, API_HEADERS); await finish(res);
    assert.equal(res.statusCode, 502); assert.ok(!res.body().equals(FAULT));
    assert.ok(!h.logs.some(row => row.event === 'controlled_body_ready')); assert.ok(h.logs.some(row => row.event === 'controlled_fault_rejected'));
  }
});

test('decoded fault rejects non-gzip, partial, duplicate, ambiguous and wrong-length API headers', async () => {
  const badHeaders = [API_HEADERS.filter((_, i) => i !== 2 && i !== 3), [...API_HEADERS, 'Content-Length', String(ORIGINAL.length)],
    [...API_HEADERS, 'Transfer-Encoding', 'chunked'], API_HEADERS.map((v, i) => i === 5 ? '1' : v), API_HEADERS.map((v, i) => i === 1 ? 'application/gzip' : v)];
  for (const headers of badHeaders) {
    assert.throws(() => validateGzipHeaders(200, headers));
    const h = harness({ schemaVersion: 1, rules: { [INDEX_PATH]: { mode: 'decoded_checksum_fault' } } }), { res } = h.begin();
    h.respond(0, ORIGINAL, headers); await finish(res); assert.equal(res.statusCode, 502);
    assert.ok(!h.logs.some(row => row.event === 'controlled_body_ready'));
  }
  for (const status of [206, 304, 404]) assert.throws(() => validateGzipHeaders(status, API_HEADERS));
});

test('fault cancellation while buffering destroys upstream and later completion cannot send a fixture', async () => {
  const h = harness({ schemaVersion: 1, rules: { [INDEX_PATH]: { mode: 'decoded_checksum_fault' } } }), { res } = h.begin();
  const response = new PassThrough(); response.statusCode = 200; response.statusMessage = 'OK'; response.rawHeaders = API_HEADERS;
  h.calls[0].req.emit('response', response); response.write(ORIGINAL.subarray(0, 5000)); await tick();
  res.destroy(); await tick(); response.emit('end'); await tick();
  assert.ok(response.destroyed && h.calls[0].req.destroyed); assert.equal(res.body().length, 0);
  assert.equal(h.logs.filter(row => row.event === 'downstream_disconnect').length, 1);
  assert.ok(!h.logs.some(row => row.event === 'controlled_body_ready' || row.event === 'response_finished'));
  assert.equal(h.logs.find(row => row.event === 'downstream_disconnect').upstreamReceivedBytes, 5000);
});

test('fault fixture itself is rechecked and malformed/substituted fixture cannot masquerade as original decoded checksum failure', async () => {
  for (const fixture of [ORIGINAL, gzipSync(Buffer.from('{} ')), Buffer.alloc(1048577)]) {
    const h = harness({ schemaVersion: 1, rules: { [INDEX_PATH]: { mode: 'decoded_checksum_fault' } } }, fixture), { res } = h.begin();
    h.respond(0, ORIGINAL, API_HEADERS); await finish(res); assert.equal(res.statusCode, 502);
    assert.ok(!h.logs.some(row => row.event === 'controlled_body_ready'));
  }
});

test('API control never affects canonical provider, gzip file, manifest, query, HEAD or old RNA paths', async () => {
  const config = { schemaVersion: 1, rules: { [INDEX_PATH]: { mode: 'decoded_checksum_fault' } } };
  const targets = ['/data/research_explorer_index_v1/search-index.json', '/data/research_explorer_index_v1/search-index.json.gz',
    '/data/research_explorer_index_v1/asset-manifest.json', INDEX_PATH + '?fresh=1', '/data/cano_chol_rna_counts_v1/counts-093.json.gzip'];
  for (const target of targets) {
    const h = harness(config), { res } = h.begin(target); const body = Buffer.from('unmodified forwarding fixture');
    h.respond(0, body); await finish(res); assert.deepEqual(res.body(), body); assert.equal(h.calls[0].options.path, target);
    assert.ok(!h.logs.some(row => row.event === 'controlled_body_ready'));
  }
  assert.equal(ruleForRequest('HEAD', INDEX_PATH, validateConfig(config)).mode, 'pass');
});

test('atomic private config uses mode0600 and rejects symlink, outside path and unknown fixture/host options', () => {
  const directory = fs.mkdtempSync('/private/tmp/ohri-i60-index-native-proxy/atomic-');
  try {
    const configPath = path.join(directory, 'config.json');
    writePrivateConfigAtomic(configPath, empty()); assert.equal(fs.statSync(configPath).mode & 0o777, 0o600);
    writePrivateConfigAtomic(configPath, { schemaVersion: 1, rules: { [INDEX_PATH]: { mode: 'delay', delayMs: 5 } } });
    assert.equal(readPrivateConfig(configPath).rules[INDEX_PATH].delayMs, 5);
    assert.deepEqual(fs.readdirSync(directory), ['config.json']);
    const linked = path.join(directory, 'link.json'); fs.symlinkSync(configPath, linked);
    assert.throws(() => writePrivateConfigAtomic(linked, empty())); assert.throws(() => readFaultFixture(linked));
    const broken = path.join(directory, 'broken.json'); fs.symlinkSync(path.join(directory, 'absent.json'), broken);
    assert.throws(() => writePrivateConfigAtomic(broken, empty())); assert.throws(() => readPrivateConfig(broken));
    assert.throws(() => writePrivateConfigAtomic('/private/tmp/not-allowed.json', empty()));
    assert.throws(() => parseArguments(['--fixture', '/etc/passwd'])); assert.throws(() => validateConfig({ schemaVersion: 1, rules: { [INDEX_PATH]: { mode: 'pass', host: 'example.com' } } }));
  } finally { fs.rmSync(directory, { recursive: true }); }
});

test('current production loader rejects decoded fault at SHA gate then independently verifies pass with fresh no-store requests', async () => {
  const manifest = JSON.parse(fs.readFileSync('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype/public/data/research_explorer_index_v1/asset-manifest.json'));
  let decoded = gunzipSync(FAULT); const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, cache: options.cache });
    assert.ok(url.endsWith('asset-manifest.json') || url === INDEX_PATH);
    return new globalThis.Response(url.endsWith('asset-manifest.json') ? JSON.stringify(manifest) : decoded);
  };
  await assert.rejects(loadVerifiedResearchExplorerIndex({ transport: 'compressed', forceFresh: true, fetchImpl }), /Research index checksum does not match the pinned manifest/);
  decoded = gunzipSync(ORIGINAL);
  const index = await loadVerifiedResearchExplorerIndex({ transport: 'compressed', forceFresh: true, fetchImpl });
  const receipt = researchExplorerLoadingReceipt(index);
  assert.equal(receipt.verifiedDecodedSha256, SOURCE_PINS.decoded.sha256); assert.equal(receipt.verifiedDecodedBytes, SOURCE_PINS.decoded.bytes);
  assert.equal(receipt.forceFresh, true); assert.equal(index.records.length, manifest.index.recordCount);
  assert.deepEqual(calls.map(row => row.cache), ['no-store', 'no-store', 'no-store', 'no-store']);
  assert.deepEqual(calls.map(row => row.url).filter(url => url === INDEX_PATH), [INDEX_PATH, INDEX_PATH]);
});

test('canonical provider fault keeps exact plain headers/length and has its own source pin and owner', async () => {
  const h = harness({ schemaVersion: 1, rules: { [CANONICAL_PATH]: { mode: 'decoded_checksum_fault' }, [INDEX_PATH]: { mode: 'pass' } } });
  const canonical = h.begin(CANONICAL_PATH), api = h.begin(INDEX_PATH);
  h.respond(0, PLAIN_ORIGINAL, PLAIN_HEADERS); h.respond(1, ORIGINAL, API_HEADERS);
  await finish(canonical.res); await finish(api.res);
  assert.deepEqual(canonical.res.body(), PLAIN_FAULT); assert.deepEqual(canonical.res.headers, PLAIN_HEADERS);
  assert.deepEqual(api.res.body(), ORIGINAL); assert.deepEqual(api.res.headers, API_HEADERS);
  const ready = h.logs.find(row => row.event === 'controlled_body_ready');
  assert.equal(ready.requestedTarget, CANONICAL_PATH); assert.equal(ready.requestOwner, 'canonical_provider_route');
  assert.equal(ready.responseBodyFormat, 'plain_canonical_json'); assert.equal(ready.originalWireSourcePin.sha256, SOURCE_PINS.decoded.sha256);
  assert.equal(ready.controlledBodyBytes, SOURCE_PINS.decoded.bytes); assert.equal(ready.controlledBodySha256, sha(PLAIN_FAULT));
  const finished = h.logs.filter(row => row.event === 'response_finished');
  assert.deepEqual(finished.map(row => row.requestId), [1, 2]);
  assert.deepEqual(finished.map(row => row.requestOwner), ['canonical_provider_route', 'compressed_api_route']);
  assert.equal(finished[0].upstreamReceivedBodySha256, SOURCE_PINS.decoded.sha256); assert.equal(finished[1].upstreamReceivedBodySha256, SOURCE_PINS.gzip.sha256);
});

test('canonical plain gate rejects encoded/header/length mismatches and a same-length altered original', async () => {
  assert.throws(() => validatePlainHeaders(200, API_HEADERS));
  assert.throws(() => validatePlainHeaders(304, PLAIN_HEADERS));
  assert.throws(() => validatePlainHeaders(200, [...PLAIN_HEADERS, 'Content-Encoding', 'gzip']));
  assert.throws(() => validatePlainHeaders(200, [...PLAIN_HEADERS, 'Content-Length', String(PLAIN_ORIGINAL.length)]));
  assert.throws(() => validatePlainHeaders(200, [...PLAIN_HEADERS, 'Transfer-Encoding', 'chunked']));
  assert.throws(() => validatePlainFaultFixture(PLAIN_ORIGINAL, PLAIN_ORIGINAL));
  const wrong = Buffer.from(PLAIN_ORIGINAL); wrong[wrong.length - 1] = 32;
  const h = harness({ schemaVersion: 1, rules: { [CANONICAL_PATH]: { mode: 'decoded_checksum_fault' } } }), { res } = h.begin(CANONICAL_PATH);
  h.respond(0, wrong, PLAIN_HEADERS); await finish(res); assert.equal(res.statusCode, 502);
  assert.ok(!h.logs.some(row => row.event === 'controlled_body_ready'));
});

test('canonical delay and disconnect are isolated from immediate API pass with independent IDs', async () => {
  const h = harness({ schemaVersion: 1, rules: { [CANONICAL_PATH]: { mode: 'delay' }, [INDEX_PATH]: { mode: 'pass' } } });
  const canonical = h.begin(CANONICAL_PATH), api = h.begin(INDEX_PATH);
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].options.path, INDEX_PATH);
  h.respond(0, ORIGINAL, API_HEADERS); await finish(api.res);
  canonical.res.destroy(); await tick(); h.runTimer(0, true); assert.equal(h.calls.length, 1);
  const cancelled = h.logs.find(row => row.event === 'downstream_disconnect');
  assert.equal(cancelled.requestId, 1); assert.equal(cancelled.requestOwner, 'canonical_provider_route');
  assert.equal(h.logs.find(row => row.event === 'response_finished').requestId, 2);
  assert.ok(!h.logs.some(row => row.requestId === 1 && row.event === 'upstream_start'));
});

test('canonical source loader default path fails decoded SHA and fresh pass restores its verified receipt independently of API', async () => {
  const manifest = JSON.parse(fs.readFileSync('/Users/zhouzhenghang/Desktop/OHRI/mouse_interneuron_atlas_prototype/public/data/research_explorer_index_v1/asset-manifest.json'));
  let decoded = PLAIN_FAULT; const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, cache: options.cache });
    assert.ok(url.endsWith('asset-manifest.json') || url === CANONICAL_PATH);
    return new globalThis.Response(url.endsWith('asset-manifest.json') ? JSON.stringify(manifest) : decoded);
  };
  await assert.rejects(loadVerifiedResearchExplorerIndex({ forceFresh: true, fetchImpl }), /Research index checksum does not match the pinned manifest/);
  decoded = PLAIN_ORIGINAL;
  const index = await loadVerifiedResearchExplorerIndex({ forceFresh: true, fetchImpl });
  assert.equal(researchExplorerLoadingReceipt(index).verifiedDecodedSha256, SOURCE_PINS.decoded.sha256);
  assert.equal(researchExplorerLoadingReceipt(index).transport, 'canonical');
  assert.deepEqual(calls.filter(row => row.url === INDEX_PATH), []);
  assert.deepEqual(calls.filter(row => row.url === CANONICAL_PATH).map(row => row.cache), ['no-store', 'no-store']);
});

test('fixture preparation writer rejects an escaped real parent and never truncates a symlink target', () => {
  const directory = fs.mkdtempSync('/private/tmp/ohri-i60-index-native-proxy/writer-');
  const outside = fs.mkdtempSync('/private/tmp/ohri-i60-outside-writer-');
  try {
    const victim = path.join(outside, 'keep.bin'); fs.writeFileSync(victim, 'preserved');
    const alias = path.join(directory, 'alias'); fs.symlinkSync(outside, alias);
    assert.throws(() => writePrivateFileAtomic(path.join(alias, 'keep.bin'), Buffer.from('wrong')));
    const leaf = path.join(directory, 'leaf'); fs.symlinkSync(victim, leaf);
    assert.throws(() => writePrivateFileAtomic(leaf, Buffer.from('wrong')));
    assert.equal(fs.readFileSync(victim, 'utf8'), 'preserved');
    const own = path.join(directory, 'own.bin'); writePrivateFileAtomic(own, Buffer.from('fixture'));
    assert.equal(fs.statSync(own).mode & 0o777, 0o600); assert.equal(fs.readFileSync(own, 'utf8'), 'fixture');
  } finally { fs.rmSync(directory, { recursive: true }); fs.rmSync(outside, { recursive: true }); }
});

test('canonical actual gzip variant remains canonical-owned, exact encoded/decoded source-pinned and independent of API requests', async () => {
  const config = { schemaVersion: 1, rules: { [CANONICAL_PATH]: { mode: 'decoded_checksum_fault' }, [INDEX_PATH]: { mode: 'pass' } } };
  const h = harness(config), canonical = h.begin(CANONICAL_PATH), api = h.begin(INDEX_PATH);
  h.respond(0, ORIGINAL, API_HEADERS); h.respond(1, ORIGINAL, API_HEADERS);
  await finish(canonical.res); await finish(api.res);
  assert.deepEqual(canonical.res.body(), FAULT); assert.deepEqual(api.res.body(), ORIGINAL);
  assert.deepEqual(canonical.res.headers, faultResponseHeaders(API_HEADERS, FAULT.length));
  const ready = h.logs.find(row => row.event === 'controlled_body_ready');
  assert.equal(ready.requestId, 1); assert.equal(ready.requestedTarget, CANONICAL_PATH); assert.equal(ready.requestOwner, 'canonical_provider_route');
  assert.equal(ready.responseBodyFormat, 'http_gzip_json'); assert.equal(ready.originalWireSourcePin.sha256, SOURCE_PINS.gzip.sha256);
  assert.equal(ready.originalUpstreamSha256, SOURCE_PINS.gzip.sha256); assert.equal(ready.controlledDecodedBytes, SOURCE_PINS.decoded.bytes);
  assert.equal(ready.controlledDecodedSha256, sha(PLAIN_FAULT));
  assert.ok(!h.logs.some(row => row.requestId === 2 && row.event === 'controlled_body_ready'));
});

test('wire formats are selected only from exact response headers and reject unsupported/duplicate/304 or cross-format API responses', () => {
  assert.equal(controlledResponseFormat(CANONICAL_PATH, 200, PLAIN_HEADERS), 'plain_canonical_json');
  assert.equal(controlledResponseFormat(CANONICAL_PATH, 200, API_HEADERS), 'http_gzip_json');
  assert.equal(controlledResponseFormat(INDEX_PATH, 200, API_HEADERS), 'http_gzip_json');
  assert.throws(() => controlledResponseFormat(INDEX_PATH, 200, PLAIN_HEADERS));
  assert.throws(() => controlledResponseFormat(CANONICAL_PATH, 304, API_HEADERS));
  assert.throws(() => controlledResponseFormat(CANONICAL_PATH, 304, PLAIN_HEADERS));
  assert.throws(() => controlledResponseFormat(CANONICAL_PATH, 200, [...API_HEADERS, 'Content-Encoding', 'gzip']));
  assert.throws(() => controlledResponseFormat(CANONICAL_PATH, 200, API_HEADERS.map((value, i) => i === 3 ? 'br' : value)));
  assert.throws(() => controlledResponseFormat(CANONICAL_PATH, 200, [...PLAIN_HEADERS, 'Content-Encoding', 'identity']));
  assert.throws(() => controlledResponseFormat(CANONICAL_PATH + '?probe=1', 200, API_HEADERS));
});

test('canonical gzip source-pin failure cannot serve a fault or create API-owned proof', async () => {
  const h = harness({ schemaVersion: 1, rules: { [CANONICAL_PATH]: { mode: 'decoded_checksum_fault' } } }), { res } = h.begin(CANONICAL_PATH);
  const bad = Buffer.from(ORIGINAL); bad[bad.length - 1] ^= 1;
  h.respond(0, bad, API_HEADERS); await finish(res); assert.equal(res.statusCode, 502);
  assert.ok(!h.logs.some(row => row.event === 'controlled_body_ready'));
  assert.ok(h.logs.some(row => row.event === 'controlled_fault_rejected' && row.requestOwner === 'canonical_provider_route'));
});
