# 全部升级项目执行对照 — P03

日期：2026-09-29（America/Toronto）  
范围：P03 时点的 243 条研究／模型记录 + 21 条旧来源准入记录。**下方表格是规划快照，保留当时状态；2026-09-29/30 实施后的当前状态以规范队列及[实施时间轴](RESEARCH_TIMELINE_2026-09-29_IMPLEMENTATION_01.md)为准。**

[主规划](UPGRADE_PLAN_2026-09-24.md) · [长时间执行总纲](LONG_RUN_UPGRADE_RUNBOOK_2026-09-29.md) · [本轮时间轴](RESEARCH_TIMELINE_2026-09-29_PLANNING_03.md)

## 如何查找和执行

每个精确 ID 都有下一动作、验收及替代路线；保留 A/B 后缀。每轮只需读取当前工作包及其相关 ID，不必把本附录全部装入上下文。原状态逐字来自规范注册表；本轮分派是建议，不是新的完成状态。`retain_completed` 也可能表示某历史 watch 的展示部分已经被后继任务覆盖，不能据此改写原状态。

`file_read_checked` 仅指本轮读过列出的本地文件相关内容，既不是执行过测试，也不是重新核验在线来源；`queue_record_only` 只依据规范队列记录制定下一步。历史条目中的文件大小、分母和版本在实施时复核，不直接作为新来源事实。

“关联项”包含需先核对的来源门槛或已完成背景，不自动形成必须先 completed 的依赖；渲染某对象的硬条件按主规划和执行总纲落实。替代动作如果同样受当前依赖影响，直接选择执行总纲 W01/W13/W14/W15 中与该依赖无关的具体差额；不得围绕同一缺失文件循环。

## P03 历史覆盖快照

- 规范研究注册表：[research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)，SHA-256 `925f634fb686424e3941fee933a9517362913645d7a95be306faa224530d970d`。
- 规范文字队列：[RESEARCH_MODEL_UPGRADE_QUEUE.md](RESEARCH_MODEL_UPGRADE_QUEUE.md)；按完整 ID 对账，两者当前均为 243 条，无漏项和重复。
- 旧准入列表来自当前 `app/atlas-types.ts` 实际引用的 [public-data-catalog-0.4.json](../data/public-data-catalog-0.4.json)，共 21 条；它们不混入研究注册表的分母。
- 原状态精确为 `completed` 的研究项是 73 条；下面的规划分派计数采用不同含义，不能混称完成率。

| 规划分派 | 项数 |
| --- | ---: |
| 保留已完成范围／后继成果（`retain_completed`） | 78 |
| 可推进候选，启动前核实（`ready_candidate`） | 34 |
| 先解决精确来源依赖（`source_gate`） | 93 |
| 有新证据才重查（`conditional_watch`） | 36 |
| 当前精确范围关闭（`closed_exact_scope`） | 2 |
| 暂缓行政扩展（`deferred_admin`） | 0 |

| 研究方向 | 覆盖项数 |
| --- | ---: |
| 参考解剖（`reference_anatomy`） | 6 |
| 分子分类与谱系（`molecular_taxonomy`） | 42 |
| 空间与切片（`spatial_context`） | 23 |
| 真实形态（`morphology`） | 47 |
| 连接与投射（`connectivity`） | 15 |
| SCI及疾病状态（`injury_state_context`） | 14 |
| 电生理（`electrophysiology`） | 5 |
| 内部结构与显微细节（`internal_microdetail`） | 57 |
| 科学来源与对象身份（`provenance_and_identity`） | 19 |
| 研究界面与操作（`research_experience`） | 15 |

## 参考解剖

<a id="upg-022"></a>
### UPG-022 · 脊髓参考解剖与误差

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留38层外脊髓及粗灰质行包络的已完成增量；只在解剖改动时回归，并把新增精度工作交给026/037
- 验收：不把行包络升级为完整灰质边界；源层数、显示边界与导出表述一致
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-024"></a>
### UPG-024 · 脊髓参考解剖与误差

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留七类主要内部解剖区域的逐层源ID线条；后续颜色或选择改动时检查ID稳定性
- 验收：显示颜色不承担解剖权威；线条不被描述为个体细胞内构
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-025"></a>
### UPG-025 · 脊髓参考解剖与误差

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留37标签历史里程碑并指向037的73叶节点覆盖；不重复创建第二套解剖浏览器
- 验收：14层板、17核团/柱、6束只作为历史范围；当前覆盖由037解释
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-026"></a>
### UPG-026 · 脊髓参考解剖与误差

- 原记录：`P0`；状态：in progress。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：核对38采样层对32个连续注释状态段的覆盖，完成采样密度敏感性实验并登记独立误差基准缺口
- 验收：层覆盖、几何算法正确性与独立生物误差分别报告；未满足独立误差条件前不开几何比较
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-037既有精确mask的可见性/加载/来源信息；独立生物基准缺失不阻断其他source-local对象。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-037"></a>
### UPG-037 · 脊髓参考解剖与误差

- 原记录：`P0`；状态：in progress。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：保留73叶节点完整体素面实现，补齐真正独立的生物解剖基准与区域误差报告，并复查lazy加载交互
- 验收：独立set oracle仅证明算法面覆盖；生物验证待独立来源；73记录排除interneuron分母、measurement-forbidden及0REG保留
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转 UPG-252 已准入对象详情或 UPG-053 可访问性中不依赖本项数据的具体差额；当前缺口及重启条件保留，不回到同一失败动作。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-038"></a>
### UPG-038 · 脊髓参考解剖与误差

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：逐幅对齐公开P56横断参考和成人术语，审计同源concordance及采样敏感性
- 验收：不得称独立验证；无plate-to-volume映射不填C1–S3或物理z
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-037既有精确mask的可见性/加载/来源信息；独立生物基准缺失不阻断其他source-local对象。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。


## 分子分类与谱系

<a id="upg-023"></a>
### UPG-023 · 分子分类与发育谱系

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留65个非运动神经元候选的Type Landscape与覆盖矩阵；只验证后续筛选/导出没有把候选变为已确认interneuron
- 验收：候选、投射可能性、来源分母与缺失证据同时可见
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-027a"></a>
### UPG-027A · 分子分类与发育谱系

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Russ69与Sathyamurthy43来源档案、2–4条比较、URL状态与八项缺失证据；未来UI改动时做回归
- 验收：42个Sathyamurthy非运动记录保持local/projection未解；VC-2保留motor context；跨研究精确身份为0
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-027b"></a>
### UPG-027B · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：在既有来源记录上设计跨研究标签对照基准，按adult、dorsal-horn、developmental和SCI分层报告marker候选重叠
- 验收：允许一对多、冲突、unknown；候选对应不去重来源记录且不产生同一细胞/精确类型身份
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-032"></a>
### UPG-032 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：定位BICAN mouse spinal cord确切release和许可清单，按region、age、RNA/ATAC模态建source-local目录并与054合并采集
- 验收：论文—release映射可证明；consensus仅带不确定性的分类映射，不创建精确跨源身份
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-033"></a>
### UPG-033 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：对照已完成180的157 dIL来源类型与135的Xenium路线，记录早期发育需求尚缺的逐细胞/空间部分
- 验收：已完成157类不重复导入；E14.5/E16.5身份和2D空间不转成人身份或几何
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-040"></a>
### UPG-040 · 分子分类与发育谱系

- 原记录：`P1`；状态：partially completed — article-derived cluster browser; exact roster, denominators and region mappings remain open。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：保留14-cluster文章浏览器，把剩余cluster×age×region精确分母和barcode roster集中交给254
- 验收：P0/P14/P28/P56及研究总89494核不变成每类分母；不加入既有387记录集合
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-041"></a>
### UPG-041 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：对照117已接入I1–I8聚合契约，仅补未完成的source-local展示/权利或逐核缺口
- 验收：motor类别明确排除；Chat-Cre/Sun1-FACS偏倚可见；不重复新增8种或重做同一聚合解析
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-044"></a>
### UPG-044 · 分子分类与发育谱系

- 原记录：`P2`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：按时间、sample和RiboTag群体核对GSE277064，建立V2a post-stroke表达、输入示踪、功能干预三类证据卡
- 验收：stroke不当SCI；bulk/RiboTag不冒充单细胞；traced input不等于功能权重或单细胞因果
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-054"></a>
### UPG-054 · 分子分类与发育谱系

- 原记录：`P0`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：与032共用成人snMultiome来源盘点，先确认Gao paper—NeMO对象映射，再单独保留type与rostrocaudal字段
- 验收：类型与位置信息正交；不同样本/模态不凭共同marker制造同核配对
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-055"></a>
### UPG-055 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：设计group/subclass跨物种词汇对照，保留一对多、拒配及unknown，并列出细类型orthology尚缺的证据
- 验收：不转移primate坐标或成人功能；没有精确fine-type同源或mouse canonical身份
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-056"></a>
### UPG-056 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：为胚胎/P0 local-versus-projection程序增加年龄限定证据字段及示踪缺失状态
- 验收：marker程序与真实axon追踪分开；发育标签不推出成人身份/连接
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-060"></a>
### UPG-060 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：按机械痛、热、SNI和control拆解adult lumbar nocifensive ensemble的source定义与干预实验
- 验收：Gal/Tac1/Tacr1源定义保留；活动关联、必要性、充分性分别注明；无逐细胞因果或形态转移
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-066"></a>
### UPG-066 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：解析pDyn P7/P21/P80成对bulk核分选的animal/fraction映射，构建成熟过程聚合信息页
- 验收：11动物与22fraction不混合；lineage GFP与当前Pdyn expression分开；不发明subtype或prevalence
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-067"></a>
### UPG-067 · 分子分类与发育谱系

- 原记录：`P2`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留P0 V2a Type-I/local与Type-II/supraspinal发育语境；复用079已实现契约
- 验收：两鼠无独立复制约束保留；不转换为成人身份
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-072"></a>
### UPG-072 · 分子分类与发育谱系

- 原记录：`P1`；状态：rights-gated research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：优先核对Pvalb行为archive小manifest及动物/session/genotype/age/sex和许可，暂不取1.7GB全包
- 验收：glycinergic deep-dorsal subtype/function有原实验定位；行为文件不变成形态/突触数据
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-076"></a>
### UPG-076 · 分子分类与发育谱系

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Matson每群rank1–20精确workbook-cell来源与可展开搜索；只对相关变动做回归
- 验收：未提供score/p值仍缺失；不重新排名或把rank当效应大小
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`file_read_checked`；[data/matson-neuronal-sci-timecourse-0.1.json](../data/matson-neuronal-sci-timecourse-0.1.json)。

<a id="upg-077"></a>
### UPG-077 · 分子分类与发育谱系

- 原记录：`P1`；状态：anomaly-gated watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅在确需矩阵再分析时检查dense伪Matrix-Market格式、header/barcode hash与67903 prefix joins，记录F-12异常
- 验收：异常未解决或未有明确例外依据不得静默接入；不为已有rank面板重复大矩阵计算
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-079"></a>
### UPG-079 · 分子分类与发育谱系

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Hayashi P0 V2a已完成11组计数与收集/处理/QC各阶段信息，记录marker百分比冲突
- 验收：5600、约3000、949单位阶段各自准确；两鼠一库不作独立复制；无exact cross-source map
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-082"></a>
### UPG-082 · 分子分类与发育谱系

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Häring30来源档案和1545细胞表；后续界面年龄、筛选与导出改动做回归
- 验收：P17–P28与原3–4week文本同存；不自定adult/juvenile；28动物与cell-column值分开
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-084"></a>
### UPG-084 · 分子分类与发育谱系

- 原记录：`P1`；状态：object-audit watch。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：对照185已完成51细subtype与原Delile需求，补迁移BioStudiesrelease/embryo来源缺口而非再导入类型
- 验收：作者export与BioStudies来源关系明确；stage-replicate标签不当animal；发育细胞不转成人
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-086"></a>
### UPG-086 · 分子分类与发育谱系

- 原记录：`P0`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：在082之上补GSM/SRX/SRR来源关系和enrichment、RNAscope、Arc、tracing各证据层，不填缺失donor/cell连接
- 验收：1639postQC/94excluded/1545final、43initial/30final与四冲突保留；预测形态不作measured geometry
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-106"></a>
### UPG-106 · 分子分类与发育谱系

- 原记录：`P0`；状态：partially completed。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：实现已有来源记录的marker concordance工作台：锚定一条记录，比较精确marker字符串、transmitter、anatomy和life-stage冲突
- 验收：保留source namespaces、one-to-many、identity:not_established、零去重；旧161基线需重核现有来源范围不能直接当当前总数
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转 UPG-252 已准入对象详情或 UPG-053 可访问性中不依赖本项数据的具体差额；当前缺口及重启条件保留，不回到同一失败动作。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-117"></a>
### UPG-117 · 分子分类与发育谱系

- 原记录：`P0`；状态：partially completed — exact aggregate-profile phase; per-nucleus roster rights-gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：保留已准入I1–I8聚合契约，先解决精确逐核roster再分发权限，再决定是否扩展source-local逐核检索
- 验收：34231总核/5375IN核/8profiles、M/F/NA交叉表保留；region membership非xyz，enrichment非prevalence
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-132"></a>
### UPG-132 · 分子分类与发育谱系

- 原记录：`P0`；状态：planned — information-page context; redistribution rights-gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先复用027A的Russ框架，补GSE158380细胞/特征确切字段、source locator及六研究harmonization信息
- 验收：19353neuron总量与69source labels分开；许可未明不bundle矩阵；无cluster-to-morphology连接
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-133"></a>
### UPG-133 · 分子分类与发育谱系

- 原记录：`P1`；状态：planned — information-page context; redistribution rights-gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：复用027A的Sathyamurthy框架，补baseline/formalin/rotarod的条件分母与原始field定位
- 验收：17354核/4280神经元核/43clusters各自准确；Fos关联不当每细胞功能或轨迹；CC BY-NC-ND边界保留
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-141"></a>
### UPG-141 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch — file-level redistribution rights and barcode join gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核对GSE190442及独立GSE222322的人体donor/sample/barcode/source-label字段和文件许可，构建human-only信息卡
- 验收：55289postQC核/7donor/64cluster/35neuronal populations不混用；source key不足不造samecell或mouse映射
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-142"></a>
### UPG-142 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch — file-level rights and multimodal identity gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：分别核对PRJNA1267494下GSE300791与STAB-seq GSE300809对象，验证RNA/ATAC同核键与T4/L4/donor
- 验收：约150000核/6donor/37major/20neuronal定义保留；STAB计算整合非同细胞；all-rights-reserved文件不默认复制
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-146"></a>
### UPG-146 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch — file-level rights and stable-key joins gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：分开GSE243074 spatial与GSE243076 snRNA donor和barcode清单，先解决文件reuse再做human lumbar信息视图
- 验收：6spatial donor与9snRNA donor各自分母及年龄sex保留；相同标签/计算整合不作samecell
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-157"></a>
### UPG-157 · 分子分类与发育谱系

- 原记录：`P1`；状态：research watch — stable barcode join and file-level rights gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先找GSE312424同sample GEX barcode→clone barcode的唯一来源键，再为chick/human胚胎LARRY建信息卡
- 验收：66GSM=36GEX+30amplicon libraries；inj为barcode injection；7d culture与破坏性endpoint不作纵向同cell
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-164"></a>
### UPG-164 · 分子分类与发育谱系

- 原记录：`P0`；状态：metadata/link-only — RDS integrity, redistribution rights and paired-assay identity gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：对照204/211既有三RDS核标签记录，剩余只核查RNA/ATAC实际payload、同核配对和NHASH sample映射
- 验收：72NHASH行不是paired-cell key；无ATAC payload只显示RNA/metadata；不能重复声称未下载全部对象或重导相同roster
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`file_read_checked`；[data/cano-gomez-p56-multiome-interneuron-registry-0.1.json](../data/cano-gomez-p56-multiome-interneuron-registry-0.1.json)。

<a id="upg-171"></a>
### UPG-171 · 分子分类与发育谱系

- 原记录：`P2`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留并复用174的Dmrt3/dI6已完成summary；不重复创建第二套six-group记录
- 验收：三胚胎一tube；384/354/274分阶段；无per-well M1–M6映射、adult identity或geometry
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-174"></a>
### UPG-174 · 分子分类与发育谱系

- 原记录：`P2`；状态：partially completed — exact Dmrt3 group-summary contract; per-well roster unavailable。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：保留既有M1–M6确切group summary；仅在出现source-exported per-well map或可复现source-authoritative pipeline时扩roster
- 验收：M1…M6计数84/34/33/45/54/24与QC/HVG冲突保留；不得从loom猜分组或pseudotime
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-180"></a>
### UPG-180 · 分子分类与发育谱系

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留157 dIL类型与15900 differential rows；后续筛选/导出回归26Excel日期异常的隔离
- 验收：195146total/94048neuron/61444dIL/12family分层保留；37GSM非37动物；DE非普遍marker和samecell空间
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`file_read_checked`；[data/roome-dil-source-taxonomy-0.1.json](../data/roome-dil-source-taxonomy-0.1.json)。

<a id="upg-185"></a>
### UPG-185 · 分子分类与发育谱系

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Delile51细亚型、177cardinal-only和五stage分布；只在相关字段改动时做回归
- 验收：41025metadata/18144neuron/15394typednonmotor/15217fine分类分开；12stage-replicate非动物，dl原拼写保留
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`file_read_checked`；[data/delile-developmental-interneuron-taxonomy-0.1.json](../data/delile-developmental-interneuron-taxonomy-0.1.json)。

<a id="upg-187"></a>
### UPG-187 · 分子分类与发育谱系

- 原记录：`P1`；状态：planned — exact RDS type-assignment and file-rights gate。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：对照204已准入CHOL_IN和211的GLUT source-label，列出仍未解的projection/local身份和516报告标签映射差额
- 验收：169345核/57groups/516报告type概念分开；只按确切assignment与身份依据扩展，不全标interneuron
- 关联项：[UPG-190](#upg-190)。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`file_read_checked`；[data/cano-gomez-p56-multiome-interneuron-registry-0.1.json](../data/cano-gomez-p56-multiome-interneuron-registry-0.1.json)。

<a id="upg-190"></a>
### UPG-190 · 分子分类与发育谱系

- 原记录：`P0`；状态：planned — exact Cano source-object and table-reconciliation preflight。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：对照204/211现有receipts仅补未覆盖NHASH/TableS1 source冲突和文件reuse结论，避免重下3.6GB三RDS
- 验收：531行/518unique/13duplicate extras/2malformed保留；preflight自身不增加type或cell身份
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`file_read_checked`；[data/cano-gomez-p56-multiome-interneuron-registry-0.1.json](../data/cano-gomez-p56-multiome-interneuron-registry-0.1.json)。

<a id="upg-204"></a>
### UPG-204 · 分子分类与发育谱系

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留169345核来源键与11CHOL_IN/923核准入边界；后续任何分类扩展都对排除类别做回归
- 验收：GLUT meta.data neuron_types继续missing；GABA/motor/sensory/投射未解不静默算IN；同核RNAATAC未证则不宣称
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`file_read_checked`；[data/cano-gomez-p56-multiome-interneuron-registry-0.1.json](../data/cano-gomez-p56-multiome-interneuron-registry-0.1.json)。

<a id="upg-209"></a>
### UPG-209 · 分子分类与发育谱系

- 原记录：`P1`；状态：planned — exact neural RDS reachable; annotations/denominators pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：在comparative时段解析精确Xenopus neural RDS的源标签/8sample与condition；先核file rights和hash
- 验收：41631deposited/35852postQC/7337neural分别保留；8sample非8animal，非mouse homologues或samecell轨迹
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-210"></a>
### UPG-210 · 分子分类与发育谱系

- 原记录：`P1`；状态：planned — exact matrices reachable; final-group mapping pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核对GSE240239矩阵与Hurdle/ANOVA源行及final-group键，构建48hpf V0v条件比较
- 验收：10596library-scoped与2860analyzed、2source replicate区分；缺最终键只保group summary，mutant label不确定性可见
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-211"></a>
### UPG-211 · 分子分类与发育谱系

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留277 GLUT active.ident来源标签浏览器及92782slot名严格映射；只回归后续检索/计数改动
- 验收：active.ident绝不填补meta.data neuron_types；labels非confirmedIN且不增加geometry或samecell连接
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-229"></a>
### UPG-229 · 分子分类与发育谱系

- 原记录：`P1`；状态：partially completed — article-derived comparative taxonomy card implemented; exact barcode labels and animal denominator unresolved。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：保留Kelly10-label比较卡，核对大RDS是否有可小取的barcode-label表及fish denominator冲突
- 验收：11762postQC/33cluster/22assigned/10labels分开；150fish overall与约150cord每replicate冲突不消失；无mouse identity
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-254"></a>
### UPG-254 · 分子分类与发育谱系

- 原记录：`P1`；状态：partially completed — public code and all GEO sample titles audited; per-nucleus joins and file-level reuse rights remain unverified。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先用sample characteristics修正29GSM的五个title parser例外，再精确核对supplement barcode→matrix→age/cluster/region
- 验收：P0Het/Ko whole-cord与E13.5不得误读t/o/135；89494study nuclei非cluster count；filehash/rights齐后才导入roster
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106既有来源marker比较与信息页；涉及同一源时先保留已有aggregate/cardinal层而不推断缺失身份。
- 证据范围：`file_read_checked`；[data/trevisan-v1-geo-series-sample-audit-0.1.json](../data/trevisan-v1-geo-series-sample-audit-0.1.json)；[data/trevisan-v1-source-data-availability-audit-0.1.json](../data/trevisan-v1-source-data-availability-audit-0.1.json)。


## 空间与切片

<a id="upg-028"></a>
### UPG-028 · 来源空间与逐细胞定位

- 原记录：`P0`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：锁定SpinalTRAQ C1–C8模板版本和坐标定义，先建立独立颈髓参考入口，再测试留出物理地标误差
- 验收：独立空间可浏览；所有变换须有训练/留出隔离、单位、误差与适用区域；无证据不强并入Allen
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-029"></a>
### UPG-029 · 来源空间与逐细胞定位

- 原记录：`P0`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：把早期BIL范围需求并入163/244/255同一工作包，补齐specimen、level、panel、image和frame的逐字段缺口
- 验收：不重复下载；ascending projection单列；folder、section、animal与cell分母不混用
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-029a"></a>
### UPG-029A · 来源空间与逐细胞定位

- 原记录：`P0`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：复用BIL已有inventory，逐一核对adult whole-cord对象、sex/segment键及来源版本；将缺口交给244
- 验收：checksum/rights/section-key证据可定位；无curated cell-ID映射时类型保持source-only
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-031"></a>
### UPG-031 · 来源空间与逐细胞定位

- 原记录：`P0`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：审查SpinalJ processed sections可用对象并划分独立训练/留出地标，建立注册不确定性基准
- 验收：同一地标不得同时拟合和验收；基准变换不传播到分子标签、SWC或SCI实体
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-035"></a>
### UPG-035 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：建立GSE256397急性SCI Visium的animal、time和distance-from-lesion对象清单，再做逐section source-local视图
- 验收：spots、cells、types分开；动物与切片嵌套保留；没有同一细胞轨迹或临床恢复推断
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-036"></a>
### UPG-036 · 来源空间与逐细胞定位

- 原记录：`P2`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：锁定adult lumbar单张STARmap PLUS切片的坐标/探针面板/细胞注释对象，提供一张切片的2D入口
- 验收：范围明确为单切片及目标panel；不宣称全脊髓覆盖或推导3D胞体
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-039"></a>
### UPG-039 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：与039A共用两份adult C/T/L/S MERFISH H5AD的许可、哈希和坐标schema检查，避免重复适配
- 验收：只在source frame显示；未知asset rights阻断复制，不阻断已有独立功能工作
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-039a"></a>
### UPG-039A · 来源空间与逐细胞定位

- 原记录：`P0`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核定两份MERFISH H5AD确切对象和文件级许可，读取obs/obsm的样本及坐标键后决定单对象接入
- 验收：对象hash、样本分母、units/axes和可用标签全有receipt；没有atlas注册或跨模态同一细胞假设
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-042"></a>
### UPG-042 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核对GSE184370/GSE184369样本和Kathe SCI/EES实验条件，分别建snRNA与Visium来源记录
- 验收：多细胞spot不变成cell；实验因果结论限定于原injury/rehab/干预设计，不转移到任一类型或单细胞
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-065"></a>
### UPG-065 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：rights-gated research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核查adult dorsal-horn Xenium和snATAC文件权利与checksum，设计两个独立source-native入口
- 验收：两动物stimulus/sex confound醒目；cell polygon不是neurite，近邻不是synapse
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-073"></a>
### UPG-073 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：锁定E9.5–E13.5 source centroid/intensity表，按胚胎/阶段/section展示dI3/dI5/V0/V2a/V3的2D测量
- 验收：明确CC0及物理单位；不移植成人坐标，不把强度或点做胞体膜
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-083"></a>
### UPG-083 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：object-audit watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：按三个MIT archive成员及两分析pipeline盘点specimen/hemicord、stage、genotype、pixel scale和transcript-cell键
- 验收：仅source-local2D soma/transcripts；ALS不是SCI；marker loss非samecell轨迹
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-100"></a>
### UPG-100 · 来源空间与逐细胞定位

- 原记录：`P0`；状态：rights-gated planned。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：将BIL选择读取需求并入163/244/255，优先metadata和单run小文件；显示morphology.ome.tif为tissue image
- 验收：不重复全量fetch；无same-object键不连NeuroMorpho；轮廓不是完整神经元trace
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-114"></a>
### UPG-114 · 来源空间与逐细胞定位

- 原记录：`P0`；状态：partially completed — segment-pooled exact-coordinate phase。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：保留22 workbook双frame的31878行既有坐标，核查过滤/导出缺失，补source可提供的实验键
- 验收：14484raw与17394normalized两表示不相加为独立细胞；5LG差异与6TA非identity保留；缺失animal/lab/method不可猜填
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-115"></a>
### UPG-115 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：exact-object research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：检查divergent premotor/cervical long-descending propriospinal工作表的sample、muscle pair、division、label与2D面积
- 验收：source sampling与viral under-detection保留；没有z、完整axon、synapse map或成人电路转移
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-135"></a>
### UPG-135 · 来源空间与逐细胞定位

- 原记录：`P2`；状态：research watch — developmental scope, storage and rights gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：优先核对GSE291460 gene list和control coordinate CSV，整理8GSM、E16.5、segment及KO身份；禁止默认拉74.7GB TAR
- 验收：247+100探针panel明确；2D胚胎/KO坐标不填成人scaffold或3D内部；embryo与section键可追溯
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-144"></a>
### UPG-144 · 来源空间与逐细胞定位

- 原记录：`P0`；状态：planned — deferred exact-2D contract; source thickness/plane conflict locked。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：只整理Tac2四SectionDataSet/58SectionImage的source-local2D契约，保留25µm对20µm及variable对coronal冲突
- 验收：57expression true/1false不作cell count；z/normalized plane不可用、0REG；无叠层/跨年龄归一/内构
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-161"></a>
### UPG-161 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：research watch — exact-object inventory and noncommercial-use boundary gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核对Janelia7605824成员清单、trackingM十列语义、cell/experiment键与calcium时间轴，建立胚胎fish功能/lineage视图
- 验收：SWC-like tracking只为4Dlineage/centroid；不作axon/dendrite/膜；CC BY-NC范围与mouse区别明确
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-163"></a>
### UPG-163 · 来源空间与逐细胞定位

- 原记录：`P0`；状态：planned — metadata-only BIL adapter; curated-label object and licence clarification gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先追溯UPG-163既有34小对象receipts并对照较窄244 listing-only audit的时间/范围差异，再补BIL metadata键、curated标签和权利的真正缺口
- 验收：3387300XOA segmentation与paperQC分母分开；329 outlines非523完整section；缺curated cell-ID/type映射就保留source-only
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-170"></a>
### UPG-170 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：planned — source-movie-only population reference。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：接入11.36MB McCreedy Video_2.MP4的精确版本/attribution与source-movie播放入口
- 验收：adult Chx10/V2a C1–L1为population reference；无rawstack/calibration/segmentation不转单cell或定量3D
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转 UPG-252 已准入对象详情或 UPG-053 可访问性中不依赖本项数据的具体差额；当前缺口及重启条件保留，不回到同一失败动作。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-234"></a>
### UPG-234 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Leblond独立population context及8组summary，在相关dossier改动时回归nested分母
- 验收：18鼠/811section及region Ns null不变；不与Crozat记录或3D位置合并
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-244"></a>
### UPG-244 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：planned — linked 2D Xenium resource; exact object, annotation and rights audit open。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先与163旧receipts对账，再补BIL run/sample/section/annotation/rights差额；优先单run cells及简化polygon，不默认下载27.5GB图像
- 验收：cellID唯一性、source labels、units/axis、section键和license明确；polygon是display simplification、非完整膜；源类型未明留source-only
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`file_read_checked`；[data/bil-xenium-spinal-audit-0.1.json](../data/bil-xenium-spinal-audit-0.1.json)。

<a id="upg-255"></a>
### UPG-255 · 来源空间与逐细胞定位

- 原记录：`P1`；状态：planned — exact cell IDs, labels, section coordinates and dataset-specific reuse rights gate all viewer geometry。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：244通过后构建cells—cell boundary—nucleus boundary同source-cell-ID联动2D视图，分开simplified polygons与exact segmentation mask
- 验收：section、单位、轴向、selection/URL/export一致；缺标签不冒充IN；无3D挤出、organelle推断、SWC/atlasjoin
- 关联项：[UPG-244](#upg-244)。
- 转向：转UPG-106来源比较或UPG-170独立population reference；保持当前对象source-only/坐标缺失。
- 证据范围：`file_read_checked`；[data/bil-xenium-spinal-audit-0.1.json](../data/bil-xenium-spinal-audit-0.1.json)。


## 真实形态

<a id="upg-030"></a>
### UPG-030 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：in progress。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：先将父项的未结需求与088、227的现有精确记录选择能力逐项对账，只补真实缺口而不重取1097个SWC。
- 验收：冻结142成人子集与1097查询记录的关系可追溯；任何父项收口只覆盖已验证的查询重建范围。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-046"></a>
### UPG-046 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：planned。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：先审查现有SWC及原生轮廓入口，给尚未覆盖的入口补齐逐对象身份、坐标、完整度及权利字段检查。
- 验收：缺任一必要字段的对象不入形态层；组织影像、轮廓或密度场不被标为神经突重建。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-050"></a>
### UPG-050 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留142个固定SWC的Sholl、分支级序、末端及电缆表型，仅在相应源对象或算法变更时重算受影响记录。
- 验收：七个精确研究/标签/维度/域/完整度队列维持记录分母，Type-7描述统计不扩大到动物或完整细胞。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-087"></a>
### UPG-087 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留SCI人群证据节点和独立OBS精确形态视角；仅在场景或证据状态改动时复查其区分。
- 验收：SYN群体节点不具细胞形态外观，INF解剖及SCH通路不向OBS细胞转移身份或配准。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-088"></a>
### UPG-088 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：复用1097个已固定SWC及其延迟解析、完整分页和元数据，不重建原始副本或合并成人子集。
- 验收：1097查询记录、1058源标记3D、39源标记2D和半径权限分别保留；新选择前旧几何必须清空。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-098"></a>
### UPG-098 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留142条精确坐标矩阵和2至4对象比较器，在比较状态、载入器或导出修改时检查其现有功能。
- 验收：每个选定几何哈希正确，No Diameter不生成半径表面，比较维持独立适配与co_display_only。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-105"></a>
### UPG-105 · 跨物种及跨脑区比较

- 原记录：`P2`；状态：cross-species rights-gated watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：沿240与250已有精确归档路线继续Svara比较形态准入，避免再次做泛检索。
- 验收：对象身份、源坐标、阶段及文件许可通过后才显示鱼类几何；无小鼠迁移。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-119"></a>
### UPG-119 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO109021独立GRP形态路由和精确SWC，在路由/接入器变更时回归。
- 验收：2790节点保持源半径及中等完整度；300µm切片与soma点警告不丢失，无Vsx2或内构身份转移。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-126"></a>
### UPG-126 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：completed — exact route-pack contract, runtime integration, SSR and negative-claim validation。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留GRPR249676、Tac1/SP108974、PV/Pax2 170035和Pdyn104003的四个独立源路由。
- 验收：逐对象域、slice、完整度及半径权利不混合；任何路由不代表平均细胞或Vsx2类型。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-127"></a>
### UPG-127 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：planned — exact public SWC receipt verified。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：先复验已记录的NMO183779精确SWC收据，再接入独立的5dpf鱼V3 tonic轴突比较路由。
- 验收：3849个type2节点只作axon-only centreline，明确无soma、无dendrite及No Diameter；不能成V2或小鼠。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-130"></a>
### UPG-130 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO45674的精确Renshaw外形路径及其独立native DAT来源，在相关适配器变化时复查。
- 验收：年轻GlyT2-EGFP来源和50µm/400µm不同制备阶段不合并，半径表面不是膜，缺失器官保持缺失。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-131"></a>
### UPG-131 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO50424的NPY外形与原始来源冲突说明，不因显示整合而规范化冲突值。
- 验收：Swiss-Webster与论文品系差异、27至15g倒置重量和300µm制备保留；不补电生理或平均NPY身份。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-137"></a>
### UPG-137 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO50394和50408的两个独立外形路由、原始半径和未解决样本信息。
- 验收：nNOS、galanin及PrP-promoter标签不相互推导；论文无精确NMO跨表时不接入生理、接触或突触。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-138"></a>
### UPG-138 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：planned — exact-object checksums and independent-route contract pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先核实NMO170034和118824是否已含在1097语料，再补缺失的对象级PV来源路由而不重复接入SWC。
- 验收：170034保持No Diameter中心线；118824仅按其授权半径显示，两研究不作为同细胞配对或完整轴突。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-139"></a>
### UPG-139 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：research watch — LTMR-RZ repository/paper denominator and object-manifest discrepancy gate。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅在Abraira提供稳定文件/figure/动物跨表时重开650仓库记录与305/351论文分母的对应。
- 验收：保留650独立NMO和源类别208/442，不以元数据相近推测论文成员或动物独立性。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-140"></a>
### UPG-140 · 小鼠精确形态与种类覆盖

- 原记录：`P2`；状态：planned — exact 2D source-plane receipts pending。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：先对账151/227已覆盖的NMO194468、194469平面查看，仅补控制/训练来源信息和独立路由实际缺口。
- 验收：两对象仍锁定XY平面，不外推Z；不冒充论文n12/n14群组或因果运动效应。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-143"></a>
### UPG-143 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO45718外形及其现有192显示对应和post-seal主场景开关，相关场景修改时检查精确记录选择。
- 验收：5636节点源形态不转为完整细胞；calbindin阴性等保持仓库标签，新增DAT叠加仍零膜/内构/配准。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`file_read_checked`；[docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md](../docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md)；[docs/RESEARCH_TIMELINE_2026-09-24_POST_2_90_NMO45718_MAIN_SCENE_DAT_OVERLAY.md](../docs/RESEARCH_TIMELINE_2026-09-24_POST_2_90_NMO45718_MAIN_SCENE_DAT_OVERLAY.md)。

<a id="upg-145"></a>
### UPG-145 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：planned — exact source-object audit complete; route build pending。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：复验已有NMO34024四类来源收据后构建独立rat比较路由，并保留L420命名和soma转换差异。
- 验收：17973节点保持独立坐标；23轮廓/12soma点差异、reported_z及不完整生物轴突限制明确，鼠主集合不变。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-149"></a>
### UPG-149 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：复用142加7补充对象比较适配器及其两个delta文件，只在源路由/比较/导出变化时回归。
- 验收：149只作为142+7集合展示；无SWC/几何副本、自动代表记录或跨源共同坐标。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-155"></a>
### UPG-155 · 跨物种及跨脑区比较

- 原记录：`P0`；状态：research watch — object retrieval, denominator and redistribution gated。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅在ZExplorer单对象端点、67/77区域差异或复用规则有新证据时再核验该比较路线。
- 验收：5385、1601和147分别按仓库范围计数；全零末端字段不作生物结果，无批量再分发或鼠身份映射。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-158"></a>
### UPG-158 · 分型背景与实验观察

- 原记录：`P2`；状态：research watch — public geometry object and reuse licence absent。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：MADM缺少公开稳定几何时仅补断言级实验背景；新对象发布才重开坐标及clone接入。
- 验收：145clone/约50动物与23clone形态子集分开，100µm邻域和追踪中止限制保留，零完整细胞/克隆宣称。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到253/254来源信息整理或251/252已 admitted记录详情，不补推断身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-175"></a>
### UPG-175 · 分型背景与实验观察

- 原记录：`P2`；状态：planned — PKD2L1 experiment-family observation adapters。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：在172已完成profile上按passive/RMP、ionic-current、receptor及pH逐实验族补齐观察解析器。
- 验收：每行保留file/sheet/row与family+region+label键；配对基数和N/n受验证，跨family及168身份join为零。
- 关联项：[UPG-172](#upg-172)。
- 转向：转到253/254来源信息整理或251/252已 admitted记录详情，不补推断身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-182"></a>
### UPG-182 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：planned — rights/link-only and SWC semantic audit gated。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：等待ZExplorer可独立访问且可复用的逐对象SWC后，才为有限精确roster建立比较适配器。
- 验收：每对象有hash/frame/QC；type7保持unknown neurite，源E/I不成为已验证局部interneuron身份。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-186"></a>
### UPG-186 · 原生轮廓与逐对象坐标对应

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO45718独立native DAT的8loop/275vertex，并将192的七loop显示对应视为另一个受限功能。
- 验收：独立native视图维持source坐标；legacy Cell Body只在原视图保留，不进入七平面叠加或表面。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`file_read_checked`；[docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md](../docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md)；[data/neurolucida-native-contour-admission-catalog-0.4.json](../data/neurolucida-native-contour-admission-catalog-0.4.json)。

<a id="upg-193"></a>
### UPG-193 · 原生轮廓与逐对象坐标对应

- 原记录：`P1`；状态：planned — per-file native-DAT admission gated。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：以现有七记录72loop目录为基线，只审查尚未覆盖的精确DAT并按逐文件语义扩展。
- 验收：文件全顶层inventory、hash、parser及独立比对俱全，异常文件独立关闭；不普遍化45718例外或自动生成表面。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`file_read_checked`；[data/neurolucida-native-contour-admission-catalog-0.4.json](../data/neurolucida-native-contour-admission-catalog-0.4.json)。

<a id="upg-194"></a>
### UPG-194 · 原生轮廓与逐对象坐标对应

- 原记录：`P2`；状态：completed — NMO 50394 only; other contour series remain unmeshed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO50394唯一DER开放壳及14条OBS轮廓；只有算法、源轮廓或QA变动时重新核验。
- 验收：1792vertex/3328triangle、两端开放零caps；50394软件屏通过不放行50424/50408或转为生物膜。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-197"></a>
### UPG-197 · 原生轮廓与逐对象坐标对应

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO45674七条source-closed CellBody轮廓与source-open第八条的held状态。
- 验收：200个admitted vertex及重复Z平面保持原序；不将未闭合27vertex轮廓、壳或内构自动补齐。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-198"></a>
### UPG-198 · 原生轮廓与逐对象坐标对应

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：将五DAT历史审核保留为原时点记录，当前展示汇总使用后续203/207/208扩展目录。
- 验收：历史2admitted/3held不覆写为当前状态；原始逐文件语义及排除原因仍可追溯。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`file_read_checked`；[data/neurolucida-native-contour-admission-catalog-0.4.json](../data/neurolucida-native-contour-admission-catalog-0.4.json)。

<a id="upg-203"></a>
### UPG-203 · 原生轮廓与逐对象坐标对应

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Todd精确empty-value CellBody规则及三文件33loop的准入，现有sourceClosedFlag=false不改写。
- 验收：排除12个User Line/470vertex；规则不推广到其他命名或文件，无自动surface/volume。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-205"></a>
### UPG-205 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留SWC逐节点/segment检查、根路径、下游arbor、camera focus及源授权直径曲线。
- 验收：几何变化清空选择，nodeID与source坐标一致；2D深度和No Diameter限制不被交互绕过。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-207"></a>
### UPG-207 · 原生轮廓与逐对象坐标对应

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO108978精确DAT的12loop/2614vertex，相关native适配器改变时核验。
- 验收：重复平面、原始顺序、source-open和frame保留；无自动表面、膜、器官或类型代表。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`file_read_checked`；[data/neurolucida-native-contour-admission-catalog-0.4.json](../data/neurolucida-native-contour-admission-catalog-0.4.json)。

<a id="upg-208"></a>
### UPG-208 · 原生轮廓与逐对象坐标对应

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO249676精确DAT的12loop/156vertex并与No Diameter SWC权限并列显示。
- 验收：native轮廓不授予SWC半径或膜权利；无坐标配准及内部结构推断。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`file_read_checked`；[data/neurolucida-native-contour-admission-catalog-0.4.json](../data/neurolucida-native-contour-admission-catalog-0.4.json)。

<a id="upg-220"></a>
### UPG-220 · 原生轮廓与逐对象坐标对应

- 原记录：`P1`；状态：partially completed — checksum-pinned topology measured; surface admission held。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先完成两个Todd对象独立相邻对应和校准证据审查，当前保留原始loop及失败位置展示。
- 验收：50424两大跳变、50408两自交及零长边不修复；没有独立容差即零shell/triangle。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`file_read_checked`；[data/todd-native-contour-topology-audit-0.1.json](../data/todd-native-contour-topology-audit-0.1.json)。

<a id="upg-226"></a>
### UPG-226 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO108978源局部主场景与独立DAT视图，不因已属成人查询子集补写未报告年龄。
- 验收：1817节点及12loop保持分框，SP/excitatory为源标签，Dendrites Complete不说明已重建轴突。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-227"></a>
### UPG-227 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留142成人查询对象加7补充对象的精确主场景选择能力，与088完整集合并列而不重新做目录。
- 验收：140三维/2平面，125excitatory/15inhibitory/2未报为源记录；不暗示动物独立性或同细胞内部。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-228"></a>
### UPG-228 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：partially completed — exact-query metadata delta audited; per-object geometry bytes and rights pending; keep 8.6.125 out of the active corpus。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：只有确有升级8.6.125必要时重新取得精确142行响应及逐对象文件权利/哈希，避免纯版本号追逐。
- 验收：元数据相同不证明几何相同；未封存response和未复核几何明确，8.6.124活动语料不被静默替换。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-231"></a>
### UPG-231 · 原生轮廓与逐对象坐标对应

- 原记录：`P1`；状态：planned — independent adjacent-contour screen calibration。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：先定义独立多对象轮廓校准比较集和敏感性报告，再核验1.5µm/1.6/1.5µm探索屏是否可推广。
- 验收：预先锁定spacing/校准/顺序证据与失败报告；不为让50394或held对象通过而优化阈值。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`file_read_checked`；[data/todd-native-contour-topology-audit-0.1.json](../data/todd-native-contour-topology-audit-0.1.json)。

<a id="upg-233"></a>
### UPG-233 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留1097活动index的raw strain/reporter facet及650 Abraira范围说明。
- 验收：运行时计数来自验证index，12原strain不规范化为亚型，650对305/351分母缺口继续可见。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-235"></a>
### UPG-235 · 小鼠同细胞三维内构

- 原记录：`P1`；状态：planned — public raw-image deposit audit。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅当Leblond公布稳定raw confocal deposit或新精确入口时复查文件和样本链。
- 验收：不得默认联系作者；section/channel/voxel/segmentation/rights缺失时无单细胞身份或三维重建。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到244/255小鼠同cell二维cell/nucleus试点或251/252已存在对象整合，真实3D目标继续保持未完成。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-236"></a>
### UPG-236 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留27个raw cell_type标签及2735重叠membership的精确筛选。
- 验收：1095多标签记录不被相加为类型/细胞总数；不会自动选首记录作为分子profile代表。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-237"></a>
### UPG-237 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留12DOI与1097精确ID及raw label交叉表，citation/schema变化时检查。
- 验收：2735重叠标签memberships与1097DOI记录分开；citation不生成figure/sample或动物映射。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-240"></a>
### UPG-240 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：partially completed — source registered and three direct official archive routes exposed; package-member and per-file rights audit remains open。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：沿已经找到的mmc6至mmc8官方归档开展小范围目录及逐包权利核验，实物检查统一由250承接。
- 验收：39CiD等文章统计不替代roster；不把形态CiD叫遗传V2a，不进口未核验几何。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-241"></a>
### UPG-241 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留分子profile到形态literal-search的交接，在路由、URL或选中状态变化时回归。
- 验收：profile上下文不变、旧几何清空且须手选精确NMO；不存在首项fallback或类型映射。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-245"></a>
### UPG-245 · 小鼠精确形态与种类覆盖

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留8.6.126的30条Todd补充路线及来源半径权限，作为独立delta复用。
- 验收：24,209节点/24,179segment、10有radius/20无radius；1097冻结分母不变且无新type或paper join。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-246"></a>
### UPG-246 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留10taxonomy DOI与1097形态的零精确DOI重叠说明及literal-search入口。
- 验收：0/10与0/1097只是该快照citation覆盖，不能推论所有来源无相关形态或已建立身份关联。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-250"></a>
### UPG-250 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：planned — source-object and per-file reuse gate。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：在240公开包入口和复用条件确认后逐个检查mmc6至mmc8成员、ID、坐标、节段及完整度。
- 验收：每个 admitted鱼对象都有精确hash/rights与sourcekey；不把Koh摘要XLSX当外部工作簿或做鼠迁移。
- 关联项：[UPG-240](#upg-240)。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-256"></a>
### UPG-256 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：research watch — version-pinned candidate query, exact morphology and record-level rights gate pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先定义需要新增的mouse spinal标签/域覆盖缺口，再执行固定分页查询并与1097及30delta做ID去重。
- 验收：完整query/release/date/页数及exact-ID roster先封存；广义inhibitory/neuron标签不直接进入interneuron计数。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。


## 连接与投射

<a id="upg-034"></a>
### UPG-034 · 连通与功能断言

- 原记录：`P1`；状态：research watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅在GSE247602可提供稳定投射身份和样本字段时补充下降投射背景断言。
- 验收：4357个样本保持投射研究分母；本地interneuron集合和三维细胞数均不增加。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先完成047已有断言的边类型与方法展示，再转到小鼠形态选择/信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-045"></a>
### UPG-045 · 连通与功能断言

- 原记录：`P2`；状态：research watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：按GSE198949与GSE240528的实际细胞注释补充投射细胞排除及再生背景。
- 验收：长程投射身份与局部interneuron身份分开，研究样本不改写为已建模细胞。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先完成047已有断言的边类型与方法展示，再转到小鼠形态选择/信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-047"></a>
### UPG-047 · 连通与功能断言

- 原记录：`P0`；状态：planned。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：为已收录连通断言建立直接单突触、功能影响、投射重叠及计算预测的独立边类型和筛选展示。
- 验收：同一图例、详情及导出保留方法和直接性；邻近或配体受体预测不能使用观察突触样式。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先完成047已有断言的边类型与方法展示，再转到小鼠形态选择/信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-057"></a>
### UPG-057 · 连通与功能断言

- 原记录：`P1`；状态：research watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：有公开断言来源时整理Worthy V1的clade、年龄、节段、方法、靶标及直接性字段，排除请求获取的原始对象。
- 验收：每条V1连接都可回到明确实验及目标；请求获取的confocal或Neurolucida对象不进入本地几何。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先完成047已有断言的边类型与方法展示，再转到小鼠形态选择/信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-058"></a>
### UPG-058 · 连通与功能断言

- 原记录：`P2`；状态：research watch — observed-object rights and model separation gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：分别核对ERDA单个Imaris体积的文件权利和固定SpinalProjectome提交的计算规则，先完成可复用的小型模型说明。
- 验收：55,183,015,853字节聚合体积不默认下载；AAV聚合信号与模型概率分别展示且都不是观察单细胞突触。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先完成047已有断言的边类型与方法展示，再转到小鼠形态选择/信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-059"></a>
### UPG-059 · 连通与功能断言

- 原记录：`P2`；状态：permission-gated watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅在BSDC精确对象复用条件发生变化时重开Ding投射背景接入，当前维持来源链接和身份排除。
- 验收：785投射细胞及1464relay记录各自保留；无许可不转换或重打包CC BY-NC-ND SWC/JSON。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先完成047已有断言的边类型与方法展示，再转到小鼠形态选择/信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-061"></a>
### UPG-061 · 连通与功能断言

- 原记录：`P1`；状态：research watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：将V0g的分子、升降投射、输入输出及功能结果整理为独立来源断言，等待逐对象键再考虑连接。
- 验收：测序细胞核与追踪神经元没有虚构配对，punctum图不升级为完整连接组。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先完成047已有断言的边类型与方法展示，再转到小鼠形态选择/信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-081"></a>
### UPG-081 · 跨物种及跨脑区比较

- 原记录：`P2`；状态：rights-gated comparative watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：把Svara的FreiDok许可/包目录差异和精确哈希问题统一到250的归档检查，避免平行重复下载。
- 验收：一只6dpf鱼、139运动神经元、39CiD和34CoBL分母分开；只有匹配包成员才可成为比较对象。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-085"></a>
### UPG-085 · 连通与功能断言

- 原记录：`P1`；状态：assertion-only watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：按Abraira的11个遗传亚类逐断言记录形态、放电、层位、标记接触、直接生理和多突触影响的出处。
- 验收：每一方法保留自己的N/n；标记贴近不默认成突触，未发表观察及无稳定对象的三维几何排除。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先完成047已有断言的边类型与方法展示，再转到小鼠形态选择/信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-123"></a>
### UPG-123 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：raw-data-blocked and rights-gated。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：只在官方或作者控制镜像重新提供SC_zf_0113.nml.zip时复核精确tree身份及哈希。
- 验收：骨架和突触注释必须落入对应raw边界；404和空annotation不会被论文图或小鼠Vsx2替代。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-147"></a>
### UPG-147 · 连通与功能断言

- 原记录：`P2`；状态：research watch — metadata/link-only pending an explicit code licence。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅在ModelDB267056明确代码许可出现时评估可复用方法展示，当前保留固定版本链接说明。
- 验收：16种退化权重解作为独立SYN/SCH结果；无观察神经元、突触、同细胞生理或唯一真实连接宣称。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先完成047已有断言的边类型与方法展示，再转到小鼠形态选择/信息页。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-224"></a>
### UPG-224 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：planned — comparative connectomic census source audit。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：对Zenodo7641780与MICrONS795建立独立皮层连接分类对象审查，先从最小精确roster和typecall入手。
- 验收：1352神经元/163interneuron/4连接亚类保留皮层分母；不能混入v185.4例或推出分子类型。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-257"></a>
### UPG-257 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Koh31-sheet及7pagePDF核验结论，只有精确新raw/list对象时转260/250。
- 验收：figure汇总没有稳定ID/XYZ不能当对象表；CC BY-NC-ND补充文件维持link-only。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-259"></a>
### UPG-259 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Zenodo v1.0两script包审核收据和缺失外部输入清单，不重复运行缺数据的代码。
- 验收：9289字节脚本许可不扩到未附工作簿/annotation.xml；不生成source对象或几何。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-260"></a>
### UPG-260 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：partially completed — direct Koh repository/deposit routes expose no exact workbook or Knossos archive; the paper-linked Svara source has three public supplement ZIP candidates whose package contents, segmentation-version match and file-level rights remain unaudited under UPG-250。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：停止重复Koh main/v1.0及已核验deposit，后续仅将Svara三官方ZIP候选交250检查精确缺失输入。
- 验收：必须找到8个circuit sheet或Completed_labeling/annotation.xml并独立验证权利和版本；无作者联系或凭据。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。


## SCI及疾病状态

<a id="upg-062"></a>
### UPG-062 · 损伤、恢复与疾病状态

- 原记录：`P2`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先解决chronic-pain来源manifest和license冲突，再分别接入snRNA、Visium、Xenium和electrophys证据
- 验收：SNI不等SCI；spots不等cells；targeted panel不等全转录组；同标签不产生跨模态同cell联结
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-063"></a>
### UPG-063 · 损伤、恢复与疾病状态

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核定T9 crush uninjured至38d各library、sex pooling和六个mixed-neuron群，建时间状态信息表
- 验收：组群混合和pooled sex明确；时间点独立取样不连成同cell轨迹；无coordinates/恢复因果边
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-064"></a>
### UPG-064 · 损伤、恢复与疾病状态

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Matson已完成SCI时间程、85组×条件与255组×样本观察及六项冲突；后续信息页改动做源分母回归
- 验收：15 cord、5condition、23651 neuronal nuclei、17标签分开；无prevalence、geometry或同cell连接
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`file_read_checked`；[data/matson-neuronal-sci-timecourse-0.1.json](../data/matson-neuronal-sci-timecourse-0.1.json)。

<a id="upg-068"></a>
### UPG-068 · 损伤、恢复与疾病状态

- 原记录：`P2`；状态：contextual watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：只在核心神经元任务暂不可用时补PLX5622/ODC-SCI非神经元微环境与实验outcome表
- 验收：来源无神经元事实可见；ligand–receptor预测不显示为synapse或直接细胞接触
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-069"></a>
### UPG-069 · 损伤、恢复与疾病状态

- 原记录：`P2`；状态：contextual watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：保留acute-lesion correction并按16鼠/10library整理非神经元环境，明确neuronal-state unavailable
- 验收：不贡献interneuron状态/形态/连接；库不是动物；更正后的事实有来源定位
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-070"></a>
### UPG-070 · 损伤、恢复与疾病状态

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：按young与20–22月、naive/14/28dpi组织免疫GEX/TCR配对和anti-CD8独立干预记录
- 验收：同库GEX/TCR键可验证；免疫通讯不等神经连接；抗体因果范围限定原实验
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-071"></a>
### UPG-071 · 损伤、恢复与疾病状态

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核对19动物SNI/superficial-injury来源与污染样本排除，构建独立peripheral-injury分层表
- 验收：排除记录及分母可复算；不改称SCI，不从样本比例推总体患病率
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-074"></a>
### UPG-074 · 损伤、恢复与疾病状态

- 原记录：`P2`；状态：contextual watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：整理T9 contusion两组12鼠pool的GEX/TCR环境信息，独立保存pool和library键
- 验收：统计单位为pool；TCR相似和LR预测不当神经连接或动物级复制
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-075"></a>
### UPG-075 · 损伤、恢复与疾病状态

- 原记录：`P2`；状态：contextual watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：提供atorvastatin/vehicle/对照SCI bulk组织研究的7/7/2样本语境
- 验收：bulk表达不归因某interneuron亚型；不增加细胞/类型分母
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-078"></a>
### UPG-078 · 损伤、恢复与疾病状态

- 原记录：`P1`；状态：rights-gated contextual watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：分别清点35 snRNA library与16 Visium sample，按hemisection侧别、rostral/caudal及3/7/28dpi建来源卡
- 验收：保留3mm lesion-remote及glia研究范围；spot非cell，预测交互非synapse，无interneuron几何填补
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-116"></a>
### UPG-116 · 损伤、恢复与疾病状态

- 原记录：`P1`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：将96 GEO sample/library按cord/DRG、early/chronic、mRNA/ribosome、GAD2/TAC1分层展示
- 验收：96库不是96独立动物；SNI/CFA不等SCI；TRAP群体不当单细胞
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-148"></a>
### UPG-148 · 损伤、恢复与疾病状态

- 原记录：`P2`；状态：research watch — cross-species scope and file-level rights gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：分开rhesus intact与T9 complete injury来源，按sample、region、7/14/30d及6mo核对源标签
- 验收：199870profiles与28neuronal subclusters不变成mouse类型或跨时间同cell；雌性4–7岁范围保留
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-156"></a>
### UPG-156 · 损伤、恢复与疾病状态

- 原记录：`P1`；状态：research watch — pooled-library and file-level rights gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核查adult zebrafish transection GSE235395的8GSM、0/1/3/6wpi与50fish每pool，构建再生比较lane
- 验收：2pooled libraries/timepoint与58973核/30neuronal labels区分；CellChat预测非synapse；不作同cell恢复轨迹
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-162"></a>
### UPG-162 · 损伤、恢复与疾病状态

- 原记录：`P1`；状态：research watch — lesion-state keys and before/after semantics gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核对Janelia7607411同fish细胞与laser lesion前后对应、时间位置及trace元数据，再提供ablation状态页
- 验收：within-fish pairing可证；跨fish非samecell；calcium共活动不连synapse/因果边，laser非mammalian traumaticSCI
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：改进已有UPG-064时间程的条件筛选、分母与冲突展示；不把SCI替换为SNI或非神经元数据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。


## 电生理

<a id="upg-043"></a>
### UPG-043 · 电生理与功能证据

- 原记录：`P2`；状态：research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：为四个adult spinal DANDI来源建立immutable版本和NWB哈希去重清单，选择有清晰实验身份的单trace试点
- 验收：去重以对象hash而非文件名；采样率/时间/电压或电流单位可审查；trace不自动连接类型或SWC
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-173聚合生理信息或已有UPG-172来源记录展示；网络/trace读取失败不退化为合成波形。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-080"></a>
### UPG-080 · 电生理与功能证据

- 原记录：`P2`；状态：comparative watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核对Dryad v3两文件manifest与4–6dpf fish/pair分母，再只解析一个ABF示范paired recording
- 验收：突触输入/无连接结果限定测试pair、条件和检测能力；不转成人mouse connectome
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-173聚合生理信息或已有UPG-172来源记录展示；网络/trace读取失败不退化为合成波形。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-154"></a>
### UPG-154 · 电生理与功能证据

- 原记录：`P2`；状态：planned — immutable trace-only information lane。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：以immutable DANDI001469版本的355191072B代表NWB做range-read trace入口，避免148.8GB总包
- 验收：subject/session/electrode/ElectricalSeries、time/units与缺失segment可追溯；extracellular channel不当identifiedIN或isolated unit
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转UPG-173聚合生理信息或已有UPG-172来源记录展示；网络/trace读取失败不退化为合成波形。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-172"></a>
### UPG-172 · 电生理与功能证据

- 原记录：`P2`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留PKD2L1 functional profile及92文件来源和四冲突；显示N动物/n观察及nested experiment差别
- 验收：无globally stable cell key不拼整deposit；0rawtrace/geometry；不连接独立SBF-SEM对象或把firingpattern当新types
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持已完成增量，不重复研究；转同工作流未完成项；只有新的变更/失效证据才触发相关回归。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-173"></a>
### UPG-173 · 电生理与功能证据

- 原记录：`P2`；状态：planned — aggregate physiology taxonomy only。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：读取已指明Data Sheet1的小对象，构建adult lumbar Shox2/Chx10聚合生理表和source-derived distributions
- 验收：8–25week L2–L5、143Shox2/28Chx10细胞及4kmeans/6hierarchical组保留；无rawABF/roster不作trace或molecular type
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转 UPG-252 已准入对象详情或 UPG-053 可访问性中不依赖本项数据的具体差额；当前缺口及重启条件保留，不回到同一失败动作。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。


## 内部结构与显微细节

<a id="upg-089"></a>
### UPG-089 · 小鼠同细胞三维内构

- 原记录：`P1`；状态：rights-and-object-gated watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：对首个可用小鼠候选公开影像体积建立精确文件、校准、样本和分割派生链后才接入局部体积查看。
- 验收：体积有版本、许可、轴、voxel及原始到mask哈希；分割soma或组织信号不自动获得细胞类型/神经突身份。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到244/255小鼠同cell二维cell/nucleus试点或251/252已存在对象整合，真实3D目标继续保持未完成。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-092"></a>
### UPG-092 · 逐对象信息页与证据渲染

- 原记录：`P1`；状态：in progress。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：对照124的现行零程序内构政策清理高细节入口状态，只补未覆盖的SWC、半径派生表面及Unavailable交互。
- 验收：已移除的程序切面不恢复；该SWC通路的半径派生表面仅来自源授权半径，轮廓派生表面依各自已准入合同；同细胞内部层仍由真实对象独立放行。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到230已存对象加载与界面性能改进，保留每对象缺失状态。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-093"></a>
### UPG-093 · 二维显微、突触与受体定位

- 原记录：`P1`；状态：source-object research watch。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：复用099和112的已固定Super-CLEM序列，审查是否存在缺失的独立突触入口或腹侧来源对象。
- 验收：背侧/腹侧图像、切片和小鼠分母分开；突触级影像不附着到未证实的兴奋细胞或父神经元。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-094"></a>
### UPG-094 · 跨物种及跨脑区比较

- 原记录：`P2`；状态：partially completed — vocabulary-only phase。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：复用111与166已实现的MICrONS表面及裁切，另行审查OpenOrganelle是否有精确对象而非重做词汇层。
- 验收：每种新比较几何都固定物化版本、对象ID、字节/哈希和分割时间；皮层密度不迁入脊髓细胞。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-095"></a>
### UPG-095 · 二维显微、突触与受体定位

- 原记录：`P2`；状态：source-object research watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅在S-BSST609公开文件权利或小型匹配子集发生变化时重开组织上下文计划，并与101共用一个检查记录。
- 验收：年龄、基因型、channel及voxel字段完整才接入；A纤维/微胶质/标记视野不作为interneuron内构。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-096"></a>
### UPG-096 · 分型背景与实验观察

- 原记录：`P2`；状态：cross-region methods watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅在设计同细胞模态表时参考BICCN MOp的稳定ID、链接表及分模态QC字段。
- 验收：方法基准与实际脊髓对象分开，皮层细胞和坐标不填补脊髓身份或验证空缺。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到253/254来源信息整理或251/252已 admitted记录详情，不补推断身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-099"></a>
### UPG-099 · 二维显微、突触与受体定位

- 原记录：`P0`；状态：partially completed — 11-image sequence browser complete; reconstruction pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：在现有11张Dorsal2 synapse-1序列上设计逐片轮廓、配准与不确定度派生记录，缺独立审核则保持二维浏览。
- 验收：20140至20150源顺序及PNG像素一致性保留；70nm厚度不自动成为标定Z或重建证据。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-101"></a>
### UPG-101 · 二维显微、突触与受体定位

- 原记录：`P2`；状态：rights-gated link-only。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：维持S-BSST609链接状态，仅在精确许可或合法小型子集可用时核验对应文件。
- 验收：不自动下载约59.76GiB包，任何子集仍只展示组织/标记背景而非同细胞内部。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-103"></a>
### UPG-103 · 逐对象信息页与证据渲染

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留142条重建的13轴覆盖矩阵，相关证据或组件变化时检查每个对象的缺失理由。
- 验收：来源拓扑、半径和派生表面分开；未知膜、核、细胞器及伙伴不生成图元。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到230已存对象加载与界面性能改进，保留每对象缺失状态。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-104"></a>
### UPG-104 · 小鼠同细胞三维内构

- 原记录：`P1`；状态：continuing research watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅由新公开版本、精确候选对象或许可变化触发一次有界的完整同细胞链检查。
- 验收：必须实际满足小鼠脊髓同细胞形态、身份、位置、突触及内部结构链；无匹配只是本次范围内阴性结果。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到244/255小鼠同cell二维cell/nucleus试点或251/252已存在对象整合，真实3D目标继续保持未完成。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-111"></a>
### UPG-111 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：partially completed — phase A admitted, phase B blocked。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：保留MICrONS现有cell与nucleus网格；后续仅审查该root真实新增内部对象的版本、父细胞和空间一致性。
- 验收：97片现有表面不焊接/修复；没有同root内部对象则PhaseB仍零对象，223的失败网格不重试。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-112"></a>
### UPG-112 · 二维显微、突触与受体定位

- 原记录：`P1`；状态：partially completed — source sequence admitted; contour/alignment phase pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：在099既有11张序列基础上完成明确配准模型、人工轮廓与独立审核标准，证据不足就停在序列浏览。
- 验收：派生轮廓、变换、不确定度和审核记录齐全才考虑有界突触重建；仍不能补足父神经元身份。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-120"></a>
### UPG-120 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：exact-object pilot planned — rights and identity gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先查公开物化574是否有真正脊髓EI注释lore候选，并固定root、表键、三平面叠加及VAST版本对应后再选对象。
- 验收：unknown的173502不作为候选；soma/nucleus/synapse的稳定键、校准及对象权利同时成立。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-121"></a>
### UPG-121 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：blocked pending UPG-120 and reviewed segmentation。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：仅对120已核验的同一Fish1细胞规划局部原始EM和逐对象核/细胞器mask接入。
- 验收：每个mask带父ID、版本、bbox、Z范围、哈希及独立三平面检查；未分割纹理不替换成器官球体。
- 关联项：[UPG-120](#upg-120)。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-122"></a>
### UPG-122 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：source-object planned — raw-only phase。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：仅在精确Guan对象权利确认后尝试小范围原始Zarr切块并保留数据集ID和坐标。
- 验收：20951×15644×7095及12×12×35nm元数据可追溯；无命名注释时只显示raw，不生成esV2a/CoLo几何。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-124"></a>
### UPG-124 · 逐对象信息页与证据渲染

- 原记录：`P0`；状态：completed — source/SSR validation; formal visual comparison remains permission-gated。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留九类证据渲染状态及所有无对象零图元限制；相关场景变更时补做适用的视觉对照而不默认旧记录已证明视觉正确。
- 验收：每一可见对象有ID、状态、坐标、版本和哈希；未分割核/器官/神经突不画球、胶囊或盒体。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到230已存对象加载与界面性能改进，保留每对象缺失状态。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-128"></a>
### UPG-128 · 二维显微、突触与受体定位

- 原记录：`P2`；状态：planned — 2D reference only。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：核验DANDI固定版本中rat6_sample-data15的raw、axon、myelin和combined精确asset及像素对应。
- 验收：1154×744、0.13µm像素及mask配对成立；始终二维且无神经元实例ID、soma或亚型补配。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-129"></a>
### UPG-129 · 小鼠同细胞三维内构

- 原记录：`P2`；状态：research watch — same-cell source gate。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：与104、136、165共用小鼠同细胞EM候选记录，只对新公开对象补核验。
- 验收：稳定细胞ID、原始三维像素、cell/器官mask、版本/校准/许可及三平面叠加俱全，否则内部层零图元。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到244/255小鼠同cell二维cell/nucleus试点或251/252已存在对象整合，真实3D目标继续保持未完成。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-134"></a>
### UPG-134 · 二维显微、突触与受体定位

- 原记录：`P1`；状态：blocked — version-pinned export and rights compatibility pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：仅在无需私钥的固定v16导出、原始/增强清单与复用条件成立后设计2D分割QA适配器。
- 验收：302图像/13类的发布与239的540行分开；有raw-mask精确join及held-out-original评估，无跨切片堆叠。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-136"></a>
### UPG-136 · 小鼠同细胞三维内构

- 原记录：`P0`；状态：raw-data-blocked — no admissible same-cell internal object found。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：只把新候选加入同细胞内构可执行准入链；旧EMPIAR零匹配不反复重跑为进展。
- 验收：一条真实小鼠脊髓interneuron的raw→cell→至少一种内部label完整可核；泛器官图谱及2D TEM不能替代。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到244/255小鼠同cell二维cell/nucleus试点或251/252已存在对象整合，真实3D目标继续保持未完成。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-150"></a>
### UPG-150 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留149对象逐域拓扑详情、根/分叉/末端节点ID及源type语义。
- 验收：Type1只是soma采样点，未出现域为Unavailable而非生物零；域长不被解释为整细胞或连接。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-151"></a>
### UPG-151 · 小鼠精确形态与种类覆盖

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留149对象源坐标说明、独立缩放尺及平面锁定，camera/resize/导出改动时检查其重放一致性。
- 验收：每视口尺度来自本记录源坐标；2D无Z、透视尺度随深度变化，未报告及制备冲突不被标准化。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到251/252的现有对象详情整合，保留已固定SWC及原始source标签。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-152"></a>
### UPG-152 · 分型背景与实验观察

- 原记录：`P0`；状态：planned — exact-file and object-level rights gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先经222核对两个同名Zenodo发布，再只对20533289健康MERFISH对象制定文件准入及section-local信息适配。
- 验收：健康与SNI分别保留；146621×500、108section及10mouse为来源分母，nan与零计数类保留，无Z或突触推断。
- 关联项：[UPG-222](#upg-222)。
- 转向：转到253/254来源信息整理或251/252已 admitted记录详情，不补推断身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-153"></a>
### UPG-153 · 分型背景与实验观察

- 原记录：`P1`；状态：research watch — object licence and taxonomy discrepancy gated。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅在CAP609/1410物种与层级冲突或对象许可得到来源解释时启动跨物种信息适配。
- 验收：Macaca mulatta/nemestrina和6/22/51/258对5/20/49/257冲突显式保留；计算映射不称严格同源。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到253/254来源信息整理或251/252已 admitted记录详情，不补推断身份。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-165"></a>
### UPG-165 · 小鼠同细胞三维内构

- 原记录：`P0`；状态：research watch — no qualifying mouse-spinal same-cell volume-EM object found。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：与104/129/136共用EMPIAR候选去重表，只有新deposit或具体对象线索触发有界检查。
- 验收：来源必须证明Mus musculus、spinal、interneuron及同细胞内部链；历史阴性检索不是全球无数据证明。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到244/255小鼠同cell二维cell/nucleus试点或251/252已存在对象整合，真实3D目标继续保持未完成。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-166"></a>
### UPG-166 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留MICrONS精确cell shell的可逆无盖裁切及完整nucleus，对相关shader/URL/camera改动回归。
- 验收：裁切只改变显示平面，不生成封盖、切片几何或生物测量；源网格及nucleus均不变。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-168"></a>
### UPG-168 · 小鼠同细胞三维内构

- 原记录：`P0`；状态：research watch — biologically relevant PKD2L1 vEM study lacks deposited source objects。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：只在PKD2L1 SBF-SEM研究出现新的公开raw/segmentation/object manifest时重开同细胞路线。
- 验收：论文生物身份不能替代下载对象；raw校准、cell/器官分割及同细胞ID和许可缺一即零内部几何。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到244/255小鼠同cell二维cell/nucleus试点或251/252已存在对象整合，真实3D目标继续保持未完成。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-169"></a>
### UPG-169 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：reference-only research watch — Janelia spinal FIB-SEM volumes cannot serve as interneuron surrogates。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：Janelia两份脊髓FIB-SEM仅保留精确组织方法参照，有新稳定layer才转179/195检查。
- 验收：6nm体积中的皮质脊髓轴突不获得局部interneuron身份，任何纹理/密度/器官均不迁移到所选细胞。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-176"></a>
### UPG-176 · 二维显微、突触与受体定位

- 原记录：`P1`；状态：publication-video-only internal-detail reference watch。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：先与184现有Video5远程播放核对；只有确有展示缺口时补相同来源入口，禁止再次新增视频对象。
- 验收：保留872×1080 publication-only及原始栈缺失边界；不从压缩帧重建Z、测量或内构。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-177"></a>
### UPG-177 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：planned — comparative zebrafish same-specimen candidate; exact-cell, resolution and licence gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：以120统一Fish1精确候选筛选，先解决lore/root、VAST与CAVE版本及4/8nm采样差异再建立比较适配。
- 验收：同样本各模态只用稳定源键连接，校准未解决禁测量，文件权利未明确禁打包派生几何。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-178"></a>
### UPG-178 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：no-go tombstone — raw-volume-only zebrafish spinal SBEM; named geometry unavailable。
- 本轮分派：**当前精确范围关闭**（`closed_exact_scope`）。
- 下一动作：保留Guan当前命名骨架不可用的精确no-go，只有稳定新命名对象及完整收据出现才重开。
- 验收：raw-volume参考继续可用；失效SC_zf_0113对象不被文章图、类名或邻近像素替代。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-179"></a>
### UPG-179 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：planned — mouse-spinal FIB-SEM layer inventory; no interneuron surrogate。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：对Janelia WT/mutant仅检查精确raw与nucleus layer目录和最小对象元数据，复用195已识别的局部块。
- 验收：记录版本/哈希/6nm校准及许可；无局部interneuron身份时selectedCellGeometry和sameCellInternalChain均为零。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-184"></a>
### UPG-184 · 二维显微、突触与受体定位

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留已接入的PKD2L1 Video5远程发布视频及归属，只在来源URL/组件变动时检查播放。
- 验收：API/视频收据不冒充raw stack或source object；禁止trace、分割、量测、跨细胞关联。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-188"></a>
### UPG-188 · 小鼠同细胞三维内构

- 原记录：`P1`；状态：planned — raw PKD2L1 SBF-SEM object chain unavailable。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅由新的公开PKD2L1 raw stack、segmentation或工程对象触发精确同样本链审查。
- 验收：COX4-dAPEX2与SYP-HRP不同构建/样本不融合；Video5仍不产生内部几何或Crozat profile join。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到244/255小鼠同cell二维cell/nucleus试点或251/252已存在对象整合，真实3D目标继续保持未完成。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-189"></a>
### UPG-189 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：planned — Fish1 identity, calibration, proofreading and rights gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：复用120的Fish1筛选和121的mask标准，只在真实脊髓lore/root及内部稳定键俱备后规划一例比较pilot。
- 验收：物化/校准/proofreading及权利一致；所有对象仍是幼鱼比较，不代表鼠或补其缺失器官。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-195"></a>
### UPG-195 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：planned — bounded Janelia mouse-spinal raw/nucleus co-display only。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：复验已记录WT raw和nucleus小块收据，构建独立未知细胞类别的局部raw/nucleus二维或切面比较。
- 验收：仅manual nucleus instance2部分ROI；6/96nm映射可追溯，40×30×75与liveextent差异未解决禁测量。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-196"></a>
### UPG-196 · 跨物种及跨脑区比较

- 原记录：`P2`；状态：planned — Janelia Ariadne organelle path recovery and object-key gate。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：只有官方Ariadne零字节链接修复成稳定非空对象时重新检查ER/膜/线粒体路径。
- 验收：404/空S3前缀不会生成器官；即便恢复仍属投射轴突组织，不能连接NMO或所选脊髓细胞。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-213"></a>
### UPG-213 · 二维显微、突触与受体定位

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Davis整图、源caption、原比例尺及保存受损说明，媒体/详情变化时检查。
- 验收：caption的d与e–g同记录关联不扩成独立同细胞验证；a–c不连接选定NMO或生成内部对象。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-214"></a>
### UPG-214 · 二维显微、突触与受体定位

- 原记录：`P1`；状态：partially completed — source-native 2D point viewer; calibration and identity gates remain open。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：为AQ848精确PALM文件查找物理单位、origin、axis与drift的公开来源说明，当前继续显示原数值XY。
- 验收：18358项始终是detections；无校准不画物理尺度，无同对象链不叠加BP057 EM或称受体分子数。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-215"></a>
### UPG-215 · 二维显微、突触与受体定位

- 原记录：`P2`；状态：planned — exact supplement acquisition pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：取得Bardoni精确Supplementary Figure1及caption收据和适用复用条款后增加独立二维免疫EM说明。
- 验收：GRPR末梢到FG标记PBN投射树突、成人腰段及50nm段落语境可追溯；无NMO249676或三维join。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-216"></a>
### UPG-216 · 二维显微、突触与受体定位

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Zhang发表体积重建的link-only说明，相关信息页修改时检查来源和边界。
- 验收：35×24×2µm及论文profile保留为发表语境；零本地几何、稳定细胞计数及所选身份关联。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-217"></a>
### UPG-217 · 二维显微、突触与受体定位

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留Zhang当前文章/补充材料未列raw/mesh的有界结论，仅新公开精确对象发布才重开。
- 验收：视频和PDF仍link-only；文章清单审核结束不等于全球无数据，也不授权描图反推几何。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-218"></a>
### UPG-218 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：partially completed — public table schema, checksum, native coordinate fields and quality caveat verified; exact-cell query and v185-to-v185.4 object lineage pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：仅在无需新凭据的公开精确root子集或已授权查询可用时取得MICrONS候选synapse行并核对版本及mesh空间。
- 验收：v185.3表与v185.4表面有显式lineage证据；点仍putative/unproofread，禁当proofread连接图或器官。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-219"></a>
### UPG-219 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：partially completed — release products and archive/documentation discrepancies audited; exact cell chain pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：复用221/248已核验BANC精确cell，继续只对剩余版本/产品差异做对象级审查。
- 验收：188508×81实际metadata与188162×79文档不混同，MISSING产品与存在计数表不相互代证。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-221"></a>
### UPG-221 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：partially completed — exact metadata candidate, nucleus-root row and SWC member verified; limited source-local route now admitted under UPG-248; internal-object chain pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：复用248已 admitted的BANC SWC和nucleus point，只处理未核验surface、mito及synapse对象链。
- 验收：12571候选filter不是分母；31mito只是metadata，mutable mesh不能跳过v888/rights绑定。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-223"></a>
### UPG-223 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：closed for this exact target under the documented nominal grid — spatial no-go; no mitochondria admitted。
- 本轮分派：**当前精确范围关闭**（`closed_exact_scope`）。
- 下一动作：保留当前MICrONS target与mit_new在名义网格下不相交的no-go，仅来源变换及对象lineage出现才重开。
- 验收：X/Y不相交意味着本映射不可叠加而非生物无mitochondria；零器官、零配准、零脊髓身份join。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-225"></a>
### UPG-225 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：planned — open-data, object-identity and rights gate; do not assume public viewer access authorizes reuse。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：只在Fish-X从request-only转为稳定公开可复用精确对象时检查候选，现阶段保留比较来源线索。
- 验收：公开viewer不是raw再分发许可；6dpf对象/器官/类型/count/坐标不迁入小鼠模型。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-232"></a>
### UPG-232 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：partially completed — exact v888 candidate count metric verified; per-mito coordinates blocked on authorized root-filter route。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：只通过公开精确root导出或已授权root-filter取得BANC候选逐mito子集，跳过1.1GB全表默认下载。
- 验收：31计数与实际行数不互推；逐ID/units/v888/rights/coordinate一致后才考虑比较点，零鼠身份。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-239"></a>
### UPG-239 · 二维显微、突触与受体定位

- 原记录：`P1`；状态：completed — public package metadata audited; 3D cell identity gate not met。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留MicroStructFormer两发行版各自的二维/许可证/评估未知说明及collapsed参考卡。
- 验收：540 pairedrows和302image/13class不合并，零下载/挤出/同细胞join；模型输出类不是新生物亚型。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有Super-CLEM序列、Davis图或PALM原数值视图，转到251/252精确对象导航。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-242"></a>
### UPG-242 · 小鼠同细胞三维内构

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留PKD2L1文章/API/媒体的有界审核结果，与168/188共用新raw对象触发条件。
- 验收：71是light-microscopy tracing而非SBEM census；Video5不作为体积，已审清单不宣称全球无数据。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到244/255小鼠同cell二维cell/nucleus试点或251/252已存在对象整合，真实3D目标继续保持未完成。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-243"></a>
### UPG-243 · 小鼠同细胞三维内构

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留当次公开catalog检索及候选排除范围；不以重复相同无效检索制造新迭代。
- 验收：EMPIAR/EMDB零匹配与BIA前20条筛查范围写明；无download及无合格对象不普遍化到全球。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到244/255小鼠同cell二维cell/nucleus试点或251/252已存在对象整合，真实3D目标继续保持未完成。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-248"></a>
### UPG-248 · 跨物种及跨脑区比较

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留BANC精确root的7451节点树与同root nucleus point，仅相关比较场景修改时回归。
- 验收：type2不解释、radius忽略、nucleus不画surface；31mito仅metadata并排除所有mouse分母。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-249"></a>
### UPG-249 · 跨物种及跨脑区比较

- 原记录：`P0`；状态：partially completed — public data products and exact-object access routes verified; same-cell payload, version binding and reuse gates remain open。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：优先找BANC精确root的可公开小子集及稳定nucleus/mito payload，Janelia两体积保持投射轴突比较线。
- 验收：对象须绑定v888、hash/frame/rights和同cell边界；无token检索、无全量大包替代精确query。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：立即返回244/255小鼠二维cell/nucleus及251/252主线，保留现有比较对象而不补缺失几何。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-251"></a>
### UPG-251 · 逐对象信息页与证据渲染

- 原记录：`P1`；状态：partially completed — verified active-record matrix covers the canonical Research Explorer index; independent source-object registries remain open。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：复用641活动记录coverage，补不在Research Explorer中的独立源对象行及选中生命周期。
- 验收：切换对象立即清空旧矩阵、图形及receipt；保留当前十类结构证据状态，文件验证与表示性质独立；不把verified-present作为已有OBS状态。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到230已存对象加载与界面性能改进，保留每对象缺失状态。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-252"></a>
### UPG-252 · 逐对象信息页与证据渲染

- 原记录：`P1`；状态：partially completed — five-source comparison index is registry-derived; exact per-object adapters remain open。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：在现有五source索引上逐来源增加typed exact-object行、收据和导航，优先native轮廓与已 admitted MICrONS/BANC。同时核对Todd原始closed flag、按源语义闭合的LineLoop与零surface的不同含义，修正不一致说明。
- 验收：一个source卡不是一细胞；每对象状态/count单位、frame/rights可追溯，不合并物种或以metadata放行geometry。 Todd原始sourceClosedFlag=false与按MBF语义闭合显示的LineLoop分开表述，不能称所有显示轮廓未闭合。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到230已存对象加载与界面性能改进，保留每对象缺失状态。
- 证据范围：`file_read_checked`；[app/independent-source-object-coverage.js](../app/independent-source-object-coverage.js)；[app/neurolucida-native-contour-admission.js](../app/neurolucida-native-contour-admission.js)。

<a id="upg-258"></a>
### UPG-258 · 逐对象信息页与证据渲染

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留165/641记录共享缺失理由只显示一次的归一化，同时在各slot保留独立状态和出处。
- 验收：简化文案不消除nucleus/organelle/synapse/receptor缺失，也不将未知改成生物不存在。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：转到230已存对象加载与界面性能改进，保留每对象缺失状态。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-261"></a>
### UPG-261 · 原生轮廓与逐对象坐标对应

- 原记录：`P2`；状态：planned — discover and audit additional exact same-record DAT↔SWC crosswalk candidates。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：以NMO45718已有显示对应为方法例，搜寻额外同NMO稳定record的精确DAT和SWC并独立预声明变换与留出集。
- 验收：每对象单独source语义、fit/holdout及alternative模型；禁止复用45718系数或0.01µm屏作为通用标准。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：继续展示已 admitted OBS轮廓和45718受限显示叠加，转到252逐对象信息页。
- 证据范围：`file_read_checked`；[docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md](../docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md)；[docs/RESEARCH_TIMELINE_2026-09-24_POST_2_90_NMO45718_MAIN_SCENE_DAT_OVERLAY.md](../docs/RESEARCH_TIMELINE_2026-09-24_POST_2_90_NMO45718_MAIN_SCENE_DAT_OVERLAY.md)。


## 科学来源与对象身份

<a id="upg-051"></a>
### UPG-051 · 来源范围与缺失含义统一

- 原记录：`P1`；状态：planned。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：逐页盘点未统一的source-universe、sample/specimen单位及缺失状态，复用当前31来源注册表；将142 census、149既有路线和独立30对象增量按真实集合关系展示，旧五exemplars仅作历史子集。
- 验收：每个显示lane及导出均说明单位/来源范围；可从ID集合重算重叠而非直接加总；未知不变0或不存在；保留十类现有状态并另列材料验证与表示性质。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：若某源缺sample字段，保留带locator的未知状态，同时改进已知来源的筛选与来源定位。
- 证据范围：`file_read_checked`；[app/ResearchSourceRegistry.tsx](../app/ResearchSourceRegistry.tsx)；[app/research-source-registry-summary.js](../app/research-source-registry-summary.js)；[app/exact-record-detail-coverage.js](../app/exact-record-detail-coverage.js)。

<a id="upg-052"></a>
### UPG-052 · 逐字段科学证据定位

- 原记录：`P1`；状态：planned。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：以页面实际显示字段为清单建立assertion到locator的映射，优先类型marker/采样数/年龄及形态frame/完整性；保留Sathyamurthy已有字段位置，不以一条论文URL替代精确表行。
- 验收：每个已显示主张可定位具体source field/figure/table/row/file/version；无精确locator时明确source-level或未核实；导出保留同一locator且不把hash当生物学真实性证明。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：未定位字段保留缺口，先完成其他已存在locators的页面可达性。
- 证据范围：`file_read_checked`；[app/InterneuronTypeAtlas.tsx](../app/InterneuronTypeAtlas.tsx)；[app/ResearchFocusEvidencePanel.tsx](../app/ResearchFocusEvidencePanel.tsx)；[app/research-record-presentation.js](../app/research-record-presentation.js)。

<a id="upg-090"></a>
### UPG-090 · 同细胞跨模态证据

- 原记录：`P0`；状态：admission-gated research watch。
- 本轮分派：**有新证据才重查**（`conditional_watch`）。
- 下一动作：仅在新增公开精确same-cell linkage文件/版本出现时重开候选；核对specimen/cell IDs、模态QC、单位及可用范围；保持形态-转录组关系未知，避免重复相同无结果检索。
- 验收：同物理细胞关系须有非歧义源映射及每一模态receipt；共享marker/标签/研究/坐标不能通过；SCI归属和atlas配准分别判断。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：推进已有源内对象展示、UPG-097/102软件关系表示或不依赖same-cell的类型信息。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)；[docs/RESEARCH_MODEL_UPGRADE_QUEUE.md](../docs/RESEARCH_MODEL_UPGRADE_QUEUE.md)。

<a id="upg-091"></a>
### UPG-091 · 可重放视图与科学导出

- 原记录：`P0`；状态：in progress。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：盘点主场景和每个独立viewport的JSON/CSV/PNG导出，补当前相机projection/position/target/up、clip、可见layer、display transform、renderer/build及验证状态；导出绑定实际渲染revision。
- 验收：同一receipt能恢复同对象/版本/图层/相机/裁剪；requested与actual、loading/failed/hidden明确；图像携带OBS/DER边界；导出时对象切换不混合新身份与旧画面；任何不可重放字段明确标缺失。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先完成已有稳定viewer的receipt，其他viewer显示不可重放原因并推进可访问性；不声称所有导出已覆盖。
- 证据范围：`file_read_checked`；[app/SceneCanvas.tsx](../app/SceneCanvas.tsx)；[app/morphology-comparison.js](../app/morphology-comparison.js)；[docs/RESEARCH_ITERATION_2_18_PRODUCT_AUDIT.md](../docs/RESEARCH_ITERATION_2_18_PRODUCT_AUDIT.md)。

<a id="upg-097"></a>
### UPG-097 · 对象关系类型

- 原记录：`P0`；状态：planned。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：把现有关系边界转换为可校验枚举及证据对象，默认co_display_only；为same_physical_object与same_source_population分配独立locator/QC，不由界面邻近触发。
- 验收：改变关系类型但不提供相应证据被拒绝；同label/marker/DOI测试保持co-display；同群体关系不授予同细胞几何。
- 关联项：[UPG-090](#upg-090)。
- 转向：先接已有MICrONS/BANC源内关系和无关系的显式状态；缺来源的候选继续独立显示。
- 证据范围：`file_read_checked`；[app/exact-record-detail-coverage.js](../app/exact-record-detail-coverage.js)；[data/microns-observed-cell-nucleus-reference-0.1.json](../data/microns-observed-cell-nucleus-reference-0.1.json)；[data/banc-v888-in14a018-morphology-route-0.1.json](../data/banc-v888-in14a018-morphology-route-0.1.json)。

<a id="upg-102"></a>
### UPG-102 · 标本到内部对象身份层级

- 原记录：`P0`；状态：planned。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：在UPG-097上增加specimen→section→cell→synapse分层键及same_section；复合键带source/release/namespace，未知parent保持null与原因，允许不同对象kind而非全叫cell。
- 验收：同ID跨run/section/release不碰撞；缺失/歧义父节点不得生成same-object边；parent修改使关联失效；组件数量与细胞数量分别统计。
- 关联项：[UPG-097](#upg-097)。
- 转向：先为已核实关系建立接口及缺失状态；BIL等源未到时使用真实已准入合同验证，不制造假生物对象。
- 证据范围：`file_read_checked`；[app/independent-source-object-coverage.js](../app/independent-source-object-coverage.js)；[data/microns-observed-cell-nucleus-reference-0.1.json](../data/microns-observed-cell-nucleus-reference-0.1.json)；[data/banc-v888-in14a018-morphology-route-0.1.json](../data/banc-v888-in14a018-morphology-route-0.1.json)。

<a id="upg-108"></a>
### UPG-108 · 规范来源档案

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留已建立的Source→record-set/asset/scope档案；使用当前注册表计数，24来源历史数字不作为现状。
- 验收：被修改时来源别名、species、life-stage、experimental unit、rights、missingness与source record一致，不合并生物记录。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：补UPG-110未覆盖的旧dossier/导出范围说明。
- 证据范围：`file_read_checked`；[app/ResearchSourceRegistry.tsx](../app/ResearchSourceRegistry.tsx)；[app/research-source-registry-summary.js](../app/research-source-registry-summary.js)。

<a id="upg-109"></a>
### UPG-109 · 来源群体与核/细胞名单下钻

- 原记录：`P0`；状态：partially completed。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：盘点当前已checksum-admitted rosters的逐profile下钻，将已有源内名单接至Source→record-set→profile→cell/nucleus；无roster来源只显示群体资料，历史161不是当前边界。
- 验收：每个名单行保留原始/复合ID与父来源、过滤计数可重算；无名单不生成个体；source profile与cell单位不混用；新来源核级数据仍单独经过源门槛。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：已存在名单先完善导航/导出；缺名单来源保留具体原因，推进其他产品入口。
- 证据范围：`file_read_checked`；[app/ResearchSourceRegistry.tsx](../app/ResearchSourceRegistry.tsx)；[app/InterneuronTypeAtlas.tsx](../app/InterneuronTypeAtlas.tsx)；[app/research-source-registry-summary.js](../app/research-source-registry-summary.js)。

<a id="upg-110"></a>
### UPG-110 · 每页与导出的生物学范围

- 原记录：`P0`；状态：partially completed。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：列出legacy dossiers及exports的scope缺口，复用Sources中的species/life-stage/region/unit，保持人类SCI与小鼠形态分离；实际核查每个过滤控件是否存在而不只信队列描述。
- 验收：每条使用路径与导出都显示当前lane对象范围与缺失原因；跨lane切换不残留旧物种/年龄；源上下文不升级为每对象实测属性。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：缺字段来源保留not retained，先消除已知上下文的UI/导出漂移。
- 证据范围：`file_read_checked`；[app/ResearchSourceRegistry.tsx](../app/ResearchSourceRegistry.tsx)；[app/ResearchExplorer.tsx](../app/ResearchExplorer.tsx)；[app/InterneuronTypeAtlas.tsx](../app/InterneuronTypeAtlas.tsx)。

<a id="upg-113"></a>
### UPG-113 · 研究队列与产品入口分离

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留确定性研究升级registry和页面UPG链接，不增加curator操作面板或另造行政队列。
- 验收：后续改动时所有链接指向真实UPG、状态/证据/边界可读；研究任务与已有governance queue仍分离。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：推进具体对象、研究证据和信息体验，行政增长默认延期。
- 证据范围：`file_read_checked`；[app/ResearchSourceRegistry.tsx](../app/ResearchSourceRegistry.tsx)；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)。

<a id="upg-118"></a>
### UPG-118 · 内部结构来源契约

- 原记录：`P0`；状态：planned — mandatory same-cell source contract。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：将exact内部对象的source URI/specimen/cell/geometry version/modality/voxel bbox frame/rights/bytes digest及parent证明编入fail-closed契约；做数据/渲染校验，不建设审核人员流程。
- 验收：缺任何适用必需字段/关系证据时内部图层Unavailable；合格point不升级mesh；已有source-only资料仍可读；文件verified不等于观测膜或完整内部模型。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：先用已有MICrONS/BANC等准确合同验证适用字段与缺失语义；等待数据的鼠对象不阻塞接口和其他展示。
- 证据范围：`file_read_checked`；[data/microns-observed-cell-nucleus-reference-0.1.json](../data/microns-observed-cell-nucleus-reference-0.1.json)；[data/banc-v888-in14a018-morphology-route-0.1.json](../data/banc-v888-in14a018-morphology-route-0.1.json)；[app/exact-record-detail-coverage.js](../app/exact-record-detail-coverage.js)。

<a id="upg-125"></a>
### UPG-125 · 数据对象使用范围

- 原记录：`P0`；状态：planned — redistribution rights gate。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：针对即将接入的具体文件核对复制/派生/显示/分发范围；允许的descriptor可先引用，streaming也必须符合来源规则，不把公开可访问视作免许可。
- 验收：每个复制或派生资产有覆盖该版本对象的条款；论文许可与数据许可分列；权利未明对象不bundle、不伪装开放，只保留合法来源链接及缺失说明。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：复用已有可使用资产继续对象展示/导出质量，不联系作者或读取凭据。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)；[docs/RESEARCH_MODEL_UPGRADE_QUEUE.md](../docs/RESEARCH_MODEL_UPGRADE_QUEUE.md)。

<a id="upg-191"></a>
### UPG-191 · Xenium精确分类桥

- 原记录：`P0`；状态：planned — exact BIL cell-identity bridge gated。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：取得作者确切cell_id→groups_manual/neuron_types映射及run/slide/animal/section键后核验；通用Xenium输出可做未分类分割浏览，但不能代替最终标签桥；复核文件级rights而非沿用旧行CC BY-SA笼统断言。
- 验收：源标签桥唯一/重复/孤立/缺失分开计数；未知identity时type-specific primitives为0；二维segmentation approximation与3D/膜/同RDS细胞关系分开；保留339/196/56空间标签和516 taxonomy不同分母。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：依UPG-244/255条件推进无分类的source-only cell/nucleus segmentation pilot，或做独立对象接口/UX。
- 证据范围：`file_read_checked`；[data/bil-xenium-spinal-audit-0.1.json](../data/bil-xenium-spinal-audit-0.1.json)；[docs/UPGRADE_PLAN_2026-09-24.md](../docs/UPGRADE_PLAN_2026-09-24.md)。

<a id="upg-192"></a>
### UPG-192 · 单记录DAT与SWC联展

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留NMO45718已实现的7loops/252vertices与5635segments联展和post2.90主场景overlay；其他记录独立进入UPG-261，不重做此任务。
- 验收：被修改时exact文件hash/ID/frame及hold-out屏幕一致性检验保持；legacy source-open轮廓排除；无膜/体积/internal/registration宣称，变换不跨记录。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：推进其他对象身份与展示，不为增加执行时长重复已完成拟合。
- 证据范围：`file_read_checked`；[app/neurolucida-dat-swc-crosswalk.js](../app/neurolucida-dat-swc-crosswalk.js)；[data/neurolucida-dat-swc-crosswalk-0.1.json](../data/neurolucida-dat-swc-crosswalk-0.1.json)；[docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md](../docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md)。

<a id="upg-202"></a>
### UPG-202 · 各单位规范计数

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留registry派生计数和stale-literal防回归；新增source/roster/object set仅更新规范事实，不重写历史快照。
- 验收：被修改时source、record-set、roster、object-set逐单位重算；UI/current-release相符；mutation案例拒绝硬编码漂移；不汇总为cell census。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：补其他逐对象来源的单位说明，不另造计数基础设施。
- 证据范围：`file_read_checked`；[app/research-source-registry-summary.js](../app/research-source-registry-summary.js)；[app/ResearchSourceRegistry.tsx](../app/ResearchSourceRegistry.tsx)。

<a id="upg-222"></a>
### UPG-222 · MERFISH版本与文件身份

- 原记录：`P0`；状态：partially completed — publisher-facing records and file checksums identified; version lineage, full H5AD delta and file-level rights pending。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：先取得Zenodo权威all-version元数据，再对18039571和20533289各自核对schema/obs/sample/section/labels与bytes MD5 SHA-256；只在许可明确且体量适当后取载荷。
- 验收：明确lineage或无法判定，保存不可变版本delta；同title/creator不建立等价；不混合两个H5AD的坐标/标注或license；无源几何不显示neurite/膜/内构。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：保持两个metadata候选独立，推进已准入roster或BIL小文件路径；不反复下载同一不明版本。
- 证据范围：`file_read_checked`；[data/adult-mouse-spinal-merfish-version-audit-0.1.json](../data/adult-mouse-spinal-merfish-version-audit-0.1.json)。

<a id="upg-238"></a>
### UPG-238 · Fish1跨物种精确对象身份

- 原记录：`P1`；状态：planned — separate zebrafish identity and object audit。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：仅按独立比较来源核对前脊髓exact对象、cell class、lore/root ID及materialization/CLEM specimen/version/rights；优先公开小对象receipt而非整volume。
- 验收：187053 soma注释保持跨脑/脊髓/ganglia的来源单位，非IN总数；gad1b+不推导具名亚型；mutable root映射须版本固定，无鼠ID/类型/geometry join。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：鼠核心可用数据、独立viewer与信息体验优先；缺许可/对象资料则候选保留。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)；[docs/RESEARCH_MODEL_UPGRADE_QUEUE.md](../docs/RESEARCH_MODEL_UPGRADE_QUEUE.md)。

<a id="upg-247"></a>
### UPG-247 · 新增Todd对象来源映射

- 原记录：`P1`；状态：planned — exact per-record publication/animal/figure crosswalk unavailable。
- 本轮分派：**先解决精确来源依赖**（`source_gate`）。
- 下一动作：对30个NMO322379–322408查公开exact object→publication/animal/figure/lamina映射；空DOI及PMID2017原样保留，candidate neurotensin论文不升级为逐细胞事实。
- 验收：仅明确交叉表可填字段；matched/unmatched/unassessable逐对象可追溯；不以cohort层lamina分布赋值个体；不联系作者或默认取得非公开文件。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：既有30对象的源形态、标签与未知来源仍可用；推进其展示/搜索/细节而不等待作者。
- 证据范围：`file_read_checked`；[data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.json](../data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.json)。

<a id="upg-253"></a>
### UPG-253 · 论文到对象候选发现

- 原记录：`P1`；状态：planned — publication-to-object discovery beyond DOI-only matching。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：在既有DOI audit基线上对当前taxonomy/morphology核对PMID、标题、作者和supplement名称，保留原值及可审查的规范化规则；先发现候选再核exact object交叉表。UPG-247 的缺口是待调查对象，不要求其先完成才能开展候选发现。
- 验收：三态结果含reason/locator；相同论文候选不等于object match；只有source-object/publication/specimen/figure对应齐备才入关系；0/10 DOI结果不推为永无关系。
- 关联项：[UPG-237](#upg-237)、[UPG-246](#upg-246)。
- 转向：本轮无新增映射则保留候选差异证据，转对象展示/roster/可访问性，不重复相同搜索制造版本。
- 证据范围：`file_read_checked`；[data/neuromorpho-type-source-doi-overlap-audit-0.1.json](../data/neuromorpho-type-source-doi-overlap-audit-0.1.json)；[data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.json](../data/neuromorpho-release-8-6-126-todd-stable-id-audit-0.2.json)。


## 研究界面与操作

<a id="upg-048"></a>
### UPG-048 · 研究入口与上下文

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留默认研究入口及可恢复的tab/profile/compare状态；新来源接入时复用，不重建入口。
- 验收：被修改时验证首次打开、显式URL、返回与刷新恢复同一来源/比较状态，缺失ID不猜测对象。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：推进未覆盖来源的逐对象适配与长列表可访问性。
- 证据范围：`file_read_checked`；[app/ResearchDataLab.tsx](../app/ResearchDataLab.tsx)；[app/research-focus-workspace-state.js](../app/research-focus-workspace-state.js)。

<a id="upg-049"></a>
### UPG-049 · 统一检索与精确选择

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留已有分组字面检索及单一focus上下文；历史413记录为当时快照，不用旧计数重做当前索引。
- 验收：被修改时用当前规范索引导出各lane计数，标签/DOI/PMID/accession检索保留namespace，错误focus不继承旧详情。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：完成来源卡片之外的对象检索/深链接适配。
- 证据范围：`file_read_checked`；[app/ResearchExplorer.tsx](../app/ResearchExplorer.tsx)；[app/research-explorer-index.js](../app/research-explorer-index.js)。

<a id="upg-053"></a>
### UPG-053 · 全应用可访问性与窄屏

- 原记录：`P1`；状态：in progress。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：复用已具roving focus的类型列表与Home/End tabs，逐项补Sources及其他长列表、跨lane选中上下文、200%缩放/屏幕阅读器/WebGL文本等价信息。
- 验收：键盘完整走通搜索→筛选→对象→图层→导出；每列表一个适当tab入口且选择语义正确；390px与200%缩放无关键信息截断；loading/error变化可感知；记录实际辅助技术验证。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：某浏览器/辅助技术不可用时完成可自动或可视核查部分并列明确未验项目，不以ARIA存在声称通过。
- 证据范围：`file_read_checked`；[app/InterneuronTypeAtlas.tsx](../app/InterneuronTypeAtlas.tsx)；[app/ResearchSourceRegistry.tsx](../app/ResearchSourceRegistry.tsx)；[app/ResearchDataLab.tsx](../app/ResearchDataLab.tsx)；[app/ResearchExplorer.tsx](../app/ResearchExplorer.tsx)。

<a id="upg-107"></a>
### UPG-107 · 三维证据层级与模式

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留精确形态、人口glyph和独立参考相机的明确分离，接新对象时沿用模式/ARIA/URL契约，不重复建立reference模式。
- 验收：被修改时切入参考模式隐藏不兼容lane；分子选择无代表细胞；URL/导入恢复正确显示权限及可见性。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：推进逐对象参考适配与真实核/结构数据。
- 证据范围：`file_read_checked`；[app/research-visual-target.js](../app/research-visual-target.js)；[app/SceneCanvas.tsx](../app/SceneCanvas.tsx)。

<a id="upg-159"></a>
### UPG-159 · 选择到三维目标联动

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留focus→visual target校验；当前主场景已扩展，历史13路线仅为该迭代边界，新增源对象按实际admission set解析。
- 验收：被修改时exact ID驱动唯一图形；类型/SCI等无几何关联清空旧细胞；不支持source diameter时保持SWC；未准入对象不回退代表细胞。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：推进尚无统一上下文的独立对象。
- 证据范围：`file_read_checked`；[app/research-visual-target.js](../app/research-visual-target.js)。

<a id="upg-160"></a>
### UPG-160 · 可地址化缺失与形态目录

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留142 census+7补充记录的区分、gap控制词汇和一次性共享边界，后续delta仍单列，避免旧计数重建索引。
- 验收：被修改时unknown reason code被拒绝、具体记录保留geometry/analysis locator；新增源对象不膨胀冻结census；missing不转zero或geometry。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：完成独立对象的同等缺失契约。
- 证据范围：`file_read_checked`；[app/ResearchExplorer.tsx](../app/ResearchExplorer.tsx)；[app/research-explorer-index.js](../app/research-explorer-index.js)。

<a id="upg-167"></a>
### UPG-167 · 类型资料差异比较

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留24白名单行、显式基线及精确字符串差异，不因计划扩大全App而改成生物学关系推断。
- 验收：被修改时未列字段不遍历；跨namespace相同文案仍不建立identity；URL和dossier export保留同一baseline/current。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：将独立对象差异聚焦表示/来源状态，不套用类型记录生物解释。
- 证据范围：`queue_record_only`；[data/research-model-upgrade-registry-0.1.json](../data/research-model-upgrade-registry-0.1.json)；[docs/RESEARCH_MODEL_UPGRADE_QUEUE.md](../docs/RESEARCH_MODEL_UPGRADE_QUEUE.md)。

<a id="upg-181"></a>
### UPG-181 · 原子研究工作区选择

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留focus/lab/visual target/evidence rail原子切换，新增对象kind先定义明确类型而非伪装已有morphology。
- 验收：被修改时每个支持kind切换产生同一focus的工作区；invalid/缺记录立即无旧证据和旧图形；无proxy。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：为UPG-251/252完善独立对象选择契约。
- 证据范围：`file_read_checked`；[app/research-focus-workspace-state.js](../app/research-focus-workspace-state.js)；[app/research-visual-target.js](../app/research-visual-target.js)。

<a id="upg-183"></a>
### UPG-183 · 分子资料模型读数

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留分子选择驱动的source-locked读数及几何清空；未取得同细胞几何前以字段/计数/marker区别资料。
- 验收：被修改时连换两个同源/跨源profile，标题、marker、计数与locator切换，几何/内部/fallback/join仍仅反映准入事实。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：推进已存在资料可读性和逐字段locators。
- 证据范围：`file_read_checked`；[app/research-record-presentation.js](../app/research-record-presentation.js)；[app/ResearchFocusEvidencePanel.tsx](../app/ResearchFocusEvidencePanel.tsx)。

<a id="upg-199"></a>
### UPG-199 · 信息完整性与渐进展示

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留8-slot completeness selector及单次证据/缺口呈现；新namespace必须提供逐slot证据或明确缺失，不重新堆叠重复卡片。
- 验收：被修改时八槽不静默遗漏；sampling/marker/transmitter未知语义保持，central readout只展示准入权限和当前focus。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：处理独立source对象明细和未覆盖来源locators。
- 证据范围：`file_read_checked`；[app/research-record-presentation.js](../app/research-record-presentation.js)；[app/ResearchFocusEvidencePanel.tsx](../app/ResearchFocusEvidencePanel.tsx)。

<a id="upg-200"></a>
### UPG-200 · 共享核验与过期异步隔离

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留单一Provider和不可变记录对象，扩展对象时复用generation/requestKey/abort和同步清空语义。
- 验收：被修改时A→B、A→B→A及stale success/failure均不会污染详情/scene；对象hash失败无fallback；多个消费者读取同一verified对象。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：完成独立object key与renderer receipt绑定。
- 证据范围：`file_read_checked`；[app/ResearchActiveRecordProvider.tsx](../app/ResearchActiveRecordProvider.tsx)；[app/research-active-record.js](../app/research-active-record.js)；[tests/research-active-record.test.mjs](../tests/research-active-record.test.mjs)。

<a id="upg-201"></a>
### UPG-201 · 相邻选择可解释变化

- 原记录：`P1`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留相邻verified-ready记录的presentation-only receipt；新对象适配不得把变化提示变成形态因果或同细胞关系。
- 验收：被修改时loading/failed/same-key/stale不产生或桥接变化；source locator、status/count保持精确，跨namespace不合并。
- 关联项：[UPG-200](#upg-200)。
- 转向：推进UPG-091真实可重放视图记录。
- 证据范围：`file_read_checked`；[app/research-selection-delta.js](../app/research-selection-delta.js)；[tests/research-selection-delta.test.mjs](../tests/research-selection-delta.test.mjs)。

<a id="upg-206"></a>
### UPG-206 · 研究问题直达入口

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：复用overview到形态/类型/SCI的直达入口及可展开定义，新增功能嵌入现有研究流程。
- 验收：被修改时入口到达正确lane及focus，简明计数来自规范注册表，所有证据仍可按需访问。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：推进对象细节和低负担来源说明。
- 证据范围：`file_read_checked`；[app/ResearchOverview.tsx](../app/ResearchOverview.tsx)；[app/ResearchDataLab.tsx](../app/ResearchDataLab.tsx)。

<a id="upg-212"></a>
### UPG-212 · 类型首屏与标签边界

- 原记录：`P0`；状态：completed。
- 本轮分派：**保留已完成范围／后继成果**（`retain_completed`）。
- 下一动作：保留已压缩布局与懒加载GLUT browser；仅在相关文案维护时修正队列历史387 confirmed-profile为source profiles，不将布局任务重新列为未完成。
- 验收：被修改时277 unresolved标签保持与387 source profiles独立，selected profile/filter/evidence仍在主要操作区，数据可达性无损。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：完善实际profile roster/字段证据与全应用可访问性。
- 证据范围：`file_read_checked`；[app/InterneuronTypeAtlas.tsx](../app/InterneuronTypeAtlas.tsx)；[docs/RESEARCH_MODEL_UPGRADE_QUEUE.md](../docs/RESEARCH_MODEL_UPGRADE_QUEUE.md)。

<a id="upg-230"></a>
### UPG-230 · 首屏与对象切换性能

- 原记录：`P2`；状态：planned — production bundle and deferred-load budget。
- 本轮分派：**可推进候选，启动前核实**（`ready_candidate`）。
- 下一动作：按实际production路由建立首次进入与对象切换的transfer/parse/execute/ready基线，再制定预算；延迟加载非首屏3D和大证据包，保留选中对象上下文。
- 验收：相同设备/缓存/路线前后对照，多次测量记录分布；深链接、keyboard、export、source边界全保留；未产生数据前不承诺数值提升或只以chunk变小宣称交互快。
- 关联项：无额外前置 ID；仍需满足该项说明的源／行为条件。
- 转向：测量工具暂不可用时先做依赖/加载图与可访问性，保留性能未验项；不删功能达预算。
- 证据范围：`file_read_checked`；[app/ResearchDataLab.tsx](../app/ResearchDataLab.tsx)；[app/InterneuronTypeAtlas.tsx](../app/InterneuronTypeAtlas.tsx)；[docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md](../docs/RESEARCH_TIMELINE_2026-09-24_ITERATION_2_90.md)。


## 旧来源准入记录：逐项处置

以下原状态来自当前0.4 catalog。只保留科研必要门槛与已有功能；“全部覆盖”不表示应把全部旧curator工作继续做大。历史记录的同义科研目标合并调度，原ID和来源继续可追溯。

<a id="upg-001"></a>
### UPG-001 · SpinalJ registration reproducibility benchmark

- 原记录：`P0`；状态：`in_progress`。
- 本轮处置：**归入科研差额**。
- 下一动作：与 UPG-031／028 的局部注册基准合并调度，复用旧 SpinalJ 元数据；仅补真实变换、独立landmark及留出误差。
- 验收：误差基准有实际物理单位和不相交训练／验证集；未通过时不把细胞转成REG。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-002"></a>
### UPG-002 · Cano-Gomez source-local spatial adapter audit

- 原记录：`P1`；状态：`in_progress`。
- 本轮处置：**归入科研差额**。
- 下一动作：归入 UPG-029／029A／163／244／255，先找旧run/section receipts，再补准确对象、坐标和标签。
- 验收：细胞键、section和版本明确；投射与未分类不计confirmedIN。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-003"></a>
### UPG-003 · Molecular taxonomy crosswalk

- 原记录：`P1`；状态：`in_progress`。
- 本轮处置：**复用后继、补差额**。
- 下一动作：复用 UPG-027A／106 及当前多来源类型，剩余marker／projection身份问题在W06/W07处理。
- 验收：不重建旧69条宇宙，不将候选比较自动变成跨源同类型。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-004"></a>
### UPG-004 · Injury-state condition adapter

- 原记录：`P1`；状态：`in_progress`。
- 本轮处置：**归入科研差额**。
- 下一动作：归入W08，复用已实现的Tabulae与SCI条件接口，RNA/ATAC及实验单位分别核对。
- 验收：source sample、modality、condition和aggregation清楚；无输入不推断单细胞轨迹。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-005"></a>
### UPG-005 · Legacy NeuroMorpho expansion pointer — superseded by UPG-030 / UPG-030A

- 原记录：`P2`；状态：`queued`。
- 本轮处置：**历史指针、停止重复**。
- 下一动作：按其原说明保留legacy pointer，实际形态增量进入UPG-030／088／227／256；旧030A文字指针不能生成一个不存在于当前研究表的新任务。
- 验收：既有语料按ID/hash复用，只有真实delta增加；legacy不另开第二套语料。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-006"></a>
### UPG-006 · Public-source release-admission service

- 原记录：`P2`；状态：`in_progress`。
- 本轮处置：**维护既有能力、暂缓新行政**。
- 下一动作：保留当前release-admission界面与正确性；必要来源/使用范围校验在W16完成，不扩管理员服务。
- 验收：不破坏旧receipt，不以行政UI代替科学对象核验。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-007"></a>
### UPG-007 · Independent curator adjudication gate

- 原记录：`P0`；状态：`ready`。
- 本轮处置：**暂缓行政扩展**。
- 下一动作：不新增多curator审议流程；已有冻结功能保留，相关修改才回归。
- 验收：不伪造独立reviewer或批准，也不占用鼠模型主线实施。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-008"></a>
### UPG-008 · Tabulae source-checksum and rights gate

- 原记录：`P0`；状态：`in_progress`。
- 本轮处置：**归入科研差额**。
- 下一动作：与W08 Tabulae确切对象一起核验checksum及使用范围；不单独重做一套准入界面。
- 验收：文件级事实可追溯，源不成立只挂起对应对象。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-009"></a>
### UPG-009 · Russ taxonomy version-and-adult-context reconciliation

- 原记录：`P1`；状态：`in_progress`。
- 本轮处置：**保留科学核对、暂缓流程扩展**。
- 下一动作：复用已有Russ纠正／版本资料与marker表，比较差额归W07；不追加curator表单。
- 验收：来源纠正保留，成人上下文不变成每个群体的源身份。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-010"></a>
### UPG-010 · STARmap PLUS lumbar source-coordinate eligibility audit

- 原记录：`P1`；状态：`research_watch`。
- 本轮处置：**归入科研差额**。
- 下一动作：归入UPG-036的STARmap准确切片／panel路线，找到具体可用对象再显示。
- 验收：单切片／靶向panel不宣称全脊髓，单位／坐标／许可明确。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-011"></a>
### UPG-011 · Tabulae object and compatible-analysis admission gate

- 原记录：`P0`；状态：`in_progress`。
- 本轮处置：**归入科研差额**。
- 下一动作：与W08已有Tabulae对象和兼容条件比较对齐，补版本与输入缺口。
- 验收：本地filename-gated session不冒充正式source admission。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-012"></a>
### UPG-012 · Tabulae cross-section source-frame and 3D eligibility gate

- 原记录：`P0`；状态：`research_watch`。
- 本轮处置：**保留科学门槛、暂缓人审流程**。
- 下一动作：跨section三维只有源顺序／标定／同specimen证据成立才规划；先用W05准确2D。
- 验收：无证据不把多张图堆成3D；不新增curator审批产品。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-013"></a>
### UPG-013 · Tabulae multi-section source-local interpretation and concordance gate

- 原记录：`P1`；状态：`research_watch`。
- 本轮处置：**保留科学门槛、暂缓人审流程**。
- 下一动作：section条件兼容与对照方法归W05/W08，避免默认对齐。
- 验收：定性与定量比较各有依据；未知sample不跨图配对。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-014"></a>
### UPG-014 · Metadata-only RO-Crate provenance externalization gate

- 原记录：`P2`；状态：`in_progress`。
- 本轮处置：**维护既有能力**。
- 下一动作：保留现有detached provenance导出；只有W14需求触及才修复，不单独扩审批工具。
- 验收：外部链接不声称源资产已打包；导出事实与实际文件一致。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-015"></a>
### UPG-015 · Public-source research-question feasibility planner

- 原记录：`P1`；状态：`in_progress`。
- 本轮处置：**维护既有能力**。
- 下一动作：复用已有研究问题到源路线说明，不扩行政planner；新的科研路线写规范研究队列。
- 验收：无合格路线时如实显示；选择存在来源不等于问题已经回答。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-016"></a>
### UPG-016 · Two-lane evidence and public-source provenance trace

- 原记录：`P1`；状态：`in_progress`。
- 本轮处置：**维护既有能力**。
- 下一动作：保留证据／公开来源两条trace；W13/W14按准确locator展示和导出。
- 验收：两条资料链不合并为生物身份；不复制审计页面替代研究界面。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-017"></a>
### UPG-017 · Cross-lane relationship admission gate

- 原记录：`P1`；状态：`in_progress`。
- 本轮处置：**保留身份契约、暂缓流程扩展**。
- 下一动作：关系类型／真实证据归W16；不新增curator proposal流程。
- 验收：相近坐标或同label不能成为关系依据；缺parent则相关对象保持不可关联。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-018"></a>
### UPG-018 · Source-assertion provenance and evidence-locator gate

- 原记录：`P1`；状态：`in_progress`。
- 本轮处置：**保留字段依据、暂缓流程扩展**。
- 下一动作：断言到field/file/table locator归UPG-052与W13/W16；复用原receipt。
- 验收：未知对象与未取得源明确；不补造reviewer/date。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-019"></a>
### UPG-019 · Asset-level authorization and reproducible local-verification gate

- 原记录：`P1`；状态：`in_progress`。
- 本轮处置：**暂缓行政扩展**。
- 下一动作：不另建授权计划composer；真实资产使用范围仍按W16核对。
- 验收：文档计划不等于授权；对外费用／受限数据等边界不被自动越过。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-020"></a>
### UPG-020 · Independent authorization-evidence packet and local-verification execution gate

- 原记录：`P1`；状态：`in_progress`。
- 本轮处置：**暂缓行政扩展**。
- 下一动作：保留冻结packet，不制造独立授权证据或人审环节；继续不依赖它的公开来源工作。
- 验收：独立证据只认真实来源，不能由agent重复写同声明充当第二意见。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

<a id="upg-021"></a>
### UPG-021 · Separately approved local-verification execution and retention SOP

- 原记录：`P1`；状态：`research_watch`。
- 本轮处置：**暂缓行政扩展**。
- 下一动作：不新建controlled-execution审批SOP；正常已授权、可逆的本地核验按长时总纲执行。
- 验收：真实必需外部授权仍不可省略；缺少者挂起该动作，其他独立工作继续。
- 转向：该路线需要额外来源或真实外部授权时，执行 W01/W13/W14 中不依赖它的任务；不停止全部升级。
- 证据范围：当前 catalog 原记录与代码引用，只读核对；没有复跑该旧流程。

## 未列入独立新任务的事项

- 未知未来研究点按执行总纲的去重／来源门槛加入；不预造数据或虚构可得性。
- 历史子项别名只有在规范注册表中实际存在才作为独立ID；覆盖范围不靠数值区间推算。
- 原README／时间轴的历史计数、旧catalog行政功能和比较来源可保留其真实范围；它们不是新的生物学对象或自动可实施项目。
- 覆盖表变旧时先重新比较两份规范输入，补新增ID和真正变更项，不重写已封存的历史时间轴。
