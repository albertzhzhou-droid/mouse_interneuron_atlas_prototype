# ADR-010: Authorization-and-verification plan before execution

**Status:** Accepted for candidate 2.6  
**Date:** 2026-08-20  
**Deciders:** Public-data workbench maintainers and independent curator-review workflow

## Context

The workbench is limited to public digital sources, but public availability is not permission to acquire, reuse, redistribute, retain, transform, or register an object. Candidate 2.5 could record an unverified source assertion. The next missing review artifact was a reproducible plan that binds a future, separately authorized action to one declared object without pretending that the plan is the authorization or the verification.

Provenance vocabulary and evidence attribution are informed by [W3C PROV-O](https://www.w3.org/TR/prov-o/); identifier/version descriptions by [DataCite Metadata Schema](https://datacite-metadata-schema.readthedocs.io/en/4.6/); licence expression vocabulary by [SPDX 2.3](https://spdx.github.io/spdx-spec/v2.3/); and checksum terminology by [NIST FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final). These references inform a bounded local record, not an assertion that a source object has been authenticated or licensed for use.

## Decision

Implement UPG-019 as a browser-local authorization-and-local-verification plan composer for only the existing SpinalJ 0.7.0 and Cano-Gomez 0.8.0 metadata-manifest formats.

Every exported plan must name one manifest file ID, its declared source URL and source checksum, an asserted object version, a linked PSA provenance receipt identifier, an intended use, a requested—not granted—rights disposition, an evidence locator, planned content scope, curator ID and date. It must list exactly these stages, each as planned and not executed:

1. Object identity confirmation.
2. Object-specific rights review.
3. Authorized acquisition record.
4. Local checksum verification.
5. Content-scope validation.

The plan is structurally non-promoting: it always reports a plan-only state, not authorized by the plan, not locally verified, no acquired/bundled object, no calculated local checksum, no inspected content, and zero registrations. It makes no network request, upload, download, persistent write, source-file read, checksum calculation, or coordinate operation.

## Options considered

| Option | Decision | Reason |
| --- | --- | --- |
| Treat a URL, generic repository licence, or publisher checksum as permission | Rejected | It does not establish object-specific scope, an authorized retrieval event, or a locally verified byte stream. |
| Add automatic retrieval and hashing now | Rejected | That would expand authority, touch external data, and conflate a plan with independently authorized execution. |
| Keep UPG-019 as prose only | Rejected | Curators need a fixed, exportable object-level record to review the missing gates consistently. |
| Export a local plan with explicit non-promotion | Accepted | It records what must be decided later while preserving public-source-only and zero-REG boundaries. |

## Trade-off analysis

The composer deliberately adds form fields and an extra review receipt without producing a newly usable source asset. That friction is intentional: it prevents a publicly visible record from being mistaken for a grant of rights or a successful integrity check. The contract can support a later independent review packet, but cannot bypass it.

## Consequences

Curators can now inspect a concrete planned chain from an assertion ID to one object, rights evidence and verification stages. They cannot use this UI or JSON to authorize access, execute a download, certify a checksum, inspect content, redistribute an asset, establish a biological relation, transform coordinates, create REG, or authorize public deployment.

## Action items

1. Maintain UPG-020 as a research-watch item for an independently reviewed authorization-evidence packet and separately approved local-verification execution protocol.
2. Require exact object/version, rights statement and permitted scope; distinguish publisher claims from local checks; and obtain separate retention/audit authority before any future execution design is approved.
3. Keep any transformation, cross-study relation, biological inference, and registration decision outside that workflow.
