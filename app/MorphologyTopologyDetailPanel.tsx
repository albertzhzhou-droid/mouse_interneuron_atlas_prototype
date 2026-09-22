"use client";

import { useEffect, useMemo, useState } from "react";
import topologyContractJson from "../data/morphology-topology-detail-0.1.json";
import { validateMorphologyTopologyPayload } from "./morphology-topology-detail-runtime.js";
import { sha256Hex } from "./source-local-morphology-geometry.js";

type ShollPoint = { radiusMicrometre: number; intersectionCount: number };
type SourceTypeAvailability = {
  sourceType: number;
  interpretation: string;
  status: "PRESENT" | "UNAVAILABLE";
  sourceTypeDomainIndex?: number;
  reasonCode?: string;
  biologicalAbsenceClaim?: false;
};
type SourceTypeDomain = {
  sourceType: number;
  interpretation: string;
  semanticStatus: string;
  nodeCount: number;
  segmentCount: number;
  cableLengthMicrometre: number;
  terminalNodeCount: number;
  bifurcationNodeCount: number;
  maximumCentrifugalBranchOrder: number;
  maximumRootEuclideanDistanceMicrometre: number;
  zeroLengthSegmentCount: number;
  shollProfile: ShollPoint[];
  landmarkNodeIds: { bifurcationNodeIds: number[]; terminalNodeIds: number[] };
};
type Type1Samples = {
  sourceType: 1;
  interpretation: string;
  semanticStatus: "standardized_soma_samples_not_contour";
  nodeCount: number;
  segmentCount: number;
  standardizedSomaSampleNodeIds: number[];
  rootNodeIds: number[];
  neuriteMetrics: { status: "UNAVAILABLE"; reasonCode: string; biologicalAbsenceClaim: false };
};
export type MorphologyTopologyDetailRecord = {
  neuronId: number;
  assetId: string;
  membership: {
    collection: "frozen_census" | "supplementary";
    frozenCensusMembership: boolean;
    frozenCensusContribution: 0 | 1;
    supplementaryContribution: 0 | 1;
    combinedCensusClaim: false;
  };
  sourceDisclosure: {
    dimensionality: "2D" | "3D";
    name: string;
    domainVerbatim: string;
    physicalIntegrityVerbatim: string;
  };
  geometryReceipt: {
    path: string;
    bytes: number;
    sha256: string;
    rawSwcSha256: string;
    sourceFrame: string;
    registrationCount: 0;
  };
  topology: {
    nodeCount: number;
    segmentCount: number;
    neuriteSegmentCount: number;
    rootNodeId: number;
    landmarks: {
      rootNodeIds: number[];
      bifurcationNodeIds: number[];
      terminalNodeIds: number[];
      landmarkReceiptSha256: string;
    };
    sourceTypeDomains: Array<SourceTypeDomain | Type1Samples>;
    canonicalNeuriteTypeAvailability: SourceTypeAvailability[];
  };
};
type RuntimePayload = { records: MorphologyTopologyDetailRecord[] };
type TopologyContract = {
  contractId: string;
  schemaVersion: string;
  releaseId: string;
  runtimeAsset: { path: string; fetchPath: string; bytes: number; sha256: string; recordCount: number };
  summary: { frozenCensusRecordCount: number; supplementaryRecordCount: number };
};

const topologyContract = topologyContractJson as TopologyContract;
let topologyPayloadPromise: Promise<RuntimePayload> | null = null;

function humanize(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

function validatePayload(payload: RuntimePayload) {
  return validateMorphologyTopologyPayload(payload, {
    recordCount: topologyContract.runtimeAsset.recordCount,
    frozenCensusRecordCount: topologyContract.summary.frozenCensusRecordCount,
    supplementaryRecordCount: topologyContract.summary.supplementaryRecordCount,
  }) as RuntimePayload;
}

function loadTopologyPayload() {
  if (!topologyPayloadPromise) {
    topologyPayloadPromise = fetch(topologyContract.runtimeAsset.fetchPath)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Topology-detail request failed (${response.status})`);
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== topologyContract.runtimeAsset.bytes) throw new Error("Topology-detail byte receipt mismatch");
        if (await sha256Hex(bytes) !== topologyContract.runtimeAsset.sha256) throw new Error("Topology-detail checksum mismatch");
        return validatePayload(JSON.parse(new TextDecoder().decode(bytes)) as RuntimePayload);
      })
      .catch((error) => {
        topologyPayloadPromise = null;
        throw error;
      });
  }
  return topologyPayloadPromise;
}

function useTopologyRecord(neuronId: number | null) {
  const [state, setState] = useState<{
    status: "loading" | "verified" | "unavailable";
    record: MorphologyTopologyDetailRecord | null;
    message: string;
  }>({ status: "loading", record: null, message: "Verifying exact topology detail…" });

  useEffect(() => {
    let active = true;
    if (!neuronId) {
      queueMicrotask(() => active && setState({ status: "unavailable", record: null, message: "No morphology record is selected." }));
      return () => { active = false; };
    }
    queueMicrotask(() => active && setState({ status: "loading", record: null, message: "Verifying exact topology detail…" }));
    loadTopologyPayload()
      .then((payload) => {
        if (!active) return;
        const record = payload.records.find((candidate) => candidate.neuronId === neuronId) ?? null;
        setState(record
          ? { status: "verified", record, message: "Exact source-local topology verified." }
          : { status: "unavailable", record: null, message: "This neuron has no admitted topology-detail record." });
      })
      .catch((error: Error) => {
        if (active) setState({ status: "unavailable", record: null, message: `Topology detail unavailable: ${error.message}` });
      });
    return () => { active = false; };
  }, [neuronId]);
  return state;
}

function peakSholl(profile: ShollPoint[]) {
  return profile.reduce<ShollPoint | null>((best, point) => !best || point.intersectionCount > best.intersectionCount ? point : best, null);
}

export default function MorphologyTopologyDetailPanel({
  neuronId,
  compact = false,
}: {
  neuronId: number | null;
  compact?: boolean;
}) {
  const state = useTopologyRecord(neuronId);
  const record = state.record;
  const type1 = useMemo(() => record?.topology.sourceTypeDomains.find((row) => row.sourceType === 1) as Type1Samples | undefined, [record]);
  const neuriteDomains = useMemo(() => (record?.topology.sourceTypeDomains ?? []).filter((row): row is SourceTypeDomain => row.sourceType !== 1), [record]);

  if (state.status !== "verified" || !record) {
    return <section className={`morphology-topology-detail-panel ${state.status}`} aria-live="polite"><h4>Exact source-type topology</h4><p>{state.message}</p><small>No metric or geometry is substituted.</small></section>;
  }

  return (
    <section className={`morphology-topology-detail-panel ${compact ? "compact" : ""}`} aria-label={`Exact source-type topology for NeuroMorpho ${record.neuronId}`}>
      <header>
        <div><span>UPG-150 · CHECKSUM-GATED SWC DETAIL</span><h4>Exact source-type topology</h4></div>
        <em>{record.membership.collection === "frozen_census" ? "Frozen census" : "Supplementary route"} · {record.sourceDisclosure.dimensionality} · 0 REG</em>
      </header>
      <div className="morphology-topology-landmark-summary">
        <span><b>{record.topology.rootNodeId}</b>root node ID</span>
        <span><b>{type1 ? type1.nodeCount.toLocaleString() : "Unavailable"}</b>type-1 samples</span>
        <span><b>{record.topology.landmarks.bifurcationNodeIds.length}</b>branchpoints</span>
        <span><b>{record.topology.landmarks.terminalNodeIds.length}</b>terminals</span>
      </div>
      <div className="morphology-topology-availability" aria-label="Canonical SWC neurite-type availability">
        {record.topology.canonicalNeuriteTypeAvailability.map((item) => <span key={item.sourceType} className={item.status === "PRESENT" ? "present" : "unavailable"}><b>Type {item.sourceType} · {humanize(item.interpretation)}</b>{item.status === "PRESENT" ? "Present in this deposited SWC" : "Unavailable—not biological zero"}</span>)}
      </div>
      {neuriteDomains.length > 0 ? <div className="morphology-table-scroll" role="region" aria-label="Source-type-specific topology metrics">
        <table>
          <caption>Metrics partitioned by retained child-node SWC type</caption>
          <thead><tr><th scope="col">Source domain</th><th scope="col">Nodes / segments</th><th scope="col">Cable</th><th scope="col">Terminals / branches</th><th scope="col">Max order</th><th scope="col">Peak Sholl</th></tr></thead>
          <tbody>{neuriteDomains.map((domain) => {
            const peak = peakSholl(domain.shollProfile);
            return <tr key={domain.sourceType}>
              <th scope="row">Type {domain.sourceType}<small>{humanize(domain.interpretation)}</small></th>
              <td>{domain.nodeCount.toLocaleString()} / {domain.segmentCount.toLocaleString()}</td>
              <td>{formatNumber(domain.cableLengthMicrometre)} µm</td>
              <td>{domain.terminalNodeCount.toLocaleString()} / {domain.bifurcationNodeCount.toLocaleString()}</td>
              <td>{domain.maximumCentrifugalBranchOrder}</td>
              <td>{peak ? `${peak.intersectionCount} at ${peak.radiusMicrometre} µm` : "No positive shell"}</td>
            </tr>;
          })}</tbody>
        </table>
      </div> : <p>No non-type-1 neurite domain is present in this deposited object; no numeric zero is invented.</p>}
      {!compact && <details><summary>Source-frame and landmark receipts</summary><dl>
        <div><dt>Source object</dt><dd>{record.sourceDisclosure.name}</dd></div>
        <div><dt>Deposited domains</dt><dd>{record.sourceDisclosure.domainVerbatim}</dd></div>
        <div><dt>Physical integrity (verbatim)</dt><dd>{record.sourceDisclosure.physicalIntegrityVerbatim}</dd></div>
        <div><dt>Source frame</dt><dd>{humanize(record.geometryReceipt.sourceFrame)}</dd></div>
        <div><dt>Geometry SHA-256</dt><dd><code>{record.geometryReceipt.sha256}</code></dd></div>
        <div><dt>Landmark receipt SHA-256</dt><dd><code>{record.topology.landmarks.landmarkReceiptSha256}</code></dd></div>
      </dl></details>}
      <p className="morphology-topology-boundary">Type 1 means standardized soma samples, not a soma contour. Root, branchpoint and terminal crosses are deterministic parent-link landmarks—not internal structures, boutons or synapses. Domains remain source-local and independently framed.</p>
    </section>
  );
}
