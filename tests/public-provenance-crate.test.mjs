import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildDetachedPublicProvenanceCrate, detachedCrateFilename, validateDetachedPublicProvenanceCrate } from "../app/public-provenance-crate.js";
import { validatePublicProvenanceCrate } from "../scripts/validate-public-provenance-crate-0.1.mjs";

const [contract, publicDataCatalog] = await Promise.all([
  readFile(new URL("../data/public-provenance-crate-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/public-data-catalog-0.4.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("validates the pinned detached RO-Crate 1.3 exporter contract", async () => {
  const report = await validatePublicProvenanceCrate();
  assert.equal(report.sourceCount, 7);
  assert.equal(contract.roCrateVersion, "1.3");
  assert.equal(contract.packagingMode, "detached_metadata_document");
});

test("builds one external-only source-scoped RO-Crate graph", () => {
  const source = publicDataCatalog.sources.find((candidate) => candidate.id === "PDS-CANOGOMEZ-2026");
  const crate = buildDetachedPublicProvenanceCrate({ source, catalog: publicDataCatalog, contract });
  assert.equal(crate["@context"], "https://w3id.org/ro/crate/1.3/context");
  assert.deepEqual(validateDetachedPublicProvenanceCrate(crate, contract), []);
  const root = crate["@graph"].find((entity) => entity["@id"] === "./");
  assert.deepEqual(root.hasPart, [{ "@id": source.provenance.sourceUrl }]);
  assert.equal(detachedCrateFilename(source.id), "ohri-pds-canogomez-2026-ro-crate-metadata.json");
  assert.doesNotMatch(JSON.stringify(crate), /localSha256|registered\s*:\s*true/i);
});

test("rejects a local payload path or registration claim", () => {
  const source = publicDataCatalog.sources[0];
  const crate = buildDetachedPublicProvenanceCrate({ source, catalog: publicDataCatalog, contract });
  crate["@graph"].push({ "@id": "payload/raw-source-file.bin", "@type": "File" });
  assert.match(validateDetachedPublicProvenanceCrate(crate, contract).join(" "), /local payload paths/i);
});
