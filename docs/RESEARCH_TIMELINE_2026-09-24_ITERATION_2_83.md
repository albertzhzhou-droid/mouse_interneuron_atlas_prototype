# Research timeline — iteration 2.83 (2026-09-24)

## Scope and outcome

Reduced the structure panel's source-mixing risk by keeping the verified active-record detail first and placing cross-region, comparative and source-only examples in a separate disclosure, closed by default. The disclosure labels the references as independent and explicitly says that they are not linked to the active record. This is a presentation change only; it adds no cell identity or geometry.

Added UPG-255 as a planned, rights- and schema-gated next step for a source-local 2D Xenium viewer, dependent on UPG-244. The dataset-specific reuse terms, source table schemas, stable cell identifiers, sample/section mappings, coordinate conventions and exact interneuron roster remain unverified. The BIL file listing was not downloaded and no source payload was admitted; the general BIL distribution policy is not a substitute for file-specific rights.

## Evidence and boundaries

- Queue registry contains 237 upgrade rows through UPG-255, with 69 complete; UPG-255 remains planned. The canonical source registry remains 31 sources, 41 record sets, 13 exact cell/profile rosters, 4 source-object sets and 387 source profiles.
- The preprint reports neuronal categories and projection-neuron context; those source-level counts do not establish an interneuron denominator. The candidate viewer must preserve each section's native 2D coordinate frame and must not extrude boundaries, infer intracellular structures, join to NeuroMorpho, register to atlas space, or pool counts across sources.
- The exact-record detail remains tied to the selected verified record. Comparative and source-only references are available separately and do not substitute for it.
- No new geometry, same-cell links, registrations, measurements, or full-project copies were added.

## Verification

The production build and lint completed successfully. The targeted SSR, registry and 2.82/2.83 snapshot tests passed (54/54). The full `npm run test:research` chain passed: 971 tests, 956 passed, 15 optional-source/runtime skips, 0 failed. Build output retained the existing large-client-chunk advisory and route-classification notice. The sealed manifest records 29 exact file receipts and the immutable 2.82 parent.

The live localhost:3001 preview was reloaded and confirmed as iteration 2.83; its selected-record detail renders first, while the independent reference library is collapsed. The separate localhost:3000 process still serves 2.45 and was left running. No commit or push was made: the checkout is on `main` with 400 uncommitted paths (44 modified and 356 untracked), and its configured `origin` is a `git.chatgpt-team.site` URL rather than an explicit `github.com` destination. No broad staging or external publication was performed.

## Research references

- [BIL mouse spinal Xenium collection](https://doi.brainimagelibrary.org/doi/10.35077/g.1196)
- [BIL general distribution and citation policy](https://www.brainimagelibrary.org/citation.html)
- [Cano-Gomez et al. preprint](https://doi.org/10.64898/2026.06.11.731752)
