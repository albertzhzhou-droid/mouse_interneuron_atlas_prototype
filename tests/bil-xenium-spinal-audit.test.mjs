import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateBILXeniumSpinalAudit } from "../scripts/validate-bil-xenium-spinal-audit-0.1.mjs";

const AUDIT_URL = new URL("../data/bil-xenium-spinal-audit-0.1.json", import.meta.url);
const OVERVIEW_URL = new URL("../app/ResearchOverview.tsx", import.meta.url);

test("BIL Xenium source audit records useful 2D data availability without admitting geometry", async () => {
  const audit = JSON.parse(await readFile(AUDIT_URL, "utf8"));
  assert.deepEqual(await validateBILXeniumSpinalAudit(), {
    auditId: "bil-xenium-mouse-spinal-availability-audit-0.1.0",
    researchUpgradeId: "UPG-244",
    publicationStatus: "bioRxiv_preprint",
    listedRunSlideFolderCount: 16,
    paperReportedAnimals: 14,
    paperReportedSections: 523,
    paperReportedNeuronCellCount: 616599,
    datasetSpecificRightsVerified: false,
    payloadBytesDownloaded: 0,
    admittedSectionLocalObjects: 0,
    admittedThreeDimensionalCellObjects: 0,
    exactInterneuronRosterRows: 0,
  });
  assert.equal(audit.dataset.sampledFolderFileListing.find((item) => item.fileName === "morphology.ome.tif").bytes, 27512909500);
  assert.equal(audit.dataset.paperAnimalToFolderCrosswalkVerified, false);
  assert.equal(audit.study.gabaergicTypesAreInterneuronDenominator, false);
  assert.equal(audit.rightsAndAcquisition.repositoryReviewNoticeObserved, true);
});

test("research overview exposes source-linked 2D availability, preprint status, rights and geometry limits", async () => {
  const overview = await readFile(OVERVIEW_URL, "utf8");
  assert.match(overview, /bilXeniumAudit\.researchUpgradeId/);
  assert.match(overview, /bilXeniumAudit\.study\.publicationStatus/);
  assert.match(overview, /bilXeniumAudit\.rightsAndAcquisition\.disposition/);
  assert.match(overview, /kept 2D and source-specific/);
  assert.match(overview, /dataset-specific rights remain unverified/);
  assert.match(overview, /bilXeniumAudit\.sources\.map/);
});

test("rights, denominator, sample identity and geometry tampering fail closed", async () => {
  const audit = JSON.parse(await readFile(AUDIT_URL, "utf8"));
  for (const mutate of [
    (value) => { value.rightsAndAcquisition.datasetSpecificRightsMetadataVerified = true; },
    (value) => { value.rightsAndAcquisition.payloadBytesDownloaded = 1; },
    (value) => { value.study.gabaergicTypesAreInterneuronDenominator = true; },
    (value) => { value.dataset.paperAnimalToFolderCrosswalkVerified = true; },
    (value) => { value.modelAdmission.threeDimensionalCellObjects = 1; },
    (value) => { value.modelAdmission.sameCellJoins = 1; },
    (value) => { value.modelAdmission.sectionLocalCellBoundaryObjects = 1; },
  ]) {
    const altered = structuredClone(audit);
    mutate(altered);
    await assert.rejects(validateBILXeniumSpinalAudit(altered));
  }
});
