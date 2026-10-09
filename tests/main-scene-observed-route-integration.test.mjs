import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [lens, fidelity, grp, dorsalPack, functionalPack, prpPack, premotorPack, censusChild, representation, explorer, mainSceneIndex, toddNtsPack] = await Promise.all([
  readFile(new URL("../data/observed-cell-form-lens-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/morphology-fidelity-contract-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/grp-dorsal-horn-observed-morphology-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/dorsal-horn-observed-morphology-route-pack-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/functional-class-observed-morphology-route-pack-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/premotor-comparison-observed-morphology-route-pack-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/census-child-observed-morphology-route-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/evidence-aware-3d-representation-contract-0.7.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../public/data/research_explorer_index_v1/search-index.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/neuromorpho-census-main-scene-index-0.1.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json", import.meta.url), "utf8").then(JSON.parse),
]);

test("retains named exact routes while exposing every frozen census geometry in the main scene", () => {
  const supplementary = [
    ...dorsalPack.routes.filter((route) => !route.censusMembership),
    ...functionalPack.routes,
    ...prpPack.routes,
    ...premotorPack.routes,
  ];
  const forms = [...lens.records, grp.observedCellFormRecord, ...supplementary.map((route) => route.observedCellFormRecord), censusChild.route.observedCellFormRecord];
  const fidelityRecords = [...fidelity.records, grp.fidelityRecord, ...supplementary.map((route) => route.fidelityRecord), censusChild.route.fidelityRecord];
  assert.deepEqual(forms.map((record) => record.neuronId).sort((a, b) => a - b), [45674, 45718, 50394, 50408, 50424, 104003, 108974, 108978, 109005, 109021, 170035, 242822, 249676, 260150]);
  assert.equal(new Set(forms.map((record) => record.neuronId)).size, 14, "the named route subset remains distinct from the selectable universe");
  const censusIds = mainSceneIndex.records.map((record) => record.neuronId);
  const supplementaryIds = forms.map((record) => record.neuronId).filter((id) => !censusIds.includes(id));
  assert.equal(new Set([...censusIds, ...supplementaryIds]).size, 149);
  assert.equal(supplementaryIds.length, 7);
  assert.equal(new Set(fidelityRecords.map((record) => record.geometry.path)).size, 14);
  assert.equal(mainSceneIndex.summary.censusRecordCount, 142);
  assert.equal(mainSceneIndex.summary.sourceReportedDimensionalityCounts["3D"], 140);
  assert.equal(mainSceneIndex.summary.sourceReportedDimensionalityCounts["2D"], 2);
  assert.equal(mainSceneIndex.summary.sourceReportedSecondaryCellClassCounts.Inhibitory, 15);
  assert.equal(mainSceneIndex.summary.sourceReportedSecondaryCellClassCounts.Excitatory, 125);
  assert.equal(mainSceneIndex.summary.sourceReportedSecondaryCellClassCounts["Not Reported"], 2);
  assert.equal(mainSceneIndex.records.find((record) => record.neuronId === 194468).geometry.dimensionality, "2D");
  assert.equal(mainSceneIndex.records.find((record) => record.neuronId === 194468).geometry.sourceDiameterAvailable, true);
  assert.equal(dorsalPack.runtimeMergePolicy.frozenCensusRecordCount, 142);
  assert.equal(functionalPack.runtimeMergePolicy.frozenCensusRecordCount, 142);
  assert.equal(dorsalPack.runtimeMergePolicy.censusExpansionCount, 0);
  assert.equal(functionalPack.runtimeMergePolicy.censusExpansionCount, 0);
  assert.equal(prpPack.runtimeMergePolicy.frozenCensusRecordCount, 142);
  assert.equal(prpPack.runtimeMergePolicy.censusExpansionCount, 0);
  assert.equal(premotorPack.runtimeMergePolicy.frozenCensusRecordCount, 142);
  assert.equal(premotorPack.runtimeMergePolicy.censusExpansionCount, 0);
  assert.equal(censusChild.route.censusMembership, true);
  assert.equal(censusChild.route.frozenLensMembership, false);
  assert.equal(censusChild.runtimeMergePolicy.censusRecordCount, 142);
  assert.equal(censusChild.runtimeMergePolicy.censusExpansionCount, 0);
});

test("reuses both frozen overlaps byte-for-byte and keeps all seven supplementary routes outside the census", () => {
  const lensById = new Map(lens.records.map((record) => [record.neuronId, record]));
  const fidelityById = new Map(fidelity.records.map((record) => [record.neuronId, record]));
  for (const neuronId of [104003, 108974]) {
    const route = dorsalPack.routes.find((candidate) => candidate.sourceRecord.neuronId === neuronId);
    assert.equal(route.censusMembership, true);
    assert.deepEqual(route.observedCellFormRecord, lensById.get(neuronId));
    assert.deepEqual(route.fidelityRecord, fidelityById.get(neuronId));
  }
  assert.deepEqual(dorsalPack.routes.filter((route) => !route.censusMembership).map((route) => route.sourceRecord.neuronId), [249676, 170035]);
  assert.deepEqual(functionalPack.routes.map((route) => route.sourceRecord.neuronId), [45674, 50424]);
  assert.ok(functionalPack.routes.every((route) => route.censusMembership === false));
  assert.deepEqual(prpPack.routes.map((route) => route.sourceRecord.neuronId), [50394, 50408]);
  assert.ok(prpPack.routes.every((route) => route.censusMembership === false));
  assert.deepEqual(premotorPack.routes.map((route) => route.sourceRecord.neuronId), [45718]);
  assert.ok(premotorPack.routes.every((route) => route.censusMembership === false));
});

test("covers every named observed route with an exact fail-closed representation route", () => {
  const namedRoutes = [grp.routeId, ...dorsalPack.routes.map((route) => route.routeId), censusChild.route.routeId, ...functionalPack.routes.map((route) => route.routeId), ...prpPack.routes.map((route) => route.routeId), ...premotorPack.routes.map((route) => route.routeId)];
  const representationById = new Map(representation.routes.map((route) => [route.routeId, route]));
  assert.equal(namedRoutes.length, 11);
  for (const routeId of namedRoutes) {
    const route = representationById.get(routeId);
    assert.ok(route, `missing representation route ${routeId}`);
    assert.equal(route.crossSourceIdentityCount, 0);
    assert.equal(route.projectRegistrationCount, 0);
    assert.ok(route.representationStateIds.includes("UNAVAILABLE"));
  }
  assert.deepEqual(representationById.get("mouse.sc.grpr_lamina_i_ii.observed.nmo_249676").representationStateIds, ["OBS_SKELETON", "UNAVAILABLE"]);
  assert.deepEqual(representationById.get("mouse.sc.pv_pax2_lamina_ii_iii.observed.nmo_170035").representationStateIds, ["OBS_SKELETON", "UNAVAILABLE"]);
  for (const routeId of ["mouse.sc.renshaw_l5_lamina_vii.observed.nmo_45674", "mouse.sc.npy_l2i_dorsal_horn.observed.nmo_50424", "mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394", "mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408", "mouse.sc.repository_labeled_premotor_non_renshaw_l5_ventral_horn.observed.nmo_45718"]) {
    assert.deepEqual(representationById.get(routeId).representationStateIds, ["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"]);
    assert.equal(representationById.get(routeId).missingLayerPolicy, "zero_primitives");
  }
  const nmo108978 = representationById.get(censusChild.route.routeId);
  assert.deepEqual(nmo108978.representationStateIds, ["OBS_SKELETON", "DER_RADIUS_SURFACE", "OBS_SOURCE_NATIVE_SOMA_LINE_LOOP", "UNAVAILABLE"]);
  assert.equal(nmo108978.representationFrames[0].overlayAllowed, false);
  assert.equal(nmo108978.representationFrames[1].primitiveCount, 12);
  assert.equal(nmo108978.representationFrames[1].vertexCount, 2614);
});

test("resolves all thirty 8.6.126 supplementary selections to their own exact representation receipt", () => {
  const representationById = new Map(representation.routes.map((route) => [route.routeId, route]));
  const routes = toddNtsPack.routes.map((sourceRoute) => representationById.get(sourceRoute.routeId));
  assert.equal(routes.length, 30);
  assert.ok(routes.every(Boolean));
  assert.deepEqual(routes.map((route) => route.stableIdAuthority), toddNtsPack.routes.map((route) => route.sourceRecord.assetId));
  assert.ok(routes.every((route) => route.representationStateIds.includes("OBS_SKELETON") && route.representationStateIds.includes("UNAVAILABLE")));
  assert.ok(routes.every((route) => route.crossSourceIdentityCount === 0 && route.projectRegistrationCount === 0));
  assert.equal(routes.filter((route) => route.representationStateIds.includes("DER_RADIUS_SURFACE")).length, 10);
  assert.equal(routes.filter((route) => !route.representationStateIds.includes("DER_RADIUS_SURFACE")).length, 20);
});

test("exposes 142 census plus seven supplementary explorer objects without expanding the frozen census", () => {
  const morphologyRecords = explorer.records.filter((record) => record.focusKind === "morphology_record");
  const morphologyFocusIds = new Set(morphologyRecords.map((record) => record.focusId));
  const censusRecords = morphologyRecords.filter((record) => record.morphologyMembership.collection === "census");
  const supplementaryRecords = morphologyRecords.filter((record) => record.morphologyMembership.collection === "supplementary");
  assert.equal(morphologyFocusIds.size, 149);
  assert.equal(censusRecords.length, 142);
  assert.equal(supplementaryRecords.length, 7);
  assert.equal(new Set([...lens.records, grp.observedCellFormRecord, ...[
    ...dorsalPack.routes.filter((route) => !route.censusMembership),
    ...functionalPack.routes,
    ...prpPack.routes,
    ...premotorPack.routes,
  ].map((route) => route.observedCellFormRecord), censusChild.route.observedCellFormRecord].map((record) => record.neuronId)).size, 14);
  assert.equal(morphologyFocusIds.has("NeuroMorpho:108978"), true);
  assert.equal(morphologyFocusIds.has("NeuroMorpho:104003"), true);
  assert.equal(morphologyFocusIds.has("NeuroMorpho:108974"), true);
  for (const neuronId of [170035, 249676, 45674, 50424, 50394, 50408, 45718]) {
    assert.equal(morphologyFocusIds.has(`NeuroMorpho:${neuronId}`), true);
    const record = morphologyRecords.find((candidate) => candidate.focusId === `NeuroMorpho:${neuronId}`);
    assert.equal(record.morphologyMembership.censusContribution, 0);
    assert.equal(record.morphologyMembership.supplementaryContribution, 1);
  }
  assert.deepEqual(dorsalPack.runtimeMergePolicy.supplementaryNeuronIds, [170035, 249676]);
  assert.deepEqual(functionalPack.runtimeMergePolicy.supplementaryNeuronIds, [45674, 50424]);
  assert.deepEqual(prpPack.runtimeMergePolicy.supplementaryNeuronIds, [50394, 50408]);
  assert.deepEqual(premotorPack.runtimeMergePolicy.supplementaryNeuronIds, [45718]);
});
