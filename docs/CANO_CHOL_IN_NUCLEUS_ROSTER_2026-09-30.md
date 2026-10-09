# UPG-109 · exact Cano CHOL_IN nucleus roster drill-down

2026-09-30。本轮完成 **现有 Cano GSE318731 的11个确认CHOL_IN profiles / 923 source-local nucleus assignment rows** 的最小名单浏览入口。UPG-109的这一个已准入来源范围可独立验收；其他来源的roster availability保持原契约。没有新增生物个体、来源类型、几何、核结构或跨assay/跨study同细胞关系，不能将本范围核销为所有来源名单都已准入。

## Exact existing input

复用既有 `data/cano-gomez-p56-multiome-interneuron-registry-0.1.json` 及其已有public镜像，不重新获取GEO/RDS，不修改名单。唯一runtime读取为现有小文件：

| Artifact | Bytes | SHA256 |
| --- | ---: | --- |
| `public/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz` | 16,348 | `1db93e5f6e52ead4f869553cf3634a82237fc3817aadb4c8187a75b81323db9a` |
| Source-derived CSV after gzip decoding | 428,897 | `2ec453defffb0a1a8ac7de27b3189d56059571166dd984f73356b5cdf0eaccb7` |

The exact CSV has923rows/22columns. Each source row retains the original `source_nucleus_id` and compound key `GSE318731|exact source filename|meta.data row.name`; the native ID suffix is never stripped. Membership uses the exact `confirmed_interneuron_profile_id` and original `groups=CHOL_IN`, not a label similarity or a gene-token interpretation.

The source lineage remains the existing registry’s `BASE_R_STREAM_META_DATA_ROW_ONLY`: original metadata row identity and same-row assignments, with `crossAssayCellIdentityVerified=false` and no same-cell claim. Runtime freshly verifies the local compressed and decoded roster hashes, exact dimensions, compound-key uniqueness, all eleven profile counts and each ordered compound-key SHA256. The original RDS receipt remains clearly marked as an **existing registry receipt, not reacquired by this browser**. Publication CC-BY-NC terms are not generalized to a separate source-RDS license; this increment reads the already admitted derived factual assignments and adds no RDS copy.

## Interaction and data contract

`app/CanoCholInNucleusRoster.tsx` default export accepts `{ profileId: string | null }`. It accepts only exact existing Cano profile IDs. The profile-keyed child remounts on a profile change, synchronously replacing previous rows/detail with loading state; abort-aware loading cannot publish an old response after a later selection. Invalid or other-source IDs produce a real unavailable state and no generated individuals. The main task integrates it with the existing Types exact-profile selection; it has no ResearchDataLab or global Provider dependency.

- Lazy fetch and verification before any row display; byte, hash, source assignment or profile-key failure withholds all rows.
- Query plus exact raw anatomy/Sex filters,20-row pagination and truthful profile/matched counts. Counts remain source-local nucleus assignments, not animal counts or prevalence.
- Source rows remain in the original CSV order. A selected row removed by filter, page or profile has no active detail/export. Clear selection does not silently select another row.
- Detail shows native and compound ID, observation unit, original metadata locator, compressed CSV logical data-row locator and all22exact fields.
- P56 is shown as **source dataset context**, with per-nucleus age measurement unknown. `anatomy`, `source` and `Sex` preserve raw values. Source context keys such asAC03 are not animal IDs; no XYZ, segment transform or atlas registration is inferred.
- Unquoted source `NA` stays null/unknown; quoted literal `"NA"`, empty strings and the raw `Unassigned` label remain distinct. No missing value is converted to0, a negative biological observation or another assay value.
- Export selected nucleus JSON, all current matched rows JSON or matched raw-column CSV. JSON retains parent source/RDS receipt, profile, exact locators, verification scope and zero scientific-addition claims; CSV retains the original22columns and source NA semantics. JSON explains its context fields without falsely appending a measured age column to source CSV.
- Table rows have native-ID keyboard buttons; Left/Right scroll the containing overflow table. Screen-reader and full-App zoom acceptance are outside this isolated test claim.

`app/cano-chol-in-nucleus-roster.js` supplies pure parsing/filter/page/selection/export functions and verified loading; its `.d.ts` maps the existing registry and runtime shapes without `any` or weakened strict checks. No generic relation schema, missing-source roster, geometry or type ontology is reconstructed.

## Verification

`node --test tests/cano-chol-in-nucleus-roster.test.mjs`: **8/8 passed** on actual source bytes. Tests cover both checksum layers and all923/11identities, corrupt/truncated payloads, wrong authority/profile identity, exact native ID and NA distinctions, actual anatomy/Sex denominators, page clamp and hidden selection, cross-profile export rejection, exact JSON/CSV counts/unknowns and late responses after abort.

The existing `validate-cano-gomez-p56-multiome-interneuron-registry-0.1.mjs` also passed: full source169,345nuclei / confirmed923 / profiles11 / twoexistingartifactsverified. New-file lint passed without disabled rules. The whole-project strict TypeScript check passed after adding this module. Integrated route/browser checks are a separate main-task acceptance record.

## Root浏览整合修复

Types exact Cano profile现已lazy整合。Vite对原gzip文件设置Content-Encoding:gzip，浏览器fetch透明解压；原始gzip运输核验压缩／解压两个hash，透明解压运输只声称runtime decoded SHA256＋923rows／22columns＋11profile counts／ordered identity hashes，压缩hash明确为canonical build receipt且不可由fetch实际重验。没有复制／改名原文件或放松decoded内容校验。新增HTTPdecoded正例及无标头plain body／损坏decoded负例，第9测试通过。
