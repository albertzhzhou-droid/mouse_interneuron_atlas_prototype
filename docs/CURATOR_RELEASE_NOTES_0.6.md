# Curator release notes — public-data workbench candidate 0.6

**Distribution candidate:** `0.6.0-curator.1`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-0.6.0`  
**Release-manifest content SHA-256:** `ffd491b0b9d4a6e91216210a803809519adf0027cf0a9f545a89ddb2713d639c`  
**Registration count:** **0 registrations**

Candidate 0.6 preserves the frozen catalog of six public-source leads, two metadata-only public-source intake records with zero downloaded files, and all 0.2 evidence payloads. It adds a local object-level file-manifest preflight in the Sources panel.

The preflight is a schema-gated review step only. A submitted candidate manifest must declare a stable HTTPS object URL, dataset accession/version, object ID or stable name, bytes, format, SHA-256, file-level rights decision, and native-coordinate fields or an explicit missing reason. The app rejects extra or missing fields, a non-HTTPS URL, absent SHA-256, missing file-level rights, incomplete coordinates without a reason, an unrecognized source, more than 2 MB of JSON, and any decision other than `metadata_only_not_downloaded_not_registered`.

This release accepts **zero candidate files**. It does not download, store credentials, bundle assets, create a transform, co-locate a source object with the SYN evidence entities, or create a registration. Importing a manifest is deliberately local to the active browser session; it is not a data acquisition channel.

Curators should confirm the `PFP-SPINALJ-PROCESSED-2026-08-18` status: `awaiting_object_level_public_manifest`, `automaticDownload=false`, `credentialStorage=false`, `candidateFilesAccepted=0`, and `UPG-001A` remains the next gate. A public dataset landing page or an undocumented endpoint response is not an approved file manifest.

The ZIP is for private named-curator review only. Public deployment, public hosting, and broader redistribution are not authorized.
