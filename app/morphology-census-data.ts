"use client";

import { useEffect, useState } from "react";
import { readVerifiedMorphologyGeometry, morphologyGeometryVerificationReceipt } from "./morphology-geometry-verification.js";
import {
  assertGeometryMatchesSourceFrameDisclosure,
  morphologySourceFrameDisclosureFor,
} from "./morphology-source-frame-disclosure";

export type MorphologyExplicitMissingValue = { value: unknown; missingReason: string | null };

export type MorphologyCensusRecord = {
  assetId: string;
  neuronId: number;
  officialMetadata: Record<string, unknown>;
  normalizedMetadata: {
    name: string;
    archive: string;
    species: string | string[];
    lifeStage: string;
    brainRegion: string[];
    cellType: string[];
    strain: string | string[];
    gender: string | string[];
    experimentCondition: string | string[];
    domain: string;
    physicalIntegrity: string;
    attributes: string;
    dimensionality: "2D" | "3D";
    sourceDiameterAvailable: boolean;
    sourceFrame: string;
    registrationStatus: "unregistered";
  };
  missingness: Record<string, MorphologyExplicitMissingValue>;
  sourcePaper: { pmids: string[]; dois: string[] };
  geometry: {
    available: boolean;
    path: string | null;
    sha256: string | null;
    bytes: number | null;
    rawSwcPath: string | null;
    rawSwcSha256: string | null;
    missingReason: string | null;
  };
  qc: Record<string, unknown>;
  morphometrics: {
    sourceReported: Record<string, unknown>;
    computed: Record<string, unknown>;
  };
};

export type MorphologyComparisonMembership = {
  collection: "census" | "supplementary";
  censusContribution: 0 | 1;
  supplementaryContribution: 0 | 1;
  routeId: string | null;
  routeContractPath: string | null;
  routeContractSha256: string | null;
  routeAssetManifestPath: string | null;
  routeAssetManifestSha256: string | null;
};

export type MorphologyComparisonRecord = MorphologyCensusRecord & {
  comparisonMembership: MorphologyComparisonMembership;
};

export type MorphologyGeometryPayload = {
  schemaVersion: string;
  assetId: string;
  neuronId: number;
  name: string;
  geometryStatus: "OBS_STANDARDIZED_SOURCE_LOCAL";
  sourceFrame: string;
  units: string;
  registration: {
    status: "unregistered";
    registrationCount: 0;
    atlasTransform: { value: null; missingReason: string };
    atlasPlacement: { value: null; missingReason: string };
    [key: string]: unknown;
  };
  scientificUse: string;
  source: Record<string, unknown>;
  swc: Record<string, unknown>;
  qc: Record<string, unknown>;
  morphometrics: {
    sourceReported?: Record<string, unknown>;
    computedFromStandardizedSwc?: {
      segmentCount: number;
      rootNodeId: number;
      boundsMicrometre: { min: [number, number, number]; max: [number, number, number] };
      extentMicrometre: [number, number, number];
      [key: string]: unknown;
    };
  };
  displayTransform: {
    kind: "soma_centered_uniform_scale";
    originMicrometre: [number, number, number];
    scaleViewerUnitPerMicrometre: number;
    use: "viewer_only";
  };
  nodeColumns: string[];
  nodes: [number, number, number, number, number, number, number][];
  segmentColumns: ["x1", "y1", "z1", "r1", "x2", "y2", "z2", "r2", "sourceType", "interpretation"];
  segments: [number, number, number, number, number, number, number, number, number, string][];
};

export type VerifiedGeometryState =
  | { status: "idle"; geometry: null; message: string }
  | { status: "loading"; geometry: null; message: string }
  | { status: "verified"; geometry: MorphologyGeometryPayload; message: string }
  | { status: "unavailable"; geometry: null; message: string };

export const MORPHOLOGY_CENSUS_BASE = "/data/neuromorpho_release_8_6_124_census_v1/";
export const MORPHOLOGY_TYPE_COLORS: Record<number, number> = {
  1: 0xf3b33e,
  2: 0xd55e00,
  3: 0x56b4e9,
  4: 0xcc79a7,
  5: 0x009e73,
  6: 0xb8a6d9,
  7: 0x7bd3be,
};
export const MORPHOLOGY_TYPE_CSS_COLORS: Record<number, string> = Object.fromEntries(
  Object.entries(MORPHOLOGY_TYPE_COLORS).map(([key, value]) => [Number(key), `#${value.toString(16).padStart(6, "0")}`]),
);
export const MORPHOLOGY_TYPE_LABELS: Record<number, string> = {
  1: "Soma",
  2: "Axon",
  3: "Dendrite",
  4: "Apical dendrite",
  5: "Source type 5",
  6: "Uninterpreted neurite (source type 6)",
  7: "Source type 7",
};

// Only completed immutable payloads are shared. In-flight requests belong to
// their own consumer, so closing one viewport cannot abort another viewport.
const geometryCache = new Map<string, MorphologyGeometryPayload>();

function assertGeometryMatchesCurrentRecord(
  record: MorphologyCensusRecord,
  disclosure: ReturnType<typeof morphologySourceFrameDisclosureFor>,
  geometry: MorphologyGeometryPayload,
) {
  if (
    geometry.neuronId !== record.neuronId ||
    geometry.assetId !== record.assetId ||
    geometry.geometryStatus !== "OBS_STANDARDIZED_SOURCE_LOCAL" ||
    geometry.segments.length !== Number(record.morphometrics.computed.segmentCount)
  ) throw new Error("geometry identity or authority receipt mismatch");
  assertGeometryMatchesSourceFrameDisclosure(disclosure, geometry);
  morphologyGeometryVerificationReceipt(record, disclosure, geometry);
  return geometry;
}

export function morphologyGeometryUrl(record: MorphologyCensusRecord) {
  const path = record.geometry.path;
  if (!path) return null;
  return path.startsWith("/") ? path : `${MORPHOLOGY_CENSUS_BASE}${path}`;
}

export function morphologyClassification(record: MorphologyCensusRecord) {
  const labels = record.normalizedMetadata.cellType.map((value) => value.toLowerCase());
  if (labels.some((value) => value.includes("inhibitory"))) return "inhibitory";
  if (labels.some((value) => value.includes("excitatory"))) return "excitatory";
  return "unclassified";
}

export function morphologyHasAxon(record: MorphologyCensusRecord) {
  const domain = record.normalizedMetadata.domain.toLowerCase();
  return domain.includes("axon") && !domain.includes("no axon");
}

export function morphologyHasDiameter(record: MorphologyCensusRecord) {
  return record.normalizedMetadata.sourceDiameterAvailable;
}

export function asFrozenCensusComparisonRecord(record: MorphologyCensusRecord): MorphologyComparisonRecord {
  return {
    ...record,
    comparisonMembership: {
      collection: "census",
      censusContribution: 1,
      supplementaryContribution: 0,
      routeId: null,
      routeContractPath: null,
      routeContractSha256: null,
      routeAssetManifestPath: null,
      routeAssetManifestSha256: null,
    },
  };
}

export async function loadVerifiedMorphologyGeometry(record: MorphologyCensusRecord, { forceReload = false, signal }: { forceReload?: boolean; signal?: AbortSignal } = {}) {
  if (!record.geometry.available || !record.geometry.path || !record.geometry.sha256 || !record.geometry.bytes) {
    throw new Error(record.geometry.missingReason ?? "geometry was not admitted");
  }
  const disclosure = morphologySourceFrameDisclosureFor(record);
  const cacheKey = `${record.neuronId}:${record.geometry.sha256}`;
  const cached = geometryCache.get(cacheKey);
  if (forceReload) geometryCache.delete(cacheKey);
  if (cached && !forceReload) {
    if (signal?.aborted) throw new DOMException("Morphology verification was cancelled", "AbortError");
    return assertGeometryMatchesCurrentRecord(record, disclosure, cached);
  }
  const request = (async () => {
    const geometry = await readVerifiedMorphologyGeometry(record, disclosure, { fetchImpl: fetch, signal, forceReload });
    if (signal?.aborted) throw new DOMException("Morphology verification was cancelled", "AbortError");
    const verified = assertGeometryMatchesCurrentRecord(record, disclosure, geometry);
    geometryCache.set(cacheKey, verified);
    return verified;
  })();
  return request;
}

export function useVerifiedMorphologyGeometry(record: MorphologyCensusRecord | null): VerifiedGeometryState {
  const [state, setState] = useState<VerifiedGeometryState>({ status: "idle", geometry: null, message: "No reconstruction selected" });
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    if (!record) {
      queueMicrotask(() => {
        if (!cancelled) setState({ status: "idle", geometry: null, message: "No reconstruction selected" });
      });
      return () => { cancelled = true; controller.abort(); };
    }
    if (!record.geometry.available) {
      queueMicrotask(() => {
        if (!cancelled) setState({ status: "unavailable", geometry: null, message: record.geometry.missingReason ?? "geometry was not admitted" });
      });
      return () => { cancelled = true; controller.abort(); };
    }
    queueMicrotask(() => {
      if (!cancelled) setState({ status: "loading", geometry: null, message: `Verifying NeuroMorpho ${record.neuronId} geometry…` });
    });
    loadVerifiedMorphologyGeometry(record, { signal: controller.signal })
      .then((geometry) => {
        if (!cancelled) setState({ status: "verified", geometry, message: `Verified ${geometry.segments.length.toLocaleString()} exact SWC segments` });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: "unavailable", geometry: null, message: error.message });
      });
    return () => { cancelled = true; controller.abort(); };
  }, [record]);
  // Effects clear the previous load asynchronously; never expose that payload
  // under a newly selected record while the new source verification is pending.
  if (!record) return { status: "idle", geometry: null, message: "No reconstruction selected" };
  if (state.status === "verified") {
    try { morphologyGeometryVerificationReceipt(record, morphologySourceFrameDisclosureFor(record), state.geometry); }
    catch { return { status: "loading", geometry: null, message: `Verifying NeuroMorpho ${record.neuronId} geometry…` }; }
  }
  return state;
}
