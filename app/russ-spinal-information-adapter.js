const STUDIES = Object.freeze(["Sathyamurthy", "Hayashi", "Haring", "Rosenberg", "Zeisel", "Baek"]);
const STUDY_TOTALS = Object.freeze([5473, 421, 1042, 11201, 1130, 86]);
const PINNED_INPUTS = Object.freeze({
  published_cluster_counts: "5f4a2339578e08cef9c46948a2bbc50a2d6b0e797b0d950ca98e3b0aa4e49ed8",
  adult_in_situ_panels: "e949049b8ca0acc6ae5703d0fb3240245b1973e966f0e3e430f416e2304f7a21",
  article_xml: "879a57d107c89653e9583334fe809331335df20fffc62432250394d5baba0abf",
  existing_taxonomy: "dfa02071a2dbc73cfadeb86c751742775b79767c7bf7426ce9f60340bb13475b",
});
const check = (condition, message) => { if (!condition) throw new Error(`Russ information adapter: ${message}`); };
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const nonempty = (value) => typeof value === "string" && value.length > 0;
const count = (value) => Number.isSafeInteger(value) && value >= 0;

/** Structural scientific contract; exact source-byte replay is the offline validator's separate responsibility. */
export function validateRussSpinalInformationAdapter(adapter, taxonomy) {
  check(adapter?.schemaVersion === "0.1.0" && adapter.namespace === "russ-2021" && adapter.parentSourceId === "SRC-RUSS-2021", "source identity/schema changed");
  check(adapter.coordinateAuthority === "TYPE_LEVEL" && adapter.source.publication.doi === "10.1038/s41467-021-25125-1", "publication or coordinate authority changed");
  check(adapter.source.geoAccession === "GSE158380" && adapter.source.rights.countMatrixBundled === false && adapter.source.rights.sourceXlsxBundledInPublicAsset === false, "unbundled source-object boundary changed");
  check(equal(Object.keys(adapter.source.inputs).sort(), Object.keys(PINNED_INPUTS).sort()), "exact four-input contract required");
  for (const [role, expected] of Object.entries(PINNED_INPUTS)) check(adapter.source.inputs[role].sha256 === expected, `pinned ${role} hash changed`);
  const denominator = adapter.sequencingDenominator;
  check(denominator.id === "russ_2021_final_harmonized_neuronal_dataset_19353" && denominator.value === 19353 && denominator.populationCount === 69, "named sequencing denominator changed");
  check(denominator.unit === "captured_sequenced_cells_and_nuclei" && denominator.observationUnit === "captured_sequenced_cell_or_nucleus", "sequencing observation unit changed");
  check(denominator.individualAgeAssignmentAvailable === false && denominator.animalResolvedReplicationAvailable === false, "individual animal/age inference is forbidden");
  check(equal(denominator.studies.map((study) => study.sourceLabelRaw), STUDIES) && equal(denominator.studies.map((study) => study.value), STUDY_TOTALS), "six-study denominator changed");
  check(Array.isArray(adapter.populations) && adapter.populationCount === 69 && adapter.populations.length === 69, "exact 69 population rows required");
  check(Array.isArray(taxonomy?.populations) && taxonomy.populations.length === 69, "existing 69-label taxonomy required");
  const oldByLabel = new Map(taxonomy.populations.map((row) => [row.label, row]));
  const labels = adapter.populations.map((population) => population.sourceLabelRaw);
  check(new Set(labels).size === 69 && equal(labels, taxonomy.populations.map((row) => row.label)), "source labels or stable order changed");
  const totals = [0, 0, 0, 0, 0, 0];
  for (const population of adapter.populations) {
    const old = oldByLabel.get(population.sourceLabelRaw);
    check(population.id === `russ-2021:${population.sourceLabelRaw}` && population.existingPopulationId === old.id && population.existingGroupId === old.groupId, "source population identity changed");
    check(equal(population.existingTopThreeWilcoxonMarkersUnchanged, old.primaryMarkers), "existing Wilcoxon markers changed");
    check(population.sourceProfileJoin.method === "exact_source_label_equality" && population.sourceProfileJoin.samePhysicalCell === false, "physical-cell or approximate join forbidden");
    const sampled = population.sequencingSampling;
    check(count(sampled.value) && sampled.value > 0 && sampled.observationUnit === denominator.observationUnit && sampled.namedDenominatorId === denominator.id, "population sequencing count/unit/denominator invalid");
    check(sampled.unit === "captured sequenced cells/nuclei" && nonempty(sampled.countLocator) && sampled.byStudy.length === 6, "population source count locator or unit missing");
    check(equal(sampled.byStudy.map((study) => study.studyLabelRaw), STUDIES), "population six-study order changed");
    check(sampled.byStudy.reduce((sum, study) => sum + study.value, 0) === sampled.value, "population row total failed");
    sampled.byStudy.forEach((study, index) => {
      check(count(study.value) && study.observationUnit === denominator.observationUnit && study.compositionDenominator.value === sampled.value, "study count/composition denominator invalid");
      check(nonempty(study.countLocator) && nonempty(study.compositionLocator), "study exact field locator missing");
      check(Math.abs(Number(study.sourceCompositionPercentRaw) - study.value / sampled.value * 100) <= 1e-9, "study composition replay failed");
      totals[index] += study.value;
    });
    const table = population.articleTable1;
    check(Object.keys(table.rawCells).length === 9 && table.rawCells.cluster === population.sourceLabelRaw && count(table.rowIndex) && table.rowIndex > 0, "Table1 raw nine-cell row invalid");
    check(equal(table.individualMarkersRaw, [table.rawCells.individualMarker1, table.rawCells.individualMarker2, table.rawCells.individualMarker3]), "raw combinatorial markers changed");
    check(table.markerValidationStatus === "not_assessable_from_text_xml_color_loss" && table.putativeLineage.exactLineageAssignmentAllowed === false && table.lamina.individualCoordinate === null, "marker validation, exact lineage or physical coordinate forbidden");
    check(table.prevalence.numericalDenominator === null && table.prevalence.raw === table.rawCells.prevalence, "adult numerical denominator substitution forbidden");
    check(table.prevalence.value === (["N/A", ""].includes(table.prevalence.raw) ? null : Number(table.prevalence.raw)), "adult raw missing/zero distinction changed");
    check(population.adultPanelMembership.absenceIsBiologicalAbsence === false && population.adultPanelMembership.perCellRelationship === false, "adult panel absence or per-cell inference forbidden");
  }
  check(equal(totals, STUDY_TOTALS), "six independent source column totals failed");
  const adult = adapter.adultValidationContext;
  check(adult.panels.length === 10 && equal(adult.panels.map((panel) => panel.sourceLabelRaw), Array.from({ length: 10 }, (_, i) => `Set ${i + 1}`)), "ten source panels required");
  check(equal(adult.panels.map((panel) => panel.countedCells.value), [124, 492, 234, 505, 234, 134, 226, 178, 102, 142]), "source panel counts changed");
  check(adult.panels.reduce((sum, panel) => sum + panel.countedCells.value, 0) === adult.panelCountedCellsSum && adult.panelCountedCellsSum === 2371, "adult panel sum changed");
  check(adult.articleReportedCountedCells === 2894 && adult.articleReportedSingleClusterAssignedCells === 2057 && adult.articleReportedAdditionalPairAssignedCells === 266, "separate article assignment counts changed");
  check(adult.countDiscrepancy.status === "unresolved_source_scope_or_value_difference" && adult.countDiscrepancy.arithmeticDifference === 523 && adult.countDiscrepancy.causeInferred === false && adult.countDiscrepancy.countsHarmonized === false, "adult source discrepancy reconciled without evidence");
  check(equal(adult.nativePanelAliasesNotNormalized, ["MNa", "MNg"]) && adult.specificReliableGeneIdentitiesDerived === false, "native aliases or validation identities changed");
  check(adult.sectionSamplingContext.animalsPerPanel === 3 && adult.sectionSamplingContext.countedSectionsPerAnimal === 1 && adult.sectionSamplingContext.animalCountAcrossPanelsInferred === false, "adult section/animal sampling changed");
  for (const [key, id] of [["methodsStatement", "Par71"], ["sectionMethodsStatement", "Par83"], ["assignmentStatement", "Par22"]]) check(adult[key].sourceParagraphId === id && adult[key].locator.endsWith(`body//p[@id='${id}']`), "exact paragraph-ID source locator required");
  const genes = adult.panels.flatMap((panel) => panel.targetGenesRaw);
  check(genes.length === 119 && new Set(genes.map((gene) => gene.raw)).size === 95, "raw gene occurrence/unique counts changed");
  for (const gene of genes) check(nonempty(gene.raw) && nonempty(gene.locator) && gene.validationStatus === "not_assessable_from_retained_color_legend", "panel target is not a verified expression/validation rule");
  for (const panel of adult.panels) {
    check(panel.genesAreAssignedToEveryNamedCluster === false, "panel genes assigned to every named cluster");
    for (const [key, statistic] of Object.entries(panel.assignmentStatistics)) {
      check(statistic.unit === "fraction_displayed_as_percent" && statistic.value >= 0 && statistic.value <= 1 && statistic.uncertaintyNumericConversion === null, "panel fraction/uncertainty inference invalid");
      check(statistic.interpretation === (key === "assignedToCluster" ? "assigned_to_single_cluster" : "cumulative_assigned_to_single_cluster_or_pair_of_closely_related_clusters"), "cumulative pair proportion changed");
      check(statistic.interpretationLocator.endsWith("fig[@id='Fig4']/caption"), "pair interpretation lacks exact caption locator");
    }
  }
  for (const key of ["newProfileCount", "nucleusRosterRowsAdmitted", "samePhysicalCellJoins", "geometryObjectCount", "internalStructureObjectCount", "atlasRegistrationCount", "exactLineageAssignments", "geoMatricesDownloadedByExtractor"]) check(adapter.admissionBoundary[key] === 0, `${key} must remain zero`);
  check(adapter.admissionBoundary.retainedSourceProfileCountUnchanged === 69 && adapter.admissionBoundary.canonicalSourceProfileDenominatorUnchanged === 387 && adapter.admissionBoundary.aggregateSameSourceLabelJoinOnly === true, "existing profile denominator/admission scope changed");
  return adapter;
}

export function russPrevalenceDisplay(prevalence) {
  if (prevalence.raw === "") return "Blank source value";
  if (prevalence.raw === "N/A") return "N/A (source text)";
  return `${prevalence.raw}% of confidently assigned adult neurons; numerical denominator not supplied`;
}
