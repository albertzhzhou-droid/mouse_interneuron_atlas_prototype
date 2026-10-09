import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cataloguePath = "data/svara-supplement-catalogues-0.1.json";
const contactPath = "data/svara-synaptic-contacts-0.1.json";
const targetPath = "data/svara-publication-navigation-0.1.json";
const expectedSource = "DOI:10.1016/j.celrep.2018.05.023";
const expectedRelease = "MPG:item_3055210:7";
const components = { CiD: "mmc7", CoBL: "mmc8" };
const nativeMnSuffixes = new Map([
  ["Motoneuron 001", "(CaP)"], ["Motoneuron 002", "(MiP)"],
  ["Motoneuron 003", "(vRoP)"], ["Motoneuron 004", "(dRoP)"],
]);

/** Exact publication label navigation; no physical, coordinate or functional join. */
export function buildSvaraPublicationLabelIndex(catalogues, contacts) {
  for (const source of [catalogues, contacts]) {
    assert.equal(source.sourceId, expectedSource, "exact article differs");
    assert.equal(source.releaseId, expectedRelease, "exact release differs");
  }
  assert.equal(catalogues.entries.length, 212, "catalogue entry roster differs");
  assert.equal(new Set(catalogues.entries.map(entry => entry.key)).size, 212, "duplicate catalogue entry");
  assert.deepEqual(contacts.groups.map(group => group.id), ["CiD", "CoBL"], "native groups differ");
  const endpoints = [], seen = new Set();
  const add = (entry, role, label, group) => {
    assert.ok(!seen.has(`${group.id}:${role}:${label}`), "duplicate native endpoint");
    seen.add(`${group.id}:${role}:${label}`);
    endpoints.push({ group:group.id, role, contactLabel:label, catalogueKey:entry.key,
      match:label === entry.sourceLabel ? "exact_native_label" : "explicit_native_header_subtype_suffix" });
  };
  for (const group of contacts.groups) {
    assert.equal(group.pre.length, group.summary.presynapticEntries, "presynaptic roster differs");
    assert.equal(group.post.length, 68, "postsynaptic roster differs");
    for (const label of group.pre) {
      const candidates = catalogues.entries.filter(entry => entry.catalogueId === components[group.id] &&
        entry.classLabel === group.id && entry.sourceLabel === label);
      assert.equal(candidates.length, 1, `unavailable or ambiguous native label: ${label}`);
      add(candidates[0], "pre", label, group);
    }
    for (const label of group.post) {
      const candidates = catalogues.entries.filter(entry => {
        if (entry.catalogueId !== "mmc6" || entry.classLabel !== "Motoneuron") return false;
        const suffix = nativeMnSuffixes.get(entry.sourceLabel);
        return suffix ? label === `${entry.sourceLabel} ${suffix}` && entry.sourceHeader.startsWith(`${label} (`)
          : entry.sourceLabel === label;
      });
      assert.equal(candidates.length, 1, `unavailable or ambiguous native label: ${label}`);
      add(candidates[0], "post", label, group);
    }
  }
  assert.equal(endpoints.length, 209);
  assert.equal(new Set(endpoints.map(row => row.catalogueKey)).size, 141);
  return {
    schemaVersion:"0.1.0", sourceId:expectedSource, releaseId:expectedRelease,
    relation:{kind:"same_publication_label_navigation",sourceGeometryVerified:false,
      physicalCellMappingEstablished:false,functionalTransmissionEstablished:false,
      coordinateTransformEstablished:false,byteAuthorityProvided:false},
    entries:catalogues.entries.map(entry => ({key:entry.key,label:entry.sourceLabel,header:entry.sourceHeader,
      componentId:entry.sourceComponentId,locator:entry.sourceLocator})), endpoints,
    summary:{catalogueEntries:212,matchedPublicationEntries:141,unrepresentedMnEntries:71,
      endpointRows:209,exactNativeLabelEndpointRows:201,explicitHeaderSuffixEndpointRows:8},
    interpretation:"Navigation across native labels of one exact publication release. Four MN subtype suffixes are confirmed in native PDF headers. No general name normalization, raw physical cell identity, geometry, transform, functional connection or source-byte authority is established.",
  };
}

export function buildCurrentSvaraPublicationNavigation() {
  const catalogueBytes=fs.readFileSync(path.join(root,cataloguePath));
  const contactBytes=fs.readFileSync(path.join(root,contactPath));
  const document=buildSvaraPublicationLabelIndex(JSON.parse(catalogueBytes),JSON.parse(contactBytes));
  const pin=(file,bytes)=>({path:file,bytes:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")});
  return {...document,sourceInputPins:[pin(cataloguePath,catalogueBytes),pin(contactPath,contactBytes)]};
}

if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const output=JSON.stringify(buildCurrentSvaraPublicationNavigation())+"\n";
  if(process.argv.includes("--check")) assert.equal(fs.readFileSync(path.join(root,targetPath),"utf8"),output,"navigation derivative drift");
  else fs.writeFileSync(path.join(root,targetPath),output);
  console.log(JSON.stringify({status:process.argv.includes("--check")?"exact_replay":"built",bytes:Buffer.byteLength(output),entries:212,matched:141,unrepresentedMn:71}));
}
