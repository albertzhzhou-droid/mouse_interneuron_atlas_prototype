import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest239 } from "../scripts/validate-research-iteration-manifest-2.39.mjs";
import {
  RESEARCH_ITERATION_239_ADDITIONAL_INPUTS,
  RESEARCH_ITERATION_239_PARENT,
  RESEARCH_ITERATION_239_PURPOSE_OVERRIDES,
  buildResearchIterationManifest239,
} from "../tools/build_research_iteration_manifest_2_39.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.39.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const parent = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.38.json", import.meta.url), "utf8"));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function mutated(update) {
  const copy = structuredClone(manifest);
  update(copy);
  copy.manifestContentSha256 = computeManifestContentSha256(copy);
  return copy;
}

test("validates the deterministic 2.39 source-native contour and availability manifest", async () => {
  const report = await validateResearchIterationManifest239();
  assert.deepEqual(report, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.39.0",
    fileBytes: manifestBytes.byteLength,
    fileSha256: sha256(manifestBytes),
    manifestContentSha256: manifest.manifestContentSha256,
    inputCount: 172,
    researchUpgradeCount: 178,
    lastResearchUpgradeId: "UPG-196",
    canonicalSourceCount: 27,
    canonicalRecordSetCount: 33,
    bundledExactRosterCount: 9,
    bundledExactObjectSetCount: 1,
    sourceProfileCount: 376,
    sourceNamespaceCount: 9,
    researchExplorerRecordCount: 630,
    sourceSomaContourObjectCount: 8,
    vertexCount: 275,
    availabilityCandidateCount: 3,
    admittedSurfaceCount: 0,
    admittedInternalStructureCount: 0,
    registrationCount: 0,
  });
});

test("rebuilds byte-identically from the immutable 2.38 parent and 172 exact inputs", async () => {
  const built = await buildResearchIterationManifest239();
  assert.deepEqual(built.bytes, manifestBytes);
  assert.deepEqual(manifest.parentIterationManifest, RESEARCH_ITERATION_239_PARENT);
  assert.equal(parent.authoritativeInputs.length, 159);
  assert.equal(manifest.authoritativeInputs.length, 172);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 172);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 172);
  assert.deepEqual(
    manifest.authoritativeInputs.slice(0, 159).map(({ id, scope, path }) => ({ id, scope, path })),
    parent.authoritativeInputs.map(({ id, scope, path }) => ({ id, scope, path })),
  );
  for (const [id, purpose] of Object.entries(RESEARCH_ITERATION_239_PURPOSE_OVERRIDES)) {
    assert.equal(manifest.authoritativeInputs.find((input) => input.id === id)?.purpose, purpose);
  }
  for (const parentInput of parent.authoritativeInputs.filter((input) => !(input.id in RESEARCH_ITERATION_239_PURPOSE_OVERRIDES))) {
    assert.equal(manifest.authoritativeInputs.find((input) => input.id === parentInput.id)?.purpose, parentInput.purpose);
  }
  assert.deepEqual(
    manifest.authoritativeInputs.slice(159).map((input) => input.id),
    RESEARCH_ITERATION_239_ADDITIONAL_INPUTS.map((input) => input.id),
  );
});

test("locks eight source-native contours without promoting them to a cell roster or surface", () => {
  const value = manifest.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity;
  assert.equal(value.nativeContourReleaseId, "ohri-neurolucida-source-native-soma-contour-trace-0.1.0");
  assert.equal(value.neuronId, 45718);
  assert.equal(value.sourceDatBytes, 343774);
  assert.equal(value.sourceDatSha256, "ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415");
  assert.equal(value.independentParserCommit, "e07fd2d53c03945f011c335c7b643765f2d85a09");
  assert.equal(value.independentParserSha256, "2714ab12fc330a7880262b0d5f0aa5321ddf5813ab86215f2121b78c08efaec2");
  assert.equal(value.nativeGeometryBytes, 45606);
  assert.equal(value.nativeGeometrySha256, "a0aa80ce0f12b08cfe61b2862f1b3a29f67a1105a722b0dceda2fd3b25e898e8");
  assert.equal(value.pointPayloadSha256, "a478e6263e7d00c1f17bc64143014a3519c39f771b6809a28b057db07c724ab4");
  assert.equal(value.sourceSomaContourObjectCount, 8);
  assert.equal(value.sourceFlagClosedObjectCount, 7);
  assert.equal(value.legacyCellBodyClosureExceptionCount, 1);
  assert.equal(value.vertexCount, 275);
  assert.equal(value.semanticClosedSegmentCount, 275);
  assert.equal(value.admittedSourceNativeContourObjectCount, 8);
  assert.equal(value.bundledExactRosterCount, 9);
  assert.equal(value.bundledExactObjectSetCount, 1);
  assert.match(manifest.scientificBoundaries.sourceNativeSomaContoursAndAvailabilityIntegrity, /eight NMO contours are not a cell roster/);
  for (const field of [
    "admittedSurfaceCount",
    "admittedInternalStructureCount",
    "generatedFallbackPrimitiveCount",
    "filledPolygonCount",
    "triangleCount",
    "volumeCount",
    "registrationCount",
    "atlasRegistrationCount",
    "sameCellCrossModalJoinCount",
    "standardizedSwcOverlayCount",
  ]) assert.equal(value[field], 0, field);
  for (const field of [
    "lineLoopsOnly",
    "sourceCoordinatesPreserved",
    "viewerTransformReversible",
    "legacyCellBodyKeptSeparate",
    "traceRadiusRenderingForbidden",
    "datToSwcOverlayForbidden",
    "noGenericGeometrySubstitution",
  ]) assert.equal(value[field], true, field);
});

test("locks the 27-source, 33-record-set, 9-roster plus 1-object-set registry and queue-only availability audit", () => {
  const value = manifest.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity;
  assert.equal(value.canonicalSourceCount, 27);
  assert.equal(value.canonicalRecordSetCount, 33);
  assert.equal(value.bundledExactRosterCount, 9);
  assert.equal(value.bundledExactObjectSetCount, 1);
  assert.equal(value.sourceProfileCount, 376);
  assert.equal(value.sourceNamespaceCount, 9);
  assert.equal(value.researchExplorerRecordCount, 630);
  assert.equal(value.researchUpgradeCount, 178);
  assert.equal(value.lastResearchUpgradeId, "UPG-196");
  assert.equal(value.availabilityCandidateCount, 3);
  assert.equal(value.queueOnlyCandidateCount, 3);
  assert.equal(value.boundedPairAvailabilityReceiptCount, 1);
  assert.equal(value.availabilityCandidatesQueueOnly, true);
  assert.equal(value.janeliaCellClassUnknown, true);
  for (const field of [
    "availabilitySourceObjectBundleAdmissionCount",
    "availabilitySelectedCellJoinCount",
    "availabilitySameCellInternalChainCount",
    "availabilityAdmittedGeometryObjectCount",
    "availabilityAdmittedInternalObjectCount",
    "availabilityRenderedObjectCount",
    "availabilityCurrentUiSurfaceCount",
  ]) assert.equal(value[field], 0, field);
});

test("rejects contour, roster/object-set, surface, availability, parent and upgrade mutations", async () => {
  const cases = [
    mutated((value) => { value.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity.sourceSomaContourObjectCount = 7; }),
    mutated((value) => { value.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity.vertexCount = 274; }),
    mutated((value) => { value.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity.admittedSurfaceCount = 1; }),
    mutated((value) => { value.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity.bundledExactRosterCount = 10; }),
    mutated((value) => { value.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity.bundledExactObjectSetCount = 0; }),
    mutated((value) => { value.exactReferences.sourceNativeSomaContoursAndAvailabilityIntegrity.availabilityRenderedObjectCount = 1; }),
    mutated((value) => { value.registrySummary.canonicalRecordSetCount = 32; }),
    mutated((value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); }),
    mutated((value) => { value.registrySummary.researchUpgradeCount = 177; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest239(value),
      /content receipt|schema|parent|registry|contour|roster|object-set|surface|availability|must remain|upgrade/i,
    );
  }
});
