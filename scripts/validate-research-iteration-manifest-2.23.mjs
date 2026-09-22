#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.23.json");

export async function validateResearchIterationManifest223() {
  const persisted = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  if (persisted.manifestContentSha256 !== computeManifestContentSha256(persisted)) throw new Error("Research iteration 2.23 immutable manifest content hash is invalid");
  if (persisted.integrity.inputCount !== 15 || persisted.authoritativeInputs.length !== 15) {
    throw new Error("Research iteration 2.23 authoritative-input count changed");
  }
  if (persisted.registrations.count !== 0) throw new Error("Research iteration 2.23 creates a registration");
  const alkaslasi = persisted.exactReferences.alkaslasiCholinergicTaxonomy;
  if (alkaslasi.displayedProfileCount !== 8 || alkaslasi.interneuronNucleusCount !== 5375) {
    throw new Error("Research iteration 2.23 Alkaslasi denominator changed");
  }
  if (alkaslasi.sourceObjectBundled !== false || alkaslasi.exactNucleusRosterBundled !== false) {
    throw new Error("Research iteration 2.23 bundles the rights-gated Alkaslasi source roster");
  }
  if (alkaslasi.biologicalPrevalenceClaim !== false) {
    throw new Error("Research iteration 2.23 creates an Alkaslasi prevalence claim");
  }
  if (alkaslasi.generatedCellGeometryCount !== 0 || alkaslasi.crossSourceIdentityCount !== 0 || alkaslasi.projectRegistrationCount !== 0) {
    throw new Error("Research iteration 2.23 creates unsupported Alkaslasi geometry, identity, or registration");
  }
  return {
    releaseId: persisted.releaseId,
    inputCount: persisted.integrity.inputCount,
    sourcePackageCount: persisted.registrySummary.canonicalSourcePackageCount,
    researchUpgradeCount: persisted.registrySummary.researchUpgradeCount,
    molecularProfileCount: 161,
    alkaslasiProfileCount: alkaslasi.displayedProfileCount,
    alkaslasiNucleusCount: alkaslasi.interneuronNucleusCount,
    registrationCount: persisted.registrations.count,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest223()
    .then((summary) => {
      process.stdout.write(`Research iteration 2.23 manifest valid: ${summary.inputCount} exact inputs, ${summary.sourcePackageCount} source packages, ${summary.researchUpgradeCount} upgrades, ${summary.alkaslasiProfileCount} Alkaslasi profiles / ${summary.alkaslasiNucleusCount} nuclei, ${summary.registrationCount} registrations.\n`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
