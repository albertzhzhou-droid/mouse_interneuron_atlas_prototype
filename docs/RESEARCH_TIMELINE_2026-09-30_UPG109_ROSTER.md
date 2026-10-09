# Research timeline · 2026-09-30 · UPG-109 existing Cano roster

The17ready-input disposition review identified a concrete engineering gap: Types already retained the confirmed Cano11profiles/923nuclei counts and locator, but did not read its already bundled16,348B roster as inspectable per-profile rows. The authorized follow-on increment completes this exact input path rather than reopening source acquisition or creating a roster for an unavailable source.

| Result | Verified scope | Final disposition |
| --- | --- | --- |
| Types→exact Cano profile→nucleus rows | Only existing11CanoCHOL_INprofiles/923rows; lazy compressed+decoded checksum verification and each orderedprofilekeyreceipt | completed for this declared roster-browser scope; overall multi-source UPG-109 remains source-dependent/partial |
| Per-nucleus identity/context | Original metadata row-name/native ID/compound key, exactassignment/source fields, logicalrowlocators; P56datasetcontext and per-row unknownage retained | No cross-assay, same-cell, morphology, coordinate or animal identity generated |
| Actions | Query, raw anatomy/Sex filters,20-rowpages, manual rowselection/clear, current selectedJSON and matchedJSON/CSV | Profile/page/filter changes clear active detail; abortedrequest cannot complete oldselection |

New files: `app/CanoCholInNucleusRoster.tsx`, itsCSS, `app/cano-chol-in-nucleus-roster.js`/`.d.ts`, `tests/cano-chol-in-nucleus-roster.test.mjs` and the dedicated `docs/CANO_CHOL_IN_NUCLEUS_ROSTER_2026-09-30.md`. All inputs are existing; no source-data edit, package, queue, registry, shared-route or Provider edit was made by this worker. Main integration consumes `<CanoCholInNucleusRoster profileId={exactCanoProfileIdOrNull} />` and owns rendered browser acceptance and final manifest regeneration.

Verification: **8/8 new actual-data tests**, existingCano registry packagevalidator, new-filelint and whole-projectTypeScriptcheck passed. The read-only remaining-scope table has been updated to distinguish this completed bounded input path from unavailable other-source rosters. UPG-026 sampling-sensitivity remains a named existing-input task, with independent biological error evidence separately missing; no second implementation task was opened.

## Root浏览整合修复

Types exact Cano profile现已lazy整合。Vite对原gzip文件设置Content-Encoding:gzip，浏览器fetch透明解压；原始gzip运输核验压缩／解压两个hash，透明解压运输只声称runtime decoded SHA256＋923rows／22columns＋11profile counts／ordered identity hashes，压缩hash明确为canonical build receipt且不可由fetch实际重验。没有复制／改名原文件或放松decoded内容校验。新增HTTPdecoded正例及无标头plain body／损坏decoded负例，第9测试通过。
