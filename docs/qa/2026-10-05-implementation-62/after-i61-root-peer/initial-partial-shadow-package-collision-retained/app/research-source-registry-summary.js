function check(condition, message) {
  if (!condition) throw new Error(message);
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return count === 1 ? singular : pluralForm;
}

export function deriveResearchSourceRegistrySummary(registry) {
  check(registry && typeof registry === "object", "Research source registry is required");
  check(Array.isArray(registry.sources), "Research source registry sources are required");
  check(registry.sourceCount === registry.sources.length, "Declared and actual research source counts disagree");
  const recordSets = registry.sources.flatMap((source) => {
    check(Array.isArray(source.recordSets), `${source.id ?? "Unknown source"} record sets are required`);
    return source.recordSets;
  });
  const bundledExactCellProfileRosterCount = recordSets
    .filter((recordSet) => recordSet.childRosterRef?.status === "bundled_exact").length;
  const bundledExactSourceObjectSetCount = recordSets
    .filter((recordSet) => recordSet.sourceObjectSetRef?.status === "bundled_exact").length;

  return Object.freeze({
    sourceCount: registry.sources.length,
    recordSetCount: recordSets.length,
    bundledExactCellProfileRosterCount,
    bundledExactSourceObjectSetCount,
  });
}

export function formatResearchSourceRegistrySummary(summary) {
  return `${summary.sourceCount} ${plural(summary.sourceCount, "source")}`
    + ` · ${summary.recordSetCount} ${plural(summary.recordSetCount, "record set")}`
    + ` · ${summary.bundledExactCellProfileRosterCount} exact cell/profile ${plural(summary.bundledExactCellProfileRosterCount, "roster")}`
    + ` + ${summary.bundledExactSourceObjectSetCount} exact source-object ${plural(summary.bundledExactSourceObjectSetCount, "set")}`;
}

export function formatResearchSourceRegistryTab(summary) {
  return `Sources · ${summary.sourceCount} canonical ${plural(summary.sourceCount, "package")}`;
}
