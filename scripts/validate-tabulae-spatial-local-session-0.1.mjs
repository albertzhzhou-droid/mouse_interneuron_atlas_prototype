import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const SESSION_URL = new URL("../data/tabulae-spatial-local-session-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/tabulae-spatial-local-session-0.1.schema.json", import.meta.url);

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateTabulaeSpatialLocalSession(session) {
  const schema = await readFile(SCHEMA_URL, "utf8").then(JSON.parse);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(session)) errors.push(...formatSchemaErrors(validate.errors));

  check(session.scientificInputPolicy === "public_sources_only", "session must retain public-data-only policy", errors);
  check(session.networkAtReviewRuntime === false, "session must not require network access at review runtime", errors);
  check(session.authority === "SOURCE_LOCAL_2D_SESSION_ONLY", "session must remain source-local 2D only", errors);
  check(session.archive?.sourceChecksum === null, "session must not invent a source checksum", errors);
  check(session.archive?.assetRightsDecision === "unresolved_not_bundled", "session must retain unresolved non-bundled asset rights", errors);
  check(session.archive?.archiveStatus === "publicly_listed_not_downloaded_not_bundled", "archive must remain unacquired and unbundled", errors);
  check(session.localImport?.automaticRemoteAcquisition === false && session.localImport?.upload === false && session.localImport?.persistence === "none", "local session must prohibit remote acquisition, upload and persistence", errors);
  check(session.samples?.length === 24, "session must retain exactly 24 declared GEO spatial samples", errors);
  const sampleIds = new Set();
  const labels = new Set();
  for (const sample of session.samples ?? []) {
    check(!sampleIds.has(sample.id), "duplicate local-session sample ID " + sample.id, errors);
    check(!labels.has(sample.sectionLabel), "duplicate local-session section label " + sample.sectionLabel, errors);
    sampleIds.add(sample.id);
    labels.add(sample.sectionLabel);
  }
  check(["075_A", "077_A", "078_A", "103_A", "105_A", "106_A"].every((label) => labels.has(label)), "session must retain every public section-series family", errors);
  check(/do not fetch from GEO.*individual interneuron.*create REG/i.test(session.releaseDecision?.forbidden ?? ""), "session must forbid automatic download, spot-to-interneuron conversion and REG", errors);
  check(/checksum.*(?:rights|reuse).*data dictionary.*compatible-condition.*curator/i.test(session.releaseDecision?.nextGate ?? ""), "next gate must retain checksum, rights, dictionary, analysis and curator requirements", errors);

  if (errors.length) throw new Error("Tabulae spatial local-session validation failed:\n" + errors.map((item) => "- " + item).join("\n"));
  return { releaseId: session.releaseId, sampleCount: session.samples.length, archiveBytes: session.archive.bytes };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  try {
    const session = JSON.parse(await readFile(SESSION_URL, "utf8"));
    const report = await validateTabulaeSpatialLocalSession(session);
    console.log("Tabulae spatial local-session validation passed: " + report.releaseId);
    console.log(report.sampleCount + " declared source-local samples; archive bytes " + report.archiveBytes);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
