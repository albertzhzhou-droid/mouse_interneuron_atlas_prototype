# I30：BIL 准确运行的全部原始多边形核对

日期：2026-10-02。完整 Goal 保持 active；本轮减少 M2 的边界坐标证据缺口，不改写 M2／M4 或全部 F01–F20 的终态。

准确来源：BIL:ace-pie-cot／Run8_Slide2_Mus_M7_F7／DOI 10.35077/g.1196，沿用既有 analysis_uuid、roi_uuid、原始三份 Parquet 和 I21 cell_id、cell_summary、transform 范围。I04／I21 的输入与历史 audit 均保留，不重新下载或改写。启动前10个 owned 文件的 ZIP 与891个当前输入快照见 `qa/2026-10-02-implementation-30/`；回退仅限显式 owned／新文件清单。未提交、推送或发布。

新增原始读取：252,307,597 B 的 cells.zarr.zip 仅取 polygon_sets 两组的163条目、51,198,032 B精确HTTP206本地条目区间，硬上限52,000,000 B。先3316 B布局检查与后续完整范围保留独立receipt；没有完整ZIP、mask读取或整档案SHA。新328文件包括原始区间、选定条目与两份receipt，每项bytes／SHA留存；此前ZIP目录原bytes复用。首次受限网络DNS失败见本轮工具结果；原完整first-attempt日志未单独保留。获得所需公开读取权限后完成范围读取。

实际原始重放：所有163条目从原interval离线读取，ZIP CRC／局部header／选定blob均一致，Blosc原布局解码。来源根属性声明microns、polygon_set_names=[nucleus,cell]，原archive version6.2、XOA3.3.0.1；补充查阅[10x的polygon_sets格式说明](https://www.10xgenomics.com/support/software/xenium-onboard-analysis/2.0/analysis/outputs/xoa-output-zarr)，其版本描述与实际文件布局分别记录，未冒称留存该网页原HTML。

全部182,698 cell polygons／180,502 nucleus polygons的9,032,645 active vertex rows（cell4,564,211／nucleus4,468,434）在原float32值上X和Y各自exact equal，差额0。未使用float32强制舍入、容差、重排、近邻、拟合或补造transform。47,355 padded slots排除；全部polygon原首末顶点exact closed。Parquet自身无unit metadata的事实保留；原Zarr声明加准确全量坐标一致性支持这个run的boundary physical unit=µm。

父对象：逐个原polygon cell_index指向原cell_id，再将full-string ID在每个Parquet vertex row核对，差额0；每份boundary的label_id分别等于其polygon row+1。180,502共享数值labels跨cell/nucleus文件指向不同cell，不能用来跨文件join。核polygon180,502属于180,436个cells；全182,698个source nucleus_count与按parent聚合的核polygon数一致，包括2,262零核、58双核、4三核（62多核）。全182,698 cell segmentation methods逐准确parent一致：boundary3008、interior169374、5µm expansion10316。所有核polygon原method是DAPI，独立保留。

新audit依赖原328文件及121旧dependency（共449），JSON和Python独立replay工具不产生display derivative。应用只为准确run展示新boundary evidence；当前source JSON保留独立I04／I21／I25／I30范围，其他15run为sourcePolygonAudit=null，切换同时清旧export。历史I21的未读取polygon事实作为带日期checkpoint保留，当前新事实另列。

现存独立gate：cell-to-section／donor、outline-to-cell frame与方向、curated cell types，以及dataset CC-BY-4.0／site CC-BY-SA-4.0权利声明差异。二维简化polygon不是观察到的膜、3D细胞或分割mask；exact equality不建立section、interneuron、same-cell morphology或atlas registration。0 viewer geometry／0 interneuron label／0三维对象／0 REG；UPG244 partial、UPG255 planned，243项中的79 exact completed不增加。

最终代码原始／工程／原生验收通过：

- Python 全部363,200 polygons／9,032,645 active rows离线重放 `--check` exit0；449原文件bytes／SHA复核exit0。新增7项source-backed Node合同测试与历史source/schema/workflow合计27项通过。6项Python反例通过：真实原首cell subset一致、低于float32舍入差异仍拒绝、有效但错误parent／numeric label拒绝、未取得mask拒读、ZIP payload篡改触发CRC。
- 最终代码完整 `npm run test:research` 实际exit0：build／strict typecheck／full lint／全部validators，1,310 tests／1,295 passed／15 conditional skips／0 failed／0 cancelled，当前manifest1,228 inputs。第一完整入口只在新验证器未使用变量处lint失败；修正后重跑完整入口通过，原失败日志独立保留。第一source subset负例暴露样例单row边界和错误parent字典错误；已修正，最终6项通过，不覆盖或伪造原始源值。
- 当前生产页面准确Run8 boundary说明、全部15其他runs的旧export／schema／coordinate／polygon清零均实测；16份实际DOM JSON均与当前builder完整deep equality。准确run current date2026-10-02、I21历史audit仍2026-10-01；pilot始终false。当前JSON为228,504字符，浏览器读取接口单次200,000上限已由分段只读核对处理，原UI数据完整；未宣称自动Blob下载落盘。
- 390×844px真实页面clientWidth／scrollWidth均390；Enter展开两层summary、focus可见、主要导出按钮44px。Xenium组件自身0 canvas，其他来源reference canvases独立；viewport已reset。200%真实缩放、screen reader及全路线性能预算不在本轮证据内。
- 398固定科学inputs、2.34／2.90冻结manifest、原891inputs中显式owned之外882项均无差异；原File Provider依赖不替换，完整检查使用原lock临时依赖。QA日志、原生图片、source JSON和有限rollback均位于 `qa/2026-10-02-implementation-30/`。

当前代码增量完成；最终文档同步后的manifest／registry／构建／native闭环另记。完整科学 Goal 继续active，不将工程验收、边界单位或source审计算作M2／M4终态。


末次原生重载发现来源select可在client交互接管前改变原生选项、而下方证据仍是初始run的时序问题。已接client-ready门控：初始服务器HTML实际source select／export均disabled，并有Loading source controls状态；React完成交互接管后才启用。实际重新载入直接选择Run8后所选值与rendered source key一致，controls启用、0 source canvas／0 alerts；改后16份实际DOM JSON与全部15其他run清除再次通过。含此修正的最终完整research实际exit0：1,310 tests／1,295 passed／15 conditional skips／0 failed／0 cancelled，build／strict／full lint／全部validators通过。此前代码pass与readiness前文档构建记录独立保留；最新code log是QA目录full-research-validation-291.log。不能由本问题修正推断全App载入／辅助技术或F19终态完成。
