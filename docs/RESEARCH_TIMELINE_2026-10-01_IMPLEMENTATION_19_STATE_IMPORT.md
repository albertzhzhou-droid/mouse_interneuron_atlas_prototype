# I19：全局状态导入恢复准确主视图

日期：2026-10-01（America/Toronto）。完整目标继续 active；I18 为已验证的上一增量。

当前实现待验证：全局 Import state 对实际主视图凭据先校验当前 build、准确 source、私有 geometry 和 persistent state 一致性，再应用状态并等待当前 renderer；同源 fresh no-store 重建后，回验 actual camera／layers／clip／bounds／node／dim，才显示恢复成功。重复导入、换源及晚到请求取消；旧文件没有 actual-view 凭据时明确只恢复 settings。

沿用 schema0.2，28 个指定 renderer build inputs新增导入协调核心。179准确观察仍为142 census＋7 supplement8.6.124＋30 Todd8.6.126，0 REG／0跨源joins，无新增科学数据。10个已有文件启动前原副本及hash、4个新文件范围记录于 qa/2026-10-01-implementation-19/scope.json 和有限rollback。I18历史native凭据不改写，旧build应被拒绝。

专项、strict／lint、正式页面文件选择、完整research入口及最终清单／构建验收尚未完成，不将代码写入视为完成。


阶段结果：46相关专项退出0（12新增import测试，覆盖三roster代表来源、old build/schema、state矛盾、虚构node、missing/truncated/altered/abort、exact-ready/exactly-once、fresh applied／no-op、superseding／late result及失败retry）；strict、针对性lint和首次生产build退出0。首次专项因清单仅生成未写入缺少新build input，随后写入正确清单；React memo检查已按真实状态依赖修正，原失败日志保留。

正式actual DOM view用于本地构造合法state fixture；不是观察到Export JSON落盘。实际file chooser从194469恢复108974 radius节点62/dim及focus camera成功；no-store、camera差0、28build inputs。Export JSON有notice，download等待10000ms未返回文件。下一次file chooser超时并重置浏览器运行句柄；随后用户中断。续轮确认预览session handle缺失、3003无监听且原IAB tab缺失，不把观察超时自行认定程序完成。剩余native异常／其他来源与完整research终态须重新验收。

完整入口在build/strict通过并进入lint后主动中断exit130：复核发现旧取消/失败提示的microtask仍可能晚到覆盖已完成的新导入。新增持久latest-generation gate，取消及完成后仍保留最新serial，queued notice先核准确ticket；原日志单独保留，不计作完整通过。新13专项及完整入口须重新验证。

第一次当前代码完整入口终态exit1：1234 tests／1217 passed／15 conditional skips／2 failed；build／strict／全项目lint及validators已通过。两个旧静态handler extractor仍要求空依赖数组，新增显式setNotice使它们提取为空。现改为准确要求[setNotice]，原搜索、清旧几何及禁止跨源身份的断言均保留。两文件编辑前原bytes/hash有额外有限rollback；当前manifest纳入它们为682 inputs。后续专项及完整复验未完成前不计作通过。


当前代码native文件选择已验证：108974 radius节点62/dim/focus camera从194469恢复；二维194469节点24在390px/Enter恢复，无横向溢出；No Diameter242822节点24/dim恢复且原半径许可false、UI不提供placeholder；Todd322385独立8.6.126／todd_supplementary／实际source diameter true，observed SWC节点24/dim恢复，不能把它称作No Diameter。MICrONS隐藏NMO节点62与nucleus、cell-shell Z80240nm裁切、7辅助文件恢复；45718 DAT同记录overlay与9辅助文件及节点24/dim恢复。各实际结果no-store，相机最大差0，build28 inputs均待最终字节汇总对账。

wrong build／不存在节点／state focus矛盾均在应用persistent state前拒绝，原108974 node62保留；真实修正前actual DOM view也因旧build被拒绝。缺失试验只移走dist生成108974 JSON（184927B／SHAe3c932a063b379c3e0606d0420ade0830210e7bb9c54e7b20830442e8334a25a），原public/data未动；实测Failed to fetch，形态／inspection／receipt／DER显示撤下，生成副本已原byte/hash还原，fresh retry恢复node62/dim，相机差0。legacy无actual receipt及typed unavailable文件均准确提示settings-only／没有camera-node重放；hidden observedForm设置保留。实际导入期间手动换源取消，194469保留；连续108974→322385文件选择最后恢复322385，CPU另有可控晚到和最新generation负例。不将连续native两次选择当作固定延迟race注入。

当前相关专项47/47，加两套static regression共54/54退出0。当前完整research复验尚待终态；不将首次exit1或旧native代替当前终态。

最终当前代码完整research入口exit0：1234 tests／1219 passed／15 conditional skips／0 failed／0 cancelled，build／strict／全项目lint和全部validators通过；682 current input receipts。相关专项47/47，含旧回归54/54。14 actual UI source-view docs均准确匹配28指定renderer inputs，0 mismatch；使用生产main-record规范映射（named route优先、generic census仅明确10 geometry fields）及private原public geometry逐一重放文档，六组applied回验和camera差0，辅助核验sequence均推进。首次QA helper错误使用较宽的census geometry source字段副本，造成与实际app的精确10-field geometry不一致；按app规范修正QA helper后通过，不改app、receipt或科学输入。

398固定科学输入与冻结2.34／2.90 byte/hash无变更。最终文档／registry／manifest同步与重建后新的实际导入、截图、fixed inputs复核及build receipts结果以QA summary为准。无commit/push/publication；完整Goal仍active。legacy fallback PNG、export round-trip字段对actual mainSceneView的范围说明、其他viewers及科学M2/M4差额继续。
