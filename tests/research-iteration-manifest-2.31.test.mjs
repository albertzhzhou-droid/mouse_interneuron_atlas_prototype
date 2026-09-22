import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest231 } from "../scripts/validate-research-iteration-manifest-2.31.mjs";
import {
  buildResearchIterationManifest231,
  serializeResearchIterationManifest231,
} from "../tools/build_research_iteration_manifest_2_31.mjs";

const manifestBytes = await readFile(
  new URL("../data/research-iteration-manifest-2.31.json", import.meta.url),
);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const parent = JSON.parse(
  await readFile(new URL("../data/research-iteration-manifest-2.30.json", import.meta.url), "utf8"),
);
const index = JSON.parse(
  await readFile(new URL("../public/data/research_explorer_index_v1/search-index.json", import.meta.url), "utf8"),
);
const reference = manifest.exactReferences.researchExplorerVisualIntegrity;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("validates the exact 2.31 research-visual-integrity snapshot", async () => {
  assert.deepEqual(await validateResearchIterationManifest231(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.31.0",
    fileBytes: 87120,
    fileSha256: "49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996",
    manifestContentSha256: "c714ba7ac7f306987b0344899c20381eda6a568d57b222773746839c687a0fd4",
    inputCount: 46,
    researchExplorerRecordCount: 413,
    sourceFileCount: 16,
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    viewableMorphologyRecordCount: 149,
    admittedMainSceneExactTargetCount: 13,
    sourceSpecificViewerOnlyCount: 136,
    nonMorphologyClearCount: 264,
    gapCount: 3634,
    fallbackGeometryCount: 0,
    substituteGeometryCount: 0,
    researchUpgradeCount: 144,
  });
  assert.equal(manifestBytes.byteLength, 87120);
  assert.equal(sha256(manifestBytes), "49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996");
  assert.equal(manifest.manifestContentSha256, computeManifestContentSha256(manifest));
});

test("pins immutable 2.30 and all 46 authoritative inputs", () => {
  assert.deepEqual(manifest.parentIterationManifest, {
    path: "data/research-iteration-manifest-2.30.json",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.30.0",
    bytes: 81964,
    fileSha256: "c8796b7732d2f36998976698f1991f5d70e95fae96b33c20301d4b21d80e5858",
    contentSha256: "c80407736016bf95e0b4dc9d937126e8955628cef4c2485384df835639c3538f",
  });
  assert.equal(manifest.authoritativeInputs.length, 46);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 46);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 46);
  assert.deepEqual(manifest.authoritativeInputs.slice(-4).map(({ id, path, bytes, sha256: digest }) => [id, path, bytes, digest]), [
    ["researchExplorerAssetManifest", "public/data/research_explorer_index_v1/asset-manifest.json", 4290, "8753a0d579f0b3b0b47227d5d43bce230d5f1338f730a9204626ef77e33a8b33"],
    ["researchExplorerSearchIndex", "public/data/research_explorer_index_v1/search-index.json", 5293046, "5954c2911a196fc14dc033142f3a028c3cc612f5dbce8514e2b8316f42510c54"],
    ["researchVisualTargetResolver", "app/research-visual-target.js", 4588, "21d20d86a7c687098f8f909c8b4b9b7737267163a9e4e84aacf15b74b48930a3"],
    ["morphologyRecordDisclosureComponent", "app/MorphologyRecordDisclosure.tsx", 4846, "87e0e8f1c041feb1ab77aa681e0428daa2c757ff7872c79ee576700540b5e789"],
  ]);
});

test("preserves every inherited 2.30 exact reference and scientific boundary", () => {
  const references = structuredClone(manifest.exactReferences);
  delete references.researchExplorerVisualIntegrity;
  assert.deepEqual(references, parent.exactReferences);
  const boundaries = structuredClone(manifest.scientificBoundaries);
  delete boundaries.researchExplorerVisualIntegrity;
  assert.deepEqual(boundaries, parent.scientificBoundaries);
});

test("pins Research Explorer 1.8.0, 16 sources and the full 413-record index", () => {
  assert.equal(reference.indexSchemaVersion, "1.8.0");
  assert.equal(reference.assetSetId, "ohri:research-explorer-index:1.8.0");
  assert.deepEqual(reference.byFocusKind, {
    anatomy_label: 73,
    molecular_profile: 161,
    morphology_record: 149,
    sci_entity: 7,
    sci_population: 17,
    source_lane: 6,
  });
  assert.equal(reference.recordCount, 413);
  assert.equal(reference.sourceFileCount, 16);
  assert.equal(reference.searchIndexReceipt.bytes, 5293046);
  assert.equal(reference.searchIndexReceipt.sha256, "5954c2911a196fc14dc033142f3a028c3cc612f5dbce8514e2b8316f42510c54");
});

test("keeps 149 morphology records as 142 census plus seven supplementary", () => {
  assert.deepEqual({
    census: reference.frozenCensusRecordCount,
    supplementary: reference.supplementaryRecordCount,
    viewable: reference.viewableMorphologyRecordCount,
    combined: reference.combinedCensusClaim,
  }, { census: 142, supplementary: 7, viewable: 149, combined: false });
  const morphology = index.records.filter((record) => record.focusKind === "morphology_record");
  assert.equal(morphology.filter((record) => record.morphologyMembership.collection === "census").length, 142);
  assert.equal(morphology.filter((record) => record.morphologyMembership.collection === "supplementary").length, 7);
});

test("pins 13 exact main-scene, 136 viewer-only and 264 cleared focus dispositions", () => {
  assert.deepEqual(reference.admittedMainSceneNeuronIds, [
    45674, 45718, 50394, 50408, 50424, 104003, 108974,
    109005, 109021, 170035, 242822, 249676, 260150,
  ]);
  assert.deepEqual({
    exact: reference.admittedMainSceneExactTargetCount,
    viewerOnly: reference.sourceSpecificViewerOnlyCount,
    cleared: reference.nonMorphologyClearCount,
  }, { exact: 13, viewerOnly: 136, cleared: 264 });
});

test("pins structured, controlled and inference-forbidden missingness", () => {
  assert.equal(reference.gapCount, 3634);
  assert.equal(reference.recordsWithGapCount, 413);
  assert.deepEqual(reference.requiredGapFields, [
    "axisId", "status", "reasonCode", "scope", "authority",
    "sourceLocator", "rawValue", "detail", "inferenceAllowed",
  ]);
  assert.equal(reference.missingnessReasonCodes.length, 11);
  assert.deepEqual(reference.missingnessScopes, [
    "record_specific", "shared_dataset_limit", "shared_project_limit",
  ]);
  assert.equal(reference.gapInferenceAllowedCount, 0);
  assert.equal(reference.invalidMissingnessCount, 0);
});

test("keeps fallback, substitution, internal, identity, transform and registration claims at zero", () => {
  assert.deepEqual({
    fallback: reference.fallbackGeometryCount,
    substitute: reference.substituteGeometryCount,
    internal: reference.sameSpecimenInternalStructureCount,
    primitives: reference.renderedInternalPrimitiveCount,
    identity: reference.crossSourceIdentityCount,
    transform: reference.atlasTransformCount,
    registration: reference.registrationCount,
    projectCopy: reference.projectCopyCount,
    packageCopy: reference.packageCopyCount,
  }, {
    fallback: 0,
    substitute: 0,
    internal: 0,
    primitives: 0,
    identity: 0,
    transform: 0,
    registration: 0,
    projectCopy: 0,
    packageCopy: 0,
  });
  assert.equal(manifest.registrySummary.researchUpgradeCount, 144);
});

test("matches deterministic 2.31 materialization byte-for-byte", async () => {
  const built = await buildResearchIterationManifest231();
  assert.equal(built.bytes.equals(manifestBytes), true);
  assert.equal(serializeResearchIterationManifest231(built.manifest), manifestBytes.toString("utf8"));
});

async function rejectsMutation(mutator, pattern) {
  const changed = structuredClone(manifest);
  mutator(changed);
  changed.manifestContentSha256 = computeManifestContentSha256(changed);
  await assert.rejects(() => validateResearchIterationManifest231(changed), pattern);
}

test("rejects disposition, missingness and unsupported-geometry mutations", async () => {
  await rejectsMutation(
    (value) => { value.exactReferences.researchExplorerVisualIntegrity.sourceSpecificViewerOnlyCount = 135; },
    /content SHA|visual-integrity reference|schema/,
  );
  await rejectsMutation(
    (value) => { value.exactReferences.researchExplorerVisualIntegrity.gapInferenceAllowedCount = 1; },
    /content SHA|gapInferenceAllowedCount|visual-integrity reference|schema/,
  );
  await rejectsMutation(
    (value) => { value.exactReferences.researchExplorerVisualIntegrity.fallbackGeometryCount = 1; },
    /content SHA|fallbackGeometryCount|visual-integrity reference|schema/,
  );
  await rejectsMutation(
    (value) => { value.exactReferences.researchExplorerVisualIntegrity.atlasTransformCount = 1; },
    /content SHA|atlasTransformCount|visual-integrity reference|schema/,
  );
});

test("rejects parent, input and upgrade-registry mutations", async () => {
  await rejectsMutation(
    (value) => { value.parentIterationManifest.fileSha256 = "0".repeat(64); },
    /content SHA|parent receipt|schema/,
  );
  await rejectsMutation(
    (value) => { value.integrity.inputCount = 45; },
    /content SHA|authoritative-input|schema/,
  );
  await rejectsMutation(
    (value) => { value.registrySummary.researchUpgradeCount = 143; },
    /content SHA|registry denominator|schema/,
  );
});
