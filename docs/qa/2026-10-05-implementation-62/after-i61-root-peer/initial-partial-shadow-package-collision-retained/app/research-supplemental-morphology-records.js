import neuromorphoRelease126ToddNtsRoutePack from "../data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json" with { type: "json" };
import { loadVerifiedPvResearchRecords, resolvePvResearchRecord } from "./pv-independent-research-records.js";
import { attachResearchRecordPresentations } from "./research-record-presentation.js";

export const TODD_NTS_ROUTE_PACK_CANONICAL_SHA256 = "01db2a4df6f66e2fc486041a901b2f5dc9c9ad5238cb637e01ff49d8e8e07537";
export const TODD_NTS_ROUTE_PACK_LOCATOR = "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json";

const pack = neuromorphoRelease126ToddNtsRoutePack;
const routePackRecords = buildRoutePackRecords();
const routePackRecordByFocusId = new Map(routePackRecords.map((record) => [record.focusId, record]));
let packVerificationPromise = null;

function evidence(label, value, authority, locator) {
  return { label, value: String(value), authority, locator };
}

function gap(label, reasonCode, detail, sourceLocator, scope = "record_specific") {
  const statuses = {
    repository_object_unavailable: "unavailable",
    source_schema_no_field: "unavailable",
    source_not_reported: "unavailable",
    not_measured_by_study: "not_measured",
    not_ingested: "not_ingested",
    relationship_not_established: "not_established",
    no_admitted_transform: "not_established",
    unresolved_source_conflict: "unresolved",
  };
  return {
    axisId: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    label,
    status: statuses[reasonCode],
    reasonCode,
    scope,
    authority: scope === "shared_project_limit" ? "project_relationship_policy" : "source_record",
    sourceLocator,
    rawValue: null,
    detail,
    inferenceAllowed: false,
  };
}

function buildRoutePackRecords() {
  if (pack?.contractId !== "neuromorpho-release-8-6-126-todd-nts-route-pack-0.1"
    || pack?.releaseId !== "ohri-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.0"
    || !Array.isArray(pack.routes)
    || pack.routes.length !== 30) {
    throw new Error("The Todd NeuroMorpho source-route pack identity is invalid");
  }

  const sourceRecords = pack.routes.map((route) => {
    const source = route.sourceRecord;
    const geometry = route.fidelityRecord?.geometry;
    const geometryReceipt = route.sourceObjects?.geometry;
    const swcReceipt = route.sourceObjects?.swc;
    const focusId = `NeuroMorpho:${source?.neuronId}`;
    if (!Number.isSafeInteger(source?.neuronId)
      || source.repositoryRelease !== "8.6.126"
      || source.archive !== "Todd"
      || route.censusMembership !== false
      || route.frozenLensMembership !== false
      || !geometry || !geometryReceipt || !swcReceipt
      || geometry.sha256 !== geometryReceipt.sha256
      || geometry.path !== geometryReceipt.path
      || !/^[a-f0-9]{64}$/.test(geometry.sha256)
      || !/^[a-f0-9]{64}$/.test(swcReceipt.sha256)) {
      throw new Error(`The Todd NeuroMorpho source-route record ${focusId} failed its structural receipt`);
    }

    const sourceLocator = `${TODD_NTS_ROUTE_PACK_LOCATOR}#${focusId}`;
    const sourceLabel = source.cellTypeLabels.join(" · ") || "Not reported";
    const regionLabel = source.regionLabels.join(" · ") || "Not reported";
    const age = `${source.numericAge.minimum.value}–${source.numericAge.maximum.value} ${source.numericAge.minimum.unit}`;
    const sourcePaperField = `DOI ${source.repositoryReferenceFieldsRaw.reference_doi.filter(Boolean).join(" · ") || "blank"}; PMID ${source.repositoryReferenceFieldsRaw.reference_pmid.join(" · ") || "blank"} (record-level article mapping unresolved)`;
    const routeReceipt = `${route.routeId} · ${pack.contractId} · ${TODD_NTS_ROUTE_PACK_CANONICAL_SHA256}`;
    const sourceType = route.fidelityRecord.geometry.sourceDiameterAvailable
      ? "Source reports Diameter; radius-derived display is allowed only after geometry verification."
      : "Source reports No Diameter; centerlines only and radius-derived surface unavailable.";

    return {
      key: `morphology_record:${focusId}`,
      focusKind: "morphology_record",
      focusId,
      title: route.title,
      subtitle: `NMO ${source.neuronId} · 8.6.126 · ${source.archive} · supplementary source-local record`,
      namespace: "neuromorpho:8.6.126:Todd",
      laneLabel: "Source-local morphology",
      summary: `${source.domain}; ${source.physicalIntegrity}. One repository reconstruction object only; the 8.6.124 frozen query census and 142-record morphology subset are unchanged.`,
      morphologyMembership: {
        collection: "supplementary",
        censusContribution: 0,
        supplementaryContribution: 1,
        sourceFrameLocator: sourceLocator,
        analysisLocator: `${sourceLocator}#source_metadata_and_geometry_receipt`,
        geometryPath: geometry.path,
        geometrySha256: geometry.sha256,
        routeId: route.routeId,
        routeContractPath: TODD_NTS_ROUTE_PACK_LOCATOR,
        routeContractSha256: TODD_NTS_ROUTE_PACK_CANONICAL_SHA256,
        routeAssetManifestPath: pack.assetManifest.path,
        routeAssetManifestSha256: pack.assetManifest.sha256,
      },
      searchTerms: [focusId, source.neuronId, source.neuronName, source.archive, source.species, source.lifeStage, source.sex, source.strain, source.cellTypeLabels, source.regionLabels, source.condition, source.domain, route.routeId],
      evidence: [
        evidence("Source identifier", focusId, "source_reported", sourceLocator),
        evidence("Repository release", `${source.repository} · ${source.repositoryRelease} · ${source.archive}`, "source_reported", sourceLocator),
        evidence("Source-local label", sourceLabel, "source_reported", sourceLocator),
        evidence("Repository region labels", regionLabel, "source_reported", sourceLocator),
        evidence("Species · life stage · sex · strain", `${source.species} · ${source.lifeStage} · ${source.sex} · ${source.strain}`, "source_reported", sourceLocator),
        evidence("Age range", age, "source_reported", sourceLocator),
        evidence("Condition · protocol", `${source.condition.join(" · ")} · ${source.protocol}`, "source_reported", sourceLocator),
        evidence("Reconstruction · stain", `${source.reconstructionSoftware} · ${source.stain}`, "source_reported", sourceLocator),
        evidence("Source geometry", `${geometry.path} · ${geometry.bytes} bytes · SHA-256 ${geometry.sha256}`, "checksum_verified_source_route_pack", sourceLocator),
        evidence("Raw SWC", `${swcReceipt.path} · ${swcReceipt.bytes} bytes · SHA-256 ${swcReceipt.sha256}`, "checksum_verified_source_route_pack", sourceLocator),
        evidence("Diameter authority", sourceType, "source_reported", sourceLocator),
        evidence("Original paper fields", sourcePaperField, "source_reported_unresolved", sourceLocator),
        evidence("Route and non-census receipt", routeReceipt, "checksum_verified_source_route_pack", sourceLocator),
        evidence("Internal structures", "Unavailable: no same-specimen membrane, nucleus, organelle, bouton, receptor or ultrastructure source.", "UNAVAILABLE", sourceLocator),
      ],
      gaps: [
        gap("Original morphology file", "repository_object_unavailable", "The repository exposes no original Neurolucida file for this route pack.", sourceLocator),
        gap("Standardization log", "repository_object_unavailable", "The source standardization log is unavailable; no reverse transform is inferred.", sourceLocator),
        gap("Record-to-article mapping", "unresolved_source_conflict", "The exact per-record DOI is blank and the PMID field does not resolve to a verified article crosswalk.", sourceLocator),
        gap("Independent specimen identity", "source_schema_no_field", "No stable animal or specimen identifier is exposed for this record.", sourceLocator),
        gap("Biological completeness", "not_measured_by_study", "Repository completeness wording is retained but has not been independently validated against raw imagery.", sourceLocator),
        gap("Atlas placement", "no_admitted_transform", "This source-local frame has no admitted atlas transform.", sourceLocator, "shared_project_limit"),
        gap("Cross-source same-cell identity", "relationship_not_established", "No identity or transcriptomic crosswalk is established for this reconstruction.", sourceLocator, "shared_project_limit"),
        gap("Same-specimen internal structure", "repository_object_unavailable", "No same-specimen internal-structure source is linked; do not add substitute primitives.", sourceLocator),
      ],
      provenance: {
        label: "NeuroMorpho.Org · Todd archive · release 8.6.126",
        citation: "NeuroMorpho.Org, Todd archive; record-to-original-paper mapping unresolved.",
        doi: null,
        urls: [
          { label: "Official record", url: `https://neuromorpho.org/api/neuron/id/${source.neuronId}` },
          { label: "Reuse terms", url: pack.licenseAndAttribution.termsUrl },
          { label: "Candidate study context (unverified mapping)", url: pack.candidateStudyContext.url },
        ],
        accessions: [focusId],
        locators: [TODD_NTS_ROUTE_PACK_LOCATOR, pack.assetManifest.path, geometry.path, swcReceipt.path, sourceLocator],
        objectHashes: [
          { label: "Canonical route pack", sha256: TODD_NTS_ROUTE_PACK_CANONICAL_SHA256 },
          { label: "Public asset manifest", sha256: pack.assetManifest.sha256 },
          { label: "Standardized SWC", sha256: swcReceipt.sha256 },
          { label: "Canonical geometry", sha256: geometry.sha256 },
        ],
      },
      coordinate: {
        geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL",
        frame: source.sourceFrame,
        registrationStatus: "unregistered",
        registrationCount: 0,
        measurementUse: "source_local_descriptive_only",
      },
      relationshipStatus: "not_established_outside_this_source_record",
      boundary: `${route.identityBoundary.crossSourceIdentity}; ${route.identityBoundary.studyCellMapping}. The route remains outside the frozen census, source-local and unregistered; repository labels are not promoted to a paper-level subtype.`,
      navigation: { lab: "morphology", params: { morphologyView: "individual", morphologyNeuron: String(source.neuronId) }, anchor: "morphology-panel" },
      sourceRouteVerification: {
        authority: "checksum_verified_source_route_pack",
        contractId: pack.contractId,
        canonicalSha256: TODD_NTS_ROUTE_PACK_CANONICAL_SHA256,
      },
    };
  });

  if (new Set(sourceRecords.map((record) => record.focusId)).size !== 30) {
    throw new Error("The Todd NeuroMorpho source-route pack contains duplicate focus IDs");
  }
  const presentedRecords = attachResearchRecordPresentations(sourceRecords);
  return presentedRecords.map((record) => ({
    ...record,
    presentation: {
      ...record.presentation,
      modeling: {
        ...record.presentation.modeling,
        axes: record.presentation.modeling.axes.map((axis) => axis.axisId === "source_record"
          ? { ...axis, authority: "checksum_verified_source_route_pack", detail: "The exact route identity and source-declared metadata are resolved from the byte-locked Todd 8.6.126 route pack." }
          : axis),
      },
    },
  }));
}

async function verifyRoutePack(cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl?.subtle?.digest || typeof TextEncoder === "undefined") {
    throw new Error("Supplemental morphology route verification is unavailable; selection remains fail-closed");
  }
  const bytes = new TextEncoder().encode(`${JSON.stringify(pack, null, 2)}\n`);
  const digest = new Uint8Array(await cryptoImpl.subtle.digest("SHA-256", bytes));
  const actualSha256 = Array.from(digest, (value) => value.toString(16).padStart(2, "0")).join("");
  if (actualSha256 !== TODD_NTS_ROUTE_PACK_CANONICAL_SHA256) {
    throw new Error("Todd NeuroMorpho route-pack checksum does not match the locked source record set");
  }
  return true;
}

export async function loadVerifiedSupplementalMorphologyResearchRecords({ cryptoImpl = globalThis.crypto } = {}) {
  if (!packVerificationPromise) {
    packVerificationPromise = verifyRoutePack(cryptoImpl).catch((error) => {
      packVerificationPromise = null;
      throw error;
    });
  }
  await packVerificationPromise;
  return [...routePackRecords, ...await loadVerifiedPvResearchRecords({ cryptoImpl })];
}

export async function resolveSupplementalMorphologyResearchRecord(focus, options = {}) {
  if (focus?.focusKind !== "morphology_record" || typeof focus.focusId !== "string") return null;
  const record = routePackRecordByFocusId.get(focus.focusId);
  if (!record) return resolvePvResearchRecord(focus, options);
  await loadVerifiedSupplementalMorphologyResearchRecords(options);
  return record;
}
