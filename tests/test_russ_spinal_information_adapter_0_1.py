"""Source replay and negative scientific-contract checks; fixtures stay in temp."""
from contextlib import redirect_stdout
from decimal import Decimal
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
import xml.etree.ElementTree as ET
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = Path(os.environ.get("RUSS_SOURCE_INPUT_DIR", str(HERE)))
OUTPUT_DIR = Path(os.environ.get("RUSS_DERIVED_OUTPUT_DIR", str(ROOT / "derived")))
EXTRACTOR_PATH = Path(os.environ.get("RUSS_EXTRACTOR_PATH", str(HERE / "extract_russ_spinal_information_adapter_0_1.py")))
SPEC = importlib.util.spec_from_file_location("russ_extract", EXTRACTOR_PATH)
EXTRACT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(EXTRACT)


class RussSourceContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = EXTRACT.derive(ROOT)
        cls.by_label = {p["sourceLabelRaw"]: p for p in cls.result["populations"]}

    def fixture(self):
        temporary = tempfile.TemporaryDirectory(prefix="russ-contract-")
        self.addCleanup(temporary.cleanup)
        directory = Path(temporary.name)
        manifest = json.loads((ROOT / EXTRACT.MANIFEST_NAME).read_bytes())
        shutil.copyfile(ROOT / EXTRACT.MANIFEST_NAME, directory / EXTRACT.MANIFEST_NAME)
        for entry in manifest["inputs"].values():
            shutil.copyfile(ROOT / entry["fileName"], directory / entry["fileName"])
        return directory, manifest

    def rewrite_pinned(self, directory, manifest, key, payload):
        """Only adversarial fixture pins are changed; real inputs remain untouched."""
        entry = manifest["inputs"][key]
        (directory / entry["fileName"]).write_bytes(payload)
        entry["bytes"] = len(payload)
        entry["sha256"] = hashlib.sha256(payload).hexdigest()
        (directory / EXTRACT.MANIFEST_NAME).write_bytes(EXTRACT.encoded(manifest))

    def changed_workbook(self, payload, address, raw):
        source = zipfile.ZipFile(io.BytesIO(payload))
        changed = io.BytesIO()
        with source, zipfile.ZipFile(changed, "w", zipfile.ZIP_DEFLATED) as output:
            for info in source.infolist():
                item = source.read(info.filename)
                if info.filename == "xl/worksheets/sheet1.xml":
                    root = ET.fromstring(item)
                    cell = root.find(f".//x:c[@r='{address}']/x:v", EXTRACT.XML_NS)
                    self.assertIsNotNone(cell, address)
                    cell.text = raw
                    item = ET.tostring(root, encoding="utf-8", xml_declaration=True)
                output.writestr(info, item)
        return changed.getvalue()

    def test_exact_69_labels_and_old_top_three_markers(self):
        old = json.loads((ROOT / "russ-harmonized-taxonomy-crosswalk-0.1.input.json").read_bytes())
        self.assertEqual([p["label"] for p in old["populations"]], [p["sourceLabelRaw"] for p in self.result["populations"]])
        self.assertEqual(69, len(self.by_label))
        for population in old["populations"]:
            current = self.by_label[population["label"]]
            self.assertEqual(population["primaryMarkers"], current["existingTopThreeWilcoxonMarkersUnchanged"])
            self.assertEqual(population["groupId"], current["existingGroupId"])
            self.assertEqual("exact_source_label_equality", current["sourceProfileJoin"]["method"])
            self.assertFalse(current["sourceProfileJoin"]["samePhysicalCell"])

    def test_all_414_counts_and_two_directions_of_totals(self):
        rows = [p["sequencingSampling"] for p in self.result["populations"]]
        self.assertEqual(414, sum(len(r["byStudy"]) for r in rows))
        self.assertEqual(19353, sum(r["value"] for r in rows))
        self.assertEqual([5473, 421, 1042, 11201, 1130, 86], [sum(r["byStudy"][i]["value"] for r in rows) for i in range(6)])
        for row in rows:
            self.assertEqual(row["value"], sum(study["value"] for study in row["byStudy"]))
            self.assertEqual("captured_sequenced_cell_or_nucleus", row["observationUnit"])
            self.assertEqual(self.result["sequencingDenominator"]["id"], row["namedDenominatorId"])
            for study in row["byStudy"]:
                replay = Decimal(study["value"]) / Decimal(row["value"]) * 100
                self.assertLessEqual(abs(Decimal(study["sourceCompositionPercentRaw"]) - replay), Decimal("1e-12"))

    def test_zero_not_applicable_blank_are_separate(self):
        self.assertEqual(("0", 0.0), tuple(self.by_label["Excit-11"]["articleTable1"]["prevalence"][k] for k in ["raw", "value"]))
        self.assertEqual(("N/A", None), tuple(self.by_label["Excit-7"]["articleTable1"]["prevalence"][k] for k in ["raw", "value"]))
        self.assertEqual(("", None), tuple(self.by_label["PGC"]["articleTable1"]["prevalence"][k] for k in ["raw", "value"]))
        self.assertTrue(all(p["articleTable1"]["prevalence"]["numericalDenominator"] is None for p in self.result["populations"]))

    def test_raw_table_rows_and_markers_are_preserved(self):
        article = ET.parse(ROOT / "PMC8481483.fullText.xml").getroot()
        rows = article.find(".//table-wrap[@id='Tab1']").findall(".//tbody/tr")
        self.assertEqual(69, len(rows))
        for row in rows:
            raw = [EXTRACT.text(cell) for cell in row]
            output = self.by_label[raw[0]]["articleTable1"]
            self.assertEqual(raw, list(output["rawCells"].values()))
            self.assertEqual(raw[5:8], output["individualMarkersRaw"])
            self.assertEqual("not_assessable_from_text_xml_color_loss", output["markerValidationStatus"])
            self.assertFalse(output["putativeLineage"]["exactLineageAssignmentAllowed"])

    def test_panel_source_discrepancy_and_fraction_semantics(self):
        adult = self.result["adultValidationContext"]
        self.assertEqual([124, 492, 234, 505, 234, 134, 226, 178, 102, 142], [p["countedCells"]["value"] for p in adult["panels"]])
        self.assertEqual(2371, adult["panelCountedCellsSum"])
        self.assertEqual((2894, 2057, 266), tuple(adult[k] for k in ["articleReportedCountedCells", "articleReportedSingleClusterAssignedCells", "articleReportedAdditionalPairAssignedCells"]))
        self.assertEqual(523, adult["countDiscrepancy"]["arithmeticDifference"])
        self.assertFalse(adult["countDiscrepancy"]["countsHarmonized"])
        for panel in adult["panels"]:
            statistics = panel["assignmentStatistics"]
            self.assertGreaterEqual(statistics["assignedToClusterOrPair"]["value"], statistics["assignedToCluster"]["value"])
            for ratio in statistics.values():
                self.assertEqual("fraction_displayed_as_percent", ratio["unit"])
                self.assertEqual("0%", ratio["numberFormatCode"])
                self.assertIsNone(ratio["uncertaintyNumericConversion"])

    def test_panel_color_and_raw_aliases_are_local(self):
        adult = self.result["adultValidationContext"]
        genes = [gene for panel in adult["panels"] for gene in panel["targetGenesRaw"]]
        self.assertEqual(119, len(genes))
        self.assertEqual(95, len({g["raw"] for g in genes}))
        nos1 = [g for g in genes if g["raw"] == "Nos1"]
        self.assertEqual(2, len(nos1))
        self.assertNotEqual(nos1[0]["fontColorRaw"], nos1[1]["fontColorRaw"])
        self.assertTrue(all(g["validationStatus"] == "not_assessable_from_retained_color_legend" for g in genes))
        self.assertIn("Shox2*", {g["raw"] for g in genes})
        self.assertEqual(["MNa", "MNg"], adult["nativePanelAliasesNotNormalized"])
        self.assertEqual("native_alias_not_normalized", self.by_label["MN-alpha"]["adultPanelMembership"]["status"])
        for label in ["Excit-7", "Excit-17"]:
            self.assertEqual("not_listed_in_source_panels", self.by_label[label]["adultPanelMembership"]["status"])
            self.assertFalse(self.by_label[label]["adultPanelMembership"]["absenceIsBiologicalAbsence"])

    def test_article_paragraph_locators_select_exact_ids(self):
        adult = self.result["adultValidationContext"]
        article = ET.parse(ROOT / "PMC8481483.fullText.xml").getroot()
        for key, expected in [("methodsStatement", "Par71"), ("sectionMethodsStatement", "Par83"), ("assignmentStatement", "Par22")]:
            record = adult[key]
            self.assertEqual(expected, record["sourceParagraphId"])
            xpath = record["locator"].split("#", 1)[1]
            selected = article.findall(xpath)
            self.assertEqual(1, len(selected))
            self.assertEqual(record["raw"], EXTRACT.narrative(selected[0]))
        self.assertEqual(3, adult["sectionSamplingContext"]["animalsPerPanel"])
        self.assertFalse(adult["sectionSamplingContext"]["animalCountAcrossPanelsInferred"])

    def test_no_geometry_roster_lineage_or_registration_admission(self):
        admitted = self.result["admissionBoundary"]
        self.assertEqual("TYPE_LEVEL", self.result["coordinateAuthority"])
        for key in ["newProfileCount", "nucleusRosterRowsAdmitted", "samePhysicalCellJoins", "geometryObjectCount", "internalStructureObjectCount", "atlasRegistrationCount", "exactLineageAssignments", "geoMatricesDownloadedByExtractor"]:
            self.assertEqual(0, admitted[key], key)
        self.assertEqual(387, admitted["canonicalSourceProfileDenominatorUnchanged"])

    def test_deterministic_json_and_receipt_replay(self):
        self.assertEqual((OUTPUT_DIR / EXTRACT.OUTPUT_NAME).read_bytes(), EXTRACT.encoded(self.result))
        with redirect_stdout(io.StringIO()):
            self.assertEqual(0, EXTRACT.main(["--input-dir", str(ROOT), "--output-dir", str(OUTPUT_DIR), "--check"]))

    def test_input_changed_without_pin_is_rejected(self):
        directory, manifest = self.fixture()
        path = directory / manifest["inputs"]["article_xml"]["fileName"]
        path.write_bytes(path.read_bytes() + b"\n")
        with self.assertRaisesRegex(ValueError, "Pinned source bytes changed"):
            EXTRACT.derive(directory)

    def test_changed_population_total_with_updated_fixture_pin_is_rejected(self):
        directory, manifest = self.fixture()
        payload = (directory / manifest["inputs"]["published_cluster_counts"]["fileName"]).read_bytes()
        self.rewrite_pinned(directory, manifest, "published_cluster_counts", self.changed_workbook(payload, "H3", "238"))
        with self.assertRaisesRegex(ValueError, "Source population total failed"):
            EXTRACT.derive(directory)

    def test_changed_composition_with_updated_fixture_pin_is_rejected(self):
        directory, manifest = self.fixture()
        payload = (directory / manifest["inputs"]["published_cluster_counts"]["fileName"]).read_bytes()
        self.rewrite_pinned(directory, manifest, "published_cluster_counts", self.changed_workbook(payload, "L3", "1"))
        with self.assertRaisesRegex(ValueError, "Source composition replay failed"):
            EXTRACT.derive(directory)

    def test_duplicate_article_label_with_updated_fixture_pin_is_rejected(self):
        directory, manifest = self.fixture()
        article = ET.fromstring((directory / manifest["inputs"]["article_xml"]["fileName"]).read_bytes())
        rows = article.find(".//table-wrap[@id='Tab1']").findall(".//tbody/tr")
        duplicate_label = EXTRACT.text(rows[0][0])
        rows[1][0].clear()
        rows[1][0].text = duplicate_label
        self.rewrite_pinned(directory, manifest, "article_xml", ET.tostring(article, encoding="utf-8", xml_declaration=True))
        with self.assertRaisesRegex(ValueError, "Duplicate Table1 label"):
            EXTRACT.derive(directory)

    def test_wrong_article_doi_with_updated_fixture_pin_is_rejected(self):
        directory, manifest = self.fixture()
        article = ET.fromstring((directory / manifest["inputs"]["article_xml"]["fileName"]).read_bytes())
        article.find(".//article-id[@pub-id-type='doi']").text = "10.1038/wrong-paper"
        self.rewrite_pinned(directory, manifest, "article_xml", ET.tostring(article, encoding="utf-8", xml_declaration=True))
        with self.assertRaisesRegex(ValueError, "Article XML DOI identity"):
            EXTRACT.derive(directory)

    def test_source_path_traversal_is_rejected(self):
        directory, manifest = self.fixture()
        manifest["inputs"]["article_xml"]["fileName"] = "../PMC8481483.fullText.xml"
        (directory / EXTRACT.MANIFEST_NAME).write_bytes(EXTRACT.encoded(manifest))
        with self.assertRaisesRegex(ValueError, "local basename"):
            EXTRACT.derive(directory)

    def test_changed_derived_denominator_or_receipt_is_rejected(self):
        directory, manifest = self.fixture()
        output = directory / "derived"
        with redirect_stdout(io.StringIO()):
            EXTRACT.main(["--input-dir", str(directory), "--output-dir", str(output)])
        changed = json.loads((output / EXTRACT.OUTPUT_NAME).read_bytes())
        changed["populations"][0]["articleTable1"]["prevalence"]["numericalDenominator"] = 19353
        (output / EXTRACT.OUTPUT_NAME).write_bytes(EXTRACT.encoded(changed))
        with self.assertRaisesRegex(ValueError, "Derived JSON differs"):
            EXTRACT.main(["--input-dir", str(directory), "--output-dir", str(output), "--check"])
        (output / EXTRACT.OUTPUT_NAME).write_bytes(EXTRACT.encoded(EXTRACT.derive(directory)))
        receipt_file = output / "russ-spinal-information-derivation-receipt-0.1.json"
        receipt = json.loads(receipt_file.read_bytes())
        receipt["scientificAdmissionBoundary"]["geometryObjectCount"] = 1
        receipt_file.write_bytes(EXTRACT.encoded(receipt))
        with self.assertRaisesRegex(ValueError, "Derivation receipt differs"):
            EXTRACT.main(["--input-dir", str(directory), "--output-dir", str(output), "--check"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
