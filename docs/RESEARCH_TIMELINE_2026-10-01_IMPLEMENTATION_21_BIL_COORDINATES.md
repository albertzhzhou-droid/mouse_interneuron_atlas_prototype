# I21：准确 BIL 运行的原始坐标证据

日期：2026-10-01。上一Goal turn为progress：I20应用导出、完整检查、文档和最终native闭环完成。当前完整Goal继续active；本轮直接推进M1a/M2的准确源坐标依赖，不将原始坐标核验称为切片pilot完成。

范围：BIL:ace-pie-cot／Run8_Slide2_Mus_M7_F7，沿用准确analysis/ROI。启动前10个owned inputs原副本、bytes/hash及有限rollback见qa/2026-10-01-implementation-21；398固定科学输入保持独立原快照。未提交、推送、发布或下载完整数据集。

新的原始输入：run/analysis/aux目录、同一dataset API与网页、官方distribution policy，1,902,434B analysis.zarr.zip、两个FOV位置JSON。原cells.zarr.zip为252,307,597B，HTTP206只取得目录／属性／完整cell_id和cell_summary数组及homogeneous_transform条目；坐标读取范围总字节5,271,362，先独立metadata读取495,859B也保留，未取得mask或polygon arrays。所有每段范围保留原bytes/hash，selected ZIP entries从原range离线重放及CRC检查；没有整档案SHA。首次受限网络未解析域名的记录保留；坐标读取首次终态为socket timeout，确认终止后复用准确已有range、继续缺失输入。不是重启仍活着的进程。

原始坐标新证据：cells.zarr.zip::.zattrs#/spatial_units明确“microns”，archive entry version6.2、同run XOA3.3.0.1，182,698准确cell IDs全部与既有cells.parquet关联，无重复或两边missing。按准确ID独立对齐X/Y centroid、cell_area、nucleus_area和nucleus_count五列；每列182,698行exact equal，差额0，未选择或放宽容差；nucleus_area的2,262 source NaN保持不变。该证据支持这个准确run的细胞质心µm，不将Parquet自身无unit metadata的事实改写，也不称全部boundary coordinates与Zarr polygon arrays已比对。

homogeneous_transform原float32矩阵X/Y scale4.7058820724487305，run pixel_size0.2125，stored scale与其倒数差-2.804924461585756e-7；原精度保留，未人为改到双精度理想值。这个source physical-to-stitched-image关系不是outline/section/atlas transform，不建立解剖方向。609 morphology FOV和609 overview FOV保持视野单位，不成为sections。analysis ZIP十组automated clustering分别31和K2–10 groups；各自182,490 assigned／208 unassigned。原Cluster字符串与source indices保留，不改称curated cell types或interneurons。

数据集API和准确dataset网页均CC-BY-4.0，官方distribution policy仍CC-BY-SA-4.0，两种声明准确各自保留。source-supported section/cell和donor crosswalk、curated type及policy difference继续为四个独立gate。来源数据页原scope不被改写：现有BIL源表widget新增当前run原始坐标证据；换到其他run不会残留当前坐标audit。selected-run JSON保留旧metadata snapshot、I04三表audit及独立I21 coordinate audit，其他run该增量为null；不增加geometry authority。

已完成来源与工程验收：原range/ZIP/所有182,698行离线重放、119源文件bytes/hash、相关旧source/schema回归和负例、严格类型/full lint/完整research、生产selected-run切换和390px/键盘/当前JSON scope。原始mask、polygon、单section或interneuron geometry、atlas REG、same-cell morphology与M4均0。完整F01–F20及243任务范围不缩减，UPG244维持partial、UPG255维持planned，完整Goal未完成。


当前代码完整 research 入口确认终态 exit0（session72363，日志 full-research-validation-291.log）：1,250 tests／1,235 pass／15 conditional skips／0 fail／0 cancel，build／strict typecheck／full lint 与所有 validators 通过。相关20项终态0；原119依赖文件bytes/SHA检查0；所有182,698源行五列独立离线重放0。当前manifest806 inputs。生产3003仅127.0.0.1：准确run坐标disclosure、other-run清除、Enter返回已核验run、四份原始source rows及390×844/Enter/no overflow实际通过；native截图及DOM记录保留。本轮selected-run JSON验证为真实代码合同检查，未观察自动Blob落盘。最终文档同步／registry与manifest再生／最终构建／当前native闭环在同QA目录另记，不以先前完整日志覆盖其后修改。
