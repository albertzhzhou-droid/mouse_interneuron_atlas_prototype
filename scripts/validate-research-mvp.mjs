import { readFile } from "node:fs/promises";

const release = JSON.parse(await readFile(new URL("../data/research-mvp-release-0.2.json", import.meta.url), "utf8"));
const schema = JSON.parse(await readFile(new URL("../schemas/research-mvp-release.schema.json", import.meta.url), "utf8"));

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};
const sameSet = (actual, expected) =>
  actual.length === expected.length && expected.every((value) => actual.includes(value));
const unique = (items, label) => {
  const ids = items.map((item) => item.id);
  check(new Set(ids).size === ids.length, `${label}: ids must be unique`);
  return new Map(items.map((item) => [item.id, item]));
};
const includesAll = (actual, expected, label) => {
  for (const value of expected) check(actual.includes(value), `${label}: missing ${value}`);
};

const expectedEntityIds = [
  "mouse.propriospinal.relay",
  "mouse.di3.isl1",
  "mouse.sc.vsx2_hoxa10",
  "mouse.v3.sim1",
  "mouse.v2a.cervical_ipsilateral",
  "mouse.overlay.vgat_kcc2",
  "mouse.overlay.vglut2_vgat_switch",
];
const expectedSpatialStatuses = ["OBS", "REG", "INF", "SCH", "SYN"];
const expectedMissingReasons = [
  "not_reported",
  "not_measured",
  "asset_unavailable",
  "not_applicable",
  "out_of_scope",
  "pending_curation",
];
const expectedDois = {
  "SRC-P02": "10.1038/nm1682",
  "SRC-P03": "10.7554/eLife.21715",
  "SRC-P05": "10.1016/j.cell.2018.06.005",
  "SRC-P08": "10.1038/s41593-022-01067-9",
  "SRC-P09": "10.1038/s41586-022-05385-7",
  "SRC-P14": "10.1152/jn.00776.2018",
  "SRC-P16": "10.1073/pnas.2313594121",
};

check(schema.$schema === "https://json-schema.org/draft/2020-12/schema", "schema must use JSON Schema 2020-12");
check(schema.properties?.schemaVersion?.const === release.schemaVersion, "schema and release versions must match");
check(release.releaseStatus === "localhost_candidate", "release must remain a localhost candidate");
check(release.scope.modelSpecies === "Mus musculus", "model species must be Mus musculus");
check(release.scope.modelLifeStage === "adult", "model geometry life stage must remain adult");
check(release.scope.evidenceContextsMayDifferFromModelGeometry === true, "context/model distinction must be explicit");
check(release.scope.isCellCensus === false, "candidate must not claim a cell census");
check(release.scope.isConnectome === false, "candidate must not claim a connectome");
check(release.scope.isClinicalModel === false, "candidate must not claim a clinical model");

check(sameSet(release.controlledVocabularies.spatialStatus, expectedSpatialStatuses), "spatial status union must be OBS/REG/INF/SCH/SYN");
check(sameSet(release.controlledVocabularies.missingReason, expectedMissingReasons), "missing-reason vocabulary changed");
check(sameSet(release.spatialContract.activeStatuses, ["SYN", "SCH"]), "only SYN and SCH may be active in candidate 0.2");
check(release.spatialContract.measurementAllowed === false, "schematic coordinates must not be measurable");

const entities = unique(release.entities, "entities");
const claims = unique(release.claims, "claims");
const conditions = unique(release.conditions, "conditions");
const sources = unique(release.sources, "sources");
const statements = unique(release.evidenceStatements, "evidenceStatements");
unique(release.assets, "assets");

check(sameSet([...entities.keys()], expectedEntityIds), "the seven stable entity ids must not change");
const overlays = release.entities.filter((entity) => entity.entityKind === "injury_state_overlay");
check(overlays.length === 2, "release must contain exactly two state overlays");
check(release.entities.length - overlays.length === 5, "release must contain exactly five population entities");
check(release.scope.entityCount === 7 && release.scope.populationEntityCount === 5 && release.scope.stateOverlayCount === 2, "scope counts must remain 7 = 5 + 2");
check(overlays.every((entity) => entity.classificationAxes.includes("neurotransmitter_state")), "state overlays must retain the neurotransmitter-state axis");

for (const entity of release.entities) {
  check(entity.classificationAxes.length > 0, `${entity.id}: missing identity axis`);
  check(entity.geometry.status === "SYN", `${entity.id}: entity geometry must remain SYN`);
  check(entity.geometry.pathStatus === "SCH", `${entity.id}: entity path must remain SCH`);
  check(entity.geometry.measurementAllowed === false, `${entity.id}: synthetic geometry cannot be measured`);
  check(entity.geometry.schematicPosition.length === 3 && entity.geometry.schematicPosition.every(Number.isFinite), `${entity.id}: invalid schematic position`);
  for (const claimId of entity.claimIds) {
    check(claims.has(claimId), `${entity.id}: unknown claim ${claimId}`);
    check(claims.get(claimId)?.entityIds.includes(entity.id), `${entity.id}: claim ${claimId} lacks reverse entity link`);
  }
}

for (const claim of release.claims) {
  for (const entityId of claim.entityIds) check(entities.has(entityId), `${claim.id}: unknown entity ${entityId}`);
  for (const sourceId of claim.sourceIds) check(sources.has(sourceId), `${claim.id}: unknown source ${sourceId}`);
  for (const conditionId of claim.conditionIds) {
    check(conditions.has(conditionId), `${claim.id}: unknown condition ${conditionId}`);
    const conditionSource = conditions.get(conditionId)?.sourceId;
    check(claim.sourceIds.includes(conditionSource), `${claim.id}: condition ${conditionId} uses unlinked source ${conditionSource}`);
  }
  for (const statementId of claim.statementIds) check(statements.has(statementId), `${claim.id}: unknown evidence statement ${statementId}`);
  check(claim.causalGrades.every((grade) => release.controlledVocabularies.causalGrade.includes(grade)), `${claim.id}: invalid causal grade`);
  check(!/complete connectome|clinical treatment model|proves human/i.test(claim.statement), `${claim.id}: unsupported scope language`);
}

for (const condition of release.conditions) {
  check(sources.has(condition.sourceId), `${condition.id}: unknown source ${condition.sourceId}`);
  check(release.claims.some((claim) => claim.conditionIds.includes(condition.id)), `${condition.id}: orphan condition`);
  for (const statementId of condition.statementIds) {
    check(statements.has(statementId), `${condition.id}: unknown evidence statement ${statementId}`);
    check(statements.get(statementId)?.sourceId === condition.sourceId, `${condition.id}: statement ${statementId} belongs to a different source`);
  }
}

for (const statement of release.evidenceStatements) {
  check(sources.has(statement.sourceId), `${statement.id}: unknown source ${statement.sourceId}`);
  check(release.claims.some((claim) => claim.statementIds.includes(statement.id)), `${statement.id}: statement is not linked to a claim`);
}

for (const source of release.sources) {
  check(source.id === `SRC-${source.ledgerId}`, `${source.id}: ledger/source id mismatch`);
  check(source.doi === expectedDois[source.id], `${source.id}: DOI differs from authoritative source manifest`);
  check(/^https:\/\//.test(source.sourceUrl), `${source.id}: source URL must be HTTPS`);
}
check(sameSet([...sources.keys()], Object.keys(expectedDois)), "source set must match the seven ledger records");

const rawJson = JSON.stringify(release);
check(!rawJson.includes('"exactXyz"'), "exactXyz is prohibited without observed coordinates");
check(!rawJson.includes('"status":"REG"'), "no entity or asset may claim REG in candidate 0.2");
check(release.registrations.length === 0, "registration records must remain empty until a real transform exists");
for (const asset of release.assets) {
  check(["reference_atlas", "swc_morphology"].includes(asset.assetType), `${asset.id}: unsupported asset type`);
  check(asset.importStatus === "imported_local" && asset.bundled === true, `${asset.id}: localhost asset must be imported and bundled`);
  check(typeof asset.exactVersion === "string" && asset.exactVersion.length > 0, `${asset.id}: imported asset needs an exact version`);
  check(/^[a-f0-9]{64}$/.test(asset.checksum), `${asset.id}: imported asset needs a SHA-256 manifest checksum`);
  check(typeof asset.rightsDecision === "string" && /localhost research use/.test(asset.rightsDecision), `${asset.id}: local rights decision is missing`);
  check(/private curator-review redistribution/.test(asset.rightsDecision), `${asset.id}: private curator-review distribution decision is missing`);
  check(/public deployment or broader redistribution remains pending institutional review/.test(asset.rightsDecision), `${asset.id}: public-release rights boundary is missing`);
  check(typeof asset.nativeCoordinateSpace === "string" && asset.nativeCoordinateSpace.length > 0, `${asset.id}: native coordinate space is missing`);
}
const atlasAsset = release.assets.find((asset) => asset.assetType === "reference_atlas");
const morphologyAsset = release.assets.find((asset) => asset.assetType === "swc_morphology");
check(atlasAsset?.spatialStatus === "INF", "reference atlas derivative must remain INF");
check(morphologyAsset?.spatialStatus === "OBS", "local-frame SWC morphologies must be OBS");
check(/not atlas-registered/i.test(morphologyAsset?.note ?? ""), "SWC note must preserve the unregistered boundary");

const walkMissingness = (value, path = "release", parentKey = "") => {
  if (value === null) {
    check(parentKey === "value", `${path}: raw null is forbidden; use {value:null,missingReason}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkMissingness(item, `${path}[${index}]`, String(index)));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Object.hasOwn(value, "value") && value.value === null) {
    check(Object.keys(value).length === 2 && Object.hasOwn(value, "missingReason"), `${path}: malformed missing-value object`);
    check(expectedMissingReasons.includes(value.missingReason), `${path}: invalid missingReason ${value.missingReason}`);
  }
  for (const [key, child] of Object.entries(value)) walkMissingness(child, `${path}.${key}`, key);
};
walkMissingness(release);

const byClaim = Object.fromEntries(release.claims.map((claim) => [claim.id, claim]));
const byCondition = Object.fromEntries(release.conditions.map((condition) => [condition.id, condition]));

check(byCondition["CND-P02-STAGGERED"]?.injuryType === "staggered_hemisection", "P02 complete-lesion trap failed");
includesAll(byClaim["CLM-P02-RELAY"].statementIds, ["P02-N01", "P02-B01", "P02-B02"], "P02 boundaries");

check(byClaim["CLM-P03-DI3-NECESSITY"]?.causalGrades.includes("NEC"), "P03 must retain NEC");
check(!byClaim["CLM-P03-DI3-NECESSITY"]?.causalGrades.includes("SUF"), "P03 must not claim SUF");
includesAll(byClaim["CLM-P03-DI3-NECESSITY"].statementIds, ["P03-N01", "P03-B01", "P03-B02"], "P03 negatives/boundaries");

includesAll(byClaim["CLM-P05-KCC2-DEPENDENCE"].conditionIds, ["CND-P05-STAGGERED", "CND-P05-COMPLETE-T8"], "P05 model separation");
check(byCondition["CND-P05-STAGGERED"]?.injuryType === "staggered_hemisection", "P05 staggered condition changed");
check(byCondition["CND-P05-COMPLETE-T8"]?.injuryType === "complete_transection", "P05 complete T8 control changed");
includesAll(byClaim["CLM-P05-KCC2-DEPENDENCE"].statementIds, ["P05-N01", "P05-N02", "P05-N03", "P05-N04", "P05-N05", "P05-N06", "P05-B01", "P05-B02"], "P05 negatives/boundaries");

includesAll(byClaim["CLM-P08-TRANSMITTER-SWITCH"].conditionIds, ["CND-P08-NEONATAL", "CND-P08-ADULT"], "P08 age separation");
check(byCondition["CND-P08-NEONATAL"]?.lifeStage === "neonatal", "P08 neonatal condition was relabeled");
check(byCondition["CND-P08-ADULT"]?.lifeStage === "adult", "P08 adult condition was relabeled");
includesAll(byClaim["CLM-P08-TRANSMITTER-SWITCH"].statementIds, ["P08-N01", "P08-N02", "P08-L01", "P08-B01", "P08-B02"], "P08 negatives/boundaries");

const p09Mouse = byClaim["CLM-P09-MOUSE-CAUSAL"];
const p09Human = byClaim["CLM-P09-HUMAN-CONTEXT"];
check(p09Mouse.conditionIds.every((id) => byCondition[id]?.species === "Mus musculus"), "P09 mouse claim contains a non-mouse condition");
check(p09Human.conditionIds.length === 1 && byCondition[p09Human.conditionIds[0]]?.species === "Homo sapiens", "P09 human condition is not separated");
check(p09Human.humanCausalEvidence === false && byCondition["CND-P09-HUMAN-EES"]?.humanCausalEvidence === false, "P09 human-causal trap failed");
check(p09Mouse.causalGrades.includes("NEC") && p09Mouse.causalGrades.includes("SUF"), "P09 mouse causal grades changed");
includesAll(p09Mouse.statementIds, ["P09-N01", "P09-B01"], "P09 mouse negative/boundary");

check(byClaim["CLM-P14-V3-SPASM"]?.endpoint === "spasm", "P14 beneficial-locomotion trap failed");
includesAll(byClaim["CLM-P14-V3-SPASM"].statementIds, ["P14-C01", "P14-B01", "P14-B02", "P14-B03"], "P14 counterfinding/boundaries");

check(byClaim["CLM-P16-V2A-BREATHING"]?.endpoint === "breathing", "P16 locomotion trap failed");
includesAll(byClaim["CLM-P16-V2A-BREATHING"].statementIds, ["P16-N01", "P16-B01", "P16-B02", "P16-B03"], "P16 negative/boundaries");

if (errors.length) {
  console.error(`Research MVP validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Research MVP data validation passed: ${release.releaseId}`);
console.log(`${release.entities.length} entities = ${release.entities.length - overlays.length} populations + ${overlays.length} overlays`);
console.log(`${release.claims.length} claims, ${release.conditions.length} separated conditions, ${release.evidenceStatements.length} stable evidence statements`);
console.log("Spatial gate: all entity geometry SYN, all paths SCH, zero registrations; local atlas INF and SWC OBS assets are separately bundled");
