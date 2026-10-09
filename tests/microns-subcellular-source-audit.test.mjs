import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateMicronsSubcellularSourceAudit } from "../scripts/validate-microns-subcellular-source-audit-0.1.mjs";

const AUDIT_URL = new URL("../data/microns-subcellular-source-audit-0.1.json", import.meta.url);
const PANEL_URL = new URL("../app/InternalStructureReferencePanel.tsx", import.meta.url);

test("pins MICrONS subcellular source availability while admitting no cell-specific objects", async () => {
  const audit = JSON.parse(await readFile(AUDIT_URL, "utf8"));
  assert.deepEqual(await validateMicronsSubcellularSourceAudit(), {
    auditId: "microns-phase1-subcellular-source-audit-0.1.0",
    targetRootId: "648518346349516051",
    synapseTableRowsDescribed: 3200000,
    fullTableDownloaded: false,
    retainedSourcePayloadBytes: 0,
    synapsePointCount: 0,
    mitochondriaObjectCount: 0,
    exactCellVersionJoinVerified: false,
  });
  assert.equal(audit.synapseTable.publishedMd5, "19073f4b5cbae60d7f92d73f204940ed");
  assert.equal(audit.synapseTable.coordinateFields.nativeUnit, "nanometre");
  assert.equal(audit.synapseTable.coordinateFields.postHocMeasurementCorrectionApplied, false);
  assert.equal(audit.synapseTable.accessAudit.authenticatedExactRootQueryRun, false);
  assert.equal(audit.mitochondriaRoute.exactTargetRootMappingVerified, false);
});

test("the internal-reference panel discloses source routes and access/version gaps without making fake detail", async () => {
  const panel = await readFile(PANEL_URL, "utf8");
  assert.match(panel, /Subcellular data routes/);
  assert.match(panel, /publishedRowDescription/);
  assert.match(panel, /NO PROOFREAD CONTACT OVERLAY/);
  assert.match(panel, /metadataDepositVersion/);
  assert.match(panel, /segmentationRelease/);
  assert.match(panel, /precomputedLayer/);
  assert.match(panel, /nominal-grid mismatch blocks this layer.*not evidence of biological absence/);
  assert.doesNotMatch(panel, /new THREE\.(?:SphereGeometry|IcosahedronGeometry|CylinderGeometry)/);
});

test("a checksum or version mismatch cannot be converted into an exact-cell admission", async () => {
  const audit = JSON.parse(await readFile(AUDIT_URL, "utf8"));
  audit.synapseTable.publishedMd5 = "0".repeat(32);
  await assert.rejects(validateMicronsSubcellularSourceAudit(audit), /MD5 changed/);
  const changed = JSON.parse(await readFile(AUDIT_URL, "utf8"));
  changed.synapseTable.versionJoin.exactRootLineageAcrossTheseProductsVerified = true;
  await assert.rejects(validateMicronsSubcellularSourceAudit(changed), /join must remain unverified/);
});
