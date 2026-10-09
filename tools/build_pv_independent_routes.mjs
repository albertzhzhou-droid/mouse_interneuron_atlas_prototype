import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { parseNeuromorphoSwc } from "../app/neuromorpho-swc-runtime.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PV_ROUTE_PATH = "data/pv-independent-morphology-routes-0.1.json";
const directory = "public/data/pv_independent_morphology_routes_v1";
const sha = value => createHash("sha256").update(value).digest("hex");
const encode = value => Buffer.from(JSON.stringify(value, null, 2) + "\n");
const read = name => readFile(path.join(root, name));
async function pinned(name, bytes, digest) {
  const actual = await read(name); assert.equal(actual.length, bytes, name); assert.equal(sha(actual), digest, name); return actual;
}

/** Reuses frozen API and SWC originals; only two deterministic geometry derivatives are new. */
export async function buildPvIndependentRoutes() {
  const universePath = "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json";
  const bytes = await read(universePath), universe = JSON.parse(bytes);
  assert.equal(universe.repositoryRelease, "8.6.124");
  const routes = [], assets = [];
  for (const neuronId of [170034, 118824]) {
    const u = universe.records.find(row => row.neuronId === neuronId); assert.ok(u);
    const m = u.officialMetadata, diameter = neuronId === 118824;
    assert.equal(m.neuron_id, neuronId); assert.equal(m.archive, "Hughes"); assert.equal(m.species, "mouse");
    assert.equal(m.age_classification, "young adult"); assert.equal(m.domain, "Dendrites, Soma, No Axon");
    assert.equal(m.attributes, diameter ? "Diameter, 3D, Angles" : "No Diameter, 3D, Angles");
    assert.deepEqual(m.brain_region, ["spinal cord", "lumbar", "dorsal horn", "lamina II-III"]);
    assert.deepEqual(m.cell_type, ["interneuron", "Parvalbumin (PV)-positive", diameter ? "Inhibitory" : "Excitatory", diameter ? "tonic firing" : "Pax2-negative"]);
    assert.equal(m.physical_Integrity, diameter ? "Dendrites Incomplete" : "Dendrites Moderate");
    assert.equal(u.memberships.frozenAdultSubset, false);
    let api;
    for (const receipt of universe.query.pageReceipts) {
      const name = "public" + receipt.path, pageBytes = await pinned(name, receipt.bytes, receipt.sha256);
      const rows = JSON.parse(pageBytes)._embedded.neuronResources, index = rows.findIndex(row => row.neuron_id === neuronId);
      if (index >= 0) {
        assert.deepEqual(rows[index], m);
        api = { path: name, bytes: pageBytes.length, sha256: sha(pageBytes), queryUrl: receipt.url,
          pointer: `/_embedded/neuronResources/${index}`, objectSha256: sha(JSON.stringify(m)), objectEncoding: "JSON.stringify of exact API object" };
        break;
      }
    }
    assert.ok(api);
    const s = u.sourceObject, raw = await pinned("public" + s.rawSwcPath, s.rawSwcBytes, s.rawSwcSha256);
    const geometry = parseNeuromorphoSwc(raw, { neuronId, assetId: u.assetId, name: m.neuron_name, dimensionality: "3D", diameterAuthorized: diameter,
      sourceReceipt: { path: s.rawSwcPath, bytes: raw.length, sha256: sha(raw), officialRecordUrl: `https://neuromorpho.org/api/neuron/id/${neuronId}`,
        standardizedSwcUrl: s.directUrl, pmids: m.reference_pmid, dois: m.reference_doi, license: "CC BY 4.0 subject to NeuroMorpho.Org Terms of Use" } });
    geometry.morphometrics.computedFromStandardizedSwc.rawSwcSha256 = sha(raw);
    assert.equal(geometry.nodes.length, diameter ? 540 : 1681); assert.equal(geometry.segments.length, geometry.nodes.length - 1);
    assert.deepEqual(geometry.computed.nodeTypeCounts, diameter ? { 1: 7, 3: 533 } : { 1: 12, 3: 1669 });
    assert.deepEqual(geometry.computed.boundsMicrometre, u.morphometrics.computed.boundsMicrometre);
    const geometryPath = `/data/pv_independent_morphology_routes_v1/nmo-${neuronId}.json`, geometryBytes = encode(geometry);
    assets.push({ path: "public" + geometryPath, bytes: geometryBytes });
    const g = { path: geometryPath, bytes: geometryBytes.length, sha256: sha(geometryBytes), rawSwcSha256: sha(raw),
      geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL", sourceFrame: geometry.sourceFrame, dimensionality: "3D", sourceDiameterAvailable: diameter,
      nodeCount: geometry.nodes.length, segmentCount: geometry.segments.length };
    // Parser radius statistics are optional; source-authorized values are independently fixed by the frozen index.
    const radiusValues = diameter ? u.morphometrics.computed.radiusDerived.value : null;
    assert.ok(!diameter || radiusValues);
    if (diameter) { const radii = geometry.nodes.map(n => n[5]); assert.equal(Math.min(...radii), radiusValues.minimumMicrometre); assert.equal(Math.max(...radii), radiusValues.maximumMicrometre); assert.ok(Math.abs(radii.reduce((a,b) => a+b,0)/radii.length - radiusValues.meanMicrometre) < 1e-12); }
    const title = diameter ? "PV-positive inhibitory · tonic-firing label · independent source record" : "PV-positive excitatory · Pax2-negative · centerlines only";
    routes.push({ routeId: `mouse.sc.pv.independent.nmo_${neuronId}`, title, authority: "OBS_STANDARDIZED_SOURCE_LOCAL",
      sourceAuthority: "NEUROMORPHO_RELEASE_8_6_124_INDEPENDENT_PV_SUPPLEMENT", censusMembership: false, frozenLensMembership: false,
      sourceRecord: { neuronId, assetId: u.assetId, name: m.neuron_name, neuronName: m.neuron_name, repository: "NeuroMorpho.Org", repositoryRelease: "8.6.124",
        archive: m.archive, species: m.species, lifeStage: m.age_classification, sex: m.gender, strain: m.strain,
        regionLabels: m.brain_region, cellTypeLabels: m.cell_type, domain: m.domain, physicalIntegrity: m.physical_Integrity,
        sourceAttributes: m.attributes, condition: m.experiment_condition, protocol: m.protocol, stain: m.stain, reconstructionSoftware: m.reconstruction_software,
        slicingDirection: m.slicing_direction, slicingThicknessMicrometre: Number(m.slicing_thickness), sourceFrame: geometry.sourceFrame,
        numericAge: { value: null, missingReason: "numeric_age_not_reported_by_source" }, parentAnimalId: null, parentSpecimenId: null,
        repositoryReferenceFieldsRaw: { reference_doi: m.reference_doi, reference_pmid: m.reference_pmid },
        sourcePaperMappingStatus: "repository_record_citation_only_no_individual_paper_experiment_crosswalk", sourceNote: m.note },
      sourceObjects: { api, swc: { path: s.rawSwcPath, bytes: raw.length, sha256: sha(raw), url: s.directUrl }, geometry: g,
        originalMorphologyFile: u.missingness.originalMorphologyFile, standardizationLog: u.missingness.standardizationLog },
      observedCellFormRecord: { neuronId, assetId: u.assetId, phenotype: m.cell_type.slice(1).join(" · "), transmitter: diameter ? "inhibitory" : "excitatory",
        domain: m.domain, physicalIntegrity: m.physical_Integrity, sourcePaperDoi: m.reference_doi[0], segmentCount: g.segmentCount,
        geometryStatus: "OBS", sourceFrame: geometry.sourceFrame, registrationStatus: "unregistered" },
      fidelityRecord: { neuronId, assetId: u.assetId, geometry: g,
        axon: { sourceType2NodeCount: 0, sourceDomain: m.domain, completeAxon: false },
        radiusEvidence: { status: diameter ? "OBSERVED_SOURCE_RADIUS" : "UNAVAILABLE", minimumMicrometre: radiusValues?.minimumMicrometre ?? null,
          maximumMicrometre: radiusValues?.maximumMicrometre ?? null, meanMicrometre: radiusValues?.meanMicrometre ?? null,
          missingReason: diameter ? null : "official_attributes_report_no_diameter" },
        modes: { observedSwc: { available: true, authority: "OBS_STANDARDIZED_SOURCE_LOCAL" },
          radiusSurface: { available: diameter, authority: diameter ? "DERIVED_FROM_OBSERVED_RADIUS" : "UNAVAILABLE", missingReason: diameter ? null : "official_attributes_report_no_diameter" },
          internalStructure: { available: false, authority: "UNAVAILABLE", missingEvidence: ["membrane_segmentation", "nucleus", "organelles", "synaptic_boutons", "receptor_distribution", "ultrastructure"] } } },
      topology: { nodeCount: g.nodeCount, segmentCount: g.segmentCount, nodeTypeCounts: geometry.computed.nodeTypeCounts,
        boundsMicrometre: geometry.computed.boundsMicrometre, sourceCoordinatesPreserved: true, inferredAxonCount: 0 },
      renderingContract: { coordinateUse: "unregistered_source_local_visualization_only", radiusSurfaceAllowed: diameter, observedMembrane: false,
        internalPrimitiveCount: 0, registrationCount: 0, sameCellPhysiologyJoinCount: 0, groupStatisticsJoinCount: 0, circuitEdgeCount: 0 },
      identityBoundary: { crossSourceIdentity: "not_established", studyCellMapping: "repository paper citation only; exact experimental cell crosswalk not established",
        sameAnimalPairEstablished: false, independentAnimalCount: null, independentSpecimenCount: null, biologicalTypeInference: "source-reported labels only" },
      sourceLinks: { officialRecord: `https://neuromorpho.org/api/neuron/id/${neuronId}`, standardizedSwc: s.directUrl,
        primaryPaper: `https://doi.org/${m.reference_doi[0]}`, rights: "https://neuromorpho.org/useterm.jsp" },
      hardBoundaries: [
        "One independent repository reconstruction in a source-local standardized frame; no atlas registration, anatomical-axis assignment or cross-study pairing.",
        "The exact PV, transmitter and Pax2/tonic-firing labels are repository reports. The tonic-firing label supplies no trace, electrophysiology values or same-cell paper experiment.",
        "Both source records contain soma and dendrites with no reconstructed axon. Moderate and incomplete dendrite integrity remain separate; no axonal wiring or whole-cell completeness is inferred.",
        "No Diameter means centerlines only despite positive SWC radius syntax. Diameter permits a deterministic derived display after byte verification; it is not an observed membrane or biological volume.",
        "These objects come from different studies and strains. No paired experiment, prevalence, allodynia effect, circuit edge, same-cell internal structure or group statistic transfers from either paper.",
        "Young adult is retained without inventing numeric age. Male/Female does not resolve an individual sex, and no animal, specimen, section or physical-cell parent ID is available.",
      ] });
  }
  const manifest = { documentType: "pv_independent_morphology_asset_manifest", schemaVersion: "0.1.0", sourceRelease: "8.6.124",
    originalSwcCopyCount: 0, geometryDerivativeCount: 2, files: assets.map(asset => ({ path: asset.path.replace(/^public/, ""), bytes: asset.bytes.length, sha256: sha(asset.bytes) })) };
  const manifestBytes = encode(manifest), assetManifest = { path: "/data/pv_independent_morphology_routes_v1/asset-manifest.json", bytes: manifestBytes.length, sha256: sha(manifestBytes) };
  assets.push({ path: "public" + assetManifest.path, bytes: manifestBytes });
  const pack = { contractId: "pv-independent-morphology-routes-0.1", releaseId: "ohri-pv-independent-morphology-routes-0.1.0", schemaVersion: "0.1.0",
    implementationDate: "2026-10-04", repositoryRelease: "8.6.124", repositorySnapshotDate: universe.snapshotDate,
    universeReceipt: { path: universePath, bytes: bytes.length, sha256: sha(bytes) }, rights: universe.rights, assetManifest,
    runtimeMergePolicy: { supplementaryNeuronIds: [170034, 118824], overlappingFrozenNeuronIds: [], frozenCensusRecordCount: 142,
      censusExpansionCount: 0, originalSwcCopyCount: 0, geometryDerivativeCount: 2, selectableMainSceneCount: 181 }, routes };
  pack.representationRoutes = routes.map(route => ({ routeId: route.routeId, label: route.title, sourceReceipt: route.sourceObjects.geometry,
    sourceVersion: pack.releaseId, sourceFrame: route.fidelityRecord.geometry.sourceFrame, stableIdAuthority: route.sourceRecord.assetId,
    representationStateIds: route.fidelityRecord.modes.radiusSurface.available ? ["OBS_SKELETON", "DER_RADIUS_SURFACE", "UNAVAILABLE"] : ["OBS_SKELETON", "UNAVAILABLE"],
    renderedPrimitivePolicy: "exact_verified_standardized_source_centerlines_and_only_authorized_radius_derivative", cellMorphologyClaim: true,
    missingLayerPolicy: "zero_primitives", crossSourceIdentityCount: 0, projectRegistrationCount: 0 }));
  return { pack, assets };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { pack, assets } = await buildPvIndependentRoutes(); await mkdir(path.join(root, directory), { recursive: true });
  for (const asset of assets) await writeFile(path.join(root, asset.path), asset.bytes);
  await writeFile(path.join(root, PV_ROUTE_PATH), encode(pack));
  console.log(JSON.stringify({ path: PV_ROUTE_PATH, originalCopies: 0, geometries: 2, nodes: pack.routes.map(r => r.topology.nodeCount) }));
}
