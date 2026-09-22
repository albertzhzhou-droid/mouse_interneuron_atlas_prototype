import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const release = JSON.parse(await readFile(new URL("../data/research-mvp-release-0.2.json", import.meta.url), "utf8"));
const schema = JSON.parse(await readFile(new URL("../schemas/research-mvp-release.schema.json", import.meta.url), "utf8"));
const entities = Object.fromEntries(release.entities.map((entity) => [entity.id, entity]));
const claims = Object.fromEntries(release.claims.map((claim) => [claim.id, claim]));
const conditions = Object.fromEntries(release.conditions.map((condition) => [condition.id, condition]));
const sources = Object.fromEntries(release.sources.map((source) => [source.id, source]));
const statements = Object.fromEntries(release.evidenceStatements.map((statement) => [statement.id, statement]));

test("freezes the seven stable entities and the 5+2 identity model", () => {
  assert.deepEqual(
    new Set(Object.keys(entities)),
    new Set([
      "mouse.propriospinal.relay",
      "mouse.di3.isl1",
      "mouse.sc.vsx2_hoxa10",
      "mouse.v3.sim1",
      "mouse.v2a.cervical_ipsilateral",
      "mouse.overlay.vgat_kcc2",
      "mouse.overlay.vglut2_vgat_switch",
    ]),
  );
  const overlays = release.entities.filter((entity) => entity.entityKind === "injury_state_overlay");
  assert.equal(release.entities.length, 7);
  assert.equal(overlays.length, 2);
  assert.equal(release.entities.length - overlays.length, 5);
  assert.ok(overlays.every((entity) => entity.classificationAxes.includes("neurotransmitter_state")));
});

test("keeps entity-to-claim-to-condition-to-source relationships referentially complete", () => {
  for (const entity of release.entities) {
    assert.ok(entity.claimIds.length > 0, `${entity.id}: claims`);
    for (const claimId of entity.claimIds) {
      assert.ok(claims[claimId], `${entity.id}: ${claimId}`);
      assert.ok(claims[claimId].entityIds.includes(entity.id), `${claimId}: reverse entity link`);
    }
  }
  for (const claim of release.claims) {
    for (const conditionId of claim.conditionIds) {
      assert.ok(conditions[conditionId], `${claim.id}: ${conditionId}`);
      assert.ok(claim.sourceIds.includes(conditions[conditionId].sourceId), `${claim.id}: condition source`);
    }
    for (const sourceId of claim.sourceIds) assert.ok(sources[sourceId], `${claim.id}: ${sourceId}`);
    for (const statementId of claim.statementIds) assert.ok(statements[statementId], `${claim.id}: ${statementId}`);
  }
});

test("separates the high-risk injury, age, and species conditions", () => {
  assert.equal(conditions["CND-P02-STAGGERED"].injuryType, "staggered_hemisection");

  assert.deepEqual(
    new Set(claims["CLM-P05-KCC2-DEPENDENCE"].conditionIds),
    new Set(["CND-P05-STAGGERED", "CND-P05-COMPLETE-T8"]),
  );
  assert.equal(conditions["CND-P05-COMPLETE-T8"].injuryType, "complete_transection");

  assert.equal(conditions["CND-P08-NEONATAL"].lifeStage, "neonatal");
  assert.equal(conditions["CND-P08-ADULT"].lifeStage, "adult");

  const mouseClaim = claims["CLM-P09-MOUSE-CAUSAL"];
  const humanClaim = claims["CLM-P09-HUMAN-CONTEXT"];
  assert.ok(mouseClaim.conditionIds.every((id) => conditions[id].species === "Mus musculus"));
  assert.ok(humanClaim.conditionIds.every((id) => conditions[id].species === "Homo sapiens"));
  assert.equal(humanClaim.humanCausalEvidence, false);
  assert.equal(conditions["CND-P09-HUMAN-EES"].humanCausalEvidence, false);
});

test("enforces the causal and endpoint red-team traps", () => {
  assert.deepEqual(claims["CLM-P03-DI3-NECESSITY"].causalGrades, ["NEC"]);
  assert.deepEqual(new Set(claims["CLM-P09-MOUSE-CAUSAL"].causalGrades), new Set(["NEC", "SUF"]));
  assert.equal(claims["CLM-P14-V3-SPASM"].endpoint, "spasm");
  assert.equal(claims["CLM-P16-V2A-BREATHING"].endpoint, "breathing");
});

test("retains stable negative, null, counterfinding, limitation, and boundary IDs", () => {
  const required = [
    "P02-N01", "P02-B01", "P02-B02",
    "P03-N01", "P03-B01", "P03-B02",
    "P05-N01", "P05-N02", "P05-N03", "P05-N04", "P05-N05", "P05-N06", "P05-B01", "P05-B02",
    "P08-N01", "P08-N02", "P08-L01", "P08-B01", "P08-B02",
    "P09-N01", "P09-L01", "P09-B01", "P09-B02",
    "P14-C01", "P14-B01", "P14-B02", "P14-B03",
    "P16-N01", "P16-B01", "P16-B02", "P16-B03",
  ];
  assert.deepEqual(new Set(Object.keys(statements)), new Set(required));
  for (const statement of release.evidenceStatements) {
    assert.ok(sources[statement.sourceId], `${statement.id}: source`);
    assert.ok(release.claims.some((claim) => claim.statementIds.includes(statement.id)), `${statement.id}: claim link`);
  }
});

test("uses explicit missing reasons and separates local atlas/SWC assets from registration", () => {
  const allowedReasons = new Set(release.controlledVocabularies.missingReason);
  const missingObjects = [];
  const walk = (value) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    if (Object.hasOwn(value, "value") && value.value === null) missingObjects.push(value);
    Object.values(value).forEach(walk);
  };
  walk(release);
  assert.ok(missingObjects.length > 0);
  assert.ok(missingObjects.every((entry) => allowedReasons.has(entry.missingReason)));
  assert.equal(release.registrations.length, 0);
  assert.ok(release.assets.every((asset) => asset.importStatus === "imported_local" && asset.bundled === true));
  const atlas = release.assets.find((asset) => asset.assetType === "reference_atlas");
  const morphology = release.assets.find((asset) => asset.assetType === "swc_morphology");
  assert.equal(atlas.spatialStatus, "INF");
  assert.equal(morphology.spatialStatus, "OBS");
  assert.ok(release.assets.every((asset) => /private curator-review redistribution/.test(asset.rightsDecision)));
  assert.ok(release.assets.every((asset) => /public deployment or broader redistribution remains pending institutional review/.test(asset.rightsDecision)));
  assert.match(morphology.note, /not atlas-registered/i);
  assert.ok(release.entities.every((entity) => entity.geometry.status === "SYN"));
  assert.ok(release.entities.every((entity) => entity.geometry.pathStatus === "SCH"));
  assert.doesNotMatch(JSON.stringify(release), /"exactXyz"|"status":"REG"/);
});

test("publishes a status-union and missingness JSON Schema consistent with release 0.2", () => {
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.properties.schemaVersion.const, release.schemaVersion);
  assert.deepEqual(
    new Set(schema.properties.controlledVocabularies.properties.spatialStatus.items.enum),
    new Set(["OBS", "REG", "INF", "SCH", "SYN"]),
  );
  assert.deepEqual(
    new Set(schema.$defs.missingReason.enum),
    new Set(["not_reported", "not_measured", "asset_unavailable", "not_applicable", "out_of_scope", "pending_curation"]),
  );
});

test("passes the standalone Research MVP validator", () => {
  const result = spawnSync(process.execPath, [new URL("../scripts/validate-research-mvp.mjs", import.meta.url).pathname], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Research MVP data validation passed/);
  assert.match(result.stdout, /zero registrations/);
});
