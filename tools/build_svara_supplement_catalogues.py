#!/usr/bin/env python3
"""Verify exact official supplements and render original catalogue pages.

These are publication-page references, never editable neuronal geometry.
Run with the bundled pypdf runtime. No source PDF is edited or executed.
"""
import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import tempfile
import zipfile

import pypdf

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/source-candidates/svara-supplements-20261002"
PUBLIC = ROOT / "public/data/svara_catalogue_pages_v1"
DOCUMENT = ROOT / "data/svara-supplement-catalogues-0.1.json"
POPLER = pathlib.Path("/Users/zhouzhenghang/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm")
PACKAGES = [
    (6, "file_3055230", "Catalog 1, MNs.pdf", "Motoneuron", 139),
    (7, "file_3055231", "Catalog 2, CiDs.pdf", "CiD", 39),
    (8, "file_3055232", "Catalog 3, CoBLs.pdf", "CoBL", 34),
]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, indent=2, ensure_ascii=True) + "\n").encode()


def file_receipt(path):
    data = path.read_bytes()
    return {"path": str(path.relative_to(ROOT)), "bytes": len(data), "sha256": digest(data)}


def reported_fields(text):
    fields = []
    for line in text.splitlines():
        if ":" not in line:
            continue
        label, raw = line.split(":", 1)
        if label not in {"Soma Diameter", "D-V Position", "Dendritic Path Length", "Axon Trajectory", "Axon Myelinated", "TSI"}:
            raise ValueError(f"Unreviewed reported field {label!r}")
        raw = raw.strip()
        fields.append({"label": label, "sourceText": raw,
                       "evidence": "source_reported_in_published_catalogue; not recomputed from pixels"})
    assert len(fields) == (5 if "Motoneuron " in text else 3)
    return fields


def build(write=False):
    metadata_bytes = (SOURCE / "item-metadata.json").read_bytes()
    metadata = json.loads(metadata_bytes)
    assert metadata["objectId"] == "item_3055210" and metadata["versionNumber"] == 7
    assert {i["id"] for i in metadata["metadata"]["identifiers"] if i["type"] == "DOI"} == {"10.1016/j.celrep.2018.05.023"}
    article = next(f for f in metadata["files"] if f["objectId"] == "file_3055224")
    assert article["metadata"]["license"] == "http://creativecommons.org/licenses/by/4.0/"
    policy = json.loads((SOURCE / "publisher-supplement-policy.receipt.json").read_bytes())
    policy_bytes = (SOURCE / "publisher-supplement-policy.html").read_bytes()
    assert len(policy_bytes) == policy["bytes"] and digest(policy_bytes) == policy["sha256"]
    assert policy["verifiedPhrase"].encode() in policy_bytes and policy["status"] == 200
    pdf_version = pypdf.__version__
    poppler_version = subprocess.run([str(POPLER), "-v"], capture_output=True, text=True, check=True).stderr.splitlines()[0]
    doc = {
        "schemaVersion": "0.1.0", "contractId": "svara-supplement-catalogues-0.1",
        "sourceId": "DOI:10.1016/j.celrep.2018.05.023", "releaseId": "MPG:item_3055210:7",
        "sourceUrl": "https://pure.mpg.de/rest/items/item_3055210_7",
        "citation": "Svara FN, Kornfeld J, Denk W, Bollmann JH (2018). Volume EM Reconstruction of Spinal Cord Reveals Wiring Specificity in Speed-Related Motor Circuits. Cell Reports 23:2942-2954. DOI:10.1016/j.celrep.2018.05.023.",
        "biologicalContext": {"species": "Danio rerio", "lifeStage": "6 dpf larval zebrafish", "reportedSpecimens": 1,
            "specimenId": None, "sectionId": None, "rawVolumeCellIdMapping": None,
            "geneticV2aAssignment": False, "mouseIdentityTransfer": False},
        "rights": {"license": "CC-BY-4.0", "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
            "basis": "Exact official article license plus publisher's explicit open-access supplementary-data policy, applied to these three exact supplementary components; no separate conflicting notice in their retained page text or metadata.",
            "articleLicenseLocator": "item_3055210_7/files[file_3055224]/metadata/license",
            "metadataReceipt": file_receipt(SOURCE / "item-metadata.json"),
            "publisherPolicyReceipt": file_receipt(SOURCE / "publisher-supplement-policy.receipt.json"),
            "publisherPolicyPage": file_receipt(SOURCE / "publisher-supplement-policy.html"),
            "publisherPolicyUrl": policy["sourceUrl"],
            "modificationNotice": "PDF pages rasterized at 96 dpi using Poppler; original diagrams and published values retained. No tracing, recoloring, measurement or geometry reconstruction.",
            "otherRepositoriesOrKohVersionCovered": False},
        "representation": {"kind": "rendered_original_publication_page", "dimension": "2D page pixels",
            "coordinateUnit": "page_pixels", "physicalCoordinatesAvailable": False,
            "editableSkeletons": 0, "meshes": 0, "rawVolumes": 0, "synapseEndpointTables": 0,
            "sameCellJoins": 0, "atlasRegistrations": 0, "completeNeuronReconstructionClaim": False},
        "extraction": {"pypdfVersion": pdf_version, "popplerVersion": poppler_version,
            "rasterDpi": 96, "pageTextMethod": "pypdf extract_text; exact source fields retained as strings",
            "noPdfExecution": True, "sourcePdfHashesVerifiedAtBuild": True,
            "runtimeVerification": "Only current rendered PNG bytes; not the complete original PDF or ZIP"},
        "catalogues": [], "entries": [],
    }
    with tempfile.TemporaryDirectory(prefix="ohri-svara-render-", dir="/private/tmp") as temp:
        temp = pathlib.Path(temp)
        for package, component, member, cell_class, expected_count in PACKAGES:
            native = next(f for f in metadata["files"] if f["objectId"] == component)
            assert native["metadata"]["contentCategory"] == "supplementary-material" and native["visibility"] == "PUBLIC"
            name = f"1-s2.0-S2211124718307563-mmc{package}.zip"
            archive = (SOURCE / name).read_bytes()
            assert len(archive) == native["size"] and hashlib.md5(archive).hexdigest() == native["checksum"]
            with zipfile.ZipFile(SOURCE / name) as z:
                assert z.namelist() == [member] and z.testzip() is None
                pdf = z.read(member)
            assert pdf.startswith(b"%PDF-") and (SOURCE / member).read_bytes() == pdf
            reader = pypdf.PdfReader(SOURCE / member)
            assert len(reader.pages) == expected_count and not list(reader.attachments) and not reader.is_encrypted
            assert not any(page.get("/Annots") for page in reader.pages)
            assert not reader.get_fields()
            catalogue_id = f"mmc{package}"
            catalogue = {"id": catalogue_id, "classLabel": cell_class, "entryCount": expected_count,
                "fileComponentId": component, "archiveName": name, "archiveBytes": len(archive),
                "archiveMd5": native["checksum"], "archiveSha256": digest(archive),
                "archiveDownloadReceipt": file_receipt(SOURCE / (name + ".receipt.json")),
                "memberName": member, "memberBytes": len(pdf), "memberSha256": digest(pdf),
                "sourceArchiveUrl": "https://pure.mpg.de" + native["content"],
                "embeddedFiles": 0, "interactive3DAnnotations": 0,
                "standaloneRawGeometryInArchive": False, "exactKohAnnotationVersionEstablished": False}
            doc["catalogues"].append(catalogue)
            prefix = temp / catalogue_id
            subprocess.run([str(POPLER), "-r", "96", "-png", str(SOURCE / member), str(prefix)], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            for index, page in enumerate(reader.pages):
                page_number = index + 1
                text = page.extract_text()
                matches = re.findall(r"(?m)^(Motoneuron|CiD|CoBL)\s+(\d{3})([^\n]*)", text)
                assert len(matches) == 1 and matches[0][0] == cell_class and int(matches[0][1]) == page_number
                assert not re.search(r"copyright|creative commons|licen[cs]e", text, re.I)
                source_label = f"{cell_class} {matches[0][1]}"
                header = source_label + matches[0][2]
                renders = list(temp.glob(f"{catalogue_id}-*{page_number:0{len(str(expected_count))}d}.png"))
                assert len(renders) == 1, (catalogue_id, page_number, renders)
                image = renders[0].read_bytes()
                assert image[:8] == b"\x89PNG\r\n\x1a\n"
                width = int.from_bytes(image[16:20], "big")
                height = int.from_bytes(image[20:24], "big")
                target_name = f"{catalogue_id}-page-{page_number:03d}.png"
                if write:
                    PUBLIC.mkdir(parents=True, exist_ok=True)
                    (PUBLIC / target_name).write_bytes(image)
                else:
                    assert (PUBLIC / target_name).read_bytes() == image, target_name
                doc["entries"].append({"key": f"{catalogue_id}:{source_label}", "catalogueId": catalogue_id,
                    "classLabel": cell_class, "sourceLabel": source_label, "sourceHeader": header,
                    "sourcePage": page_number, "sourcePdfMember": member,
                    "sourcePdfSha256": digest(pdf), "sourceComponentId": component,
                    "sourceLocator": f"{member}#page={page_number}",
                    "reportedFields": reported_fields(text), "sourcePageText": text,
                    "pageSizePoints": [float(page.mediabox.width), float(page.mediabox.height)],
                    "raster": {"url": f"/data/svara_catalogue_pages_v1/{target_name}",
                        "bytes": len(image), "sha256": digest(image), "widthPixels": width, "heightPixels": height}})
            print(f"{catalogue_id}: {expected_count} exact source pages verified", flush=True)
    doc["summary"] = {"catalogues": 3, "publicationEntries": len(doc["entries"]),
        "bySourceClass": {c["classLabel"]: c["entryCount"] for c in doc["catalogues"]},
        "rasterBytes": sum(e["raster"]["bytes"] for e in doc["entries"]),
        "maximumPageBytes": max(e["raster"]["bytes"] for e in doc["entries"]),
        "archiveBytes": sum(c["archiveBytes"] for c in doc["catalogues"]),
        "memberPdfBytes": sum(c["memberBytes"] for c in doc["catalogues"]),
        "unit": "published catalogue page entries, never a pooled biological cell/type census"}
    assert len(doc["entries"]) == 212 and len({e["key"] for e in doc["entries"]}) == 212
    if write:
        DOCUMENT.write_bytes(encoded(doc))
    else:
        assert DOCUMENT.read_bytes() == encoded(doc), "Source catalogue document differs"
    print(json.dumps({**doc["summary"], "mode": "write" if write else "exact_source_replay"}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    build(parser.parse_args().write)
