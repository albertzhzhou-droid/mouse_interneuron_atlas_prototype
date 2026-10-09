import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFrozenResearchRuntime } from "../scripts/read-frozen-research-runtime.mjs";

const sha256 = "fad707fdf8e41033a4c1a50b9875cc43e008d34cfb5f2a3b097c308b4c7b0bfb";
const input = { id: "micronsImportProvenanceRuntime", path: "app/microns-import-provenance.js", bytes: 3857, sha256 };
const archivePath = `data/iteration-runtime-snapshots/${sha256}/microns-import-provenance.js`;
test("historical runtime replays exact archived bytes after a live type annotation", async () => {
  const actual = await readFrozenResearchRuntime(input, path.resolve(input.path), process.cwd());
  assert.deepEqual(actual, await readFile(archivePath));
});
test("archive drift rejects and unrelated receipts never use the archive", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ohri-frozen-runtime-"));
  try {
    const live = path.join(root, "live.js");
    await writeFile(live, "current annotated code");
    await mkdir(path.dirname(path.join(root, archivePath)), { recursive: true });
    await writeFile(path.join(root, archivePath), "corrupt archive");
    await assert.rejects(readFrozenResearchRuntime(input, live, root), /receipt drifted/);
    for (const other of [{ ...input, id: "scientificPayload" }, { ...input, path: "data/observed.json" }, { ...input, sha256: "0".repeat(64) }]) {
      assert.equal((await readFrozenResearchRuntime(other, live, root)).toString(), "current annotated code");
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});


test("2.34 parser, parser test and source validator replay exact archived implementation bytes independently of the current Universe code", async () => {
  const snapshot = JSON.parse(await readFile("data/research-iteration-manifest-2.34.json", "utf8"));
  for (const id of ["neuromorphoSwcRuntime", "neuromorphoSwcRuntimeTest", "neuromorphoUniverseValidator"]) {
    const receipt = snapshot.authoritativeInputs.find(row => row.id === id);
    const actual = await readFrozenResearchRuntime(receipt, path.resolve(receipt.path), process.cwd());
    const archived = await readFile(path.join("data/iteration-runtime-snapshots", receipt.sha256, path.basename(receipt.path)));
    assert.deepEqual(actual, archived);
    assert.notDeepEqual(actual, await readFile(receipt.path));
    const altered = { ...receipt, id: "scientificPayload" };
    assert.deepEqual(await readFrozenResearchRuntime(altered, path.resolve(receipt.path), process.cwd()), await readFile(receipt.path));
  }
});
