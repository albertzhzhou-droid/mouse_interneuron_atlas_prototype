#!/usr/bin/env python3
"""Fetch the explicit small BIL metadata set, never geometry or bulk images.

This is a local inspection receipt, not a redistribution permission statement.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/source-candidates/bil-xenium-20260929"
BASE = "https://download.brainimagelibrary.org/fe/79/fe798993f13debd2/"
API = "https://api.brainimagelibrary.org/"
MAX_FILE_BYTES = 2_000_000


def fetch(url, relative):
    target = OUT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        data = target.read_bytes()
        status = "reused_local"
    else:
        with urllib.request.urlopen(url, timeout=30) as response:
            data = response.read(MAX_FILE_BYTES + 1)
            if len(data) > MAX_FILE_BYTES:
                raise ValueError("Explicit metadata budget exceeded: " + url)
            if response.status != 200:
                raise ValueError("Unexpected HTTP status: " + str(response.status))
        status = "downloaded"
    if len(data) > MAX_FILE_BYTES:
        raise ValueError("Explicit metadata budget exceeded: " + url)
    if relative.endswith(".json") or relative.endswith("experiment.xenium"):
        json.loads(data)
    if relative.endswith(".xlsx") and not data.startswith(b"PK"):
        raise ValueError("Workbook is not an Office ZIP file")
    if status == "downloaded":
        partial = target.with_name(target.name + ".partial")
        partial.write_bytes(data)
        partial.replace(target)
    return {"url": url, "path": str(target.relative_to(ROOT)), "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(), "acquisition": status}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    receipts = [fetch(BASE, "collection-index.html"),
                fetch(API + "retrieve/groupdoi?bildid=g.1196", "groupdoi.json")]
    group = json.loads((OUT / "groupdoi.json").read_text())
    entries = group["doc"]["public"]["relatedmap"][0]["data"]
    folders = sorted(x["bilurl"].rstrip("/").rsplit("/", 1)[-1] for x in entries)
    if len(folders) != 16 or not all(re.fullmatch(r"Run\d+_Slide\d+_Mus_M\d+_F\d+", x) for x in folders):
        raise ValueError("Collection identity changed; review before acquisition")
    jobs = []
    for folder in folders:
        jobs.extend((BASE + folder + "/" + file, folder + "/" + file)
                    for file in ("experiment.xenium", "metrics_summary.csv"))
        jobs.append((BASE + folder + "/", folder + "/index.html"))
    workbook = "BILMetadataV2TemplateUpdate_Spatial - POOL _v2.xlsx"
    jobs.append((BASE + urllib.parse.quote(workbook), workbook))
    jobs.append((BASE + folders[0] + "/gene_panel.json", folders[0] + "/gene_panel.json"))
    for entry in entries:
        jobs.append((API + "retrieve?bildid=" + entry["bildid"], "metadata/" + entry["bildid"] + ".json"))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        receipts.extend(executor.map(lambda job: fetch(*job), jobs))
    # Source-defined outline exports are small metadata candidates. Their raw
    # names/coordinates never establish cell-to-section identity or a transform.
    outline_jobs = []
    for folder in folders:
        listing = (OUT / folder / "index.html").read_text()
        candidates = re.findall(r'href="([^"]+\.csv)"', listing)
        for filename in candidates:
            if re.fullmatch(r"(?:coordinates|coordinates_mod|coordinatestoadd|single_spine_coordinates|SpinRun\d+_slide\d+_SC\w+)\.csv", filename):
                outline_jobs.append((BASE + folder + "/" + filename, folder + "/" + filename))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        receipts.extend(executor.map(lambda job: fetch(*job), outline_jobs))
    receipt = {"checkedDate": "2026-09-29", "collectionDoi": "10.35077/g.1196",
               "mode": "explicit-small-metadata-local-inspection",
               "files": sorted(receipts, key=lambda x: x["path"]),
               "geometryDownloaded": False, "totalBytes": sum(x["bytes"] for x in receipts)}
    (OUT / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    core = [x for x in receipts if x["path"].endswith((".xenium", "metrics_summary.csv", "gene_panel.json", ".xlsx"))]
    print(json.dumps({"files": len(receipts), "bytes": receipt["totalBytes"],
                      "coreInputFiles": len(core), "coreInputBytes": sum(x["bytes"] for x in core)}))


if __name__ == "__main__":
    main()
