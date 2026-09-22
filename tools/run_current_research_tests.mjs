#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST_ROOT = path.join(PROJECT_ROOT, "tests");
// 2.41 never sealed: missing production data at resume. 2.42 validates its recovered contracts.
const HISTORICAL_REBUILD_TESTS = new Set([
  "research-iteration-manifest-2.41.test.mjs",
  "research-iteration-manifest-2.42.test.mjs",
  "research-iteration-manifest-2.28.test.mjs",
  "research-iteration-manifest-2.29.test.mjs",
  "research-iteration-manifest-2.30.test.mjs",
  "research-iteration-manifest-2.31.test.mjs",
  "research-iteration-manifest-2.32.test.mjs",
  "research-iteration-manifest-2.33.test.mjs",
  "research-iteration-manifest-2.34.test.mjs",
  "research-iteration-manifest-2.35.test.mjs",
  "research-iteration-manifest-2.36.test.mjs",
  "research-iteration-manifest-2.37.test.mjs",
  "research-iteration-manifest-2.38.test.mjs",
  "research-iteration-manifest-2.39.test.mjs",
  "research-iteration-manifest-2.40.test.mjs",
]);

const files = (await readdir(TEST_ROOT))
  .filter((name) => name.endsWith(".test.mjs") && !HISTORICAL_REBUILD_TESTS.has(name))
  .toSorted()
  .map((name) => path.join("tests", name));

if (!files.includes("tests/research-iteration-manifest-2.28-snapshot.test.mjs")) {
  throw new Error("Immutable 2.28 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.29-snapshot.test.mjs")) {
  throw new Error("Immutable 2.29 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.30-snapshot.test.mjs")) {
  throw new Error("Immutable 2.30 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.31-snapshot.test.mjs")) {
  throw new Error("Immutable 2.31 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.32-snapshot.test.mjs")) {
  throw new Error("Immutable 2.32 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.33-snapshot.test.mjs")) {
  throw new Error("Immutable 2.33 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.34-snapshot.test.mjs")) {
  throw new Error("Immutable 2.34 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.35-snapshot.test.mjs")) {
  throw new Error("Immutable 2.35 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.36-snapshot.test.mjs")) {
  throw new Error("Immutable 2.36 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.37-snapshot.test.mjs")) {
  throw new Error("Immutable 2.37 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.38-snapshot.test.mjs")) {
  throw new Error("Immutable 2.38 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.39-snapshot.test.mjs")) {
  throw new Error("Immutable 2.39 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.40-snapshot.test.mjs")) {
  throw new Error("Immutable 2.40 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.42-snapshot.test.mjs")) {
  throw new Error("Immutable 2.42 snapshot tests are missing");
}
if (!files.includes("tests/research-iteration-manifest-2.43.test.mjs")) {
  throw new Error("Current 2.43 deterministic manifest tests are missing");
}

process.stdout.write(
  `Running ${files.length} current tests; immutable 2.28, 2.29, 2.30, 2.31, 2.32, 2.33, 2.34, 2.35, 2.36, 2.37, 2.38, 2.39 2.40 and 2.42 are checked by snapshot validators rather than rebuilt from newer live inputs.\n`,
);
const child = spawn(process.execPath, ["--test", ...files], {
  cwd: PROJECT_ROOT,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Current research tests terminated by ${signal}`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});
