#!/usr/bin/env python3
"""Parse explicit Crozat v2 experiment tables without a deposit-wide cell join.

Uses the XLSX XML cells, never worksheet formatting dimensions or calculated
statistics elsewhere on a sheet. Source values are preserved; there is no fitted
waveform, significance recomputation, unit guessing or missing-row imputation.
"""
import collections
import csv
import hashlib
import json
import math
from pathlib import Path
import posixpath
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data/source-candidates/crozat-experiment-families-20260930"
OUTPUT = ROOT / "data/crozat-experiment-family-observations-0.1.json"
CSV_OUTPUT = OUTPUT.with_suffix(".csv")
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
ARTICLE = "https://www.nature.com/articles/s42003-025-08559-x"
REGIONS = {"Cerv": "cervical", "Tho": "thoracic", "Lumb": "lumbar", "Lomb": "lumbar", "Lum": "lumbar"}


def spec(id_, name, file_id, headers, metrics, script_id, line, category,
         conditions=None, label="Cell", condition_header="Cond", fixed="CTR", n=None, N=None):
    return dict(id=id_, title=name, fileId=file_id, headers=headers.split(), metrics=metrics,
                scriptId=script_id, scriptLine=line, category=category, conditions=conditions,
                labelHeader=label, conditionHeader=condition_header, fixedCondition=fixed,
                articleSampleN=n, articleAnimalN=N)


# Units are linked to the primary article's corresponding methods/results.
# Tau has no unit in the deposited header: the article's µs does not license
# assigning that unit to the raw 0.1-scale numbers or applying a guessed factor.
SPECS = [
    spec("passive", "Passive membrane properties", 56062514, "Cell Level Rs Rm Cm Tau", {"Rs": "MΩ", "Rm": "GΩ", "Cm": "pF", "Tau": None}, 56062532, 54, "passive", n=659, N=191),
    spec("rmp", "Resting membrane potential", 56062520, "Cell Level RMP", {"RMP": "mV"}, 56062532, 289, "passive", n=125, N=25),
    spec("nav-control", "Sodium current in control", 56062577, "Region Cond Amp Dens", {"Amp": "pA", "Dens": "pA/pF"}, 56062553, 60, "ionic-current", conditions=["CTR"], label=None),
    spec("kv-control", "Transient and persistent potassium currents", 56062580, "Region Current Amp Dens", {"Amp": "pA", "Dens": "pA/pF"}, 56062553, 371, "ionic-current", conditions=["Trans", "Pers"], label=None, condition_header="Current"),
    spec("cav-control", "Calcium current in control", 56062556, "Region Cells Amp Dens", {"Amp": "pA", "Dens": "pA/pF"}, 56062553, 879, "ionic-current", label="Cells"),
    spec("gaba", "GABA receptor current", 56062655, "Region IGaba dGaba", {"IGaba": "pA", "dGaba": "pA/pF"}, 56062643, 56, "receptor", label=None, fixed="GABA"),
    spec("glycine", "Glycine receptor current", 56062649, "Region Igly dgly", {"Igly": "pA", "dgly": "pA/pF"}, 56062643, 345, "receptor", label=None, fixed="Gly"),
    spec("acetylcholine", "Nicotinic acetylcholine receptor current", 56062634, "Region Amp Dens", {"Amp": "pA", "Dens": "pA/pF"}, 56062643, 584, "receptor", label=None, fixed="ACh"),
    spec("glutamate", "Glutamate receptor current", 56062682, "Region Amp Dens", {"Amp": "pA", "Dens": "pA/pF"}, 56062643, 1078, "receptor", label=None, fixed="Glu"),
    spec("gaba-inhibition", "GABA current inhibition", 56062670, "Region Inh", {"Inh": "%"}, 56062643, 282, "receptor", label=None, fixed="gabazine inhibition"),
    spec("ach-inhibition", "Acetylcholine current inhibition", 56062685, "Region Inh", {"Inh": "%"}, 56062643, 835, "receptor", label=None, fixed="D-tubocurarine inhibition"),
    spec("cav-baclofen", "Calcium current modulation by baclofen", 56063108, "Cell Level Cond Dens", {"Dens": "pA/pF"}, 56063099, 68, "receptor", conditions=["CTR", "BCL", "WASH"], n=29, N=8),
    spec("cav-oxotremorine", "Calcium current modulation by oxotremorine-M", 56063081, "Cell Level Cond Dens", {"Dens": "pA/pF"}, 56063099, 874, "receptor", conditions=["CTR", "OXO", "WASH"], n=36, N=9),
    spec("pkd2l1-baseline-amplitude", "Baseline PKD2L1 unitary current amplitude", 56063819, "Cell Region Amp", {"Amp": "pA"}, 56063807, 57, "pH", n=60, N=23),
    spec("pkd2l1-baseline-npo", "Baseline PKD2L1 open probability", 56063810, "Cell Region Perc pO", {"Perc": "dimensionless ×100", "pO": "dimensionless"}, 56063807, 197, "pH", n=60, N=23),
    spec("ph9-current-amplitude", "PKD2L1 amplitude under pH9", 56063837, "Cell Region Cond Amp", {"Amp": "pA"}, 56063807, 360, "pH", conditions=["CTR", "pH9", "Wash"], n=32, N=13),
    spec("ph9-npo", "PKD2L1 open probability under pH9", 56063801, "Cell Region Cond Perc pO", {"Perc": "dimensionless ×100", "pO": "dimensionless"}, 56063807, 538, "pH", conditions=["CTR", "pH9", "Wash"], n=32, N=13),
    spec("ph5-current-amplitude", "PKD2L1 amplitude under pH5", 56063828, "Cell Region Cond Amp", {"Amp": "pA"}, 56063807, 1291, "pH", conditions=["CTR", "pH5", "Wash"], n=28, N=10),
    spec("ph5-npo", "PKD2L1 open probability under pH5", 56063804, "Cell Region Cond Perc pO", {"Perc": "dimensionless ×100", "pO": "dimensionless"}, 56063807, 1469, "pH", conditions=["CTR", "pH5", "Wash"], n=28, N=10),
    spec("spiking-baseline", "Baseline instantaneous action-potential frequency", 56063831, "Cell Region Cond Freq Numb", {"Freq": "Hz", "Numb": "count"}, 56063843, 57, "pH", conditions=["CTR"], n=32, N=12),
    spec("ph9-spiking", "Action-potential frequency under pH9", 56063834, "Cell Region Cond Freq Numb", {"Freq": "Hz", "Numb": "count"}, 56063843, 218, "pH", conditions=["CTR", "pH9", "Wash"], n=32, N=12),
    spec("ph5-depolarization", "Depolarization and action-potential count under pH5", 56063849, "Cell Region Dep Numb", {"Dep": "mV", "Numb": "count"}, 56063843, 402, "pH", fixed="pH5", n=38, N=11),
    spec("asic-current", "Acid-evoked ASIC current", 56063825, "Cell Region Asic", {"Asic": "pA"}, 56063807, 1876, "pH", fixed="pH5", n=24, N=10),
]


def xlsx_sheets(path):
    """Return populated XML cells only, with exact native sheet names/row numbers."""
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            shared = ["".join(t.text or "" for t in si.findall(".//m:t", NS))
                      for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]
        rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
        for sheet in ET.fromstring(z.read("xl/workbook.xml")).findall("m:sheets/m:sheet", NS):
            rid = sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
            target = rels[rid]
            member = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
            rows = []
            for row in ET.fromstring(z.read(member)).findall("m:sheetData/m:row", NS):
                cells = {}
                for cell in row.findall("m:c", NS):
                    value = cell.find("m:v", NS)
                    if cell.get("t") == "inlineStr":
                        parsed = "".join(t.text or "" for t in cell.findall(".//m:t", NS))
                    elif value is None or value.text is None:
                        continue
                    elif cell.get("t") == "s":
                        parsed = shared[int(value.text)]
                    elif cell.get("t") in ("str", "e"):
                        parsed = value.text
                    else:
                        parsed = float(value.text)
                        if parsed.is_integer():
                            parsed = int(parsed)
                    cells[re.match(r"[A-Z]+", cell.get("r")).group()] = parsed
                if cells:
                    rows.append((int(row.get("r")), cells))
            yield sheet.get("name"), rows


def normalize_region(raw):
    if not isinstance(raw, str) or raw.strip() not in REGIONS:
        raise ValueError(f"unknown source region: {raw!r}")
    return REGIONS[raw.strip()]


def parse_family(config, sheets):
    matching = []
    for name, rows in sheets:
        if not rows or rows[0][0] != 1:
            continue
        columns = {str(value): col for col, value in rows[0][1].items() if isinstance(value, str)}
        if all(header in columns for header in config["headers"]):
            matching.append((name, rows, columns))
    if len(matching) != 1:
        raise ValueError(f"{config['id']}: expected one exact-header sheet, got {len(matching)}")
    sheet, source_rows, columns = matching[0]
    observations, keys, quarantined = [], set(), []
    region_header = "Level" if "Level" in columns else "Region"
    for number, cells in source_rows[1:]:
        raw = {header: cells.get(columns[header]) for header in config["headers"]}
        if all(value is None for value in raw.values()):
            continue  # Non-data cells outside the declared observation columns.
        if any(value is None for value in raw.values()):
            quarantined.append({"sheet": sheet, "row": number, "reason": "incomplete_declared_fields", "raw": raw})
            continue
        region = normalize_region(raw[region_header])
        condition = raw[config["conditionHeader"]] if config["conditionHeader"] in raw else config["fixedCondition"]
        if config["conditions"] and condition not in config["conditions"]:
            raise ValueError(f"{config['id']}: unknown condition {condition!r}")
        source_label = raw[config["labelHeader"]] if config["labelHeader"] else None
        if source_label is not None and (not isinstance(source_label, int) or source_label < 1):
            raise ValueError(f"{config['id']}: missing or invalid source cell label")
        label = str(source_label) if source_label is not None else f"source-row-{number}"
        group_key = f"crozat-v2:{config['id']}:{region}:{label}"
        key = f"{group_key}:{condition}"
        if key in keys:
            raise ValueError(f"{config['id']}: duplicate family/region/label/condition key {key}")
        keys.add(key)
        values, cell_locators = {}, {}
        for metric, unit in config["metrics"].items():
            value = raw[metric]
            if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value):
                raise ValueError(f"{config['id']}: invalid numeric value at {sheet}!{columns[metric]}{number}")
            if unit == "count" and (value < 0 or int(value) != value):
                raise ValueError(f"{config['id']}: invalid count")
            values[metric] = value
            cell_locators[metric] = f"{sheet}!{columns[metric]}{number}"
        if "Perc" in values and not math.isclose(values["Perc"], values["pO"] * 100, abs_tol=1e-9, rel_tol=1e-9):
            raise ValueError(f"{config['id']}: NPo presentation-scale mismatch")
        observations.append(dict(id=key, familyId=config["id"], region=region, regionRaw=raw[region_header],
                                 sourceCellLabel=source_label, labelKind="source_local_cell_integer" if source_label else "source_row_only",
                                 conditionRaw=condition, conditionOrigin="table_column" if config["conditionHeader"] in raw else "explicit_family_context",
                                 groupKey=group_key, sourceRow=number, values=values, cellLocators=cell_locators,
                                 globallyStableCellId=None, animalId=None, sliceId=None, recordingFileId=None))
    groups = collections.defaultdict(list)
    for observation in observations:
        groups[observation["groupKey"]].append(observation)
    expected = config["conditions"] or [config["fixedCondition"]]
    paired = len(expected) > 1 and config["labelHeader"] is not None
    complete = []
    if paired:
        for key, rows in groups.items():
            if sorted(r["conditionRaw"] for r in rows) != sorted(expected):
                quarantined.append({"groupKey": key, "reason": "incomplete_condition_cardinality", "expected": expected,
                                    "found": [r["conditionRaw"] for r in rows], "rows": [r["sourceRow"] for r in rows]})
            else:
                complete.append({"groupKey": key, "region": rows[0]["region"], "sourceCellLabel": rows[0]["sourceCellLabel"],
                                 "observationIds": [r["id"] for r in rows], "conditions": expected})
    sample_n = len(groups) if config["labelHeader"] else None
    agreement = None if config["articleSampleN"] is None or sample_n is None else sample_n == config["articleSampleN"]
    family = {key: value for key, value in config.items() if key not in ("headers", "metrics", "labelHeader", "conditionHeader", "fixedCondition")}
    family.update(sheet=sheet, fieldColumns={h: columns[h] for h in config["headers"]}, metrics=[
        {"field": field, "unit": unit, "unitStatus": "source_scale_unresolved" if unit is None else "article_and_analysis_context",
         "unitSourceUrl": ARTICLE, "valueTransform": "none"} for field, unit in config["metrics"].items()],
        observationRowCount=len(observations), sourceLocalLabelCount=sample_n, rowCountsByRegion=dict(collections.Counter(r["region"] for r in observations)),
        rowCountsByCondition=dict(collections.Counter(r["conditionRaw"] for r in observations)),
        labelCountsByRegion=None if sample_n is None else dict(collections.Counter(rows[0]["region"] for rows in groups.values())),
        pairingStatus="complete_within_table_family" if paired and not quarantined else "quarantined_incomplete_pairs" if paired else "not_established_no_condition_pair",
        completePairGroupCount=len(complete), articleVersusDepositSampleCountAgrees=agreement,
        articleAnimalCountValidation="article_reported_only_no_per_row_animal_roster" if config["articleAnimalN"] else "not_assessed_for_this_table",
        observations=observations, completePairGroups=complete, quarantined=quarantined)
    return family


def build():
    receipts = json.loads((INPUT / "download-receipt.json").read_text())
    for receipt in receipts:
        payload = (ROOT / receipt["path"]).read_bytes()
        if len(payload) != receipt["bytes"] or hashlib.sha256(payload).hexdigest() != receipt["sha256"]:
            raise ValueError(f"source receipt mismatch: {receipt['path']}")
        if "publisherMd5" in receipt and hashlib.md5(payload).hexdigest() != receipt["publisherMd5"]:
            raise ValueError("publisher checksum mismatch")
    receipt_by_id = {r["fileId"]: r for r in receipts if "fileId" in r}
    manifest = json.loads((INPUT / "figshare-29430869-v2.api.json").read_text())
    if manifest["version"] != 2 or manifest["license"]["name"] != "CC BY 4.0":
        raise ValueError("wrong source version or reuse license")
    native_files = {r["id"]: r for r in manifest["files"]}
    families = []
    for config in SPECS:
        table, script = receipt_by_id[config["fileId"]], receipt_by_id[config["scriptId"]]
        for receipt in [table, script]:
            native = native_files[receipt["fileId"]]
            if receipt["publisherMd5"] != native["computed_md5"] or receipt["bytes"] != native["size"]:
                raise ValueError("manifest/receipt mismatch")
        script_lines = (ROOT / script["path"]).read_text().splitlines()
        if f'"{table["fileName"]}"' not in script_lines[config["scriptLine"] - 1]:
            raise ValueError(f"script file mapping changed: {config['id']}")
        family = parse_family(config, list(xlsx_sheets(ROOT / table["path"])))
        section = {"passive": "CSF-cN visualization and recording of their intrinsic properties", "ionic-current": "Recording and characterization of voltage-gated currents", "receptor": "Recording of ligand-gated-mediated currents", "pH": "CSF-cN visualization and recording of their intrinsic properties"}[config["category"]]
        if config["id"].startswith("cav-") and config["conditions"] and len(config["conditions"]) > 1:
            section = "Modulation of voltage-gated calcium currents by G-Protein Coupled Receptors"
        family.update(sourceFile=table, sourceAnalysis={**script, "line": config["scriptLine"]},
                      protocolLocator={"url": ARTICLE, "section": section})
        families.append(family)
    disagreements = [{"familyId": f["id"], "depositSourceLocalLabels": f["sourceLocalLabelCount"], "articleReportedSamples": f["articleSampleN"],
                      "status": "retained_source_conflict_no_imputation"} for f in families if f["articleVersusDepositSampleCountAgrees"] is False]
    result = dict(schemaVersion="0.1", auditId="crozat-experiment-family-observations-0.1", reviewedAt="2026-09-30",
                  source={"parentSourceId": "SRC-CROZAT-2025", "profileId": "crozat-2025:figshare-29430869-v2:pkd2l1-csf-cn", "articleUrl": ARTICLE,
                          "datasetUrl": "https://doi.org/10.6084/m9.figshare.29430869.v2", "version": 2, "license": manifest["license"],
                          "receipts": receipts, "depositFileCount": len(native_files)},
                  summary={"adapterTableCount": len(families), "observationRowCount": sum(f["observationRowCount"] for f in families),
                           "completeWithinTablePairGroupCount": sum(f["completePairGroupCount"] for f in families),
                           "depositWideUniqueCellCount": None, "crossExperimentFamilyJoinCount": 0, "sameCellMorphologyJoinCount": 0,
                           "pkd2l1SbfSemIdentityJoinCount": 0, "canonicalTypeContribution": 0, "geometryCount": 0, "registrationAdmissionCount": 0},
                  protocolContext={"ageWeeks": [3, 6], "ageScope": "source_population_context_not_per_observation", "species": "mouse", "recordingTemperatureCApprox": 20,
                      "rawTraceAvailability": "not_in_this_graph_source_data_deposit", "passive": "Voltage clamp at -70 mV; -10 mV step. RMP at I=0.",
                      "ionic": "Na/K voltage-step protocols; calcium voltage-step or ramp protocols. Individual sweep voltage is not attached to these summary rows.",
                      "receptor": "Ligand responses at -80 mV. GABA 1 mM/30 ms; glycine 1 mM/100 ms; ACh 4 mM/500 ms; glutamate 100 µM/100–500 ms.",
                      "cavModulation": "-80 mV holding, +10 mV/100 ms after -120 mV/50 ms. Source methods give baclofen 100 µM/40 s and oxotremorine-M 100 µM/50 s; Fig.12 caption gives 40 s for oxotremorine-M, retained as a protocol conflict.",
                      "ph": "PKD2L1/ASIC current at -80 mV; spiking at RMP. Pressure application pH5/10 s or pH9/30 s. Raw NPo remains dimensionless; Perc is its source ×100 presentation column.",
                      "protocolSourceUrl": ARTICLE},
                  identityPolicy={"key": "family + normalized source region + native label (or explicit source row) + exact condition", "globalCellIdAvailable": False,
                      "crossFamilyJoinAllowed": False, "crossFileJoinAllowed": False, "sourceRowOnlyMayPair": False,
                      "countsMayBeAddedAcrossFamiliesAsCells": False, "animalNValidation": "article reported N is separate from deposit labels; no per-row animal identifiers",
                      "regionNormalization": REGIONS, "sourceValuesTransformed": False},
                  scope={"status": "bounded_graph_source_table_adapters", "includedFileIds": [s["fileId"] for s in SPECS],
                      "unmappedDownloadedFileIds": [56062547], "unmappedReason": "INa.xlsx is not referenced by the pinned ionic-current analysis script; the script uses InhNa.xlsx for inhibition. No synonym substitution.",
                      "remainingDepositFiles": "Other antagonist/subtype/normalized/statistics/anatomy files are outside these declared adapters; no claim of all-deposit cell coverage."},
                  conflicts=disagreements + [{"familyId": "passive", "field": "Tau", "status": "unit_scale_unresolved",
                      "detail": "Native header Tau has no unit. The article reports µs; raw table scale is not assigned or converted by inference."},
                     {"familyId": "cav-oxotremorine", "field": "pressureDuration", "status": "source_protocol_conflict", "methodsSeconds": 50, "figure12CaptionSeconds": 40}],
                  families=families)
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    fields = ["id", "familyId", "familyTitle", "region", "regionRaw", "sourceCellLabel", "labelKind", "conditionRaw", "conditionOrigin", "sourceFileId", "sourceFileName", "sourceSheet", "sourceRow", "sourceSha256", "sourceUrl", "values", "metrics", "cellLocators"]
    with CSV_OUTPUT.open("w", newline="") as output:
        writer = csv.DictWriter(output, fields, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        for family in families:
            for observation in family["observations"]:
                row = {**observation, "familyTitle": family["title"], "sourceFileId": family["fileId"], "sourceFileName": family["sourceFile"]["fileName"],
                       "sourceSheet": family["sheet"], "sourceSha256": family["sourceFile"]["sha256"], "sourceUrl": family["sourceFile"]["url"], "metrics": family["metrics"]}
                writer.writerow({field: json.dumps(row[field], ensure_ascii=False) if isinstance(row[field], (dict, list)) else row[field] for field in fields})
    print(json.dumps(result["summary"], ensure_ascii=False))
    return result


if __name__ == "__main__":
    build()
