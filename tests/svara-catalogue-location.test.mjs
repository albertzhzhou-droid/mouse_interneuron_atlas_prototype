import assert from "node:assert/strict";
import test from "node:test";
import { SVARA_CATALOGUES, SVARA_DEFAULT_ENTRY, readSvaraCatalogueLocation,
  writeSvaraCatalogueLocation, svaraCataloguePageLink, svaraVerifiedPageBytes } from "../app/svara-catalogues.js";

test("all 212 catalogue page links restore their exact source-qualified publication entry", () => {
  for (const entry of SVARA_CATALOGUES.entries) {
    const link = svaraCataloguePageLink(entry.key);
    assert.equal(new URL(link, "http://localhost:3003").pathname, "/catalogues/svara");
    assert.deepEqual(readSvaraCatalogueLocation(link), { key: entry.key, refusal: null });
    const params = new URL(link, "http://localhost:3003").searchParams;
    assert.equal(params.get("svaraSource"), SVARA_CATALOGUES.sourceId);
    assert.equal(params.get("svaraRelease"), SVARA_CATALOGUES.releaseId);
  }
});

test("only an address with no Svara selection uses the explicitly documented default", () => {
  for (const url of ["/catalogues/svara", "/catalogues/svara?other=kept#svara-catalogue-gallery"]) {
    assert.deepEqual(readSvaraCatalogueLocation(url), { key: SVARA_DEFAULT_ENTRY, refusal: null });
  }
  for (const params of ["svaraEntry=", "svaraSource=", "svaraRelease=", "svaraEntry=mmc7%3ACiD+001"]) {
    const result = readSvaraCatalogueLocation(`/catalogues/svara?${params}`);
    assert.equal(result.key, null); assert.match(result.refusal, /requires one exact/);
  }
});

test("missing, duplicate, unknown and wrong-version link fields refuse rather than selecting a fallback", () => {
  const original = new URL(svaraCataloguePageLink("mmc7:CiD 002"), "http://localhost:3003");
  for (const name of ["svaraSource", "svaraRelease", "svaraEntry"]) {
    for (const alter of [
      url => url.searchParams.delete(name),
      url => url.searchParams.append(name, original.searchParams.get(name)),
      url => url.searchParams.append(name, ""),
      url => url.searchParams.set(name, ""),
      url => url.searchParams.set(name, "unavailable"),
    ]) {
      const url = new URL(original); alter(url);
      const result = readSvaraCatalogueLocation(url.href);
      assert.equal(result.key, null); assert.match(result.refusal, /^Link refused:/);
    }
  }
  for (const key of ["mmc7:CiD 040", "mmc6:CiD 001", "mmc7:CiD 1", " mmc7:CiD 001", "mmc7:CiD 001 "]) {
    const url = new URL(original); url.searchParams.set("svaraEntry", key);
    assert.equal(readSvaraCatalogueLocation(url.href).key, null);
  }
  const url = new URL(original); url.searchParams.set("svaraRelease", "MPG:item_3055210:8");
  assert.match(readSvaraCatalogueLocation(url.href).refusal, /release is unavailable/);
});

test("changing page selection preserves unrelated query values and fragment, replacing all owned values", () => {
  const href = "/catalogues/svara?other=one&other=two&svaraEntry=old&svaraEntry=duplicate#svara-catalogue-gallery";
  const changed = writeSvaraCatalogueLocation(href, "mmc8:CoBL 034");
  const url = new URL(changed, "http://localhost:3003");
  assert.deepEqual(url.searchParams.getAll("other"), ["one", "two"]);
  assert.equal(url.hash, "#svara-catalogue-gallery");
  assert.equal(url.searchParams.getAll("svaraEntry").length, 1);
  assert.deepEqual(readSvaraCatalogueLocation(changed), { key: "mmc8:CoBL 034", refusal: null });
  assert.equal(writeSvaraCatalogueLocation(changed, "mmc8:CoBL 034"), changed);
});

test("workspace ownership and exact entry validation prevent incidental routes or external navigation", () => {
  for (const path of ["/", "/source-audits", "/catalogues/svara/", "/catalogues/svara/other"]) {
    assert.equal(readSvaraCatalogueLocation(path).key, null);
    assert.throws(() => writeSvaraCatalogueLocation(path, SVARA_DEFAULT_ENTRY), /dedicated workspace/);
  }
  assert.throws(() => writeSvaraCatalogueLocation("/catalogues/svara", "mmc8:CoBL 035"), /unavailable/);
  const result = writeSvaraCatalogueLocation("https://outside.invalid/catalogues/svara?next=https://outside.invalid", SVARA_DEFAULT_ENTRY);
  assert.ok(result.startsWith("/catalogues/svara?"));
});

test("link metadata cannot authorize current image display, download or byte receipt", () => {
  const selection = readSvaraCatalogueLocation(svaraCataloguePageLink("mmc7:CiD 002"));
  assert.throws(() => svaraVerifiedPageBytes(selection, selection.key), /authority/);
  assert.deepEqual(Object.keys(selection).sort(), ["key", "refusal"]);
});
