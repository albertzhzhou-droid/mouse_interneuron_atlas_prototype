"""Deterministic UPG-254 source audit. No network or runtime roster admission."""
from __future__ import annotations

import collections
import gzip
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data/source-candidates/trevisan-v1-exact-inputs-20260929"
OUTPUT = ROOT / "data/trevisan-v1-exact-input-crosswalk-audit-0.1.json"
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_geo_samples(text: str) -> list[dict]:
    samples = []
    for chunk in re.split(r"(?=\^SAMPLE = )", text):
        if not chunk.startswith("^SAMPLE = "):
            continue
        lines = chunk.splitlines()
        accession = lines[0].split(" = ", 1)[1]
        fields = {}
        urls = []
        for number, line in enumerate(lines, 1):
            if line.startswith("!Sample_characteristics_ch1 = "):
                key, value = line.split(" = ", 1)[1].split(": ", 1)
                if key in fields:
                    raise ValueError(f"Duplicate characteristic {accession}:{key}")
                fields[key] = {"value": value, "locator": f"{accession}/!Sample_characteristics_ch1:{key}", "sampleBlockLine": number}
            elif line.startswith("!Sample_title = "):
                title = line.split(" = ", 1)[1]
            elif line.startswith("!Sample_supplementary_file_"):
                urls.append(line.split(" = ", 1)[1].replace("ftp://", "https://", 1))
        for key in ["age", "region", "replicate", "genotype", "tissue"]:
            if key not in fields:
                raise ValueError(f"Missing characteristic {accession}:{key}")
        age = fields["age"]["value"]
        match = re.fullmatch(r"([EP])(\d+(?:\.\d+)?)", age)
        if not match:
            raise ValueError(f"Unrecognized source age {age}")
        samples.append({"geoSampleAccession": accession, "sampleTitle": title, "characteristics": fields,
                        "age": {"sourceText": age, "developmentalEpoch": "embryonic" if match[1] == "E" else "postnatal",
                                "value": float(match[2]), "unit": "source_developmental_day", "convertedToPostnatalAge": False},
                        "supplementaryFileUrls": urls})
    if len({s["geoSampleAccession"] for s in samples}) != len(samples):
        raise ValueError("Duplicate GSM accession")
    return samples


def read_single_column_workbook(path: Path) -> dict[str, list[tuple[int, str]]]:
    with zipfile.ZipFile(path) as archive:
        if archive.testzip():
            raise ValueError("Corrupt XLSX archive")
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            tree = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            strings = ["".join(n.itertext()) for n in tree.findall("s:si", NS)]
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {r.attrib["Id"]: r.attrib["Target"] for r in rels}
        result = {}
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        for sheet in workbook.findall("s:sheets/s:sheet", NS):
            relation = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
            target = targets[relation]
            target = target.lstrip("/") if target.startswith("/") else "xl/" + target
            tree = ET.fromstring(archive.read(target))
            rows = []
            for row in tree.findall("s:sheetData/s:row", NS):
                cells = row.findall("s:c", NS)
                if len(cells) != 1 or not cells[0].attrib["r"].startswith("A"):
                    raise ValueError("Workbook has unexpected columns")
                cell = cells[0]
                value = cell.findtext("s:v", namespaces=NS)
                if cell.attrib.get("t") == "s":
                    value = strings[int(value)]
                elif cell.attrib.get("t") == "inlineStr":
                    value = "".join(cell.find("s:is", NS).itertext())
                if value is None:
                    raise ValueError("Empty source barcode")
                rows.append((int(row.attrib["r"]), value))
            result[sheet.attrib["name"]] = rows
        return result


def parse_workbook_barcode(sheet: str, value: str) -> tuple[str, str]:
    if sheet == "Cell_Barcodes_Atlas":
        match = re.fullmatch(r"(P(?:0|14|28|56)[CLT]R[12])_([ACGT]{16})", value)
        if not match:
            raise ValueError(f"Unrecognized atlas barcode {value}")
        return match[1], match[2] + "-1"
    if sheet.startswith("Cell_Barcodes_En1 expt_Rep"):
        replicate = sheet[-1]
        if replicate not in {"1", "2"}:
            raise ValueError("Unknown En1 replicate")
        match = re.fullmatch(r"([ACGT]{16}-1)-(het|ko)", value)
        if not match:
            raise ValueError(f"Unrecognized En1 barcode {value}")
        return f"P0{'Het' if match[2] == 'het' else 'Ko'}R{replicate}", match[1]
    if sheet == "Cell_Barcodes_E13.5" and re.fullmatch(r"[ACGT]{16}", value):
        return "E135HetR1", value + "-1"
    raise ValueError(f"Unrecognized workbook sheet/barcode {sheet}/{value}")


def validate_matrix(path: Path, barcode_count: int, feature_count: int) -> dict:
    with gzip.open(path, "rt") as handle:
        if next(handle).strip() != "%%MatrixMarket matrix coordinate integer general":
            raise ValueError("Unexpected matrix format")
        line = next(handle)
        while line.startswith("%"):
            line = next(handle)
        features, columns, declared = map(int, line.split())
        observed = 0
        minimum = None
        maximum = None
        for line in handle:
            row, column, count = map(int, line.split())
            if not (1 <= row <= features and 1 <= column <= columns and count > 0):
                raise ValueError("Invalid sparse matrix entry")
            observed += 1
            minimum = column if minimum is None else min(minimum, column)
            maximum = column if maximum is None else max(maximum, column)
    if features != feature_count or columns != barcode_count or declared != observed:
        raise ValueError("Matrix dimensions/entry count differ from source components")
    return {"featureRowCount": features, "barcodeColumnCount": columns, "declaredNonzeroEntryCount": declared,
            "observedNonzeroEntryCount": observed, "columnIndexMinimum": minimum, "columnIndexMaximum": maximum,
            "structuralValidationPassed": True, "biologicalFinalRosterMappingValidated": False}


def build_audit() -> dict:
    receipts = json.loads((INPUT / "download-receipt.json").read_text())
    alternate = json.loads((INPUT / "alternate-download-receipt.json").read_text())
    for receipt in receipts + alternate:
        path = ROOT / receipt["path"]
        if path.stat().st_size != receipt["bytes"] or sha256(path) != receipt["sha256"]:
            raise ValueError(f"Source receipt mismatch {path}")
    samples = parse_geo_samples((INPUT / "GSE275595-family.soft.txt").read_text())
    by_title = {s["sampleTitle"]: s for s in samples}
    sheets = read_single_column_workbook(INPUT / "41467_2026_76522_MOESM7_ESM.xlsx")
    groups = collections.defaultdict(list)
    sheet_rows = []
    for sheet, rows in sheets.items():
        values = [value for _, value in rows[1:]]
        if len(values) != len(set(values)):
            raise ValueError(f"Duplicate workbook barcode {sheet}")
        sheet_rows.append({"sheet": sheet, "header": rows[0][1], "dataRowCount": len(values),
                           "uniqueSourceValueCount": len(set(values)), "firstSourceRow": rows[1][0], "lastSourceRow": rows[-1][0],
                           "clusterLabelColumnPresent": False})
        for row, value in rows[1:]:
            title, barcode = parse_workbook_barcode(sheet, value)
            if title not in by_title:
                raise ValueError(f"No exact GSM title for {title}")
            groups[title].append((sheet, row, value, barcode))
    barcode_files = [r for r in receipts if r["path"].endswith("_barcodes.tsv.gz")]
    hash_groups = collections.defaultdict(list)
    for receipt in barcode_files:
        hash_groups[receipt["sha256"]].append(Path(receipt["path"]).name)
    rows = []
    for sample in samples:
        title = sample["sampleTitle"]
        accession = sample["geoSampleAccession"]
        filename = f"{accession}_{title}_barcodes.tsv.gz"
        path = INPUT / filename
        columns = gzip.decompress(path.read_bytes()).decode().splitlines()
        if len(columns) != len(set(columns)) or any(not re.fullmatch(r"[ACGT]{16}-1", b) for b in columns):
            raise ValueError(f"Invalid/duplicate native barcode {title}")
        native = set(columns)
        expected = groups[title]
        matches = [v for v in expected if v[3] in native]
        missing = [v for v in expected if v[3] not in native]
        rows.append({**sample, "nativeBarcodeFile": str(path.relative_to(ROOT)), "nativeBarcodeSha256": sha256(path),
                     "nativeBarcodeCount": len(columns), "workbookRowCount": len(expected),
                     "barcodeMatchedRowCount": len(matches), "barcodeMissingRowCount": len(missing),
                     "workbookMissingExamples": [{"sheet": v[0], "row": v[1], "rawValue": v[2], "testedNativeValue": v[3]} for v in missing[:3]],
                     "matchingExamples": [{"sheet": v[0], "row": v[1], "rawValue": v[2], "nativeValue": v[3], "nativeMatrixColumnOneBased": columns.index(v[3])+1} for v in matches[:3]],
                     "finalNucleusRosterAdmission": "held_source_conflict" if missing else "held_cluster_and_reuse_gate",
                     "individualAnimalIdentity": None, "clusterAssignment": None})
    features = gzip.decompress((INPUT / "GSM8480577_P0CR1_features.tsv.gz").read_bytes()).decode().splitlines()
    matrix = validate_matrix(INPUT / "GSM8480577_P0CR1_matrix.mtx.gz", rows[0]["nativeBarcodeCount"], len(features))
    return {"schemaVersion": "0.1.0", "auditId": "trevisan-v1-exact-input-crosswalk-audit-0.1", "researchUpgradeId": "UPG-254",
            "auditDate": "2026-09-29", "scope": "All 29 GEO characteristics, four final-figure barcode sheets, all 29 native barcode files and one representative count matrix; source conflicts are quarantined without repair.",
            "source": {"doi": "10.1038/s41467-026-76522-3", "geoSeries": "GSE275595", "articleUrl": "https://www.nature.com/articles/s41467-026-76522-3", "receipts": receipts, "alternateBarcodeReceipts": alternate},
            "normalization": {"age": "Read exact GSM age characteristic; preserve embryonic versus postnatal epoch. No E13.5 to P135 conversion.",
                              "sampleAssignment": "Exact workbook source prefix or experiment-sheet/suffix to exact GEO title; not inferred from the faulty helper's third-from-last character.",
                              "barcode": "Atlas/E13.5 source strings omit Cell Ranger -1, so append exactly -1; En1 sheets retain -1 and remove only the explicit -het/-ko suffix. No approximate sequence match.",
                              "replicateUnit": "Source sample/experiment replicate; not asserted as a single animal or technical-repeat independence."},
            "summary": {"sampleCharacteristicsChecked": len(samples), "workbookSheetCount": len(sheets), "workbookTotalRowCount": sum(s["dataRowCount"] for s in sheet_rows),
                        "atlasFinalBarcodeCount": next(s["dataRowCount"] for s in sheet_rows if s["sheet"] == "Cell_Barcodes_Atlas"),
                        "atlasSamplePrefixCount": len({parse_workbook_barcode('Cell_Barcodes_Atlas',v)[0] for _,v in sheets['Cell_Barcodes_Atlas'][1:]}),
                        "atlasDeclaredSampleTitlesWithoutFinalBarcodes": [s["sampleTitle"] for s in samples if re.fullmatch(r"P(?:0|14|28|56)[CLT]R[12]",s["sampleTitle"]) and not groups[s["sampleTitle"]]],
                        "nativeBarcodeFileCount": len(barcode_files), "nativeBarcodeDistinctPayloadCount": len(hash_groups),
                        "sourceBarcodeMatchedRowsAcrossSeparateSheets": sum(r["barcodeMatchedRowCount"] for r in rows),
                        "sourceBarcodeMissingRowsAcrossSeparateSheets": sum(r["barcodeMissingRowCount"] for r in rows),
                        "matrixPayloadsStructurallyValidated": 1, "perNucleusClusterAssignmentsValidated": 0,
                        "runtimeNucleusRosterRowsAdmitted": 0, "canonicalSourceProfileContribution": 0,
                        "sameCellJoins": 0, "geometryObjects": 0, "atlasRegistrations": 0},
            "workbookSheets": sheet_rows, "samples": rows,
            "nativeBarcodePayloadGroups": [{"sha256": key, "fileCount": len(value), "files": value} for key,value in sorted(hash_groups.items())],
            "representativeMatrix": {"geoSampleAccession": "GSM8480577", "sourceFile": "GSM8480577_P0CR1_matrix.mtx.gz", **matrix},
            "rights": {"article": "CC BY 4.0 subject to third-party exceptions; article Rights and permissions and the linked Supplementary Data 3 are source locators, not a license inferred for GEO files.",
                       "geoObjects": "No affirmative file-specific submitter reuse license verified; local audit inputs remain quarantined outside public/.",
                       "workbookRedistribution": "Not enabled by this audit; attribution and any supplement-specific exception still need a release check.",
                       "codeMITDoesNotLicenseData": True, "publicAssetPackagingAllowed": False},
            "unresolved": ["28 separately named GEO barcode files have exactly the same bytes. Alternate official NCBI-download and cache-busting FTP requests reproduce the hash; the root cause is not inferred.",
                           "P56LR1 is listed by GEO but has no final Atlas-sheet barcode. Absence in this sheet is not proof of absent nuclei or a biological regional difference.",
                           "Most final-figure barcodes do not match the deposited source-native barcode list after the explicit Cell Ranger suffix conversion.",
                           "Supplementary Data 3 contains no cluster-label column. Cluster membership cannot be assigned from study-level 14-cluster information.",
                           "No whole-deposit matrix validation, source correction, per-animal mapping, cross-study identity, morphology, internal structure or 3D registration is admitted."],
            "nextAction": "Obtain a corrected/versioned source-native count/barcode object or an explicit author-deposited crosswalk through public routes; keep final-figure selection counts and GEO native columns separate in the meantime."}


if __name__ == "__main__":
    audit = build_audit()
    OUTPUT.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(audit["summary"], indent=2))
