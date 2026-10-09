#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeManifestContentSha256 } from "../scripts/build-release-manifest.mjs";
import { SNAPSHOT_253, validateResearchIterationManifest253Snapshot } from "../scripts/validate-research-iteration-manifest-2.53-snapshot.mjs";
import { validateCensusChildObservedMorphologyRoute01 } from "../scripts/validate-census-child-observed-morphology-route-0.1.mjs";
import { validateEvidenceAware3dRepresentationContract06 } from "../scripts/validate-evidence-aware-3d-representation-contract-0.6.mjs";
import { validateCanonicalResearchUpgradeRegistry } from "../scripts/validate-research-model-upgrade-registry-0.1.mjs";
import { loadResearchSourceRegistry, summarizeResearchSourceRegistry } from "../scripts/validate-research-source-registry-0.1.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_254_PATH = path.join(ROOT, "data/research-iteration-manifest-2.54.json");
export const INPUTS_254 = Object.freeze([
  ["sealedIteration253Manifest", "data/research-iteration-manifest-2.53.json"],
  ["sealedIteration253SnapshotValidator", "scripts/validate-research-iteration-manifest-2.53-snapshot.mjs"],
  ["censusChildObservedMorphologyRoute", "data/census-child-observed-morphology-route-0.1.json"],
  ["censusChildObservedMorphologyRouteSchema", "schemas/census-child-observed-morphology-route-0.1.schema.json"],
  ["censusChildObservedMorphologyRouteBuilder", "tools/build_census_child_observed_morphology_route_0_1.mjs"],
  ["censusChildObservedMorphologyRouteValidator", "scripts/validate-census-child-observed-morphology-route-0.1.mjs"],
  ["censusChildObservedMorphologyRouteTests", "tests/census-child-observed-morphology-route.test.mjs"],
  ["nativeNmo108978ContourGeometry", "public/data/neurolucida_native_detail_v1/nmo-108978-soma-line-loops.json"],
  ["evidenceAware3dRepresentationContract06", "data/evidence-aware-3d-representation-contract-0.6.json"],
  ["evidenceAware3dRepresentationContract06Schema", "schemas/evidence-aware-3d-representation-contract-0.6.schema.json"],
  ["evidenceAware3dRepresentationContract06Builder", "tools/build_evidence_aware_3d_representation_contract_0_6.mjs"],
  ["evidenceAware3dRepresentationContract06Validator", "scripts/validate-evidence-aware-3d-representation-contract-0.6.mjs"],
  ["evidenceAware3dRepresentationContract06Tests", "tests/evidence-aware-3d-representation-0.6.test.mjs"],
  ["mainSceneObservedRouteIntegrationTests", "tests/main-scene-observed-route-integration.test.mjs"],
  ["iteration254Builder", "tools/build_research_iteration_manifest_2_54.mjs"],
  ["iteration254Validator", "scripts/validate-research-iteration-manifest-2.54.mjs"],
  ["iteration254Tests", "tests/research-iteration-manifest-2.54.test.mjs"],
  ["iteration254Timeline", "docs/RESEARCH_TIMELINE_2026-09-23_ITERATION_2_54.md"],
]);

const REFRESHED_PARENT_INPUT_PATHS = new Set([
  "package.json",
  "package-lock.json",
  "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md",
  "data/research-model-upgrade-registry-0.1.json",
  "data/research-source-registry-0.1.json",
  "tools/build_research_upgrade_registry.mjs",
  "scripts/validate-research-model-upgrade-registry-0.1.mjs",
  "tests/research-model-upgrade-registry.test.mjs",
  "tests/research-iteration-manifest-2.53.test.mjs",
  "scripts/validate-research-source-registry-0.1.mjs",
  "tests/research-source-registry.test.mjs",
  "tools/run_current_research_tests.mjs",
  "app/AtlasPrototype.tsx",
  "app/atlas-types.ts",
  "app/layout.tsx",
  "app/ResearchOverview.tsx",
  "app/ResearchDataLab.tsx",
  "tests/rendered-html.test.mjs",
  "tests/observed-morphology-runtime-contract.test.mjs",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function receipt(input, rootLocator) {
  if (!rootLocator || path.isAbsolute(input.path) || input.path.split("/").includes("..")) throw new Error(`Invalid scoped input: ${input.id}`);
  const bytes = await readFile(path.resolve(ROOT, rootLocator, input.path));
  return { ...input, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

export async function buildResearchIterationManifest254() {
  const { manifest: parent } = await validateResearchIterationManifest253Snapshot();
  const [upgrades, sourceRegistry, route, representation] = await Promise.all([
    validateCanonicalResearchUpgradeRegistry(),
    loadResearchSourceRegistry(),
    validateCensusChildObservedMorphologyRoute01(),
    validateEvidenceAware3dRepresentationContract06(),
  ]);
  const sourceSummary = summarizeResearchSourceRegistry(sourceRegistry);
  const refreshedParentInputs = parent.authoritativeInputs.map((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)
    ? { ...input, purpose: `Iteration 2.54 refreshed ${input.id} receipt` }
    : input);
  const refreshedPaths = refreshedParentInputs.filter((input) => REFRESHED_PARENT_INPUT_PATHS.has(input.path)).map((input) => input.path);
  const missingRefreshedPaths = [...REFRESHED_PARENT_INPUT_PATHS].filter((inputPath) => !refreshedPaths.includes(inputPath));
  if (missingRefreshedPaths.length) throw new Error(`Required 2.54 refreshed parent inputs are missing: ${missingRefreshedPaths.join(", ")}`);

  const inputs = [
    ...refreshedParentInputs,
    ...INPUTS_254.map(([id, inputPath]) => ({ id, scope: "project", path: inputPath, purpose: "Iteration 2.54 source-local NMO 108978 morphology route and validation" })),
  ];
  if (new Set(inputs.map((input) => input.id)).size !== inputs.length
    || new Set(inputs.map((input) => `${input.scope}:${input.path}`)).size !== inputs.length) throw new Error("Duplicate 2.54 input identity");

  const receipts = await Promise.all(inputs.map((input) => receipt(input, parent.inputRoots[input.scope]?.locator)));
  const byId = new Map(receipts.map((input) => [input.id, input]));
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.version !== "2.54.0-research.1") throw new Error("2.54 application version mismatch");

  const manifest = structuredClone(parent);
  manifest.authoritativeInputs = receipts;
  manifest.manifestSchemaVersion = "2.54.0";
  manifest.releaseId = "ohri-mouse-interneuron-research-iteration-2.54.0";
  manifest.releaseDate = "2026-09-23";
  manifest.application.version = pkg.version;
  manifest.parentIterationManifest = {
    path: SNAPSHOT_253.path,
    releaseId: parent.releaseId,
    bytes: SNAPSHOT_253.bytes,
    fileSha256: SNAPSHOT_253.fileSha256,
    contentSha256: SNAPSHOT_253.contentSha256,
  };
  manifest.integrity.inputCount = receipts.length;
  manifest.baseResearchRelease.note = "Iteration 2.54 adds NMO 108978 cell-4_16 as a selectable source-local census-child morphology route using its pinned standardized SWC/radii and independently framed native Neurolucida DAT soma line loops. The DAT traces remain separate from the SWC frame with no correspondence, overlay or registration; NMO 108978 is already in the 142-record census and is not added to the frozen five-record lens, a biological type denominator or the 7-object supplementary set. The previous MICrONS mit_new target remains spatially ineligible under its documented nominal grid, without a biological-absence claim.";
  manifest.registrySummary = {
    ...manifest.registrySummary,
    canonicalSourcePackageCount: sourceSummary.sourceCount,
    canonicalRecordSetCount: sourceSummary.recordSetCount,
    bundledExactRosterCount: sourceSummary.bundledExactRosterCount,
    bundledExactObjectSetCount: sourceSummary.bundledExactSourceObjectSetCount,
    researchUpgradeCount: upgrades.upgradeCount,
    sourceRegistryReceipt: byId.get("researchSourceRegistry"),
    upgradeRegistryReceipt: byId.get("researchModelUpgradeRegistry"),
  };
  const representationContract = JSON.parse(await readFile(path.join(ROOT, "data/evidence-aware-3d-representation-contract-0.6.json"), "utf8"));
  manifest.exactReferences.evidenceAware3dRepresentation = {
    contractId: representationContract.contractId,
    contractReleaseId: representationContract.releaseId,
    deterministicMaterializationReceipt: {
      path: "data/evidence-aware-3d-representation-contract-0.6.json",
      bytes: byId.get("evidenceAware3dRepresentationContract06").bytes,
      sha256: byId.get("evidenceAware3dRepresentationContract06").sha256,
      buildInputs: representationContract.buildInputs,
    },
    representationStateCount: representation.stateCount,
    representationStateIds: representationContract.representationStates.map((state) => state.id),
    routeCount: representation.routeCount,
    routeIds: representationContract.routes.map((candidate) => candidate.routeId),
    namedSpinalMorphologyRouteCount: 11,
    mainSceneMorphologyCount: 14,
    nativeSomaLineLoopStateId: "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP",
    internalReferenceRenderedPrimitivePolicy: "zero_primitives",
    missingLayerPrimitiveCount: 0,
    nativeDatSemanticAdmissionCount: 12,
    sameSpecimenInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    crossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  };
  manifest.exactReferences.censusChildMorphologyRoute254 = {
    routeId: route.routeId,
    neuronId: 108978,
    assetId: "NeuroMorpho:108978",
    neuronName: "cell-4_16",
    routeContractId: "census-child-observed-morphology-route-0.1",
    routeReleaseId: route.releaseId,
    routeContractReceipt: {
      path: "data/census-child-observed-morphology-route-0.1.json",
      bytes: byId.get("censusChildObservedMorphologyRoute").bytes,
      sha256: byId.get("censusChildObservedMorphologyRoute").sha256,
    },
    censusRecordCount: route.censusRecordCount,
    censusMembership: true,
    censusContribution: 0,
    censusExpansionCount: 0,
    frozenLensMembership: false,
    mainSceneMorphologyIncrement: route.mainSceneMorphologyIncrement,
    activeMainSceneMorphologyCount: 14,
    namedSpinalMorphologyRouteCount: 11,
    standardizedSwc: {
      sourceFrame: "NeuroMorpho_CNG_standardized_local_frame",
      bytes: 62949,
      sha256: "016e8329e9b1f2da5c5d4a314bab7998cba66ae56f3517be573a4ac0b2b4c250",
      nodeCount: 1817,
      segmentCount: 1816,
      sourceDiameterAvailable: true,
    },
    nativeDat: {
      bytes: 172603,
      sha256: "4b046ab1c4bd5c35b7e3c8d0a60695b4234c90d5f13b0ba290e525abdc863a65",
      sourceFrame: "Neurolucida_DAT_source_native_unregistered",
      lineLoopCount: route.nativeSomaLineLoopCount,
      vertexCount: route.nativeSomaLineLoopVertexCount,
      rawSourceClosedFlag: false,
      interpretedClosureAuthority: "file_specific_MBF_Cell_Body_semantics",
    },
    coordinateTransformToStandardizedSwcStatus: "not_established",
    overlayWithStandardizedSwcAllowed: false,
    numericAge: { value: null, missingReason: "official_repository_metadata_reports_Not Reported" },
    depositedCellTypeLabels: ["interneuron", "Excitatory", "Substance P-(SP) expressing"],
    exactPaperSubtypeJoinEstablished: false,
    biologicalAxonClaim: false,
    renderedInternalPrimitiveCount: route.internalPrimitiveCount,
    crossSourceIdentityCount: route.crossSourceIdentityCount,
    projectRegistrationCount: route.projectRegistrationCount,
    linkedOriginalPaperDoi: "10.1097/j.pain.0000000000001406",
    linkedPrimaryStudyUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6330098/",
    researchUpgradeId: "UPG-226",
  };
  manifest.scientificBoundaries.censusChildMorphologyRoute254 = "NMO 108978 is one existing source-local record in the frozen 142-record adult query. Its exact SWC and DAT contours use separate frames; equal soma counts establish no correspondence. Keep numeric age missing, do not promote the deposited SP/excitatory labels to a same-cell assay or paper-verified subclass, do not infer axon absence from the repository domain, and render zero internal structures, joins and registrations.";
  manifest.manifestContentSha256 = computeManifestContentSha256(manifest);
  return { manifest, bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [flag] = process.argv.slice(2);
    if (process.argv.length !== 3 || !["--write", "--check"].includes(flag)) throw new Error("Use --write or --check");
    const built = await buildResearchIterationManifest254();
    if (flag === "--write") await writeFile(MANIFEST_254_PATH, built.bytes);
    else if (!(await readFile(MANIFEST_254_PATH)).equals(built.bytes)) throw new Error("2.54 manifest is stale");
    process.stdout.write(`${JSON.stringify({ releaseId: built.manifest.releaseId, inputCount: built.manifest.integrity.inputCount, researchUpgradeCount: built.manifest.registrySummary.researchUpgradeCount, censusRecordCount: built.manifest.exactReferences.censusChildMorphologyRoute254.censusRecordCount, mainSceneMorphologyCount: built.manifest.exactReferences.censusChildMorphologyRoute254.activeMainSceneMorphologyCount, nativeSomaLineLoopCount: built.manifest.exactReferences.censusChildMorphologyRoute254.nativeDat.lineLoopCount, nativeSomaLineLoopVertexCount: built.manifest.exactReferences.censusChildMorphologyRoute254.nativeDat.vertexCount, contentSha256: built.manifest.manifestContentSha256 })}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
