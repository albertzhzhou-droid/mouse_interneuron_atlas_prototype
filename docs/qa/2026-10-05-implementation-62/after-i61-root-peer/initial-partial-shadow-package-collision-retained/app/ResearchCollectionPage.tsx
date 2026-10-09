"use client";

import Link from "next/link";

import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import {
  ResearchActiveRecordProvider,
  useResearchActiveRecordLoader,
} from "./ResearchActiveRecordProvider";
import type { ResearchFocus, ResearchFocusView, ResearchRecord } from "./ResearchExplorer";
import type { MatsonSciTimepoint } from "./MatsonSciTimecourseExplorer";
import { parseResearchFocus } from "./research-explorer-index.js";
import { normalizeMatsonSciTimepoint } from "./matson-sci-timecourse.js";
import "./research-information-layout.css";

const ObservedMorphologyRouteLibrary = lazy(() => import("./ObservedMorphologyRouteLibrary"));
const MorphologyViewer = lazy(() => import("./MorphologyViewer"));
const InterneuronTypeAtlas = lazy(() => import("./InterneuronTypeAtlas"));
const ZebrafishSpinalTaxonomyPanel = lazy(() => import("./ZebrafishSpinalTaxonomyPanel"));
const AdditionalResearchEvidence = lazy(() => import("./AdditionalResearchEvidence"));
const MolecularConcordanceWorkbench = lazy(() => import("./MolecularConcordanceWorkbench"));
const AtlasReferenceViewer = lazy(() => import("./AtlasReferenceViewer"));
const RonzanoPremotorPositionViewer = lazy(() => import("./RonzanoPremotorPositionViewer"));
const ResearchExplorer = lazy(() => import("./ResearchExplorer"));
const ResearchOverview = lazy(() => import("./ResearchOverview"));
const MatsonSciTimecourseExplorer = lazy(() => import("./MatsonSciTimecourseExplorer"));
const InterneuronKnowledgeCoverage = lazy(() => import("./InterneuronKnowledgeCoverage"));
const ResearchSourceRegistry = lazy(() => import("./ResearchSourceRegistry"));

export type ResearchPageId =
  | "morphology"
  | "morphology-viewer"
  | "cell-types"
  | "zebrafish"
  | "additional-types"
  | "type-compare"
  | "anatomy"
  | "positions"
  | "explorer"
  | "overview"
  | "sci"
  | "coverage"
  | "sources";

export type ResearchCollectionPageProps = {
  pageId: ResearchPageId;
  initialParams: Record<string, string | string[] | undefined>;
};

type CollectionState = {
  focus: ResearchFocus | null;
  query: string;
  morphologyQuery: string;
  focusView: ResearchFocusView;
  sciTimepoint: MatsonSciTimepoint;
};

const FOCUS_VIEWS: ResearchFocusView[] = ["summary", "evidence", "gaps", "provenance"];
// The JavaScript parser supports a verified record array; its default null
// argument otherwise makes TypeScript infer an unnecessarily narrow signature.
const parseCollectionFocus = parseResearchFocus as (
  params: URLSearchParams,
  records?: ResearchRecord[] | null,
) => ResearchFocus | null;

function normalizedParams(initialParams: ResearchCollectionPageProps["initialParams"]) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(initialParams)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  }
  return params;
}

function readCollectionState(params: URLSearchParams): CollectionState {
  const requestedView = params.get("focusView") as ResearchFocusView | null;
  return {
    focus: parseCollectionFocus(params),
    query: params.get("researchQuery") ?? "",
    morphologyQuery: params.get("morphologyQuery") ?? "",
    focusView: requestedView && FOCUS_VIEWS.includes(requestedView) ? requestedView : "summary",
    sciTimepoint: normalizeMatsonSciTimepoint(params.get("sciTime")) as MatsonSciTimepoint,
  };
}

function replaceQuery(values: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  // Preserve renderer-owned query state and the current route. A focus never
  // silently redirects a reader to another collection.
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function morphologyWorkspaceUrl(neuronId: number) {
  const params = new URLSearchParams({
    cellForm: String(neuronId),
    lab: "morphology",
    focusKind: "morphology_record",
    focusId: `NeuroMorpho:${neuronId}`,
    observedForm: "1",
    view: "cell_detail",
    panel: "evidence",
  });
  return `/workspace?${params.toString()}`;
}

function recordPageUrl(record: ResearchRecord) {
  const params = new URLSearchParams(record.navigation.params);
  params.set("focusKind", record.focusKind);
  params.set("focusId", record.focusId);
  switch (record.focusKind) {
    case "morphology_record": return `/explore/morphology/viewer?${params.toString()}`;
    case "molecular_profile": return `/explore/cell-types?${params.toString()}`;
    case "anatomy_label": return `/explore/anatomy?${params.toString()}`;
    case "sci_population": return `/research/sci?${params.toString()}`;
    case "source_lane": return `/research/coverage?${params.toString()}`;
    case "sci_entity":
      params.set("lab", "overview");
      params.set("panel", "evidence");
      return `/workspace?${params.toString()}`;
    default: return `/research/explorer?${params.toString()}`;
  }
}

class CollectionErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="collection-page-error" role="alert">
          <h2>This collection could not be displayed</h2>
          <p>Reload this page to try again. Your selected record remains in the page address.</p>
          <button type="button" onClick={() => window.location.reload()}>Reload collection</button>
          <Link href="/">Return to the atlas</Link>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ResearchCollectionPage({ pageId, initialParams }: ResearchCollectionPageProps) {
  const [state, setState] = useState(() => readCollectionState(normalizedParams(initialParams)));
  const [notice, setNotice] = useState("");
  const activeRecord = useResearchActiveRecordLoader(state.focus);
  const initial = normalizedParams(initialParams);
  const verifiedRecords = activeRecord.indexState.status === "ready" ? activeRecord.indexState.records : null;

  useEffect(() => {
    const restore = () => {
      setState(readCollectionState(new URLSearchParams(window.location.search)));
      setNotice("Page selection restored from its address.");
    };
    // Hash changes are reading-position changes, not record selection changes.
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    if (!verifiedRecords) return;
    let cancelled = false;
    const restoreLegacyFocus = () => {
      queueMicrotask(() => {
        if (cancelled) return;
        const params = new URLSearchParams(window.location.search);
        // Even an invalid explicit canonical focus owns the request. Do not
        // substitute a legacy alias or guess an anatomy authority namespace.
        if (params.has("focusKind") || params.has("focusId")) return;
        const focus = parseCollectionFocus(params, verifiedRecords);
        if (!focus) return;
        setState((current) => current.focus?.focusKind === focus.focusKind && current.focus.focusId === focus.focusId
          ? current
          : { ...current, focus });
        replaceQuery({ focusKind: focus.focusKind, focusId: focus.focusId });
        setNotice(`${focus.focusId} restored from its verified source record.`);
      });
    };
    restoreLegacyFocus();
    window.addEventListener("popstate", restoreLegacyFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("popstate", restoreLegacyFocus);
    };
  }, [verifiedRecords]);

  const selectFocus = (focus: ResearchFocus) => {
    setState((current) => ({ ...current, focus }));
    replaceQuery({
      focusKind: focus.focusKind,
      focusId: focus.focusId,
      type: null,
      morphologyNeuron: null,
      anatomyStructure: null,
      coverageLane: null,
      cell: null,
      cellForm: null,
      lab: null,
      view: null,
      panel: null,
      observedForm: null,
    });
    setNotice(`${focus.focusId} selected. Its source identity is retained.`);
  };

  const setQuery = (query: string) => {
    setState((current) => ({ ...current, query }));
    replaceQuery({ researchQuery: query });
  };

  const setMorphologyQuery = (morphologyQuery: string) => {
    setState((current) => ({ ...current, morphologyQuery }));
    replaceQuery({ morphologyQuery });
  };

  const setFocusView = (focusView: ResearchFocusView) => {
    setState((current) => ({ ...current, focusView }));
    replaceQuery({ focusView: focusView === "summary" ? null : focusView });
  };

  const setSciTimepoint = (sciTimepoint: MatsonSciTimepoint) => {
    setState((current) => ({ ...current, sciTimepoint }));
    replaceQuery({ sciTime: sciTimepoint === "all" ? null : sciTimepoint });
  };

  const browseIndependentMorphology = (sourceLabel: string) => {
    const literalQuery = sourceLabel.trim().slice(0, 180);
    const params = new URLSearchParams({ morphologyQuery: literalQuery });
    window.location.assign(`/explore/morphology/viewer?${params.toString()}`);
  };

  const morphologyFocus = state.focus?.focusKind === "morphology_record" ? state.focus.focusId : null;
  const activeNeuronId = Number(/^NeuroMorpho:([1-9][0-9]*)$/.exec(morphologyFocus ?? "")?.[1] ?? 0);
  let content: ReactNode;
  switch (pageId) {
    case "morphology":
      content = <ObservedMorphologyRouteLibrary activeNeuronId={activeNeuronId} onOpenMainScene={(neuronId) => window.location.assign(morphologyWorkspaceUrl(neuronId))} />;
      break;
    case "morphology-viewer":
      content = <>
        {state.morphologyQuery.trim() && <p className="independent-morphology-context" role="note"><strong>Literal repository-text search:</strong> “{state.morphologyQuery}” filters source metadata. It does not assign a biological subtype or select a matching cell. Geometry belongs only to an explicitly selected source record.</p>}
        <MorphologyViewer
          initialView={initial.get("morphologyView") ?? undefined}
          initialNeuron={activeNeuronId > 0 ? String(activeNeuronId) : initial.get("morphologyNeuron") ?? undefined}
          selectedFocusId={morphologyFocus}
          onSelectedFocusChange={(focusId) => selectFocus({ focusKind: "morphology_record", focusId })}
          morphologySearchQuery={state.morphologyQuery}
          morphologyDiscoveryRequestId={initial.get("morphologyQuery")?.trim() ? 1 : 0}
          onMorphologySearchQueryChange={setMorphologyQuery}
        />
      </>;
      break;
    case "cell-types":
      content = <InterneuronTypeAtlas
        initialSelected={state.focus?.focusKind === "molecular_profile" ? state.focus.focusId : initial.get("type") ?? undefined}
        initialComparison={initial.get("typeCompare") ?? undefined}
        initialSourcePanel={initial.get("sourcePanel") ?? undefined}
        selectedFocusId={state.focus?.focusKind === "molecular_profile" ? state.focus.focusId : null}
        onSelectedFocusChange={(focusId) => selectFocus({ focusKind: "molecular_profile", focusId })}
        onBrowseIndependentMorphology={browseIndependentMorphology}
        onNotice={setNotice}
      />;
      break;
    case "zebrafish": content = <ZebrafishSpinalTaxonomyPanel />; break;
    case "additional-types": content = <AdditionalResearchEvidence />; break;
    case "type-compare": content = <MolecularConcordanceWorkbench />; break;
    case "anatomy":
      content = <AtlasReferenceViewer
        selectedFocusId={state.focus?.focusKind === "anatomy_label" ? state.focus.focusId : null}
        onSelectedFocusChange={(focusId) => selectFocus({ focusKind: "anatomy_label", focusId })}
      />;
      break;
    case "positions": content = <RonzanoPremotorPositionViewer initialParams={initialParams} onNotice={setNotice} />; break;
    case "overview":
      content = <ResearchOverview
        onOpenTab={(tab) => {
          const paths = { sources: "/sources", types: "/explore/cell-types", sci: "/research/sci", atlas: "/explore/anatomy", positions: "/explore/positions", morphology: "/explore/morphology/viewer", coverage: "/research/coverage" };
          window.location.assign(paths[tab]);
        }}
        focus={state.focus}
        query={state.query}
        focusView={state.focusView}
        onFocusChange={selectFocus}
        onQueryChange={setQuery}
        onFocusViewChange={setFocusView}
        onOpenRecord={(record) => window.location.assign(recordPageUrl(record))}
        onNotice={setNotice}
      />;
      break;
    case "explorer":
      content = <ResearchExplorer
        focus={state.focus}
        query={state.query}
        activeView={state.focusView}
        onFocusChange={selectFocus}
        onQueryChange={setQuery}
        onViewChange={setFocusView}
        onOpenRecord={(record) => window.location.assign(recordPageUrl(record))}
        onNotice={setNotice}
      />;
      break;
    case "sci":
      content = <MatsonSciTimecourseExplorer
        selectedFocusId={state.focus?.focusKind === "sci_population" ? state.focus.focusId : null}
        selectedTimepoint={state.sciTimepoint}
        onSelectedFocusChange={(focusId) => selectFocus({ focusKind: "sci_population", focusId })}
        onTimepointChange={setSciTimepoint}
        onNotice={setNotice}
      />;
      break;
    case "coverage":
      content = <InterneuronKnowledgeCoverage
        selectedFocusId={state.focus?.focusKind === "source_lane" ? state.focus.focusId : null}
        onSelectedFocusChange={(focusId) => selectFocus({ focusKind: "source_lane", focusId })}
        onNotice={setNotice}
      />;
      break;
    case "sources": content = <ResearchSourceRegistry initialParams={initialParams} onNotice={setNotice} />; break;
  }

  return (
    <ResearchActiveRecordProvider value={activeRecord}>
      <div className={`collection-page collection-page-${pageId}`} data-collection-page={pageId} data-focus-kind={state.focus?.focusKind ?? "none"} data-focus-id={state.focus?.focusId ?? "none"}>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
        <CollectionErrorBoundary key={pageId}>
          <Suspense fallback={<p className="collection-page-loading" role="status">Loading this collection…</p>}>
            {content}
          </Suspense>
        </CollectionErrorBoundary>
      </div>
    </ResearchActiveRecordProvider>
  );
}
