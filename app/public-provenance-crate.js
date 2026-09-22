const RO_CRATE_CONTEXT = "https://w3id.org/ro/crate/1.3/context";
const RO_CRATE_SPECIFICATION = "https://w3id.org/ro/crate/1.3";

function sourceSlug(sourceId) {
  return sourceId.toLowerCase().replaceAll("_", "-");
}

export function detachedCrateFilename(sourceId) {
  return "ohri-" + sourceSlug(sourceId) + "-ro-crate-metadata.json";
}

export function buildDetachedPublicProvenanceCrate({ source, catalog, contract }) {
  if (!source || !catalog || !contract) throw new Error("source, catalog and exporter contract are required");
  if (!contract.publicSourceIds.includes(source.id)) throw new Error("source is not eligible for detached provenance export");
  if (!source.provenance?.sourceUrl?.startsWith("https://")) throw new Error("source must have an HTTPS public URL");
  if (contract.packagingMode !== "detached_metadata_document") throw new Error("only detached metadata documents are supported");

  const externalId = source.provenance.sourceUrl;
  const stateId = "#" + sourceSlug(source.id) + "-external-metadata-state";
  const rightsId = "#" + sourceSlug(source.id) + "-rights-record";
  const accessId = "#" + sourceSlug(source.id) + "-catalog-access-verified-on";
  const licenseId = "#metadata-use-policy";
  const sourceState = "catalogued_public_metadata_only_unacquired_unregistered";
  const sourceBoundary = [
    source.admissibleUse,
    ...source.prohibitedClaims,
    ...source.nextChecks,
  ].join(" ");

  return {
    "@context": contract.roCrateContext,
    "@graph": [
      {
        "@id": "ro-crate-metadata.json",
        "@type": "CreativeWork",
        "about": { "@id": "./" },
        "conformsTo": { "@id": contract.roCrateSpecification },
        "name": "OHRI public-source detached provenance metadata",
      },
      {
        "@id": "./",
        "@type": "Dataset",
        "name": "OHRI public-source provenance record: " + source.title,
        "description": "Detached RO-Crate metadata for one catalogued public source. It references an external public URL only; no source object is acquired, embedded, bundled, transformed or registered.",
        "datePublished": catalog.catalogDate,
        "license": { "@id": licenseId },
        "hasPart": [{ "@id": externalId }],
        "additionalProperty": [{ "@id": stateId }],
      },
      {
        "@id": externalId,
        "@type": "Dataset",
        "name": source.title,
        "identifier": source.provenance.accession,
        "version": source.provenance.version,
        "url": externalId,
        "measurementTechnique": source.content.modalities,
        "spatialCoverage": source.content.spinalCoverage,
        "conditionsOfAccess": source.rights.note,
        "additionalProperty": [{ "@id": stateId }, { "@id": rightsId }, { "@id": accessId }],
        "description": sourceBoundary,
      },
      {
        "@id": stateId,
        "@type": "PropertyValue",
        "name": "External-source admission state",
        "propertyID": "ohri:source-admission-state",
        "value": sourceState,
        "description": "Public catalog metadata only; no source body is present in this detached RO-Crate and project registration count is zero.",
      },
      {
        "@id": rightsId,
        "@type": "PropertyValue",
        "name": "Catalogued source rights status",
        "propertyID": "ohri:source-rights-status",
        "value": source.rights.status,
        "description": source.rights.note,
      },
      {
        "@id": accessId,
        "@type": "PropertyValue",
        "name": "Catalog source access verification date",
        "propertyID": "ohri:catalog-access-verified-on",
        "value": source.provenance.accessVerifiedOn,
        "description": "Date on which this project's public metadata record verified the source URL; it is not a claim about the source object's publication or modification date.",
      },
      {
        "@id": licenseId,
        "@type": "CreativeWork",
        "name": "Metadata-only private curator review policy",
        "description": "This document records public-source metadata. It grants no authorization to redistribute, reuse or obtain any referenced source asset.",
      },
    ],
  };
}

export function validateDetachedPublicProvenanceCrate(crate, contract) {
  const errors = [];
  if (!crate || crate["@context"] !== RO_CRATE_CONTEXT || crate["@context"] !== contract.roCrateContext) errors.push("RO-Crate context is not pinned to 1.3");
  if (!Array.isArray(crate?.["@graph"])) errors.push("RO-Crate graph is missing");
  const graph = Array.isArray(crate?.["@graph"]) ? crate["@graph"] : [];
  const byId = new Map(graph.filter((entity) => entity && typeof entity === "object").map((entity) => [entity["@id"], entity]));
  const descriptor = byId.get("ro-crate-metadata.json");
  const root = byId.get("./");
  if (descriptor?.["@type"] !== "CreativeWork" || descriptor?.about?.["@id"] !== "./" || descriptor?.conformsTo?.["@id"] !== RO_CRATE_SPECIFICATION) errors.push("RO-Crate descriptor is incomplete");
  if (root?.["@type"] !== "Dataset" || typeof root?.datePublished !== "string" || !root?.license?.["@id"]) errors.push("RO-Crate root dataset is incomplete");
  const externalParts = Array.isArray(root?.hasPart) ? root.hasPart : [];
  if (externalParts.length !== 1 || !/^https:\/\//.test(externalParts[0]?.["@id"] ?? "")) errors.push("detached crate must reference exactly one HTTPS web data entity");
  if (graph.some((entity) => typeof entity?.["@id"] === "string" && !entity["@id"].startsWith("#") && !["./", "ro-crate-metadata.json"].includes(entity["@id"]) && !entity["@id"].startsWith("https://"))) errors.push("detached crate may not contain local payload paths");
  if (JSON.stringify(crate).match(/"registrationStatus"\s*:\s*"registered"|"localSha256"/i)) errors.push("crate must not claim registration or local hashes");
  return errors;
}
