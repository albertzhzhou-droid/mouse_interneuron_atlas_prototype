import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest238 } from "../scripts/validate-research-iteration-manifest-2.38.mjs";
import {
  RESEARCH_ITERATION_238_PARENT,
  RESEARCH_ITERATION_238_PURPOSE_OVERRIDES,
  buildResearchIterationManifest238,
} from "../tools/build_research_iteration_manifest_2_38.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.38.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const parent = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.37.json", import.meta.url), "utf8"));

const EXPECTED_FILE_BYTES = 173397;
const EXPECTED_FILE_SHA256 = "97ef72ab7e7c2da802af7c4cca6d5a280162e61a08b4a2258bb58f1ee0107595";
const EXPECTED_CONTENT_SHA256 = "8af86d1167213865712c5da915193c13b629d31a1e0452f08d2d4f4f9d9f3b19";

const ADDED_IDS = [
  "delileTaxonomyBuilder",
  "delileTaxonomyContract",
  "delileTaxonomySchema",
  "delileTaxonomyValidator",
  "delileTaxonomyTest",
  "pkd2l1SbfsemVideoContract",
  "pkd2l1SbfsemVideoCaptions",
  "pkd2l1SbfsemVideoValidator",
  "pkd2l1SbfsemVideoTest",
  "researchRecordPresentationRuntime",
  "researchRecordModelReadout",
  "researchRecordPresentationTest",
  "researchTimeline238",
];

function mutated(update) {
  const copy = structuredClone(manifest);
  update(copy);
  copy.manifestContentSha256 = computeManifestContentSha256(copy);
  return copy;
}

test("validates the deterministic 2.38 Delile, record-presentation and PKD2L1 manifest", async () => {
  const report = await validateResearchIterationManifest238();
  assert.deepEqual(report, {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.38.0",
    fileBytes: EXPECTED_FILE_BYTES,
    fileSha256: EXPECTED_FILE_SHA256,
    manifestContentSha256: EXPECTED_CONTENT_SHA256,
    inputCount: 159,
    researchUpgradeCount: 171,
    canonicalSourceCount: 27,
    canonicalRecordSetCount: 32,
    sourceProfileCount: 376,
    sourceNamespaceCount: 9,
    researchExplorerRecordCount: 630,
    researchExplorerSourceFileCount: 20,
    delileFineSubtypeCount: 51,
    delileFineSubtypeCellCount: 15217,
    admittedGeometryCount: 0,
    admittedInternalStructureCount: 0,
    registrationCount: 0,
  });
});

test("rebuilds byte-identically from the immutable 2.37 parent and 159 exact inputs", async () => {
  const built = await buildResearchIterationManifest238();
  assert.deepEqual(built.bytes, manifestBytes);
  assert.deepEqual(manifest.parentIterationManifest, RESEARCH_ITERATION_238_PARENT);
  assert.equal(manifest.authoritativeInputs.length, 159);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 159);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 159);
  assert.deepEqual(
    manifest.authoritativeInputs.slice(0, 146).map(({ id, scope, path }) => ({ id, scope, path })),
    parent.authoritativeInputs.map(({ id, scope, path }) => ({ id, scope, path })),
  );
  for (const [id, purpose] of Object.entries(RESEARCH_ITERATION_238_PURPOSE_OVERRIDES)) {
    assert.equal(manifest.authoritativeInputs.find((input) => input.id === id)?.purpose, purpose);
  }
  for (const parentInput of parent.authoritativeInputs.filter((input) => !(input.id in RESEARCH_ITERATION_238_PURPOSE_OVERRIDES))) {
    assert.equal(manifest.authoritativeInputs.find((input) => input.id === parentInput.id)?.purpose, parentInput.purpose);
  }
  assert.deepEqual(manifest.authoritativeInputs.slice(146).map((input) => input.id), ADDED_IDS);
});

test("locks the exact Delile roster and nested denominators without inventing adult identities", () => {
  const value = manifest.exactReferences.delilePresentationAndPkd2l1Integrity;
  assert.equal(value.delileReleaseId, "ohri-delile-developmental-interneuron-taxonomy-0.1.0");
  assert.equal(value.delileDoi, "10.1242/dev.173807");
  assert.equal(value.delileAccession, "E-MTAB-7320");
  assert.equal(value.delileFineSubtypeCount, 51);
  assert.equal(value.delileFineSubtypeCellCount, 15217);
  assert.equal(value.delileTotalMetadataCellCount, 41025);
  assert.equal(value.delileSourceDefinedNeuronCellCount, 18144);
  assert.equal(value.delileTypedNonmotorNeuronCellCount, 15394);
  assert.equal(value.delileCardinalOnlyCellCount, 177);
  assert.equal(value.delileMotorNeuronExcludedCellCount, 1056);
  assert.equal(value.delileNullNeuronExcludedCellCount, 1694);
  assert.equal(value.delileLifeStageCount, 5);
  assert.equal(value.delileStageReplicateLabelCount, 12);
  assert.equal(value.sourceDlSpellingPreserved, true);
  assert.equal(value.stageReplicateLabelsNotPromotedToAnimals, true);
  assert.equal(value.delileSourceObjectLinkOnlyNoassertion, true);
});

test("locks Explorer, presentation and qualitative-video readiness boundaries", () => {
  const value = manifest.exactReferences.delilePresentationAndPkd2l1Integrity;
  assert.equal(value.canonicalSourceCount, 27);
  assert.equal(value.canonicalRecordSetCount, 32);
  assert.equal(value.sourceProfileCount, 376);
  assert.equal(value.sourceNamespaceCount, 9);
  assert.equal(value.researchExplorerRecordCount, 630);
  assert.equal(value.researchExplorerMolecularProfileCount, 376);
  assert.equal(value.researchExplorerSourceFileCount, 20);
  assert.equal(value.researchUpgradeCount, 171);
  assert.equal(value.lastResearchUpgradeId, "UPG-189");
  assert.equal(value.pkd2l1VideoContractId, "ohri-pkd2l1-sbfsem-video-reference-0.1.0");
  assert.equal(value.pkd2l1ArticleApiVersion, 2);
  assert.equal(value.pkd2l1VideoWidth, 872);
  assert.equal(value.pkd2l1VideoHeight, 1080);
  assert.equal(value.pkd2l1Mp4Bytes, 46541650);
  for (const field of [
    "admittedGeometryCount",
    "admittedInternalStructureCount",
    "generatedFallbackPrimitiveCount",
    "registrationCount",
    "sameCellCrossModalJoinCount",
    "projectCopyCount",
    "packageCopyCount",
    "completeContentFolderCopyCount",
  ]) assert.equal(value[field], 0, field);
  for (const field of [
    "recordDrivenModelPresentation",
    "recordSpecificEvidencePartitioned",
    "exactSharedSourceContextCollapsed",
    "sharedMissingnessCollapsed",
    "fiveAxisModelingReadinessDisplayed",
    "molecularSwitchClearsPriorGeometry",
    "evidenceReadoutIsNotCellShape",
    "pkd2l1VideoQualitativeOnly",
    "pkd2l1AvailabilityFindingScopedToArticleAndApi",
    "noGenericGeometrySubstitution",
  ]) assert.equal(value[field], true, field);
});

test("rejects count, geometry, video, parent and registry mutations", async () => {
  const cases = [
    mutated((value) => { value.exactReferences.delilePresentationAndPkd2l1Integrity.researchExplorerRecordCount = 629; }),
    mutated((value) => { value.exactReferences.delilePresentationAndPkd2l1Integrity.delileFineSubtypeCount = 50; }),
    mutated((value) => { value.exactReferences.delilePresentationAndPkd2l1Integrity.admittedGeometryCount = 1; }),
    mutated((value) => { value.exactReferences.delilePresentationAndPkd2l1Integrity.pkd2l1VideoWidth = 873; }),
    mutated((value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); }),
    mutated((value) => { value.registrySummary.researchUpgradeCount = 170; }),
  ];
  for (const value of cases) {
    await assert.rejects(
      () => validateResearchIterationManifest238(value),
      /content receipt|schema|parent|registry|Explorer|Delile|PKD2L1|must remain/i,
    );
  }
});
