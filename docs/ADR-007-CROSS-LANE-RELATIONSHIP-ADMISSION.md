# ADR-007: Cross-lane relationship admission proposal gate

**Status:** accepted for candidate 2.3  
**Decision scope:** public-data workbench candidate 2.3 only
**Registration count:** 0 registrations

This decision does not authorize public deployment, public hosting, or public release.

## Context

The workbench already displays two deliberately separate provenance lanes: frozen Research MVP evidence references and public-source planning records. Curators may reasonably want to state what evidence a future relationship would require. A generic annotation field, merged graph, or visual overlay would risk being read as a cross-study identity, source-object derivation, coordinate transform, biological conclusion, reuse authorization, or registration before its evidence exists.

W3C PROV-O and the PROV Constraints recommendation support an explicit, typed and internally consistent account of relationships. They do not make a relationship true merely because it has been recorded. The candidate therefore needs an auditable way to record a question and its missing proof without admitting an edge.

## Decision

Candidate 2.3 implements `UPG-017` as a browser-local **not-admitted relationship proposal composer**.

- A proposal names one frozen Research MVP entity record, one frozen public-source catalogue record, and one of five narrowly typed candidate relation kinds.
- It records that no source object, object checksum, object-level rights decision, independent relation evidence, or validation plan is supplied in this package.
- Coordinate-transform proposals additionally require source frame/units/axes/origin, target-frame authority, disjoint held-out landmarks, and physical-space error. Same-cell proposals require a persistent cell identifier or paired measurement.
- Every browser-generated proposal has `admissionDecision: "not_admitted"`, `sourceObjectsAcquired: false`, and `registrationsCreated: 0`.

The composer has no import, upload, network, persistent-storage, source acquisition, transformation, alignment, analysis, or registration feature. It exports only a local JSON proposal for a future independent review; it does not submit or adjudicate it.

## Alternatives considered

| Option | Decision | Reason |
|---|---|---|
| Merged provenance graph with user-created edges | Rejected | An edge would visually overstate evidence and could be misread as identity or registration. |
| Free-text curator note only | Rejected | It would not require relation-specific evidence or preserve machine-checkable blockers. |
| Acquire and inspect source files in the browser | Rejected | This candidate is offline-reviewable and does not yet have object-level admission/rights clearance. |
| Typed, no-promotion proposal record | Accepted | It exposes what is missing while keeping evidence, source status, and registration count immutable. |

## Consequences

Curators can ask a precise admissibility question and see why the current package cannot answer it. The result is not a biological relation, a source-object record, a cell identity, a coordinate transform, a data license decision, or a `REG` record. Any future evidence-bearing proposal still requires object-level source/rights admission, independent validation and a separately authorized release decision.

## Evidence and validation

- [W3C PROV-O](https://www.w3.org/TR/prov-o/) supplies the distinction between typed provenance records and unsupported inferred relations.
- [W3C PROV Constraints](https://www.w3.org/TR/prov-constraints/) motivates explicit consistency requirements for proposed relationship records.
- `node scripts/validate-cross-lane-relationship-admission-0.1.mjs` validates the frozen parent releases, relation types, local-only runtime, and no-promotion boundary.
- `node --test tests/cross-lane-relationship-admission.test.mjs` checks typed requirements, unknown-record rejection, no-acquisition/zero-registration exports, and no fetch/upload surface.
