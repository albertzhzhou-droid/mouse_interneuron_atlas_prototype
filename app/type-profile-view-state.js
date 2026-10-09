import membership from "../data/type-profile-view-membership-0.1.json" with { type: "json" };

export const TYPE_PROFILE_DEFAULT_ID = membership.defaultId;
const PROFILE_IDS = new Set(membership.profiles.map(profile => profile.id));
const NAMESPACES = new Set(membership.profiles.map(profile => profile.namespace));

const REGIONS = new Set(['all', 'dorsal', 'mid', 'ventral', 'central', 'not_established']);
const TRANSMITTERS = new Set(['all', 'excitatory', 'inhibitory', 'mixed', 'cholinergic', 'not_established']);

// Membership comes from the current source profiles, never from label matching.
export function parseTypeProfileViewState(params, profileIds = PROFILE_IDS, namespaces = NAMESPACES, defaultId = TYPE_PROFILE_DEFAULT_ID) {
  if (!(params instanceof URLSearchParams) || !(profileIds instanceof Set)
    || !(namespaces instanceof Set) || !profileIds.has(defaultId)) throw Error('Current profile membership is required');
  const errors = [];
  const one = key => {
    const values = params.getAll(key);
    if (values.length > 1) errors.push(`Repeated ${key}`);
    return values.length === 1 ? values[0] : null;
  };
  const explicitCanonical = params.has('focusKind') || params.has('focusId');
  let selectedId = defaultId;
  if (explicitCanonical) {
    const kind = one('focusKind'), id = one('focusId');
    if (kind !== 'molecular_profile' || id === null || !profileIds.has(id)) {
      errors.push('Unavailable canonical source-profile request');
      selectedId = id;
    } else selectedId = id;
  } else if (params.has('type')) {
    selectedId = one('type');
    if (selectedId === null || !profileIds.has(selectedId)) errors.push('Unavailable source-profile ID');
  }
  const rawComparison = one('typeCompare');
  let comparisonIds = [];
  if (params.has('typeCompare')) {
    const ids = rawComparison === null ? [] : rawComparison.split(',');
    if (!ids.length || ids.length > 4 || new Set(ids).size !== ids.length
      || ids.some(id => !profileIds.has(id))) errors.push('Unavailable source-profile comparison');
    else comparisonIds = ids;
  }
  let baselineId = one('typeBaseline');
  if (params.has('typeBaseline') && (baselineId === null || !profileIds.has(baselineId)
    || baselineId === selectedId)) errors.push('Unavailable source-profile baseline');
  const rawQuery = one('typeQuery');
  const query = rawQuery ?? '';
  if (query.length > 160) errors.push('Source-profile query exceeds 160 characters');
  const filter = (key, allowed) => {
    const value = one(key);
    if (!params.has(key)) return 'all';
    if (value === null || !allowed.has(value)) {
      errors.push(`Unavailable ${key} filter`);
      return 'all';
    }
    return value;
  };
  const sourceFilter = filter('typeSource', new Set(['all', ...namespaces]));
  const regionFilter = filter('typeRegion', REGIONS);
  const transmitterFilter = filter('typeTransmitter', TRANSMITTERS);
  const available = errors.length === 0;
  if (!available) { comparisonIds = []; baselineId = null; }
  return { selectedId, query, sourceFilter, regionFilter, transmitterFilter,
    comparisonIds, baselineId, available, errors, explicitSelection: explicitCanonical || params.has('type') };
}

// The caller must validate every user action before publishing a new address.
// Unrelated renderer, source-panel and reading-position state is retained.
export function serializeTypeProfileViewState(params, state, profileIds = PROFILE_IDS, namespaces = NAMESPACES, defaultId = TYPE_PROFILE_DEFAULT_ID) {
  if (typeof state?.selectedId !== 'string' || typeof state.query !== 'string'
    || typeof state.sourceFilter !== 'string' || typeof state.regionFilter !== 'string'
    || typeof state.transmitterFilter !== 'string' || !Array.isArray(state.comparisonIds)
    || state.comparisonIds.some(id => typeof id !== 'string')
    || !(state.baselineId === null || typeof state.baselineId === 'string')) {
    throw Error('Complete literal source-profile state is required');
  }
  const next = new URLSearchParams(params);
  const write = (key, value) => {
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
  };
  next.delete('type');
  write('focusKind', 'molecular_profile');
  write('focusId', state.selectedId);
  write('typeQuery', state.query);
  write('typeSource', state.sourceFilter === 'all' ? null : state.sourceFilter);
  write('typeRegion', state.regionFilter === 'all' ? null : state.regionFilter);
  write('typeTransmitter', state.transmitterFilter === 'all' ? null : state.transmitterFilter);
  write('typeCompare', state.comparisonIds?.length ? state.comparisonIds.join(',') : null);
  write('typeBaseline', state.baselineId);
  const parsed = parseTypeProfileViewState(next, profileIds, namespaces, defaultId);
  if (!parsed.available) throw Error('Cannot publish an unavailable source-profile state');
  return next;
}
