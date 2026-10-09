# I34：准确 CHOL_IN 名单与原始 RNA counts 层

2026-10-02（America/Toronto），当前 `2.91.0-research.1` 原位增量；对应 C、E、F／UPG109 的既有源名单下钻及 F06／F07。完整用户目标、M2/M4与243条规范项目均保留；本轮不新增 completed 项、来源类型、几何或配准。

## 实际输入与科学差额

本轮从准确公开 GEO URL 再取得 `GSE318731_P56_cholinergic_multiome.rds` 一次，127,862,795 B，SHA256 `d4ad07a1e434f2ed4553738f3e1df1b395ce81b154f974c41f3ba6a9d674aed2`，全8段下载、完整hash及gzip CRC通过；保存在 `data/source-candidates/cano-chol-rna-20261002/`，未打包到 public。原metadata、规范registry、11profiles／923源核名单不改。原GABA、GLUT RDS未取得。

准确RNA assay为Assay5，`counts`层为dgCMatrix，32,285×3,199、18,787,611 stored entries；与 `data`、`scale.data*` 分开。矩阵Dimnames均NULL，身份只由源 `cells`／`features` LogMaps的**counts列名称**及其TRUE membership解析。LogMap layer顺序为`scale.data.1/scale.data.2/counts/data/scale.data`，不同于layers列表顺序，未按列表位置猜测对应。counts列的3199细胞名与metadata row.names原顺序exact equal；所有3199列的计数和检出基因数分别exact replay原`nCount_RNA`／`nFeature_RNA`。CSC pointers／sorted unique feature rows／有限非负整数与维度全核验。

仅用已有groups=CHOL_IN且逐行与原base-R名单一致的923行派生。完整32,285个源feature保留，包括在该子集中完全未检出的feature；4,610,528 positive entries、计数和22,637,377；11原profile及顺序membership保持。RNA counts列到同源metadata的named mapping本轮成立；**RNA/ATAC配对、跨源same physical cell、donor／section、marker／差异表达／生物学缺失均未建立**。P56仍dataset context，source labels不从计数自动重分类。

使用rdata 1.1.0 raw parser读取序列化原slot；运行时Python/numpy/parser版本及hash保存在新document。未将旧metadata-only BASE_R receipt改写为本轮RNA矩阵验收。精确提取与确定性重放入口：`tools/build_cano_chol_rna_counts.py --source-file <retained-exact-CHOL-RDS> --site-packages <rdata-site-packages>`；源码sha、输入名单／registry bytes以及实际parser hash都记录。Assay5与CSC语义依据：[SeuratObject Assay5定义](https://satijalab.github.io/seurat-object/reference/Assay5-class.html)、[Matrix dgCMatrix定义](https://stat.ethz.ch/R-manual/R-devel/library/Matrix/html/dgCMatrix-class.html)。原RDS与文章的条款独立，本轮仅本地研究应用，无远程发布。

## 新功能与数据传输范围

已有CHOL_IN核名单中按需展开RNA浏览器：搜索准确源feature、查看当前profile及全部11profile的positive/all nuclei、总计数、median/mean/max，查看当前selected nucleus的原counts、全部RNA library depth、检出feature数及原metadata row／counts column，提供当前JSON预览及profile内逐核counts CSV。聚合分母为每个完整源profile，不随roster filters变化；原始labels中的空格保留。0只表示此counts layer未检出；不存在feature不填0。raw counts未归一化，不能直接成为跨研究或差异表达结论。

127个确定性gzip块总4,650,673 B，每块最多256features；原compressed最大55,818 B，不等于实测网络延迟。只请求所选feature所在块，浏览器不取得整RDS或全矩阵。每次no-store请求同时核验compressed／decoded hash、source／chunk／feature顺序、923计数宽度及非负整数；当前private owner不可伪造／克隆后导出。换feature卸载旧loader，旧请求不会覆盖新feature；roster query/page清除selected nucleus，profile切换卸载旧RNA上下文，关闭展开卸载所有RNA视图。

## 公开V1入口检查与未完成项

复用I01已核验的29GEO barcode文件／final-figure名单冲突，不重复取得同一输入。当前作者Shiny主页实际提供PDF/PNG图像下载；已展开统计面板返回公开错误，检查页面上没有逐核注释下载控件。DOM范围保存为QA的`v1-author-visible-controls.txt`。作者GitHub README仍指向GSE275595；未取得新的corrected count/barcode对象或cluster crosswalk。该有限范围不证明所有公开路线无数据；V1原冲突及source gate保持。

## 验证状态

6专项已通过，含全32,285features／923nuclei全部计数与原column stats独立重放、原base-R名单／原label／profile顺序一致性、当前私有byte receipt、wrong layer／假配对／错误column／计数及取消／404／compressed与decoded checksum拒绝。最终压缩布局代码完整research actual exit0：1,338 tests／1,323 passed／15 conditional skips／0 failed／0 cancelled，build、strict typecheck、全项目lint及全部configured validators通过。第一次全入口因comparison region的tabIndex规则退出1，改成两个准确可操作scroll按钮后整入口通过；最终简明说明布局再跑完整入口通过，未隐藏旧失败log。原RDS源byte确定性重放exact equal；Node独立逐块重构全部923核的all-feature sums/detected totals并核对原base-R roster，0差额。

原生15项检查全部通过：默认关闭/Enter、Chat51/53 total267、Skor2 31/53 total62与原row32 count0、同核Pitx2 count2／all-feature23426／detected5442、无gene搜索不填0、空roster/page清除RNA selected nucleus却保留完整profile分母53、换Eya1卸载并以独立Chat34/35 total379重新打开、close卸载、损坏source块清除所有RNA counts/export、准确restore后Enter Retry，以及390px键盘横向表内滚动／所有visible新控件最小44px／页面无横向溢出。最终压缩说明布局重载后source profile／row32计数保持，desktop/mobile新截图与前态图分开。当前DOM两gene JSON加最终Pitx2 receipt与源chunk逐值重放；原spaced label也与canonical source一致。

损坏测试仅修改临时dist/client的Pitx2块一个字节，同41,923B；原workspace文件不改。vinext将小于64KiB的静态文件缓存在启动时内存中，初次warm请求仍为原hash，未计作拒绝；重启本轮自有127.0.0.1:3003服务后实际响应fault hash与篡改文件一致，页面拒绝，然后恢复准确bytes、再启动服务并Enter Retry成功。QA保留warm/fault响应headers/hash及文件前/损坏/恢复hash。

CSV Enter action已执行，5s内download event/文件落地未确认；实际Blob文件landing、native pending-request cancel、200%真实zoom与screen reader未由本轮验收。原Node明确覆盖pending cancellation。最终文档再生成manifest、production build、当前manifest与6专项/全部source rows validator另封存；不需要为最后的文档状态修改重复整入口。

## 改动范围及回滚

旧文件限定于 `app/CanoCholInNucleusRoster.tsx`、`tools/build_research_iteration_manifest_2_91.mjs`、主升级MD／Goal核验MD／当前2.91manifest；其中完整owned前态及八文件（含未改canonical queue/registry、未改Types入口）在QA `owned-before.zip`，每项前hash与1,266旧输入核验保留。新增RNA component/runtime/css/types、builder、validator/tests、新data document、127块、准确source download receipt和本时间轴。回滚只恢复实际更改旧文件、解除新feature引用并重新生成当前manifest；新来源与QA保留。原始科学数据、冻结2.34/2.90、原node_modules、无关dirty tree不改；无Git/push/publish。
