# ADR-006: Two-lane evidence and public-source provenance trace

**Status:** accepted for candidate 2.2  
**Decision scope:** public-data workbench candidate 2.2 only

## Context

The workbench contains two useful but non-interchangeable kinds of records: frozen Research MVP entity/claim/condition/statement/source references, and public-source feasibility axes/routes/catalogue entries. Curators need to inspect both without treating a shared label, a visual co-display, or an adjacent card as a source-object connection, same-cell observation, coordinate transform, causal extension, reuse authorization, or registration.

W3C PROV-O supplies the useful discipline of typed entities and explicit provenance relationships, but it cannot justify a relationship not present in the source record. This candidate therefore uses a deliberately smaller, browser-local representation rather than exporting a graph that could look like a biological integration claim.

## Decision

Candidate 2.2 provides `UPG-016`, a two-lane trace explorer and local JSON receipt.

- The Research MVP lane derives the declared `entity → claim → condition → statement/source` chain for the main-atlas selection.
- The public-source lane derives the selected feasibility-planner `axis → route → public source` chain.
- The interface displays a **NO CROSS-LANE EDGE** policy. It creates no edge between lanes and exports that policy with each receipt.

The feature runs entirely in the browser. It makes no network request; does not upload, download, inspect, hash, persist, transform, align, combine, analyse, or bundle source objects; and creates zero `REG` objects.

This decision does not authorize public deployment, public hosting, public release, data acquisition, or redistribution.

## Consequences

Curators can trace why a frozen claim is bounded by a condition and which source-specific routes are only planning leads. The feature is intentionally not an interoperability layer, a data adapter, a cell identity resolver, a coordinate registration workflow, or a biological graph.

`UPG-016` remains in progress as an evidence-boundary audit capability. Any future source acquisition, cross-study linkage, or registration proposal requires its own object-level rights, provenance, and validation gate.

## Alternatives considered

- A single merged graph: rejected because a graph edge would be too easy to read as a biological or spatial relationship.
- An untyped textual reference list: rejected because it obscures whether a record is a condition, statement, planning axis, or source-specific route.
- Automatic source-object retrieval: rejected because this candidate is public-data-only and offline-reviewable; provenance documentation is not acquisition.

## Evidence and validation

- [W3C PROV-O](https://www.w3.org/TR/prov-o/) defines typed provenance concepts and relations; this candidate preserves only declared, local references.
- [W3C PROV Constraints](https://www.w3.org/TR/prov-constraints/) motivates maintaining internally consistent, explicit trace statements.
- `node scripts/validate-evidence-provenance-trace-0.1.mjs` validates the contract and release locks.
- `node --test tests/evidence-provenance-trace.test.mjs` checks typed lane derivation, no-acquisition/zero-registration receipt fields, and the no-cross-lane policy.
