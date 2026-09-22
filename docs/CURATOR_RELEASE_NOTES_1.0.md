# Curator release notes — public-data workbench candidate 1.0

**Distribution candidate:** `1.0.0-curator.1`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-1.0.0`  
**Release-manifest content SHA-256:** `560bea2f749948d02ff15057cf87234abc3547c48770ce1772c6510239f34aff`  
**Registration count:** **0 registrations**

Candidate 1.0 preserves frozen earlier curator packages and adds a version-locked local adjudication-packet workflow for `UPG-007`. Each independent feedback JSON now records the curator-reported ZIP SHA-256 alongside the distribution version, release ID, release-manifest hash, `0 REG` boundary and verdict.

The Review panel requires at least two uniquely identified feedback records, `zip_verified=yes`, and one matching 64-character ZIP SHA-256 before an adjudication packet can be exported. The browser compares reports; it does **not** recompute or certify the original ZIP archive digest. The packet retains full loaded responses, including `revise` and `unable_to_assess` outcomes, and requires a named adjudicator to choose only one non-promoting disposition: defer pending evidence, return for revision, or recommend another private review. A mixed verdict cannot be converted into a next-review recommendation.

This is not an acceptance or publication workflow. An exported packet cannot modify evidence, download or admit data, authorize public hosting or redistribution, establish biological truth, or create a registration.

The Tabulae metadata state remains unchanged: the project has one header-observed GEO object, zero downloaded files, zero admitted candidate files, no local SHA-256, unresolved asset-level reuse/redistribution rights, no transform and no registration. `UPG-008` remains the source-checksum and rights gate.

The ZIP is for private named-curator review only. Public deployment, public hosting, and broader redistribution are not authorized.
