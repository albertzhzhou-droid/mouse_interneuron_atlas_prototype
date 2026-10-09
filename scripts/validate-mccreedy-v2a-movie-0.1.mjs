import { openSync, readSync, fstatSync, closeSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { MCCREEDY_MOVIE as source } from "../app/mccreedy-v2a-movie.js";
function read(relative) {
  const handle = openSync(fileURLToPath(new URL(`../${relative}`, import.meta.url)), "r");
  try { const size = fstatSync(handle).size, bytes = Buffer.alloc(size); let at = 0;
    while (at < size) { const n = readSync(handle, bytes, at, Math.min(4096, size - at), at); assert.ok(n); at += n; }
    assert.equal(fstatSync(handle).size, size); return bytes;
  } finally { closeSync(handle); }
}
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const dir = "data/source-candidates/mccreedy-v2a-20261002/";
for (const pin of source.originalReceipts) { const bytes = read(dir + pin.name); assert.equal(bytes.length, pin.bytes); assert.equal(sha(bytes), pin.sha256); }
const original = read(dir + "Video_2.MP4"), publicBytes = read("public" + source.asset.url);
assert.deepEqual(publicBytes, original); assert.equal(sha(original), source.asset.sha256);
assert.equal(createHash("md5").update(original).digest("hex"), "52819657cc5afc44d9150c1c6a36490a");
assert.equal(original.length, 11361776);
const xml = read(dir + "article.xml").toString();
assert.ok(xml.includes('id="SM2"') && xml.includes('href="Video_2.MP4"'));
assert.ok(xml.includes("https://creativecommons.org/licenses/by/4.0/"));
assert.equal(source.rights.license, "CC BY 4.0"); assert.equal(source.citation.authors.length, 14);
assert.equal(source.biologicalContext.specimenId, null); assert.equal(source.biologicalContext.perCellIds, null);
const probe = JSON.parse(read(dir + "ffprobe.json")); assert.equal(probe.streams.length, 1);
assert.deepEqual([probe.streams[0].width, probe.streams[0].height, probe.streams[0].nb_read_frames], [1600, 1200, "400"]);
assert.equal(read(dir + "decode.log").length, 0);
console.log("Exact McCreedy Movie 2: original/public bytes, MD5/SHA, article membership/rights and encoded media verified; no geometry or per-cell admission.");
