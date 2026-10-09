export type TypeProfileSourceFilter = string;
export type TypeProfileRegionFilter = "all" | "dorsal" | "mid" | "ventral" | "central" | "not_established";
export type TypeProfileTransmitterFilter = "all" | "excitatory" | "inhibitory" | "mixed" | "cholinergic" | "not_established";
export type TypeProfileViewState = {
  selectedId: string | null;
  query: string;
  sourceFilter: TypeProfileSourceFilter;
  regionFilter: TypeProfileRegionFilter;
  transmitterFilter: TypeProfileTransmitterFilter;
  comparisonIds: string[];
  baselineId: string | null;
  available: boolean;
  errors: string[];
  explicitSelection: boolean;
};
export const TYPE_PROFILE_DEFAULT_ID: string;
export function parseTypeProfileViewState(params: URLSearchParams, profileIds?: Set<string>, namespaces?: Set<string>, defaultId?: string): TypeProfileViewState;
export function serializeTypeProfileViewState(params: URLSearchParams, state: Omit<TypeProfileViewState, "available" | "errors" | "explicitSelection">, profileIds?: Set<string>, namespaces?: Set<string>, defaultId?: string): URLSearchParams;
