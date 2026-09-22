# ADR-009: Assertion-level provenance before source-object admission

**Status:** Accepted  
**Date:** 2026-08-20  
**Deciders:** Project lead and independent curators

## Context

`UPG-006` can evaluate a frozen metadata manifest without acquiring its source object. A complete checklist, however, still needs an explicit answer to a different question: who supplied a particular value, what object (or explicit unknown) does that statement concern, where can the statement be located, and when did a curator transcribe or review it?

Without that separation, a URL, landing page, checksum text, or curator note can accidentally look like verified possession, reuse authorization, biological truth, or a source-to-project relationship. The design therefore uses the Entity–Activity–Agent distinction expressed by [W3C PROV-O](https://www.w3.org/TR/prov-o/) as a bounded inspiration. It is not a full PROV implementation. It preserves the identifier, version, rights-related metadata and provenance fields relevant to later review, in the spirit of [DataCite Metadata Schema 4.6](https://datacite-metadata-schema.readthedocs.io/en/4.6/), without claiming that a source object is present locally.

## Decision

Implement `UPG-018` as a browser-local assertion-provenance composer for only the two frozen, metadata-only manifest/source pairs accepted by `UPG-006`.

| Record element | Required representation | Promotion boundary |
| --- | --- | --- |
| Subject entity | A declared unacquired manifest file ID or explicit `unknown` | Never establishes file possession. |
| Assertion | One required admission check and a typed claim scope | May be publisher-asserted, curator-transcribed, or unresolved only. |
| Evidence locator | Publisher object URL, dataset landing page, source metadata field, or curator note | Does not authenticate the located statement. |
| Activity and agent | Local curator ID and ISO review date | Records review/transcription, not independent verification. |
| Receipt result | `not_locally_verified`, `not_admitted_pending_curator_object_and_rights_review`, `0 REG` | Cannot authorize reuse, download, transform, relationship, or registration. |

The application exports a local JSON receipt only. It makes no network request; does not download, upload, inspect, hash, bundle, or persist a source object; and does not perform a coordinate transform, cross-study relation, scientific analysis, or registration. The candidate contains zero registrations.

## Options considered

### A. Typed local assertion-provenance receipt — selected

| Dimension | Outcome |
| --- | --- |
| Attribution | Keeps an asserted source value separate from the curator activity that records it. |
| Auditability | A receipt retains subject, scope, locator, source state, reviewer, and time. |
| Safety | No assertion state can say locally verified, admitted, authorized, acquired, or registered. |
| Reproducibility | Frozen format support and receipt semantics are testable offline. |

### B. One free-text provenance note on the manifest

| Dimension | Outcome |
| --- | --- |
| Benefit | Smallest interface. |
| Rejection reason | Cannot reliably distinguish subject identity, claim scope, provenance state, locator, activity, and reviewer. |

### C. Retrieve linked URLs to validate assertions automatically

| Dimension | Outcome |
| --- | --- |
| Benefit | Could examine a currently reachable web response. |
| Rejection reason | A URL response is not a fixed source object, rights decision, acquisition authorization, local checksum, biological validation, or atlas registration. It also violates the offline review boundary. |

## Trade-off analysis

The selected record is deliberately narrow: it makes provenance ambiguity visible while leaving the source object unacquired. Curators must enter values that might otherwise be silently assumed, including explicit unknowns. This adds review work but prevents a metadata manifest from becoming an accidental admission mechanism.

## Consequences

- A curator can export a structured assertion record without installing dependencies or contacting a remote host.
- A publisher assertion remains an assertion; a curator transcription remains a transcription.
- The receipt cannot alter UPG-006's `not_admitted` result or create a rights decision.
- Source objects remain unacquired and unbundled; local checksum calculation remains false.
- The workbench remains public-source-only, browser-local and at `0 REG`.

## Action items

1. Curators should use one receipt per contested or material admission field and retain explicit unresolved values where evidence is incomplete.
2. Do not treat an exported receipt as source-object authentication, reuse authorization, coordinate authority, biological validation, or a cross-study relationship.
3. Do not use an assertion receipt as authorization for public deployment or public release.
4. Evaluate `UPG-019` before any future authorized acquisition or reproducible local checksum step. That gate must require one fixed public object identity/version and an object-specific reuse or redistribution decision.

## References

- W3C. [PROV-O: The PROV Ontology](https://www.w3.org/TR/prov-o/).
- W3C. [PROV-Constraints](https://www.w3.org/TR/prov-constraints/).
- DataCite. [Metadata Schema Documentation 4.6](https://datacite-metadata-schema.readthedocs.io/en/4.6/).
- SPDX. [SPDX Specification 2.3](https://spdx.github.io/spdx-spec/v2.3/).
