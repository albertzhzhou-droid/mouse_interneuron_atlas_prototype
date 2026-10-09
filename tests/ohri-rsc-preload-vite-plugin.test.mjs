import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";
import { parseRscPreloadManifest, reconcileRscPreloads } from "../tools/ohri-rsc-preload-vite-plugin.mjs";

const entry = "/_next/static/chunks/index.js", view = "/_next/static/chunks/SourceAuditWorkspaces.js", css = "/_next/static/css/source-audit-workspaces.css";
const eliminated = "/_next/static/chunks/source-audit-workspaces-CrzQKbs-.js";
const fixture = () => ({ clientEntryUrl: entry, clientEntryDeps: { js: [entry], css: [] }, clientReferenceDeps: { source: { js: [view, entry, eliminated], css: [css] } }, serverResources: {}, cssLinkPrecedence: "default" });

test("an eliminated auxiliary preload is removed while all emitted entry, source and stylesheet assets remain", () => {
  const original = fixture();
  const result = reconcileRscPreloads(original, [entry, view, css], ["const source='source-wt-planes';"]);
  assert.deepEqual(result.manifest.clientReferenceDeps.source, { js: [view, entry], css: [css] });
  assert.deepEqual(original, fixture());
  assert.equal(result.removed[0].url, eliminated);
  assert.equal(result.manifest.cssLinkPrecedence, original.cssLinkPrecedence);
});

test("a genuinely missing client entry or stylesheet still fails instead of being hidden", () => {
  assert.throws(() => reconcileRscPreloads(fixture(), [view, css], []), /Missing required/);
  assert.throws(() => reconcileRscPreloads(fixture(), [entry, view], []), /stylesheet/);
  const missingView = fixture();
  assert.throws(() => reconcileRscPreloads(missingView, [entry, css], []), /Missing required/);
});

test("a missing chunk still referenced by actual emitted runtime code fails the build", () => {
  assert.throws(() => reconcileRscPreloads(fixture(), [entry, view, css], [`import './${eliminated.split('/').at(-1)}';`]), /runtime-imported/);
});

test("manifest parsing accepts only the builder's JSON export and never evaluates module code", () => {
  assert.deepEqual(parseRscPreloadManifest(`export default ${JSON.stringify(fixture())};\n`), fixture());
  assert.throws(() => parseRscPreloadManifest("export default { clientEntryUrl: (() => fetch('https://invalid'))() }"));
  assert.throws(() => parseRscPreloadManifest("import x from 'x'; export default {}"), /Unsupported/);
});

test("every production RSC and SSR preload now names an actual emitted client file", async () => {
  for (const environment of ["", "ssr/"]) {
    const manifest = parseRscPreloadManifest(await readFile(new URL(`../dist/server/${environment}__vite_rsc_assets_manifest.js`, import.meta.url), "utf8"));
    const urls = new Set([manifest.clientEntryUrl, ...[manifest.clientEntryDeps, ...Object.values(manifest.clientReferenceDeps), ...Object.values(manifest.serverResources)].flatMap(deps => [...deps.js, ...deps.css])]);
    for (const url of urls) await access(new URL(`../dist/client${url}`, import.meta.url));
  }
});
