import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateSvaraLarvalZebrafishSpinalSbemReference } from "../scripts/validate-svara-larval-zebrafish-spinal-sbem-reference-0.1.mjs";

const contract = JSON.parse(await readFile(new URL("../data/svara-larval-zebrafish-spinal-sbem-reference-0.1.json", import.meta.url), "utf8"));
const schema = JSON.parse(await readFile(new URL("../schemas/svara-larval-zebrafish-spinal-sbem-reference-0.1.schema.json", import.meta.url), "utf8"));

test("Svara source contract exposes one larval zebrafish EM sample and exact published denominators", async () => {
  const result = await validateSvaraLarvalZebrafishSpinalSbemReference();
  assert.equal(result.specimenCount, 1);
  assert.equal(result.reportedCiDCount, 39);
  assert.equal(result.reportedCoBLCount, 34);
  assert.equal(result.listedSupplementPackageCount, 3);
  assert.equal(result.inspectedSupplementPackageCount, 0);
  assert.equal(result.packageLinks.length, 3);
  assert.ok(result.packageLinks.every((url) => url.startsWith("https://pure.mpg.de/")));
  assert.equal(result.admittedGeometryCount, 0);
  assert.equal(result.downloadedPayloadBytes, 0);
});

test("Svara source contract conforms to the strict metadata-only schema", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(contract), true, JSON.stringify(validate.errors));
});

test("Svara contract fails closed for inferred geometry, species transfer, or unknown package metadata", async () => {
  for (const mutate of [
    (value) => { value.identityAndGeometryBoundary.appAdmittedSkeletons = 1; },
    (value) => { value.identityAndGeometryBoundary.mouseIdentityTransferAllowed = true; },
    (value) => { value.supplementPackages.fileSizesBytes = [123]; },
    (value) => { value.supplementPackages.packages[0].filename = "invented.swc"; },
    (value) => { value.supplementPackages.packages[0].sourceUrl = "https://example.org/unverified.zip"; },
    (value) => { value.publishedReconstructions.morphologyConsistentCiDs.geneticV2aAssignmentAvailable = true; },
  ]) {
    const altered = structuredClone(contract);
    mutate(altered);
    await assert.rejects(validateSvaraLarvalZebrafishSpinalSbemReference(altered));
  }
});
