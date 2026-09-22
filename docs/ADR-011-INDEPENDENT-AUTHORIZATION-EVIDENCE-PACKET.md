# ADR-011: Independent authorization-evidence packet before any execution

**Status:** Accepted for candidate 2.7  
**Date:** 2026-08-26  
**Deciders:** OHRI Mouse Spinal Interneuron Atlas project team and independent curators

## Context

The public-data workbench can identify public source routes and prepare an object-specific authorization plan, but a landing page, a declared checksum, or a curator-transcribed statement is not an authenticated authorization. An execution path must preserve a clear Entity–Activity–Agent trail, a fixed object identity, reviewable terms, integrity evidence, and later retention conditions. W3C PROV-O supplies a general provenance vocabulary; SPDX treats licensing information as structured metadata; DataCite distinguishes metadata records from the data they describe; NIST FIPS 180-4 specifies SHA-2 hashing. These standards inform the packet fields but do not grant rights or validate any source object.

The candidate contains **0 registrations**. It uses public digital leads only and includes no OHRI internal experimental data, physical specimens, unpublished institutional records, source-object body, credential, local checksum, transform, or registration.

## Decision

Implement `UPG-020` as a browser-local independent authorization-evidence packet composer. It accepts only the two frozen metadata-manifest formats and creates a local JSON review request with:

- one declared but unacquired object and declared version;
- a linked `UPG-019` authorization-plan identifier;
- a proposed independent reviewer role and evidence locator;
- five planned stages: authority identity, object-specific terms/scope, authorized retrieval conditions, local integrity comparison, and content/retention review.

The packet status is `independent_authorization_evidence_packet_draft_only`; authority remains `not_authenticated_by_this_packet`; execution remains `not_executed_pending_independent_authorization`; and local verification remains `not_locally_verified`. The implementation makes no network request, download, upload, credential storage, persistence, checksum calculation, content inspection, retention, transform, registration, or automatic release.

## Options considered

| Option | Decision | Reason |
| --- | --- | --- |
| Treat public URLs or publisher claims as authorization | Rejected | Accessibility and a claim are not object-specific authorization. |
| Retrieve an object before independent review | Rejected | It would collapse review, acquisition, integrity, and retention decisions. |
| Store a rights decision or credential in the workbench | Rejected | The candidate is a local review tool, not an authorization system. |
| Export a non-executing review request | Chosen | It makes the missing independent evidence explicit without promoting status. |

## Consequences and queue

Curators can now review the exact request content before an external rights holder, institutional reviewer, or data steward is contacted. The export cannot be cited as an approval, verification result, permission, acquisition record, provenance package, or scientific result; it cannot authorize public deployment or public release. `UPG-021` remains research-watch: a separate, human-approved SOP may only be designed after an authenticated independent authorization record identifies the exact object, scope, terms, integrity comparison, and retention conditions. Any actual retrieval, storage, analysis, source linkage, transform, or `REG` decision remains outside this candidate and needs independent approval.

## References

- [W3C PROV-O](https://www.w3.org/TR/prov-o/)
- [SPDX specification 2.3](https://spdx.github.io/spdx-spec/v2.3/)
- [DataCite Metadata Schema 4.6](https://datacite-metadata-schema.readthedocs.io/en/4.6/)
- [NIST FIPS 180-4 Secure Hash Standard](https://csrc.nist.gov/pubs/fips/180-4/upd1/final)
