import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, realpath, rename, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { validateAtlasInternalCompartments } from "./validate-atlas-internal-compartments.mjs";

export const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SCIENTIFIC_AUTHORITY_ROOT = resolve(PROJECT_ROOT, "../interneuron_sci_review");
export const RELEASE_MANIFEST_PATH = resolve(PROJECT_ROOT, "data/release-manifest-2.8.json");

export const REQUIRED_INPUT_SPECS = Object.freeze([
  {
    id: "researchRelease",
    scope: "project",
    path: "data/research-mvp-release-0.2.json",
    purpose: "Research MVP 0.2 release payload",
  },
  {
    id: "researchReleaseSchema",
    scope: "project",
    path: "schemas/research-mvp-release.schema.json",
    purpose: "Research MVP 0.2 JSON Schema",
  },
  {
    id: "publicDataCatalog",
    scope: "project",
    path: "data/public-data-catalog-0.4.json",
    purpose: "Public-data workbench source catalog and upgrade queue",
  },
  {
    id: "publicDataCatalogSchema",
    scope: "project",
    path: "schemas/public-data-catalog-0.4.schema.json",
    purpose: "Public-data workbench JSON Schema",
  },
  {
    id: "russTaxonomyCrosswalk",
    scope: "project",
    path: "data/russ-harmonized-taxonomy-crosswalk-0.1.json",
    purpose: "Russ 2021 derived 69-population type-level taxonomy crosswalk",
  },
  {
    id: "russTaxonomyCrosswalkSchema",
    scope: "project",
    path: "schemas/russ-harmonized-taxonomy-crosswalk-0.1.schema.json",
    purpose: "Russ 2021 taxonomy crosswalk JSON Schema",
  },
  {
    id: "russReconciliationDossier",
    scope: "project",
    path: "data/russ-reconciliation-dossier-0.1.json",
    purpose: "Russ 2021 provenance reconciliation dossier",
  },
  {
    id: "russReconciliationDossierSchema",
    scope: "project",
    path: "schemas/russ-reconciliation-dossier-0.1.schema.json",
    purpose: "Russ 2021 provenance reconciliation dossier JSON Schema",
  },
  {
    id: "tabulaeConditionCatalog",
    scope: "project",
    path: "data/tabulae-condition-catalog-0.1.json",
    purpose: "Tabulae Paralytica metadata-only condition index",
  },
  {
    id: "tabulaeConditionCatalogSchema",
    scope: "project",
    path: "schemas/tabulae-condition-catalog-0.1.schema.json",
    purpose: "Tabulae Paralytica metadata-only condition index JSON Schema",
  },
  {
    id: "tabulaeSpatialLocalSession",
    scope: "project",
    path: "data/tabulae-spatial-local-session-0.1.json",
    purpose: "Tabulae Paralytica browser-local source-image session contract",
  },
  {
    id: "tabulaeSpatialLocalSessionSchema",
    scope: "project",
    path: "schemas/tabulae-spatial-local-session-0.1.schema.json",
    purpose: "Tabulae Paralytica browser-local source-image session JSON Schema",
  },
  {
    id: "tabulaeSpatialLocalComparison",
    scope: "project",
    path: "data/tabulae-spatial-local-comparison-0.1.json",
    purpose: "Tabulae Paralytica browser-local multi-session source-image comparison contract",
  },
  {
    id: "tabulaeSpatialLocalComparisonSchema",
    scope: "project",
    path: "schemas/tabulae-spatial-local-comparison-0.1.schema.json",
    purpose: "Tabulae Paralytica browser-local multi-session comparison JSON Schema",
  },
  {
    id: "spinaljMetadataIntake",
    scope: "project",
    path: "data/public-source-intakes/spinalj-processed-metadata-audit-0.4.json",
    purpose: "SpinalJ public metadata-only intake record",
  },
  {
    id: "publicSourceIntakeSchema",
    scope: "project",
    path: "schemas/public-source-intake.schema.json",
    purpose: "Public-source metadata intake JSON Schema",
  },
  {
    id: "publicSourceIntakeRegistry",
    scope: "project",
    path: "data/public-source-intake-registry-0.7.json",
    purpose: "Multi-source public metadata intake registry",
  },
  {
    id: "publicSourceIntakeRegistrySchema",
    scope: "project",
    path: "schemas/public-source-intake-registry-0.7.schema.json",
    purpose: "Multi-source public metadata intake registry JSON Schema",
  },
  {
    id: "fileAdmissionManifestSchema",
    scope: "project",
    path: "schemas/public-file-admission-manifest-0.7.schema.json",
    purpose: "Object-level public file-admission manifest JSON Schema",
  },
  {
    id: "fileAdmissionPreflight",
    scope: "project",
    path: "data/file-admission-preflight-0.7.json",
    purpose: "Zero-file, no-download object-level public file-admission preflight",
  },
  {
    id: "fileAdmissionPreflightSchema",
    scope: "project",
    path: "schemas/public-file-admission-preflight-0.7.schema.json",
    purpose: "Object-level public file-admission preflight JSON Schema",
  },
  { id: "canoFileAdmissionManifestSchema", scope: "project", path: "schemas/public-file-admission-manifest-0.8.schema.json", purpose: "Specimen-aware Cano-Gomez file-admission manifest JSON Schema" },
  { id: "canoFileAdmissionPreflight", scope: "project", path: "data/file-admission-preflight-0.8.json", purpose: "Zero-file specimen-aware Cano-Gomez admission preflight" },
  { id: "canoFileAdmissionPreflightSchema", scope: "project", path: "schemas/public-file-admission-preflight-0.8.schema.json", purpose: "Specimen-aware Cano-Gomez preflight JSON Schema" },
  { id: "fileAdmissionComposer", scope: "project", path: "data/public-file-admission-composer-0.1.json", purpose: "Browser-local metadata-only public file-admission manifest composer contract" },
  { id: "fileAdmissionComposerSchema", scope: "project", path: "schemas/public-file-admission-composer-0.1.schema.json", purpose: "Browser-local metadata-only public file-admission manifest composer JSON Schema" },
  { id: "publicProvenanceCrate", scope: "project", path: "data/public-provenance-crate-0.1.json", purpose: "Browser-local detached RO-Crate 1.3 public-source provenance exporter contract" },
  { id: "publicProvenanceCrateSchema", scope: "project", path: "schemas/public-provenance-crate-0.1.schema.json", purpose: "Detached RO-Crate public-source provenance exporter JSON Schema" },
  { id: "evidenceFeasibilityPlanner", scope: "project", path: "data/evidence-feasibility-planner-0.1.json", purpose: "Browser-local public-source research-question feasibility planner contract" },
  { id: "evidenceFeasibilityPlannerSchema", scope: "project", path: "schemas/evidence-feasibility-planner-0.1.schema.json", purpose: "Public-source research-question feasibility planner JSON Schema" },
  { id: "evidenceProvenanceTrace", scope: "project", path: "data/evidence-provenance-trace-0.1.json", purpose: "Browser-local two-lane evidence and public-source provenance trace contract" },
  { id: "evidenceProvenanceTraceSchema", scope: "project", path: "schemas/evidence-provenance-trace-0.1.schema.json", purpose: "Two-lane evidence and public-source provenance trace JSON Schema" },
  { id: "crossLaneRelationshipAdmission", scope: "project", path: "data/cross-lane-relationship-admission-0.1.json", purpose: "Browser-local not-admitted cross-lane relationship proposal gate" },
  { id: "crossLaneRelationshipAdmissionSchema", scope: "project", path: "schemas/cross-lane-relationship-admission-0.1.schema.json", purpose: "Cross-lane relationship proposal gate JSON Schema" },
  { id: "publicSourceReleaseAdmissionService", scope: "project", path: "data/public-source-release-admission-service-0.1.json", purpose: "Browser-local metadata-only public-source release-admission review service" },
  { id: "publicSourceReleaseAdmissionServiceSchema", scope: "project", path: "schemas/public-source-release-admission-service-0.1.schema.json", purpose: "Public-source release-admission review service JSON Schema" },
  { id: "publicSourceAssertionProvenance", scope: "project", path: "data/public-source-assertion-provenance-0.1.json", purpose: "Browser-local assertion-level public-source provenance composer" },
  { id: "publicSourceAssertionProvenanceSchema", scope: "project", path: "schemas/public-source-assertion-provenance-0.1.schema.json", purpose: "Assertion-level public-source provenance composer JSON Schema" },
  { id: "publicSourceAuthorizationPlan", scope: "project", path: "data/public-source-authorization-plan-0.1.json", purpose: "Browser-local authorization and local-verification plan composer" },
  { id: "publicSourceAuthorizationPlanSchema", scope: "project", path: "schemas/public-source-authorization-plan-0.1.schema.json", purpose: "Authorization and local-verification plan composer JSON Schema" },
  { id: "publicSourceIndependentAuthorizationEvidence", scope: "project", path: "data/public-source-independent-authorization-evidence-0.1.json", purpose: "Browser-local independent authorization-evidence packet composer" },
  { id: "publicSourceIndependentAuthorizationEvidenceSchema", scope: "project", path: "schemas/public-source-independent-authorization-evidence-0.1.schema.json", purpose: "Independent authorization-evidence packet composer JSON Schema" },
  { id: "interneuronKnowledgeCoverage", scope: "project", path: "data/interneuron-knowledge-coverage-0.1.json", purpose: "Five-source by seven-axis source-bounded interneuron knowledge coverage matrix" },
  { id: "interneuronKnowledgeCoverageSchema", scope: "project", path: "schemas/interneuron-knowledge-coverage-0.1.schema.json", purpose: "Source-bounded interneuron knowledge coverage JSON Schema" },
  { id: "referenceAnatomyArchitectureDecision", scope: "project", path: "docs/ADR-012-REFERENCE-ANATOMY-AND-TYPE-LANES.md", purpose: "Architecture decision separating INF reference anatomy, TYPE_LEVEL molecular labels, and SYN/SCH SCI evidence" },
  { id: "researchModelUpgradeQueue", scope: "project", path: "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md", purpose: "Reference-gated internal-anatomy and research-model upgrade queue" },
  {
    id: "curatorFeedbackContract",
    scope: "project",
    path: "data/curator-feedback-contract-2.8.json",
    purpose: "Local-only curator feedback import and receipt contract",
  },
  {
    id: "curatorFeedbackContractSchema",
    scope: "project",
    path: "schemas/curator-feedback-contract-2.8.schema.json",
    purpose: "Local-only curator feedback contract JSON Schema",
  },
  {
    id: "curatorAdjudicationContract",
    scope: "project",
    path: "data/curator-adjudication-contract-2.8.json",
    purpose: "Local-only independent-curator adjudication packet contract",
  },
  {
    id: "curatorAdjudicationContractSchema",
    scope: "project",
    path: "schemas/curator-adjudication-contract-2.8.schema.json",
    purpose: "Local-only curator adjudication packet contract JSON Schema",
  },
  {
    id: "evidenceLedger",
    scope: "scientificAuthority",
    path: "02_EVIDENCE/EVIDENCE_LEDGER.md",
    purpose: "External authoritative evidence ledger",
  },
  {
    id: "sourceManifest",
    scope: "scientificAuthority",
    path: "01_LITERATURE/SOURCE_MANIFEST.tsv",
    purpose: "External authoritative source manifest",
  },
  {
    id: "atlasAssetManifest",
    scope: "project",
    path: "public/data/allen_cord_20um_v3_0/asset-manifest.json",
    purpose: "Bundled BrainGlobe atlas derivative manifest",
  },
  {
    id: "atlasInternalCompartments",
    scope: "project",
    path: "public/data/allen_cord_20um_v3_0/atlas-internal-compartments.json",
    purpose: "Atlas-ID-preserving exact source-mask components and polygons for seven major internal structures",
  },
  {
    id: "morphologyAssetManifest",
    scope: "project",
    path: "public/data/neuromorpho_release_8_6_124/asset-manifest.json",
    purpose: "Bundled NeuroMorpho exemplar manifest",
  },
  {
    id: "rightsLedger",
    scope: "project",
    path: "docs/RIGHTS_LEDGER.csv",
    purpose: "Asset and source rights decisions",
  },
  {
    id: "packageLock",
    scope: "project",
    path: "package-lock.json",
    purpose: "Exact JavaScript dependency graph",
  },
]);

const EXPECTED_ATLAS = Object.freeze({
  atlas: "allen_cord_20um",
  atlasVersion: "3.0",
  atlasApiVersion: "3.0.1",
  shapeZyx: [1567, 253, 322],
  resolutionUmZyx: [20, 10, 10],
  orientation: "asr",
  geometryStatus: "INF",
});
const EXPECTED_NEURON_IDS = Object.freeze([104003, 108974, 109005, 242822, 260150]);
const EXPECTED_COVERAGE_LOCATOR_CORRECTIONS = Object.freeze([
  { laneId: "russ-2021", axisId: "type_taxonomy", sourceLocator: "Results — Overview of harmonized neuronal cell types; Fig. 2; Supplementary Figs. 4–5; Supplementary Table 2" },
  { laneId: "russ-2021", axisId: "region_lamina_context", sourceLocator: "Results — Overview and detailed cluster validation; Fig. 2e; Fig. 4d–f; Table 1; Supplementary Fig. 9" },
  { laneId: "russ-2021", axisId: "life_stage", sourceLocator: "Results — merged postnatal datasets, Fig. 1a; adult L4 validation, Fig. 4d–f and Supplementary Fig. 9" },
  { laneId: "russ-2021", axisId: "spatial_measurement", sourceLocator: "Abstract and Results — adult in situ mapping; Fig. 2e; Fig. 4d–f; Table 1; Supplementary Fig. 9" },
  { laneId: "sathyamurthy-2018", axisId: "type_taxonomy", sourceLocator: "Results — Census of Adult Spinal Cord Neuronal Populations; Figs. 2 and 4; Table S2" },
  { laneId: "sathyamurthy-2018", axisId: "causal_mechanism", sourceLocator: "Results — snRNA-seq Following Behavior Identified Active Neurons; Fig. 5; Fig. S4" },
  { laneId: "tabulae-paralytica-2024", axisId: "causal_mechanism", sourceLocator: "Extended Data Fig. 3j–l — AAV-DTR two weeks before complete crush SCI; diphtheria toxin at eight weeks; thoracic Vsx2ON ablation and locomotor outcome. Supplementary Video 2 — ablation prevents natural recovery of walking. Separate rejuvenative gene-therapy experiment: Fig. 8; Extended Data Fig. 10; Supplementary Video 3" },
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function canonicalize(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON cannot contain a non-finite number");
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => {
          if (value[key] === undefined) {
            throw new TypeError(`canonical JSON cannot contain undefined at key ${key}`);
          }
          return [key, canonicalize(value[key])];
        }),
    );
  }
  throw new TypeError(`unsupported canonical JSON value: ${typeof value}`);
}

export function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value));
}

export function computeManifestContentSha256(manifest) {
  invariant(manifest && !Array.isArray(manifest) && typeof manifest === "object", "manifest must be an object");
  const hashable = Object.fromEntries(
    Object.entries(manifest).filter(([key]) => key !== "manifestContentSha256"),
  );
  return sha256Buffer(Buffer.from(canonicalStringify(hashable), "utf8"));
}

export function serializeManifest(manifest) {
  return `${JSON.stringify(canonicalize(manifest), null, 2)}\n`;
}

export function resolveContainedPath(baseDirectory, relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, "input path must be a non-empty string");
  invariant(!relativePath.includes("\0"), `input path contains a NUL byte: ${relativePath}`);
  invariant(!relativePath.includes("\\"), `input path must use forward slashes: ${relativePath}`);
  invariant(!isAbsolute(relativePath), `absolute input path is forbidden: ${relativePath}`);
  invariant(!relativePath.split("/").includes(".."), `input path traversal is forbidden: ${relativePath}`);

  const resolvedBase = resolve(baseDirectory);
  const resolvedPath = resolve(resolvedBase, relativePath);
  invariant(
    resolvedPath !== resolvedBase && resolvedPath.startsWith(`${resolvedBase}${sep}`),
    `input path escapes declared root: ${relativePath}`,
  );
  return resolvedPath;
}

async function resolveExistingContainedPath(baseDirectory, relativePath) {
  const lexicalPath = resolveContainedPath(baseDirectory, relativePath);
  const [resolvedBase, resolvedPath] = await Promise.all([realpath(baseDirectory), realpath(lexicalPath)]);
  invariant(
    resolvedPath !== resolvedBase && resolvedPath.startsWith(`${resolvedBase}${sep}`),
    `input path escapes declared root through a symbolic link: ${relativePath}`,
  );
  return resolvedPath;
}

export async function sha256File(path) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest("hex");
}

function productionRoots(projectRoot, scientificAuthorityRoot) {
  const entriesFor = (scope) => REQUIRED_INPUT_SPECS.filter((input) => input.scope === scope).map((input) => input.path);
  return {
    project: { root: projectRoot, allowedPaths: entriesFor("project") },
    scientificAuthority: {
      root: scientificAuthorityRoot,
      allowedPaths: entriesFor("scientificAuthority"),
    },
  };
}

async function resolveInput(entry, roots) {
  invariant(entry && typeof entry === "object", "input declaration must be an object");
  invariant(typeof entry.id === "string" && entry.id.length > 0, "input declaration requires an id");
  const rootDefinition = roots[entry.scope];
  invariant(rootDefinition, `unknown input scope for ${entry.id}: ${entry.scope}`);
  invariant(Array.isArray(rootDefinition.allowedPaths), `input scope ${entry.scope} requires an allowlist`);
  invariant(
    rootDefinition.allowedPaths.includes(entry.path),
    `input path is not allowlisted for ${entry.scope}: ${entry.path}`,
  );
  const path = await resolveExistingContainedPath(rootDefinition.root, entry.path);
  const fileStat = await stat(path);
  invariant(fileStat.isFile(), `authoritative input is not a regular file: ${entry.path}`);
  return { path, fileStat };
}

async function describeInput(spec, roots) {
  const { path, fileStat } = await resolveInput(spec, roots);
  return {
    id: spec.id,
    scope: spec.scope,
    path: spec.path,
    purpose: spec.purpose,
    bytes: fileStat.size,
    sha256: await sha256File(path),
  };
}

export async function verifyInputHashes(inputs, { roots }) {
  invariant(Array.isArray(inputs), "authoritativeInputs must be an array");
  const seenIds = new Set();
  const seenLocations = new Set();
  const verified = [];

  for (const input of inputs) {
    invariant(!seenIds.has(input.id), `duplicate authoritative input id: ${input.id}`);
    const location = `${input.scope}:${input.path}`;
    invariant(!seenLocations.has(location), `duplicate authoritative input path: ${location}`);
    seenIds.add(input.id);
    seenLocations.add(location);
    invariant(/^[0-9a-f]{64}$/.test(input.sha256 ?? ""), `invalid SHA-256 declaration for ${input.id}`);
    invariant(Number.isSafeInteger(input.bytes) && input.bytes >= 0, `invalid byte count for ${input.id}`);

    const { path, fileStat } = await resolveInput(input, roots);
    invariant(fileStat.size === input.bytes, `byte-count mismatch for ${input.id}: expected ${input.bytes}, found ${fileStat.size}`);
    const actualSha256 = await sha256File(path);
    invariant(
      actualSha256 === input.sha256,
      `SHA-256 mismatch for ${input.id}: expected ${input.sha256}, found ${actualSha256}`,
    );
    verified.push({ id: input.id, bytes: fileStat.size, sha256: actualSha256 });
  }
  return verified;
}

async function readJsonInput(spec, roots) {
  const { path } = await resolveInput(spec, roots);
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`failed to parse ${spec.id} as JSON: ${error.message}`, { cause: error });
  }
}

function inputSpec(id) {
  const spec = REQUIRED_INPUT_SPECS.find((candidate) => candidate.id === id);
  invariant(spec, `missing internal input specification: ${id}`);
  return spec;
}

function lockedPackageVersion(packageLock, packageName) {
  const record = packageLock.packages?.[`node_modules/${packageName}`];
  invariant(typeof record?.version === "string", `package-lock is missing node_modules/${packageName}`);
  return record.version;
}

function assertSourceContracts(researchRelease, schema, publicCatalog, publicCatalogSchema, russTaxonomyCrosswalk, russTaxonomyCrosswalkSchema, russReconciliationDossier, russReconciliationDossierSchema, tabulaeConditionCatalog, tabulaeConditionCatalogSchema, tabulaeSpatialLocalSession, tabulaeSpatialLocalSessionSchema, tabulaeSpatialLocalComparison, tabulaeSpatialLocalComparisonSchema, spinaljIntake, intakeSchema, intakeRegistry, intakeRegistrySchema, fileAdmissionManifestSchema, fileAdmissionPreflight, fileAdmissionPreflightSchema, canoFileAdmissionManifestSchema, canoFileAdmissionPreflight, canoFileAdmissionPreflightSchema, fileAdmissionComposer, fileAdmissionComposerSchema, publicProvenanceCrate, publicProvenanceCrateSchema, evidenceFeasibilityPlanner, evidenceFeasibilityPlannerSchema, evidenceProvenanceTrace, evidenceProvenanceTraceSchema, crossLaneRelationshipAdmission, crossLaneRelationshipAdmissionSchema, publicSourceReleaseAdmissionService, publicSourceReleaseAdmissionServiceSchema, publicSourceAssertionProvenance, publicSourceAssertionProvenanceSchema, publicSourceAuthorizationPlan, publicSourceAuthorizationPlanSchema, publicSourceIndependentAuthorizationEvidence, publicSourceIndependentAuthorizationEvidenceSchema, interneuronKnowledgeCoverage, interneuronKnowledgeCoverageSchema, curatorFeedbackContract, curatorFeedbackContractSchema, curatorAdjudicationContract, curatorAdjudicationContractSchema, atlas, morphology, inputById) {
  invariant(researchRelease.schemaVersion === "0.2.0", "research release schemaVersion must be 0.2.0");
  invariant(
    schema.properties?.schemaVersion?.const === researchRelease.schemaVersion,
    "research release schema does not lock the current schemaVersion",
  );
  invariant(researchRelease.releaseStatus === "localhost_candidate", "research release must remain a localhost candidate");
  invariant(Array.isArray(researchRelease.registrations) && researchRelease.registrations.length === 0, "release must contain 0 registrations");
  invariant(researchRelease.spatialContract?.measurementAllowed === false, "research release must forbid spatial measurement");
  invariant(researchRelease.spatialContract?.entityGeometryStatus === "SYN", "entity geometry must remain SYN");
  invariant(researchRelease.spatialContract?.entityPathStatus === "SCH", "entity paths must remain SCH");

  invariant(publicCatalog.schemaVersion === "0.4.0", "public-data catalog schemaVersion must be 0.4.0");
  invariant(
    publicCatalogSchema.properties?.schemaVersion?.const === publicCatalog.schemaVersion,
    "public-data catalog schema does not lock the current schemaVersion",
  );
  invariant(publicCatalog.scientificInputPolicy === "public_sources_only", "public-data policy must remain public_sources_only");
  invariant(publicCatalog.institutionalExperimentalDataUsed === false, "institutional experimental data must remain false");
  invariant(publicCatalog.networkAtReviewRuntime === false, "public-data catalog must not require review-time network access");
  invariant(Array.isArray(publicCatalog.sources) && publicCatalog.sources.length === 7, "exactly seven public source records are required");
  invariant(Array.isArray(publicCatalog.upgradeQueue) && publicCatalog.upgradeQueue.length === 21, "exactly twenty-one upgrade records are required");
  const catalogSourceIds = new Set(publicCatalog.sources.map((source) => source.id));
  for (const sourceId of ["PDS-SPINALJ-PROCESSED", "PDS-CANOGOMEZ-2026", "PDS-RUSS-2021", "PDS-STARMAP-PLUS-2023", "PDS-TABULAE-PARALYTICA"]) {
    invariant(catalogSourceIds.has(sourceId), "required public source is missing: " + sourceId);
  }
  for (const source of publicCatalog.sources) {
    invariant(source.content?.coordinateAuthority !== "REG", "public source must not grant project REG: " + source.id);
  }
  for (const item of publicCatalog.upgradeQueue) {
    invariant(item.sourceIds.every((sourceId) => catalogSourceIds.has(sourceId)), "upgrade source link is invalid: " + item.id);
  }
  const russ = publicCatalog.sources.find((source) => source.id === "PDS-RUSS-2021");
  const russQueue = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-003");
  const russReconciliation = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-009");
  invariant(russ?.admissionStatus === "metadata_audited", "Russ source must have a metadata-audited status");
  invariant(russQueue?.status === "in_progress" && /type-level molecular evidence.*not a spatial registration.*same-cell multimodal join/i.test(russQueue?.scientificBoundary ?? ""), "Russ crosswalk gate must remain type-level only");
  invariant(russReconciliation?.status === "in_progress" && /no spatial coordinate.*same-cell pairing.*REG/i.test(russReconciliation?.scientificBoundary ?? ""), "Russ reconciliation dossier must not grant spatial or registration authority");
  invariant(russTaxonomyCrosswalk.schemaVersion === "0.1.0" && russTaxonomyCrosswalkSchema.properties?.schemaVersion?.const === russTaxonomyCrosswalk.schemaVersion, "Russ taxonomy schema must lock version 0.1.0");
  invariant(russTaxonomyCrosswalk.releaseId === "ohri-russ-harmonized-taxonomy-crosswalk-0.1.0", "Russ taxonomy crosswalk release ID is invalid");
  invariant(russTaxonomyCrosswalk.coordinateAuthority === "TYPE_LEVEL", "Russ taxonomy crosswalk must remain type-level");
  invariant(russTaxonomyCrosswalk.scope?.reportedNeuralPopulationCount === 69 && russTaxonomyCrosswalk.scope?.displayedPopulationCount === 69 && russTaxonomyCrosswalk.scope?.displayedInterneuronCandidateCount === 65, "Russ taxonomy cardinality must remain 69 / 69 / 65");
  invariant(Array.isArray(russTaxonomyCrosswalk.groups) && russTaxonomyCrosswalk.groups.length === 8 && Array.isArray(russTaxonomyCrosswalk.populations) && russTaxonomyCrosswalk.populations.length === 69, "Russ taxonomy must retain eight groups and 69 populations");
  invariant(russTaxonomyCrosswalk.source?.markerTable?.sourceFileBundled === false && russTaxonomyCrosswalk.source?.markerTable?.derivedMetadataBundled === true && russTaxonomyCrosswalk.source?.markerTable?.bytes === 1475885 && russTaxonomyCrosswalk.source?.markerTable?.sha256 === "a45578c893998fae42acf781c4700d162249497476b0b81149302f49929fd2e0", "Russ taxonomy must preserve the unbundled source-table receipt");
  invariant(Array.isArray(russTaxonomyCrosswalk.prototypeCrosswalks) && russTaxonomyCrosswalk.prototypeCrosswalks.length === 7 && russTaxonomyCrosswalk.prototypeCrosswalks.every((mapping) => mapping.mappingStatus !== "exact" && mapping.mappingStatus !== "registered"), "Russ prototype crosswalks must remain non-exact and unregistered");
  invariant(russReconciliationDossier.schemaVersion === "0.1.0" && russReconciliationDossierSchema.properties?.schemaVersion?.const === russReconciliationDossier.schemaVersion, "Russ reconciliation dossier schema must lock version 0.1.0");
  invariant(russReconciliationDossier.releaseId === "ohri-russ-reconciliation-dossier-0.1.0" && russReconciliationDossier.authority === "PROVENANCE_RECONCILIATION_ONLY", "Russ reconciliation dossier identity or authority is invalid");
  invariant(russReconciliationDossier.pinnedMarkerTable?.sourceFileBundled === false && russReconciliationDossier.pinnedMarkerTable?.derivedMetadataBundled === true && russReconciliationDossier.pinnedMarkerTable?.sha256 === russTaxonomyCrosswalk.source.markerTable.sha256 && russReconciliationDossier.pinnedMarkerTable?.tableContentChangeStatedByCorrections === false, "Russ dossier must preserve the unbundled marker-table receipt without a content rewrite");
  invariant(Array.isArray(russReconciliationDossier.corrections) && russReconciliationDossier.corrections.length === 2 && russReconciliationDossier.corrections.some((record) => record.id === "COR-RUSS-2022-02" && record.doi === "10.1038/s41467-022-28698-7") && russReconciliationDossier.corrections.some((record) => record.id === "COR-RUSS-2022-10" && record.doi === "10.1038/s41467-022-33998-z"), "Russ dossier must retain both official correction records");
  invariant(russReconciliationDossier.releaseDecision?.currentStatus === "reconciled_provenance_no_narrow_transfer" && /Do not change a prototype mapping to exact.*REG/i.test(russReconciliationDossier.releaseDecision?.forbidden ?? ""), "Russ dossier release decision must forbid narrow transfer and REG");
  const starmap = publicCatalog.sources.find((source) => source.id === "PDS-STARMAP-PLUS-2023");
  const starmapQueue = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-010");
  invariant(starmap?.admissionStatus === "ready_for_metadata_audit" && starmap?.content?.coordinateAuthority === "SOURCE_LOCAL_OBS", "STARmap PLUS must remain a source-local metadata-audit lead");
  invariant(/one coronal lumbar spinal-cord slice/i.test(starmap?.content?.spinalCoverage ?? ""), "STARmap PLUS must retain its one-lumbar-slice coverage boundary");
  invariant(starmapQueue?.status === "research_watch" && /no whole-spine census.*REG/i.test(starmapQueue?.scientificBoundary ?? ""), "STARmap PLUS queue gate must forbid extrapolation and REG");
  const curatorAdjudication = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-007");
  invariant(curatorAdjudication?.status === "ready", "UPG-007 curator adjudication must be ready for independent curator records");
  invariant(/at least two independent curator feedback files/i.test(curatorAdjudication?.deliverable ?? ""), "UPG-007 must require independent curator feedback");
  invariant(/do not acquire public data.*create REG/i.test(curatorAdjudication?.scientificBoundary ?? ""), "UPG-007 must not grant data admission or REG");
  const spinalj = publicCatalog.sources.find((source) => source.id === "PDS-SPINALJ-PROCESSED");
  invariant(spinalj?.admissionStatus === "metadata_audited", "SpinalJ source must have a metadata-audited status");
  invariant(spinalj?.intakeRecordId === spinaljIntake.intakeId, "SpinalJ catalog intake link does not match the intake record");
  invariant(spinaljIntake.schemaVersion === "0.4.0", "SpinalJ intake schemaVersion must be 0.4.0");
  invariant(intakeSchema.properties?.schemaVersion?.const === spinaljIntake.schemaVersion, "public-source intake schema does not lock the current schemaVersion");
  invariant(spinaljIntake.catalogReleaseId === publicCatalog.releaseId, "SpinalJ intake must name the current public catalog");
  invariant(spinaljIntake.sourceId === spinalj.id, "SpinalJ intake source ID must match the catalog");
  invariant(spinaljIntake.acquisition?.status === "not_downloaded", "SpinalJ intake must not claim an acquired file");
  invariant(spinaljIntake.acquisition?.bundledAssetCount === 0, "SpinalJ intake must contain zero bundled assets");
  invariant(spinaljIntake.coordinates?.projectRegistrationCount === 0, "SpinalJ intake must contain zero registrations");
  invariant(spinaljIntake.rights?.bundleAuthorized === false, "SpinalJ intake must not authorize bundling");
  const tabulae = publicCatalog.sources.find((source) => source.id === "PDS-TABULAE-PARALYTICA");
  const cano = publicCatalog.sources.find((source) => source.id === "PDS-CANOGOMEZ-2026");
  invariant(cano?.admissionStatus === "metadata_audited", "Cano-Gomez source must have a metadata-audited status");
  invariant(cano?.intakeRecordId === "PSI-CANOGOMEZ-2026-08-18", "Cano-Gomez catalog intake link does not match the method audit");
  const canoQueue = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-002");
  invariant(canoQueue?.status === "in_progress", "Cano-Gomez source-local inventory gate must be in progress");
  invariant(/does not create REG/i.test(canoQueue.scientificBoundary ?? ""), "Cano-Gomez method report must not create REG");
  invariant(tabulae?.admissionStatus === "metadata_audited", "Tabulae source must have a metadata-audited status");
  invariant(tabulae?.intakeRecordId === "PSI-TABULAE-PARALYTICA-2026-08-18", "Tabulae catalog intake link does not match the object audit");
  const tabulaeConditionAdapter = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-004");
  const tabulaeAdmissionGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-011");
  invariant(tabulaeConditionAdapter?.status === "in_progress" && /source-metadata-only.*no numerical analysis.*REG/i.test(tabulaeConditionAdapter?.scientificBoundary ?? ""), "Tabulae condition adapter must remain metadata-only with no analysis or REG");
  const tabulae3dEligibilityGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-012");
  const tabulaeComparisonGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-013");
  const provenanceExternalizationGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-014");
  invariant(tabulaeAdmissionGate?.status === "in_progress" && /current local session does not make a whole-spine atlas.*create REG/i.test(tabulaeAdmissionGate?.scientificBoundary ?? ""), "Tabulae object admission gate must forbid extrapolation and REG");
  invariant(tabulae3dEligibilityGate?.status === "research_watch" && /does not create a 3D reconstruction.*REG/i.test(tabulae3dEligibilityGate?.scientificBoundary ?? ""), "Tabulae 3D eligibility gate must remain source-frame-only with no REG");
  invariant(tabulaeComparisonGate?.status === "research_watch" && /remains source-local 2D only.*does not align.*REG/i.test(tabulaeComparisonGate?.scientificBoundary ?? ""), "Tabulae comparison gate must remain source-local with no alignment or REG");
  invariant(provenanceExternalizationGate?.status === "in_progress" && /external HTTPS reference/i.test(provenanceExternalizationGate?.deliverable ?? "") && /does not acquire.*embed, bundle.*REG/i.test(provenanceExternalizationGate?.scientificBoundary ?? ""), "metadata-only provenance export must remain external-reference-only with no acquisition, embedding, bundle or REG");
  invariant(tabulaeConditionCatalog.schemaVersion === "0.1.0" && tabulaeConditionCatalogSchema.properties?.schemaVersion?.const === tabulaeConditionCatalog.schemaVersion, "Tabulae condition schema must lock version 0.1.0");
  invariant(tabulaeConditionCatalog.releaseId === "ohri-tabulae-paralytica-condition-catalog-0.1.0" && tabulaeConditionCatalog.authority === "SOURCE_METADATA_CONDITION_INDEX_ONLY", "Tabulae condition catalog identity or authority is invalid");
  invariant(tabulaeConditionCatalog.admissionDecision === "metadata_only_not_downloaded_not_bundled_not_registered", "Tabulae condition catalog must not acquire, bundle or register source data");
  invariant(Array.isArray(tabulaeConditionCatalog.sources) && tabulaeConditionCatalog.sources.length === 2 && tabulaeConditionCatalog.sources.every((source) => source.bodyBundled === false && source.processedMetadataBundled === false && source.localFileHash === null), "Tabulae condition catalog must retain two unbundled GEO source records");
  invariant(Array.isArray(tabulaeConditionCatalog.conditions) && tabulaeConditionCatalog.conditions.length === 8 && new Set(tabulaeConditionCatalog.conditions.flatMap((condition) => condition.sourceSampleLabels)).size === 93, "Tabulae condition catalog must retain eight condition groups and 93 distinct source labels");
  invariant(/Do not download a source body.*create REG/i.test(tabulaeConditionCatalog.releaseDecision?.forbidden ?? ""), "Tabulae condition decision must forbid acquisition and REG");
  invariant(tabulaeSpatialLocalSession.schemaVersion === "0.1.0" && tabulaeSpatialLocalSessionSchema.properties?.schemaVersion?.const === tabulaeSpatialLocalSession.schemaVersion, "Tabulae local-session schema must lock version 0.1.0");
  invariant(tabulaeSpatialLocalSession.releaseId === "ohri-tabulae-paralytica-spatial-local-session-0.1.0" && tabulaeSpatialLocalSession.authority === "SOURCE_LOCAL_2D_SESSION_ONLY", "Tabulae local-session identity or authority is invalid");
  invariant(tabulaeSpatialLocalSession.catalogReleaseId === publicCatalog.releaseId && tabulaeSpatialLocalSession.scientificInputPolicy === "public_sources_only" && tabulaeSpatialLocalSession.networkAtReviewRuntime === false, "Tabulae local session must retain the public offline policy");
  invariant(tabulaeSpatialLocalSession.archive?.stableName === "GSE234774_RAW.tar" && tabulaeSpatialLocalSession.archive?.bytes === 135208960 && tabulaeSpatialLocalSession.archive?.sourceChecksum === null && tabulaeSpatialLocalSession.archive?.assetRightsDecision === "unresolved_not_bundled", "Tabulae local session must retain the non-bundled archive boundary");
  invariant(tabulaeSpatialLocalSession.localImport?.automaticRemoteAcquisition === false && tabulaeSpatialLocalSession.localImport?.upload === false && tabulaeSpatialLocalSession.localImport?.persistence === "none", "Tabulae local session must prohibit fetch, upload and persistence");
  invariant(Array.isArray(tabulaeSpatialLocalSession.samples) && tabulaeSpatialLocalSession.samples.length === 24 && new Set(tabulaeSpatialLocalSession.samples.map((sample) => sample.sectionLabel)).size === 24, "Tabulae local session must retain 24 unique declared spatial samples");
  invariant(/Do not fetch from GEO.*individual interneuron.*create REG/i.test(tabulaeSpatialLocalSession.releaseDecision?.forbidden ?? ""), "Tabulae local session must forbid download, cell conversion and REG");
  invariant(tabulaeSpatialLocalComparison.schemaVersion === "0.1.0" && tabulaeSpatialLocalComparisonSchema.properties?.schemaVersion?.const === tabulaeSpatialLocalComparison.schemaVersion, "Tabulae local-comparison schema must lock version 0.1.0");
  invariant(tabulaeSpatialLocalComparison.releaseId === "ohri-tabulae-paralytica-spatial-local-comparison-0.1.0" && tabulaeSpatialLocalComparison.authority === "MULTI_SESSION_SOURCE_LOCAL_2D_ONLY", "Tabulae local-comparison identity or authority is invalid");
  invariant(tabulaeSpatialLocalComparison.catalogReleaseId === publicCatalog.releaseId && tabulaeSpatialLocalComparison.baseSessionReleaseId === tabulaeSpatialLocalSession.releaseId && tabulaeSpatialLocalComparison.scientificInputPolicy === "public_sources_only", "Tabulae local comparison must retain its public source-local provenance");
  invariant(tabulaeSpatialLocalComparison.comparison?.maximumConcurrentSessions === 4 && tabulaeSpatialLocalComparison.comparison?.sectionSelection === "unique_declared_section_per_active_session" && tabulaeSpatialLocalComparison.comparison?.displayMode === "side_by_side_source_local_2d_only" && tabulaeSpatialLocalComparison.comparison?.crossSectionTransform === "none" && tabulaeSpatialLocalComparison.comparison?.sectionOrderAuthority === "not_established_from_section_labels" && tabulaeSpatialLocalComparison.comparison?.interSectionGeometry === "not_established" && tabulaeSpatialLocalComparison.comparison?.quantitativeComparison === "not_permitted", "Tabulae local comparison must remain unaligned, unordered and non-quantitative");
  invariant(tabulaeSpatialLocalComparison.localRuntime?.automaticRemoteAcquisition === false && tabulaeSpatialLocalComparison.localRuntime?.upload === false && tabulaeSpatialLocalComparison.localRuntime?.persistence === "none" && tabulaeSpatialLocalComparison.localRuntime?.sourceFilesBundled === false, "Tabulae local comparison must prohibit fetch, upload, persistence and source bundling");
  invariant(/Do not fetch.*overlay, normalize, order, stack or register sections.*REG/i.test(tabulaeSpatialLocalComparison.releaseDecision?.forbidden ?? ""), "Tabulae local comparison must forbid alignment, stacking and REG");
  invariant(intakeRegistry.schemaVersion === "0.7.0", "public-source intake registry schemaVersion must be 0.7.0");
  invariant(intakeRegistrySchema.properties?.schemaVersion?.const === intakeRegistry.schemaVersion, "intake registry schema does not lock the current schemaVersion");
  invariant(intakeRegistry.catalogReleaseId === publicCatalog.releaseId, "intake registry must name the frozen public catalog");
  invariant(Array.isArray(intakeRegistry.records) && intakeRegistry.records.length === 3, "exactly three metadata-only intake records are required");
  for (const intake of intakeRegistry.records) {
    invariant(intake.acquisition?.status === "not_downloaded" && intake.acquisition?.bundledAssetCount === 0, "registry intake must not contain an acquired asset");
    invariant(intake.coordinates?.projectRegistrationCount === 0, "registry intake must contain zero registrations");
  }
  const tabulaeIntake = intakeRegistry.records.find((record) => record.sourceId === "PDS-TABULAE-PARALYTICA");
  const canoIntake = intakeRegistry.records.find((record) => record.sourceId === "PDS-CANOGOMEZ-2026");
  invariant(canoIntake?.studyStatus === "preprint_resource", "Cano-Gomez preprint status must remain explicit");
  invariant(canoIntake?.coordinates?.sourceCoordinateAuthority === "AUTHOR_SPACE_OBS", "Cano-Gomez coordinates must remain author-space");
  invariant(canoIntake?.coordinates?.transformStatus === "method_reported_transform_artifact_and_error_not_file_verified", "Cano-Gomez method report must not become a verified transform");
  invariant(canoIntake?.admission?.nextQueueItem === "UPG-002B", "Cano-Gomez next gate must be the source object and specimen inventory");
  invariant(canoIntake?.acquisition?.bundledAssetCount === 0 && canoIntake?.coordinates?.projectRegistrationCount === 0, "Cano-Gomez intake cannot acquire assets or create registration");
  const canoFacts = new Map((canoIntake?.publicSourceEvidence?.reportedFacts ?? []).map((fact) => [fact.id, fact]));
  invariant(/not a project registration/i.test(canoFacts.get("PSF-CANO-004")?.statement ?? ""), "Cano-Gomez method report must prohibit registration");
  invariant(/held-out error/i.test(canoFacts.get("PSF-CANO-005")?.statement ?? ""), "Cano-Gomez method limitation must retain missing held-out error");
  invariant(tabulaeIntake?.objectInventory?.status === "one_public_object_header_observed_checksum_and_asset_rights_unresolved", "Tabulae object audit state must remain explicit");
  invariant(tabulaeIntake.objectInventory.objects.length === 1, "Tabulae object audit must contain exactly one object");
  invariant(tabulaeIntake.objectInventory.objects[0]?.sourceChecksum === null && tabulaeIntake.objectInventory.objects[0]?.localSha256 === null, "Tabulae object audit must not invent checksums");
  invariant(tabulaeIntake.admission?.nextQueueItem === "UPG-008", "Tabulae object audit must remain linked to UPG-008");
  invariant(fileAdmissionManifestSchema.properties?.admissionDecision?.const === "metadata_only_not_downloaded_not_registered", "file-admission manifest schema must forbid acquisition and registration");
  invariant(sameJson(fileAdmissionManifestSchema.$defs?.sourceChecksum?.properties?.algorithm?.enum, ["sha1", "sha256"]), "file-admission manifest schema must distinguish SHA-1 from SHA-256 source metadata");
  invariant(fileAdmissionManifestSchema.$defs?.file?.properties?.localSha256?.const === null, "file-admission manifest preflight must forbid a local SHA-256");
  invariant(fileAdmissionPreflightSchema.properties?.formatVersion?.const === "0.7.0", "file-admission preflight schema must lock 0.7.0");
  invariant(fileAdmissionPreflight.formatVersion === "0.7.0", "file-admission preflight must be 0.7.0");
  invariant(fileAdmissionPreflight.schemaPath === "schemas/public-file-admission-manifest-0.7.schema.json", "preflight must name the file-admission manifest schema");
  invariant(fileAdmissionPreflight.status === "awaiting_object_level_public_manifest", "preflight must remain awaiting an object-level manifest");
  invariant(fileAdmissionPreflight.sourceId === spinalj.id, "preflight source must be the P0 SpinalJ source");
  invariant(fileAdmissionPreflight.automaticDownload === false && fileAdmissionPreflight.credentialStorage === false, "preflight must forbid automatic downloads and credential storage");
  invariant(fileAdmissionPreflight.candidateFilesAccepted === 0, "preflight must contain zero accepted candidate files");
  invariant(fileAdmissionPreflight.nextQueueItem === "UPG-001B", "preflight must remain linked to UPG-001B");
  invariant(canoFileAdmissionManifestSchema.properties?.formatVersion?.const === "0.8.0", "Cano-Gomez manifest schema must lock 0.8.0");
  invariant(canoFileAdmissionManifestSchema.properties?.sourceId?.const === cano.id, "Cano-Gomez manifest schema must lock its source");
  invariant(canoFileAdmissionPreflightSchema.properties?.formatVersion?.const === "0.8.0", "Cano-Gomez preflight schema must lock 0.8.0");
  invariant(canoFileAdmissionPreflight.formatVersion === "0.8.0" && canoFileAdmissionPreflight.sourceId === cano.id, "Cano-Gomez preflight identity is invalid");
  invariant(canoFileAdmissionPreflight.automaticDownload === false && canoFileAdmissionPreflight.credentialStorage === false && canoFileAdmissionPreflight.candidateFilesAccepted === 0, "Cano-Gomez preflight must retain zero-file local-only boundary");
  invariant(canoFileAdmissionPreflight.nextQueueItem === "UPG-002B", "Cano-Gomez preflight must link UPG-002B");
  invariant(fileAdmissionComposer.schemaVersion === "0.1.0" && fileAdmissionComposerSchema.properties?.schemaVersion?.const === fileAdmissionComposer.schemaVersion, "file-admission composer schema must lock 0.1.0");
  invariant(fileAdmissionComposer.catalogReleaseId === publicCatalog.releaseId && sameJson(fileAdmissionComposer.publicSourceIds, [spinalj.id, cano.id]), "file-admission composer must name the frozen catalog and its two public sources");
  invariant(Array.isArray(fileAdmissionComposer.supportedManifestFormats) && fileAdmissionComposer.supportedManifestFormats.length === 2, "file-admission composer must lock exactly two manifest formats");
  const composerSpinalj = fileAdmissionComposer.supportedManifestFormats.find((format) => format.sourceId === spinalj.id);
  const composerCano = fileAdmissionComposer.supportedManifestFormats.find((format) => format.sourceId === cano.id);
  invariant(composerSpinalj?.formatVersion === "0.7.0" && composerSpinalj?.schemaPath === "schemas/public-file-admission-manifest-0.7.schema.json", "file-admission composer SpinalJ format must remain generic 0.7");
  invariant(composerCano?.formatVersion === "0.8.0" && composerCano?.schemaPath === "schemas/public-file-admission-manifest-0.8.schema.json" && composerCano?.fixedPreprintStatus === "preprint_resource", "file-admission composer Cano-Gomez format must remain specimen-aware 0.8");
  invariant(fileAdmissionComposer.supportedManifestFormats.every((format) => format.fixedAdmissionDecision === "metadata_only_not_downloaded_not_registered" && format.fixedLocalSha256 === null), "file-admission composer must retain metadata-only admission and null local SHA-256");
  invariant(fileAdmissionComposer.localRuntime?.automaticRemoteAcquisition === false && fileAdmissionComposer.localRuntime?.sourceFileUpload === false && fileAdmissionComposer.localRuntime?.credentialStorage === false && fileAdmissionComposer.localRuntime?.persistentStorage === "none" && fileAdmissionComposer.localRuntime?.localHashCalculation === false, "file-admission composer must not acquire, upload, persist, credential-store or locally hash source data");
  invariant(/does not contact a repository/i.test(fileAdmissionComposer.scientificBoundary ?? "") && /acquire or bundle data/i.test(fileAdmissionComposer.scientificBoundary ?? "") && /create REG/i.test(fileAdmissionComposer.scientificBoundary ?? ""), "file-admission composer must retain its local metadata-only and no-REG boundary");

  invariant(publicProvenanceCrate.schemaVersion === "0.1.0" && publicProvenanceCrateSchema.properties?.schemaVersion?.const === publicProvenanceCrate.schemaVersion, "public provenance crate schema must lock 0.1.0");
  invariant(publicProvenanceCrate.catalogReleaseId === publicCatalog.releaseId && sameJson(publicProvenanceCrate.publicSourceIds, publicCatalog.sources.map((source) => source.id)), "public provenance crate must name every frozen public source");
  invariant(publicProvenanceCrate.roCrateVersion === "1.3" && publicProvenanceCrate.roCrateContext === "https://w3id.org/ro/crate/1.3/context" && publicProvenanceCrate.roCrateSpecification === "https://w3id.org/ro/crate/1.3", "public provenance crate must pin RO-Crate 1.3");
  invariant(publicProvenanceCrate.packagingMode === "detached_metadata_document" && publicProvenanceCrate.localRuntime?.networkRequests === false && publicProvenanceCrate.localRuntime?.sourceFileDownload === false && publicProvenanceCrate.localRuntime?.sourceFileUpload === false && publicProvenanceCrate.localRuntime?.persistentStorage === "none" && publicProvenanceCrate.localRuntime?.localHashCalculation === false, "public provenance crate must remain detached and browser-local");
  invariant(/does not acquire, embed, bundle.*create REG/i.test(publicProvenanceCrate.releaseDecision?.scientificBoundary ?? ""), "public provenance crate must forbid acquisition, bundling and REG");
  const feasibilityPlannerGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-015");
  invariant(evidenceFeasibilityPlanner.schemaVersion === "0.1.0" && evidenceFeasibilityPlannerSchema.properties?.schemaVersion?.const === evidenceFeasibilityPlanner.schemaVersion, "feasibility planner schema must lock 0.1.0");
  invariant(evidenceFeasibilityPlanner.catalogReleaseId === publicCatalog.releaseId && sameJson(evidenceFeasibilityPlanner.publicSourceIds, publicCatalog.sources.map((source) => source.id)), "feasibility planner must name every frozen public source");
  invariant(evidenceFeasibilityPlanner.selectedAxisLimit === 4 && evidenceFeasibilityPlanner.axes?.length === 11 && evidenceFeasibilityPlanner.routes?.length === 7, "feasibility planner must retain its bounded axes and source-specific routes");
  invariant(evidenceFeasibilityPlanner.localRuntime?.networkRequests === false && evidenceFeasibilityPlanner.localRuntime?.sourceFileDownload === false && evidenceFeasibilityPlanner.localRuntime?.sourceFileUpload === false && evidenceFeasibilityPlanner.localRuntime?.persistentStorage === "none", "feasibility planner must remain browser-local with no source-object acquisition");
  for (const axisId of ["same_cell_multimodal_join", "synaptic_connectivity", "project_atlas_registration"]) {
    invariant(evidenceFeasibilityPlanner.axes.some((axis) => axis.id === axisId) && !evidenceFeasibilityPlanner.routes.some((route) => route.supportedAxisIds.includes(axisId)), "feasibility planner must retain the unqualified high-risk axis: " + axisId);
  }
  invariant(/package-coverage result.*not a biological absence claim/i.test(evidenceFeasibilityPlanner.unqualifiedAxisDecision ?? "") && /does not acquire.*create REG/i.test(evidenceFeasibilityPlanner.scientificBoundary ?? ""), "feasibility planner must preserve package-coverage and no-REG boundaries");
  invariant(feasibilityPlannerGate?.status === "in_progress" && sameJson(feasibilityPlannerGate?.sourceIds, publicCatalog.sources.map((source) => source.id)) && /same-cell relationship.*create REG/i.test(feasibilityPlannerGate?.scientificBoundary ?? ""), "UPG-015 must retain full-source coverage and no-join/no-REG boundary");
  const provenanceTraceGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-016");
  invariant(evidenceProvenanceTrace.schemaVersion === "0.1.0" && evidenceProvenanceTraceSchema.properties?.schemaVersion?.const === evidenceProvenanceTrace.schemaVersion, "evidence provenance trace schema must lock 0.1.0");
  invariant(evidenceProvenanceTrace.researchReleaseId === researchRelease.releaseId && evidenceProvenanceTrace.catalogReleaseId === publicCatalog.releaseId && evidenceProvenanceTrace.plannerReleaseId === evidenceFeasibilityPlanner.releaseId, "evidence provenance trace must lock all parent releases");
  invariant(evidenceProvenanceTrace.lanes?.length === 2 && sameJson(evidenceProvenanceTrace.lanes.map((lane) => lane.id), ["research_evidence", "public_source_routes"]), "evidence provenance trace must retain exactly two typed lanes");
  invariant(evidenceProvenanceTrace.localRuntime?.networkRequests === false && evidenceProvenanceTrace.localRuntime?.sourceFileDownload === false && evidenceProvenanceTrace.localRuntime?.sourceFileUpload === false && evidenceProvenanceTrace.localRuntime?.persistentStorage === "none", "evidence provenance trace must remain browser-local with no source-object acquisition");
  invariant(/deliberately unjoined.*same-cell.*coordinate transform.*REG/i.test(evidenceProvenanceTrace.crossLanePolicy ?? "") && /does not acquire.*does not infer.*REG/i.test(evidenceProvenanceTrace.scientificBoundary ?? ""), "evidence provenance trace must retain no-join, no-acquisition and no-REG boundaries");
  invariant(provenanceTraceGate?.status === "in_progress" && sameJson(provenanceTraceGate?.sourceIds, publicCatalog.sources.map((source) => source.id)) && /does not acquire.*cross-study identity.*REG/i.test(provenanceTraceGate?.scientificBoundary ?? ""), "UPG-016 must retain full-source coverage and no-cross-study-identity/no-REG boundary");
  const crossLaneAdmissionGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-017");
  invariant(crossLaneAdmissionGate?.status === "in_progress" && sameJson(crossLaneAdmissionGate?.sourceIds, publicCatalog.sources.map((source) => source.id)) && /does not acquire.*cross-study relation.*create REG/i.test(crossLaneAdmissionGate?.scientificBoundary ?? ""), "UPG-017 must remain an implemented, non-promoting relationship proposal gate");
  invariant(crossLaneRelationshipAdmission.schemaVersion === "0.1.0" && crossLaneRelationshipAdmissionSchema.properties?.schemaVersion?.const === crossLaneRelationshipAdmission.schemaVersion, "cross-lane relationship admission schema must lock 0.1.0");
  invariant(crossLaneRelationshipAdmission.researchReleaseId === researchRelease.releaseId && crossLaneRelationshipAdmission.catalogReleaseId === publicCatalog.releaseId && crossLaneRelationshipAdmission.provenanceTraceReleaseId === evidenceProvenanceTrace.releaseId && crossLaneRelationshipAdmission.queueItemId === "UPG-017", "relationship proposal gate must lock all parent releases and UPG-017");
  invariant(sameJson(crossLaneRelationshipAdmission.relationshipKinds?.map((item) => item.id), ["molecular_label_correspondence", "source_object_derivation", "same_specimen_relation", "coordinate_transform", "same_cell_identity"]), "relationship proposal gate must retain all typed relationship kinds");
  invariant(crossLaneRelationshipAdmission.localRuntime?.networkRequests === false && crossLaneRelationshipAdmission.localRuntime?.sourceObjectAcquisition === false && crossLaneRelationshipAdmission.localRuntime?.sourceFileUpload === false && crossLaneRelationshipAdmission.localRuntime?.persistentStorage === "none", "relationship proposal gate must remain browser-local and source-object-free");
  invariant(/cannot add a cross-lane edge.*create REG/i.test(crossLaneRelationshipAdmission.nonPromotionPolicy ?? "") && /does not inspect.*establish identity.*registration/i.test(crossLaneRelationshipAdmission.scientificBoundary ?? ""), "relationship proposal gate must forbid edge promotion, identity and REG");
  const sourceAdmissionGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-006");
  invariant(sourceAdmissionGate?.status === "in_progress" && /does not authenticate.*acquire or inspect.*create REG/i.test(sourceAdmissionGate?.scientificBoundary ?? ""), "UPG-006 must remain an implemented no-acquisition/no-REG admission review");
  invariant(publicSourceReleaseAdmissionService.schemaVersion === "0.1.0" && publicSourceReleaseAdmissionServiceSchema.properties?.schemaVersion?.const === publicSourceReleaseAdmissionService.schemaVersion, "public-source admission service schema must lock 0.1.0");
  invariant(publicSourceReleaseAdmissionService.catalogReleaseId === publicCatalog.releaseId && publicSourceReleaseAdmissionService.manifestComposerReleaseId === fileAdmissionComposer.releaseId && publicSourceReleaseAdmissionService.queueItemId === "UPG-006", "public-source admission service must lock the catalogue, composer and UPG-006");
  invariant(sameJson(publicSourceReleaseAdmissionService.supportedManifestFormats?.map((format) => [format.formatVersion, format.sourceId]), [["0.7.0", spinalj.id], ["0.8.0", cano.id]]), "public-source admission service must accept only frozen SpinalJ and Cano-Gomez metadata manifests");
  invariant(publicSourceReleaseAdmissionService.admissionDecision === "not_admitted_pending_curator_object_and_rights_review" && publicSourceReleaseAdmissionService.localRuntime?.networkRequests === false && publicSourceReleaseAdmissionService.localRuntime?.sourceFileDownload === false && publicSourceReleaseAdmissionService.localRuntime?.sourceFileUpload === false && publicSourceReleaseAdmissionService.localRuntime?.persistentStorage === "none", "public-source admission service must remain metadata-only, not-admitted and browser-local");
  invariant(publicSourceReleaseAdmissionService.reviewSemantics?.blockedActions?.includes("source_object_acquisition") && publicSourceReleaseAdmissionService.reviewSemantics?.blockedActions?.includes("registration") && /does not authenticate.*acquire or inspect.*create REG/i.test(publicSourceReleaseAdmissionService.scientificBoundary ?? ""), "public-source admission service must block acquisition and REG");
  const sourceAssertionGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-018");
  invariant(sourceAssertionGate?.status === "in_progress" && sameJson(sourceAssertionGate?.sourceIds, publicCatalog.sources.map((source) => source.id)) && /does not acquire.*source-to-project relationship.*REG/i.test(sourceAssertionGate?.scientificBoundary ?? ""), "UPG-018 must remain an implemented, non-promoting provenance-attribution composer");
  invariant(publicSourceAssertionProvenance.schemaVersion === "0.1.0" && publicSourceAssertionProvenanceSchema.properties?.schemaVersion?.const === publicSourceAssertionProvenance.schemaVersion, "assertion-provenance composer schema must lock 0.1.0");
  invariant(publicSourceAssertionProvenance.catalogReleaseId === publicCatalog.releaseId && publicSourceAssertionProvenance.admissionServiceReleaseId === publicSourceReleaseAdmissionService.releaseId && publicSourceAssertionProvenance.queueItemId === "UPG-018", "assertion-provenance composer must lock catalog, admission service and UPG-018");
  invariant(sameJson(publicSourceAssertionProvenance.assertionSourceStates, ["publisher_asserted", "curator_transcribed", "unresolved"]) && sameJson(publicSourceAssertionProvenance.subjectKinds, ["declared_unacquired_source_object", "unknown_source_object"]), "assertion-provenance composer must retain the allowed assertion states and subject kinds");
  invariant(publicSourceAssertionProvenance.nonPromotion?.admissionDecision === publicSourceReleaseAdmissionService.admissionDecision && publicSourceAssertionProvenance.nonPromotion?.verificationStatus === "not_locally_verified" && publicSourceAssertionProvenance.nonPromotion?.blockedActions?.includes("source_object_acquisition") && publicSourceAssertionProvenance.nonPromotion?.blockedActions?.includes("registration"), "assertion-provenance composer must remain unverified, not admitted and non-registering");
  invariant(publicSourceAssertionProvenance.localRuntime?.networkRequests === false && publicSourceAssertionProvenance.localRuntime?.sourceFileDownload === false && publicSourceAssertionProvenance.localRuntime?.sourceFileUpload === false && publicSourceAssertionProvenance.localRuntime?.persistentStorage === "none" && /does not authenticate.*acquire.*calculate a local checksum.*create REG/i.test(publicSourceAssertionProvenance.scientificBoundary ?? ""), "assertion-provenance composer must remain local without authentication, acquisition, local checksum or REG");
  const assetAuthorizationGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-019");
  invariant(assetAuthorizationGate?.status === "in_progress" && sameJson(assetAuthorizationGate?.sourceIds, publicCatalog.sources.map((source) => source.id)) && /does not authenticate.*authorize.*acquire.*create REG/i.test(assetAuthorizationGate?.scientificBoundary ?? ""), "UPG-019 must remain an implemented non-authorizing authorization plan");
  invariant(publicSourceAuthorizationPlan.schemaVersion === "0.1.0" && publicSourceAuthorizationPlanSchema.properties?.schemaVersion?.const === publicSourceAuthorizationPlan.schemaVersion, "authorization-plan composer schema must lock 0.1.0");
  invariant(publicSourceAuthorizationPlan.catalogReleaseId === publicCatalog.releaseId && publicSourceAuthorizationPlan.admissionServiceReleaseId === publicSourceReleaseAdmissionService.releaseId && publicSourceAuthorizationPlan.assertionProvenanceReleaseId === publicSourceAssertionProvenance.releaseId && publicSourceAuthorizationPlan.queueItemId === "UPG-019", "authorization-plan composer must lock catalog, predecessor releases and UPG-019");
  invariant(sameJson(publicSourceAuthorizationPlan.supportedManifestFormats?.map((format) => [format.formatVersion, format.sourceId]), [["0.7.0", spinalj.id], ["0.8.0", cano.id]]), "authorization-plan composer must retain exactly the two frozen manifest formats");
  invariant(publicSourceAuthorizationPlan.supportedManifestFormats?.every((format) => sameJson(format.requiredPlanStepIds, ["object_identity_confirmation", "object_specific_rights_review", "authorized_acquisition_record", "local_checksum_verification", "content_scope_validation"])), "authorization-plan composer must retain every planned stage");
  invariant(sameJson(publicSourceAuthorizationPlan.requestedRightsDispositions, ["unresolved", "request_independent_rights_review", "decline_acquisition"]) && publicSourceAuthorizationPlan.nonPromotion?.planStatus === "authorization_and_verification_plan_only" && publicSourceAuthorizationPlan.nonPromotion?.authorizationStatus === "not_authorized_by_this_plan" && publicSourceAuthorizationPlan.nonPromotion?.verificationStatus === "not_locally_verified", "authorization-plan composer must neither grant rights nor locally verify an object");
  invariant(publicSourceAuthorizationPlan.nonPromotion?.blockedActions?.includes("source_object_acquisition") && publicSourceAuthorizationPlan.nonPromotion?.blockedActions?.includes("local_checksum_calculation") && publicSourceAuthorizationPlan.nonPromotion?.blockedActions?.includes("content_inspection") && publicSourceAuthorizationPlan.nonPromotion?.blockedActions?.includes("registration"), "authorization-plan composer must block acquisition, local checksum execution, inspection and REG");
  invariant(publicSourceAuthorizationPlan.localRuntime?.networkRequests === false && publicSourceAuthorizationPlan.localRuntime?.sourceFileDownload === false && publicSourceAuthorizationPlan.localRuntime?.sourceFileUpload === false && publicSourceAuthorizationPlan.localRuntime?.persistentStorage === "none" && /does not authenticate.*authorize.*acquire.*hash.*create REG/i.test(publicSourceAuthorizationPlan.scientificBoundary ?? ""), "authorization-plan composer must remain browser-local and non-promoting");
  const authorizationEvidenceGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-020");
  invariant(authorizationEvidenceGate?.status === "in_progress" && sameJson(authorizationEvidenceGate?.sourceIds, publicCatalog.sources.map((source) => source.id)) && /does not authenticate.*authorize.*acquire.*retain.*create REG/i.test(authorizationEvidenceGate?.scientificBoundary ?? ""), "UPG-020 must remain an implemented, non-authorizing independent-evidence composer");
  invariant(publicSourceIndependentAuthorizationEvidence.schemaVersion === "0.1.0" && publicSourceIndependentAuthorizationEvidenceSchema.properties?.schemaVersion?.const === publicSourceIndependentAuthorizationEvidence.schemaVersion, "independent-evidence composer schema must lock 0.1.0");
  invariant(publicSourceIndependentAuthorizationEvidence.catalogReleaseId === publicCatalog.releaseId && publicSourceIndependentAuthorizationEvidence.admissionServiceReleaseId === publicSourceReleaseAdmissionService.releaseId && publicSourceIndependentAuthorizationEvidence.assertionProvenanceReleaseId === publicSourceAssertionProvenance.releaseId && publicSourceIndependentAuthorizationEvidence.authorizationPlanReleaseId === publicSourceAuthorizationPlan.releaseId && publicSourceIndependentAuthorizationEvidence.queueItemId === "UPG-020", "independent-evidence composer must lock catalog, predecessor releases and UPG-020");
  invariant(sameJson(publicSourceIndependentAuthorizationEvidence.supportedManifestFormats?.map((format) => [format.formatVersion, format.sourceId]), [["0.7.0", spinalj.id], ["0.8.0", cano.id]]) && publicSourceIndependentAuthorizationEvidence.supportedManifestFormats?.every((format) => sameJson(format.requiredReviewStageIds, ["authority_identity_confirmation", "object_specific_terms_scope_review", "authorized_retrieval_conditions", "local_integrity_comparison", "content_scope_retention_review"])), "independent-evidence composer must retain the two frozen formats and all five planned review stages");
  invariant(sameJson(publicSourceIndependentAuthorizationEvidence.evidenceRecordStates, ["review_request_prepared", "external_evidence_declared_not_authenticated", "execution_declined", "unresolved"]) && publicSourceIndependentAuthorizationEvidence.nonPromotion?.packetStatus === "independent_authorization_evidence_packet_draft_only" && publicSourceIndependentAuthorizationEvidence.nonPromotion?.authorityStatus === "not_authenticated_by_this_packet" && publicSourceIndependentAuthorizationEvidence.nonPromotion?.executionStatus === "not_executed_pending_independent_authorization" && publicSourceIndependentAuthorizationEvidence.nonPromotion?.verificationStatus === "not_locally_verified", "independent-evidence composer must neither authenticate authority nor execute acquisition");
  invariant(publicSourceIndependentAuthorizationEvidence.nonPromotion?.blockedActions?.includes("source_object_acquisition") && publicSourceIndependentAuthorizationEvidence.nonPromotion?.blockedActions?.includes("credential_storage") && publicSourceIndependentAuthorizationEvidence.nonPromotion?.blockedActions?.includes("data_retention") && publicSourceIndependentAuthorizationEvidence.nonPromotion?.blockedActions?.includes("registration"), "independent-evidence composer must block acquisition, credentials, retention and REG");
  invariant(publicSourceIndependentAuthorizationEvidence.localRuntime?.networkRequests === false && publicSourceIndependentAuthorizationEvidence.localRuntime?.sourceFileDownload === false && publicSourceIndependentAuthorizationEvidence.localRuntime?.sourceFileUpload === false && publicSourceIndependentAuthorizationEvidence.localRuntime?.persistentStorage === "none" && /does not authenticate.*authorize.*acquire.*retain.*create REG/i.test(publicSourceIndependentAuthorizationEvidence.scientificBoundary ?? ""), "independent-evidence composer must remain browser-local and non-promoting");
  const executionGate = publicCatalog.upgradeQueue.find((item) => item.id === "UPG-021");
  invariant(executionGate?.status === "research_watch" && sameJson(executionGate?.sourceIds, publicCatalog.sources.map((source) => source.id)) && /does not authenticate authorization.*acquire.*retain.*create REG/i.test(executionGate?.scientificBoundary ?? ""), "UPG-021 must remain a separately approved execution research watch");
  const expectedCoverageAxes = ["type_taxonomy", "region_lamina_context", "life_stage", "injury_state", "spatial_measurement", "causal_mechanism", "morphology"];
  const expectedCoverageLanes = ["russ-2021", "haring-2018", "sathyamurthy-2018", "hayashi-2018", "delile-2019", "tabulae-paralytica-2024", "iglesias-gonzalez-2021"];
  invariant(interneuronKnowledgeCoverage.schemaVersion === "0.1.0" && interneuronKnowledgeCoverageSchema.properties?.schemaVersion?.const === interneuronKnowledgeCoverage.schemaVersion, "interneuron knowledge coverage schema must lock 0.1.0");
  invariant(interneuronKnowledgeCoverage.releaseId === "ohri-interneuron-knowledge-coverage-0.1.0", "interneuron knowledge coverage release identity is invalid");
  invariant(interneuronKnowledgeCoverage.releaseDate === "2026-09-02", "interneuron knowledge coverage must retain the current research release date");
  invariant(interneuronKnowledgeCoverage.coordinateAuthority === "SOURCE_LOCAL_METADATA_ONLY" && interneuronKnowledgeCoverage.projectRegistrationCount === 0, "interneuron knowledge coverage must remain source-local metadata with 0 REG");
  invariant(sameJson(interneuronKnowledgeCoverage.axes?.map((axis) => axis.id), expectedCoverageAxes), "interneuron knowledge coverage must retain all seven precision axes in order");
  invariant(sameJson(interneuronKnowledgeCoverage.lanes?.map((lane) => lane.id), expectedCoverageLanes), "interneuron knowledge coverage must retain all seven source lanes in order");
  invariant(interneuronKnowledgeCoverage.lanes.every((lane) => lane.crossStudyMappingStatus === "not_established" && lane.coordinateAuthority === "SOURCE_LOCAL_ONLY" && lane.projectRegistrationCount === 0 && lane.assetAccess?.sourceObjectsBundled === false && lane.assetAccess?.assetLevelReuseStatus === "not_assumed"), "knowledge-coverage lanes must remain unjoined, source-local, unbundled and unregistered");
  invariant(interneuronKnowledgeCoverage.lanes.every((lane) => sameJson(lane.coverage?.map((entry) => entry.axisId), expectedCoverageAxes) && lane.coverage.find((entry) => entry.axisId === "morphology")?.status === "not_measured"), "knowledge-coverage lanes must evaluate seven axes without morphology promotion");
  const coverageJudgments = interneuronKnowledgeCoverage.lanes.flatMap((lane) =>
    lane.coverage.map((entry) => ({ laneId: lane.id, ...entry })),
  );
  invariant(coverageJudgments.length === 49, "knowledge coverage must retain exactly 49 source-by-axis judgments");
  invariant(coverageJudgments.every((entry) => typeof entry.sourceLocator === "string" && entry.sourceLocator.trim().length >= 20), "all 49 knowledge-coverage judgments must retain publication locators");
  for (const expected of EXPECTED_COVERAGE_LOCATOR_CORRECTIONS) {
    const actual = coverageJudgments.find((entry) => entry.laneId === expected.laneId && entry.axisId === expected.axisId);
    invariant(actual?.sourceLocator === expected.sourceLocator, `audited source locator drifted for ${expected.laneId}:${expected.axisId}`);
  }
  const directCausalLanes = interneuronKnowledgeCoverage.lanes.filter((lane) => lane.coverage.find((entry) => entry.axisId === "causal_mechanism")?.status === "direct");
  const tabulaeCoverageLane = interneuronKnowledgeCoverage.lanes.find((lane) => lane.id === "tabulae-paralytica-2024");
  const tabulaeCausalCoverage = tabulaeCoverageLane?.coverage.find((entry) => entry.axisId === "causal_mechanism");
  invariant(sameJson(directCausalLanes.map((lane) => lane.id), ["tabulae-paralytica-2024"]), "only Tabulae may retain source-bounded direct causal coverage");
  invariant(tabulaeCausalCoverage?.status === "direct" && /AAV-DTR.*two weeks before complete crush SCI.*diphtheria toxin.*at eight weeks.*ablate thoracic Vsx2ON neurons.*prevented natural walking recovery/i.test(tabulaeCausalCoverage.evidence ?? "") && /Extended Data Fig\. 3j.?l.*AAV-DTR two weeks before complete crush SCI.*diphtheria toxin at eight weeks.*Supplementary Video 2.*prevents natural recovery of walking/i.test(tabulaeCausalCoverage.sourceLocator ?? "") && /specific to its Vsx2ON definition.*vector and toxin timing.*does not establish causality for every source label.*Russ population.*project entity/i.test(tabulaeCausalCoverage.displayBoundary ?? ""), "Tabulae direct causal coverage must remain experiment-specific and non-transferable");
  invariant(tabulaeCoverageLane?.coverage.find((entry) => entry.axisId === "type_taxonomy")?.status === "not_ingested", "Tabulae type taxonomy must remain not_ingested");
  invariant(interneuronKnowledgeCoverage.hardBoundaries?.some((boundary) => /cross-study mapping.*not_established/i.test(boundary)) && interneuronKnowledgeCoverage.hardBoundaries?.some((boundary) => /No morphology may be synthesized as observed evidence/i.test(boundary)), "knowledge-coverage hard boundaries must forbid cross-study identity and fabricated observed morphology");
  invariant(curatorFeedbackContract.schemaVersion === "2.8.0", "curator feedback contract schemaVersion must be 2.8.0");
  invariant(curatorFeedbackContractSchema.properties?.schemaVersion?.const === curatorFeedbackContract.schemaVersion, "curator feedback schema must lock the current schemaVersion");
  invariant(curatorFeedbackContract.feedbackSchemaVersion === "2.8.0", "curator feedback payload schema must be 2.8.0");
  invariant(curatorFeedbackContract.distributionVersion === "2.8.0-curator.1", "curator feedback distribution version must be 2.8.0-curator.1");
  invariant(curatorFeedbackContract.workbenchReleaseId === "ohri-mouse-interneuron-public-data-workbench-2.8.0", "curator feedback contract must name the current workbench release");
  invariant(curatorFeedbackContract.maximumFileBytes === 2097152 && curatorFeedbackContract.maximumFeedbackRecords === 10, "curator feedback contract limits must be fixed");
  invariant(curatorFeedbackContract.minimumIndependentCuratorsForComparison === 2, "curator feedback contract must require two records for comparison");
  invariant(curatorFeedbackContract.privacy === "Created locally; not uploaded.", "curator feedback privacy boundary must remain local-only");
  const feedbackKeys = [...curatorFeedbackContract.requiredResponseKeys, ...curatorFeedbackContract.optionalResponseKeys];
  invariant(new Set(feedbackKeys).size === feedbackKeys.length, "curator feedback response keys must be unique");
  for (const key of ["curator_id", "zip_verified", "zip_sha256", "overall_verdict", "attestation"]) {
    invariant(curatorFeedbackContract.requiredResponseKeys.includes(key), "curator feedback required response key is missing: " + key);
  }
  invariant(curatorAdjudicationContract.schemaVersion === "2.8.0", "curator adjudication contract schemaVersion must be 2.8.0");
  invariant(curatorAdjudicationContractSchema.properties?.schemaVersion?.const === curatorAdjudicationContract.schemaVersion, "curator adjudication schema must lock the current schemaVersion");
  invariant(curatorAdjudicationContract.adjudicationSchemaVersion === "1.0.0", "curator adjudication payload schema must be 1.0.0");
  invariant(curatorAdjudicationContract.feedbackSchemaVersion === curatorFeedbackContract.feedbackSchemaVersion, "adjudication must consume the matching feedback schema");
  invariant(curatorAdjudicationContract.distributionVersion === curatorFeedbackContract.distributionVersion, "adjudication must consume the matching curator distribution");
  invariant(curatorAdjudicationContract.workbenchReleaseId === curatorFeedbackContract.workbenchReleaseId, "adjudication must name the matching workbench release");
  invariant(curatorAdjudicationContract.minimumIndependentCurators === curatorFeedbackContract.minimumIndependentCuratorsForComparison, "adjudication must require the same independent curator minimum");
  invariant(curatorAdjudicationContract.maximumPacketBytes === curatorFeedbackContract.maximumFileBytes && curatorAdjudicationContract.readOnlyPacketImport === true, "adjudication must expose bounded read-only packet verification");
  invariant(sameJson(curatorAdjudicationContract.permittedDispositions, ["defer_pending_evidence", "return_for_revision", "recommend_next_private_review"]), "adjudication dispositions must stay non-promoting");
  invariant(/cannot change evidence.*authenticate an authorization decision.*authorize data access.*retain data.*align reference anatomy.*molecular type.*morphology.*SCI evidence lanes.*cross-study identity or morphology join.*external provenance package.*create a registration/i.test(curatorAdjudicationContract.boundary), "adjudication boundary must forbid evidence changes, lane joins, authorization authentication, retention, provenance packaging and registration");

  for (const [key, expected] of Object.entries(EXPECTED_ATLAS)) {
    invariant(sameJson(atlas[key], expected), `atlas ${key} differs from the Research MVP 0.2 contract`);
  }
  invariant(atlas.displayTransformUse === "visualization_only_not_cell_registration", "atlas display transform must not imply registration");
  invariant(Array.isArray(atlas.sampledZIndices) && atlas.sampledZIndices.length === 15, "reference anatomy must retain exactly 15 native sampled planes");
  invariant(atlas.geometryStatus === "INF" && researchRelease.spatialContract?.measurementAllowed === false, "reference anatomy must remain INF and measurement-forbidden");
  invariant(atlas.files?.some((file) => file.path === "atlas-contours.json" && /^[0-9a-f]{64}$/.test(file.sha256 ?? "")), "reference anatomy must retain the checksum-locked contour payload");
  invariant(
    atlas.registrationError?.value === null && atlas.registrationError?.missingReason === "not_applicable",
    "atlas registration error must remain null/not_applicable",
  );

  const atlasInput = inputById.get("atlasAssetManifest");
  const morphologyInput = inputById.get("morphologyAssetManifest");
  const researchAtlas = researchRelease.assets?.find((asset) => asset.assetType === "reference_atlas");
  const researchMorphology = researchRelease.assets?.find((asset) => asset.assetType === "swc_morphology");
  invariant(researchAtlas?.checksum === atlasInput.sha256, "research release atlas checksum does not match its asset manifest");
  invariant(researchAtlas?.spatialStatus === "INF", "research release atlas status must be INF");
  invariant(
    researchMorphology?.checksum === morphologyInput.sha256,
    "research release morphology checksum does not match its asset manifest",
  );
  invariant(researchMorphology?.spatialStatus === "OBS", "research release morphology status must be OBS");

  invariant(/not a representative sample/i.test(morphology.selection ?? ""), "morphology selection must disclaim representativeness");
  invariant(morphology.release === "8.6.124", "NeuroMorpho release must be 8.6.124");
  invariant(Array.isArray(morphology.records) && morphology.records.length === 5, "exactly five morphology exemplars are required");
  invariant(
    sameJson(
      morphology.records.map((record) => record.neuronId),
      EXPECTED_NEURON_IDS,
    ),
    "NeuroMorpho exemplar IDs differ from the pinned set",
  );
  for (const record of morphology.records) {
    invariant(record.geometryStatus === "OBS", `NeuroMorpho:${record.neuronId} must remain OBS`);
    invariant(record.registrationStatus === "unregistered", `NeuroMorpho:${record.neuronId} must remain unregistered`);
    invariant(record.atlasTransform?.value === null, `NeuroMorpho:${record.neuronId} must have a null atlas transform`);
    invariant(/local_frame/i.test(record.sourceFrame ?? ""), `NeuroMorpho:${record.neuronId} must remain in a local frame`);
  }
}

export async function buildReleaseManifest({
  projectRoot = PROJECT_ROOT,
  scientificAuthorityRoot = resolve(projectRoot, "../interneuron_sci_review"),
} = {}) {
  const roots = productionRoots(projectRoot, scientificAuthorityRoot);
  const authoritativeInputs = await Promise.all(REQUIRED_INPUT_SPECS.map((spec) => describeInput(spec, roots)));
  const inputById = new Map(authoritativeInputs.map((input) => [input.id, input]));
  const [researchRelease, schema, publicCatalog, publicCatalogSchema, russTaxonomyCrosswalk, russTaxonomyCrosswalkSchema, russReconciliationDossier, russReconciliationDossierSchema, tabulaeConditionCatalog, tabulaeConditionCatalogSchema, tabulaeSpatialLocalSession, tabulaeSpatialLocalSessionSchema, tabulaeSpatialLocalComparison, tabulaeSpatialLocalComparisonSchema, spinaljIntake, intakeSchema, intakeRegistry, intakeRegistrySchema, fileAdmissionManifestSchema, fileAdmissionPreflight, fileAdmissionPreflightSchema, canoFileAdmissionManifestSchema, canoFileAdmissionPreflight, canoFileAdmissionPreflightSchema, fileAdmissionComposer, fileAdmissionComposerSchema, publicProvenanceCrate, publicProvenanceCrateSchema, evidenceFeasibilityPlanner, evidenceFeasibilityPlannerSchema, evidenceProvenanceTrace, evidenceProvenanceTraceSchema, crossLaneRelationshipAdmission, crossLaneRelationshipAdmissionSchema, publicSourceReleaseAdmissionService, publicSourceReleaseAdmissionServiceSchema, publicSourceAssertionProvenance, publicSourceAssertionProvenanceSchema, publicSourceAuthorizationPlan, publicSourceAuthorizationPlanSchema, publicSourceIndependentAuthorizationEvidence, publicSourceIndependentAuthorizationEvidenceSchema, interneuronKnowledgeCoverage, interneuronKnowledgeCoverageSchema, curatorFeedbackContract, curatorFeedbackContractSchema, curatorAdjudicationContract, curatorAdjudicationContractSchema, atlas, atlasInternalCompartments, morphology, packageLock] = await Promise.all([
    readJsonInput(inputSpec("researchRelease"), roots),
    readJsonInput(inputSpec("researchReleaseSchema"), roots),
    readJsonInput(inputSpec("publicDataCatalog"), roots),
    readJsonInput(inputSpec("publicDataCatalogSchema"), roots),
    readJsonInput(inputSpec("russTaxonomyCrosswalk"), roots),
    readJsonInput(inputSpec("russTaxonomyCrosswalkSchema"), roots),
    readJsonInput(inputSpec("russReconciliationDossier"), roots),
    readJsonInput(inputSpec("russReconciliationDossierSchema"), roots),
    readJsonInput(inputSpec("tabulaeConditionCatalog"), roots),
    readJsonInput(inputSpec("tabulaeConditionCatalogSchema"), roots),
    readJsonInput(inputSpec("tabulaeSpatialLocalSession"), roots),
    readJsonInput(inputSpec("tabulaeSpatialLocalSessionSchema"), roots),
    readJsonInput(inputSpec("tabulaeSpatialLocalComparison"), roots),
    readJsonInput(inputSpec("tabulaeSpatialLocalComparisonSchema"), roots),
    readJsonInput(inputSpec("spinaljMetadataIntake"), roots),
    readJsonInput(inputSpec("publicSourceIntakeSchema"), roots),
    readJsonInput(inputSpec("publicSourceIntakeRegistry"), roots),
    readJsonInput(inputSpec("publicSourceIntakeRegistrySchema"), roots),
    readJsonInput(inputSpec("fileAdmissionManifestSchema"), roots),
    readJsonInput(inputSpec("fileAdmissionPreflight"), roots),
    readJsonInput(inputSpec("fileAdmissionPreflightSchema"), roots),
    readJsonInput(inputSpec("canoFileAdmissionManifestSchema"), roots),
    readJsonInput(inputSpec("canoFileAdmissionPreflight"), roots),
    readJsonInput(inputSpec("canoFileAdmissionPreflightSchema"), roots),
    readJsonInput(inputSpec("fileAdmissionComposer"), roots),
    readJsonInput(inputSpec("fileAdmissionComposerSchema"), roots),
    readJsonInput(inputSpec("publicProvenanceCrate"), roots),
    readJsonInput(inputSpec("publicProvenanceCrateSchema"), roots),
    readJsonInput(inputSpec("evidenceFeasibilityPlanner"), roots),
    readJsonInput(inputSpec("evidenceFeasibilityPlannerSchema"), roots),
    readJsonInput(inputSpec("evidenceProvenanceTrace"), roots),
    readJsonInput(inputSpec("evidenceProvenanceTraceSchema"), roots),
    readJsonInput(inputSpec("crossLaneRelationshipAdmission"), roots),
    readJsonInput(inputSpec("crossLaneRelationshipAdmissionSchema"), roots),
    readJsonInput(inputSpec("publicSourceReleaseAdmissionService"), roots),
    readJsonInput(inputSpec("publicSourceReleaseAdmissionServiceSchema"), roots),
    readJsonInput(inputSpec("publicSourceAssertionProvenance"), roots),
    readJsonInput(inputSpec("publicSourceAssertionProvenanceSchema"), roots),
    readJsonInput(inputSpec("publicSourceAuthorizationPlan"), roots),
    readJsonInput(inputSpec("publicSourceAuthorizationPlanSchema"), roots),
    readJsonInput(inputSpec("publicSourceIndependentAuthorizationEvidence"), roots),
    readJsonInput(inputSpec("publicSourceIndependentAuthorizationEvidenceSchema"), roots),
    readJsonInput(inputSpec("interneuronKnowledgeCoverage"), roots),
    readJsonInput(inputSpec("interneuronKnowledgeCoverageSchema"), roots),
    readJsonInput(inputSpec("curatorFeedbackContract"), roots),
    readJsonInput(inputSpec("curatorFeedbackContractSchema"), roots),
    readJsonInput(inputSpec("curatorAdjudicationContract"), roots),
    readJsonInput(inputSpec("curatorAdjudicationContractSchema"), roots),
    readJsonInput(inputSpec("atlasAssetManifest"), roots),
    readJsonInput(inputSpec("atlasInternalCompartments"), roots),
    readJsonInput(inputSpec("morphologyAssetManifest"), roots),
    readJsonInput(inputSpec("packageLock"), roots),
  ]);

  const internalCompartmentReport = validateAtlasInternalCompartments(atlasInternalCompartments);
  const internalCompartmentInput = inputById.get("atlasInternalCompartments");
  const internalCompartmentFile = atlas.files?.find(
    (file) => file.path === "atlas-internal-compartments.json",
  );
  const missingInternalPlanes = atlasInternalCompartments.structures.flatMap((structure) =>
    structure.planes
      .filter((plane) => plane.presence === "missing")
      .map((plane) => ({
        structureIdentifier: structure.identifier,
        structureName: structure.name,
        zIndex: plane.zIndex,
        missingReason: plane.missingReason,
      })),
  );
  invariant(
    atlasInternalCompartments.assetId === "allen_cord_20um:3.0:internal-compartments-v1" &&
      atlasInternalCompartments.sourceAtlasAssetId === atlas.assetId,
    "internal compartments must remain attached to the pinned atlas derivative",
  );
  invariant(
    sameJson(internalCompartmentReport.structureIdentifiers, [90, 100, 110, 16, 74, 75, 70]) &&
      internalCompartmentReport.sampledPlaneCount === 15 &&
      internalCompartmentReport.totalComponents === 408 &&
      internalCompartmentReport.totalPolygons === 408 &&
      internalCompartmentReport.missingPlaneCount === 1,
    "internal compartments must retain seven source IDs, 15 planes, 408 components/polygons and one explicit missing plane",
  );
  invariant(
    sameJson(missingInternalPlanes, [{
      structureIdentifier: 74,
      structureName: "Dorsal funiculus",
      zIndex: 1470,
      missingReason: "source_mask_absent_at_sampled_plane",
    }]),
    "internal compartments must preserve dorsal funiculus ID 74 at z1470 as explicitly missing",
  );
  invariant(
    atlas.derivedInternalCompartments?.path === "atlas-internal-compartments.json" &&
      atlas.derivedInternalCompartments?.geometryStatus === "INF" &&
      atlas.derivedInternalCompartments?.measurementUse === "forbidden" &&
      atlas.derivedInternalCompartments?.registrationCount === 0 &&
      atlas.derivedInternalCompartments?.componentConnectivity === 4 &&
      atlas.derivedInternalCompartments?.disconnectedComponents === "preserved_never_bridged" &&
      sameJson(
        atlas.derivedInternalCompartments?.targetStructureIdentifiers,
        internalCompartmentReport.structureIdentifiers,
      ),
    "atlas manifest must retain the exact internal-compartment derivative boundary",
  );
  invariant(
    internalCompartmentFile?.sha256 === internalCompartmentInput.sha256 &&
      internalCompartmentFile?.bytes === internalCompartmentInput.bytes &&
      internalCompartmentFile?.geometryStatus === "INF" &&
      internalCompartmentFile?.measurementUse === "forbidden" &&
      internalCompartmentFile?.registrationCount === 0,
    "atlas manifest internal-compartment receipt must match the direct release input",
  );

  assertSourceContracts(researchRelease, schema, publicCatalog, publicCatalogSchema, russTaxonomyCrosswalk, russTaxonomyCrosswalkSchema, russReconciliationDossier, russReconciliationDossierSchema, tabulaeConditionCatalog, tabulaeConditionCatalogSchema, tabulaeSpatialLocalSession, tabulaeSpatialLocalSessionSchema, tabulaeSpatialLocalComparison, tabulaeSpatialLocalComparisonSchema, spinaljIntake, intakeSchema, intakeRegistry, intakeRegistrySchema, fileAdmissionManifestSchema, fileAdmissionPreflight, fileAdmissionPreflightSchema, canoFileAdmissionManifestSchema, canoFileAdmissionPreflight, canoFileAdmissionPreflightSchema, fileAdmissionComposer, fileAdmissionComposerSchema, publicProvenanceCrate, publicProvenanceCrateSchema, evidenceFeasibilityPlanner, evidenceFeasibilityPlannerSchema, evidenceProvenanceTrace, evidenceProvenanceTraceSchema, crossLaneRelationshipAdmission, crossLaneRelationshipAdmissionSchema, publicSourceReleaseAdmissionService, publicSourceReleaseAdmissionServiceSchema, publicSourceAssertionProvenance, publicSourceAssertionProvenanceSchema, publicSourceAuthorizationPlan, publicSourceAuthorizationPlanSchema, publicSourceIndependentAuthorizationEvidence, publicSourceIndependentAuthorizationEvidenceSchema, interneuronKnowledgeCoverage, interneuronKnowledgeCoverageSchema, curatorFeedbackContract, curatorFeedbackContractSchema, curatorAdjudicationContract, curatorAdjudicationContractSchema, atlas, morphology, inputById);
  const coverageCausalMechanismStatuses = interneuronKnowledgeCoverage.lanes.map((lane) => ({
    laneId: lane.id,
    status: lane.coverage.find((entry) => entry.axisId === "causal_mechanism").status,
  }));
  const coverageDirectCausalLaneIds = coverageCausalMechanismStatuses
    .filter((entry) => entry.status === "direct")
    .map((entry) => entry.laneId);
  const coverageSourceLocatorCount = interneuronKnowledgeCoverage.lanes.reduce(
    (count, lane) => count + lane.coverage.filter((entry) => typeof entry.sourceLocator === "string" && entry.sourceLocator.trim().length >= 20).length,
    0,
  );
  const tabulaeDirectCausalBoundary = interneuronKnowledgeCoverage.lanes
    .find((lane) => lane.id === "tabulae-paralytica-2024")
    .coverage.find((entry) => entry.axisId === "causal_mechanism").displayBoundary;
  const rootPackage = packageLock.packages?.[""];
  invariant(typeof rootPackage?.name === "string" && typeof rootPackage?.version === "string", "package-lock root package metadata is incomplete");
  invariant(typeof rootPackage.engines?.node === "string", "package-lock root package must declare a Node requirement");

  const manifest = {
    manifestSchemaVersion: "1.0.0",
    releaseId: "ohri-mouse-interneuron-public-data-workbench-2.8.0",
    releaseDate: interneuronKnowledgeCoverage.releaseDate,
    releaseStatus: "localhost_candidate",
    application: {
      name: rootPackage.name,
      version: rootPackage.version,
      runtime: {
        nodeRequirement: rootPackage.engines.node,
        packageLockVersion: packageLock.lockfileVersion,
        react: lockedPackageVersion(packageLock, "react"),
        reactDom: lockedPackageVersion(packageLock, "react-dom"),
        three: lockedPackageVersion(packageLock, "three"),
        typescript: lockedPackageVersion(packageLock, "typescript"),
        vinext: lockedPackageVersion(packageLock, "vinext"),
        vite: lockedPackageVersion(packageLock, "vite"),
        wrangler: lockedPackageVersion(packageLock, "wrangler"),
      },
    },
    publicDataWorkbench: {
      schemaVersion: publicCatalog.schemaVersion,
      scientificInputPolicy: publicCatalog.scientificInputPolicy,
      institutionalExperimentalDataUsed: publicCatalog.institutionalExperimentalDataUsed,
      networkAtReviewRuntime: publicCatalog.networkAtReviewRuntime,
      sourceCount: publicCatalog.sources.length,
      bundledLocalSourceCount: publicCatalog.sources.filter((source) => source.admissionStatus === "bundled_local").length,
      metadataAuditSourceCount: publicCatalog.sources.filter((source) => source.admissionStatus === "ready_for_metadata_audit").length,
      metadataAuditedSourceCount: publicCatalog.sources.filter((source) => source.admissionStatus === "metadata_audited").length,
      adapterSourceCount: publicCatalog.sources.filter((source) => source.admissionStatus === "ready_for_adapter").length,
      upgradeQueueCount: publicCatalog.upgradeQueue.length,
      sourceCatalogInputId: "publicDataCatalog",
      sourceCatalogSchemaInputId: "publicDataCatalogSchema",
      publicSourceIntakeInputId: "spinaljMetadataIntake",
      publicSourceIntakeSchemaInputId: "publicSourceIntakeSchema",
      spinaljMetadataAdmission: spinaljIntake.admission.status,
      spinaljDownloadedCandidateFileCount: spinaljIntake.acquisition.fileHashes.length,
      intakeRegistry: {
        releaseId: intakeRegistry.releaseId,
        schemaVersion: intakeRegistry.schemaVersion,
        intakeCount: intakeRegistry.records.length,
        inputId: "publicSourceIntakeRegistry",
        schemaInputId: "publicSourceIntakeRegistrySchema",
        downloadedCandidateFileCount: intakeRegistry.records.reduce((count, intake) => count + intake.acquisition.fileHashes.length, 0),
        objectHeaderInventoryCount: intakeRegistry.records.reduce((count, intake) => count + intake.objectInventory.objects.length, 0),
      },
      fileAdmissionPreflight: {
        formatVersion: fileAdmissionPreflight.formatVersion,
        preflightId: fileAdmissionPreflight.preflightId,
        sourceId: fileAdmissionPreflight.sourceId,
        status: fileAdmissionPreflight.status,
        automaticDownload: fileAdmissionPreflight.automaticDownload,
        credentialStorage: fileAdmissionPreflight.credentialStorage,
        candidateFilesAccepted: fileAdmissionPreflight.candidateFilesAccepted,
        sourceChecksumAlgorithms: fileAdmissionManifestSchema.$defs.sourceChecksum.properties.algorithm.enum,
        localSha256AtPreflight: fileAdmissionManifestSchema.$defs.file.properties.localSha256.const,
        manifestSchemaInputId: "fileAdmissionManifestSchema",
        preflightInputId: "fileAdmissionPreflight",
        preflightSchemaInputId: "fileAdmissionPreflightSchema",
      },
      canoSpecimenPreflight: { formatVersion: canoFileAdmissionPreflight.formatVersion, preflightId: canoFileAdmissionPreflight.preflightId, sourceId: canoFileAdmissionPreflight.sourceId, status: canoFileAdmissionPreflight.status, candidateFilesAccepted: canoFileAdmissionPreflight.candidateFilesAccepted, automaticDownload: canoFileAdmissionPreflight.automaticDownload, credentialStorage: canoFileAdmissionPreflight.credentialStorage, manifestSchemaInputId: "canoFileAdmissionManifestSchema", preflightInputId: "canoFileAdmissionPreflight", preflightSchemaInputId: "canoFileAdmissionPreflightSchema" },
      fileAdmissionComposer: {
        releaseId: fileAdmissionComposer.releaseId,
        schemaVersion: fileAdmissionComposer.schemaVersion,
        sourceIds: fileAdmissionComposer.publicSourceIds,
        supportedFormatVersions: fileAdmissionComposer.supportedManifestFormats.map((format) => format.formatVersion),
        manifestSchemaPaths: fileAdmissionComposer.supportedManifestFormats.map((format) => format.schemaPath),
        fixedAdmissionDecision: fileAdmissionComposer.supportedManifestFormats[0].fixedAdmissionDecision,
        fixedLocalSha256: fileAdmissionComposer.supportedManifestFormats[0].fixedLocalSha256,
        automaticRemoteAcquisition: fileAdmissionComposer.localRuntime.automaticRemoteAcquisition,
        sourceFileUpload: fileAdmissionComposer.localRuntime.sourceFileUpload,
        credentialStorage: fileAdmissionComposer.localRuntime.credentialStorage,
        persistence: fileAdmissionComposer.localRuntime.persistentStorage,
        localHashCalculation: fileAdmissionComposer.localRuntime.localHashCalculation,
        output: fileAdmissionComposer.localRuntime.output,
        nextQueueItems: fileAdmissionComposer.nextQueueItems,
        inputId: "fileAdmissionComposer",
        schemaInputId: "fileAdmissionComposerSchema",
      },
      detachedProvenanceCrate: {
        releaseId: publicProvenanceCrate.releaseId,
        schemaVersion: publicProvenanceCrate.schemaVersion,
        roCrateVersion: publicProvenanceCrate.roCrateVersion,
        packagingMode: publicProvenanceCrate.packagingMode,
        sourceIds: publicProvenanceCrate.publicSourceIds,
        networkRequests: publicProvenanceCrate.localRuntime.networkRequests,
        sourceFileDownload: publicProvenanceCrate.localRuntime.sourceFileDownload,
        sourceFileUpload: publicProvenanceCrate.localRuntime.sourceFileUpload,
        persistence: publicProvenanceCrate.localRuntime.persistentStorage,
        localHashCalculation: publicProvenanceCrate.localRuntime.localHashCalculation,
        inputId: "publicProvenanceCrate",
        schemaInputId: "publicProvenanceCrateSchema",
      },
      evidenceFeasibilityPlanner: {
        releaseId: evidenceFeasibilityPlanner.releaseId,
        schemaVersion: evidenceFeasibilityPlanner.schemaVersion,
        selectedAxisLimit: evidenceFeasibilityPlanner.selectedAxisLimit,
        axisCount: evidenceFeasibilityPlanner.axes.length,
        routeCount: evidenceFeasibilityPlanner.routes.length,
        sourceIds: evidenceFeasibilityPlanner.publicSourceIds,
        unqualifiedAxisIds: evidenceFeasibilityPlanner.axes.filter((axis) => !evidenceFeasibilityPlanner.routes.some((route) => route.supportedAxisIds.includes(axis.id))).map((axis) => axis.id),
        networkRequests: evidenceFeasibilityPlanner.localRuntime.networkRequests,
        sourceFileDownload: evidenceFeasibilityPlanner.localRuntime.sourceFileDownload,
        sourceFileUpload: evidenceFeasibilityPlanner.localRuntime.sourceFileUpload,
        persistence: evidenceFeasibilityPlanner.localRuntime.persistentStorage,
        output: evidenceFeasibilityPlanner.localRuntime.output,
        inputId: "evidenceFeasibilityPlanner",
        schemaInputId: "evidenceFeasibilityPlannerSchema",
      },
      evidenceProvenanceTrace: {
        releaseId: evidenceProvenanceTrace.releaseId,
        schemaVersion: evidenceProvenanceTrace.schemaVersion,
        researchReleaseId: evidenceProvenanceTrace.researchReleaseId,
        catalogReleaseId: evidenceProvenanceTrace.catalogReleaseId,
        plannerReleaseId: evidenceProvenanceTrace.plannerReleaseId,
        laneIds: evidenceProvenanceTrace.lanes.map((lane) => lane.id),
        researchNodeKinds: evidenceProvenanceTrace.lanes.find((lane) => lane.id === "research_evidence").nodeKinds,
        publicSourceNodeKinds: evidenceProvenanceTrace.lanes.find((lane) => lane.id === "public_source_routes").nodeKinds,
        networkRequests: evidenceProvenanceTrace.localRuntime.networkRequests,
        sourceFileDownload: evidenceProvenanceTrace.localRuntime.sourceFileDownload,
        sourceFileUpload: evidenceProvenanceTrace.localRuntime.sourceFileUpload,
        persistence: evidenceProvenanceTrace.localRuntime.persistentStorage,
        output: evidenceProvenanceTrace.localRuntime.output,
        inputId: "evidenceProvenanceTrace",
        schemaInputId: "evidenceProvenanceTraceSchema",
      },
      crossLaneRelationshipAdmission: {
        releaseId: crossLaneRelationshipAdmission.releaseId,
        schemaVersion: crossLaneRelationshipAdmission.schemaVersion,
        researchReleaseId: crossLaneRelationshipAdmission.researchReleaseId,
        catalogReleaseId: crossLaneRelationshipAdmission.catalogReleaseId,
        provenanceTraceReleaseId: crossLaneRelationshipAdmission.provenanceTraceReleaseId,
        admissionStatus: crossLaneRelationshipAdmission.admissionStatus,
        relationshipKindIds: crossLaneRelationshipAdmission.relationshipKinds.map((kind) => kind.id),
        commonRequiredEvidence: crossLaneRelationshipAdmission.commonRequiredEvidence,
        networkRequests: crossLaneRelationshipAdmission.localRuntime.networkRequests,
        sourceObjectAcquisition: crossLaneRelationshipAdmission.localRuntime.sourceObjectAcquisition,
        sourceFileUpload: crossLaneRelationshipAdmission.localRuntime.sourceFileUpload,
        persistence: crossLaneRelationshipAdmission.localRuntime.persistentStorage,
        output: crossLaneRelationshipAdmission.localRuntime.output,
        inputId: "crossLaneRelationshipAdmission",
        schemaInputId: "crossLaneRelationshipAdmissionSchema",
      },
      publicSourceReleaseAdmissionService: {
        releaseId: publicSourceReleaseAdmissionService.releaseId,
        schemaVersion: publicSourceReleaseAdmissionService.schemaVersion,
        catalogReleaseId: publicSourceReleaseAdmissionService.catalogReleaseId,
        manifestComposerReleaseId: publicSourceReleaseAdmissionService.manifestComposerReleaseId,
        queueItemId: publicSourceReleaseAdmissionService.queueItemId,
        supportedManifestFormats: publicSourceReleaseAdmissionService.supportedManifestFormats.map((format) => ({ formatVersion: format.formatVersion, sourceId: format.sourceId })),
        admissionDecision: publicSourceReleaseAdmissionService.admissionDecision,
        networkRequests: publicSourceReleaseAdmissionService.localRuntime.networkRequests,
        sourceFileDownload: publicSourceReleaseAdmissionService.localRuntime.sourceFileDownload,
        sourceFileUpload: publicSourceReleaseAdmissionService.localRuntime.sourceFileUpload,
        persistence: publicSourceReleaseAdmissionService.localRuntime.persistentStorage,
        output: publicSourceReleaseAdmissionService.localRuntime.output,
        inputId: "publicSourceReleaseAdmissionService",
        schemaInputId: "publicSourceReleaseAdmissionServiceSchema",
      },
      publicSourceAssertionProvenance: {
        releaseId: publicSourceAssertionProvenance.releaseId,
        schemaVersion: publicSourceAssertionProvenance.schemaVersion,
        catalogReleaseId: publicSourceAssertionProvenance.catalogReleaseId,
        admissionServiceReleaseId: publicSourceAssertionProvenance.admissionServiceReleaseId,
        queueItemId: publicSourceAssertionProvenance.queueItemId,
        assertionSourceStates: publicSourceAssertionProvenance.assertionSourceStates,
        subjectKinds: publicSourceAssertionProvenance.subjectKinds,
        claimScopeCount: publicSourceAssertionProvenance.claimScopes.length,
        verificationStatus: publicSourceAssertionProvenance.nonPromotion.verificationStatus,
        admissionDecision: publicSourceAssertionProvenance.nonPromotion.admissionDecision,
        networkRequests: publicSourceAssertionProvenance.localRuntime.networkRequests,
        sourceFileDownload: publicSourceAssertionProvenance.localRuntime.sourceFileDownload,
        sourceFileUpload: publicSourceAssertionProvenance.localRuntime.sourceFileUpload,
        persistence: publicSourceAssertionProvenance.localRuntime.persistentStorage,
        inputId: "publicSourceAssertionProvenance",
        schemaInputId: "publicSourceAssertionProvenanceSchema",
      },
      publicSourceAuthorizationPlan: {
        releaseId: publicSourceAuthorizationPlan.releaseId,
        schemaVersion: publicSourceAuthorizationPlan.schemaVersion,
        catalogReleaseId: publicSourceAuthorizationPlan.catalogReleaseId,
        admissionServiceReleaseId: publicSourceAuthorizationPlan.admissionServiceReleaseId,
        assertionProvenanceReleaseId: publicSourceAuthorizationPlan.assertionProvenanceReleaseId,
        queueItemId: publicSourceAuthorizationPlan.queueItemId,
        supportedManifestFormats: publicSourceAuthorizationPlan.supportedManifestFormats.map((format) => ({ formatVersion: format.formatVersion, sourceId: format.sourceId })),
        requiredPlanStepIds: publicSourceAuthorizationPlan.supportedManifestFormats[0].requiredPlanStepIds,
        planStatus: publicSourceAuthorizationPlan.nonPromotion.planStatus,
        authorizationStatus: publicSourceAuthorizationPlan.nonPromotion.authorizationStatus,
        verificationStatus: publicSourceAuthorizationPlan.nonPromotion.verificationStatus,
        networkRequests: publicSourceAuthorizationPlan.localRuntime.networkRequests,
        sourceFileDownload: publicSourceAuthorizationPlan.localRuntime.sourceFileDownload,
        sourceFileUpload: publicSourceAuthorizationPlan.localRuntime.sourceFileUpload,
        persistence: publicSourceAuthorizationPlan.localRuntime.persistentStorage,
        inputId: "publicSourceAuthorizationPlan",
        schemaInputId: "publicSourceAuthorizationPlanSchema",
      },
      publicSourceIndependentAuthorizationEvidence: {
        releaseId: publicSourceIndependentAuthorizationEvidence.releaseId,
        schemaVersion: publicSourceIndependentAuthorizationEvidence.schemaVersion,
        catalogReleaseId: publicSourceIndependentAuthorizationEvidence.catalogReleaseId,
        admissionServiceReleaseId: publicSourceIndependentAuthorizationEvidence.admissionServiceReleaseId,
        assertionProvenanceReleaseId: publicSourceIndependentAuthorizationEvidence.assertionProvenanceReleaseId,
        authorizationPlanReleaseId: publicSourceIndependentAuthorizationEvidence.authorizationPlanReleaseId,
        queueItemId: publicSourceIndependentAuthorizationEvidence.queueItemId,
        supportedManifestFormats: publicSourceIndependentAuthorizationEvidence.supportedManifestFormats.map((format) => ({ formatVersion: format.formatVersion, sourceId: format.sourceId })),
        requiredReviewStageIds: publicSourceIndependentAuthorizationEvidence.supportedManifestFormats[0].requiredReviewStageIds,
        packetStatus: publicSourceIndependentAuthorizationEvidence.nonPromotion.packetStatus,
        authorityStatus: publicSourceIndependentAuthorizationEvidence.nonPromotion.authorityStatus,
        executionStatus: publicSourceIndependentAuthorizationEvidence.nonPromotion.executionStatus,
        verificationStatus: publicSourceIndependentAuthorizationEvidence.nonPromotion.verificationStatus,
        networkRequests: publicSourceIndependentAuthorizationEvidence.localRuntime.networkRequests,
        sourceFileDownload: publicSourceIndependentAuthorizationEvidence.localRuntime.sourceFileDownload,
        sourceFileUpload: publicSourceIndependentAuthorizationEvidence.localRuntime.sourceFileUpload,
        persistence: publicSourceIndependentAuthorizationEvidence.localRuntime.persistentStorage,
        inputId: "publicSourceIndependentAuthorizationEvidence",
        schemaInputId: "publicSourceIndependentAuthorizationEvidenceSchema",
      },
      interneuronKnowledgeCoverage: {
        releaseId: interneuronKnowledgeCoverage.releaseId,
        schemaVersion: interneuronKnowledgeCoverage.schemaVersion,
        coordinateAuthority: interneuronKnowledgeCoverage.coordinateAuthority,
        laneCount: interneuronKnowledgeCoverage.lanes.length,
        laneIds: interneuronKnowledgeCoverage.lanes.map((lane) => lane.id),
        axisCount: interneuronKnowledgeCoverage.axes.length,
        axisIds: interneuronKnowledgeCoverage.axes.map((axis) => axis.id),
        crossStudyMappingStatuses: [...new Set(interneuronKnowledgeCoverage.lanes.map((lane) => lane.crossStudyMappingStatus))],
        morphologyStatuses: [...new Set(interneuronKnowledgeCoverage.lanes.map((lane) => lane.coverage.find((entry) => entry.axisId === "morphology")?.status))],
        causalMechanismStatuses: coverageCausalMechanismStatuses,
        directCausalLaneIds: coverageDirectCausalLaneIds,
        directCausalBoundary: tabulaeDirectCausalBoundary,
        sourceLocatorCount: coverageSourceLocatorCount,
        auditedLocatorCorrectionCount: EXPECTED_COVERAGE_LOCATOR_CORRECTIONS.length,
        auditedLocatorCorrections: EXPECTED_COVERAGE_LOCATOR_CORRECTIONS,
        sourceObjectsBundled: interneuronKnowledgeCoverage.lanes.reduce((count, lane) => count + Number(lane.assetAccess.sourceObjectsBundled), 0),
        projectRegistrationCount: interneuronKnowledgeCoverage.projectRegistrationCount,
        inputId: "interneuronKnowledgeCoverage",
        schemaInputId: "interneuronKnowledgeCoverageSchema",
      },
      russTaxonomyCrosswalk: {
        releaseId: russTaxonomyCrosswalk.releaseId,
        schemaVersion: russTaxonomyCrosswalk.schemaVersion,
        coordinateAuthority: russTaxonomyCrosswalk.coordinateAuthority,
        populationCount: russTaxonomyCrosswalk.populations.length,
        interneuronCandidateCount: russTaxonomyCrosswalk.scope.displayedInterneuronCandidateCount,
        groupCount: russTaxonomyCrosswalk.groups.length,
        prototypeMappingCount: russTaxonomyCrosswalk.prototypeCrosswalks.length,
        exactPrototypeMappingCount: russTaxonomyCrosswalk.prototypeCrosswalks.filter((mapping) => mapping.mappingStatus === "exact").length,
        sourceTableBundled: russTaxonomyCrosswalk.source.markerTable.sourceFileBundled,
        sourceTableSha256: russTaxonomyCrosswalk.source.markerTable.sha256,
        inputId: "russTaxonomyCrosswalk",
        schemaInputId: "russTaxonomyCrosswalkSchema",
      },
      russReconciliationDossier: {
        releaseId: russReconciliationDossier.releaseId,
        schemaVersion: russReconciliationDossier.schemaVersion,
        authority: russReconciliationDossier.authority,
        correctionCount: russReconciliationDossier.corrections.length,
        reconciliationItemCount: russReconciliationDossier.reconciliationItems.length,
        sourceTableBundled: russReconciliationDossier.pinnedMarkerTable.sourceFileBundled,
        sourceTableSha256: russReconciliationDossier.pinnedMarkerTable.sha256,
        sourceTableContentChangeStatedByCorrections: russReconciliationDossier.pinnedMarkerTable.tableContentChangeStatedByCorrections,
        currentStatus: russReconciliationDossier.releaseDecision.currentStatus,
        inputId: "russReconciliationDossier",
        schemaInputId: "russReconciliationDossierSchema",
      },
      tabulaeConditionCatalog: {
        releaseId: tabulaeConditionCatalog.releaseId,
        schemaVersion: tabulaeConditionCatalog.schemaVersion,
        authority: tabulaeConditionCatalog.authority,
        admissionDecision: tabulaeConditionCatalog.admissionDecision,
        sourceCount: tabulaeConditionCatalog.sources.length,
        conditionCount: tabulaeConditionCatalog.conditions.length,
        distinctSourceLabelCount: new Set(tabulaeConditionCatalog.conditions.flatMap((condition) => condition.sourceSampleLabels)).size,
        bundledSourceBodyCount: tabulaeConditionCatalog.sources.filter((source) => source.bodyBundled).length,
        bundledProcessedMetadataCount: tabulaeConditionCatalog.sources.filter((source) => source.processedMetadataBundled).length,
        inputId: "tabulaeConditionCatalog",
        schemaInputId: "tabulaeConditionCatalogSchema",
      },
      tabulaeSpatialLocalSession: {
        releaseId: tabulaeSpatialLocalSession.releaseId,
        schemaVersion: tabulaeSpatialLocalSession.schemaVersion,
        authority: tabulaeSpatialLocalSession.authority,
        archiveStableName: tabulaeSpatialLocalSession.archive.stableName,
        archiveBytes: tabulaeSpatialLocalSession.archive.bytes,
        sourceChecksum: tabulaeSpatialLocalSession.archive.sourceChecksum,
        assetRightsDecision: tabulaeSpatialLocalSession.archive.assetRightsDecision,
        declaredSampleCount: tabulaeSpatialLocalSession.samples.length,
        automaticRemoteAcquisition: tabulaeSpatialLocalSession.localImport.automaticRemoteAcquisition,
        upload: tabulaeSpatialLocalSession.localImport.upload,
        persistence: tabulaeSpatialLocalSession.localImport.persistence,
        inputId: "tabulaeSpatialLocalSession",
        schemaInputId: "tabulaeSpatialLocalSessionSchema",
      },
      tabulaeSpatialLocalComparison: {
        releaseId: tabulaeSpatialLocalComparison.releaseId,
        schemaVersion: tabulaeSpatialLocalComparison.schemaVersion,
        authority: tabulaeSpatialLocalComparison.authority,
        baseSessionReleaseId: tabulaeSpatialLocalComparison.baseSessionReleaseId,
        maximumConcurrentSessions: tabulaeSpatialLocalComparison.comparison.maximumConcurrentSessions,
        displayMode: tabulaeSpatialLocalComparison.comparison.displayMode,
        crossSectionTransform: tabulaeSpatialLocalComparison.comparison.crossSectionTransform,
        sectionOrderAuthority: tabulaeSpatialLocalComparison.comparison.sectionOrderAuthority,
        interSectionGeometry: tabulaeSpatialLocalComparison.comparison.interSectionGeometry,
        quantitativeComparison: tabulaeSpatialLocalComparison.comparison.quantitativeComparison,
        automaticRemoteAcquisition: tabulaeSpatialLocalComparison.localRuntime.automaticRemoteAcquisition,
        upload: tabulaeSpatialLocalComparison.localRuntime.upload,
        persistence: tabulaeSpatialLocalComparison.localRuntime.persistence,
        sourceFilesBundled: tabulaeSpatialLocalComparison.localRuntime.sourceFilesBundled,
        inputId: "tabulaeSpatialLocalComparison",
        schemaInputId: "tabulaeSpatialLocalComparisonSchema",
      },
    },
    curatorFeedback: {
      contractSchemaVersion: curatorFeedbackContract.schemaVersion,
      feedbackSchemaVersion: curatorFeedbackContract.feedbackSchemaVersion,
      distributionVersion: curatorFeedbackContract.distributionVersion,
      maximumFileBytes: curatorFeedbackContract.maximumFileBytes,
      maximumFeedbackRecords: curatorFeedbackContract.maximumFeedbackRecords,
      minimumIndependentCuratorsForComparison: curatorFeedbackContract.minimumIndependentCuratorsForComparison,
      privacy: curatorFeedbackContract.privacy,
      requiredResponseKeyCount: curatorFeedbackContract.requiredResponseKeys.length,
      optionalResponseKeyCount: curatorFeedbackContract.optionalResponseKeys.length,
      contractInputId: "curatorFeedbackContract",
      contractSchemaInputId: "curatorFeedbackContractSchema",
      requiresReportedZipSha256: true,
      runtimeBoundary: "Local import and local receipt export only; feedback cannot alter evidence, acquire data, authorize a public release, or create a registration.",
    },
    curatorAdjudication: {
      contractSchemaVersion: curatorAdjudicationContract.schemaVersion,
      adjudicationSchemaVersion: curatorAdjudicationContract.adjudicationSchemaVersion,
      feedbackSchemaVersion: curatorAdjudicationContract.feedbackSchemaVersion,
      distributionVersion: curatorAdjudicationContract.distributionVersion,
      minimumIndependentCurators: curatorAdjudicationContract.minimumIndependentCurators,
      maximumPacketBytes: curatorAdjudicationContract.maximumPacketBytes,
      readOnlyPacketImport: curatorAdjudicationContract.readOnlyPacketImport,
      permittedDispositions: curatorAdjudicationContract.permittedDispositions,
      contractInputId: "curatorAdjudicationContract",
      contractSchemaInputId: "curatorAdjudicationContractSchema",
      runtimeBoundary: curatorAdjudicationContract.boundary,
    },
    researchModel: {
      schemaVersion: researchRelease.schemaVersion,
      species: researchRelease.scope.modelSpecies,
      taxon: researchRelease.scope.modelTaxon,
      lifeStage: researchRelease.scope.modelLifeStage,
      extent: researchRelease.scope.modelExtent,
      entityCount: researchRelease.entities.length,
      populationEntityCount: researchRelease.scope.populationEntityCount,
      stateOverlayCount: researchRelease.scope.stateOverlayCount,
      claimCount: researchRelease.claims.length,
      conditionCount: researchRelease.conditions.length,
      sourceCount: researchRelease.sources.length,
      evidenceContextsMayDifferFromModelGeometry: researchRelease.scope.evidenceContextsMayDifferFromModelGeometry,
      isCellCensus: researchRelease.scope.isCellCensus,
      isConnectome: researchRelease.scope.isConnectome,
      isClinicalModel: researchRelease.scope.isClinicalModel,
      spatialContract: {
        coordinateSpace: researchRelease.spatialContract.coordinateSpace,
        units: researchRelease.spatialContract.units,
        entityGeometryStatus: researchRelease.spatialContract.entityGeometryStatus,
        entityPathStatus: researchRelease.spatialContract.entityPathStatus,
        measurementAllowed: researchRelease.spatialContract.measurementAllowed,
      },
      referenceBackedUpgrade: {
        architectureDecisionInputId: "referenceAnatomyArchitectureDecision",
        upgradeQueueInputId: "researchModelUpgradeQueue",
        laneJoinPolicy: "none_without_separate_versioned_evidence_and_review",
        referenceAnatomy: {
          geometryStatus: "INF",
          derivation: "display_loft_from_checksum_locked_native_contour_planes",
          sampledPlaneCount: atlas.sampledZIndices.length,
          contourClasses: ["outer_cord", "coarse_gray_matter_row_envelope"],
          internalCompartmentPayloadInputId: "atlasInternalCompartments",
          sourceIdMajorStructureCount: atlasInternalCompartments.structures.length,
          internalComponentCount: internalCompartmentReport.totalComponents,
          internalPolygonCount: internalCompartmentReport.totalPolygons,
          explicitMissingInternalPlaneCount: internalCompartmentReport.missingPlaneCount,
          internalComponentCorrespondence: "plane_local_only_no_cross_plane_correspondence",
          internalRenderingMode: "plane_local_line_segments_only",
          internalDisplayColorKey: "preserved_source_identifier",
          internalDisplayColorAuthority: "none_project_display_only_palette",
          internalProjectDisplayPaletteSize: 7,
          internalSourceColorRetention: "exact_source_color_retained_in_user_data",
          internalLofting: "forbidden",
          internalFilling: "none",
          internalJoining: "none",
          manualBridging: "none",
          measurementAllowed: false,
          namedSegmentAssignment: "pending_curation",
          projectRegistrationCount: 0,
        },
        molecularTypeLandscape: {
          coordinateAuthority: russTaxonomyCrosswalk.coordinateAuthority,
          interneuronCandidateCount: russTaxonomyCrosswalk.scope.displayedInterneuronCandidateCount,
          candidateScope: "non_motoneuron_interneuron_or_projection_neuron_candidates",
          confirmedInterneuronCount: null,
          confirmedInterneuronCountMissingReason: "not_established",
          placementStatus: "unplaced",
          exactCrossStudyIdentityCount: 0,
          linkedMorphologyCount: 0,
          projectRegistrationCount: 0,
        },
        sciEvidence: {
          entityGeometryStatus: researchRelease.spatialContract.entityGeometryStatus,
          entityPathStatus: researchRelease.spatialContract.entityPathStatus,
          projectRegistrationCount: researchRelease.registrations.length,
        },
      },
    },
    spatialAssets: {
      atlas: {
        assetId: atlas.assetId,
        manifestInputId: "atlasAssetManifest",
        manifestSha256: inputById.get("atlasAssetManifest").sha256,
        atlas: atlas.atlas,
        atlasVersion: atlas.atlasVersion,
        atlasApiVersion: atlas.atlasApiVersion,
        species: atlas.species,
        lifeStage: atlas.lifeStage,
        shapeZyx: atlas.shapeZyx,
        resolutionUmZyx: atlas.resolutionUmZyx,
        orientation: atlas.orientation,
        coordinateSpaceId: atlas.coordinateSpaceId,
        componentVersions: atlas.componentVersions,
        geometryStatus: atlas.geometryStatus,
        sampledPlaneCount: atlas.sampledZIndices.length,
        displayDerivative: "lofted_outer_cord_and_coarse_gray_matter_row_envelope_side_surfaces",
        contourPayloadPath: "public/data/allen_cord_20um_v3_0/atlas-contours.json",
        internalCompartments: {
          assetId: atlasInternalCompartments.assetId,
          payloadInputId: "atlasInternalCompartments",
          payloadSha256: internalCompartmentInput.sha256,
          payloadPath: "public/data/allen_cord_20um_v3_0/atlas-internal-compartments.json",
          derivation: "exact_pixel_edges_of_source_annotation_masks",
          geometryStatus: atlasInternalCompartments.geometryStatus,
          sourceIdMajorStructureCount: atlasInternalCompartments.structures.length,
          structureIdentifiers: internalCompartmentReport.structureIdentifiers,
          structures: atlasInternalCompartments.structures.map((structure) => ({
            identifier: structure.identifier,
            name: structure.name,
            abbreviation: structure.abbreviation,
          })),
          sampledPlaneCountPerStructure: internalCompartmentReport.sampledPlaneCount,
          componentConnectivity: atlasInternalCompartments.componentPolicy.connectivity,
          componentCount: internalCompartmentReport.totalComponents,
          polygonCount: internalCompartmentReport.totalPolygons,
          disconnectedComponents: atlasInternalCompartments.componentPolicy.disconnectedComponents,
          crossPlaneComponentCorrespondence: "none",
          crossPlaneInterpolation: atlasInternalCompartments.polygonPolicy.interpolation,
          manualGeometry: atlasInternalCompartments.polygonPolicy.manualGeometry,
          renderingMode: "plane_local_line_segments_only",
          displayColorKey: "preserved_source_identifier",
          displayColorAuthority: "none_project_display_only_palette",
          projectDisplayPaletteSize: 7,
          sourceColorRetention: "exact_source_color_retained_in_user_data",
          lofting: "forbidden",
          filling: "none",
          joining: "none",
          missingPlanes: missingInternalPlanes,
          measurementAllowed: false,
          namedSegmentAssignment: "pending_curation",
          projectRegistrationCount: atlasInternalCompartments.registrationCount,
        },
        measurementAllowed: false,
        namedSegmentAssignment: "pending_curation",
        projectRegistrationCount: 0,
        displayTransformUse: atlas.displayTransformUse,
        registrationError: atlas.registrationError,
        license: atlas.license,
        citation: atlas.citation,
      },
      morphology: {
        assetSetId: morphology.assetSetId,
        manifestInputId: "morphologyAssetManifest",
        manifestSha256: inputById.get("morphologyAssetManifest").sha256,
        repositoryRelease: morphology.release,
        species: morphology.records[0].species,
        lifeStage: morphology.records[0].lifeStage,
        selection: morphology.selection,
        queryUrl: morphology.queryUrl,
        queryTotalAtSnapshot: morphology.queryTotalAtSnapshot,
        exemplarCount: morphology.records.length,
        exemplarNeuronIds: morphology.records.map((record) => record.neuronId),
        geometryStatus: "OBS",
        coordinateFrame: "NeuroMorpho_CNG_standardized_local_frame",
        registrationStatus: "unregistered",
        atlasTransformCount: morphology.records.filter((record) => record.atlasTransform?.value !== null).length,
        license: morphology.license,
        requiredCitation: morphology.requiredCitation,
      },
    },
    registrations: {
      count: researchRelease.registrations.length,
      records: researchRelease.registrations,
    },
    inputRoots: {
      project: {
        locator: ".",
        policy: "Only exact allowlisted relative paths contained by the real project root are readable.",
      },
      scientificAuthority: {
        locator: "../interneuron_sci_review",
        policy: "Only EVIDENCE_LEDGER.md and SOURCE_MANIFEST.tsv at their exact allowlisted paths are readable.",
      },
    },
    authoritativeInputs,
    integrity: {
      algorithm: "SHA-256",
      canonicalization:
        "UTF-8 compact JSON with recursively lexicographically sorted object keys; array order preserved; top-level manifestContentSha256 omitted.",
      inputCount: authoritativeInputs.length,
    },
    scientificBoundaries: {
      intendedUse: "Localhost public-data workbench candidate only; not a validated scientific atlas product.",
      scientificInputPolicy: "All scientific inputs are public digital sources only; no OHRI internal experimental data, physical specimens or unpublished institutional records are required.",
      entityGeometry: "All seven evidence entities remain synthetic (SYN) and their paths schematic (SCH).",
      atlasGeometry: "The outer-cord and coarse gray-matter row-envelope side surfaces are an inferred display loft (INF) from 15 checksum-locked native atlas contour planes; the old gray-matter envelope is not a full gray boundary. Seven atlas-source-ID internal structures retain 408 separate 4-connected exact mask-edge components/polygons across 15 sampled planes, with dorsal funiculus ID 74 at z1470 explicitly missing. Internal anatomy renders only as plane-local line segments using a seven-color project display-only palette keyed to preserved source IDs; display colors carry no source/anatomical authority, while each exact source color is retained in userData. Internal components are never lofted, filled, joined, manually bridged or cross-plane corresponded. All anatomy is invalid for measurement, has no named spinal segments, and creates 0 REG.",
      molecularTypes: "The 65 Russ non-motoneuron interneuron/projection-neuron candidates remain TYPE_LEVEL and unplaced; they are not 65 confirmed interneurons and have zero exact cross-study identities, zero linked morphologies, and zero project registrations.",
      knowledgeCoverage: "The five-source by seven-axis matrix is source-bounded metadata; all cross-study mappings remain not_established, morphology remains not_measured, and missing coverage is not biological absence.",
      laneSeparation: "Reference anatomy, molecular types, source-local morphology, and SCI evidence remain separate coordinate and identity lanes; visual co-display creates no join.",
      morphologyGeometry:
        "Five phenotype-stratified NeuroMorpho exemplars are observed (OBS) only in their source-local frames; they are not representative and are not linked to the seven evidence entities.",
      registration: "There are 0 registrations; every exemplar is unregistered and has no atlas transform or registration error estimate.",
      scope: "This release is not a complete interneuron census, connectome, clinical model, treatment recommendation, or claim of human cell-type causality.",
      measurementAllowed: false,
    },
  };

  return { ...manifest, manifestContentSha256: computeManifestContentSha256(manifest) };
}

export async function checkReleaseManifest({
  manifestPath = RELEASE_MANIFEST_PATH,
  projectRoot = PROJECT_ROOT,
  scientificAuthorityRoot = resolve(projectRoot, "../interneuron_sci_review"),
} = {}) {
  const expectedPath = resolveContainedPath(projectRoot, "data/release-manifest-2.8.json");
  invariant(resolve(manifestPath) === expectedPath, "release manifest path must be data/release-manifest-2.8.json");

  let actual;
  try {
    actual = JSON.parse(await readFile(expectedPath, "utf8"));
  } catch (error) {
    throw new Error(`failed to read release manifest: ${error.message}`, { cause: error });
  }
  invariant(
    /^[0-9a-f]{64}$/.test(actual.manifestContentSha256 ?? ""),
    "release manifest has an invalid manifestContentSha256",
  );
  const recomputedContentSha256 = computeManifestContentSha256(actual);
  invariant(
    recomputedContentSha256 === actual.manifestContentSha256,
    `manifestContentSha256 mismatch: expected ${actual.manifestContentSha256}, found ${recomputedContentSha256}`,
  );

  const roots = productionRoots(projectRoot, scientificAuthorityRoot);
  const verifiedInputs = await verifyInputHashes(actual.authoritativeInputs, { roots });
  const expected = await buildReleaseManifest({ projectRoot, scientificAuthorityRoot });
  invariant(
    canonicalStringify(actual) === canonicalStringify(expected),
    "release manifest is stale or altered; regenerate it with node scripts/build-release-manifest.mjs --write",
  );
  return { manifest: actual, verifiedInputs };
}

async function writeReleaseManifest() {
  const manifest = await buildReleaseManifest();
  const temporaryPath = `${RELEASE_MANIFEST_PATH}.tmp-${process.pid}`;
  await writeFile(temporaryPath, serializeManifest(manifest), "utf8");
  await rename(temporaryPath, RELEASE_MANIFEST_PATH);
  return checkReleaseManifest();
}

async function main(argv) {
  invariant(argv.length <= 1, "usage: node scripts/build-release-manifest.mjs [--check|--write]");
  const mode = argv[0] ?? "--check";
  invariant(mode === "--check" || mode === "--write", `unknown argument: ${mode}`);
  const report = mode === "--write" ? await writeReleaseManifest() : await checkReleaseManifest();
  console.log(
    `Release manifest ${mode === "--write" ? "written and verified" : "check passed"}: ` +
      `${report.verifiedInputs.length} SHA-256 inputs, 0 registrations, content ${report.manifest.manifestContentSha256}`,
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`Release manifest validation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
