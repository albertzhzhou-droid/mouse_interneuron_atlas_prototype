import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const paths = {
  atlas: new URL("../app/AtlasPrototype.tsx", import.meta.url),
  provider: new URL("../app/ResearchActiveRecordProvider.tsx", import.meta.url),
  explorer: new URL("../app/ResearchExplorer.tsx", import.meta.url),
  evidence: new URL("../app/ResearchFocusEvidencePanel.tsx", import.meta.url),
  model: new URL("../app/ResearchRecordModelReadout.tsx", import.meta.url),
};
const sources = Object.fromEntries(await Promise.all(
  Object.entries(paths).map(async ([name, path]) => [name, await readFile(path, "utf8")]),
));

test("one tree-scoped loader publishes the active record to all presentation roles", () => {
  assert.match(sources.atlas, /const researchActiveRecord = useResearchActiveRecordLoader\(researchFocus\)/);
  assert.match(sources.atlas, /<ResearchActiveRecordProvider value=\{researchActiveRecord\}>/);
  for (const name of ["explorer", "evidence", "model"]) {
    assert.match(sources[name], /useResearchActiveRecord\(\)/, `${name} must consume the shared active record`);
    assert.doesNotMatch(sources[name], /loadVerifiedResearchExplorerIndex/, `${name} must not own another index request`);
    assert.doesNotMatch(sources[name], /findResearchRecord/, `${name} must not independently resolve another record`);
  }
  assert.match(sources.provider, /loadVerifiedResearchExplorerIndex/);
  assert.equal((sources.provider.match(/loadVerifiedResearchExplorerIndex\(/g) ?? []).length, 1);
});

test("the provider owns abort and monotonic request-generation settlement", () => {
  assert.match(sources.provider, /const generation = \+\+generationRef\.current/);
  assert.match(sources.provider, /const controller = new AbortController\(\)/);
  assert.match(sources.provider, /generationRef\.current !== generation/);
  assert.match(sources.provider, /return \(\) => controller\.abort\(\)/);
  assert.match(sources.provider, /deriveResearchActiveRecordState\(storedActiveRecord, focus\)/);
});

test("main-scene morphology and SCI evidence wait for the exact ready record", () => {
  assert.match(sources.atlas, /verifiedActiveResearchRecord\?\.focusKind === "morphology_record"/);
  assert.match(sources.atlas, /verifiedActiveResearchRecord\.focusId === morphologyVisualTarget\.focusBinding\?\.focusId/);
  assert.match(sources.atlas, /verifiedActiveResearchRecord\?\.focusKind === "sci_entity"/);
  assert.match(sources.evidence, /activeRecord\.record\?\.focusKind === "sci_entity"/);
  assert.match(sources.evidence, /sciEntity\?\.id === focus\.focusId/);
});

test("search dossier, evidence detail and model authority receive the same record object", () => {
  assert.match(sources.explorer, /const selectedRecord = activeRecord\.status === "ready" \? activeRecord\.record : null/);
  assert.match(sources.evidence, /<VerifiedResearchRecord record=\{activeRecord\.record\} \/>/);
  assert.match(sources.model, /<RecordReadout record=\{activeRecord\.record\} \/>/);
});
