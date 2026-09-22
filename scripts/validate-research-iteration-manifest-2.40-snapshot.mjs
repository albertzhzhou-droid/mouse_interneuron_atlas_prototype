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
const MANIFEST_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.40.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "schemas/research-iteration-manifest-2.40.schema.json");
const PARENT_PATH = path.join(PROJECT_ROOT, "data/research-iteration-manifest-2.39.json");

const EXPECTED = Object.freeze({
  bytes: 206354,
  fileSha256: "5552cc8c46c35a26fbefed4090f4a2d0337eda2397639ea5eca807fdf4cf6d30",
  contentSha256: "991885f465d6226ec9d23fe133238e62c32e253276b120ed54fd74a4a632b48f",
  parentBytes: 187451,
  parentFileSha256: "865782ddbc2b827d4fe1359bbd1c250ce24afadcb052990c8c5978bb06ef81b4",
  parentContentSha256: "4fa9014be79e2d920f6859944da35a676bed2d7e17b3b83c4dcdb9fe419904cc",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export async function validateResearchIterationManifest240Snapshot(override = null) {
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
    check(manifestBytes.byteLength === EXPECTED.bytes, "immutable 2.40 manifest byte count drifted", errors);
    check(sha256(manifestBytes) === EXPECTED.fileSha256, "immutable 2.40 manifest file SHA-256 drifted", errors);
  }
  check(manifest.manifestContentSha256 === EXPECTED.contentSha256, "immutable 2.40 manifest content receipt drifted", errors);
  check(computeManifestContentSha256(manifest) === EXPECTED.contentSha256, "immutable 2.40 canonical content hash is invalid", errors);
  check(
    manifest.manifestSchemaVersion === "2.40.0"
      && manifest.releaseId === "ohri-mouse-interneuron-research-iteration-2.40.0"
      && manifest.releaseDate === "2026-09-02"
      && manifest.releaseStatus === "localhost_research_iteration"
      && manifest.application?.version === "2.40.0-research.1",
    "immutable 2.40 release identity changed",
    errors,
  );
  check(
    manifest.parentIterationManifest?.releaseId === "ohri-mouse-interneuron-research-iteration-2.39.0"
      && manifest.parentIterationManifest?.bytes === EXPECTED.parentBytes
      && manifest.parentIterationManifest?.fileSha256 === EXPECTED.parentFileSha256
      && manifest.parentIterationManifest?.contentSha256 === EXPECTED.parentContentSha256,
    "immutable 2.40 parent receipt changed",
    errors,
  );
  check(
    parentBytes.byteLength === EXPECTED.parentBytes
      && sha256(parentBytes) === EXPECTED.parentFileSha256
      && parent.manifestContentSha256 === EXPECTED.parentContentSha256
      && computeManifestContentSha256(parent) === EXPECTED.parentContentSha256,
    "immutable 2.39 parent file or content receipt drifted",
    errors,
  );

  check(manifest.integrity?.inputCount === 187 && manifest.authoritativeInputs?.length === 187, "immutable 2.40 input denominator changed", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.id)).size === 187, "immutable 2.40 input ids are not unique", errors);
  check(new Set(manifest.authoritativeInputs?.map((input) => input.path)).size === 187, "immutable 2.40 input paths are not unique", errors);

  const reference = manifest.exactReferences?.recordCompletenessAndNativeContourCatalogIntegrity;
  check(reference?.contractId === "ohri-record-completeness-and-native-contour-catalog-integrity-2.40", "immutable 2.40 reference identity changed", errors);
  check(
    reference?.catalogReleaseId === "ohri-neurolucida-native-contour-admission-catalog-0.2.0"
      && reference?.auditedDatFileCount === 5
      && same(reference?.auditedNeuronIds, [45718, 45674, 50424, 50394, 50408])
      && reference?.admittedRecordCount === 2
      && same(reference?.admittedNeuronIds, [45718, 45674])
      && reference?.heldRecordCount === 3
      && same(reference?.heldNeuronIds, [50424, 50394, 50408])
      && reference?.admittedContourObjectCount === 15
      && reference?.admittedVertexCount === 475
      && reference?.admittedRenderedPrimitiveCount === 15,
    "immutable 2.40 DAT identity or admission denominator changed",
    errors,
  );
  check(
    reference?.nmo45718ContourObjectCount === 8
      && reference?.nmo45718VertexCount === 275
      && reference?.nmo45674SourceDatBytes === 353251
      && reference?.nmo45674SourceDatSha256 === "9d5a8670fdb97656c18eb8819b3c4723f438fb8929e66ea8dc6103c6bb547d87"
      && reference?.nmo45674AuditedSomaContourObjectCount === 8
      && reference?.nmo45674AuditedSomaVertexCount === 227
      && reference?.nmo45674SourceClosedSomaContourCount === 7
      && reference?.nmo45674SourceOpenSomaContourCount === 1
      && reference?.nmo45674AdmittedContourObjectCount === 7
      && reference?.nmo45674AdmittedVertexCount === 200
      && reference?.nmo45674GeometryBytes === 35842
      && reference?.nmo45674GeometrySha256 === "1e41538a6443dcf7893386c180d3d22ddf81cc72a4d96f66a16193c97747cec3"
      && reference?.heldToddSomaContourObjectCount === 33
      && reference?.heldToddSomaVertexCount === 1904,
    "immutable 2.40 record-specific contour boundary changed",
    errors,
  );
  check(
    reference?.canonicalSourceCount === 27
      && reference?.canonicalRecordSetCount === 33
      && reference?.bundledExactRosterCount === 9
      && reference?.bundledExactObjectSetCount === 1
      && reference?.researchExplorerRecordCount === 630
      && reference?.molecularProfileCount === 376
      && reference?.sourceNamespaceCount === 9
      && reference?.completenessSlotCount === 8
      && reference?.completenessProfileCount === 376
      && reference?.researchUpgradeCount === 186
      && reference?.lastResearchUpgradeId === "UPG-204",
    "immutable 2.40 registry, completeness or upgrade denominator changed",
    errors,
  );
  check(
    reference?.admittedSurfaceCount === 0
      && reference?.admittedVolumeCount === 0
      && reference?.admittedInternalStructureCount === 0
      && reference?.generatedFallbackPrimitiveCount === 0
      && reference?.filledPolygonCount === 0
      && reference?.triangleCount === 0
      && reference?.standardizedSwcOverlayCount === 0
      && reference?.sameCellCrossModalJoinCount === 0
      && reference?.crossSourceIdentityCount === 0
      && reference?.registrationCount === 0
      && reference?.atlasRegistrationCount === 0,
    "immutable 2.40 zero boundary changed",
    errors,
  );
  check(
    reference?.fixedCompletenessSlotsForEveryMolecularProfile === true
      && reference?.lineLoopsOnly === true
      && reference?.selectedRecordIdentityGated === true
      && reference?.priorRecordGeometryCleared === true
      && reference?.sourceCoordinatesPreserved === true
      && reference?.viewerTransformReversible === true
      && reference?.traceRadiusRenderingForbidden === true
      && reference?.datToSwcOverlayForbidden === true
      && reference?.heldRecordsRenderZeroPrimitives === true
      && reference?.contourObjectsAreNotCellsOrTypes === true
      && reference?.noGenericGeometrySubstitution === true,
    "immutable 2.40 evidence-boundary flags changed",
    errors,
  );
  check(
    manifest.registrySummary?.canonicalSourcePackageCount === 27
      && manifest.registrySummary?.canonicalRecordSetCount === 33
      && manifest.registrySummary?.bundledExactRosterCount === 9
      && manifest.registrySummary?.bundledExactObjectSetCount === 1
      && manifest.registrySummary?.researchUpgradeCount === 186
      && manifest.registrySummary?.sourceProfileCount === 376
      && manifest.registrySummary?.sourceNamespaceCount === 9
      && manifest.registrySummary?.researchExplorerRecordCount === 630
      && manifest.registrySummary?.crossSourceIdentityCount === 0
      && manifest.registrySummary?.registrationCount === 0
      && manifest.registrySummary?.renderedInternalPrimitiveCount === 0,
    "immutable 2.40 registry denominator or zero boundary changed",
    errors,
  );
  check(manifest.registrations?.count === 0 && manifest.registrations?.records?.length === 0, "immutable 2.40 registration zero-claim changed", errors);

  const inputPaths = new Set((manifest.authoritativeInputs ?? []).map((input) => input.path));
  check(inputPaths.has("data/neurolucida-native-contour-admission-catalog-0.2.json"), "immutable 2.40 roster lost the five-DAT catalog", errors);
  check(inputPaths.has("public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-45674-source-closed-soma-contours.json"), "immutable 2.40 roster lost NMO 45674 geometry", errors);
  check(inputPaths.has("app/NativeContourRecordViewer.tsx"), "immutable 2.40 roster lost the record-specific contour viewer", errors);
  check(inputPaths.has("app/ObservedMorphologyRouteLibrary.tsx"), "immutable 2.40 roster lost the per-record route library", errors);
  check(inputPaths.has("app/research-record-presentation.js"), "immutable 2.40 roster lost the fixed-slot presentation runtime", errors);
  check(inputPaths.has("docs/RESEARCH_TIMELINE_2026-09-02_ITERATION_2_40.md"), "immutable 2.40 roster lost the timeline", errors);

  if (errors.length > 0) throw new Error(`Research iteration 2.40 immutable snapshot validation failed:\n- ${errors.join("\n- ")}`);
  return {
    releaseId: manifest.releaseId,
    fileBytes: EXPECTED.bytes,
    fileSha256: EXPECTED.fileSha256,
    contentSha256: EXPECTED.contentSha256,
    inputCount: 187,
    researchUpgradeCount: 186,
    canonicalSourcePackageCount: 27,
    canonicalRecordSetCount: 33,
    bundledExactRosterCount: 9,
    bundledExactObjectSetCount: 1,
    sourceProfileCount: 376,
    sourceNamespaceCount: 9,
    completenessSlotCount: 8,
    auditedDatFileCount: 5,
    admittedRecordCount: 2,
    heldRecordCount: 3,
    admittedContourObjectCount: 15,
    admittedVertexCount: 475,
    admittedSurfaceCount: 0,
    admittedInternalStructureCount: 0,
    renderedInternalPrimitiveCount: 0,
    registrationCount: 0,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateResearchIterationManifest240Snapshot()
    .then((result) => process.stdout.write(`Research iteration 2.40 immutable snapshot valid: ${JSON.stringify(result)}\n`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
