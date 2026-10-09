"use client";

import { useMemo, useState } from 'react';
import type { NativeContourPayload } from './NativeContourRecordViewer';
import { analyseNativeContourGroups, createNativeContourDiagnosticReceipt, nativeContourDiagnosticCsv, nativeContourDiagnosticSensitivity, NATIVE_CONTOUR_DIAGNOSTIC_LIMITS, NATIVE_CONTOUR_DIAGNOSTIC_PRESETS, type DiagnosticLimits } from './native-contour-diagnostics.js';

const reasonText: Record<string, string> = {
  source_contour_spans_multiple_z_values: 'A source contour spans more than one z value.',
  multiple_distinct_source_contours_share_z_without_correspondence: 'Distinct source contours share z; no correspondence selects a unique neighbour.',
  fewer_than_two_source_contours: 'This exact source-name group has fewer than two contours.',
  degenerate_or_nonfinite_xy_polygon_area: 'An XY polygon area is degenerate or not finite.',
};
const labels: Record<keyof DiagnosticLimits, string> = { centroidShiftMicrometre: 'Maximum XY centroid shift · source µm', areaRatio: 'Maximum XY polygon area ratio', cyclicRmsMicrometre: 'Maximum cyclic-phase RMS · source µm' };
function save(value: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([value], { type })), anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function NativeContourDiagnostics({ neuronId, payload, onInspect }: { neuronId: number; payload: NativeContourPayload; onInspect: (id: string) => void }) {
  const [parameters, setParameters] = useState<DiagnosticLimits>({ ...NATIVE_CONTOUR_DIAGNOSTIC_LIMITS });
  const result = useMemo(() => { try { return { analysis: analyseNativeContourGroups(neuronId, payload), error: null }; } catch (error) { return { analysis: null, error: error instanceof Error ? error.message : 'Source diagnostics unavailable.' }; } }, [neuronId, payload]);
  const receipt = useMemo(() => result.analysis ? createNativeContourDiagnosticReceipt(result.analysis, parameters) : null, [result.analysis, parameters]);
  const sensitivity = useMemo(() => result.analysis ? nativeContourDiagnosticSensitivity(result.analysis) : [], [result.analysis]);
  if (!result.analysis || !receipt) return <p role="alert">{result.error} No substitute diagnostic results are shown.</p>;
  const analysis = result.analysis, report = receipt.report;
  return <section aria-label={`NMO ${neuronId} source contour numerical diagnostics`}>
    <p><strong>NMO {neuronId} · {report.summary.sourceNameGroupCount} exact source-name groups</strong><br />{report.summary.sourceContourCount} original line loops · {report.summary.numericNeighbourIntervalCount} numerical z-neighbour intervals · {report.summary.notComparableGroupCount} groups without a unique comparison.</p>
    <p className="native-diagnostic-boundary">Exploratory software limits; no independently validated biological tolerance. Numerical z neighbours do not establish anatomical section correspondence. Changing limits admits no surface, membrane, volume or internal object.</p>
    <div className="native-diagnostic-limits">
      {(Object.keys(labels) as (keyof DiagnosticLimits)[]).map(key => <label key={key}>{labels[key]}<select value={parameters[key]} onChange={event => setParameters(current => ({ ...current, [key]: Number(event.target.value) }))}>{NATIVE_CONTOUR_DIAGNOSTIC_PRESETS[key].map(value => <option key={value} value={value}>{value}</option>)}</select></label>)}
    </div>
    <div className="native-diagnostic-actions">
      <button type="button" onClick={() => setParameters({ ...NATIVE_CONTOUR_DIAGNOSTIC_LIMITS })}>Restore reference limits</button>
      <button type="button" onClick={() => save(JSON.stringify(receipt, null, 2) + '\n', 'application/json', `nmo-${neuronId}-contour-diagnostics.json`)}>Export diagnostic JSON</button>
      <button type="button" onClick={() => save(nativeContourDiagnosticCsv(analysis, parameters), 'text/csv;charset=utf-8', `nmo-${neuronId}-contour-diagnostics.csv`)}>Export diagnostic CSV</button>
    </div>
    <p role="status" aria-live="polite">{report.summary.numericNeighbourIntervalCount > 0 ? `${report.summary.intervalsWithinNumericalLimits}/${report.summary.numericNeighbourIntervalCount} intervals meet the three numerical limits; ${report.summary.intervalsWithinLimitsAndClearSourceTopology}/${report.summary.numericNeighbourIntervalCount} also have no flagged XY topology issue. 0 new surfaces admitted.` : "No comparable numerical z-neighbour intervals. Source traces remain available; 0 new surfaces admitted."}</p>
    {report.groups.map(group => <section className="native-diagnostic-group" key={group.sourceName} aria-label={`Exact source-name group ${group.sourceName}`}>
      <h4>{group.sourceName} · {group.sourceOrder.length} source contours</h4>
      {group.reasons.length > 0 && <p>{group.reasons.map(reason => reasonText[reason] ?? reason).join(' ')} No adjacent-interval results are inferred for this group.</p>}
      {group.repeatedZ.map(row => <p key={row.zMicrometre}>Repeated z {row.zMicrometre} µm: {row.contourIds.join(', ')}. Separate objects are retained.</p>)}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- A named overflow region needs focus for native keyboard scrolling. */}
      {group.transitions.length > 0 && <div className="native-diagnostic-table" role="region" aria-label={`${group.sourceName} numerical z-neighbour table`} tabIndex={0}>
        <table><caption>Ascending unique source z within this exact name. Display values rounded to 4 decimals; limits use full precision. XY polygon quantities are diagnostic calculations, not biological measurements.</caption>
          <thead><tr><th>Exact source traces</th><th>Source z interval · µm</th><th>XY centroid shift · µm</th><th>XY area ratio</th><th>Cyclic-phase RMS · µm</th><th>Source XY flags</th><th>Numerical limits</th></tr></thead>
          <tbody>{group.transitions.map(transition => <tr key={transition.fromContourId + '/' + transition.toContourId}>
            <td>{[transition.fromContourId, transition.toContourId].map(id => <button key={id} type="button" onClick={() => onInspect(id)}>Inspect native trace {(group.sourceOrder.find(row => row.id === id)?.sourceOrderIndex ?? 0) + 1} · {id}</button>)}</td>
            <td>{transition.fromZMicrometre} → {transition.toZMicrometre}<br />Gap {transition.zGapMicrometre}</td>
            <td>{transition.centroidShiftMicrometre.toFixed(4)}</td><td>{transition.areaRatio.toFixed(4)}</td><td>{transition.cyclicRmsMicrometre.toFixed(4)}</td>
            <td>{transition.bothSourceContoursSimple ? 'No XY crossing found' : 'Source self-intersection'}<br />{transition.zeroLengthSourceEdges} zero-length source edges</td>
            <td>{transition.numericalLimitsMet ? 'Within three limits' : 'Outside limits'}<br />{transition.sourceTopologyClear ? 'XY flags clear' : 'Source topology flagged'}<br />No surface admission</td>
          </tr>)}</tbody>
        </table>
      </div>}
      <details><summary>Original source order and topology flags</summary><ul>{group.sourceOrder.map(row => <li key={row.id}>Trace {row.sourceOrderIndex + 1}: {row.id} · z {row.zValuesMicrometre.join(', ')} µm · {row.vertexCount} vertices · {row.zeroLengthEdgeIndices.length} zero-length edges · {row.selfIntersectionEdgePairs === null ? 'XY crossing test unavailable' : `${row.selfIntersectionEdgePairs.length} XY crossing edge pairs`}</li>)}</ul></details>
    </section>)}
    {report.summary.numericNeighbourIntervalCount > 0 && <details>
      <summary>Sensitivity across 27 preset limit combinations</summary>
      <p>These combinations test software sensitivity. They do not select a recommended threshold or validate a biological tolerance. Results stay separate by source-name group.</p>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- A named overflow region needs focus for native keyboard scrolling. */}
      <div className="native-diagnostic-table" role="region" aria-label="Preset limit sensitivity table" tabIndex={0}><table><thead><tr><th>Centroid limit</th><th>Area ratio limit</th><th>RMS limit</th><th>Exact source group · within limits / intervals · with clear XY flags</th></tr></thead><tbody>{sensitivity.map(row => <tr key={Object.values(row.parameters).join('/')}><td>{row.parameters.centroidShiftMicrometre}</td><td>{row.parameters.areaRatio}</td><td>{row.parameters.cyclicRmsMicrometre}</td><td>{row.groups.map(group => <div key={group.sourceName}>{group.sourceName}: {group.withinNumericalLimits}/{group.intervalCount} · {group.withinLimitsAndClearSourceTopology} with clear XY flags</div>)}</td></tr>)}</tbody></table></div>
    </details>}
    <details><summary>Current diagnostic receipt and source verification</summary><textarea readOnly rows={7} aria-label={`Current numerical diagnostic receipt for NeuroMorpho ${neuronId}`} value={JSON.stringify(receipt, null, 2)} /></details>
    <p>Original DAT, full selected-file audit and exact admitted coordinates are privately byte verified. Resampling and cyclic index phase serve numerical comparison only; no source point is repaired, smoothed, transformed or replaced. Trace radii are not anatomical thickness. The existing NMO50394 DER shell remains a separate pre-existing display admission.</p>
  </section>;
}
