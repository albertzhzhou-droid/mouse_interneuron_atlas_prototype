# I04：BIL原始几何表的有界schema／ID核验

日期：2026-09-30。父迭代仍为冻结2.90；当前工作树2.91.0-research.1。用户全部MD Goal保持active。本增量继承并保留原dirty修改及I01–I03；不把source schema成功、无核/多核解析或工程通过计作M2/M4完成。

## 已实施

1. 比较16运行的原始Parquet列表，固定最小的 `BIL:ace-pie-cot` 三份原始表，37,282,469 B。独立首次下载receipt、exact路径/大小/hash、原始Parquetmagic、分析及ROI身份固定。没有全量影像、转录本、public geometry或远程发布。
2. 重放182,698cell行、4,564,211cell vertices、4,468,434nucleus vertices。完整字符串cell_id关联无孤立/重复；2,262无核、62多核按来源原样保留。180,502共享数字label ID跨文件全指不同cell，明确拒绝该join。
3. 三种逐cell方法与run metrics一致。10,316行原值明确5.0µm核扩张，仅该run/该方法行范围解除distance缺失，不覆盖原metadata-only快照。
4. source-audits的准确run核验详情、四source例行/LOC/NaN与共享身份层级、当前selected-run导出及切换不残留；独立source byte validator与fail-closed负例。全pipeline不输出display polygon。

完整来源/分母/许可/坐标余差见[BIL三表审查](BIL_XENIUM_GEOMETRY_SCHEMA_AUDIT_2026-09-30.md)。section/cell coordinate frame、donor/tissue crosswalk、curated cell label及政策差异仍阻断；0viewer geometry、0interneuron/REG/same-cell内构。

## 当前验证

- source专属9项＋历史metadata5项：14/14通过；strict typecheck及专项lint通过。
- 全三表离线 `--check` 重放退出0；派生JSON逐字节一致，source/domain validator匹配3原表＋5依赖及冻结目录列表。pyarrow的sandbox CPU cache查询提示没有阻断读取；没有把该提示记为schema失败。
- 完整 `npm run test:research` 退出0：**1,113 tests／1,098 passed／15 conditional skips／0 failed**，正式build、strict typecheck、lint及全部research validators通过。日志：[完整回归](qa/2026-09-30-implementation-04/full-research-validation-291.log)；[全Parquet重放](qa/2026-09-30-implementation-04/full-parquet-replay.log)。当前2.91 manifest保留530项输入字节receipt，父2.90原hash未改。
- 正式3003页面实际选择Run8/Slide2，核对来源ROI/analysis、全部分母、5.0µm原字符串、row0的NaN及row20的2核；共享identity给准确cell与未知section/specimen。Run8→Run1后current table/row DOM数量均0，Run1→Run8后例行重置row0，旧row20不残留。
- 390px下document宽390，audit宽328/scroll326、source field table宽302/scroll302、hierarchy宽302/scroll300。Enter展开/收起以及原生dropdown Down/Return由row0切row1均实际确认。已检查[正常宽度截图](qa/2026-09-30-implementation-04/bil-schema-production.png)、[390px截图](qa/2026-09-30-implementation-04/bil-schema-narrow.png)、[准确身份截图](qa/2026-09-30-implementation-04/bil-cell-identity-narrow.png)，无本增量水平溢出。随后恢复正常viewport。
- 仅重启本task正式preview，实际node36754监听 `127.0.0.1:3003`；原3000/3001进程保留。导出数据契约在专项测试核验，浏览器Blob落盘继续未验证，不将点击宣称文件下载成功。当前浏览器保存日志混有旧3001错误，不把它们当成本轮3003失败或宣称全历史日志已清空。

## 回滚和余差

新增rawcandidate目录、独立derived JSON、acquisition/audit脚本、shared adapter/types、UI子组件、validator/tests和两份文档。现有BIL metadata explorer/CSS仅添加当前schema详情及导出，2.91当前manifest family和implementation validator增加本增量；canonical queue记录partial实际范围。撤回仅这些新增路径及本轮有限hunks；不reset整库、不改写旧metadata快照或父manifest。

规范source31／recordset41／exact roster13／source-object set4／source profiles387／243任务／79精确completed保持原单位；新三表inspection没有加入source-object准入数。剩余M2/M4与legacy共享scope、view receipt、性能/可访问性继续保留，完整Goal不缩小。
