# Curator package validation report — candidate 2.7

**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-2.7.0`  
**Curator distribution:** `2.7.0-curator.1`

Candidate 2.7 validates the `UPG-020` independent authorization-evidence packet composer against its schema, the public-data catalog, the assertion-provenance contract, and the authorization-plan contract. It supports exactly two frozen manifest formats and requires five planned independent-review stages. Unit tests reject an unlisted source, an invalid review role/locator, a missing plan link, a local hash, and browser source-transfer or persistent-storage APIs.

An exported packet fixes a declared unacquired object, version, plan identifier, reviewer request, and evidence locator. Its required non-promotion fields are `packetStatus: independent_authorization_evidence_packet_draft_only`, `authorityStatus: not_authenticated_by_this_packet`, `executionStatus: not_executed_pending_independent_authorization`, `verificationStatus: not_locally_verified`, `sourceObjectsAcquired: false`, `credentialsStored: false`, `localChecksumsCalculated: false`, `contentInspected: false`, `dataRetained: false`, and `registrationsCreated: 0`.

The release manifest locks all source contracts and their SHA-256 digests. Package construction checks an English-only static site, loopback-only launchers, file allowlists, ZIP integrity, and a companion SHA-256 sidecar. It does not substitute for a live independent authorization decision, real-browser interaction test, external source verification, source-file retrieval, local integrity comparison, retention authorization, or platform-specific double-click smoke test. Public deployment remains unauthorized; the registration count is **0**.
