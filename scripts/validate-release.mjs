import { readFile } from "node:fs/promises";

const release = JSON.parse(await readFile(new URL("../data/atlas-release-0.1.json", import.meta.url), "utf8"));
const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

check(release.species.scientificName === "Mus musculus", "release species must be Mus musculus");
check(release.species.lifeStage === "adult", "release life stage must be adult");
check(release.scope.fixedSpecies === true, "species must be immutable for release 0.1");
check(release.entities.length === 7, "release must contain exactly five population entities and two overlays");
check(new Set(release.entities.map((entity) => entity.id)).size === release.entities.length, "entity ids must be unique");

for (const entity of release.entities) {
  const prefix = entity.id || "record-without-id";
  check(Array.isArray(entity.classificationAxes) && entity.classificationAxes.length > 0, `${prefix}: missing classification axes`);
  check(Boolean(entity.allowedClaim), `${prefix}: missing allowed claim`);
  check(Boolean(entity.notEstablished), `${prefix}: missing not-established boundary`);
  check(Array.isArray(entity.negativeFindings) && entity.negativeFindings.length > 0, `${prefix}: missing negative findings`);
  check(entity.geometry?.status === "SYN", `${prefix}: geometry must remain SYN in feasibility release`);
  check(entity.geometry?.pathStatus === "SCH", `${prefix}: pathway must remain SCH in feasibility release`);
  check(Array.isArray(entity.geometry?.schematicPosition) && entity.geometry.schematicPosition.length === 3, `${prefix}: missing schematic position`);
  check(!Object.hasOwn(entity.geometry ?? {}, "exactXyz"), `${prefix}: exact xyz is prohibited without observed coordinates`);
  check(Boolean(entity.ledgerId && entity.doi && entity.sourceUrl), `${prefix}: incomplete provenance`);
  check(!/complete connectome|clinical treatment model|proves human/i.test(entity.allowedClaim), `${prefix}: unsupported scope language`);
}

const byLedger = Object.fromEntries(release.entities.map((entity) => [entity.ledgerId, entity]));
check(byLedger.P02?.injuryType === "staggered_hemisection", "P02 complete-lesion trap failed");
check(byLedger.P03?.claimGrades?.includes("NEC") && !byLedger.P03?.claimGrades?.includes("SUF"), "P03 sufficiency trap failed");
check(/sufficient/i.test(byLedger.P03?.notEstablished ?? ""), "P03 boundary must state unestablished sufficiency");
check(/complete T8/i.test(byLedger.P05?.negativeFindings?.join(" ") ?? ""), "P05 must preserve complete T8 failure");
check(/did not increase.*axon growth/i.test(byLedger.P05?.negativeFindings?.join(" ") ?? ""), "P05 must preserve no-growth finding");
check(/coactivation/i.test(byLedger.P05?.negativeFindings?.join(" ") ?? ""), "P05 must preserve residual coactivation");
check(/Neonatal and adult/i.test(byLedger.P08?.negativeFindings?.join(" ") ?? ""), "P08 age-merging trap failed");
check(byLedger.P09?.humanCausalEvidence === false, "P09 human-transfer trap failed");
check(byLedger.P14?.endpoint === "spasm", "P14 beneficial-excitation trap failed");
check(byLedger.P16?.endpoint === "breathing", "P16 endpoint trap failed");

if (errors.length) {
  console.error(`Release validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Release validation passed: ${release.releaseId}`);
console.log(`${release.entities.length} source-linked records; all geometry SYN; all paths SCH.`);
