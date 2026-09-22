# ADR-004: Detached RO-Crate provenance export

**Status:** accepted for candidate 2.0  
**Decision scope:** public-data workbench candidate 2.0 only

## Context

The workbench must allow a curator to transfer machine-readable provenance for an individual public data lead without downloading an external object, placing it in the curator package, or suggesting a source-to-project registration. The former `UPG-014` queue record was an interoperability watch only.

The current [RO-Crate 1.3 structure specification](https://www.researchobject.org/ro-crate/specification/1.3/structure.html) defines a **Detached RO-Crate Package** as a standalone metadata document whose data entities are web-based. Its root-data-entity rules require a JSON-LD descriptor, a root `Dataset`, and a publication date. That model is appropriate for a source catalogue whose underlying research objects remain external.

## Decision

Candidate 2.0 ships a browser-local exporter for one selected public-source catalogue record at a time. It creates a deterministic RO-Crate 1.3 JSON-LD graph with:

- the required `ro-crate-metadata.json` descriptor and root `Dataset`;
- one HTTPS public source URL as the sole web data entity;
- accession, pinned version, catalogue access date, modalities, coverage, rights status, and source-specific limits; and
- an explicit metadata-only/unacquired/unregistered admission state.

This export does not authorize public deployment, public hosting, or public release of the workbench or any referenced source asset.

The browser download is named `<source>-ro-crate-metadata.json`, signalling a detached document rather than an attached data package. Local structural checks block a missing descriptor, a non-HTTPS or non-single external entity, local payload paths, local SHA fields, or a registration claim.

## Options considered

| Option | Decision |
|---|---|
| Attached RO-Crate containing referenced source data | Rejected: would imply data acquisition/bundling and require asset-level rights review. |
| Custom JSON export | Rejected: loses an established linked-data structure for curator handoff. |
| Detached RO-Crate metadata document | Accepted: portable source metadata without an external-object payload. |

## Consequences

`UPG-014` is now **in progress** as a bounded provenance-export capability. It does not close any source-specific object, rights, coordinate, biology, reuse, transform, or registration gate. Exported metadata must still be curator reviewed. The package retains **0 registrations**.

## Follow-up

Future work can add an independently selected RO-Crate profile validator only after its profile/version mapping and curator acceptance criteria are explicit. It must never turn a public URL, publisher checksum, or detached metadata record into local possession, reuse authorization, a spatial transform, or `REG`.
