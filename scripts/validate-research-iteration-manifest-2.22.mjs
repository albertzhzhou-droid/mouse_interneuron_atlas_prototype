#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { buildResearchIterationManifest222 } from "../tools/build_research_iteration_manifest_2_22.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.22.json");

export async function validateResearchIterationManifest222() {
  const persisted = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const rebuilt = await buildResearchIterationManifest222();
  if (JSON.stringify(persisted) !== JSON.stringify(rebuilt)) {
    throw new Error("Research iteration 2.22 manifest differs from the exact current-input rebuild");
  }
  if (persisted.integrity.inputCount !== 14 || persisted.authoritativeInputs.length !== 14) {
    throw new Error("Research iteration 2.22 authoritative-input count changed");
  }
  if (persisted.registrations.count !== 0) throw new Error("Research iteration 2.22 creates a registration");
  if (persisted.exactReferences.ronzanoPremotorPositions.crossFramePointIdentityCount !== 0) {
    throw new Error("Research iteration 2.22 creates a cross-frame point identity");
  }
  if (persisted.exactReferences.ronzanoPremotorPositions.generatedCellGeometryCount !== 0) {
    throw new Error("Research iteration 2.22 creates cell geometry from coordinate rows");
  }
  return {
    releaseId: persisted.releaseId,
    inputCount: persisted.integrity.inputCount,
    sourcePackageCount: persisted.registrySummary.canonicalSourcePackageCount,
    researchUpgradeCount: persisted.registrySummary.researchUpgradeCount,
    rawCoordinateRows: persisted.exactReferences.ronzanoPremotorPositions.rawCoordinateRowCount,
    normalizedCoordinateRows: persisted.exactReferences.ronzanoPremotorPositions.normalizedCoordinateRowCount,
    registrationCount: persisted.registrations.count,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const summary = await validateResearchIterationManifest222();
  process.stdout.write(`Research iteration 2.22 manifest valid: ${summary.inputCount} exact inputs, ${summary.sourcePackageCount} source packages, ${summary.researchUpgradeCount} upgrades, ${summary.rawCoordinateRows} raw + ${summary.normalizedCoordinateRows} normalized position rows, ${summary.registrationCount} registrations.\n`);
}
