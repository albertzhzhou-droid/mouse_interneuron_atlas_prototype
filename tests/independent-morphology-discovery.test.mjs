import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [collection, home, lab, viewer, universe] = await Promise.all([
  readFile(new URL("../app/ResearchCollectionPage.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/ResearchDataLab.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/MorphologyViewer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/NeuroMorphoUniversePanel.tsx", import.meta.url), "utf8"),
]);

test("profile label discovery drives a shared literal query across both morphology indexes", () => {
  assert.match(collection, /const literalQuery = sourceLabel\.trim\(\)\.slice\(0, 180\)/);
  assert.match(collection, /new URLSearchParams\(\{ morphologyQuery: literalQuery \}\)/);
  assert.match(collection, /morphologySearchQuery=\{state\.morphologyQuery\}/);
  assert.match(collection, /onMorphologySearchQueryChange=\{setMorphologyQuery\}/);
  assert.match(lab, /morphologySearchQuery=\{morphologySearchQuery\}/);
  assert.match(lab, /onMorphologySearchQueryChange=\{onMorphologySearchQueryChange\}/);
  assert.match(viewer, /morphologySearchQuery=\{morphologySearchQuery\}/);
  assert.match(viewer, /onMorphologySearchQueryChange=\{onMorphologySearchQueryChange\}/);
  assert.ok(universe.includes("Search ID, label, region, DOI, or PMID<input value={query} onChange={(event) => updateSearchQuery(event.target.value)}"));
  assert.ok(viewer.includes("Search ID, label, region or paper\n            <input value={query} onChange={(event) => {"));
  assert.match(viewer, /onMorphologySearchQueryChange\?\.\(event\.target\.value\)/);
});

test("a discovery request clears stale/default geometry and requires explicit exact-record selection", () => {
  assert.match(lab, /key=\{`independent-morphology-discovery-\$\{morphologyDiscoveryRequestId\}`\}/);
  assert.match(viewer, /const explicitDiscoveryMode = morphologyDiscoveryRequestId > 0 \|\| morphologySearchQuery\.trim\(\)\.length > 0/);
  assert.match(viewer, /useState<number \| null>\(\(\) => explicitDiscoveryMode \? null : neuronIdFromInitial\(initialNeuron\)\)/);
  assert.match(viewer, /useState<MorphologyView>\(\(\) => explicitDiscoveryMode \? "universe"/);
  assert.match(viewer, /setInternalSelectedId\(\(current\) => current \?\? \(discoveryModeRef\.current \? null : preferred\?\.neuronId/);
  assert.match(viewer, /const effectiveSelectedId = selectedId \?\? \(explicitDiscoveryMode \? null : filteredRecords\[0\]\?\.neuronId \?\? null\)/);
  assert.match(viewer, /useState<\{ neuronId: number; data: GeometryPayload \} \| null>\(null\)/);
  assert.match(universe, /useState<number \| null>\(\(\) => explicitDiscoveryMode \? null : controlledNeuronId\(selectedFocusId\)\)/);
  assert.match(universe, /explicitDiscoveryRef\.current[\s\S]*\? null[\s\S]*next\.records\.find\(\(record\) => record\.neuronId === 104003\)/);
  assert.match(universe, /useState<GeometryState>\(\{ status: "idle", neuronId: null, geometry: null, error: "" \}\)/);
  assert.match(universe, /if \(!selected\)[\s\S]*setGeometryState\(\{ status: "idle", neuronId: null, geometry: null, error: "" \}\)/);
  assert.match(lab, /No morphology is selected by this search; choose one exact NeuroMorpho record/);
});

test("deep-link restore preserves explicit morphology-browser intent without creating identity", () => {
  assert.match(home, /if \(lab === "morphology" && first\(params\.morphologyQuery\)\?\.trim\(\)\) return paths\.morphology/);
  assert.match(collection, /morphologyQuery: params\.get\("morphologyQuery"\) \?\? ""/);
  assert.match(collection, /morphologyDiscoveryRequestId=\{initial\.get\("morphologyQuery"\)\?\.trim\(\) \? 1 : 0\}/);
  assert.match(collection, /Literal repository-text search:/);
  assert.match(collection, /It does not assign a biological subtype or select a matching cell/);
  assert.match(lab, /literal repository-text search only/);
  assert.match(lab, /It does not establish subtype equivalence or same-cell identity/);
  const handler = collection.match(/const browseIndependentMorphology = \(sourceLabel: string\) => \{([\s\S]*?)\n {2}\};/)?.[1] ?? "";
  assert.ok(handler);
  assert.ok(handler.includes('window.location.assign(`/explore/morphology/viewer?${params.toString()}`)'));
  assert.doesNotMatch(handler, /transitionResearchFocus|selectResearchLab|focusKind|focusId|cellForm|morphologyNeuron/);
});
