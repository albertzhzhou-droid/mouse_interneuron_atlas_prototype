import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const CONTRACT_URL = new URL("../data/public-provenance-crate-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/public-provenance-crate-0.1.schema.json", import.meta.url);
const CATALOG_URL = new URL("../data/public-data-catalog-0.4.json", import.meta.url);

export async function validatePublicProvenanceCrate() {
  const [contract, schema, catalog] = await Promise.all([readFile(CONTRACT_URL, "utf8").then(JSON.parse), readFile(SCHEMA_URL, "utf8").then(JSON.parse), readFile(CATALOG_URL, "utf8").then(JSON.parse)]);
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(contract)) errors.push(...formatSchemaErrors(validate.errors));
  if (contract.catalogReleaseId !== catalog.releaseId) errors.push("provenance crate must be locked to the catalog release");
  if (JSON.stringify(contract.publicSourceIds) !== JSON.stringify(catalog.sources.map((source) => source.id))) errors.push("provenance crate must enumerate all catalogued public sources in catalog order");
  if (contract.roCrateVersion !== "1.3" || contract.roCrateContext !== "https://w3id.org/ro/crate/1.3/context" || contract.roCrateSpecification !== "https://w3id.org/ro/crate/1.3") errors.push("provenance crate must pin RO-Crate 1.3");
  if (contract.packagingMode !== "detached_metadata_document" || contract.localRuntime?.networkRequests !== false || contract.localRuntime?.sourceFileDownload !== false || contract.localRuntime?.sourceFileUpload !== false || contract.localRuntime?.persistentStorage !== "none" || contract.localRuntime?.localHashCalculation !== false) errors.push("provenance crate must remain browser-local and detached");
  if (!/does not acquire, embed, bundle.*create REG/i.test(contract.releaseDecision?.scientificBoundary ?? "")) errors.push("provenance crate must forbid acquisition, bundling and REG");
  if (!contract.nextQueueItems?.includes("UPG-014")) errors.push("provenance crate must remain linked to UPG-014");
  if (errors.length) throw new Error("Public provenance crate validation failed:\n" + errors.map((error) => "- " + error).join("\n"));
  return { releaseId: contract.releaseId, sourceCount: contract.publicSourceIds.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]))) {
  const result = await validatePublicProvenanceCrate();
  console.log("Public provenance crate validation passed: " + result.releaseId + " (" + result.sourceCount + " public sources)");
}
