# I35：完整源记录的 32 通道与全部原始时间

2026-10-02（America/Toronto），`2.91.0-research.1` 原位增量，推进 F10／F13／F16／F18 与 UPG-154。目标仍为全部 MD 要求，M2/M4 不由电生理记录替代。本轮完整工程与原生浏览范围已验收，未验证的下载落盘、200%缩放及screen reader保持独立未完成。

## 准确新输入

补齐一个已经固定的公开 SpinalCordNET NWB：DANDI `001469/0.250611.1844`，asset `0e0ca61c-4206-46ad-8c78-0ce7b1252b33`。完整 355,191,072 B 与已公布 SHA256 `b7e323f222791499af6d13ad8fa7d5ea9850fcf59e0de0dfa84c598a4a1be0ae` exact equal。复用 I09 的全部 15 段／3,918,112 B，只取得其余 351,272,960 B。每段 HTTP206／Content-Range／ETag／SHA、连续不重叠的 coverage、完整 file hash 均保留在 source-download receipt。原始 NWB 在 public 外只留一份；没有获取 61-file／148.8 GB 全资料库，没有改写旧 I09 的范围合同。

读取完整原 `ElectricalSeries/data`：5,543,424 个 time rows × 32 个源电极通道，int16，源 chunk 43,308×1、无 compression。真实 data region→electrode table→group references、subject／series／table／group object IDs 与旧范围逐项一致；native session_id 仍缺失。全部原结构只有 ElectricalSeries data/electrodes/starting_time，analysis/processing 空，没有另一个 channel conversion 或 isolated-unit table。source volts／conversion=1／offset=0／resolution=-1 与坐标未知单位保持，不解释为经独立核验的物理电压。

完整 177,389,568 个采样值、184.7808 s 无损保留；最后采样时间 184.78076666666666 s。旧 channel0 30,000 samples 与旧全部32通道的首3,000 samples逐值一致。608个 little-endian int16 gzip块按10s/通道划分，末块143,424 samples；160,220,016 B compressed，单块最大306,357 B。源array按native time×channel C-order的byte SHA256为 `493853ea12ef93f5952a30528fe0433faf1a09b5d1333c2e0c4fc2bfb143ddd4`；全部32通道的原计数／min／max／sum／zero及有序bytes分别保留。并非新32细胞，也未添加分型、形态、突触、atlas或same-cell关系。

## 实际应用改动

原电生理来源展开入口默认接完整记录浏览：32源通道、任一0.1s时间窗、准确采样cursor、自动对称幅值显示、原值表、JSON/CSV与精确跨block恢复。最后窗口只有2,424 samples，不能补零到3,000。同一10s源块内使用当前私有已核验bytes，跨block／channel请求新no-store块，compressed/decoded两hash及byte数均核验。旧首秒参考浏览和其原receipt保留为单独按需展开。

显示全部当前window采样，不过滤、降采样、平滑、spike sorting或单位换算。JSON保留实际plot scale、完整源核验的build范围和当前浏览器derivative范围；import预检本身不产生sample authority，只有正确新源bytes与全部原sample／cursor／time吻合才能恢复。原legacy静态namespace及unknown parent保持，不引入生物学细胞身份。

## 实际验证

7专项 actual exit0，含全部608块独立解压及重构完整177,389,568采样矩阵、全部32通道统计、旧预览一致、最后partial window不补零、unknown channel/time拒绝、private owner／克隆拒绝、原scope／calibration篡改、HTTP／损坏／取消、JSON全部原采样恢复与2,424-row CSV。独立Node source-array SHA与Python从完整NWB读取的SHA一致。完整原NWB deterministic derivative replay actual exit0。完整research入口 actual exit0：1,345 tests／1,330 passed／15 conditional skips／0 failed／0 cancelled；真实production build／strict typecheck／full lint及全部配置validators通过。当前authoritative输入2,022。

首次full入口使用临时依赖服务提供的Node24.19.0，旧Research Explorer gzip压缩重建一致性失败；原raw／gzip／receipt全部byte/SHA未变。同一输入在原Node26.0.0（zlib1.2.12）通过，Node24采用不同zlib版本；没有重写旧gzip或降低校验。该环境差异的旧失败日志与两个runtime逐项结果保留。

Actual native浏览核验32原通道选择、channel0首窗、channel7在70.3s中段、channel31末窗2,424实际samples／最后sample5543423、跨channel/block精确restore、篡改import清旧波形/export、准确keyboard Retry、Next清旧下载链接、invalid184.8s拒绝、close卸载/reopen和最终build reload、旧dandiTraceStart=27000按需参考。对三个actual DOM JSON逐值读取原NWB，8,424 samples、全部native time／cursor／plot autoscale／source context／当前block receipt均0差异。原I09参考文案明确其历史有界获取范围，避免与当前完整NWB proof混淆。

仅本轮临时served block做同长度checksum破坏，实际HTTP响应hash已对账；原workspace从未变。失败清除current sample、plot、JSON/CSV与download link；精确恢复temporary bytes、actual响应hash及Enter Retry后重新verified。390px页面宽度390，无横向overflow，新主交互均≥44px。桌面与末窗移动截图已保存；JSON/CSV准备与明确Blob链接已操作，downloadMedia 10s没有确认浏览器落盘，不计自动下载完成。Native pending-cancel、真实200%zoom及screen reader仍不在本轮通过范围。最终文档与参考文案同步后的build、manifest、registry及专项检查另存QA。

## 改动与回滚

旧Dandi主组件与共用CSS、manifest builder、主规划／Goal核验及规范UPG154行/registry仅在相应范围修改，`.gitignore`加准确source目录原始NWB与partial排除。11候选旧文件preimages在 `docs/qa/2026-10-02-implementation-35/owned-before.zip`；1,403原authoritative inputs已逐byte/hash核对后才开工。新增完整recording builder/acquirer、JS/types/component、validator/test、source receipt、独立document与608 lossless块。本轮只恢复准确old preimage、解除新增入口并再生manifest，保留源与QA；冻结2.34/2.90、旧数据/名单/形态与未知dirty工作不变。无Git/push/发布/第三方联系。

完整目标仍active，243规范任务的精确completed79不因本轮功能或全量采样count增加。电压标定、未取得的其他记录、exact physiological cell映射及M2/M4科学源链继续保持未完成。
