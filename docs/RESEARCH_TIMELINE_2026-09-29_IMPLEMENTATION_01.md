# 升级计划实施 01

日期：2026-09-29（America/Toronto）。用户当前要求：完成 `UPGRADE_PLAN_2026-09-24.md` 中更新。该要求启动实施，覆盖旧规划模式；不启动对外发布或第三方联系。

## 启动基线

- package：`2.90.0-research.1`；Git HEAD：`8281912dc96df28e42f24de391c8872e20e17532`。
- 启动时 462 个未提交路径，全部保留。主计划 P03 的 519 路径为历史盘点，不视作当前数量。
- 2.90 manifest 快速验证通过；完整应用验证尚待本轮改动结束。
- 当前类型检查复现 35 个既有错误，保存于 `/private/tmp/ohri-tsc-baseline.log`，本轮新增错误单独处理。
- 本轮明确将修改的八个共用文件已保存前态及 SHA-256 到 `/private/tmp/ohri-upgrade-20260929-prestate`；这是有限文件备份，未复制项目。

## 当前工作与归属

1. UPG-251/252：独立来源逐对象契约、异步选择、来源分母、详情、图层、URL 和导出。主整合者负责 UI／共享文件，独立 worker 负责对象核心和其测试。
2. UPG-163/244/255：先恢复历史 BIL 小文件 receipt，核对当前运行版本、schema、section／annotation 和精确文件使用范围；只有实际条件通过才接入二维 pilot。
3. UPG-254/253/247 与 M4：准确类型／年龄和论文对象发现、真实鼠脊髓同细胞三维依赖审查。记录来源输入的当前差额，避免重复下载。
4. UPG-230：逐对象使用路径的实际加载测量与按需加载；类型检查的遗留错误与新错误分别记录。

## 科学边界与当前状态

原生轮廓是源线迹；NMO50394 外壳仍为派生开放显示，NMO45718 变换仅适用于该记录。MICrONS 皮层、BANC 果蝇、PALM detections、MicroStructFormer image/mask rows 各保留其来源与单位。未取得鼠脊髓 exact cell 的 volume、segmentation、parent 及 frame 链前，M4 未完成。

本文件记录I01的实际实施及验收。任何测试通过均只证明对应范围；完整目标未证实，不宣告全部升级完成。

## 断点与回滚

next_action：I01完整回归和本机生产验证已通过；推进UPG097/102/118共享契约及其余legacy软件余差。外部科学门槛以新准确输入、许可声明或源修订触发重审，不重复当前无变化检索。

fallback：BIL 受阻时转现有对象、导出与可访问性；类型来源受阻时保留精确缺口并转已准入来源操作。

仅撤回本轮新增文件及对应 hunks；共用文件依据前态差异逐项恢复，不能覆盖后来的并发改动。不使用整库 reset 或目录清理。

## I01 成果与证据范围

- 独立五来源对象工作区与 source-audits 路由已可操作。对象key含source/release/kind/native ID，巨大整数ID保留字符串；分页索引不生成18k份完整元数据。选对象更改同步隐藏旧payload，异步abort＋epoch拒绝A→B→A过期返回，当前view也绑定同一次verification。
- Native全7记录/72loops保留源closure语义；NMO50394 DER开放壳显式单独请求，不成为膜／volume；NMO45718 source-specific display crosswalk不迁移。MICrONS仅已准入cell/nucleus meshes；BANC SWC/核点父关系先验，32hex原receipt明确MD5，不冒充SHA256。PALM每个detection column保持二维点/帧；Micro540row固定commit定位，live viewer version未验证，runtime为link-only，无image/mask payload。
- Viewreceipt输出实际layers、camera、sourceframe、displaytransform、renderer/version、source文件hash及applicationversion。同版本恢复重新核验payload；无效版本、错误frame/camera或改写源filehash拒绝恢复。WebGL失败保留文本详情且无替代几何。JSON、CSV和PNG仅输出声明范围，不导出未获准原始图像。
- 387profiles/10namespace真实2–4记录锚定比较，精确保留case-sensitive source strings、feature角色、context unknown和source conflicts。共享marker不赋予same-type/same-cell；Cano复合标签不拆成markers；source locators随JSON/CSV输出。
- BIL当前82bounded files/2,320,586B，包含恢复34-core-files/1,187,125B；16run均XOA3.3.0.1 Multi-Tissue Stain，raw metrics3,387,300而非IN数。329outline labels缺unit/frame/cell-ID join，许可API/workbook CC-BY4.0与site BY-SA4.0分别保留；0section-linked geometry，未下载43.66MBpolygon候选以伪造section关联。
- Trevisan29source characteristics/fourworkbook sheets/29barcode/oneMTX验证，28barcode byte-identical；104,240workbook source rows未匹配native columns，E13.5全6,676匹配却无cluster/reuse。Source矛盾隔离，零新增核级名单。1,127 NMO×10taxonomy publication PMID/title/author screen为1,097 unmatched、30unassessable、0candidate，不是全领域无关系。
- WTraw/nucleus两个原chunk＋四份descriptor历史SHA全部match；8当前小输入1,410,836B，exactFigsharev1均CCBY4。lossless浏览载荷2,097,152Braw＋262,144Bnucleus，分别128³@6nm及64³@96nm+45nm。每native labelZ对应16 rawZ mean；sourceROI全512coarsevoxels均2，rawpatch内部没有nucleus boundary。不赋IN、完整核、测量或atlas。
- 既有35个TypeScript错误已用16路径的局部类型修复清零，没有关闭strict或ts-ignore；详见W15专属时间轴。

## 子增量记录

- [BIL metadata](RESEARCH_TIMELINE_2026-09-29_W01_BIL_METADATA.md)
- [34候选差额](READY_CANDIDATE_DELTA_REVIEW_2026-09-29.md)
- [类型修复](RESEARCH_TIMELINE_2026-09-30_W15_TYPES.md)
- [WT native planes](RESEARCH_TIMELINE_2026-09-30_W04_REFERENCE.md)
- [两条比较SWC及7条native来源字段](COMPARATIVE_SWC_REFERENCE_2026-09-30.md)
- [Crozat实验家族](RESEARCH_TIMELINE_2026-09-30_SOURCE_GAPS_02.md)
- [M4准确来源门槛](MOUSE_SPINAL_M4_SOURCE_GATE_2026-09-30.md)

## 历史与当前 manifest

2.90 manifest本体保持7,954B、SHA256`8bca8205ed5671241e083b1f36bec1d566fc591a93b44cc75ae1d1d8c13c2480`及content digest不变。其snapshot validator验证冻结receipt、2.89parent及不变科学payload；app/package/queue的历史hash不再强迫当前工作区回到2.90。新2.91 validator重新生成并逐字比较所有当前authoritative inputs，包括代码、数据、队列、package及本时间轴。修改任意当前输入后必须重新生成新manifest，不修改旧sealed manifest。

当前2.91 canonical source units仍31sources／41recordsets／13exact cell-profile rosters／4exact source-object sets／387source profiles；新增比较资料与元数据不是新鼠IN类型，均按独立来源表示。规范队列仍243条至UPG-261；精确completed条数与当前manifest一致，不能理解为科学完成率。

## 浏览器实测（逐路径）

在localhost3001开发实例验证：native45718、50394可选DER，MICrONS完整18位root cell+nucleus，BANC SWC+point，PALM末列18358，Micro train row0文本定位；source切换清除旧选择，空搜索清除详情/geometry，Back恢复准确对象并重新核验。Types实际3记录anchor比较产生source-context unknown和精确Pax2/Mpped2/Slc6a1共享strings；TrevisanP0CR1/E135实际gate、筛选移除选择都正确。WTslider Home/End显示1/128和128/128，native坐标保持来源affine。

390px对象及WT页面已视觉检查；WT/source-audit整个document.scrollWidth=390，宽表仅容器内auto-scroll。NarrowMIC对象resize曾触发ResizeObserver loop，已用宽度变化guard＋RAF修复并重验。Source timings为实际单次记录，不外推速度提升；屏幕阅读器、全App 200%及跨GPU像素一致性未证实。

截图与可见view receipt：[QA目录](qa/2026-09-29-implementation-01/)。正式2.91构建、生产浏览、完整回归数字在最终验收记录中补全。

## 最后交互审查与状态对账

只读复核发现并修复：图层切换／reset在新frame前可能导出旧view，现以同步generation invalidation阻止旧publisher，等待实际首帧才允许PNG；restore已加载但隐藏的DER层按layer presence重新取得receipt，requested只控制可见性；恢复严格校验实际允许且唯一的source layers及status/camera/frame/renderer一致性；URL页数先按当前filter真实总数clamp，再乘25，防safe整数页导致offset溢出或空白页。

本轮规范队列状态精确completed从73升至79：UPG-106、127、145、175、195、252均只在各自声明的验收范围完成。UPG-251、253、244、254、091及全App性能／可访问性保持部分完成或现有状态。浏览器实际鱼／rat关闭／重新打开清除后重新核验，source-native centerlines、完整度和radius policy可见，截图`comparative-swc-reference.png`。

## Cano exact nucleus drill-down及恢复验收

Types已接现有11profiles／923rows核名单的按profile verified lazy下钻；包含源原22columns、native/compound ID、P56datasetcontext、source NA／Unassigned、分页／筛选／选中同步清空、source row locator及JSONCSV。HTTP自动解压时区分compressed build receipt与runtime decoded SHA，源科学授权没有扩大。完整结果见[UPG109时间轴](RESEARCH_TIMELINE_2026-09-30_UPG109_ROSTER.md)。

实际文件选择器成功恢复NMO50394的已核验hidden-DER视图：DER载荷重新验证且checkbox仍hidden，camera及frame正确。QA输入是从可见receipt/view序列化得到，**不是观察到的download文件**。当前in-app browser对新Blob download未返回事件或落盘文件，下载点击只能确认触发控件；文件实际落盘的该环境验收保持未证实，不能用旧2.90download替代本轮证明。

## 原生采样敏感性与连接方法

[采样报告](ATLAS_SAMPLING_SENSITIVITY_2026-09-30.md)保留实际15／38plane assets、generator-only历史33以及无新资产的nested75策略；38和75均32/32states、73/73directlabels，只增加selected-plane预算2.5437%→5.0483%，不提供独立精度。132原路径receipts无资产副本，重算32state和整volume semanticSHA。7/7targettests和builder--check通过。

[连接方法](RESEARCH_TIMELINE_2026-09-30_SOURCE_GAPS_03.md)新增16source assertioncontexts（12functional、4unknown），五种图例、condition/method/source locators、筛选/详情/JSONCSV，0cell edges/unknownsynapsecounts。6/6targettests通过。两个模块只在Overview／source-audits相应details打开时lazy载入。

Cano浏览实测146profile rows、Cervical37rows、分页2/2、source row34与compoundnativekey，以及空filter清空detail；窄屏初验发现669px组件被父grid裁切，已移出sampleframe并设min-width0，390px重验roster288px、document390px。新增代码所遇lint错误均已局部修复，保留strict和既有lint配置。

## 最终工程验收（2026-09-30）

`npm run test:research` 整体退出0：正式构建、严格TypeScript、全项目lint、历史及当前validators、当前测试均通过。共1,082 tests：1,067 passed、15 conditional skips、0 failed。完整原日志暂存 `/private/tmp/ohri-test-research-291-final.log`；15 skips保留原条件，不计通过。当前manifest在文档收尾后再生成并逐byte验证。

2.33/2.34 snapshot仍校验其原manifest和科学inputs。MICrONS运行文件本轮只新增typed JSDoc，旧3857B／SHA256 `fad707fdf8e41033a4c1a50b9875cc43e008d34cfb5f2a3b097c308b4c7b0bfb` 已从Git HEAD恢复到单文件hash目录，逐byte确认符合旧receipt。仅该id/path/size/hash可读取归档；损坏archive及其他receipt拒绝fallback。当前typed源码由2.91逐byte单独校验；2/2拒绝与重放tests通过，未放宽数据hash或旧manifest。

正式构建仅监听本机 `http://127.0.0.1:3003`，保留原3000／3001实例。正式 `/objects` 的NMO50394实际source loops校验52ms、第一次view-ready54ms；一次reset实际新view-ready176ms，保存为QA可见timing。无可比基线，不声称速度改善／预算达标。正式source-audits的连接及采样按需面板可用，空类别清除详情；修复hydration前native details toggle造成未加载的情况。浏览器readonly接口未提供Performance API，route transfer/parse/execute尚未测量，UPG230维持partial。

截图 `production-291-native-contours.png` 为本轮正式构建的真实14source traces；没有DER、膜或内部对象。新版导出控件触发与序列化/restore已测，当前in-app环境Blob落盘仍未证实。全App辅助技术／200%以及尚未覆盖的legacy契约余差见 `RESEARCH_TIMELINE_2026-09-30_REMAINING_SCOPE.md`，不能将这些工程余差统称科学受阻。

正式Types检查发现Cano源gzip仅在dev可读取，production静态缓存将.gz后缀统一当压缩变体而返回404。最终验收因此重新打开：仅为现有准确名单增加显式字节接口，保留原文件/hash/定位并逐byte验证，修复后重跑完整research检查与正式名单。上一段1,082测试是该问题发现前的实际通过结果，不代替最终正式浏览。

### 核名单生产修复后的最终复验

完整入口重新退出0：1,085 tests，1,070 passed、15 conditional skips、0 failed；build/typecheck/lint及所有validators通过。已保留完整原日志于 `docs/qa/2026-09-29-implementation-01/full-research-validation-291.log`。3新增tests覆盖实际byte loader、路径/query/损坏拒绝、实际GET响应字节；没有对旧source payload改名、复制或改变hash。

正式服务器重启后，Types的CHOL_IN_Best3_Htr1b实际显示146核行，选中 `GAGAAACGTTTGCGCC-1_1` 精确定位源data-row34及原RDS metadata行；source NA/unknown保留。窄字节接口 `/api/source-rosters/cano-chol-in` 仅包含构建时核验的现有16,348B gzip，返回application/gzip且无Content-Encoding；runtime先核验compressed与decodedSHA再显示923总行。source定位仍为原文件路径，receipt分开记录canonicalSourceFileUrl/requestedTransportUrl/responseTransportUrl。实际截图为 `production-291-cano-nucleus-roster.png`。

I01阶段验收完成，整个用户Goal保持active。后续优先推进UPG097/102/118共享typed关系、标本/切片/细胞/component层级与适用内构契约，再对其余legacy入口补scope/field-locator/export；不得把当前五来源和1,085检查缩小成全部Goal。
