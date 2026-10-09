# I03：内部对象必需来源契约

日期：2026-09-30。完整Goal保持active；继续当前未打包2.91，不新增科学source、几何或注册。I02独立验收1,095/1,080/15/0保留原文，不当作本轮通过证据。

## 已实施

`same-cell-internal-source-contract`要求13组字段／QC：DOI、准确仓库object URI、稳定specimen、稳定cell及component kind／parent、geometry ID/version/release、volume imaging modality、物理voxel scales、非退化source bbox、精确frame/unit/axes/direction/origin、exact-file rights、当前geometry＋raw/segmentation bytes/hashes、独立exact same-specimen/same-cell proof、original-volume/segmentation QC。所有源ID与source/release/namespace层级保持字符串，未知／ambiguous字段不补值。二维outline/detection不获得深度。

proof必须等于独立source adapter的唯一verified entry，并绑定target key、component key、完整candidate contract及target hierarchy/frame；修改任何来源字段、version、rights、ID或origin使旧proof失效。全部实际receipt必须在当前loader集合中精确唯一匹配；声明checksum、重复文件或UI填写的QC flags不能替代这两个独立集合。gate评估本身始终新准入0objects、0REG、0cross-source identity；eligible只是供独立renderer后续验证的source-local条件。

已接selected-record `exact-record-detail-coverage`四类内部slot及其index summary，移除旧positive object count＋某hash足以显示OBS的捷径。现须通过mandatory gate、正确structure kind与该对象自己的geometry hash；一个nucleus不能被重复计作organelle。source-reported annotation、source-reported absence、not measured、rights-held和unknown继续独立保留。Internal Structure详情内可展开必需字段与准确缺失原因；独立MICrONS/BANC/PALM等参考不被附到目标cell。

## 验证与仍未完成的范围

9个新增tests与8个原有coverage tests共17/17通过。覆盖完整synthetic source/loader/QC positive、缺失独立证明／实际字节、receipt篡改与重复、version/rights/target修改、2D和未校准depth、退化bbox、原始切面QC缺失、population冒充cell、未知parent、旧count/hash shortcut、错误slot及自身hash不匹配。全部641实际Explorer records仍eligible=false；synthetic positive不进入真实source registry。

最终完整research入口退出0：1,104 tests／1,089 passed／15 conditional skips／0 failed，production build、strict typecheck、lint及全部入口validator通过；当前516个authoritative input receipts，文档冻结后再次核验。原文保存在[完整复验日志](qa/2026-09-30-implementation-03/full-research-validation-291.log)。

生产页面Cano精确profile→Structure路径实际展开13组检查，保持0admitted internal objects／0fallback primitives；键盘Enter可展开，390px文档宽390、panel310／scrollWidth308，截图实际显示source-only frame、无同细胞关联及Unavailable源契约。仅验证该页面路径，未声称全App或辅助技术完成。截图：[正常生产上下文](qa/2026-09-30-implementation-03/required-source-contract-production.png)、[390px实际检查](qa/2026-09-30-implementation-03/required-source-contract-narrow.png)。预览启动参数原先误用`--host`，框架实际只支持`--hostname`；已修正为127.0.0.1并通过实际监听检查，原用户3000／3001服务保留。

UPG118保持partial：真实exact target source尚无完整链，所有source-adapter／loader producer路线的最终整合未完成。鼠脊髓真实同细胞内构M4仍未满足，M2亦独立未满足；不是生物学不存在的结论。

回滚范围仅本轮新helper/declaration/CSS/tests、coverage新增gate及计数hunks、InternalStructure panel新增可展开检查和本轮queue/docs/manifest对应hunks。不得整体撤回此前dirty文件或I01/I02。既有2.90及更早sealed manifests不修改；当前2.91 authoritative inputs按本轮文件实际字节更新。
