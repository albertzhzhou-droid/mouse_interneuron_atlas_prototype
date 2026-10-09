import pack from "../data/pv-independent-morphology-routes-0.1.json" with { type: "json" };
import inputs from "../data/research-renderer-runtime-inputs-2.91.json" with { type: "json" };
import { attachResearchRecordPresentations } from "./research-record-presentation.js";

export const PV_ROUTE_LOCATOR = "data/pv-independent-morphology-routes-0.1.json";
const pin = inputs.authoritativeInputs.find(row => row.path === PV_ROUTE_LOCATOR);
const check = (value, reason) => { if (!value) throw new Error(`PV research record: ${reason}`); };
const evidence = (label, value, locator, authority = "source_reported") => ({ label, value: String(value), authority, locator });
const gap = (label, reasonCode, detail, sourceLocator) => ({ axisId: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label,
  status: reasonCode === "relationship_not_established" ? "not_established" : "unavailable", reasonCode, detail,
  scope: "record_specific", authority: "source_record", sourceLocator, rawValue: null, inferenceAllowed: false });
const records = attachResearchRecordPresentations(pack.routes.map((route, index) => {
  const s = route.sourceRecord, g = route.fidelityRecord.geometry, locator = `${PV_ROUTE_LOCATOR}#/routes/${index}`;
  check(s.repositoryRelease === "8.6.124" && s.archive === "Hughes" && route.censusMembership === false, "source or independent membership changed");
  return {
    key: `morphology_record:${s.assetId}`, focusKind: "morphology_record", focusId: s.assetId, title: route.title,
    subtitle: `NMO ${s.neuronId} · Hughes · independent PV reconstruction`, namespace: "neuromorpho:Hughes", laneLabel: "Source-local morphology",
    summary: `${s.domain}; ${s.physicalIntegrity}. Separate study and source frame; no paired experiment or exact paper physiology join.`,
    morphologyMembership: { collection: "supplementary", censusContribution: 0, supplementaryContribution: 1,
      sourceFrameLocator: locator, analysisLocator: `${locator}/topology`, geometryPath: g.path, geometrySha256: g.sha256,
      routeId: route.routeId, routeContractPath: PV_ROUTE_LOCATOR, routeContractSha256: pin?.sha256,
      routeAssetManifestPath: pack.assetManifest.path, routeAssetManifestSha256: pack.assetManifest.sha256 },
    searchTerms: [s.assetId, s.neuronId, s.name, s.archive, s.species, s.lifeStage, s.strain, ...s.cellTypeLabels, ...s.regionLabels, route.routeId],
    evidence: [
      evidence("Source identifier", s.assetId, `${locator}/sourceRecord/assetId`),
      evidence("Repository release", "NeuroMorpho.Org · frozen 8.6.124", `${locator}/sourceRecord/repositoryRelease`),
      evidence("Source-local labels", s.cellTypeLabels.join(" · "), `${locator}/sourceRecord/cellTypeLabels`),
      evidence("Region labels", s.regionLabels.join(" · "), `${locator}/sourceRecord/regionLabels`),
      evidence("Species · stage · strain · sex field", `${s.species} · ${s.lifeStage} · ${s.strain} · ${s.sex} (individual sex unresolved)`, `${locator}/sourceRecord`),
      evidence("Condition · preparation", `${s.condition.join(" · ")} · ${s.protocol} · ${s.slicingDirection} · ${s.slicingThicknessMicrometre} µm`, `${locator}/sourceRecord`),
      evidence("Source domain · integrity", `${s.domain} · ${s.physicalIntegrity}`, `${locator}/sourceRecord`),
      evidence("Diameter authority", g.sourceDiameterAvailable ? "Source reports Diameter; derived radius display requires current private geometry proof." : "Source reports No Diameter; centerlines only.", `${locator}/fidelityRecord`),
      evidence("Geometry receipt", `${g.path} · ${g.bytes} bytes · SHA-256 ${g.sha256}`, `${locator}/sourceObjects/geometry`, "checksum_verified_source_route_pack"),
      evidence("Original SWC receipt", `${route.sourceObjects.swc.path} · ${route.sourceObjects.swc.bytes} bytes · SHA-256 ${route.sourceObjects.swc.sha256}`, `${locator}/sourceObjects/swc`, "checksum_verified_source_route_pack"),
      evidence("Paper citation", `DOI ${s.repositoryReferenceFieldsRaw.reference_doi[0]} · PMID ${s.repositoryReferenceFieldsRaw.reference_pmid[0]} (citation only; exact experimental-cell mapping unavailable)`, `${locator}/sourceRecord/repositoryReferenceFieldsRaw`),
      evidence("Internal structures", "Unavailable: no exact same-specimen raw volume, membrane, nucleus, organelle or synapse parent chain.", `${locator}/renderingContract`, "UNAVAILABLE"),
    ],
    gaps: [
      gap("Numeric age", "source_not_reported", "Young adult is source-reported; numeric age is not reported.", `${locator}/sourceRecord/numericAge`),
      gap("Independent physical parent", "source_schema_no_field", "No stable animal, specimen, physical-cell or section parent is available.", locator),
      gap("Paper experiment mapping", "relationship_not_established", "The citation does not establish a same-cell electrophysiology, circuit or group-statistic join.", locator),
      gap("Same-specimen internal structure", "repository_object_unavailable", "No exact same-specimen internal-object geometry is admitted.", locator),
    ],
    provenance: { label: "NeuroMorpho.Org · Hughes · frozen 8.6.124", citation: `Original reconstruction attribution: DOI ${s.repositoryReferenceFieldsRaw.reference_doi[0]}; NeuroMorpho.Org (RRID:SCR_002145); Tecuatl et al. 2024, 10.1096/fba.2024-00048.`,
      doi: s.repositoryReferenceFieldsRaw.reference_doi[0], urls: Object.entries(route.sourceLinks).map(([label, url]) => ({ label, url })),
      accessions: [s.assetId], locators: [PV_ROUTE_LOCATOR, locator, g.path, route.sourceObjects.swc.path],
      objectHashes: [{ label: "Geometry", sha256: g.sha256 }, { label: "Standardized SWC", sha256: route.sourceObjects.swc.sha256 }] },
    coordinate: { geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL", frame: g.sourceFrame, registrationStatus: "unregistered", registrationCount: 0, measurementUse: "source_local_descriptive_only" },
    relationshipStatus: "not_established_outside_this_source_record", boundary: route.hardBoundaries.join(" "),
    navigation: { lab: "morphology", params: { cellForm: String(s.neuronId), observedForm: "1", view: "cell_detail" }, anchor: "observed-route-library-title" },
    sourceRouteVerification: { authority: "checksum_verified_source_route_pack", contractId: pack.contractId, canonicalSha256: pin?.sha256 },
  };
}));
let verification;
export async function loadVerifiedPvResearchRecords({ cryptoImpl = globalThis.crypto } = {}) {
  if (!verification) verification = (async () => {
    check(pin && cryptoImpl?.subtle, "current contract pin or checksum verifier unavailable");
    const bytes = new TextEncoder().encode(JSON.stringify(pack, null, 2) + "\n");
    const digest = await cryptoImpl.subtle.digest("SHA-256", bytes);
    const actual = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
    check(bytes.length === pin.bytes && actual === pin.sha256, "contract byte receipt changed");
  })().catch(error => { verification = null; throw error; });
  await verification; return records;
}
export async function resolvePvResearchRecord(focus, options = {}) {
  if (focus?.focusKind !== "morphology_record") return null;
  const record = records.find(row => row.focusId === focus.focusId);
  if (!record) return null;
  await loadVerifiedPvResearchRecords(options); return record;
}
