import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest236Snapshot } from "../scripts/validate-research-iteration-manifest-2.36-snapshot.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.36.json", import.meta.url), "utf8"));

function mutated(mutator) {
  const value = structuredClone(manifest);
  mutator(value);
  value.manifestContentSha256 = computeManifestContentSha256(value);
  return value;
}

test("validates immutable 2.36 without rebuilding it from live 2.37 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest236Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.36.0",
    fileBytes: 148126,
    fileSha256: "93d8a624a5a132a91f3f423cb7b3bc966ef4082f71e18e0e82c0384267588e15",
    contentSha256: "3021dd9d9ce1d515634f0d1ea575d624767972411edc923e9b75621979b0e344",
    inputCount: 127,
    researchUpgradeCount: 162,
    canonicalSourcePackageCount: 26,
    canonicalRecordSetCount: 30,
    sourceProfileCount: 168,
    researchExplorerRecordCount: 421,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  });
});

test("keeps Roome and the canonical focus-workspace runtime out of the historical 2.36 roster", () => {
  assert.equal(manifest.authoritativeInputs.some((input) => input.path.includes("roome-dil")), false);
  assert.equal(manifest.authoritativeInputs.some((input) => input.path.includes("research-focus-workspace-state")), false);
  assert.equal(manifest.registrySummary.sourceProfileCount, 168);
  assert.equal(manifest.registrySummary.researchExplorerRecordCount, 421);
});

test("rejects release, Roome backfill, denominator and geometry mutations", async () => {
  const cases = [
    mutated((value) => { value.application.version = "2.37.0-research.1"; }),
    mutated((value) => { value.authoritativeInputs[0].path = "data/roome-dil-source-taxonomy-0.1.json"; }),
    mutated((value) => { value.registrySummary.sourceProfileCount = 325; }),
    mutated((value) => { value.exactReferences.dmrt3Di6AndRecordUiIntegrity.admittedGeometryCount = 1; }),
    mutated((value) => { value.registrations.count = 1; }),
  ];
  for (const value of cases) {
    await assert.rejects(() => validateResearchIterationManifest236Snapshot(value), /content receipt|release identity|input ids|Roome|denominator|zero boundary|registration|schema/i);
  }
});
