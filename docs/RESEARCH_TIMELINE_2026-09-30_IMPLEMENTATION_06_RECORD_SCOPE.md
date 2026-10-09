# I06：研究档案的来源范围、字段定位与导出

日期：2026-09-30。当前用户请求继续实施主规划，完整目标保持不变；本增量仅处理 UPG-051／052／110 的 legacy Research Explorer／selected-record 差额。当前版本 `2.91.0-research.1`，父快照2.90冻结；保留已有未提交工作。本文件记录实现与实际验证，不替代M2／M4的来源门槛。

## 启动范围与验收

当前 Research Explorer 已有641条固定索引记录及30条独立Todd补充记录；字段/evidence/gaps已存在，新增工作让研究来源的species/life-stage/region/experimental units、记录单位、条件与field locators在旧档案及记录导出中一致。群体背景不升级为每个细胞属性，mouse/human或neonatal/adult条件不合并，null不变零；精确字段与宽泛引用／hash分别标记。导出为科学档案数据，不声称包含当前3D相机或画面。

文件归属：新增 `app/research-record-source-scope.js/.d.ts`、`app/ResearchRecordSourceScope.tsx`、`app/research-record-source-scope.css`、相应行为测试；顺序修改既有 `ResearchExplorer.tsx`、`ResearchFocusEvidencePanel.tsx`、当前manifest构建器和本轮文档/规范队列。修改前态位于 `/private/tmp/ohri-i06-before`，不是项目副本；回滚只撤销本增量差额。

预期：真实档案切换立即换source context与receipt；无效focus无旧context；JSON与CSV保留相同source locators、原missingness与条件单位；所有当前641+30记录明确来源范围或具体缺口。实际测试、生产浏览、hash清单和未解决项在核实后填入。

## 验证状态

初步逐记录核对671/671通过，22个准确parent，10,038 evidence字段及13 SCI conditions，0未知source fallback。4类引用与待解析locator分别为：retained field/section 3,891、source/project-level 1,326、source-object without field 1,341、integrity-only 1,169、requires source resolution 2,311。这是引用可达性/分类，不是上游全部字段科学核验。所有641+30原值、gap/原因、原引用保留；Todd材料化字段指向其运行适配及独立route合同，不伪造fixed-index行。

12项新增有意义行为检查加现有32项active-record/explorer检查：44/44通过；strict typecheck及lint退出0。包含wrong/absent/duplicate/stale record、source/condition mismatch、mouse/human及neonatal/adult分离、null sample、hash非生物证明、Todd版本边界、导出generation和CSV公式/换行/引号。首次完整research通过后，正式Todd UI复核发现materialization locator的releaseId误放了合同SHA；已分开为准确route release ID与contractSha256，并扩展该版本边界检查。修正后12/12专项及完整research再次通过。M2、M4、全F维度及全部Goal未完成。

## 最终工程与正式浏览验收

- 完整当前 `npm run test:research` 退出0：1,134 tests／1,119 passed／15 conditional skips／0 failed；build、strict typecheck、lint与全部validators通过。542个当前input byte receipts；冻结2.90不变，31／41／13＋4／387及243／79分母均未增加。日志：[完整复验](qa/2026-09-30-implementation-06/full-research-validation-291.log)，[44项初步专项](qa/2026-09-30-implementation-06/target-tests.log)，[最终12项专项](qa/2026-09-30-implementation-06/final-target-tests.log)。
- 正式3003当前process65435、session68044，实际监听仅127.0.0.1；新构建重启后Todd322379导出的releaseId为 `ohri-neuromorpho-release-8-6-126-todd-nts-route-pack-0.1.0`，contractSha256独立保留，材料化位置不指向不存在的fixed-index行。
- SCI `mouse.sc.vsx2_hoxa10` 的5条件实际页面及readonly JSON核验：4 mouse／animal、1 human／participant，native source ID SRC-P09保留，n=9仅人类该条件；source总体count保持null/原因。SCI `mouse.overlay.vglut2_vgat_switch` 实际展开分别显示neonatal与adult，原计数/条件不合并。
- 从overview实际搜索Sathyamurthy并选DE-1后转Types：scope立即改为SRC-SATHYAMURTHY-2018，旧mouse-human dossier textarea数为0；新receipt保留source_profile_aggregate与underlying nucleus，19 independent pooled samples和4,280 assigned neuronal nuclei分别保持。Browser Back返回source-audits时scope/receipt为0；Forward恢复DE-1，正确source且旧receipt为0。
- 390px正式scope332px／scrollWidth330px、textarea306px、document390px，无水平溢出；原生Enter收起/展开context，Forward恢复后从无receipt状态用Enter成功重新prepare，实际key DE-1／generation1／nucleus已核对。临时viewport已reset。
- 无效focus `molecular_profile:source-record-not-present` 从verifying到Exact record unavailable；scope和receipt均为0，不替代旧Todd/分子记录。
- JSON/CSV按钮仅报告download requested；本in-app环境仍未观察Blob文件落盘，不将点击记为下载完成。实际readonly档案已保存：[三份原UI receipt](qa/2026-09-30-implementation-06/browser-dossier-receipts.json)。截图[生产档案](qa/2026-09-30-implementation-06/current-dossier-production.png)、[窄屏](qa/2026-09-30-implementation-06/current-dossier-narrow.png)、[最终分开条件](qa/2026-09-30-implementation-06/condition-scopes-production.png)均已实际读取并视觉检查。

## 保留的余差与回滚

UPG051/052/110准确更新为partial，精确completed仍79；本增量覆盖当前Research Explorer与active-record evidence两个入口，不声称其他legacy dossiers、viewer导出、SCI原始统计学或上游所有field resolution已整体完成。10,038是显示证据字段数，不是细胞、实验或类型数。没有新增源几何、same-cell、注册或内部结构。M2仍缺BIL section/donor/outline frame/curated cell labels/条款；M4仍缺exact mouse spinal interneuron的完整volume+segmentation+parent+raw证据链。总目标继续active。

回滚只撤新增scope模块/组件/style/test及两个旧入口中的本增量接入；从 `/private/tmp/ohri-i06-before` 对照恢复本轮MD/构建器/队列差额，再按生成流程更新registry/current manifest。不可用整库reset或覆盖已有dirty文件。下一步推进尚未统一的其他legacy source-adapter/关系/view及source-dependent有效新输入。
