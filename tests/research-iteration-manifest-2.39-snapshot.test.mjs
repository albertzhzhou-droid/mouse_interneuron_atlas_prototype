import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest239Snapshot } from "../scripts/validate-research-iteration-manifest-2.39-snapshot.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.39.json", import.meta.url), "utf8"));

function mutated(mutator) {
  const value = structuredClone(manifest);
  mutator(value);
  value.manifestContentSha256 = computeManifestContentSha256(value);
  return value;
}

test("validates immutable 2.39 without rebuilding it from live 2.40 inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest239Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.39.0",
    fileBytes: 187451,
    fileSha256: "865782ddbc2b827d4fe1359bbd1c250ce24afadcb052990c8c5978bb06ef81b4",
    contentSha256: "4fa9014be79e2d920f6859944da35a676bed2d7e17b3b83c4dcdb9fe419904cc",
    inputCount: 172,
    researchUpgradeCount: 178,
    canonicalSourcePackageCount: 27,
    canonicalRecordSetCount: 33,
    bundledExactRosterCount: 9,
    bundledExactObjectSetCount: 1,
    sourceProfileCount: 376,
    sourceNamespaceCount: 9,
    researchExplorerRecordCount: 630,
    admittedSourceNativeContourObjectCount: 8,
    vertexCount: 275,
    admittedSurfaceCount: 0,
    admittedInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  });
});

test("keeps native contours, their viewer, availability audit and timeline in the historical 2.39 roster", () => {
  const paths = new Set(manifest.authoritativeInputs.map((input) => input.path));
  assert.equal(paths.has("data/neurolucida-source-native-soma-contour-trace-0.1.json"), true);
  assert.equal(paths.has("public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json"), true);
  assert.equal(paths.has("app/NativeSomaContourViewer.tsx"), true);
  assert.equal(paths.has("data/open-source-modeling-availability-audit-0.1.json"), true);
  assert.equal(paths.has("docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_39.md"), true);
  assert.equal(manifest.registrySummary.canonicalRecordSetCount, 33);
  assert.equal(manifest.registrySummary.bundledExactObjectSetCount, 1);
});

test("rejects release, roster, denominator, contour, surface and registration mutations", async () => {
  const cases = [
    mutated((value) => { value.application.version = "2.40.0-research.1"; }),
    mutated((value) => { value.authoritativeInputs.find((input) => input.id === "nativeSomaContourContract").path = "data/research-source-registry-0.1.json"; }),
    mutated((value) => { value.registrySummary.canonicalRecordSetCount = 34; }),
    mutated((value) => { value.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity.vertexCount = 276; }),
    mutated((value) => { value.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity.admittedSurfaceCount = 1; }),
    mutated((value) => { value.registrations.count = 1; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest239Snapshot(value),
      /content receipt|release identity|input paths|native-contour|denominator|zero boundary|registration|schema/i,
    );
  }
});
