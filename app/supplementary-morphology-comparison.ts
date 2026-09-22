"use client";

import { useEffect, useState } from "react";
import adapterJson from "../data/supplementary-morphology-comparison-adapter-0.1.json";
import type { MorphologyAnalysisRecord } from "./MorphologyAnalysisPanel";
import type { MorphologyComparisonRecord } from "./morphology-census-data";
import { sha256Hex } from "./source-local-morphology-geometry.js";

const EXPECTED_IDS = [45674, 45718, 50394, 50408, 50424, 170035, 249676] as const;
const EXPECTED_ROUTE_SOURCE_COUNT = 4;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

type AdapterReceipt = {
  path: string;
  bytes: number;
  sha256: string;
  assetManifestPath: string;
  assetManifestBytes: number;
  assetManifestSha256: string;
};

type SupplementaryAdapter = {
  documentType: string;
  schemaVersion: string;
  adapterId: string;
  releaseId: string;
  sourceCensus: {
    immutable: boolean;
    recordCount: number;
    censusIndexSha256: string;
    assetManifestSha256: string;
  };
  routeSources: unknown[];
  analysisDelta: AdapterReceipt;
  scientificBoundary: Record<string, unknown>;
  summary: Record<string, unknown>;
  records: unknown[];
};

export type SupplementaryAnalysisState =
  | { status: "loading"; records: []; message: string }
  | { status: "verified"; records: MorphologyAnalysisRecord[]; message: string; sha256: string }
  | { status: "unavailable"; records: []; message: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactIdRoster(records: { neuronId: number }[]) {
  return records.map((record) => record.neuronId).toSorted((left, right) => left - right);
}

function sameNumberArray(left: readonly number[], right: readonly number[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function assertZeroBoundary(boundary: Record<string, unknown>, key: string) {
  if (boundary[key] !== 0) throw new Error(`supplementary ${key} boundary changed`);
}

function validateStaticAdapter(value: unknown): {
  adapter: SupplementaryAdapter;
  records: MorphologyComparisonRecord[];
} {
  if (!isObject(value)) throw new Error("supplementary comparison adapter is not an object");
  const adapter = value as unknown as SupplementaryAdapter;
  if (
    adapter.documentType !== "supplementary_morphology_comparison_adapter" ||
    adapter.schemaVersion !== "0.1.0" ||
    adapter.adapterId !== "supplementary-morphology-comparison-adapter-0.1" ||
    adapter.releaseId !== "ohri-supplementary-morphology-comparison-adapter-0.1.0"
  ) throw new Error("supplementary comparison adapter identity changed");
  if (
    adapter.sourceCensus?.immutable !== true ||
    adapter.sourceCensus?.recordCount !== 142 ||
    adapter.sourceCensus?.censusIndexSha256 !== "1598b5119f5826719e390fe46615a291b51fa3cd7716e9a191ad645f73165364" ||
    adapter.sourceCensus?.assetManifestSha256 !== "2c1153fe86e3bc2f08505cf2416ab25b2d8e9ca747b0bffcfad5aacc9286cf91"
  ) throw new Error("frozen 142-record census receipt changed");
  if (!Array.isArray(adapter.routeSources) || adapter.routeSources.length !== EXPECTED_ROUTE_SOURCE_COUNT) {
    throw new Error("supplementary route-source denominator changed");
  }
  const routeSourceByContractPath = new Map<string, Record<string, unknown>>();
  const routeSourceNeuronIds: number[] = [];
  for (const [index, source] of adapter.routeSources.entries()) {
    if (!isObject(source)) throw new Error(`supplementary route source ${index} is not an object`);
    if (
      typeof source.contractPath !== "string" ||
      typeof source.assetManifestPath !== "string" ||
      !Number.isInteger(source.contractBytes) || Number(source.contractBytes) <= 0 ||
      !Number.isInteger(source.assetManifestBytes) || Number(source.assetManifestBytes) <= 0 ||
      !SHA256_PATTERN.test(String(source.contractSha256 ?? "")) ||
      !SHA256_PATTERN.test(String(source.assetManifestSha256 ?? "")) ||
      !Array.isArray(source.supplementaryNeuronIds)
    ) throw new Error(`supplementary route source ${index} lost an exact receipt`);
    if (routeSourceByContractPath.has(source.contractPath)) throw new Error("supplementary route contract paths are not unique");
    routeSourceByContractPath.set(source.contractPath, source);
    routeSourceNeuronIds.push(...source.supplementaryNeuronIds.map(Number));
  }
  if (!sameNumberArray(routeSourceNeuronIds.toSorted((left, right) => left - right), EXPECTED_IDS)) {
    throw new Error("supplementary route-source neuron roster changed");
  }
  if (!Array.isArray(adapter.records) || adapter.records.length !== EXPECTED_IDS.length) {
    throw new Error("supplementary record denominator changed");
  }

  const records = adapter.records as MorphologyComparisonRecord[];
  if (!sameNumberArray(exactIdRoster(records), EXPECTED_IDS)) throw new Error("supplementary neuron roster changed");
  if (new Set(records.map((record) => record.geometry.path)).size !== EXPECTED_IDS.length) {
    throw new Error("supplementary geometry paths are not unique");
  }
  for (const record of records) {
    const membership = record.comparisonMembership;
    const routeSource = routeSourceByContractPath.get(membership?.routeContractPath ?? "");
    if (
      record.assetId !== `NeuroMorpho:${record.neuronId}` ||
      !record.geometry.available ||
      !record.geometry.path?.startsWith("/data/") ||
      !record.geometry.bytes ||
      !SHA256_PATTERN.test(record.geometry.sha256 ?? "") ||
      membership?.collection !== "supplementary" ||
      membership.censusContribution !== 0 ||
      membership.supplementaryContribution !== 1 ||
      !membership.routeId ||
      !membership.routeContractPath ||
      !SHA256_PATTERN.test(membership.routeContractSha256 ?? "") ||
      !membership.routeAssetManifestPath ||
      !SHA256_PATTERN.test(membership.routeAssetManifestSha256 ?? "") ||
      !routeSource ||
      routeSource.contractSha256 !== membership.routeContractSha256 ||
      routeSource.assetManifestPath !== membership.routeAssetManifestPath ||
      routeSource.assetManifestSha256 !== membership.routeAssetManifestSha256 ||
      !(routeSource.supplementaryNeuronIds as unknown[]).map(Number).includes(record.neuronId)
    ) throw new Error(`supplementary record ${record.neuronId} lost identity, geometry, or route provenance`);
  }

  const summary = adapter.summary;
  if (
    summary.frozenCensusRecordCount !== 142 ||
    summary.supplementaryRecordCount !== 7 ||
    summary.viewableSourceObjectCount !== 149 ||
    summary.combinedCensusClaim !== false ||
    summary.geometryReferenceCount !== 7 ||
    summary.geometryCopyCount !== 0 ||
    summary.swcCopyCount !== 0 ||
    summary.paddingRecordCount !== 0
  ) throw new Error("supplementary comparison denominator or copy boundary changed");
  for (const key of [
    "commonOrientationAdmissionCount",
    "commonScaleAdmissionCount",
    "completeAxonClaimCount",
    "crossSourceIdentityCount",
    "registrationCount",
    "renderedInternalPrimitiveCount",
    "sameSpecimenInternalStructureCount",
  ]) assertZeroBoundary(summary, key);
  if (
    adapter.scientificBoundary?.combinedCensusClaim !== false ||
    adapter.scientificBoundary?.commonCoordinateFrameClaim !== false ||
    adapter.scientificBoundary?.commonOrientationClaim !== false ||
    adapter.scientificBoundary?.commonScaleClaim !== false
  ) throw new Error("supplementary co-display-only boundary changed");
  for (const key of [
    "atlasPlacementCount",
    "atlasTransformCount",
    "censusExpansionCount",
    "commonOrientationAdmissionCount",
    "commonScaleAdmissionCount",
    "completeAxonClaimCount",
    "crossSourceIdentityCount",
    "paddingRecordCount",
    "registrationCount",
    "renderedInternalPrimitiveCount",
    "sameSpecimenInternalStructureCount",
  ]) assertZeroBoundary(adapter.scientificBoundary, key);
  if (
    adapter.analysisDelta.path !== "/data/supplementary_morphology_comparison_v1/analysis-delta.json" ||
    adapter.analysisDelta.assetManifestPath !== "/data/supplementary_morphology_comparison_v1/asset-manifest.json" ||
    !Number.isInteger(adapter.analysisDelta.bytes) || adapter.analysisDelta.bytes <= 0 ||
    !Number.isInteger(adapter.analysisDelta.assetManifestBytes) || adapter.analysisDelta.assetManifestBytes <= 0 ||
    !SHA256_PATTERN.test(adapter.analysisDelta.sha256) ||
    !SHA256_PATTERN.test(adapter.analysisDelta.assetManifestSha256)
  ) throw new Error("supplementary analysis receipt changed");
  return { adapter, records };
}

const staticState = (() => {
  try {
    const verified = validateStaticAdapter(adapterJson);
    return { status: "verified" as const, ...verified, message: "7 checksum-derived supplementary route records available" };
  } catch (error) {
    return {
      status: "unavailable" as const,
      adapter: null,
      records: [] as MorphologyComparisonRecord[],
      message: error instanceof Error ? error.message : "supplementary comparison adapter is unavailable",
    };
  }
})();

export const supplementaryMorphologyRecords = staticState.records;
export const supplementaryMorphologyAdapterMessage = staticState.message;
export const supplementaryMorphologyAdapterStatus = staticState.status;

function validateAnalysisDelta(value: unknown): MorphologyAnalysisRecord[] {
  if (!isObject(value)) throw new Error("supplementary analysis delta is not an object");
  const delta = value as Record<string, unknown>;
  if (
    delta.documentType !== "supplementary_morphology_analysis_delta" ||
    delta.schemaVersion !== "0.1.0" ||
    delta.assetSetId !== "ohri:supplementary-morphology-comparison-v1" ||
    delta.releaseId !== "ohri-supplementary-morphology-comparison-adapter-0.1.0"
  ) throw new Error("supplementary analysis identity changed");
  const summary = delta.summary;
  const boundary = delta.scientificBoundary;
  if (!isObject(summary) || !isObject(boundary)) throw new Error("supplementary analysis boundary is missing");
  if (
    summary.supplementaryRecordCount !== 7 ||
    summary.geometryReferenceCount !== 7 ||
    summary.geometryCopyCount !== 0 ||
    summary.swcCopyCount !== 0 ||
    boundary.combinedCensusClaim !== false ||
    boundary.censusExpansionCount !== 0 ||
    boundary.registrationCount !== 0 ||
    boundary.renderedInternalPrimitiveCount !== 0
  ) throw new Error("supplementary analysis denominator or scientific boundary changed");
  if (!Array.isArray(delta.records) || delta.records.length !== EXPECTED_IDS.length) {
    throw new Error("supplementary analysis record denominator changed");
  }
  const records = delta.records as (MorphologyAnalysisRecord & { comparisonMembership?: Record<string, unknown> })[];
  if (!sameNumberArray(exactIdRoster(records), EXPECTED_IDS)) throw new Error("supplementary analysis neuron roster changed");
  for (const record of records) {
    if (
      record.denominatorBoundary?.analysisUnit !== "NeuroMorpho_record" ||
      record.denominatorBoundary?.recordCountContribution !== 1 ||
      record.comparisonMembership?.collection !== "supplementary" ||
      record.comparisonMembership?.censusContribution !== 0 ||
      record.comparisonMembership?.supplementaryContribution !== 1
    ) throw new Error(`supplementary analysis record ${record.neuronId} lost denominator membership`);
  }
  return records;
}

export function useSupplementaryMorphologyAnalysis(): SupplementaryAnalysisState {
  const [state, setState] = useState<SupplementaryAnalysisState>(() => staticState.status === "verified"
    ? { status: "loading", records: [], message: "Loading and verifying the 7-record supplementary analysis delta…" }
    : { status: "unavailable", records: [], message: staticState.message });

  useEffect(() => {
    if (staticState.status !== "verified") return;
    const adapter = staticState.adapter;
    const controller = new AbortController();
    const load = async () => {
      try {
        const receipt = adapter.analysisDelta;
        const manifestResponse = await fetch(receipt.assetManifestPath, { signal: controller.signal });
        if (!manifestResponse.ok) throw new Error(`supplementary analysis manifest request failed (${manifestResponse.status})`);
        const manifestBytes = await manifestResponse.arrayBuffer();
        if (manifestBytes.byteLength !== receipt.assetManifestBytes || await sha256Hex(manifestBytes) !== receipt.assetManifestSha256) {
          throw new Error("supplementary analysis manifest receipt mismatch");
        }
        const manifest = JSON.parse(new TextDecoder().decode(manifestBytes)) as Record<string, unknown>;
        if (
          manifest.documentType !== "supplementary_morphology_comparison_asset_manifest" ||
          manifest.assetSetId !== "ohri:supplementary-morphology-comparison-v1" ||
          manifest.releaseId !== adapter.releaseId
        ) throw new Error("supplementary analysis manifest identity changed");
        const summary = manifest.summary;
        const files = manifest.files;
        if (
          !isObject(summary) || summary.directoryFileCount !== 2 || summary.declaredPayloadFileCount !== 1 ||
          summary.geometryCopyCount !== 0 || summary.swcCopyCount !== 0 || summary.registrationCount !== 0 ||
          !Array.isArray(files) || files.length !== 1
        ) throw new Error("supplementary analysis manifest inventory changed");
        const declaration = files[0] as Record<string, unknown>;
        if (
          declaration.path !== "analysis-delta.json" ||
          declaration.kind !== "supplementary_morphology_analysis_delta" ||
          declaration.bytes !== receipt.bytes ||
          declaration.sha256 !== receipt.sha256
        ) throw new Error("supplementary analysis delta declaration changed");

        const deltaResponse = await fetch(receipt.path, { signal: controller.signal });
        if (!deltaResponse.ok) throw new Error(`supplementary analysis request failed (${deltaResponse.status})`);
        const deltaBytes = await deltaResponse.arrayBuffer();
        if (deltaBytes.byteLength !== receipt.bytes) throw new Error("supplementary analysis byte count changed");
        const hash = await sha256Hex(deltaBytes);
        if (hash !== receipt.sha256) throw new Error("supplementary analysis checksum changed");
        const records = validateAnalysisDelta(JSON.parse(new TextDecoder().decode(deltaBytes)));
        setState({ status: "verified", records, sha256: hash, message: "7/7 supplementary analysis records verified" });
      } catch (error) {
        if (!controller.signal.aborted) setState({
          status: "unavailable",
          records: [],
          message: error instanceof Error ? error.message : "supplementary analysis is unavailable",
        });
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  return state;
}
