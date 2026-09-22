import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest235Snapshot } from "../scripts/validate-research-iteration-manifest-2.35-snapshot.mjs";

const manifest = JSON.parse(await readFile(
  new URL("../data/research-iteration-manifest-2.35.json", import.meta.url),
  "utf8",
));

function mutated(mutator) {
  const value = structuredClone(manifest);
  mutator(value);
  value.manifestContentSha256 = computeManifestContentSha256(value);
  return value;
}

test("validates immutable 2.35 without rebuilding it from live 2.36 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest235Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.35.0",
    fileBytes: 134630,
    fileSha256: "71f90cfc2c6ad2c6f74146d1992493fc77229c131764faff83657dcada797dc1",
    contentSha256: "0691b27bd2cd46e0d96d9a8862ff8478819572f7cfde225d20b9d9c93aeff828",
    inputCount: 113,
    researchUpgradeCount: 158,
    canonicalSourcePackageCount: 25,
    canonicalRecordSetCount: 29,
    sourceProfileCount: 162,
    researchExplorerRecordCount: 414,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  });
});

test("keeps Dmrt3/dI6 out of the historical 2.35 roster", () => {
  assert.equal(manifest.authoritativeInputs.some((input) => input.path.includes("dmrt3-di6")), false);
  assert.equal(manifest.exactReferences.dmrt3Di6SourceTaxonomyIntegrity, undefined);
  assert.equal(manifest.registrySummary.sourceProfileCount, 162);
  assert.equal(manifest.registrySummary.researchExplorerRecordCount, 414);
});

test("rejects release, Dmrt3 backfill, denominator and geometry mutations", async () => {
  const cases = [
    mutated((value) => { value.application.version = "2.36.0-research.1"; }),
    mutated((value) => { value.authoritativeInputs[0].path = "data/dmrt3-di6-source-taxonomy-0.1.json"; }),
    mutated((value) => { value.registrySummary.sourceProfileCount = 168; }),
    mutated((value) => { value.exactReferences.crozatPkd2l1FunctionalProfileIntegrity.admittedGeometryCount = 1; }),
    mutated((value) => { value.registrations.count = 1; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest235Snapshot(value),
      /content receipt|release identity|input ids|Dmrt3|denominator|zero boundary|registration|schema/i,
    );
  }
});
