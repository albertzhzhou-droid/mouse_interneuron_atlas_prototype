import { readFile } from "node:fs/promises";

const DEFAULT_CONTRACT_URL = new URL("../data/cross-region-internal-reference-0.1.json", import.meta.url);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateCrossRegionInternalReference(contract) {
  assert(contract.contractId === "cross-region-internal-reference-0.1", "contractId must remain pinned");
  assert(contract.schemaVersion === "0.1.0", "schemaVersion must remain pinned");
  assert(contract.modeId === "internal_reference", "modeId must remain internal_reference");
  assert(contract.authority === "UNAVAILABLE_OBJECT_GEOMETRY", "reference authority must remain unavailable at object-geometry level");
  assert(contract.relationshipToSelectedPopulation === "co_display_only", "population relationship must remain co_display_only");
  assert(contract.relationshipToSelectedMorphology === "co_display_only", "morphology relationship must remain co_display_only");
  assert(contract.samePhysicalObject === false, "reference must never claim the same physical object");
  assert(contract.registrationCount === 0, "reference must retain zero registrations");
  assert(contract.measurementUse === "forbidden", "reference measurement must remain forbidden");
  assert(contract.sourceDerivedGeometryCount === 0, "schematic mode must contain zero source-derived geometry objects");
  assert(contract.renderedPrimitiveCount === 0, "missing object geometry must render zero primitives");
  assert(contract.missingEvidencePolicy === "zero_primitives", "missing object geometry must fail closed to zero primitives");

  assert(Array.isArray(contract.sources) && contract.sources.length >= 3, "at least three public reference sources are required");
  const sourceIds = new Set(contract.sources.map((source) => source.id));
  assert(sourceIds.size === contract.sources.length, "reference source IDs must be unique");
  for (const source of contract.sources) {
    assert(source.species === "Mus musculus", `${source.id} must remain mouse-only`);
    assert(source.sourceUrl.startsWith("https://"), `${source.id} requires an HTTPS source URL`);
    assert(source.rightsUrl.startsWith("https://"), `${source.id} requires an HTTPS rights URL`);
    assert(source.exactObjectAdmittedToThisMode === false, `${source.id} must not be promoted to admitted geometry`);
  }

  assert(Array.isArray(contract.components) && contract.components.length === 5, "exactly five vocabulary-only component classes are expected");
  const componentIds = new Set(contract.components.map((component) => component.id));
  assert(componentIds.size === contract.components.length, "component IDs must be unique");
  for (const component of contract.components) {
    assert(component.displayAuthority === "VOCABULARY_REFERENCE_ONLY", `${component.id} must remain vocabulary-only`);
    assert(component.rendered === false, `${component.id} must remain unrendered`);
    assert(component.sourceGeometryUsed === false, `${component.id} must not claim source geometry`);
    assert(component.placementMeasured === false, `${component.id} must not claim measured placement`);
    assert(component.countMeasured === false, `${component.id} must not claim measured counts`);
    assert(component.supportSourceIds.length > 0, `${component.id} requires at least one source`);
    for (const sourceId of component.supportSourceIds) {
      assert(sourceIds.has(sourceId), `${component.id} references unknown source ${sourceId}`);
    }
  }

  assert(contract.notRendered.some((item) => item.id === "same-specimen-internal-structure"), "same-specimen internal structure must remain explicitly unavailable");
  assert(contract.prohibitedClaims.length >= 5, "reference claim boundaries are incomplete");
  return {
    sourceCount: contract.sources.length,
    componentCount: contract.components.length,
    sourceDerivedGeometryCount: contract.sourceDerivedGeometryCount,
    renderedPrimitiveCount: contract.renderedPrimitiveCount,
    registrationCount: contract.registrationCount,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const contract = JSON.parse(await readFile(DEFAULT_CONTRACT_URL, "utf8"));
  const receipt = validateCrossRegionInternalReference(contract);
    console.log(`Cross-region internal reference valid: ${receipt.sourceCount} sources, ${receipt.componentCount} vocabulary classes, ${receipt.renderedPrimitiveCount} rendered primitives, ${receipt.registrationCount} registrations.`);
}
