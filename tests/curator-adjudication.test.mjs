import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildAdjudicationPacket,
  evaluateAdjudicationReadiness,
  validateAdjudicationPacket,
} from "../app/curator-adjudication.js";

const [feedbackContract, adjudicationContract, curatorAFixture, curatorBFixture, releaseManifest] = await Promise.all([
  readFile(new URL("../data/curator-feedback-contract-1.9.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/curator-adjudication-contract-1.9.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("./fixtures/valid-curator-feedback-1.1-a.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("./fixtures/valid-curator-feedback-1.1-b.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/release-manifest-1.9.json", import.meta.url), "utf8").then(JSON.parse),
]);

function fixtureForCurrentRelease(fixture) {
  return {
    ...fixture,
    feedbackSchemaVersion: feedbackContract.feedbackSchemaVersion,
    distributionVersion: feedbackContract.distributionVersion,
    releaseId: releaseManifest.releaseId,
    releaseManifestContentSha256: releaseManifest.manifestContentSha256,
  };
}

const curatorA = fixtureForCurrentRelease(curatorAFixture);
const curatorB = fixtureForCurrentRelease(curatorBFixture);

test("requires independently identified curators to report one verified ZIP digest", () => {
  const readiness = evaluateAdjudicationReadiness([curatorA, curatorB], adjudicationContract);
  assert.equal(readiness.readyForHumanAdjudication, true);
  assert.equal(readiness.uniqueCuratorCount, 2);
  assert.equal(readiness.digestMatches, true);
  assert.equal(readiness.reportedZipSha256[0], "a".repeat(64));

  const mismatch = structuredClone(curatorB);
  mismatch.responses.zip_sha256 = "b".repeat(64);
  const mismatchReadiness = evaluateAdjudicationReadiness([curatorA, mismatch], adjudicationContract);
  assert.equal(mismatchReadiness.readyForHumanAdjudication, false);
  assert.match(mismatchReadiness.blockers.join("\n"), /different ZIP SHA-256/i);
});

test("exports a locally resolved consensus packet without promoting the release", () => {
  const packet = buildAdjudicationPacket({
    feedback: [curatorA, curatorB],
    feedbackContract,
    adjudicationContract,
    releaseManifest,
    adjudicator: {
      curatorId: "fixture-adjudicator",
      disposition: "recommend_next_private_review",
      resolutionNotes: "Fixtures agree on one digest; this does not authorize public release or data admission.",
    },
  });
  assert.equal(packet.registrationCount, 0);
  assert.equal(packet.disagreementPreserved, false);
  assert.equal(packet.packageZipSha256, "a".repeat(64));
  assert.equal(packet.feedbackRecords.length, 2);
  assert.equal(packet.adjudicator.disposition, "recommend_next_private_review");
  assert.equal(validateAdjudicationPacket(packet, adjudicationContract), true);
  const mismatchedIdentity = structuredClone(packet);
  mismatchedIdentity.releaseId = "ohri-mouse-interneuron-public-data-workbench-1.0.0";
  assert.throws(() => validateAdjudicationPacket(mismatchedIdentity, adjudicationContract), /release ID does not match/i);
});

test("preserves disagreement and blocks a false next-review recommendation", () => {
  const disagreement = structuredClone(curatorB);
  disagreement.responses.overall_verdict = "revise";
  const readiness = evaluateAdjudicationReadiness([curatorA, disagreement], adjudicationContract);
  assert.equal(readiness.readyForHumanAdjudication, true);
  assert.equal(readiness.hasVerdictDisagreement, true);
  assert.throws(
    () => buildAdjudicationPacket({
      feedback: [curatorA, disagreement],
      feedbackContract,
      adjudicationContract,
      releaseManifest,
      adjudicator: { curatorId: "fixture-adjudicator", disposition: "recommend_next_private_review", resolutionNotes: "Ignored dissent." },
    }),
    /mixed curator verdict/i,
  );
  const packet = buildAdjudicationPacket({
    feedback: [curatorA, disagreement],
    feedbackContract,
    adjudicationContract,
    releaseManifest,
    adjudicator: { curatorId: "fixture-adjudicator", disposition: "return_for_revision", resolutionNotes: "One curator requested revision; dissent is retained." },
  });
  assert.equal(packet.disagreementPreserved, true);
  assert.equal(validateAdjudicationPacket(packet, adjudicationContract), true);
});
