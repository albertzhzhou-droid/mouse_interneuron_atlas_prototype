import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SVARA_CATALOGUES, svaraCatalogueIdentity } from "../app/svara-catalogues.js";
const root = fileURLToPath(new URL("../", import.meta.url));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const packages = [
  ["mmc6", "Motoneuron", 139, 16767329, "fb2ab8c247e7456a484645bc89cd9833", "79c1e965442b52ccb13d25e33e00ce9d2c8f1334a2abdf66e2db47e4e6e6bf12", "Catalog 1, MNs.pdf", 27121817, "0da1d2b4c23e3a98133c6ea30a8215a757be2ee95f7ce94e94f19e4f98ac13c4"],
  ["mmc7", "CiD", 39, 6605080, "48996b37c8d955eba414df64917053ec", "74a0e90fcff40791de6e1d39cc115cc5dab5bd4ef1f70f1c69850df1ba09cb68", "Catalog 2, CiDs.pdf", 9864100, "d0e0bd88bf4ed20624df3e624bb9b731be7f3d627ae1d0d5605d82070c019a5c"],
  ["mmc8", "CoBL", 34, 6607695, "a6e5b39f312ba4657d98a2905731ba23", "bf33ccccec7e1e4c09bdac8670699620070af63ca2e27743de215a040d99c8a7", "Catalog 3, CoBLs.pdf", 9426610, "aac22e063989de77b6e67cace2fa9b5fa4e151602bf18b0d49bb928d24b14f8f"],
];

export async function validateSvaraSupplementCatalogues(document = SVARA_CATALOGUES) {
  assert.deepEqual(document, SVARA_CATALOGUES, "Only the exact current source extraction is supported");
  assert.equal(document.sourceId, "DOI:10.1016/j.celrep.2018.05.023");
  assert.equal(document.releaseId, "MPG:item_3055210:7");
  assert.equal(document.entries.length, 212);
  assert.equal(new Set(document.entries.map(entry => entry.key)).size, 212);
  assert.equal(document.biologicalContext.geneticV2aAssignment, false);
  assert.equal(document.biologicalContext.mouseIdentityTransfer, false);
  assert.equal(document.rights.otherRepositoriesOrKohVersionCovered, false);
  assert.equal(document.rights.license, "CC-BY-4.0");
  for (const key of ["editableSkeletons", "meshes", "rawVolumes", "synapseEndpointTables", "sameCellJoins", "atlasRegistrations"]) assert.equal(document.representation[key], 0);
  assert.equal(document.representation.physicalCoordinatesAvailable, false);
  const receipts = [document.rights.metadataReceipt, document.rights.publisherPolicyReceipt,
    document.rights.publisherPolicyPage, ...document.catalogues.map(row => row.archiveDownloadReceipt)];
  for (const receipt of receipts) {
    assert.ok(receipt.path.startsWith("data/source-candidates/svara-supplements-20261002/") && !receipt.path.includes(".."));
    const bytes = await readFile(path.join(root, receipt.path));
    assert.equal(bytes.length, receipt.bytes); assert.equal(sha(bytes), receipt.sha256);
  }
  const native = JSON.parse(await readFile(path.join(root, document.rights.metadataReceipt.path), "utf8"));
  assert.equal(native.files.find(file => file.objectId === "file_3055224").metadata.license, "http://creativecommons.org/licenses/by/4.0/");
  const policy = JSON.parse(await readFile(path.join(root, document.rights.publisherPolicyReceipt.path), "utf8"));
  const policyPage = await readFile(path.join(root, document.rights.publisherPolicyPage.path), "utf8");
  assert.ok(policyPage.includes(policy.verifiedPhrase)); assert.equal(policy.status, 200);
  let rasterBytes = 0;
  for (const [id, label, count, size, md5, zipSha, member, memberSize, memberSha] of packages) {
    const catalogue = document.catalogues.find(row => row.id === id);
    assert.deepEqual([catalogue.classLabel, catalogue.entryCount, catalogue.archiveBytes, catalogue.archiveMd5,
      catalogue.archiveSha256, catalogue.memberName, catalogue.memberBytes, catalogue.memberSha256],
    [label, count, size, md5, zipSha, member, memberSize, memberSha]);
    const file = native.files.find(file => file.objectId === catalogue.fileComponentId);
    assert.equal(file.metadata.contentCategory, "supplementary-material"); assert.equal(file.visibility, "PUBLIC");
    assert.equal(file.size, size); assert.equal(file.checksum, md5);
    assert.equal(catalogue.sourceArchiveUrl, `https://pure.mpg.de${file.content}`);
    assert.equal(catalogue.embeddedFiles, 0); assert.equal(catalogue.interactive3DAnnotations, 0);
    assert.equal(catalogue.standaloneRawGeometryInArchive, false); assert.equal(catalogue.exactKohAnnotationVersionEstablished, false);
    const entries = document.entries.filter(entry => entry.catalogueId === id);
    assert.equal(entries.length, count);
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index], number = index + 1;
      assert.equal(entry.sourceLabel, `${label} ${String(number).padStart(3, "0")}`);
      assert.equal(entry.sourcePage, number); assert.equal(entry.sourceComponentId, catalogue.fileComponentId);
      assert.equal(entry.sourcePdfMember, member); assert.equal(entry.sourcePdfSha256, memberSha);
      assert.equal(entry.sourceLocator, `${member}#page=${number}`);
      assert.deepEqual(entry.sourcePageText.split("\n").filter(line => /^(Motoneuron|CiD|CoBL) \d{3}/.test(line)), [entry.sourceHeader]);
      assert.equal(entry.reportedFields.length, label === "Motoneuron" ? 5 : 3);
      for (const field of entry.reportedFields) assert.ok(entry.sourcePageText.includes(`${field.label}: ${field.sourceText}`));
      const hierarchy = svaraCatalogueIdentity(entry.key);
      assert.equal(hierarchy.objectLevel, "component"); assert.equal(hierarchy.objectId, entry.sourceLabel);
      assert.ok(["specimen", "section", "cell", "synapse"].every(level => hierarchy.nodes[level].status === "unknown"));
      assert.equal(hierarchy.parents.component.status, "not_established");
      assert.equal(hierarchy.geometryTransferAllowed, false);
      assert.equal(entry.raster.url, `/data/svara_catalogue_pages_v1/${id}-page-${String(number).padStart(3, "0")}.png`);
      const bytes = await readFile(path.join(root, "public", entry.raster.url));
      assert.equal(bytes.length, entry.raster.bytes); assert.equal(sha(bytes), entry.raster.sha256);
      assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      assert.equal(bytes.readUInt32BE(16), entry.raster.widthPixels); assert.equal(bytes.readUInt32BE(20), entry.raster.heightPixels);
      rasterBytes += bytes.length;
    }
  }
  assert.equal((await readdir(path.join(root, "public/data/svara_catalogue_pages_v1"))).length, 212);
  assert.equal(rasterBytes, 16799311); assert.equal(document.summary.rasterBytes, rasterBytes);
  assert.equal(document.summary.maximumPageBytes, 118503);
  assert.equal(document.summary.archiveBytes, 29980104); assert.equal(document.summary.memberPdfBytes, 46412527);
  return { catalogues: 3, publicationEntries: 212, rasterBytes, runtimeMaxPageBytes: 118503,
    nativeArchivesVerifiedAtExtraction: true, editableModels: 0, physicalIdentityJoins: 0, registrations: 0 };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await validateSvaraSupplementCatalogues(), null, 2));
