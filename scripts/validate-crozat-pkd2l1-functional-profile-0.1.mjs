#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildCrozatPkd2l1FunctionalProfile, serializeCrozatPkd2l1FunctionalProfile } from "../tools/build_crozat_pkd2l1_functional_profile.mjs";

const DATA_URL = new URL("../data/crozat-pkd2l1-functional-profile-0.1.json", import.meta.url);

export function validateCrozatPkd2l1FunctionalProfile(value) {
  assert.equal(value.schemaVersion, "0.1.0");
  assert.equal(value.releaseId, "ohri-crozat-pkd2l1-functional-profile-0.1.0");
  assert.equal(value.source.figshare.articleId, 29430869);
  assert.equal(value.source.figshare.version, 2);
  assert.equal(value.source.figshare.fileCount, 92);
  assert.equal(value.source.figshare.totalBytes, 1848613);
  assert.equal(value.source.figshare.license.id, "CC-BY-4.0");
  assert.equal(value.source.figshare.sourceFilesBundled, false);
  assert.equal(value.source.figshare.derivedFactualMetadataBundled, true);
  assert.equal(value.scope.displayedProfileCount, 1);
  assert.equal(value.scope.exactCrossSourceIdentityCount, 0);
  assert.equal(value.scope.projectRegistrationCount, 0);
  assert.equal(value.scope.admittedGeometryCount, 0);
  assert.equal(value.profile.recordKind, "marker_defined_functional_profile");
  assert.equal(value.profile.samplingCount, null);
  assert.equal(value.profile.missingEvidence.electrophysiology, "observed_at_cohort_and_experiment_family_level");
  assert.deepEqual(value.derivedEvidence.firingPatterns.map(({ segment, animalCount, cellCount, tonicCount, singleSpikeCount }) => ({ segment, animalCount, cellCount, tonicCount, singleSpikeCount })), [
    { segment: "cervical", animalCount: 10, cellCount: 21, tonicCount: 14, singleSpikeCount: 7 },
    { segment: "thoracic", animalCount: 12, cellCount: 23, tonicCount: 9, singleSpikeCount: 14 },
    { segment: "lumbar", animalCount: 9, cellCount: 21, tonicCount: 15, singleSpikeCount: 6 },
  ]);
  assert.equal(value.derivedEvidence.passivePropertyFrame.animalCount, 191);
  assert.equal(value.derivedEvidence.passivePropertyFrame.articleCellCount, 659);
  assert.equal(value.derivedEvidence.passivePropertyFrame.depositedUsableRowCount, 654);
  assert.equal(value.derivedEvidence.restingMembranePotentialFrame.observationCount, 125);
  assert.equal(value.derivedEvidence.firingPatternFrame.reconciliationStatus, "conflict_quarantined");
  assert.equal(value.derivedEvidence.anatomyContext.distanceArrayCounts.thoracic6Weeks, 478);
  assert.match(value.derivedEvidence.anatomyContext.denominatorConflict, /478 versus.*457/);
  assert.equal(value.quarantinedConflicts.length, 4);
  assert.ok(value.quarantinedConflicts.every((item) => item.status === "quarantined"));
  assert.equal(value.joinPolicy.globallyStableCellIdAvailable, false);
  assert.equal(value.joinPolicy.crossExperimentJoinAllowed, false);
  assert.equal(value.joinPolicy.morphologyElectrophysiologyJoinCount, 0);
  assert.equal(value.joinPolicy.linkToPkd2l1SbfSemStudyCount, 0);
  assert.ok(value.hardBoundaries.every((boundary) => !/representative cell|inferred morphology/i.test(boundary)));
  const fileIds = new Set(value.source.figshare.keyFiles.map((file) => file.id));
  assert.equal(fileIds.size, value.source.figshare.keyFiles.length);
  assert.ok(value.source.figshare.keyFiles.every((file) => /^[a-f0-9]{32}$/.test(file.publisherMd5) && /^[a-f0-9]{64}$/.test(file.locallyVerifiedSha256)));
  assert.deepEqual(value.source.figshare.keyFiles, buildCrozatPkd2l1FunctionalProfile().source.figshare.keyFiles, "Pinned Figshare file identities or receipts drifted");
  const locatorIds = new Set(value.sourceLocators.map((locator) => locator.id));
  assert.ok(value.profile.locatorIds.every((id) => locatorIds.has(id)));
  assert.ok(value.profile.activityEvidence.every((row) => row.sourceLocatorIds.every((id) => locatorIds.has(id))));
  return value;
}

export async function validatePersistedCrozatPkd2l1FunctionalProfile() {
  const bytes = await readFile(DATA_URL);
  const parsed = JSON.parse(bytes.toString("utf8"));
  validateCrozatPkd2l1FunctionalProfile(parsed);
  assert.equal(bytes.toString("utf8"), serializeCrozatPkd2l1FunctionalProfile(buildCrozatPkd2l1FunctionalProfile()), "Persisted Crozat PKD2L1 contract is not the deterministic builder output");
  return parsed;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const value = await validatePersistedCrozatPkd2l1FunctionalProfile();
  process.stdout.write(`Crozat PKD2L1 profile valid: ${value.profile.id}; ${value.source.figshare.keyFiles.length} pinned files; zero geometry and cross-experiment joins\n`);
}
