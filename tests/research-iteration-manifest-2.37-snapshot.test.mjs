import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest237Snapshot } from "../scripts/validate-research-iteration-manifest-2.37-snapshot.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.37.json", import.meta.url), "utf8"));

function mutated(mutator) {
  const value = structuredClone(manifest);
  mutator(value);
  value.manifestContentSha256 = computeManifestContentSha256(value);
  return value;
}

test("validates immutable 2.37 without rebuilding it from live 2.38 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest237Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.37.0",
    fileBytes: 161281,
    fileSha256: "2ddc5b4cce26cbe5db492234446a52f3c0f182c0ff0ed896104ec6a9c4fb3b08",
    contentSha256: "04b6f7a09968489afa420edb527a159e04f4dc07bab4ce402e394808256ca765",
    inputCount: 146,
    researchUpgradeCount: 164,
    canonicalSourcePackageCount: 27,
    canonicalRecordSetCount: 31,
    bundledExactRosterCount: 8,
    sourceProfileCount: 325,
    sourceNamespaceCount: 8,
    researchExplorerRecordCount: 579,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  });
});

test("keeps Roome and the canonical focus-workspace runtime in the historical 2.37 roster", () => {
  assert.equal(manifest.authoritativeInputs.some((input) => input.path === "data/roome-dil-source-taxonomy-0.1.json"), true);
  assert.equal(manifest.authoritativeInputs.some((input) => input.path === "data/roome-dil-differential-features-0.1.json"), true);
  assert.equal(manifest.authoritativeInputs.some((input) => input.path === "app/research-focus-workspace-state.js"), true);
  assert.equal(manifest.registrySummary.sourceProfileCount, 325);
  assert.equal(manifest.registrySummary.researchExplorerRecordCount, 579);
});

test("rejects release, Roome removal, denominator and geometry mutations", async () => {
  const cases = [
    mutated((value) => { value.application.version = "2.38.0-research.1"; }),
    mutated((value) => { value.authoritativeInputs.find((input) => input.id === "roomeTaxonomyContract").path = "data/research-source-registry-0.1.json"; }),
    mutated((value) => { value.registrySummary.sourceProfileCount = 376; }),
    mutated((value) => { value.exactReferences.roomeDilAndRecordWorkspaceIntegrity.admittedGeometryCount = 1; }),
    mutated((value) => { value.registrations.count = 1; }),
  ];
  for (const value of cases) {
    await assert.rejects(() => validateResearchIterationManifest237Snapshot(value), /content receipt|release identity|input paths|Roome|denominator|zero boundary|registration|schema/i);
  }
});
