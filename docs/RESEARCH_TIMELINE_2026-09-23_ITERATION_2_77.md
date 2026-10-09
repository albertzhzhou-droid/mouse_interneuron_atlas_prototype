# Research timeline — iteration 2.77 (2026-09-23)

## Scope

Continued from immutable iteration 2.76. This increment promotes the Svara et al. larval-zebrafish spinal SBEM publication and its three exact official supplementary-package URLs into the canonical source registry and internal-reference panel. The files themselves were not retrieved or inspected; this is a provenance and discoverability improvement, not an object or geometry admission.

## Source registration and UI

- The source registry now distinguishes two article-reported record sets: 39 morphology-consistent CiD reconstructions among 170 completely traced cells, and 34 source-reported CoBL reconstructions. These are selected source claims, not exact deposited rosters, a complete interneuron census, or prevalence.
- Each official archive route (mmc6, mmc7, mmc8) is a separately linked, unbundled source asset. Member files, bytes, hashes, stable neuron IDs, coordinate fields, reconstruction completeness, and archive-specific reuse rights remain unverified.
- The reference panel labels the source as one 6 dpf *Danio rerio* specimen and exposes the official links while retaining zero admitted objects and geometry. The article’s CC BY 4.0 notice is not extended to the archives; no genetic V2a assignment, zebrafish-to-mouse transfer, or mouse identity join is made.
- The source registry currently summarizes 31 source packages, 41 record sets, 13 exact cell/profile rosters, and four exact source-object sets. The profile count remains 387; these units are kept separate.

## Next gates

- UPG-240 is partially completed: official route links and source-reported counts are registered, while package membership and per-file rights remain open.
- UPG-250 gates any later source-local reconstruction on package-member identity, coordinates/frame, trace completeness, hashes, and reuse terms.
- UPG-251 plans a registry-derived exact-record internal-detail matrix that distinguishes verified, source-reported absent, not assessed, unavailable, and rights-held states; it cannot fill gaps with type averages, neighboring cells, other species, or representative shapes.
- UPG-244, UPG-247 and UPG-249 remain open under their existing evidence gates. No future queue item is counted as completed by this increment.

## Verification and release

- Full current research suite: 949 tests, 934 passed, 0 failed, 15 conditionally skipped. The production build and lint also passed; the build retains the existing large-chunk advisory and unclassified-route warning.
- Svara’s metadata-only contract, schema, source registry, source denominators, research-upgrade registry, package-route UI, and no-copy layout are covered by focused tests and the 2.77 snapshot.
- No Svara archive or image payload was downloaded; no new geometry, internal object, same-cell join, mouse identity transfer, or atlas registration was introduced.
- This is a new timestamped timeline and sealed iteration manifest in the existing project tree; no full-project copy was created. Iteration 2.77 is parented to immutable 2.76.
- GitHub push remains deferred: UPG-240, UPG-244, UPG-247, and UPG-249 retain open archive/member, object-mapping, or rights gates; UPG-250–251 remain planned.

## Primary references

- [Svara et al., 2018 primary article](https://doi.org/10.1016/j.celrep.2018.05.023)
- [Official Max Planck publication listing](https://www.bi.mpg.de/publication-search/2328567?person=%2Fpersons%2Fresource%2Fpersons118241)
- [Official mmc6 archive](https://pure.mpg.de/pubman/item/item_3055210_7/component/file_3055230/1-s2.0-S2211124718307563-mmc6.zip)
- [Official mmc7 archive](https://pure.mpg.de/pubman/item/item_3055210_7/component/file_3055231/1-s2.0-S2211124718307563-mmc7.zip)
- [Official mmc8 archive](https://pure.mpg.de/pubman/item/item_3055210_7/component/file_3055232/1-s2.0-S2211124718307563-mmc8.zip)
