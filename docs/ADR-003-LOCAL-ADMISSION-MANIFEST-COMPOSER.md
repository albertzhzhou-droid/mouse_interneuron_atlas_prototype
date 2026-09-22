# ADR-003: Browser-local public file-admission manifest composer

**Status:** accepted for candidate 1.9  
**Decision scope:** public-data workbench candidate 1.9 only

## Context

Candidate 1.8 could import and reject strict public file-admission manifests, but a researcher or curator had to hand-author the JSON. That was error-prone and made the necessary admission gates for SpinalJ and Cano-Gomez harder to inspect. The workbench must remain public-data-only, offline at review time, and at zero registrations.

## Decision

Candidate 1.9 adds a browser-local, schema-shaped manifest composer in the source panel:

- **SpinalJ:** format `0.7.0`, object-level metadata only.
- **Cano-Gomez:** format `0.8.0`, specimen-aware metadata only, with visible preprint status.

The form accepts only researcher-entered publisher/repository metadata: public HTTPS URL, published byte count, format, source-declared SHA-1/SHA-256 checksum, file-level rights record, and required coordinate/specimen fields or an explicit missing reason. Its exported manifest fixes `localSha256` to `null` and fixes the admission decision to `metadata_only_not_downloaded_not_registered`.

It does not fetch, upload, persist, inspect, decompress, hash, acquire, bundle, transform or register a source file. It cannot certify a publisher checksum, grant reuse rights, validate a biological claim, authorize public deployment, or create `REG`.

## Alternatives considered

1. **Data-acquisition wizard — rejected.** It would create a download, rights, security and provenance authority that the candidate does not possess.
2. **Hand-authored JSON only — retained as the import path, but not sufficient alone.** The strict importer remains useful for externally prepared records; it does not reduce authoring errors.
3. **Server-side persistent workspace — rejected.** A server would introduce retained research metadata, authentication and an implied data-management role outside the localhost review scope.
4. **Browser-local validated composer — accepted.** It reduces structural authoring error while keeping every scientific and asset-admission decision with the curator gate.

## Interoperability research and deferred work

[RO-Crate](https://www.researchobject.org/ro-crate/specification/1.1/structure) defines a JSON-LD metadata file and can describe external web-based data entities when they cannot be bundled. This makes it a plausible future portability format for the catalog and metadata-only admission records. Candidate 1.9 does **not** emit an RO-Crate: the mapping, profile/version selection, independent validation and curator review remain `UPG-014`.

An external URL in a future provenance export must remain an external reference. It is not evidence that the asset was downloaded, bundled, rights-cleared, scientifically validated or registered into this project.

## Consequences

The next implementation gates remain `UPG-001` (SpinalJ reproducibility) and `UPG-002` (Cano-Gomez source-local inventory). `UPG-014` separately gates metadata-only provenance externalization. Candidate 1.9 remains a localhost public-data workbench with **0 registrations**.
