import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { createHash } from "node:crypto";
import navigation from "../data/svara-publication-navigation-0.1.json" with { type:"json" };
import { SVARA_CATALOGUES, svaraCataloguePageLink, readSvaraCatalogueLocation,
  svaraVerifiedPageBytes } from "../app/svara-catalogues.js";
import { SVARA_CONTACTS, readSvaraContactLocation, svaraVerifiedContactBytes } from "../app/svara-synaptic-contacts.js";
import { svaraPublicationContactChoices, svaraContactCatalogueChoices } from "../app/svara-publication-navigation.js";
import { buildSvaraPublicationLabelIndex, buildCurrentSvaraPublicationNavigation } from "../tools/build_svara_publication_navigation.mjs";

test("the compact publication concordance exactly replays both current source documents and every native header", () => {
  assert.equal(fs.readFileSync(new URL("../data/svara-publication-navigation-0.1.json",import.meta.url),"utf8"),
    JSON.stringify(buildCurrentSvaraPublicationNavigation())+"\n");
  for(const pin of navigation.sourceInputPins) {
    const bytes=fs.readFileSync(new URL(`../${pin.path}`,import.meta.url));
    assert.equal(bytes.length,pin.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),pin.sha256);
  }
  assert.equal(new Set(navigation.endpoints.map(row=>row.catalogueKey)).size,141);
  assert.equal(navigation.endpoints.length,209);
  for(const row of navigation.endpoints) {
    const page=SVARA_CATALOGUES.entries.find(entry=>entry.key===row.catalogueKey);
    assert.ok(page.sourcePageText.includes(row.contactLabel),row.contactLabel);
    if(row.match==="exact_native_label") assert.equal(page.sourceLabel,row.contactLabel);
    else assert.ok(page.sourceHeader.startsWith(row.contactLabel+" ("));
  }
  assert.equal(navigation.endpoints.filter(row=>row.match!=="exact_native_label").length,8);
});

test("all 212 catalogue entries keep their exact represented endpoint and explicitly name the other starting endpoint", () => {
  let available=0,missing=0;
  for(const page of SVARA_CATALOGUES.entries) {
    const links=svaraPublicationContactChoices(page.key);
    if(!links.choices.length) { missing++;assert.equal(page.classLabel,"Motoneuron");assert.ok(page.sourcePage>=69);
      assert.match(links.unavailableReason,/not a column/);continue; }
    available++;assert.equal(links.unavailableReason,null);
    for(const choice of links.choices) {
      assert.deepEqual(readSvaraContactLocation(choice.href),{selection:choice.selection,refusal:null});
      assert.equal(choice.label,`${choice.selection.pre} → ${choice.selection.post}`);
      if(choice.retainedEndpoint==="pre") assert.equal(choice.selection.pre,page.sourceLabel);
      else assert.ok(page.sourceHeader.startsWith(choice.selection.post));
      const back=svaraContactCatalogueChoices(choice.selection).choices.find(row=>row.role===choice.retainedEndpoint);
      assert.equal(back.key,page.key);
    }
  }
  assert.equal(available,141);assert.equal(missing,71);
});

test("all 4,964 native matrix positions reach both exact publication pages under the current source and release", () => {
  let pairs=0;
  for(const group of SVARA_CONTACTS.groups) for(const pre of group.pre) for(const post of group.post) {
    pairs++;const links=svaraContactCatalogueChoices({group:group.id,pre,post});
    assert.equal(links.choices.length,2);
    for(const choice of links.choices) {
      assert.equal(choice.href,svaraCataloguePageLink(choice.key));
      assert.deepEqual(readSvaraCatalogueLocation(choice.href),{key:choice.key,refusal:null});
      const page=SVARA_CATALOGUES.entries.find(entry=>entry.key===choice.key);
      assert.equal(choice.label,page.sourceHeader);
      assert.ok(page.sourcePageText.includes(choice.role==="pre"?pre:post));
    }
  }
  assert.equal(pairs,4964);
});

test("unrepresented MN entries, unknown versions, ambiguous labels and fuzzy aliases never select replacement objects", () => {
  for(let number=69;number<=139;number++) {
    const result=svaraPublicationContactChoices(`mmc6:Motoneuron ${String(number).padStart(3,"0")}`);
    assert.deepEqual(result.choices,[]);assert.match(result.unavailableReason,/No contact pair was substituted/);
  }
  for(const key of ["mmc7:CiD 1","mmc7:CiD 040","mmc6:Motoneuron 001 (CaP)"," mmc8:CoBL 001"])
    assert.throws(()=>svaraPublicationContactChoices(key),/unavailable/);
  assert.throws(()=>svaraContactCatalogueChoices({group:"CiD",pre:"CiD 001",post:"Motoneuron 069"}),/unavailable/);
  const cases=[
    (pages,tables)=>{pages.sourceId="unavailable";tables.sourceId="unavailable";},
    (pages,tables)=>{pages.releaseId="MPG:item_3055210:8";tables.releaseId=pages.releaseId;},
    pages=>{pages.entries[0].key=pages.entries[1].key;},
    pages=>{pages.entries[0].sourceHeader="Motoneuron 001 (MiP) (Large MN)";},
    (_pages,tables)=>{tables.groups[0].pre[0]="CiD 1";},
    (_pages,tables)=>{tables.groups[0].pre[0]=tables.groups[0].pre[1];},
    (_pages,tables)=>{tables.groups[0].post[0]="Motoneuron 001 (other)";},
  ];
  for(const mutate of cases) {
    const pages=structuredClone(SVARA_CATALOGUES),tables=structuredClone(SVARA_CONTACTS);mutate(pages,tables);
    assert.throws(()=>buildSvaraPublicationLabelIndex(pages,tables));
  }
});

test("publication navigation remains immutable metadata and cannot authorize either source workspace", () => {
  const pages=svaraPublicationContactChoices("mmc8:CoBL 034");
  const pair=pages.choices[0].selection;
  const contacts=svaraContactCatalogueChoices(pair);
  for(const result of [pages,contacts]) {
    for(const key of ["sourceGeometryVerified","physicalCellMappingEstablished","functionalTransmissionEstablished",
      "coordinateTransformEstablished","byteAuthorityProvided"]) assert.equal(result.relation[key],false);
    assert.equal(result.relation.kind,"same_publication_label_navigation");
    assert.throws(()=>{result.relation.physicalCellMappingEstablished=true;},TypeError);
    assert.throws(()=>svaraVerifiedPageBytes(result,contacts.choices[0].key),/authority/);
    assert.throws(()=>svaraVerifiedContactBytes(result,pair.group),/authority/);
  }
  assert.throws(()=>{pages.choices[0].selection.pre="CiD 001";},TypeError);
  const navigationCode=fs.readFileSync(new URL("../app/svara-publication-navigation.js",import.meta.url),"utf8");
  assert.ok(!navigationCode.includes('from "./svara-catalogues.js"'));
  assert.ok(!navigationCode.includes("fetch("));
});
