import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.23.json", import.meta.url), "utf8"));

test("preserves the historical 2.23 manifest as an immutable 15-input snapshot", () => {
  assert.equal(manifest.releaseId, "ohri-mouse-interneuron-research-iteration-2.23.0");
  assert.equal(manifest.integrity.inputCount, 15);
  assert.equal(manifest.registrySummary.canonicalSourcePackageCount, 24);
  assert.equal(manifest.registrySummary.researchUpgradeCount, 107);
  assert.equal(manifest.exactReferences.alkaslasiCholinergicTaxonomy.displayedProfileCount, 8);
  assert.equal(manifest.exactReferences.alkaslasiCholinergicTaxonomy.interneuronNucleusCount, 5375);
  assert.equal(manifest.registrations.count, 0);
  assert.equal(manifest.manifestContentSha256, computeManifestContentSha256(manifest));
});

test("pins the Alkaslasi contract while keeping the remote roster and all 3D claims closed", () => {
  const byId = new Map(manifest.authoritativeInputs.map((input) => [input.id, input]));
  assert.equal(byId.get("alkaslasiCholinergicTaxonomyContract")?.path, "data/alkaslasi-cholinergic-source-taxonomy-0.1.json");
  const reference = manifest.exactReferences.alkaslasiCholinergicTaxonomy;
  assert.equal(reference.sourceObjectBytes, 333655);
  assert.equal(reference.sourceObjectSha256, "6e69c106544a394dd23b6e7b4fc2d159a715aaa8a70adbd61721338e8d29c091");
  assert.equal(reference.sourceObjectBundled, false);
  assert.equal(reference.exactNucleusRosterBundled, false);
  assert.equal(reference.biologicalPrevalenceClaim, false);
  assert.equal(reference.generatedCellGeometryCount, 0);
  assert.equal(reference.crossSourceIdentityCount, 0);
  assert.equal(reference.projectRegistrationCount, 0);
  assert.ok(reference.notAdmitted.includes("membrane_or_internal_organelles"));
  assert.match(manifest.scientificBoundaries.alkaslasiCholinergicTaxonomy, /Sample-region values are not xyz coordinates/);
});
