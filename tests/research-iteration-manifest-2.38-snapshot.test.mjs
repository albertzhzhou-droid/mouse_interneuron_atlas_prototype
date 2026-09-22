import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest238Snapshot } from "../scripts/validate-research-iteration-manifest-2.38-snapshot.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.38.json", import.meta.url), "utf8"));

function mutated(mutator) {
  const value = structuredClone(manifest);
  mutator(value);
  value.manifestContentSha256 = computeManifestContentSha256(value);
  return value;
}

test("validates immutable 2.38 without rebuilding it from live 2.39 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest238Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.38.0",
    fileBytes: 173397,
    fileSha256: "97ef72ab7e7c2da802af7c4cca6d5a280162e61a08b4a2258bb58f1ee0107595",
    contentSha256: "8af86d1167213865712c5da915193c13b629d31a1e0452f08d2d4f4f9d9f3b19",
    inputCount: 159,
    researchUpgradeCount: 171,
    canonicalSourcePackageCount: 27,
    canonicalRecordSetCount: 32,
    bundledExactRosterCount: 9,
    sourceProfileCount: 376,
    sourceNamespaceCount: 9,
    researchExplorerRecordCount: 630,
    admittedGeometryCount: 0,
    admittedInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  });
});

test("keeps Delile, record-presentation and PKD2L1 inputs in the historical 2.38 roster", () => {
  assert.equal(manifest.authoritativeInputs.some((input) => input.path === "data/delile-developmental-interneuron-taxonomy-0.1.json"), true);
  assert.equal(manifest.authoritativeInputs.some((input) => input.path === "data/pkd2l1-sbfsem-video-reference-0.1.json"), true);
  assert.equal(manifest.authoritativeInputs.some((input) => input.path === "app/research-record-presentation.js"), true);
  assert.equal(manifest.registrySummary.sourceProfileCount, 376);
  assert.equal(manifest.registrySummary.researchExplorerRecordCount, 630);
});

test("rejects release, roster, denominator, geometry and registration mutations", async () => {
  const cases = [
    mutated((value) => { value.application.version = "2.39.0-research.1"; }),
    mutated((value) => { value.authoritativeInputs.find((input) => input.id === "delileTaxonomyContract").path = "data/research-source-registry-0.1.json"; }),
    mutated((value) => { value.registrySummary.canonicalRecordSetCount = 33; }),
    mutated((value) => { value.exactReferences.delilePresentationAndPkd2l1Integrity.admittedGeometryCount = 1; }),
    mutated((value) => { value.registrations.count = 1; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest238Snapshot(value),
      /content receipt|release identity|input paths|Delile|denominator|zero boundary|registration|schema/i,
    );
  }
});
