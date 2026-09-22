import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateSathyamurthySourceTaxonomy } from "../scripts/validate-sathyamurthy-source-taxonomy-0.1.mjs";

const taxonomy = JSON.parse(await readFile(new URL("../data/sathyamurthy-source-taxonomy-0.1.json", import.meta.url), "utf8"));

test("locks the 43-profile Sathyamurthy source-local taxonomy", async () => {
  const report = await validateSathyamurthySourceTaxonomy(taxonomy);
  assert.deepEqual(report, {
    releaseId: "ohri-sathyamurthy-source-taxonomy-0.1.0",
    profileCount: 43,
    assignedNuclei: 4280,
    nonMotorUnresolvedCount: 42,
    motorContextCount: 1,
    lineageHintCount: 6,
    exactCrossSourceIdentityCount: 0,
    projectRegistrationCount: 0,
  });
});

test("rejects an exact lineage identity or a fabricated atlas registration", async () => {
  const exact = structuredClone(taxonomy);
  exact.candidateLineageMappings[0].mappingStatus = "exact";
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(exact), /must remain not_established/i);

  const registered = structuredClone(taxonomy);
  registered.scope.projectRegistrationCount = 1;
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(registered), /registration count must remain zero/i);
});

test("rejects altered sampling arithmetic and incomplete Figure 4 markers", async () => {
  const alteredCount = structuredClone(taxonomy);
  alteredCount.profiles[0].samplingCount.value += 1;
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(alteredCount), /sampling counts must sum to 4,280/i);

  const incompleteMarkers = structuredClone(taxonomy);
  incompleteMarkers.profiles[0].figure4Markers = incompleteMarkers.profiles[0].figure4Markers.slice(0, 2);
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(incompleteMarkers), /three distinct Figure 4 markers/i);

  const swappedCounts = structuredClone(taxonomy);
  [swappedCounts.profiles[0].samplingCount.value, swappedCounts.profiles[1].samplingCount.value] = [
    swappedCounts.profiles[1].samplingCount.value,
    swappedCounts.profiles[0].samplingCount.value,
  ];
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(swappedCounts), /raw-label\/count map does not match/i);

  const swappedRawCountPairs = structuredClone(taxonomy);
  [swappedRawCountPairs.profiles[0].rawLabels, swappedRawCountPairs.profiles[1].rawLabels] = [
    swappedRawCountPairs.profiles[1].rawLabels,
    swappedRawCountPairs.profiles[0].rawLabels,
  ];
  [swappedRawCountPairs.profiles[0].samplingCount.value, swappedRawCountPairs.profiles[1].samplingCount.value] = [
    swappedRawCountPairs.profiles[1].samplingCount.value,
    swappedRawCountPairs.profiles[0].samplingCount.value,
  ];
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(swappedRawCountPairs), /exact source-object raw label/i);
});

test("rejects semantic relabeling and duplicate activity contexts", async () => {
  const relabeledRegion = structuredClone(taxonomy);
  relabeledRegion.profiles[0].regionClass = "ventral";
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(relabeledRegion), /region class disagrees with its source label/i);

  const relabeledTransmitter = structuredClone(taxonomy);
  relabeledTransmitter.profiles[0].transmitterClass = "inhibitory";
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(relabeledTransmitter), /transmitter class disagrees with its source label/i);

  const duplicateActivity = structuredClone(taxonomy);
  const activeProfile = duplicateActivity.profiles.find((profile) => profile.activityEvidence.length > 0);
  activeProfile.activityEvidence.push(structuredClone(activeProfile.activityEvidence[0]));
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(duplicateActivity), /duplicate activity context/i);

  const wrongActivityLocator = structuredClone(taxonomy);
  const rotarodProfile = wrongActivityLocator.profiles.find((profile) => profile.activityEvidence.some((item) => item.context === "rotarod_locomotion"));
  rotarodProfile.activityEvidence.find((item) => item.context === "rotarod_locomotion").sourceLocatorIds = ["paper-figure-5", "paper-results-p27"];
  rotarodProfile.fieldLocators.activityEvidence = ["paper-figure-5", "paper-results-p27"];
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(wrongActivityLocator), /activity locators do not match the source context/i);

  const wrongLineageLocator = structuredClone(taxonomy);
  wrongLineageLocator.candidateLineageMappings[0].sourceLocatorIds = ["paper-results-p21"];
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(wrongLineageLocator), /lineage locators do not match the retained source paragraph/i);
});

test("locks the unresolved non-motor scope, sample frame, and fine evidence gaps", async () => {
  assert.deepEqual(taxonomy.source.geo.sampleFrame, {
    strain: "ICR/CD-1",
    ageWeeks: "8-12",
    sex: "balanced male and female samples",
    conditionSexBreakdown: {
      baseline: { malePooledSamples: 4, femalePooledSamples: 5 },
      formalin: { malePooledSamples: 3, femalePooledSamples: 2 },
      rotarod: { malePooledSamples: 3, femalePooledSamples: 2 },
    },
    geoAccessionCount: 24,
    independentDropSeqSampleCount: 19,
    baselineIndependentSampleCount: 9,
    formalinIndependentSampleCount: 5,
    rotarodIndependentSampleCount: 5,
    formalinSequencingReactionCount: 10,
    micePerPooledSample: 2,
    derivedMouseCountFromReportedPooling: 38,
    sourceLocatorIds: ["geo-series-record", "paper-methods-p34-p36", "geo-sample-form1"],
    interpretationBoundary: taxonomy.source.geo.sampleFrame.interpretationBoundary,
  });
  assert.match(taxonomy.source.geo.sampleFrame.interpretationBoundary, /different denominator levels/i);
  assert.equal(taxonomy.profiles.filter((profile) => profile.projectUseClass === "source_local_non_motor_neuron_unresolved").length, 42);
  assert.equal(taxonomy.profiles.filter((profile) => profile.projectUseClass === "motor_neuron_context").length, 1);
  assert.deepEqual(taxonomy.profiles[0].missingEvidence, {
    morphology: "not_measured",
    cellCoordinates: "not_available",
    sciContext: "not_measured",
    atlasRegistration: "not_established",
    electrophysiology: "not_measured",
    projectionTarget: "not_measured",
    synapticConnectivity: "not_measured",
    crossSourceSameCellIdentityLink: "not_established",
  });

  assert.deepEqual(taxonomy.profiles[0].fieldLocators.samplingCount, ["geo-cluster-metadata"]);
  assert.deepEqual(taxonomy.profiles[0].fieldLocators.projectUseClass, ["paper-figure-4-project-scope"]);
  assert.deepEqual(taxonomy.profiles[0].fieldLocators.putativeAssignmentStatus, ["paper-figure-4-project-scope"]);

  const promoted = structuredClone(taxonomy);
  promoted.profiles[0].projectUseClass = "motor_neuron_context";
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(promoted), /exactly 42 profiles must remain non-motor/i);

  const wrongSexFrame = structuredClone(taxonomy);
  wrongSexFrame.source.geo.sampleFrame.conditionSexBreakdown.baseline.malePooledSamples = 5;
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(wrongSexFrame), /baseline sex breakdown/i);

  const wrongProfileCountLocator = structuredClone(taxonomy);
  wrongProfileCountLocator.profiles[0].fieldLocators.samplingCount.push("paper-results-p11");
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(wrongProfileCountLocator), /per-profile sampling count must cite only/i);
});

test("requires canonical unique lineage mapping IDs", async () => {
  const duplicateMappingId = structuredClone(taxonomy);
  duplicateMappingId.candidateLineageMappings[1].id = duplicateMappingId.candidateLineageMappings[0].id;
  await assert.rejects(() => validateSathyamurthySourceTaxonomy(duplicateMappingId), /duplicate lineage mapping ID|not the canonical mapping ID/i);
});

test("preserves the raw DE12 anomaly, motor context, and source-object rights boundary", async () => {
  assert.deepEqual(taxonomy.rawLabelAnomalies[0], {
    rawLabel: "DE12",
    displayLabel: "DE-12",
    rowCount: 74,
    kind: "SOURCE_PUNCTUATION_ANOMALY",
    sourceLocatorIds: ["geo-cluster-metadata", "paper-figure-4"],
    boundary: "The raw GEO value remains preserved verbatim; only the display/paper label inserts the hyphen, and no biological merge or identity inference is performed.",
  });
  assert.equal(taxonomy.profiles.find((profile) => profile.sourceLocalLabel === "VC-2")?.projectUseClass, "motor_neuron_context");
  assert.equal(taxonomy.profiles.find((profile) => profile.sourceLocalLabel === "DE-1")?.projectUseClass, "source_local_non_motor_neuron_unresolved");
  assert.equal(taxonomy.source.geo.clusterMetadataAsset.sourceFileBundled, false);
  assert.equal(taxonomy.source.geo.clusterMetadataAsset.derivedFactualMetadataBundled, true);
  assert.equal(taxonomy.source.geo.clusterMetadataAsset.reuseStatus, "PUBLIC_ACCESS_REUSE_NOT_ASSUMED");
  assert.equal(taxonomy.source.publication.license.appliesTo, "article");
});
