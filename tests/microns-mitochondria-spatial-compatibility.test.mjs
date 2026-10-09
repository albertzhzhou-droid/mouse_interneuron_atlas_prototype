import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateMicronsMitochondriaSpatialCompatibility } from "../scripts/validate-microns-mitochondria-spatial-compatibility-0.1.mjs";

const CONTRACT_URL = new URL("../data/microns-mitochondria-spatial-compatibility-0.1.json", import.meta.url);
const PANEL_URL = new URL("../app/InternalStructureReferencePanel.tsx", import.meta.url);

test("MICrONS manual mitochondria subvolume is spatially ineligible for this target under the listed nominal mapping", async () => {
  assert.deepEqual(await validateMicronsMitochondriaSpatialCompatibility(), {
    auditId: "microns-mitochondria-spatial-compatibility-0.1.0",
    targetRootId: "648518346349516051",
    sourceInfoSha256: "e458ae905bab05a30957454eead792279a4611eb307c6c2c79e396f3a5549364",
    nominalLayerBoundsNanometre: { min: [78984, 47012, 2600], maxExclusive: [89224, 57252, 6600] },
    axisOverlap: [false, false, true],
    spatialOverlapUnderIdentityMapping: false,
    coordinateMappingVerified: false,
    mitochondriaObjectCount: 0,
  });
});

test("spatial non-overlap is disclosed as an eligibility failure, not biological absence", async () => {
  const contract = JSON.parse(await readFile(CONTRACT_URL, "utf8"));
  assert.match(contract.coordinateCompatibility.interpretation, /not evidence that the biological cell lacks mitochondria/);
  assert.equal(contract.admission.biologicalAbsenceClaim, false);
  assert.equal(contract.mitochondriaLayer.sourceMetadataRetained, false);
  const panel = await readFile(PANEL_URL, "utf8");
  assert.match(panel, /micronsMitochondriaSpatialCompatibility/);
  assert.match(panel, /not evidence of biological absence/);
  assert.equal(contract.coordinateCompatibility.identityMappingXOverlap, false);
  assert.doesNotMatch(panel, /new THREE\.(?:SphereGeometry|IcosahedronGeometry|CylinderGeometry)/);
});

test("changed mesh bounds or a fabricated cross-layer transform fails closed", async () => {
  const contract = JSON.parse(await readFile(CONTRACT_URL, "utf8"));
  const asset = JSON.parse(await readFile(new URL("../public/data/microns_phase1_v185_4_root_648518346349516051_v1/asset-manifest.json", import.meta.url), "utf8"));
  asset.components[0].browserGeometry.boundsNanometre.min[0] += 1;
  await assert.rejects(validateMicronsMitochondriaSpatialCompatibility(contract, asset), /target mesh bounds changed/);
  const altered = JSON.parse(await readFile(CONTRACT_URL, "utf8"));
  altered.coordinateCompatibility.sharedOriginAndAxisMappingVerified = true;
  await assert.rejects(validateMicronsMitochondriaSpatialCompatibility(altered), /shared coordinate mapping must remain unverified/);
});
