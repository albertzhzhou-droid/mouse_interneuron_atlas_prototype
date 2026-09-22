import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const CONTRACT_URL = new URL("../data/observed-cell-form-lens-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/observed-cell-form-lens-0.1.schema.json", import.meta.url);
const SOURCE_URL = new URL("../public/data/neuromorpho_release_8_6_124/morphology-lines.json", import.meta.url);
const EXPECTED_IDS = [104003, 108974, 109005, 242822, 260150];

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function validateObservedCellFormLens(contract, { sourceBytes, sourcePayload } = {}) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(contract)) errors.push(...formatSchemaErrors(validate.errors));

  const bytes = sourceBytes ?? await readFile(SOURCE_URL);
  const source = sourcePayload ?? JSON.parse(bytes.toString("utf8"));
  check(contract.sourceObject.bytes === bytes.byteLength, "source byte count changed", errors);
  check(contract.sourceObject.sha256 === sha256(bytes), "source SHA-256 changed", errors);
  check(contract.sourceObject.path === "/data/neuromorpho_release_8_6_124/morphology-lines.json", "source path changed", errors);
  check(contract.sourceObject.repositoryRelease === source.release, "NeuroMorpho release changed", errors);
  check(/not a representative census/i.test(source.warning ?? ""), "source warning must retain its non-representative boundary", errors);
  check(/not registered to allen_cord_20um/i.test(source.warning ?? ""), "source warning must retain its zero-registration boundary", errors);

  const records = contract.records ?? [];
  check(JSON.stringify(records.map((record) => record.neuronId)) === JSON.stringify(EXPECTED_IDS), "observed cell-form IDs changed", errors);
  check(contract.defaultNeuronId === 109005, "default observed cell-form ID must remain 109005", errors);
  check(new Set(records.map((record) => record.neuronId)).size === EXPECTED_IDS.length, "observed cell-form IDs must be unique", errors);
  check(records.every((record) => record.geometryStatus === "OBS"), "all cell-form records must remain OBS", errors);
  check(records.every((record) => record.registrationStatus === "unregistered"), "all cell-form records must remain unregistered", errors);

  for (const record of records) {
    const sourceRecord = source.morphologies?.find((candidate) => candidate.neuronId === record.neuronId);
    check(Boolean(sourceRecord), `source morphology ${record.neuronId} is missing`, errors);
    if (!sourceRecord) continue;
    check(record.assetId === sourceRecord.assetId, `${record.neuronId} asset ID changed`, errors);
    check(record.phenotype === sourceRecord.phenotype, `${record.neuronId} phenotype changed`, errors);
    check(record.transmitter === sourceRecord.transmitter, `${record.neuronId} transmitter changed`, errors);
    check(record.domain === sourceRecord.domain, `${record.neuronId} domain changed`, errors);
    check(record.physicalIntegrity === sourceRecord.physicalIntegrity, `${record.neuronId} physical integrity changed`, errors);
    check(record.sourcePaperDoi === sourceRecord.sourcePaper?.doi, `${record.neuronId} source DOI changed`, errors);
    check(record.segmentCount === sourceRecord.segments?.length, `${record.neuronId} segment count changed`, errors);
    check(record.sourceFrame === sourceRecord.sourceFrame, `${record.neuronId} source frame changed`, errors);
    check(sourceRecord.geometryStatus === "OBS", `${record.neuronId} source geometry must remain OBS`, errors);
    check(sourceRecord.registrationStatus === "unregistered", `${record.neuronId} source registration must remain unregistered`, errors);
  }

  const populationLane = contract.renderingContract?.populationEvidenceLane ?? {};
  const observedLane = contract.renderingContract?.observedCellFormLane ?? {};
  check(populationLane.geometryStatus === "SYN" && populationLane.cellMorphologyClaim === false, "population evidence lane must remain a non-cell SYN node", errors);
  check(observedLane.geometryStatus === "OBS", "cell-form lane must remain OBS", errors);
  check(observedLane.coordinateRelationshipToAtlas === "none", "cell-form lane must not gain an atlas relationship", errors);
  check(observedLane.coordinateRelationshipToPopulationEvidence === "none", "cell-form lane must not gain an evidence-entity relationship", errors);
  check(observedLane.projectRegistrationCount === 0, "cell-form registration count must remain zero", errors);
  check(observedLane.exactCrossSourceIdentityCount === 0, "cell-form exact cross-source identity count must remain zero", errors);
  check(contract.renderingContract?.selectionDoesNotCreateRelationship === true, "selection must not create a relationship", errors);
  check(contract.renderingContract?.coDisplayDoesNotCreateRelationship === true, "co-display must not create a relationship", errors);
  check((contract.hardBoundaries ?? []).some((boundary) => /not the morphology of the selected SCI evidence entity/i.test(boundary)), "missing selected-entity morphology boundary", errors);
  check((contract.hardBoundaries ?? []).some((boundary) => /not a representative morphology census/i.test(boundary)), "missing non-representative exemplar boundary", errors);

  if (errors.length) throw new Error(`Observed cell-form lens validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: contract.releaseId,
    recordCount: records.length,
    sourceBytes: bytes.byteLength,
    sourceSha256: sha256(bytes),
    projectRegistrationCount: observedLane.projectRegistrationCount,
    exactCrossSourceIdentityCount: observedLane.exactCrossSourceIdentityCount,
  };
}

async function main() {
  const contract = JSON.parse(await readFile(CONTRACT_URL, "utf8"));
  const report = await validateObservedCellFormLens(contract);
  console.log(
    `Observed cell-form lens validation passed: ${report.recordCount} OBS source-local exemplars; `
    + `${report.projectRegistrationCount} REG; ${report.exactCrossSourceIdentityCount} exact cross-source identities.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
