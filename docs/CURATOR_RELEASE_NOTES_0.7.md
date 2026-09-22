# Curator release notes — public-data workbench candidate 0.7

**Distribution candidate:** `0.7.0-curator.2`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-0.7.0`  
**Release-manifest content SHA-256:** `1d1438eeb42fa03642fba74c2b927d1910336b8c6e4a79c89b2f2918b5c0be8a`  
**Registration count:** **0 registrations**

Candidate 0.7 preserves the frozen catalog of six public-source leads, two metadata-only public-source intake records with zero downloaded files, and all 0.2 evidence payloads. It refines the local object-level file-manifest preflight after checking the official Mendeley file-metadata contract.

The preflight now requires a source-metadata checksum as `{algorithm, value, provenance}`. It accepts `sha1` or `sha256` only when the exact algorithm is declared, and it retains `localSha256=null` because no file is acquired at this stage. This prevents a Mendeley-provided SHA-1 file hash from being mislabeled as SHA-256. A separately documented, user-initiated future acquisition step is required before calculating a local SHA-256.

This release accepts **zero candidate files**. It does not download, store credentials, bundle assets, create a transform, co-locate a source object with the SYN evidence entities, or create a registration. Importing a manifest is deliberately local to the active browser session; it is not a data acquisition channel.

Curators should confirm the `PFP-SPINALJ-PROCESSED-2026-08-18` status: `awaiting_object_level_public_manifest`, `automaticDownload=false`, `credentialStorage=false`, `candidateFilesAccepted=0`, `localSha256=null`, and `UPG-001B` remains the next gate.

The ZIP is for private named-curator review only. Public deployment, public hosting, and broader redistribution are not authorized.
