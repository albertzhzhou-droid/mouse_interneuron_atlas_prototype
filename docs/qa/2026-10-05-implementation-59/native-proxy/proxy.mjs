import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const LISTEN = Object.freeze({ host: '127.0.0.1', port: 3005 });
export const UPSTREAM = Object.freeze({ host: '127.0.0.1', port: 3004 });
export const CONTROLLED_PATHS = Object.freeze([93, 21, 0].map(number => `/data/cano_chol_rna_counts_v1/counts-${String(number).padStart(3, '0')}.json.gzip`));
const privateDirectory = '/private/tmp/ohri-i59-native-proxy';
const modes = new Set(['pass', 'delay', '404', 'wrong_chunk']);
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
    assert.ok(CONTROLLED_PATHS.includes(target), 'Control requires an exact allowlisted chunk path');
    assert.ok(rule && typeof rule === 'object' && !Array.isArray(rule) && modes.has(rule.mode));
    const allowedKeys = rule.mode === 'delay' ? ['mode', 'delayMs'] : rule.mode === 'wrong_chunk' ? ['mode', 'replacementPath'] : ['mode'];
    assert.ok(Object.keys(rule).every(key => allowedKeys.includes(key)), 'Unknown control field');
    if (rule.mode === 'delay') {
      const delayMs = rule.delayMs ?? 12000;
      assert.ok(Number.isSafeInteger(delayMs) && delayMs >= 1 && delayMs <= 12000, 'Delay must be bounded to12s');
      rules[target] = Object.freeze({ mode: rule.mode, delayMs });
    } else if (rule.mode === 'wrong_chunk') {
      assert.ok(CONTROLLED_PATHS.includes(rule.replacementPath) && rule.replacementPath !== target, 'Replacement requires another exact allowlisted original chunk');
      rules[target] = Object.freeze({ mode: rule.mode, replacementPath: rule.replacementPath });
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
  if (fs.existsSync(absolute)) assert.ok(!fs.lstatSync(absolute).isSymbolicLink(), 'Private file cannot be a symlink');
  return absolute;
}
export function readPrivateConfig(filename) {
  const absolute = privatePath(filename);
  let fd;
  try { fd = fs.openSync(absolute, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW); }
  catch (error) { if (error.code === 'ENOENT') return validateConfig({ schemaVersion: 1, rules: {} }); throw error; }
  try {
    const size = fs.fstatSync(fd).size;
    assert.ok(size > 0 && size <= 65536, 'Private config size is bounded');
    return validateConfig(JSON.parse(fs.readFileSync(fd, 'utf8')));
  } finally { fs.closeSync(fd); }
}
export function createPrivateLogger(filename) {
  const absolute = privatePath(filename);
  const fd = fs.openSync(absolute, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND | fs.constants.O_NOFOLLOW, 0o600);
  fs.fchmodSync(fd, 0o600);
  let closed = false;
  return { write: value => { assert.ok(!closed, 'Local log is closed'); fs.writeSync(fd, JSON.stringify(value) + '\n'); }, close: () => { if (!closed) { closed = true; fs.closeSync(fd); } } };
}

/** No server or socket is created by importing this module or constructing a handler. */
export function makeHandler({ loadConfig, log = () => {}, request = http.request, setTimer = setTimeout, clearTimer = clearTimeout, now = () => new Date().toISOString() }) {
  let nextId = 0;
  return (req, res) => {
    const id = ++nextId, state = { cancelled: false, completed: false, timer: null, upstreamRequest: null, upstreamResponse: null, proxyAbortCause: null };
    let receivedBytes = 0, forwardedBytes = 0;
    const receivedHash = emptyHash(), forwardedHash = emptyHash();
    const writeLog = (event, fields = {}) => log({ time: now(), requestId: id, event, method: req.method, requestedTarget: req.url, ...fields });
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
    writeLog('request_start', { headers: loggedHeaders(req.rawHeaders ?? []), localListen: LISTEN, upstream: UPSTREAM });
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
      const upstreamTarget = rule.mode === 'wrong_chunk' ? rule.replacementPath : req.url;
      writeLog('upstream_start', { upstreamTarget, controlledBodySubstitution: rule.mode === 'wrong_chunk' });
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
        res.writeHead(response.statusCode, response.statusMessage, headers);
        let ended = false;
        response.on('data', chunk => {
          receivedHash.update(chunk); receivedBytes += chunk.length;
          if (!active()) return;
          forwardedHash.update(chunk); forwardedBytes += chunk.length;
          if (!res.write(chunk)) { response.pause(); res.once('drain', () => { if (active()) response.resume(); }); }
        });
        response.on('end', () => {
          ended = true;
          writeLog('upstream_body_complete', { upstreamTarget, ...bodyState() });
          if (active()) res.end();
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
    if (rule.mode === '404') { localResponse(404, 'Not found\n', 'controlled_chunk_404'); return; }
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
  // Upgrades are forwarded unchanged to the same fixed loopback origin; counts controls are HTTP GET only.
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
