export interface SamplingStateRun { stateIndex: number; zStartInclusive: number; zEndInclusive: number; sha256: string; }
export interface SamplingLabel { identifier: number; name: string; semanticLaneId: string; fullSourceVoxelCount: number; planeVoxelCounts: number[]; }
export interface SamplingStrategy { id: string; label: string; evidenceStatus: string; sampledZIndices: number[]; definition: string; evidenceLocators: string[]; }
export interface SamplingTotals {
  directLabelCount: number; sampledLabelCount: number; fullSourceVoxelCount: number;
  sampledVoxelCount: number; sampledVoxelFraction: number | null;
  representedStateVoxelCount: number; representedStateVoxelFraction: number | null;
}
export interface SamplingLabelResult {
  identifier: number; name: string; semanticLaneId: string; fullSourceVoxelCount: number;
  sampledVoxelCount: number; sampledVoxelFraction: number | null;
  representedStateVoxelCount: number; representedStateVoxelFraction: number | null;
  sourcePresenceStateCount: number; sampledPresenceStateCount: number;
  presenceStatus: "source_present_and_sampled" | "source_present_but_not_sampled"; missedPresenceStateIndices: number[];
}
export interface SamplingStrategyResult extends SamplingStrategy {
  sampledPlaneCount: number; nativePlaneCount: number; sampledNativePlaneFraction: number;
  sourceStateCount: number; coveredStateCount: number; coveredStateFraction: number;
  coveredStateIndices: number[]; missedStateIndices: number[];
  representedNativePlaneCount: number; representedNativePlaneFraction: number;
  totals: SamplingTotals; semanticLanes: (SamplingTotals & { semanticLaneId: string })[]; labels: SamplingLabelResult[];
}
export function validateSamplingStateRuns(runs: SamplingStateRun[], depth: number): SamplingStateRun[];
export function validateSamplingIndices(indices: number[], depth: number): number[];
export function buildNestedMidpointSampling(indices: number[], depth: number): number[];
export function addSamplingLabelRows(plane: Uint32Array, rows: number[], identifier: number, height: number, width: number): number;
export function analyzeSourceSampling(input: { depth: number; runs: SamplingStateRun[]; labels: SamplingLabel[]; strategies: SamplingStrategy[] }): SamplingStrategyResult[];
