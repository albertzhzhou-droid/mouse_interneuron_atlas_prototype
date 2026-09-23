import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { collectSuperClemSerialStackSemanticErrors, validateSuperClemSerialStack } from "../scripts/validate-super-clem-serial-stack-0.1.mjs";

const CONTRACT_URL = new URL("../data/super-clem-dorsal-synapse1-serial-stack-0.1.json", import.meta.url);
const API_URL = new URL("../data/source-candidates/superclem-palm-localization-20260922/figshare-17816747-v1.api.json", import.meta.url);
const [contract, api] = await Promise.all([
  readFile(CONTRACT_URL, "utf8").then(JSON.parse),
  readFile(API_URL, "utf8").then(JSON.parse),
]);

test("admits eleven checksum-verified, source-ordered EM images without a registered volume", async () => {
  assert.deepEqual(await validateSuperClemSerialStack(), {
    releaseId: "ohri-super-clem-dorsal-synapse1-serial-stack-0.1.0",
    sourceObjectId: "FigshareSynapse:D2-GB-E9:synapse-1",
    sourceSectionCount: 11,
    sourceBytes: 26463987,
    browserDerivativeCount: 11,
    crossSectionRegistrationCount: 0,
    admittedVolumeCount: 0,
    parentCellResolved: false,
  });
});

test("each deposited TIFF, Figshare receipt, PNG and decoded-pixel hash stay aligned", () => {
  assert.equal(contract.entries.length, 11);
  assert.deepEqual(contract.entries.map((entry) => entry.sourceSectionLabel), ["20140", "20141", "20142", "20143", "20144", "20145", "20146", "20147", "20148", "20149", "20150"]);
  for (const [index, entry] of contract.entries.entries()) {
    const source = api.files.find((file) => file.id === entry.figshareFileId);
    assert.ok(source, `Figshare file ${entry.figshareFileId} exists`);
    assert.equal(source.name, entry.filename);
    assert.equal(source.download_url, entry.sourceUrl);
    assert.equal(source.size, entry.remoteReceipt.bytes);
    assert.equal(source.supplied_md5, entry.remoteReceipt.md5);
    assert.equal(source.computed_md5, entry.remoteReceipt.md5);
    assert.equal(entry.browserDerivative.decodedRgbSha256, contract.conversion.sourceDecodedRgbSha256ByOrdinal[index]);
  }
  assert.equal(contract.conversion.perEntryDecodedRgbSha256Matches, true);
  assert.equal(contract.conversion.cropCount + contract.conversion.resampleCount + contract.conversion.intensityTransformCount, 0);
});

test("rejects identity joins, invented z registration, segmentation and stack reconstruction", () => {
  for (const mutate of [
    (copy) => { copy.sequencePolicy.crossSectionRegistrationAvailable = true; },
    (copy) => { copy.sequencePolicy.stackVolumeAdmitted = true; },
    (copy) => { copy.claimPermissions.segmentation = true; },
    (copy) => { copy.relationshipPolicy.selectedAtlasRecordJoinCount = 1; },
    (copy) => { copy.sourceObject.parentCellResolved = true; },
    (copy) => { copy.entries[0].figshareFileId = copy.entries[1].figshareFileId; },
    (copy) => { copy.conversion.sourceDecodedRgbSha256ByOrdinal[0] = "0".repeat(64); },
  ]) {
    const altered = structuredClone(contract);
    mutate(altered);
    assert.notDeepEqual(collectSuperClemSerialStackSemanticErrors(altered), []);
  }
});

