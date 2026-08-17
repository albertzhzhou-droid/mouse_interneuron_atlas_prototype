import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the adult-mouse feasibility atlas", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Mouse Spinal Interneuron Atlas/);
  assert.match(html, /SCHEMATIC PROTOTYPE/);
  assert.match(html, /Mus musculus/);
  assert.match(html, /Five populations \+ two state overlays/);
  assert.match(html, /Research visualization only/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("restores a versioned evidence selection from URL state", async () => {
  const response = await render("/?cell=mouse.v3.sim1&view=transverse&slice=-17&endpoint=spasm");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /V3 interneurons/);
  assert.match(html, /Chronic complete S2 transection/);
  assert.match(html, /necessary component of the sensory-driven sacral network/);
});

test("removes all disposable starter preview code and metadata", async () => {
  const previewFiles = await readdir(new URL("../app/_sites-preview/", import.meta.url)).catch(() => []);
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.deepEqual(previewFiles, []);
  assert.match(page, /AtlasPrototype/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.match(layout, /Mouse Spinal Interneuron Atlas/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.match(packageJson, /"three"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
