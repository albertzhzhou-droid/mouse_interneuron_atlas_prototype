# 2026-09-30 W15：现有类型错误的窄修复

范围：整合者授权修复原有35个类型诊断，保持科学数据、运行时身份链和既有dirty工作。没有改变package、队列、registry、manifest或主计划；没有添加依赖、`any`、`ts-ignore`或降低strict。`Independent*`属于另一worker，本轮未修改。

## 核验结果

全项目 `./node_modules/.bin/tsc --noEmit --incremental false --pretty false` 当前退出0、无诊断，日志为 `/private/tmp/ohri-typecheck-w15-20260929.log`（文件名沿用启动日期；完成时client日期为2026-09-30）。修复前的W01 typecheck保存38项诊断，包含35项既有问题和3项并行Independent模块接入中的问题；后3项由其owner修复，不能全部归到W15。

本轮涉及的16路径独立ESLint退出0。相关14组既有Node测试共59通过、0失败、0跳过；日志 `/private/tmp/ohri-w15-targeted-tests-20260929.log`。覆盖morphology render modes、cross-lane proposal、feasibility／provenance、curator feedback、file-admission composer及0.7／0.8、Tabulae local session／comparison、Ronzano coordinate payload／reference、main-scene observed routes和MICrONS clipping。

这不是完整 `test:research`、浏览器或release通过声明；最终整体验收由整合者进行。既有文件全量Git差异还包含早期dirty内容，本时间轴只声明下述窄修改，不把整份diff归为本轮。

## 具体修改及语义范围

| 路径 | 本轮修改 | 保持的行为／边界 |
| --- | --- | --- |
| `app/atlas-types.ts` | 从既有admission-status枚举找到typed status；未知值显式拒绝 | 所有合法catalog状态和metadata-audited优先级不变；不默认升级未知状态 |
| `app/CuratorFeedbackInbox.tsx` | responses存入const、用string-record predicate保留窄类型 | 原有required、bounded-string、verdict、ZIP hash和attestation检查继续执行 |
| `app/PublicDataWorkbench.tsx` | Number.isInteger之前显式要求number | 不接受numeric string；合法manifest不变 |
| `app/PublicFileAdmissionManifestComposer.tsx` | ChecksumPatch改为已有两字段的Partial | UI本来逐字段更新，仍合并完整draft；hash规则不变 |
| `app/ResearchEvidencePanels.tsx` | 明确排除undefined再读statement.kind | 不改变合法statement内容／来源 |
| `app/ObservedMorphologyRouteLibrary.tsx` | Todd细节分支同时检查实际使用的strain／numericAge／raw-reference字段 | 不把同版本的其他record误当成该metadata形状；不修改任何source record |
| `app/Nmo45718DatSwcCrosswalkViewer.tsx` | contour-point回调声明已验证三坐标tuple | 无坐标、transform、closure或geometry修改 |
| `app/TabulaeSpatialComparisonBoard.tsx` | Blob取得owned Uint8Array副本 | image字节不变，source hashing、schema和local-only行为不变 |
| `app/TabulaeSpatialLocalViewer.tsx` | 同上 | 同上 |
| `app/EvidenceFeasibilityPlanner.tsx` | route回调使用现有JSON route type | 不新增qualified route或relationship |
| `app/EvidenceProvenanceTrace.tsx` | claim／route回调对应已有ResearchClaim／route type | provenance lanes仍分离，不建立join |
| `app/cross-lane-relationship-admission.js` | contract参数JSDoc引用已有TS契约 | runtime算法及not-admitted结果不变 |
| `app/morphology-render-mode.js` | JSDoc明确authority和skeleton／radius／null参数 | 无source diameter的radius surface继续fails closed |
| `app/microns-import-provenance.js` | nullable clipping参数JSDoc引用既有JSON契约 | canonical provenance、source frame及clipping校验逻辑不变 |
| `app/ronzano-premotor-position-data.js` | 三个已冻结string-enum数组声明readonly literal tuple | URL只接受原有frame／muscle／segment值；不修改坐标 |
| `worker/index.ts` | ASSETS使用实际消费的fetch结构类型；未消费DB声明unknown | 不假定未取得的DB API类型；引入DB使用前必须先narrow；runtime handler不变 |

## 恢复与整合

仅上述本轮窄hunks可撤回；不要reset整个文件，因为atlas-types、ObservedMorphologyRouteLibrary等已有其他dirty修改。JS源码字节变化即使只改JSDoc，也应纳入整合者的新manifest；不更新或覆盖旧冻结snapshot。

W01 BIL metadata实现及真实pilot的剩余source gates独立记录在 `RESEARCH_TIMELINE_2026-09-29_W01_BIL_METADATA.md` 和 `BIL_XENIUM_SOURCE_GATE_2026-09-29.md`，不因本轮typecheck通过而提升为已准入geometry。
