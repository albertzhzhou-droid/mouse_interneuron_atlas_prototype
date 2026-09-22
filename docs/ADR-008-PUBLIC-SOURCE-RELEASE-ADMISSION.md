# ADR-008: Deterministic metadata-only public-source release-admission review

**Status:** Accepted  
**Date:** 2026-08-20  
**Deciders:** Project lead and independent curators

## Context

The public-data workbench previously accepted two narrow, locally authored metadata-manifest formats: SpinalJ `0.7.0` and Cano-Gomez `0.8.0`. That intake records publisher URLs, declared checksums, coordinate fields, and missingness. It must not cause a user to read a complete-looking manifest as proof that the referenced public source object was acquired, inspected, locally hashed, licensed for reuse, or registered to the project.

The upgrade needs a deterministic, exportable review result that keeps the asserted source object, the local review activity, and the responsible curator decision distinct. This is consistent with the Entity–Activity–Agent separation in W3C PROV-O and with preserving source identifiers, version, rights, and provenance metadata without implying local possession in DataCite-style records. The workbench remains public-source-only, browser-local, at `0 REG`, and with zero registrations.

## Decision

Implement `UPG-006` as a browser-local review service over only the frozen manifest/source pairs:

| Manifest format | Source | Review result |
| --- | --- | --- |
| `0.7.0` | `PDS-SPINALJ-PROCESSED` | Metadata checks are recorded; object and rights admission remains pending independent curator review. |
| `0.8.0` | `PDS-CANOGOMEZ-2026` | The same result, additionally retaining specimen, source-frame, and preprint disclosure checks. |

The service produces a `not_admitted_pending_curator_object_and_rights_review` JSON receipt. It records declared values as metadata only and marks asset-level rights review as independently required. The service does not acquire or inspect a source object. It exposes no network request, source-file upload or download, persistent storage, local checksum calculation, transform, bundle, or registration path.

## Options considered

### A. Deterministic metadata-only review receipt — selected

| Dimension | Outcome |
| --- | --- |
| Scientific meaning | Separates declared metadata from verified object-level evidence. |
| Rights | Cannot grant reuse or redistribution permission. |
| Reproducibility | Frozen input formats and a versioned receipt are testable offline. |
| Registration risk | No coordinate transform and no `REG` creation path. |

### B. Automatically download or hash each linked public object

| Dimension | Outcome |
| --- | --- |
| Benefit | Could establish local bytes for specifically authorized objects. |
| Rejection reason | Requires an object-level authorization, exact object identity, storage policy, and a new independent review gate; it is outside the public metadata-only candidate. |

### C. Treat the imported manifest as an admission decision

| Dimension | Outcome |
| --- | --- |
| Benefit | Minimal interface work. |
| Rejection reason | Conflates curator-entered metadata, publisher assertions, file possession, rights, and scientific validity. |

## Trade-offs

The selected design intentionally cannot accelerate data acquisition. A receipt may say that metadata is complete for curator review while the source remains not admitted. That additional friction is necessary to prevent a URL, checksum declaration, or source frame from being mistaken for reuse authorization, a biological conclusion, a cross-study relationship, or an atlas registration.

## Consequences

- Curators can inspect a stable checklist and export a local receipt without installing dependencies or contacting a source host.
- The receipt does not authenticate a publisher assertion or replace a license assessment.
- A source object remains unacquired and unbundled; local SHA-256 remains uncalculated.
- The implementation cannot change the frozen evidence lane, establish a cross-lane edge, or create `REG`.
- `UPG-018` is queued to add assertion-level provenance and evidence locators before any broader admission workflow is considered.

## Action items

1. Curators independently confirm exact source-object identity and asset-level rights before any separately authorized acquisition.
2. Record publisher-asserted, curator-transcribed, locally verified, and unresolved fields with evidence locators through `UPG-018`.
3. Do not promote a receipt to asset admission, public deployment, coordinate transform, biological truth, or registration without a new reviewed decision.

## References

- W3C. *PROV-O: The PROV Ontology*. https://www.w3.org/TR/prov-o/
- DataCite. *Metadata Schema Documentation 4.6*. https://datacite-metadata-schema.readthedocs.io/en/4.6/
