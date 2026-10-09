#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PROJECT_COPY_MARKERS = Object.freeze([
  "app",
  "data",
  "docs",
  "public",
  "schemas",
  "scripts",
  "tests",
  "tools",
]);
const GENERATED_OR_DEPENDENCY_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".openai",
  ".playwright-cli",
  ".vinext",
  ".wrangler",
  "coverage",
  "dist",
  "node_modules",
]);

export async function findFullProjectCopies(root) {
  const resolvedRoot = path.resolve(root);
  const copies = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const names = new Set(entries.map((entry) => entry.name));
    if (directory !== resolvedRoot
      && names.has("package.json")
      && PROJECT_COPY_MARKERS.every((marker) => names.has(marker))) {
      copies.push(path.relative(resolvedRoot, directory) || ".");
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || GENERATED_OR_DEPENDENCY_DIRECTORIES.has(entry.name)) continue;
      await walk(path.join(directory, entry.name));
    }
  }

  await walk(resolvedRoot);
  return copies.toSorted();
}

export async function validateIncrementalIterationLayout(root = PROJECT_ROOT) {
  const fullProjectCopies = await findFullProjectCopies(root);
  if (fullProjectCopies.length) {
    throw new Error(`Incremental iteration must not add a complete project copy: ${fullProjectCopies.join(", ")}`);
  }
  return { projectRoot: path.resolve(root), fullProjectCopyCount: 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateIncrementalIterationLayout()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
