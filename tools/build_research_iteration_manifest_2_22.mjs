#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCIENTIFIC_AUTHORITY_ROOT = path.resolve(PROJECT_ROOT, "../interneuron_sci_review");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.22.json");

const INPUT_SPECS = Object.freeze([
  { id: "researchRelease", scope: "project", path: "data/research-mvp-release-0.2.json", purpose: "Research MVP 0.2 evidence-entity payload" },
  { id: "researchReleaseSchema", scope: "project", path: "schemas/research-mvp-release.schema.json", purpose: "Research MVP 0.2 JSON Schema" },
  { id: "evidenceLedger", scope: "scientificAuthority", path: "02_EVIDENCE/EVIDENCE_LEDGER.md", purpose: "External authoritative evidence ledger" },
  { id: "sourceManifest", scope: "scientificAuthority", path: "01_LITERATURE/SOURCE_MANIFEST.tsv", purpose: "External authoritative source manifest" },
  { id: "atlasAssetManifest", scope: "project", path: "public/data/allen_cord_20um_v3_0/asset-manifest.json", purpose: "Current bundled BrainGlobe atlas derivative manifest" },
  { id: "morphologyAssetManifest", scope: "project", path: "public/data/neuromorpho_release_8_6_124/asset-manifest.json", purpose: "Bundled NeuroMorpho exemplar manifest" },
  { id: "micronsObservedReferenceContract", scope: "project", path: "data/microns-observed-cell-nucleus-reference-0.1.json", purpose: "Exact MICrONS cell and source-linked nucleus component-limited admission contract" },
  { id: "micronsObservedReferenceAssetManifest", scope: "project", path: "public/data/microns_phase1_v185_4_root_648518346349516051_v1/asset-manifest.json", purpose: "Exact MICrONS source fragments and browser geometry asset receipts" },
  { id: "ronzanoPremotorPositionContract", scope: "project", path: "data/ronzano-premotor-position-reference-0.1.json", purpose: "Exact Ronzano neonatal premotor coordinate-row admission contract" },
  { id: "ronzanoPremotorPositionPayload", scope: "project", path: "public/data/ronzano_premotor_positions_v1/positions.json", purpose: "Exact source-local Ronzano XYZ rows across independent raw and normalized representations" },
  { id: "researchSourceRegistry", scope: "project", path: "data/research-source-registry-0.1.json", purpose: "Canonical source and record-set registry" },
  { id: "researchModelUpgradeRegistry", scope: "project", path: "data/research-model-upgrade-registry-0.1.json", purpose: "Deterministic research/model upgrade registry" },
  { id: "rightsLedger", scope: "project", path: "docs/RIGHTS_LEDGER.csv", purpose: "Current asset and source rights decisions" },
  { id: "packageLock", scope: "project", path: "package-lock.json", purpose: "Exact JavaScript dependency graph" },
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function rootFor(scope) {
  return scope === "scientificAuthority" ? SCIENTIFIC_AUTHORITY_ROOT : PROJECT_ROOT;
}

export async function buildResearchIterationManifest222() {
  const authoritativeInputs = [];
  for (const spec of INPUT_SPECS) {
    const bytes = await readFile(path.resolve(rootFor(spec.scope), spec.path));
    authoritativeInputs.push({ ...spec, bytes: bytes.byteLength, sha256: sha256(bytes) });
  }
  const [positionContract, sourceRegistry, upgradeRegistry] = await Promise.all([
    readFile(path.join(PROJECT_ROOT, "data/ronzano-premotor-position-reference-0.1.json"), "utf8").then(JSON.parse),
    readFile(path.join(PROJECT_ROOT, "data/research-source-registry-0.1.json"), "utf8").then(JSON.parse),
    readFile(path.join(PROJECT_ROOT, "data/research-model-upgrade-registry-0.1.json"), "utf8").then(JSON.parse),
  ]);
  const manifest = {
    manifestSchemaVersion: "2.22.0",
    releaseId: "ohri-mouse-interneuron-research-iteration-2.22.0",
    releaseDate: "2026-08-30",
    releaseStatus: "localhost_research_iteration",
    application: {
      name: "ohri-mouse-interneuron-atlas-prototype",
      version: "2.22.0-research.1",
    },
    baseResearchRelease: {
      releaseId: "ohri-mouse-interneuron-research-mvp-candidate-0.2.0",
      schemaVersion: "0.2.0",
      note: "The seven SCI evidence entities remain the frozen Research MVP 0.2 model. Iteration 2.22 adds an independent early-postnatal source-local Ronzano coordinate-point lane without joining it to anatomy, molecular types, morphologies, MICrONS, SCI states, or those entities.",
    },
    authoritativeInputs,
    inputRoots: {
      project: { locator: ".", policy: "Only exact allowlisted project-relative paths are admitted." },
      scientificAuthority: { locator: "../interneuron_sci_review", policy: "Only the evidence ledger and source manifest are admitted from the external authority root." },
    },
    integrity: {
      algorithm: "SHA-256",
      canonicalization: "UTF-8 compact JSON with recursively lexicographically sorted object keys; array order preserved; top-level manifestContentSha256 omitted.",
      inputCount: authoritativeInputs.length,
    },
    registrations: { count: 0, records: [] },
    exactReferences: {
      micronsObservedCellNucleus: {
        contractId: "microns-observed-cell-nucleus-reference-0.1",
        contractReleaseId: "ohri-microns-observed-cell-nucleus-reference-0.1.0",
        authority: "OBS_EM_SEGMENTATION",
        sourceRelease: "MICrONS Phase 1 v185.4",
        sourceRegion: "visual cortex layer 2/3",
        cellRootId: "648518346349516051",
        nucleusId: "4309",
        samePhysicalObject: true,
        admittedComponentCount: 2,
        sourceFragmentCount: 97,
        vertexCount: 385064,
        triangleCount: 727788,
        manifestBytes: 94901,
        manifestSha256: "063e66321ecfcb8633dd39be0e08d467318ea276eeae0e6fef8344b313c5f2f1",
        membraneClaim: false,
        spinalInterneuronIdentity: false,
        crossRegionJoinCount: 0,
        projectRegistrationCount: 0,
        notAdmitted: ["mitochondria", "synapses", "other_internal_organelles", "molecular_subtype", "atlas_placement"],
      },
      ronzanoPremotorPositions: {
        contractReleaseId: positionContract.releaseId,
        authority: "OBS_SOURCE_COORDINATE_ROW",
        sourceDoi: positionContract.source.doi,
        sourceLifeStage: "P1-P2 injection; analysis 8-9 days later",
        sourceFileCount: positionContract.sourceObjectContract.sourceFileCount,
        rawCoordinateRowCount: positionContract.sourceObjectContract.representations.raw.coordinateRowCount,
        normalizedCoordinateRowCount: positionContract.sourceObjectContract.representations.normalized.coordinateRowCount,
        coordinateRowsAcrossIndependentRepresentations: positionContract.sourceObjectContract.coordinateRowCountAcrossRepresentations,
        sourceBundleBytes: positionContract.sourceObjectContract.sourceBundleTotalBytes,
        sourceBundleSha256: positionContract.sourceObjectContract.sourceBundleCanonicalReceipt.sha256,
        payloadBytes: positionContract.derivedAsset.bytes,
        payloadSha256: positionContract.derivedAsset.sha256,
        crossFramePointIdentityCount: 0,
        generatedCellGeometryCount: 0,
        atlasJoinCount: 0,
        projectRegistrationCount: 0,
        notAdmitted: ["soma_geometry", "neurite_morphology", "molecular_identity", "synapse_roster", "internal_organelles", "adult_persistence", "atlas_placement"],
      },
    },
    registrySummary: {
      canonicalSourcePackageCount: sourceRegistry.sourceCount,
      researchUpgradeCount: upgradeRegistry.summary.upgradeCount,
      crossSourceIdentityCount: 0,
      registrationCount: 0,
    },
    scientificBoundaries: {
      selectedSpinalCellInternalStructure: "unavailable",
      micronsObservedReference: "The exact cell and nucleus are a visual-cortex cross-region reference. The outer segmentation boundary is not a molecular membrane. No anatomy, type, morphology, organelle, synapse or registration relationship to any spinal record is admitted.",
      ronzanoPremotorPositions: "Every primitive is one exact early-postnatal source coordinate row with no biological radius. Raw and normalized representations remain unpaired, source-local, measurement-forbidden, and unregistered; no soma, morphology, type, synapse, internal structure, adult placement, prevalence or census claim is admitted.",
      missingEvidence: "Missing or unavailable evidence generates zero primitives and is not biological absence.",
      measurementAllowed: false,
    },
  };
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return manifest;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const manifest = await buildResearchIterationManifest222();
  if (process.argv.includes("--write")) await writeFile(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, inputCount: manifest.integrity.inputCount, manifestContentSha256: manifest.manifestContentSha256, wrote: process.argv.includes("--write") }, null, 2)}\n`);
}
