"use client";

import { useState, type RefObject } from "react";
import "./morphology-neurite-inspector.css";

export type NeuriteInspectionController = {
  select: (nodeId: number) => unknown;
  clear: () => void;
  nextLandmark: (kind: "branchpoint" | "terminal") => void;
  dimContext: () => void;
  focus: () => void;
  dispose: () => void;
};

export type NeuriteInspectionSelection = {
  neuronId: number;
  geometryIdentity: object;
  nodeId: number;
  parentId: number;
  sourceType: number;
  positionMicrometre: number[];
  radiusMicrometre: number | null;
  parentEdgeLengthMicrometre: number;
  childCount: number;
  descendantIds: number[];
  rootPathLengthMicrometre: number;
  descendantCableMicrometre: number;
  radiusProfile: { nodeId: number; distanceMicrometre: number; diameterMicrometre: number }[];
  dimmed: boolean;
};

const format = (value: number) => value.toLocaleString("en", { maximumFractionDigits: 2 });
const labels: Record<number, string> = { 1: "Standardized soma sample", 2: "Axon", 3: "Dendrite", 4: "Apical dendrite" };

export default function MorphologyNeuriteInspector({ controllerRef, selection, geometry, branchpointCount, terminalCount }: {
  controllerRef: RefObject<NeuriteInspectionController | null>;
  selection: NeuriteInspectionSelection | null;
  geometry: object;
  branchpointCount: number;
  terminalCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [nodeInput, setNodeInput] = useState("");
  const [inputError, setInputError] = useState("");
  const active = selection?.geometryIdentity === geometry ? selection : null;
  const maxDiameter = active?.radiusProfile.reduce((max, sample) => Math.max(max, sample.diameterMicrometre), 0) ?? 0;
  const profile = active && maxDiameter > 0 && active.rootPathLengthMicrometre > 0
    ? active.radiusProfile.map((sample) => `${12 + sample.distanceMicrometre / active.rootPathLengthMicrometre * 236},${66 - sample.diameterMicrometre / maxDiameter * 48}`).join(" ")
    : "";
  const isOpen = expanded || Boolean(active);

  return <div className={`morphology-neurite-inspector ${isOpen ? "expanded" : ""}`}>
    <button type="button" className="neurite-inspector-toggle" aria-expanded={isOpen} onClick={() => {
      if (isOpen) { controllerRef.current?.clear(); setExpanded(false); }
      else setExpanded(true);
    }}>{isOpen ? "Close branch inspector" : "Inspect traced branches"}</button>
    {isOpen && <div className="neurite-inspector-body">
      <p>Click a traced neurite, step through landmarks, or enter its exact SWC node ID.</p>
      <div className="neurite-inspector-actions">
        <button type="button" disabled={branchpointCount === 0} onClick={() => controllerRef.current?.nextLandmark("branchpoint")}>Next branchpoint ({branchpointCount})</button>
        <button type="button" disabled={terminalCount === 0} onClick={() => controllerRef.current?.nextLandmark("terminal")}>Next terminal ({terminalCount})</button>
      </div>
      <form onSubmit={(event) => {
        event.preventDefault();
        try {
          const nodeId = Number(nodeInput);
          if (!nodeInput.trim() || !Number.isInteger(nodeId)) throw new Error("Enter a whole-number SWC node ID.");
          controllerRef.current?.select(nodeId);
          setInputError("");
        } catch (error) { setInputError(error instanceof Error ? error.message : "That node is unavailable."); }
      }}>
        <label>SWC node <input aria-label="Exact SWC node ID" inputMode="numeric" value={nodeInput} onChange={(event) => setNodeInput(event.target.value)} placeholder={active ? String(active.nodeId) : "Node ID"} /></label>
        <button type="submit">Inspect</button>
      </form>
      {inputError && <p role="alert">{inputError}</p>}
      {active && <>
        <div className="neurite-inspector-selection" role="status"><strong>Node {active.nodeId}</strong><span>{labels[active.sourceType] ?? `Source type ${active.sourceType}`} · parent {active.parentId === -1 ? "root" : active.parentId}</span></div>
        <div className="neurite-inspector-actions">
          <button type="button" onClick={() => controllerRef.current?.focus()}>Focus this arbor</button>
          <button type="button" aria-pressed={active.dimmed} onClick={() => controllerRef.current?.dimContext()}>{active.dimmed ? "Restore context" : "Dim surrounding arbor"}</button>
          <button type="button" onClick={() => { controllerRef.current?.clear(); setExpanded(true); }}>Clear selection</button>
        </div>
        <div className="neurite-inspector-colors"><span>Gold: root path</span><span>Mint: descendants</span></div>
        <dl>
          <div><dt>Path from SWC root</dt><dd>{format(active.rootPathLengthMicrometre)} µm</dd></div>
          <div><dt>Downstream cable</dt><dd>{format(active.descendantCableMicrometre)} µm · {active.descendantIds.length} nodes</dd></div>
          <div><dt>Incoming edge</dt><dd>{format(active.parentEdgeLengthMicrometre)} µm · {active.childCount} children</dd></div>
          <div><dt>Source radius</dt><dd>{active.radiusMicrometre === null ? "Not admitted for this sample" : `${format(active.radiusMicrometre)} µm`}</dd></div>
          <div><dt>Source X / Y / Z</dt><dd>{active.positionMicrometre.map(format).join(" / ")} µm</dd></div>
        </dl>
        {profile && active.radiusProfile.length > 1 && <figure className="neurite-diameter-profile">
          <figcaption>Deposited neurite diameter along selected root path</figcaption>
          <svg viewBox="0 0 260 87" role="img" aria-label={`Source neurite diameter profile, maximum ${format(maxDiameter)} micrometres; path length ${format(active.rootPathLengthMicrometre)} micrometres`}>
            <path d="M12 16V66H248" fill="none" stroke="#557268" />
            <polyline points={profile} fill="none" stroke="#ffd166" strokeWidth="1.5" />
            <text x="14" y="12">{format(maxDiameter)} µm diameter</text>
            <text x="12" y="81">0</text><text x="248" y="81" textAnchor="end">{format(active.rootPathLengthMicrometre)} µm path</text>
          </svg>
        </figure>}
        <small>Coordinates and cable lengths describe this deposited trace. Gold and mint are inspection highlights. Type-1 samples are excluded from the diameter profile. Terminals do not establish boutons or synapses.</small>
      </>}
    </div>}
  </div>;
}
