#!/usr/bin/env python3
"""Derive attributed Russ population information from exact pinned source bytes.

Only stdlib ZIP/XML/Decimal is used. No network, count matrix, inferred cell
roster, geometry, lineage assignment or cross-study identity is created.
"""
from __future__ import annotations

import argparse
from decimal import Decimal
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

VERSION = "0.1.0"
OUTPUT_NAME = "russ-spinal-information-adapter-0.1.json"
MANIFEST_NAME = "russ-information-inputs-manifest-0.1.json"
DOI = "10.1038/s41467-021-25125-1"
ARTICLE_URL = "https://www.nature.com/articles/s41467-021-25125-1"
XML_NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
STUDIES = ["Sathyamurthy", "Hayashi", "Haring", "Rosenberg", "Zeisel", "Baek"]
TABLE_FIELDS = ["cluster", "lamina", "prevalence", "neurotransmitterMarker", "family", "individualMarker1", "individualMarker2", "individualMarker3", "putativeLineage"]


def check(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")


def text(node):
    return "".join(node.itertext()) if node is not None else ""


def narrative(node):
    """Article narrative excludes nested tables/figures but preserves source text."""
    result = node.text or ""
    for child in node:
        if child.tag not in {"table-wrap", "fig", "supplementary-material"}:
            result += narrative(child)
        result += child.tail or ""
    return result


def source_locator(source, location):
    return f"{source['fileName']}#{location}"


def positive_int(raw, locator):
    check(raw is not None and re.fullmatch(r"\d+", raw) is not None, f"Exact non-negative integer required at {locator}")
    return int(raw)


def cells_from_xlsx(payload):
    """Retain exact XML value text, source formula, style and number format."""
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        check(archive.testzip() is None, "Source workbook ZIP failed integrity check")
        check(sum(z.file_size for z in archive.infolist()) < 4_000_000, "Source workbook exceeds bounded XML scope")
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        sheets = workbook.findall("x:sheets/x:sheet", XML_NS)
        check(len(sheets) == 1 and sheets[0].get("name") == "Sheet1", "Expected one exact Sheet1")
        relations = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        relation_id = sheets[0].get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        targets = [r.get("Target") for r in relations if r.get("Id") == relation_id]
        check(len(targets) == 1, "Sheet1 relationship is unavailable or ambiguous")
        target = targets[0].lstrip("/")
        if not target.startswith("xl/"):
            target = "xl/" + target
        check(".." not in target, "Unexpected sheet XML relationship")
        sheet = ET.fromstring(archive.read(target))
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = [text(si) for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        styles = ET.fromstring(archive.read("xl/styles.xml"))
        xfs = list(styles.find("x:cellXfs", XML_NS))
        fonts = list(styles.find("x:fonts", XML_NS))
        formats = {int(n.get("numFmtId")): n.get("formatCode") for n in styles.findall("x:numFmts/x:numFmt", XML_NS)}
        formats.update({0: "General", 9: "0%", 10: "0.00%"})
        result = {}
        for row in sheet.findall("x:sheetData/x:row", XML_NS):
            for cell in row.findall("x:c", XML_NS):
                address = cell.get("r")
                check(address not in result, f"Duplicate source cell {address}")
                value = cell.find("x:v", XML_NS)
                raw = value.text if value is not None and value.text is not None else ""
                if cell.get("t") == "s" and raw:
                    raw = shared[int(raw)]
                elif cell.get("t") == "inlineStr":
                    raw = text(cell.find("x:is", XML_NS))
                style_id = int(cell.get("s", "0"))
                check(style_id < len(xfs), f"Unknown source style at {address}")
                style = xfs[style_id]
                font_id = int(style.get("fontId", "0"))
                color = fonts[font_id].find("x:color", XML_NS)
                number_format_id = int(style.get("numFmtId", "0"))
                result[address] = {"raw": raw, "valueType": cell.get("t", "n"), "formulaRaw": text(cell.find("x:f", XML_NS)) or None,
                    "styleId": style_id, "fontColorRaw": dict(color.attrib) if color is not None else None,
                    "numberFormatId": number_format_id, "numberFormatCode": formats.get(number_format_id)}
        return result, sheet.find("x:dimension", XML_NS).get("ref")


def derive(input_dir: Path):
    manifest_payload = (input_dir / MANIFEST_NAME).read_bytes()
    manifest = json.loads(manifest_payload)
    check(manifest.get("publicationDoi") == DOI, "Input manifest DOI changed")
    inputs = manifest["inputs"]
    check(set(inputs) == {"article_xml", "published_cluster_counts", "adult_in_situ_panels", "existing_taxonomy"}, "Exact four-input contract required")
    payloads = {}
    for key, entry in inputs.items():
        name = entry["fileName"]
        check(Path(name).name == name, "Source input must be a local basename")
        data = (input_dir / name).read_bytes()
        check(len(data) == entry["bytes"] and digest(data) == entry["sha256"], f"Pinned source bytes changed: {name}")
        payloads[key] = data
    taxonomy = json.loads(payloads["existing_taxonomy"])
    check(taxonomy["source"]["publication"]["doi"] == DOI and taxonomy["coordinateAuthority"] == "TYPE_LEVEL", "Existing taxonomy identity changed")
    old_populations = taxonomy["populations"]
    old_labels = [p["label"] for p in old_populations]
    check(len(old_labels) == 69 and len(set(old_labels)) == 69, "Existing taxonomy must retain exactly 69 unique labels")
    old_by_label = {p["label"]: p for p in old_populations}
    groups = {g["id"]: g for g in taxonomy["groups"]}
    check(sum(bool(groups[p["groupId"]]["interneuronCandidate"]) for p in old_populations) == 65, "Existing 65-candidate scope changed")
    article = ET.fromstring(payloads["article_xml"])
    article_dois = [text(n) for n in article.findall(".//article-id") if n.get("pub-id-type") == "doi"]
    check(article_dois == [DOI], "Article XML DOI identity is unavailable or ambiguous")
    licenses = article.findall(".//license")
    check(any("creativecommons.org/licenses/by/4.0/" in text(n) for n in licenses), "Article CC BY 4.0 statement unavailable")
    tables = [t for t in article.findall(".//table-wrap") if t.get("id") == "Tab1"]
    check(len(tables) == 1, "Exact article Table1 unavailable or ambiguous")
    table = tables[0]
    table_rows = table.findall(".//tbody/tr")
    check(len(table_rows) == 69 and all(len(row) == 9 for row in table_rows), "Table1 must retain 69 nine-cell source rows")
    table_footnote = text(table.find("table-wrap-foot"))
    check("percent of the total number of confidently assigned neurons" in table_footnote and "Genes in gray were not validated" in table_footnote, "Table1 denominator and validation cautions changed")
    table_by_label = {}
    for row_index, row in enumerate(table_rows, 1):
        values = [text(cell) for cell in row]
        check(values[0] not in table_by_label, "Duplicate Table1 label")
        table_by_label[values[0]] = {"index": row_index, "cells": values}
    check(set(table_by_label) == set(old_labels), "Table1 labels differ from existing taxonomy")
    counts, counts_dimension = cells_from_xlsx(payloads["published_cluster_counts"])
    panels, panels_dimension = cells_from_xlsx(payloads["adult_in_situ_panels"])
    check(counts_dimension == "A1:R75" and panels_dimension == "A1:K26", "Bounded source workbook dimensions changed")
    get = lambda cells, address: cells.get(address, {"raw": ""})["raw"]
    check([get(counts, f"{column}2") for column in "BCDEFG"] == STUDIES, "Source study header/order changed")
    counts_by_label = {}
    study_totals = [0] * 6
    counts_source = inputs["published_cluster_counts"]
    for row_index in range(3, 72):
        label = get(counts, f"A{row_index}")
        check(label and label not in counts_by_label, "Source count label is missing or duplicate")
        values = [positive_int(get(counts, f"{column}{row_index}"), f"{column}{row_index}") for column in "BCDEFG"]
        total = positive_int(get(counts, f"H{row_index}"), f"H{row_index}")
        check(sum(values) == total, f"Source population total failed at {label}")
        check(get(counts, f"K{row_index}") == label, f"Composition label differs at {label}")
        check(Decimal(get(counts, f"R{row_index}")) == Decimal(100), f"Source composition total changed at {label}")
        by_study = []
        for i, (study, column, percentage_column, value) in enumerate(zip(STUDIES, "BCDEFG", "LMNOPQ", values)):
            study_totals[i] += value
            pct_raw = get(counts, f"{percentage_column}{row_index}")
            check(abs(Decimal(pct_raw) - Decimal(value) / Decimal(total) * 100) <= Decimal("1e-12"), f"Source composition replay failed at {label}/{study}")
            by_study.append({"studyId": f"russ-2021:study:{study}", "studyLabelRaw": study, "value": value,
                "observationUnit": "captured_sequenced_cell_or_nucleus", "countLocator": source_locator(counts_source, f"Sheet1!{column}{row_index}"),
                "sourceCompositionPercentRaw": pct_raw, "sourceCompositionPercent": float(Decimal(pct_raw)),
                "compositionDenominator": {"value": total, "unit": "captured_sequenced_cells_and_nuclei_in_this_population", "locator": source_locator(counts_source, f"Sheet1!H{row_index}")},
                "compositionLocator": source_locator(counts_source, f"Sheet1!{percentage_column}{row_index}")})
        counts_by_label[label] = {"value": total, "unit": "captured sequenced cells/nuclei", "observationUnit": "captured_sequenced_cell_or_nucleus",
            "labelLocator": source_locator(counts_source, f"Sheet1!A{row_index}"), "countLocator": source_locator(counts_source, f"Sheet1!H{row_index}"),
            "namedDenominatorId": "russ_2021_final_harmonized_neuronal_dataset_19353", "byStudy": by_study}
    check(set(counts_by_label) == set(old_labels), "Source count labels differ from existing taxonomy")
    source_totals = [positive_int(get(counts, f"{column}72"), f"{column}72") for column in "BCDEFG"]
    source_total = positive_int(get(counts, "H72"), "H72")
    check(study_totals == source_totals and sum(study_totals) == source_total == 19353, "Independent source row/column totals failed")
    figure4_captions = article.findall(".//fig[@id='Fig4']/caption")
    check(len(figure4_captions) == 1, "Exact Figure4 caption required")
    figure4_caption_raw = text(figure4_captions[0])
    check("single cluster or to pair of closely related clusters" in figure4_caption_raw, "Cumulative adult assignment interpretation changed")
    figure4_caption_locator = source_locator(inputs["article_xml"], "fig[@id='Fig4']/caption")
    source_panels = []
    panel_source = inputs["adult_in_situ_panels"]
    for column in "BCDEFGHIJK":
        label = get(panels, f"{column}1")
        check(re.fullmatch(r"Set (?:[1-9]|10)", label) is not None, "Panel identifier unavailable")
        cluster_labels = [{"raw": get(panels, f"{column}{row}"), "locator": source_locator(panel_source, f"Sheet1!{column}{row}")}
            for row in range(2, 10) if get(panels, f"{column}{row}")]
        target_genes = []
        for row in range(10, 22):
            address = f"{column}{row}"
            if get(panels, address):
                target_genes.append({"raw": get(panels, address), "locator": source_locator(panel_source, f"Sheet1!{address}"),
                    "fontColorRaw": panels[address]["fontColorRaw"], "validationStatus": "not_assessable_from_retained_color_legend",
                    "reason": "Source color is retained. This workbook has no retained color legend; panel inclusion alone does not establish successful validation."})
        ratios = {}
        for key, row, error_row in [("assignedToCluster", 23, 24), ("assignedToClusterOrPair", 25, 26)]:
            address = f"{column}{row}"
            raw_ratio = get(panels, address)
            ratio = Decimal(raw_ratio)
            check(0 <= ratio <= 1 and panels[address]["numberFormatCode"] == "0%", "Source panel proportion/format changed")
            ratios[key] = {"sourceValueRaw": raw_ratio, "value": float(ratio), "unit": "fraction_displayed_as_percent",
                "sourceRowLabelRaw": get(panels, f"A{row}"),
                "numberFormatCode": "0%", "locator": source_locator(panel_source, f"Sheet1!{address}"),
                "interpretation": "assigned_to_single_cluster" if key == "assignedToCluster" else "cumulative_assigned_to_single_cluster_or_pair_of_closely_related_clusters",
                "interpretationLocator": figure4_caption_locator,
                "uncertaintyRaw": get(panels, f"{column}{error_row}"), "uncertaintyLocator": source_locator(panel_source, f"Sheet1!{column}{error_row}"),
                "uncertaintyNumericConversion": None}
        source_panels.append({"panelId": f"russ-2021:adult-panel:{label.replace(' ', '-')}", "sourceLabelRaw": label,
            "clustersProbedRaw": cluster_labels, "targetGenesRaw": target_genes,
            "countedCells": {"value": positive_int(get(panels, f"{column}22"), f"{column}22"), "unit": "adult_in_situ_counted_cells",
                "sourceCountLabelRaw": get(panels, "A22"), "locator": source_locator(panel_source, f"Sheet1!{column}22")},
            "assignmentStatistics": ratios, "genesAreAssignedToEveryNamedCluster": False,
            "boundary": "One source adult panel, not a per-type cell roster, cell count, prevalence or all-gene validation rule."})
    panel_labels = {item["raw"] for panel in source_panels for item in panel["clustersProbedRaw"]}
    panel_gene_labels = {item["raw"] for panel in source_panels for item in panel["targetGenesRaw"]}
    gene_occurrences = sum(len(panel["targetGenesRaw"]) for panel in source_panels)
    check(len(source_panels) == 10 and len(panel_labels) == 67 and len(panel_gene_labels) == 95 and gene_occurrences == 119, "Raw source panel cardinalities changed")
    check([p["sourceLabelRaw"] for p in source_panels] == [f"Set {i}" for i in range(1, 11)], "Raw source panel order changed")
    check(panel_labels - set(old_labels) == {"MNa", "MNg"}, "Native panel aliases changed")
    panel_total = sum(panel["countedCells"]["value"] for panel in source_panels)
    check(panel_total == 2371, "Source panel total changed")
    body_paragraphs = article.findall(".//body//p")
    def statement(needle):
        candidates = [(i + 1, p.get("id"), narrative(p)) for i, p in enumerate(body_paragraphs) if needle in narrative(p)]
        check(len(candidates) == 1, f"Article statement unavailable or ambiguous: {needle}")
        index, paragraph_id, raw = candidates[0]
        check(paragraph_id and re.fullmatch(r"Par\d+", paragraph_id), "Exact article paragraph ID required")
        return {"raw": raw, "sourceParagraphId": paragraph_id, "flattenedBodyParagraphIndex": index,
            "locator": source_locator(inputs["article_xml"], f"body//p[@id='{paragraph_id}']")}
    adult_methods = statement("9 weeks old")
    adult_section_methods = statement("sections from segment L4")
    thickness = re.search(r"RNA in situ hybridization, (.*?) fresh frozen", adult_section_methods["raw"])
    check(thickness is not None, "Adult source section thickness unavailable")
    adult_validation = statement("2057/2894 total")
    check("79 genes (out of 95)" in adult_validation["raw"] and "266/2894 total" in adult_validation["raw"], "Article gene or assignment totals changed")
    check("one section per animal" in adult_section_methods["raw"] and "Sections from three animals" in adult_section_methods["raw"], "Adult section/animal scope changed")
    harmonized_figure = [p for p in article.findall(".//fig") if p.get("id") == "Fig2"]
    check(len(harmonized_figure) == 1 and "19,353" in text(harmonized_figure[0]), "Figure2 harmonized count unavailable")
    footnote_locator = source_locator(inputs["article_xml"], "table-wrap[@id='Tab1']/table-wrap-foot")
    populations = []
    for label in old_labels:
        old = old_by_label[label]
        raw_table = table_by_label[label]
        raw_values = raw_table["cells"]
        locator = source_locator(inputs["article_xml"], f"table-wrap[@id='Tab1']/table/tbody/tr[{raw_table['index']}]")
        raw_prevalence = raw_values[2]
        if raw_prevalence == "":
            prevalence_status = "source_value_blank"
            prevalence_value = None
        elif raw_prevalence == "N/A":
            prevalence_status = "source_reported_NA"
            prevalence_value = None
        else:
            prevalence_status = "source_reported_population_prevalence"
            prevalence_value = float(Decimal(raw_prevalence))
        exact_panels = [p["panelId"] for p in source_panels if label in {c["raw"] for c in p["clustersProbedRaw"]}]
        populations.append({"id": f"russ-2021:{label}", "sourceLabelRaw": label, "existingPopulationId": old["id"], "existingGroupId": old["groupId"],
            "sourceProfileJoin": {"relation": "same_source_population_label", "method": "exact_source_label_equality", "samePhysicalCell": False,
                "existingTaxonomyLocator": source_locator(inputs["existing_taxonomy"], f"populations[label={label!r}]")},
            "sequencingSampling": counts_by_label[label],
            "articleTable1": {"rowIndex": raw_table["index"], "locator": locator, "rawCells": dict(zip(TABLE_FIELDS, raw_values)),
                "fieldLocators": {name: f"{locator}/td[{i+1}]" for i, name in enumerate(TABLE_FIELDS)},
                "lamina": {"raw": raw_values[1], "status": "source_reported_NA" if raw_values[1] == "N/A" else "source_population_spatial_context", "individualCoordinate": None},
                "prevalence": {"raw": raw_prevalence, "value": prevalence_value, "unit": "percent", "status": prevalence_status,
                    "denominatorDescription": "Percent of the total number of confidently assigned neurons in the adult in situ analysis.", "numericalDenominator": None,
                    "denominatorLocator": footnote_locator, "denominatorReason": "Table1 footnote supplies scope, not a numerical per-row denominator. Neither all counted cells nor sequencing counts substitute for it."},
                "family": {"raw": raw_values[4], "authority": "article_table1_source_family_context"},
                "individualMarkersRaw": raw_values[5:8], "markerValidationStatus": "not_assessable_from_text_xml_color_loss",
                "markerValidationReason": "Table1 footnote distinguishes unvalidated gray genes. Text XML preserves strings but loses gray styling, so no per-marker successful-validation claim is derived.",
                "putativeLineage": {"raw": raw_values[8], "authority": "source_putative_transcriptomic_context", "exactLineageAssignmentAllowed": False}},
            "adultPanelMembership": {"exactRawLabelPanelIds": exact_panels,
                "status": "exact_source_label_panel_context" if exact_panels else "native_alias_not_normalized" if label in {"MN-alpha", "MN-gamma"} else "not_listed_in_source_panels",
                "absenceIsBiologicalAbsence": False, "perCellRelationship": False},
            "existingTopThreeWilcoxonMarkersUnchanged": old["primaryMarkers"],
            "projectUseClassUnchanged": "source_local_interneuron_or_projection_candidate" if groups[old["groupId"]]["interneuronCandidate"] else "source_context_not_interneuron_candidate"})
    result = {"schemaVersion": VERSION, "releaseId": "ohri-russ-spinal-information-adapter-0.1.0", "researchUpgradeIds": ["UPG-132"],
        "preparationDate": manifest["preparationDate"], "namespace": "russ-2021", "parentSourceId": "SRC-RUSS-2021", "coordinateAuthority": "TYPE_LEVEL",
        "source": {"publication": taxonomy["source"]["publication"], "geoAccession": "GSE158380", "inputs": inputs,
            "rights": {"article": "CC BY 4.0 with third-party exceptions; attribution retained for extracted facts.", "geoObjects": "No file-specific redistribution permission derived or granted.", "sourceXlsxBundledInPublicAsset": False, "countMatrixBundled": False}},
        "derivation": {"method": "Exact 69-label equality across existing taxonomy, article Table1 and SupplementaryTable2; raw SupplementaryTable3 panel records kept separate.",
            "inputManifestFile": MANIFEST_NAME, "inputManifestSha256": digest(manifest_payload), "extractorFile": Path(__file__).name,
            "table1HeaderRaw": [text(cell) for cell in table.findall(".//thead/tr")[0]], "table1FootnoteRaw": table_footnote,
            "table1FootnoteLocator": footnote_locator, "approximateMatchingUsed": False, "rawValuesOverwritten": False},
        "sequencingDenominator": {"id": "russ_2021_final_harmonized_neuronal_dataset_19353", "label": "Final harmonized neuronal dataset across six source studies",
            "value": source_total, "unit": "captured_sequenced_cells_and_nuclei", "observationUnit": "captured_sequenced_cell_or_nucleus",
            "countLocator": source_locator(counts_source, "Sheet1!H72"), "figureContextLocator": source_locator(inputs["article_xml"], "fig[@id='Fig2']/caption"),
            "populationCount": 69, "individualAgeAssignmentAvailable": False, "animalResolvedReplicationAvailable": False,
            "studies": [{"studyId": f"russ-2021:study:{study}", "sourceLabelRaw": study, "value": study_totals[i], "unit": "captured_sequenced_cells_and_nuclei",
                "locator": source_locator(counts_source, f"Sheet1!{'BCDEFG'[i]}72"), "sourceAnimalCount": None, "sourceIndividualAge": None}
                for i, study in enumerate(STUDIES)],
            "boundary": "Captured source-population composition, not adult prevalence, a nucleus roster, independent animals, species-wide census or canonical type frequency."},
        "adultValidationContext": {"unit": "adult_in_situ_validation_context", "regionRaw": "adult lumbar spinal cord", "sectionContext": "L4 source sections; retained as study validation context only",
            "methodsStatement": adult_methods, "sectionMethodsStatement": adult_section_methods, "assignmentStatement": adult_validation,
            "ageContext": {"raw": "9 weeks old", "scope": "New sequencing and validation animals described in the authors' Mice methods; not every cell/nucleus in six-study harmonization.", "individualAgeAssignmentAvailable": False},
            "sectionSamplingContext": {"sourceRegionRaw": "L4", "sourceSectionThicknessRaw": thickness.group(1), "countedSectionsPerAnimal": 1, "animalsPerPanel": 3,
                "animalCountAcrossPanelsInferred": False, "locator": adult_section_methods["locator"]},
            "articleReportedCountedCells": 2894, "articleReportedSingleClusterAssignedCells": 2057, "articleReportedAdditionalPairAssignedCells": 266,
            "articleReportedTestedGenes": 95, "articleReportedReliableGenes": 79, "specificReliableGeneIdentitiesDerived": False,
            "panels": source_panels, "panelAssignmentInterpretationCaptionRaw": figure4_caption_raw, "panelAssignmentInterpretationLocator": figure4_caption_locator,
            "panelCountedCellsSum": panel_total, "targetGeneRawOccurrenceCount": gene_occurrences, "targetGeneRawUniqueCount": len(panel_gene_labels),
            "countDiscrepancy": {"status": "unresolved_source_scope_or_value_difference", "supplement3PanelSum": panel_total, "articleTotal": 2894,
                "arithmeticDifference": 2894 - panel_total, "causeInferred": False, "countsHarmonized": False,
                "sourceLocators": [source_locator(panel_source, "Sheet1!B22:K22"), adult_validation["locator"]]},
            "nativePanelAliasesNotNormalized": [label for label in sorted(panel_labels) if label not in old_by_label],
            "boundary": "Adult tissue validation and population-level spatial evidence remain separate from the six-study sequencing denominator and physical cell identity."},
        "populationCount": len(populations), "populations": populations,
        "admissionBoundary": {"retainedSourceProfileCountUnchanged": 69, "canonicalSourceProfileDenominatorUnchanged": 387,
            "newProfileCount": 0, "nucleusRosterRowsAdmitted": 0, "samePhysicalCellJoins": 0, "geometryObjectCount": 0,
            "internalStructureObjectCount": 0, "atlasRegistrationCount": 0, "exactLineageAssignments": 0, "geoMatricesDownloadedByExtractor": 0,
            "aggregateSameSourceLabelJoinOnly": True},
        "hardBoundaries": ["Table1 raw family, lamina, markers and putative lineage are source-population context, not exact identities or physical-cell observations.",
            "Adult in situ prevalence uses its stated confidently assigned-neuron scope, never 19,353 sequencing rows or 2,894 all counted cells as an invented denominator.",
            "No unknown, blank or N/A source value becomes zero. An exact sampled zero is not biological absence.",
            "Panel target-gene lists do not establish successful validation or expression in every panel cluster.",
            "Existing 69 labels, 65 source-local interneuron/projection candidates, top-three marker rankings and 387-profile denominator remain unchanged.",
            "No molecular subtype equivalence, exact lineage, individual age, matrix, nucleus roster, morphology, organelle, same-cell join or REG is introduced."]}
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--check", action="store_true", help="Rebuild and byte-compare output; do not write anything")
    args = parser.parse_args(argv)
    output_dir = args.output_dir or args.input_dir / "derived"
    result = derive(args.input_dir)
    output_payload = encoded(result)
    output_file = output_dir / OUTPUT_NAME
    script_payload = Path(__file__).read_bytes()
    receipt = {"receiptType": "russ_spinal_information_derivation", "schemaVersion": VERSION,
            "inputManifest": {"fileName": MANIFEST_NAME, "sha256": digest((args.input_dir / MANIFEST_NAME).read_bytes())},
            "inputs": result["source"]["inputs"], "extractor": {"fileName": Path(__file__).name, "bytes": len(script_payload), "sha256": digest(script_payload)},
            "outputs": [{"fileName": OUTPUT_NAME, "bytes": len(output_payload), "sha256": digest(output_payload)}],
            "verification": {"all69TableRowsRetained": True, "all69LabelsExactlyMatched": True, "all414StudyCountsRetained": True,
                "allRowTotalsReplayed": True, "allColumnTotalsReplayed": True, "sourceCompositionPercentsReplayed": True,
                "all10RawPanelsRetained": True, "zeroDenominatorSubstitutions": True, "adultCountDiscrepancyRetained": True},
            "scientificAdmissionBoundary": result["admissionBoundary"]}
    receipt_file = output_dir / "russ-spinal-information-derivation-receipt-0.1.json"
    if args.check:
        check(output_file.read_bytes() == output_payload, "Derived JSON differs from exact current-source replay")
        check(receipt_file.read_bytes() == encoded(receipt), "Derivation receipt differs from exact current-source replay")
    else:
        output_dir.mkdir(parents=True, exist_ok=True)
        output_file.write_bytes(output_payload)
        receipt_file.write_bytes(encoded(receipt))
    print(json.dumps({"mode": "check" if args.check else "build", "file": str(output_file), "bytes": len(output_payload), "sha256": digest(output_payload),
        "populationCount": result["populationCount"], "sequencingTotal": result["sequencingDenominator"]["value"],
        "panelCellSum": result["adultValidationContext"]["panelCountedCellsSum"], "geometryObjectCount": 0}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, ET.ParseError, zipfile.BadZipFile) as error:
        print(f"Russ extraction failed: {error}", file=sys.stderr)
        raise SystemExit(1)
