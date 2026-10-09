"use client";

import { useId, useMemo, useState } from "react";
import { version } from "../package.json";
import { researchMvpRelease, researchSourceRegistry } from "./atlas-types";
import type { ResearchRecord } from "./ResearchExplorer";
import { useResearchActiveRecord } from "./ResearchActiveRecordProvider";
import ResearchIndexLoadingEvidence from "./ResearchIndexLoadingEvidence";
import ResearchMorphologyRenderingPolicy from "./ResearchMorphologyRenderingPolicy";
import { deriveResearchRecordSourceScope, exportResearchRecordDossier, researchRecordDossierCsv, type ResearchRecordScientificDossier } from "./research-record-source-scope.js";
import "./research-record-source-scope.css";

const readable = (value: string) => value.replaceAll("_", " ");
function missingText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "missingReason" in value) return `Not retained · ${String(value.missingReason)}`;
  return value == null ? "Not retained" : JSON.stringify(value);
}
function download(text: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ResearchRecordSourceScope({ record }: { record: ResearchRecord }) {
  const { activeRecord, indexState } = useResearchActiveRecord();
  const id = useId();
  const [saved, setSaved] = useState<{ key: string; generation: number; dossier: ResearchRecordScientificDossier } | null>(null);
  const [notice, setNotice] = useState<{ key: string; generation: number; text: string } | null>(null);
  const ready = activeRecord.status === "ready" && activeRecord.record?.key === record.key && activeRecord.requestKey === record.key && indexState.status === "ready";
  const input = useMemo(() => ({ record, collection: indexState.records, baseIndex: indexState.index, registry: researchSourceRegistry, mvp: researchMvpRelease }), [record, indexState.records, indexState.index]);
  const result = useMemo(() => {
    if (!ready) return null;
    try { return { scope: deriveResearchRecordSourceScope(input), error: null }; }
    catch (error) { return { scope: null, error: error instanceof Error ? error.message : "Source context is unavailable." }; }
  }, [input, ready]);
  const scope = result?.scope;
  const dossier = ready && saved?.key === record.key && saved.generation === activeRecord.generation ? saved.dossier : null;
  const currentNotice = ready && notice?.key === record.key && notice.generation === activeRecord.generation ? notice.text : null;
  if (!ready) return null;
  if (!scope) return <p className="research-record-source-scope" role="alert">{result?.error} No previous source context or dossier is shown.</p>;

  const capture = () => {
    try {
      const next = exportResearchRecordDossier(input, { applicationVersion: version, selectionGeneration: activeRecord.generation, requestedKey: activeRecord.requestKey! });
      setSaved({ key: record.key, generation: activeRecord.generation, dossier: next });
      setNotice({ key: record.key, generation: activeRecord.generation, text: "Current record dossier prepared with the same source context, field locators and explicit missingness." });
    } catch (error) { setSaved(null); setNotice({ key: record.key, generation: activeRecord.generation, text: error instanceof Error ? error.message : "Dossier unavailable." }); }
  };
  const exportFile = (format: "json" | "csv") => {
    if (!dossier) return;
    const name = record.key.replaceAll(/[^a-zA-Z0-9._-]/g, "_");
    download(format === "json" ? JSON.stringify(dossier, null, 2) : researchRecordDossierCsv(dossier), format === "json" ? "application/json" : "text/csv;charset=utf-8", `${name}-scientific-dossier.${format}`);
    setNotice({ key: record.key, generation: activeRecord.generation, text: `${format.toUpperCase()} download requested. The prepared receipt remains available below.` });
  };
  return <section className="research-record-source-scope" data-testid="research-record-source-scope" data-record-key={record.key} data-source-id={scope.sourceId ?? "unknown"} aria-label="Current record source scope">
    <p className="rrss-summary"><strong>Record scope</strong><span>{readable(scope.displayUnit)} · {scope.species.map((item) => item.value ?? "Not retained").join(" / ") || "Species context not retained"}</span></p>
    <p className="rrss-boundary">Species and age below describe the source context. They do not establish the identity or measurements of an individual cell.</p>
    {scope.renderingPolicy && <ResearchMorphologyRenderingPolicy policy={scope.renderingPolicy} />}
    <details className="rrss-context">
      <summary>Source context, experimental units and conditions</summary>
      <p><code>{scope.sourceId ?? "Parent source not established"}</code> · {scope.registryReleaseId}</p>
      {scope.sourceMissingReason && <p>{scope.sourceMissingReason}</p>}
      <dl>
        <div><dt>Displayed record unit</dt><dd>{readable(scope.displayUnit)}<small>Underlying source observation: {scope.underlyingObservationUnit ? readable(scope.underlyingObservationUnit) : "Not retained in record semantics"}</small></dd></div>
        {[{ label: "Species", values: scope.species }, { label: "Age / life stage", values: scope.lifeStages }, { label: "Region", values: scope.regions }].map(({ label, values }) => <div key={label}><dt>{label}</dt><dd>{values.length ? values.map((item) => <p key={item.locator}>{item.value ?? `Not retained · ${item.missingReason ?? "No source value"}`}<small>{item.context} · {readable(item.authority)}</small><code>{item.locator}</code></p>) : "Not retained"}</dd></div>)}
        <div><dt>Source denominators</dt><dd>{scope.experimentalUnits.length ? scope.experimentalUnits.map((unit) => <p key={unit.locator}><strong>{unit.count === null ? `Not retained · ${unit.missingReason}` : unit.count.toLocaleString("en-US")} {readable(unit.unit)}</strong><small>{unit.scope}</small><code>{unit.locator}</code></p>) : "Not retained"}</dd></div>
      </dl>
      {scope.conditions.length > 0 && <div className="rrss-conditions" aria-label="Separate source experimental conditions">{scope.conditions.map((condition) => <article key={condition.id}><strong>{condition.id}</strong><p>{condition.species} · {condition.lifeStage} · {condition.experimentalUnit}</p><p>{missingText(condition.sampleSize)}</p><code>{condition.locator}</code></article>)}</div>}
      <p>Counts retain their source unit and condition. No pooled animal, participant, cell or nucleus total is generated.</p>
    </details>
    <details className="rrss-locators">
      <summary>{scope.fieldLocators.length} field locators and exact record export</summary>
      <p>Each row preserves its original reference and exact position in the project record. Broad source references and integrity hashes still require upstream field resolution.</p>
      <ol>{scope.fieldLocators.map((row) => <li key={row.index}><strong>{row.label}</strong><span>{readable(row.upstreamLocatorStatus)} · {readable(row.authority)}</span><code>Retained reference: {row.locator}</code><code>Project field: {row.projectFieldLocator}</code></li>)}</ol>
      <p className="rrss-export-boundary">The scientific dossier includes this record, source scope, missingness and the current declared morphology rendering policy when applicable. Earlier surface declarations retain their original fields and archived scope. Current source-byte verification, 3D camera and image are outside this export.</p>
      <div className="rrss-actions"><button type="button" onClick={capture}>Prepare current record dossier</button><button type="button" onClick={() => exportFile("json")} disabled={!dossier}>Download dossier JSON</button><button type="button" onClick={() => exportFile("csv")} disabled={!dossier}>Download field CSV</button></div>
      {currentNotice && <p role="status">{currentNotice}</p>}
      {dossier && <><label htmlFor={`${id}-receipt`}>Current scientific dossier receipt</label><textarea id={`${id}-receipt`} aria-label="Current scientific dossier receipt" readOnly value={JSON.stringify(dossier, null, 2)} rows={9} spellCheck={false} /></>}
    </details>
    <ResearchIndexLoadingEvidence />
  </section>;
}
