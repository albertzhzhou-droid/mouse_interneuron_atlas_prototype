# Curator release notes — public-data workbench candidate 1.5

**Distribution candidate:** `1.5.0-curator.1`  
**Workbench release:** `ohri-mouse-interneuron-public-data-workbench-1.5.0`  
**Release-manifest content SHA-256:** `a8391381e5081cb6a431b140a36dcd445541cda004b33c1bf38fc5f10bef89c8`  
**Registration count:** **0 registrations**

Candidate 1.5 adds two reviewable, public-source-only capabilities without acquiring a biological data file.

## Russ correction reconciliation dossier

The Sources workbench now exposes an exportable `ohri-russ-reconciliation-dossier-0.1.0` alongside the existing 69-population `TYPE_LEVEL` taxonomy explorer. Its only authority is `PROVENANCE_RECONCILIATION_ONLY`.

The dossier records both official author corrections linked from the [Russ et al. 2021 article](https://www.nature.com/articles/s41467-021-25125-1):

- `COR-RUSS-2022-02`, DOI `10.1038/s41467-022-28698-7`, repairs HTML supplementary-table links and incorrect cross-references to Supplementary Tables 2, 5, 7, and 8.
- `COR-RUSS-2022-10`, DOI `10.1038/s41467-022-33998-z`, repairs the Figure 3A `Excit-21` / `Excit-31` / `Excit-32` label issue.

Neither correction is represented as a change to Supplementary Table 1 marker values or labels. The original XLSX remains unbundled; its 1,475,885-byte source receipt and SHA-256 `a45578c893998fae42acf781c4700d162249497476b0b81149302f49929fd2e0` stay pinned. Postnatal transcriptomic reference and adult-lumbar validation remain separate evidence contexts. The dossier cannot create an exact identity, coordinate, same-cell pairing, connection edge, or `REG`.

## STARmap PLUS eligibility lead

The public catalog now records `PDS-STARMAP-PLUS-2023`, the [STARmap PLUS study](https://www.nature.com/articles/s41586-023-06569-5), as a `ready_for_metadata_audit` future lead. The study includes one coronal adult lumbar spinal-cord slice among its CNS sections; it is not admitted source data in this package.

`UPG-010` requires one exact SCP or Zenodo object manifest with specimen/slice identity, coordinate units, axes, origin, targeted gene-panel scope, checksum, and asset-level rights before any source-local display can be proposed. A source-local coordinate remains `SOURCE_LOCAL_OBS`; it cannot be expanded to a whole-spine census or labelled `REG`.

## Preserved boundaries

The package still has seven stable synthetic evidence entities, five source-local unregistered NeuroMorpho morphology exemplars, a BrainGlobe inferred reference, zero downloaded candidate files in preflight, zero bundled newly acquired public assets, and **0 registrations**. The local adjudication-packet workflow remains read-only: it cannot modify evidence, certify a ZIP digest, authenticate a curator, acquire data, authorize public release, or create registration.

The existing Cano-Gomez **specimen-aware** preflight retains its source frame and `localSha256=null` requirement. It does not download a file, select a BIL object, bundle an asset, create a project transform, or create registration; no pinned transform artifact or independent held-out error is supplied. A mixed verdict cannot be converted into a recommendation for the next private review. It remains read-only even when a packet is imported.

This package is for named private curator review. Public deployment or broad redistribution remains subject to institutional review and asset-level rights decisions.
