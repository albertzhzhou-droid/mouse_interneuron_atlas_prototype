import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateBancV888InternalObjectSourceAudit } from "../scripts/validate-banc-v888-internal-object-source-audit-0.1.mjs";

test("UPG-249 source-route audit satisfies its strict schema", async () => {
  const [audit, schema] = await Promise.all([
    readFile(new URL("../data/banc-v888-internal-object-source-audit-0.1.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../schemas/banc-v888-internal-object-source-audit-0.1.schema.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(audit), true, JSON.stringify(validate.errors));
  const altered = structuredClone(audit);
  altered.sources.synapses.v3CoordinateFrame.voxelResolutionNanometres = [4, 4, 45];
  assert.equal(validate(altered), false);
});

test("separates documented public routes from verified and admitted candidate objects", async () => {
  const result = await validateBancV888InternalObjectSourceAudit();
  assert.equal(result.candidateRootId, "720575941350424112");
  assert.equal(result.candidateNucleusId, "73044750394982464");
  assert.equal(result.nucleusRouteDocumented, true);
  assert.equal(result.nucleusMeshAdmitted, false);
  assert.equal(result.mitochondriaArchiveBytes, 1107598431);
  assert.equal(result.mitochondriaRowsRetrieved, false);
  assert.deepEqual(result.synapseVersions, ["v2", "v3"]);
  assert.equal(result.synapseObjectsAdmitted, 0);
  assert.equal(result.privateCredentialsInspected, false);
  assert.equal(result.admittedGeometryCount, 0);
});
