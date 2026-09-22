# Curator release notes — public-data workbench candidate 1.1

**Distribution candidate:** `1.1.0-curator.1`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-1.1.0`  
**Release-manifest content SHA-256:** `4a4aae683a88f9d5abe14400fba5991fd932afbba9200396509df3cbd19b57b2`  
**Registration count:** **0 registrations**

Candidate 1.1 preserves every frozen earlier curator package and adds a read-only local verifier for adjudication packets generated for this exact release. It rejects a packet with a different distribution, release ID, release-manifest hash, nonzero registration count, malformed reported ZIP SHA-256, duplicated curator identity, inconsistent feedback digest, invalid disposition, missing resolution, or a disagreement presented as a next-private-review recommendation.

The verifier confirms the local JSON structure, internal consistency, and exact workbench identity only. It does **not** recompute or certify the original ZIP archive digest, authenticate a human identity, contact a service, approve a release, admit data, or change evidence. It cannot modify evidence. The packet and its reported digest remain an audit record, not a scientific or institutional authorization.

The local adjudication-packet workflow still requires at least two uniquely identified feedback records with `zip_verified=yes` and one matching human-reported ZIP SHA-256. It preserves `revise` and `unable_to_assess` outcomes and all record-level responses. A mixed verdict cannot be converted into a next-review recommendation.

The Tabulae metadata state remains unchanged: the project has one header-observed GEO object, zero downloaded files, zero admitted candidate files, no local SHA-256, unresolved asset-level reuse/redistribution rights, no transform and no registration. `UPG-008` remains the source-checksum and rights gate.

This ZIP is for private named-curator review only. Public deployment, public hosting, and broader redistribution are not authorized.
