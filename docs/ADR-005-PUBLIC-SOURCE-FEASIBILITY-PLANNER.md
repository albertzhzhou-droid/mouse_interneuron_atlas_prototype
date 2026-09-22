# ADR-005: Public-source research-question feasibility planner

**Status:** accepted for candidate 2.1  
**Decision scope:** public-data workbench candidate 2.1 only

## Context

The workbench brings together deliberately heterogeneous public-source records: an inferred anatomical reference, unregistered local-frame morphologies, a type-level taxonomy with adult-lumbar marker context, and metadata-only spatial, injury, projection, and registration-planning leads. These records are useful for planning but do not form a common same-cell coordinate system.

That distinction is evidence-backed. [Russ et al. 2021](https://www.nature.com/articles/s41467-021-25125-1) provides a harmonized postnatal molecular taxonomy with adult validation context, whereas the [NeuroMorpho Neuron Atlas guide](https://www.neuromorpho.org/UserGuide.html) states that its atlas display positions are regional-level informative only. [Tabulae Paralytica](https://www.nature.com/articles/s41586-024-07504-y) supplies injury-condition context at its own source and aggregation levels. A conventional data integration interface would invite an unsupported same-cell, same-specimen, coordinate, or causal inference.

## Decision

Candidate 2.1 provides a browser-local feasibility planner. A researcher selects one to four declared evidence axes. The planner reports one of three bounded decisions:

- a single declared source-specific route supports every selected axis;
- separate declared routes can inform a study plan but cannot be joined; or
- no route is qualified in this package, which is a package-coverage result and not a biological-absence claim.

The planner exports a local JSON planning receipt. It makes no network request and does not upload, download, inspect, hash, transform, align, combine, analyze, persist, or bundle a source object. It creates no `REG` object.

The planning receipt is not authorization for public deployment, public hosting, or public release of this workbench or any referenced source asset.

## Options considered

| Option | Decision |
|---|---|
| Automatic cross-source entity or coordinate join | Rejected: source-specific provenance and validation do not establish a same-cell or project-space relationship. |
| Unstructured written data guide | Rejected: it does not give a researcher a reproducible decision record for a particular question. |
| Declared route planner with explicit non-join decisions | Accepted: it exposes usable source coverage while preserving source, model, modality, and spatial boundaries. |

## Consequences

`UPG-015` is in progress as a planning capability, not a source-data adapter or a biological model. The package retains 0 registrations. A receipt must never be interpreted as evidence acquisition, source authorization, data integration, biological truth, or a promotion decision.

## Follow-up

Additional public-source routes may be added only after a versioned catalog update, source-specific evidence and rights review, planner-schema validation, and curator review. A future route that claims a same-cell join or project atlas registration requires its own object-level, transform, held-out-error, and curator gates.
