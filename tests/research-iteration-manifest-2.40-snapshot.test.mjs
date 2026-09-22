import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest240Snapshot } from "../scripts/validate-research-iteration-manifest-2.40-snapshot.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.40.json", import.meta.url), "utf8"));

function mutated(mutator) {
  const value = structuredClone(manifest);
  mutator(value);
  value.manifestContentSha256 = computeManifestContentSha256(value);
  return value;
}

test("validates immutable 2.40 without rebuilding it from future live inputs", async () => {
  assert.deepEqual(await validateResearchIterationManifest240Snapshot(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.40.0",
    fileBytes: 206354,
    fileSha256: "5552cc8c46c35a26fbefed4090f4a2d0337eda2397639ea5eca807fdf4cf6d30",
    contentSha256: "991885f465d6226ec9d23fe133238e62c32e253276b120ed54fd74a4a632b48f",
    inputCount: 187,
    researchUpgradeCount: 186,
    canonicalSourcePackageCount: 27,
    canonicalRecordSetCount: 33,
    bundledExactRosterCount: 9,
    bundledExactObjectSetCount: 1,
    sourceProfileCount: 376,
    sourceNamespaceCount: 9,
    completenessSlotCount: 8,
    auditedDatFileCount: 5,
    admittedRecordCount: 2,
    heldRecordCount: 3,
    admittedContourObjectCount: 15,
    admittedVertexCount: 475,
    admittedSurfaceCount: 0,
    admittedInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  });
});

test("keeps the catalog, NMO 45674 geometry, record-specific UI and timeline in the historical 2.40 roster", () => {
  const paths = new Set(manifest.authoritativeInputs.map((input) => input.path));
  assert.equal(paths.has("data/neurolucida-native-contour-admission-catalog-0.2.json"), true);
  assert.equal(paths.has("public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-45674-source-closed-soma-contours.json"), true);
  assert.equal(paths.has("app/NativeContourRecordViewer.tsx"), true);
  assert.equal(paths.has("app/ObservedMorphologyRouteLibrary.tsx"), true);
  assert.equal(paths.has("app/research-record-presentation.js"), true);
  assert.equal(paths.has("docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_40.md"), true);
  assert.equal(manifest.registrySummary.canonicalRecordSetCount, 33);
  assert.equal(manifest.registrySummary.bundledExactObjectSetCount, 1);
});

test("rejects release, roster, DAT, completeness, surface and registration mutations", async () => {
  const cases = [
    mutated((value) => { value.application.version = "2.41.0-research.1"; }),
    mutated((value) => { value.authoritativeInputs.find((input) => input.id === "nativeContourAdmissionCatalog").path = "data/research-source-registry-0.1.json"; }),
    mutated((value) => { value.registrySummary.canonicalRecordSetCount = 34; }),
    mutated((value) => { value.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity.admittedContourObjectCount = 14; }),
    mutated((value) => { value.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity.completenessSlotCount = 7; }),
    mutated((value) => { value.exactReferences.recordCompletenessAndNativeContourCatalogIntegrity.admittedSurfaceCount = 1; }),
    mutated((value) => { value.registrations.count = 1; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest240Snapshot(value),
      /content receipt|release identity|input paths|DAT|contour|completeness|denominator|zero boundary|registration|schema/i,
    );
  }
});
