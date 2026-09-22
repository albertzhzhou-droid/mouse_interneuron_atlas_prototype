#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { computeManifestContentSha256 } from "./build-release-manifest.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.39.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.39.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.38.json");

const EXPECTED = Object.freeze({
  bytes: 187451,
  fileSha256: "865782ddbc2b827d4fe1359bbd1c250ce24afadcb052990c8c5978bb06ef81b4",
  contentSha256: "4fa9014be79e2d920f6859944da35a676bed2d7e17b3b83c4dcdb9fe419904cc",
  parentBytes: 173397,
  parentFileSha256: "97ef72ab7e7c2da802af7c4cca6d5a280162e61a08b4a2258bb58f1ee0107595",
  parentContentSha256: "8af86d1167213865712c5da915193c13b629d31a1e0452f08d2d4f4f9d9f3b19",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateResearchIterationManifest239Snapshot(override = null) {
  const [manifestBytes, schema, parentBytes] = await Promise.all([
    readFile(MANIFEST_PATH),
    readFile(SCHEMA_PATH, "utf8").then(JSON.parse),
    readFile(PARENT_PATH),
  ]);
  const manifest = override ?? JSON.parse(manifestBytes.toString("utf8"));
  const parent = JSON.parse(parentBytes.toString("utf8"));
  const errors = [];

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    errors.push(...(validateSchema.errors ?? []).map(
      (error) => `schema ${error.instancePath || "/"}: ${error.message ?? "violation"}`,
    ));
  }

  if (override === null) {
    check(manifestBytes.byteLength === EXPECTED.bytes, "immutable 2.39 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED.fileSha256, "immutable 2.39 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED.contentSha256, "immutable 2.39 manifest content receipt drifted", errors);
  check(computeManifestContentSha256(manifest) === EXPECTED.contentSha256, "immutable 2.39 canonical content hash is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.39.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.39.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.version === "2.39.0-research.1",
    "immutable 2.39 release identity changed",
    errors,
  );
  check(
    manifest.parentIterationManifest?.releaseId === "ohri-mouse-interneuron-research-iteration-2.38.0"
      && manifest.parentIterationManifest?.bytes === EXPECTED.parentBytes
      && manifest.parentIterationManifest?.fileSha256 === EXPECTED.parentFileSha256
      && manifest.parentIterationManifest?.contentSha256 === EXPECTED.parentContentSha256,
    "immutable 2.39 parent receipt changed",
    errors,
  );
  check(
    parentBytes.byteLength === EXPECTED.parentBytes
      && sha256(parentBytes) === EXPECTED.parentFileSha256
      && parent.manifestContentSha256 === EXPECTED.parentContentSha256
      && computeManifestContentSha256(parent) === EXPECTED.parentContentSha256,
    "immutable 2.38 parent file or content receipt drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 172 && manifest.authoritativeInputs?.length === 172, "immutable 2.39 input denominator changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 172, "immutable 2.39 input ids are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 172, "immutable 2.39 input paths are not unique", errors);

  const reference = manifest.exactReferences?.sourceNativeSomaContoursAndAvailabilityIntegrity;
  check(reference?.contractId === "ohri-source-native-soma-contours-and-availability-integrity-2.39", "immutable 2.39 reference identity changed", errors);
  check(
    reference?.nativeContourReleaseId === "ohri-neurolucida-source-native-soma-contour-trace-0.1.0"
      && reference?.neuronId === 45718
      && reference?.sourceDatBytes === 343774
      && reference?.sourceDatSha256 === "ae5f3122dfcebfa06f3e69351670ab6428ed61d4a2bc24f099edc98e62f69415"
      && reference?.nativeGeometryBytes === 45606
      && reference?.nativeGeometrySha256 === "a0aa80ce0f12b08cfe61b2862f1b3a29f67a1105a722b0dceda2fd3b25e898e8"
      && reference?.sourceSomaContourObjectCount === 8
      && reference?.sourceFlagClosedObjectCount === 7
      && reference?.legacyCellBodyClosureExceptionCount === 1
      && reference?.vertexCount === 275
      && reference?.semanticClosedSegmentCount === 275
      && reference?.canonicalSourceCount === 27
      && reference?.canonicalRecordSetCount === 33
      && reference?.bundledExactRosterCount === 9
      && reference?.bundledExactObjectSetCount === 1
      && reference?.sourceProfileCount === 376
      && reference?.sourceNamespaceCount === 9
      && reference?.researchExplorerRecordCount === 630
      && reference?.researchUpgradeCount === 178
      && reference?.lastResearchUpgradeId === "UPG-196"
      && reference?.availabilityCandidateCount === 3
      && reference?.queueOnlyCandidateCount === 3
      && reference?.boundedPairAvailabilityReceiptCount === 1
      && reference?.admittedSourceNativeContourObjectCount === 8,
    "immutable 2.39 native-contour or denominator boundary changed",
    errors,
  );
  check(
    reference?.admittedSurfaceCount === 0
      && reference?.admittedInternalStructureCount === 0
      && reference?.generatedFallbackPrimitiveCount === 0
      && reference?.filledPolygonCount === 0
      && reference?.triangleCount === 0
      && reference?.volumeCount === 0
      && reference?.registrationCount === 0
      && reference?.atlasRegistrationCount === 0
      && reference?.sameCellCrossModalJoinCount === 0
      && reference?.standardizedSwcOverlayCount === 0
      && reference?.availabilitySourceObjectBundleAdmissionCount === 0
      && reference?.availabilitySelectedCellJoinCount === 0
      && reference?.availabilitySameCellInternalChainCount === 0
      && reference?.availabilityAdmittedGeometryObjectCount === 0
      && reference?.availabilityAdmittedInternalObjectCount === 0
      && reference?.availabilityRenderedObjectCount === 0
      && reference?.availabilityCurrentUiSurfaceCount === 0,
    "immutable 2.39 zero boundary changed",
    errors,
  );
  check(
    reference?.lineLoopsOnly === true
      && reference?.sourceCoordinatesPreserved === true
      && reference?.viewerTransformReversible === true
      && reference?.legacyCellBodyKeptSeparate === true
      && reference?.traceRadiusRenderingForbidden === true
      && reference?.datToSwcOverlayForbidden === true
      && reference?.availabilityCandidatesQueueOnly === true
      && reference?.janeliaCellClassUnknown === true
      && reference?.noGenericGeometrySubstitution === true,
    "immutable 2.39 evidence-boundary flags changed",
    errors,
  );
  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 27
      && manifest.registrySummary?.canonicalRecordSetCount === 33
      && manifest.registrySummary?.bundledExactRosterCount === 9
      && manifest.registrySummary?.bundledExactObjectSetCount === 1
      && manifest.registrySummary?.researchUpgradeCount === 178
      && manifest.registrySummary?.sourceProfileCount === 376
      && manifest.registrySummary?.sourceNamespaceCount === 9
      && manifest.registrySummary?.researchExplorerRecordCount === 630
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "immutable 2.39 registry denominator or zero boundary changed",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "immutable 2.39 registration zero-claim changed", errors);

  const inputPaths = new Set((manifest.authoritativeInputs ?? []).map((input) => input.path));
  check(inputPaths.has("data/neurolucida-source-native-soma-contour-trace-0.1.json"), "immutable 2.39 roster lost the native-contour contract", errors);
  check(inputPaths.has("public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json"), "immutable 2.39 roster lost the native-contour geometry", errors);
  check(inputPaths.has("app/NativeSomaContourViewer.tsx"), "immutable 2.39 roster lost the native-contour viewer", errors);
  check(inputPaths.has("data/open-source-modeling-availability-audit-0.1.json"), "immutable 2.39 roster lost the availability audit", errors);
  check(inputPaths.has("docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_39.md"), "immutable 2.39 roster lost the timeline", errors);

  if (errors.length > 0) throw new Error(`Research iteration 2.39 immutable snapshot validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: EXPECTED.bytes,
    fileSha256: EXPECTED.fileSha256,
    contentSha256: EXPECTED.contentSha256,
    inputCount: 172,
    researchUpgradeCount: 178,
    canonicalSourcePackageCount: 27,
    canonicalRecordSetCount: 33,
    bundledExactRosterCount: 9,
    bundledExactObjectSetCount: 1,
    sourceProfileCount: 376,
    sourceNamespaceCount: 9,
    researchExplorerRecordCount: 630,
    admittedSourceNativeContourObjectCount: 8,
    vertexCount: 275,
    admittedSurfaceCount: 0,
    admittedInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest239Snapshot()
    .then((result) => process.stdout.write(`Research iteration 2.39 immutable snapshot valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
