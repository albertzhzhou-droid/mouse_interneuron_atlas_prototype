import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildMorphologyTopologyDetailArtifacts,
  computeMorphologyTopologyDetail,
  segmentSphereIntersectionCount,
} from "../tools/build_morphology_topology_detail.mjs";
import {
  collectMorphologyTopologyDetailErrors,
  validateMorphologyTopologyDetail,
} from "../scripts/validate-morphology-topology-detail-0.1.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT_ROOT, "data/morphology-topology-detail-0.1.json");
const RUNTIME_PATH = path.join(PROJECT_ROOT, "public/data/morphology_topology_detail_v1/index.json");

async function releasedDocuments() {
  const [contract, runtimeIndex] = await Promise.all([
    readFile(CONTRACT_PATH, "utf8").then(JSON.parse),
    readFile(RUNTIME_PATH, "utf8").then(JSON.parse),
  ]);
  return { contract, runtimeIndex };
}

test("half-open analytic Sholl intersections preserve shared endpoints, tangents and zero-length policy", () => {
  const centre = [0, 0, 0];
  assert.equal(segmentSphereIntersectionCount([0, 0, 0], [10, 0, 0], centre, 10), 1);
  assert.equal(segmentSphereIntersectionCount([10, 0, 0], [20, 0, 0], centre, 10), 0);
  assert.equal(segmentSphereIntersectionCount([-1, 1, 0], [1, 1, 0], centre, 1), 1);
  assert.equal(segmentSphereIntersectionCount([10, 0, 0], [10, 0, 0], centre, 10), 0);
});

test("toy source topology yields exact domain metrics and landmark node IDs", () => {
  const topology = computeMorphologyTopologyDetail([
    [1, 1, 0, 0, 0, 1, -1],
    [2, 1, 0, 1, 0, 1, 1],
    [3, 3, 10, 0, 0, 0.5, 1],
    [4, 3, 20, 0, 0, 0.5, 3],
    [5, 3, 20, 10, 0, 0.5, 4],
    [6, 2, 30, 0, 0, 0.5, 4],
    [7, 3, 20, 20, 0, 0.5, 4],
  ]);
  assert.equal(topology.nodeCount, 7);
  assert.equal(topology.segmentCount, 6);
  assert.equal(topology.neuriteSegmentCount, 5);
  assert.deepEqual(topology.landmarks.rootNodeIds, [1]);
  assert.deepEqual(topology.landmarks.bifurcationNodeIds, [4]);
  assert.deepEqual(topology.landmarks.terminalNodeIds, [5, 6, 7]);
  assert.match(topology.landmarks.landmarkReceiptSha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(topology.neuriteSummary.shollProfile, [
    { radiusMicrometre: 10, intersectionCount: 1 },
    { radiusMicrometre: 20, intersectionCount: 1 },
    { radiusMicrometre: 30, intersectionCount: 1 },
  ]);

  const soma = topology.sourceTypeDomains.find((domain) => domain.sourceType === 1);
  assert.equal(soma.semanticStatus, "standardized_soma_samples_not_contour");
  assert.equal(soma.nodeCount, 2);
  assert.equal(soma.segmentCount, 1);
  assert.deepEqual(soma.standardizedSomaSampleNodeIds, [1, 2]);
  assert.equal(soma.neuriteMetrics.status, "UNAVAILABLE");
  assert.equal("cableLengthMicrometre" in soma, false);

  const axon = topology.sourceTypeDomains.find((domain) => domain.sourceType === 2);
  assert.equal(axon.nodeCount, 1);
  assert.equal(axon.segmentCount, 1);
  assert.equal(axon.terminalNodeCount, 1);
  assert.equal(axon.bifurcationNodeCount, 0);
  assert.equal(axon.maximumCentrifugalBranchOrder, 1);
  assert.deepEqual(axon.landmarkNodeIds, { bifurcationNodeIds: [], terminalNodeIds: [6] });
  assert.deepEqual(axon.shollProfile, [
    { radiusMicrometre: 10, intersectionCount: 0 },
    { radiusMicrometre: 20, intersectionCount: 0 },
    { radiusMicrometre: 30, intersectionCount: 1 },
  ]);

  const dendrite = topology.sourceTypeDomains.find((domain) => domain.sourceType === 3);
  assert.equal(dendrite.nodeCount, 4);
  assert.equal(dendrite.segmentCount, 4);
  assert.equal(dendrite.terminalNodeCount, 2);
  assert.equal(dendrite.bifurcationNodeCount, 1);
  assert.equal(dendrite.maximumCentrifugalBranchOrder, 1);
  assert.deepEqual(dendrite.landmarkNodeIds, { bifurcationNodeIds: [4], terminalNodeIds: [5, 7] });
  assert.deepEqual(topology.canonicalNeuriteTypeAvailability.map((row) => row.status), ["PRESENT", "PRESENT", "UNAVAILABLE"]);
  assert.equal(topology.canonicalNeuriteTypeAvailability[2].biologicalAbsenceClaim, false);
  assert.equal("segmentCount" in topology.canonicalNeuriteTypeAvailability[2], false);
});

test("released contract is a small browser-fetch receipt for exactly 142 plus 7 records", async () => {
  const { contract, runtimeIndex } = await releasedDocuments();
  assert.equal(contract.runtimeAsset.fetchPath, "/data/morphology_topology_detail_v1/index.json");
  assert.equal(contract.runtimeAsset.path, "public/data/morphology_topology_detail_v1/index.json");
  assert.equal(contract.runtimeAsset.recordCount, 149);
  assert.equal(contract.summary.frozenCensusRecordCount, 142);
  assert.equal(contract.summary.supplementaryRecordCount, 7);
  assert.equal(contract.summary.viewableSourceObjectCount, 149);
  assert.equal(runtimeIndex.records.length, 149);
  assert.deepEqual(
    runtimeIndex.records.filter((record) => record.membership.collection === "supplementary").map((record) => record.neuronId),
    [45674, 45718, 50394, 50408, 50424, 170035, 249676],
  );
  assert.equal(new Set(runtimeIndex.records.map((record) => record.geometryReceipt.path)).size, 149);
  assert.equal(contract.summary.sourceType1RecordCount, 149);
  assert.equal(contract.summary.sourceType2RecordCount, 51);
  assert.equal(contract.summary.sourceType3RecordCount, 147);
  assert.equal(contract.summary.sourceType4RecordCount, 0);
  assert.equal(contract.summary.otherSourceTypeRecordCount, 2);
  assert.equal(contract.scientificBoundary.registrationCount, 0);
  assert.equal(contract.scientificBoundary.membraneClaimCount, 0);
  assert.equal(contract.scientificBoundary.internalStructureClaimCount, 0);
});

test("validator accepts the checksum-verified release and deterministic rebuild", async () => {
  const result = await validateMorphologyTopologyDetail();
  assert.equal(result.summary.totalNodeCount, 566511);
  assert.equal(result.summary.totalSegmentCount, 566362);
  assert.equal(result.summary.totalNeuriteSegmentCount, 565423);
  assert.equal(result.summary.totalTerminalLandmarkCount, 6957);
  assert.equal(result.summary.totalBifurcationLandmarkCount, 6223);
  const first = await buildMorphologyTopologyDetailArtifacts();
  const second = await buildMorphologyTopologyDetailArtifacts();
  assert.deepEqual(first.contractBytes, second.contractBytes);
  assert.deepEqual(first.runtimeBytes, second.runtimeBytes);
});

test("semantic validation fails closed on padded absence, soma contour, landmark, membership and internal claims", async () => {
  const { contract, runtimeIndex } = await releasedDocuments();

  const paddedAbsence = structuredClone(runtimeIndex);
  const absentRow = paddedAbsence.records.find((record) =>
    record.topology.canonicalNeuriteTypeAvailability.some((row) => row.status === "UNAVAILABLE"));
  const absentAvailability = absentRow.topology.canonicalNeuriteTypeAvailability.find((row) => row.status === "UNAVAILABLE");
  absentAvailability.segmentCount = 0;
  assert.ok(collectMorphologyTopologyDetailErrors(contract, paddedAbsence).some((error) => error.includes("padded with morphology zeros")));

  const contour = structuredClone(runtimeIndex);
  contour.records[0].topology.sourceTypeDomains.find((domain) => domain.sourceType === 1).semanticStatus = "soma_contour";
  assert.ok(collectMorphologyTopologyDetailErrors(contract, contour).some((error) => error.includes("promoted to a contour")));

  const landmark = structuredClone(runtimeIndex);
  landmark.records[0].topology.landmarks.landmarkReceiptSha256 = "0".repeat(64);
  assert.ok(collectMorphologyTopologyDetailErrors(contract, landmark).some((error) => error.includes("landmark receipt hash drifted")));

  const membership = structuredClone(runtimeIndex);
  membership.records.find((record) => record.membership.collection === "supplementary").membership.frozenCensusContribution = 1;
  assert.ok(collectMorphologyTopologyDetailErrors(contract, membership).some((error) => error.includes("supplementary membership arithmetic drifted")));

  const internalClaim = structuredClone(contract);
  internalClaim.scientificBoundary.internalStructureClaimCount = 1;
  assert.ok(collectMorphologyTopologyDetailErrors(internalClaim, runtimeIndex).some((error) => error.includes("internalStructureClaimCount must remain zero")));
});

