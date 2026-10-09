import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CANO_CHOL_IN_BYTE_RECEIPT, compileOhriSourceBytesModule, ohriSourceBytesPlugin } from "../tools/ohri-source-bytes-vite-plugin.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const file = path.resolve(root, CANO_CHOL_IN_BYTE_RECEIPT.path);
const bytes = await readFile(file);
const routePath = path.join(root, "app/api/source-rosters/cano-chol-in/route.ts");
const asModuleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("the actual source-byte loader emits exact web-runtime bytes without runtime filesystem or Buffer dependencies", async () => {
  const plugin = ohriSourceBytesPlugin(root);
  const id = plugin.resolveId("../../../../" + CANO_CHOL_IN_BYTE_RECEIPT.path + "?ohri-source-bytes", routePath);
  assert.ok(id.startsWith("\0ohri-source-bytes:"));
  const watched = [];
  const code = await plugin.load.call({ addWatchFile: (value) => watched.push(value) }, id);
  assert.deepEqual(watched, [file]);
  assert.doesNotMatch(code, /node:|readFile|Buffer|fetch\(/);
  const loaded = (await import(asModuleUrl(code))).default;
  assert.ok(loaded instanceof Uint8Array);
  assert.equal(loaded.length, 16348);
  assert.equal(sha256(loaded), CANO_CHOL_IN_BYTE_RECEIPT.sha256);
  assert.deepEqual(Buffer.from(loaded), bytes);
});

test("unallowlisted paths, query variants, corrupt and truncated source bytes fail before emission", async () => {
  const plugin = ohriSourceBytesPlugin(root);
  assert.equal(plugin.resolveId("some-module?raw", routePath), null);
  assert.throws(() => plugin.resolveId("../../../../public/data/another.csv.gz?ohri-source-bytes", routePath), /Unallowlisted/);
  assert.throws(() => plugin.resolveId(file + "?ohri-source-bytes&raw", routePath), /Invalid.*query/);
  assert.throws(() => plugin.resolveId(file + "?ohri-source-bytes#fragment", routePath), /Invalid.*query/);
  await assert.rejects(plugin.load.call({ addWatchFile() {} }, "\0ohri-source-bytes:" + path.join(root, "package.json")), /Unallowlisted/);
  assert.throws(() => compileOhriSourceBytesModule(root, path.join(root, "package.json"), bytes), /Unallowlisted/);
  const corrupt = new Uint8Array(bytes); corrupt[100] ^= 1;
  assert.throws(() => compileOhriSourceBytesModule(root, file, corrupt), /receipt mismatch/);
  assert.throws(() => compileOhriSourceBytesModule(root, file, bytes.subarray(1)), /receipt mismatch/);
});

test("the actual GET route returns the exact raw gzip once, without HTTP Content-Encoding", async () => {
  const moduleUrl = asModuleUrl(compileOhriSourceBytesModule(root, file, bytes));
  const source = await readFile(routePath, "utf8");
  assert.doesNotMatch(source, /node:|readFile|Buffer/);
  const route = await import(asModuleUrl(source.replace(/from "[^"]+\?ohri-source-bytes"/, `from ${JSON.stringify(moduleUrl)}`)));
  const response = route.GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/gzip");
  assert.equal(response.headers.get("content-encoding"), null);
  assert.equal(response.headers.get("content-length"), "16348");
  assert.match(response.headers.get("cache-control"), /no-transform/);
  const delivered = new Uint8Array(await response.arrayBuffer());
  assert.equal(sha256(delivered), CANO_CHOL_IN_BYTE_RECEIPT.sha256);
  delivered[100] ^= 1;
  assert.equal(sha256(new Uint8Array(await route.GET().arrayBuffer())), CANO_CHOL_IN_BYTE_RECEIPT.sha256);
});
