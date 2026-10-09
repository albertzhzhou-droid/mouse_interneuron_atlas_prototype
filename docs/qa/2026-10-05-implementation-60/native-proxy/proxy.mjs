import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

export const LISTEN = Object.freeze({ host: '127.0.0.1', port: 3005 });
export const UPSTREAM = Object.freeze({ host: '127.0.0.1', port: 3004 });
export const INDEX_PATH = '/api/source-records/search-index.json';
export const CANONICAL_PATH = '/data/research_explorer_index_v1/search-index.json';
export const CONTROLLED_PATHS = Object.freeze([INDEX_PATH, CANONICAL_PATH]);
export const SOURCE_PINS = Object.freeze({
  gzip: Object.freeze({ path: 'public/data/research_explorer_index_v1/search-index.json.gz', bytes: 628095, sha256: '715236a44109be7bcd209c589d88342a7df9fbb4a2bbfc18f5d3f6ddbaac436b' }),
  decoded: Object.freeze({ path: 'public/data/research_explorer_index_v1/search-index.json', bytes: 12327624, sha256: 'c1fb786da4a1624b28fbe4c9c7063eb0f108b6a12e91d082008f1c7102e17085' }),
});
const privateDirectory = '/private/tmp/ohri-i60-index-native-proxy';
const modes = new Set(['pass', 'delay', 'decoded_checksum_fault']);
const emptyHash = () => createHash('sha256');
const digest = hash => hash.copy().digest('hex');
const sensitiveHeaders = new Set(['cookie', 'authorization', 'proxy-authorization', 'set-cookie']);
export function privateWebTarget(rawTarget) {
  let target = rawTarget;
  for (let depth = 0; depth < 3; depth++) {
    if (typeof target === 'string' && target.includes(privateDirectory)) return true;
    try { const decoded = decodeURIComponent(target); if (decoded === target) break; target = decoded; } catch { break; }
  }
  return false;
}
export function loggedHeaders(raw = []) {
  return raw.map((value, index) => index % 2 && sensitiveHeaders.has(raw[index - 1].toLowerCase()) ? '[redacted]' : value);
}
export function validateConfig(value) {
  assert.ok(value && !Array.isArray(value) && typeof value === 'object');
  assert.deepEqual(Object.keys(value).sort(), ['rules', 'schemaVersion']);
  assert.equal(value.schemaVersion, 1);
  assert.ok(value.rules && !Array.isArray(value.rules) && typeof value.rules === 'object');
  const rules = {};
  for (const [target, rule] of Object.entries(value.rules)) {
    assert.ok(CONTROLLED_PATHS.includes(target), 'Control requires one of the two exact index paths');
    assert.ok(rule && typeof rule === 'object' && !Array.isArray(rule) && modes.has(rule.mode));
    const allowedKeys = rule.mode === 'delay' ? ['mode', 'delayMs'] : ['mode'];
    assert.ok(Object.keys(rule).every(key => allowedKeys.includes(key)), 'Unknown control field');
    if (rule.mode === 'delay') {
      const delayMs = rule.delayMs ?? 12000;
      assert.ok(Number.isSafeInteger(delayMs) && delayMs >= 1 && delayMs <= 12000, 'Delay must be bounded to12s');
      rules[target] = Object.freeze({ mode: rule.mode, delayMs });
    } else rules[target] = Object.freeze({ mode: rule.mode });
  }
  return Object.freeze({ schemaVersion: 1, rules: Object.freeze(rules) });
}
export function ruleForRequest(method, rawTarget, config) {
  assert.ok(typeof rawTarget === 'string' && rawTarget.startsWith('/') && !rawTarget.startsWith('//'), 'Origin-form HTTP request required');
  return method === 'GET' && CONTROLLED_PATHS.includes(rawTarget) ? config.rules[rawTarget] ?? Object.freeze({ mode: 'pass' }) : Object.freeze({ mode: 'pass' });
}
function privatePath(filename) {
  const absolute = path.resolve(filename), parent = fs.realpathSync(path.dirname(absolute));
  assert.ok(parent === privateDirectory || parent.startsWith(privateDirectory + '/'), 'Private file must remain under its real temp directory');
  try { assert.ok(!fs.lstatSync(absolute).isSymbolicLink(), 'Private file cannot be a symlink'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return absolute;
}
export function readPrivateConfig(filename) {
  const absolute = privatePath(filename);
  let fd;
  try { fd = fs.openSync(absolute, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW); }
  catch (error) { if (error.code === 'ENOENT') return validateConfig({ schemaVersion: 1, rules: {} }); throw error; }
  try {
    assert.ok(fs.fstatSync(fd).isFile(), 'Private config must be a regular file');
    const size = fs.fstatSync(fd).size;
    assert.ok(size > 0 && size <= 65536, 'Private config size is bounded');
    return validateConfig(JSON.parse(fs.readFileSync(fd, 'utf8')));
  } finally { fs.closeSync(fd); }
}
export function createPrivateLogger(filename) {
  const absolute = privatePath(filename);
  // Every startup has an exclusive new log, so requestId1 cannot append to an earlier run.
  const fd = fs.openSync(absolute, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
  fs.fchmodSync(fd, 0o600);
  let closed = false;
  return { write: value => { assert.ok(!closed, 'Local log is closed'); fs.writeSync(fd, JSON.stringify(value) + '\n'); }, close: () => { if (!closed) { closed = true; fs.closeSync(fd); } } };
}

/** Config replacement is a local filesystem operation, never an HTTP control. */
export function writePrivateConfigAtomic(filename, config) {
  const normalized = validateConfig(config), absolute = privatePath(filename);
  writePrivateFileAtomic(absolute, Buffer.from(JSON.stringify(normalized, null, 2) + '\n'));
  return normalized;
}
export function writePrivateFileAtomic(filename, bytes) {
  assert.ok(Buffer.isBuffer(bytes) && bytes.length <= 16 * 1024 * 1024, 'Private output is bounded');
  const absolute = privatePath(filename);
  const temporary = `${absolute}.${process.pid}.${createHash('sha256').update(String(process.hrtime.bigint())).digest('hex').slice(0, 16)}.tmp`;
  let fd;
  try {
    fd = fs.openSync(temporary, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
    fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
    privatePath(absolute); fs.renameSync(temporary, absolute);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function readFaultFixture(filename, maximum = 1048576) {
  const absolute = privatePath(filename);
  const fd = fs.openSync(absolute, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    assert.ok(stat.isFile() && stat.size > 0 && stat.size <= maximum, 'Fault fixture must be a bounded regular file');
    return fs.readFileSync(fd);
  } finally { fs.closeSync(fd); }
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifyOriginalDecoded(bytes) {
  assert.equal(bytes.length, SOURCE_PINS.decoded.bytes, 'Original decoded byte count differs');
  assert.equal(sha256(bytes), SOURCE_PINS.decoded.sha256, 'Original decoded SHA differs'); return bytes;
}
export function verifyOriginalGzip(bytes) {
  assert.equal(bytes.length, SOURCE_PINS.gzip.bytes, 'Original gzip byte count differs');
  assert.equal(sha256(bytes), SOURCE_PINS.gzip.sha256, 'Original gzip SHA differs');
  const decoded = gunzipSync(bytes, { maxOutputLength: SOURCE_PINS.decoded.bytes });
  return verifyOriginalDecoded(decoded);
}
/** Same valid JSON, same decoded byte count, one final whitespace-byte difference. */
function validateMutation(decoded, original) {
  const offset = original.length - 1;
  assert.equal(original[offset], 10, 'Original ends with the pinned LF');
  assert.equal(decoded.length, original.length, 'Fault decoded byte count must stay exact');
  assert.equal(decoded[offset], 32, 'Fault only replaces final LF with space');
  assert.ok(decoded.subarray(0, offset).equals(original.subarray(0, offset)), 'Fault changes no other source byte');
  assert.deepEqual(JSON.parse(decoded.toString('utf8')), JSON.parse(original.toString('utf8')), 'Fault retains the exact JSON values');
  const decodedSha256 = sha256(decoded);
  assert.notEqual(decodedSha256, SOURCE_PINS.decoded.sha256, 'Decoded fault must differ from the canonical checksum');
  return { controlledDecodedBytes: decoded.length, controlledDecodedSha256: decodedSha256,
    mutation: { offset, originalByte: 10, replacementByte: 32, changedByteCount: 1, validJsonValuesUnchanged: true } };
}
export function validateFaultFixture(body, originalGzip) {
  const original = verifyOriginalGzip(originalGzip);
  assert.ok(body.length > 0 && body.length <= 1048576, 'Fault gzip size is bounded');
  const decoded = gunzipSync(body, { maxOutputLength: SOURCE_PINS.decoded.bytes });
  return {
    originalUpstreamBytes: originalGzip.length, originalUpstreamSha256: sha256(originalGzip),
    controlledBodyBytes: body.length, controlledBodySha256: sha256(body),
    ...validateMutation(decoded, original),
  };
}
export function validatePlainFaultFixture(body, originalPlain) {
  const original = verifyOriginalDecoded(originalPlain);
  return { originalUpstreamBytes: original.length, originalUpstreamSha256: sha256(original),
    controlledBodyBytes: body.length, controlledBodySha256: sha256(body), ...validateMutation(body, original) };
}
function oneHeader(raw, name) {
  const values = [];
  for (let i = 0; i < raw.length; i += 2) if (raw[i].toLowerCase() === name) values.push(raw[i + 1]);
  assert.equal(values.length, 1, `Exactly one ${name} header required`); return values[0];
}
export function validateGzipHeaders(status, raw) {
  assert.equal(status, 200, 'Fault requires a full original 200 response');
  assert.equal(oneHeader(raw, 'content-encoding').toLowerCase(), 'gzip', 'Fault requires the HTTP gzip representation');
  assert.equal(oneHeader(raw, 'content-type').toLowerCase(), 'application/json; charset=utf-8', 'Fault requires the JSON API response');
  assert.equal(oneHeader(raw, 'content-length'), String(SOURCE_PINS.gzip.bytes), 'Original gzip Content-Length differs');
  assert.ok(!raw.some((value, i) => i % 2 === 0 && value.toLowerCase() === 'transfer-encoding'), 'Pinned API uses Content-Length, not transfer encoding');
}
export function validatePlainHeaders(status, raw) {
  assert.equal(status, 200, 'Canonical fault requires a full original 200 response');
  assert.equal(oneHeader(raw, 'content-type').toLowerCase(), 'application/json; charset=utf-8', 'Canonical fault requires the JSON response');
  assert.equal(oneHeader(raw, 'content-length'), String(SOURCE_PINS.decoded.bytes), 'Original canonical Content-Length differs');
  assert.ok(!raw.some((value, i) => i % 2 === 0 && ['content-encoding', 'transfer-encoding'].includes(value.toLowerCase())), 'Canonical plain response has no content/transfer encoding');
}
/** Select only the actual supported wire representation, never infer it from route ownership. */
export function controlledResponseFormat(target, status, raw) {
  assert.ok(CONTROLLED_PATHS.includes(target), 'Only exact allowlisted source responses can be substituted');
  if (target === INDEX_PATH) { validateGzipHeaders(status, raw); return 'http_gzip_json'; }
  const encodings = [];
  for (let i = 0; i < raw.length; i += 2) if (raw[i].toLowerCase() === 'content-encoding') encodings.push(raw[i + 1].toLowerCase());
  if (encodings.length) {
    assert.deepEqual(encodings, ['gzip'], 'Canonical encoded response must be exactly one original gzip encoding');
    validateGzipHeaders(status, raw); return 'http_gzip_json';
  }
  validatePlainHeaders(status, raw); return 'plain_canonical_json';
}
export function faultResponseHeaders(raw, size) {
  validateGzipHeaders(200, raw);
  assert.ok(Number.isSafeInteger(size) && size > 0 && size <= 1048576);
  const result = [...raw];
  for (let i = 0; i < result.length; i += 2) if (result[i].toLowerCase() === 'content-length') result[i + 1] = String(size);
  return result;
}

/** No server or socket is created by importing this module or constructing a handler. */
export function makeHandler({ loadConfig, loadFaultFixture = (target, format) => format === 'http_gzip_json' ? readFaultFixture(`${privateDirectory}/decoded-checksum-fault.json.gz`) : readFaultFixture(`${privateDirectory}/decoded-checksum-fault.json`, SOURCE_PINS.decoded.bytes), log = () => {}, request = http.request, setTimer = setTimeout, clearTimer = clearTimeout, now = () => new Date().toISOString() }) {
  let nextId = 0;
  return (req, res) => {
    const id = ++nextId, state = { cancelled: false, completed: false, timer: null, upstreamRequest: null, upstreamResponse: null, proxyAbortCause: null };
    let receivedBytes = 0, forwardedBytes = 0;
    const receivedHash = emptyHash(), forwardedHash = emptyHash();
    const owner = req.method === 'GET' && req.url === INDEX_PATH ? 'compressed_api_route' : req.method === 'GET' && req.url === CANONICAL_PATH ? 'canonical_provider_route' : 'pass_through';
    const writeLog = (event, fields = {}) => log({ time: now(), requestId: id, event, method: req.method, requestedTarget: req.url, requestOwner: owner, ...fields });
    const active = () => !state.cancelled && !state.completed && !res.destroyed;
    const bodyState = () => ({ upstreamReceivedBytes: receivedBytes, upstreamReceivedBodySha256: digest(receivedHash), handedToResponseBytes: forwardedBytes, handedToResponseBodySha256: digest(forwardedHash) });
    const stopIO = () => {
      if (state.timer !== null) { clearTimer(state.timer); state.timer = null; }
      state.upstreamResponse?.destroy(); state.upstreamRequest?.destroy();
    };
    const cancel = reason => {
      if (state.cancelled || state.completed) return;
      state.cancelled = true;
      writeLog('downstream_disconnect', { reason, proxyAbortCause: state.proxyAbortCause, responseFinished: res.writableFinished, ...bodyState() });
      stopIO();
    };
    req.once('aborted', () => cancel('incoming_request_aborted'));
    res.once('close', () => { if (!res.writableFinished) cancel('response_closed_before_finish'); });
    res.once('finish', () => {
      if (state.cancelled) return;
      state.completed = true;
      writeLog('response_finished', { statusCode: res.statusCode, headers: loggedHeaders(res.rawForwardedHeaders ?? []), ...bodyState(), browserConsumptionEstablished: false });
    });
    writeLog('request_start', { headers: loggedHeaders(req.rawHeaders ?? []), localListen: LISTEN, upstream: UPSTREAM, ...(owner !== 'pass_through' ? { originalSourcePins: SOURCE_PINS } : {}) });
    function localResponse(status, text, cause) {
      if (!active()) return;
      const body = Buffer.from(text);
      const headers = ['Content-Type', 'text/plain; charset=utf-8', 'Content-Length', String(body.length), 'Cache-Control', 'no-store'];
      res.rawForwardedHeaders = headers;
      res.writeHead(status, headers); forwardedHash.update(body); forwardedBytes += body.length;
      writeLog('local_response', { statusCode: status, cause, localBodyBytes: body.length, localBodySha256: digest(forwardedHash), headers });
      res.end(body);
    }
    let config, rule;
    if (privateWebTarget(req.url)) { writeLog('private_web_path_rejected'); localResponse(404, 'Not found\n', 'private_control_files_are_not_web_routes'); return; }
    try {
      config = validateConfig(loadConfig()); rule = ruleForRequest(req.method, req.url, config);
      writeLog('rule_selected', { rule, configSha256: createHash('sha256').update(JSON.stringify(config)).digest('hex') });
    } catch (error) {
      writeLog('configuration_or_target_error', { message: error.message });
      localResponse(503, 'Proxy configuration unavailable\n', 'invalid_private_configuration_or_target'); return;
    }
    function forward() {
      state.timer = null;
      if (!active()) return;
      const upstreamTarget = req.url;
      writeLog('upstream_start', { upstreamTarget, controlledBodySubstitution: rule.mode === 'decoded_checksum_fault' });
      let upstreamRequest;
      try {
        upstreamRequest = request({ hostname: UPSTREAM.host, port: UPSTREAM.port, method: req.method, path: upstreamTarget, headers: req.rawHeaders ?? req.headers, agent: false });
        state.upstreamRequest = upstreamRequest;
      } catch (error) {
        writeLog('upstream_error', { message: error.message }); localResponse(502, 'Upstream unavailable\n', 'upstream_request_error'); return;
      }
      upstreamRequest.on('error', error => {
        writeLog('upstream_error', { message: error.message, afterCancellation: state.cancelled });
        if (!active()) return;
        state.proxyAbortCause = 'upstream_error';
        if (!res.headersSent) localResponse(502, 'Upstream unavailable\n', 'upstream_request_error'); else res.destroy();
      });
      upstreamRequest.on('response', response => {
        state.upstreamResponse = response;
        if (!active()) { response.destroy(); return; }
        const headers = [...response.rawHeaders];
        res.rawForwardedHeaders = headers;
        writeLog('upstream_headers', { upstreamTarget, statusCode: response.statusCode, statusMessage: response.statusMessage, headers: loggedHeaders(headers) });
        const faultMode = rule.mode === 'decoded_checksum_fault';
        let plainFault = req.url === CANONICAL_PATH;
        let sourcePin = plainFault ? SOURCE_PINS.decoded : SOURCE_PINS.gzip;
        if (!faultMode) res.writeHead(response.statusCode, response.statusMessage, headers);
        const originalChunks = [];
        let ended = false;
        const faultFailure = error => {
          state.proxyAbortCause = 'controlled_fault_source_or_fixture_rejected';
          writeLog('controlled_fault_rejected', { message: error.message, ...bodyState() });
          if (active()) localResponse(502, 'Pinned source or fault fixture unavailable\n', state.proxyAbortCause);
          response.destroy();
        };
        if (faultMode) {
          try {
            plainFault = controlledResponseFormat(req.url, response.statusCode, headers) === 'plain_canonical_json';
            sourcePin = plainFault ? SOURCE_PINS.decoded : SOURCE_PINS.gzip;
          } catch (error) { faultFailure(error); return; }
        }
        response.on('data', chunk => {
          receivedHash.update(chunk); receivedBytes += chunk.length;
          if (!active()) return;
          if (faultMode) {
            if (receivedBytes > sourcePin.bytes) { faultFailure(new Error('Pinned upstream body size exceeded')); return; }
            originalChunks.push(Buffer.from(chunk)); return;
          }
          forwardedHash.update(chunk); forwardedBytes += chunk.length;
          if (!res.write(chunk)) { response.pause(); res.once('drain', () => { if (active()) response.resume(); }); }
        });
        response.on('end', () => {
          ended = true;
          writeLog('upstream_body_complete', { upstreamTarget, ...bodyState() });
          if (!active()) return;
          if (faultMode) {
            try {
              const original = Buffer.concat(originalChunks);
              const body = Buffer.from(loadFaultFixture(req.url, plainFault ? 'plain_canonical_json' : 'http_gzip_json'));
              const proof = (plainFault ? validatePlainFaultFixture : validateFaultFixture)(body, original);
              const servedHeaders = plainFault ? [...headers] : faultResponseHeaders(headers, body.length);
              writeLog('controlled_body_ready', { upstreamTarget, responseBodyFormat: plainFault ? 'plain_canonical_json' : 'http_gzip_json', originalSourcePins: SOURCE_PINS, originalWireSourcePin: sourcePin, ...proof, headers: loggedHeaders(servedHeaders), browserConsumptionEstablished: false });
              res.rawForwardedHeaders = servedHeaders;
              res.writeHead(response.statusCode, response.statusMessage, servedHeaders);
              forwardedHash.update(body); forwardedBytes += body.length; res.end(body);
            } catch (error) { faultFailure(error); }
          } else res.end();
        });
        response.on('error', error => {
          writeLog('upstream_body_error', { message: error.message, ...bodyState() });
          if (active()) { state.proxyAbortCause = 'upstream_body_error'; res.destroy(); }
        });
        response.on('close', () => {
          if (!ended && active()) { state.proxyAbortCause = 'upstream_closed_before_end'; writeLog('upstream_incomplete', bodyState()); res.destroy(); }
        });
      });
      req.pipe(upstreamRequest);
    }
    if (rule.mode === 'delay') {
      writeLog('delay_scheduled', { delayMs: rule.delayMs });
      state.timer = setTimer(forward, rule.delayMs); return;
    }
    forward();
  };
}

export function parseArguments(args) {
  const options = { configPath: `${privateDirectory}/config.json`, logPath: `${privateDirectory}/requests.jsonl` };
  for (let index = 0; index < args.length; index += 2) {
    assert.ok(['--config', '--log'].includes(args[index]) && typeof args[index + 1] === 'string', 'Only --config and --log private file options are accepted');
    options[args[index] === '--config' ? 'configPath' : 'logPath'] = args[index + 1];
  }
  return options;
}
/** Parent-owned explicit startup only. Fixed loopback endpoints; no config HTTP route. */
export function startLocalProxy(options = parseArguments([])) {
  const logger = createPrivateLogger(options.logPath);
  const handler = makeHandler({ loadConfig: () => readPrivateConfig(options.configPath), log: logger.write });
  const server = http.createServer(handler);
  // Upgrades are forwarded unchanged to the same fixed loopback origin; index control is exact HTTP GET only.
  server.on('upgrade', (req, socket, head) => {
    const target = req.url;
    if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || privateWebTarget(target)) { socket.destroy(); return; }
    const upstream = http.request({ hostname: UPSTREAM.host, port: UPSTREAM.port, method: req.method, path: target, headers: req.rawHeaders, agent: false });
    const time = new Date().toISOString(); logger.write({ time, event: 'upgrade_start', requestedTarget: target, headers: loggedHeaders(req.rawHeaders) });
    upstream.on('upgrade', (response, upstreamSocket, upstreamHead) => {
      if (socket.destroyed) { upstreamSocket.destroy(); return; }
      let prefix = `HTTP/${response.httpVersion} ${response.statusCode} ${response.statusMessage}\r\n`;
      for (let i = 0; i < response.rawHeaders.length; i += 2) prefix += `${response.rawHeaders[i]}: ${response.rawHeaders[i + 1]}\r\n`;
      socket.write(prefix + '\r\n'); if (upstreamHead.length) socket.write(upstreamHead); if (head.length) upstreamSocket.write(head);
      logger.write({ time: new Date().toISOString(), event: 'upgrade_headers', requestedTarget: target, headers: loggedHeaders(response.rawHeaders) });
      upstreamSocket.on('error', () => socket.destroy()); socket.on('error', () => upstreamSocket.destroy());
      socket.once('close', () => upstreamSocket.destroy()); upstreamSocket.once('close', () => socket.destroy());
      upstreamSocket.pipe(socket); socket.pipe(upstreamSocket);
    });
    upstream.on('error', error => { logger.write({ time: new Date().toISOString(), event: 'upgrade_error', requestedTarget: target, message: error.message }); socket.destroy(); });
    upstream.on('response', response => { response.destroy(); socket.destroy(); });
    socket.on('error', () => upstream.destroy()); socket.once('close', () => upstream.destroy()); upstream.end();
  });
  server.once('error', error => { logger.write({ time: new Date().toISOString(), event: 'server_error', message: error.message }); logger.close(); });
  server.once('close', () => logger.close());
  server.listen(LISTEN.port, LISTEN.host, () => logger.write({ time: new Date().toISOString(), event: 'listening', listen: LISTEN, upstream: UPSTREAM }));
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) startLocalProxy(parseArguments(process.argv.slice(2)));
