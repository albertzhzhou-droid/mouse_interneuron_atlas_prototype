"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SceneCanvas, { type CameraView } from "./SceneCanvas";
import {
  TRANSMITTER_COLORS,
  atlasRelease,
  benchmarkSnapshot,
  type AtlasEntity,
  type Transmitter,
} from "./atlas-types";

type Filters = {
  transmitter: "all" | Transmitter;
  segment: "all" | AtlasEntity["segmentGroup"];
  endpoint: "all" | AtlasEntity["endpoint"];
  injury: string;
};

const DEFAULT_FILTERS: Filters = {
  transmitter: "all",
  segment: "all",
  endpoint: "all",
  injury: "all",
};

const DEFAULT_SELECTED = "mouse.sc.vsx2_hoxa10";
export type InitialAtlasParams = Record<string, string | string[] | undefined>;
const ENTITY_KIND_LABELS: Record<string, string> = {
  functional_population: "Projection-defined population",
  developmental_lineage: "Developmental lineage",
  molecular_spatial_population: "Molecular + spatial population",
  lineage_projection_population: "Lineage + projection population",
  injury_state_overlay: "Injury-state overlay · not a cell family",
};

function prettify(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseInitialState(params: InitialAtlasParams) {
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] ?? null : value ?? null;
  };
  const requestedEntity = read("cell");
  const requestedView = read("view") as CameraView | null;
  const requestedSlice = Number(read("slice"));
  const requestedTransmitter = read("tx") as Filters["transmitter"] | null;
  const requestedSegment = read("segment") as Filters["segment"] | null;
  const requestedEndpoint = read("endpoint") as Filters["endpoint"] | null;
  const validTransmitters: Filters["transmitter"][] = ["all", "excitatory", "inhibitory", "mixed_or_unspecified", "state_dependent"];
  const validSegments: Filters["segment"][] = ["all", "cervical", "thoracic", "lumbar", "sacral"];
  const validEndpoints: Filters["endpoint"][] = ["all", "locomotion", "breathing", "spasm"];
  return {
    selectedId: atlasRelease.entities.some((entity) => entity.id === requestedEntity) ? requestedEntity! : DEFAULT_SELECTED,
    view: (["home", "dorsal", "right", "transverse"] as CameraView[]).includes(requestedView as CameraView)
      ? (requestedView as CameraView)
      : "home",
    sliceZ: Number.isFinite(requestedSlice) ? Math.min(20, Math.max(-20, requestedSlice)) : -12,
    search: read("q") ?? "",
    filters: {
      transmitter: requestedTransmitter && validTransmitters.includes(requestedTransmitter) ? requestedTransmitter : "all",
      segment: requestedSegment && validSegments.includes(requestedSegment) ? requestedSegment : "all",
      endpoint: requestedEndpoint && validEndpoints.includes(requestedEndpoint) ? requestedEndpoint : "all",
      injury: read("injury") || "all",
    },
  };
}

function CrossSectionInset({
  entities,
  selectedId,
  sliceZ,
  onSelect,
}: {
  entities: AtlasEntity[];
  selectedId: string;
  sliceZ: number;
  onSelect: (id: string) => void;
}) {
  const nearSlice = entities.filter((entity) => Math.abs(entity.geometry.schematicPosition[2] - sliceZ) <= 2.8);
  return (
    <div className="slice-inset" aria-label={`Synthetic transverse slice at ${sliceZ.toFixed(1)} schematic units`}>
      <div className="slice-inset-header">
        <span>TRANSVERSE ORIENTATION</span>
        <strong>z {sliceZ.toFixed(1)}</strong>
      </div>
      <div className="cross-section-map">
        <div className="gray-wing left" />
        <div className="gray-wing right" />
        <span className="direction dorsal">D</span>
        <span className="direction ventral">V</span>
        {nearSlice.map((entity) => {
          const [x, y] = entity.geometry.schematicPosition;
          return (
            <button
              type="button"
              key={entity.id}
              className={`slice-dot ${entity.id === selectedId ? "selected" : ""}`}
              style={{
                left: `calc(50% + ${x * 32}px)`,
                top: `calc(50% - ${y * 27}px)`,
                backgroundColor: TRANSMITTER_COLORS[entity.transmitter],
              }}
              title={`${entity.shortLabel} · synthetic position`}
              aria-label={`Select ${entity.name}, synthetic position`}
              onClick={() => onSelect(entity.id)}
            />
          );
        })}
      </div>
      <p>{nearSlice.length ? `${nearSlice.length} synthetic entities near this plane` : "No prototype entities near this plane"}</p>
    </div>
  );
}

function EvidenceCard({ entity }: { entity: AtlasEntity }) {
  return (
    <>
      <div className="panel-heading evidence-title">
        <p className="panel-kicker">EVIDENCE CARD · {entity.ledgerId}</p>
        <h2>{entity.name}</h2>
        <p>{ENTITY_KIND_LABELS[entity.entityKind] ?? prettify(entity.entityKind)}</p>
      </div>

      <div className="status-badge-row">
        <span className="badge synthetic">Geometry {entity.geometry.status}</span>
        <span className="badge schematic">Path {entity.geometry.pathStatus}</span>
        {entity.claimGrades.map((grade) => <span className="badge claim" key={grade}>{grade}</span>)}
        {entity.endpointLevels.map((level) => <span className="badge endpoint" key={level}>{level}</span>)}
      </div>

      <div className="classification-note">
        <span>Classification axes</span>
        <div>{entity.classificationAxes.map((axis) => <em key={axis}>{prettify(axis)}</em>)}</div>
      </div>

      <dl className="detail-grid">
        <div><dt>Species</dt><dd>Adult mouse · NCBITaxon:10090</dd></div>
        <div><dt>Markers</dt><dd>{entity.markers.length ? entity.markers.join(" · ") : "Not a marker-defined entity"}</dd></div>
        <div><dt>Transmitter</dt><dd>{prettify(entity.transmitter)}</dd></div>
        <div><dt>Region</dt><dd>{entity.segmentLabel} · {entity.lamina}</dd></div>
        <div><dt>SCI context</dt><dd>{entity.injuryContext}</dd></div>
        <div><dt>Endpoint</dt><dd>{prettify(entity.endpoint)}</dd></div>
      </dl>

      <div className="claim-box">
        <span>SUPPORTED CLAIM</span>
        <p>{entity.allowedClaim}</p>
      </div>
      <div className="boundary-box">
        <span>NOT ESTABLISHED</span>
        <p>{entity.notEstablished}</p>
      </div>
      <details className="negative-findings">
        <summary>Negative findings and safeguards</summary>
        <ul>{entity.negativeFindings.map((finding) => <li key={finding}>{finding}</li>)}</ul>
      </details>
      <a className="source-link" href={entity.sourceUrl} target="_blank" rel="noreferrer">
        {entity.citation} · DOI {entity.doi} ↗
      </a>
      <p className="coordinate-warning">
        No exact cell xyz is claimed. The visible glyph is SYN geometry in <code>prototype_schematic_v0</code>.
      </p>
    </>
  );
}

function BenchmarkPanel() {
  return (
    <div className="benchmark-panel">
      <div className="panel-heading evidence-title">
        <p className="panel-kicker">MARKET / RESEARCH BENCHMARKS</p>
        <h2>Reference architecture</h2>
        <p>Snapshot verified {benchmarkSnapshot.snapshotDate}</p>
      </div>
      <div className="benchmark-stack">
        {benchmarkSnapshot.resources.map((resource) => (
          <details key={resource.name} open={resource.name === "BrainGlobe allen_cord_20um"}>
            <summary>
              <strong>{resource.name}</strong>
              <span>{resource.role}</span>
            </summary>
            <ul>{resource.parameters.map((parameter) => <li key={parameter}>{parameter}</li>)}</ul>
            <p><b>Prototype mapping:</b> {resource.reused}</p>
            <p><b>Boundary:</b> {resource.notReused}</p>
            <a href={resource.url} target="_blank" rel="noreferrer">Official / primary source ↗</a>
          </details>
        ))}
      </div>
    </div>
  );
}

export default function AtlasPrototype({ initialParams = {} }: { initialParams?: InitialAtlasParams }) {
  const initial = parseInitialState(initialParams);
  const [selectedId, setSelectedId] = useState(initial.selectedId);
  const [search, setSearch] = useState(initial.search);
  const [filters, setFilters] = useState<Filters>(initial.filters);
  const [view, setView] = useState<CameraView>(initial.view);
  const [sliceZ, setSliceZ] = useState(initial.sliceZ);
  const [showScaffold, setShowScaffold] = useState(true);
  const [showGrayMatter, setShowGrayMatter] = useState(true);
  const [showEntities, setShowEntities] = useState(true);
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  const [sidePanel, setSidePanel] = useState<"evidence" | "benchmarks">("evidence");
  const [notice, setNotice] = useState("Ready · synthetic geometry locked");

  const filteredEntities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return atlasRelease.entities.filter((entity) => {
      const searchable = [entity.name, entity.shortLabel, entity.segmentLabel, ...entity.markers, ...entity.classificationAxes]
        .join(" ")
        .toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (filters.transmitter === "all" || entity.transmitter === filters.transmitter) &&
        (filters.segment === "all" || entity.segmentGroup === filters.segment) &&
        (filters.endpoint === "all" || entity.endpoint === filters.endpoint) &&
        (filters.injury === "all" || entity.injuryType === filters.injury)
      );
    });
  }, [filters, search]);

  const activeSelectedId = filteredEntities.length && !filteredEntities.some((entity) => entity.id === selectedId)
    ? filteredEntities[0].id
    : selectedId;
  const selected = atlasRelease.entities.find((entity) => entity.id === activeSelectedId) ?? atlasRelease.entities[0];

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("cell", activeSelectedId);
    params.set("view", view);
    params.set("slice", sliceZ.toFixed(1));
    if (search) params.set("q", search);
    if (filters.transmitter !== "all") params.set("tx", filters.transmitter);
    if (filters.segment !== "all") params.set("segment", filters.segment);
    if (filters.endpoint !== "all") params.set("endpoint", filters.endpoint);
    if (filters.injury !== "all") params.set("injury", filters.injury);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [activeSelectedId, filters, search, sliceZ, view]);

  const selectEntity = useCallback((id: string) => {
    setSelectedId(id);
    setSidePanel("evidence");
    setNotice(`${atlasRelease.entities.find((entity) => entity.id === id)?.shortLabel ?? "Entity"} selected · evidence card updated`);
  }, []);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setSearch("");
    setFilters(DEFAULT_FILTERS);
    setSelectedId(DEFAULT_SELECTED);
    setView("home");
    setSliceZ(-12);
    setShowScaffold(true);
    setShowGrayMatter(true);
    setShowEntities(true);
    setSidePanel("evidence");
    setNotice("View reset · all seven evidence entities visible");
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("Versioned view link copied");
    } catch {
      setNotice("Copy unavailable · use the current address-bar URL");
    }
  };

  const exportState = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      releaseId: atlasRelease.releaseId,
      selectedEntity: selected,
      filters,
      search,
      view,
      sliceZ,
      visibleEntityIds: filteredEntities.map((entity) => entity.id),
      disclaimer: atlasRelease.fixedDisclaimer,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${atlasRelease.releaseId}-${selected.shortLabel.replaceAll(" ", "-").toLowerCase()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice("Evidence-linked JSON state exported");
  };

  const injuryOptions = Array.from(new Set(atlasRelease.entities.map((entity) => entity.injuryType)));

  return (
    <main className="atlas-shell">
      <div className="research-only-banner" role="note">
        <strong>SCHEMATIC PROTOTYPE</strong>
        <span>Synthetic geometry · not atlas-registered · not for measurement</span>
        <span>本系统仅用于科研可视化，不是完整细胞普查、连接组或治疗建议。</span>
      </div>

      <header className="atlas-header">
        <div>
          <p className="eyebrow">OHRI · FEASIBILITY RELEASE 0.1</p>
          <h1>Mouse Spinal Interneuron Atlas</h1>
          <p className="header-subtitle">Evidence-linked 3D exploration for adult <i>Mus musculus</i></p>
        </div>
        <div className="header-actions">
          <div className="scope-row" aria-label="Fixed prototype scope">
            <span>Mus musculus</span><span>Adult</span><span>C1–S3</span>
          </div>
          <div className="action-row">
            <button type="button" onClick={reset}>Reset</button>
            <button type="button" onClick={share}>Share state</button>
            <button type="button" className="primary" onClick={exportState}>Export JSON</button>
          </div>
        </div>
      </header>

      <section className="research-workspace" aria-label="Atlas research workspace">
        <aside className="control-rail">
          <div className="panel-heading">
            <p className="panel-kicker">EXPLORE · {filteredEntities.length}/{atlasRelease.entities.length}</p>
            <h2>Evidence entities</h2>
            <p>Five populations + two state overlays</p>
          </div>

          <label className="search-field">
            <span>Search marker, family or region</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="e.g. Vsx2, breathing" />
          </label>

          <div className="filter-grid">
            <label>Transmitter
              <select value={filters.transmitter} onChange={(event) => setFilter("transmitter", event.target.value as Filters["transmitter"])}>
                <option value="all">All states</option>
                <option value="excitatory">Excitatory</option>
                <option value="inhibitory">Inhibitory</option>
                <option value="mixed_or_unspecified">Mixed / unspecified</option>
                <option value="state_dependent">State dependent</option>
              </select>
            </label>
            <label>Segment
              <select value={filters.segment} onChange={(event) => setFilter("segment", event.target.value as Filters["segment"])}>
                <option value="all">All segments</option>
                <option value="cervical">Cervical</option>
                <option value="thoracic">Thoracic</option>
                <option value="lumbar">Lumbar</option>
                <option value="sacral">Sacral</option>
              </select>
            </label>
            <label>Endpoint
              <select value={filters.endpoint} onChange={(event) => setFilter("endpoint", event.target.value as Filters["endpoint"])}>
                <option value="all">All endpoints</option>
                <option value="locomotion">Locomotion</option>
                <option value="breathing">Breathing</option>
                <option value="spasm">Spasm</option>
              </select>
            </label>
            <label>Injury model
              <select value={filters.injury} onChange={(event) => setFilter("injury", event.target.value)}>
                <option value="all">All models</option>
                {injuryOptions.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
              </select>
            </label>
          </div>

          <div className="population-list" role="list" aria-label="Evidence-linked prototype entities">
            {filteredEntities.map((entity) => (
              <button
                type="button"
                key={entity.id}
                className={`population-card ${entity.id === activeSelectedId ? "selected" : ""}`}
                onClick={() => selectEntity(entity.id)}
                aria-pressed={entity.id === activeSelectedId}
              >
                <span className="population-dot" style={{ backgroundColor: TRANSMITTER_COLORS[entity.transmitter], color: TRANSMITTER_COLORS[entity.transmitter] }} />
                <span><strong>{entity.shortLabel}</strong><small>{prettify(entity.segmentGroup)} · {prettify(entity.endpoint)}</small></span>
                <em>{entity.geometry.status}</em>
              </button>
            ))}
            {!filteredEntities.length && (
              <div className="empty-state"><strong>No matching evidence entity</strong><p>This is a filter result, not evidence that the cell type does not exist.</p></div>
            )}
          </div>

          <div className="layer-controls">
            <p>Visible layers</p>
            <label><input type="checkbox" checked={showScaffold} onChange={(event) => setShowScaffold(event.target.checked)} />Synthetic scaffold</label>
            <label><input type="checkbox" checked={showGrayMatter} onChange={(event) => setShowGrayMatter(event.target.checked)} />Gray-matter orientation</label>
            <label><input type="checkbox" checked={showEntities} onChange={(event) => setShowEntities(event.target.checked)} />Entities + paths</label>
          </div>
        </aside>

        <section className="viewport-panel" aria-label="Three-dimensional atlas view">
          <div className="viewport-toolbar">
            <div>
              <span className={`live-dot ${webGLAvailable ? "" : "offline"}`} />
              <strong>{webGLAvailable ? "WEBGL 3D" : "ACCESSIBLE FALLBACK"}</strong>
              <small>prototype_schematic_v0 · units intentionally non-metric</small>
            </div>
            <div className="view-actions" aria-label="Camera presets">
              {(["home", "dorsal", "right", "transverse"] as CameraView[]).map((preset) => (
                <button type="button" key={preset} className={view === preset ? "active" : ""} onClick={() => setView(preset)}>{prettify(preset)}</button>
              ))}
            </div>
          </div>

          <div className="model-stage">
            {webGLAvailable ? (
              <SceneCanvas
                entities={atlasRelease.entities}
                visibleIds={filteredEntities.map((entity) => entity.id)}
                selectedId={activeSelectedId}
                view={view}
                sliceZ={sliceZ}
                showScaffold={showScaffold}
                showGrayMatter={showGrayMatter}
                showEntities={showEntities}
                onSelect={selectEntity}
                onWebGLStatus={setWebGLAvailable}
              />
            ) : (
              <div className="webgl-fallback">
                <strong>3D rendering is unavailable</strong>
                <p>All entities, sources and evidence boundaries remain accessible in the lists and transverse orientation map.</p>
              </div>
            )}
            <div className="orientation-label rostral">ROSTRAL · C1</div>
            <div className="orientation-label caudal">CAUDAL · S3</div>
            <div className="segment-scale" aria-hidden="true">
              <span>C</span><span>T</span><span>L</span><span>S</span>
            </div>
            <CrossSectionInset entities={filteredEntities} selectedId={activeSelectedId} sliceZ={sliceZ} onSelect={selectEntity} />
            <div className="stage-readout">
              <span>Selected</span><strong>{selected.shortLabel}</strong>
              <span>{prettify(selected.segmentGroup)}</span>
              <span>{selected.geometry.status} geometry</span>
            </div>
          </div>

          <div className="slice-control">
            <label htmlFor="slice-position">Transverse plane</label>
            <input id="slice-position" type="range" min="-20" max="20" step="0.5" value={sliceZ} onChange={(event) => setSliceZ(Number(event.target.value))} />
            <output>{sliceZ.toFixed(1)} sch.u.</output>
          </div>
          <div className="evidence-legend" aria-label="Visual evidence legend">
            <span><i className="observed" />OBS observed</span>
            <span><i className="registered" />REG registered</span>
            <span><i className="inferred" />INF inferred</span>
            <span><i className="schematic" />SCH schematic path</span>
            <span><i className="synthetic" />SYN synthetic glyph</span>
          </div>
        </section>

        <aside className="evidence-rail">
          <div className="rail-tabs" role="tablist" aria-label="Evidence and benchmark panels">
            <button type="button" role="tab" aria-selected={sidePanel === "evidence"} className={sidePanel === "evidence" ? "active" : ""} onClick={() => setSidePanel("evidence")}>Evidence</button>
            <button type="button" role="tab" aria-selected={sidePanel === "benchmarks"} className={sidePanel === "benchmarks" ? "active" : ""} onClick={() => setSidePanel("benchmarks")}>Benchmarks</button>
          </div>
          {sidePanel === "evidence" ? <EvidenceCard entity={selected} /> : <BenchmarkPanel />}
        </aside>
      </section>

      <footer className="atlas-footer">
        <p aria-live="polite"><span className="status-pulse" />{notice}</p>
        <p><strong>{atlasRelease.releaseId}</strong> · 7/7 records source-linked · every glyph tagged SYN</p>
        <p>BrainGlobe target: <code>allen_cord_20um</code> · source resolution 20 × 10 × 10 µm</p>
      </footer>
      <p className="fixed-disclaimer">{atlasRelease.fixedDisclaimer}</p>
    </main>
  );
}
