import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import { SOURCE_AUDIT_WORKSPACES, sourceAuditWorkspaceForFragment } from "../app/source-audit-workspaces.js";

test("existing sample and comparative fragments still resolve their source workspace", () => {
  assert.equal(sourceAuditWorkspaceForFragment("#exact-source-audit-heading"), "source-exact-inputs");
  assert.equal(sourceAuditWorkspaceForFragment("#esa-selected-sample-heading"), "source-exact-inputs");
  assert.equal(sourceAuditWorkspaceForFragment("#comparative-swc-title"), "source-comparative-swc");
  for (const workspace of SOURCE_AUDIT_WORKSPACES) assert.equal(sourceAuditWorkspaceForFragment(`#${workspace.id}`), workspace.id);
});

test("source IDs, arbitrary fragments and malformed encoding never open a reference workspace", () => {
  for (const fragment of ["", "#", "#BIL:ace-pie-cot", "#NMO_183779", "#source-wt-planes/extra", "#%FF", "#source-comparative-swc?source=mouse", null, {}]) {
    assert.equal(sourceAuditWorkspaceForFragment(fragment), null);
  }
  assert.equal(sourceAuditWorkspaceForFragment("#%73ource-wt-planes"), "source-wt-planes");
});

async function responseFor(route) {
  const { default: worker } = await import("../dist/server/index.js");
  const response = await worker.fetch(new Request(`http://localhost${route}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  return response;
}

async function render(route) {
  const response = await responseFor(route);
  assert.equal(response.status, 200);
  return response.text();
}

test("the production source route exposes every workspace without mounting or preloading its source viewers", async () => {
  const html = await render("/source-audits");
  for (const workspace of SOURCE_AUDIT_WORKSPACES) assert.ok(html.includes(`id="${workspace.id}"`));
  assert.doesNotMatch(html, /data-source-workspace=|data-testid="bil-xenium-metadata-explorer"|data-testid="janelia-wt-bounded-reference-viewer"|data-testid="comparative-swc-card"|Source sample characteristics and barcode crosswalk/);
  assert.doesNotMatch(html, /<canvas\b|\/data\/(?:janelia_wt_reference_v1|comparative_swc_reference_v1)\//);
  const staticAssets = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+)"/g)].map(match => match[1]);
  assert.ok(staticAssets.some(url => url.includes("SourceAuditWorkspaces")));
  assert.ok(staticAssets.every(url => !/bil-xenium-metadata-explorer|ExactSourceAuditWorkbench|janelia-wt-bounded-reference-viewer|ComparativeSwcReferenceWorkbench|IndependentSourceObjectViewport|AtlasPrototype|OrbitControls/.test(url)));
  for (const url of new Set(staticAssets)) await access(new URL(`../dist/client${url}`, import.meta.url));
});

test("additional study evidence remains reachable on its dedicated route", async () => {
  const html = await render("/explore/cell-types/additional");
  for (const id of ["dandi-trace-preview-panel", "connection-evidence-panel", "sampling-sensitivity-panel"]) assert.ok(html.includes(`id="${id}"`));
  assert.doesNotMatch(html, /<canvas\b|data-source-workspace=|data-testid="bil-xenium-metadata-explorer"|data-testid="janelia-wt-bounded-reference-viewer"|data-testid="comparative-swc-card"/);
});

test("the legacy sources address redirects to the registry with reachable deferred audit entry points", async () => {
  const response = await responseFor("/?lab=sources");
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "/sources?lab=sources");
  const html = await render(response.headers.get("location"));
  assert.ok(html.includes('data-collection-page="sources"'));
  assert.ok(html.includes('aria-labelledby="source-registry-heading"'));
  assert.ok(html.includes('href="/source-audits"'));
  assert.doesNotMatch(html, /data-source-workspace=|data-testid="bil-xenium-metadata-explorer"|data-testid="janelia-wt-bounded-reference-viewer"|data-testid="comparative-swc-card"/);
  assert.doesNotMatch(html, /<canvas\b|\/data\/(?:janelia_wt_reference_v1|comparative_swc_reference_v1)\//);
});
