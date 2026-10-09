"""Acquire four exact public MPG v7 supplementary components, without executing them."""
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "data/source-candidates/svara-contacts-20261002"
META = ROOT / "data/source-candidates/svara-supplements-20261002/item-metadata.json"
WRAPPER = ROOT / "data/source-candidates/freidok-145135-20261002/ScienceDirect_files_19May2021_13-55-38.781.zip"

def main():
    metadata = json.loads(META.read_bytes())
    assert metadata["objectId"] == "item_3055210" and metadata["versionNumber"] == 7
    assert metadata["versionState"] == "RELEASED"
    assert {x["id"] for x in metadata["metadata"]["identifiers"] if x["type"] == "DOI"} == {"10.1016/j.celrep.2018.05.023"}
    DEST.mkdir(exist_ok=True)
    with zipfile.ZipFile(WRAPPER) as aggregate:
        for component_id in range(3055226, 3055230):
            item = next(x for x in metadata["files"] if x["objectId"] == f"file_{component_id}")
            assert item["visibility"] == "PUBLIC" and item["checksumAlgorithm"] == "MD5"
            assert item["metadata"]["contentCategory"] == "supplementary-material"
            url = "https://pure.mpg.de" + item["content"]
            path = DEST / item["name"]
            receipt_path = DEST / (item["name"] + ".receipt.json")
            assert not path.exists() and not receipt_path.exists(), "Preserve any prior acquisition"
            with urllib.request.urlopen(url, timeout=60) as response:
                data = response.read(item["size"] + 1)
                status = response.status
                final_url = response.url.split("?", 1)[0]
                content_type = response.headers.get("Content-Type")
            assert status == 200 and len(data) == item["size"]
            assert hashlib.md5(data).hexdigest() == item["checksum"]
            assert data == aggregate.read(item["name"]), "Official component differs from wrapper member"
            path.write_bytes(data)
            receipt = {"sourceUrl": url, "finalUrlWithoutQuery": final_url, "status": status,
                       "retrievedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                       "contentType": content_type, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
                       "md5": hashlib.md5(data).hexdigest(), "componentId": item["objectId"],
                       "releaseId": "MPG:item_3055210:7", "publishedSizeAndMd5Verified": True,
                       "byteIdenticalToFreidokAggregateMember": True,
                       "freidokWrapperRedistributionAdmitted": False}
            receipt_path.write_text(json.dumps(receipt, indent=2) + "\n")
            print(json.dumps(receipt))

if __name__ == "__main__":
    main()
