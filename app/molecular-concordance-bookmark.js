export const MOLECULAR_CONCORDANCE_BOOKMARK_KEYS = Object.freeze([
  'compareVersion', 'compareIndex', 'compareKeys', 'compareAnchor',
  'compareQuery', 'compareNamespace', 'comparePage',
]);
export const MOLECULAR_CONCORDANCE_PAGE_SIZE = 12;
export const MOLECULAR_CONCORDANCE_QUERY_LIMIT = 180;

export function emptyMolecularConcordanceView() {
  return { query: '', namespace: '', page: 0, selectedKeys: [], anchorKey: '' };
}

/** Candidate filters do not remove the independently selected comparison basket. */
export function filterMolecularConcordanceCandidates(records, { query = '', namespace = '' } = {}) {
  const needle = query.toLocaleLowerCase('en-US');
  return records.filter((record) => (!namespace || record.namespace === namespace)
    && `${record.title} ${record.focusId} ${record.searchTerms.join(' ')}`.toLocaleLowerCase('en-US').includes(needle));
}

function checkedAuthority({ records, verifiedDecodedSha256 } = {}) {
  if (typeof verifiedDecodedSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(verifiedDecodedSha256) || !Array.isArray(records) || !records.length) {
    throw new Error('The checksum-verified molecular source index is unavailable.');
  }
  const byKey = new Map();
  for (const record of records) {
    if (record?.focusKind !== 'molecular_profile' || typeof record.focusId !== 'string' || !record.focusId
      || record.key !== `molecular_profile:${record.focusId}` || typeof record.namespace !== 'string' || !record.namespace
      || typeof record.title !== 'string' || !Array.isArray(record.searchTerms)
      || record.searchTerms.some((term) => typeof term !== 'string') || byKey.has(record.key)) {
      throw new Error('The molecular source index does not contain unique complete profile keys.');
    }
    byKey.set(record.key, record);
  }
  return { records, verifiedDecodedSha256, byKey, namespaces: new Set(records.map((record) => record.namespace)) };
}

function checkedView(authority, view) {
  if (!view || typeof view.query !== 'string' || view.query.length > MOLECULAR_CONCORDANCE_QUERY_LIMIT
    || typeof view.namespace !== 'string' || (view.namespace && !authority.namespaces.has(view.namespace))
    || !Number.isSafeInteger(view.page) || view.page < 0 || !Array.isArray(view.selectedKeys)
    || view.selectedKeys.length > 4 || new Set(view.selectedKeys).size !== view.selectedKeys.length
    || view.selectedKeys.some((key) => typeof key !== 'string' || !authority.byKey.has(key))) {
    throw new Error('The comparison bookmark contains an unavailable profile, filter or page.');
  }
  if (typeof view.anchorKey !== 'string' || (view.selectedKeys.length ? !view.selectedKeys.includes(view.anchorKey) : view.anchorKey !== '')) {
    throw new Error('The comparison anchor must be one of its exact selected source profiles.');
  }
  const count = filterMolecularConcordanceCandidates(authority.records, view).length;
  if (view.page >= Math.max(1, Math.ceil(count / MOLECULAR_CONCORDANCE_PAGE_SIZE))) {
    throw new Error('The saved page is outside the current filtered source candidates.');
  }
  return { query: view.query, namespace: view.namespace, page: view.page, selectedKeys: [...view.selectedKeys], anchorKey: view.anchorKey };
}

/** This restores local UI state only; it never attests source bytes or creates a relationship. */
export function readMolecularConcordanceBookmark(input, sourceAuthority) {
  try {
    const authority = checkedAuthority(sourceAuthority);
    const params = new URLSearchParams(input);
    const present = MOLECULAR_CONCORDANCE_BOOKMARK_KEYS.filter((key) => params.has(key));
    if (!present.length) return { status: 'default', error: '', view: emptyMolecularConcordanceView() };
    if (present.some((key) => params.getAll(key).length !== 1)) {
      throw new Error('The comparison bookmark contains duplicate state parameters.');
    }
    if (params.get('compareVersion') !== '1' || params.get('compareIndex') !== authority.verifiedDecodedSha256 || !params.has('compareKeys')) {
      throw new Error('This comparison bookmark does not match the current checksum-verified source index.');
    }
    const rawPage = params.get('comparePage') ?? '0';
    if (!/^(?:0|[1-9][0-9]*)$/.test(rawPage)) throw new Error('The saved comparison page is invalid.');
    let selectedKeys;
    try { selectedKeys = JSON.parse(params.get('compareKeys')); }
    catch { throw new Error('The saved source-profile keys are invalid.'); }
    const view = checkedView(authority, {
      query: params.get('compareQuery') ?? '', namespace: params.get('compareNamespace') ?? '',
      page: Number(rawPage), selectedKeys, anchorKey: params.get('compareAnchor') ?? '',
    });
    return { status: 'ready', error: '', view };
  } catch (error) {
    return { status: 'invalid', error: error instanceof Error ? error.message : 'The comparison bookmark is invalid.', view: emptyMolecularConcordanceView() };
  }
}

export function makeMolecularConcordanceBookmarkParams(input, sourceAuthority, view, { clear = false } = {}) {
  const authority = checkedAuthority(sourceAuthority);
  const params = new URLSearchParams(input);
  for (const key of MOLECULAR_CONCORDANCE_BOOKMARK_KEYS) params.delete(key);
  if (clear) return params;
  const checked = checkedView(authority, view);
  params.set('compareVersion', '1');
  params.set('compareIndex', authority.verifiedDecodedSha256);
  params.set('compareKeys', JSON.stringify(checked.selectedKeys));
  if (checked.anchorKey) params.set('compareAnchor', checked.anchorKey);
  if (checked.query) params.set('compareQuery', checked.query);
  if (checked.namespace) params.set('compareNamespace', checked.namespace);
  if (checked.page) params.set('comparePage', String(checked.page));
  return params;
}
