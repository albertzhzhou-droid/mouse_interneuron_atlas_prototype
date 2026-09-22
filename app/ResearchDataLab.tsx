"use client";

import { useRef, type KeyboardEvent } from "react";
import AtlasReferenceViewer from "./AtlasReferenceViewer";
import MorphologyViewer from "./MorphologyViewer";
import ObservedMorphologyRouteLibrary from "./ObservedMorphologyRouteLibrary";
import InterneuronTypeAtlas from "./InterneuronTypeAtlas";
import InterneuronKnowledgeCoverage from "./InterneuronKnowledgeCoverage";
import ResearchSourceRegistry from "./ResearchSourceRegistry";
import RonzanoPremotorPositionViewer from "./RonzanoPremotorPositionViewer";
import MatsonSciTimecourseExplorer, { type MatsonSciTimepoint } from "./MatsonSciTimecourseExplorer";
import ResearchOverview from "./ResearchOverview";
import type {
  ResearchFocus,
  ResearchFocusView,
  ResearchRecord,
} from "./ResearchExplorer";
import { resolveResearchFocusWorkspaceState } from "./research-focus-workspace-state.js";
import { researchSourceRegistrySummary } from "./atlas-types";
import { formatResearchSourceRegistryTab } from "./research-source-registry-summary.js";
import "./research-information-layout.css";

export type LabTab = "overview" | "sources" | "types" | "sci" | "positions" | "atlas" | "morphology" | "coverage";
const LAB_TABS: LabTab[] = ["overview", "sources", "types", "sci", "positions", "atlas", "morphology", "coverage"];
type InitialParam = string | string[] | undefined;

function firstParam(value: InitialParam) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizedResearchLabTab(value: InitialParam): LabTab {
  const candidate = firstParam(value);
  return LAB_TABS.includes(candidate as LabTab) ? candidate as LabTab : "overview";
}

export default function ResearchDataLab({
  activeTab,
  focus,
  query,
  focusView,
  sciTimepoint,
  initialTypeCompare,
  initialMorphologyView,
  onTabChange,
  onFocusChange,
  onQueryChange,
  onFocusViewChange,
  onSciTimepointChange,
  onOpenRecord,
  activeObservedNeuronId,
  onOpenObservedMorphologyRoute,
  onNotice,
}: {
  activeTab: LabTab;
  focus: ResearchFocus | null;
  query: string;
  focusView: ResearchFocusView;
  sciTimepoint: MatsonSciTimepoint;
  initialTypeCompare?: InitialParam;
  initialMorphologyView?: InitialParam;
  onTabChange: (tab: LabTab) => void;
  onFocusChange: (focus: ResearchFocus) => void;
  onQueryChange: (query: string) => void;
  onFocusViewChange: (view: ResearchFocusView) => void;
  onSciTimepointChange: (timepoint: MatsonSciTimepoint) => void;
  onOpenRecord: (record: ResearchRecord) => void;
  activeObservedNeuronId: number;
  onOpenObservedMorphologyRoute: (neuronId: number) => void;
  onNotice: (notice: string) => void;
}) {
  const tab = activeTab;
  const focusWorkspace = focus ? resolveResearchFocusWorkspaceState(focus) : null;
  const canonicalFocusLab = focusWorkspace?.status === "ready" ? focusWorkspace.lab : null;
  const overviewRef = useRef<HTMLButtonElement>(null);
  const sourcesRef = useRef<HTMLButtonElement>(null);
  const typesRef = useRef<HTMLButtonElement>(null);
  const sciRef = useRef<HTMLButtonElement>(null);
  const positionsRef = useRef<HTMLButtonElement>(null);
  const atlasRef = useRef<HTMLButtonElement>(null);
  const morphologyRef = useRef<HTMLButtonElement>(null);
  const coverageRef = useRef<HTMLButtonElement>(null);
  const tabRefs: Record<LabTab, typeof atlasRef> = {
    overview: overviewRef,
    sources: sourcesRef,
    types: typesRef,
    sci: sciRef,
    positions: positionsRef,
    atlas: atlasRef,
    morphology: morphologyRef,
    coverage: coverageRef,
  };

  const selectTab = (next: LabTab) => {
    onTabChange(next);
  };

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home"
        ? LAB_TABS[0]
        : event.key === "End"
          ? LAB_TABS[LAB_TABS.length - 1]
          : LAB_TABS[(LAB_TABS.indexOf(tab) + (event.key === "ArrowRight" ? 1 : -1) + LAB_TABS.length) % LAB_TABS.length];
      selectTab(next);
      tabRefs[next].current?.focus();
    }
  };

  return (
    <section
      className="research-data-lab"
      aria-labelledby="research-data-heading"
      data-focus-kind={focus?.focusKind ?? "none"}
      data-focus-id={focus?.focusId ?? "none"}
      data-active-lab={tab}
      data-canonical-focus-lab={canonicalFocusLab ?? "none"}
      data-focus-lab-state={canonicalFocusLab === tab ? "aligned" : "context-view"}
    >
      <div className="research-data-heading">
        <div>
          <p className="panel-kicker">OVERVIEW · SOURCES · TYPE EVIDENCE · SCI STATES · EXACT POSITIONS · ANATOMY · MORPHOLOGY · COVERAGE</p>
          <h2 id="research-data-heading">Research atlas</h2>
          <p>
            Navigate the model by research question. Anatomy, source-local morphologies, molecular
            populations and SCI evidence remain separate because no validated transform or same-cell
            identity connects them.
          </p>
          <div className="research-compact-metrics" aria-label="Research collections">
            <span><strong>1,097</strong> deposited morphology records</span>
            <span><strong>387</strong> study-local profiles</span>
            <span><strong>73</strong> anatomy labels</span>
            <span><strong>17</strong> SCI-condition populations</span>
          </div>
          <details className="research-scope-disclosure">
            <summary>Collection definitions and evidence limits</summary>
            <div className="research-lab-scope" aria-label="Research model scope summary">
            <span><strong>7</strong> SCI evidence entities</span>
            <span><strong>387</strong> source profiles across ten studies—not unique types, prevalence, or a deduplicated census; the 11 Cano-Gomez profiles are source-explicit P56 <code>CHOL_IN</code> assignments, while Delile&apos;s 51 and Roome&apos;s 157 labels are embryonic source aggregates; all retain record-specific evidence and zero admitted type-specific geometry</span>
            <span><strong>17</strong> SCI-condition populations across 15 cords—not prevalence and not all confirmed local interneurons</span>
            <span><strong>14,484 + 17,394</strong> raw + normalized neonatal premotor coordinate rows—not cells with geometry and never paired across frames</span>
            <span><strong>37 + 36</strong> browser anatomy + separate context leaves</span>
            <span><strong>1,097</strong> exact no-age-query source objects · frozen adult subset 142 · 149 exact assets reused + 948 delta SWCs</span>
            <span><strong>13</strong> unique exact source-local main-scene morphologies · ten named spinal routes (eight dorsal-horn + two ventral-horn) · frozen 142-record census unchanged · 0 REG</span>
            </div>
          </details>
        </div>
        <div
          className="data-lab-tabs"
          role="tablist"
          aria-label="Reference data views"
          tabIndex={-1}
          onKeyDown={handleKeys}
        >
          <button
            ref={overviewRef}
            type="button"
            role="tab"
            id="overview-tab"
            aria-controls="overview-panel"
            aria-selected={tab === "overview"}
            tabIndex={tab === "overview" ? 0 : -1}
            className={tab === "overview" ? "active" : ""}
            onClick={() => selectTab("overview")}
          >
            Overview · evidence map
          </button>
          <button
            ref={sourcesRef}
            type="button"
            role="tab"
            id="research-sources-tab"
            aria-controls="research-sources-panel"
            aria-selected={tab === "sources"}
            tabIndex={tab === "sources" ? 0 : -1}
            className={tab === "sources" ? "active" : ""}
            onClick={() => selectTab("sources")}
          >
            {formatResearchSourceRegistryTab(researchSourceRegistrySummary)}
          </button>
          <button
            ref={typesRef}
            type="button"
            role="tab"
            id="types-tab"
            aria-controls="types-panel"
            aria-selected={tab === "types"}
            tabIndex={tab === "types" ? 0 : -1}
            className={tab === "types" ? "active" : ""}
            onClick={() => selectTab("types")}
          >
            Type evidence · 387 source profiles
          </button>
          <button
            ref={sciRef}
            type="button"
            role="tab"
            id="sci-tab"
            aria-controls="sci-panel"
            aria-selected={tab === "sci"}
            tabIndex={tab === "sci" ? 0 : -1}
            className={tab === "sci" ? "active" : ""}
            onClick={() => selectTab("sci")}
          >
            SCI states · 17 populations / 5 conditions
          </button>
          <button
            ref={positionsRef}
            type="button"
            role="tab"
            id="positions-tab"
            aria-controls="positions-panel"
            aria-selected={tab === "positions"}
            tabIndex={tab === "positions" ? 0 : -1}
            className={tab === "positions" ? "active" : ""}
            onClick={() => selectTab("positions")}
          >
            Positions · 22 exact XYZ workbooks
          </button>
          <button
            ref={atlasRef}
            type="button"
            role="tab"
            id="atlas-reference-tab"
            aria-controls="atlas-reference-panel"
            aria-selected={tab === "atlas"}
            tabIndex={tab === "atlas" ? 0 : -1}
            className={tab === "atlas" ? "active" : ""}
            onClick={() => selectTab("atlas")}
          >
            Atlas · 38 planes / 73 direct labels
          </button>
          <button
            ref={morphologyRef}
            type="button"
            role="tab"
            id="morphology-tab"
            aria-controls="morphology-panel"
            aria-selected={tab === "morphology"}
            tabIndex={tab === "morphology" ? 0 : -1}
            className={tab === "morphology" ? "active" : ""}
            onClick={() => selectTab("morphology")}
          >
            Morphology · 1,097 exact source objects
          </button>
          <button
            ref={coverageRef}
            type="button"
            role="tab"
            id="coverage-tab"
            aria-controls="coverage-panel"
            aria-selected={tab === "coverage"}
            tabIndex={tab === "coverage" ? 0 : -1}
            className={tab === "coverage" ? "active" : ""}
            onClick={() => selectTab("coverage")}
          >
            Coverage matrix · 8 sources
          </button>
        </div>
      </div>
      <div
        id="overview-panel"
        role="tabpanel"
        aria-labelledby="overview-tab"
        hidden={tab !== "overview"}
      >
        {tab === "overview" && (
          <ResearchOverview
            onOpenTab={selectTab}
            focus={focus}
            query={query}
            focusView={focusView}
            onFocusChange={onFocusChange}
            onQueryChange={onQueryChange}
            onFocusViewChange={onFocusViewChange}
            onOpenRecord={onOpenRecord}
            onNotice={onNotice}
          />
        )}
      </div>
      <div
        id="research-sources-panel"
        role="tabpanel"
        aria-labelledby="research-sources-tab"
        hidden={tab !== "sources"}
        className="research-type-landscape"
      >
        {tab === "sources" && <ResearchSourceRegistry onNotice={onNotice} />}
      </div>
      <div
        id="types-panel"
        role="tabpanel"
        aria-labelledby="types-tab"
        hidden={tab !== "types"}
        className="research-type-landscape"
      >
        {tab === "types" && (
          <InterneuronTypeAtlas
            initialSelected={focus?.focusKind === "molecular_profile" ? focus.focusId : undefined}
            initialComparison={initialTypeCompare}
            selectedFocusId={focus?.focusKind === "molecular_profile" ? focus.focusId : null}
            onSelectedFocusChange={(focusId) => onFocusChange({ focusKind: "molecular_profile", focusId })}
            onNotice={onNotice}
          />
        )}
      </div>
      <div
        id="sci-panel"
        role="tabpanel"
        aria-labelledby="sci-tab"
        hidden={tab !== "sci"}
      >
        {tab === "sci" && (
          <MatsonSciTimecourseExplorer
            selectedFocusId={focus?.focusKind === "sci_population" ? focus.focusId : null}
            selectedTimepoint={sciTimepoint}
            onSelectedFocusChange={(focusId) => onFocusChange({ focusKind: "sci_population", focusId })}
            onTimepointChange={onSciTimepointChange}
            onNotice={onNotice}
          />
        )}
      </div>
      <div
        id="positions-panel"
        role="tabpanel"
        aria-labelledby="positions-tab"
        hidden={tab !== "positions"}
      >
        {tab === "positions" && <RonzanoPremotorPositionViewer onNotice={onNotice} />}
      </div>
      <div
        id="atlas-reference-panel"
        role="tabpanel"
        aria-labelledby="atlas-reference-tab"
        hidden={tab !== "atlas"}
      >
        {tab === "atlas" && (
          <AtlasReferenceViewer
            selectedFocusId={focus?.focusKind === "anatomy_label" ? focus.focusId : null}
            onSelectedFocusChange={(focusId) => onFocusChange({ focusKind: "anatomy_label", focusId })}
          />
        )}
      </div>
      <div
        id="morphology-panel"
        role="tabpanel"
        aria-labelledby="morphology-tab"
        hidden={tab !== "morphology"}
      >
        {tab === "morphology" && (
          <>
            <ObservedMorphologyRouteLibrary
              activeNeuronId={activeObservedNeuronId}
              onOpenMainScene={onOpenObservedMorphologyRoute}
            />
            <MorphologyViewer
              initialView={initialMorphologyView}
              initialNeuron={focus?.focusKind === "morphology_record" ? focus.focusId.replace("NeuroMorpho:", "") : undefined}
              selectedFocusId={focus?.focusKind === "morphology_record" ? focus.focusId : null}
              onSelectedFocusChange={(focusId) => onFocusChange({ focusKind: "morphology_record", focusId })}
            />
          </>
        )}
      </div>
      <div
        id="coverage-panel"
        role="tabpanel"
        aria-labelledby="coverage-tab"
        hidden={tab !== "coverage"}
        className="research-type-landscape"
      >
        {tab === "coverage" && (
          <InterneuronKnowledgeCoverage
            selectedFocusId={focus?.focusKind === "source_lane" ? focus.focusId : null}
            onSelectedFocusChange={(focusId) => onFocusChange({ focusKind: "source_lane", focusId })}
            onNotice={onNotice}
          />
        )}
      </div>
    </section>
  );
}
