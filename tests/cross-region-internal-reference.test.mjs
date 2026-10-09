import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateCrossRegionInternalReference } from "../scripts/validate-cross-region-internal-reference.mjs";

const contract = JSON.parse(await readFile(new URL("../data/cross-region-internal-reference-0.1.json", import.meta.url), "utf8"));
const [scene, prototype, panel] = await Promise.all([
  readFile(new URL("../app/SceneCanvas.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/AtlasPrototype.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/InternalStructureReferencePanel.tsx", import.meta.url), "utf8"),
]);

test("cross-region internal reference remains vocabulary-only, unrendered, unregistered and unjoined", () => {
  assert.deepEqual(validateCrossRegionInternalReference(contract), {
    sourceCount: 3,
    componentCount: 5,
    sourceDerivedGeometryCount: 0,
    renderedPrimitiveCount: 0,
    registrationCount: 0,
  });
});

test("cross-region internal reference rejects promoted or measured primitives", () => {
  const promoted = structuredClone(contract);
  promoted.components[0].sourceGeometryUsed = true;
  assert.throws(() => validateCrossRegionInternalReference(promoted), /must not claim source geometry/i);

  const measured = structuredClone(contract);
  measured.components[1].placementMeasured = true;
  assert.throws(() => validateCrossRegionInternalReference(measured), /must not claim measured placement/i);

  const joined = structuredClone(contract);
  joined.relationshipToSelectedMorphology = "same_physical_object";
  assert.throws(() => validateCrossRegionInternalReference(joined), /must remain co_display_only/i);
});

test("scene and information surface wire the reference as an isolated mode", () => {
  assert.match(scene, /createCrossRegionInternalReferenceObject/);
  assert.match(scene, /cross-region-internal-reference-unavailable-zero-primitives/);
  assert.match(scene, /sourceDerivedGeometryCount/);
  assert.match(scene, /samePhysicalObject/);
  assert.match(scene, /view === "internal_reference"/);
  assert.match(scene, /context\.scaffold\.visible = showScaffold && !crossRegionReferenceActive/);
  assert.match(scene, /context\.observedCellRoot\.visible = showObservedCellForm && !crossRegionReferenceActive/);
  assert.match(scene, /zero object-level geometry primitives/i);

  const isolatedFactory = scene.slice(
    scene.indexOf("function createCrossRegionInternalReferenceObject"),
    scene.indexOf("function assertMicronsAssetManifest"),
  );
  assert.doesNotMatch(isolatedFactory, /new THREE\.(?:Icosahedron|Sphere|Capsule|Tube|Box|Torus)Geometry/);
  assert.match(isolatedFactory, /missingEvidencePolicy: "zero_primitives"/);

  assert.match(prototype, /"cell_detail", "microns_observed_reference", "internal_reference"/);
  assert.match(prototype, /InternalStructureReferencePanel/);
  assert.match(prototype, /Same-specimen interior/);
  assert.match(prototype, /Compartment evidence audit/);
  assert.match(prototype, /Current knowledge record:/);
  assert.match(panel, /UPG-251 · ACTIVE-RECORD DETAIL AUDIT/);
  assert.match(panel, /matrix below follows this verified record only/);
  assert.match(panel, /<IndependentSourceObjectCoverage \/>/);
  assert.match(panel, /independent-reference-library/);
  assert.match(panel, /Open zero-geometry evidence audit/);
  assert.match(panel, /co-display only/);
});
