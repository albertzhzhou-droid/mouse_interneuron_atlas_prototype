import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parseNeuromorphoSwc } from "../app/neuromorpho-swc-runtime.js";
import { independentSourceObjectKey } from "../app/independent-source-objects.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const INPUT = "data/source-candidates/neuromorpho-comparative-2026-09-30";
const PUBLIC = "public/data/comparative_swc_reference_v1";
const CONTRACT = "data/comparative-swc-reference-0.1.json";
const RELEASE = "exact-source-snapshot-2026-09-30";
const FRAME = "NeuroMorpho_CNG_standardized_local_frame";
const checkOnly = process.argv.includes("--check");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const encode = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
function check(condition, message) { if (!condition) throw new Error(message); }

// These are exact source receipts, never a hash over reformatted JSON.
const specifications = [
  {
    id: "183779", sourceId: "neuromorpho-zebrafish-comparative", upgradeId: "UPG-127", species: "zebrafish", name: "20190706_8_1", archive: "Cohen_A",
    api: [1461, "8345b0ee16cb7b183666790e06a18a5f0ed0018cf1e53e79c48e25c9dbc6d348"],
    morphometry: [457, "3e81f6abc0a7f24e57f481884f174c94ab3579eea37e7352338097bbffc61f8a"],
    swc: [145055, "40c6fc025a7224390b5d74064301250281ca1bc8deac63cbcd5fdabb134413c7"],
    domain: "No Dendrites, No Soma, Axon", attributes: "No Diameter, 3D, Angles", nodeCount: 3849, types: { 2: 3849 }, diameter: false,
    label: "Zebrafish · 5 dpf V3 tonic-spiking · NMO_183779", paper: "10.1016/j.neuron.2022.01.001",
    boundaries: [
      "One zebrafish source reconstruction; the V3 and tonic-spiking labels are exact repository assertions, with no V2/Vsx2 or mouse identity.",
      "Only the axon centerline is deposited. The source reports No Soma, No Dendrites and No Diameter; positive raw SWC radii do not authorize measured calibre, membrane, volume or a tube surface.",
      "Axon Complete is source-reported reconstruction integrity; no whole-cell completeness, same-cell electrophysiology, action-potential initiation site or circuit/behavior effect is assigned to this exact file.",
    ],
  },
  {
    id: "34024", sourceId: "neuromorpho-rat-comparative", upgradeId: "UPG-145", species: "rat", name: "L420-LCN", archive: "Szucs",
    api: [1466, "b8c71a80fe29e4be2e0806349c4ba2ba5f611e7c24262d6bf5157ad39a05201e"],
    morphometry: [468, "a1ea035737fb8bc47afef7292e00216fa9bea068d09bc3346dae0637eb893d38"],
    swc: [731956, "7b71de215c860af28ed78381eaaaad2c03d24d19038ee5e1e8c7962cdf901357"],
    domain: "Dendrites, Soma, Axon", attributes: "Diameter, 3D, Angles", nodeCount: 17973, types: { 1: 12, 2: 14988, 3: 2973 }, diameter: true,
    label: "Rat · Wistar P14–P24 · NMO_34024 L420-LCN", paper: "10.1002/cne.23311",
    boundaries: [
      "One rat source reconstruction; Male/Female and P14–P24 remain raw cohort-valued metadata. The exact cell's sex, age within that range and transmitter are not established.",
      "Repository L420-LCN and paper L420_E2 have no exact source-deposited crosswalk. Article physiology, inhibitory labels, boutons or projections cannot become same-cell fields.",
      "Source-reported Dendrites & Axon Complete remains distinct from biological intactness: article Fig. 6 describes an abrupt ending of L420_E2 likely caused by pia removal, and its methods report deletion of unconnectable processes below 5%; these are paper-level cautions without an exact object join.",
      "The SWC header reports 23 source contours averaged into 23 soma points, while this exact SWC contains 12 type-1 samples. Neither samples nor the unparsed DAT receipt are a membrane or internal structure.",
      "The repository's 100 micrometre parasagittal field and reported_z=90.0 remain raw metadata. No shrinkage correction is applied; standardization and source-local coordinates do not establish a tissue slab or atlas placement.",
    ],
  },
];

const outputs = new Map();
function sourceFile(spec, kind) {
  const filename = `nmo-${spec.id}${kind === "swc" ? ".swc" : `-${kind}.json`}`;
  const bytes = fs.readFileSync(path.join(ROOT, INPUT, filename));
  const [expectedBytes, expectedSha] = spec[kind];
  check(bytes.length === expectedBytes && sha(bytes) === expectedSha, `${spec.id} ${kind} source receipt mismatch`);
  outputs.set(`${PUBLIC}/${filename}`, bytes);
  return {
    id: kind, path: `/data/comparative_swc_reference_v1/${filename}`, sourcePath: `${INPUT}/${filename}`,
    bytes: bytes.length, checksum: { algorithm: "SHA-256", digest: sha(bytes) }, retrievedDate: "2026-09-30",
    url: kind === "swc" ? `https://neuromorpho.org/dableFiles/${spec.archive.toLowerCase()}/CNG%20version/${spec.name}.CNG.swc`
      : `https://neuromorpho.org/api/${kind === "api" ? "neuron" : "morphometry"}/id/${spec.id}`,
    contentType: kind === "swc" ? "source_server_unspecified; validated_UTF8_seven_column_SWC" : "application/json",
  };
}

const objects = specifications.map((spec) => {
  const files = [sourceFile(spec, "api"), sourceFile(spec, "swc"), sourceFile(spec, "morphometry")];
  const read = (kind) => JSON.parse(fs.readFileSync(path.join(ROOT, files.find((file) => file.id === kind).sourcePath), "utf8"));
  const metadata = read("api"), sourceMorphometry = read("morphometry");
  check(String(metadata.neuron_id) === spec.id && metadata.neuron_name === spec.name && metadata.archive === spec.archive && metadata.species === spec.species
    && metadata.domain === spec.domain && metadata.attributes === spec.attributes && metadata.reference_doi.includes(spec.paper), `${spec.id} exact metadata identity mismatch`);
  check(String(sourceMorphometry.neuron_id) === spec.id && sourceMorphometry.neuron_name === spec.name, `${spec.id} morphometry identity mismatch`);
  const swc = files.find((file) => file.id === "swc");
  const sourceBytes = fs.readFileSync(path.join(ROOT, swc.sourcePath));
  const geometry = parseNeuromorphoSwc(sourceBytes, { assetId: `NeuroMorpho:${spec.id}`, neuronId: Number(spec.id), name: spec.name, sourceFrame: FRAME, dimensionality: "3D", diameterAuthorized: spec.diameter });
  check(geometry.computed.nodeCount === spec.nodeCount && JSON.stringify(geometry.computed.nodeTypeCounts) === JSON.stringify(spec.types)
    && geometry.computed.zeroLengthEdgeCount === 0, `${spec.id} independently parsed QC mismatch`);
  if (spec.id === "34024") check(sourceBytes.toString("utf8").includes("23 soma contours that are averaged into 23 soma points"), "Rat soma conversion assertion missing");
  const identity = { sourceId: spec.sourceId, releaseId: RELEASE, objectKind: "standardized_swc", sourceObjectId: spec.id };
  const { radiusSurfaceAuthorized: sourceDiameterAttributePresent, ...computed } = geometry.computed;
  const key = independentSourceObjectKey(identity);
  const locator = `${CONTRACT}#objects/${spec.id}`;
  const conflicts = spec.id === "34024" ? [
    { id: "paper-repository-name", status: "not_established", left: "L420-LCN (exact repository object)", right: "L420_E2 (primary paper)", locator: "https://www.ebi.ac.uk/europepmc/webservices/rest/PMC3738926/fullTextXML#article/body/sec[@id=sec11]/sec[@id=sec13]/fig[@id=fig06]", consequence: "No same-cell join; paper cautions remain paper-level only." },
    { id: "soma-conversion-count", status: "source_assertion_difference", left: "SWC header: 23 contours averaged into 23 soma points", right: "Exact parsed SWC: 12 type-1 nodes", locator: `${swc.path}#header-and-type-1-rows`, consequence: "Preserve both assertions; zero native contour, membrane or internal geometry." },
    { id: "historical-morphometry-receipt", status: "receipt_drift", historicalDate: "2026-08-31", historicalBytes: 468, historicalSha256: "2ae700c70fa9c4bf49dd1dffd2143ef86147e9a5fbfa7e1ba803c06d615ea9c4", currentBytes: 468, currentSha256: files.find((file) => file.id === "morphometry").checksum.digest, historicalBytesAvailable: false, locator: "docs/RESEARCH_MODEL_UPGRADE_QUEUE.md#UPG-145", consequence: "Current 2026-09-30 receipt is a new snapshot; historical bytes are not substituted or claimed verified." },
  ] : [];
  const structureCoverage = [
    { id: "axon", label: "Axon centerline", status: "observed_source_object", detail: `${spec.types[2]} exact type-2 samples; source reconstruction, no membrane surface.`, locator: swc.path },
    { id: "soma", label: "Soma samples", status: spec.types[1] ? "observed_source_object" : "source_reported_absent", detail: spec.types[1] ? "12 standardized type-1 samples; header conversion discrepancy retained." : "Repository No Soma; the deposited axon root is not a soma.", locator: `${files[0].path}#domain` },
    { id: "dendrites", label: "Dendrite centerline", status: spec.types[3] ? "observed_source_object" : "source_reported_absent", detail: spec.types[3] ? "2973 exact type-3 samples." : "Repository No Dendrites; no dendritic geometry is supplied.", locator: `${files[0].path}#domain` },
    { id: "diameter", label: "Source diameter", status: spec.diameter ? "source_reported" : "source_reported_absent", detail: spec.diameter ? "Source Diameter attribute authorizes raw radii, but this lane displays centerlines only." : "No Diameter; raw constant radius and source diameter/surface/volume metrics remain unvalidated for physical calibre.", locator: `${files[0].path}#attributes` },
    ...["membrane", "nucleus", "organelles", "synapses"].map((id) => ({ id, label: id, status: "unavailable", detail: "No admitted same-object surface, volume or internal evidence in these exact standardized SWC assets.", locator })),
  ];
  return {
    ...identity, key, registryId: spec.upgradeId, title: spec.label,
    context: { species: spec.species, name: spec.name, archive: spec.archive, rawMetadata: metadata, sourceMorphometry, sourceMorphometryPolicy: "repository_reported_only; dimensions_use_principal_components_not_axis_aligned_extent; no_membrane_or_physical_volume_claim", qc: geometry.qc, computedFromExactSwc: { ...computed, sourceDiameterAttributePresent }, conflicts, boundaries: [...spec.boundaries, "Independent auto-fit display only; zero mouse-census additions, cross-species identity, common biological scale, atlas transforms or registrations."] },
    coordinateFrame: { frame: FRAME, unit: "micrometre", unitStatus: "source_reported", dimensions: 3 },
    components: [{ id: "source-swc-centerline", authority: "OBS_STANDARDIZED_SOURCE_LOCAL", sourceTypes: Object.keys(spec.types).map(Number), representation: "centerline_only" }],
    relationships: [], files, structureCoverage,
    counts: [{ value: 1, unit: "source_reconstruction", scopeKey: key, derivedFrom: `${files[0].path}#neuron_id` }, { value: geometry.computed.nodeCount, unit: "SWC_node", scopeKey: key, derivedFrom: swc.path }, { value: geometry.computed.segmentCount, unit: "SWC_edge", scopeKey: key, derivedFrom: swc.path }],
    viewer: { kind: "comparative_swc", neuronId: Number(spec.id), diameterAuthorized: spec.diameter, radiusSurfaceAdmitted: false },
    sourceUrl: files[0].url,
    provenance: { sourceId: "NeuroMorpho.Org", rrid: "SCR_002145", originalPaper: `https://doi.org/${spec.paper}`, repositoryCitation: "NeuroMorpho.Org (RRID:SCR_002145)", repositoryMethodsCitation: "Tecuatl C, Ljungquist B, Ascoli GA (2024). FASEB Bioadv. 6(7):207–221. doi:10.1096/fba.2024-00048", reuse: { status: "source_license_confirmed", license: "CC-BY-4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", termsUrl: "https://neuromorpho.org/useterm.jsp", observedDate: "2026-09-30", verificationMethod: "official_terms_page_read_via_browser_tool; no_terms_bytes_snapshot_claim", attributionRequirement: "Original paper, NeuroMorpho.Org complete name/RRID, and repository methods paper." } },
  };
});

const ratAux = [
  ["nmo-34024-source.dat", 1174877, "29a96dfbb51009c64ccfb420c52ca7cc119ebc031156bc552d255186e11f3a67", "https://neuromorpho.org/dableFiles/szucs/Source-Version/L420-LCN.dat", "Source DAT bytes verified only; semantics unparsed; no native contour admission; not publicly packaged."],
  ["PMC3738926.xml", 163042, "d1ce14d56e1afc59cdb64ccbc713ef1bd1c4c8ef930df7f9833c1509cce44fc6", "https://www.ebi.ac.uk/europepmc/webservices/rest/PMC3738926/fullTextXML", "Primary-paper context only; no exact deposited L420-LCN to L420_E2 identity; not publicly packaged."],
].map(([filename, bytes, digest, url, scope]) => {
  const file = fs.readFileSync(path.join(ROOT, INPUT, filename));
  check(file.length === bytes && sha(file) === digest, `${filename} auxiliary receipt mismatch`);
  return { sourcePath: `${INPUT}/${filename}`, bytes, checksum: { algorithm: "SHA-256", digest }, url, retrievedDate: "2026-09-30", publicPackaging: false, scope };
});
const paperText = fs.readFileSync(path.join(ROOT, INPUT, "PMC3738926.xml"), "utf8");
check(paperText.includes("L420_E2") && paperText.includes("pia mater was removed") && paperText.includes("deleted processes was below 5%"), "Primary rat paper cautions missing");
const document = { documentType: "independent_comparative_swc_reference", schemaVersion: "0.1.0", contractId: "comparative-swc-reference-0.1", snapshotDate: "2026-09-30", releaseId: RELEASE,
  repositoryReleaseObservation: { value: "8.6.127", releaseDate: "2026-09-25", locator: "https://neuromorpho.org/useterm.jsp", status: "source_page_observed", boundary: "API/SWC endpoints do not embed this release; object identity is frozen by retrieval snapshot and exact bytes, not claimed as a server-side release lock." },
  scope: { comparativeSourceObjects: 2, scientificDenominators: "one zebrafish reconstruction; one rat reconstruction; separate species and frames", mouseCensusAdditions: 0, sameCellJoins: 0, registrations: 0, membraneSurfaces: 0, internalObjects: 0 },
  sourceLocalCoordinatePolicy: { frame: FRAME, unit: "micrometre", unitsLocator: "https://neuromorpho.org/StdSwc1.21.jsp", unitAuthority: "repository_standardized_SWC_convention; standardization_rules_report_lengths_and_radii_in_micrometres; no_unit_embedded_in_API_object", standardizationLocator: "https://neuromorpho.org/myfaq.jsp", somaConversionLocator: "https://neuromorpho.org/SomaFormat.html", displayTransform: "per-object bounding-box center and uniform scale only; native source values retained", transformsBetweenSources: [] },
  auxiliarySourceReceipts: ratAux, objects };
outputs.set(CONTRACT, encode(document));
const publicFiles = [...outputs].filter(([file]) => file.startsWith(PUBLIC)).map(([file, bytes]) => ({ path: file.replace(/^public/, ""), bytes: bytes.length, checksum: { algorithm: "SHA-256", digest: sha(bytes) } }));
outputs.set(`${PUBLIC}/asset-manifest.json`, encode({ contractId: document.contractId, snapshotDate: document.snapshotDate, files: publicFiles, sourceObjects: objects.map(({ key }) => key) }));
for (const [filename, bytes] of outputs) {
  const target = path.join(ROOT, filename);
  if (checkOnly) check(fs.existsSync(target) && fs.readFileSync(target).equals(bytes), `${filename} generated receipt drift`);
  else { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes); }
}
console.log(`${checkOnly ? "Verified" : "Built"} 2 independent comparative objects / 6 public exact source files; zero mouse-census or identity joins.`);
