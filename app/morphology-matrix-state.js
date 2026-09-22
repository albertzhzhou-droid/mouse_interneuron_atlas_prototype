export const MORPHOLOGY_MATRIX_MIN_SELECTIONS = 2;
export const MORPHOLOGY_MATRIX_MAX_SELECTIONS = 4;
export const DEFAULT_MORPHOLOGY_COMPARISON_IDS = [109005, 108974, 104003, 260150];
export const MORPHOLOGY_MATRIX_VIEWS = ["universe", "individual", "matrix", "compare", "cohorts"];

export function normalizeMorphologyView(value) {
  return MORPHOLOGY_MATRIX_VIEWS.includes(value) ? value : "universe";
}

export function parseMorphologyComparisonIds(value) {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isInteger);
  if (typeof value !== "string") return [];
  return value.split(",").map((item) => Number(item.trim())).filter((item) => Number.isInteger(item) && item > 0);
}

export function normalizeMorphologyComparisonIds(
  candidates,
  availableIds,
  fallbackIds = DEFAULT_MORPHOLOGY_COMPARISON_IDS,
) {
  const available = new Set(availableIds);
  const normalized = [];
  const add = (candidate) => {
    const parsed = Number(candidate);
    if (!Number.isInteger(parsed) || !available.has(parsed) || normalized.includes(parsed)) return;
    if (normalized.length < MORPHOLOGY_MATRIX_MAX_SELECTIONS) normalized.push(parsed);
  };
  candidates.forEach(add);
  if (normalized.length === 0) fallbackIds.forEach(add);
  for (const availableId of availableIds) {
    if (normalized.length >= MORPHOLOGY_MATRIX_MIN_SELECTIONS) break;
    add(availableId);
  }
  return normalized.slice(0, MORPHOLOGY_MATRIX_MAX_SELECTIONS);
}

export function addMorphologyComparisonId(current, neuronId, availableIds) {
  const base = normalizeMorphologyComparisonIds(current, availableIds, []);
  if (base.includes(neuronId) || base.length >= MORPHOLOGY_MATRIX_MAX_SELECTIONS || !availableIds.includes(neuronId)) return base;
  return [...base, neuronId];
}

export function removeMorphologyComparisonId(current, neuronId, availableIds) {
  const base = normalizeMorphologyComparisonIds(current, availableIds, []);
  if (base.length <= MORPHOLOGY_MATRIX_MIN_SELECTIONS) return base;
  return base.filter((candidate) => candidate !== neuronId);
}

export function replaceMorphologyComparisonId(current, index, neuronId, availableIds) {
  const base = normalizeMorphologyComparisonIds(current, availableIds, []);
  if (!Number.isInteger(index) || index < 0 || index >= base.length) return base;
  if (!availableIds.includes(neuronId) || base.some((candidate, candidateIndex) => candidate === neuronId && candidateIndex !== index)) return base;
  return base.map((candidate, candidateIndex) => candidateIndex === index ? neuronId : candidate);
}
