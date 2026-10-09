import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { syncBuiltinESMExports } from 'node:module';
const originalRead = fs.promises.readFile;
const firstEpochs = new Map();
const epoch = s => [s.dev, s.ino, s.size, s.mtimeNs, s.ctimeNs].map(String);
const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
fs.promises.readFile = async function(file, options) {
  if (typeof file !== 'string' && !(file instanceof URL)) return originalRead(file, options);
  const key = resolve(file instanceof URL ? fileURLToPath(file) : file);
  const expected = firstEpochs.get(key);
  if (expected && !equal(expected, epoch(fs.statSync(file, { bigint: true })))) throw Error('Previously accepted source epoch changed: '+key);
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (options?.signal?.aborted) throw new DOMException('Read aborted', 'AbortError');
    const fd = fs.openSync(file, 'r');
    let out, accepted, refused;
    try {
      const before = fs.fstatSync(fd, { bigint: true });
      if (before.size > BigInt(Number.MAX_SAFE_INTEGER)) throw Error('Source exceeds safe read size: '+key);
      out = Buffer.alloc(Number(before.size));
      for (let offset = 0; offset < out.length;) {
        if (options?.signal?.aborted) throw new DOMException('Read aborted', 'AbortError');
        const n = fs.readSync(fd, out, offset, Math.min(4096, out.length-offset), offset);
        if (!n) throw Error('Incomplete exact positional read: '+key);
        offset += n;
      }
      accepted = epoch(before);
      const after = epoch(fs.fstatSync(fd, { bigint: true }));
      const pathEnd = epoch(fs.statSync(file, { bigint: true }));
      if (!equal(accepted, after) || !equal(accepted, pathEnd)) refused = { before: accepted, fdEnd: after, pathEnd };
    } finally { fs.closeSync(fd); }
    if (refused) {
      process.stderr.write(JSON.stringify({ status: 'STRICT_SOURCE_EPOCH_REFUSAL', path: key, attempt, previouslyAccepted: !!expected, ...refused })+'\n');
      if (expected || attempt === 3) throw Error('Source epoch changed during complete exact read: '+key);
      continue;
    }
    if (expected && !equal(expected, accepted)) throw Error('Previously accepted source epoch changed after read: '+key);
    if (!expected) firstEpochs.set(key, accepted);
    const encoding = typeof options === 'string' ? options : options?.encoding;
    return encoding ? out.toString(encoding) : out;
  }
};
fs.promises.readdir = async (...args) => fs.readdirSync(...args);
fs.promises.writeFile = async (...args) => fs.writeFileSync(...args);
syncBuiltinESMExports();
