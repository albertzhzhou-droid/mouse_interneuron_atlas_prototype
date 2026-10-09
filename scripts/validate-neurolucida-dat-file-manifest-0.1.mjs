import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildDatManifest } from "../tools/build_neurolucida_dat_file_manifest.mjs";
import { buildNativeDatManifestTransport } from "../tools/build_native_dat_manifest_transport.mjs";
const actual = JSON.parse(await readFile(new URL("../data/neurolucida-dat-file-manifest-0.1.json", import.meta.url), "utf8"));
assert.deepEqual(await buildDatManifest(), actual, "Complete independent DAT manifest replay changed");
assert.equal(actual.records.length, 7);
await buildNativeDatManifestTransport();
console.log("Seven original DAT files: complete independent inventories and all admitted ordered source coordinates verified.");
