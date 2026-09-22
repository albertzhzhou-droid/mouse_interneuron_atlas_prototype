# Curator distribution checklist

**Release channel:** private curator review  
**Scientific release:** frozen Research MVP evidence 0.2.0 plus public-data workbench 2.7.0  
**Distribution release:** 2.7.0-curator.1  
**Public deployment:** not authorized in this phase

## Before packaging

- [ ] All user-visible interface, accessibility, notice, fallback, import, and export text is English.
- [ ] The production build, validators, and full regression suite pass.
- [ ] The interface continues to report zero `REG` objects.
- [ ] `OBS`, `INF`, `SCH`, and `SYN` remain visually and textually distinct.
- [ ] The five NeuroMorpho SWCs are described as local-frame exemplars, not a representative sample or census.
- [ ] Atlas segment assignment, contour accuracy, and registration confidence remain explicitly missing or pending.
- [ ] BrainGlobe, the original SC atlas dataset, NeuroMorpho.Org, and every morphology source paper retain the required attribution.
- [ ] The package contains no credentials, environment files, repository history, caches, or dependency directories.
- [ ] The package makes no automatic external request; external source links are user-initiated references only.
- [ ] The SpinalJ intake discloses metadata-only status: zero downloaded files, zero bundled assets, zero registrations, and no unreviewed transform.
- [ ] The object-level file-manifest preflight accepts zero candidate files, stores no credentials, records source SHA-1/SHA-256 without relabeling it as local SHA-256, and cannot download, bundle, transform, or register source data.
- [ ] The Cano-Gomez specimen-aware preflight accepts zero candidate files and requires preprint status, specimen identity, source frame, and native coordinate metadata or explicit missingness before a curator can submit an object manifest.
- [ ] The local file-manifest composer remains metadata-only: it exports only 0.7/0.8 manifest JSON from researcher-entered publisher metadata, fixes local SHA-256 to null, and cannot fetch, upload, persist, locally hash, acquire, bundle, rights-clear, transform or register a source asset.
- [ ] `UPG-014` exports a browser-local, detached RO-Crate 1.3 metadata document for exactly one declared external HTTPS source. It never obtains, embeds, bundles, rights-clears, transforms, or registers a source object; package `REG` remains zero.
- [ ] `UPG-015` maps no more than four selected evidence axes to declared source-specific routes only. It distinguishes a single route, separate non-joinable routes, and package-coverage gaps without acquiring data, claiming biological absence, inferring a same-cell/same-specimen/coordinate/causal relation, or creating `REG`.
- [ ] `UPG-016` keeps frozen Research MVP evidence references and public-source planning routes in two visibly separate typed lanes. Its **NO CROSS-LANE EDGE** policy prohibits inferred identity, source-object, coordinate, causal, authorization, or registration relations; its receipt records zero acquired source objects and zero registrations.
- [ ] `UPG-017` exports only a visibly not-admitted local proposal. It must list missing source-object, rights, independent-evidence and validation requirements and cannot add a cross-lane edge, alter evidence, grant reuse rights, acquire a source object, or create `REG`.
- [ ] `UPG-006` accepts only the frozen SpinalJ `0.7` and Cano-Gomez `0.8` metadata manifests, exports a not-admitted receipt, and cannot acquire, bundle, locally hash, authorize, transform, or register a source object.
- [ ] `UPG-018` exports only not-locally-verified, not-admitted assertion provenance; a URL, manifest, or transcription is not proof of an admitted object, rights, biological fact, relationship, or `REG`.
- [ ] `UPG-019` exports a plan only: one declared unacquired object, requested—not granted—rights review, and five planned stages; no source acquisition, checksum calculation, content inspection, authorization or registration occurs in this package.
- [ ] `UPG-020` exports only a non-authenticating, non-executing independent authorization-evidence packet; `UPG-021` remains the separately approved execution research-watch gate.
- [ ] The Tabulae GEO object card is labelled header-only and not admitted, with null source checksum, null local SHA-256, unresolved asset rights, zero downloaded files and zero registrations.
- [ ] The Tabulae condition browser is labelled metadata-only, contains eight groups / 93 literal GEO labels, and makes no claim of a source body, processed metadata, numerical analysis, cell identity, spatial cell coordinate, same-cell join, treatment effect or registration.
- [ ] The Tabulae comparison board accepts up to four unique researcher-selected exact gzip triplets, performs no remote acquisition, upload, persistence or source-file bundling, exports only a local receipt, and labels every card source-local 2D / not registered. It cannot align, order, stack or quantify sections; call a spot an individual interneuron; or create a transform, 3D reconstruction or `REG`.
- [ ] The Russ 2021 crosswalk reports 69 source populations / 65 project-designated candidate populations under `TYPE_LEVEL` authority; they are not 65 confirmed interneurons, the source taxonomy does not fully separate interneurons from projection neurons, its source XLSX remains unbundled, and every prototype relationship remains non-exact.
- [ ] `UPG-009` provides a provenance-only dossier of the two official Russ correction records; no source-table marker, correction, or adult-validation context creates an exact prototype identity, coordinate, connection, or `REG` object.
- [ ] The STARmap PLUS lead remains metadata-only and `SOURCE_LOCAL_OBS`: one adult lumbar source slice is not a whole-spine atlas, a complete transcriptome, a project transform, or `REG`.

## Package verification

- [ ] Generate the package from a clean production build.
- [ ] Confirm the package server binds to loopback only.
- [ ] Confirm the recipient does not need `npm install` or network access; only a supported Node.js runtime is required.
- [ ] Validate every package-manifest path, byte count, and SHA-256 digest.
- [ ] Confirm the companion `.zip.sha256` file matches the final ZIP.
- [ ] Confirm the package rejects path traversal and does not contain symbolic links.
- [ ] Open `START_HERE.html` and verify that the scientific-status legend and launch instructions are complete.
- [ ] Confirm the feedback form stores nothing remotely and downloads a local JSON response.
- [ ] Confirm the Review tab rejects feedback with a different package version, release-manifest hash, nonzero registration count, malformed ZIP SHA-256, unknown response field, or duplicate curator ID.
- [ ] Confirm the Review tab stores records only in the active browser session and its receipt export cannot alter evidence or authorization.
- [ ] Confirm adjudication needs two uniquely identified records, `zip_verified=yes`, and one matching human-reported ZIP SHA-256 before packet export.
- [ ] Confirm an exported packet retains all loaded feedback and cannot recommend another private review when curator verdicts disagree.
- [ ] Confirm an imported packet is verified only against its schema, exact local release identity, zero-registration boundary and internal record consistency; it must not authenticate identities, independently certify the ZIP digest, or alter the release.

## Private distribution

- [ ] Send the ZIP and its SHA-256 digest to the named curator through an approved private channel.
- [ ] Ask the curator to verify the ZIP digest before opening it.
- [ ] Ask the curator not to forward or publicly host the package.
- [ ] Ask the curator to complete all review tasks and return the downloaded feedback JSON.
- [ ] Record curator identity, package version, package digest, and review date in the project review log.

## After review

- [ ] Triage every comment as scientific identity, claim/condition/source, spatial registration, rights, usability, or wording.
- [ ] Preserve dissent and uncertainty; do not collapse `Unable to assess` into approval.
- [ ] Resolve or explicitly defer every blocking issue before creating another package.
- [ ] Regenerate all manifests and checksums after any content change.
- [ ] Require two independent spinal-neuroscience curator approvals before considering promotion beyond the engineering candidate.

## Withdrawal triggers

Stop distribution and replace the package if any of the following occurs:

- the ZIP or any internal file fails checksum verification;
- a launcher binds beyond loopback or the page initiates an unexpected external request;
- attribution is absent or inconsistent with the rights ledger;
- an unregistered morphology or evidence entity is presented as atlas-registered or measurable;
- a model, age, injury, species, negative result, or causal boundary is collapsed;
- the interface contains untranslated user-visible text or a blocking runtime failure.
