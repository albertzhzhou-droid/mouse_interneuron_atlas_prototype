import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const release = JSON.parse(await readFile(new URL("../data/atlas-release-0.1.json", import.meta.url), "utf8"));
const byLedger = Object.fromEntries(release.entities.map((entity) => [entity.ledgerId, entity]));

test("freezes scope to seven adult-mouse evidence entities", () => {
  assert.equal(release.species.scientificName, "Mus musculus");
  assert.equal(release.species.lifeStage, "adult");
  assert.equal(release.scope.fixedSpecies, true);
  assert.equal(release.entities.length, 7);
  assert.equal(new Set(release.entities.map((entity) => entity.id)).size, 7);
});

test("requires a complete evidence contract for every record", () => {
  for (const entity of release.entities) {
    assert.ok(entity.classificationAxes.length > 0, `${entity.id}: classification axis`);
    assert.ok(entity.allowedClaim, `${entity.id}: allowed claim`);
    assert.ok(entity.notEstablished, `${entity.id}: boundary`);
    assert.ok(entity.negativeFindings.length > 0, `${entity.id}: negative findings`);
    assert.equal(entity.geometry.status, "SYN", `${entity.id}: synthetic geometry`);
    assert.equal(entity.geometry.pathStatus, "SCH", `${entity.id}: schematic path`);
    assert.equal(entity.geometry.schematicPosition.length, 3, `${entity.id}: schematic position`);
    assert.ok(entity.doi && entity.sourceUrl && entity.ledgerId, `${entity.id}: provenance`);
    assert.equal("exactXyz" in entity.geometry, false, `${entity.id}: no false exact coordinates`);
  }
});

test("passes the SCI scientific red-team assertions", () => {
  assert.equal(byLedger.P02.injuryType, "staggered_hemisection");
  assert.deepEqual(byLedger.P03.claimGrades, ["NEC"]);
  assert.match(byLedger.P03.notEstablished, /sufficient/i);
  assert.match(byLedger.P05.negativeFindings.join(" "), /complete T8.*did not increase.*coactivation/i);
  assert.match(byLedger.P08.negativeFindings.join(" "), /partial.*Neonatal and adult/i);
  assert.equal(byLedger.P09.humanCausalEvidence, false);
  assert.equal(byLedger.P14.endpoint, "spasm");
  assert.equal(byLedger.P16.endpoint, "breathing");
});

test("does not collapse overlays into mutually exclusive cell families", () => {
  const overlays = release.entities.filter((entity) => entity.entityKind === "injury_state_overlay");
  assert.equal(overlays.length, 2);
  assert.ok(overlays.every((entity) => entity.classificationAxes.includes("neurotransmitter_state")));
  assert.equal(release.entities.filter((entity) => entity.entityKind !== "injury_state_overlay").length, 5);
});
