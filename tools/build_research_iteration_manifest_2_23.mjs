#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { buildResearchIterationManifest222 } from "./build_research_iteration_manifest_2_22.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.23.json");
const ALKASLASI_PATH = "data/alkaslasi-cholinergic-source-taxonomy-0.1.json";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function buildResearchIterationManifest223() {
  const [base, alkaslasiBytes] = await Promise.all([
    buildResearchIterationManifest222(),
    readFile(path.join(PROJECT_ROOT, ALKASLASI_PATH)),
  ]);
  const alkaslasi = JSON.parse(alkaslasiBytes.toString("utf8"));
  const manifest = structuredClone(base);
  manifest.manifestSchemaVersion = "2.23.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.23.0";
  manifest.application.version = "2.23.0-research.1";
  manifest.baseResearchRelease.note = "The seven SCI evidence entities remain the frozen Research MVP 0.2 model. Iteration 2.23 adds eight independent adult cholinergic I1-I8 source-local molecular profiles from a checksum-pinned remote GEO annotation object. It creates no morphology, cell geometry, internal structure, biological prevalence, cross-source identity, or registration.";
  manifest.authoritativeInputs.push({
    id: "alkaslasiCholinergicTaxonomyContract",
    scope: "project",
    path: ALKASLASI_PATH,
    purpose: "Exact Alkaslasi adult cholinergic I1-I8 source-local aggregate taxonomy contract",
    bytes: alkaslasiBytes.byteLength,
    sha256: sha256(alkaslasiBytes),
  });
  manifest.integrity.inputCount = manifest.authoritativeInputs.length;
  manifest.exactReferences.alkaslasiCholinergicTaxonomy = {
    contractReleaseId: alkaslasi.releaseId,
    authority: alkaslasi.coordinateAuthority,
    sourceDoi: alkaslasi.source.publication.doi,
    sourceAccession: alkaslasi.source.geo.accession,
    sourceObjectFileName: alkaslasi.source.geo.annotationAsset.fileName,
    sourceObjectBytes: alkaslasi.source.geo.annotationAsset.compressedBytes,
    sourceObjectSha256: alkaslasi.source.geo.annotationAsset.compressedSha256,
    sourceObjectBundled: alkaslasi.source.geo.annotationAsset.sourceFileBundled,
    exactNucleusRosterBundled: alkaslasi.source.geo.annotationAsset.exactNucleusRosterBundled,
    sourceAnimalCount: alkaslasi.source.geo.sampleFrame.sourceAnimalCount,
    processingReplicateCount: alkaslasi.source.geo.sampleFrame.processingReplicateCount,
    geoSampleCount: alkaslasi.source.geo.sampleFrame.geoSampleCount,
    qcRetainedNucleusCount: alkaslasi.scope.sourceTotalQcRetainedNucleusCount,
    cholinergicNucleusCount: alkaslasi.scope.sourceCholinergicNucleusCount,
    interneuronNucleusCount: alkaslasi.scope.sourceInterneuronNucleusCount,
    displayedProfileCount: alkaslasi.scope.displayedProfileCount,
    biologicalPrevalenceClaim: false,
    generatedCellGeometryCount: alkaslasi.scope.generatedGeometryCount,
    crossSourceIdentityCount: alkaslasi.scope.exactCrossSourceIdentityCount,
    projectRegistrationCount: alkaslasi.scope.projectRegistrationCount,
    notAdmitted: [
      "per_nucleus_roster_redistribution",
      "biological_prevalence",
      "cell_xyz",
      "soma_or_neurite_geometry",
      "membrane_or_internal_organelles",
      "electrophysiology",
      "projection_targets",
      "synaptic_edges",
      "sci_state",
      "atlas_placement",
    ],
  };
  manifest.scientificBoundaries.alkaslasiCholinergicTaxonomy = "I1-I8 counts and Cervical, Thoracic, deposited Lumbar, M, F, and NA cross-tabs are exact source-row aggregates. Chat-Cre/Sun1 reporter history and FACS enrichment prohibit prevalence or unbiased-census claims. Sample-region values are not xyz coordinates. The source gzip and per-nucleus roster remain remote and unbundled; no morphology, internal structure, synapse, cross-source identity, or registration is admitted.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return manifest;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const manifest = await buildResearchIterationManifest223();
  if (process.argv.includes("--write")) await writeFile(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ releaseId: manifest.releaseId, inputCount: manifest.integrity.inputCount, manifestContentSha256: manifest.manifestContentSha256, wrote: process.argv.includes("--write") }, null, 2)}\n`);
}
