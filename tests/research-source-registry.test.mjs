import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  EXPECTED_RESEARCH_SOURCE_IDS,
  summarizeResearchSourceRegistry,
  validateResearchSourceUpgradeLinks,
  validateResearchSourceRegistry,
} from "../scripts/validate-research-source-registry-0.1.mjs";

const registry = JSON.parse(await readFile(new URL("../data/research-source-registry-0.1.json", import.meta.url), "utf8"));
const upgradeRegistry = JSON.parse(await readFile(new URL("../data/research-model-upgrade-registry-0.1.json", import.meta.url), "utf8"));
const dorsalHornRoutePackAssetManifestBytes = await readFile(new URL("../public/data/dorsal_horn_observed_morphology_route_pack_v1/asset-manifest.json", import.meta.url));
const dorsalHornRoutePackAssetManifest = JSON.parse(dorsalHornRoutePackAssetManifestBytes.toString("utf8"));
const functionalClassRoutePackAssetManifestBytes = await readFile(new URL("../public/data/functional_class_observed_morphology_route_pack_v1/asset-manifest.json", import.meta.url));
const functionalClassRoutePackAssetManifest = JSON.parse(functionalClassRoutePackAssetManifestBytes.toString("utf8"));
const prpDorsalHornRoutePackAssetManifestBytes = await readFile(new URL("../public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/asset-manifest.json", import.meta.url));
const prpDorsalHornRoutePackAssetManifest = JSON.parse(prpDorsalHornRoutePackAssetManifestBytes.toString("utf8"));
const premotorComparisonRoutePackAssetManifestBytes = await readFile(new URL("../public/data/premotor_comparison_observed_morphology_route_pack_v1/asset-manifest.json", import.meta.url));
const premotorComparisonRoutePackAssetManifest = JSON.parse(premotorComparisonRoutePackAssetManifestBytes.toString("utf8"));
const nativeSomaContourBytes = await readFile(new URL("../public/data/premotor_comparison_observed_morphology_route_pack_v1/native-contours/nmo-45718-soma-contours.json", import.meta.url));
const nativeSomaContours = JSON.parse(nativeSomaContourBytes.toString("utf8"));
const nativeContourCatalogBytes = await readFile(new URL("../data/neurolucida-native-contour-admission-catalog-0.3.json", import.meta.url));
const nativeContourCatalog = JSON.parse(nativeContourCatalogBytes.toString("utf8"));
const neuromorphoReleaseDeltaBytes = await readFile(new URL("../data/neuromorpho-release-8-6-125-query-delta-audit-0.1.json", import.meta.url));
const neuromorphoReleaseDelta = JSON.parse(neuromorphoReleaseDeltaBytes.toString("utf8"));
const renshawNativeContourBytes = await readFile(new URL("../public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-45674-source-closed-soma-contours.json", import.meta.url));
const toddNativeContourBytes = new Map(await Promise.all([
  [50424, "../public/data/functional_class_observed_morphology_route_pack_v1/native-contours/nmo-50424-mbf-cell-body-line-loops.json"],
  [50394, "../public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50394-mbf-cell-body-line-loops.json"],
  [50408, "../public/data/prp_dorsal_horn_observed_morphology_route_pack_v1/native-contours/nmo-50408-mbf-cell-body-line-loops.json"],
].map(async ([neuronId, assetPath]) => [neuronId, await readFile(new URL(assetPath, import.meta.url))])));
const roomeTaxonomyBytes = await readFile(new URL("../data/roome-dil-source-taxonomy-0.1.json", import.meta.url));
const roomeFeatureEvidenceBytes = await readFile(new URL("../data/roome-dil-differential-features-0.1.json", import.meta.url));
const [
  publicCatalog,
  researchMvp,
  russ,
  sathyamurthy,
  hayashi,
  haring,
  alkaslasi,
  delile,
  dmrt3Di6,
  roome,
  knowledgeCoverage,
  matson,
  internalReference,
  superClem,
  morphologyCensus,
  dorsalHornRoutePack,
  censusChildMorphologyRoute,
  functionalClassRoutePack,
  prpDorsalHornRoutePack,
  premotorComparisonRoutePack,
  ronzanoPositions,
  kellyTaxonomy,
] = await Promise.all([
  "../data/public-data-catalog-0.4.json",
  "../data/research-mvp-release-0.2.json",
  "../data/russ-harmonized-taxonomy-crosswalk-0.1.json",
  "../data/sathyamurthy-source-taxonomy-0.1.json",
  "../data/hayashi-v2a-source-taxonomy-0.1.json",
  "../data/haring-dorsal-horn-source-taxonomy-0.1.json",
  "../data/alkaslasi-cholinergic-source-taxonomy-0.1.json",
  "../data/delile-developmental-interneuron-taxonomy-0.1.json",
  "../data/dmrt3-di6-source-taxonomy-0.1.json",
  "../data/roome-dil-source-taxonomy-0.1.json",
  "../data/interneuron-knowledge-coverage-0.1.json",
  "../data/matson-neuronal-sci-timecourse-0.1.json",
  "../data/cross-region-internal-reference-0.1.json",
  "../data/super-clem-synapse-reference-0.1.json",
  "../public/data/neuromorpho_release_8_6_124_census_v1/census-index.json",
  "../data/dorsal-horn-observed-morphology-route-pack-0.1.json",
  "../data/census-child-observed-morphology-route-0.1.json",
  "../data/functional-class-observed-morphology-route-pack-0.1.json",
  "../data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json",
  "../data/premotor-comparison-observed-morphology-route-pack-0.1.json",
  "../public/data/ronzano_premotor_positions_v1/positions.json",
  "../data/kelly-zebrafish-spinal-interneuron-taxonomy-0.1.json",
].map(async (relativePath) => JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"))));

function source(sourceId, value = registry) {
  return value.sources.find((candidate) => candidate.id === sourceId);
}

function recordSet(recordSetId, value = registry) {
  return value.sources.flatMap((item) => item.recordSets).find((candidate) => candidate.recordSetId === recordSetId);
}

test("validates 32 canonical research sources without creating a registration or cross-source identity", () => {
  assert.equal(validateResearchSourceRegistry(registry), registry);
  assert.equal(validateResearchSourceUpgradeLinks(registry, upgradeRegistry), registry);
  assert.deepEqual(new Set(registry.sources.map((item) => item.id)), new Set(EXPECTED_RESEARCH_SOURCE_IDS));
  const summary = summarizeResearchSourceRegistry(registry);
  assert.deepEqual(summary, {
    releaseId: "ohri-research-source-registry-0.1.0",
    sourceCount: 32,
    recordSetCount: 42,
    aliasCount: registry.sources.reduce((total, item) => total + item.aliases.length, 0),
    typeRecordCount: 387,
    bundledExactRosterCount: 13,
    bundledExactSourceObjectSetCount: 4,
    openScopeContradictionCount: 0,
    registrationCount: 0,
  });
  assert.ok(registry.sources.every((item) => item.recordSets.every((set) => set.canonicalIdentityStatus === "source_local_not_cross_source_canonical")));
  const fishSource = source("SRC-KELLY-ZEBRAFISH-2023");
  assert.equal(fishSource.citation.doi, kellyTaxonomy.source.article.doi);
  assert.equal(fishSource.speciesScopes[0].scientificName, "Danio rerio");
  assert.equal(fishSource.lifeStageScopes[0].value, "4 dpf larva");
  assert.equal(recordSet("RS-KELLY-GSE232801-ARTICLE-REPORTED-INTERNEURON-LABELS").includedRecordCount.value, kellyTaxonomy.populations.length);
  assert.equal(recordSet("RS-KELLY-GSE232801-ARTICLE-REPORTED-INTERNEURON-LABELS").childRosterRef.status, "not_linkable");
  assert.equal(fishSource.assets.find((item) => item.id === "ASSET-KELLY-GSE232801-NEURONS-RDS").bundled, false);
  const bancSource = source("SRC-BANC-V888-IN14A018");
  const bancRoute = recordSet("RS-BANC-V888-IN14A018-MORPHOLOGY");
  assert.equal(bancSource.speciesScopes[0].scientificName, "Drosophila melanogaster");
  assert.equal(bancSource.regionScopes[0].value, "ventral nerve cord");
  assert.equal(bancRoute.includedRecordCount.value, 1);
  assert.match(bancRoute.includedRecordCount.scope, /not a species-wide or interneuron denominator/);
  assert.equal(bancRoute.sourceObjectSetRef.status, "bundled_exact");
  assert.ok(bancSource.linkedUpgradeIds.includes("UPG-248"));
  const nmoSource = source("SRC-NEUROMORPHO-8-6-124");
  const nmoDeltaAsset = nmoSource.assets.find((item) => item.id === "ASSET-NEUROMORPHO-RELEASE-8-6-125-METADATA-DELTA");
  assert.ok(nmoSource.linkedUpgradeIds.includes("UPG-228"));
  assert.equal(nmoDeltaAsset.integrity.bytes, neuromorphoReleaseDeltaBytes.byteLength);
  assert.equal(nmoDeltaAsset.integrity.sha256, createHash("sha256").update(neuromorphoReleaseDeltaBytes).digest("hex"));
  assert.equal(neuromorphoReleaseDelta.comparison.changedSemanticMetadataRecordCount, 0);
  assert.equal(neuromorphoReleaseDelta.assetAndAdmissionBoundaries.activeGeometryReleaseRemains, "8.6.124");
});

test("resolves every research milestone link while retaining governance IDs in a separate namespace", () => {
  assert.ok(registry.sources.every((item) => item.linkedUpgradeIds.every((id) => upgradeRegistry.upgrades.some((upgrade) => upgrade.id === id))));
  assert.deepEqual(source("SRC-SPINALJ-MKC37W4RRV-1").linkedGovernanceIds, ["UPG-001B"]);
  assert.ok(source("SRC-CANOGOMEZ-2026").linkedUpgradeIds.includes("UPG-190"));
  assert.ok(source("SRC-CANOGOMEZ-2026").linkedUpgradeIds.includes("UPG-191"));
  assert.ok(source("SRC-CANOGOMEZ-2026").linkedUpgradeIds.includes("UPG-204"));

  const unresolved = structuredClone(registry);
  source("SRC-SPINALJ-MKC37W4RRV-1", unresolved).linkedUpgradeIds.push("UPG-001B");
  assert.throws(() => validateResearchSourceUpgradeLinks(unresolved, upgradeRegistry), /linked research upgrade is unresolved/i);

  const missingCanoAudit = structuredClone(registry);
  source("SRC-CANOGOMEZ-2026", missingCanoAudit).linkedUpgradeIds = source("SRC-CANOGOMEZ-2026", missingCanoAudit).linkedUpgradeIds
    .filter((id) => id !== "UPG-190");
  assert.throws(() => validateResearchSourceRegistry(missingCanoAudit), /Cano-Gomez RDS\/Table S1 audit/i);

  const missingCanoBridge = structuredClone(registry);
  source("SRC-CANOGOMEZ-2026", missingCanoBridge).linkedUpgradeIds = source("SRC-CANOGOMEZ-2026", missingCanoBridge).linkedUpgradeIds
    .filter((id) => id !== "UPG-191");
  assert.throws(() => validateResearchSourceRegistry(missingCanoBridge), /Cano-Gomez BIL identity bridge/i);

  const missingCanoRegistry = structuredClone(registry);
  source("SRC-CANOGOMEZ-2026", missingCanoRegistry).linkedUpgradeIds = source("SRC-CANOGOMEZ-2026", missingCanoRegistry).linkedUpgradeIds
    .filter((id) => id !== "UPG-204");
  assert.throws(() => validateResearchSourceRegistry(missingCanoRegistry), /Cano-Gomez confirmed-only P56 registry/i);
});

test("resolves every legacy source dialect to one canonical source id", () => {
  const aliases = new Map(registry.sources.flatMap((item) => item.aliases.map((alias) => [alias, item.id])));
  assert.equal(aliases.get("PDS-RUSS-2021"), "SRC-RUSS-2021");
  assert.equal(aliases.get("russ-2021"), "SRC-RUSS-2021");
  assert.equal(aliases.get("SRC-P09"), "SRC-KATHE-2022");
  assert.equal(aliases.get("haring-2018:GSE103840"), "SRC-HARING-2018");
  assert.equal(aliases.get("hayashi-2018"), "SRC-HAYASHI-2018");
  assert.equal(aliases.get("alkaslasi-2021:GSE167597"), "SRC-ALKASLASI-2021");
  assert.equal(aliases.get("delile-2019:E-MTAB-7320"), "SRC-DELILE-2019");
  assert.equal(aliases.get("E-MTAB-7320"), "SRC-DELILE-2019");
  assert.equal(aliases.get("iglesias-gonzalez-2021:gse185731:mmusculus"), "SRC-IGLESIAS-GONZALEZ-2021");
  assert.equal(aliases.get("GSE185731"), "SRC-IGLESIAS-GONZALEZ-2021");
  assert.equal(aliases.get("roome-2026"), "SRC-ROOME-2026");
  assert.equal(aliases.get("roome-2026:GSE291462"), "SRC-ROOME-2026");
  assert.equal(aliases.get("GSE291462"), "SRC-ROOME-2026");
  assert.equal(aliases.get("GSE291459"), "SRC-ROOME-2026");
  assert.equal(aliases.get("GSE291460"), "SRC-ROOME-2026");
  assert.equal(aliases.get("MICRONS_PHASE1_V185_4"), "SRC-MICRONS-PHASE1-V185-4");
  assert.equal(aliases.get("SUPERCLEM_GLYR_17816747_V1"), "SRC-SUPERCLEM-GLYR-17816747-V1");
  assert.equal(aliases.get("ronzano-2022-e81976"), "SRC-RONZANO-2022-81976");
  assert.equal(aliases.get("eLife-81976"), "SRC-RONZANO-2022-81976");
  assert.equal(aliases.get("crozat-2025:figshare-29430869-v2"), "SRC-CROZAT-2025");
  assert.equal(aliases.get("Figshare:29430869.v2"), "SRC-CROZAT-2025");
  assert.equal(aliases.get("GSE232801"), "SRC-KELLY-ZEBRAFISH-2023");
  assert.equal(aliases.size, registry.sources.reduce((total, item) => total + item.aliases.length, 0));
});

test("reconciles the current catalog, evidence, taxonomy, morphology, and internal-reference source universes", () => {
  const aliases = new Map(registry.sources.flatMap((item) => item.aliases.map((alias) => [alias, item.id])));
  assert.ok(publicCatalog.sources.every((item) => aliases.has(item.id)), "Every public-catalog source must resolve canonically");
  assert.ok(researchMvp.sources.every((item) => aliases.has(item.id)), "Every SCI evidence source must resolve canonically");
  assert.ok(internalReference.sources.every((item) => aliases.has(item.id)), "Every internal-reference source must resolve canonically");
  assert.equal(knowledgeCoverage.lanes.length, 8);
  assert.ok(knowledgeCoverage.lanes.every((lane) => aliases.has(lane.id)), "Every knowledge-coverage lane must resolve canonically");
  assert.ok(knowledgeCoverage.lanes.every((lane) => source(aliases.get(lane.id)).researchLanes.includes("coverage")), "Every knowledge-coverage source must declare that lane");

  for (const item of researchMvp.sources) {
    assert.equal(source(aliases.get(item.id)).citation.doi, item.doi);
  }
  for (const item of internalReference.sources) {
    assert.equal(source(aliases.get(item.id)).citation.doi, item.primaryDoi);
  }

  assert.equal(recordSet("RS-RUSS-POPULATIONS").includedRecordCount.value, russ.populations.length);
  assert.equal(recordSet("RS-SATHYAMURTHY-CLUSTERS").includedRecordCount.value, sathyamurthy.profiles.length);
  assert.equal(recordSet("RS-HAYASHI-CLUSTERS").includedRecordCount.value, hayashi.profiles.length);
  assert.equal(recordSet("RS-HARING-FINAL-TYPES").includedRecordCount.value, haring.profiles.length);
  assert.equal(recordSet("RS-ALKASLASI-INTERNEURON-CLUSTERS").includedRecordCount.value, alkaslasi.profiles.length);
  assert.equal(recordSet("RS-DELILE-FINE-SUBTYPES").includedRecordCount.value, delile.profiles.length);
  assert.equal(recordSet("RS-DMRT3-DI6-M1-M6-GROUPS").includedRecordCount.value, dmrt3Di6.profiles.length);
  assert.equal(recordSet("RS-ROOME-REFINED-DIL-TYPES").includedRecordCount.value, roome.profiles.length);
  assert.equal(recordSet("RS-MATSON-NEURONAL-POPULATIONS").includedRecordCount.value, matson.populations.length);
  assert.equal(recordSet("RS-NEUROMORPHO-RECONSTRUCTIONS").includedRecordCount.value, morphologyCensus.records.length);
  assert.equal(recordSet("RS-NEUROMORPHO-DORSAL-HORN-ROUTE-PACK").includedRecordCount.value, censusChildMorphologyRoute.dorsalHornRouteSet.routeCount);
  assert.equal(recordSet("RS-NEUROMORPHO-FUNCTIONAL-CLASS-ROUTE-PACK").includedRecordCount.value, functionalClassRoutePack.routes.length);
  assert.equal(recordSet("RS-NEUROMORPHO-PRP-DORSAL-HORN-ROUTE-PACK").includedRecordCount.value, prpDorsalHornRoutePack.routes.length);

  const broadHaring = knowledgeCoverage.lanes.find((lane) => lane.id === "haring-2018");
  assert.match(broadHaring.sampleFrame, /aged 17–28 days \(P17–P28/);
  assert.match(broadHaring.sampleFrame, /does not assert an adult, juvenile or young-adult category/);
  assert.match(broadHaring.coverage.find((entry) => entry.axisId === "life_stage").evidence, /17–28 days after birth \(P17–P28\)/);
  assert.equal(haring.scope.lifeStage, "postnatal P17-P28");
  assert.equal(haring.scope.lifeStageCategory, null);
  assert.match(haring.source.geo.sampleFrame.ageNormalization, /does not assert an adult, juvenile, or young-adult category/);

  const superClemAsset = source("SRC-SUPERCLEM-GLYR-17816747-V1").assets[0];
  assert.equal(superClemAsset.accession, superClem.sourceObject.sourceObjectId);
  assert.equal(superClemAsset.integrity.bytes, superClem.sourceObject.localOriginal.bytes);
  assert.equal(superClemAsset.integrity.sha256, superClem.sourceObject.localOriginal.sha256);

  const ronzanoRecordSet = recordSet("RS-RONZANO-PREMOTOR-POSITIONS");
  const ronzanoAsset = source("SRC-RONZANO-2022-81976").assets[0];
  assert.equal(ronzanoRecordSet.includedRecordCount.value, ronzanoPositions.totals.coordinateRowCountAcrossRepresentations);
  assert.equal(ronzanoRecordSet.childRosterRef.path, "public/data/ronzano_premotor_positions_v1/positions.json");
  assert.equal(ronzanoRecordSet.childRosterRef.idField, "sourceFileId+sourceRow");
  assert.equal(ronzanoAsset.integrity.bytes, 1274690);
  assert.equal(ronzanoAsset.integrity.sha256, "abf46460d0e37c2ea82b90f2eaf6531d5df8f44e9dcea8448d43d321835184f3");
});

test("registers five dorsal-horn route memberships without duplicating frozen overlaps or expanding the 142-record census", () => {
  const neuromorpho = source("SRC-NEUROMORPHO-8-6-124");
  const census = recordSet("RS-NEUROMORPHO-RECONSTRUCTIONS");
  const routePack = recordSet("RS-NEUROMORPHO-DORSAL-HORN-ROUTE-PACK");
  const asset = neuromorpho.assets.find((item) => item.id === "ASSET-NEUROMORPHO-DORSAL-HORN-ROUTE-PACK");

  assert.equal(registry.sourceCount, 32);
  assert.equal(registry.sources.flatMap((item) => item.recordSets).length, 42);
  assert.equal(registry.sources.flatMap((item) => item.recordSets).filter((item) => item.childRosterRef.status === "bundled_exact").length, 13);
  assert.equal(registry.sources.flatMap((item) => item.recordSets).filter((item) => item.sourceObjectSetRef?.status === "bundled_exact").length, 4);
  assert.deepEqual(neuromorpho.lifeStageScopes.map((scope) => [scope.value, scope.context]), [
    ["adult", "142 admitted census records; active route children include NMO 104003, 108974 and 108978, with only 104003 and 108974 overlapping the frozen five-record lens"],
    ["young", "supplementary dorsal-horn record NMO 249676, functional-class Renshaw record NMO 45674, and repository-labelled premotor comparison record NMO 45718; all outside the 142-record adult-query census"],
    ["young adult", "supplementary dorsal-horn record NMO 170035, functional-class NPY record NMO 50424, and PrP-reporter records NMO 50394 and 50408; all outside the 142-record adult-query census"],
  ]);
  assert.equal(census.includedRecordCount.value, 142);
  assert.equal(routePack.includedRecordCount.value, 5);
  assert.equal(routePack.includedRecordCount.unit, "route_memberships");
  assert.equal(routePack.childRosterRef.status, "bundled_exact");
  assert.equal(routePack.childRosterRef.path, "data/census-child-observed-morphology-route-0.1.json");
  assert.deepEqual(censusChildMorphologyRoute.dorsalHornRouteSet.members.map((member) => member.assetId), [
    "NeuroMorpho:249676",
    "NeuroMorpho:108974",
    "NeuroMorpho:170035",
    "NeuroMorpho:104003",
    "NeuroMorpho:108978",
  ]);
  assert.equal(censusChildMorphologyRoute.dorsalHornRouteSet.members.filter((member) => member.censusMembership).length, 3);
  assert.equal(censusChildMorphologyRoute.dorsalHornRouteSet.members.filter((member) => member.frozenLensMembership).length, 2);
  assert.equal(censusChildMorphologyRoute.dorsalHornRouteSet.censusExpansionCount, 0);
  assert.deepEqual(dorsalHornRoutePack.routes.map((route) => route.sourceRecord.neuronId), [249676, 108974, 170035, 104003]);
  assert.deepEqual(dorsalHornRoutePack.routes.filter((route) => route.censusMembership).map((route) => route.sourceRecord.neuronId).sort((a, b) => a - b), [104003, 108974]);
  assert.deepEqual(dorsalHornRoutePack.routes.filter((route) => !route.censusMembership).map((route) => route.sourceRecord.neuronId).sort((a, b) => a - b), [170035, 249676]);
  assert.equal(dorsalHornRoutePack.runtimeMergePolicy.frozenCensusRecordCount, 142);
  assert.equal(dorsalHornRoutePack.runtimeMergePolicy.censusExpansionCount, 0);
  assert.equal(dorsalHornRoutePackAssetManifest.summary.supplementaryNeuronCount, 2);
  assert.deepEqual([...new Set(dorsalHornRoutePackAssetManifest.files.map((file) => file.neuronId))].sort((a, b) => a - b), [170035, 249676]);
  assert.equal(asset.integrity.bytes, dorsalHornRoutePackAssetManifestBytes.byteLength);
  assert.equal(asset.integrity.sha256, createHash("sha256").update(dorsalHornRoutePackAssetManifestBytes).digest("hex"));

  const inflated = structuredClone(registry);
  recordSet("RS-NEUROMORPHO-RECONSTRUCTIONS", inflated).includedRecordCount.value = 146;
  assert.throws(() => validateResearchSourceRegistry(inflated), /RS-NEUROMORPHO-RECONSTRUCTIONS|census denominator/i);

  const widenedAge = structuredClone(registry);
  source("SRC-NEUROMORPHO-8-6-124", widenedAge).lifeStageScopes[1].value = "adult";
  assert.throws(() => validateResearchSourceRegistry(widenedAge), /adult, young, and young-adult scopes/i);
});

test("registers two exact functional-class routes as a separate supplementary record set with fail-closed DAT, physiology, and metadata-conflict boundaries", () => {
  const neuromorpho = source("SRC-NEUROMORPHO-8-6-124");
  const routePack = recordSet("RS-NEUROMORPHO-FUNCTIONAL-CLASS-ROUTE-PACK");
  const asset = neuromorpho.assets.find((item) => item.id === "ASSET-NEUROMORPHO-FUNCTIONAL-CLASS-ROUTE-PACK");
  const missingness = new Map(neuromorpho.missingness.map((item) => [item.field, item]));

  assert.equal(routePack.includedRecordCount.value, 2);
  assert.equal(routePack.includedRecordCount.unit, "supplementary_reconstructions");
  assert.equal(routePack.childRosterRef.status, "bundled_exact");
  assert.equal(routePack.childRosterRef.path, "data/functional-class-observed-morphology-route-pack-0.1.json");
  assert.deepEqual(functionalClassRoutePack.routes.map((route) => route.sourceRecord.neuronId), [45674, 50424]);
  assert.ok(functionalClassRoutePack.routes.every((route) => route.censusMembership === false));
  assert.equal(functionalClassRoutePack.runtimeMergePolicy.frozenCensusRecordCount, 142);
  assert.equal(functionalClassRoutePack.runtimeMergePolicy.censusExpansionCount, 0);
  assert.equal(functionalClassRoutePack.summary.nativeDatSemanticAdmissionCount, 0);
  assert.equal(functionalClassRoutePack.summary.sameCellElectrophysiologyJoinCount, 0);
  assert.equal(functionalClassRoutePack.summary.renderedInternalPrimitiveCount, 0);
  assert.equal(functionalClassRoutePack.summary.projectRegistrationCount, 0);
  assert.equal(functionalClassRoutePackAssetManifest.summary.supplementaryNeuronCount, 2);
  assert.equal(asset.integrity.bytes, functionalClassRoutePackAssetManifestBytes.byteLength);
  assert.equal(asset.integrity.sha256, createHash("sha256").update(functionalClassRoutePackAssetManifestBytes).digest("hex"));
  assert.equal(missingness.get("source_native_DAT_semantics").status, "PARTIALLY_AVAILABLE");
  assert.equal(missingness.get("same_cell_electrophysiology").status, "UNAVAILABLE");
  assert.equal(missingness.get("repository_metadata_conflicts").status, "CONFLICT_UNRESOLVED");

  const hiddenConflict = structuredClone(registry);
  source("SRC-NEUROMORPHO-8-6-124", hiddenConflict).missingness.find((item) => item.field === "repository_metadata_conflicts").status = "RESOLVED";
  assert.throws(() => validateResearchSourceRegistry(hiddenConflict), /metadata conflicts/i);
});

test("registers two exact PrP-reporter dorsal-horn routes without promoting DAT, physiology, marker exclusivity, internals, identities, or registration", () => {
  const neuromorpho = source("SRC-NEUROMORPHO-8-6-124");
  const census = recordSet("RS-NEUROMORPHO-RECONSTRUCTIONS");
  const routePack = recordSet("RS-NEUROMORPHO-PRP-DORSAL-HORN-ROUTE-PACK");
  const asset = neuromorpho.assets.find((item) => item.id === "ASSET-NEUROMORPHO-PRP-DORSAL-HORN-ROUTE-PACK");
  const missingness = new Map(neuromorpho.missingness.map((item) => [item.field, item]));

  assert.equal(registry.releaseDate, "2026-09-23");
  assert.equal(registry.sourceCount, 32);
  assert.equal(registry.sources.flatMap((item) => item.recordSets).length, 42);
  assert.equal(registry.sources.flatMap((item) => item.recordSets).filter((item) => item.childRosterRef.status === "bundled_exact").length, 13);
  assert.equal(registry.sources.flatMap((item) => item.recordSets).filter((item) => item.sourceObjectSetRef?.status === "bundled_exact").length, 4);
  assert.equal(census.includedRecordCount.value, 142);
  assert.equal(routePack.includedRecordCount.value, 2);
  assert.equal(routePack.includedRecordCount.unit, "supplementary_reconstructions");
  assert.equal(routePack.childRosterRef.status, "bundled_exact");
  assert.equal(routePack.childRosterRef.path, "data/prp-dorsal-horn-observed-morphology-route-pack-0.1.json");
  assert.deepEqual(prpDorsalHornRoutePack.routes.map((route) => route.routeId), [
    "mouse.sc.nnos_prp_l2i_dorsal_horn.observed.nmo_50394",
    "mouse.sc.galanin_prp_l2i_dorsal_horn.observed.nmo_50408",
  ]);
  assert.deepEqual(prpDorsalHornRoutePack.routes.map((route) => route.sourceRecord.neuronId), [50394, 50408]);
  assert.ok(prpDorsalHornRoutePack.routes.every((route) => route.censusMembership === false));
  assert.ok(prpDorsalHornRoutePack.routes.every((route) => route.sourceRecord.repositoryWeightGrams.minimum === 27
    && route.sourceRecord.repositoryWeightGrams.maximum === 15
    && route.sourceRecord.repositoryWeightGrams.validForBiologicalInterpretation === false));
  assert.deepEqual(prpDorsalHornRoutePack.routes.map((route) => ({
    neuronId: route.sourceRecord.neuronId,
    metadata: route.sourceObjects.metadata.sha256,
    morphometry: route.sourceObjects.morphometry.sha256,
    swc: route.sourceObjects.swc.sha256,
    originalDat: route.sourceObjects.originalDat.sha256,
  })), [
    {
      neuronId: 50394,
      metadata: "d5954d795e3a2308ae3bb7077d546766641b2e169c4be73f2bfdaa0c663081d1",
      morphometry: "b2e1da4a3ae35e854969a16357c014851745b2c67020b372615a03de77ef9162",
      swc: "adeb2b0c6934ae07f32d54e8fcaebc8cee29429d884e44692756ee15da8a00d2",
      originalDat: "eceb6bc0cd2247e2ef2c51c6063b97db64d194d8483ef6d7427c715d9054a109",
    },
    {
      neuronId: 50408,
      metadata: "6d6be05370c9054aa0956ad3cdfb0ec94acfad560216b57da5d67fe5d32f2444",
      morphometry: "9c849e5a828b99f37e215dc1b09856617a70b2ef1c0505ff3b81a151d028606d",
      swc: "452c2b3d76d9680318470ba16b5c271a403018a1c6dcedaa94b68f1fdec6c470",
      originalDat: "78cfeae785b8ab4cf0792e7223cf310cd4aef1e3caa3447aa14ca61421ed9cb2",
    },
  ]);
  assert.equal(prpDorsalHornRoutePack.runtimeMergePolicy.frozenCensusRecordCount, 142);
  assert.equal(prpDorsalHornRoutePack.runtimeMergePolicy.censusExpansionCount, 0);
  assert.equal(prpDorsalHornRoutePack.summary.routeCount, 2);
  assert.equal(prpDorsalHornRoutePack.summary.nativeDatSemanticAdmissionCount, 0);
  assert.equal(prpDorsalHornRoutePack.summary.sameCellElectrophysiologyJoinCount, 0);
  assert.equal(prpDorsalHornRoutePack.summary.sameSpecimenInternalStructureCount, 0);
  assert.equal(prpDorsalHornRoutePack.summary.renderedInternalPrimitiveCount, 0);
  assert.equal(prpDorsalHornRoutePack.summary.exactCrossSourceIdentityCount, 0);
  assert.equal(prpDorsalHornRoutePack.summary.projectRegistrationCount, 0);
  assert.equal(prpDorsalHornRoutePackAssetManifest.summary.supplementaryNeuronCount, 2);
  assert.equal(prpDorsalHornRoutePackAssetManifest.summary.nativeDatSemanticAdmissionCount, 0);
  assert.equal(prpDorsalHornRoutePackAssetManifest.summary.registrationCount, 0);
  assert.deepEqual([...new Set(prpDorsalHornRoutePackAssetManifest.files.map((file) => file.neuronId))], [50394, 50408]);
  assert.equal(prpDorsalHornRoutePackAssetManifestBytes.byteLength, 2766);
  assert.equal(createHash("sha256").update(prpDorsalHornRoutePackAssetManifestBytes).digest("hex"), "2f17597f67532debfa79828a6313887fb362e9cdc4baba9d3015d94129c5ef8f");
  assert.equal(asset.integrity.bytes, prpDorsalHornRoutePackAssetManifestBytes.byteLength);
  assert.equal(asset.integrity.sha256, createHash("sha256").update(prpDorsalHornRoutePackAssetManifestBytes).digest("hex"));
  assert.equal(missingness.get("source_native_DAT_semantics").status, "PARTIALLY_AVAILABLE");
  assert.equal(missingness.get("same_cell_electrophysiology").status, "UNAVAILABLE");
  assert.equal(missingness.get("marker_exclusivity").status, "NOT_ESTABLISHED");
  assert.equal(missingness.get("same_specimen_internal_structure").status, "UNAVAILABLE");
  assert.equal(missingness.get("cross_source_identity").status, "NOT_ESTABLISHED");
  assert.equal(missingness.get("atlas_registration").status, "UNAVAILABLE");
  assert.match(missingness.get("repository_metadata_conflicts").reason, /raw inverted weight bounds/);
  assert.ok(neuromorpho.linkedUpgradeIds.includes("UPG-137"));

  const promotedMarkerExclusivity = structuredClone(registry);
  source("SRC-NEUROMORPHO-8-6-124", promotedMarkerExclusivity).missingness.find((item) => item.field === "marker_exclusivity").status = "ESTABLISHED";
  assert.throws(() => validateResearchSourceRegistry(promotedMarkerExclusivity), /Marker exclusivity/i);
});

test("registers NMO 45718 as one repository-labelled premotor comparison route with explicit source conflicts", () => {
  const neuromorpho = source("SRC-NEUROMORPHO-8-6-124");
  const census = recordSet("RS-NEUROMORPHO-RECONSTRUCTIONS");
  const routePack = recordSet("RS-NEUROMORPHO-PREMOTOR-COMPARISON-ROUTE-PACK");
  const asset = neuromorpho.assets.find((item) => item.id === "ASSET-NEUROMORPHO-PREMOTOR-COMPARISON-ROUTE-PACK");
  const missingness = new Map(neuromorpho.missingness.map((item) => [item.field, item]));

  assert.equal(census.includedRecordCount.value, 142);
  assert.equal(routePack.includedRecordCount.value, 1);
  assert.equal(routePack.includedRecordCount.unit, "supplementary_reconstructions");
  assert.equal(routePack.childRosterRef.status, "bundled_exact");
  assert.equal(routePack.childRosterRef.path, "data/premotor-comparison-observed-morphology-route-pack-0.1.json");
  assert.deepEqual(premotorComparisonRoutePack.routes.map((route) => route.sourceRecord.neuronId), [45718]);
  assert.deepEqual(premotorComparisonRoutePack.routes[0].sourceRecord.cellTypeLabels, [
    "Calbindin (CB)-negative",
    "glycinergic",
    "pre-motor",
    "non-renshaw",
    "interneuron",
  ]);
  assert.equal(premotorComparisonRoutePack.routes[0].censusMembership, false);
  assert.equal(premotorComparisonRoutePack.runtimeMergePolicy.frozenCensusRecordCount, 142);
  assert.equal(premotorComparisonRoutePack.runtimeMergePolicy.censusExpansionCount, 0);
  assert.equal(premotorComparisonRoutePack.summary.nativeDatSemanticAdmissionCount, 0);
  assert.equal(premotorComparisonRoutePack.summary.sameCellElectrophysiologyJoinCount, 0);
  assert.equal(premotorComparisonRoutePack.summary.renderedInternalPrimitiveCount, 0);
  assert.equal(premotorComparisonRoutePack.summary.exactCrossSourceIdentityCount, 0);
  assert.equal(premotorComparisonRoutePack.summary.projectRegistrationCount, 0);
  assert.equal(premotorComparisonRoutePackAssetManifest.summary.supplementaryNeuronCount, 1);
  assert.equal(premotorComparisonRoutePackAssetManifest.summary.nativeDatSemanticAdmissionCount, 0);
  assert.equal(premotorComparisonRoutePackAssetManifest.summary.registrationCount, 0);
  assert.deepEqual([...new Set(premotorComparisonRoutePackAssetManifest.files.map((file) => file.neuronId))], [45718]);
  assert.equal(premotorComparisonRoutePackAssetManifestBytes.byteLength, 1647);
  assert.equal(createHash("sha256").update(premotorComparisonRoutePackAssetManifestBytes).digest("hex"), "0220169ea294d8db086a228557b0b067fd057249e41f7187cf2a14ee924a33d8");
  assert.equal(asset.integrity.bytes, premotorComparisonRoutePackAssetManifestBytes.byteLength);
  assert.equal(asset.integrity.sha256, createHash("sha256").update(premotorComparisonRoutePackAssetManifestBytes).digest("hex"));
  assert.match(missingness.get("repository_metadata_conflicts").reason, /NMO 45718.*calbindin-washout.*reported-but-uncorrected shrinkage/i);
  assert.match(missingness.get("marker_exclusivity").reason, /NMO 45718.*do not establish biological calbindin absence.*Renshaw exclusion/i);
  assert.ok(neuromorpho.linkedUpgradeIds.includes("UPG-143"));

  const promoted = structuredClone(registry);
  source("SRC-NEUROMORPHO-8-6-124", promoted).missingness.find((item) => item.field === "repository_metadata_conflicts").reason = "NMO 50424 has a repository strain field that conflicts with the primary paper and inverted repository weight bounds; NMO 45674 has repository-versus-paper preparation-stage ambiguity. NMO 50394 and NMO 50408 each preserve raw inverted weight bounds.";
  assert.throws(() => validateResearchSourceRegistry(promoted), /Premotor comparison label and shrinkage conflicts/i);
});

test("registers the five-file native contour audit with five exact record-gated line viewers", () => {
  const neuromorpho = source("SRC-NEUROMORPHO-8-6-124");
  const contours = recordSet("RS-NEUROMORPHO-NATIVE-CONTOUR-ADMISSION-CATALOG");
  const catalogAsset = neuromorpho.assets.find((item) => item.id === "ASSET-NEUROMORPHO-NATIVE-CONTOUR-ADMISSION-CATALOG");
  const renshawAsset = neuromorpho.assets.find((item) => item.id === "ASSET-NEUROMORPHO-45674-SOURCE-CLOSED-SOMA-CONTOURS");
  const priorAsset = neuromorpho.assets.find((item) => item.id === "ASSET-NEUROMORPHO-45718-NATIVE-SOMA-CONTOURS");
  const toddAssets = new Map([50424, 50394, 50408].map((neuronId) => [neuronId, neuromorpho.assets.find((item) => item.id === `ASSET-NEUROMORPHO-${neuronId}-MBF-CELL-BODY-LINE-LOOPS`)]));
  const missingness = new Map(neuromorpho.missingness.map((item) => [item.field, item]));

  assert.equal(contours.includedRecordCount.value, 5);
  assert.equal(contours.includedRecordCount.unit, "audited_DAT_files");
  assert.equal(contours.cellRosterAvailability, "not_applicable");
  assert.equal(contours.childRosterRef.status, "not_applicable_source_object_set");
  assert.equal(contours.childRosterRef.path, null);
  assert.equal(contours.childRosterRef.idField, null);
  assert.match(contours.childRosterRef.missingReason, /not cells or type profiles/i);
  assert.equal(contours.sourceObjectSetRef.status, "bundled_exact");
  assert.equal(contours.sourceObjectSetRef.path, "data/neurolucida-native-contour-admission-catalog-0.3.json");
  assert.equal(contours.sourceObjectSetRef.idField, "records[].assetId");
  assert.equal(contours.sourceObjectSetRef.missingReason, null);
  assert.equal(nativeContourCatalog.records.length, 5);
  assert.equal(nativeContourCatalog.summary.admittedRecordCount, 5);
  assert.equal(nativeContourCatalog.summary.heldRecordCount, 0);
  assert.equal(nativeContourCatalog.summary.admittedContourObjectCount, 48);
  assert.equal(nativeContourCatalog.summary.admittedVertexCount, 2379);
  assert.equal(nativeContourCatalog.summary.toddAdmittedContourObjectCount, 33);
  assert.equal(nativeContourCatalog.summary.toddAdmittedVertexCount, 1904);
  assert.equal(nativeSomaContours.assetId, "NeuroMorpho:45718");
  assert.equal(nativeSomaContours.contours.length, 8);
  assert.equal(nativeSomaContours.summary.vertexCount, 275);
  assert.equal(nativeSomaContours.summary.surfaceCount, 0);
  assert.equal(nativeSomaContours.summary.internalStructureObjectCount, 0);
  assert.equal(nativeSomaContours.summary.registrationCount, 0);
  assert.equal(catalogAsset.integrity.bytes, nativeContourCatalogBytes.byteLength);
  assert.equal(catalogAsset.integrity.sha256, createHash("sha256").update(nativeContourCatalogBytes).digest("hex"));
  assert.equal(renshawAsset.integrity.bytes, renshawNativeContourBytes.byteLength);
  assert.equal(renshawAsset.integrity.sha256, createHash("sha256").update(renshawNativeContourBytes).digest("hex"));
  assert.equal(priorAsset.integrity.bytes, nativeSomaContourBytes.byteLength);
  assert.equal(priorAsset.integrity.sha256, createHash("sha256").update(nativeSomaContourBytes).digest("hex"));
  for (const [neuronId, asset] of toddAssets) {
    const bytes = toddNativeContourBytes.get(neuronId);
    assert.equal(asset.integrity.bytes, bytes.byteLength);
    assert.equal(asset.integrity.sha256, createHash("sha256").update(bytes).digest("hex"));
  }
  assert.equal(missingness.get("source_native_DAT_semantics").status, "PARTIALLY_AVAILABLE");
  assert.match(missingness.get("source_native_DAT_semantics").reason, /48 ordered soma contour line loops and 2,379 vertices/);
  assert.match(missingness.get("source_native_DAT_semantics").reason, /NMO 50424 = 8 loops \/ 427 vertices, NMO 50394 = 14 \/ 768 and NMO 50408 = 11 \/ 709 \(33 \/ 1,904 combined\)/);
  assert.match(missingness.get("source_native_DAT_semantics").reason, /raw sourceClosedFlag=false/);
  assert.match(missingness.get("source_native_DAT_semantics").reason, /User Line 1–4 remain excluded/);
  assert.ok(neuromorpho.linkedUpgradeIds.includes("UPG-186"));
  assert.ok(neuromorpho.linkedUpgradeIds.includes("UPG-197"));
  assert.ok(neuromorpho.linkedUpgradeIds.includes("UPG-198"));
  assert.ok(neuromorpho.linkedUpgradeIds.includes("UPG-203"));
  assert.ok(neuromorpho.linkedUpgradeIds.includes("UPG-236"));
  assert.ok(neuromorpho.linkedUpgradeIds.includes("UPG-237"));

  const mislabeledAsCells = structuredClone(registry);
  const mislabeledContours = recordSet("RS-NEUROMORPHO-NATIVE-CONTOUR-ADMISSION-CATALOG", mislabeledAsCells);
  mislabeledContours.cellRosterAvailability = "bundled_exact";
  assert.throws(() => validateResearchSourceRegistry(mislabeledAsCells), /admission decisions must not be represented as a cell roster/i);

  const inventedSurface = structuredClone(registry);
  source("SRC-NEUROMORPHO-8-6-124", inventedSurface).missingness.find((item) => item.field === "source_native_DAT_semantics").reason = "Contours were promoted to a surface.";
  assert.throws(() => validateResearchSourceRegistry(inventedSurface), /Native DAT contour scope/i);
});

test("admits Ronzano coordinate rows without promoting them to unique cells or atlas-registered geometry", () => {
  const ronzano = source("SRC-RONZANO-2022-81976");
  const positions = recordSet("RS-RONZANO-PREMOTOR-POSITIONS");
  assert.deepEqual(ronzano.experimentalUnits.map((item) => [item.unit, item.count]), [["experiment", 18], ["coordinate_row", 31878]]);
  assert.match(ronzano.experimentalUnits[0].scope, /11 LG experiments and 7 TA experiments/);
  assert.match(ronzano.experimentalUnits[1].scope, /not a unique-cell denominator/);
  assert.equal(positions.includedRecordCount.unit, "coordinate_rows_across_two_independent_representations");
  assert.match(positions.includedRecordCount.scope, /not unique cells/);
  assert.deepEqual(ronzano.researchLanes, ["positions", "sources"]);
  assert.deepEqual(ronzano.linkedUpgradeIds, ["UPG-108", "UPG-110", "UPG-114"]);
  assert.equal(ronzano.rights.status, "CC-BY-4.0");
  assert.deepEqual(new Set(ronzano.missingness.map((item) => item.field)), new Set([
    "life_stage_scope",
    "adult_persistence",
    "coordinate_frame_scope",
    "atlas_registration",
    "cross_representation_row_identity",
    "soma_geometry",
    "cell_morphology",
    "synapses",
    "organelles",
  ]));
  assert.equal(ronzanoPositions.identityPolicy.crossFramePointIdentity, "not_established");
  assert.equal(ronzanoPositions.identityPolicy.registrationCount, 0);
});

test("preserves explicit source-profile granularity and the non-harmonized 387-record denominator", () => {
  assert.deepEqual([
    ["RS-RUSS-POPULATIONS", "harmonized_population", "source_population", "published_harmonized_taxonomy", 69, "not_retained_in_project"],
    ["RS-SATHYAMURTHY-CLUSTERS", "reported_cluster", "nucleus", "checksum_pinned_cluster_metadata", 43, "exact_remote_roster_not_bundled"],
    ["RS-HAYASHI-CLUSTERS", "article_reported_cluster", "cell", "article_figure_transcription", 11, "cluster_to_barcode_map_unavailable"],
    ["RS-HARING-FINAL-TYPES", "final_source_type", "cell", "checksum_pinned_matrix_standard_name", 30, "exact_remote_roster_not_bundled"],
    ["RS-ALKASLASI-INTERNEURON-CLUSTERS", "reported_cluster", "nucleus", "checksum_pinned_annotation_object", 8, "exact_remote_roster_not_bundled"],
    ["RS-DMRT3-DI6-M1-M6-GROUPS", "source_local_embryonic_transcriptomic_group", "retained_dI6_lineage_cells_in_one_pooled_library", "pinned_executed_author_notebook_group_summary", 6, "group_summary_only_no_per_well_roster"],
    ["RS-ROOME-REFINED-DIL-TYPES", "source_local_embryonic_refined_dil_type", "refined_dil_type_profile", "checksum_pinned_table_s6_roster_plus_table_s7_differential_features", 157, "bundled_exact"],
    ["RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE", "marker_defined_functional_profile", "source_population_with_experiment_family_observations", "primary_article_plus_checksum_pinned_figshare_tables", 1, "none_reported"],
    ["RS-DELILE-FINE-SUBTYPES", "source_reported_developmental_fine_subtype", "annotated_source_cell_aggregate", "checksum_pinned_authors_annotation_table_neuron_subtypes_column", 51, "bundled_exact"],
    ["RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES", "source_explicit_confirmed_interneuron_profile", "source_local_neuron_type_assignment", "checksum_pinned_GSE318731_groups_equals_CHOL_IN", 11, "bundled_exact"],
  ].map(([id]) => recordSet(id)).map((item) => [
    item.recordSetId,
    item.recordKind,
    item.unitOfObservation,
    item.assignmentAuthority,
    item.includedRecordCount.value,
    item.cellRosterAvailability,
  ]), [
    ["RS-RUSS-POPULATIONS", "harmonized_population", "source_population", "published_harmonized_taxonomy", 69, "not_retained_in_project"],
    ["RS-SATHYAMURTHY-CLUSTERS", "reported_cluster", "nucleus", "checksum_pinned_cluster_metadata", 43, "exact_remote_roster_not_bundled"],
    ["RS-HAYASHI-CLUSTERS", "article_reported_cluster", "cell", "article_figure_transcription", 11, "cluster_to_barcode_map_unavailable"],
    ["RS-HARING-FINAL-TYPES", "final_source_type", "cell", "checksum_pinned_matrix_standard_name", 30, "exact_remote_roster_not_bundled"],
    ["RS-ALKASLASI-INTERNEURON-CLUSTERS", "reported_cluster", "nucleus", "checksum_pinned_annotation_object", 8, "exact_remote_roster_not_bundled"],
    ["RS-DMRT3-DI6-M1-M6-GROUPS", "source_local_embryonic_transcriptomic_group", "retained_dI6_lineage_cells_in_one_pooled_library", "pinned_executed_author_notebook_group_summary", 6, "group_summary_only_no_per_well_roster"],
    ["RS-ROOME-REFINED-DIL-TYPES", "source_local_embryonic_refined_dil_type", "refined_dil_type_profile", "checksum_pinned_table_s6_roster_plus_table_s7_differential_features", 157, "bundled_exact"],
    ["RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE", "marker_defined_functional_profile", "source_population_with_experiment_family_observations", "primary_article_plus_checksum_pinned_figshare_tables", 1, "none_reported"],
    ["RS-DELILE-FINE-SUBTYPES", "source_reported_developmental_fine_subtype", "annotated_source_cell_aggregate", "checksum_pinned_authors_annotation_table_neuron_subtypes_column", 51, "bundled_exact"],
    ["RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES", "source_explicit_confirmed_interneuron_profile", "source_local_neuron_type_assignment", "checksum_pinned_GSE318731_groups_equals_CHOL_IN", 11, "bundled_exact"],
  ]);
  assert.equal(["RS-RUSS-POPULATIONS", "RS-SATHYAMURTHY-CLUSTERS", "RS-HAYASHI-CLUSTERS", "RS-HARING-FINAL-TYPES", "RS-ALKASLASI-INTERNEURON-CLUSTERS", "RS-DMRT3-DI6-M1-M6-GROUPS", "RS-ROOME-REFINED-DIL-TYPES", "RS-CROZAT-PKD2L1-FUNCTIONAL-PROFILE", "RS-DELILE-FINE-SUBTYPES", "RS-CANOGOMEZ-P56-CONFIRMED-INTERNEURON-PROFILES"]
    .reduce((total, id) => total + recordSet(id).includedRecordCount.value, 0), 387);
  assert.equal(recordSet("RS-NEUROMORPHO-RECONSTRUCTIONS").childRosterRef.status, "bundled_exact");
  assert.equal(recordSet("RS-HARING-FINAL-TYPES").childRosterRef.path, null);
  assert.equal(recordSet("RS-HAYASHI-CLUSTERS").childRosterRef.status, "not_linkable");
});

test("registers the six Dmrt3/dI6 group summaries without inventing per-well identities or geometry", () => {
  const dmrt3 = source("SRC-IGLESIAS-GONZALEZ-2021");
  const groups = recordSet("RS-DMRT3-DI6-M1-M6-GROUPS");
  const missingness = new Map(dmrt3.missingness.map((item) => [item.field, item]));

  assert.deepEqual(dmrt3.experimentalUnits.map((item) => [item.unit, item.count]), [
    ["source_embryo", 3],
    ["pooled_library", 1],
    ["deposited_mouse_well", 384],
    ["executed_notebook_qc_cell", 354],
    ["retained_di6_lineage_cell", 274],
  ]);
  assert.equal(groups.includedRecordCount.value, 6);
  assert.equal(groups.includedRecordCount.unit, "group_summaries");
  assert.equal(groups.cellRosterAvailability, "group_summary_only_no_per_well_roster");
  assert.equal(groups.childRosterRef.status, "not_exported_by_source");
  assert.equal(groups.childRosterRef.path, null);
  assert.match(groups.childRosterRef.missingReason, /no M1–M6 assignment column.*does not reconstruct a per-well roster/i);
  assert.deepEqual(dmrt3Di6.profiles.map((profile) => [profile.sourceLocalLabel, profile.samplingCount, profile.markerPanel]), [
    ["M1", 84, ["Zfhx3", "Meis2", "Zfhx4"]],
    ["M2", 34, ["Irx4", "Tshz3", "Ldb2"]],
    ["M3", 33, ["Pid1", "Sst", "Slit2"]],
    ["M4", 45, ["Hoxb8", "Hoxb7", "Hoxb9"]],
    ["M5", 54, ["Sall3", "Npy", "Nxph1"]],
    ["M6", 24, ["Neurod6", "Neurod2", "Zeb2"]],
  ]);
  assert.equal(dmrt3Di6.profiles.reduce((total, profile) => total + profile.samplingCount, 0), 274);
  assert.equal(dmrt3Di6.scope.animalResolvedReplicateCount, 0);
  assert.equal(dmrt3Di6.scope.perWellMGroupRosterBundled, false);
  assert.equal(dmrt3Di6.scope.admittedGeometryCount, 0);
  assert.equal(dmrt3Di6.scope.admittedInternalStructureCount, 0);
  assert.equal(dmrt3Di6.joinPolicy.perWellM1ToM6RosterReconstructionAllowed, false);
  assert.equal(dmrt3Di6.joinPolicy.internalStructureTranscriptomicsJoinCount, 0);
  assert.equal(dmrt3Di6.joinPolicy.exactCrossSourceIdentityCount, 0);
  assert.equal(missingness.get("per_well_M1_to_M6_roster").status, "NOT_EXPORTED");
  assert.equal(missingness.get("cell_geometry_and_internal_structure").status, "UNAVAILABLE");
  assert.match(dmrt3.admission.note, /No per-well roster.*morphology.*internal object.*registration.*adult-type identity/i);
});

test("registers 51 exact Delile developmental subtypes while preserving denominators, source spelling, and zero model claims", () => {
  const sourceRecord = source("SRC-DELILE-2019");
  const profiles = recordSet("RS-DELILE-FINE-SUBTYPES");
  const assets = new Map(sourceRecord.assets.map((item) => [item.id, item]));
  const missingness = new Map(sourceRecord.missingness.map((item) => [item.field, item]));

  assert.equal(profiles.includedRecordCount.value, 51);
  assert.equal(profiles.childRosterRef.status, "bundled_exact");
  assert.equal(profiles.childRosterRef.path, "data/delile-developmental-interneuron-taxonomy-0.1.json");
  assert.equal(delile.profiles.length, 51);
  assert.equal(new Set(delile.profiles.map((profile) => profile.id)).size, 51);
  assert.equal(delile.profiles.reduce((total, profile) => total + profile.cellCount, 0), 15217);
  assert.deepEqual(delile.scope.lifeStages, ["E9.5", "E10.5", "E11.5", "E12.5", "E13.5"]);
  assert.equal(delile.scope.sourceStageReplicateLabelCount, 12);
  assert.equal(delile.scope.biologicalAnimalCount, null);
  assert.equal(delile.scope.sourceDefinedNeuronCellCount, 18144);
  assert.equal(delile.scope.sourceTypedNonmotorNeuronCellCount, 15394);
  assert.equal(delile.scope.cardinalOnlyInterneuronCellCount, 177);
  assert.equal(delile.scope.motorNeuronExcludedCellCount, 1056);
  assert.equal(delile.scope.nullNeuronExcludedCellCount, 1694);
  assert.ok(delile.profiles.some((profile) => profile.sourceLocalLabel.startsWith("dl")));
  assert.equal(delile.profiles.some((profile) => profile.sourceLocalLabel.startsWith("dI")), false);
  assert.ok(delile.profiles.every((profile) => profile.timepointCellCounts.reduce((total, item) => total + item.cellCount, 0) === profile.cellCount));
  assert.equal(delile.scope.admittedGeometryCount, 0);
  assert.equal(delile.scope.admittedInternalStructureCount, 0);
  assert.equal(delile.scope.sameCellMorphologyTranscriptomicsJoinCount, 0);
  assert.equal(delile.scope.projectRegistrationCount, 0);
  assert.equal(delile.scope.exactCrossSourceIdentityCount, 0);

  assert.equal(assets.get("ASSET-DELILE-ANNOTATED-METADATA").bundled, false);
  assert.equal(assets.get("ASSET-DELILE-ANNOTATED-METADATA").integrity.bytes, 3036323);
  assert.equal(assets.get("ASSET-DELILE-ANNOTATED-METADATA").integrity.sha256, "4f5bd353771ea478928e305df784f3fc868bb89a9ffc5fbce112da70c4a769bf");
  assert.equal(assets.get("ASSET-DELILE-COMPACT-TAXONOMY").integrity.bytes, 122037);
  assert.equal(assets.get("ASSET-DELILE-COMPACT-TAXONOMY").integrity.sha256, "7a77c8c10f15224188bb542fddf63bc97de57b06dd9289e324bc7b8612219597");
  assert.match(sourceRecord.rights.note, /source annotation table remains link-only/);
  assert.equal(missingness.get("biological_animal_denominator").status, "UNAVAILABLE");
  assert.equal(missingness.get("cell_geometry_and_internal_structure").status, "UNAVAILABLE");
  assert.equal(missingness.get("atlas_registration").status, "NOT_ESTABLISHED");
  assert.equal(missingness.get("cross_source_identity").status, "NOT_ESTABLISHED");

  const promotedGeometry = structuredClone(registry);
  source("SRC-DELILE-2019", promotedGeometry).missingness.find((item) => item.field === "cell_geometry_and_internal_structure").status = "AVAILABLE";
  assert.throws(() => validateResearchSourceRegistry(promotedGeometry), /Delile geometry and internal structures must remain unavailable/i);
});

test("registers 157 exact Roome dIL profiles while keeping source objects link-only and every geometry or same-cell join at zero", () => {
  const sourceRecord = source("SRC-ROOME-2026");
  const profiles = recordSet("RS-ROOME-REFINED-DIL-TYPES");
  const assets = new Map(sourceRecord.assets.map((item) => [item.id, item]));
  const missingness = new Map(sourceRecord.missingness.map((item) => [item.field, item]));

  assert.equal(profiles.includedRecordCount.value, 157);
  assert.equal(profiles.childRosterRef.status, "bundled_exact");
  assert.equal(profiles.childRosterRef.path, "data/roome-dil-source-taxonomy-0.1.json");
  assert.equal(roome.profiles.length, 157);
  assert.equal(new Set(roome.profiles.map((profile) => profile.id)).size, 157);
  assert.equal(roome.profiles.reduce((total, profile) => total + profile.frequency, 0), 61444);
  assert.equal(roome.familySummaries.length, 12);
  assert.equal(roome.scope.biologicalLitterPoolCount, 15);
  assert.equal(roome.scope.retainedTechnicalOutputCount, 29);
  assert.equal(roome.scope.refinedDilCellCount, 61444);
  assert.equal(roome.scope.admittedGeometryCount, 0);
  assert.equal(roome.scope.admittedInternalStructureCount, 0);
  assert.equal(roome.scope.sameCellCrossModalJoinCount, 0);
  assert.equal(roome.scope.projectRegistrationCount, 0);
  assert.equal(roome.anomalies.excelCoercedGeneCellCount, 26);
  assert.equal(roome.derivation.quarantinedGeneCellCount, 26);

  assert.equal(assets.get("ASSET-ROOME-TABLE-S6").bundled, false);
  assert.equal(assets.get("ASSET-ROOME-TABLE-S7").bundled, false);
  assert.equal(assets.get("ASSET-ROOME-GSE291462").bundled, false);
  assert.equal(assets.get("ASSET-ROOME-AUTHOR-CODE").bundled, false);
  assert.equal(assets.get("ASSET-ROOME-DIL-DERIVED-CONTRACT").integrity.bytes, roomeTaxonomyBytes.byteLength);
  assert.equal(assets.get("ASSET-ROOME-DIL-DERIVED-CONTRACT").integrity.sha256, createHash("sha256").update(roomeTaxonomyBytes).digest("hex"));
  assert.equal(assets.get("ASSET-ROOME-DIL-FULL-FEATURE-EVIDENCE").integrity.bytes, roomeFeatureEvidenceBytes.byteLength);
  assert.equal(assets.get("ASSET-ROOME-DIL-FULL-FEATURE-EVIDENCE").integrity.sha256, createHash("sha256").update(roomeFeatureEvidenceBytes).digest("hex"));
  assert.match(sourceRecord.rights.note, /Tables S6 and S7 CC BY/);
  assert.match(sourceRecord.rights.note, /GEO source objects.*NOASSERTION.*link-only/);
  assert.match(sourceRecord.rights.note, /author-code repository.*NOASSERTION.*link-only/);
  assert.equal(missingness.get("same_cell_scrna_xenium_join").status, "NOT_ESTABLISHED");
  assert.equal(missingness.get("cell_geometry_and_internal_structure").status, "UNAVAILABLE");
  assert.equal(missingness.get("atlas_registration").status, "NOT_ESTABLISHED");
  assert.equal(missingness.get("cross_source_identity").status, "NOT_ESTABLISHED");
  assert.equal(missingness.get("spreadsheet_gene_cell_anomalies").status, "CONFLICT_QUARANTINED");

  const promotedGeometry = structuredClone(registry);
  source("SRC-ROOME-2026", promotedGeometry).missingness.find((item) => item.field === "cell_geometry_and_internal_structure").status = "AVAILABLE";
  assert.throws(() => validateResearchSourceRegistry(promotedGeometry), /geometry and internal structures must remain unavailable/i);
});

test("keeps source-specific species and life stages instead of inheriting the adult mouse model scope", () => {
  assert.deepEqual(source("SRC-HARING-2018").lifeStageScopes.map((item) => item.value), ["postnatal P17-P28"]);
  assert.equal(source("SRC-HARING-2018").lifeStageScopes[0].context, "sequencing cell columns; source text 3-4 week mice");
  assert.deepEqual(source("SRC-BERTELS-2022").lifeStageScopes.map((item) => item.value), ["neonatal", "adult"]);
  assert.deepEqual(source("SRC-KATHE-2022").speciesScopes.map((item) => item.scientificName), ["Mus musculus", "Homo sapiens"]);
  assert.deepEqual(source("SRC-HAYASHI-2018").lifeStageScopes.map((item) => item.value), ["P0 neonatal"]);
  assert.deepEqual(source("SRC-IGLESIAS-GONZALEZ-2021").lifeStageScopes.map((item) => item.value), ["embryonic day 14.5"]);
  assert.deepEqual(source("SRC-ROOME-2026").lifeStageScopes.map((item) => item.value), ["embryonic day 14.5 and embryonic day 16.5"]);
  assert.deepEqual(source("SRC-DELILE-2019").lifeStageScopes.map((item) => item.value), ["E9.5-E13.5"]);
  assert.deepEqual(source("SRC-MICRONS-PHASE1-V185-4").lifeStageScopes.map((item) => item.value), ["P36 male"]);
  assert.deepEqual(source("SRC-OPENORGANELLE-JRC-MUS-HIPPOCAMPUS-1").lifeStageScopes.map((item) => item.value), ["P7"]);
  assert.match(source("SRC-RONZANO-2022-81976").lifeStageScopes[0].value, /early postnatal/);
  assert.equal(source("SRC-SUPERCLEM-GLYR-17816747-V1").lifeStageScopes[0].value, null);
  assert.match(source("SRC-SUPERCLEM-GLYR-17816747-V1").lifeStageScopes[0].missingReason, /exact source age/);
});

test("records resolution of the Häring age contradiction while preserving the exact historical and authoritative values", () => {
  const contradiction = registry.knownScopeContradictions[0];
  assert.equal(contradiction.id, "AGE-HARING-COVERAGE-001");
  assert.equal(contradiction.status, "resolved");
  assert.match(contradiction.broadValue, /Adult mouse dorsal-horn neurons/);
  assert.match(contradiction.authoritativeValue, /postnatal P17-P28/);
  assert.match(contradiction.authoritativeValue, /no adult, juvenile, or young-adult category is source-asserted/);
  assert.equal(contradiction.resolvedValuePath, "data/interneuron-knowledge-coverage-0.1.json#lanes/haring-2018/sampleFrame");
  assert.equal(contradiction.resolvedDate, "2026-08-30");
});

test("rejects ambiguous aliases, orphan record sets, and source-count drift", () => {
  const duplicateAlias = structuredClone(registry);
  duplicateAlias.sources[1].aliases.push(duplicateAlias.sources[0].aliases[0]);
  assert.throws(() => validateResearchSourceRegistry(duplicateAlias), /alias is ambiguous/i);

  const orphan = structuredClone(registry);
  orphan.sources[0].recordSets[0].parentSourceId = "SRC-NOT-REAL";
  assert.throws(() => validateResearchSourceRegistry(orphan), /orphan parentSourceId/i);

  const truncated = structuredClone(registry);
  truncated.sources.pop();
  assert.throws(() => validateResearchSourceRegistry(truncated), /source denominator/i);
});

test("rejects invented roster drill-down, broadened age, and unverified bundled assets", () => {
  const inventedRoster = structuredClone(registry);
  const hayashi = source("SRC-HAYASHI-2018", inventedRoster).recordSets[0];
  hayashi.childRosterRef.status = "bundled_exact";
  hayashi.childRosterRef.path = null;
  hayashi.childRosterRef.idField = null;
  hayashi.childRosterRef.missingReason = null;
  assert.throws(() => validateResearchSourceRegistry(inventedRoster), /childRosterRef\.path is required/i);

  const broadenedAge = structuredClone(registry);
  source("SRC-HARING-2018", broadenedAge).lifeStageScopes[0].value = "adult";
  assert.throws(() => validateResearchSourceRegistry(broadenedAge), /Häring life-stage scope/i);

  const unhashedBundle = structuredClone(registry);
  source("SRC-SUPERCLEM-GLYR-17816747-V1", unhashedBundle).assets[0].integrity.sha256 = null;
  assert.throws(() => validateResearchSourceRegistry(unhashedBundle), /bundled asset needs SHA-256/i);

  const lostRonzanoBoundary = structuredClone(registry);
  source("SRC-RONZANO-2022-81976", lostRonzanoBoundary).missingness = source("SRC-RONZANO-2022-81976", lostRonzanoBoundary).missingness
    .filter((item) => item.field !== "atlas_registration");
  assert.throws(() => validateResearchSourceRegistry(lostRonzanoBoundary), /Ronzano missingness is incomplete: atlas_registration/i);
});

test("rejects missing-count ambiguity and cross-source identity promotion", () => {
  const ambiguousCount = structuredClone(registry);
  source("SRC-SPINALJ-MKC37W4RRV-1", ambiguousCount).experimentalUnits[0].missingReason = null;
  assert.throws(() => validateResearchSourceRegistry(ambiguousCount), /needs missingReason/i);

  const promoted = structuredClone(registry);
  recordSet("RS-RUSS-POPULATIONS", promoted).canonicalIdentityStatus = "canonical_cross_source_type";
  assert.throws(() => validateResearchSourceRegistry(promoted), /promotes a cross-source canonical identity/i);
});
