# I01 final disposition · remaining ready-input scope

2026-09-30。本文件只读对照 `READY_CANDIDATE_DELTA_REVIEW_2026-09-29.md` 的 **17 个“现成输入可推进”ID**、当前实际代码及 I01 验收记录。它不修改规范队列，也不把部分实现重算成完成百分比。两项已在本轮声明范围实质完成；其余事项多数已有准确实现可复用，但覆盖范围仍应保留 partial，不能统称为科学输入受阻。

| 原 17 项 | 本轮实质覆盖 | 最终处置及明确余差 |
| --- | --- | --- |
| UPG-026 | 已完成15／33／38／75有界同源采样对比，132原路径receipts、32state及full semantic SHA复核 | **同源实验已完成；总体in progress**。实际15/38资产、声明历史33及nested75分别标明；独立生物误差仍缺，不开启解剖精度/几何比较。 |
| UPG-106 | 实际2–4 exact source-record anchor比较、case-sensitive marker交/差、transmitter/region/life-stage一致/差异/unknown、locator及JSON/CSV | **已完成声明比较范围**。387 profiles/10 namespaces已复用；不重建类型全集，不从共享marker建立same-type/cell。 |
| UPG-046 | 五来源逐对象frame/维度/ID/hash与两个鱼/rat SWC比较入口；七native记录补source metadata/context locators | **partial，复用现有guards**。全来源逐入口admission对账及缺失字段策略仍须逐route确认；新鼠IN输入是另一个source gate。 |
| UPG-047 | 新增16 source assertion contexts，12 functional／4 unknown，五类图例、筛选、条件／methods／locators及JSONCSV | **有界方法分类已完成；总体partial**。unknown target仍unknown，0 exact cell edges，不造partner/synapse。 |
| UPG-092 | native trace/DER open shell、MICrONS mesh、BANC centerline/核点、PALM2D、Micro link-only与WebGL文本失败明确分离 | **partial，已覆盖对象工作区**。其他未覆盖route的Unavailable与source-authorized radius语义继续核对；不恢复通用细胞器。 |
| UPG-251 | 五独立source registries新增exact rows/coverage/异步epoch/source units及动态选择 | **partial，已有矩阵和生命周期复用**。不能把五来源的不同对象单位当统一细胞分母或通用内部结构准入。 |
| UPG-252 | 五来源exact object分页、搜索、完整string IDs、URL/Back、source metadata、真实layers/camera及evidence/view exports | **已完成五来源声明范围**。Micro仍link-only，BIL与mouse same-cell内构保持单独门槛，不扩大本项完成声明。 |
| UPG-051 | 五来源source-scoped counts、native metadata、Types保留原始namespace及来源分母 | **partial，覆盖新路径**。legacy lane/export源scope和missingness对账仍可继续，不把unknown变0。 |
| UPG-052 | source file/row locator、exact parent证据、native API字段定位、分子比较locator随导出 | **partial，已有locator实现复用**。全App每个实际显示字段的可达assertion locator尚未逐页覆盖；DOI/hash不代替字段证据。 |
| UPG-091 | 五来源当前rendered revision、actual/requested layers、camera/frame/transform/renderer/file hash，同版本restore重新验证；stale/reset导出已修复 | **partial，独立workspace replay范围已完成**。其他viewer各自camera/clip/receipt gaps仍在，不重新开发这条已验收路径。 |
| UPG-097 | MICrONS/BANC exact nucleus-parent guards有真实locator/checksum；旧cross-lane proposal仍not_admitted | **partial**。特定父关系已有校验；通用relation enum/QC接口仍可映射这些真实证据实现，不能重复搭一个虚构对象流程。 |
| UPG-102 | source/release/kind/native-ID复合键，以及MICrONS/BANC的确切parent/child source keys | **partial**。已有键与parent guard复用；specimen→section→cell→synapse的通用层级、same_section和null-parent reason仍须独立适用字段契约。 |
| UPG-109 | 复核后已补独立exact-profile→923existingCano名单rows的verified lazy浏览、分页/过滤/选中clear/JSONCSV | **Cano11profiles/923rows浏览范围已落实；总体partial**。只接现有16,348B gzip roster，不生成Hayashi/Dmrt3等无名单个体；主任务整合Types入口并单独验收浏览器。详见 `RESEARCH_TIMELINE_2026-09-30_UPG109_ROSTER.md`。 |
| UPG-110 | 新独立对象/鱼rat/WT/分子比较及导出保留source context、unit和边界，换lane清除旧selection | **partial，已覆盖新路径**。legacy dossier/export同一scope block仍可有界补齐；无源字段保持not retained。 |
| UPG-118 | 已准入MICrONS/BANC用真实source/version/frame/hash/parent guards，点不变mesh；WT独立局部原生切面保持co-display | **partial，现有fail-closed契约复用**。尚非所有modality适用字段的通用内部source契约；鼠IN内部数据缺失不阻塞已有接口映射，却也不被接口放行。 |
| UPG-053 | object/audit/WT部分keyboard、390px、文本详情/失败等价与滚动容器已实际验收 | **partial，工程/验证余差可直接推进**。全App200%、screen-reader/实际辅助技术及其他long list路径尚未证实；ARIA不能替代实测。 |
| UPG-230 | 对象显式选择才加载geometry/Three，panel active-tab lazy加载，asset-ready/view-ready实测 | **partial，已完成部分defer与计时**。同设备/cache/route的生产基线、parse/execute及回归budget仍需实测，不能单凭chunk或一次timing宣布速度改善。 |

其他本轮completed scopes——UPG-127鱼SWC、UPG-145 rat SWC、UPG-175 Crozat有界表适配、UPG-195 WT2D co-display——原属这份差额表的“有限获取/证据依赖”等类别，**不从17项里再次扣除**。35处既有TypeScript错误的W15修复是共用工程验收，不使上述科学目标自动完成。Trevisan、BIL及M4的具体source gates独立保留。

## 两个高价值、已有输入的明确缺口

1. **UPG-109 Cano名单下钻，发现后已落实**：现有 `public/data/cano_gomez_p56_multiome_interneuron_v1/GSE318731_confirmed_interneuron_nucleus_roster.csv.gz` 为16,348B，SHA256 `1db93e5f6e52ead4f869553cf3634a82237fc3817aadb4c8187a75b81323db9a`；解压428,897B/923rows/22columns。复核时Types只展示counts和locator；后续授权增量已完成独立verified名单组件，绑定exact profile→native/compound nucleus IDs、源内assignment/context/unknown及当前名单JSON/CSV导出，不需新下载或新科学推断。9/9actual-data tests通过（含HTTP自动解压处理），Types整合和正式browser验证完成；其他未准入roster依赖保持原状态。
2. **UPG-026同源采样敏感性**：固定native annotation已在本地；可比较15/33/38及声明的更密采样方案对run coverage与同源derived representation的变化，分别报告算法一致性和missingness。独立生物误差benchmark不能由这一步替代。后续已完成该实验及页面整合；独立精度验收仍缺。

复核依据：`app/MolecularConcordanceWorkbench.tsx`、`app/molecular-concordance.js`、`app/independent-source-objects.js`、`app/independent-source-object-loader.js`、`app/independent-source-workspace-state.js`、`app/InterneuronTypeAtlas.tsx` 的Cano counts/locator区域，以及 `docs/RESEARCH_TIMELINE_2026-09-29_IMPLEMENTATION_01.md`、`docs/COMPARATIVE_SWC_REFERENCE_2026-09-30.md`。表的只读复核未改代码或原17项对照表；随后获授权的109独立实现另有专属scope/timeline。两步均未追加来源检索。

## Root后续可用输入差额收尾

本表的只读复核后，UPG026同源采样敏感性已执行并可再生，UPG047现有16断言方法分类/筛选/locator/export已接按需面板。旧表中“未新增／仍可直接实施／本轮不再开启”的语句保留为当时复核结果，不是当前缺口；最新证据分别见ATLAS_SAMPLING_SENSITIVITY_2026-09-30.md和RESEARCH_TIMELINE_2026-09-30_SOURCE_GAPS_03.md。026独立生物误差与047exact cell/synapse roster仍缺，规范项继续in progress/partial。
