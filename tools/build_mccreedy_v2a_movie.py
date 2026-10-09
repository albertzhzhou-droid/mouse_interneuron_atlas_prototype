"""Build one population-reference movie contract from pinned primary files."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/source-candidates/mccreedy-v2a-20261002"

def build():
    metadata = json.loads((SOURCE / "pmc-metadata.json").read_text())
    xml_bytes = (SOURCE / "article.xml").read_bytes()
    assert hashlib.md5(xml_bytes).hexdigest() == "1a9df57d9dbe686565d4c81c67b53d08"
    article = ET.fromstring(xml_bytes)
    assert metadata["pmcid"] == "PMC8366232" and metadata["version"] == 1
    assert metadata["doi"] == "10.3389/fncel.2021.684792" and not metadata["is_retracted"]
    movie = next(x for x in metadata["media_urls"] if "/Video_2.MP4?" in x)
    assert movie.endswith("?md5=52819657cc5afc44d9150c1c6a36490a")
    license_url = article.find(".//{http://www.niso.org/schemas/ali/1.0/}license_ref").text
    assert license_url == "https://creativecommons.org/licenses/by/4.0/"
    supplement = article.find(".//supplementary-material[@id='SM2']")
    assert supplement.find("media").get("{http://www.w3.org/1999/xlink}href") == "Video_2.MP4"
    caption = "".join(supplement.find("caption").itertext())
    original = (SOURCE / "Video_2.MP4").read_bytes()
    assert len(original) == 11361776
    assert hashlib.md5(original).hexdigest() == "52819657cc5afc44d9150c1c6a36490a"
    digest = hashlib.sha256(original).hexdigest()
    assert digest == "79e6aad7f4881228cdd1f3a46d908918bd276ca93b0e98d477a9f4f4f77b2f2e"
    assert (ROOT / "public/data/mccreedy_v2a_movie_v1/Video_2.MP4").read_bytes() == original
    probe = json.loads((SOURCE / "ffprobe.json").read_text())
    assert len(probe["streams"]) == 1
    stream = probe["streams"][0]
    assert (stream["codec_name"], stream["width"], stream["height"], stream["nb_read_frames"], stream["duration"], stream["avg_frame_rate"]) == ("h264", 1600, 1200, "400", "20.000000", "20/1")
    authors = [" ".join([x.findtext("given-names"), x.findtext("surname")]) for x in article.findall(".//article-meta/contrib-group/contrib/name")]
    return dict(schemaVersion="0.1.0", contractId="mccreedy-v2a-population-movie-0.1", sourceId="McCreedy:2021:Supplementary-Movie-2", releaseId="PMC8366232.1", upgradeId="UPG-170",
        title="Mouse V2a spinal population · source movie", representation="Observed population-level rendered lightsheet movie; source-local visual reference",
        citation=dict(title="Passive Clearing and 3D Lightsheet Imaging of the Intact and Injured Spinal Cord in Mice", authors=authors, year=2021, doi=metadata["doi"], articleUrl="https://www.frontiersin.org/journals/cellular-neuroscience/articles/10.3389/fncel.2021.684792/full", pmcid=metadata["pmcid"], supplement="Supplementary Movie 2", caption=caption),
        biologicalContext=dict(species="Mus musculus", tissue="cleared spinal cord", region="C1–L1", reporter="Chx10-Cre × Ai14 → Chx10:tdTomato", population="V2a interneurons", age="adult study context; exact movie age unknown", sex="unknown for this exact movie", specimenId=None, perCellIds=None),
        asset=dict(url="/data/mccreedy_v2a_movie_v1/Video_2.MP4", originalUrl="https://pmc-oa-opendata.s3.amazonaws.com/PMC8366232.1/Video_2.MP4", name="Video_2.MP4", bytes=len(original), md5=hashlib.md5(original).hexdigest(), sha256=digest, mime="video/mp4", modified=False),
        encodedMedia=dict(codec="h264", width=1600, height=1200, durationSeconds=20, frames=400, frameRate=20, audioStreams=0, temporalMeaning="Movie playback seconds; not acquisition time, z, biological time or physical distance"),
        rights=dict(license="CC BY 4.0", url=license_url, basis="Exact article XML license and SM2 media attribution, plus the PMC versioned media inventory; no separate movie license field", attribution="McCreedy et al. (2021), Frontiers in Cellular Neuroscience 15:684792, Supplementary Movie 2, DOI 10.3389/fncel.2021.684792", modification="Original MP4 bytes unchanged; surrounding playback interface and receipts added", scope="This exact supplement only"),
        boundaries=["No raw stack, voxel calibration, segmentation, registration transform or per-cell identity admitted from this movie", "No single-cell or type archetype, complete axon, quantitative 3D volume, membrane, organelle, synapse or inferred missing geometry", "Movie perspective and rotation are baked source rendering; playback does not provide an editable 3D camera", "Population reference is outside the canonical molecular type/cell census; zero new type profiles or physical cells"],
        originalReceipts=[json.loads((SOURCE / (name + ".receipt.json")).read_text()) for name in ["pmc-metadata.json", "article.xml", "Video_2.MP4"]],
        verification=dict(fullSourceDecode="400 frames, actual ffmpeg exit 0; source decoding is a build check, not browser full-frame verification", sourceXmlSha256=hashlib.sha256(xml_bytes).hexdigest()))

if __name__ == "__main__":
    value = build()
    target = ROOT / "data/mccreedy-v2a-movie-0.1.json"
    target.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"bytes": value["asset"]["bytes"], "frames": value["encodedMedia"]["frames"], "authors": len(value["citation"]["authors"])}))
