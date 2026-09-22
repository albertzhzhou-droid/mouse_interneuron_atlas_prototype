import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  validateCanoGomezP56MultiomeInterneuronRegistryPackage,
  validateCanoGomezRegistryImportMirror,
} from "../scripts/validate-cano-gomez-p56-multiome-interneuron-registry-0.1.mjs";

const canonicalPath = fileURLToPath(new URL("../public/data/cano_gomez_p56_multiome_interneuron_v1/cano-gomez-p56-multiome-interneuron-registry-0.1.json", import.meta.url));

test("browser import mirror matches the exact production JSON bytes", async () => {
  const receipt = await validateCanoGomezRegistryImportMirror();
  assert.equal(receipt.bytes, (await readFile(canonicalPath)).length);
  assert.match(receipt.sha256, /^[a-f0-9]{64}$/);
});

test("package verification rejects import-mirror drift even when JSON semantics are unchanged", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cano-import-mirror-test-"));
  try {
    const mirrorPath = join(directory, "registry.json");
    const bytes = await readFile(canonicalPath);
    await writeFile(mirrorPath, bytes);
    await validateCanoGomezRegistryImportMirror(canonicalPath, mirrorPath);
    await writeFile(mirrorPath, Buffer.concat([bytes, Buffer.from("\n")]));
    await assert.rejects(
      () => validateCanoGomezP56MultiomeInterneuronRegistryPackage(canonicalPath, { importMirrorPath: mirrorPath }),
      /import mirror differs from canonical registry bytes/,
    );
    await rm(mirrorPath);
    await assert.rejects(() => validateCanoGomezRegistryImportMirror(canonicalPath, mirrorPath), { code: "ENOENT" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
