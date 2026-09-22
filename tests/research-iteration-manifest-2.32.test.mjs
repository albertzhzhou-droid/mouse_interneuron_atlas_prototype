import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { validateResearchIterationManifest232 } from "../scripts/validate-research-iteration-manifest-2.32.mjs";
import { buildResearchIterationManifest232 } from "../tools/build_research_iteration_manifest_2_32.mjs";

const manifestBytes = await readFile(new URL("../data/research-iteration-manifest-2.32.json", import.meta.url));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const parent = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.31.json", import.meta.url), "utf8"));
const topology = JSON.parse(await readFile(new URL("../public/data/morphology_topology_detail_v1/index.json", import.meta.url), "utf8"));
const reference = manifest.exactReferences.uiKnowledgeAndTopologyIntegrity;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function mutated(mutator) {
  const value = structuredClone(manifest);
  mutator(value);
  value.manifestContentSha256 = computeManifestContentSha256(value);
  return value;
}

test("validates the exact deterministic 2.32 UI/knowledge/topology snapshot", async () => {
  assert.deepEqual(await validateResearchIterationManifest232(), {
    releaseId: "ohri-mouse-interneuron-research-iteration-2.32.0",
    fileBytes: 98357,
    fileSha256: "eaacd5bb0acae3c704e24ac2c1ffa4ef508bc5491155898bec6f28a825ea5e77",
    manifestContentSha256: "4b0ed4508655553736b656f7a72a6d2e869218e0a4eff886811c7f0f15e113a2",
    inputCount: 63,
    researchUpgradeCount: 148,
    indexedMolecularProfileCount: 161,
    frozenCensusRecordCount: 142,
    supplementaryRecordCount: 7,
    morphologyTopologyRecordCount: 149,
    totalNodeCount: 566511,
    totalTerminalLandmarkCount: 6957,
    totalBifurcationLandmarkCount: 6223,
    nonSciActiveEntityCount: 0,
    admittedMolecularGeometryPrimitiveCount: 0,
  });
  const built = await buildResearchIterationManifest232();
  assert.ok(manifestBytes.equals(built.bytes));
  assert.equal(manifestBytes.byteLength, 98357);
  assert.equal(sha256(manifestBytes), "eaacd5bb0acae3c704e24ac2c1ffa4ef508bc5491155898bec6f28a825ea5e77");
});

test("pins immutable 2.31 and 63 unique authoritative inputs", () => {
  assert.deepEqual(manifest.parentIterationManifest, {
    path: "data/research-iteration-manifest-2.31.json",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.31.0",
    bytes: 87120,
    fileSha256: "49ef49fdaaf8e72976d01e7a6d3053d40735215c39bf890100ab464d7ac67996",
    contentSha256: "c714ba7ac7f306987b0344899c20381eda6a568d57b222773746839c687a0fd4",
  });
  assert.equal(manifest.authoritativeInputs.length, 63);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.id)).size, 63);
  assert.equal(new Set(manifest.authoritativeInputs.map((input) => input.path)).size, 63);
  assert.deepEqual(manifest.authoritativeInputs.slice(0, 46).map((input) => input.id), parent.authoritativeInputs.map((input) => input.id));
});

test("locks distinct I1 and I2 evidence fingerprints without surrogate geometry", () => {
  const { i1, i2 } = reference.molecularEvidenceFingerprint.exactDemonstrationRecords;
  assert.deepEqual([i1.sampledNucleusCount, i2.sampledNucleusCount], [1520, 780]);
  assert.notDeepEqual(i1.markers, i2.markers);
  assert.notDeepEqual(i1.sourceRegionMembership, i2.sourceRegionMembership);
  assert.equal(reference.molecularEvidenceFingerprint.indexedMolecularProfileCount, 161);
  assert.equal(reference.molecularEvidenceFingerprint.admittedCellGeometryPrimitiveCount, 0);
  assert.equal(reference.molecularEvidenceFingerprint.sharedLimitBlockCountPerFingerprint, 1);
  assert.equal(reference.molecularEvidenceFingerprint.rawMachineTokenPrimaryLabelCount, 0);
  assert.deepEqual(reference.molecularEvidenceFingerprint.lifeStageAuthority, {
    sathyamurthy: "adult",
    alkaslasi: "adult; source mice aged 8 weeks",
    unknownRecordPolicy: "not_retained_in_exact_record",
  });
});

test("locks 149 exact topology records as 142 frozen plus seven supplementary", () => {
  const detail = reference.morphologyTopologyDetail;
  assert.deepEqual({
    frozen: detail.frozenCensusRecordCount,
    supplementary: detail.supplementaryRecordCount,
    viewable: detail.viewableSourceObjectCount,
    combined: detail.combinedCensusClaim,
  }, { frozen: 142, supplementary: 7, viewable: 149, combined: false });
  assert.equal(topology.records.filter((record) => record.membership.collection === "frozen_census").length, 142);
  assert.equal(topology.records.filter((record) => record.membership.collection === "supplementary").length, 7);
  assert.equal(new Set(topology.records.map((record) => record.neuronId)).size, 149);
});

test("pins exact source-type and landmark topology denominators", () => {
  const detail = reference.morphologyTopologyDetail;
  assert.deepEqual({
    nodes: detail.totalNodeCount,
    segments: detail.totalSegmentCount,
    neuriteSegments: detail.totalNeuriteSegmentCount,
    terminals: detail.totalTerminalLandmarkCount,
    bifurcations: detail.totalBifurcationLandmarkCount,
  }, { nodes: 566511, segments: 566362, neuriteSegments: 565423, terminals: 6957, bifurcations: 6223 });
  assert.deepEqual({
    type1: detail.sourceType1RecordCount,
    type2: detail.sourceType2RecordCount,
    type3: detail.sourceType3RecordCount,
    type4: detail.sourceType4RecordCount,
    other: detail.otherSourceTypeRecordCount,
  }, { type1: 149, type2: 51, type3: 147, type4: 0, other: 2 });
});

test("keeps stale focus, biological-zero, internal and registration claims at zero", () => {
  assert.deepEqual({
    activeNonSciEntity: reference.focusSynchronization.nonSciActiveEntityCount,
    molecularGeometry: reference.focusSynchronization.molecularMainSceneGeometryCount,
    fallback: reference.focusSynchronization.fallbackGeometryCount,
    substitute: reference.focusSynchronization.substituteGeometryCount,
    keyboardTabStops: reference.focusSynchronization.keyboardRovingTabStopCountWhenNonSci,
    nullRoundTrip: reference.focusSynchronization.nullSelectionRoundTripPreserved,
    sciFocusCanonical: reference.focusSynchronization.sciFocusCanonicalizesPersistedSelection,
    absenceMeansZero: reference.morphologyTopologyDetail.sourceTypeAbsenceMeansBiologicalZero,
    somaContour: reference.morphologyTopologyDetail.somaContourClaimCount,
    internal: reference.morphologyTopologyDetail.internalStructureModelCount,
    synapse: reference.morphologyTopologyDetail.synapseClaimCount,
    registration: reference.morphologyTopologyDetail.registrationCount,
  }, {
    activeNonSciEntity: 0,
    molecularGeometry: 0,
    fallback: 0,
    substitute: 0,
    keyboardTabStops: 1,
    nullRoundTrip: true,
    sciFocusCanonical: true,
    absenceMeansZero: false,
    somaContour: 0,
    internal: 0,
    synapse: 0,
    registration: 0,
  });
});

test("rejects focus, fingerprint, topology and census-boundary mutations", async () => {
  for (const [label, value] of [
    ["focus", mutated((copy) => { copy.exactReferences.uiKnowledgeAndTopologyIntegrity.focusSynchronization.nonSciActiveEntityCount = 1; })],
    ["fingerprint", mutated((copy) => { copy.exactReferences.uiKnowledgeAndTopologyIntegrity.molecularEvidenceFingerprint.exactDemonstrationRecords.i2.sampledNucleusCount = 1520; })],
    ["topology", mutated((copy) => { copy.exactReferences.uiKnowledgeAndTopologyIntegrity.morphologyTopologyDetail.totalTerminalLandmarkCount = 6956; })],
    ["census", mutated((copy) => { copy.exactReferences.uiKnowledgeAndTopologyIntegrity.morphologyTopologyDetail.combinedCensusClaim = true; })],
  ]) {
    await assert.rejects(() => validateResearchIterationManifest232(value), new RegExp(`schema|content|${label}|exact reference|topology|focus`, "i"));
  }
});

test("rejects internal, identity, registration, copy and upgrade mutations", async () => {
  for (const field of ["internalStructureModelCount", "crossSourceIdentityCount", "registrationCount"]) {
    await assert.rejects(() => validateResearchIterationManifest232(mutated((copy) => {
      copy.exactReferences.uiKnowledgeAndTopologyIntegrity.morphologyTopologyDetail[field] = 1;
    })), /schema|content|exact reference|must remain zero/i);
  }
  await assert.rejects(() => validateResearchIterationManifest232(mutated((copy) => {
    copy.exactReferences.uiKnowledgeAndTopologyIntegrity.packageCopyCount = 1;
  })), /schema|content|project or package copy/i);
  await assert.rejects(() => validateResearchIterationManifest232(mutated((copy) => {
    copy.registrySummary.researchUpgradeCount = 147;
  })), /schema|content|registry/i);
});
