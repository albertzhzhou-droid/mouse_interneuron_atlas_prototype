import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { indexLog } from './replay.mjs';
// Parent executes only after stopping its own proxy and declaring native-ready.
const [source, destination] = process.argv.slice(2);
assert.equal(process.argv.length, 4, 'Use exact owned original log and a new temp frozen filename');
assert.ok(fs.realpathSync(source).startsWith('/private/tmp/ohri-i60-index-native-proxy/'));
assert.ok(fs.realpathSync(path.dirname(destination)) === '/private/tmp/ohri-i60-native-live-replay');
assert.ok(!fs.existsSync(destination), 'Preserve any earlier frozen log');
const fd = fs.openSync(source, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW), chunks = [], hash = createHash('sha256'); let bytes = 0;
try {
  const before = fs.fstatSync(fd, { bigint: true }); assert.ok(before.isFile());
  for (;;) { const buffer = Buffer.alloc(4096), count = fs.readSync(fd, buffer, 0, buffer.length, bytes); if (!count) break; const part = buffer.subarray(0, count); chunks.push(part); hash.update(part); bytes += count; }
  const after = fs.fstatSync(fd, { bigint: true }); assert.ok(before.ino === after.ino && before.size === after.size && before.mtimeNs === after.mtimeNs && BigInt(bytes) === after.size, 'Original log was still changing');
} finally { fs.closeSync(fd); }
const body = Buffer.concat(chunks); indexLog(body.toString('utf8'));
const sha256 = hash.digest('hex'); const out = fs.openSync(destination, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
try { fs.writeFileSync(out, body); fs.fsyncSync(out); } finally { fs.closeSync(out); }
assert.equal(createHash('sha256').update(fs.readFileSync(destination)).digest('hex'), sha256);
process.stdout.write(JSON.stringify({ originalProxyLog: { path: source, bytes, sha256 }, frozenLog: { path: destination, bytes, sha256 }, nativeReadyEstablishedByThisCopy: false }) + '\n');
