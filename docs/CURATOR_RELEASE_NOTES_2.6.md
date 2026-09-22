# Curator release notes — public-data workbench candidate 2.6

**Workbench release:** ohri-mouse-interneuron-public-data-workbench-2.6.0  
**Distribution:** 2.6.0-curator.1  
**Release status:** localhost private curator-review candidate; 0 registrations / 0 REG

Candidate 2.6 implements UPG-019, a browser-local authorization-and-local-verification plan composer shown beneath the existing file-admission, source-review and assertion-provenance modules in the Sources tab. It supports only frozen SpinalJ 0.7.0 and Cano-Gomez 0.8.0 metadata manifests.

An export binds one declared unacquired file, its declared source checksum and version, a linked PSA assertion identifier, intended use, requested rights review, typed evidence locator, planned content scope, local curator ID and date. It lists identity confirmation, object-specific rights review, authorized acquisition record, local checksum verification and content-scope validation as planned—not executed—stages.

The receipt is not a rights decision, acquisition record, local checksum, content inspection, source authentication, biological claim, coordinate transform, cross-study relation, registration, or public deployment authorization. It always reports not authorized by this plan, not locally verified, no acquired/bundled object, no calculated local checksum, no inspected content, and zero registrations. The browser makes no network request, source download/upload or persistent write.

Candidate 2.6 retains UPG-006 metadata-only source-admission review, UPG-018 assertion provenance, the UPG-015 feasibility planner and its package-coverage gap, the UPG-016 two-lane provenance trace, and the UPG-017 not-admitted relationship proposal. These tools do not establish same-cell, same-specimen, coordinate, or causal identity, and none admits an external source object.

UPG-020 is the next research-watch item: an independent authorization-evidence packet and separately approved local-verification execution protocol. A public URL, generic licence, publisher checksum, plan receipt, or curator transcription is insufficient for that future gate.

New release-locked artifacts:

- data/public-source-authorization-plan-0.1.json
- schemas/public-source-authorization-plan-0.1.schema.json
- docs/ADR-010-AUTHORIZATION-PLAN-BEFORE-EXECUTION.md
- data/curator-feedback-contract-2.6.json
- data/curator-adjudication-contract-2.6.json
- data/release-manifest-2.6.json
