# Interneuron 项目升级规划

初稿日期：2026-09-24（America/Toronto）  
最近更新：2026-10-08（America/Toronto），I68原生研究事实附件代码已整合，工程检查通过；真实文件落盘仍待验。按用户要求，本轮收尾后暂停升级并发布仓库。完整Goal及M2／M4未完成，待更新事项另列。  
适用项目：`mouse_interneuron_atlas_prototype`  
规划基线：`2.90.0-research.1`，另有同版本的 post-seal 主场景叠加改动  
当前模式：**2026-09-29 用户要求“完成该 MD 中更新”，已启动原位实施。下文 P02/P03 的“仅规划”描述保留为历史记录；当前进展以各独立实施时间轴及[完整Goal核验](GOAL_REQUIREMENT_AUDIT_2026-09-30.md)为准，未验证项不自动算完成。**

UI执行约束：**2026-10-04用户明确要求全程应用刚更新的UI layout。后续实现、迁移与验收使用当前新首页、分级SiteNavigation及独立研究页面；新功能接入对应页面并保留现有布局与样式。证据总览继续通过独立 `/research/overview` 页面可达。**

本文件是总入口。未来长时间实施时，先读 [长时间自主升级执行总纲](LONG_RUN_UPGRADE_RUNBOOK_2026-09-29.md)，再按当前工作包定位 [全部升级项目对照](UPGRADE_COVERAGE_2026-09-29.md)。后者逐项覆盖 243 条研究／模型记录及 21 条旧来源准入记录，不需要用户逐条重定向。[P03 时间轴](RESEARCH_TIMELINE_2026-09-29_PLANNING_03.md) 记录本次修改范围和验证。

## 1. P03 历史决策与当前目标

P03 的用户要求是：“继续，但是转为规划升级，以 MD 文件记录规划。”该历史阶段交付规划文档组。2026-09-29/30 用户要求完成此 MD 中的更新，当前已执行可核验差额；实施结果与未满足条件见第 13–61 节及独立时间轴。

升级目标仍是一个能够研究小鼠脊髓 interneuron 的完整应用：浏览真实细胞形态、理解类型及条件差异、查看有来源的细胞内部细节，并能从每个视图追溯到准确对象和数据。阶段性二维视图是实现这个目标的一步，不能代替同一细胞三维内部结构的最终里程碑。

2026-09-24 初稿仅新增本 MD。2026-09-29 的 P02 补充二维分割与对象契约；P03 按用户要求扩展为覆盖全部已登记项目、可支持超过十小时自主工作容量的文档组。本轮只修改／新增规划 MD，不修改应用、数据、版本号、升级队列或历史验证记录，不下载研究数据载荷。已有 2.90 及后续局部实现作为当前事实记录，不归为本轮成果。保留现有未提交工作。规划复用已有 UPG 编号；下文优先级是建议顺序，不表示已改写原队列。

## 2. P03 历史基线与证据范围

本规划以当前本地文件为依据。旧记忆和早期路线图仅用于恢复项目目标，不能替代当前版本状态；外部候选来源的可用性、文件内容及条款，需要在实施时重新核验。

| 项目 | 当前本地记录 | 如何解释 |
| --- | --- | --- |
| 应用版本 | `2.90.0-research.1` | 2026-09-29 读取当前 package；另有 post-2.90 主场景 DAT 叠加实现 |
| 当前来源注册表 | 31 sources、41 record sets、13 exact cell/profile rosters、4 exact source-object sets、387 source profiles | 各单位分别统计；387 不是经跨来源去重的 interneuron 类型总数 |
| 升级队列 | 243 条；73 条状态精确为 `completed`；新增至 UPG-261 | 另有带限定词的完成状态，不能据此计算科学目标完成率 |
| P02 阶段实际复核 | 2026-09-29 的 2.90 snapshot validator 通过，覆盖 31 项输入；P03 未重复运行 | 只证明该快照范围，不覆盖所有 post-seal 应用改动 |
| 2.90 及 post-2.90 时间轴中的既有验证 | 记录完整 research 检查通过；993 tests，978 passed、15 conditional skips、0 failed；有对应浏览器记录 | 本规划阶段未重跑全量测试，也未完成新的浏览器验收 |
| 类型检查的历史限制 | post-2.90 时间轴记录 `tsc --noEmit` 有 35 项既有项目错误 | 本轮未复跑，不作为当前精确错误数或通过结论 |
| 文档漂移 | README 已同步至 2.90；UPG-212 历史叙述仍使用 `387 confirmed-profile` 表述 | README 修复不再列为未完成；后续统一队列用词，保留历史快照 |

依据：[2.90 时间轴](RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md)、[post-2.90 主场景叠加时间轴](RESEARCH_TIMELINE_2026-09-24_POST_2_90_NMO45718_MAIN_SCENE_DAT_OVERLAY.md)、[当前来源注册表](../data/research-source-registry-0.1.json)、[2.90 manifest](../data/research-iteration-manifest-2.90.json)、[既有升级队列](RESEARCH_MODEL_UPGRADE_QUEUE.md)。初稿的 2.89 基线属于 2026-09-24 的规划记录；两轮深化分别见 [P02 时间轴](RESEARCH_TIMELINE_2026-09-29_PLANNING_02.md) 与 [P03 时间轴](RESEARCH_TIMELINE_2026-09-29_PLANNING_03.md)。

已有能力须直接复用：

- NeuroMorpho 冻结 8.6.124 查询已有 1,097 个记录；142 个 adult 记录及 149 个主场景来源对象属于既有范围，不能重复相加。8.6.126 Todd 的 30 个补充对象保持为独立版本增量，不作为新增生物学类型数。
- 原生胞体轮廓 catalog 0.4 已有 7 个记录、72 条轮廓、5,149 个顶点。这些源轮廓不等于观测到的膜表面或内部结构。
- NMO50394 已有明确标为 DER 的插值开放外壳：14 rings、1,792 vertices、3,328 triangles、两端开放、无封盖。这是现有派生显示，不能重新列为从零建设，也不能改称观测膜、体积或细胞器。
- UPG-192 已完成 NMO45718 单记录 DAT↔SWC 联展：7 条闭合轮廓、252 个顶点与 5,635 条 SWC 线段；post-2.90 已将其作为可选图层接入主场景。对应变换是项目派生的显示一致性关系，不能迁移到其他记录，也不是内部结构。其他记录的发现与独立核验沿用 UPG-261。
- Cano-Gomez GLUT 浏览器已有 277 个 `active.ident` 标签、92,782 个来源行；其标签浏览与 387 source profiles、CHOL_IN 的 11 profiles／923 nuclei 分别保留。缺失的 `neuron_types` 不以标签名补齐。
- 641 条 Research Explorer 记录的当前对象覆盖矩阵、五来源比较索引、分子标签到形态的检索入口，以及重复缺失说明的压缩展示均已有实现。下一步重点是尚未覆盖的逐对象适配，而非重新制作来源卡片。

轮廓依据：[catalog 0.4](../data/neurolucida-native-contour-admission-catalog-0.4.json)、[NMO50394 派生外壳](../data/native-contour-derived-soma-surface-0.1.json)。

## 3. 升级后的实际使用流程

用户从物种、脊髓区域、年龄、来源标签或具体对象进入，选定一个记录后，在同一上下文查看形态、细胞边界、细胞核、细胞器、突触及来源说明。只有数据确实支持的内容才提供几何图层；缺失内容显示原因和可继续查看的材料。

| 能力 | 预期体验 | 必须保留的边界 |
| --- | --- | --- |
| 真实形态 | 旋转、缩放、选择分支、查看源轮廓与可用细节 | 类型平均形态和示意图不能作为某一真实细胞的重建 |
| 类型与条件 | 搜索来源标签，查看年龄、区域、性别、损伤条件及其缺失状态 | 来源标签、marker 证据、分类结论分别呈现；不直接合并跨研究标签 |
| 内部结构 | 按当前对象查看有依据的核、细胞器、突触或原始切片 | 二维与三维、观测与派生、同一细胞与比较参考分别标明 |
| 信息整合 | 选中对象后，视图、明细、深链接和导出同步 | 切换对象不能残留上一个对象的几何、计数或证据 |
| 空间与 SCI 语境 | 查看来源记录中的位置与实验条件，比较研究证据 | 来源局部坐标不等于 atlas 配准；相关或来源报告不自动成为因果结论 |
| 研究效率 | 默认显示最有用的内容，按需展开来源和限制，支持键盘与窄屏 | 通过加载方式和布局提速，不以隐藏数据或功能达标 |

产品首页优先回答“选中了谁、现在能看什么、下一步可以做什么”。来源与科学限制保持可见，但不再以长篇审计过程占据主要操作空间。本规划不新增管理、策展或审批型产品流程。

## 4. 优先工作包

### A. 基线对齐与实施入口 — P0

**目的：**让后续实施从真实当前状态出发，避免按旧 2.43 状态重复修复。

恢复实施时先核对版本、注册表、当前测试入口及未提交工作，记录当时的 baseline。README 已同步到 2.90，后续只核对是否继续漂移；队列中 387 的含义仍需统一为 source profiles，并注明历史计数所属版本。历史文件不追溯重写成当前状态。

**验收：**当前入口文档的版本、各单位计数与规范注册表一致；历史记录仍可辨认；新发现的测试失败与既有问题分开记录。类型检查的当前结果另行记录，不把旧版结果或 snapshot 通过当作全项目通过。

### B. 小鼠切片的细胞／细胞核二维分割结果视图 — P0，UPG-244 → UPG-255

**预期成果：**一个来源可追溯切片的可交互 pilot。点选来源 cell ID 后显示对应的细胞／核分割多边形，以及来源标签、section 和坐标信息。该成果呈现来源处理结果，不将分割多边形称为直接观测膜，也不代表三维细胞内部模型已经完成。

P02 核对发现：Xenium 官方说明将 boundary polygons 定义为分割掩膜的简化显示；核扩张也是细胞分割的一种方法。实际方法与参数必须从该数据的处理版本及运行记录核实，不能由 “Xenium v1” chemistry 推定。详见第 10 节。

先核对 BIL `10.35077/g.1196` 的样本元数据、具体文件条款、稳定 cell ID 和坐标定义，再选择一个可明确追溯的 section。一个 run／slide 文件夹不自动等于一个动物或一个 section；本地已记录的 16 个目录也不能作为动物数。

建议先检查以下小体量候选，而非直接取全量影像：

| 本地审查记录中的候选 | 记录大小 |
| --- | ---: |
| Metadata workbook | 871,684 B |
| `cells.parquet` | 4,328,122 B |
| `cell_boundaries.parquet` | 19,951,154 B |
| `nucleus_boundaries.parquet` | 18,508,959 B |
| 合计 | 43,659,919 B，约 43.66 MB（十进制） |

这些是既有文件列表记录，不代表文件已经取得或内容已核验；43.66 MB 仅为这四个候选之和，不是 pilot 的完整预算。还需定位运行元数据、准确的 section／类型映射，详见第 10 节。超过 1 GB 的 transcripts 与约 27.51 GB 的 morphology OME-TIFF 留待明确需要时再评估；先判定小文件是否足以支持 pilot。

2026-09-30实际增量：按16运行列表选择较小的 `BIL:ace-pie-cot` 三份Parquet，37,282,469 B，已取得并全表核验。43.66 MB历史候选为Run1三表加workbook；本轮没有照搬该预算。新schema/稳定cell↔cell+nucleus关联及逐cell方法已核实，准确section/donor/frame/type及许可差异仍阻断viewer。详见第16节及[BIL三表审查](BIL_XENIUM_GEOMETRY_SCHEMA_AUDIT_2026-09-30.md)。

**实施顺序：**文件级使用范围与样本说明 → 校验并固定原始文件 → 检查 schema、ID 与坐标 → 建立按 section 和 cell ID 的关联 → 验证来源分类 → 接入二维视图。

**验收条件：**

- cells、cell boundary、nucleus boundary 按来源稳定 ID 关联；分别报告重复、孤立、缺失和未匹配 ID。一个细胞有多行 polygon vertices 属正常结构，不能误判为重复细胞。
- 每个图层保留 x/y 单位、原点、方向、样本和 section；只有来源支持时才显示物理尺度或比例尺。
- 点击、筛选、切换 section 后，核与细胞边界始终属于当前对象；无上一选择残留。
- 只有来源证据足以区分 interneuron 时才进入相应分类；projection、motor、sensory、non-neuronal 与 unresolved 分别保留。480-gene panel 或文章类型总数不作为 interneuron 数量。
- 不从二维轮廓外推三维，不推断细胞器，不关联某个 NeuroMorpho 细胞，不自行配准到 atlas。

若 ID、section、坐标或具体文件的使用范围不能成立，记录缺失的确切条件，暂停该文件的几何接入，同时推进不依赖它的工作包 E/F。已有 landing page 或论文许可不自动覆盖所有数据文件。

依据：[BIL 本地审查记录](../data/bil-xenium-spinal-audit-0.1.json)、队列 UPG-244／255。

### C. 类型、年龄和形态来源信息深化 — P1，UPG-040／254、UPG-253／247

**预期成果：**用户能理解某个标签、核或形态记录来自哪里、适用于什么条件，以及哪些关联确实存在。

V1 年龄资料优先从 Supplementary Data 3 的最终图 barcode 与小规模来源矩阵验证开始，再扩展到其余可用样本。29 个 GSM 的 sample characteristics 应逐一核对；24 个标题符合既有规则，另 5 个例外不能强行套用规则。`E135HetR1` 的 E13.5 不能被解析为出生后 135 天；标题解析也不能替代核级元数据核验。

对 30 个新增 Todd 对象与现有形态标签，扩展 PMID、标题、作者及 supplement 名称的候选发现。逐对象保留 matched／unmatched／unassessable 与证据位置。缺失 DOI、异常 PMID `2017`、animal、figure 或 lamina 不自动补值。

**验收：**barcode 与 matrix 的匹配、重复及缺失有来源可复核的计数；89,494 研究总核数不替代 cluster-specific counts；未确认的资料不扩大 387-profile 分母。文章引用候选与明确的对象对照表分开，只有源文件中的准确映射才能建立跨资料关系。

UPG-246 已有的 DOI 检查为 0/10 taxonomy publication DOI 与冻结形态来源匹配；这是特定发现方法的结果，不证明永远不存在对应关系。UPG-253 用于扩展发现方法，不能直接推断同一细胞。

依据：[V1 样本审查](../data/trevisan-v1-geo-series-sample-audit-0.1.json)、队列 UPG-040／247／253／254。未来新增形态的检索复用 UPG-256，并核对完整分页与冻结基线重叠。

### D. 胞体细节与真实三维内部结构 — P1，UPG-220／231；UPG-104／188

**胞体分支：**复用现有原生轮廓及 NMO50394 的 DER 外壳，研究哪些记录支持更可靠的显示。NMO50424 的异常轮廓过渡、NMO50408 的自相交和零长度边继续保留源状况；不通过自动修补、平滑或封盖制造完整膜。

另有已完成的 NMO45718 联展可直接复用；其扩展沿用 UPG-261，为每个候选独立声明变换与验证方法，不重用 NMO45718 系数或一致性阈值作为通用标准。

UPG-231 先独立校准探索性阈值：1.5 µm 质心位移、1.6 面积比、1.5 µm cyclic RMS。目前这些阈值不是公认生物学标准。使用独立样本和多记录比较，不能为让单个目标通过而反向调参。

**胞体验收：**源轮廓与派生显示可区分；算法、参数、异常和适用范围可追溯；失败记录仍能查看原始轮廓；未得到体积或测量依据的外壳不产生生物学体积指标。

**三维内部结构里程碑：**至少找到一个可明确归为小鼠脊髓 interneuron 的 exact cell，具备可使用的原始体数据、准确版本的细胞／内部对象 segmentation，以及可核对的 parent-cell 映射。

所需证据链为：物种与部位／分类依据 → 稳定 specimen 和 cell ID → 原始 volume 与 segmentation → 内部对象 parent ID → 体素尺度、原点、轴向和变换 → 文件版本、hash 与使用范围 → 原始切面叠加复核。

**三维验收：**至少一个真实内部对象与其 parent cell 的关联、位置和原始切面可复核；界面支持逐对象选择及原始证据查看。局部成功只能表述为该对象、该 volume 范围的内部结构；“完整细胞”另需完整性证据。若证据链不成立，这一里程碑明确未达成。

既有二维 EM、PALM 点、分子标签、比较物种核坐标或神经元示意图均可作为相应范围的材料，但不能补足这条三维证据链。Super-CLEM 顺序图的轮廓和配准可行性另在已有 UPG-112 下评估，不自动迁移到小鼠脊髓对象。

依据：[Todd 拓扑审查](../data/todd-native-contour-topology-audit-0.1.json)、队列 UPG-104／112／188／220／231。

### E. 逐对象细节整合 — P0，可与 B 并行，UPG-251／252

**预期成果：**用户在多对象来源中选中任一对象，能看到这个对象自己的几何、内部细节覆盖、版本和来源记录。已有五来源索引继续复用，新增工作聚焦具体对象的适配。

为独立来源注册表补齐逐对象记录，使明细、viewer、scene receipt、深链接和导出使用同一选择上下文。MICrONS、BANC、Super-CLEM、MicroStructFormer 和 native-contour 分别保持自己的物种、单位、身份及坐标约束。

**验收：**逐对象核对形态／边界、核、细胞器、突触、坐标、身份和完整性；保留当前代码的十类结构证据状态：`observed_source_object`、`derived_display`、`source_reported`、`source_level_only`、`not_measured`、`unavailable`、`not_assessed`、`not_established`、`source_reported_absent`、`rights_held`。数据缺失不等于生物学不存在，来源报告不等于已有对象几何。维度、文件验证和表示性质分别记录。

异步加载期间，切换对象立即清除旧图形与旧 receipt；过期请求返回不能覆盖新选择。不存在可显示的源几何时，不出现默认球体等替代形状。来源卡片、文章链接或 metadata count 不自动成为可显示对象；各注册表分母不合并成共同细胞总数。

### F. 信息呈现与加载性能 — P1，UPG-230，依赖 E 的对象上下文

先记录生产版初始 transfer、parse／execute 与 interaction-to-ready，说明设备、浏览器、缓存和路线，再设可复核的性能预算。当前存在大于 500 kB chunk 的既有警告，但尚不能据此填写用户等待时间或性能改善幅度。

围绕默认首屏和实际使用路径延迟加载 3D 场景与非即时需要的证据面板；来源及限制采用简明摘要与展开查看。沿用已完成 UPG-212／258 的紧凑信息展示，不重复制作同一套压缩卡片。

**验收：**同条件前后测量表、桌面和窄屏浏览器记录、键盘可用性；搜索、筛选、对象切换、深链接恢复、导出与图层控制保持可用。加载优化不得改变证据状态、选择身份或可访问的数据范围。

## 5. 比较来源与资料检索的优先级

鼠脊髓核心能力优先。其他物种和脑区继续保留独立比较价值，但不作为工作包 D 的替代交付。

| 既有路线 | 接下来的明确工作 | 重新启动或停止条件 |
| --- | --- | --- |
| UPG-250／260，Svara／Koh larval zebrafish | 检查既有三个官方补充 ZIP 候选的成员、版本关系、坐标与文件条款 | 复用现有 ID；同一批无新输入的 GitHub／Zenodo 路线不重复检索 |
| UPG-249／232，BANC fly | 在公开可用的确切对象子集成立时，核对逐细胞器坐标与 parent ID | 已有核 annotation point 不升级为核 mesh；31 mitochondria 的计数不代替几何 |
| UPG-223，MICrONS exact target | 保留已关闭的空间不匹配结果 | 只有出现目标对象的新版本或可验证变换才重新评估，不重复尝试当前不重叠坐标 |
| UPG-235／242／243，mouse raw confocal／EM | 根据新增公开 raw volume、segmentation 或 exact-object mapping 重新评估 | 既有负向检索不证明数据普遍不存在；缺少新证据时不再重复相同搜索 |
| UPG-209／210／229 等跨物种类型资料 | 核查准确 roster 与标签上下文 | 保持比较来源，不能并入小鼠 interneuron 分母 |

UPG-257／259 已完成的是具体资料路线审查；UPG-260 未解决的 package 问题进入既有 UPG-250。纯检索补充优先更新已有记录，不因重复发现缺少文件就自动新增 App 版本。每次检索应带来新对象、新证据、可复核的排除结果或明确下一入口。

默认仍使用公开数据；本规划不安排联系作者、申请受限数据或读取访问凭据。若用户以后改变数据范围，再调整对应依赖。

## 6. 实施顺序与阶段交付

以下是依赖顺序，不是工期承诺。未验证来源的成功率与完整三维数据可得性仍未知。

| 阶段 | 工作 | 用户能看到的交付 | 进入下一阶段的条件 |
| --- | --- | --- | --- |
| M0 | A：确认当前实施基线 | 当前状态说明及准确版本入口 | 当时版本、测试与未提交工作均有记录 |
| M1a | B：小体量来源核验 | 一个 section 的核验结果与确定可用的对象范围 | 文件使用范围、ID、section 与坐标成立；否则保留精确阻碍 |
| M1b，可并行 | E：独立来源逐对象适配 | 可切换的对象明细与同步 viewer | 对象切换、状态及来源单位正确 |
| M2 | B 的二维 pilot + E 整合 | 真实鼠切片中细胞与核的联动浏览 | 核验通过的输入与浏览器验收同时成立 |
| M3 | C、D 的胞体分支、F | 更准确的类型／条件信息、形态细节与加载体验 | 各工作包独立验收，不合并夸大结果 |
| M4，独立数据依赖 | D 的真正三维内部结构 | 至少一个 exact mouse spinal interneuron 的真实内部对象视图 | 完整证据链成立；M2 或比较来源不能代替此条件 |

M1a 若暂不成立，优先继续 M1b、C 和 F；M4 保留为未完成目标。避免让一个暂时不可得的数据包阻塞所有实际改进，也不因容易完成的阶段通过就宣称完整模型完成。

## 7. 实施后的共同验收

这些检查在对应实现发生后执行；本轮规划不产生通过记录。

- **来源与身份：**精确文件版本、hash、ID、species、sample／section、单位与使用范围可追溯；分母从规范输入计算，缺失、未匹配与重复单独报告。
- **科学边界：**主动验证错误关联、坐标不一致、未知标签、缺失核、缺少几何等情况；界面不静默填补、不跨来源推断同一细胞。
- **关键操作：**搜索 → 筛选 → 选中对象 → 查看形态／内部细节 → 切换对象 → 深链接恢复 → 导出。检查加载中切换、空结果及浏览器返回。
- **浏览器：**记录桌面、窄屏和键盘路径；实际确认几何与所选源对象一致，不能只检查元素存在。截图或视频应注明当时版本及对象 ID。
- **工程：**运行受影响的验证与回归检查；封存一次实现增量前，完成项目规定的当前完整验证入口。build、lint、类型检查及条件跳过分别报告；snapshot 通过不代替这些检查。
- **交付表述：**只声明本轮新增并通过验证的能力；区分软件功能完成、来源核验完成及生物学完整性。发现材料或有一个来源卡片，不等于完成细胞内部模型。

## 8. 文件、空间与回滚策略

继续在现有项目内实施，不复制整个项目作为每次迭代备份。新来源先做目录与大小清单，原始文件按固定版本保存一次，使用 hash 去重；派生数据保存转换参数和来源指针。未明确需要前，不获取几十 GB 的原始影像。

未来每次实际实现使用一个独立时间轴 MD，记录目的、已有 UPG ID、改动路径、数据版本、验证结果、未解决项和回滚方法。版本号按届时实际工作分配；本轮沿用已存在的 2.90 作为基线，不新增 App 版本。

回滚限定于本次明确改动的文件和新加入的派生物：用有范围的 patch／提交或精确文件备份保留前态；对新数据记录路径、hash 和引用关系。已有未提交工作先辨认，再实施；不使用整库 reset、全量清理或整目录覆盖。删除任何生成物前先检查引用，并保留最新已验证产物和原始科学输入。

## 9. 规划维护规则与待解决事项

本文件是下一阶段决策入口；[研究升级队列](RESEARCH_MODEL_UPGRADE_QUEUE.md) 保留实施状态，[既有公共数据路线图](PUBLIC_DATA_ONLY_ROADMAP.md) 保留历史背景。旧路线图中的 curator／管理流程不作为本轮研究升级主线。

本规划列出的工作均为待实施建议。只有实际完成并验证后，才按既有生成流程更新队列与注册表；不为规划先增加 completed 数量，也不手工把候选资料改为已接入数据。

后续规划优先补充以下决策依据，无需先扩大项目范围：

1. BIL 一个可追溯 section 的 ID／分类／坐标与文件使用范围是否足以支持 cell+nucleus pilot。
2. V1 最小可验证样本及最终图 barcode 的取得、准确映射与使用范围。
3. 独立来源逐对象适配的覆盖清单，以及尚不能显示几何的具体原因。
4. 三维鼠脊髓同一细胞证据链中缺失的确切文件或关联；公开来源是否出现新输入。
5. 在相同设备和路线下测得的加载基线，据此确定性能预算。

不填写尚无依据的工期、用户规模、研究影响或“完整模型完成率”。下一轮若仍要求规划，应继续补充本文件中的依赖、取舍与验收，不自动开始实施。

## 10. P02：Xenium 接入前的具体研究与验收

### 10.1 本轮新增证据与决定

2026-09-29 重新读取了 [BIL collection 页面](https://doi.brainimagelibrary.org/doi/10.35077/g.1196)：研究范围仍包括成人鼠脊髓及上行投射神经元，不能将目录内所有细胞默认归为 interneuron。[BIL 下载政策](https://www.brainimagelibrary.org/download.html) 仍列 CC BY-SA 4.0；本轮未取得该集合的文件级声明或排除条款，不将一般政策核对等同于完成具体资产核验。

重要修正来自 [10x XOA 2.0 分割算法文档](https://www.10xgenomics.com/support/software/xenium-onboard-analysis/2.0/algorithms-overview/segmentation)：分割用于近似细胞范围；最终掩膜为二维，导出的多边形进一步简化。核扩张默认距离在 XOA 1.0–1.9 与 2.0 以后不同。因此 pilot 的展示名称应为“来源细胞／核分割结果”，不叫“真实膜重建”。这项平台说明不是 BIL 具体文件的方法确认。

[10x XOA 1.9 输出文档](https://www.10xgenomics.com/support/software/xenium-onboard-analysis/1.9/analysis/xoa-output-understanding-outputs) 提供运行 manifest、cell summary 与边界字段说明。处理版本、run／ROI、物理尺度和重分析记录应先核对；chemistry v1 不等于 XOA 1.x。以下是项目拟定的核验方案，字段是否实际存在仍由源文件决定。

本轮下载目录读取失败；[BIL 官方 API 文档](https://www.brainimagelibrary.org/metadataapi.html) 指明的 group DOI 查询也未通过浏览工具读到结果，本地 HTTPS 尝试另出现名称解析失败。这些是本轮访问结果，不证明数据不存在、被删除或受限。未取得 workbook、Parquet 或运行 manifest；此前文件大小继续标为 2026-09-23 本地审查记录。

**P03 补充：**上段“本轮”指 P02 的访问尝试，并不表示项目从未读过这些材料。全量队列中的 UPG-163 保存了更详细的历史审查，包括 34 个小文件的约 1.19 MB 输入路线、原始分割与文章 QC 分母差异、section／curated-label 缺口及条款差异。它与 `bil-xenium-spinal-audit-0.1.json` 的范围不同。恢复研究时先追溯这些旧 receipt，再补真正未解决项；不能重新获取整个数据集，也不能把仅在历史队列中的细节当成本轮已验证事实。具体调度见执行总纲第 6.3 节。

### 10.2 文件顺序与必要条件

| 步骤 | 精确输入或待定位材料 | 要解决的问题 | 不能满足时 |
| --- | --- | --- | --- |
| B-1 目录与版本 | 集合元数据、workbook、`experiment.xenium` 或等价运行说明 | 哪个 run／ROI、处理版本、重分析版本和文件集合属于同一输出 | 保留候选入口；不混用不同处理输出 |
| B-2 三表关联 | `cells.parquet`、cell／nucleus boundary Parquet | 完整 cell ID、schema、来源坐标、每个对象的 polygon 分组 | 隔离无法关联的对象；记录原因与数量 |
| B-3 section 映射 | 来源 sample／section 对照表或有明确身份的 ROI 标注 | 一个 ROI 内哪些对象属于指定切片与动物 | 可继续来源 ROI 层面的核验；不能宣称已完成单切片 pilot |
| B-4 类型映射 | 作者提供的 exact-cell annotation 与方法说明 | 哪些 cell ID 对应何种来源类别、标签迁移或置信信息 | 保留未分类对象；不将算法 cluster 编号当作作者确认类型 |
| B-5 图形复核 | 同版本可用的局部核图像或 segmentation mask | 多边形是否来自所声明的源结果，局部叠加及轴向是否一致 | 无影像时只声明数值／结构核验，不声明像素级复核完成 |

前四个已列文件之外的 manifest、映射与 QC 文件均须先确认位置和大小。文件列表没有列出的名称仅为待寻找的输入，不算已存在。若需要 mask 复核，优先评估已列的 `cells.zarr.zip`（历史记录约 286.67 MB）及局部可读性；不默认获取 27.51 GB 全部 DAPI stack。运行概要 HTML 先提取必要元数据，不执行嵌入脚本。

`analysis.zarr.zip` 即使存在，也不能直接当作文章的最终类型标注。必须找到明确的作者标签字段、cell ID 映射和对应处理版本；没有这些内容时，pilot 只能按来源未分类分割对象浏览。

### 10.3 拟定数据契约

下列名称是规划中的内部字段，不是声称源数据已有同名列。

| 字段组 | 拟定要求 |
| --- | --- |
| 对象身份 | `datasetId + sourceVersion + run/roi namespace + nativeCellId`；源 ID 始终保留完整字符串，不去掉后缀，不跨目录单靠 cell ID 合并 |
| 生物学上下文 | sample、section、animal、region 和各自来源位置；缺失保留 null 与原因，目录名不自动成为事实 |
| 几何身份 | cell polygon 与 nucleus polygon 分开；保留 source component／label ID、顶点顺序和文件行位置。没有可靠 component 分组时不拼接多个边界 |
| 几何性质 | 声明为来源分割多边形近似；方法为核扩张、染色辅助或未核实，均附版本／参数来源；不能自动赋予 observed membrane 权限 |
| 坐标 | 原始 x/y、单位、frame、原点与方向；所有显示翻转／缩放另存，绝不改写原始数值。没有可靠尺度则不显示 µm 标尺 |
| 分类 | 原始标签、annotation 版本、映射依据、来源置信信息和分类状态；无作者映射则 unresolved，marker 匹配只能另列为候选 |
| 文件记录 | 精确 URL／archive member、字节数、真实校验算法与 digest、获取日期、使用范围；同一对象的多个文件绑定到同一版本集合 |

B-2 的 cells 表要求复合 cell key 唯一；边界表则允许同一 cell 的多个顶点、多部件或核记录。按核文件实际结构核对基数，不能强制“每细胞恰好一个核多边形”。自相交、非有限坐标、缺失闭合标识或退化轮廓需单独报告，不能自动平滑、补点或封口掩盖异常。

如果新接口采用 `verified-present`，它仅是拟议的文件／材料验证状态，当前结构证据代码中没有这个状态名；它不能替代上述十类状态，也不表示几何是直接观测解剖。来源分割、项目派生与原始影像的表示性质须另有字段；文件验证、结构证据和表示性质不能挤进同一个布尔值。

### 10.4 计划中的页面流程

入口依次选择来源输出、可核实的 section、对象。主区显示二维细胞／核分割图层，侧栏显示完整 ID、原始标签、方法和缺失项；点击列表与点击多边形保持同一选中项。窄屏上下排列，列表提供键盘等价入口。

图层名称直接说明“来源分割结果”；原始影像只在准确文件和变换可用时出现。切片身份未核实时标题保留 run／ROI，不用推测名称；无 cell-type mapping 时仍能查看合规来源对象，但不展示“已确认 interneuron”筛选结果。筛选掉当前对象后清除其详情和图层高亮。

验收包含：同 ID 不同 run 不串对象；同一对象核／细胞层对应；未分类与未匹配的数量可追溯；缺少核不补默认核；坐标单位错误不悄悄换算；导出保留来源 ID、方法、状态与版本。polygon 面积不能直接用于生物学测量；未来若需要测量，须另定 mask、方法和验证范围。

## 11. P02：逐对象适配与页面验收清单

### 11.1 当前代码已经提供什么

[独立来源索引](../app/independent-source-object-coverage.js) 的 `buildIndependentSourceObjectCoverage()` 返回五条来源摘要，当前不接受被选中对象；[索引页面](../app/IndependentSourceObjectCoverage.tsx) 在模块级创建这份摘要。说明文字中的 stable ID 不等于可操作的对象索引。

[活动记录 Provider](../app/ResearchActiveRecordProvider.tsx) 与 [请求状态逻辑](../app/research-active-record.js) 已有 requestKey、generation、取消请求和同步隐藏旧记录机制。[Explorer 类型定义](../app/research-explorer-index.js) 尚不含独立 source object 类型。规划应复用状态语义，并设计明确的新选择类型；不能把独立对象伪装成现有 `morphology_record`。

保留五条来源卡片作为入口，新增对象选择与对象详情。复用 [精确记录细节](../app/exact-record-detail-coverage.js) 的结构槽位及状态名；独立来源状态从明确的对象契约生成，不从说明文字关键词推断。现有 viewer 与资产继续原位复用。

### 11.2 适配的完整首轮范围

| 来源 | 对象范围与复用入口 | 不能被适配层创造的关系 |
| --- | --- | --- |
| Native contours | [现有 NativeContourRecordViewer](../app/NativeContourRecordViewer.tsx) 合并目录的全部 7 条记录；不以 Todd 两条拓扑审查代表全集 | NMO50394 外壳与 NMO45718 crosswalk 各带自己的派生依据，其他对象不继承 |
| MICrONS | 现有已准入 cell 与 nucleus 组件，按来源 root 与关系记录取对象 | 不从邻近位置补出 mitochondria、synapse 或新的 parent 关系 |
| BANC | v888 的精确 SWC 与同 root 核 annotation point | point 不变成核 mesh；细胞器 metadata count 不变成可显示对象集合 |
| Super-CLEM PALM | acquisition + 文件局部 detection 行，保留原始列索引 | detection 不变成 molecule 数；不关联另一个 EM acquisition 为同细胞 |
| MicroStructFormer | release + split + image/mask row，按来源行的可用范围处理 | image row 不能变成一个已识别的神经元或三维内部对象 |
| BIL，条件成立后 | 第 10 节精确来源 cell 与分割组件契约 | 未取得或未核验输入时只保留规划项，不加入现有可显示对象数 |

### 11.3 拟定统一接口与行为

对象接口至少分开 `sourceId / registryId / releaseId / objectKind / sourceObjectId`、上下文、几何组件、关系记录、文件校验记录和可用状态。parent 关联需要独立证据位置；计数使用 `{value, unit, scopeKey, derivedFrom}`，不把 root、contour、detection 或 image row 汇总为 cells。大整数 ID 保留字符串；MD5 和 SHA-256 按实际算法记录。

| 验收场景 | 必须发生的行为 |
| --- | --- |
| 不同 source／release 出现相同 ID | 缓存、选择、URL、导出和校验记录均分离；未知对象不使用默认对象代替 |
| A 已加载，改选 B，A 的慢请求才返回 | 选择 B 时立即清空 A；A 的成功和失败均不能覆盖 B；覆盖 A→B→A 与版本变化 |
| 精确 parent 关系被移除或版本不符 | 关系状态不可用；空间重叠、标题相似和 shared DOI 均不能恢复关系 |
| bytes／hash／frame／单位不一致 | 拒绝该资产的图形显示，保留具体失败原因，不留下上一对象 |
| 不同表示类型 | 点仍为点，SWC 仍为线，二维分割仍为二维，派生外壳仍标派生；不增加 observed membrane 或内部对象数量 |
| 来源可用状态改变 | not assessed、unavailable、not established、source-reported-absent、rights-held 等保持不同含义 |
| 增删某来源对象 | 只改变该来源、该单位的计数；目录中的可核实对象均能逐一定位 |
| 完整使用路径 | 来源卡片 → 对象 → 图层 → 键盘／窄屏切换 → 深链接刷新恢复 → 导出始终指向同一对象和版本 |

现有 [来源索引测试](../tests/independent-source-object-coverage.test.mjs) 主要核对五来源说明与边界；[活动记录测试](../tests/research-active-record.test.mjs) 覆盖原活动记录链路；[细节测试](../tests/exact-record-detail-coverage.test.mjs) 已涵盖部分缺失状态。这些已有测试通过不证明独立对象链路完成。恢复实施后需验证其自身异步状态和真实交互，而非仅增加字符串断言。

### 11.4 本轮规划队列的具体下一步

以下为原 UPG 任务的拆解，不分配重复 UPG ID，不修改实施状态。

| 优先级 | 既有任务 | 下一次需要拿到的可审查产物 |
| --- | --- | --- |
| P0 | UPG-244／255 | 一个实际 run 的 manifest／schema／section／annotation 可用性表；明确核扩张等方法证据与缺失条件 |
| P0 | UPG-251／252 | 对六类来源逐项确定对象 key、组件、parent 证据、状态与现有 viewer 映射；BIL 保持条件项 |
| P1 | UPG-230 | 两条真实使用路径的加载测量方案：首次进入来源、切换具体对象；预算待测量后确定 |
| P1 | UPG-254／253／247 | 仍按第 4 节推进准确类型／年龄／引用映射，不以增加摘要卡片替代 |
| P2 | UPG-261 | 额外 DAT↔SWC 候选的独立拟合与保留验证设计；不给其他记录套用 NMO45718 的变换 |

本轮解决了部分实现定义和表示边界，未完成 BIL 输入核验、独立对象适配或 M4 三维内部结构里程碑。下一轮规划应从这些精确缺口推进，不重复已经完成的 2.90 联展。

## 12. P03：全部升级项目与长时间自主执行

### 12.1 全量覆盖结果

P03 将当前规范文字队列与机器注册表按完整 ID 对齐，243 条一致；另核对实际应用引用的旧 catalog 21 条记录。保留 `UPG-027A/B` 等字母后缀；不按连续编号推算项目数量。全部条目有具体下一动作、验收、关联信息和受阻后的替代路线。

| 研究方向 | 当前覆盖条数 |
| --- | ---: |
| 参考解剖 | 6 |
| 分子分类与谱系 | 42 |
| 空间与切片 | 23 |
| 真实形态 | 47 |
| 连接与投射 | 15 |
| SCI 与疾病状态 | 14 |
| 电生理 | 5 |
| 内部结构与显微细节 | 57 |
| 科学来源与对象身份 | 19 |
| 研究界面与操作 | 15 |
| 合计 | 243 |

规划分派为：34 项可推进候选、93 项需解决具体来源依赖、36 项有新证据才重查、78 项保留已完成范围或后继成果、2 项保留精确 no-go。它与官方状态的 73 项精确 `completed` 是不同统计，不能混称完成率。“可推进”首先包括当前差额核验，不代表每项已具备全部输入。

21 条旧准入记录不遗漏也不混入上述分母：科研部分归入现有工作包，现有正确性保留，新增 curator／审批扩展明确暂缓。科学身份、文件校验和真实使用范围仍属于必要科研约束，不能因不做行政流程而省略。

### 12.2 对完整 App 的覆盖方式

[执行总纲](LONG_RUN_UPGRADE_RUNBOOK_2026-09-29.md) 用 F01–F20 定义能力验收，用 W01–W16 组织可独立推进的工作包，包含形态、胞内结构、空间、类型、年龄、SCI、生理、连接、参考解剖、来源身份、信息页、查询、导出、性能、可靠性与恢复。

已有实现作为起点，不把“所有升级项目”理解成全部从头实现。跨物种比较、二维分割和派生显示各自保留价值，但不替代真正鼠脊髓同细胞三维内部结构。未知未来研究采用统一发现／去重／接入规则，不能预先承诺尚未存在或不可取得的数据。

### 12.3 十小时以上无需逐项重定向的规则

- 用户未来明确启动后，以“选具体差额—核依赖—实现／研究—验证—记录—下一项”的闭环持续推进；常规可逆技术决策自主处理。
- 一个主实现与一个核心来源研究并行；同源旧任务先归并，已完成部分不重复开发。
- 每个具体来源失败都有替代工作；同一失败不反复检索，只有新证据或合理重试时机才重查。
- 时间窗口提供超过十小时的工作容量，不承诺未知数据在固定时间内出现，也不靠等待或重复全量测试维持时长。
- 统一处理源文件缺失、网络故障、巨大资产、条款不明、身份未证实、旧工程失败、浏览器不可用及并发文件冲突。
- 每个实际增量原位修改、适当验证、独立时间轴及可恢复断点；无整库复制、无虚构完成、无擅自对外发布。
- 环境或会话中断后从真实当前状态和活句柄恢复，不能只依赖日志中的计划或句柄。用户改方向或要求停止时服从最新要求。

P03历史记录：可复制的实施启动指令、首批默认取舍、完整周期模板和全部转向规则已写入执行总纲。**在P03结束时尚未启动实施；I01已经依据当前用户请求启动。** 下一轮若仍只是“继续深化规划”，继续维护这组 MD；用户明确开始实施后，才启用该执行流程。

### 12.4 文档各自职责

| 文件 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| 本主规划 | 科学目标、当前基线、核心工作包与全部文档入口 | 不作为应用已经实现的证明 |
| 长时间执行总纲 | 能力全集、调度、研究、验证、失败转向与断点规则 | 不替代真实权限、运行句柄或科学证据 |
| 全部升级项目对照 | 每个现有 ID 的原状态、剩余动作、验收和替代路径 | 不重写官方完成状态，不重复建立同义任务 |
| 规范研究队列与派生 registry | 实际研究／实现状态与新候选 | 不因规划写完而自动推进 completed |
| 各轮独立时间轴 | 当轮证据、改动、验证与回滚 | 不追溯改写其他轮次已发生的事实 |

读取顺序为本入口 → 执行总纲相关章节 → 当前候选及其关联条目 → 实际文件。长文档按需读取，避免每轮重新消耗全部上下文。

## 13. I01：2026-09-29/30 实际实施结果

当前应用进入 `2.91.0-research.1`。实施保留所有启动前未提交修改；P02/P03、完整覆盖表和 2.90 manifest 均为可辨认的历史记录，没有将历史测试改称本轮结果。规范队列才是当前状态；下表按实际验收范围说明，不能按完成条数推断科学目标完成率。

| 工作包／里程碑 | 实際结果与入口 | 仍未满足的条件 |
| --- | --- | --- |
| A／M0 | 核对2.90基线、462个脏路径、当前canonical units和既有35处类型错误；2.91类型修复与完整工程回归另记时间轴 | 本地研究迭代不等于打包或公开发布 |
| E／M1b | 五来源逐对象工作区 `/objects`：7 native records/72 loops、2 MICrONS entries、2 BANC entries、18,358 PALM detection columns、540 image/mask rows；完整键、分页／搜索、图层／点／切换、URL返回、源receipt、图像及实际view导出/同版本恢复；原生annotation采样敏感性及按方法分类的16条连接断言按需展开 | MicroStructFormer没有获准图像payload，只提供准确commit/row定位；BIL条件项不被代选；不同单位不混为细胞数 |
| B／M1a核验阶段 | BIL全部16run/slide小元数据已核验；来源方法、原始计数、329outline labels、许可声明差异和缺失frame/section/cell-ID映射可浏览于 `/source-audits` | 核扩张距离未提供；outline CSV无物理frame、稳定cell join；核验结论保持metadata-only，M1a通过接入门槛及M2二维cell+nucleus pilot均未完成 |
| C／M3来源信息 | 核验29GEO样本条件、4-sheet final barcode workbook、29barcode和1代表matrix；1,127NMO对象×10论文的PMID/全标题/严格作者筛查；新增387profiles锚定2–4记录精确marker/context比较和导出，以及Cano11profiles/923现有核记录逐profile下钻 | 28barcode文件相同；104,240workbook行未匹配native列；E13.5虽匹配仍无cluster/reuse；没有准入核级名单／同细胞关联 |
| D／独立参考 | WT小鼠脊髓真实raw与manual nucleus局部切面；鱼V3 tonic及rat NMO34024独立source-local SWC参照；NMO50394现有DER开放壳作为显式单独图层复用 | WT核instance2的cell class unknown、ROI不含核边界；鱼／rat不计鼠IN；不完整、名称／转换／extent冲突全部保留 |
| F／W13–15 | `/objects`几何和Three在显式选对象后加载；audit/concordance面板随active tab加载；比较SWC默认两条参照不宣称选择后才加载；记录每次源检查／view-ready时间，390px、键盘和导出逐路验证；既有35处类型错误已修复 | 既无可比2.90生产首屏测速，也未实测屏幕阅读器／全App缩放；不声称速度提升百分比或全App可访问性完成 |
| D／M4 | 对已有准确公开鼠脊髓EM来源重新做有界核验，独立参考可用 | 尚无exact mouse spinal interneuron的volume＋segmentation＋parent＋frame＋raw evidence完整链。M4仍未完成；M2／WT／MICrONS／BANC不能替代 |

完整变更、输入、验收、科学门槛及后续触发条件见[实施时间轴](RESEARCH_TIMELINE_2026-09-29_IMPLEMENTATION_01.md)和[34个候选差额审查](READY_CANDIDATE_DELTA_REVIEW_2026-09-29.md)。本轮完成真实可实施增量并明确隔离缺失来源条件，**没有将完整研究App或M4标为完成**。此处不启动后台任务、作者联系或发布。

本轮最终工程验收：正式构建、严格类型检查、lint及完整research入口通过；1,085 tests，1,070 passed、15 conditional skips、0 failed（含生产gzip入口修复后完整复验）。本机正式页面位于 `http://127.0.0.1:3003/objects`。规范243项中79项精确completed；本轮新增6项已完成范围，其余partial／in progress与具体缺口保留。整个MD的最终科学目标及全部工程覆盖仍未完成。

全部F01–F20及后续工作包的当前完成审计见[完整Goal核验与下一实施断点](GOAL_REQUIREMENT_AUDIT_2026-09-30.md)。用户2026-09-30明确要求持续至全部Goal满足，目标保持active；I01只是已验证增量，不改变总范围。

## 14. I02：2026-09-30 共享身份与关系约束

五来源Objects与Cano11profiles/923现有核行已接共享source/release/namespace/nativeID及specimen→section→cell→component→synapse层级；unknown parent保持null和原因。真实source-population assignment经当前Cano名单校验，distinct cell与其nucleus不被称为same_physical_object；关系证明不自动开放几何或REG。JSON与view恢复校验当前canonical identity、父ID及missingness，旧导出缺省仍按准确当前源派生。

专项28/28及完整research入口通过：1,095 tests／1,080 passed／15 conditional skips／0 failed，strict/lint/build通过。生产页面验证MIC/BANC契约核心、MIC/PALM/Micro实际身份和Cano筛选清除／390px显示。UPG097、102保持partial，legacy入口及UPG118仍待完成；科学M2/M4不因该软件增量变为通过。详见[I02独立时间轴](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_02_IDENTITY.md)。全部Goal仍active。

## 15. I03：2026-09-30 内部对象必需来源契约

UPG118的13组必需字段与独立source proof／当前loader byte receipts已接selected-record四内部slot及计数。旧“positive count＋某hash”捷径被移除；需正确component kind、自己的geometry hash、稳定specimen/cell、完整physical frame、file-specific rights及原始volume/segmentation QC。source population、二维点、共同marker或可视化外观不能满足该门槛。详情内可展开准确缺失原因，独立参考不代替目标cell。

专项17/17及完整research入口通过：1,104 tests／1,089 passed／15 conditional skips／0 failed，strict/lint/build通过；516当前输入receipt，生产390px与Enter展开已核验。641实际Explorer records保持0同细胞内部对象准入，synthetic positive仅验证契约，不是科学source。UPG118仍partial，真实source producer和M4证据链尚未满足。详见[I03独立时间轴](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_03_INTERNAL_CONTRACT.md)。全部Goal仍active。

## 16. 2026-09-30 I04：BIL原始三表核验增量

一个准确run/analysis/ROI的37.28MB三份Parquet已取得；182,698cell行、4,564,211cell vertices、4,468,434nucleus vertices全部核验。完整cell_id无重复/孤立，2,262无核和62多核记录与nucleus polygons逐ID一致；180,502共同数字label ID跨两边界文件全指向不同cell，不能用于join。10,316来源行明确5.0µm核扩张，解除这一个run/该方法行范围的参数缺失；其他15run及2026-09-29快照不被改写。

`/source-audits`新增准确schema详情、四个带LOC和NaN的例行、共享cell identity及current selected-run receipt；跨run切换清除当前表。原始几何没有接入public/viewer。section/donor crosswalk、outline frame/transform、curated cell标签及policy差异仍缺；M1a/M2/M4与完整Goal均未因此满足。来源证据见[BIL三表审查](BIL_XENIUM_GEOMETRY_SCHEMA_AUDIT_2026-09-30.md)，验证见[I04独立时间轴](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_04_BIL_SCHEMA.md)。UPG100/163/244维持partial，UPG255继续gated，79精确completed不变。

I04完整工程复验退出0：1,113 tests／1,098 passed／15 conditional skips／0 failed，strict/lint/build及全部validators通过；全Parquet重放结果逐字节一致，530当前输入receipt。正式页Run8→Run1旧table/row清零、返回重置例行、NaN/2核/准确cell与未知specimen/section均已实际核对；390px及Enter/原生dropdown键盘操作通过。全部Goal保持active，不能以本次schema成功代替M2/M4或其余legacy工程余差。

## 17. 2026-09-30 I05：独立鱼／rat参考的共享身份和视图恢复

现有两份准确SWC snapshot的reference cards接共享hierarchy及co_display_only关系；准确source reconstruction record ID已知，physical cell/specimen/section不由source名称或cohort fields修补。按当前loader全部三个file receipts及canonical source object验证view receipt，核对实际renderer generation、camera、layers、clip状态、source bounds的display center/scale、source/version/namespace和科学scope。恢复先清空旧viewport，重核原始文件后以新generation应用。隐藏图层保持隐藏，不添加跨源身份、配准、膜surface或mouse内部对象。

专项24/24、strict和专项lint通过，正式浏览与完整验证见[I05独立时间轴](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_05_COMPARATIVE_REPLAY.md)。UPG091/097/102仍partial；全部Goal保持active。

I05完整复验退出0：1,122 tests／1,107 passed／15 conditional skips／0 failed，534当前输入receipt。正式浏览已验证隐藏图层恢复、新loader代次、实际旋转camera→reset→restore（位置差约1.14e−13）、rat对fish来源拒绝、rat自身恢复及390px／Enter操作。原始源文件、rat冲突与物种单位保留；source component record准确，但physical cell/specimen/section不补造。其他legacy viewports、源合同与M2/M4科学终态仍未全部达成。

## 18. 2026-09-30 I06：旧研究档案的来源范围与逐字段导出

实现范围为641条固定Research Explorer记录及30条独立Todd补充记录，共671条、22个准确canonical parent来源。页面和科学档案JSON/CSV共用source species/life-stage/region/experimental units与display／underlying observation units；null与原因保留，source上下文不赋给个体cell。13个SCI条件的原字段保留，小鼠／animal、人类／participant、neonatal／adult独立显示与导出。

10,038个证据字段保留原引用及准确project field位置；upstream字段／章节位置、source/object-level引用、待解析locator和1,169个仅hash引用明确区分，不将本地索引位置或hash当作上游生物学核验。导出只包含scientific dossier，actual rendered camera/view另需独立receipt。切换记录或generation后旧receipt同步失效。专项44/44、最终12/12及strict/lint通过，完整工程与正式浏览结果见[I06独立时间轴](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_06_RECORD_SCOPE.md)。UPG051/052/110维持partial，其他legacy路径、精确source依赖及全部Goal继续未完成。

I06最终完整入口退出0：1,134 tests／1,119 passed／15 conditional skips／0 failed，542当前input byte receipts，build／strict／lint和全部validators通过。实际SCI mouse-human与neonatal-adult分离、Sathyamurthy DE-1单独sample/nucleus单位、准确Todd322379版本／hash、记录切换清除旧receipt、Back/Forward、invalid focus、390px及Enter已核验。Blob按钮请求已观察，落盘仍未核实。全部Goal保持active；此处记录工程增量，不核销BIL M2与same-cell三维M4或未覆盖legacy路径。

## 19. 2026-09-30 I07：无损索引传输与实际加载记录

原641条index／canonical JSON与manifest保持；确定性gzip派生表示269,594 B，解码为原10,682,233 B并通过相同SHA-256/schema。默认入口仍是原URL，生产服务使用相邻gzip；明确API为独立测量入口。actual transfer、缓存语义及fetch／checksum／JSON decode-parse／schema成本保存在独立receipt，不改变source record、missingness或当前选择。

完整入口1,140 tests／1,125 passed／15 conditional skips／0 failed，550当前input byte receipts、build／strict／lint及全部validators通过。正式页面默认与两条fresh请求均实际传输269,894 B；单次耗时波动保留，不声明历史速度改善、全AppJS execution或scene-ready预算。390px及Enter通过；UPG230仅partial，79 exact completed不变，完整Goal继续active。详见[I07时间轴与测量](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_07_INDEX_TRANSPORT.md)。

## 20. 2026-09-30 I08：旧形态比较器的准确来源身份

149个已准入观察（142固定census＋7独立routes）在卡片和科学JSON／CSV共用source／release／namespace／native string ID、unknown实验层级及所有pairwise co_display_only关系。选中2–4对象保留1／3／6组关系；repository观察ID不补造physical cell。source／mode／scale／member变更同步清除旧导出。真实浏览发现并修复未变更viewport绑定被清空导致永久禁用，以及7份supplementary bounds键顺序误判；149实际源几何bytes／SHA／完整source-frame gate通过，源数据原样保留。

最终30／30专项与完整入口1,151 tests／1,136 passed／15 conditional skips／0 failed，564当前input byte receipts，build／strict／lint和全部validators通过。生产mixed／2D／zoom／radius／remove／add／深链接／Back／Forward／390px／Enter已验证；actual DOM记录与截图见[I08独立时间轴](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_08_MORPHOLOGY_IDENTITY.md)。科学receipt不包含完整renderer／clip／layers重放；Blob落盘仍未核实。UPG097／102仍partial，79 exact completed不变，M2／M4与全部Goal继续active。

## 21. 2026-09-30 I09：固定DANDI原始采样预览

UPG154接入独立mouse spinal extracellular信息入口。001469／0.250611.1844的61文件manifest和一个355,191,072B NWB asset已固定；仅15块HTTP206／3,918,112B范围读取并保存。离线HDF5重放准确electrode table与32group refs，channel0首秒30,000个int16原值无损派生76,202B。按需runtime bytes／SHA验证后显示每个采样点，支持100ms窗口／sample cursor、含完整citation与license的JSON／CSV、同源预览恢复。unknown session ID、native volts/conversion1/offset0及unverified calibration保留，零identified interneuron／isolated unit／cell-morphology join／REG；whole-NWB SHA仅declared，未下载148.8GB corpus。

最终23专项、7最终trace专项与完整入口1,158 tests／1,143 passed／15 conditional skips／0 failed，595当前input byte receipts，build／strict／lint及全部validators通过。正式页面首／末采样、keyboard切窗、单位篡改拒绝、准确恢复、关闭重开、390px和13px坐标已核验。核心分母和79 exact completed保持；UPG154仅partial、有界首秒preview。详见[I09独立时间轴与原始证据](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_09_DANDI_TRACE.md)。M2／M4及所有剩余Goal继续active。

## 22. 2026-09-30 I10：二维形态的表面授权修复

真实页面确认NMO194468／194469虽标source 2D且保留diameter，旧比较器和共用viewport仍可生成三维frusta。现在按钮、actual mode、source switch、科学JSON／CSV及13轴microdetail共用3D＋source diameter门槛：2D请求radius只显示平面centerline、surface unavailable，原直径与零z坐标保留。validator独立核对94原直径输入、92个3D派生授权与2个planar禁止项，不改写历史source合同或geometry。

最终36专项与完整入口1,160 tests／1,145 passed／15 conditional skips／0 failed，602当前input byte receipts、build／strict／lint及全部validators通过。生产两条2D radius深链接、准确fallback／源直径profile、3D正向radius、切换旧receipt清除、390px／Enter均已实际核验并保存截图。详见[I10独立时间轴](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_10_PLANAR_RADIUS.md)。UPG091仍in progress，完整形态view replay与其他legacy路径继续推进；79 exact completed、M2／M4及全部Goal未自动完成，目标active。

## 23. 2026-09-30 I11：形态真实byte proof与模式转换

149准确来源geometry的loader现在只在实际长度／SHA／源frame／identity核验后登记private payload receipt，全部数组和geometry冻结。普通cache复用仍核当前record，明确fresh读取使用no-store／新代次，取消或错文件无替代payload。科学comparison JSON升为0.5.0、CSV增加实际receipt列，必须有当前真实private payload；raw SWC hash保留声明scope，不混称runtime已读raw文件。source切换不短暂暴露上一源几何。

浏览发现的重复active mode清空binding、以及2D requested变化但actual不变两种路径已修正：重复选择保留当前有效导出；请求变化更新科学provenance并清除旧prepared receipt；actual变化才使viewport runtime失效。39专项与最终完整入口1,170 tests／1,155 passed／15 conditional skips／0 failed，609当前input byte receipts、build／strict／lint与全部validators通过，正式3D／2D／重复mode／source switch／390px／Enter／CSV请求已验证。详见[I11独立时间轴](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_11_GEOMETRY_RUNTIME.md)。完整camera／renderer／clip／topology／inspection恢复仍需下一增量；UPG091、M2／M4与全部Goal未完成，目标active。

## 24. 2026-09-30 I12：149准确比较形态的完整来源视图

149准确comparison observations现在可在每卡捕获实际camera／projection、requested与actual mode、THREE revision及context configuration、current viewport／buffer／pixel ratio、clip、topology／centerline／radius／source axes、准确SWC node／dim、source-derived bounds与display transform；保存native source context／rights wording、共享identity／unknown parents、source frame和实际private geometry byte proof。14份渲染／检查／恢复代码及依赖锁定输入另存build byte receipts，拒绝同版本号而代码不同的恢复。科学comparison JSON0.5与单卡view schema0.1各自验收。

同源恢复清除旧scene与当前runtime authority，no-store重新读取源bytes，重建实际geometry／mode，再核新scene bounds、应用并回验实际pose／layers／inspection。读取失败同步清除旧已验证提示和比较geometry proof，未保留旧scene；恢复源文件后可重试。每次真实视图变化单调使旧capture失效，Reset回原位置也需重捕获。当前layout决定aspect，不声明跨尺寸pixel-identical；2D与No Diameter的radius请求仍actual skeleton。未补造physical cell、内部结构、缺失z、完整axon或atlas registration。

最终44专项与完整入口**1,179 tests／1,164 passed／15 conditional skips／0 failed**，build／strict／lint与全部validators通过，619当前input byte receipts。正式浏览核验真实3D拖动＋node62／dim／hidden topology、同源fresh proof与retry、supplementary合法radius、2D node24的390px／Enter恢复、wrong source／wrong build拒绝、无源直径3D记录242822的中心线门槛；相机恢复实测position差0，390px无横向溢出。JSON导出请求已操作，浏览器Blob落盘未验证；实际DOM记录及可重放JSON示例已保存。详见[I12时间轴与证据](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_12_MORPHOLOGY_VIEW.md)。**UPG091与F16仍部分完成，其他legacy viewers及M2／M4尚未满足全部目标，Goal保持active。**


## 25. I13：准确形态全集原始字节证明与视图恢复

已将8.6.124 no-age Universe全部1,097记录接固定index／roster的private byte producer、immutable raw-SWC parse、共享identity及strict full-view capture／same-source no-store restore。与149比较观察重叠部分保留各自namespace、frame及raw／JSON proof scope，不重复计数。955来源直径输入与916三维表面授权分开；39 source2D保留已有Z但禁surface／extrusion，142 No Diameter仍centerline。修正absolute画布覆盖恢复控件及390px坐标说明重叠。

最终完整research入口退出0：1,188 tests／1,173 passed／15 conditional skips／0 failed，build／strict／lint通过、634当前input byte receipts。实际3D drag／node62／dim／hidden topology、source2D非零Z／node24／390px Enter、No Diameter、旧目录raw SWC复用、wrong source／build、missing file清零／retry及永久capture失效均通过；20固定renderer inputs与源bounds／actual applied pose分别核验。保留原2.34 implementation bytes及2.34／2.90 frozen manifests，当前2.91独立验证。

详见[I13时间轴与证据](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_13_UNIVERSE_VIEW.md)。UPG091及完整Goal尚未全部完成；individual／main scene／8.6.126 Todd等入口继续，M2／M4来源链缺口保留，不以工程验证替代科学终态。


## 26. I14：个体与179条主场景的实际来源证明

冻结142-record individual改接私有geometry实际字节producer、不可变payload和准确当前frame，换源同步清旧画布／inspection／type filters。179条main scene分别核142 census、7 supplementary 8.6.124和30 Todd supplementary 8.6.126的规范record／身份／frame／实际bytes／SHA／QC／bounds；各自source context／namespace／membership与unknown物理父链保留，不混计census。actual rendered object和当前JSON runtime receipt含实际private proof；未渲染／失败清除proof、context和旧几何。raw SWC checksum仍仅声明，本增量未重读raw文件。

共享149-record loader只缓存完成的verified payload；并行consumer取消相互独立，forceReload失败移除旧cache。主场景换选择或mode前清几何并增加epoch，晚到结果不能写回新选择。个体computed字段读取实际标准化SWC结果；二维说明准确保留diameter而禁surface。证明面板可展开、展示独立身份及readonly JSON，并使用整行避免窄列挤压。

完整research入口退出0：**1,195 tests／1,180 passed／15 conditional skips／0 failed**，build／strict／lint及全部validators通过；644当前input byte receipts。实际179文件重放与损坏／缺失／取消／伪造／跨source／failed fresh cache负例通过。正式浏览核验3D node62＋隐藏类型后的快速换源、两条2D／native diameter、Todd No Diameter与合法radius、8.6.124独立补充身份、缺失文件两个入口清零／恢复新proof、390px／Enter／无横向溢出。JSON请求已操作、原始数据未改；Blob落盘仍未观察。后续只对证明面板整行CSS及文档／清单做最终构建和相应检查，日志分别保留。

详见[I14时间轴与实际证据](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_14_LEGACY_SOURCE_PROOF.md)。当前source proof不等于individual／main-scene的full-view camera／layers／clip／inspection／renderer build恢复，UPG091仍in progress、79 exact completed不变。另发现冻结Research Explorer档案中二维194468／194469的旧surface文字未体现当前3D门槛，保留原文件并登记下一增量做准确runtime说明／科学导出对账；不把旧档案声明作为当前renderer许可。M2／M4与完整Goal继续active。


## 27. I15：形态档案的当前渲染规则与旧声明对账

Research Explorer和active-record两个科学档案入口共用179-record declared rendering policy，准确核focus键／namespace／版本／142＋7＋30成员贡献／文件SHA与path／source frame及0REG。二维禁表面和深度、No Diameter拒绝placeholder；合法3D＋diameter仍须当前private geometry bytes才可显示DER。政策明确不包含actual byte verification或rendered view；I14实际source proof独立保留。

两条二维194468／194469的旧“Available after checksum verification”文字在原index／record中保留，UI／CSV标为Archived radius-surface declaration，并展示准确当前UNAVAILABLE。科学source scope与dossier升0.2.0，原fields、locators、missingness和units无损，附当前policy及archive解释；CSV拒绝篡改许可、复制他源policy、虚构actual verification、改原field和旧schema。统计范围单独对账：142 frozen有94 diameter／92三维条件gate，7 supplement有5／5，30 Todd有10／10；总179个来源观察有109原diameter／107条件gate／2二维／70 No Diameter，不制造合并生物分母。

完整入口退出0：**1,201 tests／1,186 passed／15 conditional skips／0 failed**，build／strict／lint与全部validators通过，650当前input byte receipts。新增6专项逐一核179实际geometry bytes／SHA及native dim／diameter、全部671原档案字段和JSON／CSV负例。正式两个入口policy／record一致、两条2D、Todd有／无diameter、独立supplement、换源清旧prepared、Back／Forward及非形态policy null均通过；390px／Enter prepare有效且无横向溢出。CSV下载请求有notice、Blob落盘未观察；实际prepared JSON及独立CSV重放保存。

详见[I15时间轴与验收](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_15_DOSSIER_RENDERING_POLICY.md)。完整individual／main-scene camera／layers／clip／inspection／renderer build恢复仍未完成，下一增量直接复用I14 actual producer及现有source-view核心继续，不重复policy／loader。UPG091仍in progress、79 exact completed不变，M2／M4和全部Goal继续active。


## 28. I16：142 条个体形态的完整来源视图恢复

复用 I14 actual private geometry producer，将 frozen census 的独立个体 renderer 接完整 source view capture／same-source no-store restore。实际 camera/projection、启用的原 source types及可见centerline groups、topology/radius/axes、clipping、node/dim、source bounds/frame、private byte proof与25个renderer代码/样式/依赖inputs绑定；新scene回验actual applied pose后才完成。错source/build及伪造输入在fresh recheck前拒绝，当前正确scene保留；fresh失败、取消/晚到与换源清当前scene/proof，不回退旧cache。真实改变后旧capture不复活。142实际geometry均专项重放，94 source diameter中仅92个3D gate，2条2D及48 No Diameter的原字段与边界保留，0 REG/0同细胞内构。

正式页面已验证3D真实拖动、node62/dim、隐藏type和topology、fresh restore相机差0；2D node24在390px/Enter恢复且无横溢；No Diameter恢复完成。修正换源重复canvas、浅底proof不可读、失败残留DER徽标，以及旧grid将说明段落撑到1,756.35px并把画布推离操作区的问题。说明段落现68.5px，画布保持桌面416px／390px页面360px；source controls按内容高度连续排列。

包含最后样式修正的完整入口退出0：1,207 tests／1,192 passed／15 conditional skips／0 failed，build/strict typecheck/lint及654 input receipts通过。修正后current-build的3D、2D、No Diameter、跨390px恢复、missing file清canvas/proof/receipt/DER badge与retry均实际通过；旧样式build明确拒绝，真实拖动使旧capture失效且新camera准确恢复。当前native JSON逐一匹配25个renderer代码/样式/依赖输入。388固定科学inputs与2.34/2.90原manifest不变；修正前通过及首次中断记录保留各自范围。截图与准确验收见[I16时间轴](RESEARCH_TIMELINE_2026-09-30_IMPLEMENTATION_16_INDIVIDUAL_VIEW.md)。主场景179与其他legacy完整view/export仍待整合，不把个体恢复或passed tests代替M2/M4/全部Goal。UPG091仍in progress，79 exact completed不变，完整目标继续active。


## 29. I17：179 条主场景的实际相机、图层与裁切恢复

2026-10-01，在2.91原工作树接入独立main_scene_morphology_view_receipt 0.1。179个准确NMO记录继续使用已核验的private source producer，142 census／7 supplementary8.6.124／30 Todd8.6.126保持独立身份、源框架及集合归属；没有新增census或跨源join。保存实际FOV35 camera／viewport／renderer attributes、requested-effective layers／slice／MICrONS clipping、source placement／bounds及23个指定build inputs。原主场景无branch inspector，inspection仍available false，不声称node/dim恢复。

同源恢复先校验source／build／frame，重新读取形态和实际载入的辅助文件，重建scene并回验camera／layers／clip／bounds。两份Allen JSON、MICrONS manifest＋四bin、45718轮廓／geometry JSON由actual bytes/hash私有producer核验，公开clone无proof；binary只给副本。核验时间、两个页内sequence和cache mode属于事件元数据，不能误作稳定source身份；导入仍校验合法事件字段，fresh applied结果必须no-store，并相对当前producer检查sequence推进。跨页面恢复不能把上一页的大sequence当本页阈值。

MICrONS保持其自身cell→nucleus关系，与NMO／spinal仍co-display、0 joins／0 REG。45718移除重复显示lane偏移，固定crosswalk只用于该记录。toolbar／lane／fidelity badge及JSON／CSV依据实际verified mode与visibility，失败不保留DER当前显示声称；requested mode另存，实际mode／authority失败为null／NONE。Todd正确显示8.6.126。实际viewport PNG加可读iTXt receipt或明确unavailable；CPU验证CRC与encoded pixel chunks不变，不声称in-app Blob文件已落盘或native PNG解码完成。legacy fallback PNG／全局state import及其他viewers仍未统一actual view。

最终修正代码的完整 `npm run test:research` 退出0：1,217 tests／1,202 passed／15 conditional skips／0 failed；build、strict typecheck、全项目lint、全部数据及历史snapshot validators均通过。10新增source-backed CPU专项及两套旧集成检查共35项通过。正式current-code跨页面default→no-store和no-store→新页面default上下文恢复均成功，actual fresh结果为no-store，verifiedAt更新，camera差0；3D radius/SWC、MICrONS裁切／隐藏核与隐藏bundle、45718 DAT、二维390px／Enter、No Diameter、Todd8.6.126、wrong source/build保留正确scene及missing生成副本清proof／receipt／DER徽标和同源retry均再通过。 科学388固定输入与冻结2.34／2.90 manifest不变，生成副本已原byte/hash恢复。旧修正前native及失败/中断日志保留独立范围；最终文档／manifest同步后的重建记录见[I17时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_17_MAIN_VIEW.md)及QA summary。UPG-091仍in progress、79/243精确completed不变；branch inspector、其他legacy export、M2／M4与全部Goal继续active。


## 30. I18：主视图准确 SWC 分支检查与恢复

179 条当前准入记录复用共享 SWC 检查器，支持点击追踪线、准确节点 ID／Enter、branchpoint／terminal 遍历、祖先路径与下游边高亮、源坐标和 cable 描述、淡化及聚焦。picking／overlay／focus 使用同一显示变换；源坐标、原直径、2D／No Diameter 边界、142＋7＋30归属及0 REG／0 joins不变。检查器位于画布下方，不遮挡形态；主视图浅底使用更深的路径高亮，其他独立 viewer 保留原配色。

main-scene view receipt升至0.2.0，27个指定build inputs涵盖共享检查器、样式及视野计算。selectedNodeId／contextDimmed／exact-parent-path authority与实际新scene绑定；同源fresh no-store恢复回验相机、图层、clip、bounds和inspection。错误source／build／不存在节点在fresh前拒绝，当前正确scene保留。切换源或模式清旧选择；失败清形态、检查器和receipt，重试不能使用旧proof。MICrONS切换时NMO分支保持隐藏状态，来源身份及内部对象关系仍独立。

当前专项23/23通过，其中179条实际source bytes逐一重放准确节点／dim／来源半径许可。当前代码正式页面已验证SWC及radius节点62／dim／focus恢复、跨页面fresh恢复、真实点击节点136、二维194469节点24在390px／Enter恢复且无横溢、No Diameter242822未提供placeholder半径、wrong source／node／build保留原视图、missing生成副本清形态／检查器／receipt／DER徽标及原byte/hash还原后的fresh retry。MICrONS隐藏分支＋7辅助文件／cell clip／隐藏nucleus恢复通过，相机差0。修正前布局／颜色证据和主动中断日志分别保留；最终修正代码的完整 research 入口退出0：1,221 tests／1,206 passed／15 conditional skips／0 failed，build／strict typecheck／全项目lint／全部validators通过，676当前input receipts；398固定科学输入及冻结manifest不变。验收见[I18时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_18_MAIN_INSPECTION.md)与QA终态为准。

UPG-091继续in progress、79/243精确completed不变。legacy fallback PNG、全局state import、其他viewer实际导出及其余F01–F20差额仍待完成，M2／M4真实小鼠脊髓同细胞数据链保持独立科学目标，完整Goal继续active。


## 31. I19：全局状态导入恢复准确主视图

全局 Import state 先校验实际主视图的当前build、准确source、private geometry及persistent state一致性，再应用状态并等待当前renderer。同源fresh no-store重建并回验actual camera／layers／clip／bounds／node／dim后，才显示成功。重复导入和换源使旧请求失效，晚到结果不能覆盖新选择；排队的取消／失败提示也核最新generation。没有actual-view凭据的旧文件及typed unavailable明确只恢复settings，hidden observedForm设置保留。沿用view0.2，28个指定build inputs包括导入协调核心。

当前47相关专项、含两套旧回归共54/54通过。最终完整research入口退出0：**1,234 tests／1,219 passed／15 conditional skips／0 failed／0 cancelled**，build／strict类型／全项目lint及全部validators通过，682当前input receipts。第一次完整终态的两个旧静态handler提取失败和主动中断日志独立保留；没有放宽原搜索、清旧geometry和身份边界要求。398固定科学输入及冻结2.34／2.90 manifest保持原bytes/hash。

当前代码正式文件选择已验证：108974 radius节点62/dim/focus从194469恢复；二维194469节点24在390px／Enter恢复，无横溢；No Diameter242822恢复且不提供placeholder半径；Todd322385保留独立8.6.126及自身实际diameter true，observed SWC恢复；MICrONS隐藏NMO分支／nucleus、cell shell裁切与7辅助文件恢复，45718同记录DAT／9辅助文件恢复。六组actual applied camera／layers／clip／bounds／inspection检查通过，相机差0。14份actual UI view凭据逐一匹配28个指定build inputs，0差异。

错误build、不存在节点及state来源矛盾在改变正确scene前拒绝；真实旧build凭据亦拒绝。missing仅移走dist生成副本，实测失败后形态／检查器／receipt／DER显示清除，原byte/hash还原后的fresh retry通过。实际导入期间手动换源取消，194469保留；连续两次文件选择最终322385保留。测试文件由actual DOM view receipt与source-defined valid state envelope组成，不称作观察到落盘的Export JSON；导出notice出现、download event未返回文件，Blob落盘仍未验证。

详见[I19时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_19_STATE_IMPORT.md)及QA终态；最后文档／manifest同步、重建与重建后实际文件导入单独记录。UPG-091仍in progress、79/243精确completed不变。legacy fallback PNG、全局export round-trip描述的实际view范围、其他viewer、F01–F20差额、M2／M4及完整Goal继续active。


## 32. I20：实际导出视图范围、CSV 元数据与可读 PNG

全局 JSON／CSV 的 round-trip contract 现明确保留当前来源、准确构建、相机、requested／effective 图层、裁切、源对象与分支检查；fresh no-store 重建后回验实际应用结果。只有事件时间、当前页序号及绑定重新产生；viewport／aspect 按当前画布适配，沿用 verifier 的1e-8容差，不声称跨设备像素相等。typed unavailable 只恢复 settings。view schema仍0.2，29个指定build inputs包含共享导出核心，不声称递归依赖全集。

CSV format1.0.0保留全部原实体字段，增加record_kind及单独viewport_metadata行；即使过滤结果为空也保留视图凭据，元数据不占entity ID/kind、不制造科研实体。JSON／CSV均单次捕获同一view。PNG保留ohri-source-view并新增ohri-png-export，区分实际主场景像素与文字备用图，记录点击时设置、当前source/build、实际IHDR尺寸和settings-only边界；嵌入记录不改变已编码像素块。可重试最新下载链接及可展开实际导出预览已接入，形态文件名使用当前NMO ID。

真实图像验收修正了旧页脚固定INF／SYN可见说明，改从同一actual view读取实际reference visibility；另补2D非三维重建、保留deposited z、width aid及No Diameter无caliber/不可测量说明。390px/DPR1原页脚文字压缩过小，现保持字体并按宽度换行、扩展底部说明区域，源画布像素保持原尺寸。当前native PNG逐幅目检：3D radius108974为648×579、二维194469为364×676、No Diameter242822为648×562、用户请求文字图为1280×720，说明均可读。

最终当前代码完整research入口退出0：**1,244 tests／1,229 passed／15 conditional skips／0 failed／0 cancelled**，build／strict typecheck／全项目lint／全部validators及686当前input receipts通过；相关专项74/74通过。398固定科学输入逐文件bytes/SHA不变，冻结2.34／2.90不改写。首次严格类型失败、旧静态提取失败及一次原base-R测试超时分别保留；该准确原测试独立复跑1/1通过，未放宽超时。

当前app真实生成的完整JSON／CSV由公开readonly预览分段取得，四PNG由同一实际Blob的data-URL预览取得并检查全部CRC／IHDR／独立iTXt。没有构造state envelope替代导出。准确3D108974 node62/dim/focus和二维194469 node24/dim/focus在390px／Enter导出后经真实全局文件选择重新导入，fresh no-store实际view回验通过，相机差0；No Diameter导出保持观测中心线。5份实际JSON＋3份实际view PNG凭据均匹配29个指定build inputs，0差异；文字PNG为明确unavailable。常规CSV为7entities＋1metadata，空过滤为0entities＋1metadata。in-app自动download event落盘仍未观察到；Export text PNG是用户选择相同备用编码路径，原WebGL unavailable硬件／上下文故障未作native模拟，不能把文字图等同于故障验收。

详见[I20时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_20_EXPORT_SCOPE.md)及[当前核验](qa/2026-10-01-implementation-20/native-reconciliation.json)。最后文档／registry／manifest同步与重建后导入另记于QA终态。UPG-091继续in progress、79/243精确completed不变；其他viewer／export、F01–F20差额及M2／M4真实同细胞源链仍未全部满足，完整Goal继续active。


## 33. I21：准确 BIL 运行的原始坐标证据

BIL:ace-pie-cot／Run8_Slide2_Mus_M7_F7 的原始 cells.zarr.zip 明确空间单位为 microns。全部 182,698 个准确 cell IDs 与既有 cells.parquet 对账，无重复或缺失；X/Y 质心、细胞面积、核面积和核数量五列均逐 ID、逐行完全一致，差额 0，未引入容差。2,262 个核面积 source NaN 保持原缺失。该证据解除这个准确运行的细胞质心单位缺口；Parquet 自身无单位元数据和尚未对比 Zarr polygon arrays 的范围仍如实保留。

原 float32 physical-to-image 矩阵 X/Y scale 4.7058820724487305 与 pixel_size 0.2125 保持原精度；这不是 named outline／section／atlas transform。252,307,597 B cells archive 只获取指定 ZIP 条目的准确 HTTP206 范围（坐标输入 5,271,362 B；另保留先前 495,859 B metadata 范围，两次有重叠），由原 range 离线重放并校验 ZIP CRC，没有全档案 SHA 或 mask／polygon 核验。另完整校验 1,902,434 B analysis archive：十套自动聚类各有 182,490 assigned／208 unassigned，原 Cluster 名称不变为生物类型。两个位置文件各有 609 FOV，不按 sections 计数。

来源页新增可展开的准确运行坐标证据；切换其他运行清除该记录，键盘可返回已核验运行。selected-run JSON 保留旧 metadata snapshot、I04 三表核验和独立 I21 coordinate audit；其他运行该增量为 null。页面四份原始示例行、source NaN、当前坐标范围及 390px／Enter／无横向溢出通过实际生产页面检查。导出合同逐运行检查通过，本轮未观察自动下载文件落盘，不将合同检查称为 native 下载成功。

完整 research 入口终态退出 0：**1,250 tests／1,235 passed／15 conditional skips／0 failed／0 cancelled**；build／strict typecheck／全项目 lint／全部 validators 通过。20 项相关检查、119 个原始依赖文件的 bytes／SHA、182,698 行五列离线重放通过，当前清单 806 项。398 固定科学输入及冻结 2.34／2.90 清单保持原 bytes／SHA。文档／队列／清单同步后的检查与最终构建单独记录。

详见 [I21 时间轴与证据](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_21_BIL_COORDINATES.md)。source-supported cell-to-section、section/donor、curated type、outline frame 和适用权利差异仍缺；dataset API／网页 CC-BY-4.0 与 site CC-BY-SA-4.0 各自保留。**0 viewer geometry、0 section-linked cell+nucleus、0 interneuron admission、0 3D cell、0 REG、0 same-cell SWC join**。UPG244 维持 partial；UPG255 的切片 viewer 尚未完成。F01–F20、243 任务和 M2／M4 全 Goal 未完成，继续 active。


## 34. I22：原生轮廓的实际来源视图与恢复

本轮复用七个准确记录、72 条源轮廓、5,149 个顶点及 NMO50394 的一个独立 DER 开放外壳。只有实际文件字节数、SHA-256 和原有语义校验全部成功后才取得私有不可变证明；复制载荷、跨记录数据和旧 OBS 对应的 DER 均被拒绝。基础五记录定位 catalog 0.3 的 records，增量两记录定位 catalog 0.4 的 addedRecords。原始 DAT／API 哈希仍为声明，物理 specimen／section／cell 仍 unknown；源点、radius、raw flags、重复 z、自交和零长度边均保持原样。

视图保存／恢复记录实际相机、画布、源几何范围、显示变换、请求和实际图层、选中截面／隔离、独立 DER 与 19 项指定代码／样式／目录／依赖指纹。恢复先核准确来源和当前指纹，再以 no-store 重读源几何，并回验实际 renderer 应用结果。切换源、取消、缺失或失败清除旧几何、证明和可导出回执；DER 失败不重复自动请求，WebGL 不可用会结束恢复。19 项是明确指定的输入范围，不是完整递归构建依赖。

实际界面发现并修复了两个同记录查看器的重复 label ID、390px 父级网格裁切及暗底截面标签对比度。最终 390px／DPR1 中，面板宽 336px、画布宽 306px，均位于容器内。最终代码的七来源、16 份实际 DOM 视图回执与 19 项指纹对账为零差异；七组 fresh 恢复相机／target／quaternion／up 差额均为 0，inspection 和实际图层一致。50394 桌面真实拖拽清除旧 capture／export，稳定后可捕获并在窄屏用 Enter 恢复；45718 独立旧轮廓和两个重复 z 增量记录的准确隔离恢复均通过。50424 两处相邻转换 held，50408 两处自交／一条零长度边保持可见，两者均为 0 shells。

最终错误来源、真实旧构建回执在重读前被拒绝，当前正确画布保留。最终缺失测试只暂时移走临时验证副本中的两份几何文件；实际失败后 canvas／DER／readonly receipt 均为 0，capture／export 禁用。两份原 bytes／SHA 还原后，Recheck 与再次 capture 取得 OBS 和 DER 的 no-store 新证明。自动浏览器下载文件落盘仍未核验；这里的回执是实际页面 readonly JSON，不替代下载验收。首次正在阻尼运动中的 capture 自动失效，稳定后重捕获通过，没有把过期视图作为可导出凭据。

**最终工程检查退出 0：1,255 tests／1,240 passed／15 conditional skips／0 failed／0 cancelled**，build、正常 strict typecheck、全项目 lint、全部 validators 通过。实际 TS2322 负控退出 2，正常检查随后通过；早先静默退出 0、未更新构建产物的结果仍明确撤回。由于原 node_modules 存在 macOS File Provider dataless 占位，本轮在独立临时目录用原 package-lock 安装 467 个锁定依赖并重放当前 819 项权威输入，实际新构建及浏览预览均来自该目录，未改写原依赖。首次临时完整入口因两份兄弟证据文件缺失退出 1；准确补齐后通过，不更改验证器。398 项固定科学输入和冻结 2.34／2.90 清单保持原 bytes／SHA，11 项有限回滚输入通过核对。最后文档／登记／清单同步的检查与重建另记于 QA。

详见 [I22 时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_22_NATIVE_CONTOUR_VIEW.md)与[实际界面对账](qa/2026-10-01-implementation-22/native-current-reconciliation.json)。本轮没有增加膜、体积、内部对象、SWC 联展、same-cell join 或 REG。UPG091 仍 in progress，79/243 精确 completed 不变；其他 viewer／export、F01–F20 余差及 M2／M4 真实同细胞源链继续按[完整 Goal 核验](GOAL_REQUIREMENT_AUDIT_2026-09-30.md)推进，整体目标未完成。

## 35. I23：原生轮廓的准确 PNG 导出

七个 native viewer 已接当前 capture 后的图片导出：实际 WebGL 像素、可读来源／图层／DER／hash／科学范围页脚，以及 PNG 内完整 `ohri-source-view`／`ohri-png-export` 记录。来源、视角、图层在编码过程中变化时拒绝发布；source switch、resize、inspection、fresh recheck 和 context loss 清除旧结果。图片不使用另一来源替代当前像素，也不新增 membrane、volume、internal object、same-cell join 或 REG。

最终代码完整检查实际退出 0：**1,261 tests／1,246 passed／15 conditional skips／0 failed／0 cancelled**，真实 build／strict typecheck／full lint／全部 validators 与 823 authoritative inputs 通过。实际七来源九份 PNG 和对应 DOM JSON 的 21 指定 build inputs、所有 PNG chunk CRC、完整像素 decode、IHDR／raster／图层／authority 对账 0 差异；390px／Enter、换源旧结果清零、50394 DER 开启与 isolate 时关闭、45718 secondary-only，以及保存视图 fresh restore 后 OBS／DER no-store 导出通过。窄屏正文断词已修正；主入口旧固定面板裁掉预览底部的问题已修正为仅 native 场景的垂直滚动与 stable gutter，完整图像／来源页脚可达且打开预览不使 capture 失效。最后样式下七来源九 PNG 已重验，六份 encoded pixels 与已目检原图一致，三份50394另行目检。21 指定 inputs 不等于递归全 App build identity。

详见 [I23 时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_23_NATIVE_CONTOUR_PNG.md)及[实际 PNG 对账](qa/2026-10-01-implementation-23/native-png-reconciliation.json)。精确原 lockfile 临时依赖环境用于验收；原 dataless dependencies 保留。398 固定科学输入、冻结 2.34／2.90 与 11 个 rollback 输入通过。图片编码与预览已证实，浏览器自动下载落盘仍未观察到。其他 viewer/export、F01–F20 余差与 M2／M4 完整真实同细胞链继续推进，UPG091 in progress、79/243 exact completed 保持，整体 Goal 尚未完成。

## 36. 实施 I24：全集／比较器／个体的实际形态 PNG 导出

[I24 时间轴](RESEARCH_TIMELINE_2026-10-01_IMPLEMENTATION_24_MORPHOLOGY_PNG.md) 将实际 canvas PNG 接到 1,097 exact-universe、149 comparator 和冻结 142 individual 的现有准确来源渲染器；三个范围有重叠，不能相加为细胞总数。页脚标明来源、实际／请求模式、图层、节点／dim、源坐标限制和完整 geometry SHA；PNG 内保留完整 source-view 与 export receipt，29 个指定 renderer／inspection／style／PNG／dependency 输入按实际 bytes/hash 固定。Universe 使用实际 raw-SWC proof；比较器与个体仅证明 standardized geometry bytes，原始 SWC hash 保持 declared-only。PNG 不增加膜、内部对象、same-cell join 或 REG，恢复仍使用独立 JSON 和同一指定构建。

同步复制实际 frame，编码、metadata 和 preview 每个异步边界核当前 view／source／instance／context；只有重新生成的 capture time 可变化。换视角／类型／来源、resize 或 fresh rebuild 使旧 capture／PNG 失效。相同视角再次 capture 也立即清除旧图片、撤销 URL 并取消旧编码发布，保证新时间记录不沿用旧 preview。

当前代码完整 research 检查退出0：**1,267 tests／1,252 passed／15 conditional skips／0 failed／0 cancelled**，真实 build／strict typecheck／全项目 lint／全部 validators 通过，830 authoritative inputs。原依赖保留，在实际安装原 package-lock 的临时环境重放全部原输入实 bytes/hash 后验证；此前修正前证据保留其独立范围。

实际 browser 取得 11 对形态 PNG／DOM receipt（8 个来源 ID、3 个视图家族），逐一完成全 PNG chunk CRC、像素 decode、IHDR／raster／source／layers／inspection／29 pins 对账，无差异；原生轮廓50394回归另核21 pins。三维 radius／二维／No Diameter、补充来源、个体 node62／dim／type1隐藏、390px／Enter 和同视角 recapture 已实测；Universe45677与individual108974的两组 fresh no-store 恢复 camera position／target／up／quaternion 差异为0，layers／inspection一致。图像如实记录所选视角，不承诺所有源分支都在frustum内。自动下载落地仍未观测，不计完成。

398 固定科学输入、冻结2.34／2.90与11项回滚前文件保持各自原始范围。UPG091／053仍为in progress，243队列中的79项exact completed未增加；其他来源 viewer／export 与完整M2／M4科学Goal继续推进。


## 37. I25：公开配准代码与原始细胞身份的核验

I25推进M2的一个尚未封存入口：论文关联的公开配准／分析仓库。已固定commit、完整tree与17个小文本blob，重建Git对象hash并留存原始获取凭证。两仓库未存放该准确BIL run的原始→重命名ID对照、cell-to-section／donor／curated标签或真实配准输出。配准流程的第八字段截取及make.unique后缀不能作为原始细胞键；24示例target anchors、交互式polygon／rotation／source anchors也不能变成准确run的坐标变换。三个被分析脚本引用的processed Xenium RDS文件不在这两个固定tree内；结论仅适用于此范围。

页面与selected-run JSON已接独立software inspection context，明确exactRunEvidence=false，切换来源清除旧导出预览；MIT代码许可和BIL文件许可分别保留。此增量不增加几何／IN／REG／same-cell，UPG244 partial、UPG255 planned；M2仍须准确真实输入，M4及全部Goal继续active。工程和当前页面最终验收另见[I25时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_25_PUBLISHED_WORKFLOW.md)。

I25当前代码完整research exit0：1272 tests／1257 pass／15 conditional skips／0 fail／0 cancel，真实build／strict typecheck／全项目lint及全部validators通过，860 authoritative inputs。3份actual DOM export JSON与完整current receipt逐字段一致；仅cot保留原schema／coordinate，bin及cop不借用坐标。两换源入口清旧preview、390px／Enter与桌面无横向溢出通过；未观察自动下载落盘。398固定科学inputs、冻结2.34／2.90及11项owned rollback保留。243任务／79 exact completed不变，全部Goal继续active。

## 38. I26：精确对象长列表的键盘导航

Objects 当前页25行、全集当前页48行和冻结个体142行原来都逐行进入 Tab 顺序；I26 已统一为每个非空列表一个入口。方向键／Home／End只移动当前页或筛选集合内的精确键焦点，Enter／空格沿原流程选择，Tab可离开列表。实际浏览已核验页外选择保留、空筛选零入口、返回／前进、换源与旧capture清除；两份33指定input的当前形态视图凭据和Objects真实几何在焦点移动时不变。来源数量和物理身份均未变化。

已定位390px恢复文件输入框4px溢出并修正宽度；source/search/file输入与Objects主按钮最小44px。最终布局复验通过；当前代码完整research exit0：1276 tests／1261 pass／15 conditional skips／0 fail／0 cancel，build／strict／full lint／全部validators及866当前inputs通过。398科学inputs、冻结2.34/2.90与12项owned rollback保持；实际两份source-view×33 pins和keyboard checks对账0差异。验收见[I26时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_26_KEYBOARD_LISTS.md)。200%真实浏览器缩放、屏幕阅读器、其他路线和性能baseline仍未完成，UPG053保持in progress、243任务／79 exact completed不变，M2／M4及全部Goal继续active。


## 39. I27：WT 原生切片保存、恢复与图片导出

现有 jrc_mus-sc-zp104a 有界 raw／manual-nucleus 视图已接入共享来源身份和当前原生画布回执。仓库 component key 与未知 specimen／section／biological cell 分开；两块 native payload 由私有 byte proof 核验，实际128²／64²画布逐像素核对映射切片，17指定来源／renderer／style／identity／PNG／lockfile inputs 绑定当前构建。原 Export source receipt 保留静态上下文；当前 plane JSON／PNG 单独声明实际加载和画布 scope。

Restore 严格预检 exact source／build／identity／calibration／pixel hashes，随后两块 no-store 重读并核验新画布、切片和 cyan patch visibility；viewport layout 与本页 runtime events 适应当前浏览器。真实旧构建或篡改输入保留正确当前图像；实际服务副本的 checksum 失败清两画布／capture／PNG／export，准确还原后 fresh retry 通过。切片变化、显示 patch 改变、尺寸变化或再次 capture 清旧导出。128 native slice CPU 核验及实际15→16采样分组边界、127末尾和390px→1280px恢复通过。

PNG 对实际 attested native RGBA 作 raw×2／labels×4 整数放大，独立 export layout、当前 patch outline 与可读来源页脚明确保留；三份实际 PNG／DOM JSON 的 CRC、完整解码、四项 native hashes、来源和17 build pins 全部对账，raw每份65,536像素和隐藏 outline 的完整label65,536像素精确比较通过。390px原尺寸预览在局部横向滚动区显示560px图片，页面无横向溢出且当前来源回执保持；主要按钮44px。自动下载落盘、screen reader、真实200%zoom与未实际观察的 cancel UI 不算通过。

最终代码完整 research 入口实际 exit0：1284 tests／1269 pass／15 conditional skips／0 fail／0 cancel，build／strict types／full lint／全部validators与870 inputs通过；398固定科学inputs、冻结2.34／2.90和八项owned rollback保持。原始科学文件未改，原 File Provider 依赖保留，精确原 package-lock 临时环境逐input byte/SHA重放。验收见[I27时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_27_WT_PLANES.md)及[QA摘要](qa/2026-10-02-implementation-27/verification-summary.json)。UPG091仍in progress，UPG195既有 bounded co-display completion不重复计数，243任务／79 exact completed不变。partial untyped label2不成为完整核、interneuron identity、same-cell chain、organelle、measurement或atlas registration；unresolved source extent保持。F01–F20及M2／M4全部Goal仍未满足，继续active。

## 40. I28：两份独立比较形态的来源验证与图片复现

斑马鱼 NMO183779 与 rat NMO34024 的 API／SWC／morphometry 三文件现各自经过完整字节、SHA、身份、拓扑和局部坐标核验后才产生私有、不可克隆且不可改写的来源证明。原始六文件、节点、半径与来源冲突不变。斑马鱼仍仅有 axon centerlines／No Diameter；rat 仍保留 repository L420-LCN 与 paper L420_E2 未建立准确同对象关系、header 23 contours→23 soma points 与实际12 type-1 nodes 差异、历史 morphometry bytes 不可得三项冲突。未知 physical specimen／section／cell 不以 repository ID 补齐。

当前 JSON 绑定31指定 source／renderer／identity／PNG／dependency inputs 与真实 camera／layers／clipping／source display transform；Restore 先严格预检，再以 no-store 重读三文件，并回验实际应用的姿态。历史页面的 verification event 可作为保存历史，不能充当当前 PNG 的来源证明。真实两来源旋转／隐藏后恢复、390px键盘恢复与跨layout尺寸适配通过；旧构建、错来源／hash／frame／manufactured cell／surface claim／invalid event／invalid camera 拒绝并保留正确视图。实际临时服务 SWC 同长度损坏清对应画布／capture／PNG／export，准确还原后 Retry 保持待恢复姿态；另一来源不受影响。首次附加字节因服务启动时 Content-Length 固定未形成有效故障，明确不计入通过。

原 Save current image 和新增 PNG 导出均从当前实际 WebGL canvas 生成图片，带完整来源说明、No Diameter／中心线门槛、未知物理身份、原文引用、使用许可及 rat 冲突页脚；内嵌当前 view JSON 和独立 export receipt。当前相机／显隐／尺寸／source切换或重新capture均清旧凭证。390／1280px页面无横向溢出，主要按钮44px，原宽图片在局部preview区域查看。实际 PNG 全量解码、CRC、current JSON、31指定inputs及source hashes另存QA；因浏览器DOM接口不提供独立WebGL原始像素读取，未声明原画布逐像素独立比较或自动Blob下载落盘；screen reader／实际200%zoom／UI cancel也未升级为通过。

最终代码完整research入口实际exit0：1,292 tests／1,277 passed／15 conditional skips／0 failed／0 cancelled，真实build／strict types／全项目lint／全部validators及874当前inputs通过；文档／登记／manifest同步后的独立检查另记QA。398固定科学inputs、冻结2.34／2.90及14项owned rollback均保留。UPG091仍in progress，243任务／79 exact completed不变；其他来源viewer／export与完整F01–F20、M2／M4继续推进，不能以这两个独立比较对象替代小鼠同一细胞内部结构。见[I28时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_28_COMPARATIVE_PNG.md)及[验收记录](qa/2026-10-02-implementation-28/verification-summary.json)。

## 41. I29：五来源 Objects 的实际视图保存、恢复与图片导出

现有 `/objects` 的五个来源适配器统一接入私有来源证明；原生轮廓、线段和点不可改写，大型网格的原缓冲由私有副本保存，调用方取得的数组不会改变已核验几何。原七记录／72轮廓、50394 DER、MICrONS cell/nucleus、BANC skeleton/annotation point、18,358 PALM检测列和540 MicroStructFormer行的来源身份、计数、科学准入与原始资产均保留。

当前 full-view JSON 绑定55指定 renderer／source／identity／PNG／dependency inputs。恢复先核对准确对象、release、physical parents、build及各表示实际文件集合／hash，再重新按 no-store 读取所需文件，并回验实际 camera／layers／clipping／native display transform。I29 页面验收发现错误 hash 先进入 fresh load 才拒绝的问题，已将准确文件集合与校验值校对前移；最终十类无效文件均在预检时拒绝并保留正确当前画布／JSON／PNG。50394 含／不含DER与隐藏状态、MICrONS真实旋转／隐藏、同一文件连续两次恢复、跨来源和390px→desktop恢复通过。实际临时核网格二进制同长度损坏清当前画布／capture／PNG／export，准确还原后 Retry 继续原pending姿态；原始文件未改。

PNG 从当前实际 source canvas 生成，带可读来源、单位／校准、引用和许可页脚，内嵌 current view 与独立 export receipt。BANC单独annotation point保留0 runtime asset bytes；原注释MD5不变为当次文件核验。PALM保持未建立物理XY calibration；原MAT仅source-only声明。MicroStructFormer只生成明确标注的900px文本引用卡片，source raster=null，0 image／mask／geometry／runtime source bytes，外部live row revision没有被认作固定版本。DAT/API等原始来源声明也不扩大为新runtime byte evidence；各来源无共同生物比例或atlas变换。

最终25份实际 PNG／DOM JSON 全量解码、chunk CRC、55指定inputs和各自实际source文件hash一致；全部图片概览与八份代表原尺寸PNG检查另记QA。11份fresh actual-pose对照最大数值差5.684341886080802e-14，在1e-8 absolute＋relative容差内；本页events／raster size适应当前浏览器。键盘focus-only保留当前capture，Enter／source／空查询清旧capture，保留选中对象的筛选／分页与Back／Forward路径通过。390px页面无横向溢出、主按钮及source/search/file至少44px；900px文本引用PNG在324px局部preview滚动且当前回执保持。

最终代码完整research入口实际exit0：1,303 tests／1,288 passed／15 conditional skips／0 failed／0 cancelled，build／strict types／full lint／全部validators及891当前inputs通过。增加的清单覆盖包含既有BANC parser与十项既有runtime源文件，其字节未改；398固定科学inputs、冻结2.34／2.90及11项owned rollback保留。原WebGL像素独立读取、自动Blob下载落盘、screen reader、真实200%zoom和UI cancel未验证。UPG091仍in progress，243任务／79 exact completed不变；这些改进没有新增鼠脊髓same-cell内构、膜、细胞器、物理身份或REG，完整F01–F20／M2／M4仍active。见[I29时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_29_OBJECTS_VIEW.md)及[QA记录](qa/2026-10-02-implementation-29/verification-summary.json)。继续核对其他viewer／export入口和全应用可访问性，并保留M2／M4准确来源链的尚缺条件。


## 42. I30：准确 Run8 的原始 cell／nucleus polygon 证据

[I30时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_30_BIL_POLYGONS.md)记录M2新的来源输入与回放。本轮复用I04三份Parquet与I21的182,698 cell-ID roster／ZIP目录／历史坐标audit；只取得同一252,307,597B原ZIP两组polygon的163原始条目，51,198,032B exact HTTP206 intervals，硬上限52MB。新328文件与121旧依赖共449源文件留存bytes／SHA；selected ZIP CRC与全部native Blosc布局重放。完整ZIP／mask及整档案SHA未取得或宣称。

182,698 cell polygons与180,502 nucleus polygons共9,032,645 active vertex rows，在原float32值上X／Y及每行full-string parent cell ID全部exact equal，差额0，无容差／舍入／重排／拟合或推断transform。47,355 padded slots排除，全部原首末闭合。原archive microns声明加全量一致性支持这个run的cell／nucleus boundary µm，Parquet本身无unit metadata的事实保留。

按原polygon cell_index→cell_id核对全部parent、核数和cell方法；2,262零核、58双核、4三核、62多核保留。核polygon独立原DAPI方法；cell边界3008／interior169374／5µm expansion10316，与全部原cell rows一致。每份boundary label_id只等于其自己polygon row+1；180,502共享numeric labels跨两表指向不同cell，禁止跨文件label join。

应用接入准确run的独立polygon核对说明和当前source JSON，其他15runs该audit清为null；原I21历史audit不改写。Section／donor crosswalk、outline frame／方向、curated types与两份权利声明差异仍是独立gate。二维简化polygon不是observed membrane、mask或3D对象；0 viewer geometry／0 interneuron label／0 same-cell morphology／0 REG。UPG244仍partial、UPG255仍planned，243／79不变。原始全量重放、449文件校验、27相关Node检查与6项Python反例通过；最终代码完整research实际exit0：1,310 tests／1,295 passed／15 conditional skips／0 failed／0 cancelled，build／strict／full lint／全部validators与1,228inputs通过。准确run加15其他runs实际换源清除及16份当前DOM JSON完整对账通过，390px／Enter／44px无overflow。398固定科学inputs、882旧inputs（显式owned之外）与冻结manifest保持不变；自动Blob落盘／200%／screen reader不在本轮证明内。最终文档同步后的构建与manifest闭环另记。

I30末次载入时序修正已接入：实际初始HTML中source select／export在client-ready前disabled；client接管后才启用，直接重载选择Run8的selected／rendered key一致，全部16来源JSON及15换源清除复验通过。含修正的完整research再次actual exit0：1,310 tests／1,295 pass／15 conditional skips／0 fail／0 cancel；该修正不提升科学准入或整体F19状态。


## 43. I31：来源工作区按需加载与真实初载资源范围

I31修复来源页面及主页面Sources入口原先同时挂载四个来源视图的问题。四个工作区现在以可键盘展开的明确摘要进入；打开才加载组件和准确来源文件，关闭卸载并清除当前视图、导出预览和pending状态，重开从新视图开始。用户可明确同时打开多个独立工作区，各自来源身份与坐标边界保留。来源页两个导航目的地关闭预加载，实际点击仍能进入。本轮完整检查另发现并修复已消除辅助chunk仍被预加载的构建缺口：只删除未输出且无实际runtime引用的辅助JS项，必需entry／CSS／真实import缺失仍拒绝构建。七个既有来源入口全部保留，稳定workspace链接、两个旧sample锚点、旧比较锚点及三个Additional锚点按准确ID打开并聚焦；历史返回／前进打开目标，不合并来源身份。

同一生产运行环境的独立初始页面实测：改动前4个canvas及8个WT／comparative源文件请求；改动后0个canvas、0个挂载source workspace、0个来源数据请求。实际browser-observed资产集的本机HTTP identity响应体另逐个固定bytes/hash；这不是浏览器wire-transfer、parse／execute或用户等待时间证明。script响应体7,910,335→最终代码433,328 bytes；最终文档构建的资源回验独立记录。前基线一个既有preload URL返回404，该9-byte错误响应单独保留且不计成功脚本总量。

实际按需打开后的WT原pixels／Z映射、两份独立SWC、BIL准确run换源清零、GEO筛选／空结果／JSON与CSV action、PNG preview、close清零与fresh source restore均已验证。WT pixels／mapping／layers／layout与saved view精确一致；比较view camera／layers／clipping／transform／renderer精确一致，只允许重新核验revision／timing变化。原始来源数据未改，PNG不新增几何、膜、内部结构、same-cell或atlas授权；下载落地和native pending-cancel时序不由preview计完成。

修复后最终代码完整research actual exit0：1,319 tests／1,304 passed／15 conditional skips／0 failed／0 cancelled，build／strict／full lint／全部validator与1,238input receipts通过；1,219旧非owned及398固定科学输入保留。最终工程复验及窄屏证据见[I31独立时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_31_SOURCE_WORKSPACES.md)与QA。UPG230仍partial；full-route执行预算、实际200%缩放、screen reader及全部F01–F20未由该入口优化完成。M2 section／donor、frame、curated labels与rights和M4真实鼠脊髓exact interneuron内构链仍待来源准入，完整Goal继续active；243任务的79项exact completed未增加。

## 44. I32：准确 Run8 的原始 DAPI 影像元数据与数值范围

[I32时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_32_BIL_IMAGE_METADATA.md)记录新取得的准确来源：25,611,493,268B morphology.ome.tif 的五段HTTP206 metadata，仅1,606B；first BigTIFF IFD与OME XML声明54,030×112,160 uint16 DAPI、16 Z层、XYZCT、XY 0.2125µm/pixel与Z 3.0µm，与原manifest一致。未下载/哈希整文件、读取image pixels、后续IFD或pyramid pixels。全部182,698原始细胞质心使用原float32 physical-to-image矩阵后均在连续影像域内；与精确pixel_size除法的最大数值差异X0.00321743px/Y0.00668135px如实保留，不称像素配准误差。29闭合命名轮廓的native shoelace area全部复现原µm² header的一位小数；这支持尺寸一致性，不提供共同原点/方向、cell-to-section或donor。

页面和JSON新增准确run的独立sourceImageMetadataAudit，其余15run清零，历史调用不自动扩张范围。当前完整research actual exit0：1,325 tests／1,310 passed／15 conditional skips／0 failed／0 cancelled，build、strict typecheck、全项目lint与全部validator通过；1,256当前inputs、130原文件receipts、6 Node专项及9 Python解析/拒绝检查通过。Actual DOM影像audit原JSON文本与原合同exact numerical equal，其余15run清除旧evidence/preview，390px无横向溢出、Enter focus/72px summary和close清零/reopen默认均实测。原image pixels、mask alignment、后续IFD、下载落地、200%zoom和screen reader未由此验收完成。UPG244 partial、UPG255 section pilot planned及79/243 exact completed保持；无新增geometry、IN、3D、same-cell或REG。outline frame、section/donor、curated labels和rights仍待来源准入，M2/M4与全部Goal继续active。

## 45. I33：原始 GABA 类型注释与核名单浏览

新增204个来源metadata标签、24原group、73,364准确核的可搜索／筛选／分页浏览。原source／Sex列缺失保持null；P56保留dataset context。源内compound key包含准确RDS filename，运行按需核验原顺序及逐label membership，再按当前核导出；切换label／page／query不保留旧选择。387 source profiles、11 CHOL_IN profiles／923 nuclei独立保留，未新增interneuron分类、marker测量、动物／section、Xenium映射、几何、内部结构或配准。

全73,364原行由独立lossless CSV reader核对，204 membership及原顺序无差额；7专项通过。生产页面发现 `.gz` 被静态服务器当作网页压缩副本而返回404，已改为独立 `.jsonl.gzip` 地址并保留相同gzip bytes／hash；未修改旧GLUT或原科学输入。最终代码完整research actual exit0：1,332／1,317 passed／15 conditional skips／0 fail／0 cancel，build／strict／全项目lint／当前validator通过。

原生桌面和390px实测组筛选、literal search、标签／核分页、准确ID搜索、键盘展开与Retry、关闭卸载；两条准确核JSON及三份label summary与源数据逐值一致。真实served同长度checksum破坏清除旧核详情／export，准确恢复后全名单再次verified；窄屏无横向溢出，测得新交互控件最低44px。原download事件10s未确认、200%zoom／screen reader／native pending-cancel未由此算通过。1,250旧非owned和398固定科学inputs、冻结2.34／2.90保持，79／243 exact completed未增加。[I33时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_33_GABA_SOURCE_LABELS.md)保留原数据、访问范围、准确新输出、回滚与QA。完整F01–F20／243任务及M2／M4 Goal保持active。

## 46. I34：准确 CHOL_IN 核的实际 RNA 计数

准确取得128MB原CHOL RDS，完整hash／gzip CRC通过；Assay5 RNA counts层为32,285×3,199，源LogMaps的counts列名称与membership提供准确行列名，不能按layers列表位置猜配。全部3,199 counts列与meta.data原row.names exact equal，计数和检出feature数分别复现原nCount_RNA／nFeature_RNA。仅既有923 CHOL_IN核进入新派生物，原base-R名单、11profile标签／顺序membership不变。完整32,285 features、4,610,528 positive entries、22,637,377计数由127个按需块保留，总压缩4.65MB；单块最多256features／55,818B compressed，非网络耗时结论。没有取得或声称RNA/ATAC配对，未新增profile、donor、section、marker分类、几何或内部结构。

已有核名单中可按需搜索源gene，查看当前准确核的RNA count与原metadata row/counts column、全部source profile统计、完整11profile比较以及当前JSON预览／逐核counts CSV。搜索不存在gene不填0；gene的0仅为counts layer未检出。聚合用每个完整源profile分母，不随名单搜索／分页变化。最终移动说明布局代码完整research检查exit0：1,338／1,323 passed／15 conditional skips／0 failed／0 cancelled；原生桌面／390px、Enter、两准确gene JSON、核切换／query／page／换profile清零、关闭卸载及同长度真实损坏传输拒绝／正确文件Retry已经实测。最终压缩布局重新加载后，390px无页面溢出，源profile和准确核计数保持；15项原生检查全部通过，新截图与当前DOM另外封存。源RDS确定性重放、全32,285features/923nuclei对账和6专项通过；1,403当前原workspace/临时构建inputs、1,259旧非owned与398固定科学inputs保全另验。CSV键盘action已执行，但5s内文件落地未确认；native pending-cancel、200%实际zoom和screen reader未由本轮算通过。

仅本地临时served文件参与破坏测试，原workspace与source未变；小文件服务启动时缓存bytes，测试与恢复均重启本轮自有本机服务，并分别核对实际响应hash。原RDS在public外只留一份，原metadata／原CHOL roster／GABA与GLUT输入不改。V1作者已检查页面只有图像下载且统计报错，未取得修正barcode/cluster crosswalk；原I01冲突仍保留。M2准确section／donor／outline frame／curated labels／rights及M4真正鼠脊髓exact IN volume/segmentation/parent/frame/raw链仍未满足。79／243 exact completed及完整Goal active保持；[I34时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_34_CHOL_RNA_COUNTS.md)记录源输入、源码、回滚与QA。

## 47. I35：完整源记录的全部32通道与时间

一个固定DANDI `001469/0.250611.1844` asset `0e0ca61c-4206-46ad-8c78-0ce7b1252b33` 已补齐完整355,191,072B，公布whole SHA256实际相符。复用旧15段3,918,112B，只下载缺少的351,272,960B。原NWB在public外只留一份；旧I09有界范围合同／原首秒samples保持。32源电极×5,543,424原time rows形成完整177,389,568 int16 samples／184.7808s；608个lossless blocks按通道与10s划分，完整matrix C-order原byte SHA及各通道stats逐项对账，没有删减、补零、滤波、单位换算或分型。

原电生理入口接完整记录：原channel0–31、任一0.1s源time、采样cursor、所有window原值与对称autoscale、JSON/CSV、精确跨block恢复；最后窗口仅2,424 samples。浏览器no-store请求当前block并核compressed／decoded两SHA，最大306,357B；whole-NWB核验在独立build/acquisition范围，不冒充当前浏览器范围。篡改导入不能产生原sample authority，错误清旧波形／export，准确数据重试恢复。旧首秒参考按需保留，旧dandiTraceStart深链接继续打开参考。

物理voltage calibration仍未证实：源volts/conversion1/offset0/resolution−1保留，完整acquisition只有ElectricalSeries、analysis/processing为空，无channel_conversion／isolated-unit table。session_id与电极坐标单位仍unknown，不能把32电极计为32细胞。其余NWB、exact physiology-to-cell、M2准确section/donor/frame/curated labels/rights与M4真正鼠脊髓exact IN内构源链仍未满足。UPG154维持partial，79／243 exact completed及所有原科学分母保持。

完整原源与608块／177,389,568采样重放、7专项及完整research actual exit0：1,345 tests／1,330 pass／15 conditional skips／0 fail／0 cancel，build／strict／full lint／全部validators通过，2,022当前inputs。三个actual DOM窗口与原NWB共8,424 samples、source context／time／cursor／plot／block receipt逐值0差异。实际served损坏清旧波形／export、准确恢复与Retry、旧deep link、关闭卸载和390px／Enter／主控件≥44px均已核验。原gzip在Node24不同zlib下压缩重建不一致，原文件没有变化；原Node26全量通过，诊断和失败日志保留。最终文档／参考文案同步后的build与专项闭环另记QA；自动Blob下载落盘、200%zoom／screen reader／native pending-cancel仍未核实。见[I35时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_35_FULL_RECORDING.md)与[验收记录](qa/2026-10-02-implementation-35/verification-summary.json)。完整F01–F20／243任务与M2/M4 Goal继续active。

## 48. I36：准确 Svara 补充包与原始图册页面

UPG-240／250／260 的三个官方 ZIP 已按 source metadata 声明的 REST content 路由实际取得并核验 published bytes／MD5、ZIP CRC 与 archive/member SHA256，共 29,980,104 B。三个包各只有一个 PDF catalogue，分别139 MN／39 CiD／34 CoBL原始条目，没有独立骨架／mesh／annotation.xml／raw volume／endpoint table，不能完成原 editable reconstruction 或 M4 内构 Goal。

全部212 native pages／原class和连续编号／914 source table fields保留；原页只按96dpi raster展示，native TSI missing strings与源零值均照录，0新计算测量。当前应用接 original page／catalogue selector／source-reported values／unknown physical-parent identity／PNG与source JSON、exact page fresh restore；按需单页最大118,503 B，全部212派生PNG共16,799,311 B。current runtime核验仅该PNG，完整ZIP/PDF核验属于独立extraction/acquisition范围。

许可有了新的具体依据：准确article CC BY4.0、三个exact supplementary components与DOI/version归属，加明确Elsevier supplementary-data policy；没有separate ZIP license字段，也不把该政策扩展到其他repo／Koh annotation。sourceReported specimen context不能变成exact physical parent链、geneticV2a、鼠geometry或registration。原source/Koh历史合同byte不改，canonical387 profiles、source rosters与79／243 exact completed保持。

最终代码完整research actual exit0：1,354／1,339 passed／15 conditional skips／0 failed／0 cancelled，build／strict／full lint通过。9专项与全部212页／914fields源重放、12contact sheets全页目检、13native checks、4实际DOM receipts与三原PDF共14fields对账0差异，真实损坏wire清旧page/export及准确恢复Retry、390px主控件≥44px／无overflow、原入口关闭卸载与fresh重开已验收。浏览器下载保存路径5s未观察，native pending-cancel、200%zoom和screen reader仍未验证。11旧file preimages中一份旧test在预备份失败后由精确patch恢复，该异常有独立记录；398固定科学与2,014旧非owned inputs保全，当前2,253 inputs纳入manifest。见[I36时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_36_SVARA_CATALOGUES.md)与[验收记录](qa/2026-10-02-implementation-36/verification-summary.json)。真正鼠脊髓exact IN内构、M2 section/donor/frame/curated labels/rights、Koh原workbook/Knossos与Svara actual source geometry仍未满足；完整Goal继续active。

## 49. I37：Svara 准确条目链接、刷新与浏览器返回

原212出版条目的独立工作区已增加exact source／release／component-qualified entry链接。选页与有效JSON恢复同步history，刷新、Back／Forward读取同一来源版本的条目，每次重核新的no-store PNG。嵌入原atlas的选页保持完整atlas URL，准确链接打开独立工作区。任何自有参数缺失／重复／空值／版本不符／未知条目均明确拒绝，先清旧image／download／share link／receipt；只有不带任何本工作区参数的地址才默认CiD001，错误地址不暗自代选。实际proof同时绑定当前request对象，同key重读也不能继承旧证明。

全部212准确URL往返、缺项／duplicate／wrong version／unknown／邻接query／fragment与无byte authority的6新专项通过；连同原9source专项共15。最终代码完整research actual exit0：1,360 tests／1,345 passed／15 conditional skips／0 failed／0 cancelled，build／strict／full lint／全部validators通过。31项native flow observations和DOM source/identity/rights/raster/URL对账0差异；准确链接点击、刷新、跨catalogue返回前进、JSON拒绝清零、MN139末页／Enter Previous、390px主控件44px／无overflow、原入口完整地址保持均实测。另两次12s真实延迟传输下的pending switch／Back取消、旧response deadline后保持新页已核验；真实generated PNG checksum fault拒绝和exact wire恢复／Enter Retry通过，原源未改。下载落盘、200%zoom／screen reader仍未核实。

该范围完成二维page selection的链接复现，未声称3D camera/clip/geometry或全App深链接已经完成。三原ZIP／三PDF及914source values不变，9owned preimages均编辑前捕获；本轮manifest2,255 inputs、2,245旧非owned input保全由最后同步检查独立确认。79／243 exact completed保持，M2／M4、physical-parent/frame、Svara actual editable geometry与Koh原源门槛仍未满足；完整Goal继续active。见[I37时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_37_SVARA_LINKS.md)与[验收记录](qa/2026-10-02-implementation-37/verification-summary.json)。


## 50. I38：源突触接触面积与出版标签对

新的FreiDok145135 page→其声明JSON API→file URL路线取得33,959,844B聚合ZIP，published size/SHA256/MD5及全部outer/nested ZIP CRC一致。实际3 ZIP、2 PDF、4 XLSX，解决旧landing“2 ZIP／.xls”文本与实际内容差异；wrapper file-license字段仍空，未整体准入公共再分发。

四份XLSX另从确切MPG RELEASED v7 file_3055226–3055229直接取得，共85,486B，published size／MD5／SHA256与wrapper成员逐字节一致。新数表准入仅依准确article CC BY4.0＋publisher明确supplementary-data policy＋四个exact官方components，不追溯扩大I36旧三包scope，也不覆盖FreiDok整个wrapper、mmc9或Koh annotation。

CiD矩阵39×68／2,652位置、265 contacts、182不同listed pairs、2,470 literal zeros；CoBL矩阵34×68／2,312位置、469 contacts、334 pairs、1,978 zeros。共734源行／516对／4,964格，0missing格。每格与同pair contact面积之和在10⁻⁹数值核对容差内一致，最大Decimal差5.00005E−12／6.00011E−12。矩阵无显式unit header；Contacts!C1明确µm²。矩阵值不是counts，counts由原行数另算；OOXML数值token完整保留。同pair重复行属于独立源contact，未去重。zero只说明该表为0且无listed rows，不推断生物学不存在。

新增/connectivity/svara，group/pre/post原标签、完整68MN行浏览、原locator／token与derived sums/counts、准确source/release/pair URL、CSV/source JSON与fresh table restore；旧atlas/catalogue均可达。只获取选定class JSON：CiD40,880B／CoBL60,756B，每次no-store SHA校验、private immutable proof、当前request绑定；原XLSX核验属extraction范围。原科学分母与79／243 exact completed保持。F11／F13–F19及UPG240/250/260为该范围增量；M2／M4、source XYZ/physical parents/frame及Koh版本缺口仍开放。

完整research已actual exit0：1,367 tests／1,352 pass／15 conditional skips／0 fail／0 cancel，build／strict／full lint／全部configured validators通过。7专项覆盖所有4,964准确pair URL、原数值token、source zeros、private authority、cancel及receipt/CSV。33native flow observations通过：真实源行/矩阵/当前SHA、六contacts保留、刷新/返回前进、JSON与URL错误清零、390px／44px／Enter／末列矩阵选择和catalogue导航；真实40880B checksum错误wire拒绝、准确还原wire与Enter Retry，以及两条12s delayed pending switch/Back实际client取消、deadline后新pair不被覆盖均通过。CSV点击后5000ms无download事件，保存路径未验证；200%zoom/screen reader未验收。最后准确native sheet/C1 unitLocator与文档、原文件/非owned inputs、compiled assets的重放封存见[I38时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_38_SYNAPTIC_CONTACTS.md)与[最终QA](qa/2026-10-02-implementation-38/verification-summary.json)。完整Goal继续active。

## 51. I39：图册与接触表的准确出版标签导航

从当前图册条目打开接触表保留该端点；另一端在用户点击的starting-pair链接中明确显示，不再回到无关默认CiD001。接触表分别打开其pre／post两个准确原页。各目标独立fresh核验PNG或JSON bytes，navigation自身无byte authority。全部212图册条目中39CiD＋34CoBL＋68MN共141条匹配；其余71MN仍可看原页，明确不在两表列中，不代选、不解释为无连接。209 endpoint rows含同68MN在两group中的重复引用，不计为细胞数；四显式native subtype suffix由准确header/full text核对，不做通用name修补或physical identity join。

5新专项加原13相关tests实际18／18通过，覆盖全部212来源页、4,964pair的两方向链接、71未收录MN、wrong source/release、重复／歧义／模糊label拒绝与private authority不可替代。17native observations通过：CoBL034与CiD039末位实际点击／Enter、MN001 suffix、MN068最后列、MN069／139明确无column、refresh／Back／Forward、390px／≥44px／无overflow以及两工作区错误版本清旧receipt／exports／新增links。locator downloadMedia另实际尝试，约5s未观察保存路径，仍不计文件落盘。全当前研究入口、compiled docs/assets及旧输入保全以[本轮最终QA](qa/2026-10-02-implementation-39/verification-summary.json)的实际终态为准。

新FreiDok271638 source-linked论文API只有metadata，files=0。Heidelberg明确原PDF路由HTTP200却返回4491B Anubis HTML；未取得PDF或新的volume／reconstruction／annotation，未将响应伪存成PDF，也未扩大rights。该具体公开入口留有hash／失败类型与新的公开文件重启条件，不能宣称全网无数据。精简导航索引59,540B不要求接触页额外导入403,985B全图册文本；原数表／原页／原source receipts与canonical分母不变。见[I39时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_39_PUBLICATION_NAVIGATION.md)。79／243 exact completed、M2／M4与完整Goal继续active。


## 52. I40 · 应用键盘直达与准确面板引用

五个应用页面新增首个键盘入口 Skip to research content，Enter直接focus到当前内容区并滚动，不改写查询或来源fragment。主证据rail六个缺失引用已修复为七个稳定tabpanel，只有选中的内容挂载；顶部七个操作按钮从实测35px修补为至少44px。

33项实际观察包括desktop／390px五路线10个skip流程、八研究入口12次Home／End／左右箭头／wrap及七证据面板11次切换。当前已挂载内容无重复ID、失效ARIA引用或无标签控件；准确BIL run/fragment、原页及接触对保持，当前pair source receipt逐字一致。来源初始化focus与一次label定位的未通过尝试保留，不计入通过数。最终构建尺寸复核、全项目research退出状态、输入保全和截图独立见[I40时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_40_KEYBOARD_ENTRY.md)及[本轮QA](qa/2026-10-02-implementation-40/verification-summary.json)。

本轮没有新增生物资料或completed状态；79/243、原科学分母及M2/M4门槛保持。实际200%zoom、screen reader、download落地及全App性能预算仍待验收，33项键盘观察不替代这些证据；完整Goal继续active。


## 53. I41 · 小鼠 V2a 群体源影片

完成 UPG-170 原限定范围：实际原 Video_2.MP4、准确 XML/PMC version inventory与CC BY4.0归属核验，11,361,776B／官方MD5相同／原MP4 SHA256保存。400帧全decode通过；Sources独立页及主应用Types附加证据的按需入口接native播放、秒数定位、paused source JSON与fresh byte restore。它仍是C1–L1 Chx10:tdTomato群体渲染参考；exact movie age/sex/specimen/per-cell IDs、raw voxel calibration/segmentation/atlas frame均unknown或未准入，不新建canonical type/cell。

7专项覆盖exact/same-size坏bytes/private proof/input mutation/cancel/no-store/完整receipt claims与时间边界。desktop/390px／44px／Enter、播放暂停及exact seek、fresh restore、rights篡改拒绝、close/reopen、真实same-size bad wire/retry与两10s native pending cancel已实际通过，deadline后source不复活；一个getByLabel定位错误保留为未通过尝试，fresh DOM的textbox定位通过。完整工程终态、source/compiled/input对账、截图与精确count见[I41时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_41_MCCREEDY_MOVIE.md)及[QA](qa/2026-10-02-implementation-41/verification-summary.json)。本轮record只核销该已实现movie范围，当前80/243 exact completed；其余F01–F20、M2/M4与完整Goal保持active。

## 54. I42 · 七份原始 DAT 的完整逐文件核验

UPG193已实现explicit per-file manifest：NMO45718／45674／50424／50394／50408／108978／249676准确URL、原filename、bytes／SHA、三项citation与权利、parser版本和inputs、234完整top-level source objects、89原contours及完整nested boundaries。独立Python与JS完整structured audit exact equal，旧89 ordered arrays及72准入loops／5,149 vertices保持；源marker大小差额逐file／offset保留，未修改原bytes或执行外部parser。

浏览器先验证原DAT、complete inventory及原ordered points，再核验派生JSON并发当前immutable private proof；source view／PNG保存actual raw receipt，fresh restore重取原DAT和轮廓，API metadata仍declared-only。七来源实际capture、hash篡改拒绝及真实same-size bad served DAT清除canvas／capture已验；旧success提示随当前capture失效隐藏。完整required checks与最终截图见[I42时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_42_NATIVE_DAT.md)和[QA](qa/2026-10-02-implementation-42/verification-summary.json)。仅准入原线条；异常、frame、No Diameter和旧catalogs保留，0新surface／volume／internal／REG／canonical profile。

当前81/243 exact completed。此合同不向新DAT自动推广，不替代UPG220／231或准确鼠脊髓IN volume／segmentation／parent／raw-slice的M4门槛；F01–F20、M2/M4及完整Goal继续active。

200%zoom／screen reader／native文件落盘及全App性能预算未计为通过。既有source mapping与mouse same-cell内部结构缺口保持；不能把电影播放时间当作depth/距离/生物时间。


## 55. I43 · 完整 DAT 审计逐文件加载

既有1,960,364B canonical审计清单与七份原DAT保持；小型index固定完整逐文件JSON的bytes／SHA、原始输入及audit fingerprint，选择后才读取对应完整清单，再验证原DAT和准确准入坐标。原234top-level objects／89contours、marker exceptions与72loops／5,149vertices均保留，完整source-file audit有可访问的本地链接。新的private manifest receipt与相同geometry绑定；恢复对manifest／DAT／geometry及已有DER执行no-store，旧build或篡改receipt不能静默恢复。

22项专项覆盖七文件完整内容保持、请求隔离、坏／缺失／跨file清单、三个读取阶段取消以及view／PNG replay。完整工程终态、实际浏览器保存／恢复／换源／故障及390px和前后资源对账独立见[I43时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_43_DAT_LOADING.md)及[QA](qa/2026-10-03-implementation-43/verification-summary.json)。资源inventory的localhost HTTP identity bytes不是browser wire transfer、JS parse／execute或等待时间，UPG230仍partial。81/243与完整F01–F20、M2／M4继续active；本轮不新增科学分母、内部结构、same-cell／REG或真实200%zoom／screen-reader通过记录。


## 56. I44 · 完整来源相机适配与 native 键盘操作

I43实际330×338 CSS视窗存在原NMO108978右侧裁切；native和142 frozen individual默认固定距离现已改为既有sphere-fit函数，依实际horizontal／vertical FOV及aspect显示完整准入bounds。默认视图随resize适配；用户实际调整、source inspection focus或恢复的相机保持pose。Native新Fit all source traces仅重置frame范围，保留当前朝向／trace selection／layers；canvas箭头pan、Shift+箭头rotate与可访问说明接入，失效source/context与旧epoch清除fit/capture权限。

Native按钮／select／checkbox label和disclosure、shared source-view按钮／summary至少44px，小型source tables／receipt文字至少12px。20项专项与strict types通过；source-backed projection覆盖七份准入DAT全部72loops／5,149vertices、既有DER和142 actual renderer bounds，不增加source geometry、膜、内部结构、same-cell或REG。最终required工程与actual desktop／390px、键盘／层／resize／source restore、像素及inputs保全见[I44时间轴](RESEARCH_TIMELINE_2026-10-02_IMPLEMENTATION_44_CAMERA_FIT.md)及[QA](qa/2026-10-03-implementation-44/verification-summary.json)。UPG053仍in progress；全App typography／long lists／sticky context、真实200%zoom、screen reader、完整性能预算、M2／M4和F01–F20仍待完整验收，81/243保持。

实际individual capture另发现返回已选记录时radius root初始化隐藏、visibility effect缺少view依赖；已修复并实际验证返回时保留隐藏type、正确radius层及fresh跨viewport恢复。14native与9individual实际凭据独立source/build/bounds回放通过，原156裁切顶点现在全部在画面内；两份actual PNG的CRC／embedded receipt及像素核验通过。浏览器32pass与6未通过尝试分别保留。修复后完整research：1393／1378pass／15既有conditional skips／0fail／0cancel，build／strict types／full lint／required validators通过。错误选用Python3.12.14导致既有三项float末位差异的未通过复验另记QA；原Python3.9.6通过，未重写科学数据。

## 57. I45 · 首次视图准备期间的操作边界

I44保留的首次reload后native选择未生效尝试促使本轮检查启动边界。原SSR控件在首次URL恢复前即可尝试操作；现以既有locationHydrated控制完整workspace的HTML inert／aria-busy，准备期间独立polite状态显示Preparing the research view，恢复保存／默认状态后再开放点击、链接与键盘操作。具体source bytes仍由原loader独立核验，ready不代表科学准入。既有source选择／URL／history／错误状态继续保持。

新增scoped loading CSS和[I45时间轴](RESEARCH_TIMELINE_2026-10-03_IMPLEMENTATION_45_INITIAL_VIEW.md)；实际delayed-client／ready选择／返回／390px、完整工程检查和input保全分别记录[QA](qa/2026-10-03-implementation-45/verification-summary.json)。完整F01–F20、243项目、UPG053／230、M2／M4仍active，81个精确completed保持；初始操作尝试不再以看似可用的控件冒充完成选择。

I45实际desktop延迟准确client module期间，inert／busy和提示保持，Tab不会进入workspace。ready后108978→45718清除旧region／receipt；空筛选保持当前main source，搜索后Enter恢复108978；深链接及Back／Forward的准确选择和最终native captures对应12／8原始traces。首轮完整research1393／1378pass／15既有skip／0fail／0cancel通过。三项未通过的时序／cache／native select keyboard观察另记QA，不算whole-App键盘或辅助技术完成。最终新module的390px等待验证及最终工程封存以独立QA为准。

## 58. I46 · 查看器校验信息的运行加载

七个source-view／auxiliary模块改读137项精确runtime pins，完整current manifest仍独立保留。各查看器的build scope、原path顺序／数量、源asset bytes／SHA和错误拒绝条件保持；当前manifest生成同步派生runtime transport，不允许stale或缺失pin进入封存。没有改变来源几何、图层、分母、same-cell、REG或已准入文件范围。

本轮以完整I45生产JS为前态，编译identity bytes对账与实际source切换／fresh restore／旧build拒绝分别记录[I46时间轴](RESEARCH_TIMELINE_2026-10-03_IMPLEMENTATION_46_RUNTIME_PINS.md)与[QA](qa/2026-10-03-implementation-46/verification-summary.json)。Identity bytes不等于浏览器wire、parse／execute或interaction-to-ready性能；UPG230／F17仍partial，81/243及M2／M4和完整Goal保持active。

## 59. I47 · 原生轮廓的准确分组与数值敏感性

七份已核验DAT的72loops／5149vertices按八个exact source-name groups保留。五个unique-z组具备47个数值z-neighbour intervals；45674／108978的重复z独立对象和45718另一个跨z的Cell Body组没有唯一相邻对应，不强行排序连成细胞表面。按需打开诊断面板才加载和计算；每个来源仍使用自己的坐标与身份，不跨record配准或合并生物学分母。

三项数值限值与27个预设组合只作软件敏感性，原source self-intersection／zero-edge flags与source order保留；XY polygon计算及cyclic index phase不是生物学测量、空间配准或独立生物学阈值校准。源trace按钮定位当前源对象，JSON／CSV保留原DAT／完整审计／geometry proofs、准确参数与build；不生成新surface／volume／interior／same-cell／REG。现有50394 DER保留独立既有准入。

当前源码、旧17条Todd诊断回验、实际browser换源／参数／trace／fresh recheck与最终完整工程封存分别见[I47时间轴](RESEARCH_TIMELINE_2026-10-03_IMPLEMENTATION_47_CONTOUR_DIAGNOSTICS.md)及[QA](qa/2026-10-03-implementation-47/verification-summary.json)。UPG231的数值探索为partial，独立科学校准任务仍planned；独立物理校准、section对应及生物学tolerance仍held，81/243、F01–F20／M2／M4与完整Goal继续active。

I47完整代码检查实际exit0：1,402 tests／1,387 passed／15既有conditional skips／0 failed／0 cancelled，build／strict types／全项目lint／必需validators通过。七来源的10份实际浏览器diagnostic receipts与五份native view captures独立重放无差异；参数调整不改变native camera／layers／原capture，fresh restore全部三来源proof为no-store，相机差0。390px没有页面横向溢出，44px控件／12px文字及表格方向键滚动实测；download事件未捕获、首次style读取工具限制和select方向键数值未改变的尝试独立保留，不计验收通过。来源与物理校准门槛继续开放。


## 60. I48 · 额外准确 DAT↔SWC 候选与原标准化日志

按UPG261检查六条既有准确记录249676、50424、50394、50408、45674、108978。每条重新读取原DAT并通过既有私有producer；原SWC／geometry的bytes与SHA256沿当前source-frame合同和源文件声明核验，全部SWC节点七元组与canonical geometry完全相同。另将这12条原文件路径直接纳入当前清单，保留原有层级source pins。原始几何、closure flags、No Diameter、50394 DER及45718 crosswalk不改变。

[预先声明协议](NATIVE_DAT_SWC_CANDIDATE_PROTOCOL_2026-10-03.md)在拟合前保存。按唯一原生／SWC胞体z、明确header数量及完整z集合的常数平移匹配。五条记录因数量、header或重复z保持该方法下的HOLD，不能推断其他方法永远不可能。NMO249676的12轮廓／156原顶点与12胞体点产生唯一+36µm数值z候选；保存原source order和节点1–6、70–75，numeric z排序不是解剖切片顺序。

四种预定假设（原顶点算术均值／多边形面积质心 × proper／reflected similarity）各用两组互不混用fit／held-out索引，共8结果。算术均值proper在主分割和交替分割的留出XY最大差异分别为0.017792313333364538及0.02003387743187311µm。原SWC打印XY网格为0.01µm；按预定每轴half-grid探索检查，8结果全部失败。此检查仅是假定nearest rounding的序列化一致性问题，源rounding规则仍unknown；不是45718阈值、测量精度或生物容差，不调整参数获得通过。

从[官方准确记录](https://neuromorpho.org/neuron_info.jsp?neuron_name=061118B-S6-02_cell_2-RQ)的实际链接取得两份ASCII／CRLF原日志，GET均200、1906B和7253B，各自SHA256保存；服务器MIME虽声明XML drawing template，实际为StdSwc1.31文本。原转换日志含42次短段删除和16条未处理警告；standardized日志13条警告的节点／坐标与固定SWC完全一致，10条radius及根8daughters/type核验。原stage编号不直接等于CNG编号，重复radius不作为跨stage身份；上游删除不在本地重做。日志未给出DAT↔CNG矩阵或明确平均规则。官方[Terms of Use](https://neuromorpho.org/useterm.jsp)的CC BY4.0和三项发表归属要求存入audit，本轮没有对外发表。

[候选audit](../data/native-dat-swc-candidate-audit-0.1.json)、[日志audit](../data/nmo249676-standardization-log-audit-0.1.json)、[I48时间轴](RESEARCH_TIMELINE_2026-10-03_IMPLEMENTATION_48_DAT_SWC_CANDIDATES.md)及[QA](qa/2026-10-03-implementation-48/verification-summary.json)分别记录科学失败、工程检查、input preservation和准确边界。UPG261保持planned，零新增source/profile、变换轮廓、表面／volume／内部结构、same-cell join或REG。本轮未修改浏览器产品代码，I47浏览器结果仅保留其已验证范围。81/243、F01–F20、M2／M4和全部Goal保持未完成。


## 61. I49 · 当前显示映射说明、局部可读性与未验证的真实缩放

实际界面检查发现，NMO45718的主场景已能checksum-verified显示7个Soma 1轮廓／252顶点，但route card及当前main warnings仍笼统显示“未建立DAT↔SWC变换”。两入口现在共享准确说明：项目独立拟合的同记录显示映射可在准确source verification／fit通过后使用；8条原生trace／275顶点仍在独立native view；legacy Cell Body未加入映射。源deposited matrix／vertex-to-node identity仍未建立，项目显示关系不成为膜、volume、内部对象、测量或REG。

原科学文件、源labels、既有45718系数／阈值和逐source runtime gates均不改变；其他记录继续没有已准入的DAT↔SWC显示映射，I48候选失败仍保留。修改的是当前UI说明，冻结的旧source contracts及历史审查不回写。实测还发现相关科学边界文字继承8px／9px小字；路由context／conflict与main boundary／route warning现提高至12px并允许换行，main标题与列表上下排列。CSS原件在首次修改前另行加入十份preimages。UPG192保留既有completed范围，81/243不增；主场景29输入中atlas-types／CSS两项更新，native34输入中CSS一项更新，两个范围的旧视图receipt均不能跨build当作有效。UPG053仍in progress。

UPG053的实际200%zoom尝试没有成功：当前浏览器仅公开visibility／viewport能力，原生Codex界面操控被工具安全限制拒绝；main非focusable／Reset不唯一两次定位失败分别保留。对唯一Share state控件的ControlOrMeta+Equal输入完成，但实际document／inner width仍1280、DPR仍2、rootfont16px、CSS zoom1。这里不把390px／640px viewport或CSS倍率称为真实200%浏览器缩放。screen reader及全App可访问性仍未验证。

当前工程／原始input保存与实际desktop／窄屏、source switch、运行层和receipt证据见[I49时间轴](RESEARCH_TIMELINE_2026-10-03_IMPLEMENTATION_49_DISPLAY_SCOPE.md)与[QA](qa/2026-10-03-implementation-49/verification-summary.json)。源对象能力不收缩、不增加默认geometry；F01–F20、M2／M4及全部Goal继续未完成。

## 62. I50 · 两条 lamina X 来源平面入口

UPG140新增NMO194468 treadmill-training与NMO194469 control独立命名入口，均复用既有冻结142 census；不添加几何或扩大179 selectable。原8.6.124 API page0／accurate pointers、SWC／geometry字节和SHA、全部node／edge均回验，节点／边1399／1398及960／959，所有原z=0，原type6不转换成axon或dendrite。42–45Day与条件、250 µm transverse、moderate neurites、diameter和parent缺失分开呈现。

入口明确SOURCE2D，三维radius surface与同标本internals不可用，0REG／0exact physiology joins。修复初次实际打开触发的unknown representation route：命名census child沿用原canonical许可，两处runtime selection统一解析；原冻结representation合同不改、不增权。实际desktop、390px／Enter、31-input主场景凭据及跨尺寸same-source fresh restore通过；说明12px、按钮44px、page width390／scroll390。论文P21–P24训练起点与record42–45Day分开；两份对象不代表control n12／exercise n14或因果／电生理结果。原NeuronJ文件与标准化log未获取。

当前精确completed82/243。工程完整复验、source byte保存和真实浏览器证据见[I50时间轴](RESEARCH_TIMELINE_2026-10-03_IMPLEMENTATION_50_PLANAR_ROUTES.md)与[QA](qa/2026-10-03-implementation-50/verification-summary.json)。全局科学JSON下载等待触发工具超时，未计作成功；已实际捕获的source-view JSON和同源恢复分别有证据。F01–F20、M2／M4、生物校准和整App验收仍未完成。

## 63. 阅读布局与克制动画 · 2026-10-04

按本次用户要求改善网站阅读体验：页面区分资料浏览与3D工作区；标题、正文、导航与次要工具建立更清楚的层级；长形态说明使用自然页面高度，按需展开模式说明和独立入口警告。新增160–200ms淡入与颜色过渡，支持系统减少动态效果。本轮界面修改不增加来源对象、坐标与几何权限，也不推进科学升级完成计数；同期I51形态入口工作另记。实施及实际检查结果见[界面时间轴](RESEARCH_TIMELINE_2026-10-04_ACADEMIC_INTERFACE.md)。

## 64. I51 · 两条独立 PV 来源路线

UPG138在准确对象范围完成：复用冻结8.6.124全集的原API page-0与原SWC，NMO170034（PV-positive／Excitatory／Pax2-negative，1681 nodes／1680 edges）只呈现中心线；NMO118824（PV-positive／Inhibitory／tonic firing，540／539）允许明确DER半径表面。两份各自保留Hughes archive、young-adult、lumbar dorsal horn lamina II–III、60µm sagittal、原strain／condition／domain／integrity／DOI／PMID、raw及derived bytes/SHA，并与当前private main-scene geometry proof、共享档案和rendering policy绑定。原SWC复制数0，规范census142与Universe1097不扩张；0.7冻结representation contract原字节不改写，新两条许可独立增量组合。

来源来自不同研究，不能成为配对实验；tonic firing仅为来源标签。numeric age和准确physical animal／specimen／section parent未知，不从life stage、filename或文献推断；0axon reconstruction／exact physiology join／circuit／allodynia／group statistic／membrane／same-cell internals／REG。当前45 named／181 selectable／39 supplementary与142census分别说明。

两入口实际主场景校验、OBS／DER授权、切换清除旧回执、390px／Enter无横向溢出、同源fresh no-store恢复和wrong-source拒绝均有当前生产浏览结果。工程完整复验及最终代码回执在[I51时间轴](RESEARCH_TIMELINE_2026-10-04_IMPLEMENTATION_51_PV_ROUTES.md)和[QA](qa/2026-10-04-implementation-51/verification-summary.json)独立记录；初次download等待超时不算落盘。tsconfig只排除QA preimages备份源码，不删除备份。同期界面样式／阅读布局变更保留并单独核对，未归入本轮科学成果。精确completed83/243；F01–F20、M2／M4、独立生物学标定、整应用性能及辅助技术验收仍需继续。

I51最终工程封存：最终完整npm run test:research实际退出0：1,432 tests／1,417 passed／15既有conditional skips／0 failed／0 cancelled；包含生产build、严格typecheck、全项目lint、全部必需validators及当前测试入口。Node v26.0.0、Python3.9.6；临时精确positional read预加载只读取实际当前字节，逐size／mtime校验，保留原校验器和source hash要求，代码随QA保存。前五次未完成／失败尝试单独记录：历史MD、SpinalJ intake、RIGHTS_LEDGER.csv及三份R／parser验证输入的暂存遗漏已按原bytes／SHA补齐；比较PNG旧31-input断言改为当前32并显式检查academic-interface.css，额外原测试预镜像先存入ZIP。相关复验36 tests／34 pass／2既有skip／0 fail。原39/39 PV／集成专项独立保留，不能代替完整入口。
四份实际view的132次main build输入／4geometry／8辅助文件比对及两fresh恢复重放0差异。当前2401输入、146 runtime pins、33 main inputs与25份rollback各自有最终receipt；同期界面工作保留。83/243保持，全Goal继续active。

## 65. I52 · 完整已核验来源的主场景相机适配

主场景默认cell_detail视图改以准确当前source renderer对象的完整范围适配画面；同记录已校验且可见的NMO45718 mapped DAT可以扩展范围。来源节点、中心线、topology标记及许可DER实际几何均纳入，不使用参考解剖、lane guide或inspection overlay估算。新增可键盘访问的Fit whole source；默认resize适配、Home默认来源方向、显式Fit保留当前朝向，用户手动／inspection focus／已恢复相机保留。原2D平面、No Diameter、radius权限、投影35／.05／250和orbit4–100不改变。

算法回归复现I51原NMO118824的109／540节点裁切，覆盖181对象／289许可模式／5画幅及252 mapped DAT顶点。完整research实际exit0：1447／1432 passed／15既有conditional skips／0 fail／0 cancel；23 actual captures、920指定build pins与1998输入对账0差异，15默认／Fit／Home完整来源视锥检查通过。用户／inspection／restore姿态及两组fresh no-store恢复保持。新首页和分级导航全程保留，41页面SSR与12来源／静态工作台测试通过，light-theme文字修正经实际重建浏览及72相关测试通过；当前2419输入和29原像逐字节审计通过。准确范围见[I52时间轴](RESEARCH_TIMELINE_2026-10-04_IMPLEMENTATION_52_MAIN_CAMERA_FIT.md)。UPG053／091及F02／F16／F17继续partial；completed仍83／243，完整Goal不据此核销。

## 分级页面重构 · 2026-10-04

用户指出上一轮仍将过多内容堆在同一页面，本轮据此重构信息架构。首页改为研究入口；形态库、单记录查看器、类型及比较子页、SCI、解剖、位置、来源和3D工作区拥有独立URL。全站使用分组菜单、当前页标记、面包屑与移动菜单。普通资料页不挂载主场景；旧query入口转到对应页面。具体范围和实际检查见[分级页面重构记录](RESEARCH_TIMELINE_2026-10-04_MULTIPAGE_LAYOUT.md)。

## 66. I53 · Russ 2021 原始群体来源信息

当前新首页、分级导航和独立研究页面全程保留；Russ信息接入细胞类型页与研究检索页。准确69 Table1群体、414六研究计数字段及10成人原位验证panel已从四固定原输入离线重放。19,353只表示捕获测序cells/nuclei；成人prevalence数值分母仍null，2,371 panel sum与2,894 article total相差523保持unresolved。原始marker／别名／N/A／blank／0与颜色缺失不推导可靠validation。原69 taxonomy、387 profiles及641 base／673 runtime records保持。源核名单、矩阵及GEO per-object rights本轮未准入或复核，UPG132继续in progress，83／243和M2／M4及完整Goal保持。16 Python与准确source replay通过；最终完整research实际exit0：1458／1443 passed／15既有conditional skips／0 fail／0 cancel。新版页面实际来源切换／独立比较／检索tabs／准确handoff／校验失败与恢复通过；25原像和2511当前输入及完整页面依赖逐byte核对。原390px换行证据保留，后续viewport未生效不算窄屏；原生JSON下载仍未验证，不把提示或producer tests算落盘。准确范围见[I53时间轴](RESEARCH_TIMELINE_2026-10-04_IMPLEMENTATION_53_RUSS_INFORMATION.md)。


## 67. I54 · 准确来源位置视图

沿用新版独立Positions页、分级导航和light reading layout；接入实际owned WebGL point绘制、camera/layers/viewport和source-file+Excel row回执、fresh source恢复及准确row URL。40build/wrapper与23原始source pins分开，compact153→198、canonical30新增准入校验路径；原9owned preimages保留。Raw14,484与normalized17,394不配对、不合并为细胞census，animal/experiment/lab/method未知、0cell geometry／same-cell internal／REG／M2／M4。Candidate10tests/800fits/types/scopedlint通过，根完整入口实际exit0：1468/1453pass/15既有skip/0fail/0cancel。15native desktop captures、7完整适配与4camera/restore pairs回验通过；实际orbit/wheel、准确row URL及键盘、empty清零、两fresh no-store restore和stale build拒绝/Reload恢复通过。原生JSON落盘、当前窄屏/resize、held-network cancel/context-loss、200%zoom/screen reader和完整App预算仍未验证，83/243及完整Goal不改变。见[I54时间轴](RESEARCH_TIMELINE_2026-10-04_IMPLEMENTATION_54_RONZANO_SOURCE_VIEW.md)。


## 68. I55 · 来源记录集合的准确导航

新版独立Source Registry、分级菜单与light reading layout保持。15来源自有集合提供274导航actions，219profiles/40morphology actions/10exact object keys/5collection-download actions不替代来源分母；原census142、GLUT277/92782及Ronzano两frame独立。Source/owned recordSet URL、12项分页、准确ID筛选与roving focus接入；unknown/ambiguous/foreign请求不代选。来源byte/rendering仍由目的页私有gate核验，navigation receipt明确metadata-only。Candidate111tests/types/lint及actual Positions static closure40+23/198通过；修复后根完整入口exit0：1490tests/1475pass/15既有conditional skips/0fail/0cancel。实际desktop书签/分页/筛选/键盘/准确目的档案、Ronzano独立frame及current40+23receipt回验通过。搜索框可见边框/背景/焦点与初始化inert/aria-busy接入现有URL完整恢复；首次输入未保留和lint失败分别保留，最终重建重验通过。Native下载落盘、当前窄屏/辅助技术/整站预算仍未验证；2549canonical/2552stage/198runtime封存回验另记。31sources/41sets/387profiles/83of243及全部Goal保持。见[I55时间轴](RESEARCH_TIMELINE_2026-10-04_IMPLEMENTATION_55_SOURCE_NAVIGATION.md)。


## 69. I56 · 成人脊髓电生理原始汇总来源

新版Additional studies独立页面接入UPG173 lazy source信息；准确DOCX/XML/CC BY4.0 metadata及独立source提取已封存。四替代partition共享171recorded observations，192mean/SD、48comparisons与51/6reporter mice、60records/28of51mice嵌套reuse分开；未知individual/units/6vs4冲突保留。一个aggregate信息adapter使current32sources/42sets，不新增profile/roster/type/geometry/identity/REG；387/13rosters/4objects/83of243不变。根28paths已整合并保留15原像/19physical absences及I55accepted layout；唯一root修正显示原始`Cm = Rin/τ`及原冲突理由。最终完整research实际exit0：1506/1491pass/15既有skip/0fail/0cancel，原源Python6/6。Actual新版desktop/390px、四表192cells/48comparisons原值与locator、URL/失败关闭/恢复/历史/committed卸载/Enter/Tab出口及局部表格方向键滚动通过；390px页面无横向溢出。Current package的Positions旧build拒绝清零、fresh source reload/restore及3captures/120build+69source pins/2fits独立重放通过，原40+23/compact198 membership保留。2570canonical/2573stage最终doc epoch及独立封存另验。Native JSON5s未落盘、200%zoom/screenreader/整站预算未验证；UPG173 in progress和完整Goal保持。见[I56时间轴](RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_56_AGGREGATE_PHYSIOLOGY.md)及[QA](qa/2026-10-05-implementation-56/verification-summary.json)。

## 70. I57 · 研究检索来源组键盘焦点

沿用新版`/research/explorer`独立页面、分级导航、来源/证据区域及现有样式；每个非空可见来源组保留一个record Tab入口，方向键/Home/End只移动该组可见完整ID焦点，Enter/Space沿原button选择准确档案，Tab自然退出。展开/收起/过滤只回退可见焦点，不替换既有选中来源；673研究records/28namespaces与387profiles/181morphologies原顺序和分母保持。三路径候选在6原像/3新路径absence及I56accepted62member checkpoint保存后整合；新子组件/专项/时间轴增加3canonical pins至2573。最终完整research actual exit0：1511tests/1496pass/15既有conditional skips/0fail/0cancel。Actual方向键focus-only、nativeEnter/Space/Tab、157Roome展开/循环/收起保留原档案、8literal matches/空结果/重置、28来源组/准确Delile与SCI及形态选择、后置来源9组刷新、Russ独立页handoff/Back/Forward通过；历史档案只允许六actual request timings变化，其余全文独立回验一致。390/768/1280px实测无页面横向溢出，窄屏3px focus outline与12px help保持。隔离stage四文件的同长度decoded错误索引拒绝、0records/0旧dossierTabs/0handoff及原字节恢复通过，root source未改。Actual原始membership独立重放通过；AST111→115仅Explorer新增四运行时依赖，私有八viewer并集198/Positions40+23保持。2573canonical/2576stage最终doc和保全另验；200%/screenreader/whole-App预算与本轮native pending-load取消未验证。32sources/42sets/83of243、身份/geometry/REG/M2/M4准入不变，完整Goal保持active。见[I57时间轴](RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_57_EXPLORER_KEYBOARD.md)及[QA](qa/2026-10-05-implementation-57/verification-summary.json)。


## 71. I58 · V1准确来源样本书签

沿用新版Cell types/Source audits独立页面、分级导航、breadcrumb/light layout。六准确入口复用已有29 GEO sample审计与deferred工作台；current说明对齐29characteristics/四sheets/29barcodes/一个matrix结构，旧availability保留earlier disclosure。Qualified URL限定audit/date/fullkey/query/cohort；过滤移除、错误/外源/过期/重复/部分请求清零，不代选。仅输出已有factual sample rows，无raw matrix或新identity。9原像/3physical absences与I57accepted checkpoint保留；六产品afterpins精确。首次完整检查两旧文字断言失败另保存，两test原像保留后更新准确结构及held boundaries；产品候选不变。最终完整research actual exit0：1519/1504pass/15既有skip/0fail/0cancel。Actual六档案/refresh/nativeEnterSpace/四cohorts/空query/BackForward/九malformed拒绝/重复外参reset/committed卸载fresh恢复/原publication和PKD2L1通过；390/1280px无页面溢出、局部ArrowRight/focus通过。NativeJSON5s未落盘，hydration-disabled瞬间/module-pending取消/200%zoom/screenreader/whole-App budgets未验。2577canonical/2580stage与独立doc保全另验；private198/Positions40+23、32sources/42sets/387/83of243保持，完整Goal active。见[I58时间轴](RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_58_TREVISAN_SAMPLE_BOOKMARK.md)和[QA](qa/2026-10-05-implementation-58/verification-summary.json)。


## 72. I59 · 同来源RNA双特征计数

沿用新版独立Cell types页面、分级侧栏、Breadcrumb和light layout；默认关闭的双特征子视图只输出同来源RNA列的raw>0四分区、准确选中核计数和11完整profile分母。Chat/Pitx2两个chunk与Xkr4/Gm1992一个chunk分别fresh校验，过滤/分页/无匹配查询不替换已选特征或改变完整分母。七候选路径准确应用，9原像/4新路径absence及I58accepted51member checkpoint保存。完整research actual exit0：1526/1511pass/15既有skip/0fail/0cancel，含build/types/lint/必需validator。Actual来源切换、关闭/feature replacement、404与wrongchunk拒绝和fresh retry、独立single继续、53/74分母及390/1280新版layout通过；strict时间归属另附log/DOM receipt。独立原chunk/923metadata重放核对11profiles及两个准确Downloads文件JSON11358B/CSV20468B落盘；event API5s超时仍保留。I58后续[GSM8480605准确下载addendum](qa/2026-10-05-implementation-58/native-selected-json-file-landing-addendum.json)亦已核对，原sealed历史不追改。Package只扩requiredvalidator，private198和Positions40+23 membership不扩大，current Positions旧build清零拒绝/fresh reload/restore另验。2581canonical/2584stage及末尾独立保全随后封存。Native pending-route取消/200%zoom/screenreader/whole-App预算未通过；32sources/42sets/387/83of243、geometry/identity/REG/M2/M4不变，完整Goal继续active。见[I59时间轴](RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_59_CANO_RNA_PAIRS.md)及[QA](qa/2026-10-05-implementation-59/verification-summary.json)。


## 73. I60 · 准确分子比较书签

新版独立Profile comparison页面保留分级侧栏、Breadcrumb和light reading layout。准确0–4完整source keys、anchor、query、namespace及page由七个URL字段恢复，版本和当前private decoded-index receipt限定权限；11种实际无效请求清空basket/report/exports，不替代对象。跨namespace/空筛选保持basket，第五项disabled；0/1项不生成报告；nativeEnter/Space、anchor移除、Roome157末页14/一项、refresh/link、重复外参/fragment及history/reset、route卸载/fresh恢复通过。完整research实际exit0：1534/1519pass/15既有conditional skips/0fail/0cancel，含build/types/lint/必需validators。误选Node24的gzip重压失败原样保留，源字节/解码正确；使用原Node26重跑通过，不重建gzip或放宽gate。49actual DOM captures的52pairs/208来源维度/52完整receipt由原387profile index及五taxonomy scopes独立复算；21receipt实际展开，两个准确JSON49648B/CSV18219B落盘并独立内容核对，event API两5s timeout保留。canonical请求75延迟12s后304/cached恢复仅supplemental；80的304/代理502不算checksum proof。实际84完整原gzip200后同长度decoded错误字节使页面校验失败并保持结果关闭，87完整原gzip200准确恢复同书签；临时部署副本metadata/重启使ETag换epoch，四份副本原timestamps已恢复，root源码/源字节不改。CmdShiftR无新请求证据、API measurement native0、network initiator/body consumption不冒称。Actual390/1280无整页overflow，原生ArrowRight后续capture局部scroll0→40，2px表格焦点/Tab出口及新版截图通过；错误heading locator原attempt保留。四产品afterimages不变，Compare static closure40→41仅bookmark JS；runtime198/Positions40+23 membership与字节保持。2585canonical/2588stage最终doc epoch另封存。32sources/42sets/387/181morphologies/83of243不变；200%zoom/screenreader/whole-App budgets/M2/M4及完整Goal仍未完成。见[I60时间轴](RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_60_COMPARISON_BOOKMARK.md)及[QA](qa/2026-10-05-implementation-60/verification-summary.json)。


## 74. I61 · NaV抑制准确来源信息

沿用新版 Source audits／Source Registry 独立页面、分级 SiteNavigation、Breadcrumb 和浅色阅读布局。现有 Crozat 层级新增默认收起的 NaV 来源子面板，局部筛选／12 行分页／显式源行选择／JSON 与 CSV 导出；关闭子面板、父级、workspace 或离开页面后重新进入均恢复默认，旧选择及导出提示清除。没有新增 NaV URL 书签或 Registry 个体导航。

两份准确 XLSX 保留新增84 measurement rows：56 current-density 与28 published-percentage，各自来源 row／cell locator／numeric lexical／hash 可追溯。28 percentage rows只有27 unique native labels，重复 Cerv Cell11、缺失 Lomb4和93–143.1%均保留；不跨表配对、补 Cell12、clamp percentage或推断physical-cell/animal identity。26 retained originals 与25 selected information workbooks分开，唯一未选 INa.xlsx 的原因unknown。原23tables／2115rows／220within-table groups以及PKD2L1 one profile／65firing／654passive rows不变；article12/6/10与Fig5D12/8/6、100vs50ms／0vs+10mV、0.5µM及study-levelN10保持准确归属而不映射到源行。

19个候选afterimages在I60 accepted64-member checkpoint、2585canonical和9个预像／16个absences保护后应用；15新路径加本时间轴共16准确CORE输入，当前2601canonical。完整research实际exit0：1550tests／1535pass／15既有conditional skips／0fail／0cancel，含build／strict types／全项目lint／required validators；Python来源重放6/6通过。原实际错误label locator、两lazy transient captures与六个5s download-event timeouts保留；六准确文件均原生落盘，独立内容验收通过（42 stable captures、两保留 transient 和一份独立 Registry dossier；六导出全字段逐行一致）。selected density row4 JSON与full percentage28 JSON分别保留，未冒称第二份selected percentage JSON。

Actual desktop／390px、新版导航／来源层级、native Enter／Space显式选择、Tab focus-only及退出、局部Scroll right200px、空筛选清零／关闭重开／跨页选择清除通过；页面无整页横向溢出。Positions旧package凭据实际拒绝清零，fresh no-store校验23files后17394normalized rows、改变Transverse后fresh restore保存相机／row／layers通过，独立重放通过（3 acceptance captures 加1 Transverse precondition、两 exact producer strings、40build与23source pins；17394 source centers及8 bounds corners无裁切）。runtime198 ordered membership只有package row重固定，Positions37mounted／40build／23source及22原XLSX不扩张。最终doc epoch、stage2604 replay entries／2603unique physical paths和2577prior protected inputs独立保全分别以本轮最终 QA 的独立实际执行为准；阶段报告不替代末尾保全。

当前32sources／42sets／387profiles／45named routes／181selectable／142census／39supplementary／83of243保持；0新profile、physical roster、observed geometry、same-cell join、internal或REG。F03／F08／F13–F17局部推进，200%zoom／screen reader／whole-App budgets及M2／M4仍缺完整验收，完整Goal继续active。


见[I61时间轴](RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_61_CROZAT_NAV_INHIBITION.md)及[QA](qa/2026-10-05-implementation-61/verification-summary.json)。

## 75. I62 · 准确来源汇总信息入口

沿用新版独立Source Registry／Additional studies页面、分级侧栏、Breadcrumb与light reading layout。仅Garcia准确owned source／set／declaration／四assetpins提供一个来源汇总信息action；Crozat不新增action，metadata navigation不升级为individual identity或source-byte/render authority。原四产品afterimages保留，三个新代码／声明／测试与时间轴增加4CORE至2605；I61 accepted83-member checkpoint、真实intake和六原像完整保留。

390px实测新链接继承11px／38px，单一Link增加12px／min44后实际56.390625px、2px focus、无页面overflow；原finding／原patch／apply receipt及纠正前像保留，既有CSS与新版布局保持。最终完整research实际exit0：1559／1544pass／15既有skip／0fail／0cancel。两metadata读取拒绝和一次新只读reader误拦4个OS-temp故意改写tests保留；17边界peer通过的first-epoch reader仅用于只读manifest，完整tests恢复原per-read方式、原validators和断言后通过。

Actual34raw／32stable与真实navigation／TH+TD table companions通过；两lazy瞬间不计稳定。准确keyboard／目的页／history／refresh／零筛选保留／Crozat切换／unknown-conflicting-foreign拒绝／panel生命周期／Delile既有分页／390及1280布局通过。独立第二actual replay exit0、124unique end epochs稳定，87重复property rows只有唯一12ST1＋1ST3，不算新观察；首次other-source QA把navigation receipt混计dossier的拒绝及修正41守卫／独立peer保留。两source dossiers各一次原生落盘，Garcia24649B／Crozat20782B的完整7fields逐字面重放通过；event API5s timeout保留。来源dossier不代替Additional完整Study facts导出，UPG173仍in progress。

171共享观察pool、51／6动物及60／28复用subset／未知mapping／null units／source statement冲突保留；Crozat25selected／26retained、原23／2115／220与新增84分开。32／42／387／13rosters／4objects／83of243、whole runtime198／private8／Positions40+23与package保持，canonical2605／stage2608 finalepoch及2596protected末尾保全由最终QA实际执行确认。200%／AT／整站预算／M2／M4及完整Goal保持active。见[I62时间轴](RESEARCH_TIMELINE_2026-10-05_IMPLEMENTATION_62_SOURCE_INFORMATION_NAVIGATION.md)与[QA](qa/2026-10-05-implementation-62/verification-summary.json)。

## 76. I63 · Russ GEO原始对象schema范围核对

六个非公开源／审计路径与独立timeline共CORE7已真实整合。实际V7只读intake核对2605个旧canonical输入和87个accepted I62成员，完整SHA、结束首次epoch及0拒绝通过；初始ROOT／Stage 2612个输入全字节对等与结束首次epoch核对通过，已采用新清单。完整research实际exit0：1559项测试、1544通过、15既有条件skip、0fail、0cancel，含生产build、types、lint与必需validators；独立Python源schema审计通过。

两个原始gzip仅提供24,927个不透明source ID条目与31,040个原生feature string，E2/E5/E6/E9仅保留源前缀。论文9周28,584个核、既有harmonized 19,353个核及in situ 2,371／2,894差异分别保留，不能互换分母或推导动物／cell／profile身份。官方矩阵访问记录为403，尚未取得矩阵字节；UPG132继续进行中，本轮不产生表达计数或矩阵验证。

当前新首页、分级SiteNavigation、Breadcrumb、独立页面和light reading layout保持；科学admission全部0，83/243及完整F01–F20／M0–M4目标仍未完成。旧V5／V6拒绝、Node／Stage停止尝试和云文件materialization分别保留，不将云下载请求当作内容校验或将旧拒绝改为PASS。最终文档epoch、清单、Stage对等与来源保全的实际结果以[本轮QA](qa/2026-10-05-implementation-63/verification-summary.json)为准；初始检查不替代末尾封存。

## 77. I64 · Cano来源标签的明确选择保留

两个来源标签浏览器现在按准确完整ID保留明确选择。搜索、source group、排序和分页只改变列表；原选标签离开可见结果时，资料及标签导出仍属于该标签，并显示保留提示。只有明确激活另一标签才替换选择。GABA的原始细胞核child、loader和导出保持原有边界，未知／空／foreign／stale ID不代选首行。

真正accepted I63保留原始accepted时钟，实际只读intake核对2612旧canonical、94完整archive及90当前受保护成员；额外GLUT gzip仅为原声明的非canonical运输上下文，不准入新CORE。前两次intake拒绝、云文件请求失败及最终intake的一次未接受epoch metadata拒绝完整保留；停止的默认环境清单比对与本机文件服务重跑分别保留，下载请求不作为内容验证。实际整合只改两个浏览器、新测试、builder准确CORE2和本轮时间轴。

完整research实际exit0：1571项测试、1556通过、15既有条件skip、0fail、0cancel，包含生产build、strict types、完整lint及必需validators。51条实际页面操作记录验证默认标签、明确选择、筛选／分组／分页／排序、Enter／Space、390px键盘检索、保留提示及加载中的取消。已加载child的内层Cervical检索、第2／34页、source row1308的准确compound key及完整导出在外层变化后逐字段一致。真实15秒延迟请求在外层筛选后仍归原标签；明确切换时实际取消，迟到的准确原始响应不恢复旧rows／proof／export。

两份所选标签JSON均实际落盘并与原来源完整内容一致：GLUT Col13a1为2826核、4506bytes；GABA Col18a1为2068核、3471bytes且runtimeNucleusRowsIncluded:false。事件API timeout及原始action／文件landing时钟保留。390px没有整页横向溢出；真实200%缩放快捷键没有改变当前浏览器缩放，仍待验证，screen-reader announcement亦未实测。不新增标签URL解析器；错误label ID仅由test-local state injection验证，不冒称原生URL／bookmark／Back恢复。

全程沿用当前新版首页、分级SiteNavigation／sidebar、Breadcrumb、独立研究页面及light reading layout。CSS、原始数据、source loaders、package、runtime198／private8／Positions40＋23和科学分母不变：GLUT277／92782／28、GABA204／73364／24、confirmed CHOL_IN11／923、32sources／42sets／387profiles、45named／181selectable／142census／39supplementary、exact completed83／243。科学admission全部0，完整F01–F20／243＋21／M0–M4继续active。

末尾范围为2614当前canonical、2607旧canonical保护输入、94完整旧archive及90当前受保护archive成员；最终文档／清单／Stage对等与来源保全以[本轮QA](qa/2026-10-07-implementation-64/verification-summary.json)的真实结果为准。阶段工程与有限native成功不替代末尾保全、200%／AT／整站预算或M2／M4来源证据。

## 78. I65 · 无效类型请求与重复链接迁移

沿用当前新版首页、分级 SiteNavigation／侧栏、Breadcrumb、独立研究页面及浅色阅读布局。类型页面明确请求未知、空、重复、其他对象种类或过期编号时，现在显示不可用状态，不以 DE-1／首条记录替代，不选择来源行并禁用 dossier 导出；真实激活有效来源记录后恢复准确档案。没有明确请求时，原 DE-1 默认行为保留。

修改现有 InterneuronTypeAtlas 与外层 ResearchCollectionPage，完整保留重复 URL 参数，拒绝格式不完整的 canonical 请求，并阻止重复 legacy type 自动升级成有效 canonical 链接。有效 dossier 内容与导出生产器、现有来源标签浏览器、CSS、导航、原始来源数据、加载器及 package 保持。查询／完整筛选的 URL 历史恢复未在本轮完成。

真实浏览先发现 canonical 空编号仍显示 DE-1，修复后又发现重复 legacy 编号会自动取得有效 focus；两个原始失败均保留，再修复并重验。最终完整 research 实际 exit0：1582 项测试、1567 通过、15 既有条件 skip、0 fail、0 cancel，包含生产 build、strict types、完整 lint 与必需 validators；新增11项实际组件／外层路由测试全部通过。前两次完整检查各自真实通过但对应中间源码，不能代替最终检查。工作区直接检查的未完成／终止结果亦保留，不改成通过。

最终11条原生页面记录通过：重复链接原 URL 及刷新后仍不可用，canonical 空／重复／错误种类没有替代档案，未指定编号仍为 DE-1；390px 的零匹配、来源筛选不替换请求，native Enter 准确恢复 DE-2／80 sampled nuclei，后续零匹配仍保留该档案。新版侧栏及 Breadcrumb 始终存在，没有整页横向溢出。输入工具一次 target-token 拒绝及上一轮记录 helper 失败原样保留，未补造 action 时钟；最终稳定逐条原始记录与真实键盘动作单独保存。

同轮 UPG-173 的 ST4／rheobase 两次不同输入方式导出未在预期 Downloads 文件集合出现新文件；旧文件全内容及元数据保持。页面提示不算落盘，旧文件不代替新导出；UPG-173 继续 in progress，没有 ACTUAL_READY 或科学 completion。

当前 runtime ordered membership 198、private scopes 8、Positions40＋23保持；ResearchCollectionPage 属于原198成员，因此 whole-runtime SHA合法更新为990fd1ffd752aef551db386c123f9af30e0519ea036d96c0e62e62557ee4f8b0，不能声称整个runtime字节不变。新增测试及独立时间轴为准确 CORE2，canonical输入2614→2616。真正 accepted I64 保留2026-10-08T01:16:54.057749+00:00原时钟；原98-member archive全内容另核对，原文及每次局部修复前态独立保存。本轮工程完整检查与Stage当前清单检查、Root本轮变动文件对等应分别说明；不把继承的I64全部Root来源检查改写成一次新的2616输入Root物理重放。

32sources／42sets／387profiles、45named／181selectable／142census／39supplementary、13rosters／4objects、exact completed83／243以及身份／内部结构／REG准入不变。F13／F15／F17仅有限推进；200%实际缩放、screen reader、完整浏览历史、整站性能预算及M2／M4仍按原目标待验，完整F01–F20／243＋21／M0–M4保持active。

见[I65时间轴](RESEARCH_TIMELINE_2026-10-07_IMPLEMENTATION_65_INVALID_PROFILE_REQUEST.md)及[实际QA](qa/2026-10-07-implementation-65/verification-summary.json)。

## 79. I66 · 来源信息页面的按需索引加载

沿用当前新版首页、分级SiteNavigation／侧栏、Breadcrumb、独立研究页面和浅色阅读布局。现有Sources与Additional study evidence页面没有对象请求时，不再下载未使用的Research Explorer索引；明确canonical／legacy／空／错误请求仍要求验证，其余11种collection及旧workspace默认加载行为保留。移入idle时立即隐藏旧index／record／delta，原AbortController与generation继续丢弃迟到响应。I65完整请求参数、无效profile和重复legacy拒绝修复保留。

实际整合Provider与当前I65 Collection，在完整前态核对后仅合并三个明确片段，未以过期候选覆盖I65。新测试及本时间轴增加准确CORE2，2616→2618。首次应用因引用的候选hash不准确而停止、零产品写入；与原候选handoff完整核对后第二次应用通过，原拒绝保留。CSS、导航、source loaders、原始数据及package不改。

本轮24项实际组件／hook／collection回调测试通过，覆盖两metadata页opt-out、默认与准确对象仍加载、同步隐藏旧数据、取消／迟到index及supplement、A→B→A、失败关闭、重复key及live-address历史需求。最终完整research实际exit0：1595项测试、1580pass、15既有conditional skips、0fail、0cancel，含生产build、strict types、完整lint和必需validators。候选13项通过不是当前集成证明，最终实际检查单独保存。

真实页面共24条观察，其中2条I65前态、22条当前观察。默认Source registry及Additional页面的完整可见文字与前态逐字一致，desktop与390px均没有整页横向溢出，新版sidebar／Breadcrumb始终存在。Sources准确Garcia来源的native Enter、真实Back／Forward保留来源档案；明确对象与Sources／Additional空请求均仍请求索引。Explorer仍显示673records／28namespaces及准确DE-2／80sampled nuclei；Compare仍显示387profiles／10namespaces，原生键盘加入准确I1／I2并生成原完整来源字符串报告。类型页面重复链接继续不可用，focus仍为none，没有恢复DE-1。

只在owned本机3028→3004的受控no-store运输中观察请求，正文与encoding保持；18个实际manifest／index请求完成200，完整body hash与原bundled transport一致。每个前态metadata页各读5622B manifest与628095B encoded gzip index；当前两个默认页及来源选择／无请求Back没有此类请求。原gzip完整解码为12327624B／c1fb786da4a1624b28fbe4c9c7063eb0f108b6a12e91d082008f1c7102e17085，与原plain index全文一致。628095B是encoded运输量，不能写成decoded JSON大小。两次lazy-shell瞬间保留并另等待当前heading后记录ready；不是删除内容或以未加载页面计算成果。这是有限请求准入与页面行为，不声称whole-App预算、完整network initiator／body consumption、private byte权限、native export、200%实际缩放或screen reader通过。UPG-230继续in progress。

runtime198 ordered membership、private8及Positions40＋23 membership保持，只有原Provider／Collection两成员byte pins合法更新，whole runtime为36638B／d749f7a9e957a3add94d179fff5678dd49689bd88ecf5b8c3ab1a732628ce86a。继承I65有限整合scope与原15-member checkpoint全内容核对，真正accepted I64原时钟及98-member archive保留；本轮Stage当前完整清单、Root本轮变动文件对等与原归档应分别说明，不冒称新的一次全部Root2618输入物理重放。

32sources／42sets／387profiles／13rosters／4objects、45named／181selectable／142census／39supplementary、exact completed83／243及same-cell／internal／REG准入不变。UPG-173 fresh Study facts导出落盘、完整类型筛选／历史恢复、200%／AT／whole-App预算及M2／M4来源证据仍待验；完整F01–F20／243＋21／M0–M4Goal保持active。

见[I66时间轴](RESEARCH_TIMELINE_2026-10-07_IMPLEMENTATION_66_INDEX_DEMAND.md)与[实际QA](qa/2026-10-07-implementation-66/verification-summary.json)。

## 80. I67 · 类型页完整地址状态与历史恢复

全程保留当前新版首页、分级SiteNavigation／侧栏、Breadcrumb、独立 `/explore/cell-types` 路由及浅色阅读布局。类型页的准确对象ID、literal query、source／region／transmitter三项筛选、0–4个比较和不同对象baseline由同一严格解析器恢复；当前387个profile／10个namespace的轻量请求成员清单从原public index准确生成，并与实际组件387条记录及生成器逐项核对。该清单仅限定公开metadata请求，不授权private roster bytes、跨研究身份、同一细胞、geometry或REG。

父级active-record请求与子级dossier／export同时拒绝重复、空、不完整、未知、旧或异类ID，以及错误／重复筛选、超过160字符或重复query、未知／重复／超过4项的比较及无效／同对象baseline。编辑控件仅修正用户改动的字段；无效比较保留至明确清除，筛选不替代对象。有效对象在零匹配结果中继续显示原准确档案和比较。搜索更新当前历史条目，对象／筛选／比较建立条目；真正Back／Forward恢复原baseline，不把历史恢复伪装成一次新选择。保留无关重复参数和fragment。

本轮51项针对性检查通过，执行真实编译后的组件／父级回调、全部实际profile adapters和严格source-record delta helper；测试内受控历史不冒称原生浏览器证据。最终完整research实际exit0：1622项测试、1607pass、15既有conditional skips、0fail／0cancel，包括生产build、strict types、完整lint及必需validators。初次完整候选1621／1606／15通过后，真实页面发现重复ID提示被错误显示成empty；已显示原始重复值并区分missing／empty，增加实际检查后重新完成整条工程检查。

39条真实页面观察保留，37条ready；包括原生AX Return准确选择DE-2／80与DE-3／37、加入比较，真实refresh／Back／Forward、完整书签、两档案比较、零匹配保留、重复外参／fragment、父级focus关闭、错误参数明确修复。最终构建9条观察中8条ready，1条lazy-shell另等ready后验证。390px及默认1135px没有整页横向溢出，临时viewport已恢复。一次控件locator未命中及原AX字段选择器更正保留，不以空壳算成果。修正前、refresh／Back／Forward及最终构建的同一DE-2档案／controls／comparison文字逐字相同。截图实际返回JPEG，已按真实格式复制保存，原文件与像素保留。没有native file export、完整AT／200%真实缩放、whole-App预算或private byte权限结论。

代码应用前态与I66原15-member归档全文核对；消息修正两次因Root source／QA读取期间metadata变化而被原5-field before／after guard拒绝、零产品写入，完整预读后新独立尝试通过，guard没有放宽。Native记录核验的一次metadata拒绝及一次错误PNG格式假设也保留；根据真实JPEG完整字节与SOF尺寸核验后通过。当前canonical增加准确6项输入，2618→2624，原runtime198与private8／Positions40＋23成员保留，仅Collection原成员pin更新。最终Stage完整清单、Root本轮15个整合文件全文相等和I66原15-member归档重放分别核验；真正I64完整Root来源时钟2026-10-08T01:16:54.057749+00:00仍为继承前态，不冒称本轮新全部Root2624输入物理重放。

32sources／42sets／387profiles／13rosters／4objects、45named／181selectable／142census／39supplementary、exact completed83／243及身份／内部结构／REG准入不变。仅有限推进F13／F15／F17；其他Cano／SCI等完整状态恢复、UPG-173 fresh原生Study facts落盘、整站性能／AT／200%及M2／M4来源证据仍待完成，完整F01–F20／243＋21／M0–M4Goal继续active。

见[I67时间轴](RESEARCH_TIMELINE_2026-10-07_IMPLEMENTATION_67_TYPE_VIEW_STATE.md)与[实际QA](qa/2026-10-07-implementation-67/verification-summary.json)。


## 81. I68 · 原生研究事实附件与暂停交接

短生命周期Blob下载改为准确GET附件，并沿用新版独立页面、分级侧栏、Breadcrumb和浅色阅读布局。文件必须明确命名一个ST1–ST4；缺失／未知／重复table或重复query退出400，无附件／来源事实。显式改一个字段保留其他重复外参和fragment，不修复另一字段。页面只声明Download requested。四原表／48属性／192mean±SD／48比较、同一个171观察池、未知单位／动物映射及13顶层导出语义保持。

26项专项通过。最终产品完整research实际exit0：1630tests／1615pass／15既有conditional skips／0fail／0cancel，含build／strict／lint和全部必需validators，UTC2026-10-08T03:42:04.108877–03:45:52.789133。六个有限产品／timeline输入已整合，原I67的29成员archive全内容重放；runtime198与来源facts／derivation不变。

真实新版页面仅核对ST1十二行及ST4／rheobase一行。原生Enter在UTC03:51:28.141–03:51:28.280触发准确GET，request1303返回200；浏览器报告paused download response is no longer available，后续DOMSnapshot超时。恢复保留原action时钟，不重建操作／下载事件。Downloads无新匹配文件，旧文件保留检查先通过。HTTP200不算落盘；没有实际新文件13字段／本版窄屏／后续DOM验收。UPG-173仍in progress，83／243不变。

2026-10-08用户明确要求本session本轮收尾后暂停升级、推送全部更新并设Repo为Public。完整Goal未完成；后续事项见[待更新项目](PENDING_UPDATES_2026-10-08.md)。其他Cano／SCI完整状态、200%／AT、整站预算和M2／M4全部保留。推送／Public以实际Git／GitHub检查为准，未发生成果不预先登记。

见[I68时间轴](RESEARCH_TIMELINE_2026-10-07_IMPLEMENTATION_68_STUDY_FACTS_DOWNLOAD.md)和[实际完整工程执行](qa/2026-10-07-implementation-68/actual-candidate-full-research.execution.json)。
