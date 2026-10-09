"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ResearchFocus,
  ResearchIndex,
  ResearchRecord,
} from "./ResearchExplorer";
import { loadVerifiedResearchExplorerIndex } from "./research-explorer-index.js";
import {
  loadVerifiedSupplementalMorphologyResearchRecords,
  resolveSupplementalMorphologyResearchRecord,
} from "./research-supplemental-morphology-records.js";
import {
  beginResearchActiveRecordRequest,
  canonicalResearchFocusKey,
  createResearchActiveRecordState,
  deriveResearchActiveRecordState,
  resolveResearchActiveRecord,
  settleResearchActiveRecordFailure,
  settleResearchActiveRecordSuccess,
} from "./research-active-record.js";
import {
  advanceResearchSelectionDeltaStream,
  createResearchSelectionDeltaStreamState,
  visibleResearchSelectionDeltaReceipt,
} from "./research-selection-delta.js";

export type ResearchActiveRecordState = {
  generation: number;
  requestKey: string | null;
  focusKind: ResearchFocus["focusKind"] | null;
  focusId: string | null;
  status: "idle" | "verifying" | "ready" | "unavailable";
  record: ResearchRecord | null;
  error: string;
};

export type ResearchIndexState =
  | { status: "idle"; index: null; records: ResearchRecord[]; error: "" }
  | { status: "verifying"; index: null; records: ResearchRecord[]; error: "" }
  | { status: "ready"; index: ResearchIndex; records: ResearchRecord[]; error: "" }
  | { status: "unavailable"; index: null; records: ResearchRecord[]; error: string };

export type ResearchActiveRecordContextValue = {
  focus: ResearchFocus | null;
  focusKey: string | null;
  indexState: ResearchIndexState;
  activeRecord: ResearchActiveRecordState;
  selectionDelta: ReturnType<typeof visibleResearchSelectionDeltaReceipt>;
};

const ResearchActiveRecordContext = createContext<ResearchActiveRecordContextValue | null>(null);

function activeRecordError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The exact source record could not be verified.";
}

const IDLE_INDEX_STATE: ResearchIndexState = Object.freeze({
  status: "idle", index: null, records: [], error: "",
});

const INITIAL_INDEX_STATE: ResearchIndexState = Object.freeze({
  status: "verifying",
  index: null,
  records: [],
  error: "",
});

type ResearchActiveRecordRuntimeState = Readonly<{
  storedActiveRecord: ResearchActiveRecordState;
  selectionDeltaStream: ReturnType<typeof createResearchSelectionDeltaStreamState>;
}>;

const createActiveRecordStateForFocus = createResearchActiveRecordState as unknown as (
  focus: ResearchFocus | null,
) => ResearchActiveRecordState;

function createResearchActiveRecordRuntime(
  focus: ResearchFocus | null,
): ResearchActiveRecordRuntimeState {
  return Object.freeze({
    storedActiveRecord: createActiveRecordStateForFocus(focus),
    selectionDeltaStream: createResearchSelectionDeltaStreamState(),
  });
}

function advanceResearchActiveRecordRuntime(
  previous: ResearchActiveRecordRuntimeState,
  storedActiveRecord: ResearchActiveRecordState,
): ResearchActiveRecordRuntimeState {
  if (storedActiveRecord === previous.storedActiveRecord) return previous;
  return Object.freeze({
    storedActiveRecord,
    selectionDeltaStream: advanceResearchSelectionDeltaStream(
      previous.selectionDeltaStream,
      storedActiveRecord,
    ),
  });
}

export function useResearchActiveRecordLoader(
  focus: ResearchFocus | null,
  indexRequested = true,
): ResearchActiveRecordContextValue {
  const generationRef = useRef(0);
  const [indexState, setIndexState] = useState<ResearchIndexState>(INITIAL_INDEX_STATE);
  const [runtime, setRuntime] = useState<ResearchActiveRecordRuntimeState>(
    () => createResearchActiveRecordRuntime(focus),
  );
  const focusKind = focus?.focusKind ?? null;
  const focusId = focus?.focusId ?? null;
  const focusKey = canonicalResearchFocusKey(focus);
  const needsIndex = indexRequested || focusKey !== null;
  // A route opt-out must hide a previous ready index before its effect runs.
  const visibleIndexState = needsIndex ? indexState : IDLE_INDEX_STATE;

  useEffect(() => {
    const requestedFocus = focusKind && focusId ? { focusKind, focusId } as ResearchFocus : null;
    const requestKey = canonicalResearchFocusKey(requestedFocus);
    const generation = ++generationRef.current;
    const controller = new AbortController();

    setRuntime((previous) => advanceResearchActiveRecordRuntime(
      previous,
      beginResearchActiveRecordRequest(
        previous.storedActiveRecord,
        requestedFocus,
        generation,
      ) as ResearchActiveRecordState,
    ));
    if (!needsIndex) {
      setIndexState(IDLE_INDEX_STATE);
      return () => controller.abort();
    }
    setIndexState((current) => current.status === "ready" ? current : INITIAL_INDEX_STATE);

    void (async () => {
      let verifiedIndex: ResearchIndex | null = null;
      let combinedCollectionReady = false;
      try {
        verifiedIndex = await loadVerifiedResearchExplorerIndex({
          signal: controller.signal,
        } as Parameters<typeof loadVerifiedResearchExplorerIndex>[0] & { signal: AbortSignal }) as ResearchIndex;
        if (generationRef.current !== generation) return;
        const supplementalMorphologyRecords = await loadVerifiedSupplementalMorphologyResearchRecords() as ResearchRecord[];
        if (generationRef.current !== generation) return;
        const records = [...verifiedIndex.records, ...supplementalMorphologyRecords];
        if (new Set(records.map((record) => record.key)).size !== records.length) {
          throw new Error("The verified research index and source-route supplements contain duplicate record keys");
        }
        const readyIndexState = Object.freeze({
          status: "ready" as const,
          index: verifiedIndex,
          records,
          error: "" as const,
        });
        setIndexState(readyIndexState);
        combinedCollectionReady = true;

        if (!requestedFocus || !requestKey) return;
        const record = resolveResearchActiveRecord(verifiedIndex, requestedFocus) as ResearchRecord | null
          ?? await resolveSupplementalMorphologyResearchRecord(requestedFocus) as ResearchRecord | null;
        if (!record) {
          throw new Error("The canonical focus is absent from the checksum-verified Research Explorer index");
        }
        setRuntime((previous) => advanceResearchActiveRecordRuntime(
          previous,
          settleResearchActiveRecordSuccess(previous.storedActiveRecord, {
            generation,
            requestKey,
            record,
          }) as ResearchActiveRecordState,
        ));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (generationRef.current !== generation) return;
        const message = activeRecordError(error);
        if (!combinedCollectionReady) {
          setIndexState(Object.freeze({
            status: "unavailable",
            index: null,
            records: [],
            error: message,
          }));
        }
        if (requestKey) {
          setRuntime((previous) => advanceResearchActiveRecordRuntime(
            previous,
            settleResearchActiveRecordFailure(previous.storedActiveRecord, {
              generation,
              requestKey,
              error: message,
            }) as ResearchActiveRecordState,
          ));
        }
      }
    })();

    return () => controller.abort();
  }, [focusId, focusKind, needsIndex]);

  const storedActiveRecord = runtime.storedActiveRecord;
  const activeRecord = useMemo(
    () => deriveResearchActiveRecordState(storedActiveRecord, focus) as ResearchActiveRecordState,
    [focus, storedActiveRecord],
  );

  const selectionDelta = useMemo(
    () => visibleResearchSelectionDeltaReceipt(runtime.selectionDeltaStream, activeRecord),
    [activeRecord, runtime.selectionDeltaStream],
  );

  return useMemo(() => Object.freeze({
    focus,
    focusKey,
    indexState: visibleIndexState,
    activeRecord,
    selectionDelta,
  }), [activeRecord, focus, focusKey, visibleIndexState, selectionDelta]);
}

export function ResearchActiveRecordProvider({
  value,
  children,
}: {
  value: ResearchActiveRecordContextValue;
  children: ReactNode;
}) {
  return (
    <ResearchActiveRecordContext.Provider value={value}>
      {children}
    </ResearchActiveRecordContext.Provider>
  );
}

export function useResearchActiveRecord() {
  const value = useContext(ResearchActiveRecordContext);
  if (!value) throw new Error("useResearchActiveRecord must be used inside ResearchActiveRecordProvider");
  return value;
}
