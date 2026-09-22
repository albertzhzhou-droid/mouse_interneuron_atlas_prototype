import assert from "node:assert/strict";
import test from "node:test";

import { buildCrozatPkd2l1FunctionalProfile } from "../tools/build_crozat_pkd2l1_functional_profile.mjs";
import { validateCrozatPkd2l1FunctionalProfile, validatePersistedCrozatPkd2l1FunctionalProfile } from "../scripts/validate-crozat-pkd2l1-functional-profile-0.1.mjs";

test("validates one source-local PKD2L1 functional profile with exact segment denominators", async () => {
  const value = await validatePersistedCrozatPkd2l1FunctionalProfile();
  assert.equal(value.profile.activityEvidence.length, 4);
  assert.equal(value.derivedEvidence.firingPatterns.reduce((sum, row) => sum + row.cellCount, 0), 65);
  assert.equal(value.profile.samplingCount, null, "overlapping experiment denominators must not become one profile count");
});

test("rejects promoted geometry, cross-experiment joins and additional firing-pattern types", () => {
  const geometry = structuredClone(buildCrozatPkd2l1FunctionalProfile());
  geometry.scope.admittedGeometryCount = 1;
  assert.throws(() => validateCrozatPkd2l1FunctionalProfile(geometry));

  const joined = structuredClone(buildCrozatPkd2l1FunctionalProfile());
  joined.joinPolicy.crossExperimentJoinAllowed = true;
  assert.throws(() => validateCrozatPkd2l1FunctionalProfile(joined));

  const promoted = structuredClone(buildCrozatPkd2l1FunctionalProfile());
  promoted.scope.displayedProfileCount = 3;
  assert.throws(() => validateCrozatPkd2l1FunctionalProfile(promoted));
});

test("rejects checksum and denominator drift", () => {
  const checksum = structuredClone(buildCrozatPkd2l1FunctionalProfile());
  checksum.source.figshare.keyFiles[0].publisherMd5 = "0".repeat(32);
  assert.throws(() => validateCrozatPkd2l1FunctionalProfile(checksum));

  const denominator = structuredClone(buildCrozatPkd2l1FunctionalProfile());
  denominator.derivedEvidence.firingPatterns[0].cellCount = 22;
  assert.throws(() => validateCrozatPkd2l1FunctionalProfile(denominator));
});
