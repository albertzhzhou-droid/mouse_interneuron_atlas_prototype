import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  findFullProjectCopies,
  PROJECT_COPY_MARKERS,
  validateIncrementalIterationLayout,
} from "../scripts/validate-incremental-iteration-layout.mjs";

test("the live workspace contains no complete copied project tree", async () => {
  const result = await validateIncrementalIterationLayout();
  assert.equal(result.fullProjectCopyCount, 0);
});

test("the layout guard detects a complete nested project without rejecting a partial work folder", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ohri-incremental-layout-"));
  try {
    const partial = path.join(root, "partial-notes");
    await mkdir(partial, { recursive: true });
    await writeFile(path.join(partial, "package.json"), "{}\n");
    assert.deepEqual(await findFullProjectCopies(root), []);

    const copiedProject = path.join(root, "iteration-copy");
    await mkdir(copiedProject, { recursive: true });
    await writeFile(path.join(copiedProject, "package.json"), "{}\n");
    for (const marker of PROJECT_COPY_MARKERS) await mkdir(path.join(copiedProject, marker));
    assert.deepEqual(await findFullProjectCopies(root), ["iteration-copy"]);
    await assert.rejects(validateIncrementalIterationLayout(root), /complete project copy: iteration-copy/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
