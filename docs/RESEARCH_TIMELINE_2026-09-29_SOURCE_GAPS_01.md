# 来源精确差额与信息页实施时间轴

用户授权与当前模式：用户要求“完成该MD中更新”；在原位实施本轮公开来源与可逆工程差额。文档中历史“仅规划”不是替代用户当前要求的指令。当前worker拥有本页列出的独立文件；package、queue、source registry、主规划及共享App入口由整合者独占。

日期：2026-09-29，America/Toronto。HTTP原始响应头可能为UTC2026-09-30，审查日期按用户时区记录。

## 已完成的实际输入／算法

1. 先读取P03 runbook、coverage、UPG254/253/247既有audit及dirty-worktree；没有复制项目，也没有改既有来源记录。
2. 从官方NCBI family SOFT取得29样本characteristics，保存原始31,675,401-byte text与SHA256；从publisher取得1,664,319-byte SupplementaryData3，验证XLSX包、4个单列sheet及精确源行。
3. 获取29个小GEO barcode对象、1个49,356,598-byte P0CR1 matrix及features；32条文件receipt和两次替代官方barcode请求均保留hash。只取必要子集，没有1.45GB TAR获取。
4. 发现28份barcode文件同hash。NCBI download与cache-busting官方FTP入口复核同payload，不推断错误起因、不修补barcode、不将图后选择数据和源列合并。单个matrix的13,241,486项全部结构检查通过但无法核销source identity冲突。
5. 精确GSM characteristics保留E13.5 epoch和Whole cord，并将与source-native列的matching/missing逐样本及源sheet/行号输出。89,494个Atlas行覆盖23prefix；P56LR1在该sheet0行，源GEO8000列仍保留。四sheet共111,141行分别分析，不以它们相加称一个不重复细胞群体。
6. 获取10条DOI官方PubMed查找和22条publication记录，复用冻结1,097 NMO以及独立30 Todd；完成固定范围PMID、全标题规范化和严格作者比较，0候选。所有1127对象保留raw citation、reason与locator，逐对象publication/animal/figure/lamina仍null。
7. 官方Todd当前339记录完整query复核，ID集合无变化；新30对象空DOI/PMID2017保持原值。候选论文PMID42454582可引用但不授予任何对象身份。
8. 本轮有界source search发现的候选均属于已有范围或不满足mouse-spinal-IN链。官方eLife83108 API返回已有完全相同v2 hash；UPG188所缺raw/calibrated/segmentation/parent证据没有变化，不创建重复卡片。
9. 新独立ExactSourceAuditWorkbench供Sources动态接入：29sample可搜索与条件过滤，23Atlasprefix/四sheet选择数可复核，样本原始characteristic/矩阵/异常分层，1,127对象citation三态分页、来源locator、当前过滤JSON/CSV导出。导出包含准确单位、0admission/identity/geometry/registration边界，无raw count payload。

## 验证与验收边界

- 两个deterministic Python builder实际运行成功；UPG254 stream检查完整13,241,486项matrix index/value/nnz与32,285features、8000barcodes一致。
- `node --test tests/exact-source-audit-workbench.test.mjs tests/trevisan-v1-exact-input-crosswalk-audit.test.mjs tests/neuromorpho-publication-discovery-audit.test.mjs`：12/12通过，包括source hash、E13.5/Whole-cord异常、非法barcode拒绝、真实缺失保持隔离、citation不能被candidate覆盖、选择在过滤后清空及过滤导出碰撞拒绝。
- 信息页是否接入共享Sources、production build、完整research checks、浏览器搜索/键盘/窄屏/分页/导出由整合者运行后更新；本worker不以组件存在替代真实浏览器验收。
- 类型检查以`tsc --noEmit --incremental false --pretty false`单独执行；首轮exit2为既有共享文件错误，未报告本信息页或helper；整合者修复后2026-09-30复查exit0。没有修改package或全套测试入口。
- Scientific：canonical387 profile分母未变；新增runtime nucleus roster0、cross-study same-cell0、geometry0、internalobject0、REG0。UPG254的准确核级cluster/reuse仍缺，UPG247逐对象crosswalk仍缺，M4真实鼠IN内构仍未完成。

## 文件归属与恢复

本轮新建：两个`data/*-audit-0.1.json`、两个`tools/audit_*_0_1.py`、三个`tests/*audit*/workbench*.test.mjs`、`app/ExactSourceAuditWorkbench.tsx`、`app/exact-source-audit-workbench.js`、`app/exact-source-audit-workbench.css`、本时间轴及`READY_CANDIDATE_DELTA_REVIEW_2026-09-29.md`。原始输入仅新增于三个专属`data/source-candidates/*-20260929/`目录。无既有文件覆盖，无外部发布或联系作者。

回滚：仅移除本轮新增信息页及其共享路由接入hunk（共享接入归整合者），保留或隔离source receipts、科学异常审查和上一份已验证manifest。不得reset dirty-worktree。

2026-09-30追加：整合者已在Sources默认挂载本独立信息页，实测P0CR1/E135选择与过滤清除旧details通过。UPG175已按后续时间轴实施可展开懒加载观察面板；本worker不再开启新候选，代码冻结交给整合者全局验证。

当前运行句柄：来源download与builder已完成；没有下载活进程。next_action：整合者运行production build、完整research checks和新增175真实浏览器验收。重启254需要corrected/versioned公开barcode-matrix或源deposited crosswalk、exactclusterlabels和reuse范围；重启188需要新raw/segmentation/parent链。
