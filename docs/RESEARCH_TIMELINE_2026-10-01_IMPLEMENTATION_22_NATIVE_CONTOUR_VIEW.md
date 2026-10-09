# I22：原生胞体轮廓的实际来源视图恢复

日期：2026-10-01（America/Toronto）。本增量已在下述范围内验收；完整用户 Goal 继续 active。沿用当前七个准确记录、72 source loops／5,149 source vertices 和唯一 NMO50394 的独立 DER open shell，不增加源几何、膜、体积、内部对象、SWC 联展、same-cell join 或 REG。

实际读取几何 JSON 的 bytes／SHA-256／语义校验后才发出私有不可变 proof；复制、损坏、截断、取消、跨记录载荷及旧 OBS 对应新 DER 的证明均拒绝。原始 DAT 和 API bytes 仍 declared-only；physical specimen／section／cell unknown。基础五记录和增量两记录的定位分别为 catalog0.3 records 和 catalog0.4 addedRecords。source radius、raw flags、重复 z、源顺序和拓扑异常保持原样。

保存／恢复包含实际 camera／viewport／source bounds／display transform／requested-effective layers／selected trace／isolation／独立 DER 和 19 个指定 build inputs。先核当前准确来源和代码，再 no-store 重读并回验实际 renderer 应用结果。加载取消、晚到结果、DER 失败不重复请求、WebGL 不可用结束恢复均已处理；失败清 scene／proof／capture／export。指纹缺项时模块仍能加载，保存／恢复拒绝发出不完整回执。

真实浏览器发现重复 label ID、390px 面板被父级隐式网格撑到 487px／画布457px，以及暗底标签低对比度。useId 与有界网格修复后，最终390px／DPR1 的 panel336px／canvas306px 位于容器内，标签清晰；失败截图保留为 native-narrow-current.png，最终图为 native-current-final-narrow.png。实际拖拽使旧 capture／export 失效；运动尚未稳定时的一次捕获也自动失效，稳定后重新捕获通过。自动下载文件落盘未核验，actual UI receipt 来自页面 readonly JSON。

最终七来源有16份当前 actual DOM view receipts，19 指定文件指纹0差异；七组 no-store fresh 恢复的 camera position／target／quaternion／up 差额0，inspection与实际图层一致。50394桌面拖拽视图在390px／Enter恢复，14源轮廓＋独立DER分别重新核验；45718准确旧轮廓8保留独立secondary组并隔离恢复，两个增量记录保持重复z和准确source trace ID。45674／50408隐藏后恢复、50424准确截面恢复通过。50424两处相邻转换held、50408两处自交和一条零长度边保持可见，两者0shells。真实旧build和错误source在fresh前拒绝，正确scene保留。详见[native当前对账](qa/2026-10-01-implementation-22/native-current-reconciliation.json)。

最终missing测试仅移走临时验证目录的public和dist/client两份准确几何副本。服务器实际ENOENT，浏览器Failed to fetch后canvas／DER／readonly receipt为0、capture／export禁用；两份文件的123,254B／SHA准确还原后，Recheck和再次capture取得OBS＋DER no-store新证明。第一次早期source-only移动仍由dist提供有效内容，不是失败验收；缓存HEAD也不能证明实际GET字节可读。原始工作区几何、DAT和API没有移动或改写。当前还原证明见[native-current-missing-file-restore.json](qa/2026-10-01-implementation-22/native-current-missing-file-restore.json)。

原node_modules约9,317个File Provider dataless占位导致旧CLI读取失败。静默typecheck退出0、必失败负控退出0及未更新产物的build退出0均明确撤回。独立/private/tmp验证目录使用原package-lock安装467个锁定依赖，当前819权威输入及全部app/scripts/tests/schemas/data/public实际读取后复制；两个兄弟证据文件也逐bytes／SHA重放。正常配置负控实际报TS2322并退出2，随后正常strict检查通过。实际源码lint发现的四个unused变量已在原位修复，没有关闭规则。宽泛复制尝试因1,251次不完整读取而被实际缺项复制替代，未把它称为完整快照。

最终代码完整npm research入口退出0：**1,255 tests／1,240 passed／15 conditional skips／0 failed／0 cancelled**，真实build、strict typecheck、全项目lint及全部validators通过。首次临时完整入口缺少两份兄弟证据文件退出1，准确补齐后通过；父级网格版与最后颜色版各自完整终态日志独立保留。16实际字节专项通过。当前临时构建／浏览器预览范围明确，原依赖未覆盖或重装；不能把原目录未运行成功的CLI说成已修复。最后文档／队列／登记／清单同步和最终重建另见[verification-summary.json](qa/2026-10-01-implementation-22/verification-summary.json)。

398固定科学输入逐bytes／SHA不变，冻结2.34／2.90清单不改写；11项rollback ZIP bytes／SHA无误。UPG091继续in progress、79/243精确completed不变。其余viewer/export、F01–F20和M2／M4真实同细胞源链仍待满足，完整Goal未完成。[完整Goal核验](GOAL_REQUIREMENT_AUDIT_2026-09-30.md)。
