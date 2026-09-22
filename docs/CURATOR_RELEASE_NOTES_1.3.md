# Curator release notes — public-data workbench candidate 1.3

**Distribution candidate:** `1.3.0-curator.1`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-1.3.0`  
**Release-manifest content SHA-256:** `f0ca5cbab4c7310fba4eeb2d7f55f4935a9e0ce3561388f928e8e90d5575adf4`  
**Registration count:** **0 registrations**

Candidate 1.3 adds a local-only, specimen-aware `UPG-002B` preflight for the Cano-Gomez preprint resource. It accepts a curator-supplied JSON manifest only when every candidate object has a source checksum, recorded rights decision, declared specimen reference, and `localSha256=null`.

The preflight requires the manifest to retain preprint status and, per specimen, sex, spinal region, assay, source frame, and native coordinate metadata or an explicit missing reason. A file cannot reference an undeclared specimen. It does not download a file, create a local checksum, bundle an asset, transform coordinates, or create a registration.

The method remains author-space and preprint-bounded. No selected BIL object record, pinned transform artifact, independent held-out error, or BrainGlobe transform is supplied by this release. The local adjudication-packet workflow requires at least two uniquely identified feedback records and preserves every response; a mixed verdict cannot be converted into a recommendation for the next private review. It remains read-only: it cannot modify evidence, certify a ZIP digest, authenticate a curator, authorize public release, or create REG.

This package is private curator-review material. Public deployment or redistribution remains subject to institutional review and asset-level rights decisions.
