# Curator release notes — public-data workbench candidate 0.8

**Distribution candidate:** `0.8.0-curator.2`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-0.8.0`  
**Release-manifest content SHA-256:** `c8bedd55f6706efa8b92732452dc7d9f73c0b1f16c59bb97d0ac6c57b6a498a6`  
**Registration count:** **0 registrations**

Candidate 0.8 preserves the six public-source leads, two metadata-only source-intake records, **zero downloaded files**, **zero candidate files**, and the 0.2 evidence payload. Revision `0.8.0-curator.2` adds `UPG-007`, the queued independent-curator adjudication gate, while keeping the local-only curator-feedback inbox contract as an authoritative, checksum-locked release input.

The inbox accepts a completed feedback JSON only when all of the following match: feedback schema `1.0.0`, distribution `0.8.0-curator.2`, workbench release ID, release-manifest hash, stated local-only privacy boundary, and a registration count of `0`. It rejects unknown response fields, missing required responses, duplicate curator IDs, over-size files, and more than ten in-memory records. It stores nothing remotely and exports only a local review receipt. Neither feedback import nor receipt export can modify evidence, acquire source data, create a transform, create a registration, adjudicate a review, or authorize public release.

The object-level SpinalJ preflight remains `awaiting_object_level_public_manifest`, with `automaticDownload=false`, `credentialStorage=false`, `candidateFilesAccepted=0`, and `localSha256=null`. Source-provided SHA-1 remains source metadata only; it is never relabeled as a locally calculated SHA-256.

The ZIP is for private named-curator review only. Public deployment, public hosting, and broader redistribution are not authorized.
