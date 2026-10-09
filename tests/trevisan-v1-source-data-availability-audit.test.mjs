import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateTrevisanV1SourceDataAvailabilityAudit01 } from "../scripts/validate-trevisan-v1-source-data-availability-audit-0.1.mjs";

const [audit, schema, component, css] = await Promise.all([
  readFile(new URL("../data/trevisan-v1-source-data-availability-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../schemas/trevisan-v1-source-data-availability-audit-0.1.schema.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../app/TrevisanV1AgeAtlas.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

test("keeps public V1 source availability separate from unvalidated per-nucleus joins and geometry", async () => {
  const result = await validateTrevisanV1SourceDataAvailabilityAudit01();
  assert.equal(result.geoAccession, "GSE275595");
  assert.equal(result.selectedStudyWideNucleusCount, 89494);
  assert.equal(result.defaultMatrixInputPathSuffix, "/outs/filtered_feature_bc_matrix");
  assert.equal(result.sampleIdentifierParsingValidatedAgainstAllGeoRecords, false);
  assert.equal(result.barcodeToCountMatrixRowCrosswalkValidated, false);
  assert.equal(result.geoFileSpecificReuseTermsVerified, false);
  assert.equal(result.canonicalSourceProfileContribution, 0);
  assert.equal(result.morphologyGeometryObjectCount, 0);
  assert.deepEqual(audit.verifiedUpstreamAvailability.publishedScriptCellMetadataFields, ["age", "replicate", "region", "seurat_clusters"]);
  assert.equal(audit.verifiedUpstreamAvailability.matrixLoadingFunctionDiscoversDirectorySuffix, "*_cellranger");
  assert.equal(audit.verifiedUpstreamAvailability.matrixLoadingFunctionDefaultMinCells, 10);
  assert.equal(audit.verifiedUpstreamAvailability.matrixLoadingFunctionDefaultMinFeatures, 1000);
});

test("strict schema and evidence checks reject rights, mapping, or geometry overclaims", async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(audit), true, JSON.stringify(validate.errors));
  for (const mutate of [
    (value) => { value.notYetVerifiedOrImported.barcodeToCountMatrixRowCrosswalkValidated = true; },
    (value) => { value.notYetVerifiedOrImported.geoFileSpecificReuseTermsVerified = true; },
    (value) => { value.notYetVerifiedOrImported.sampleIdentifierParsingValidatedAgainstAllGeoRecords = true; },
    (value) => { value.verifiedUpstreamAvailability.selectedStudyWideNucleusCount += 1; },
    (value) => { value.admissionBoundary.sameCellJoinCount = 1; },
    (value) => { value.admissionBoundary.internalStructureObjectCount = 1; },
  ]) {
    const altered = structuredClone(audit);
    mutate(altered);
    assert.equal(validate(altered), false);
    await assert.rejects(validateTrevisanV1SourceDataAvailabilityAudit01(altered));
  }
});

test("the V1 panel communicates what is published versus what remains unverified", () => {
  assert.match(component, /Supplementary Data 3/);
  assert.match(component, /barcodeToCountMatrixRowCrosswalkValidated/);
  assert.match(component, /publishedScriptCellMetadataFields/);
  assert.match(component, /geoFileSpecificReuseTermsVerified/);
  assert.match(component, /analysisRepositoryLicenseUrl/);
  assert.match(component, /matrixLoadingFunctionUrl/);
  assert.match(component, /metadataDerivationFunctionUrl/);
  assert.match(component, /sampleIdentifierParsingValidatedAgainstAllGeoRecords/);
  assert.match(component, /No cell form or internal detail admitted/i);
  assert.match(css, /trevisan-v1-source-audit/);
});
