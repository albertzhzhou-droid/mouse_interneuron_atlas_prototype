#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.24.json");
const SNAPSHOT_BYTES = 16036;
const SNAPSHOT_SHA256 = "bf6413c99188d1603d2349fa9792fb329d549a8a2bfbc16e43805c2a0d196a5d";
const MANIFEST_CONTENT_SHA256 = "dee49a706f7bbbf2940fc52ce9c9632313858f7f76f5080af15450ad015a8bcd";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function validateResearchIterationManifest224() {
  const snapshotBytes = await readFile(MANIFEST_PATH);
  if (snapshotBytes.byteLength !== SNAPSHOT_BYTES) throw new Error("Research iteration 2.24 immutable snapshot byte count changed");
  if (sha256(snapshotBytes) !== SNAPSHOT_SHA256) throw new Error("Research iteration 2.24 immutable snapshot SHA-256 changed");
  const persisted = JSON.parse(snapshotBytes.toString("utf8"));
  if (persisted.manifestContentSha256 !== MANIFEST_CONTENT_SHA256 || computeManifestContentSha256(persisted) !== MANIFEST_CONTENT_SHA256) throw new Error("Research iteration 2.24 canonical manifestContentSha256 changed");
  if (persisted.integrity.inputCount !== 20 || persisted.authoritativeInputs.length !== 20) throw new Error("Research iteration 2.24 authoritative-input count changed");
  if (persisted.registrySummary.canonicalSourcePackageCount !== 24 || persisted.registrySummary.researchUpgradeCount !== 111) throw new Error("Research iteration 2.24 historical source or upgrade denominator changed");
  if (persisted.registrySummary.crossSourceIdentityCount !== 0 || persisted.registrySummary.registrationCount !== 0 || persisted.registrations.count !== 0) throw new Error("Research iteration 2.24 creates an identity or registration");
  const grp = persisted.exactReferences.grpDorsalHornObservedMorphology;
  if (grp.neuronId !== 109021 || grp.nodeCount !== 2790 || grp.segmentCount !== 2789 || grp.axonNodeCount !== 2202) throw new Error("Research iteration 2.24 GRP geometry receipt changed");
  if (grp.legacyExemplarCount !== 5 || grp.censusRecordCount !== 142) throw new Error("Research iteration 2.24 changed a frozen morphology denominator");
  if (grp.legacyExemplarCount + 1 !== 6) throw new Error("Research iteration 2.24 active morphology denominator changed");
  if (grp.completeAxonClaim !== false || grp.membraneClaim !== false || grp.internalPrimitiveCount !== 0 || grp.crossSourceIdentityCount !== 0 || grp.projectRegistrationCount !== 0) throw new Error("Research iteration 2.24 creates unsupported GRP completeness, membrane, internal, identity or registration claims");
  const rendering = persisted.exactReferences.evidenceAware3dRepresentation;
  if (rendering.representationStateCount !== 9 || rendering.routeCount !== 7 || rendering.missingLayerPrimitiveCount !== 0) throw new Error("Research iteration 2.24 rendering state contract changed");
  if (rendering.proceduralBiologicalProxyAllowed !== false || rendering.crossSourceIdentityCount !== 0 || rendering.projectRegistrationCount !== 0) throw new Error("Research iteration 2.24 admits a procedural biological proxy, identity or registration");
  return {
    releaseId: persisted.releaseId,
    inputCount: persisted.integrity.inputCount,
    sourcePackageCount: persisted.registrySummary.canonicalSourcePackageCount,
    researchUpgradeCount: persisted.registrySummary.researchUpgradeCount,
    molecularProfileCount: 161,
    legacyExemplarCount: grp.legacyExemplarCount,
    activeMainSceneMorphologyCount: grp.legacyExemplarCount + 1,
    censusRecordCount: grp.censusRecordCount,
    representationStateCount: rendering.representationStateCount,
    routeCount: rendering.routeCount,
    registrationCount: persisted.registrations.count,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest224()
    .then((summary) => process.stdout.write(`Research iteration 2.24 manifest valid: ${summary.inputCount} exact inputs, ${summary.sourcePackageCount} source packages, ${summary.researchUpgradeCount} upgrades, ${summary.activeMainSceneMorphologyCount} active main-scene morphology routes over ${summary.censusRecordCount} census records, ${summary.representationStateCount} representation states, ${summary.registrationCount} REG.\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
