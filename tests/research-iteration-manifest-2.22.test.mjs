import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const manifest = JSON.parse(await readFile(new URL("../data/research-iteration-manifest-2.22.json", import.meta.url), "utf8"));

test("preserves the historical 2.22 manifest as an immutable 14-input snapshot", () => {
  assert.equal(manifest.releaseId, "ohri-mouse-interneuron-research-iteration-2.22.0");
  assert.equal(manifest.integrity.inputCount, 14);
  assert.equal(manifest.registrySummary.canonicalSourcePackageCount, 23);
  assert.equal(manifest.registrySummary.researchUpgradeCount, 99);
  assert.equal(manifest.exactReferences.ronzanoPremotorPositions.rawCoordinateRowCount, 14484);
  assert.equal(manifest.exactReferences.ronzanoPremotorPositions.normalizedCoordinateRowCount, 17394);
  assert.equal(manifest.registrations.count, 0);
  assert.equal(manifest.manifestContentSha256, computeManifestContentSha256(manifest));
});

test("pins the Ronzano contract and payload as separate authoritative inputs", () => {
  const byId = new Map(manifest.authoritativeInputs.map((input) => [input.id, input]));
  assert.deepEqual({
    contract: byId.get("ronzanoPremotorPositionContract")?.path,
    payload: byId.get("ronzanoPremotorPositionPayload")?.path,
    sourceRegistry: byId.get("researchSourceRegistry")?.path,
    upgradeRegistry: byId.get("researchModelUpgradeRegistry")?.path,
  }, {
    contract: "data/ronzano-premotor-position-reference-0.1.json",
    payload: "public/data/ronzano_premotor_positions_v1/positions.json",
    sourceRegistry: "data/research-source-registry-0.1.json",
    upgradeRegistry: "data/research-model-upgrade-registry-0.1.json",
  });
  assert.equal(byId.get("ronzanoPremotorPositionPayload")?.sha256, "abf46460d0e37c2ea82b90f2eaf6531d5df8f44e9dcea8448d43d321835184f3");
});

test("manifest forbids coordinate rows from becoming cells, joins, or registrations", () => {
  const reference = manifest.exactReferences.ronzanoPremotorPositions;
  assert.equal(reference.coordinateRowsAcrossIndependentRepresentations, 31878);
  assert.equal(reference.crossFramePointIdentityCount, 0);
  assert.equal(reference.generatedCellGeometryCount, 0);
  assert.equal(reference.atlasJoinCount, 0);
  assert.equal(reference.projectRegistrationCount, 0);
  assert.ok(reference.notAdmitted.includes("soma_geometry"));
  assert.ok(reference.notAdmitted.includes("adult_persistence"));
  assert.match(manifest.scientificBoundaries.ronzanoPremotorPositions, /no biological radius/);
});
