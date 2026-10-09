"""UPG-253/247: bounded publication discovery from pinned, local receipts."""
from __future__ import annotations

import collections
import hashlib
import json
from pathlib import Path
import re
import unicodedata
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data/source-candidates/neuromorpho-publication-discovery-20260929"
OUTPUT = ROOT / "data/neuromorpho-publication-discovery-audit-0.1.json"


def normalized_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()).strip()


def read_pubmed(path: Path) -> dict[str, dict]:
    papers = {}
    for article in ET.parse(path).findall("./PubmedArticle"):
        citation = article.find("./MedlineCitation")
        pmid = citation.findtext("PMID")
        title = "".join(citation.find("./Article/ArticleTitle").itertext())
        ids = article.findall("./PubmedData/ArticleIdList/ArticleId")
        authors = []
        for author in citation.findall("./Article/AuthorList/Author"):
            surname = author.findtext("LastName")
            initials = author.findtext("Initials")
            if surname and initials:
                authors.append({"surname": surname, "initials": initials, "normalizedKey": normalized_text(surname + " " + initials)})
        papers[pmid] = {"pmid": pmid, "titleRaw": title, "normalizedTitle": normalized_text(title),
                        "dois": [i.text.lower() for i in ids if i.attrib.get("IdType") == "doi"],
                        "pmcids": [i.text for i in ids if i.attrib.get("IdType") == "pmc"],
                        "authors": authors, "locator": f"pubmed-publication-metadata.xml/PubmedArticle[PMID={pmid}]/MedlineCitation/Article",
                        "officialUrl": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"}
    return papers


def build_audit() -> dict:
    receipts = json.loads((INPUT / "download-receipt.json").read_text())
    for receipt in receipts:
        path = ROOT / receipt["path"]
        if path.stat().st_size != receipt["bytes"] or hashlib.sha256(path.read_bytes()).hexdigest() != receipt["sha256"]:
            raise ValueError(f"Receipt mismatch {path}")
    baseline = json.loads((ROOT / "data/neuromorpho-type-source-doi-overlap-audit-0.1.json").read_text())
    universe = json.loads((ROOT / "public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json").read_text())
    routes = json.loads((ROOT / "data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json").read_text())["routes"]
    papers = read_pubmed(INPUT / "pubmed-publication-metadata.xml")
    taxonomy = []
    for source in baseline["rows"]:
        search = ET.parse(INPUT / (source["namespace"].split(":")[0] + "-esearch.xml"))
        candidates = [papers[n.text] for n in search.findall("./IdList/Id")]
        exact = [p for p in candidates if source["sourcePublicationDoi"].lower() in p["dois"]]
        if len(exact) != 1:
            raise ValueError(f"Ambiguous/unresolved taxonomy publication {source['namespace']}")
        taxonomy.append({"namespace": source["namespace"], "taxonomyPath": source["taxonomyPath"],
                         "sourceProfileCount": source["sourceProfileCount"], "sourcePublicationDoiRaw": source["sourcePublicationDoi"],
                         "resolvedPublication": exact[0]})
    records = [{"neuronId": r["neuronId"], "nameRaw": r["officialMetadata"]["neuron_name"], "archiveRaw": r["officialMetadata"]["archive"],
                "release": "8.6.124", "referencePmidRaw": r["sourcePaper"]["pmids"], "referenceDoiRaw": r["sourcePaper"]["dois"],
                "locator": f"public/data/neuromorpho_release_8_6_124_no_age_universe_v1/universe-index.json/records[neuronId={r['neuronId']}]/sourcePaper"}
               for r in universe["records"]]
    records += [{"neuronId": r["sourceRecord"]["neuronId"], "nameRaw": r["sourceRecord"]["neuronName"], "archiveRaw": r["sourceRecord"]["archive"],
                 "release": "8.6.126", "referencePmidRaw": r["sourceRecord"]["repositoryReferenceFieldsRaw"]["reference_pmid"],
                 "referenceDoiRaw": r["sourceRecord"]["repositoryReferenceFieldsRaw"]["reference_doi"],
                 "locator": f"data/neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.json/routes[sourceRecord.neuronId={r['sourceRecord']['neuronId']}]/sourceRecord/repositoryReferenceFieldsRaw"}
                for r in routes]
    if len({r["neuronId"] for r in records}) != len(records):
        raise ValueError("Overlapping release record sets")
    discovery = []
    for record in records:
        cited = [papers[p] for p in record["referencePmidRaw"] if p in papers]
        exact_matches = []
        weak = []
        for source in taxonomy:
            pub = source["resolvedPublication"]
            for morph in cited:
                method = []
                if morph["pmid"] == pub["pmid"]:
                    method.append("exact_pmid")
                if morph["normalizedTitle"] == pub["normalizedTitle"]:
                    method.append("exact_normalized_title")
                if method:
                    exact_matches.append({"namespace": source["namespace"], "morphologyPmid": morph["pmid"], "methods": method})
                shared = sorted({a["normalizedKey"] for a in morph["authors"]} & {a["normalizedKey"] for a in pub["authors"]})
                if shared:
                    weak.append({"namespace": source["namespace"], "morphologyPmid": morph["pmid"], "sharedAuthorKeys": shared,
                                 "status": "shared_author_candidate_only_not_publication_or_object_identity"})
        status = "matched" if exact_matches else "unmatched" if cited else "unassessable"
        discovery.append({**record, "publicationDiscoveryStatus": status,
                          "reason": "Exact PMID/title publication candidate only; specimen/figure evidence remains mandatory" if exact_matches else
                                    "No exact PMID or normalized-title equality in the pinned ten-publication set" if cited else
                                    "Source references do not resolve to a validated citable publication; raw 2017 is not substituted with the candidate article PMID",
                          "exactPublicationCandidates": exact_matches, "sharedAuthorCandidates": weak,
                          "supplementFilenameScreen": {"status": "unassessable", "reason": "No source-deposited figure/supplement filename crosswalk is exposed by the pinned NeuroMorpho record schema; SWC neuron names are not such a crosswalk."},
                          "exactObjectCrosswalk": {"status": "unassessable", "publication": None, "animalOrSpecimen": None, "figureOrSupplement": None,
                                                   "laminaAssignment": None, "identityAdmitted": False}})
    current = json.loads((INPUT / "current-todd-query.json").read_text())
    old = json.loads((ROOT / "data/source-candidates/neuromorpho-release-8-6-126-todd-nts-v1/official-current-query-response.json").read_text())
    if current["page"]["totalPages"] != 1 or current["page"]["totalElements"] != len(current["_embedded"]["neuronResources"]):
        raise ValueError("Current Todd query is incomplete")
    by_id = {r["neuron_id"]: r for r in current["_embedded"]["neuronResources"]}
    old_ids = {r["neuron_id"] for r in old["_embedded"]["neuronResources"]}
    exact_todd = []
    for route in routes:
        record = by_id[route["sourceRecord"]["neuronId"]]
        exact_todd.append({"neuronId": record["neuron_id"], "referenceDoiRaw": record.get("reference_doi"),
                           "referencePmidRaw": record.get("reference_pmid"), "neuronNameRaw": record["neuron_name"],
                           "exactPublicationAnimalFigureLaminaCrosswalk": None,
                           "locator": f"current-todd-query.json/_embedded/neuronResources[neuron_id={record['neuron_id']}]"})
    candidate = read_pubmed(INPUT / "candidate-todd-study-pubmed.xml")["42454582"]
    candidate["locator"] = "candidate-todd-study-pubmed.xml/PubmedArticle[PMID=42454582]/MedlineCitation/Article"
    return {"schemaVersion": "0.1.0", "auditId": "neuromorpho-publication-discovery-audit-0.1", "researchUpgradeIds": ["UPG-253", "UPG-247"],
            "auditDate": "2026-09-29", "scope": "Bounded PMID, normalized-title and conservative surname-plus-initials discovery across the existing 1097-record release and separate 30-record Todd increment; no global no-match claim.",
            "method": {"pmid": "Read exact source-native PMID and validate against official PubMed; compare equality.",
                       "title": "Unicode NFKD, ASCII accent fold, lowercase, punctuation to space, trim; exact full-title equality only, with raw titles retained.",
                       "author": "Exact accent-folded surname plus all provided initials; shared author produces a weak discovery candidate only.",
                       "supplement": "Preserve missing crosswalk field as unassessable; no heuristic assignment from neuron_name, date-like name components, DOI or cohort size.",
                       "objectAdmission": "Publication, explicit source-object ID, specimen/animal, figure/supplement and applicable rights must all be crosswalked. This screen admits no such relationship."},
            "inputReceipts": receipts, "taxonomyPublications": taxonomy, "resolvedPublications": list(papers.values()),
            "summary": {"taxonomyPublicationCount": len(taxonomy), "sourceProfileCountUnchanged": sum(r["sourceProfileCount"] for r in taxonomy),
                        "frozenMorphologyRecordCount": len(universe["records"]), "independentToddRecordCount": len(routes), "screenedUniqueRecordCount": len(records),
                        "publicationStatusCounts": dict(collections.Counter(r["publicationDiscoveryStatus"] for r in discovery)),
                        "exactPmidCandidateRecordCount": sum(any('exact_pmid' in c['methods'] for c in r['exactPublicationCandidates']) for r in discovery),
                        "exactNormalizedTitleCandidateRecordCount": sum(any('exact_normalized_title' in c['methods'] for c in r['exactPublicationCandidates']) for r in discovery),
                        "sharedAuthorOnlyCandidateRecordCount": sum(bool(r["sharedAuthorCandidates"]) for r in discovery),
                        "supplementFilenameUnassessableRecordCount": len(discovery), "exactObjectCrosswalksAdmitted": 0,
                        "sameCellJoins": 0, "geometryObjectsAdmitted": 0, "internalObjectsAdmitted": 0, "denominatorChange": 0},
            "records": discovery,
            "toddRefresh": {"completeCurrentQueryCount": current["page"]["totalElements"], "addedIdsSincePinnedQuery": sorted(set(by_id)-old_ids),
                            "removedIdsSincePinnedQuery": sorted(old_ids-set(by_id)), "exactIncrementRecords": exact_todd,
                            "candidateStudyCitationResolved": candidate, "candidateRelation": "context_only_exact_record_crosswalk_unverified",
                            "candidateArticleUrl": "https://journals.sagepub.com/doi/10.1177/17448069261468203",
                            "articleReviewLocators": ["Materials and methods/Morphology of neurotensin cells: three female mice, ten reconstructions each; no NMO IDs or native filenames identified", "Data availability statement: data available from corresponding authors on reasonable request"],
                            "sourceApiReferenceValuesReplaced": False, "authorsContacted": False},
            "boundary": ["A publication candidate is not a molecular subtype match or the same physical cell.",
                         "Negative PMID/title/author screens apply only to these fixed records and ten source publications; they do not prove no mapping exists elsewhere.",
                         "The candidate neurotensin article's PubMed ID 42454582 is a resolved article citation only. It is never assigned to NMO 322379–322408 without an explicit crosswalk.",
                         "Missing specimen/animal, figure, supplement and lamina fields remain unresolved; date-like neuron names and cohort lamina proportions are not used to fill them."]}


if __name__ == "__main__":
    audit = build_audit()
    OUTPUT.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(audit["summary"], indent=2))
