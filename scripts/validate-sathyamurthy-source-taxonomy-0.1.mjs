import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createResearchMvpValidator, formatSchemaErrors } from "./validate-json-schema.mjs";

const TAXONOMY_URL = new URL("../data/sathyamurthy-source-taxonomy-0.1.json", import.meta.url);
const SCHEMA_URL = new URL("../schemas/sathyamurthy-source-taxonomy-0.1.schema.json", import.meta.url);
const EXPECTED_LINEAGE_HINTS = new Set([
  "sathyamurthy-2018:VE-1|V2a",
  "sathyamurthy-2018:VE-2|V2a",
  "sathyamurthy-2018:VE-3|V2a",
  "sathyamurthy-2018:VI-4|V1",
  "sathyamurthy-2018:VI-4|dI6",
  "sathyamurthy-2018:VC-1|V0c",
]);
const REQUIRED_PROFILE_LOCATORS = [
  "adultMouseLumbarScope",
  "sourceLocalLabel",
  "rawLabels",
  "regionClass",
  "transmitterClass",
  "projectUseClass",
  "samplingCount",
  "putativeCellTypeLabel",
  "putativeAssignmentStatus",
  "figure4Markers",
  "activityEvidence",
  "missingEvidence",
];
const EXPECTED_COUNT_MAP_SHA256 = "778ef48dd7ebce088edd7fd1304021965c472a43ad92d3fd872d96f903b7bb58";
const EXPECTED_FIGURE4_TUPLE_SHA256 = "bafec404e4f7ec19c542560d4cc0a08ea0d5e9de27e0fb55684053884c800227";
const EXPECTED_ACTIVITY_TUPLE_SHA256 = "5fa1a3edbd5090203434a40ca79bf47d4f45e5cd9c3ed88b3328911088119aaf";
const EXPECTED_MISSING_EVIDENCE = {
  morphology: "not_measured",
  cellCoordinates: "not_available",
  sciContext: "not_measured",
  atlasRegistration: "not_established",
  electrophysiology: "not_measured",
  projectionTarget: "not_measured",
  synapticConnectivity: "not_measured",
  crossSourceSameCellIdentityLink: "not_established",
};

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

function hasBoundary(items, pattern) {
  return (items ?? []).some((item) => pattern.test(item));
}

function sha256Rows(rows) {
  const text = [...rows].sort().join("\n") + "\n";
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

export async function validateSathyamurthySourceTaxonomy(taxonomy) {
  const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));
  const validate = createResearchMvpValidator(schema);
  const errors = [];
  if (!validate(taxonomy)) errors.push(...formatSchemaErrors(validate.errors));

  check(taxonomy.releaseId === "ohri-sathyamurthy-source-taxonomy-0.1.0", "release ID must remain pinned", errors);
  check(taxonomy.datasetId === "GSE103892", "dataset ID must remain GSE103892", errors);
  check(taxonomy.coordinateAuthority === "SOURCE_LOCAL_TYPE_ONLY", "coordinate authority must remain SOURCE_LOCAL_TYPE_ONLY", errors);
  check(taxonomy.scope?.reportedClusterCount === 43 && taxonomy.scope?.displayedProfileCount === 43, "all 43 source clusters must remain represented", errors);
  check(taxonomy.scope?.reportedNeuronalNucleiCount === 4280 && taxonomy.scope?.observedAssignedNeuronalNucleiCount === 4280, "reported and checksum-derived assigned-nuclei counts must remain 4,280", errors);
  check(taxonomy.scope?.samplingCountInterpretation === "SAMPLING_COUNT_ONLY_NOT_PREVALENCE", "sampling counts must retain the no-prevalence interpretation", errors);
  check(taxonomy.scope?.displayedNonMotorNeuronUnresolvedCount === 42, "42 non-motor records must remain unresolved between local-interneuron and projection-neuron status", errors);
  check(taxonomy.scope?.displayedMotorNeuronContextCount === 1, "one motor-neuron context record must remain explicit", errors);
  check(taxonomy.scope?.exactCrossSourceIdentityCount === 0, "exact cross-source identity count must remain zero", errors);
  check(taxonomy.scope?.projectRegistrationCount === 0, "project registration count must remain zero", errors);

  const asset = taxonomy.source?.geo?.clusterMetadataAsset;
  check(asset?.bytes === 114576, "cluster-metadata byte count is not pinned", errors);
  check(asset?.sha256 === "2a22f9b19db27c43dc6632e15395d63a4eb8b0087d1ac5b491411c01d1e41d30", "cluster-metadata SHA-256 is not pinned", errors);
  check(asset?.rowsWithNeuronCluster === 5369 && asset?.genericNeuronRows === 1089 && asset?.assignedProfileRows === 4280, "processed metadata row accounting must remain 5,369 = 1,089 generic + 4,280 assigned", errors);
  check(asset?.rowsWithNeuronCluster === asset?.genericNeuronRows + asset?.assignedProfileRows, "processed metadata row accounting does not add up", errors);
  check(asset?.sourceFileBundled === false, "GEO source file must not be bundled", errors);
  check(asset?.derivedFactualMetadataBundled === true, "derived factual metadata must be declared as bundled", errors);
  check(asset?.reuseStatus === "PUBLIC_ACCESS_REUSE_NOT_ASSUMED", "public access must not be promoted to assumed redistribution permission", errors);
  check(taxonomy.source?.publication?.license?.id === "CC-BY-NC-ND-4.0" && taxonomy.source?.publication?.license?.appliesTo === "article", "article license and article-only scope must remain explicit", errors);

  const sampleFrame = taxonomy.source?.geo?.sampleFrame;
  check(sampleFrame?.geoAccessionCount === 24, "GEO accession count must remain 24", errors);
  check(sampleFrame?.independentDropSeqSampleCount === 19, "independent pooled Drop-Seq sample count must remain 19", errors);
  check(sampleFrame?.baselineIndependentSampleCount === 9 && sampleFrame?.formalinIndependentSampleCount === 5 && sampleFrame?.rotarodIndependentSampleCount === 5, "condition-level independent-sample counts must remain 9 baseline, 5 formalin, and 5 rotarod", errors);
  check(sampleFrame?.independentDropSeqSampleCount === sampleFrame?.baselineIndependentSampleCount + sampleFrame?.formalinIndependentSampleCount + sampleFrame?.rotarodIndependentSampleCount, "independent-sample arithmetic does not add up", errors);
  const sexBreakdown = sampleFrame?.conditionSexBreakdown;
  check(sexBreakdown?.baseline?.malePooledSamples === 4 && sexBreakdown?.baseline?.femalePooledSamples === 5, "baseline sex breakdown must remain 4 male and 5 female pooled samples", errors);
  check(sexBreakdown?.formalin?.malePooledSamples === 3 && sexBreakdown?.formalin?.femalePooledSamples === 2, "formalin sex breakdown must remain 3 male and 2 female pooled samples", errors);
  check(sexBreakdown?.rotarod?.malePooledSamples === 3 && sexBreakdown?.rotarod?.femalePooledSamples === 2, "rotarod sex breakdown must remain 3 male and 2 female pooled samples", errors);
  const sexStratifiedSampleCount = ["baseline", "formalin", "rotarod"].reduce((sum, condition) => sum + (sexBreakdown?.[condition]?.malePooledSamples ?? 0) + (sexBreakdown?.[condition]?.femalePooledSamples ?? 0), 0);
  check(sexStratifiedSampleCount === sampleFrame?.independentDropSeqSampleCount, "condition-by-sex pooled-sample counts must sum to 19", errors);
  check(sampleFrame?.formalinSequencingReactionCount === 10 && sampleFrame?.formalinIndependentSampleCount === 5, "ten formalin sequencing reactions must remain distinguished from five biological replicates", errors);
  check(sampleFrame?.micePerPooledSample === 2 && sampleFrame?.derivedMouseCountFromReportedPooling === 38, "two-mouse pooling and the derived 38-mouse denominator must remain explicit", errors);
  check(sampleFrame?.derivedMouseCountFromReportedPooling === sampleFrame?.independentDropSeqSampleCount * sampleFrame?.micePerPooledSample, "pooled-sample mouse arithmetic does not add up", errors);
  check(/different denominator levels|not.*independent animals/i.test(sampleFrame?.interpretationBoundary ?? ""), "sample frame must retain the accession/sample/mouse/nucleus denominator boundary", errors);

  const locatorIds = new Set();
  const locatorById = new Map();
  const referencedLocatorIds = new Set();
  for (const locator of taxonomy.sourceLocators ?? []) {
    check(!locatorIds.has(locator.id), "duplicate source locator " + locator.id, errors);
    locatorIds.add(locator.id);
    locatorById.set(locator.id, locator);
  }
  const referenceLocators = (ids, supportedField, owner) => {
    for (const id of ids ?? []) {
      referencedLocatorIds.add(id);
      const locator = locatorById.get(id);
      check(Boolean(locator), `${owner} references unknown locator ${id}`, errors);
      check(locator?.supportsFields?.includes(supportedField), `${id} does not declare support for ${supportedField}`, errors);
    }
  };
  referenceLocators(taxonomy.source?.publication?.license?.sourceLocatorIds, "rightsBoundary", "article license");
  referenceLocators(asset?.sourceLocatorIds, "rightsBoundary", "GEO asset rights boundary");
  referenceLocators(sampleFrame?.sourceLocatorIds, "sampleFrame", "sample frame");

  const profileIds = new Set();
  const profileLabels = new Set();
  let assignedNuclei = 0;
  let nonMotorUnresolvedCount = 0;
  let motorContextCount = 0;
  let activityEntryCount = 0;
  let activityProfileCount = 0;
  const nonDetections = new Set();
  const countRows = [];
  const figure4Rows = [];
  const activityRows = [];

  for (const profile of taxonomy.profiles ?? []) {
    check(!profileIds.has(profile.id), "duplicate profile ID " + profile.id, errors);
    check(!profileLabels.has(profile.sourceLocalLabel), "duplicate source-local label " + profile.sourceLocalLabel, errors);
    profileIds.add(profile.id);
    profileLabels.add(profile.sourceLocalLabel);
    check(profile.id === `sathyamurthy-2018:${profile.sourceLocalLabel}`, profile.sourceLocalLabel + " ID must preserve its source-local label", errors);
    const expectedRawLabel = profile.sourceLocalLabel === "DE-12" ? "DE12" : profile.sourceLocalLabel;
    check(profile.rawLabels?.length === 1 && profile.rawLabels[0] === expectedRawLabel, `${profile.sourceLocalLabel} must retain its exact source-object raw label`, errors);
    const labelRegion = { D: "dorsal", M: "mid", V: "ventral" }[profile.sourceLocalLabel?.[0]];
    const labelTransmitter = { E: "excitatory", I: "inhibitory", M: "mixed_cluster", C: "cholinergic_predominantly_excitatory" }[profile.sourceLocalLabel?.[1]];
    check(profile.regionClass === labelRegion, profile.sourceLocalLabel + " region class disagrees with its source label", errors);
    check(profile.transmitterClass === labelTransmitter, profile.sourceLocalLabel + " transmitter class disagrees with its source label", errors);
    check(profile.figure4Markers?.length === 3 && new Set(profile.figure4Markers).size === 3, profile.sourceLocalLabel + " must retain three distinct Figure 4 markers", errors);
    check(profile.samplingCount?.unit === "nuclei" && profile.samplingCount?.interpretation === "sampling_count_only", profile.sourceLocalLabel + " must retain a nuclei sampling count with its interpretation", errors);
    check(JSON.stringify(profile.fieldLocators?.samplingCount) === JSON.stringify(["geo-cluster-metadata"]), `${profile.sourceLocalLabel} per-profile sampling count must cite only the checksum-pinned GEO metadata`, errors);
    check(JSON.stringify(profile.fieldLocators?.projectUseClass) === JSON.stringify(["paper-figure-4-project-scope"]), `${profile.sourceLocalLabel} project use class must retain its contextual source locator`, errors);
    check(JSON.stringify(profile.fieldLocators?.putativeAssignmentStatus) === JSON.stringify(["paper-figure-4-project-scope"]), `${profile.sourceLocalLabel} putative-assignment status must retain its contextual source locator`, errors);
    assignedNuclei += profile.samplingCount?.value ?? 0;
    if (profile.projectUseClass === "source_local_non_motor_neuron_unresolved") nonMotorUnresolvedCount += 1;
    if (profile.projectUseClass === "motor_neuron_context") motorContextCount += 1;
    check(profile.putativeAssignmentStatus === "source_putative_not_exact_identity", profile.sourceLocalLabel + " must not be promoted beyond a source-putative assignment", errors);
    for (const [field, expected] of Object.entries(EXPECTED_MISSING_EVIDENCE)) {
      check(profile.missingEvidence?.[field] === expected, `${profile.sourceLocalLabel} must retain ${field} as ${expected}`, errors);
    }

    countRows.push(`${profile.rawLabels?.[0]}\t${profile.samplingCount?.value}`);
    figure4Rows.push([profile.sourceLocalLabel, profile.putativeCellTypeLabel, ...(profile.figure4Markers ?? [])].join("\t"));

    for (const field of REQUIRED_PROFILE_LOCATORS) {
      const ids = profile.fieldLocators?.[field] ?? [];
      if (field !== "activityEvidence" || profile.activityEvidence?.length) check(ids.length > 0, `${profile.sourceLocalLabel} lacks a locator for ${field}`, errors);
      for (const id of ids) {
        referencedLocatorIds.add(id);
        const locator = locatorById.get(id);
        check(Boolean(locator), `${profile.sourceLocalLabel} references unknown locator ${id}`, errors);
        check(locator?.supportsFields?.includes(field), `${id} does not declare support for ${field}`, errors);
      }
    }

    if (profile.activityEvidence?.length) activityProfileCount += 1;
    activityEntryCount += profile.activityEvidence?.length ?? 0;
    const activityContexts = new Set();
    for (const activity of profile.activityEvidence ?? []) {
      check(!activityContexts.has(activity.context), `${profile.sourceLocalLabel} has duplicate activity context ${activity.context}`, errors);
      activityContexts.add(activity.context);
      activityRows.push([profile.sourceLocalLabel, activity.context, activity.finding].join("\t"));
      for (const id of activity.sourceLocatorIds ?? []) {
        referencedLocatorIds.add(id);
        const locator = locatorById.get(id);
        check(Boolean(locator), `${profile.sourceLocalLabel} activity evidence references unknown locator ${id}`, errors);
        check(locator?.supportsFields?.includes("activityEvidence"), `${id} does not declare activity-evidence support`, errors);
        check(profile.fieldLocators?.activityEvidence?.includes(id), `${profile.sourceLocalLabel} activity locator ${id} is absent from fieldLocators`, errors);
      }
      check(/does not|not evidence|not establish|not evidence/i.test(activity.interpretationBoundary ?? ""), profile.sourceLocalLabel + " activity evidence lacks a causal boundary", errors);
      const expectedContextLocators = activity.context === "rotarod_locomotion"
        ? ["paper-figure-5", "paper-results-p26"]
        : ["paper-figure-5", "paper-results-p27"];
      check(JSON.stringify(sortedUnique(activity.sourceLocatorIds ?? [])) === JSON.stringify(sortedUnique(expectedContextLocators)), `${profile.sourceLocalLabel} ${activity.context} activity locators do not match the source context`, errors);
      if (activity.finding === "not_detected") nonDetections.add(`${profile.sourceLocalLabel}|${activity.context}`);
    }
    const activityLocatorUnion = sortedUnique((profile.activityEvidence ?? []).flatMap((activity) => activity.sourceLocatorIds ?? []));
    const fieldActivityLocators = sortedUnique(profile.fieldLocators?.activityEvidence ?? []);
    check(JSON.stringify(activityLocatorUnion) === JSON.stringify(fieldActivityLocators), `${profile.sourceLocalLabel} activity field locators must equal the activity-entry locator union`, errors);
  }

  check(profileIds.size === 43 && profileLabels.size === 43, "taxonomy must contain 43 unique source profiles", errors);
  check(assignedNuclei === 4280, "profile sampling counts must sum to 4,280 assigned nuclei", errors);
  check(nonMotorUnresolvedCount === 42, "exactly 42 profiles must remain non-motor spinal-neuron records with interneuron/projection status unresolved", errors);
  check(motorContextCount === 1, "exactly one profile must remain motor-neuron context", errors);
  check(taxonomy.profiles?.find((profile) => profile.sourceLocalLabel === "VC-2")?.projectUseClass === "motor_neuron_context", "VC-2 must remain explicit motor-neuron context", errors);
  check(activityEntryCount === 21 && activityProfileCount === 17, "activity context must retain 21 entries across 17 source profiles", errors);
  check(nonDetections.size === 2 && nonDetections.has("DE-4|rotarod_locomotion") && nonDetections.has("DI-9|rotarod_locomotion"), "rotarod non-detections must remain source-specific to DE-4 and DI-9", errors);
  check(sha256Rows(countRows) === EXPECTED_COUNT_MAP_SHA256, "raw-label/count map does not match the checksum-pinned processed metadata", errors);
  check(sha256Rows(figure4Rows) === EXPECTED_FIGURE4_TUPLE_SHA256, "Figure 4 label/putative-type/marker tuples do not match the pinned transcription", errors);
  check(sha256Rows(activityRows) === EXPECTED_ACTIVITY_TUPLE_SHA256, "activity tuples do not match the pinned P26-P27 transcription", errors);

  const anomaly = taxonomy.rawLabelAnomalies?.[0];
  check(anomaly?.rawLabel === "DE12" && anomaly?.displayLabel === "DE-12" && anomaly?.rowCount === 74, "DE12 raw-label anomaly must remain losslessly mapped to DE-12 with 74 rows", errors);
  const de12 = taxonomy.profiles?.find((profile) => profile.sourceLocalLabel === "DE-12");
  check(de12?.rawLabels?.length === 1 && de12.rawLabels[0] === "DE12" && de12?.samplingCount?.value === 74, "DE-12 profile must preserve raw GEO label DE12 and 74 assigned nuclei", errors);
  for (const id of anomaly?.sourceLocatorIds ?? []) {
    referencedLocatorIds.add(id);
    check(locatorIds.has(id), "raw-label anomaly references unknown locator " + id, errors);
  }

  const lineageKeys = new Set();
  const mappingIds = new Set();
  for (const mapping of taxonomy.candidateLineageMappings ?? []) {
    const key = `${mapping.sourceProfileId}|${mapping.candidateTargetLabel}`;
    check(!lineageKeys.has(key), "duplicate lineage hint " + key, errors);
    lineageKeys.add(key);
    check(!mappingIds.has(mapping.id), "duplicate lineage mapping ID " + mapping.id, errors);
    mappingIds.add(mapping.id);
    const sourceSlug = mapping.sourceProfileId?.split(":")[1]?.toLowerCase();
    const targetSlug = mapping.candidateTargetLabel?.toLowerCase();
    check(mapping.id === `sathyamurthy-2018.mapping.${sourceSlug}.${targetSlug}`, mapping.id + " is not the canonical mapping ID for its source profile and target", errors);
    check(EXPECTED_LINEAGE_HINTS.has(key), "unexpected lineage hint " + key, errors);
    check(profileIds.has(mapping.sourceProfileId), mapping.id + " references an unknown source profile", errors);
    check(mapping.mappingStatus === "not_established", mapping.id + " must remain not_established", errors);
    check(mapping.basis === "marker_context_only", mapping.id + " must remain marker_context_only", errors);
    const expectedLineageLocators = mapping.candidateTargetLabel === "V0c" ? ["paper-results-p21"] : ["paper-results-p19"];
    check(JSON.stringify(sortedUnique(mapping.sourceLocatorIds ?? [])) === JSON.stringify(expectedLineageLocators), mapping.id + " lineage locators do not match the retained source paragraph", errors);
    check(/not|uncertain|cannot|do not/i.test(mapping.notEstablished ?? ""), mapping.id + " must retain an explicit non-establishment boundary", errors);
    for (const id of mapping.sourceLocatorIds ?? []) {
      referencedLocatorIds.add(id);
      const locator = locatorById.get(id);
      check(Boolean(locator), mapping.id + " references unknown locator " + id, errors);
      check(locator?.supportsFields?.includes("lineageHint"), `${id} does not declare lineage-hint support`, errors);
    }
  }
  check(lineageKeys.size === EXPECTED_LINEAGE_HINTS.size && [...EXPECTED_LINEAGE_HINTS].every((key) => lineageKeys.has(key)), "all six marker-context lineage hints must remain represented exactly once", errors);
  check(mappingIds.size === EXPECTED_LINEAGE_HINTS.size, "all six lineage mapping IDs must remain unique", errors);
  for (const id of locatorIds) check(referencedLocatorIds.has(id), "source locator is not referenced by any retained field: " + id, errors);

  check(hasBoundary(taxonomy.hardBoundaries, /not estimates of biological prevalence/i), "taxonomy must retain the no-prevalence boundary", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /local-interneuron versus projection-neuron status unresolved/i), "taxonomy must retain unresolved interneuron-versus-projection status", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /24 GEO accessions are not 24 independent animals/i), "taxonomy must retain the accession/sample/mouse denominator boundary", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /No profile contains.*morphology/i), "taxonomy must retain the no-observed-morphology boundary", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /registration count is zero/i), "taxonomy must retain the zero-registration boundary", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /exactCrossSourceIdentityCount must remain zero/i), "taxonomy must retain the zero-exact-identity boundary", errors);
  check(hasBoundary(taxonomy.hardBoundaries, /public GEO access is not treated as.*redistribution/i), "taxonomy must retain the asset-rights boundary", errors);

  if (errors.length) throw new Error("Sathyamurthy source taxonomy 0.1 validation failed:\n" + errors.map((item) => "- " + item).join("\n"));
  return {
    releaseId: taxonomy.releaseId,
    profileCount: profileIds.size,
    assignedNuclei,
    nonMotorUnresolvedCount,
    motorContextCount,
    lineageHintCount: lineageKeys.size,
    exactCrossSourceIdentityCount: taxonomy.scope.exactCrossSourceIdentityCount,
    projectRegistrationCount: taxonomy.scope.projectRegistrationCount,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  try {
    const report = await validateSathyamurthySourceTaxonomy(JSON.parse(await readFile(TAXONOMY_URL, "utf8")));
    console.log(`Sathyamurthy source taxonomy 0.1 validation passed: ${report.releaseId} (${report.profileCount} profiles; ${report.assignedNuclei} assigned nuclei; ${report.lineageHintCount} non-established lineage hints; 0 registrations)`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
