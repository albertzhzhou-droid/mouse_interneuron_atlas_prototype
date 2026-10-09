export const MATSON_SCI_TIMEPOINT_IDS = Object.freeze(["all", "uninjured", "1dpi", "1wpi", "3wpi", "6wpi"]);
export const DEFAULT_MATSON_SCI_TIMEPOINT = "all";

export function normalizeMatsonSciTimepoint(value) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return MATSON_SCI_TIMEPOINT_IDS.includes(candidate) ? candidate : DEFAULT_MATSON_SCI_TIMEPOINT;
}

export function findMatsonPopulation(populations, focusId) {
  if (!Array.isArray(populations) || typeof focusId !== "string" || !focusId) return null;
  return populations.find((population) => population.id === focusId) ?? null;
}

export function filterMatsonPopulations(populations, { query = "", classFilter = "all" } = {}) {
  if (!Array.isArray(populations)) return [];
  const normalizedQuery = String(query).trim().toLocaleLowerCase("en");
  return populations.filter((population) => {
    const matchesClass = classFilter === "all" || population.transmitterContext === classFilter;
    const text = [
      population.id,
      population.sourceLabel,
      population.shortLabel,
      population.sourceSubclass,
      population.transmitterContext,
      population.rankedMarkerPanel?.rankedGenes?.map((item) => item.gene),
    ]
      .join(" ")
      .toLocaleLowerCase("en");
    return matchesClass && (!normalizedQuery || text.includes(normalizedQuery));
  });
}

export function groupMatsonPopulations(populations) {
  const order = ["excitatory", "inhibitory", "motor_context"];
  return order.map((id) => ({
    id,
    populations: populations.filter((population) => population.transmitterContext === id),
  })).filter((group) => group.populations.length > 0);
}

export function populationTimepointObservation(population, timepointId) {
  if (!population || timepointId === "all") return null;
  return population.timepointCounts.find((item) => item.timepointId === timepointId) ?? null;
}

export function populationReplicatesForTimepoint(population, samples, timepointId) {
  if (!population || !Array.isArray(samples) || timepointId === "all") return [];
  const sampleIds = new Set(samples.filter((sample) => sample.timepointId === timepointId).map((sample) => sample.id));
  return population.sampleCounts.filter((item) => sampleIds.has(item.sampleId));
}
