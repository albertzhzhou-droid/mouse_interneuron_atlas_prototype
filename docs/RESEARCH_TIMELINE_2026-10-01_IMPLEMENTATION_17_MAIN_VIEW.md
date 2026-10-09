# I17：179 条主场景实际视图恢复

2026-10-01，America/Toronto。同一 dirty 工作树、2.91.0-research.1，未提交或发布。实现范围是179准确NMO focus的主场景actual camera、requested/effective layers、slice、MICrONS clipping、source placement与同源fresh replay；主场景原无branch inspector，保存available false，不声明node/dim恢复或全部legacy view/export已完成。

新增独立main_scene_morphology_view_receipt 0.1与23个指定renderer/build pins；179形态仍使用I14 private producer，142 census／7 supplementary8.6.124／30 Todd8.6.126保持各自frame与membership。9个辅助输入由actual bytes/hash私有producer读取，JSON深冻结、binary只给副本；只有实际构建geometry与当前proof可供capture。恢复新建renderer，辅助来源缺失则撤当前geometry/proof/receipt；重建时撤以前renderer的MICrONS constructed状态，不能用旧verified标记代替新mesh。wrong source/build在fresh前拒绝，当前正确scene保留；fresh失败后同源retry可重新核验，不回退cached geometry。

相机FOV35、orbit4–100、near0.05/far250及pixel ratio上限1.75取实际主场景。浏览器读回alpha true／antialias true，创建请求alpha false／antialias true，两组分别记录。源标二维仍在共享camera中观察，原source coordinates／diameter不变，不借用individual plane-lock或推断厚度。0 inferred missing coordinates／0 NMO同细胞内部几何／0 cross-source joins／0 REG。MICrONS自身cell→nucleus关系仍单独保留。45718移除父、子各偏移一次的子层重复偏移；原crosswalk、native JSON、SWC、DAT不改，仍仅同记录display screen。

浏览器检查发现toolbar、lane及当前fidelity badge曾以requested mode代替实际状态；现由当前private geometry proof、实际mode／visibility驱动。核验失败不保留DER显示徽标或active morphology route。Todd toolbar使用核验context中的8.6.126。JSON／CSV保留requested mode，实际mode／authority由verified runtime决定，失败为null／NONE。实际viewport PNG加入可读iTXt source receipt（或明确unavailable）；9项CPU专项验证CRC与encoded pixel chunks未改，未观察in-app Blob实际落盘，不能以点击宣称native PNG文件解码验收。legacy fallback PNG与全局state import仍未完成实际view统一。

当前代码的正式浏览验收覆盖108974半径表面及SWC、真实Arrow操作后旧capture失效、跨Home／Cell Detail恢复、MICrONS7输入的实际裁切和隐藏核／隐藏完整包重核验、45718同记录DAT9输入、194469二维跨390px／Enter、242822无直径、322379独立Todd8.6.126及wrong source／build拒绝。各成功恢复camera差0；Arrow操作位置最大差0.8366951303775183仅证明操作发生，单位是viewer。缺失生成dist副本导致实际ENOENT／Failed to fetch（未观察HTTP404），失败时0 current proof／0 view receipt／0旧OBS+DER lane，capture禁用、active badge为NO VERIFIED MORPHOLOGY RENDERED；源文件副本恢复后同源重试成功、完整7辅助输入重新核验，camera差0。原public源文件未移动或修改。不是179份native WebGL验收；主场景仍没有node/dim inspector。

10项source-backed CPU专项通过，含全部179准确源文件、9辅助输入、clone／损坏／截断／取消、camera／renderer／frame／world placement／bounds／layer／clipping负例、2D／No Diameter门槛、同记录DAT及PNG iTXt。新增专项、Research visual target及MICrONS集成检查共35项通过。

本轮工程检查分段通过：原完整 `npm run test:research` 的 build／strict typecheck／全项目 lint／全部数据与历史 snapshot validators 通过，测试阶段因两处旧源码断言退出1（1,216 tests／1,199 passed／2 failed／15 conditional skips）。两处断言分别仍要求旧 MICrONS 错误文字和画布内 sha256Hex；现改为检查私有 actual-byte producer／private proof 接线，未删除损坏、身份或组件边界检查。随后完整 current-tests 入口重跑262文件退出0（1,216 tests／1,201 passed／15 conditional skips／0 failed）；更新的集成测试另经 scoped lint退出0。不是宣称原完整 npm 命令退出0。最终文档／manifest同步核验及正式重建结果另记于QA summary，不混入上述完整测试计数；本轮未改应用代码以迎合断言。

早期完整入口四次因后续实际修正主动停止，一次因context optional boolean类型检查失败；原完整入口最终另因两处旧静态断言退出1。各日志保留对应范围，不能算通过。当前代码native文件均与23个指定build inputs逐项byte/SHA对账；[QA目录](qa/2026-10-01-implementation-17/)保存凭据、图像、原始日志、source preservation与verification summary。

388项I17前固定data/public scientific inputs byte/SHA 0变化；task registry prose独立排除。2.34／2.90 frozen manifest当前bytes再次与已记录冻结checksum对账，均不变。生成missing源副本已原byte/hash恢复。有限回滚保存在[rollback-before.zip](qa/2026-10-01-implementation-17/rollback-before.zip)与[rollback-scope.json](qa/2026-10-01-implementation-17/rollback-scope.json)，包含14份owned before inputs；只涉及本轮归属文件，保留其他dirty工作。UPG-091仍in progress，243任务79精确completed，M2／M4和完整Goal active。


最终跨页面补查发现并修正：verifiedAt、verificationSequence、mainSceneVerificationSequence及requestCacheMode是核验事件，稳定源字段仍逐项比较，事件字段仍须合法。fresh applied proof必须no-store，相对当前producer的sequence推进由renderer核对；过去页面的sequence不作阈值。真实default/no-store producer新增专项和负例通过。修正前同页验收／分段检查保持历史范围，native文件迁入before-cross-page-fix，不与当前build混用。

最终修正代码的完整 `npm run test:research` 退出0：1,217 tests／1,202 passed／15 conditional skips／0 failed；build、strict typecheck、全项目lint、全部数据及历史snapshot validators均通过。10新增source-backed CPU专项及两套旧集成检查共35项通过。正式current-code跨页面default→no-store和no-store→新页面default上下文恢复均成功，actual fresh结果为no-store，verifiedAt更新，camera差0；3D radius/SWC、MICrONS裁切／隐藏核与隐藏bundle、45718 DAT、二维390px／Enter、No Diameter、Todd8.6.126、wrong source/build保留正确scene及missing生成副本清proof／receipt／DER徽标和同源retry均再通过。 原完整入口的旧断言失败与此前分段通过仅是历史记录；本轮最终完整入口已实际退出0。最后文档同步只修改本轮叙述／registry prose及current manifest，最终正式重建、manifest/queue核验、source-preservation和23个指定build inputs对账另记QA summary。全部Goal保持active。
